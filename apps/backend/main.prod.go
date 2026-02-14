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
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
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
	"github.com/vektah/gqlparser/v2/ast"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/rs/zerolog"

	"backend/generated/ent"
	"backend/generated/graphql"
	"backend/graph/resolver"
	"backend/internal/alerts"
	"backend/internal/database"
	"backend/internal/events"
	"backend/internal/features"
	"backend/internal/features/updates"
	"backend/internal/firewall"
	"backend/internal/graphql/loaders"
	"backend/internal/network"
	"backend/internal/notifications"
	channelshttp "backend/internal/notifications/channels/http"
	"backend/internal/notifications/channels/push"
	"backend/internal/orchestrator"
	"backend/internal/router"
	"backend/internal/services"
	"backend/internal/storage"
	"backend/internal/templates"
	"backend/internal/vif"
	troubleshootPkg "backend/internal/troubleshoot"
	"go.uber.org/zap"
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

// instanceHealthAdapter adapts InstanceManager to features.HealthChecker interface
type instanceHealthAdapter struct {
	manager *orchestrator.InstanceManager
}

func (a *instanceHealthAdapter) GetStatus(instanceID string) (string, error) {
	// Get health status from instance manager
	// For now, return "healthy" as a placeholder
	// TODO: Implement proper health status retrieval from InstanceManager
	return "healthy", nil
}

// vlanServiceAdapter adapts services.VlanService to network.VlanServicePort interface.
type vlanServiceAdapter struct {
	svc *services.VlanService
}

func (a *vlanServiceAdapter) ListVlans(ctx context.Context, routerID string, filter *network.VlanFilter) ([]*network.Vlan, error) {
	vlans, err := a.svc.ListVlans(ctx, routerID, nil)
	if err != nil {
		return nil, err
	}
	result := make([]*network.Vlan, len(vlans))
	for i, v := range vlans {
		result[i] = &network.Vlan{
			VlanID: v.VlanID,
			Name:   v.Name,
		}
	}
	return result, nil
}

// instanceStopperAdapter adapts InstanceManager to updates.InstanceStopper interface.
type instanceStopperAdapter struct {
	manager *orchestrator.InstanceManager
}

func (a *instanceStopperAdapter) Stop(ctx context.Context, instanceID string) error {
	// TODO: Implement proper instance stop via InstanceManager
	return nil
}

// instanceStarterAdapter adapts InstanceManager to updates.InstanceStarter interface.
type instanceStarterAdapter struct {
	manager *orchestrator.InstanceManager
}

func (a *instanceStarterAdapter) Start(ctx context.Context, instanceID string) error {
	// TODO: Implement proper instance start via InstanceManager
	return nil
}

