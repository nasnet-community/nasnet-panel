package main

import (
	"context"
	"encoding/json"
	"net/http"
	"runtime"
	"sync"
	"time"

	"github.com/labstack/echo/v4"
)

// Shared scanner pool types and helpers (used by dev and prod)

type ScannerPool struct {
	maxWorkers  int
	tasks       chan ScanTask
	wg          sync.WaitGroup
	mu          sync.RWMutex
	activeTasks map[string]*ScanTask
}

type ScanTask struct {
	ID        string
	Subnet    string
	StartTime time.Time
	Status    string
	Progress  int
	Results   []Device
	Cancel    context.CancelFunc
}

func NewScannerPool(maxWorkers int) *ScannerPool {
	pool := &ScannerPool{
		maxWorkers:  maxWorkers,
		tasks:       make(chan ScanTask, maxWorkers*2),
		activeTasks: make(map[string]*ScanTask),
	}
	for i := 0; i < maxWorkers; i++ {
		go pool.worker()
	}
	return pool
}

func (p *ScannerPool) worker() {
	for task := range p.tasks {
		processScanTask(&task)
	}
}

var (
	scannerPool     *ScannerPool
	serverStartTime = time.Now()
)

// Error payload used in errorResponse
type ErrorResponse struct {
	Error     string `json:"error"`
	Message   string `json:"message"`
	Timestamp int64  `json:"timestamp"`
}

// Health payload; version string is provided by main via ServerVersion
type HealthResponse struct {
	Status    string `json:"status"`
	Timestamp int64  `json:"timestamp"`
	Memory    uint64 `json:"memory_mb"`
	Version   string `json:"version"`
	Uptime    string `json:"uptime"`
}

// ServerVersion should be set by main (dev/prod)
var ServerVersion = "dev"

// =============================================================================
// Echo Handler Wrappers
// =============================================================================
// These wrap the existing handlers for Echo v4 compatibility

// echoHealthHandler handles health check requests (Echo version)
func echoHealthHandler(c echo.Context) error {
	var m runtime.MemStats
	runtime.ReadMemStats(&m)

	uptime := time.Since(serverStartTime).Round(time.Second)

	response := HealthResponse{
		Status:    "healthy",
		Timestamp: time.Now().Unix(),
		Memory:    m.Alloc / 1024 / 1024, // MB
		Version:   ServerVersion,
		Uptime:    uptime.String(),
	}

	return c.JSON(http.StatusOK, response)
}

// echoErrorResponse sends a JSON error response (Echo version)
func echoErrorResponse(c echo.Context, statusCode int, err string, message string) error {
	return c.JSON(statusCode, ErrorResponse{
		Error:     err,
		Message:   message,
		Timestamp: time.Now().Unix(),
	})
}

// echoScanHandler handles scan requests (Echo version)
func echoScanHandler(c echo.Context) error {
	if c.Request().Method != http.MethodPost {
		return echoErrorResponse(c, http.StatusMethodNotAllowed, "method_not_allowed", "Only POST method is allowed")
	}
	handleScan(c.Response(), c.Request())
	return nil
}

// echoScanStatusHandler handles scan status requests (Echo version)
func echoScanStatusHandler(c echo.Context) error {
	if c.Request().Method != http.MethodGet {
		return echoErrorResponse(c, http.StatusMethodNotAllowed, "method_not_allowed", "Only GET method is allowed")
	}
	handleScanStatus(c.Response(), c.Request())
	return nil
}

// echoScanStopHandler handles scan stop requests (Echo version)
func echoScanStopHandler(c echo.Context) error {
	if c.Request().Method != http.MethodPost {
		return echoErrorResponse(c, http.StatusMethodNotAllowed, "method_not_allowed", "Only POST method is allowed")
	}
	handleScanStop(c.Response(), c.Request())
	return nil
}

// echoAutoScanHandler handles auto scan requests (Echo version)
func echoAutoScanHandler(c echo.Context) error {
	if c.Request().Method != http.MethodPost {
		return echoErrorResponse(c, http.StatusMethodNotAllowed, "method_not_allowed", "Only POST method is allowed")
	}
	handleAutoScan(c.Response(), c.Request())
	return nil
}

// echoRouterProxyHandler handles router proxy requests (Echo version)
func echoRouterProxyHandler(c echo.Context) error {
	handleRouterProxy(c.Response(), c.Request())
	return nil
}

// echoBatchJobsHandler handles batch job requests (Echo version)
func echoBatchJobsHandler(c echo.Context) error {
	handleBatchJobs(c.Response(), c.Request())
	return nil
}

// =============================================================================
// Legacy HTTP Handlers (for backward compatibility)
// =============================================================================

// Shared health handler (legacy http.ResponseWriter version)
func healthHandler(w http.ResponseWriter, r *http.Request) {
	var m runtime.MemStats
	runtime.ReadMemStats(&m)

	uptime := time.Since(serverStartTime).Round(time.Second)

	response := HealthResponse{
		Status:    "healthy",
		Timestamp: time.Now().Unix(),
		Memory:    m.Alloc / 1024 / 1024, // MB
		Version:   ServerVersion,
		Uptime:    uptime.String(),
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "no-cache")
	_ = json.NewEncoder(w).Encode(response)
}

// Shared JSON error helper (keeps permissive CORS for dev/frontends)
func errorResponse(w http.ResponseWriter, statusCode int, err string, message string) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	_ = json.NewEncoder(w).Encode(ErrorResponse{
		Error:     err,
		Message:   message,
		Timestamp: time.Now().Unix(),
	})
}

// Shared thin handlers that validate HTTP methods and delegate to implementations
func scanHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		errorResponse(w, http.StatusMethodNotAllowed, "method_not_allowed", "Only POST method is allowed")
		return
	}
	handleScan(w, r)
}

func scanStatusHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		errorResponse(w, http.StatusMethodNotAllowed, "method_not_allowed", "Only GET method is allowed")
		return
	}
	handleScanStatus(w, r)
}

func scanStopHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		errorResponse(w, http.StatusMethodNotAllowed, "method_not_allowed", "Only POST method is allowed")
		return
	}
	handleScanStop(w, r)
}

func autoScanHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		errorResponse(w, http.StatusMethodNotAllowed, "method_not_allowed", "Only POST method is allowed")
		return
	}
	handleAutoScan(w, r)
}

func routerProxyHandler(w http.ResponseWriter, r *http.Request) {
	handleRouterProxy(w, r)
}
