package bootstrap

import (
	"context"
	"fmt"

	"go.uber.org/zap"

	"backend/generated/ent"
	"backend/internal/events"
	"backend/internal/orchestrator/boot"
	"backend/internal/storage"
)

// StorageComponents holds all initialized storage infrastructure components.
type StorageComponents struct {
	Detector      *storage.StorageDetector
	Service       *storage.StorageConfigService
	PathResolver  storage.PathResolverPort
	BootValidator *boot.BootValidator
}

// InitializeStorage creates and initializes the storage infrastructure.
// This includes:
// - Storage detector (monitors mount points)
// - Storage config service (persists configuration)
// - Path resolver (resolves binary/config/data paths)
// - Boot validator (validates instance binaries)
func InitializeStorage(
	ctx context.Context,
	systemDB *ent.Client,
	eventBus events.EventBus,
	storageLogger *zap.SugaredLogger,
) (*StorageComponents, error) {
	// Create storage event publisher
	storagePublisher := CreatePublisher(eventBus, "storage-infrastructure")

	// 1. Storage Detector - monitors mount points for external storage
	storageDetector := storage.NewStorageDetector(storage.DefaultStorageDetectorConfig(
		storagePublisher,
		storageLogger.Desugar(),
	))
	storageDetector.Start()
	storageLogger.Infow("Storage detector started", "mount_points", []string{"/data", "/usb1", "/disk1", "/disk2"})

	// 2. Storage Config Service - persists external storage configuration
	storageService := storage.NewStorageConfigService(
		systemDB,
		storageDetector,
		storagePublisher,
		storageLogger.Desugar(),
	)
	storageLogger.Infow("Storage config service initialized")

	// 3. Path Resolver - resolves binary/config/data paths dynamically
	pathResolver := storage.NewDefaultPathResolver(storage.DefaultPathResolverConfig())
	storageLogger.Infow("Path resolver initialized", "flash_base", "/flash/features")

	// 4. Boot Validator - validates instance binaries on startup
	bootValidator, err := boot.NewBootValidator(boot.BootValidatorConfig{
		DB:           systemDB,
		PathResolver: pathResolver,
		EventBus:     eventBus,
		Logger:       storageLogger.Desugar(),
	})
	if err != nil {
		return nil, fmt.Errorf("init storage: %w", err)
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

	return &StorageComponents{
		Detector:      storageDetector,
		Service:       storageService,
		PathResolver:  pathResolver,
		BootValidator: bootValidator,
	}, nil
}
