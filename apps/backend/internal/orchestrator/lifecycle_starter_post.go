package orchestrator

import (
	"context"
	"fmt"
	"time"

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
		im.logger.Warn().
			Str("instance_id", instanceID).
			Msg("Process not found or PID not available for resource limits")
		return
	}

	pid := managedProc.GetPID()
	limitMB := int(*instance.MemoryLimit / (1024 * 1024))

	im.logger.Debug().
		Str("instance_id", instanceID).
		Int("pid", pid).
		Int("memory_limit_mb", limitMB).
		Msg("Applying memory limit")

	if err := im.resourceLimiter.ApplyMemoryLimit(ctx, pid, limitMB, instanceID, instance.FeatureID); err != nil {
		im.logger.Warn().
			Err(err).
			Str("instance_id", instanceID).
			Msg("Failed to apply memory limit (process will continue without limits)")
	}

	if err := im.resourceLimiter.StartMonitoring(ctx, pid, instanceID, instance.FeatureID, limitMB); err != nil {
		im.logger.Warn().
			Err(err).
			Str("instance_id", instanceID).
			Msg("Failed to start resource monitoring")
	}

	// Register with ResourcePoller (NAS-8.15)
	if im.resourcePoller != nil {
		if err := im.resourcePoller.AddInstance(instanceID, instance.FeatureID, instance.InstanceName, pid, limitMB); err != nil {
			im.logger.Warn().
				Err(err).
				Str("instance_id", instanceID).
				Msg("Failed to add instance to resource poller")
		} else {
			im.logger.Debug().
				Str("instance_id", instanceID).
				Int("pid", pid).
				Msg("Instance registered with resource poller")
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
		im.logger.Error().Err(err).Str("instance_id", instanceID).Msg("failed to setup bridge")
		_ = im.config.Supervisor.Stop(ctx, instanceID)
		_ = im.config.Supervisor.Remove(instanceID)
		im.updateInstanceStatus(ctx, instanceID, StatusFailed)
		im.emitStateChangeEvent(ctx, instanceID, string(StatusRunning), string(StatusFailed))
		return fmt.Errorf("failed to setup bridge: %w", err)
	}
	if vif != nil {
		im.logger.Info().
			Str("interface", vif.InterfaceName).
			Str("instance_id", instanceID).
			Msg("Virtual interface bridge created")
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
		im.logger.Error().Err(err).Str("instance_id", instanceID).Msg("SOCKS port not ready")
		return
	}

	if err := im.config.Gateway.StartGateway(ctx, instance, manifest); err != nil {
		im.logger.Error().Err(err).Str("instance_id", instanceID).Msg("failed to start gateway")
	}
}
