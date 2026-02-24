package arp

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/oklog/ulid/v2"
	"go.uber.org/zap"

	"backend/internal/connection"
	"backend/internal/events"
	"backend/internal/router"
)

// =============================================================================
// ARP Scanner Service
// =============================================================================
// Performs device discovery using ARP ping sweep with real-time progress
// streaming via EventBus. Implements rate limiting and session management.

const (
	// DefaultRateLimitPeriod is the minimum time between scans per router
	DefaultRateLimitPeriod = 1 * time.Minute

	// DefaultWorkerCount is the number of concurrent ping workers
	DefaultWorkerCount = 20

	// DefaultPingTimeout is the timeout for a single ping
	DefaultPingTimeout = 500 * time.Millisecond

	// DefaultProgressInterval is how often to publish progress events
	DefaultProgressInterval = 5 * time.Second
)

// -----------------------------------------------------------------------------
// Service Configuration
// -----------------------------------------------------------------------------

// ServiceConfig holds configuration for the ARP scanner service.
type ServiceConfig struct {
	EventBus        events.EventBus
	EventPublisher  *events.Publisher
	Logger          *zap.Logger
	ConnManager     *connection.Manager
	RateLimitPeriod time.Duration
	WorkerCount     int
}

// ARPScannerService provides ARP-based device discovery.
//
//nolint:revive // type name is appropriately specific for ARP scanning context
type ARPScannerService struct {
	eventBus       events.EventBus
	eventPublisher *events.Publisher
	log            *zap.Logger
	connManager    *connection.Manager

	// Session tracking
	sessions   map[string]*ScanSession
	sessionsMu sync.RWMutex

	// Rate limiting (1 scan per minute per router)
	lastScan        map[string]time.Time
	lastScanMu      sync.Mutex
	rateLimitPeriod time.Duration

	// Worker pool settings
	workerCount int
}

// ScanStatus represents the current state of a scan.
type ScanStatus string

const (
	ScanStatusPending   ScanStatus = "pending"
	ScanStatusScanning  ScanStatus = "scanning"
	ScanStatusCompleted ScanStatus = "completed"
	ScanStatusFailed    ScanStatus = "failed"
	ScanStatusCanceled  ScanStatus = "canceled"
)

// ScanSession tracks the state of an active scan.
type ScanSession struct {
	ID           string
	RouterID     string
	Subnet       string
	Interface    string
	Status       ScanStatus
	Progress     int
	ScannedCount int
	TotalCount   int
	DevicesFound int
	Devices      []events.DiscoveredDevice
	StartTime    time.Time
	EndTime      *time.Time
	Error        string
	CancelFunc   context.CancelFunc
	mu           sync.RWMutex
}

// -----------------------------------------------------------------------------
// Service Initialization
// -----------------------------------------------------------------------------

// NewARPScannerService creates a new ARP scanner service.
func NewARPScannerService(cfg ServiceConfig) *ARPScannerService {
	if cfg.RateLimitPeriod == 0 {
		cfg.RateLimitPeriod = DefaultRateLimitPeriod
	}
	if cfg.WorkerCount == 0 {
		cfg.WorkerCount = DefaultWorkerCount
	}

	return &ARPScannerService{
		eventBus:        cfg.EventBus,
		eventPublisher:  cfg.EventPublisher,
		log:             cfg.Logger.Named("arp-scanner"),
		connManager:     cfg.ConnManager,
		sessions:        make(map[string]*ScanSession),
		lastScan:        make(map[string]time.Time),
		rateLimitPeriod: cfg.RateLimitPeriod,
		workerCount:     cfg.WorkerCount,
	}
}

// -----------------------------------------------------------------------------
// Public Methods
// -----------------------------------------------------------------------------

