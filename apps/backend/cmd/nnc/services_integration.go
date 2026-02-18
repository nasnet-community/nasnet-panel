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
) (*bootstrap.IntegrationComponents, error) {
	// Create encryption service (uses dummy key for now if not set in env)
	encryptionService, err := encryption.NewServiceFromEnv()
	if err != nil {
		// If encryption key not set, create with dummy key (for development)
		log.Printf("Warning: Using dummy encryption key (set DB_ENCRYPTION_KEY in production)")
		dummyKey := make([]byte, 32)
		for i := range dummyKey {
			dummyKey[i] = byte(i)
		}
		encryptionService, err = encryption.NewService(encryption.Config{
			Key:        dummyKey,
			KeyVersion: 1,
		})
		if err != nil {
			return nil, err
		}
	}

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
