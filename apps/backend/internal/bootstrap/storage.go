package bootstrap

import (
	"context"
	"log"

	"github.com/rs/zerolog"

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
	storageLogger zerolog.Logger,
) (*StorageComponents, error) {
	// Create storage event publisher
	storagePublisher := CreatePublisher(eventBus, "storage-infrastructure")

	// 1. Storage Detector - monitors mount points for external storage
	storageDetector := storage.NewStorageDetector(storage.DefaultStorageDetectorConfig(
		storagePublisher,
		storageLogger,
	))
	storageDetector.Start()
	log.Printf("Storage detector started (monitoring: /data, /usb1, /disk1, /disk2)")

	// 2. Storage Config Service - persists external storage configuration
	storageService := storage.NewStorageConfigService(
		systemDB,
		storageDetector,
		storagePublisher,
		storageLogger,
	)
	log.Printf("Storage config service initialized")

	// 3. Path Resolver - resolves binary/config/data paths dynamically
	pathResolver := storage.NewDefaultPathResolver(storage.DefaultPathResolverConfig())
	log.Printf("Path resolver initialized (flash base: /flash/features)")

	// 4. Boot Validator - validates instance binaries on startup
	bootValidator, err := boot.NewBootValidator(boot.BootValidatorConfig{
		DB:           systemDB,
		PathResolver: pathResolver,
		EventBus:     eventBus,
		Logger:       storageLogger,
	})
	if err != nil {
		return nil, err
	}

	// Run boot validation BEFORE starting any instances
	log.Printf("Running boot-time instance validation...")
	bootSummary, err := bootValidator.ValidateAllInstances(ctx)
	if err != nil {
		log.Printf("Warning: boot validation encountered errors: %v", err)
	}
	if bootSummary != nil {
		log.Printf("Boot validation complete: %d checked, %d failed",
			bootSummary.TotalChecked, bootSummary.FailedCount)
		if bootSummary.FailedCount > 0 {
			log.Printf("Failed services: %v", bootSummary.FailedServices)
		}
	}

	return &StorageComponents{
		Detector:      storageDetector,
		Service:       storageService,
		PathResolver:  pathResolver,
		BootValidator: bootValidator,
	}, nil
}
