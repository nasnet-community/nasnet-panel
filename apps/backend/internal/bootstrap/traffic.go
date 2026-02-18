package bootstrap

import (
	"context"
	"log"

	"go.uber.org/zap"

	"backend/generated/ent"
	"backend/internal/events"
	"backend/internal/router"
	"backend/internal/services/pollers"
	"backend/internal/vif/traffic"
)

// TrafficComponents holds all initialized traffic management components.
type TrafficComponents struct {
	ServiceTrafficPoller *pollers.ServiceTrafficPoller
	TrafficAggregator    *traffic.TrafficAggregator
	DeviceTrafficTracker *traffic.DeviceTrafficTracker
	QuotaEnforcer        *traffic.QuotaEnforcer
}

// InitializeTrafficManagement creates and initializes traffic management services.
// This includes:
// - Service traffic poller (polls traffic statistics for service instances)
// - Traffic aggregator (write-behind buffering for traffic data)
// - Device traffic tracker (per-device traffic breakdown via mangle counters)
// - Quota enforcer (traffic quota enforcement with event-driven warnings)
func InitializeTrafficManagement(
	ctx context.Context,
	systemDB *ent.Client,
	eventBus events.EventBus,
	routerPort *router.MockAdapter,
	logger *zap.SugaredLogger,
) (*TrafficComponents, error) {
	// 1. Service Traffic Poller - polls traffic stats for service instances
	serviceTrafficPoller := pollers.NewServiceTrafficPoller(routerPort, eventBus)
	log.Printf("Service traffic poller initialized (rate limiting: 10s-300s)")

	// 2. Traffic Aggregator - write-behind buffering for high-frequency data
	trafficAggregator := traffic.NewTrafficAggregator(systemDB)
	trafficAggregator.Start(ctx)
	log.Printf("Traffic aggregator started (flush: 5min, retention: 30 days)")

	// 3. Device Traffic Tracker - per-device traffic breakdown
	deviceTrafficTracker := traffic.NewDeviceTrafficTracker(routerPort)
	log.Printf("Device traffic tracker initialized (mangle counter correlation)")

	// 4. Quota Enforcer - traffic quota enforcement with event warnings
	quotaEnforcer := traffic.NewQuotaEnforcer(systemDB, eventBus)
	log.Printf("Quota enforcer initialized (80%%, 90%%, 100%% thresholds)")

	return &TrafficComponents{
		ServiceTrafficPoller: serviceTrafficPoller,
		TrafficAggregator:    trafficAggregator,
		DeviceTrafficTracker: deviceTrafficTracker,
		QuotaEnforcer:        quotaEnforcer,
	}, nil
}
