package lifecycle

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"os"
	"strings"
	"time"

	"backend/generated/ent"
	"backend/generated/ent/serviceinstance"
	"backend/internal/orchestrator/supervisor"

	"backend/internal/events"
)

// Reconcile synchronizes database state with running processes on startup
func (im *InstanceManager) Reconcile(ctx context.Context) error {
	im.logger.Info().Msg("Starting instance reconciliation")

	// Cleanup orphaned resource allocations first
	routers, err := im.config.Store.Router.Query().All(ctx)
	if err != nil {
		im.logger.Error().Err(err).Msg("failed to query routers for orphan cleanup")
	} else {
		im.cleanupOrphanedPorts(ctx, routers)
		im.cleanupOrphanedVLANs(ctx, routers)
	}

	// Get all instances from database
	instances, err := im.config.Store.ServiceInstance.Query().All(ctx)
	if err != nil {
		return fmt.Errorf("failed to query instances: %w", err)
	}

	for _, instance := range instances {
		status := InstanceStatus(instance.Status)

		if status == StatusRunning {
			mp, exists := im.config.Supervisor.Get(instance.ID)
			if !exists || mp.State() != supervisor.ProcessStateRunning {
				im.logger.Warn().Str("instance_id", instance.ID).Msg("Instance marked as running but process not found, marking as stopped")
				_ = im.updateInstanceStatus(ctx, instance.ID, StatusStopped) //nolint:errcheck // best-effort status correction during reconciliation
			}
		}

		if status == StatusInstalling || status == StatusStarting || status == StatusStopping {
			im.logger.Warn().Str("instance_id", instance.ID).Str("status", string(status)).Msg("Instance in transient state, marking as failed")
			_ = im.updateInstanceStatus(ctx, instance.ID, StatusFailed) //nolint:errcheck // best-effort status correction during reconciliation
		}
	}

	im.logger.Info().Int("instances_reconciled", len(instances)).Msg("Reconciliation complete")
	return nil
}

// cleanupOrphanedPorts removes port allocations for instances that no longer exist
func (im *InstanceManager) cleanupOrphanedPorts(ctx context.Context, routers []*ent.Router) {
	if im.config.PortRegistry == nil {
		return
	}

	im.logger.Info().Msg("Cleaning up orphaned port allocations")
	totalPortsCleaned := 0

	for _, router := range routers {
		cleanedCount, err := im.config.PortRegistry.CleanupOrphans(ctx, router.ID)
		if err != nil {
			im.logger.Error().
				Err(err).
				Str("router_id", router.ID).
				Msg("failed to cleanup orphaned ports for router")
			continue
		}
		totalPortsCleaned += cleanedCount
	}

	if totalPortsCleaned > 0 {
		im.logger.Info().
			Int("total_cleaned", totalPortsCleaned).
			Int("routers_checked", len(routers)).
			Msg("orphaned port allocations cleaned up")
	}
}

// cleanupOrphanedVLANs removes VLAN allocations for instances that no longer exist
func (im *InstanceManager) cleanupOrphanedVLANs(ctx context.Context, routers []*ent.Router) {
	if im.config.VLANAllocator == nil {
		return
	}

	im.logger.Info().Msg("Cleaning up orphaned VLAN allocations")
	totalVLANsCleaned := 0

	for _, router := range routers {
		cleanedCount, err := im.config.VLANAllocator.CleanupOrphans(ctx, router.ID)
		if err != nil {
			im.logger.Error().
				Err(err).
				Str("router_id", router.ID).
				Msg("failed to cleanup orphaned VLANs for router")
			continue
		}
		totalVLANsCleaned += cleanedCount
	}

	if totalVLANsCleaned > 0 {
		im.logger.Info().
			Int("total_cleaned", totalVLANsCleaned).
			Int("routers_checked", len(routers)).
			Msg("orphaned VLAN allocations cleaned up")
	}
}

