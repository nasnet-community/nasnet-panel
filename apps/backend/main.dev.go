//go:build dev
// +build dev

package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"runtime"
	"syscall"
	"time"

	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/handler/extension"
	"github.com/99designs/gqlgen/graphql/handler/lru"
	"github.com/99designs/gqlgen/graphql/handler/transport"
	"github.com/99designs/gqlgen/graphql/playground"
	"github.com/gorilla/websocket"
	"github.com/vektah/gqlparser/v2/ast"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"

	"backend/generated/ent"
	"backend/graph"
	"backend/graph/resolver"
	"backend/internal/alerts"
	"backend/internal/database"
	"backend/internal/dns"
	"backend/internal/encryption"
	"backend/internal/events"
	"backend/internal/graphql/loaders"
	"backend/internal/notifications"
	channelshttp "backend/internal/notifications/channels/http"
	"backend/internal/notifications/channels/push"
	"backend/internal/router"
	scannerPkg "backend/internal/scanner"
	"backend/internal/services"
	troubleshootPkg "backend/internal/troubleshoot"
	"go.uber.org/zap"
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

// eventBusAdapter adapts events.EventBus to alerts.EventBus interface
type eventBusAdapter struct {
	bus events.EventBus
}

func (a *eventBusAdapter) Publish(ctx context.Context, event interface{}) error {
	// If event is already events.Event, publish it directly
	if e, ok := event.(events.Event); ok {
		return a.bus.Publish(ctx, e)
	}
	// Otherwise wrap it in a GenericEvent
	return a.bus.Publish(ctx, events.NewGenericEvent("custom.event", events.PriorityNormal, "alert-service", map[string]interface{}{
		"data": event,
	}))
}

func (a *eventBusAdapter) Close() error {
	return a.bus.Close()
}

// createGraphQLServer creates and configures the gqlgen GraphQL server
func createGraphQLServer(eventBus events.EventBus, scannerSvc *scannerPkg.ScannerService, routerSvc *services.RouterService, troubleshootSvc *troubleshootPkg.Service, dnsService *dns.Service, interfaceSvc *services.InterfaceService, alertSvc *services.AlertService, dispatcher *notifications.Dispatcher) *handler.Server {
	// Create resolver with event bus and all services including alert service
	resolv := resolver.NewResolverWithConfig(resolver.ResolverConfig{
		EventBus:            eventBus,
		ScannerService:      scannerSvc,
		RouterService:       routerSvc,
		TroubleshootService: troubleshootSvc,
		DnsService:          dnsService,
		InterfaceService:    interfaceSvc,
		AlertService:        alertSvc,
		Dispatcher:          dispatcher,
	})

	// Create executable schema
	schema := graph.NewExecutableSchema(graph.Config{
		Resolvers: resolv,
	})

	// Create server with transport configuration
	srv := handler.New(schema)

	// Configure transports
	srv.AddTransport(transport.Options{})
	srv.AddTransport(transport.GET{})
	srv.AddTransport(transport.POST{})
	srv.AddTransport(transport.MultipartForm{})

	// WebSocket transport for subscriptions
	srv.AddTransport(&transport.Websocket{
		KeepAlivePingInterval: 10 * time.Second,
		Upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool {
				// Allow all origins in development
				return true
			},
			ReadBufferSize:  1024,
			WriteBufferSize: 1024,
		},
	})

	// Add extensions
	srv.SetQueryCache(lru.New[*ast.QueryDocument](1000))
	srv.Use(extension.Introspection{}) // Enable introspection
	srv.Use(extension.AutomaticPersistedQuery{
		Cache: lru.New[string](100),
	})

	return srv
}

