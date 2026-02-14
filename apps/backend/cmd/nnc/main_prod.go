//go:build !dev
// +build !dev

package main

import (
	"context"
	"embed"
	"io/fs"
	"log"
	"os"
	"time"

	"github.com/rs/zerolog"
	"go.uber.org/zap"

	"backend/internal/bootstrap"
	"backend/internal/router"
	"backend/internal/server"
	"backend/internal/services"
	troubleshootPkg "backend/internal/troubleshoot"
)

//go:embed dist/**
var frontendFiles embed.FS

func init() {
	// Apply production runtime configuration
	runtimeCfg := bootstrap.DefaultProdRuntimeConfig()
	bootstrap.ApplyRuntimeConfig(runtimeCfg)

	// Initialize scanner pool with production settings
	scannerPool = NewScannerPool(runtimeCfg.ScannerWorkers)

	log.SetFlags(log.LstdFlags | log.Lshortfile)
	log.Println("Production NasNetConnect server initialized")

	// Initialize container network detection helpers for proxy
	initializeContainerIPs()
	detectDefaultGateway()
}

func init() { ServerVersion = "production-v2.0" }

func run() {
	ctx := context.Background()
	cfg := server.DefaultProdConfig()

	// 1. Initialize Runtime Configuration
	runtimeCfg := bootstrap.DefaultProdRuntimeConfig()

	// 2. Initialize Event Bus
	eventBus, err := bootstrap.InitializeEventBus(runtimeCfg.EventBusBufferSize)
	if err != nil {
		log.Fatalf("Failed to create event bus: %v", err)
	}
	log.Printf("Event bus initialized (buffer: %d)", runtimeCfg.EventBusBufferSize)

	// 3. Initialize Database
	dbCfg := bootstrap.DefaultProdDatabaseConfig()
	dbManager, systemDB, err := bootstrap.InitializeDatabase(ctx, dbCfg)
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}

	// 4. Initialize Structured Loggers
	zerologWriter := zerolog.ConsoleWriter{Out: os.Stdout, TimeFormat: time.RFC3339}
	storageLogger := zerolog.New(zerologWriter).With().Timestamp().Logger()

	loggerConfig := zap.NewProductionConfig()
	loggerConfig.Level = zap.NewAtomicLevelAt(zap.InfoLevel)
	logger, err := loggerConfig.Build()
	if err != nil {
		log.Fatalf("Failed to initialize logger: %v", err)
	}
	defer logger.Sync()
	sugar := logger.Sugar()

	// 5. Initialize Mock Router Adapter (until ClientFactory is implemented)
	mockRouterPort := router.NewMockAdapter("prod-router")

	// 6. Initialize Basic Services
	troubleshootSvc := troubleshootPkg.NewService(mockRouterPort)
	interfaceSvc := services.NewInterfaceService(services.InterfaceServiceConfig{
		RouterPort: mockRouterPort,
		EventBus:   eventBus,
	})
	log.Printf("Basic services initialized")

	// 7. Initialize Alert System
	alertComponents, err := bootstrap.InitializeAlertSystem(ctx, systemDB, eventBus, sugar)
	if err != nil {
		log.Fatalf("Failed to initialize alert system: %v", err)
	}

	// 8. Initialize Production Services (Storage, VIF, Orchestrator, Updates, Templates)
	prodSvcs, err := initProdServices(ctx, systemDB, eventBus, mockRouterPort, storageLogger, dbCfg.DataDir)
	if err != nil {
		log.Fatalf("Failed to initialize production services: %v", err)
	}

	// 9. Create Server
	srv := server.New(cfg)
	server.ApplyProdMiddleware(srv.Echo)

	// 10. Serve Embedded Frontend
	fsys, err := fs.Sub(frontendFiles, "dist")
	if err != nil {
		log.Fatalf("Error accessing embedded files: %v", err)
	}
	frontendHandler := server.NewFrontendHandler(fsys)

	// 11. Setup Routes
	setupProdRoutes(srv.Echo, prodRoutesDeps{
		eventBus:             eventBus,
		systemDB:             systemDB,
		troubleshootSvc:      troubleshootSvc,
		interfaceSvc:         interfaceSvc,
		alertSvc:             alertComponents.AlertService,
		alertRuleTemplateSvc: alertComponents.AlertRuleTemplateService,
		dispatcher:           alertComponents.Dispatcher,
		frontendHandler:      frontendHandler,
		storageDetector:      prodSvcs.storage.Detector,
		storageConfig:        prodSvcs.storage.ConfigService,
		pathResolver:         prodSvcs.storage.PathResolver,
		gatewayManager:       prodSvcs.vif.GatewayManager,
		featureRegistry:      prodSvcs.orchestrator.FeatureRegistry,
		instanceManager:      prodSvcs.orchestrator.InstanceManager,
		portRegistry:         prodSvcs.orchestrator.PortRegistry,
		vlanAllocator:        prodSvcs.orchestrator.VLANAllocator,
		dependencyMgr:        prodSvcs.orchestrator.DependencyManager,
		bootSequenceMgr:      prodSvcs.orchestrator.BootSequenceManager,
		updateSvc:            prodSvcs.updates.UpdateService,
		updateScheduler:      prodSvcs.updates.UpdateScheduler,
		serviceTemplateSvc:   prodSvcs.templates.TemplateService,
		templateInstaller:    prodSvcs.templates.TemplateInstaller,
		templateExporter:     prodSvcs.templates.TemplateExporter,
		templateImporter:     prodSvcs.templates.TemplateImporter,
	})

	// 12. Boot Sequence for Auto-Start Services
	go func() {
		log.Println("Executing boot sequence for auto-start service instances...")
		if err := prodSvcs.orchestrator.BootSequenceManager.ExecuteBootSequence(ctx); err != nil {
			log.Printf("Boot sequence completed with errors: %v", err)
		} else {
			log.Println("Boot sequence completed successfully")
		}
	}()

	// 13. Print Startup Banner
	log.Printf("=== NasNetConnect Server v2.0 ===")
	log.Printf("Server starting on 0.0.0.0:%s", cfg.Port)
	log.Printf("Memory limit: %dMB, GC: %d%%, Workers: %d",
		runtimeCfg.MemoryLimitMB, runtimeCfg.GCPercent, runtimeCfg.ScannerWorkers)
	log.Printf("Frontend: embedded, same-origin")
	log.Printf("GraphQL endpoint: http://localhost:%s/graphql", cfg.Port)
	log.Printf("Health check: http://localhost:%s/health", cfg.Port)
	log.Printf("================================")

	// 14. Create Shutdown Coordinator
	shutdownCoordinator := bootstrap.NewShutdownCoordinator(
		dbManager,
		eventBus,
		alertComponents.AlertEngine,
		alertComponents.DigestScheduler,
		prodSvcs.updates.UpdateScheduler,
		prodSvcs.storage.Detector,
	)

	// 15. Start Server with Graceful Shutdown
	srv.Start(func(ctx context.Context) {
		shutdownCoordinator.Shutdown(ctx)
	})
}

// performHealthCheck performs a health check against the production port and exits.
func performHealthCheck() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "80"
	}
	server.PerformHealthCheck(port)
}
