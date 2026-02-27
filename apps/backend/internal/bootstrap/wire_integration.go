//go:build wireinject
// +build wireinject

package bootstrap

import (
	"github.com/google/wire"
	"go.uber.org/zap"

	"backend/generated/ent"
	"backend/internal/config"
	"backend/internal/credentials"
	"backend/internal/encryption"
	"backend/internal/events"
	"backend/internal/features"
	"backend/internal/features/sharing"
	"backend/internal/network"
	"backend/internal/notifications"
	"backend/internal/router"
	"backend/internal/services/integration"
	"backend/internal/storage"
)

// provideWebhookService creates the webhook service for webhook CRUD with encryption.
func provideWebhookService(
	systemDB *ent.Client,
	encryptionService *encryption.Service,
	dispatcher *notifications.Dispatcher,
	eventBus events.EventBus,
	sugar *zap.SugaredLogger,
) *integration.Service {
	return integration.NewService(integration.Config{
		DB:         systemDB,
		Encryption: encryptionService,
		Dispatcher: dispatcher,
		EventBus:   eventBus,
		Logger:     sugar,
	})
}

// provideSharingService creates the sharing service for service configuration export/import.
func provideSharingService(
	systemDB *ent.Client,
	routerPort *router.MockAdapter,
	eventBus events.EventBus,
	featureRegistry *features.FeatureRegistry,
	logger *zap.Logger,
) *sharing.Service {
	sharingRegistry := sharing.NewFeatureRegistryFromFunc(featureRegistry.GetManifest)
	return sharing.NewService(systemDB, routerPort, eventBus, sharingRegistry, nil, logger)
}

// provideConfigService creates the config service for configuration generation and management.
func provideConfigService(
	configRegistry *config.Registry,
	systemDB *ent.Client,
	eventBus events.EventBus,
	pathResolver storage.PathResolverPort,
	portRegistry *network.PortRegistry,
	vlanAllocator *network.VLANAllocator,
	logger *zap.Logger,
) (*config.Service, error) {
	return config.NewService(config.Config{
		Registry:      configRegistry,
		Store:         systemDB,
		EventBus:      eventBus,
		PathResolver:  pathResolver,
		PortRegistry:  portRegistry,
		VLANAllocator: vlanAllocator,
		Logger:        logger,
	})
}

// provideIntegrationCredentialService creates the credential service for encrypted storage.
func provideIntegrationCredentialService(
	encryptionService *encryption.Service,
) (*credentials.Service, error) {
	return credentials.NewService(encryptionService)
}

// IntegrationProviders is a Wire provider set for all integration service components.
var IntegrationProviders = wire.NewSet(
	provideWebhookService,
	provideSharingService,
	provideConfigService,
	provideIntegrationCredentialService,
	wire.Struct(new(IntegrationComponents), "*"),
)

// InjectIntegrationServices is a Wire injector that constructs the complete integration services.
func InjectIntegrationServices(
	systemDB *ent.Client,
	eventBus events.EventBus,
	encryptionService *encryption.Service,
	dispatcher *notifications.Dispatcher,
	routerPort *router.MockAdapter,
	featureRegistry *features.FeatureRegistry,
	configRegistry *config.Registry,
	pathResolver storage.PathResolverPort,
	portRegistry *network.PortRegistry,
	vlanAllocator *network.VLANAllocator,
	logger *zap.Logger,
	sugar *zap.SugaredLogger,
) (*IntegrationComponents, error) {
	wire.Build(IntegrationProviders)
	return nil, nil
}
