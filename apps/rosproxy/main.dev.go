//go:build dev
// +build dev

package main

import (
	"context"
	"flag"
	"log"
	"net/http"
	"os"
	"os/signal"
	"runtime"
	"syscall"
	"time"
)

// Development MikroTik RouterOS Management Server
// API-only server for development with hot-reload support
// No embedded frontend - frontend served separately by Vite

func init() {
	// Development-optimized settings
	runtime.GOMAXPROCS(2)

	// Initialize scanner pool with more workers for development
	scannerPool = NewScannerPool(4)

	log.SetFlags(log.LstdFlags | log.Lshortfile)
	log.Println("Development MikroTik server initialized")
}

func init() { ServerVersion = "development-v2.0" }

// CORS middleware for handling cross-origin requests with panic recovery
func corsMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Wrap response writer to ensure CORS headers on all responses
		corsWriter := NewCORSResponseWriter(w)

		// Log incoming request for debugging
		log.Printf("%s %s from %s", r.Method, r.URL.Path, r.RemoteAddr)

		if r.Method == "OPTIONS" {
			corsWriter.WriteHeader(http.StatusOK)
			return
		}

		// Panic recovery to prevent crashes from breaking CORS
		defer func() {
			if err := recover(); err != nil {
				log.Printf("[PANIC RECOVERY] Handler panicked on %s %s: %v", r.Method, r.URL.Path, err)

				// Send error response without crashing
				if !isResponseWritten(corsWriter) {
					errorResponse(corsWriter, http.StatusInternalServerError, "internal_error",
						"Internal server error occurred while processing request")
				}
			}
		}()

		next(corsWriter, r)
	}
}

// CORSResponseWriter wraps http.ResponseWriter to ensure CORS headers on all responses
type CORSResponseWriter struct {
	http.ResponseWriter
	headerSet bool
}

// NewCORSResponseWriter creates a new CORS-enabled response writer
func NewCORSResponseWriter(w http.ResponseWriter) *CORSResponseWriter {
	return &CORSResponseWriter{ResponseWriter: w}
}

// Write ensures CORS headers are set before writing response
func (c *CORSResponseWriter) Write(data []byte) (int, error) {
	c.ensureCORSHeaders()
	return c.ResponseWriter.Write(data)
}

// WriteHeader ensures CORS headers are set before writing status
func (c *CORSResponseWriter) WriteHeader(statusCode int) {
	c.ensureCORSHeaders()
	c.ResponseWriter.WriteHeader(statusCode)
}

// ensureCORSHeaders sets CORS headers if not already set
func (c *CORSResponseWriter) ensureCORSHeaders() {
	if !c.headerSet {
		c.ResponseWriter.Header().Set("Access-Control-Allow-Origin", "*")
		c.ResponseWriter.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.ResponseWriter.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
		c.ResponseWriter.Header().Set("Access-Control-Max-Age", "3600")
		c.headerSet = true
	}
}

// Helper function to check if response has been written
func isResponseWritten(w http.ResponseWriter) bool {
	return false
}

// healthHandler handles health check requests
// setupRoutes configures all HTTP routes with proper middleware
func setupRoutes() *http.ServeMux {
	mux := http.NewServeMux()

	// Health check endpoint (no CORS middleware needed)
	mux.HandleFunc("/health", healthHandler)

	// API routes with CORS middleware
	mux.HandleFunc("/api/scan", corsMiddleware(scanHandler))
	mux.HandleFunc("/api/scan/auto", corsMiddleware(autoScanHandler))
	mux.HandleFunc("/api/scan/status", corsMiddleware(scanStatusHandler))
	mux.HandleFunc("/api/scan/stop", corsMiddleware(scanStopHandler))

	// Router proxy endpoints - critical for connecting to MikroTik devices
	mux.HandleFunc("/api/router/proxy", corsMiddleware(routerProxyHandler))

	// Batch job endpoints for bulk command execution
	mux.HandleFunc("/api/batch/jobs", corsMiddleware(handleBatchJobs))
	mux.HandleFunc("/api/batch/jobs/", corsMiddleware(handleBatchJobs))

	return mux
}

// performHealthCheck performs a health check and exits with appropriate code
func performHealthCheck() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Performing health check on port %s", port)

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Get("http://localhost:" + port + "/health")
	if err != nil {
		log.Printf("Health check failed: %v", err)
		os.Exit(1)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusOK {
		log.Println("Health check passed")
		os.Exit(0)
	}

	log.Printf("Health check failed with status: %d", resp.StatusCode)
	os.Exit(1)
}

func main() {
	var healthCheck = flag.Bool("healthcheck", false, "Perform health check and exit")
	flag.Parse()

	if *healthCheck {
		performHealthCheck()
		return
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	mux := setupRoutes()

	srv := &http.Server{
		Addr:         "0.0.0.0:" + port,
		Handler:      mux,
		ReadTimeout:  60 * time.Second,
		WriteTimeout: 60 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	// Graceful shutdown
	done := make(chan bool, 1)
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		<-quit
		log.Println("Server is shutting down gracefully...")

		ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
		defer cancel()

		srv.SetKeepAlivesEnabled(false)
		if err := srv.Shutdown(ctx); err != nil {
			log.Fatalf("Could not gracefully shutdown: %v\n", err)
		}
		close(done)
	}()

	log.Printf("=== MikroTik RouterOS Development API Server v2.0 ===")
	log.Printf("Server starting on %s", srv.Addr)
	log.Printf("Workers: 4, CORS: enabled for frontend communication")
	log.Printf("Frontend: served separately by Vite")
	log.Printf("Health check: http://localhost:%s/health", port)
	log.Printf("Router proxy: /api/router/proxy")
	log.Printf("Environment: development")
	log.Printf("====================================================")

	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("Could not listen on %s: %v\n", srv.Addr, err)
	}

	<-done
	log.Println("Server stopped")
}

// Handlers are defined in server_shared.go
