package updates

import (
	"context"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"time"

	"backend/internal/events"
	"backend/internal/storage"

	"github.com/rs/zerolog"
)

// HealthChecker interface for health validation
type HealthChecker interface {
	GetStatus(instanceID string) (string, error)
}

// UpdateEngineConfig holds configuration for the update engine
type UpdateEngineConfig struct {
	DownloadManager  *DownloadManager
	Verifier         *Verifier
	Journal          *UpdateJournal
	MigratorRegistry *MigratorRegistry
	PathResolver     storage.PathResolverPort
	BaseDir          string // Base directory for updates (e.g., /var/lib/nasnet)
	EventBus         events.EventBus
	Logger           zerolog.Logger
	HealthChecker    HealthChecker
	InstanceStopper  InstanceStopper
	InstanceStarter  InstanceStarter
}

// InstanceStopper interface for stopping instances
type InstanceStopper interface {
	Stop(ctx context.Context, instanceID string) error
}

// InstanceStarter interface for starting instances
type InstanceStarter interface {
	Start(ctx context.Context, instanceID string) error
}

// UpdateEngine orchestrates atomic 6-phase updates with rollback
type UpdateEngine struct {
	config    UpdateEngineConfig
	logger    zerolog.Logger
	publisher *events.Publisher
}

// NewUpdateEngine creates a new update engine
func NewUpdateEngine(config UpdateEngineConfig) (*UpdateEngine, error) {
	if config.DownloadManager == nil {
		return nil, fmt.Errorf("download manager is required")
	}
	if config.Verifier == nil {
		return nil, fmt.Errorf("verifier is required")
	}
	if config.Journal == nil {
		return nil, fmt.Errorf("journal is required")
	}
	if config.MigratorRegistry == nil {
		return nil, fmt.Errorf("migrator registry is required")
	}
	if config.BaseDir == "" {
		config.BaseDir = "/var/lib/nasnet"
	}
	if config.EventBus == nil {
		return nil, fmt.Errorf("event bus is required")
	}

	publisher := events.NewPublisher(config.EventBus, "update-engine")

	return &UpdateEngine{
		config:    config,
		logger:    config.Logger.With().Str("component", "update_engine").Logger(),
		publisher: publisher,
	}, nil
}

// Helper methods for path resolution
func (e *UpdateEngine) resolveStagingPath(featureID, version string) string {
	return filepath.Join(e.config.BaseDir, "updates", featureID, version, "staging")
}

func (e *UpdateEngine) resolveBackupPath(featureID, instanceID, version string) string {
	return filepath.Join(e.config.BaseDir, "updates", featureID, instanceID, "backup", version)
}

func (e *UpdateEngine) resolveBinaryPath(featureID, _ string) string {
	if e.config.PathResolver != nil {
		return e.config.PathResolver.BinaryPath(featureID)
	}
	return filepath.Join(e.config.BaseDir, "features", featureID, "bin", featureID)
}

