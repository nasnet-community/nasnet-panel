//go:build !dev
// +build !dev

package main

import (
	"backend/generated/ent"
	"backend/graph"
	"backend/graph/resolver"
	"backend/internal/alerts"
	"backend/internal/auth"
	"backend/internal/capability"
	"backend/internal/config"
	"backend/internal/credentials"
	"backend/internal/diagnostics"
	"backend/internal/dns"
	"backend/internal/features"
	"backend/internal/features/sharing"
	"backend/internal/features/updates"
	"backend/internal/firewall"
	"backend/internal/graphql/loaders"
	"backend/internal/notifications"
	"backend/internal/orchestrator/boot"
	"backend/internal/orchestrator/dependencies"
	"backend/internal/orchestrator/lifecycle"
	"backend/internal/orchestrator/scheduling"
	scannerPkg "backend/internal/scanner"
	"backend/internal/server"
	"backend/internal/services"
	"backend/internal/templates"
	"backend/internal/traceroute"
	troubleshootPkg "backend/internal/troubleshoot"
	"backend/internal/vif/traffic"

	"backend/internal/events"
	"backend/internal/network"
	"backend/internal/orchestrator/resources"
	"backend/internal/storage"
	"backend/internal/vif/isolation"
	"backend/internal/vif/routing"

	"github.com/labstack/echo/v4"
)

// prodRoutesDeps holds all dependencies for production route setup.
type prodRoutesDeps struct {
	eventBus             events.EventBus
	systemDB             *ent.Client
	troubleshootSvc      *troubleshootPkg.Service
	interfaceSvc         *services.InterfaceService
	alertSvc             *services.AlertService
	alertTemplateSvc     *services.AlertTemplateService
	templateSvc          notifications.TemplateRenderer
	alertRuleTemplateSvc *alerts.AlertRuleTemplateService
	dispatcher           *notifications.Dispatcher
	frontendHandler      echo.HandlerFunc
	storageDetector      *storage.StorageDetector
	storageConfig        *storage.StorageConfigService
	pathResolver         storage.PathResolverPort
	gatewayManager       lifecycle.GatewayPort
	featureRegistry      *features.FeatureRegistry
	instanceManager      *lifecycle.InstanceManager
	portRegistry         *network.PortRegistry
	vlanAllocator        *network.VLANAllocator
	dependencyMgr        *dependencies.DependencyManager
	bootSequenceMgr      *boot.BootSequenceManager
	updateSvc            *updates.UpdateService
	updateScheduler      *updates.UpdateScheduler
	serviceTemplateSvc   *templates.TemplateService
	templateInstaller    *templates.TemplateInstaller
	templateExporter     *templates.TemplateExporter
	templateImporter     *templates.TemplateImporter
	authSvc              *auth.Service
	scannerSvc           *scannerPkg.ScannerService
	capabilitySvc        *capability.Service
	diagnosticsSvc       *diagnostics.Service
	tracerouteSvc        *traceroute.Service
	dnsSvc               *dns.Service
	routerSvc            *services.RouterService
	credentialSvc        *credentials.Service
	ipAddressSvc         *services.IPAddressService
	wanSvc               *services.WANService
	bridgeSvc            *services.BridgeService
	vlanSvc              *services.VlanService
	telemetrySvc         *services.TelemetryService
	statsPoller          *services.StatsPoller
	firewallTemplateSvc  *firewall.TemplateService
	addressListSvc       *firewall.AddressListService
	webhookSvc           *services.WebhookService
	sharingSvc           *sharing.Service
	scheduleSvc          *scheduling.ScheduleService
	scheduleEvaluator    *scheduling.ScheduleEvaluator
	serviceTrafficPoller *services.ServiceTrafficPoller
	trafficAggregator    *traffic.TrafficAggregator
	deviceTrafficTracker *traffic.DeviceTrafficTracker
	quotaEnforcer        *traffic.QuotaEnforcer
	configSvc            *config.Service
	chainRouter          *routing.ChainRouter
	pbrEngine            *routing.PBREngine
	routingMatrixSvc     *routing.RoutingMatrixService
	killSwitchManager    *isolation.KillSwitchManager
	resourceLimiter      *resources.ResourceLimiter
	chainLatencyMeasurer *routing.ChainLatencyMeasurer
	logger               interface {
		Errorw(msg string, keysAndValues ...interface{})
		Infow(msg string, keysAndValues ...interface{})
	}
}

