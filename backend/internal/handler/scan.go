package handler

import (
	"context"
	"fmt"
	"net/http"
	"sort"
	"sync"
	"time"

	pkgScanner "nasnet-panel/internal/scanner"
	"nasnet-panel/pkg/utils"

	"github.com/labstack/echo/v4"
)

type ScanTask struct {
	ID        string
	Subnet    string
	Status    string
	Progress  int
	StartTime time.Time
	Results   []Device
	Cancel    context.CancelFunc
	mu        sync.RWMutex
}

type ScanPool struct {
	activeTasks map[string]*ScanTask
	mu          sync.RWMutex
}

var (
	scannerPool = &ScanPool{
		activeTasks: make(map[string]*ScanTask),
	}
	scanConfig = pkgScanner.Config{
		MaxWorkers:  20,
		Timeout:     200 * time.Millisecond,
		TargetPorts: []int{80, 443, 8728, 8729, 8291},
	}
	statusCompleted = "completed"
)

// HandleVerifyIP godoc
// @Summary Verify single IP
// @Description Check if a single IP is a MikroTik device and its online status
// @Tags Scanner
// @Accept json
// @Produce json
// @Param request body IPVerifyRequest true "IP to verify"
// @Success 200 {object} map[string]interface{} "IP verification result"
// @Failure 400 {object} map[string]interface{} "Bad request"
// @Router /api/scan/verify [post]
func HandleVerifyIP(c echo.Context) error {
	var req IPVerifyRequest
	if err := c.Bind(&req); err != nil {
		return ErrorResponse(c, http.StatusBadRequest, "Invalid request format", err)
	}

	if req.IP == "" {
		return ErrorResponse(c, http.StatusBadRequest, "IP parameter is required", nil)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	device := pkgScanner.ScanIP(ctx, req.IP, scanConfig.TargetPorts, scanConfig.Timeout)

	var result IPVerifyResponse
	result.IP = req.IP

	if device == nil {
		result.IsOnline = false
		result.IsMikroTik = false
		return SuccessResponse(c, http.StatusOK, "IP verification completed", result)
	}

	result.Hostname = device.Hostname
	result.IsOnline = true
	result.IsMikroTik = device.Vendor == "MikroTik"
	result.Ports = device.Ports
	result.Services = device.Services

	if result.IsMikroTik {
		for _, port := range []int{80, 443, 8728, 8729, 8291} {
			if pkgScanner.ContainsPort(device.Ports, port) {
				var info *pkgScanner.RouterOSInfo
				if port == 8728 || port == 8729 {
					info = pkgScanner.CheckNativeRouterOSAPI(ctx, req.IP, port, scanConfig.Timeout)
				} else if port == 8291 {
					info = pkgScanner.CheckWinBoxAPI(ctx, req.IP, port, scanConfig.Timeout)
				} else {
					info = pkgScanner.CheckRouterOSAPI(ctx, req.IP, port, scanConfig.Timeout)
				}
				if info != nil {
					confidence := pkgScanner.CalculateNativeAPIConfidence(device.Ports)
					if confidence > 0 {
						info.Confidence = confidence
					}
					result.RouterOS = &RouterOSVerifyInfo{
						Version:      info.Version,
						Architecture: info.Architecture,
						BoardName:    info.BoardName,
						Confidence:   info.Confidence,
					}
					break
				}
			}
		}
	}

	return SuccessResponse(c, http.StatusOK, "IP verification completed", result)
}

// HandleStartScan godoc
// @Summary Start network scan
// @Description Start scanning a subnet for RouterOS devices
// @Tags Scanner
// @Accept json
// @Produce json
// @Param request body ScanRequest true "Subnet to scan"
// @Success 200 {object} map[string]interface{} "Scan started"
// @Failure 400 {object} map[string]interface{} "Bad request"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Router /api/scan [post]
func HandleStartScan(c echo.Context) error {
	var req ScanRequest
	if err := c.Bind(&req); err != nil {
		return ErrorResponse(c, http.StatusBadRequest, "Invalid request format", err)
	}

	if req.Subnet == "" {
		return ErrorResponse(c, http.StatusBadRequest, "Subnet parameter is required", nil)
	}

	taskID := fmt.Sprintf("scan_%d", time.Now().UnixNano())
	ctx, cancel := context.WithCancel(context.Background())

	task := &ScanTask{
		ID:        taskID,
		Subnet:    req.Subnet,
		StartTime: time.Now(),
		Status:    "running",
		Results:   make([]Device, 0),
		Cancel:    cancel,
	}

	scannerPool.mu.Lock()
	scannerPool.activeTasks[taskID] = task
	scannerPool.mu.Unlock()

	go processScanTask(ctx, task)

	return SuccessResponse(c, http.StatusOK, "Scan started successfully", map[string]interface{}{
		"task_id": taskID,
		"status":  "started",
	})
}

// HandleScanStatus godoc
// @Summary Get scan status
// @Description Get the status and results of a network scan
// @Tags Scanner
// @Accept json
// @Produce json
// @Param taskId path string true "Task ID from scan start"
// @Success 200 {object} map[string]interface{} "Scan status"
// @Failure 400 {object} map[string]interface{} "Bad request"
// @Failure 404 {object} map[string]interface{} "Task not found"
// @Router /api/scan/status/{taskId} [get].
func HandleScanStatus(c echo.Context) error {
	taskID := c.Param("taskId")
	if taskID == "" {
		return ErrorResponse(c, http.StatusBadRequest, "taskId parameter is required", nil)
	}

	scannerPool.mu.RLock()
	task, exists := scannerPool.activeTasks[taskID]
	scannerPool.mu.RUnlock()

	if !exists {
		return ErrorResponse(c, http.StatusNotFound, "Task not found", nil)
	}

	task.mu.RLock()
	defer task.mu.RUnlock()

	sortedResults := sortDevicesByIP(task.Results)

	data := &ScanTaskData{
		TaskID:    task.ID,
		Subnet:    task.Subnet,
		Status:    task.Status,
		Progress:  task.Progress,
		StartTime: task.StartTime.Unix(),
		Results:   sortedResults,
	}

	return SuccessResponse(c, http.StatusOK, "Scan status retrieved", data)
}

// HandleStopScan godoc
// @Summary Stop network scan
// @Description Stop an ongoing network scan
// @Tags Scanner
// @Accept json
// @Produce json
// @Param task_id query string true "Task ID from scan start"
// @Success 200 {object} map[string]interface{} "Scan stopped"
// @Failure 400 {object} map[string]interface{} "Bad request"
// @Failure 404 {object} map[string]interface{} "Task not found"
// @Router /api/scan/stop [post]
func HandleStopScan(c echo.Context) error {
	taskID := c.QueryParam("task_id")
	if taskID == "" {
		return ErrorResponse(c, http.StatusBadRequest, "task_id parameter is required", nil)
	}

	scannerPool.mu.RLock()
	task, exists := scannerPool.activeTasks[taskID]
	scannerPool.mu.RUnlock()

	if !exists {
		return ErrorResponse(c, http.StatusNotFound, "Task not found", nil)
	}

	if task.Cancel != nil {
		task.Cancel()
	}

	task.mu.Lock()
	task.Status = "canceled"
	task.mu.Unlock()

	return SuccessResponse(c, http.StatusOK, "Scan stopped successfully", map[string]interface{}{
		"task_id": taskID,
		"status":  "canceled",
	})
}

// HandleAutoScan godoc
// @Summary Start auto gateway scan
// @Description Start automatic scan for RouterOS devices on gateway
// @Tags Scanner
// @Accept json
// @Produce json
// @Success 200 {object} map[string]interface{} "Auto scan started"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Router /api/scan/auto [post]
func HandleAutoScan(c echo.Context) error {
	taskID := fmt.Sprintf("auto_scan_%d", time.Now().UnixNano())
	ctx, cancel := context.WithCancel(context.Background())

	task := &ScanTask{
		ID:        taskID,
		Subnet:    "auto",
		StartTime: time.Now(),
		Status:    "running",
		Results:   make([]Device, 0),
		Cancel:    cancel,
	}

	scannerPool.mu.Lock()
	scannerPool.activeTasks[taskID] = task
	scannerPool.mu.Unlock()

	go processGatewayScanTask(ctx, task)

	return SuccessResponse(c, http.StatusOK, "Gateway auto-scan started successfully", map[string]interface{}{
		"task_id": taskID,
		"status":  "started",
	})
}

func processGatewayScanTask(ctx context.Context, task *ScanTask) {
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

func processScanTask(ctx context.Context, task *ScanTask) {
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