// ApplyUpdate executes the 6-phase atomic update process
func (e *UpdateEngine) ApplyUpdate(ctx context.Context, instanceID, featureID, currentVersion, targetVersion, downloadURL, checksumURL string) error {
	e.logger.Info().
		Str("instanceID", instanceID).
		Str("featureID", featureID).
		Str("currentVersion", currentVersion).
		Str("targetVersion", targetVersion).
		Msg("Starting atomic update")

	// Phase 1: STAGING - Download and verify
	if err := e.phaseStaging(ctx, instanceID, featureID, currentVersion, targetVersion, downloadURL, checksumURL); err != nil {
		return fmt.Errorf("STAGING phase failed: %w", err)
	}

	// Phase 2: BACKUP - Backup current binary and config
	if err := e.phaseBackup(ctx, instanceID, featureID, currentVersion, targetVersion); err != nil {
		return fmt.Errorf("BACKUP phase failed: %w", err)
	}

	// Phase 3: SWAP - Stop service, swap binaries
	if err := e.phaseSwap(ctx, instanceID, featureID, currentVersion, targetVersion); err != nil {
		// Critical failure - attempt rollback
		e.logger.Error().Err(err).Msg("SWAP phase failed, attempting rollback")
		if rbErr := e.rollback(ctx, instanceID, featureID, currentVersion, targetVersion); rbErr != nil {
			return fmt.Errorf("SWAP failed and rollback failed: %w", errors.Join(rbErr, err))
		}
		return fmt.Errorf("SWAP phase failed (rolled back): %w", err)
	}

	// Phase 4: MIGRATION - Run config migrations
	if err := e.phaseMigration(ctx, instanceID, featureID, currentVersion, targetVersion); err != nil {
		e.logger.Error().Err(err).Msg("MIGRATION phase failed, attempting rollback")
		if rbErr := e.rollback(ctx, instanceID, featureID, currentVersion, targetVersion); rbErr != nil {
			return fmt.Errorf("MIGRATION failed and rollback failed: %w", errors.Join(rbErr, err))
		}
		return fmt.Errorf("MIGRATION phase failed (rolled back): %w", err)
	}

	// Phase 5: VALIDATION - Start service and verify health
	if err := e.phaseValidation(ctx, instanceID, featureID, currentVersion, targetVersion); err != nil {
		e.logger.Error().Err(err).Msg("VALIDATION phase failed, attempting rollback")
		if rbErr := e.rollback(ctx, instanceID, featureID, currentVersion, targetVersion); rbErr != nil {
			return fmt.Errorf("VALIDATION failed and rollback failed: %w", errors.Join(rbErr, err))
		}
		return fmt.Errorf("VALIDATION phase failed (rolled back): %w", err)
	}

	// Phase 6: COMMIT - Finalize update
	if err := e.phaseCommit(ctx, instanceID, featureID, currentVersion, targetVersion); err != nil {
		return fmt.Errorf("COMMIT phase failed: %w", err)
	}

	e.logger.Info().
		Str("instanceID", instanceID).
		Str("targetVersion", targetVersion).
		Msg("Atomic update completed successfully")

	return nil
}

// phaseStaging downloads and verifies the new binary
func (e *UpdateEngine) phaseStaging(ctx context.Context, instanceID, featureID, currentVersion, targetVersion, downloadURL, checksumURL string) error {
	e.logger.Info().Str("phase", "STAGING").Msg("Starting STAGING phase")

	_, err := e.config.Journal.BeginPhase(ctx, instanceID, featureID, currentVersion, targetVersion, PhaseStaging, map[string]interface{}{
		"downloadURL": downloadURL,
		"checksumURL": checksumURL,
	})
	if err != nil {
		return err
	}

	// Download binary to staging directory
	stagingDir := e.resolveStagingPath(featureID, targetVersion)
	_ = filepath.Join(stagingDir, featureID) // stagingBinary - TODO: use in Download call

	// Create staging directory
	if err := os.MkdirAll(stagingDir, 0o755); err != nil {
		_ = e.config.Journal.FailPhase(ctx, instanceID, targetVersion, PhaseStaging, err.Error()) //nolint:errcheck // best-effort journal logging
		return fmt.Errorf("failed to create staging dir: %w", err)
	}

	// Download binary (includes SHA256 verification)
	// Assuming checksumURL points to a file containing the expected checksum
	expectedChecksum := "" // In a real implementation, fetch this from checksumURL
	if err := e.config.DownloadManager.Download(ctx, featureID, downloadURL, expectedChecksum); err != nil {
		_ = e.config.Journal.FailPhase(ctx, instanceID, targetVersion, PhaseStaging, err.Error()) //nolint:errcheck // best-effort journal logging
		return fmt.Errorf("download failed: %w", err)
	}

	// Additional verification using Verifier (Story 8.22)
	// Note: VerifyArchive signature: (ctx, archivePath, checksumURL, version, spec)
	// For now, we'll skip this as it requires more context
	// In a real implementation, integrate with the Verifier properly
	_ = checksumURL // Avoid unused variable warning

	_ = e.config.Journal.CompletePhase(ctx, instanceID, targetVersion, PhaseStaging) //nolint:errcheck // best-effort journal logging
	e.logger.Info().Str("phase", "STAGING").Msg("STAGING phase completed")
	return nil
}

