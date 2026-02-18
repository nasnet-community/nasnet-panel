//go:build dev
// +build dev

package main

import (
	"context"
	"log"
	"os"
	"runtime"
	"time"

	"github.com/99designs/gqlgen/graphql/playground"
	"github.com/labstack/echo/v4"
	"go.uber.org/zap"

	"backend/generated/ent"
	"backend/graph"
	"backend/graph/resolver"
	"backend/internal/alerts"
	"backend/internal/database"
	"backend/internal/dns"
	"backend/internal/encryption"
	"backend/internal/graphql/loaders"
	"backend/internal/notifications"
	channelshttp "backend/internal/notifications/channels/http"
	"backend/internal/notifications/channels/push"
	scannerPkg "backend/internal/scanner"
	"backend/internal/server"
	"backend/internal/services"
	troubleshootPkg "backend/internal/troubleshoot"

	"backend/internal/events"
	"backend/internal/router"
)

func init() {
	runtime.GOMAXPROCS(2)
	scannerPool = NewScannerPool(4)

	log.SetFlags(log.LstdFlags | log.Lshortfile)
	log.Println("Development MikroTik server initialized")

	ServerVersion = "development-v2.0"
}

// eventBusAdapter adapts events.EventBus to alerts.EventBus interface.
type eventBusAdapter struct {
	bus events.EventBus
}

func (a *eventBusAdapter) Publish(ctx context.Context, event interface{}) error {
	if e, ok := event.(events.Event); ok {
		return a.bus.Publish(ctx, e)
	}
	return a.bus.Publish(ctx, events.NewGenericEvent("custom.event", events.PriorityNormal, "alert-service", map[string]interface{}{
		"data": event,
	}))
}

func (a *eventBusAdapter) Close() error {
	return a.bus.Close()
}

func run() {
	cfg := server.DefaultDevConfig()

	// Initialize EventBus with development options (larger buffers)
	eventBusOpts := events.DefaultEventBusOptions()
	eventBusOpts.BufferSize = 1024
	eventBus, err := events.NewEventBus(eventBusOpts)
	if err != nil {
		log.Fatalf("Failed to create event bus: %v", err)
	}

	// Initialize Database Manager
	dataDir := os.Getenv("NASNET_DATA_DIR")
	if dataDir == "" {
		dataDir = "./data"
	}
	dbManager, err := database.NewManager(context.Background(),
		database.WithDataDir(dataDir),
		database.WithIdleTimeout(10*time.Minute),
	)
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	log.Printf("Database initialized: %s", dataDir)
	systemDB := dbManager.SystemDB()

	// Initialize services
	scannerSvc := scannerPkg.NewServiceWithDefaults(eventBus)

	var encryptionSvc *encryption.Service
	encryptionSvc, err = encryption.NewServiceFromEnv()
	if err != nil {
		log.Printf("Warning: encryption service not configured: %v", err)
	}

	routerSvc := services.NewRouterService(services.RouterServiceConfig{
		ConnectionManager: nil,
		EventBus:          eventBus,
		EncryptionService: encryptionSvc,
		DB:                systemDB,
	})

	mockRouterPort := router.NewMockAdapter("dev-router")
	troubleshootSvc := troubleshootPkg.NewService(mockRouterPort)
	dnsService := dns.NewService(mockRouterPort)

	interfaceSvc := services.NewInterfaceService(services.InterfaceServiceConfig{
		RouterPort: mockRouterPort,
		EventBus:   eventBus,
	})

	// Initialize structured logger (debug level for dev)
	loggerConfig := zap.NewDevelopmentConfig()
	loggerConfig.Level = zap.NewAtomicLevelAt(zap.DebugLevel)
	logger, err := loggerConfig.Build()
	if err != nil {
		log.Fatalf("Failed to initialize logger: %v", err)
	}
	defer func() {
		if syncErr := logger.Sync(); syncErr != nil {
			// Ignore sync errors on stderr/stdout (common on Linux/Windows)
			log.Printf("Warning: Failed to sync logger: %v\n", syncErr)
		}
	}()
	sugar := logger.Sugar()

	// Initialize notification system
	channels := initDevNotificationChannels(eventBus)

	templateService := notifications.NewTemplateService(notifications.TemplateServiceConfig{
		DB: systemDB, Logger: sugar,
	})

	dispatcher := notifications.NewDispatcher(notifications.DispatcherConfig{
		Channels: channels, Logger: sugar, TemplateService: templateService,
		DB: systemDB, MaxRetries: 3, InitialBackoff: 1 * time.Second,
	})
	if subscribeErr := eventBus.Subscribe(events.EventTypeAlertCreated, dispatcher.HandleAlertCreated); subscribeErr != nil {
		log.Fatalf("Failed to subscribe dispatcher to alert events: %v", subscribeErr)
	}

	// Initialize alert system
	eventBusAdapter := &eventBusAdapter{bus: eventBus}

	escalationEngine := alerts.NewEscalationEngine(alerts.EscalationEngineConfig{
		DB: systemDB, Dispatcher: dispatcher, EventBus: eventBusAdapter, Logger: sugar,
	})

	digestService, err := alerts.NewDigestService(alerts.DigestServiceConfig{
		DB: systemDB, Dispatcher: dispatcher, EventBus: eventBus, Logger: sugar,
	})
	if err != nil {
		log.Fatalf("Failed to initialize digest service: %v", err)
	}

	digestScheduler := alerts.NewDigestScheduler(alerts.DigestSchedulerConfig{
		DigestService: digestService, DB: systemDB, Logger: sugar,
	})
	if err := digestScheduler.Start(context.Background()); err != nil {
		log.Printf("Warning: failed to start digest scheduler: %v", err)
	}

	alertService := services.NewAlertService(services.AlertServiceConfig{
		DB: systemDB, EventBus: eventBus, EscalationCanceller: escalationEngine,
		DigestService: nil, Logger: sugar,
	})

	alertEngine := alerts.NewEngine(alerts.EngineConfig{
		DB: systemDB, EventBus: eventBus, Dispatcher: dispatcher,
		EscalationEngine: escalationEngine, DigestService: digestService, Logger: sugar,
	})
	if err := alertEngine.Start(context.Background()); err != nil {
		log.Fatalf("Failed to start alert engine: %v", err)
	}

	// Create server
	srv := server.New(cfg)
	server.ApplyDevMiddleware(srv.Echo)

	// Setup dev routes
	setupDevRoutes(srv.Echo, devRoutesDeps{
		eventBus:        eventBus,
		systemDB:        systemDB,
		scannerSvc:      scannerSvc,
		routerSvc:       routerSvc,
		troubleshootSvc: troubleshootSvc,
		dnsService:      dnsService,
		interfaceSvc:    interfaceSvc,
		alertSvc:        alertService,
		dispatcher:      dispatcher,
	})

	log.Printf("=== NasNetConnect Development API Server v2.0 ===")
	log.Printf("Server starting on 0.0.0.0:%s", cfg.Port)
	log.Printf("Workers: 4, CORS: enabled for frontend communication")
	log.Printf("Frontend: served separately by Vite")
	log.Printf("Health check: http://localhost:%s/health", cfg.Port)
	log.Printf("GraphQL Playground: http://localhost:%s/playground", cfg.Port)
	log.Printf("GraphQL endpoint: http://localhost:%s/graphql", cfg.Port)
	log.Printf("=================================================")

	srv.Start(func(ctx context.Context) {
		if err := alertEngine.Stop(ctx); err != nil {
			log.Printf("Warning: error stopping alert engine: %v", err)
		}
		digestScheduler.Stop()
		if err := eventBus.Close(); err != nil {
			log.Printf("Warning: error closing event bus: %v", err)
		}
		if err := dbManager.Close(); err != nil {
			log.Printf("Warning: error closing database: %v", err)
		}
	})
}

