//go:build !dev
// +build !dev

package main

import (
	"backend/generated/ent"
	"backend/generated/graphql"
	"backend/graph/resolver"
	"backend/internal/alerts"
	"backend/internal/events"
	"backend/internal/features"
	"backend/internal/features/updates"
	"backend/internal/firewall"
	"backend/internal/graphql/loaders"
	"backend/internal/network"
	"backend/internal/notifications"
	"backend/internal/orchestrator"
	"backend/internal/server"
	"backend/internal/services"
	"backend/internal/storage"
	"backend/internal/templates"
	troubleshootPkg "backend/internal/troubleshoot"

	"github.com/labstack/echo/v4"
)

// prodRoutesDeps holds all dependencies for production route setup.
type prodRoutesDeps struct {
	eventBus             events.EventBus
	systemDB             *ent.Client
	troubleshootSvc      *troubleshootPkg.Service
	interfaceSvc         *services.InterfaceService
	alertSvc             *services.AlertService
	alertRuleTemplateSvc *alerts.AlertRuleTemplateService
	dispatcher           *notifications.Dispatcher
	frontendHandler      echo.HandlerFunc
	storageDetector      *storage.StorageDetector
	storageConfig        *storage.StorageConfigService
	pathResolver         storage.PathResolverPort
	gatewayManager       orchestrator.GatewayPort
	featureRegistry      *features.FeatureRegistry
	instanceManager      *orchestrator.InstanceManager
	portRegistry         *network.PortRegistry
	vlanAllocator        *network.VLANAllocator
	dependencyMgr        *orchestrator.DependencyManager
	bootSequenceMgr      *orchestrator.BootSequenceManager
	updateSvc            *updates.UpdateService
	updateScheduler      *updates.UpdateScheduler
	serviceTemplateSvc   *templates.TemplateService
	templateInstaller    *templates.TemplateInstaller
	templateExporter     *templates.TemplateExporter
	templateImporter     *templates.TemplateImporter
}

// setupProdRoutes configures all HTTP routes for production.
func setupProdRoutes(e *echo.Echo, deps prodRoutesDeps) {
	rollbackStore := firewall.NewRollbackStore()

	resolv := resolver.NewResolverWithConfig(resolver.ResolverConfig{
		DB:                       deps.systemDB,
		EventBus:                 deps.eventBus,
		TroubleshootService:      deps.troubleshootSvc,
		InterfaceService:         deps.interfaceSvc,
		RollbackStore:            rollbackStore,
		AlertService:             deps.alertSvc,
		AlertRuleTemplateService: deps.alertRuleTemplateSvc,
		Dispatcher:               deps.dispatcher,
		StorageDetector:          deps.storageDetector,
		GatewayManager:           deps.gatewayManager,
		FeatureRegistry:          deps.featureRegistry,
		InstanceManager:          deps.instanceManager,
		PortRegistry:             deps.portRegistry,
		VLANAllocator:            deps.vlanAllocator,
		DependencyMgr:            deps.dependencyMgr,
		BootSequenceMgr:          deps.bootSequenceMgr,
		UpdateService:            deps.updateSvc,
		UpdateScheduler:          deps.updateScheduler,
		ServiceTemplateService:   deps.serviceTemplateSvc,
		TemplateInstaller:        deps.templateInstaller,
		TemplateExporter:         deps.templateExporter,
		TemplateImporter:         deps.templateImporter,
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