// OnStorageDisconnected handles storage disconnection events.
func (im *InstanceManager) OnStorageDisconnected(ctx context.Context, path string) error {
	im.logger.Warn().Str("path", path).Msg("handling storage disconnected event")

	instances, err := im.config.Store.ServiceInstance.Query().
		Where(serviceinstance.BinaryPathHasPrefix(path)).
		All(ctx)

	if err != nil {
		return fmt.Errorf("failed to query affected instances: %w", err)
	}

	im.logger.Info().
		Str("path", path).
		Int("affected_count", len(instances)).
		Msg("found instances affected by storage disconnect")

	for _, instance := range instances {
		im.logger.Info().
			Str("instance_id", instance.ID).
			Str("feature_id", instance.FeatureID).
			Str("binary_path", instance.BinaryPath).
			Msg("stopping instance due to storage disconnect")

		currentStatus := InstanceStatus(instance.Status)

		if currentStatus == StatusRunning { //nolint:nestif // recovery state machine
			_, exists := im.config.Supervisor.Get(instance.ID)
			if exists {
				if err := im.config.Supervisor.Stop(ctx, instance.ID); err != nil {
					im.logger.Error().Err(err).Str("instance_id", instance.ID).Msg("failed to stop instance")
				}
				if err := im.config.Supervisor.Remove(instance.ID); err != nil {
					im.logger.Warn().Err(err).Str("instance_id", instance.ID).Msg("failed to remove from supervisor")
				}
			}
		}

		unavailableReason := fmt.Sprintf("External storage disconnected: %s", path)
		_, err := im.config.Store.ServiceInstance.UpdateOneID(instance.ID).
			SetStatus(serviceinstance.StatusFailed).
			SetUnavailableReason(unavailableReason).
			Save(ctx)

		if err != nil {
			im.logger.Error().Err(err).Str("instance_id", instance.ID).Msg("failed to update instance status")
			continue
		}

		im.emitStateChangeEvent(ctx, instance.ID, string(currentStatus), string(StatusFailed))

		im.logger.Info().
			Str("instance_id", instance.ID).
			Str("reason", unavailableReason).
			Msg("instance marked as failed due to storage disconnect")
	}

	return nil
}

// OnStorageReconnected handles storage reconnection events.
func (im *InstanceManager) OnStorageReconnected(ctx context.Context, path string) error {
	im.logger.Info().Str("path", path).Msg("handling storage reconnected event")

	instances, err := im.config.Store.ServiceInstance.Query().
		Where(
			serviceinstance.StatusEQ(serviceinstance.StatusFailed),
			serviceinstance.UnavailableReasonContains(path),
		).
		All(ctx)

	if err != nil {
		return fmt.Errorf("failed to query affected instances: %w", err)
	}

	im.logger.Info().
		Str("path", path).
		Int("potentially_recoverable", len(instances)).
		Msg("found instances to verify after storage reconnect")

	for _, instance := range instances {
		im.logger.Info().
			Str("instance_id", instance.ID).
			Str("feature_id", instance.FeatureID).
			Str("binary_path", instance.BinaryPath).
			Msg("verifying binary integrity for instance")

		valid, err := im.verifyBinaryIntegrity(ctx, instance)
		if err != nil {
			im.logger.Error().Err(err).Str("instance_id", instance.ID).Msg("failed to verify binary integrity")
			continue
		}

		if !valid {
			im.handleIntegrityFailure(ctx, instance, path)
			continue
		}

		im.restoreInstance(ctx, instance)
	}

	return nil
}

