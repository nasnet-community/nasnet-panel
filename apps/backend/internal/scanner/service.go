package scanner

import (
	"context"
	"fmt"
	"log"
	"net"
	"sync"
	"sync/atomic"
	"time"

	"backend/internal/events"
)

// Service defines the interface for scanner operations.
type Service interface {
	// StartScan initiates a network scan for the given subnet.
	StartScan(ctx context.Context, subnet string) (*ScanTask, error)
	// StartAutoScan initiates an automatic gateway scan.
	StartAutoScan(ctx context.Context) (*ScanTask, error)
	// GetStatus returns the current status of a scan task.
	GetStatus(taskID string) (*ScanTask, error)
	// CancelScan cancels a running scan.
	CancelScan(taskID string) (*ScanTask, error)
	// GetHistory returns recent scan tasks.
	GetHistory(limit int) []*ScanTask
}

// ScannerService implements the Service interface.
type ScannerService struct {
	config     ScannerConfig
	tasks      sync.Map // map[string]*ScanTask
	eventBus   events.EventBus
	runningCnt int32 // atomic counter for running scans
}

// NewService creates a new scanner service with the given configuration.
func NewService(config ScannerConfig, eventBus events.EventBus) *ScannerService {
	return &ScannerService{
		config:   config,
		eventBus: eventBus,
	}
}

// NewServiceWithDefaults creates a new scanner service with default configuration.
func NewServiceWithDefaults(eventBus events.EventBus) *ScannerService {
	return NewService(DefaultConfig(), eventBus)
}

// StartScan initiates a network scan for the given subnet.
func (s *ScannerService) StartScan(ctx context.Context, subnet string) (*ScanTask, error) {
	// Validate subnet
	if err := ValidateSubnet(subnet); err != nil {
		return nil, fmt.Errorf("invalid subnet: %w", err)
	}

	// Check concurrent scan limit
	if atomic.LoadInt32(&s.runningCnt) >= int32(s.config.MaxConcurrentScans) {
		return nil, fmt.Errorf("maximum concurrent scans reached (%d)", s.config.MaxConcurrentScans)
	}

	// Parse IPs
	ips, err := ParseIPRange(subnet)
	if err != nil {
		return nil, fmt.Errorf("failed to parse subnet: %w", err)
	}

	// Apply smart ordering
	ips = OrderIPsForScan(ips)

	// Create task
	taskID := fmt.Sprintf("scan_%d", time.Now().UnixNano())
	taskCtx, cancel := context.WithCancel(ctx)

	task := &ScanTask{
		ID:        taskID,
		Subnet:    subnet,
		Status:    ScanStatusPending,
		Progress:  0,
		Results:   make([]DiscoveredDevice, 0),
		StartTime: time.Now(),
		TotalIPs:  len(ips),
		cancel:    cancel,
	}

	// Store task
	s.tasks.Store(taskID, task)

	// Start scan in background
	atomic.AddInt32(&s.runningCnt, 1)
	go s.executeScan(taskCtx, task, ips)

	// Publish scan started event
	s.publishScanStarted(task)

	return task, nil
}

// StartAutoScan initiates an automatic gateway scan.
func (s *ScannerService) StartAutoScan(ctx context.Context) (*ScanTask, error) {
	// Check concurrent scan limit
	if atomic.LoadInt32(&s.runningCnt) >= int32(s.config.MaxConcurrentScans) {
		return nil, fmt.Errorf("maximum concurrent scans reached (%d)", s.config.MaxConcurrentScans)
	}

	// Generate gateway IPs
	ips := GenerateGatewayIPs()

	// Create task
	taskID := fmt.Sprintf("auto_scan_%d", time.Now().UnixNano())
	taskCtx, cancel := context.WithCancel(ctx)

	task := &ScanTask{
		ID:        taskID,
		Subnet:    "192.168.0-255.1",
		Status:    ScanStatusPending,
		Progress:  0,
		Results:   make([]DiscoveredDevice, 0),
		StartTime: time.Now(),
		TotalIPs:  len(ips),
		cancel:    cancel,
	}

	// Store task
	s.tasks.Store(taskID, task)

	// Start scan in background
	atomic.AddInt32(&s.runningCnt, 1)
	go s.executeGatewayScan(taskCtx, task, ips)

	// Publish scan started event
	s.publishScanStarted(task)

	return task, nil
}

