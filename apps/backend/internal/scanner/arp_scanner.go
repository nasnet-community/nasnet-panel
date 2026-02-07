package scanner

import (
	"context"
	"fmt"
	"net"
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

	// MaxSubnetSize is the maximum subnet size (/16 = 65,536 IPs)
	MaxSubnetSize = 16

	// MaxDevices is the maximum number of devices to return
	MaxDevices = 2000
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
type ARPScannerService struct {
	eventBus       events.EventBus
	eventPublisher *events.Publisher
	log            *zap.Logger
	connManager    *connection.Manager

	// Session tracking
	sessions   map[string]*ScanSession
	sessionsMu sync.RWMutex

	// Rate limiting (1 scan per minute per router)
	lastScan       map[string]time.Time
	lastScanMu     sync.Mutex
	rateLimitPeriod time.Duration

	// Worker pool settings
	workerCount int
}

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
	if err := s.validateSubnet(subnet); err != nil {
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
		ID:        scanID,
		RouterID:  routerID,
		Subnet:    subnet,
		Interface: interfaceName,
		Status:    ScanStatusPending,
		Progress:  0,
		StartTime: time.Now(),
		CancelFunc: cancel,
		Devices:   make([]events.DiscoveredDevice, 0),
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
	go s.executeScan(scanCtx, session)

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
	session.Status = ScanStatusCancelled
	now := time.Now()
	session.EndTime = &now

	// Publish cancelled event
	if s.eventPublisher != nil {
		event := events.NewDeviceScanCancelledEvent(scanID, session.RouterID, "arp-scanner")
		if err := s.eventBus.Publish(ctx, event); err != nil {
			s.log.Error("failed to publish scan cancelled event", zap.Error(err))
		}
	}

	s.log.Info("scan cancelled", zap.String("scanID", scanID))
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
			s.markSessionFailed(ctx, session, fmt.Sprintf("internal error: %v", r))
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
		s.markSessionFailed(ctx, session, fmt.Sprintf("failed to get router connection: %v", err))
		return
	}

	// Check if RouterClient can be cast to RouterPort for command execution
	port, ok := conn.Client.(router.RouterPort)
	if !ok {
		s.markSessionFailed(ctx, session, "router client does not implement RouterPort")
		return
	}

	// Step 1 (0-30%): Get ARP table
	s.log.Info("step 1: getting ARP table", zap.String("scanID", session.ID))
	arpDevices, err := s.getARPTable(ctx, port, session.Interface)
	if err != nil {
		s.markSessionFailed(ctx, session, fmt.Sprintf("failed to get ARP table: %v", err))
		return
	}
	s.updateProgress(ctx, session, 30, len(arpDevices), 0, arpDevices)

	// Step 2 (30-60%): Get DHCP leases and enrich
	s.log.Info("step 2: getting DHCP leases", zap.String("scanID", session.ID))
	dhcpHostnames, err := s.getDHCPLeases(ctx, port)
	if err != nil {
		// Non-critical error - continue without DHCP enrichment
		s.log.Warn("failed to get DHCP leases", zap.Error(err))
	} else {
		s.enrichWithDHCP(arpDevices, dhcpHostnames)
	}
	s.updateProgress(ctx, session, 60, len(arpDevices), 0, arpDevices)

	// Step 3 (60-90%): Perform ping sweep
	s.log.Info("step 3: performing ping sweep", zap.String("scanID", session.ID))
	allDevices, totalCount, err := s.performPingSweep(ctx, port, session.Subnet, session, arpDevices)
	if err != nil {
		if ctx.Err() == context.Canceled {
			// Scan was cancelled
			return
		}
		s.markSessionFailed(ctx, session, fmt.Sprintf("failed to perform ping sweep: %v", err))
		return
	}
	s.updateProgress(ctx, session, 90, totalCount, totalCount, allDevices)

	// Step 4 (90-100%): Enrich with neighbor discovery
	s.log.Info("step 4: enriching with neighbor discovery", zap.String("scanID", session.ID))
	err = s.enrichWithNeighbors(ctx, port, allDevices)
	if err != nil {
		// Non-critical error - continue without neighbor enrichment
		s.log.Warn("failed to enrich with neighbors", zap.Error(err))
	}

	// Mark as completed
	s.markSessionCompleted(ctx, session, allDevices)
}

// getARPTable retrieves the current ARP table from the router.
func (s *ARPScannerService) getARPTable(
	ctx context.Context,
	port router.RouterPort,
	interfaceName string,
) ([]events.DiscoveredDevice, error) {
	args := map[string]string{
		".proplist": "address,mac-address,interface,dynamic",
	}
	if interfaceName != "" {
		args["interface"] = interfaceName
	}

	cmd := router.Command{
		Path:   "/ip/arp",
		Action: "print",
		Args:   args,
	}

	result, err := port.ExecuteCommand(ctx, cmd)
	if err != nil {
		return nil, fmt.Errorf("failed to execute ARP print command: %w", err)
	}

	if !result.Success {
		return nil, fmt.Errorf("ARP print command failed: %v", result.Error)
	}

	// Parse results
	devices := make([]events.DiscoveredDevice, 0, len(result.Data))
	for _, row := range result.Data {
		ip := row["address"]
		mac := row["mac-address"]
		iface := row["interface"]

		if ip == "" || mac == "" {
			continue
		}

		devices = append(devices, events.DiscoveredDevice{
			IP:           ip,
			MAC:          mac,
			Hostname:     "",
			Interface:    iface,
			ResponseTime: 0,
			FirstSeen:    time.Now(),
		})
	}

	s.log.Info("retrieved ARP table",
		zap.Int("deviceCount", len(devices)),
	)

	return devices, nil
}