// handleIntegrityFailure handles a binary integrity check failure
func (im *InstanceManager) handleIntegrityFailure(ctx context.Context, instance *ent.ServiceInstance, path string) {
	im.logger.Warn().
		Str("instance_id", instance.ID).
		Str("binary_path", instance.BinaryPath).
		Msg("binary integrity check failed - checksum mismatch")

	updatedReason := fmt.Sprintf("Binary integrity check failed after storage reconnect: %s (expected checksum: %s)", path, instance.BinaryChecksum)
	_, err := im.config.Store.ServiceInstance.UpdateOneID(instance.ID).
		SetUnavailableReason(updatedReason).
		Save(ctx)

	if err != nil {
		im.logger.Error().Err(err).Str("instance_id", instance.ID).Msg("failed to update unavailable reason")
	}

	publisher := events.NewPublisher(im.config.EventBus, "instance-manager")
	verifyEvent := events.NewStorageUnavailableEvent(
		instance.FeatureID,
		instance.ID,
		instance.BinaryPath,
		"checksum_mismatch",
		"instance-manager",
	)
	if err := publisher.Publish(ctx, verifyEvent); err != nil {
		im.logger.Error().Err(err).Msg("failed to publish storage unavailable event")
	}
}

// restoreInstance restores a verified instance to installed status
func (im *InstanceManager) restoreInstance(ctx context.Context, instance *ent.ServiceInstance) {
	im.logger.Info().
		Str("instance_id", instance.ID).
		Msg("binary integrity verified - restoring instance")

	_, err := im.config.Store.ServiceInstance.UpdateOneID(instance.ID).
		SetStatus(serviceinstance.StatusInstalled).
		ClearUnavailableReason().
		Save(ctx)

	if err != nil {
		im.logger.Error().Err(err).Str("instance_id", instance.ID).Msg("failed to restore instance status")
		return
	}

	im.emitStateChangeEvent(ctx, instance.ID, string(StatusFailed), string(StatusInstalled))

	im.logger.Info().
		Str("instance_id", instance.ID).
		Msg("instance restored to installed status after storage reconnect")
}

// verifyBinaryIntegrity checks if a binary file exists and matches its expected SHA256 checksum.
func (im *InstanceManager) verifyBinaryIntegrity(_ context.Context, instance *ent.ServiceInstance) (bool, error) {
	if instance.BinaryPath == "" {
		return false, fmt.Errorf("binary path not set")
	}

	if instance.BinaryChecksum == "" {
		im.logger.Warn().
			Str("instance_id", instance.ID).
			Msg("no checksum stored - skipping integrity check")
		return true, nil
	}

	if _, err := os.Stat(instance.BinaryPath); os.IsNotExist(err) {
		im.logger.Warn().
			Str("instance_id", instance.ID).
			Str("binary_path", instance.BinaryPath).
			Msg("binary file not found")
		return false, nil
	}

	file, err := os.Open(instance.BinaryPath)
	if err != nil {
		return false, fmt.Errorf("failed to open binary file: %w", err)
	}
	defer file.Close()

	hash := sha256.New()
	if _, err := io.Copy(hash, file); err != nil {
		return false, fmt.Errorf("failed to calculate checksum: %w", err)
	}

	actualChecksum := strings.ToLower(hex.EncodeToString(hash.Sum(nil)))
	expectedChecksum := strings.ToLower(instance.BinaryChecksum)

	if actualChecksum != expectedChecksum {
		im.logger.Warn().
			Str("instance_id", instance.ID).
			Str("expected", expectedChecksum).
			Str("actual", actualChecksum).
			Msg("checksum mismatch")
		return false, nil
	}

	im.logger.Debug().
		Str("instance_id", instance.ID).
		Str("checksum", actualChecksum).
		Msg("binary integrity verified")

	return true, nil
}

// handleRestartRequests processes restart requests from the health checker
func (im *InstanceManager) handleRestartRequests() {
	defer im.restartWg.Done()

	for {
		select {
		case <-im.restartCtx.Done():
			return
		case req := <-im.restartChan:
			im.logger.Info().
				Str("instance_id", req.InstanceID).
				Str("reason", req.Reason).
				Msg("Processing health check restart request")

			ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
			err := im.RestartInstance(ctx, req.InstanceID)
			cancel()

			if err != nil {
				im.logger.Error().
					Err(err).
					Str("instance_id", req.InstanceID).
					Msg("Failed to restart instance")
			} else {
				im.logger.Info().
					Str("instance_id", req.InstanceID).
					Msg("Instance restarted successfully")
			}
		}
	}
}
