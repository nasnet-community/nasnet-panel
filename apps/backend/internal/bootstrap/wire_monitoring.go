//go:build wireinject
// +build wireinject

package bootstrap

import (
	"github.com/google/wire"
	"go.uber.org/zap"

	"backend/generated/ent"
	"backend/internal/events"
	"backend/internal/router"
	"backend/internal/services/monitoring"
	"backend/internal/services/pollers"
)

// provideTelemetryService creates the telemetry service with three-tier architecture.
// Tier 1 (Hot): Last 1 hour at full resolution
// Tier 2 (Warm): Last 24 hours at 5-minute aggregation
// Tier 3 (Cold): Last 30 days at 1-hour aggregation
func provideTelemetryService(
	systemDB *ent.Client,
	eventBus events.EventBus,
	routerPort *router.MockAdapter,
) *monitoring.TelemetryService {
	return monitoring.NewTelemetryService(routerPort, systemDB, eventBus)
}

// provideStatsPoller creates the real-time interface statistics poller.
func provideStatsPoller(
	routerPort *router.MockAdapter,
	eventBus events.EventBus,
) *pollers.StatsPoller {
	return pollers.NewStatsPoller(routerPort, eventBus)
}

// MonitoringProviders is a Wire provider set for all monitoring components.
var MonitoringProviders = wire.NewSet(
	provideTelemetryService,
	provideStatsPoller,
	wire.Struct(new(MonitoringComponents), "*"),
)

// InjectMonitoringServices is a Wire injector that constructs all monitoring components.
func InjectMonitoringServices(
	systemDB *ent.Client,
	eventBus events.EventBus,
	routerPort *router.MockAdapter,
	logger *zap.SugaredLogger,
) (*MonitoringComponents, error) {
	wire.Build(MonitoringProviders)
	return nil, nil
}
