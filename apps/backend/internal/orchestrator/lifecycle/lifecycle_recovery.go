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

	"go.uber.org/zap"
)

// Reconcile synchronizes database state with running processes on startup
func (im *InstanceManager) Reconcile(ctx context.Context) error {
	im.logger.Info("Starting instance reconciliation")

	// Cleanup orphaned resource allocations first
	routers, err := im.config.Store.Router.Query().All(ctx)
	if err != nil {
		im.logger.Error("failed to query routers for orphan cleanup", zap.Error(err))
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
				im.logger.Warn("Instance marked as running but process not found, marking as stopped", zap.String("instance_id", instance.ID))
				_ = im.updateInstanceStatus(ctx, instance.ID, StatusStopped) //nolint:errcheck // best-effort status correction during reconciliation
			}
		}

		if status == StatusInstalling || status == StatusStarting || status == StatusStopping {
			im.logger.Warn("Instance in transient state, marking as failed", zap.String("instance_id", instance.ID), zap.String("status", string(status)))
			_ = im.updateInstanceStatus(ctx, instance.ID, StatusFailed) //nolint:errcheck // best-effort status correction during reconciliation
		}
	}

	im.logger.Info("Reconciliation complete", zap.Int("instances_reconciled", len(instances)))
	return nil
}

// cleanupOrphanedPorts removes port allocations for instances that no longer exist
func (im *InstanceManager) cleanupOrphanedPorts(ctx context.Context, routers []*ent.Router) {
	if im.config.PortRegistry == nil {
		return
	}

	im.logger.Info("Cleaning up orphaned port allocations")
	totalPortsCleaned := 0

	for _, router := range routers {
		cleanedCount, err := im.config.PortRegistry.CleanupOrphans(ctx, router.ID)
		if err != nil {
			im.logger.Error("failed to cleanup orphaned ports for router",
				zap.Error(err),
				zap.String("router_id", router.ID),
			)
			continue
		}
		totalPortsCleaned += cleanedCount
	}

	if totalPortsCleaned > 0 {
		im.logger.Info("orphaned port allocations cleaned up",
			zap.Int("total_cleaned", totalPortsCleaned),
			zap.Int("routers_checked", len(routers)),
		)
	}
}

// cleanupOrphanedVLANs removes VLAN allocations for instances that no longer exist
func (im *InstanceManager) cleanupOrphanedVLANs(ctx context.Context, routers []*ent.Router) {
	if im.config.VLANAllocator == nil {
		return
	}

	im.logger.Info("Cleaning up orphaned VLAN allocations")
	totalVLANsCleaned := 0

	for _, router := range routers {
		cleanedCount, err := im.config.VLANAllocator.CleanupOrphans(ctx, router.ID)
		if err != nil {
			im.logger.Error("failed to cleanup orphaned VLANs for router",
				zap.Error(err),
				zap.String("router_id", router.ID),
			)
			continue
		}
		totalVLANsCleaned += cleanedCount
	}

	if totalVLANsCleaned > 0 {
		im.logger.Info("orphaned VLAN allocations cleaned up",
			zap.Int("total_cleaned", totalVLANsCleaned),
			zap.Int("routers_checked", len(routers)),
		)
	}
}

// OnStorageDisconnected handles storage disconnection events.
func (im *InstanceManager) OnStorageDisconnected(ctx context.Context, path string) error {
	im.logger.Warn("handling storage disconnected event", zap.String("path", path))

	instances, err := im.config.Store.ServiceInstance.Query().
		Where(serviceinstance.BinaryPathHasPrefix(path)).
		All(ctx)

	if err != nil {
		return fmt.Errorf("failed to query affected instances: %w", err)
	}

	im.logger.Info("found instances affected by storage disconnect",
		zap.String("path", path),
		zap.Int("affected_count", len(instances)),
	)

	for _, instance := range instances {
		im.logger.Info("stopping instance due to storage disconnect",
			zap.String("instance_id", instance.ID),
			zap.String("feature_id", instance.FeatureID),
			zap.String("binary_path", instance.BinaryPath),
		)

		currentStatus := InstanceStatus(instance.Status)

		if currentStatus == StatusRunning { //nolint:nestif // recovery state machine
			_, exists := im.config.Supervisor.Get(instance.ID)
			if exists {
				if err := im.config.Supervisor.Stop(ctx, instance.ID); err != nil {
					im.logger.Error("failed to stop instance", zap.Error(err), zap.String("instance_id", instance.ID))
				}
				if err := im.config.Supervisor.Remove(instance.ID); err != nil {
					im.logger.Warn("failed to remove from supervisor", zap.Error(err), zap.String("instance_id", instance.ID))
				}
			}
		}

		unavailableReason := fmt.Sprintf("External storage disconnected: %s", path)
		_, err := im.config.Store.ServiceInstance.UpdateOneID(instance.ID).
			SetStatus(serviceinstance.StatusFailed).
			SetUnavailableReason(unavailableReason).
			Save(ctx)

		if err != nil {
			im.logger.Error("failed to update instance status", zap.Error(err), zap.String("instance_id", instance.ID))
			continue
		}

		im.emitStateChangeEvent(ctx, instance.ID, string(currentStatus), string(StatusFailed))

		im.logger.Info("instance marked as failed due to storage disconnect",
			zap.String("instance_id", instance.ID),
			zap.String("reason", unavailableReason),
		)
	}

	return nil
}

