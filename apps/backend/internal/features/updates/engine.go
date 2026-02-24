package updates

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"backend/internal/events"
	"backend/internal/storage"

	"go.uber.org/zap"
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
	Logger           *zap.Logger
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
	logger    *zap.Logger
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

	logger := config.Logger
	if logger == nil {
		logger = zap.NewNop()
	}

	return &UpdateEngine{
		config:    config,
		logger:    logger.Named("update_engine"),
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

func (e *UpdateEngine) resolveConfigPath(featureID string) string {
	if e.config.PathResolver != nil {
		return e.config.PathResolver.ConfigPath(featureID)
	}
	return filepath.Join(e.config.BaseDir, "features", featureID, "config", featureID+".json")
}

// ApplyUpdate executes the 6-phase atomic update process
func (e *UpdateEngine) ApplyUpdate(ctx context.Context, instanceID, featureID, currentVersion, targetVersion, downloadURL, checksumURL string) error {
	e.logger.Info("Starting atomic update",
		zap.String("instanceID", instanceID),
		zap.String("featureID", featureID),
		zap.String("currentVersion", currentVersion),
		zap.String("targetVersion", targetVersion))

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
		e.logger.Error("SWAP phase failed, attempting rollback", zap.Error(err))
		if rbErr := e.rollback(ctx, instanceID, featureID, currentVersion, targetVersion); rbErr != nil {
			return fmt.Errorf("SWAP failed and rollback failed: %w", errors.Join(rbErr, err))
		}
		return fmt.Errorf("SWAP phase failed (rolled back): %w", err)
	}

	// Phase 4: MIGRATION - Run config migrations
	if err := e.phaseMigration(ctx, instanceID, featureID, currentVersion, targetVersion); err != nil {
		e.logger.Error("MIGRATION phase failed, attempting rollback", zap.Error(err))
		if rbErr := e.rollback(ctx, instanceID, featureID, currentVersion, targetVersion); rbErr != nil {
			return fmt.Errorf("MIGRATION failed and rollback failed: %w", errors.Join(rbErr, err))
		}
		return fmt.Errorf("MIGRATION phase failed (rolled back): %w", err)
	}

	// Phase 5: VALIDATION - Start service and verify health
	if err := e.phaseValidation(ctx, instanceID, featureID, currentVersion, targetVersion); err != nil {
		e.logger.Error("VALIDATION phase failed, attempting rollback", zap.Error(err))
		if rbErr := e.rollback(ctx, instanceID, featureID, currentVersion, targetVersion); rbErr != nil {
			return fmt.Errorf("VALIDATION failed and rollback failed: %w", errors.Join(rbErr, err))
		}
		return fmt.Errorf("VALIDATION phase failed (rolled back): %w", err)
	}

	// Phase 6: COMMIT - Finalize update
	if err := e.phaseCommit(ctx, instanceID, featureID, currentVersion, targetVersion); err != nil {
		return fmt.Errorf("COMMIT phase failed: %w", err)
	}

	e.logger.Info("Atomic update completed successfully",
		zap.String("instanceID", instanceID),
		zap.String("targetVersion", targetVersion))

	return nil
}

// phaseStaging downloads and verifies the new binary
func (e *UpdateEngine) phaseStaging(ctx context.Context, instanceID, featureID, currentVersion, targetVersion, downloadURL, checksumURL string) error {
	e.logger.Info("Starting STAGING phase", zap.String("phase", "STAGING"))

	_, err := e.config.Journal.BeginPhase(ctx, instanceID, featureID, currentVersion, targetVersion, PhaseStaging, map[string]interface{}{
		"downloadURL": downloadURL,
		"checksumURL": checksumURL,
	})
	if err != nil {
		return err
	}

	// Download binary to staging directory
	stagingDir := e.resolveStagingPath(featureID, targetVersion)
	stagingBinary := filepath.Join(stagingDir, featureID)

	// Create staging directory
	if err := os.MkdirAll(stagingDir, 0o755); err != nil {
		_ = e.config.Journal.FailPhase(ctx, instanceID, targetVersion, PhaseStaging, err.Error()) //nolint:errcheck // best-effort journal logging
		return fmt.Errorf("failed to create staging dir: %w", err)
	}

	// Fetch expected checksum from checksum URL
	expectedChecksum, checksumErr := fetchChecksum(ctx, checksumURL, featureID)
	if checksumErr != nil {
		e.logger.Warn("failed to fetch checksum, proceeding without verification", zap.Error(checksumErr))
		expectedChecksum = "" // Proceed without verification if checksum unavailable
	}

	if err := e.config.DownloadManager.Download(ctx, featureID, downloadURL, expectedChecksum); err != nil {
		_ = e.config.Journal.FailPhase(ctx, instanceID, targetVersion, PhaseStaging, err.Error()) //nolint:errcheck // best-effort journal logging
		return fmt.Errorf("download failed: %w", err)
	}

	e.logger.Debug("download completed to staging", zap.String("stagingBinary", stagingBinary))

	_ = e.config.Journal.CompletePhase(ctx, instanceID, targetVersion, PhaseStaging) //nolint:errcheck // best-effort journal logging
	e.logger.Info("STAGING phase completed", zap.String("phase", "STAGING"))
	return nil
}

