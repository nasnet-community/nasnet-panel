package bootstrap

import (
	"go.uber.org/zap"

	"backend/generated/ent"
	"backend/internal/events"
	"backend/internal/features"
	"backend/internal/router"
	"backend/internal/vif/routing"
)

// RoutingComponents holds all initialized routing engine components.
type RoutingComponents struct {
	ChainRouter          *routing.ChainRouter
	PBREngine            *routing.PBREngine
	RoutingMatrixSvc     *routing.RoutingMatrixService
	ChainLatencyMeasurer *routing.ChainLatencyMeasurer
}

// InitializeRouting creates and initializes routing engine components.
// This includes:
// - Chain router (multi-hop routing chains)
// - PBR engine (policy-based routing mangle rules)
// - Routing matrix service (device discovery + routing assignment view)
// - Chain latency measurer (latency probes for chain hops)
func InitializeRouting(
	systemDB *ent.Client,
	eventBus events.EventBus,
	routerPort *router.MockAdapter,
	featureRegistry *features.FeatureRegistry,
	logger *zap.SugaredLogger,
) (*RoutingComponents, error) {

	logger.Infow("Initializing routing engine components")

	// 1. Create ChainRouter
	chainRouter, err := routing.NewChainRouter(routing.ChainRouterConfig{
		RouterPort: routerPort,
		Store:      systemDB,
		EventBus:   eventBus,
	})
	if err != nil {
		return nil, err
	}
	logger.Infow("Chain router initialized")

	// 2. Create PBR Engine
	pbrPublisher := events.NewPublisher(eventBus, "pbr-engine")
	pbrEngine := routing.NewPBREngine(routerPort, systemDB, eventBus, pbrPublisher)
	logger.Infow("PBR engine initialized")

	// 3. Create Routing Matrix Service
	routingMatrixSvc := routing.NewRoutingMatrixService(routerPort, systemDB)
	logger.Infow("Routing matrix service initialized")

	// 4. Create Chain Latency Measurer
	chainLatencyMeasurer := routing.NewChainLatencyMeasurer(systemDB, eventBus, featureRegistry)
	logger.Infow("Chain latency measurer initialized")

	return &RoutingComponents{
		ChainRouter:          chainRouter,
		PBREngine:            pbrEngine,
		RoutingMatrixSvc:     routingMatrixSvc,
		ChainLatencyMeasurer: chainLatencyMeasurer,
	}, nil
}