// GetStatus returns the current status of a scan task.
func (s *ScannerService) GetStatus(taskID string) (*ScanTask, error) {
	if val, ok := s.tasks.Load(taskID); ok {
		return val.(*ScanTask), nil
	}
	return nil, fmt.Errorf("task not found: %s", taskID)
}

// CancelScan cancels a running scan.
func (s *ScannerService) CancelScan(taskID string) (*ScanTask, error) {
	val, ok := s.tasks.Load(taskID)
	if !ok {
		return nil, fmt.Errorf("task not found: %s", taskID)
	}

	task := val.(*ScanTask)
	if task.GetStatus() != ScanStatusRunning && task.GetStatus() != ScanStatusPending {
		return task, nil // Already finished, nothing to cancel
	}

	task.Cancel()
	return task, nil
}

// GetHistory returns recent scan tasks.
func (s *ScannerService) GetHistory(limit int) []*ScanTask {
	var tasks []*ScanTask
	s.tasks.Range(func(key, value interface{}) bool {
		tasks = append(tasks, value.(*ScanTask))
		return len(tasks) < limit
	})
	return tasks
}

// executeScan performs the actual subnet scan.
func (s *ScannerService) executeScan(ctx context.Context, task *ScanTask, ips []string) {
	defer atomic.AddInt32(&s.runningCnt, -1)
	defer s.scheduleCleanup(task)

	task.SetStatus(ScanStatusRunning)

	// Determine worker count based on subnet size
	workers := s.config.MaxWorkersPerSubnet24
	if len(ips) > 256 {
		workers = s.config.MaxWorkersPerSubnet16
	}

	// Channel for work distribution
	jobs := make(chan string, workers)
	results := make(chan DiscoveredDevice, workers)

	// Worker pool
	var wg sync.WaitGroup
	for i := 0; i < workers; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for ip := range jobs {
				select {
				case <-ctx.Done():
					return
				default:
					if device := s.scanIP(ctx, ip); device != nil {
						results <- *device
					}
				}
			}
		}()
	}

	// Close results when workers complete
	go func() {
		wg.Wait()
		close(results)
	}()

	// Progress tracker
	var scannedIPs int32
	lastProgressUpdate := time.Now()

	// Result collector in separate goroutine
	resultsDone := make(chan struct{})
	go func() {
		defer close(resultsDone)
		for device := range results {
			task.AddResult(device)
			s.publishDeviceDiscovered(task, device)
		}
	}()

	// Send jobs and track progress
	go func() {
		defer close(jobs)
		for _, ip := range ips {
			select {
			case <-ctx.Done():
				return
			case jobs <- ip:
				// Update progress periodically
				scanned := atomic.AddInt32(&scannedIPs, 1)
				progress := int(scanned * 100 / int32(len(ips)))
				task.SetProgress(progress, int(scanned))

				// Publish progress event (every 5% or every 2 seconds)
				if progress%5 == 0 || time.Since(lastProgressUpdate) > 2*time.Second {
					s.publishProgress(task, ip)
					lastProgressUpdate = time.Now()
				}
			}
		}
	}()

	// Wait for all results
	wg.Wait()
	<-resultsDone

	// Set final status
	select {
	case <-ctx.Done():
		task.SetStatus(ScanStatusCancelled)
	default:
		task.SetStatus(ScanStatusCompleted)
	}

	task.SetProgress(100, len(ips))
	s.publishScanCompleted(task)
}