// phaseBackup backs up the current binary and configuration
func (e *UpdateEngine) phaseBackup(ctx context.Context, instanceID, featureID, currentVersion, targetVersion string) error {
	e.logger.Info("Starting BACKUP phase", zap.String("phase", "BACKUP"))

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

	// Backup configuration files
	configDir := e.resolveConfigPath(featureID)
	backupConfigDir := filepath.Join(backupDir, "config")
	if err := copyDir(configDir, backupConfigDir); err != nil {
		e.logger.Warn("config backup skipped (no config directory or copy failed)", zap.Error(err))
		// Non-fatal: some features may not have config files
	}

	_ = e.config.Journal.CompletePhase(ctx, instanceID, targetVersion, PhaseBackup) //nolint:errcheck // best-effort journal logging
	e.logger.Info("BACKUP phase completed", zap.String("phase", "BACKUP"))
	return nil
}

// phaseSwap stops the service and atomically swaps binaries
func (e *UpdateEngine) phaseSwap(ctx context.Context, instanceID, featureID, currentVersion, targetVersion string) error {
	e.logger.Info("Starting SWAP phase", zap.String("phase", "SWAP"))

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
	e.logger.Info("SWAP phase completed", zap.String("phase", "SWAP"))
	return nil
}

// phaseMigration runs configuration migrations
//
//nolint:nestif // sequential error handling requires nesting
func (e *UpdateEngine) phaseMigration(ctx context.Context, instanceID, featureID, currentVersion, targetVersion string) error {
	e.logger.Info("Starting MIGRATION phase", zap.String("phase", "MIGRATION"))

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

	// Load current config
	configPath := e.resolveConfigPath(featureID)
	configData, readErr := os.ReadFile(configPath)
	if readErr != nil {
		if os.IsNotExist(readErr) {
			e.logger.Info("no config file found, skipping migration")
		} else {
			_ = e.config.Journal.FailPhase(ctx, instanceID, targetVersion, PhaseMigration, readErr.Error()) //nolint:errcheck // best-effort journal logging
			return fmt.Errorf("failed to read config: %w", readErr)
		}
	} else {
		// Parse config
		var configMap map[string]interface{}
		if err := json.Unmarshal(configData, &configMap); err != nil {
			_ = e.config.Journal.FailPhase(ctx, instanceID, targetVersion, PhaseMigration, err.Error()) //nolint:errcheck // best-effort journal logging
			return fmt.Errorf("failed to parse config: %w", err)
		}

		// Run migration
		migratedConfig, err := migrator.Migrate(ctx, currentVersion, targetVersion, configMap)
		if err != nil {
			_ = e.config.Journal.FailPhase(ctx, instanceID, targetVersion, PhaseMigration, err.Error()) //nolint:errcheck // best-effort journal logging
			return fmt.Errorf("config migration failed: %w", err)
		}

		// Write migrated config
		migratedData, err := json.MarshalIndent(migratedConfig, "", "  ")
		if err != nil {
			_ = e.config.Journal.FailPhase(ctx, instanceID, targetVersion, PhaseMigration, err.Error()) //nolint:errcheck // best-effort journal logging
			return fmt.Errorf("failed to serialize migrated config: %w", err)
		}

		if err := os.WriteFile(configPath, migratedData, 0o644); err != nil {
			_ = e.config.Journal.FailPhase(ctx, instanceID, targetVersion, PhaseMigration, err.Error()) //nolint:errcheck // best-effort journal logging
			return fmt.Errorf("failed to write migrated config: %w", err)
		}

		e.logger.Info("config migration completed",
			zap.String("from", currentVersion),
			zap.String("to", targetVersion))
	}

	_ = e.config.Journal.CompletePhase(ctx, instanceID, targetVersion, PhaseMigration) //nolint:errcheck // best-effort journal logging
	e.logger.Info("MIGRATION phase completed", zap.String("phase", "MIGRATION"))
	return nil
}

// phaseValidation starts the service and verifies health
func (e *UpdateEngine) phaseValidation(ctx context.Context, instanceID, featureID, currentVersion, targetVersion string) error {
	e.logger.Info("Starting VALIDATION phase", zap.String("phase", "VALIDATION"))

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
	e.logger.Info("VALIDATION phase completed", zap.String("phase", "VALIDATION"))
	return nil
}

