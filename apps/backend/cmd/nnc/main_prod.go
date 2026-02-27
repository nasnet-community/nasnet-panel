//go:build !dev
// +build !dev

package main

import (
	"context"
	"embed"
	"io/fs"
	"log"
	"os"

	"go.uber.org/zap"

	"backend/internal/bootstrap"
	"backend/internal/server"
	"backend/internal/services"
	troubleshootPkg "backend/internal/troubleshoot"

	"backend/internal/router"
)

//go:embed dist/**
var frontendFiles embed.FS

// prodLogger is set during run() to be available to legacy handlers
var prodLogger *zap.Logger

//nolint:gochecknoinits // required for production build tag registration
func init() {
	// Create a temporary logger for init-time logging
	tmpLogger, err := zap.NewProduction()
	if err != nil {
		log.Fatalf("failed to create logger: %v", err)
	}

	tmpSugar := tmpLogger.Sugar()

	// Apply production runtime configuration
	runtimeCfg := bootstrap.DefaultProdRuntimeConfig()
	if err := bootstrap.ApplyRuntimeConfig(runtimeCfg, tmpSugar); err != nil {
		tmpLogger.Sync() //nolint:errcheck // best-effort sync before exit
		log.Fatalf("Failed to apply runtime configuration: %v", err)
	}
	tmpLogger.Sync() //nolint:errcheck // best-effort sync at end of init

	// Initialize scanner pool with production settings
	scannerPool = NewScannerPool(runtimeCfg.ScannerWorkers)

	ServerVersion = "production-v2.0"
}

