//go:build !dev
// +build !dev

package main

import (
	"log"

	"github.com/rs/zerolog"
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
	logger zerolog.Logger,
	sugar *zap.SugaredLogger,
	encryptionService *encryption.Service,
) (*bootstrap.IntegrationComponents, error) {
	// Create config registry (empty for now, generators can be registered later)
	configRegistry := config.NewRegistry()
	log.Printf("Config registry initialized (generators can be registered dynamically)")

	return bootstrap.InitializeIntegrationServices(
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
		logger,
		sugar,
	)
}