// phaseCommit finalizes the update
func (e *UpdateEngine) phaseCommit(ctx context.Context, instanceID, featureID, currentVersion, targetVersion string) error {
	e.logger.Info("Starting COMMIT phase", zap.String("phase", "COMMIT"))

	_, err := e.config.Journal.BeginPhase(ctx, instanceID, featureID, currentVersion, targetVersion, PhaseCommit, nil)
	if err != nil {
		return err
	}

	// Cleanup staging directory
	stagingDir := e.resolveStagingPath(featureID, targetVersion)
	_ = os.RemoveAll(stagingDir)

	// Keep backup for rollback window (cleanup can happen later)

	_ = e.config.Journal.CompletePhase(ctx, instanceID, targetVersion, PhaseCommit) //nolint:errcheck // best-effort journal logging
	e.logger.Info("COMMIT phase completed", zap.String("phase", "COMMIT"))
	return nil
}

// rollback restores from backup
func (e *UpdateEngine) rollback(ctx context.Context, instanceID, featureID, currentVersion, targetVersion string) error {
	e.logger.Info("Starting ROLLBACK", zap.String("phase", "ROLLBACK"))

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

	// Restore configuration from backup
	backupConfigDir := filepath.Join(e.resolveBackupPath(featureID, instanceID, currentVersion), "config")
	configDir := e.resolveConfigPath(featureID)
	if err := copyDir(backupConfigDir, configDir); err != nil {
		e.logger.Warn("config restore skipped during rollback", zap.Error(err))
	}

	// Restart instance
	if e.config.InstanceStarter != nil {
		_ = e.config.InstanceStarter.Start(ctx, instanceID) //nolint:errcheck // best-effort rollback
	}

	_ = e.config.Journal.CompletePhase(ctx, instanceID, targetVersion, PhaseRollback) //nolint:errcheck // best-effort journal logging
	e.logger.Info("ROLLBACK completed", zap.String("phase", "ROLLBACK"))
	return nil
}

// RecoverFromCrash recovers incomplete updates on boot
func (e *UpdateEngine) RecoverFromCrash(ctx context.Context) error {
	e.logger.Info("Checking for incomplete updates")

	entries, err := e.config.Journal.GetIncompleteUpdates(ctx)
	if err != nil {
		return fmt.Errorf("failed to get incomplete updates: %w", err)
	}

	if len(entries) == 0 {
		e.logger.Info("No incomplete updates found")
		return nil
	}

	e.logger.Warn("Found incomplete updates, attempting recovery", zap.Int("count", len(entries)))

	for _, entry := range entries {
		e.logger.Info("Recovering incomplete update",
			zap.String("instanceID", entry.InstanceID),
			zap.String("phase", string(entry.Phase)))

		// Attempt rollback for any incomplete update
		if err := e.rollback(ctx, entry.InstanceID, entry.FeatureID, entry.FromVersion, entry.ToVersion); err != nil {
			e.logger.Error("Recovery failed", zap.Error(err), zap.String("instanceID", entry.InstanceID))
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

// copyDir recursively copies a directory from src to dst.
func copyDir(src, dst string) error {
	entries, err := os.ReadDir(src)
	if err != nil {
		if os.IsNotExist(err) {
			return nil // Source dir doesn't exist, nothing to copy
		}
		return err
	}

	if err := os.MkdirAll(dst, 0o755); err != nil {
		return err
	}

	for _, entry := range entries {
		srcPath := filepath.Join(src, entry.Name())
		dstPath := filepath.Join(dst, entry.Name())

		if entry.IsDir() {
			if err := copyDir(srcPath, dstPath); err != nil {
				return err
			}
		} else {
			if err := copyFile(srcPath, dstPath); err != nil {
				return err
			}
		}
	}
	return nil
}

// fetchChecksum fetches the checksum file from the given URL and extracts the hash for the target filename.
// The checksum file format is "sha256hash  filename" (standard sha256sum format).
func fetchChecksum(ctx context.Context, checksumURL, targetFilename string) (string, error) {
	if checksumURL == "" {
		return "", fmt.Errorf("checksum URL is empty")
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, checksumURL, http.NoBody)
	if err != nil {
		return "", fmt.Errorf("failed to create checksum request: %w", err)
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to fetch checksum: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("checksum URL returned status %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read checksum response: %w", err)
	}

	// Parse sha256sum format: "hash  filename" or "hash *filename"
	lines := strings.Split(strings.TrimSpace(string(body)), "\n")
	for _, line := range lines {
		parts := strings.Fields(line)
		if len(parts) >= 2 {
			hash := parts[0]
			filename := strings.TrimPrefix(parts[1], "*")
			if filename == targetFilename || targetFilename == "" {
				return hash, nil
			}
		}
	}

	// If only one line with just a hash (no filename), return it
	if len(lines) == 1 {
		hash := strings.TrimSpace(lines[0])
		if len(hash) == 64 { // SHA256 hex length
			return hash, nil
		}
	}

	return "", fmt.Errorf("checksum not found for %s in checksum file", targetFilename)
}
