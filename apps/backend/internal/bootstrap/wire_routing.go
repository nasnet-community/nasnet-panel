//go:build wireinject
// +build wireinject

package bootstrap

import (
	"github.com/google/wire"
	"go.uber.org/zap"

	"backend/generated/ent"
	"backend/internal/events"
	"backend/internal/features"
	"backend/internal/router"
	"backend/internal/vif/routing"
)

// provideChainRouter creates the chain router.
func provideChainRouter(
	routerPort *router.MockAdapter,
	systemDB *ent.Client,
	eventBus events.EventBus,
) (*routing.ChainRouter, error) {
	return routing.NewChainRouter(routing.ChainRouterConfig{
		RouterPort: routerPort,
		Store:      systemDB,
		EventBus:   eventBus,
	})
}

// providePBREngine creates the PBR engine.
func providePBREngine(
	routerPort *router.MockAdapter,
	systemDB *ent.Client,
	eventBus events.EventBus,
) *routing.PBREngine {
	pbrPublisher := events.NewPublisher(eventBus, "pbr-engine")
	return routing.NewPBREngine(routerPort, systemDB, eventBus, pbrPublisher)
}

// provideRoutingMatrixService creates the routing matrix service.
func provideRoutingMatrixService(
	routerPort *router.MockAdapter,
	systemDB *ent.Client,
) *routing.RoutingMatrixService {
	return routing.NewRoutingMatrixService(routerPort, systemDB)
}

// provideChainLatencyMeasurer creates the chain latency measurer.
func provideChainLatencyMeasurer(
	systemDB *ent.Client,
	eventBus events.EventBus,
	featureRegistry *features.FeatureRegistry,
) *routing.ChainLatencyMeasurer {
	return routing.NewChainLatencyMeasurer(systemDB, eventBus, featureRegistry)
}

// RoutingProviders is a Wire provider set for all routing engine components.
var RoutingProviders = wire.NewSet(
	provideChainRouter,
	providePBREngine,
	provideRoutingMatrixService,
	provideChainLatencyMeasurer,
	wire.Struct(new(RoutingComponents), "*"),
)

// InjectRouting is a Wire injector that constructs the complete routing engine.
func InjectRouting(
	systemDB *ent.Client,
	eventBus events.EventBus,
	routerPort *router.MockAdapter,
	featureRegistry *features.FeatureRegistry,
	logger *zap.SugaredLogger,
) (*RoutingComponents, error) {
	wire.Build(RoutingProviders)
	return nil, nil
}
