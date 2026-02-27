//go:build wireinject
// +build wireinject

package bootstrap

import (
	"github.com/google/wire"
	"go.uber.org/zap"

	"backend/generated/ent"
	"backend/internal/auth"
	"backend/internal/capability"
	"backend/internal/credentials"
	"backend/internal/encryption"
	"backend/internal/events"
	"backend/internal/router"
	"backend/internal/scanner"
	"backend/internal/services"
)

// provideScannerService creates the scanner service.
func provideScannerService(
	eventBus events.EventBus,
	logger *zap.SugaredLogger,
) *scanner.ScannerService {
	return scanner.NewServiceWithDefaults(eventBus, logger.Desugar())
}

// provideCapabilityService creates the capability service with detector and cache.
func provideCapabilityService() *capability.Service {
	detector := capability.NewDetector()
	cache := capability.NewMemoryCache()
	return capability.NewService(detector, cache)
}

// provideCredentialService creates the credential service if encryption is available.
func provideCredentialService(
	encryptionService *encryption.Service,
	logger *zap.SugaredLogger,
) (*credentials.Service, error) {
	if encryptionService == nil {
		logger.Infow("Credential service: skipped (no encryption service)")
		return nil, nil
	}

	credSvc, err := credentials.NewService(encryptionService)
	if err != nil {
		logger.Warnw("Credential service initialization failed", "error", err)
		return nil, err
	}

	logger.Infow("Credential service initialized")
	return credSvc, nil
}

// provideRouterService creates the router service if encryption is available.
func provideRouterService(
	systemDB *ent.Client,
	eventBus events.EventBus,
	encryptionService *encryption.Service,
	logger *zap.SugaredLogger,
) *services.RouterService {
	if encryptionService == nil {
		logger.Infow("Router service: skipped (no encryption service)")
		return nil
	}

	routerService := services.NewRouterService(services.RouterServiceConfig{
		EventBus:          eventBus,
		EncryptionService: encryptionService,
		DB:                systemDB,
	})
	logger.Infow("Router service initialized")
	return routerService
}

// provideAuthService provides a nil auth service (auth is initialized separately in production).
func provideAuthService() *auth.Service {
	return nil
}

// CoreProviders is a Wire provider set for all core service components.
var CoreProviders = wire.NewSet(
	provideScannerService,
	provideCapabilityService,
	provideCredentialService,
	provideRouterService,
	provideAuthService,
	wire.Struct(new(CoreComponents), "*"),
)

// InjectCoreServices is a Wire injector that constructs all core infrastructure services.
func InjectCoreServices(
	systemDB *ent.Client,
	eventBus events.EventBus,
	routerPort *router.MockAdapter,
	logger *zap.SugaredLogger,
	encryptionService *encryption.Service,
) (*CoreComponents, error) {
	wire.Build(CoreProviders)
	return nil, nil
}
