package main

// Thin wrappers that delegate to pkg/router/* packages.
// These maintain backward compatibility until the legacy API routes
// are fully migrated to GraphQL resolvers.

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"

	"backend/internal/router/adapters/mikrotik"
	"backend/internal/router/adapters/mikrotik/parser"
	"backend/internal/router/batch"
	pkgScanner "backend/internal/router/scanner"
)

// ========== Scanner ==========

type Device = pkgScanner.Device
type RouterOSInfo = pkgScanner.RouterOSInfo

type Scanner struct {
	tasks       map[string]*ScanTask
	maxWorkers  int
	timeout     time.Duration
	targetPorts []int
}

const statusCompleted = "completed"

var scanner = &Scanner{
	tasks:       make(map[string]*ScanTask),
	maxWorkers:  20,
	timeout:     2 * time.Second,
	targetPorts: []int{80, 443, 8728, 8729, 8291},
}

func handleScan(w http.ResponseWriter, r *http.Request) {
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
	ctx, cancel := context.WithCancel(context.Background())
	task := &ScanTask{
		ID: taskID, Subnet: req.Subnet, StartTime: time.Now(),
		Status: "running", Results: make([]Device, 0), Cancel: cancel,
	}
	scannerPool.mu.Lock()
	scannerPool.activeTasks[taskID] = task
	scannerPool.mu.Unlock()
	go processScanTask(ctx, task) //nolint:contextcheck // intentional background context for async task

	writeJSONResponse(w, http.StatusOK, map[string]interface{}{
		"task_id": taskID, "status": "started", "message": "Scan started successfully",
	})
}

func handleScanStatus(w http.ResponseWriter, r *http.Request) {
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
	writeJSONResponse(w, http.StatusOK, map[string]interface{}{
		"task_id": task.ID, "subnet": task.Subnet, "start_time": task.StartTime.Unix(),
		"status": task.Status, "progress": task.Progress, "results": task.Results,
	})
}

func handleScanStop(w http.ResponseWriter, r *http.Request) {
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
	task.Status = "canceled"
	writeJSONResponse(w, http.StatusOK, map[string]interface{}{
		"task_id": req.TaskID, "status": "canceled", "message": "Scan stopped successfully",
	})
}

func handleAutoScan(w http.ResponseWriter, _ *http.Request) {
	taskID := fmt.Sprintf("auto_scan_%d", time.Now().UnixNano())
	ctx, cancel := context.WithCancel(context.Background())
	task := &ScanTask{
		ID: taskID, Subnet: "192.168.0-255.1", StartTime: time.Now(),
		Status: "running", Results: make([]Device, 0), Cancel: cancel,
	}
	scannerPool.mu.Lock()
	scannerPool.activeTasks[taskID] = task
	scannerPool.mu.Unlock()
	go processGatewayScanTask(ctx, task) //nolint:contextcheck // intentional background context for async task

	writeJSONResponse(w, http.StatusOK, map[string]interface{}{
		"task_id": taskID, "status": "started", "message": "Gateway auto-scan started successfully",
	})
}

func processGatewayScanTask(ctx context.Context, task *ScanTask) {
	cfg := pkgScanner.Config{MaxWorkers: scanner.maxWorkers, Timeout: scanner.timeout}
	var mu sync.Mutex
	pkgScanner.ProcessGatewayScan(ctx, cfg, func(device pkgScanner.Device) {
		mu.Lock()
		task.Results = append(task.Results, device)
		mu.Unlock()
	})
	task.Status = statusCompleted
	task.Progress = 100
	go func() {
		time.Sleep(30 * time.Minute)
		scannerPool.mu.Lock()
		delete(scannerPool.activeTasks, task.ID)
		scannerPool.mu.Unlock()
	}()
}

func processScanTask(ctx context.Context, task *ScanTask) {
	ips, err := pkgScanner.ParseIPRange(task.Subnet)
	if err != nil {
		task.Status = "error"
		return
	}
	if len(ips) == 0 {
		task.Status = statusCompleted
		task.Progress = 100
		return
	}
	totalIPs := len(ips)
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
	go func() { wg.Wait(); close(results) }()

	processed := 0
	var deviceResults []Device
	go func() {
		for device := range results {
			processed++
			task.Progress = (processed * 100) / totalIPs
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
	task.Status = statusCompleted
	task.Progress = 100
	go func() {
		time.Sleep(1 * time.Hour)
		scannerPool.mu.Lock()
		delete(scannerPool.activeTasks, task.ID)
		scannerPool.mu.Unlock()
	}()
}

// ========== Router Proxy ==========

type RouterProxyRequest = mikrotik.RouterProxyRequest
type RouterProxyResponse = mikrotik.RouterProxyResponse

func handleRouterProxy(w http.ResponseWriter, r *http.Request) {
	mikrotik.HandleRouterProxy(w, r)
}

// ========== Batch ==========

type JobStatus = batch.JobStatus
type BatchJob = batch.Job
type BatchJobRequest = batch.JobRequest
type BatchJobSubmitRequest = batch.SubmitRequest

func handleBatchJobs(w http.ResponseWriter, r *http.Request) {
	batch.HandleBatchJobs(w, r)
}

// ========== CLI Parser ==========

type CLICommand = parser.CLICommand
type CLIParser = parser.CLIParser

var NewCLIParser = parser.NewCLIParser

// ========== Client Aliases ==========

type ROSClient = mikrotik.ROSClient
type SSHClient = mikrotik.SSHClient
type TelnetClient = mikrotik.TelnetClient

var NewROSClient = mikrotik.NewROSClient
var NewSSHClientPool = mikrotik.NewSSHClientPool
var NewTelnetClientPool = mikrotik.NewTelnetClientPool