// setupProdRoutes configures all HTTP routes for production.
func setupProdRoutes(e *echo.Echo, deps *prodRoutesDeps) {
	rollbackStore := firewall.NewRollbackStore()

	resolv := resolver.NewResolverWithConfig(resolver.Config{
		DB:                       deps.systemDB,
		EventBus:                 deps.eventBus,
		AuthService:              deps.authSvc,
		ScannerService:           deps.scannerSvc,
		CapabilityService:        deps.capabilitySvc,
		DiagnosticsService:       deps.diagnosticsSvc,
		TroubleshootService:      deps.troubleshootSvc,
		TracerouteService:        deps.tracerouteSvc,
		DnsService:               deps.dnsSvc,
		RouterService:            deps.routerSvc,
		CredentialService:        deps.credentialSvc,
		AlertService:             deps.alertSvc,
		AlertTemplateService:     deps.alertTemplateSvc,
		TemplateService:          deps.templateSvc,
		AlertRuleTemplateService: deps.alertRuleTemplateSvc,
		InterfaceService:         deps.interfaceSvc,
		IPAddressService:         deps.ipAddressSvc,
		WANService:               deps.wanSvc,
		BridgeService:            deps.bridgeSvc,
		VlanService:              deps.vlanSvc,
		TelemetryService:         deps.telemetrySvc,
		StatsPoller:              deps.statsPoller,
		FirewallTemplateService:  deps.firewallTemplateSvc,
		AddressListService:       deps.addressListSvc,
		RollbackStore:            rollbackStore,
		FeatureRegistry:          deps.featureRegistry,
		SharingService:           deps.sharingSvc,
		InstanceManager:          deps.instanceManager,
		Dispatcher:               deps.dispatcher,
		WebhookService:           deps.webhookSvc,
		StorageDetector:          deps.storageDetector,
		PortRegistry:             deps.portRegistry,
		VLANAllocator:            deps.vlanAllocator,
		GatewayManager:           deps.gatewayManager,
		DependencyMgr:            deps.dependencyMgr,
		BootSequenceMgr:          deps.bootSequenceMgr,
		ScheduleService:          deps.scheduleSvc,
		ScheduleEvaluator:        deps.scheduleEvaluator,
		ServiceTrafficPoller:     deps.serviceTrafficPoller,
		TrafficAggregator:        deps.trafficAggregator,
		DeviceTrafficTracker:     deps.deviceTrafficTracker,
		QuotaEnforcer:            deps.quotaEnforcer,
		UpdateService:            deps.updateSvc,
		UpdateScheduler:          deps.updateScheduler,
		ServiceTemplateService:   deps.serviceTemplateSvc,
		TemplateInstaller:        deps.templateInstaller,
		TemplateExporter:         deps.templateExporter,
		TemplateImporter:         deps.templateImporter,
		Service:                  deps.configSvc,
		ChainRouter:              deps.chainRouter,
		PBREngine:                deps.pbrEngine,
		RoutingMatrixSvc:         deps.routingMatrixSvc,
		KillSwitchManager:        deps.killSwitchManager,
		ResourceLimiter:          deps.resourceLimiter,
		ChainLatencyMeasurer:     deps.chainLatencyMeasurer,
		Logger:                   deps.logger,
	})

	schema := graph.NewExecutableSchema(graph.Config{Resolvers: resolv})

	graphqlHandler := server.NewGraphQLHandler(server.GraphQLConfig{
		Schema:          schema,
		DevMode:         false,
		AllowAllOrigins: false,
	})

	graphqlWithDataLoader := loaders.GraphQLMiddleware(loaders.Config{
		DB: deps.systemDB, DevMode: false, LogStats: false,
	})(graphqlHandler)

	e.GET("/health", echoHealthHandler)
	e.POST("/graphql", echo.WrapHandler(graphqlWithDataLoader))
	e.GET("/graphql", echo.WrapHandler(graphqlWithDataLoader))
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

	// Serve frontend files (catch-all) - must be last
	e.GET("/*", deps.frontendHandler)
}
