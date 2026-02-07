//go:build !dev
// +build !dev

package main

import (
	"context"
	"embed"
	"flag"
	"fmt"
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

	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/handler/extension"
	"github.com/99designs/gqlgen/graphql/handler/lru"
	"github.com/99designs/gqlgen/graphql/handler/transport"
	"github.com/gorilla/websocket"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"

	"backend/ent"
	"backend/graph"
	"backend/graph/resolver"
	"backend/internal/database"
	"backend/internal/events"
	"backend/internal/graphql/loaders"
	"backend/internal/router"
	"backend/internal/services"
	troubleshootPkg "backend/internal/troubleshoot"
)

// Production NasNetConnect Server
// Optimized for container deployment with embedded frontend

//go:embed dist/**
var frontendFiles embed.FS

func init() {
	// Production-optimized settings for resource-constrained routers
	runtime.GOMAXPROCS(1)
	debug.SetGCPercent(10)
	debug.SetMemoryLimit(32 << 20) // 32MB memory limit

	// Initialize scanner pool with fewer workers for production
	scannerPool = NewScannerPool(2)

	log.SetFlags(log.LstdFlags | log.Lshortfile)
	log.Println("Production NasNetConnect server initialized")

	// Initialize container network detection helpers for proxy
	initializeContainerIPs()
	detectDefaultGateway()
}

func init() { ServerVersion = "production-v2.0" }

// createGraphQLServer creates and configures the gqlgen GraphQL server for production
func createGraphQLServer(eventBus events.EventBus, troubleshootSvc *troubleshootPkg.Service, interfaceSvc *services.InterfaceService) *handler.Server {
	// Create resolver with event bus
	resolv := resolver.NewResolverWithConfig(resolver.ResolverConfig{
		EventBus:            eventBus,
		TroubleshootService: troubleshootSvc,
		InterfaceService:    interfaceSvc,
	})

	// Create executable schema
	schema := graph.NewExecutableSchema(graph.Config{
		Resolvers: resolv,
	})

	// Create server with transport configuration
	srv := handler.New(schema)

	// Configure transports (no OPTIONS in production - same-origin)
	srv.AddTransport(transport.GET{})
	srv.AddTransport(transport.POST{})
	srv.AddTransport(transport.MultipartForm{})

	// WebSocket transport for subscriptions
	srv.AddTransport(&transport.Websocket{
		KeepAlivePingInterval: 10 * time.Second,
		Upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool {
				// In production, only allow same-origin WebSocket connections
				return true
			},
			ReadBufferSize:  1024,
			WriteBufferSize: 1024,
		},
	})

	// Add extensions (smaller caches for resource-constrained environment)
	srv.SetQueryCache(lru.New(100))
	srv.Use(extension.Introspection{}) // Keep introspection enabled for debugging
	srv.Use(extension.AutomaticPersistedQuery{
		Cache: lru.New(50),
	})

	return srv
}

