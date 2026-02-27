package lifecycle

import (
	"context"
	"fmt"

	"go.uber.org/zap"

	"backend/generated/ent"
	"backend/generated/ent/servicedependency"
	"backend/generated/ent/serviceinstance"
)

// StopInstance stops a running service instance (checks for dependents)
func (im *InstanceManager) StopInstance(ctx context.Context, instanceID string) error {
	return im.StopInstanceWithForce(ctx, instanceID, false)
}

// StopInstanceWithForce stops a running service instance
// If force=false, returns DependentsActiveError if there are running dependents
// If force=true, stops the instance regardless of dependents
func (im *InstanceManager) StopInstanceWithForce(ctx context.Context, instanceID string, force bool) error {
	if err := im.checkDependentsBeforeStop(ctx, instanceID, force); err != nil {
		return err
	}

	instance, err := im.config.Store.ServiceInstance.Get(ctx, instanceID)
	if err != nil {
		return fmt.Errorf("instance not found: %w", err)
	}

	currentStatus := InstanceStatus(instance.Status)
	if !im.canTransition(currentStatus, StatusStopping) {
		return fmt.Errorf("cannot stop instance in %s state", currentStatus)
	}

	if err := im.updateInstanceStatus(ctx, instanceID, StatusStopping); err != nil {
		return fmt.Errorf("failed to update status: %w", err)
	}
	im.emitStateChangeEvent(ctx, instanceID, string(currentStatus), string(StatusStopping))

	// Stop gateway BEFORE service process
	if im.config.Gateway != nil {
		if err := im.config.Gateway.StopGateway(ctx, instanceID); err != nil {
			im.logger.Warn("failed to stop gateway", zap.Error(err), zap.String("instance_id", instanceID))
		}
	}

	managedProc, exists := im.config.Supervisor.Get(instanceID)
	if !exists || managedProc == nil {
		_ = im.updateInstanceStatus(ctx, instanceID, StatusStopped) //nolint:errcheck // best-effort status update during shutdown
		im.emitStateChangeEvent(ctx, instanceID, string(StatusStopping), string(StatusStopped))
		return nil
	}

	im.stopMonitoring(instanceID, managedProc)

	return im.stopAndCleanup(ctx, instanceID)
}

// checkDependentsBeforeStop checks for active dependents when force=false.
func (im *InstanceManager) checkDependentsBeforeStop(ctx context.Context, instanceID string, force bool) error {
	if force || im.config.DependencyMgr == nil {
		return nil
	}

	dependents, err := im.config.DependencyMgr.GetDependents(ctx, instanceID)
	if err != nil {
		return fmt.Errorf("failed to check dependents: %w", err)
	}

	var runningDependents []string
	for _, dep := range dependents {
		depInstance, err := im.config.Store.ServiceInstance.Get(ctx, dep.FromInstanceID)
		if err != nil {
			im.logger.Warn("failed to get dependent instance", zap.Error(err), zap.String("dependent_id", dep.FromInstanceID))
			continue
		}
		if depInstance.Status == serviceinstance.StatusRunning || depInstance.Status == serviceinstance.StatusStarting {
			runningDependents = append(runningDependents, dep.FromInstanceID)
		}
	}

	if len(runningDependents) > 0 {
		return &DependentsActiveError{
			InstanceID: instanceID,
			Dependents: runningDependents,
		}
	}
	return nil
}

// stopMonitoring stops resource monitoring and unregisters from the resource poller.
func (im *InstanceManager) stopMonitoring(instanceID string, managedProc interface{ GetPID() int }) {
	if im.resourceLimiter != nil && managedProc.GetPID() > 0 {
		pid := managedProc.GetPID()
		im.logger.Debug("Stopping resource monitoring",
			zap.String("instance_id", instanceID),
			zap.Int("pid", pid))
		im.resourceLimiter.StopMonitoring(pid)
	}

	if im.resourcePoller != nil {
		im.resourcePoller.RemoveInstance(instanceID)
		im.logger.Debug("Instance unregistered from resource poller",
			zap.String("instance_id", instanceID))
	}
}

// stopAndCleanup stops the supervisor process and updates status.
func (im *InstanceManager) stopAndCleanup(ctx context.Context, instanceID string) error {
	if err := im.config.Supervisor.Stop(ctx, instanceID); err != nil {
		_ = im.updateInstanceStatus(ctx, instanceID, StatusFailed) //nolint:errcheck // best-effort status update during shutdown
		im.emitStateChangeEvent(ctx, instanceID, string(StatusStopping), string(StatusFailed))
		return fmt.Errorf("failed to stop process: %w", err)
	}

	if err := im.config.Supervisor.Remove(instanceID); err != nil {
		im.logger.Warn("failed to remove from supervisor", zap.Error(err), zap.String("instance_id", instanceID))
	}

	if err := im.updateInstanceStatus(ctx, instanceID, StatusStopped); err != nil {
		return fmt.Errorf("failed to update status: %w", err)
	}

	im.emitStateChangeEvent(ctx, instanceID, string(StatusStopping), string(StatusStopped))
	im.logger.Info("Instance stopped successfully", zap.String("instance_id", instanceID))

	return nil
}

// RestartInstance restarts a service instance
func (im *InstanceManager) RestartInstance(ctx context.Context, instanceID string) error {
	im.logger.Info("Restarting instance", zap.String("instance_id", instanceID))

	if err := im.StopInstance(ctx, instanceID); err != nil {
		return fmt.Errorf("failed to stop instance: %w", err)
	}

	if err := im.StartInstance(ctx, instanceID); err != nil {
		return fmt.Errorf("failed to start instance: %w", err)
	}

	return nil
}

