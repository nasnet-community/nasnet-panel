package main

// Thin wrapper that delegates to pkg/router/scanner.
// The original implementation has been moved to backend/pkg/router/scanner/.

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"

	pkgScanner "backend/pkg/router/scanner"
)

// Device delegates to pkgScanner.Device.
type Device = pkgScanner.Device

// RouterOSInfo delegates to pkgScanner.RouterOSInfo.
type RouterOSInfo = pkgScanner.RouterOSInfo

// Scanner manages concurrent network scanning (wraps pkg scanner defaults).
type Scanner struct {
	tasks       map[string]*ScanTask
	mu          sync.RWMutex
	maxWorkers  int
	timeout     time.Duration
	targetPorts []int
}

// Global scanner instance
var scanner = &Scanner{
	tasks:       make(map[string]*ScanTask),
	maxWorkers:  20,
	timeout:     2 * time.Second,
	targetPorts: []int{80, 443, 8728, 8729, 8291},
}

// HTTP API focused ports for automatic scanning
var httpApiPorts = []int{80, 443}

// handleScan starts a new network scan.
func handleScan(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		errorResponse(w, http.StatusMethodNotAllowed, "method_not_allowed", "Only POST method is allowed")
		return
	}

	var req struct {
		Subnet string `json:"subnet"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		errorResponse(w, http.StatusBadRequest, "invalid_json", "Invalid JSON format")
		return
	}

	if req.Subnet == "" {
		errorResponse(w, http.StatusBadRequest, "missing_subnet", "Subnet is required")
		return
	}

	taskID := fmt.Sprintf("scan_%d", time.Now().UnixNano())

	_, cancel := context.WithCancel(context.Background())
	task := &ScanTask{
		ID:        taskID,
		Subnet:    req.Subnet,
		StartTime: time.Now(),
		Status:    "running",
		Progress:  0,
		Results:   make([]Device, 0),
		Cancel:    cancel,
	}

	scannerPool.mu.Lock()
	scannerPool.activeTasks[taskID] = task
	scannerPool.mu.Unlock()

	go processScanTask(task)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"task_id": taskID,
		"status":  "started",
		"message": "Scan started successfully",
	})
}

// handleScanStatus returns the status of a scan.
func handleScanStatus(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		errorResponse(w, http.StatusMethodNotAllowed, "method_not_allowed", "Only GET method is allowed")
		return
	}

	taskID := r.URL.Query().Get("task_id")
	if taskID == "" {
		errorResponse(w, http.StatusBadRequest, "missing_task_id", "task_id parameter is required")
		return
	}

	scannerPool.mu.RLock()
	task, exists := scannerPool.activeTasks[taskID]
	scannerPool.mu.RUnlock()

	if !exists {
		errorResponse(w, http.StatusNotFound, "task_not_found", "Task not found")
		return
	}

	response := map[string]interface{}{
		"task_id":    task.ID,
		"subnet":     task.Subnet,
		"start_time": task.StartTime.Unix(),
		"status":     task.Status,
		"progress":   task.Progress,
		"results":    task.Results,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// handleScanStop stops a running scan.
func handleScanStop(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		errorResponse(w, http.StatusMethodNotAllowed, "method_not_allowed", "Only POST method is allowed")
		return
	}

	var req struct {
		TaskID string `json:"task_id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		errorResponse(w, http.StatusBadRequest, "invalid_json", "Invalid JSON format")
		return
	}

	if req.TaskID == "" {
		errorResponse(w, http.StatusBadRequest, "missing_task_id", "task_id is required")
		return
	}

	scannerPool.mu.RLock()
	task, exists := scannerPool.activeTasks[req.TaskID]
	scannerPool.mu.RUnlock()

	if !exists {
		errorResponse(w, http.StatusNotFound, "task_not_found", "Task not found")
		return
	}

	if task.Cancel != nil {
		task.Cancel()
	}
	task.Status = "cancelled"

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"task_id": req.TaskID,
		"status":  "cancelled",
		"message": "Scan stopped successfully",
	})
}

// handleAutoScan starts an automatic gateway scan.
func handleAutoScan(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		errorResponse(w, http.StatusMethodNotAllowed, "method_not_allowed", "Only POST method is allowed")
		return
	}

	taskID := fmt.Sprintf("auto_scan_%d", time.Now().UnixNano())

	_, cancel := context.WithCancel(context.Background())
	task := &ScanTask{
		ID:        taskID,
		Subnet:    "192.168.0-255.1",
		StartTime: time.Now(),
		Status:    "running",
		Progress:  0,
		Results:   make([]Device, 0),
		Cancel:    cancel,
	}

	scannerPool.mu.Lock()
	scannerPool.activeTasks[taskID] = task
	scannerPool.mu.Unlock()

	go processGatewayScanTask(task)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"task_id": taskID,
		"status":  "started",
		"message": "Gateway auto-scan started successfully",
	})
}

// processGatewayScanTask delegates to pkg/router/scanner.ProcessGatewayScan.
func processGatewayScanTask(task *ScanTask) {
	ctx := context.Background()
	if task.Cancel != nil {
		var cancel context.CancelFunc
		ctx, cancel = context.WithCancel(ctx)
		defer cancel()
	}

	cfg := pkgScanner.Config{
		MaxWorkers: scanner.maxWorkers,
		Timeout:    scanner.timeout,
	}

	var mu sync.Mutex
	pkgScanner.ProcessGatewayScan(ctx, cfg, func(device pkgScanner.Device) {
		mu.Lock()
		task.Results = append(task.Results, device)
		mu.Unlock()
	})

	task.Status = "completed"
	task.Progress = 100

	go func() {
		time.Sleep(30 * time.Minute)
		scannerPool.mu.Lock()
		delete(scannerPool.activeTasks, task.ID)
		scannerPool.mu.Unlock()
	}()
}

// processScanTask delegates to pkg/router/scanner for the actual scanning.
func processScanTask(task *ScanTask) {
	ctx := context.Background()
	if task.Cancel != nil {
		var cancel context.CancelFunc
		ctx, cancel = context.WithCancel(ctx)
		defer cancel()
	}

	ips, err := pkgScanner.ParseIPRange(task.Subnet)
	if err != nil {
		task.Status = "error"
		return
	}

	totalIPs := len(ips)
	if totalIPs == 0 {
		task.Status = "completed"
		task.Progress = 100
		return
	}

	jobs := make(chan string, scanner.maxWorkers)
	results := make(chan Device, scanner.maxWorkers)

	var wg sync.WaitGroup
	for i := 0; i < scanner.maxWorkers; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for ip := range jobs {
				select {
				case <-ctx.Done():
					return
				default:
					if device := pkgScanner.ScanIP(ctx, ip, scanner.targetPorts, scanner.timeout); device != nil {
						results <- *device
					}
				}
			}
		}()
	}

	go func() {
		wg.Wait()
		close(results)
	}()

	processed := 0
	var deviceResults []Device
	go func() {
		for device := range results {
			processed++
			progress := (processed * 100) / totalIPs
			task.Progress = progress
			deviceResults = append(deviceResults, device)
			task.Results = deviceResults
		}
	}()

	go func() {
		defer close(jobs)
		for _, ip := range ips {
			select {
			case <-ctx.Done():
				return
			case jobs <- ip:
			}
		}
	}()

	wg.Wait()

	task.Status = "completed"
	task.Progress = 100

	go func() {
		time.Sleep(1 * time.Hour)
		scannerPool.mu.Lock()
		delete(scannerPool.activeTasks, task.ID)
		scannerPool.mu.Unlock()
	}()
}