// StartScan initiates a new device scan.
func (s *ARPScannerService) StartScan(
	ctx context.Context,
	routerID string,
	subnet string,
	interfaceName string,
) (string, error) {

	s.log.Info("starting device scan",
		zap.String("routerID", routerID),
		zap.String("subnet", subnet),
		zap.String("interface", interfaceName),
	)

	// Validate subnet size
	if err := validateSubnet(subnet); err != nil {
		s.log.Error("invalid subnet", zap.Error(err))
		return "", err
	}

	// Check rate limit
	if err := s.checkRateLimit(routerID); err != nil {
		s.log.Warn("rate limit exceeded", zap.String("routerID", routerID))
		return "", err
	}

	// Generate scan ID
	scanID := ulid.Make().String()

	// Create cancellable context
	scanCtx, cancel := context.WithCancel(context.Background())

	// Create session
	session := &ScanSession{
		ID:         scanID,
		RouterID:   routerID,
		Subnet:     subnet,
		Interface:  interfaceName,
		Status:     ScanStatusPending,
		Progress:   0,
		StartTime:  time.Now(),
		CancelFunc: cancel,
		Devices:    make([]events.DiscoveredDevice, 0),
	}

	// Store session
	s.sessionsMu.Lock()
	s.sessions[scanID] = session
	s.sessionsMu.Unlock()

	// Update rate limit
	s.lastScanMu.Lock()
	s.lastScan[routerID] = time.Now()
	s.lastScanMu.Unlock()

	// Publish started event
	if s.eventPublisher != nil {
		event := events.NewDeviceScanStartedEvent(scanID, routerID, subnet, "arp-scanner")
		if err := s.eventBus.Publish(ctx, event); err != nil {
			s.log.Error("failed to publish scan started event", zap.Error(err))
		}
	}

	// Launch scan in background
	go s.executeScan(scanCtx, session) //nolint:contextcheck // scan runs independent background task

	return scanID, nil
}

// CancelScan cancels an ongoing scan.
func (s *ARPScannerService) CancelScan(ctx context.Context, scanID string) error {
	s.sessionsMu.RLock()
	session, exists := s.sessions[scanID]
	s.sessionsMu.RUnlock()

	if !exists {
		return fmt.Errorf("scan session %s not found", scanID)
	}

	session.mu.Lock()
	defer session.mu.Unlock()

	if session.Status != ScanStatusScanning && session.Status != ScanStatusPending {
		return fmt.Errorf("scan %s is not active (status: %s)", scanID, session.Status)
	}

	// Invoke cancel function
	if session.CancelFunc != nil {
		session.CancelFunc()
	}

	// Update status
	session.Status = ScanStatusCanceled
	now := time.Now()
	session.EndTime = &now

	// Publish canceled event
	if s.eventPublisher != nil {
		event := events.NewDeviceScanCancelledEvent(scanID, session.RouterID, "arp-scanner")
		if err := s.eventBus.Publish(ctx, event); err != nil {
			s.log.Error("failed to publish scan canceled event", zap.Error(err))
		}
	}

	s.log.Info("scan canceled", zap.String("scanID", scanID))
	return nil
}

// GetSession returns the current state of a scan session.
func (s *ARPScannerService) GetSession(scanID string) (*ScanSession, error) {
	s.sessionsMu.RLock()
	defer s.sessionsMu.RUnlock()

	session, exists := s.sessions[scanID]
	if !exists {
		return nil, fmt.Errorf("scan session %s not found", scanID)
	}

	return session, nil
}

// -----------------------------------------------------------------------------
// Private Methods - Scan Execution
// -----------------------------------------------------------------------------

// executeScan orchestrates the scan workflow.
func (s *ARPScannerService) executeScan(ctx context.Context, session *ScanSession) {
	defer func() {
		if r := recover(); r != nil {
			s.log.Error("panic in executeScan", zap.Any("panic", r))
			markSessionFailed(ctx, s, session, fmt.Sprintf("internal error: %v", r))
		}
	}()

	s.log.Info("executing scan", zap.String("scanID", session.ID))

	// Update status to scanning
	session.mu.Lock()
	session.Status = ScanStatusScanning
	session.mu.Unlock()

	// Get router connection
	conn, err := s.connManager.GetConnection(session.RouterID)
	if err != nil {
		markSessionFailed(ctx, s, session, fmt.Sprintf("failed to get router connection: %v", err))
		return
	}

	// Use interface{} to work around conflicting Protocol() method signatures
	// between connection.RouterClient and router.RouterPort
	var port router.RouterPort
	if clientWithExecute, ok := conn.Client.(interface {
		ExecuteCommand(context.Context, router.Command) (*router.CommandResult, error)
	}); ok {
		// Type assertion via interface{} to avoid Protocol() method conflict
		port, _ = clientWithExecute.(router.RouterPort) //nolint:errcheck // interface{} cast allowed after ok check
	} else {
		markSessionFailed(ctx, s, session, "router client does not support ExecuteCommand")
		return
	}

	// Step 1 (0-30%): Get ARP table
	s.log.Info("step 1: getting ARP table", zap.String("scanID", session.ID))
	arpDevices, err := getARPTable(ctx, s.log, port, session.Interface)
	if err != nil {
		markSessionFailed(ctx, s, session, fmt.Sprintf("failed to get ARP table: %v", err))
		return
	}
	updateProgress(ctx, s, session, 30, len(arpDevices), 0, arpDevices)

	// Step 2 (30-60%): Get DHCP leases and enrich
	s.log.Info("step 2: getting DHCP leases", zap.String("scanID", session.ID))
	dhcpHostnames, err := getDHCPLeases(ctx, s.log, port)
	if err != nil {
		// Non-critical error - continue without DHCP enrichment
		s.log.Warn("failed to get DHCP leases", zap.Error(err))
	} else {
		enrichWithDHCP(arpDevices, dhcpHostnames)
	}
	updateProgress(ctx, s, session, 60, len(arpDevices), 0, arpDevices)

	// Step 3 (60-90%): Perform ping sweep
	s.log.Info("step 3: performing ping sweep", zap.String("scanID", session.ID))
	allDevices, totalCount, err := s.performPingSweep(ctx, port, session.Subnet, session, arpDevices)
	if err != nil {
		if ctx.Err() == context.Canceled {
			// Scan was canceled
			return
		}
		markSessionFailed(ctx, s, session, fmt.Sprintf("failed to perform ping sweep: %v", err))
		return
	}
	updateProgress(ctx, s, session, 90, totalCount, totalCount, allDevices)

	// Step 4 (90-100%): Enrich with neighbor discovery
	s.log.Info("step 4: enriching with neighbor discovery", zap.String("scanID", session.ID))
	err = enrichWithNeighbors(ctx, s.log, port, allDevices)
	if err != nil {
		// Non-critical error - continue without neighbor enrichment
		s.log.Warn("failed to enrich with neighbors", zap.Error(err))
	}

	// Mark as completed
	markSessionCompleted(ctx, s, session, allDevices)
}