// performHealthCheck performs a health check against the development port and exits.
func performHealthCheck() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	server.PerformHealthCheck(port)
}

// initDevNotificationChannels creates all notification channels for development.
func initDevNotificationChannels(eventBus events.EventBus) map[string]notifications.Channel {
	return map[string]notifications.Channel{
		"email":    channelshttp.NewEmailChannel(channelshttp.EmailConfig{}),
		"telegram": push.NewTelegramChannel(push.TelegramConfig{}),
		"pushover": push.NewPushoverChannel(push.PushoverConfig{}),
		"webhook":  channelshttp.NewWebhookChannel(channelshttp.WebhookConfig{}),
		"inapp":    push.NewInAppChannel(eventBus),
	}
}

// devRoutesDeps holds all dependencies for development route setup.
type devRoutesDeps struct {
	eventBus        events.EventBus
	systemDB        *ent.Client
	scannerSvc      *scannerPkg.ScannerService
	routerSvc       *services.RouterService
	troubleshootSvc *troubleshootPkg.Service
	dnsService      *dns.Service
	interfaceSvc    *services.InterfaceService
	alertSvc        *services.AlertService
	dispatcher      *notifications.Dispatcher
}

// setupDevRoutes configures all HTTP routes for development.
func setupDevRoutes(e *echo.Echo, deps devRoutesDeps) {
	resolv := resolver.NewResolverWithConfig(resolver.Config{
		EventBus:            deps.eventBus,
		ScannerService:      deps.scannerSvc,
		RouterService:       deps.routerSvc,
		TroubleshootService: deps.troubleshootSvc,
		DnsService:          deps.dnsService,
		InterfaceService:    deps.interfaceSvc,
		AlertService:        deps.alertSvc,
		Dispatcher:          deps.dispatcher,
	})

	schema := graph.NewExecutableSchema(graph.Config{Resolvers: resolv})

	graphqlHandler := server.NewGraphQLHandler(server.GraphQLConfig{
		Schema:          schema,
		DevMode:         true,
		AllowAllOrigins: true,
	})

	graphqlWithDataLoader := loaders.GraphQLMiddleware(loaders.Config{
		DB: deps.systemDB, DevMode: true, LogStats: true,
	})(graphqlHandler)

	e.GET("/health", echoHealthHandler)
	e.POST("/graphql", echo.WrapHandler(graphqlWithDataLoader))
	e.GET("/graphql", echo.WrapHandler(graphqlWithDataLoader))
	e.GET("/playground", echo.WrapHandler(playground.Handler("NasNetConnect GraphQL", "/graphql")))
	e.GET("/query", echo.WrapHandler(graphqlWithDataLoader))

	api := e.Group("/api")
	api.POST("/scan", echoScanHandler)
	api.POST("/scan/auto", echoAutoScanHandler)
	api.GET("/scan/status", echoScanStatusHandler)
	api.POST("/scan/stop", echoScanStopHandler)
	api.Any("/router/proxy", echoRouterProxyHandler)
	api.Any("/batch/jobs", echoBatchJobsHandler)
	api.Any("/batch/jobs/*", echoBatchJobsHandler)
	api.GET("/oui/:mac", echoOUILookupHandler)
	api.POST("/oui/batch", echoOUIBatchHandler)
	api.GET("/oui/stats", echoOUIStatsHandler)
}