// getDHCPLeases retrieves DHCP lease information for hostname correlation.
func (s *ARPScannerService) getDHCPLeases(
	ctx context.Context,
	port router.RouterPort,
) (map[string]string, error) {
	cmd := router.Command{
		Path:   "/ip/dhcp-server/lease",
		Action: "print",
		Args: map[string]string{
			".proplist": "address,host-name,mac-address",
		},
	}

	result, err := port.ExecuteCommand(ctx, cmd)
	if err != nil {
		return nil, fmt.Errorf("failed to execute DHCP lease print command: %w", err)
	}

	if !result.Success {
		return nil, fmt.Errorf("DHCP lease print command failed: %v", result.Error)
	}

	// Build IP -> hostname map
	hostnames := make(map[string]string)
	for _, row := range result.Data {
		ip := row["address"]
		hostname := row["host-name"]
		if ip != "" && hostname != "" {
			hostnames[ip] = hostname
		}
	}

	s.log.Info("retrieved DHCP leases",
		zap.Int("leaseCount", len(hostnames)),
	)

	return hostnames, nil
}

// enrichWithDHCP adds hostname information from DHCP leases.
func (s *ARPScannerService) enrichWithDHCP(
	devices []events.DiscoveredDevice,
	dhcpHostnames map[string]string,
) {
	for i := range devices {
		if hostname, exists := dhcpHostnames[devices[i].IP]; exists {
			devices[i].Hostname = hostname
		}
	}
}

// performPingSweep performs parallel ping sweep across the subnet.
func (s *ARPScannerService) performPingSweep(
	ctx context.Context,
	port router.RouterPort,
	subnet string,
	session *ScanSession,
	arpDevices []events.DiscoveredDevice,
) ([]events.DiscoveredDevice, int, error) {
	// Parse subnet to generate IP list
	ips, err := s.generateIPList(subnet)
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
		go func(workerID int) {
			defer wg.Done()
			s.pingWorker(ctx, port, ipChan, resultChan, session)
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
			s.updateProgress(ctx, session, progress, scannedCount, totalCount, allDevices)
		}
	}

	// Check for cancellation
	if ctx.Err() == context.Canceled {
		return nil, 0, fmt.Errorf("scan cancelled")
	}

	s.log.Info("ping sweep completed",
		zap.Int("scannedCount", scannedCount),
		zap.Int("devicesFound", len(allDevices)),
	)

	return allDevices, totalCount, nil
}

// pingWorker is a worker that pings IPs from the queue.
func (s *ARPScannerService) pingWorker(
	ctx context.Context,
	port router.RouterPort,
	ipChan <-chan string,
	resultChan chan<- events.DiscoveredDevice,
	session *ScanSession,
) {
	for {
		select {
		case <-ctx.Done():
			return
		case ip, ok := <-ipChan:
			if !ok {
				return
			}

			// Ping the IP
			online, responseTime := s.pingHost(ctx, port, ip)
			if online {
				// TODO: Extract MAC from ARP after ping
				device := events.DiscoveredDevice{
					IP:           ip,
					MAC:          "", // Will be populated from ARP
					Hostname:     "",
					Interface:    session.Interface,
					ResponseTime: responseTime,
					FirstSeen:    time.Now(),
				}
				resultChan <- device
			}
		}
	}
}

// pingHost pings a single host and returns whether it's online and response time.
func (s *ARPScannerService) pingHost(
	ctx context.Context,
	port router.RouterPort,
	ip string,
) (bool, int) {
	cmd := router.Command{
		Path:   "/tool/ping",
		Action: "",
		Args: map[string]string{
			"address":  ip,
			"count":    "1",
			"interval": "100ms",
		},
	}

	result, err := port.ExecuteCommand(ctx, cmd)
	if err != nil || !result.Success {
		return false, 0
	}

	// Check if ping succeeded (at least one reply)
	// Parse response for time
	// This is simplified - actual parsing depends on result format
	return true, 10 // Placeholder
}

