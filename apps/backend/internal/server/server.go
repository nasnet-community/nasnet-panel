// Package server provides HTTP server setup, route registration, and middleware
// for the NasNetConnect backend. It separates server infrastructure from the
// application-level DI wiring in cmd/nnc/.
package server

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/labstack/echo/v4"
)

// Config holds server configuration.
type Config struct {
	// Port is the TCP port to listen on (default: "80" for prod, "8080" for dev).
	Port string

	// ReadTimeout is the maximum duration for reading the request.
	ReadTimeout time.Duration

	// WriteTimeout is the maximum duration for writing the response.
	WriteTimeout time.Duration

	// IdleTimeout is the maximum time to wait for the next request.
	IdleTimeout time.Duration
}

// DefaultProdConfig returns production server configuration.
func DefaultProdConfig() Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "80"
	}
	return Config{
		Port:         port,
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}
}

// DefaultDevConfig returns development server configuration.
func DefaultDevConfig() Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	return Config{
		Port:         port,
		ReadTimeout:  60 * time.Second,
		WriteTimeout: 60 * time.Second,
		IdleTimeout:  120 * time.Second,
	}
}

// Server wraps an Echo instance with lifecycle management.
type Server struct {
	Echo   *echo.Echo
	Config Config
}

// New creates a new server with the given configuration.
func New(cfg Config) *Server {
	e := echo.New()
	e.HideBanner = true
	e.HidePort = true

	e.Server.ReadTimeout = cfg.ReadTimeout
	e.Server.WriteTimeout = cfg.WriteTimeout
	e.Server.IdleTimeout = cfg.IdleTimeout

	return &Server{Echo: e, Config: cfg}
}

// Start starts the server and blocks until shutdown.
// The shutdownFn is called during graceful shutdown to clean up resources.
func (s *Server) Start(shutdownFn func(ctx context.Context)) {
	done := make(chan bool, 1)
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		<-quit
		log.Println("Server is shutting down gracefully...")

		ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
		defer cancel()

		// Run application-level cleanup first
		if shutdownFn != nil {
			shutdownFn(ctx)
		}

		if err := s.Echo.Shutdown(ctx); err != nil {
			log.Fatalf("Could not gracefully shutdown: %v\n", err)
		}
		close(done)
	}()

	addr := fmt.Sprintf("0.0.0.0:%s", s.Config.Port)
	if err := s.Echo.Start(addr); err != nil && !errors.Is(err, http.ErrServerClosed) {
		log.Fatalf("Could not listen on %s: %v\n", addr, err)
	}

	<-done
	log.Println("Server stopped")
}

// PerformHealthCheck performs an HTTP health check against the server and exits.
func PerformHealthCheck(port string) {
	log.Printf("Performing health check on port %s", port)

	client := &http.Client{Timeout: 10 * time.Second}
	req, err := http.NewRequestWithContext(context.Background(), http.MethodGet, "http://localhost:"+port+"/health", http.NoBody)
	if err != nil {
		log.Printf("Health check failed: %v", err)
		os.Exit(1)
	}

	resp, err := client.Do(req)
	if err != nil {
		log.Printf("Health check failed: %v", err)
		os.Exit(1)
	}
	defer resp.Body.Close()

	//nolint:gocritic // health check exits after defer cleanup
	if resp.StatusCode == http.StatusOK {
		log.Println("Health check passed")
		os.Exit(0)
	}

	log.Printf("Health check failed with status: %d", resp.StatusCode)
	os.Exit(1)
}
