//go:build !dev
// +build !dev

package main

import (
	"fmt"

	"go.uber.org/zap"

	"backend/generated/ent"
	"backend/internal/bootstrap"

	"backend/internal/events"
	"backend/internal/router"
)

// initOrchestrator initializes the service orchestrator.
func initOrchestrator(
	systemDB *ent.Client,
	eventBus events.EventBus,
	storage *bootstrap.StorageComponents,
	vif *bootstrap.VIFComponents,
	routerPort *router.MockAdapter,
	sugar *zap.SugaredLogger,
) (*bootstrap.OrchestratorComponents, error) {

	orch, err := bootstrap.InitializeOrchestrator(
		systemDB,
		eventBus,
		storage.PathResolver,
		vif.GatewayManager,
		vif.BridgeOrchestrator,
		vif.NetworkVLANAllocator,
		routerPort,
		sugar,
	)
	if err != nil {
		return nil, fmt.Errorf("initializing orchestrator: %w", err)
	}
	return orch, nil
}
