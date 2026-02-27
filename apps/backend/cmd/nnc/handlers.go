package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"runtime"
	"sync"
	"time"

	"github.com/labstack/echo/v4"

	"backend/oui"
)

// ScannerPool manages concurrent scan tasks.
type ScannerPool struct {
	maxWorkers  int
	tasks       chan *ScanTask
	mu          sync.RWMutex
	activeTasks map[string]*ScanTask
}

// ScanTask represents an in-progress network scan.
type ScanTask struct {
	ID        string
	Subnet    string
	StartTime time.Time
	Status    string
	Progress  int
	Results   []Device
	Cancel    context.CancelFunc
	mu        sync.RWMutex // protects Progress, Status, and Results
}

// NewScannerPool creates a new scanner pool with the given worker count.
func NewScannerPool(maxWorkers int) *ScannerPool {
	pool := &ScannerPool{
		maxWorkers:  maxWorkers,
		tasks:       make(chan *ScanTask, maxWorkers*2),
		activeTasks: make(map[string]*ScanTask),
	}
	for i := 0; i < maxWorkers; i++ {
		go pool.worker()
	}
	return pool
}

func (p *ScannerPool) worker() {
	for task := range p.tasks {
		ctx := context.Background()
		processScanTask(ctx, task)
	}
}

var (
	scannerPool     *ScannerPool
	serverStartTime = time.Now()
)

// ServerVersion is set by build-tagged init() functions.
var ServerVersion = "dev"

// ErrorResponse is the JSON error payload.
type ErrorResponse struct {
	Error     string `json:"error"`
	Message   string `json:"message"`
	Timestamp int64  `json:"timestamp"`
}

// HealthResponse is the JSON health check payload.
type HealthResponse struct {
	Status    string `json:"status"`
	Timestamp int64  `json:"timestamp"`
	Memory    uint64 `json:"memory_mb"`
	Version   string `json:"version"`
	Uptime    string `json:"uptime"`
}

// echoHealthHandler handles GET /health.
func echoHealthHandler(c echo.Context) error {
	var m runtime.MemStats
	runtime.ReadMemStats(&m)
	uptime := time.Since(serverStartTime).Round(time.Second)
	if err := c.JSON(http.StatusOK, HealthResponse{
		Status:    "healthy",
		Timestamp: time.Now().Unix(),
		Memory:    m.Alloc / 1024 / 1024,
		Version:   ServerVersion,
		Uptime:    uptime.String(),
	}); err != nil {
		return fmt.Errorf("send health response: %w", err)
	}
	return nil
}

func echoScanHandler(c echo.Context) error {
	handleScan(c.Response(), c.Request())
	return nil
}

func echoAutoScanHandler(c echo.Context) error {
	handleAutoScan(c.Response(), c.Request())
	return nil
}

func echoScanStatusHandler(c echo.Context) error {
	handleScanStatus(c.Response(), c.Request())
	return nil
}

func echoScanStopHandler(c echo.Context) error {
	handleScanStop(c.Response(), c.Request())
	return nil
}

func echoRouterProxyHandler(c echo.Context) error {
	handleRouterProxy(c.Response(), c.Request())
	return nil
}

func echoBatchJobsHandler(c echo.Context) error {
	handleBatchJobs(c.Response(), c.Request())
	return nil
}

func echoOUILookupHandler(c echo.Context) error {
	macAddress := c.Param("mac")
	if macAddress == "" {
		if err := c.JSON(http.StatusBadRequest, map[string]string{"error": "MAC address is required"}); err != nil {
			return fmt.Errorf("send error response: %w", err)
		}
		return nil
	}
	db := oui.GetDatabase()
	vendor, found := db.Lookup(macAddress)
	c.Response().Header().Set("Cache-Control", "public, max-age=86400")
	if err := c.JSON(http.StatusOK, map[string]interface{}{
		"mac": macAddress, "vendor": vendor, "found": found,
	}); err != nil {
		return fmt.Errorf("send lookup response: %w", err)
	}
	return nil
}

func echoOUIBatchHandler(c echo.Context) error {
	var request struct {
		MacAddresses []string `json:"macAddresses"`
	}
	if err := c.Bind(&request); err != nil {
		if errResp := c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request body"}); errResp != nil {
			return fmt.Errorf("send bind error response: %w", errResp)
		}
		return nil
	}
	if len(request.MacAddresses) == 0 {
		if err := c.JSON(http.StatusBadRequest, map[string]string{"error": "macAddresses array is required"}); err != nil {
			return fmt.Errorf("send array required error response: %w", err)
		}
		return nil
	}
	if len(request.MacAddresses) > 100 {
		if err := c.JSON(http.StatusBadRequest, map[string]string{"error": "Maximum 100 MAC addresses per request"}); err != nil {
			return fmt.Errorf("send max addresses error response: %w", err)
		}
		return nil
	}
	db := oui.GetDatabase()
	results := db.LookupBatch(request.MacAddresses)
	c.Response().Header().Set("Cache-Control", "public, max-age=86400")
	if err := c.JSON(http.StatusOK, map[string]interface{}{"results": results, "count": len(results)}); err != nil {
		return fmt.Errorf("send batch response: %w", err)
	}
	return nil
}

func echoOUIStatsHandler(c echo.Context) error {
	db := oui.GetDatabase()
	size := db.Size()
	c.Response().Header().Set("Cache-Control", "public, max-age=3600")
	if err := c.JSON(http.StatusOK, map[string]interface{}{"entries": size, "loaded": size > 0}); err != nil {
		return fmt.Errorf("send stats response: %w", err)
	}
	return nil
}

// writeJSONResponse sends a JSON response and logs encoding errors.
func writeJSONResponse(w http.ResponseWriter, statusCode int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	if err := json.NewEncoder(w).Encode(data); err != nil {
		fmt.Fprintf(os.Stderr, "ERROR: Failed to encode JSON response: %v\n", err)
		// Attempt to write error indicator if possible (best effort)
		if _, err := w.Write([]byte(`{"error":"response_encoding_failed"}`)); err != nil {
			fmt.Fprintf(os.Stderr, "ERROR: Failed to write error response: %v\n", err)
		}
	}
}

// errorResponse sends a JSON error (legacy http.ResponseWriter version).
func errorResponse(w http.ResponseWriter, statusCode int, err, message string) {
	writeJSONResponse(w, statusCode, ErrorResponse{
		Error: err, Message: message, Timestamp: time.Now().Unix(),
	})
}