// executeGatewayScan performs gateway-specific scanning.
func (s *ScannerService) executeGatewayScan(ctx context.Context, task *ScanTask, ips []string) {
	defer atomic.AddInt32(&s.runningCnt, -1)
	defer s.scheduleCleanup(task)

	task.SetStatus(ScanStatusRunning)

	// Use fewer workers for gateway scan (more targeted)
	workers := s.config.MaxWorkersPerSubnet24

	// Channel for work distribution
	jobs := make(chan string, workers)
	results := make(chan DiscoveredDevice, workers)

	// Worker pool
	var wg sync.WaitGroup
	for i := 0; i < workers; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for ip := range jobs {
				select {
				case <-ctx.Done():
					return
				default:
					// For gateway scan, only check HTTP API ports
					if device := s.scanGatewayIP(ctx, ip); device != nil {
						results <- *device
					}
				}
			}
		}()
	}

	// Close results when workers complete
	go func() {
		wg.Wait()
		close(results)
	}()

	// Progress tracker
	var scannedIPs int32
	lastProgressUpdate := time.Now()

	// Result collector
	resultsDone := make(chan struct{})
	go func() {
		defer close(resultsDone)
		for device := range results {
			task.AddResult(device)
			s.publishDeviceDiscovered(task, device)
		}
	}()

	// Send jobs
	go func() {
		defer close(jobs)
		for _, ip := range ips {
			select {
			case <-ctx.Done():
				return
			case jobs <- ip:
				scanned := atomic.AddInt32(&scannedIPs, 1)
				progress := int(scanned * 100 / int32(len(ips)))
				task.SetProgress(progress, int(scanned))

				if progress%5 == 0 || time.Since(lastProgressUpdate) > 2*time.Second {
					s.publishProgress(task, ip)
					lastProgressUpdate = time.Now()
				}
			}
		}
	}()

	wg.Wait()
	<-resultsDone

	select {
	case <-ctx.Done():
		task.SetStatus(ScanStatusCancelled)
	default:
		task.SetStatus(ScanStatusCompleted)
	}

	task.SetProgress(100, len(ips))
	s.publishScanCompleted(task)
}

// scanIP scans a single IP for all MikroTik ports.
func (s *ScannerService) scanIP(ctx context.Context, ip string) *DiscoveredDevice {
	var openPorts []int
	var services []string
	var routerOSInfo *RouterOSInfo

	// Channel for port scan results
	portChan := make(chan int, len(TargetPorts))

	// Limit concurrent port scans per IP
	sem := make(chan struct{}, 5)
	var wg sync.WaitGroup

	for _, port := range TargetPorts {
		wg.Add(1)
		go func(p int) {
			defer wg.Done()
			sem <- struct{}{}
			defer func() { <-sem }()

			select {
			case <-ctx.Done():
				return
			default:
				if IsPortOpen(ctx, ip, p, s.config.HTTPTimeout) {
					portChan <- p
				}
			}
		}(port)
	}

	go func() {
		wg.Wait()
		close(portChan)
	}()

	// Collect open ports
	for port := range portChan {
		openPorts = append(openPorts, port)
		services = append(services, GetServiceName(port))
	}

	if len(openPorts) == 0 {
		return nil
	}

	// Identify device type
	deviceType := "unknown"
	vendor := "unknown"

	// Check for MikroTik-specific ports first
	if containsPort(openPorts, 8728) || containsPort(openPorts, 8729) || containsPort(openPorts, 8291) {
		deviceType = "router"
		vendor = "MikroTik"
	} else if containsPort(openPorts, 80) || containsPort(openPorts, 443) {
		// Verify RouterOS API
		for _, port := range HTTPAPIPorts {
			if containsPort(openPorts, port) {
				if info := CheckRouterOSAPI(ctx, ip, port, s.config.HTTPTimeout); info != nil && info.IsValid {
					deviceType = "router"
					vendor = "MikroTik"
					routerOSInfo = info
					break
				}
			}
		}
		if deviceType == "unknown" {
			return nil // Not a MikroTik device
		}
	}

	// Only return MikroTik devices
	if vendor != "MikroTik" {
		return nil
	}

	// Resolve hostname
	hostname := ""
	if names, err := net.LookupAddr(ip); err == nil && len(names) > 0 {
		hostname = names[0]
	}

	// Update service names for MikroTik
	mikrotikServices := make([]string, len(services))
	for i, service := range services {
		switch service {
		case "http":
			mikrotikServices[i] = "mikrotik-rest"
		case "https":
			mikrotikServices[i] = "mikrotik-rest-ssl"
		default:
			mikrotikServices[i] = service
		}
	}

	confidence := 0
	if routerOSInfo != nil {
		confidence = routerOSInfo.Confidence
	} else {
		// High confidence for MikroTik-specific ports
		confidence = 80
	}

	return &DiscoveredDevice{
		IP:           ip,
		Hostname:     hostname,
		Ports:        openPorts,
		DeviceType:   deviceType,
		Vendor:       vendor,
		Services:     mikrotikServices,
		RouterOSInfo: routerOSInfo,
		Confidence:   confidence,
	}
}