func run() {
	cfg := server.DefaultProdConfig()

	// 1. Initialize Runtime Configuration
	runtimeCfg := bootstrap.DefaultProdRuntimeConfig()

	// 2. Initialize Event Bus
	eventBus, err := bootstrap.InitializeEventBus(runtimeCfg.EventBusBufferSize)
	if err != nil {
		log.Fatalf("Failed to create event bus: %v", err)
	}

	// 3. Initialize Database
	ctx := context.Background()
	dbCfg := bootstrap.DefaultProdDatabaseConfig()
	dbManager, systemDB, err := bootstrap.InitializeDatabase(ctx, dbCfg)
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}

	// 4. Initialize Structured Loggers
	loggerConfig := zap.NewProductionConfig()
	loggerConfig.Level = zap.NewAtomicLevelAt(zap.InfoLevel)
	logger, err := loggerConfig.Build()
	if err != nil {
		log.Fatalf("Failed to initialize logger: %v", err)
	}
	defer func() {
		if syncErr := logger.Sync(); syncErr != nil {
			// Ignore sync errors on stderr/stdout (common on Linux/Windows)
			logger.Warn("failed to sync logger", zap.Error(syncErr))
		}
	}()
	sugar := logger.Sugar()
	prodLogger = logger // Store for use by legacy handlers

	// 5. Initialize Mock Router Adapter (until ClientFactory is implemented)
	mockRouterPort := router.NewMockAdapter("prod-router")

	// 6. Initialize Basic Services
	troubleshootSvc := troubleshootPkg.NewService(mockRouterPort)
	interfaceSvc := services.NewInterfaceService(services.InterfaceServiceConfig{
		RouterPort: mockRouterPort,
		EventBus:   eventBus,
	})

	// 7. Initialize Alert System
	alertComponents, err := bootstrap.InitializeAlertSystem(ctx, systemDB, eventBus, sugar)
	if err != nil {
		sugar.Fatalw("failed to initialize alert system", zap.Error(err))
	}

	// 8. Initialize Production Services (Storage, VIF, Orchestrator, Updates, Templates, Core, etc.)
	prodSvcs, err := initProdServices(ctx, systemDB, eventBus, mockRouterPort, logger, alertComponents, dbCfg.DataDir)
	if err != nil {
		sugar.Fatalw("failed to initialize production services", zap.Error(err))
	}

	// 9. Create Server
	srv := server.New(cfg, logger)
	server.ApplyProdMiddleware(srv.Echo)

	// 10. Serve Embedded Frontend
	fsys, err := fs.Sub(frontendFiles, "dist")
	if err != nil {
		sugar.Fatalw("error accessing embedded files", zap.Error(err))
	}
	frontendHandler := server.NewFrontendHandler(fsys)

	// 14. Create Shutdown Coordinator (before defer that might use it)
	shutdownCoordinator := bootstrap.NewShutdownCoordinator(
		dbManager,
		eventBus,
		alertComponents.AlertEngine,
		alertComponents.DigestScheduler,
		prodSvcs.updates.UpdateScheduler,
		prodSvcs.storage.Detector,
		sugar,
	).WithTrafficAggregator(prodSvcs.traffic.TrafficAggregator)

	// 11. Setup Routes
	setupProdRoutes(srv.Echo, &prodRoutesDeps{
		eventBus:             eventBus,
		systemDB:             systemDB,
		troubleshootSvc:      troubleshootSvc,
		interfaceSvc:         interfaceSvc,
		alertSvc:             alertComponents.AlertService,
		alertTemplateSvc:     alertComponents.AlertTemplateService,
		templateSvc:          alertComponents.TemplateService,
		alertRuleTemplateSvc: alertComponents.AlertRuleTemplateService,
		dispatcher:           alertComponents.Dispatcher,
		frontendHandler:      frontendHandler,
		storageDetector:      prodSvcs.storage.Detector,
		storageConfig:        prodSvcs.storage.Service,
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
		authSvc:              prodSvcs.core.AuthService,
		scannerSvc:           prodSvcs.core.ScannerService,
		capabilitySvc:        prodSvcs.core.CapabilityService,
		routerSvc:            prodSvcs.core.RouterService,
		credentialSvc:        prodSvcs.integration.CredentialService,
		diagnosticsSvc:       prodSvcs.diagnostics.DiagnosticsService,
		tracerouteSvc:        prodSvcs.diagnostics.TracerouteService,
		dnsSvc:               prodSvcs.diagnostics.DnsService,
		ipAddressSvc:         prodSvcs.network.IPAddressService,
		wanSvc:               prodSvcs.network.WANService,
		bridgeSvc:            prodSvcs.network.BridgeService,
		vlanSvc:              prodSvcs.network.VlanService,
		firewallTemplateSvc:  prodSvcs.firewall.TemplateService,
		addressListSvc:       prodSvcs.firewall.AddressListService,
		telemetrySvc:         prodSvcs.monitoring.TelemetryService,
		statsPoller:          prodSvcs.monitoring.StatsPoller,
		serviceTrafficPoller: prodSvcs.traffic.ServiceTrafficPoller,
		trafficAggregator:    prodSvcs.traffic.TrafficAggregator,
		deviceTrafficTracker: prodSvcs.traffic.DeviceTrafficTracker,
		quotaEnforcer:        prodSvcs.traffic.QuotaEnforcer,
		scheduleSvc:          prodSvcs.scheduling.ScheduleService,
		scheduleEvaluator:    prodSvcs.scheduling.ScheduleEvaluator,
		webhookSvc:           prodSvcs.integration.WebhookService,
		sharingSvc:           prodSvcs.integration.SharingService,
		configSvc:            prodSvcs.integration.ConfigService,
		killSwitchManager:    prodSvcs.vif.KillSwitchManager,
		resourceLimiter:      prodSvcs.orchestrator.ResourceLimiter,
		chainRouter:          prodSvcs.routing.ChainRouter,
		pbrEngine:            prodSvcs.routing.PBREngine,
		routingMatrixSvc:     prodSvcs.routing.RoutingMatrixSvc,
		chainLatencyMeasurer: prodSvcs.routing.ChainLatencyMeasurer,
		bridgeOrchestrator:   prodSvcs.vif.BridgeOrchestrator,
		ingressService:       prodSvcs.vif.IngressService,
		logger:               sugar,
	})

	// 12. Boot Sequence for Auto-Start Services
	go func() {
		if err := prodSvcs.orchestrator.BootSequenceManager.ExecuteBootSequence(ctx); err != nil {
			sugar.Errorw("Boot sequence completed with errors", zap.Error(err))
		}
	}()

	// 13. Print Startup Banner
	sugar.Infow("NasNetConnect Server v2.0 starting",
		"address", "0.0.0.0:"+cfg.Port,
		"memory_limit_mb", runtimeCfg.MemoryLimitMB,
		"gc_percent", runtimeCfg.GCPercent,
		"workers", runtimeCfg.ScannerWorkers,
		"graphql_endpoint", "http://localhost:"+cfg.Port+"/graphql",
		"health_check", "http://localhost:"+cfg.Port+"/health",
	)

	// 15. Start Server with Graceful Shutdown
	srv.Start(func(ctx context.Context) {
		//nolint:errcheck // best-effort shutdown
		shutdownCoordinator.Shutdown(ctx)
	})
}

// performHealthCheck performs a health check against the production port and exits.
func performHealthCheck() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "80"
	}
	hcLogger, err := zap.NewProduction()
	if err != nil {
		log.Fatalf("failed to create logger: %v", err)
	}
	server.PerformHealthCheck(port, hcLogger)
}
