//go:build wireinject
// +build wireinject

package bootstrap

import (
	"context"
	"path/filepath"
	"time"

	"github.com/google/wire"
	"go.uber.org/zap"

	"backend/generated/ent"
	"backend/internal/events"
	"backend/internal/features"
	"backend/internal/features/updates"
	"backend/internal/orchestrator/lifecycle"
	"backend/internal/storage"
)

// provideUpdateGitHubClient creates the GitHub client for release checking.
func provideUpdateGitHubClient() *updates.GitHubClient {
	return updates.NewGitHubClient()
}

// provideUpdateService creates the update service for checking available updates.
func provideUpdateService(
	githubClient *updates.GitHubClient,
) (*updates.UpdateService, error) {
	return updates.NewUpdateService(updates.UpdateServiceConfig{
		GitHubClient: githubClient,
	})
}

// provideUpdateVerifier creates the binary verifier for SHA256 verification.
func provideUpdateVerifier() *updates.Verifier {
	return &updates.Verifier{}
}

// provideUpdateJournal creates the update journal for power-safe journaling.
func provideUpdateJournal(
	dataDir string,
) (*updates.UpdateJournal, error) {
	journalPath := filepath.Join(dataDir, "update-journal.db")
	return updates.NewUpdateJournal(journalPath)
}

// provideUpdateMigratorRegistry creates the config migrator registry.
func provideUpdateMigratorRegistry() *updates.MigratorRegistry {
	return &updates.MigratorRegistry{}
}

// provideHealthCheckerAdapter creates the health checker adapter.
func provideHealthCheckerAdapter(
	instanceManager *lifecycle.InstanceManager,
) *instanceHealthAdapter {
	return &instanceHealthAdapter{manager: instanceManager}
}

// provideUpdateDownloadManager creates the download manager for updates.
func provideUpdateDownloadManager(
	downloadManager *features.DownloadManager,
) *updates.DownloadManager {
	return &updates.DownloadManager{
		DownloadFunc: func(ctx context.Context, featureID, url, expectedChecksum string) error {
			return downloadManager.Download(ctx, featureID, url, expectedChecksum)
		},
	}
}

// provideUpdateEngine creates the update engine orchestrating atomic updates.
func provideUpdateEngine(
	downloadManager *updates.DownloadManager,
	verifier *updates.Verifier,
	journal *updates.UpdateJournal,
	migratorRegistry *updates.MigratorRegistry,
	pathResolver storage.PathResolverPort,
	dataDir string,
	eventBus events.EventBus,
	logger *zap.Logger,
	healthChecker *instanceHealthAdapter,
	instanceManager *lifecycle.InstanceManager,
) (*updates.UpdateEngine, error) {
	updateEngine, err := updates.NewUpdateEngine(updates.UpdateEngineConfig{
		DownloadManager:  downloadManager,
		Verifier:         verifier,
		Journal:          journal,
		MigratorRegistry: migratorRegistry,
		PathResolver:     pathResolver,
		BaseDir:          dataDir,
		EventBus:         eventBus,
		Logger:           logger,
		HealthChecker:    healthChecker,
		InstanceStopper:  &instanceStopperAdapter{manager: instanceManager},
		InstanceStarter:  &instanceStarterAdapter{manager: instanceManager},
	})
	if err != nil {
		return nil, err
	}

	// Boot-time recovery: Check for incomplete updates and roll them back
	//nolint:contextcheck // recovery runs during initialization
	if recoveryErr := updateEngine.RecoverFromCrash(context.Background()); recoveryErr != nil {
		logger.Warn("Boot-time update recovery encountered errors", zap.Error(recoveryErr))
	}

	return updateEngine, nil
}

// provideUpdateScheduler creates and starts the update scheduler.
func provideUpdateScheduler(
	updateService *updates.UpdateService,
	updateEngine *updates.UpdateEngine,
	systemDB *ent.Client,
	eventBus events.EventBus,
	logger *zap.Logger,
) (*updates.UpdateScheduler, error) {
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

	// Start update scheduler (begins periodic update checks)
	//nolint:contextcheck // scheduler.Start() creates its own context
	if err := updateScheduler.Start(); err != nil {
		logger.Warn("Failed to start update scheduler", zap.Error(err))
	} else {
		logger.Info("Update scheduler started", zap.String("schedule", "checks every 6h, quiet hours 02:00-06:00 UTC"))
	}

	return updateScheduler, nil
}

// UpdateProviders is a Wire provider set for all update manager components.
var UpdateProviders = wire.NewSet(
	provideUpdateGitHubClient,
	provideUpdateService,
	provideUpdateVerifier,
	provideUpdateJournal,
	provideUpdateMigratorRegistry,
	provideHealthCheckerAdapter,
	provideUpdateDownloadManager,
	provideUpdateEngine,
	provideUpdateScheduler,
	wire.Struct(new(UpdateComponents), "*"),
)

// InjectUpdateManager is a Wire injector that constructs the complete update manager.
func InjectUpdateManager(
	ctx context.Context,
	systemDB *ent.Client,
	eventBus events.EventBus,
	pathResolver storage.PathResolverPort,
	downloadManager *features.DownloadManager,
	instanceManager *lifecycle.InstanceManager,
	dataDir string,
	logger *zap.Logger,
) (*UpdateComponents, error) {
	wire.Build(UpdateProviders)
	return nil, nil
}