// scanGatewayIP scans a gateway IP specifically for RouterOS REST API.
func (s *ScannerService) scanGatewayIP(ctx context.Context, ip string) *DiscoveredDevice {
	var openPorts []int
	var services []string
	var routerOSInfo *RouterOSInfo

	// Check HTTP API ports first
	for _, port := range HTTPAPIPorts {
		select {
		case <-ctx.Done():
			return nil
		default:
			if IsPortOpen(ctx, ip, port, s.config.HTTPTimeout) {
				openPorts = append(openPorts, port)
				services = append(services, GetServiceName(port))

				// Verify RouterOS API
				if info := CheckRouterOSAPI(ctx, ip, port, s.config.HTTPTimeout); info != nil && info.IsValid {
					routerOSInfo = info
					break
				}
			}
		}
	}

	// Only return verified RouterOS devices
	if routerOSInfo == nil || !routerOSInfo.IsValid {
		return nil
	}

	// Resolve hostname
	hostname := ""
	if names, err := net.LookupAddr(ip); err == nil && len(names) > 0 {
		hostname = names[0]
	}

	// Update service names
	mikrotikServices := make([]string, len(services))
	for i, service := range services {
		switch service {
		case "http":
			mikrotikServices[i] = "mikrotik-rest"
		case "https":
			mikrotikServices[i] = "mikrotik-rest-ssl"
		default:
			mikrotikServices[i] = service
		}
	}

	return &DiscoveredDevice{
		IP:           ip,
		Hostname:     hostname,
		Ports:        openPorts,
		DeviceType:   "router",
		Vendor:       "MikroTik",
		Services:     mikrotikServices,
		RouterOSInfo: routerOSInfo,
		Confidence:   routerOSInfo.Confidence,
	}
}

// scheduleCleanup schedules task removal after retention period.
func (s *ScannerService) scheduleCleanup(task *ScanTask) {
	go func() {
		time.Sleep(s.config.TaskRetentionDuration)
		s.tasks.Delete(task.ID)
	}()
}

// Event publishing helpers

func (s *ScannerService) publishScanStarted(task *ScanTask) {
	if s.eventBus == nil {
		return
	}
	log.Printf("[Scanner] Scan started: %s (%s)", task.ID, task.Subnet)
}

func (s *ScannerService) publishProgress(task *ScanTask, currentIP string) {
	if s.eventBus == nil {
		return
	}
	progress, _ := task.GetProgress()
	log.Printf("[Scanner] Progress: %s - %d%% (scanning %s)", task.ID, progress, currentIP)
}

func (s *ScannerService) publishDeviceDiscovered(task *ScanTask, device DiscoveredDevice) {
	if s.eventBus == nil {
		return
	}
	log.Printf("[Scanner] Device found: %s on %s (confidence: %d)", device.IP, task.ID, device.Confidence)
}

func (s *ScannerService) publishScanCompleted(task *ScanTask) {
	if s.eventBus == nil {
		return
	}
	results := task.GetResults()
	log.Printf("[Scanner] Scan completed: %s - found %d devices", task.ID, len(results))
}