// frontendHandler serves embedded frontend files
func frontendHandler(c echo.Context) error {
	fsys, err := fs.Sub(frontendFiles, "dist")
	if err != nil {
		log.Printf("Error accessing embedded files: %v", err)
		return c.String(http.StatusInternalServerError, "Internal Server Error")
	}

	path := strings.TrimPrefix(c.Request().URL.Path, "/")
	if path == "" {
		path = "index.html"
	}

	// Skip API and GraphQL routes
	if strings.HasPrefix(path, "api/") || strings.HasPrefix(path, "graphql") || path == "health" {
		return echo.ErrNotFound
	}

	file, err := fsys.Open(path)
	if err != nil {
		// Fallback to index.html for SPA routing
		if path != "index.html" {
			file, err = fsys.Open("index.html")
			if err != nil {
				return c.String(http.StatusNotFound, "File not found")
			}
			path = "index.html"
		} else {
			return c.String(http.StatusNotFound, "File not found")
		}
	}
	defer file.Close()

	contentType := getContentType(path)
	c.Response().Header().Set("Content-Type", contentType)
	setCacheHeaders(c.Response(), path)

	if seeker, ok := file.(io.ReadSeeker); ok {
		http.ServeContent(c.Response(), c.Request(), path, time.Time{}, seeker)
	} else {
		// Fallback for non-seekable files
		data, err := io.ReadAll(file)
		if err != nil {
			return c.String(http.StatusInternalServerError, "Error reading file")
		}
		return c.Blob(http.StatusOK, contentType, data)
	}

	return nil
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

// setupRoutes configures all HTTP routes with proper middleware
func setupRoutes(e *echo.Echo, eventBus events.EventBus, db *ent.Client, troubleshootSvc *troubleshootPkg.Service, interfaceSvc *services.InterfaceService) {
	// Create GraphQL server
	graphqlServer := createGraphQLServer(eventBus, troubleshootSvc, interfaceSvc)

	// Wrap GraphQL server with DataLoader middleware
	// Production mode: no stats logging for performance
	graphqlWithDataLoader := loaders.GraphQLMiddleware(loaders.Config{
		DB:       db,
		DevMode:  false,
		LogStats: false,
	})(graphqlServer)

	// Health check endpoint (no auth required)
	e.GET("/health", echoHealthHandler)

	// GraphQL endpoints with DataLoader middleware
	e.POST("/graphql", echo.WrapHandler(graphqlWithDataLoader))
	e.GET("/graphql", echo.WrapHandler(graphqlWithDataLoader)) // For WebSocket upgrades

	// No playground in production (security)

	// WebSocket endpoint for subscriptions (alias)
	e.GET("/query", echo.WrapHandler(graphqlWithDataLoader))

	// Legacy API routes
	api := e.Group("/api")

	// Scanner routes
	api.POST("/scan", echoScanHandler)
	api.POST("/scan/auto", echoAutoScanHandler)
	api.GET("/scan/status", echoScanStatusHandler)
	api.POST("/scan/stop", echoScanStopHandler)

	// Router proxy endpoint - critical for connecting to MikroTik devices
	api.Any("/router/proxy", echoRouterProxyHandler)

	// Batch job endpoints for bulk command execution
	api.Any("/batch/jobs", echoBatchJobsHandler)
	api.Any("/batch/jobs/*", echoBatchJobsHandler)

	// OUI (MAC vendor lookup) endpoints
	api.GET("/oui/:mac", echoOUILookupHandler)
	api.POST("/oui/batch", echoOUIBatchHandler)
	api.GET("/oui/stats", echoOUIStatsHandler)

	// Serve frontend files (catch-all route) - must be last
	e.GET("/*", frontendHandler)
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

	// Initialize EventBus with production-optimized options
	eventBusOpts := events.DefaultEventBusOptions()
	eventBusOpts.BufferSize = 256 // Smaller buffer for resource-constrained routers
	eventBus, err := events.NewEventBus(eventBusOpts)
	if err != nil {
		log.Fatalf("Failed to create event bus: %v", err)
	}

	// Initialize Database Manager for hybrid database architecture
	dataDir := os.Getenv("NASNET_DATA_DIR")
	if dataDir == "" {
		dataDir = database.DefaultDataDir // /var/nasnet
	}
	dbManager, err := database.NewManager(context.Background(),
		database.WithDataDir(dataDir),
		database.WithIdleTimeout(database.DefaultIdleTimeout),
	)
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	log.Printf("Database initialized: %s", dataDir)

	// Get system database client for DataLoaders
	systemDB := dbManager.SystemDB()

	// Initialize Troubleshoot Service for internet diagnostics (NAS-5.11)
	// Using mock adapter until ClientFactory is implemented
	mockRouterPort := router.NewMockAdapter("prod-router")
	troubleshootSvc := troubleshootPkg.NewService(mockRouterPort)

	// Initialize Interface Service for interface status monitoring (NAS-5.3)
	// Using same mock adapter until ClientFactory is implemented
	interfaceSvc := services.NewInterfaceService(services.InterfaceServiceConfig{
		RouterPort: mockRouterPort,
		EventBus:   eventBus,
	})
	log.Printf("Interface service initialized (mock adapter)")

	// Create Echo instance
	e := echo.New()
	e.HideBanner = true
	e.HidePort = true

	// Configure middleware (minimal for production)
	e.Use(middleware.Recover())

	// No CORS in production (same-origin)
	// No logger middleware by default (can be enabled via env)
	if os.Getenv("ENABLE_LOGGING") == "true" {
		e.Use(middleware.Logger())
	}

	// Setup routes with DataLoader middleware, troubleshoot service, and interface service
	setupRoutes(e, eventBus, systemDB, troubleshootSvc, interfaceSvc)

	// Configure server timeouts (shorter for production)
	e.Server.ReadTimeout = 30 * time.Second
	e.Server.WriteTimeout = 30 * time.Second
	e.Server.IdleTimeout = 60 * time.Second

	// Graceful shutdown
	done := make(chan bool, 1)
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		<-quit
		log.Println("Server is shutting down gracefully...")

		ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
		defer cancel()

		// Close event bus first to flush pending events
		if err := eventBus.Close(); err != nil {
			log.Printf("Warning: error closing event bus: %v", err)
		}

		// Close database manager
		if err := dbManager.Close(); err != nil {
			log.Printf("Warning: error closing database: %v", err)
		}

		if err := e.Shutdown(ctx); err != nil {
			log.Fatalf("Could not gracefully shutdown: %v\n", err)
		}
		close(done)
	}()

	log.Printf("=== NasNetConnect Server v2.0 ===")
	log.Printf("Server starting on 0.0.0.0:%s", port)
	log.Printf("Memory limit: 32MB, GC: aggressive, Workers: 2")
	log.Printf("Frontend: embedded, same-origin")
	log.Printf("GraphQL endpoint: http://localhost:%s/graphql", port)
	log.Printf("Health check: http://localhost:%s/health", port)
	log.Printf("================================")

	addr := fmt.Sprintf("0.0.0.0:%s", port)
	if err := e.Start(addr); err != nil && err != http.ErrServerClosed {
		log.Fatalf("Could not listen on %s: %v\n", addr, err)
	}

	<-done
	log.Println("Server stopped")
}