// enrichWithNeighbors adds MikroTik neighbor discovery information.
func (s *ARPScannerService) enrichWithNeighbors(
	ctx context.Context,
	port router.RouterPort,
	devices []events.DiscoveredDevice,
) error {
	cmd := router.Command{
		Path:   "/ip/neighbor",
		Action: "print",
		Args: map[string]string{
			".proplist": "address,mac-address,identity,platform",
		},
	}

	result, err := port.ExecuteCommand(ctx, cmd)
	if err != nil {
		return fmt.Errorf("failed to execute neighbor print command: %w", err)
	}

	if !result.Success {
		return fmt.Errorf("neighbor print command failed: %v", result.Error)
	}

	// Build IP -> identity map
	identities := make(map[string]string)
	for _, row := range result.Data {
		ip := row["address"]
		identity := row["identity"]
		if ip != "" && identity != "" {
			identities[ip] = identity
		}
	}

	// Enrich devices with identity as hostname if not already set
	for i := range devices {
		if devices[i].Hostname == "" {
			if identity, exists := identities[devices[i].IP]; exists {
				devices[i].Hostname = identity
			}
		}
	}

	s.log.Info("enriched with neighbor discovery",
		zap.Int("identityCount", len(identities)),
	)

	return nil
}

// -----------------------------------------------------------------------------
// Private Methods - Helpers
// -----------------------------------------------------------------------------

// validateSubnet validates the subnet size.
func (s *ARPScannerService) validateSubnet(subnet string) error {
	_, ipNet, err := net.ParseCIDR(subnet)
	if err != nil {
		return fmt.Errorf("invalid subnet format: %w", err)
	}

	ones, _ := ipNet.Mask.Size()
	if ones < MaxSubnetSize {
		return fmt.Errorf("subnet too large (/%d), maximum /%d", ones, MaxSubnetSize)
	}

	return nil
}

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

// generateIPList generates a list of IP addresses from a CIDR subnet.
func (s *ARPScannerService) generateIPList(subnet string) ([]string, error) {
	_, ipNet, err := net.ParseCIDR(subnet)
	if err != nil {
		return nil, err
	}

	ips := make([]string, 0)
	for ip := ipNet.IP.Mask(ipNet.Mask); ipNet.Contains(ip); s.incIP(ip) {
		ips = append(ips, ip.String())
		if len(ips) >= MaxDevices {
			break
		}
	}

	return ips, nil
}

// incIP increments an IP address.
func (s *ARPScannerService) incIP(ip net.IP) {
	for j := len(ip) - 1; j >= 0; j-- {
		ip[j]++
		if ip[j] > 0 {
			break
		}
	}
}

// updateProgress publishes a progress event.
func (s *ARPScannerService) updateProgress(
	ctx context.Context,
	session *ScanSession,
	progress int,
	scannedCount int,
	totalCount int,
	devices []events.DiscoveredDevice,
) {
	session.mu.Lock()
	session.Progress = progress
	session.ScannedCount = scannedCount
	if totalCount > 0 {
		session.TotalCount = totalCount
	}
	session.DevicesFound = len(devices)
	session.Devices = devices
	session.mu.Unlock()

	if s.eventPublisher != nil {
		elapsedTime := int(time.Since(session.StartTime).Milliseconds())
		event := events.NewDeviceScanProgressEvent(
			session.ID,
			session.RouterID,
			events.ScanStatus(session.Status),
			progress,
			scannedCount,
			totalCount,
			devices,
			elapsedTime,
			"arp-scanner",
		)
		if err := s.eventBus.Publish(ctx, event); err != nil {
			s.log.Error("failed to publish progress event", zap.Error(err))
		}
	}
}

// markSessionCompleted marks a session as completed.
func (s *ARPScannerService) markSessionCompleted(
	ctx context.Context,
	session *ScanSession,
	devices []events.DiscoveredDevice,
) {
	session.mu.Lock()
	session.Status = ScanStatusCompleted
	session.Progress = 100
	session.DevicesFound = len(devices)
	session.Devices = devices
	now := time.Now()
	session.EndTime = &now
	session.mu.Unlock()

	if s.eventPublisher != nil {
		duration := int(time.Since(session.StartTime).Milliseconds())
		event := events.NewDeviceScanCompletedEvent(
			session.ID,
			session.RouterID,
			len(devices),
			duration,
			devices,
			"arp-scanner",
		)
		if err := s.eventBus.Publish(ctx, event); err != nil {
			s.log.Error("failed to publish completed event", zap.Error(err))
		}
	}

	s.log.Info("scan completed",
		zap.String("scanID", session.ID),
		zap.Int("devicesFound", len(devices)),
	)
}

// markSessionFailed marks a session as failed.
func (s *ARPScannerService) markSessionFailed(
	ctx context.Context,
	session *ScanSession,
	errorMsg string,
) {
	session.mu.Lock()
	session.Status = ScanStatusFailed
	session.Error = errorMsg
	now := time.Now()
	session.EndTime = &now
	session.mu.Unlock()

	if s.eventPublisher != nil {
		event := events.NewDeviceScanFailedEvent(
			session.ID,
			session.RouterID,
			errorMsg,
			"arp-scanner",
		)
		if err := s.eventBus.Publish(ctx, event); err != nil {
			s.log.Error("failed to publish failed event", zap.Error(err))
		}
	}

	s.log.Error("scan failed",
		zap.String("scanID", session.ID),
		zap.String("error", errorMsg),
	)
}