// OnStorageReconnected handles storage reconnection events.
func (im *InstanceManager) OnStorageReconnected(ctx context.Context, path string) error {
	im.logger.Info("handling storage reconnected event", zap.String("path", path))

	instances, err := im.config.Store.ServiceInstance.Query().
		Where(
			serviceinstance.StatusEQ(serviceinstance.StatusFailed),
			serviceinstance.UnavailableReasonContains(path),
		).
		All(ctx)

	if err != nil {
		return fmt.Errorf("failed to query affected instances: %w", err)
	}

	im.logger.Info("found instances to verify after storage reconnect",
		zap.String("path", path),
		zap.Int("potentially_recoverable", len(instances)),
	)

	for _, instance := range instances {
		im.logger.Info("verifying binary integrity for instance",
			zap.String("instance_id", instance.ID),
			zap.String("feature_id", instance.FeatureID),
			zap.String("binary_path", instance.BinaryPath),
		)

		valid, err := im.verifyBinaryIntegrity(ctx, instance)
		if err != nil {
			im.logger.Error("failed to verify binary integrity", zap.Error(err), zap.String("instance_id", instance.ID))
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
	im.logger.Warn("binary integrity check failed - checksum mismatch",
		zap.String("instance_id", instance.ID),
		zap.String("binary_path", instance.BinaryPath),
	)

	updatedReason := fmt.Sprintf("Binary integrity check failed after storage reconnect: %s (expected checksum: %s)", path, instance.BinaryChecksum)
	_, err := im.config.Store.ServiceInstance.UpdateOneID(instance.ID).
		SetUnavailableReason(updatedReason).
		Save(ctx)

	if err != nil {
		im.logger.Error("failed to update unavailable reason", zap.Error(err), zap.String("instance_id", instance.ID))
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
		im.logger.Error("failed to publish storage unavailable event", zap.Error(err))
	}
}

// restoreInstance restores a verified instance to installed status
func (im *InstanceManager) restoreInstance(ctx context.Context, instance *ent.ServiceInstance) {
	im.logger.Info("binary integrity verified - restoring instance", zap.String("instance_id", instance.ID))

	_, err := im.config.Store.ServiceInstance.UpdateOneID(instance.ID).
		SetStatus(serviceinstance.StatusInstalled).
		ClearUnavailableReason().
		Save(ctx)

	if err != nil {
		im.logger.Error("failed to restore instance status", zap.Error(err), zap.String("instance_id", instance.ID))
		return
	}

	im.emitStateChangeEvent(ctx, instance.ID, string(StatusFailed), string(StatusInstalled))

	im.logger.Info("instance restored to installed status after storage reconnect", zap.String("instance_id", instance.ID))
}

// verifyBinaryIntegrity checks if a binary file exists and matches its expected SHA256 checksum.
func (im *InstanceManager) verifyBinaryIntegrity(_ context.Context, instance *ent.ServiceInstance) (bool, error) {
	if instance.BinaryPath == "" {
		return false, fmt.Errorf("binary path not set")
	}

	if instance.BinaryChecksum == "" {
		im.logger.Warn("no checksum stored - skipping integrity check", zap.String("instance_id", instance.ID))
		return true, nil
	}

	if _, err := os.Stat(instance.BinaryPath); os.IsNotExist(err) {
		im.logger.Warn("binary file not found",
			zap.String("instance_id", instance.ID),
			zap.String("binary_path", instance.BinaryPath),
		)
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
		im.logger.Warn("checksum mismatch",
			zap.String("instance_id", instance.ID),
			zap.String("expected", expectedChecksum),
			zap.String("actual", actualChecksum),
		)
		return false, nil
	}

	im.logger.Debug("binary integrity verified",
		zap.String("instance_id", instance.ID),
		zap.String("checksum", actualChecksum),
	)

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
			im.logger.Info("Processing health check restart request",
				zap.String("instance_id", req.InstanceID),
				zap.String("reason", req.Reason),
			)

			ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
			err := im.RestartInstance(ctx, req.InstanceID)
			cancel()

			if err != nil {
				im.logger.Error("Failed to restart instance",
					zap.Error(err),
					zap.String("instance_id", req.InstanceID),
				)
			} else {
				im.logger.Info("Instance restarted successfully", zap.String("instance_id", req.InstanceID))
			}
		}
	}
}
