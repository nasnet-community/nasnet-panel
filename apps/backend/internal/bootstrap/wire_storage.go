//go:build wireinject
// +build wireinject

package bootstrap

import (
	"context"

	"github.com/google/wire"
	"go.uber.org/zap"

	"backend/generated/ent"
	"backend/internal/events"
	"backend/internal/orchestrator/boot"
	"backend/internal/storage"
)

// provideStoragePublisher creates a publisher for storage events.
func provideStoragePublisher(eventBus events.EventBus) *events.Publisher {
	return CreatePublisher(eventBus, "storage-infrastructure")
}

// provideStorageDetector creates and starts the storage detector.
func provideStorageDetector(
	publisher *events.Publisher,
	storageLogger *zap.SugaredLogger,
) *storage.StorageDetector {
	detector := storage.NewStorageDetector(storage.DefaultStorageDetectorConfig(
		publisher,
		storageLogger.Desugar(),
	))
	detector.Start()
	return detector
}

// provideStorageConfigService creates the storage config service.
func provideStorageConfigService(
	systemDB *ent.Client,
	detector *storage.StorageDetector,
	publisher *events.Publisher,
	storageLogger *zap.SugaredLogger,
) *storage.StorageConfigService {
	return storage.NewStorageConfigService(
		systemDB,
		detector,
		publisher,
		storageLogger.Desugar(),
	)
}

// providePathResolver creates the path resolver.
func providePathResolver() storage.PathResolverPort {
	return storage.NewDefaultPathResolver(storage.DefaultPathResolverConfig())
}

// provideBootValidator creates and validates boot instances.
func provideBootValidator(
	ctx context.Context,
	systemDB *ent.Client,
	pathResolver storage.PathResolverPort,
	eventBus events.EventBus,
	storageLogger *zap.SugaredLogger,
) (*boot.BootValidator, error) {
	bootValidator, err := boot.NewBootValidator(boot.BootValidatorConfig{
		DB:           systemDB,
		PathResolver: pathResolver,
		EventBus:     eventBus,
		Logger:       storageLogger.Desugar(),
	})
	if err != nil {
		return nil, err
	}

	// Run boot validation BEFORE starting any instances
	storageLogger.Infow("Running boot-time instance validation")
	bootSummary, err := bootValidator.ValidateAllInstances(ctx)
	if err != nil {
		storageLogger.Warnw("Boot validation encountered errors", zap.Error(err))
	}
	if bootSummary != nil {
		storageLogger.Infow("Boot validation complete", "total_checked", bootSummary.TotalChecked, "failed_count", bootSummary.FailedCount)
		if bootSummary.FailedCount > 0 {
			storageLogger.Infow("Failed services", "services", bootSummary.FailedServices)
		}
	}

	return bootValidator, nil
}

// StorageProviders is a Wire provider set for all storage infrastructure components.
var StorageProviders = wire.NewSet(
	provideStoragePublisher,
	provideStorageDetector,
	provideStorageConfigService,
	providePathResolver,
	provideBootValidator,
	wire.Struct(new(StorageComponents), "*"),
)

// InjectStorage is a Wire injector that constructs the complete storage infrastructure.
func InjectStorage(
	ctx context.Context,
	systemDB *ent.Client,
	eventBus events.EventBus,
	storageLogger *zap.SugaredLogger,
) (*StorageComponents, error) {
	wire.Build(StorageProviders)
	return nil, nil
}