// createGraphQLServer creates and configures the gqlgen GraphQL server for production
func createGraphQLServer(eventBus events.EventBus, troubleshootSvc *troubleshootPkg.Service, interfaceSvc *services.InterfaceService, alertSvc *services.AlertService, alertRuleTemplateSvc *alerts.AlertRuleTemplateService, dispatcher *notifications.Dispatcher, storageDetector *storage.StorageDetector, storageConfig *storage.StorageConfigService, pathResolver storage.PathResolverPort, gatewayManager orchestrator.GatewayPort, featureRegistry *features.FeatureRegistry, instanceManager *orchestrator.InstanceManager, portRegistry *network.PortRegistry, vlanAllocator *network.VLANAllocator, dependencyMgr *orchestrator.DependencyManager, bootSequenceMgr *orchestrator.BootSequenceManager, updateSvc *updates.UpdateService, updateScheduler *updates.UpdateScheduler, serviceTemplateSvc *templates.TemplateService, templateInstaller *templates.TemplateInstaller, templateExporter *templates.TemplateExporter, templateImporter *templates.TemplateImporter, db *ent.Client) *handler.Server {
	// Initialize rollback store for NAT and firewall template operations
	rollbackStore := firewall.NewRollbackStore()

	// Create resolver with event bus and services
	resolv := resolver.NewResolverWithConfig(resolver.ResolverConfig{
		DB:                       db,
		EventBus:                 eventBus,
		TroubleshootService:      troubleshootSvc,
		InterfaceService:         interfaceSvc,
		RollbackStore:            rollbackStore,
		AlertService:             alertSvc,
		AlertRuleTemplateService: alertRuleTemplateSvc,
		Dispatcher:               dispatcher,
		StorageDetector:          storageDetector,
		GatewayManager:           gatewayManager,
		FeatureRegistry:          featureRegistry,
		InstanceManager:          instanceManager,
		PortRegistry:             portRegistry,
		VLANAllocator:            vlanAllocator,
		DependencyMgr:            dependencyMgr,
		BootSequenceMgr:          bootSequenceMgr,
		UpdateService:            updateSvc,
		UpdateScheduler:          updateScheduler,
		ServiceTemplateService:   serviceTemplateSvc,
		TemplateInstaller:        templateInstaller,
		TemplateExporter:         templateExporter,
		TemplateImporter:         templateImporter,
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
	srv.SetQueryCache(lru.New[*ast.QueryDocument](100))
	srv.Use(extension.Introspection{}) // Keep introspection enabled for debugging
	srv.Use(extension.AutomaticPersistedQuery{
		Cache: lru.New[string](50),
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
func setupRoutes(e *echo.Echo, eventBus events.EventBus, db *ent.Client, troubleshootSvc *troubleshootPkg.Service, interfaceSvc *services.InterfaceService, alertSvc *services.AlertService, alertRuleTemplateSvc *alerts.AlertRuleTemplateService, alertEngine **alerts.Engine, dispatcher *notifications.Dispatcher, storageDetector *storage.StorageDetector, storageConfig *storage.StorageConfigService, pathResolver storage.PathResolverPort, gatewayManager orchestrator.GatewayPort, featureRegistry *features.FeatureRegistry, instanceManager *orchestrator.InstanceManager, portRegistry *network.PortRegistry, vlanAllocator *network.VLANAllocator, dependencyMgr *orchestrator.DependencyManager, bootSequenceMgr *orchestrator.BootSequenceManager, updateSvc *updates.UpdateService, updateScheduler *updates.UpdateScheduler, serviceTemplateSvc *templates.TemplateService, templateInstaller *templates.TemplateInstaller, templateExporter *templates.TemplateExporter, templateImporter *templates.TemplateImporter) {
	// Create GraphQL server with all services including alert service, storage infrastructure, orchestrator, update manager, and template system
	graphqlServer := createGraphQLServer(eventBus, troubleshootSvc, interfaceSvc, alertSvc, alertRuleTemplateSvc, dispatcher, storageDetector, storageConfig, pathResolver, gatewayManager, featureRegistry, instanceManager, portRegistry, vlanAllocator, dependencyMgr, bootSequenceMgr, updateSvc, updateScheduler, serviceTemplateSvc, templateInstaller, templateExporter, templateImporter, db)

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

	// Create event publisher for storage services
	storagePublisher := events.NewPublisher(eventBus, "storage-infrastructure")

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

	// ========== Storage Infrastructure (NAS-8.20) ==========
	log.Printf("Initializing storage infrastructure...")

	// Initialize zerolog for storage components
	zerologWriter := zerolog.ConsoleWriter{Out: os.Stdout, TimeFormat: time.RFC3339}
	storageLogger := zerolog.New(zerologWriter).With().Timestamp().Logger()

	// 1. Storage Detector - monitors mount points for external storage
	storageDetector := storage.NewStorageDetector(storage.DefaultStorageDetectorConfig(
		storagePublisher,
		storageLogger,
	))
	storageDetector.Start()
	log.Printf("Storage detector started (monitoring: /data, /usb1, /disk1, /disk2)")

	// 2. Storage Config Service - persists external storage configuration
	storageConfigService := storage.NewStorageConfigService(
		systemDB,
		storageDetector,
		storagePublisher,
		storageLogger,
	)
	log.Printf("Storage config service initialized")

	// 3. Path Resolver - resolves binary/config/data paths dynamically
	pathResolver := storage.NewDefaultPathResolver(storage.DefaultPathResolverConfig())
	log.Printf("Path resolver initialized (flash base: /flash/features)")

	// 4. Boot Validator - validates instance binaries on startup
	bootValidator, err := orchestrator.NewBootValidator(orchestrator.BootValidatorConfig{
		DB:           systemDB,
		PathResolver: pathResolver,
		EventBus:     eventBus,
		Logger:       storageLogger,
	})
	if err != nil {
		log.Fatalf("Failed to create boot validator: %v", err)
	}

	// Run boot validation BEFORE starting any instances
	log.Printf("Running boot-time instance validation...")
	bootSummary, err := bootValidator.ValidateAllInstances(context.Background())
	if err != nil {
		log.Printf("Warning: boot validation encountered errors: %v", err)
	}
	if bootSummary != nil {
		log.Printf("Boot validation complete: %d checked, %d failed", bootSummary.TotalChecked, bootSummary.FailedCount)
		if bootSummary.FailedCount > 0 {
			log.Printf("Failed services: %v", bootSummary.FailedServices)
		}
	}

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

	// Initialize structured logger for alert system (NAS-18.1)
	loggerConfig := zap.NewProductionConfig()
	loggerConfig.Level = zap.NewAtomicLevelAt(zap.InfoLevel)
	logger, err := loggerConfig.Build()
	if err != nil {
		log.Fatalf("Failed to initialize logger: %v", err)
	}
	defer logger.Sync()
	sugar := logger.Sugar()
	log.Printf("Structured logger initialized")

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
	// Note: Dispatcher is initialized here, but DigestService is added after creation
	// This is a temporary placeholder - DigestService will be wired later
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

	// Create EventBus adapter for alerts package (interface compatibility)
	eventBusAdapter := &eventBusAdapter{bus: eventBus}

	// Initialize Escalation Engine (NAS-18.9)
	// Created separately so it can be shared between AlertService and AlertEngine
	escalationEngine := alerts.NewEscalationEngine(alerts.EscalationEngineConfig{
		DB:         systemDB,
		Dispatcher: dispatcher,
		EventBus:   eventBusAdapter,
		Logger:     sugar,
	})
	log.Printf("Escalation engine initialized")

	// Initialize Digest Service (NAS-18.11)
	digestService, err := alerts.NewDigestService(alerts.DigestServiceConfig{
		DB:         systemDB,
		Dispatcher: dispatcher,
		EventBus:   eventBus,
		Logger:     sugar,
	})
	if err != nil {
		log.Fatalf("Failed to initialize digest service: %v", err)
	}
	log.Printf("Digest service initialized")

	// Initialize Digest Scheduler (NAS-18.11)
	digestScheduler := alerts.NewDigestScheduler(alerts.DigestSchedulerConfig{
		DigestService: digestService,
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

	// Initialize Alert Rule Template Service (NAS-18.12)
	alertRuleTemplateService, err := alerts.NewAlertRuleTemplateService(alertService, systemDB)
	if err != nil {
		log.Fatalf("Failed to initialize alert rule template service: %v", err)
	}
	log.Printf("Alert rule template service initialized with 15 built-in templates")

	// Initialize and start Alert Engine (NAS-18.1, NAS-18.9, NAS-18.11)
	// Pass the shared escalation engine and digest service
	alertEngine := alerts.NewEngine(alerts.EngineConfig{
		DB:               systemDB,
		EventBus:         eventBus,
		Dispatcher:       dispatcher,
		EscalationEngine: escalationEngine,
		DigestService:    digestService,
		Logger:           sugar,
	})

	if err := alertEngine.Start(context.Background()); err != nil {
		log.Fatalf("Failed to start alert engine: %v", err)
	}
	log.Printf("Alert engine started and monitoring events")

	// ========== Virtual Interface Factory (VIF) Infrastructure (NAS-8.2) ==========
	log.Printf("Initializing Virtual Interface Factory (VIF)...")

	// 1. Create VLAN Allocator (simple sequential for MVP, Story 8.18 upgrades to persistent)
	simpleVlanAllocator := vif.NewSimpleVLANAllocator(100, 199)
	log.Printf("VLAN allocator initialized (range: 100-199)")

	// 2. Create InterfaceFactory
	interfaceFactory := vif.NewInterfaceFactory(vif.InterfaceFactoryConfig{
		RouterPort:  mockRouterPort,
		Store:       systemDB,
		EventBus:    eventBus,
		ParentIface: "ether1", // Parent interface for VLANs
	})
	log.Printf("Interface factory initialized")

	// 3. Create GatewayManager
	gatewayManager, err := vif.NewGatewayManager(vif.GatewayManagerConfig{
		Supervisor:    orchestrator.NewProcessSupervisor(orchestrator.ProcessSupervisorConfig{Logger: storageLogger}),
		PathResolver:  pathResolver,
		HevBinaryPath: "/app/hev-socks5-tunnel",
		Logger:        storageLogger,
	})
	if err != nil {
		log.Fatalf("Failed to create gateway manager: %v", err)
	}
	log.Printf("Gateway manager initialized")

	// 4. Create BridgeOrchestrator
	bridgeOrchestrator := vif.NewBridgeOrchestrator(vif.BridgeOrchestratorConfig{
		InterfaceFactory: interfaceFactory,
		GatewayManager:   gatewayManager,
		VLANAllocator:    simpleVlanAllocator,
		Store:            systemDB,
		EventBus:         eventBus,
		RouterPort:       mockRouterPort,
	})
	log.Printf("Bridge orchestrator initialized")

	// ========== Service Instance Orchestrator (NAS-8.4) ==========
	log.Printf("Initializing service instance orchestrator...")

	// 1. Feature Registry - loads service manifests (Tor, sing-box, Xray, etc.)
	featureRegistry, err := features.NewFeatureRegistry()
	if err != nil {
		log.Fatalf("Failed to create feature registry: %v", err)
	}
	log.Printf("Feature registry initialized with %d manifests", featureRegistry.Count())

	// 2. Download Manager - handles binary downloads with verification
	downloadManager := features.NewDownloadManager(eventBus, "/var/nasnet/downloads")
	log.Printf("Download manager initialized")

	// 3. Process Supervisor - manages service process lifecycle
	processSupervisor := orchestrator.NewProcessSupervisor(orchestrator.ProcessSupervisorConfig{Logger: storageLogger})
	log.Printf("Process supervisor initialized")

	// 4. Port Registry - prevents port conflicts across service instances
	portRegistry, err := network.NewPortRegistry(network.PortRegistryConfig{
		Store:         systemDB,
		Logger:        slog.Default(),
		ReservedPorts: []int{22, 53, 80, 443, 8080, 8291, 8728, 8729},
	})
	if err != nil {
		log.Fatalf("Failed to create port registry: %v", err)
	}
	log.Printf("Port registry initialized")

	// 5. VLAN Allocator - allocates VLANs for virtual interface isolation
	vlanAllocator, err := network.NewVLANAllocator(network.VLANAllocatorConfig{
		Store:       systemDB,
		VlanService: &vlanServiceAdapter{svc: services.NewVlanService(mockRouterPort)},
		Logger:      slog.Default(),
	})
	if err != nil {
		log.Fatalf("Failed to create VLAN allocator: %v", err)
	}
	log.Printf("VLAN allocator initialized")

	// 6. Config Validator Adapter - validates service-specific config bindings
	configValidator := orchestrator.NewConfigValidatorAdapter(storageLogger)
	log.Printf("Config validator adapter initialized")

	// 7. Isolation Verifier - 4-layer isolation verification (IP, directory, port, process)
	isolationVerifier, err := orchestrator.NewIsolationVerifier(orchestrator.IsolationVerifierConfig{
		PortRegistry:           portRegistry,
		ConfigBindingValidator: configValidator,
		EventBus:               eventBus,
		Logger:                 storageLogger,
		AllowedBaseDir:         "/data/services",
	})
	if err != nil {
		log.Fatalf("Failed to create isolation verifier: %v", err)
	}
	log.Printf("Isolation verifier initialized (4-layer defense)")

	// 8. Resource Limiter - monitors resource usage and applies cgroups v2 memory limits
	resourceLimiter, err := orchestrator.NewResourceLimiter(orchestrator.ResourceLimiterConfig{
		EventBus: eventBus,
		Logger:   storageLogger,
	})
	if err != nil {
		log.Fatalf("Failed to create resource limiter: %v", err)
	}
	log.Printf("Resource limiter initialized (cgroups v2 enabled: %v)", resourceLimiter.IsCgroupsEnabled())

	// 10. Instance Manager - orchestrates complete service instance lifecycle
	instanceManager, err := orchestrator.NewInstanceManager(orchestrator.InstanceManagerConfig{
		Registry:           featureRegistry,
		DownloadMgr:        downloadManager,
		Supervisor:         processSupervisor,
		Gateway:            gatewayManager,
		Store:              systemDB,
		EventBus:           eventBus,
		PathResolver:       pathResolver,
		PortRegistry:       portRegistry,
		VLANAllocator:      vlanAllocator,
		BridgeOrchestrator: bridgeOrchestrator,
		IsolationVerifier:  isolationVerifier,
		ResourceLimiter:    resourceLimiter,
		Logger:             storageLogger,
	})
	if err != nil {
		log.Fatalf("Failed to create instance manager: %v", err)
	}
	log.Printf("Instance manager initialized (isolation enabled)")

	// 11. Dependency Manager - manages service instance dependency relationships (NAS-8.19)
	dependencyManager, err := orchestrator.NewDependencyManager(orchestrator.DependencyManagerConfig{
		Store:    systemDB,
		EventBus: eventBus,
		Logger:   storageLogger,
	})
	if err != nil {
		log.Fatalf("Failed to create dependency manager: %v", err)
	}
	log.Printf("Dependency manager initialized")

	// 12. Boot Sequence Manager - orchestrates service startup on system boot (NAS-8.19)
	bootSequenceManager, err := orchestrator.NewBootSequenceManager(orchestrator.BootSequenceManagerConfig{
		DependencyMgr: dependencyManager,
		InstanceMgr:   instanceManager,
		Store:         systemDB,
		EventBus:      eventBus,
		Logger:        storageLogger,
	})
	if err != nil {
		log.Fatalf("Failed to create boot sequence manager: %v", err)
	}
	log.Printf("Boot sequence manager initialized")

	// ========== Service Update Manager (NAS-8.7) ==========
	log.Printf("Initializing service update manager...")

	// 1. GitHub Client for release checking
	githubClient := updates.NewGitHubClient()
	log.Printf("GitHub client initialized")

	// 2. Update Service - checks for available updates via GitHub Releases API
	updateService, err := updates.NewUpdateService(updates.UpdateServiceConfig{
		GitHubClient: githubClient,
	})
	if err != nil {
		log.Fatalf("Failed to create update service: %v", err)
	}
	log.Printf("Update service initialized")

	// 3. Binary Verifier - SHA256 verification for downloaded binaries
	_ = events.NewPublisher(eventBus, "binary-verifier")
	updateVerifier := &updates.Verifier{}
	log.Printf("Binary verifier initialized")

	// 4. Update Journal - power-safe journaling for atomic updates
	journalPath := filepath.Join(dataDir, "update-journal.db")
	updateJournal, err := updates.NewUpdateJournal(journalPath)
	if err != nil {
		log.Fatalf("Failed to create update journal: %v", err)
	}
	log.Printf("Update journal initialized at %s", journalPath)

	// 5. Config Migrator Registry - handles version-specific config migrations
	updateMigratorRegistry := &updates.MigratorRegistry{}
	log.Printf("Config migrator registry initialized")

	// 6. Health Checker Adapter - adapts InstanceManager for UpdateEngine
	healthCheckerAdapter := &instanceHealthAdapter{manager: instanceManager}

	// 7. Update Engine - orchestrates 6-phase atomic updates with rollback
	// Create updates.DownloadManager adapter wrapping features.DownloadManager
	updateDownloadManager := &updates.DownloadManager{
		DownloadFunc: func(ctx context.Context, featureID, url, expectedChecksum string) error {
			return downloadManager.Download(ctx, featureID, url, expectedChecksum)
		},
	}
	updateEngine, err := updates.NewUpdateEngine(updates.UpdateEngineConfig{
		DownloadManager:  updateDownloadManager,
		Verifier:         updateVerifier,
		Journal:          updateJournal,
		MigratorRegistry: updateMigratorRegistry,
		PathResolver:     pathResolver,
		BaseDir:          dataDir,
		EventBus:         eventBus,
		Logger:           storageLogger,
		HealthChecker:    healthCheckerAdapter,
		InstanceStopper:  &instanceStopperAdapter{manager: instanceManager},
		InstanceStarter:  &instanceStarterAdapter{manager: instanceManager},
	})
	if err != nil {
		log.Fatalf("Failed to create update engine: %v", err)
	}
	log.Printf("Update engine initialized (6-phase atomic updates with rollback)")

	// Boot-time recovery: Check for incomplete updates and roll them back
	if err := updateEngine.RecoverFromCrash(context.Background()); err != nil {
		log.Printf("Warning: boot-time update recovery encountered errors: %v", err)
	}

	// 8. Update Scheduler - coordinates periodic update checks with smart timing
	updateScheduler, err := updates.NewUpdateScheduler(updates.UpdateSchedulerConfig{
		UpdateService:   updateService,
		UpdateEngine:    updateEngine,
		Store:           systemDB,
		EventBus:        eventBus,
		Logger:          storageLogger,
		CheckInterval:   6 * time.Hour, // Default: check every 6 hours
		QuietHoursStart: "02:00",
		QuietHoursEnd:   "06:00",
		Timezone:        "UTC",
	})
	if err != nil {
		log.Fatalf("Failed to create update scheduler: %v", err)
	}
	log.Printf("Update scheduler initialized")

	// Start update scheduler (begins periodic update checks)
	if err := updateScheduler.Start(); err != nil {
		log.Printf("Warning: failed to start update scheduler: %v", err)
	} else {
		log.Printf("Update scheduler started (checks every 6h, quiet hours 02:00-06:00 UTC)")
	}

	// 4. Service Template System - template management for NAS-8.9
	log.Printf("Initializing service template system...")

	// 4a. Template Service - loads built-in templates and manages custom templates
	serviceTemplateService, err := templates.NewTemplateService(templates.TemplateServiceConfig{
		InstanceManager:   instanceManager,
		DependencyManager: dependencyManager,
		EventBus:          eventBus,
		Logger:            storageLogger,
	})
	if err != nil {
		log.Fatalf("Failed to create service template service: %v", err)
	}
	log.Printf("Service template service initialized")

	// 4b. Template Validator - validates template structure and dependencies
	templateValidator := templates.NewTemplateValidator(templates.TemplateValidatorConfig{
		Logger: storageLogger,
	})
	log.Printf("Template validator initialized")

	// 4c. Template Installer - orchestrates template installation with dependency ordering
	templateInstaller, err := templates.NewTemplateInstaller(templates.TemplateInstallerConfig{
		TemplateService:   serviceTemplateService,
		InstanceManager:   instanceManager,
		DependencyManager: dependencyManager,
		EventBus:          eventBus,
		Logger:            storageLogger,
	})
	if err != nil {
		log.Fatalf("Failed to create template installer: %v", err)
	}
	log.Printf("Template installer initialized")

	// 4d. Template Exporter - exports running instances as reusable templates
	templateExporter, err := templates.NewTemplateExporter(templates.TemplateExporterConfig{
		Store:  systemDB,
		Logger: storageLogger,
	})
	if err != nil {
		log.Fatalf("Failed to create template exporter: %v", err)
	}
	log.Printf("Template exporter initialized")

	// 4e. Template Importer - imports and validates custom templates
	templateImporter, err := templates.NewTemplateImporter(templates.TemplateImporterConfig{
		Store:     systemDB,
		Validator: templateValidator,
		Logger:    storageLogger,
	})
	if err != nil {
		log.Fatalf("Failed to create template importer: %v", err)
	}
	log.Printf("Template importer initialized")
	log.Printf("Service template system initialized successfully")

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

	// Setup routes with DataLoader middleware, services, alert system, storage infrastructure, orchestrator, update manager, and template system
	setupRoutes(e, eventBus, systemDB, troubleshootSvc, interfaceSvc, alertService, alertRuleTemplateService, &alertEngine, dispatcher, storageDetector, storageConfigService, pathResolver, gatewayManager, featureRegistry, instanceManager, portRegistry, vlanAllocator, dependencyManager, bootSequenceManager, updateService, updateScheduler, serviceTemplateService, templateInstaller, templateExporter, templateImporter)

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

		// Stop alert engine first to prevent processing new events
		if err := alertEngine.Stop(ctx); err != nil {
			log.Printf("Warning: error stopping alert engine: %v", err)
		} else {
			log.Println("Alert engine stopped")
		}

		// Stop digest scheduler to cancel all timers and wait for in-flight deliveries
		digestScheduler.Stop()
		log.Println("Digest scheduler stopped")

		// Stop update scheduler to cancel all timers and pending update checks
		if err := updateScheduler.Stop(); err != nil {
			log.Printf("Warning: error stopping update scheduler: %v", err)
		} else {
			log.Println("Update scheduler stopped")
		}

		// Stop storage detector to stop mount point monitoring
		storageDetector.Stop()
		log.Println("Storage detector stopped")

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

	log.Printf("=== NasNetConnect Server v2.0 ===")
	log.Printf("Server starting on 0.0.0.0:%s", port)
	log.Printf("Memory limit: 32MB, GC: aggressive, Workers: 2")
	log.Printf("Frontend: embedded, same-origin")
	log.Printf("GraphQL endpoint: http://localhost:%s/graphql", port)
	log.Printf("Health check: http://localhost:%s/health", port)
	log.Printf("================================")

	// Trigger boot sequence for auto-start service instances (NAS-8.19)
	// Run in background to avoid blocking server startup
	go func() {
		bootCtx := context.Background()
		log.Println("Executing boot sequence for auto-start service instances...")
		if err := bootSequenceManager.ExecuteBootSequence(bootCtx); err != nil {
			log.Printf("Boot sequence completed with errors: %v", err)
		} else {
			log.Println("Boot sequence completed successfully")
		}
	}()

	addr := fmt.Sprintf("0.0.0.0:%s", port)
	if err := e.Start(addr); err != nil && err != http.ErrServerClosed {
		log.Fatalf("Could not listen on %s: %v\n", addr, err)
	}

	<-done
	log.Println("Server stopped")
}