// performPingSweep performs parallel ping sweep across the subnet.
func (s *ARPScannerService) performPingSweep(
	ctx context.Context,
	port router.RouterPort,
	subnet string,
	session *ScanSession,
	_ []events.DiscoveredDevice,
) ([]events.DiscoveredDevice, int, error) {
	// Parse subnet to generate IP list
	ips, err := generateIPList(subnet)
	if err != nil {
		return nil, 0, err
	}

	totalCount := len(ips)
	session.mu.Lock()
	session.TotalCount = totalCount
	session.mu.Unlock()

	s.log.Info("starting ping sweep",
		zap.Int("ipCount", totalCount),
		zap.Int("workers", s.workerCount),
	)

	// Create IP work queue
	ipChan := make(chan string, totalCount)
	for _, ip := range ips {
		ipChan <- ip
	}
	close(ipChan)

	// Result collection
	resultChan := make(chan events.DiscoveredDevice, totalCount)
	var wg sync.WaitGroup

	// Start worker pool
	for i := 0; i < s.workerCount; i++ {
		wg.Add(1)
		go func(_ int) {
			defer wg.Done()
			pingWorker(ctx, s.log, port, ipChan, resultChan, session)
		}(i)
	}

	// Close result channel when workers are done
	go func() {
		wg.Wait()
		close(resultChan)
	}()

	// Collect results
	allDevices := make([]events.DiscoveredDevice, 0, totalCount)
	scannedCount := 0

	for device := range resultChan {
		allDevices = append(allDevices, device)
		scannedCount++

		// Publish progress every 10 devices
		if scannedCount%10 == 0 {
			progress := 60 + int(float64(scannedCount)/float64(totalCount)*30)
			updateProgress(ctx, s, session, progress, scannedCount, totalCount, allDevices)
		}
	}

	// Check for cancellation
	if ctx.Err() == context.Canceled {
		return nil, 0, fmt.Errorf("scan canceled")
	}

	s.log.Info("ping sweep completed",
		zap.Int("scannedCount", scannedCount),
		zap.Int("devicesFound", len(allDevices)),
	)

	return allDevices, totalCount, nil
}

// -----------------------------------------------------------------------------
// Private Methods - Helpers
// -----------------------------------------------------------------------------

// checkRateLimit checks if the rate limit allows a new scan.
func (s *ARPScannerService) checkRateLimit(routerID string) error {
	s.lastScanMu.Lock()
	defer s.lastScanMu.Unlock()

	if lastScan, exists := s.lastScan[routerID]; exists {
		elapsed := time.Since(lastScan)
		if elapsed < s.rateLimitPeriod {
			remaining := s.rateLimitPeriod - elapsed
			return fmt.Errorf("rate limit exceeded, retry in %d seconds", int(remaining.Seconds()))
		}
	}

	return nil
}
