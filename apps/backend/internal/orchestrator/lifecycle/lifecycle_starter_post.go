package lifecycle

import (
	"context"
	"fmt"
	"time"

	"go.uber.org/zap"

	"backend/generated/ent"
	"backend/internal/features"
)

// applyResourceLimits applies cgroup memory limits and starts monitoring after process start
func (im *InstanceManager) applyResourceLimits(ctx context.Context, instanceID string, instance *ent.ServiceInstance) {
	if im.resourceLimiter == nil || instance.MemoryLimit == nil || *instance.MemoryLimit <= 0 {
		return
	}

	managedProc, exists := im.config.Supervisor.Get(instanceID)
	if !exists || managedProc.GetPID() <= 0 {
		im.logger.Warn("Process not found or PID not available for resource limits",
			zap.String("instance_id", instanceID))
		return
	}

	pid := managedProc.GetPID()
	limitMB := int(*instance.MemoryLimit / (1024 * 1024))

	im.logger.Debug("Applying memory limit",
		zap.String("instance_id", instanceID),
		zap.Int("pid", pid),
		zap.Int("memory_limit_mb", limitMB))

	if err := im.resourceLimiter.ApplyMemoryLimit(ctx, pid, limitMB, instanceID, instance.FeatureID); err != nil {
		im.logger.Warn("Failed to apply memory limit (process will continue without limits)",
			zap.Error(err),
			zap.String("instance_id", instanceID))
	}

	if err := im.resourceLimiter.StartMonitoring(ctx, pid, instanceID, instance.FeatureID, limitMB); err != nil {
		im.logger.Warn("Failed to start resource monitoring",
			zap.Error(err),
			zap.String("instance_id", instanceID))
	}

	// Register with ResourcePoller (NAS-8.15)
	if im.resourcePoller != nil {
		if err := im.resourcePoller.AddInstance(instanceID, instance.FeatureID, instance.InstanceName, pid, limitMB); err != nil {
			im.logger.Warn("Failed to add instance to resource poller",
				zap.Error(err),
				zap.String("instance_id", instanceID))
		} else {
			im.logger.Debug("Instance registered with resource poller",
				zap.String("instance_id", instanceID),
				zap.Int("pid", pid))
		}
	}
}

// setupBridgeIfNeeded sets up virtual interface bridge after process starts (NAS-8.2)
func (im *InstanceManager) setupBridgeIfNeeded(ctx context.Context, instanceID string, instance *ent.ServiceInstance, manifest *features.Manifest) error {
	if im.bridgeOrch == nil {
		return nil
	}

	vif, err := im.bridgeOrch.SetupBridge(ctx, instance, manifest)
	if err != nil {
		im.logger.Error("failed to setup bridge", zap.Error(err), zap.String("instance_id", instanceID))
		_ = im.config.Supervisor.Stop(ctx, instanceID)             //nolint:errcheck // best-effort cleanup after bridge setup failure
		_ = im.config.Supervisor.Remove(instanceID)                //nolint:errcheck // best-effort cleanup after bridge setup failure
		_ = im.updateInstanceStatus(ctx, instanceID, StatusFailed) //nolint:errcheck // best-effort status update after bridge setup failure
		im.emitStateChangeEvent(ctx, instanceID, string(StatusRunning), string(StatusFailed))
		return fmt.Errorf("failed to setup bridge: %w", err)
	}
	if vif != nil {
		im.logger.Info("Virtual interface bridge created",
			zap.String("interface", vif.InterfaceName),
			zap.String("instance_id", instanceID))
	}
	return nil
}

// startGatewayIfNeeded starts the gateway if configured and needed by the service
func (im *InstanceManager) startGatewayIfNeeded(ctx context.Context, instanceID string, instance *ent.ServiceInstance, manifest *features.Manifest) {
	if im.config.Gateway == nil {
		return
	}

	mode := ""
	if m, ok := instance.Config["mode"].(string); ok {
		mode = m
	}

	if !im.config.Gateway.NeedsGateway(manifest, mode) {
		return
	}

	if err := im.waitForSOCKSReady(ctx, instance, 10*time.Second); err != nil {
		im.logger.Error("SOCKS port not ready", zap.Error(err), zap.String("instance_id", instanceID))
		return
	}

	if err := im.config.Gateway.StartGateway(ctx, instance, manifest); err != nil {
		im.logger.Error("failed to start gateway", zap.Error(err), zap.String("instance_id", instanceID))
	}
}