// setupRoutes configures all HTTP routes with proper middleware
func setupRoutes(e *echo.Echo, eventBus events.EventBus, db *ent.Client, scannerSvc *scannerPkg.ScannerService, routerSvc *services.RouterService, troubleshootSvc *troubleshootPkg.Service, dnsService *dns.Service, interfaceSvc *services.InterfaceService, alertSvc *services.AlertService, alertEngine **alerts.Engine, dispatcher *notifications.Dispatcher) {
	// Create GraphQL server with all services including alert service
	graphqlServer := createGraphQLServer(eventBus, scannerSvc, routerSvc, troubleshootSvc, dnsService, interfaceSvc, alertSvc, dispatcher)

	// Wrap GraphQL server with DataLoader middleware
	// This ensures DataLoaders are request-scoped and available to all resolvers
	graphqlWithDataLoader := loaders.GraphQLMiddleware(loaders.Config{
		DB:       db,
		DevMode:  true,
		LogStats: true, // Log batch stats for development debugging
	})(graphqlServer)

	// Health check endpoint (no auth required)
	e.GET("/health", echoHealthHandler)

	// GraphQL endpoints with DataLoader middleware
	e.POST("/graphql", echo.WrapHandler(graphqlWithDataLoader))
	e.GET("/graphql", echo.WrapHandler(graphqlWithDataLoader)) // For WebSocket upgrades

	// GraphQL Playground (development only)
	e.GET("/playground", echo.WrapHandler(playground.Handler("NasNetConnect GraphQL", "/graphql")))

	// WebSocket endpoint for subscriptions (alias)
	e.GET("/query", echo.WrapHandler(graphqlWithDataLoader))

	// Legacy API routes with CORS (existing functionality)
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

	// Initialize EventBus with development options (larger buffers)
	eventBusOpts := events.DefaultEventBusOptions()
	eventBusOpts.BufferSize = 1024 // Larger buffer for development
	eventBus, err := events.NewEventBus(eventBusOpts)
	if err != nil {
		log.Fatalf("Failed to create event bus: %v", err)
	}

	// Initialize Database Manager for hybrid database architecture
	dataDir := os.Getenv("NASNET_DATA_DIR")
	if dataDir == "" {
		dataDir = "./data" // Development default
	}
	dbManager, err := database.NewManager(context.Background(),
		database.WithDataDir(dataDir),
		database.WithIdleTimeout(10*time.Minute), // Longer timeout for development
	)
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	log.Printf("Database initialized: %s", dataDir)

	// Get system database client for DataLoaders
	systemDB := dbManager.SystemDB()

	// Initialize Scanner Service for router discovery
	scannerSvc := scannerPkg.NewServiceWithDefaults(eventBus)
	log.Printf("Scanner service initialized")

	// Initialize Encryption Service for credential management (optional in dev)
	var encryptionSvc *encryption.Service
	encryptionSvc, err = encryption.NewServiceFromEnv()
	if err != nil {
		log.Printf("Warning: encryption service not configured (DB_ENCRYPTION_KEY not set): %v", err)
		log.Printf("Credential encryption will be disabled in development mode")
	}

	// Initialize Router Service for connection management
	// Note: Connection manager not available yet (ClientFactory not implemented)
	routerSvc := services.NewRouterService(services.RouterServiceConfig{
		ConnectionManager: nil, // Will be added when ClientFactory is implemented
		EventBus:          eventBus,
		EncryptionService: encryptionSvc,
		DB:                systemDB,
	})
	log.Printf("Router service initialized")

	// Initialize Troubleshoot Service for internet diagnostics (NAS-5.11)
	// Using mock adapter until ClientFactory is implemented
	mockRouterPort := router.NewMockAdapter("dev-router")
	troubleshootSvc := troubleshootPkg.NewService(mockRouterPort)
	log.Printf("Troubleshoot service initialized (mock adapter)")

	// Initialize DNS Service for DNS lookup diagnostics (NAS-5.9)
	// Using same mock adapter until ClientFactory is implemented
	dnsService := dns.NewService(mockRouterPort)
	log.Printf("DNS service initialized (mock adapter)")

	// Initialize Interface Service for interface status monitoring (NAS-5.3)
	// Using same mock adapter until ClientFactory is implemented
	interfaceSvc := services.NewInterfaceService(services.InterfaceServiceConfig{
		RouterPort: mockRouterPort,
		EventBus:   eventBus,
	})
	log.Printf("Interface service initialized (mock adapter)")

	// Initialize structured logger for alert system (NAS-18.1)
	loggerConfig := zap.NewDevelopmentConfig()
	loggerConfig.Level = zap.NewAtomicLevelAt(zap.DebugLevel) // Debug level for dev
	logger, err := loggerConfig.Build()
	if err != nil {
		log.Fatalf("Failed to initialize logger: %v", err)
	}
	defer logger.Sync()
	sugar := logger.Sugar()
	log.Printf("Structured logger initialized (development mode)")

	// Initialize notification channels for alert system (NAS-18.1)
	emailChannel := channelshttp.NewEmailChannel(channelshttp.EmailConfig{})
	telegramChannel := push.NewTelegramChannel(push.TelegramConfig{})
	pushoverChannel := push.NewPushoverChannel(push.PushoverConfig{})
	webhookChannel := channelshttp.NewWebhookChannel(channelshttp.WebhookConfig{})
	inappChannel := push.NewInAppChannel(eventBus)

	channels := map[string]notifications.Channel{
		"email":    emailChannel,
		"telegram": telegramChannel,
		"pushover": pushoverChannel,
		"webhook":  webhookChannel,
		"inapp":    inappChannel,
	}

	// Initialize notification template service (NAS-18.11 Task 5)
	templateService := notifications.NewTemplateService(notifications.TemplateServiceConfig{
		DB:     systemDB,
		Logger: sugar,
	})
	log.Printf("Notification template service initialized")

	// Initialize notification dispatcher (NAS-18.1)
	dispatcher := notifications.NewDispatcher(notifications.DispatcherConfig{
		Channels:        channels,
		Logger:          sugar,
		TemplateService: templateService, // Optional template renderer (NAS-18.11 Task 5)
		DB:              systemDB,        // Database client for alert queries
		MaxRetries:      3,
		InitialBackoff:  1 * time.Second,
	})

	// Subscribe dispatcher to alert.created events
	if err := eventBus.Subscribe(events.EventTypeAlertCreated, dispatcher.HandleAlertCreated); err != nil {
		log.Fatalf("Failed to subscribe dispatcher to alert events: %v", err)
	}
	log.Printf("Notification dispatcher initialized and subscribed")

	// Initialize Escalation Engine (NAS-18.9)
	// Created separately so it can be shared between AlertService and AlertEngine
	// Use eventBusAdapter to convert events.EventBus to alerts.EventBus interface
	escalationEventBus := &eventBusAdapter{bus: eventBus}
	escalationEngine := alerts.NewEscalationEngine(alerts.EscalationEngineConfig{
		DB:         systemDB,
		Dispatcher: dispatcher,
		EventBus:   escalationEventBus,
		Logger:     sugar,
	})
	log.Printf("Escalation engine initialized")

	// Initialize Digest Service (NAS-18.11)
	digestService, err := alerts.NewDigestService(alerts.DigestServiceConfig{
		DB:         systemDB,
		Dispatcher: dispatcher,
		EventBus:   eventBus, // Uses events.EventBus directly
		Logger:     sugar,
	})
	if err != nil {
		log.Fatalf("Failed to initialize digest service: %v", err)
	}
	log.Printf("Digest service initialized")

	// Initialize Digest Scheduler (NAS-18.11)
	digestScheduler := alerts.NewDigestScheduler(alerts.DigestSchedulerConfig{
		DigestService: digestService,
		DB:            systemDB,
		Logger:        sugar,
	})

	// Start digest scheduler (loads and schedules active digests)
	if err := digestScheduler.Start(context.Background()); err != nil {
		log.Printf("Warning: failed to start digest scheduler: %v", err)
	} else {
		log.Printf("Digest scheduler started")
	}

	// Initialize Alert Service (NAS-18.1, NAS-18.9, NAS-18.11)
	alertService := services.NewAlertService(services.AlertServiceConfig{
		DB:                  systemDB,
		EventBus:            eventBus,
		EscalationCanceller: escalationEngine,
		DigestService:       nil, // TODO: Create adapter for alerts.DigestService -> services.DigestService
		Logger:              sugar,
	})
	log.Printf("Alert service initialized")

	// Initialize and start Alert Engine (NAS-18.1, NAS-18.9, NAS-18.11)
	// Pass the shared escalation engine and digest service
	alertEngine := alerts.NewEngine(alerts.EngineConfig{
		DB:               systemDB,
		EventBus:         eventBus, // Uses events.EventBus directly
		Dispatcher:       dispatcher,
		EscalationEngine: escalationEngine,
		DigestService:    digestService,
		Logger:           sugar,
	})

	if err := alertEngine.Start(context.Background()); err != nil {
		log.Fatalf("Failed to start alert engine: %v", err)
	}
	log.Printf("Alert engine started and monitoring events")

	// Create Echo instance
	e := echo.New()
	e.HideBanner = true
	e.HidePort = true

	// Configure middleware
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())

	// CORS middleware for development (allow all origins)
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{echo.GET, echo.POST, echo.PUT, echo.DELETE, echo.OPTIONS, echo.PATCH},
		AllowHeaders:     []string{echo.HeaderOrigin, echo.HeaderContentType, echo.HeaderAuthorization, "X-Requested-With"},
		AllowCredentials: false,
		MaxAge:           3600,
	}))

	// Setup routes with DataLoader middleware, all services including alert system
	setupRoutes(e, eventBus, systemDB, scannerSvc, routerSvc, troubleshootSvc, dnsService, interfaceSvc, alertService, &alertEngine, dispatcher)

	// Configure server timeouts
	e.Server.ReadTimeout = 60 * time.Second
	e.Server.WriteTimeout = 60 * time.Second
	e.Server.IdleTimeout = 120 * time.Second

	// Graceful shutdown
	done := make(chan bool, 1)
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		<-quit
		log.Println("Server is shutting down gracefully...")

		ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
		defer cancel()

		// Stop alert engine first to prevent processing new events
		if err := alertEngine.Stop(ctx); err != nil {
			log.Printf("Warning: error stopping alert engine: %v", err)
		} else {
			log.Println("Alert engine stopped")
		}

		// Stop digest scheduler to cancel all timers and wait for in-flight deliveries
		digestScheduler.Stop()
		log.Println("Digest scheduler stopped")

		// Close event bus second to flush pending events
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

	log.Printf("=== NasNetConnect Development API Server v2.0 ===")
	log.Printf("Server starting on 0.0.0.0:%s", port)
	log.Printf("Workers: 4, CORS: enabled for frontend communication")
	log.Printf("Frontend: served separately by Vite")
	log.Printf("Health check: http://localhost:%s/health", port)
	log.Printf("GraphQL Playground: http://localhost:%s/playground", port)
	log.Printf("GraphQL endpoint: http://localhost:%s/graphql", port)
	log.Printf("Router proxy: /api/router/proxy")
	log.Printf("DataLoader: enabled (request-scoped, stats logging on)")
	log.Printf("Environment: development")
	log.Printf("=================================================")

	addr := fmt.Sprintf("0.0.0.0:%s", port)
	if err := e.Start(addr); err != nil && err != http.ErrServerClosed {
		log.Fatalf("Could not listen on %s: %v\n", addr, err)
	}

	<-done
	log.Println("Server stopped")
}
