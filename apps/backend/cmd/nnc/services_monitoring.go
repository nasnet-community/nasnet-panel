//go:build !dev
// +build !dev

package main

import (
	"context"
	"fmt"

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
	vifComponents *bootstrap.VIFComponents,
) (*bootstrap.MonitoringComponents, *bootstrap.TrafficComponents, *bootstrap.SchedulingComponents, error) {
	// Initialize Monitoring Services (telemetry, stats poller)
	monitoring, err := bootstrap.InitializeMonitoringServices(
		systemDB,
		eventBus,
		routerPort,
		sugar,
	)
	if err != nil {
		return nil, nil, nil, fmt.Errorf("initializing monitoring services: %w", err)
	}

	// Initialize Traffic Management (traffic poller, aggregator, quota enforcer)
	traffic, err := bootstrap.InitializeTrafficManagement(
		ctx,
		systemDB,
		eventBus,
		routerPort,
		sugar.Desugar(),
	)
	if err != nil {
		return nil, nil, nil, fmt.Errorf("initializing traffic management: %w", err)
	}

	// Initialize Scheduling Services (schedule service, evaluator)
	scheduling, err := bootstrap.InitializeScheduling(
		systemDB,
		eventBus,
		vifComponents.KillSwitchManager,
		sugar,
	)
	if err != nil {
		return nil, nil, nil, fmt.Errorf("initializing scheduling services: %w", err)
	}

	return monitoring, traffic, scheduling, nil
}
