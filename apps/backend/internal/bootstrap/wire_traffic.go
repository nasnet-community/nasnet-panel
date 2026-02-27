//go:build wireinject
// +build wireinject

package bootstrap

import (
	"context"

	"github.com/google/wire"
	"go.uber.org/zap"

	"backend/generated/ent"
	"backend/internal/events"
	"backend/internal/router"
	"backend/internal/services/pollers"
	"backend/internal/vif/traffic"
)

// provideServiceTrafficPoller creates the service traffic poller.
func provideServiceTrafficPoller(
	routerPort *router.MockAdapter,
	eventBus events.EventBus,
) *pollers.ServiceTrafficPoller {
	return pollers.NewServiceTrafficPoller(routerPort, eventBus)
}

// provideTrafficAggregator creates and starts the traffic aggregator.
func provideTrafficAggregator(
	ctx context.Context,
	systemDB *ent.Client,
) *traffic.TrafficAggregator {
	aggregator := traffic.NewTrafficAggregator(systemDB)
	aggregator.Start(ctx)
	return aggregator
}

// provideDeviceTrafficTracker creates the device traffic tracker.
func provideDeviceTrafficTracker(
	routerPort *router.MockAdapter,
) *traffic.DeviceTrafficTracker {
	return traffic.NewDeviceTrafficTracker(routerPort)
}

// provideQuotaEnforcer creates the quota enforcer.
func provideQuotaEnforcer(
	systemDB *ent.Client,
	eventBus events.EventBus,
	routerPort *router.MockAdapter,
) *traffic.QuotaEnforcer {
	return traffic.NewQuotaEnforcer(systemDB, eventBus, routerPort)
}

// TrafficProviders is a Wire provider set for all traffic management components.
var TrafficProviders = wire.NewSet(
	provideServiceTrafficPoller,
	provideTrafficAggregator,
	provideDeviceTrafficTracker,
	provideQuotaEnforcer,
	wire.Struct(new(TrafficComponents), "*"),
)

// InjectTrafficManagement is a Wire injector that constructs the complete traffic management system.
func InjectTrafficManagement(
	ctx context.Context,
	systemDB *ent.Client,
	eventBus events.EventBus,
	routerPort *router.MockAdapter,
	logger *zap.Logger,
) (*TrafficComponents, error) {
	wire.Build(TrafficProviders)
	return nil, nil
}
