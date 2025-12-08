//go:build !dev
// +build !dev

package main

import (
	"context"
	"embed"
	"flag"
	"io"
	"io/fs"
	"log"
	"net/http"
	"os"
	"os/signal"
	"runtime"
	"runtime/debug"
	"strings"
	"syscall"
	"time"
)

// Production MikroTik RouterOS Management Server
// Optimized for container deployment with embedded frontend

//go:embed dist/**
var frontendFiles embed.FS

// scannerPool is defined in server_shared.go

func init() {
	runtime.GOMAXPROCS(1)
	debug.SetGCPercent(10)
	debug.SetMemoryLimit(32 << 20)

	scannerPool = NewScannerPool(2)

	log.SetFlags(log.LstdFlags | log.Lshortfile)
	log.Println("Production MikroTik server initialized")

	// Initialize container network detection helpers for proxy
	initializeContainerIPs()
	detectDefaultGateway()
}

func init() { ServerVersion = "production-v2.0" }

// Simple logging middleware
func loggingMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		log.Printf("%s %s from %s", r.Method, r.URL.Path, r.RemoteAddr)
		defer func() {
			if err := recover(); err != nil {
				log.Printf("[PANIC RECOVERY] Handler panicked on %s %s: %v", r.Method, r.URL.Path, err)
				errorResponse(w, http.StatusInternalServerError, "internal_error",
					"Internal server error occurred while processing request")
			}
		}()
		next(w, r)
	}
}

// healthHandler handles health check requests
// healthHandler and errorResponse are defined in server_shared.go

// frontendHandler serves embedded frontend files
func frontendHandler(w http.ResponseWriter, r *http.Request) {
	fsys, err := fs.Sub(frontendFiles, "dist")
	if err != nil {
		log.Printf("Error accessing embedded files: %v", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	path := strings.TrimPrefix(r.URL.Path, "/")
	if path == "" {
		path = "index.html"
	}

	file, err := fsys.Open(path)
	if err != nil {
		if path != "index.html" {
			file, err = fsys.Open("index.html")
			if err != nil {
				http.Error(w, "File not found", http.StatusNotFound)
				return
			}
		} else {
			http.Error(w, "File not found", http.StatusNotFound)
			return
		}
	}
	defer file.Close()

	contentType := getContentType(path)
	w.Header().Set("Content-Type", contentType)
	setCacheHeaders(w, path)
	http.ServeContent(w, r, path, time.Time{}, file.(io.ReadSeeker))
}

func getContentType(path string) string {
	switch {
	case strings.HasSuffix(path, ".js"):
		return "application/javascript"
	case strings.HasSuffix(path, ".css"):
		return "text/css"
	case strings.HasSuffix(path, ".json"):
		return "application/json"
	case strings.HasSuffix(path, ".png"):
		return "image/png"
	case strings.HasSuffix(path, ".jpg") || strings.HasSuffix(path, ".jpeg"):
		return "image/jpeg"
	case strings.HasSuffix(path, ".ico"):
		return "image/x-icon"
	case strings.HasSuffix(path, ".svg"):
		return "image/svg+xml"
	case strings.HasSuffix(path, ".woff") || strings.HasSuffix(path, ".woff2"):
		return "font/woff2"
	default:
		return "text/html; charset=utf-8"
	}
}

func setCacheHeaders(w http.ResponseWriter, path string) {
	if strings.Contains(path, "assets/") {
		w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
	} else if path == "index.html" {
		w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
	} else {
		w.Header().Set("Cache-Control", "public, max-age=3600")
	}
}

// setupRoutes configures all HTTP routes
func setupRoutes() *http.ServeMux {
	mux := http.NewServeMux()

	// Health check endpoint
	mux.HandleFunc("/health", healthHandler)

	// API routes
	mux.HandleFunc("/api/scan", loggingMiddleware(scanHandler))
	mux.HandleFunc("/api/scan/auto", loggingMiddleware(autoScanHandler))
	mux.HandleFunc("/api/scan/status", loggingMiddleware(scanStatusHandler))
	mux.HandleFunc("/api/scan/stop", loggingMiddleware(scanStopHandler))
	mux.HandleFunc("/api/router/proxy", loggingMiddleware(routerProxyHandler))

	// Batch job endpoints for bulk command execution
	mux.HandleFunc("/api/batch/jobs", loggingMiddleware(handleBatchJobs))
	mux.HandleFunc("/api/batch/jobs/", loggingMiddleware(handleBatchJobs))

	// Serve frontend files (catch-all route)
	mux.HandleFunc("/", frontendHandler)
	return mux
}

// performHealthCheck performs a health check and exits
func performHealthCheck() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "80"
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
		port = "80"
	}

	mux := setupRoutes()

	srv := &http.Server{
		Addr:         "0.0.0.0:" + port,
		Handler:      mux,
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
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

	log.Printf("=== MikroTik RouterOS Management Server v2.0 ===")
	log.Printf("Server starting on %s", srv.Addr)
	log.Printf("Memory limit: 32MB, GC: aggressive, Workers: 2")
	log.Printf("Frontend: embedded, same-origin")
	log.Printf("Health check: http://localhost:%s/health", port)
	log.Printf("Router proxy: /api/router/proxy")
	log.Printf("================================================")

	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("Could not listen on %s: %v\n", srv.Addr, err)
	}

	<-done
	log.Println("Server stopped")
}

// Handlers are defined in server_shared.go
