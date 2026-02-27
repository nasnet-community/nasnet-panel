//go:build !dev
// +build !dev

package main

import (
	"fmt"

	"go.uber.org/zap"

	"backend/generated/ent"
	"backend/internal/bootstrap"
	"backend/internal/config"
	"backend/internal/encryption"

	"backend/internal/events"
	"backend/internal/router"
)

// initIntegrationServices initializes integration services (webhooks, sharing, config).
func initIntegrationServices(
	systemDB *ent.Client,
	eventBus events.EventBus,
	alertComponents *bootstrap.AlertComponents,
	orchestrator *bootstrap.OrchestratorComponents,
	storage *bootstrap.StorageComponents,
	routerPort *router.MockAdapter,
	sugar *zap.SugaredLogger,
	encryptionService *encryption.Service,
) (*bootstrap.IntegrationComponents, error) {
	// Create config registry (empty for now, generators can be registered later)
	configRegistry := config.NewRegistry()
	sugar.Infow("Config registry initialized", "note", "generators can be registered dynamically")

	intServices, err := bootstrap.InitializeIntegrationServices(
		systemDB,
		eventBus,
		encryptionService,
		alertComponents.Dispatcher,
		routerPort,
		orchestrator.FeatureRegistry,
		configRegistry,
		storage.PathResolver,
		orchestrator.PortRegistry,
		orchestrator.VLANAllocator,
		sugar.Desugar(),
		sugar,
	)
	if err != nil {
		return nil, fmt.Errorf("initializing integration services: %w", err)
	}
	return intServices, nil
}
