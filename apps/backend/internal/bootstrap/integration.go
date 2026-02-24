package bootstrap

import (
	"errors"

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

// IntegrationComponents holds all initialized integration service components.
type IntegrationComponents struct {
	WebhookService    *integration.Service
	SharingService    *sharing.Service
	ConfigService     *config.Service
	CredentialService *credentials.Service
}

// InitializeIntegrationServices creates and initializes integration services.
// This includes:
// - Webhook service (webhook CRUD with encryption and SSRF protection)
// - Sharing service (service configuration export/import)
// - Config service (configuration generation and management)
func InitializeIntegrationServices(
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
	zapLogger *zap.SugaredLogger,
) (*IntegrationComponents, error) {

	if zapLogger == nil {
		return nil, errors.New("zapLogger cannot be nil")
	}

	// 1. Webhook Service - webhook CRUD with encryption
	webhookService := integration.NewService(integration.Config{
		DB:         systemDB,
		Encryption: encryptionService,
		Dispatcher: dispatcher,
		EventBus:   eventBus,
		Logger:     zapLogger,
	})
	zapLogger.Infow("Webhook service initialized (AES-256-GCM encryption + SSRF protection)")

	// 2. Sharing Service - service configuration export/import
	// Note: AuditService is optional (nil for now)
	// Adapt features.FeatureRegistry to sharing.FeatureRegistry using the adapter function
	sharingRegistry := sharing.NewFeatureRegistryFromFunc(featureRegistry.GetManifest)
	sharingService := sharing.NewService(systemDB, routerPort, eventBus, sharingRegistry, nil, logger)
	zapLogger.Infow("Sharing service initialized (export/import with FeatureRegistry adapter)")

	// 3. Config Service - configuration generation and management
	configService, err := config.NewService(config.Config{
		Registry:      configRegistry,
		Store:         systemDB,
		EventBus:      eventBus,
		PathResolver:  pathResolver,
		PortRegistry:  portRegistry,
		VLANAllocator: vlanAllocator,
		Logger:        logger,
	})
	if err != nil {
		return nil, err
	}
	zapLogger.Infow("Config service initialized (validate → generate → write → publish)")

	// 4. Credential Service - initialize here since we have encryption service
	credentialService, err := credentials.NewService(encryptionService)
	if err != nil {
		return nil, err
	}
	zapLogger.Infow("Credential service initialized (encrypted storage)")

	return &IntegrationComponents{
		WebhookService:    webhookService,
		SharingService:    sharingService,
		ConfigService:     configService,
		CredentialService: credentialService,
	}, nil
}