// DeleteInstance deletes a service instance and cleans up resources
func (im *InstanceManager) DeleteInstance(ctx context.Context, instanceID string) error {
	instance, err := im.config.Store.ServiceInstance.Get(ctx, instanceID)
	if err != nil {
		return fmt.Errorf("instance not found: %w", err)
	}

	currentStatus := InstanceStatus(instance.Status)
	if !im.canTransition(currentStatus, StatusDeleting) {
		return fmt.Errorf("cannot delete instance in %s state (must be stopped or installed first)", currentStatus)
	}

	if err := im.updateInstanceStatus(ctx, instanceID, StatusDeleting); err != nil {
		return fmt.Errorf("failed to update status: %w", err)
	}
	im.emitStateChangeEvent(ctx, instanceID, string(currentStatus), string(StatusDeleting))

	im.forceStopProcess(ctx, instanceID)
	im.teardownBridge(ctx, instanceID)

	if err := im.deleteInstanceInTx(ctx, instanceID); err != nil {
		return err
	}

	im.logger.Info("Instance deleted successfully", zap.String("instance_id", instanceID))
	return nil
}

// forceStopProcess stops the supervisor process if running.
func (im *InstanceManager) forceStopProcess(ctx context.Context, instanceID string) {
	_, exists := im.config.Supervisor.Get(instanceID)
	if exists {
		_ = im.config.Supervisor.Stop(ctx, instanceID) //nolint:errcheck // best-effort cleanup
		_ = im.config.Supervisor.Remove(instanceID)    //nolint:errcheck // best-effort cleanup
	}
}

// teardownBridge tears down the virtual interface bridge.
func (im *InstanceManager) teardownBridge(ctx context.Context, instanceID string) {
	if im.bridgeOrch != nil {
		if err := im.bridgeOrch.TeardownBridge(ctx, instanceID); err != nil {
			im.logger.Warn("Failed to teardown bridge", zap.Error(err))
		}
	}
}

// deleteInstanceInTx performs transactional cleanup of all instance resources.
func (im *InstanceManager) deleteInstanceInTx(ctx context.Context, instanceID string) error {
	tx, err := im.config.Store.Tx(ctx)
	if err != nil {
		return fmt.Errorf("failed to start transaction: %w", err)
	}

	if err := func() error {
		im.cleanupDependencies(ctx, tx, instanceID)
		im.cleanupPortAllocations(ctx, tx, instanceID)
		im.cleanupVLANAllocations(ctx, tx, instanceID)

		if err := tx.ServiceInstance.DeleteOneID(instanceID).Exec(ctx); err != nil {
			return fmt.Errorf("failed to delete instance record: %w", err)
		}
		return nil
	}(); err != nil {
		_ = tx.Rollback() //nolint:errcheck // HTTP response already committed
		return err
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}
	return nil
}

// cleanupDependencies removes dependency edges in a transaction.
func (im *InstanceManager) cleanupDependencies(ctx context.Context, tx *ent.Tx, instanceID string) {
	if im.config.DependencyMgr == nil {
		return
	}
	fromCount, err := tx.ServiceDependency.Delete().
		Where(servicedependency.FromInstanceID(instanceID)).
		Exec(ctx)
	if err != nil {
		im.logger.Warn("failed to delete from-dependencies", zap.Error(err))
		return
	}
	toCount, err := tx.ServiceDependency.Delete().
		Where(servicedependency.ToInstanceID(instanceID)).
		Exec(ctx)
	if err != nil {
		im.logger.Warn("failed to delete to-dependencies", zap.Error(err))
		return
	}
	im.logger.Info("cleaned up dependencies in transaction",
		zap.String("instance_id", instanceID),
		zap.Int("from_dependencies", fromCount),
		zap.Int("to_dependencies", toCount))
}

// cleanupPortAllocations releases allocated ports in a transaction.
func (im *InstanceManager) cleanupPortAllocations(ctx context.Context, tx *ent.Tx, instanceID string) {
	if im.config.PortRegistry == nil {
		return
	}
	allocs, err := im.config.PortRegistry.GetAllocationsByInstance(ctx, instanceID)
	if err != nil {
		im.logger.Warn("failed to get port allocations for cleanup", zap.Error(err))
		return
	}
	for _, alloc := range allocs {
		if err := tx.PortAllocation.DeleteOneID(alloc.GetID()).Exec(ctx); err != nil {
			im.logger.Warn("failed to delete port allocation", zap.Error(err), zap.String("allocation_id", alloc.GetID()))
		}
	}
}

// cleanupVLANAllocations releases allocated VLANs in a transaction.
func (im *InstanceManager) cleanupVLANAllocations(ctx context.Context, tx *ent.Tx, instanceID string) {
	if im.config.VLANAllocator == nil {
		return
	}
	allocs, err := im.config.VLANAllocator.GetAllocationsByInstance(ctx, instanceID)
	if err != nil {
		im.logger.Warn("failed to get VLAN allocations for cleanup", zap.Error(err))
		return
	}
	for _, alloc := range allocs {
		if err := tx.VLANAllocation.DeleteOneID(alloc.GetID()).Exec(ctx); err != nil {
			im.logger.Warn("failed to delete VLAN allocation", zap.Error(err), zap.String("allocation_id", alloc.GetID()))
		}
	}
}
