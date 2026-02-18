//go:build !dev
// +build !dev

package main

import (
	"github.com/rs/zerolog"

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
	logger zerolog.Logger,
) (*bootstrap.OrchestratorComponents, error) {

	return bootstrap.InitializeOrchestrator(
		systemDB,
		eventBus,
		storage.PathResolver,
		vif.GatewayManager,
		vif.BridgeOrchestrator,
		routerPort,
		logger,
	)
}