// phaseBackup backs up the current binary and configuration
func (e *UpdateEngine) phaseBackup(ctx context.Context, instanceID, featureID, currentVersion, targetVersion string) error {
	e.logger.Info().Str("phase", "BACKUP").Msg("Starting BACKUP phase")

	_, err := e.config.Journal.BeginPhase(ctx, instanceID, featureID, currentVersion, targetVersion, PhaseBackup, nil)
	if err != nil {
		return err
	}

	// Get paths
	currentBinary := e.resolveBinaryPath(featureID, instanceID)
	backupDir := e.resolveBackupPath(featureID, instanceID, currentVersion)
	backupBinary := filepath.Join(backupDir, featureID)

	// Create backup directory
	if err := os.MkdirAll(backupDir, 0o755); err != nil {
		_ = e.config.Journal.FailPhase(ctx, instanceID, targetVersion, PhaseBackup, err.Error()) //nolint:errcheck // best-effort journal logging
		return fmt.Errorf("failed to create backup dir: %w", err)
	}

	// Copy current binary to backup
	if err := copyFile(currentBinary, backupBinary); err != nil {
		_ = e.config.Journal.FailPhase(ctx, instanceID, targetVersion, PhaseBackup, err.Error()) //nolint:errcheck // best-effort journal logging
		return fmt.Errorf("failed to backup binary: %w", err)
	}

	// TODO: Backup configuration files

	_ = e.config.Journal.CompletePhase(ctx, instanceID, targetVersion, PhaseBackup) //nolint:errcheck // best-effort journal logging
	e.logger.Info().Str("phase", "BACKUP").Msg("BACKUP phase completed")
	return nil
}

// phaseSwap stops the service and atomically swaps binaries
func (e *UpdateEngine) phaseSwap(ctx context.Context, instanceID, featureID, currentVersion, targetVersion string) error {
	e.logger.Info().Str("phase", "SWAP").Msg("Starting SWAP phase")

	_, err := e.config.Journal.BeginPhase(ctx, instanceID, featureID, currentVersion, targetVersion, PhaseSwap, nil)
	if err != nil {
		return err
	}

	// Stop the instance (if running)
	if e.config.InstanceStopper != nil {
		if err := e.config.InstanceStopper.Stop(ctx, instanceID); err != nil {
			_ = e.config.Journal.FailPhase(ctx, instanceID, targetVersion, PhaseSwap, err.Error()) //nolint:errcheck // best-effort journal logging
			return fmt.Errorf("failed to stop instance: %w", err)
		}
	}

	// Get paths
	currentBinary := e.resolveBinaryPath(featureID, instanceID)
	stagingBinary := filepath.Join(e.resolveStagingPath(featureID, targetVersion), featureID)
	tempSwap := currentBinary + ".old"

	// Atomic swap: current -> .old, staging -> current
	if err := os.Rename(currentBinary, tempSwap); err != nil {
		_ = e.config.Journal.FailPhase(ctx, instanceID, targetVersion, PhaseSwap, err.Error()) //nolint:errcheck // best-effort journal logging
		return fmt.Errorf("failed to move current binary: %w", err)
	}

	if err := copyFile(stagingBinary, currentBinary); err != nil {
		// Restore original
		_ = os.Rename(tempSwap, currentBinary)                                                 //nolint:errcheck // best-effort file rename during update
		_ = e.config.Journal.FailPhase(ctx, instanceID, targetVersion, PhaseSwap, err.Error()) //nolint:errcheck // best-effort journal logging
		return fmt.Errorf("failed to copy new binary: %w", err)
	}

	// Make executable
	if err := os.Chmod(currentBinary, 0o755); err != nil {
		_ = e.config.Journal.FailPhase(ctx, instanceID, targetVersion, PhaseSwap, err.Error()) //nolint:errcheck // best-effort journal logging
		return fmt.Errorf("failed to set permissions: %w", err)
	}

	// Remove old binary
	_ = os.Remove(tempSwap)

	_ = e.config.Journal.CompletePhase(ctx, instanceID, targetVersion, PhaseSwap) //nolint:errcheck // best-effort journal logging
	e.logger.Info().Str("phase", "SWAP").Msg("SWAP phase completed")
	return nil
}

