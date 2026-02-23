//go:build !dev
// +build !dev

package main

import (
	"context"

	"github.com/rs/zerolog"
	"go.uber.org/zap"

	"backend/generated/ent"
	"backend/internal/bootstrap"

	"backend/internal/events"
	"backend/internal/router"
)

// initMonitoringAndTraffic initializes monitoring and traffic management services.
func initMonitoringAndTraffic(
	ctx context.Context,
	systemDB *ent.Client,
	eventBus events.EventBus,
	routerPort *router.MockAdapter,
	sugar *zap.SugaredLogger,
	logger zerolog.Logger,
	vifComponents *bootstrap.VIFComponents,
) (*bootstrap.MonitoringComponents, *bootstrap.TrafficComponents, *bootstrap.SchedulingComponents, error) {
	// Initialize Monitoring Services (telemetry, stats poller)
	monitoring, err := bootstrap.InitializeMonitoringServices(
		systemDB,
		eventBus,
		routerPort,
	)
	if err != nil {
		return nil, nil, nil, err
	}

	// Initialize Traffic Management (traffic poller, aggregator, quota enforcer)
	traffic, err := bootstrap.InitializeTrafficManagement(
		ctx,
		systemDB,
		eventBus,
		routerPort,
		sugar,
	)
	if err != nil {
		return nil, nil, nil, err
	}

	// Initialize Scheduling Services (schedule service, evaluator)
	scheduling, err := bootstrap.InitializeScheduling(
		systemDB,
		eventBus,
		vifComponents.KillSwitchManager,
		logger,
	)
	if err != nil {
		return nil, nil, nil, err
	}

	return monitoring, traffic, scheduling, nil
}
