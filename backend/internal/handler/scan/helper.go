package scan

import (
	"context"
	"sort"
	"sync"
	"time"

	pkgScanner "nasnet-panel/internal/scanner"
	"nasnet-panel/pkg/utils"
)

func processGatewayScanTask(ctx context.Context, task *Task) {
	pkgScanner.ProcessGatewayScan(ctx, scanConfig, func(device pkgScanner.Device) {
		task.mu.Lock()
		task.Results = append(task.Results, device)
		task.mu.Unlock()
	})

	task.mu.Lock()
	task.Status = statusCompleted
	task.Progress = 100
	task.mu.Unlock()

	go func() {
		time.Sleep(30 * time.Minute)
		scannerPool.mu.Lock()
		delete(scannerPool.activeTasks, task.ID)
		scannerPool.mu.Unlock()
	}()
}

func processScanTask(ctx context.Context, task *Task) {
	ips, err := pkgScanner.ParseIPRange(task.Subnet)
	if err != nil {
		task.mu.Lock()
		task.Status = "error"
		task.mu.Unlock()
		return
	}

	if len(ips) == 0 {
		task.mu.Lock()
		task.Status = statusCompleted
		task.Progress = 100
		task.mu.Unlock()
		return
	}

	totalIPs := len(ips)
	jobs := make(chan string, totalIPs)
	results := make(chan Device, totalIPs)
	processed := make(chan struct{}, totalIPs)

	var wg sync.WaitGroup

	for i := 0; i < scanConfig.MaxWorkers; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for ip := range jobs {
				if device := pkgScanner.ScanIP(ctx, ip, scanConfig.TargetPorts, scanConfig.Timeout); device != nil {
					results <- *device
				}
				processed <- struct{}{}
			}
		}()
	}

	go func() {
		wg.Wait()
		close(results)
	}()

	var deviceResults []Device
	var resultsDone sync.WaitGroup
	resultsDone.Add(1)

	go func() {
		defer resultsDone.Done()
		for device := range results {
			task.mu.Lock()
			deviceResults = append(deviceResults, device)
			task.Results = deviceResults
			task.mu.Unlock()
		}
	}()

	processedCount := 0
	go func() {
		for range processed {
			processedCount++
			task.mu.Lock()
			task.Progress = (processedCount * 100) / totalIPs
			task.mu.Unlock()
		}
	}()

	go func() {
		defer close(jobs)
		for _, ip := range ips {
			jobs <- ip
		}
	}()

	go func() {
		wg.Wait()
		close(processed)
	}()

	wg.Wait()
	resultsDone.Wait()

	task.mu.Lock()
	task.Status = statusCompleted
	task.Progress = 100
	task.mu.Unlock()

	go func() {
		time.Sleep(1 * time.Hour)
		scannerPool.mu.Lock()
		delete(scannerPool.activeTasks, task.ID)
		scannerPool.mu.Unlock()
	}()
}

func sortDevicesByIP(devices []Device) []Device {
	// Create indices and numeric IPs
	type sortItem struct {
		index   int
		numeric uint32
	}

	sortItems := make([]sortItem, len(devices))
	for i, device := range devices {
		sortItems[i] = sortItem{
			index:   i,
			numeric: utils.ParseIPToNumeric(device.IP),
		}
	}

	// Sort by numeric IP
	sort.Slice(sortItems, func(i, j int) bool {
		return sortItems[i].numeric < sortItems[j].numeric
	})

	// Return devices in sorted order
	result := make([]Device, len(devices))
	for i, item := range sortItems {
		result[i] = devices[item.index]
	}
	return result
}
