package scan

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"nasnet-panel/internal/handler/common"
	pkgScanner "nasnet-panel/internal/scanner"

	"github.com/labstack/echo/v4"
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
		return common.ErrorResponse(c, http.StatusBadRequest, "Invalid request format", err)
	}

	if req.IP == "" {
		return common.ErrorResponse(c, http.StatusBadRequest, "IP parameter is required", nil)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	device := pkgScanner.ScanIP(ctx, req.IP, scanConfig.TargetPorts, scanConfig.Timeout)

	var result IPVerifyResponse
	result.IP = req.IP

	if device == nil {
		result.IsOnline = false
		result.IsMikroTik = false
		return common.SuccessResponse(c, http.StatusOK, "IP verification completed", result)
	}

	result.Hostname = device.Hostname
	result.IsOnline = true
	result.IsMikroTik = device.Vendor == "MikroTik"
	result.Ports = device.Ports
	result.Services = device.Services

	if result.IsMikroTik {
		for _, port := range []int{8728, 8729, 8291} {
			if pkgScanner.ContainsPort(device.Ports, port) {
				var info *pkgScanner.RouterOSInfo
				if port == 8728 || port == 8729 {
					info = pkgScanner.CheckNativeRouterOSAPI(ctx, req.IP, port, scanConfig.Timeout)
				} else {
					info = pkgScanner.CheckWinBoxAPI(ctx, req.IP, port, scanConfig.Timeout)
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

	return common.SuccessResponse(c, http.StatusOK, "IP verification completed", result)
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
		return common.ErrorResponse(c, http.StatusBadRequest, "Invalid request format", err)
	}

	if req.Subnet == "" {
		return common.ErrorResponse(c, http.StatusBadRequest, "Subnet parameter is required", nil)
	}

	taskID := fmt.Sprintf("scan_%d", time.Now().UnixNano())
	ctx, cancel := context.WithCancel(context.Background())

	task := &Task{
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

	return common.SuccessResponse(c, http.StatusOK, "Scan started successfully", map[string]interface{}{
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
		return common.ErrorResponse(c, http.StatusBadRequest, "taskId parameter is required", nil)
	}

	scannerPool.mu.RLock()
	task, exists := scannerPool.activeTasks[taskID]
	scannerPool.mu.RUnlock()

	if !exists {
		return common.ErrorResponse(c, http.StatusNotFound, "Task not found", nil)
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

	return common.SuccessResponse(c, http.StatusOK, "Scan status retrieved", data)
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
		return common.ErrorResponse(c, http.StatusBadRequest, "task_id parameter is required", nil)
	}

	scannerPool.mu.RLock()
	task, exists := scannerPool.activeTasks[taskID]
	scannerPool.mu.RUnlock()

	if !exists {
		return common.ErrorResponse(c, http.StatusNotFound, "Task not found", nil)
	}

	if task.Cancel != nil {
		task.Cancel()
	}

	task.mu.Lock()
	task.Status = "canceled"
	task.mu.Unlock()

	return common.SuccessResponse(c, http.StatusOK, "Scan stopped successfully", map[string]interface{}{
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

	task := &Task{
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

	return common.SuccessResponse(c, http.StatusOK, "Gateway auto-scan started successfully", map[string]interface{}{
		"task_id": taskID,
		"status":  "started",
	})
}