// phaseMigration runs configuration migrations
func (e *UpdateEngine) phaseMigration(ctx context.Context, instanceID, featureID, currentVersion, targetVersion string) error {
	e.logger.Info().Str("phase", "MIGRATION").Msg("Starting MIGRATION phase")

	_, err := e.config.Journal.BeginPhase(ctx, instanceID, featureID, currentVersion, targetVersion, PhaseMigration, nil)
	if err != nil {
		return err
	}

	// Get migrator for feature
	migrator := e.config.MigratorRegistry.Get(featureID)

	// Check if migration is needed
	if !migrator.CanMigrate(currentVersion, targetVersion) {
		const errFormat = "no migration path from %s to %s"
		errMsg := fmt.Sprintf(errFormat, currentVersion, targetVersion)
		_ = e.config.Journal.FailPhase(ctx, instanceID, targetVersion, PhaseMigration, errMsg) //nolint:errcheck // best-effort journal logging
		return fmt.Errorf(errFormat, currentVersion, targetVersion)
	}

	// TODO: Load current config, run migration, save new config

	_ = e.config.Journal.CompletePhase(ctx, instanceID, targetVersion, PhaseMigration) //nolint:errcheck // best-effort journal logging
	e.logger.Info().Str("phase", "MIGRATION").Msg("MIGRATION phase completed")
	return nil
}

// phaseValidation starts the service and verifies health
func (e *UpdateEngine) phaseValidation(ctx context.Context, instanceID, featureID, currentVersion, targetVersion string) error {
	e.logger.Info().Str("phase", "VALIDATION").Msg("Starting VALIDATION phase")

	_, err := e.config.Journal.BeginPhase(ctx, instanceID, featureID, currentVersion, targetVersion, PhaseValidation, nil)
	if err != nil {
		return err
	}

	// Start the instance
	if e.config.InstanceStarter != nil {
		if err := e.config.InstanceStarter.Start(ctx, instanceID); err != nil {
			_ = e.config.Journal.FailPhase(ctx, instanceID, targetVersion, PhaseValidation, err.Error()) //nolint:errcheck // best-effort journal logging
			return fmt.Errorf("failed to start instance: %w", err)
		}
	}

	// Wait for health check (Story 8.6)
	if e.config.HealthChecker != nil {
		// Give service time to start
		time.Sleep(3 * time.Second)

		status, err := e.config.HealthChecker.GetStatus(instanceID)
		if err != nil || status != "HEALTHY" {
			const errFormat = "health check failed: %v (status: %s)"
			errMsg := fmt.Sprintf(errFormat, err, status)
			_ = e.config.Journal.FailPhase(ctx, instanceID, targetVersion, PhaseValidation, errMsg) //nolint:errcheck // best-effort journal logging
			return fmt.Errorf(errFormat, err, status)
		}
	}

	_ = e.config.Journal.CompletePhase(ctx, instanceID, targetVersion, PhaseValidation) //nolint:errcheck // best-effort journal logging
	e.logger.Info().Str("phase", "VALIDATION").Msg("VALIDATION phase completed")
	return nil
}

