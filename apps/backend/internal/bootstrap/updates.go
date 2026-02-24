package bootstrap

import (
	"context"
	"path/filepath"
	"time"

	"go.uber.org/zap"

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
	logger *zap.Logger,
) (*UpdateComponents, error) {

	logger.Info("Initializing service update manager")

	// 1. GitHub Client for release checking
	githubClient := updates.NewGitHubClient()
	logger.Info("GitHub client initialized")

	// 2. Update Service - checks for available updates via GitHub Releases API
	updateService, err := updates.NewUpdateService(updates.UpdateServiceConfig{
		GitHubClient: githubClient,
	})
	if err != nil {
		return nil, err
	}
	logger.Info("Update service initialized")

	// 3. Binary Verifier - SHA256 verification for downloaded binaries
	updateVerifier := &updates.Verifier{}
	logger.Info("Binary verifier initialized")

	// 4. Update Journal - power-safe journaling for atomic updates
	journalPath := filepath.Join(dataDir, "update-journal.db")
	updateJournal, err := updates.NewUpdateJournal(journalPath)
	if err != nil {
		return nil, err
	}
	logger.Info("Update journal initialized", zap.String("path", journalPath))

	// 5. Config Migrator Registry - handles version-specific config migrations
	updateMigratorRegistry := &updates.MigratorRegistry{}
	logger.Info("Config migrator registry initialized")

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
	logger.Info("Update engine initialized", zap.String("type", "6-phase atomic updates with rollback"))

	// Boot-time recovery: Check for incomplete updates and roll them back
	if recoveryErr := updateEngine.RecoverFromCrash(ctx); recoveryErr != nil {
		logger.Warn("Boot-time update recovery encountered errors", zap.Error(recoveryErr))
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
	logger.Info("Update scheduler initialized")

	// Start update scheduler (begins periodic update checks)
	//nolint:contextcheck // scheduler.Start() creates its own context
	if err := updateScheduler.Start(); err != nil {
		logger.Warn("Failed to start update scheduler", zap.Error(err))
	} else {
		logger.Info("Update scheduler started", zap.String("schedule", "checks every 6h, quiet hours 02:00-06:00 UTC"))
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
