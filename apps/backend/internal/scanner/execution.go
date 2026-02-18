package scanner

import (
	"context"
	"log"
	"sync"
	"sync/atomic"
	"time"
)

// =============================================================================
// Scan Execution
// =============================================================================
// Implements scan orchestration, worker pools, and progress tracking.

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
				//nolint:gosec // scanned guaranteed < int32(len(ips)) by atomic counter
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
		task.SetStatus(ScanStatusCanceled)
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
				//nolint:gosec // scanned guaranteed < int32(len(ips)) by atomic counter
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
		task.SetStatus(ScanStatusCanceled)
	default:
		task.SetStatus(ScanStatusCompleted)
	}

	task.SetProgress(100, len(ips))
	s.publishScanCompleted(task)
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