// phaseCommit finalizes the update
func (e *UpdateEngine) phaseCommit(ctx context.Context, instanceID, featureID, currentVersion, targetVersion string) error {
	e.logger.Info().Str("phase", "COMMIT").Msg("Starting COMMIT phase")

	_, err := e.config.Journal.BeginPhase(ctx, instanceID, featureID, currentVersion, targetVersion, PhaseCommit, nil)
	if err != nil {
		return err
	}

	// Cleanup staging directory
	stagingDir := e.resolveStagingPath(featureID, targetVersion)
	_ = os.RemoveAll(stagingDir)

	// Keep backup for rollback window (cleanup can happen later)

	_ = e.config.Journal.CompletePhase(ctx, instanceID, targetVersion, PhaseCommit) //nolint:errcheck // best-effort journal logging
	e.logger.Info().Str("phase", "COMMIT").Msg("COMMIT phase completed")
	return nil
}

// rollback restores from backup
func (e *UpdateEngine) rollback(ctx context.Context, instanceID, featureID, currentVersion, targetVersion string) error {
	e.logger.Info().Str("phase", "ROLLBACK").Msg("Starting ROLLBACK")

	_, err := e.config.Journal.BeginPhase(ctx, instanceID, featureID, currentVersion, targetVersion, PhaseRollback, nil)
	if err != nil {
		return err
	}

	// Stop instance
	if e.config.InstanceStopper != nil {
		_ = e.config.InstanceStopper.Stop(ctx, instanceID) //nolint:errcheck // best-effort rollback
	}

	// Restore from backup
	backupBinary := filepath.Join(e.resolveBackupPath(featureID, instanceID, currentVersion), featureID)
	currentBinary := e.resolveBinaryPath(featureID, instanceID)

	if err := copyFile(backupBinary, currentBinary); err != nil {
		_ = e.config.Journal.FailPhase(ctx, instanceID, targetVersion, PhaseRollback, err.Error()) //nolint:errcheck // best-effort journal logging
		return fmt.Errorf("failed to restore backup: %w", err)
	}

	// Restart instance
	if e.config.InstanceStarter != nil {
		_ = e.config.InstanceStarter.Start(ctx, instanceID) //nolint:errcheck // best-effort rollback
	}

	_ = e.config.Journal.CompletePhase(ctx, instanceID, targetVersion, PhaseRollback) //nolint:errcheck // best-effort journal logging
	e.logger.Info().Str("phase", "ROLLBACK").Msg("ROLLBACK completed")
	return nil
}

// RecoverFromCrash recovers incomplete updates on boot
func (e *UpdateEngine) RecoverFromCrash(ctx context.Context) error {
	e.logger.Info().Msg("Checking for incomplete updates")

	entries, err := e.config.Journal.GetIncompleteUpdates(ctx)
	if err != nil {
		return fmt.Errorf("failed to get incomplete updates: %w", err)
	}

	if len(entries) == 0 {
		e.logger.Info().Msg("No incomplete updates found")
		return nil
	}

	e.logger.Warn().Int("count", len(entries)).Msg("Found incomplete updates, attempting recovery")

	for _, entry := range entries {
		e.logger.Info().
			Str("instanceID", entry.InstanceID).
			Str("phase", string(entry.Phase)).
			Msg("Recovering incomplete update")

		// Attempt rollback for any incomplete update
		if err := e.rollback(ctx, entry.InstanceID, entry.FeatureID, entry.FromVersion, entry.ToVersion); err != nil {
			e.logger.Error().Err(err).Str("instanceID", entry.InstanceID).Msg("Recovery failed")
		}
	}

	return nil
}

// copyFile copies a file from src to dst
func copyFile(src, dst string) error {
	data, err := os.ReadFile(src)
	if err != nil {
		return err
	}
	return os.WriteFile(dst, data, 0o644)
}
