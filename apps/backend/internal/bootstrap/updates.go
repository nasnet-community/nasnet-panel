package bootstrap

import (
	"context"
	"log"
	"path/filepath"
	"time"

	"github.com/rs/zerolog"

	"backend/generated/ent"

	"backend/internal/features"
	"backend/internal/features/updates"
	"backend/internal/orchestrator/lifecycle"

	"backend/internal/events"
	"backend/internal/storage"
)

// UpdateComponents holds all initialized update manager components.
type UpdateComponents struct {
	GitHubClient     *updates.GitHubClient
	UpdateService    *updates.UpdateService
	Verifier         *updates.Verifier
	Journal          *updates.UpdateJournal
	MigratorRegistry *updates.MigratorRegistry
	UpdateEngine     *updates.UpdateEngine
	UpdateScheduler  *updates.UpdateScheduler
}

// instanceHealthAdapter adapts InstanceManager to features.HealthChecker interface.
type instanceHealthAdapter struct {
	manager *lifecycle.InstanceManager
}

func (a *instanceHealthAdapter) GetStatus(instanceID string) (string, error) {
	if a.manager == nil {
		return "UNKNOWN", nil
	}
	return a.manager.GetInstanceHealthStatus(instanceID)
}

// instanceStopperAdapter adapts InstanceManager to updates.InstanceStopper interface.
type instanceStopperAdapter struct {
	manager *lifecycle.InstanceManager
}

func (a *instanceStopperAdapter) Stop(ctx context.Context, instanceID string) error {
	if a.manager == nil {
		return nil
	}
	return a.manager.StopInstance(ctx, instanceID)
}

// instanceStarterAdapter adapts InstanceManager to updates.InstanceStarter interface.
type instanceStarterAdapter struct {
	manager *lifecycle.InstanceManager
}

func (a *instanceStarterAdapter) Start(ctx context.Context, instanceID string) error {
	if a.manager == nil {
		return nil
	}
	return a.manager.StartInstance(ctx, instanceID)
}

// InitializeUpdateManager creates and initializes the service update manager.
// This includes:
// - GitHub client (release checking)
// - Update service (checks for available updates)
// - Binary verifier (SHA256 verification)
// - Update journal (power-safe journaling)
// - Config migrator registry (version-specific migrations)
// - Update engine (6-phase atomic updates with rollback)
// - Update scheduler (periodic update checks)
func InitializeUpdateManager(
	ctx context.Context,
	systemDB *ent.Client,
	eventBus events.EventBus,
	pathResolver storage.PathResolverPort,
	downloadManager *features.DownloadManager,
	instanceManager *lifecycle.InstanceManager,
	dataDir string,
	logger zerolog.Logger,
) (*UpdateComponents, error) {

	log.Printf("Initializing service update manager...")

	// 1. GitHub Client for release checking
	githubClient := updates.NewGitHubClient()
	log.Printf("GitHub client initialized")

	// 2. Update Service - checks for available updates via GitHub Releases API
	updateService, err := updates.NewUpdateService(updates.UpdateServiceConfig{
		GitHubClient: githubClient,
	})
	if err != nil {
		return nil, err
	}
	log.Printf("Update service initialized")

	// 3. Binary Verifier - SHA256 verification for downloaded binaries
	_ = events.NewPublisher(eventBus, "binary-verifier")
	updateVerifier := &updates.Verifier{}
	log.Printf("Binary verifier initialized")

	// 4. Update Journal - power-safe journaling for atomic updates
	journalPath := filepath.Join(dataDir, "update-journal.db")
	updateJournal, err := updates.NewUpdateJournal(journalPath)
	if err != nil {
		return nil, err
	}
	log.Printf("Update journal initialized at %s", journalPath)

	// 5. Config Migrator Registry - handles version-specific config migrations
	updateMigratorRegistry := &updates.MigratorRegistry{}
	log.Printf("Config migrator registry initialized")

	// 6. Health Checker Adapter - adapts InstanceManager for UpdateEngine
	healthCheckerAdapter := &instanceHealthAdapter{manager: instanceManager}

	// 7. Update Engine - orchestrates 6-phase atomic updates with rollback
	updateDownloadManager := &updates.DownloadManager{
		DownloadFunc: func(ctx context.Context, featureID, url, expectedChecksum string) error {
			return downloadManager.Download(ctx, featureID, url, expectedChecksum)
		},
	}
	updateEngine, err := updates.NewUpdateEngine(updates.UpdateEngineConfig{
		DownloadManager:  updateDownloadManager,
		Verifier:         updateVerifier,
		Journal:          updateJournal,
		MigratorRegistry: updateMigratorRegistry,
		PathResolver:     pathResolver,
		BaseDir:          dataDir,
		EventBus:         eventBus,
		Logger:           logger,
		HealthChecker:    healthCheckerAdapter,
		InstanceStopper:  &instanceStopperAdapter{manager: instanceManager},
		InstanceStarter:  &instanceStarterAdapter{manager: instanceManager},
	})
	if err != nil {
		return nil, err
	}
	log.Printf("Update engine initialized (6-phase atomic updates with rollback)")

	// Boot-time recovery: Check for incomplete updates and roll them back
	if recoveryErr := updateEngine.RecoverFromCrash(ctx); recoveryErr != nil {
		log.Printf("Warning: boot-time update recovery encountered errors: %v", recoveryErr)
	}

	// 8. Update Scheduler - coordinates periodic update checks with smart timing
	updateScheduler, err := updates.NewUpdateScheduler(updates.UpdateSchedulerConfig{
		UpdateService:   updateService,
		UpdateEngine:    updateEngine,
		Store:           systemDB,
		EventBus:        eventBus,
		Logger:          logger,
		CheckInterval:   6 * time.Hour, // Default: check every 6 hours
		QuietHoursStart: "02:00",
		QuietHoursEnd:   "06:00",
		Timezone:        "UTC",
	})
	if err != nil {
		return nil, err
	}
	log.Printf("Update scheduler initialized")

	// Start update scheduler (begins periodic update checks)
	//nolint:contextcheck // scheduler.Start() creates its own context
	if err := updateScheduler.Start(); err != nil {
		log.Printf("Warning: failed to start update scheduler: %v", err)
	} else {
		log.Printf("Update scheduler started (checks every 6h, quiet hours 02:00-06:00 UTC)")
	}

	return &UpdateComponents{
		GitHubClient:     githubClient,
		UpdateService:    updateService,
		Verifier:         updateVerifier,
		Journal:          updateJournal,
		MigratorRegistry: updateMigratorRegistry,
		UpdateEngine:     updateEngine,
		UpdateScheduler:  updateScheduler,
	}, nil
}
