package orchestrator

import (
	"context"
	"fmt"

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
	// Check for active dependents if not forcing and DependencyManager is configured
	if !force && im.config.DependencyMgr != nil {
		dependents, err := im.config.DependencyMgr.GetDependents(ctx, instanceID)
		if err != nil {
			return fmt.Errorf("failed to check dependents: %w", err)
		}

		runningDependents := []string{}
		for _, dep := range dependents {
			depInstance, err := im.config.Store.ServiceInstance.Get(ctx, dep.FromInstanceID)
			if err != nil {
				im.logger.Warn().Err(err).Str("dependent_id", dep.FromInstanceID).Msg("failed to get dependent instance")
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
			im.logger.Warn().Err(err).Str("instance_id", instanceID).Msg("failed to stop gateway")
		}
	}

	managedProc, exists := im.config.Supervisor.Get(instanceID)

	if !exists {
		im.updateInstanceStatus(ctx, instanceID, StatusStopped)
		im.emitStateChangeEvent(ctx, instanceID, string(StatusStopping), string(StatusStopped))
		return nil
	}

	// Stop resource monitoring before stopping the process (NAS-8.4)
	if im.resourceLimiter != nil && managedProc.GetPID() > 0 {
		pid := managedProc.GetPID()
		im.logger.Debug().
			Str("instance_id", instanceID).
			Int("pid", pid).
			Msg("Stopping resource monitoring")
		im.resourceLimiter.StopMonitoring(pid)
	}

	// Unregister from ResourcePoller (NAS-8.15)
	if im.resourcePoller != nil {
		im.resourcePoller.RemoveInstance(instanceID)
		im.logger.Debug().
			Str("instance_id", instanceID).
			Msg("Instance unregistered from resource poller")
	}

	if err := im.config.Supervisor.Stop(ctx, instanceID); err != nil {
		im.updateInstanceStatus(ctx, instanceID, StatusFailed)
		im.emitStateChangeEvent(ctx, instanceID, string(StatusStopping), string(StatusFailed))
		return fmt.Errorf("failed to stop process: %w", err)
	}

	if err := im.config.Supervisor.Remove(instanceID); err != nil {
		im.logger.Warn().Err(err).Str("instance_id", instanceID).Msg("failed to remove from supervisor")
	}

	if err := im.updateInstanceStatus(ctx, instanceID, StatusStopped); err != nil {
		return fmt.Errorf("failed to update status: %w", err)
	}

	im.emitStateChangeEvent(ctx, instanceID, string(StatusStopping), string(StatusStopped))
	im.logger.Info().Str("instance_id", instanceID).Msg("Instance stopped successfully")

	return nil
}

// RestartInstance restarts a service instance
func (im *InstanceManager) RestartInstance(ctx context.Context, instanceID string) error {
	im.logger.Info().Str("instance_id", instanceID).Msg("Restarting instance")

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

	// Stop process if running
	_, exists := im.config.Supervisor.Get(instanceID)
	if exists {
		_ = im.config.Supervisor.Stop(ctx, instanceID)
		_ = im.config.Supervisor.Remove(instanceID)
	}

	// Teardown virtual interface bridge (NAS-8.2)
	if im.bridgeOrch != nil {
		if err := im.bridgeOrch.TeardownBridge(ctx, instanceID); err != nil {
			im.logger.Warn().Err(err).Msg("Failed to teardown bridge")
		}
	}

	// Use transaction for atomic cleanup
	tx, err := im.config.Store.Tx(ctx)
	if err != nil {
		return fmt.Errorf("failed to start transaction: %w", err)
	}

	if err := func() error {
		// 1. Cleanup dependency edges
		if im.config.DependencyMgr != nil {
			fromCount, err := tx.ServiceDependency.Delete().
				Where(servicedependency.FromInstanceID(instanceID)).
				Exec(ctx)
			if err != nil {
				return fmt.Errorf("failed to delete from-dependencies: %w", err)
			}
			toCount, err := tx.ServiceDependency.Delete().
				Where(servicedependency.ToInstanceID(instanceID)).
				Exec(ctx)
			if err != nil {
				return fmt.Errorf("failed to delete to-dependencies: %w", err)
			}
			im.logger.Info().
				Str("instance_id", instanceID).
				Int("from_dependencies", fromCount).
				Int("to_dependencies", toCount).
				Msg("cleaned up dependencies in transaction")
		}

		// 2. Release allocated ports
		if im.config.PortRegistry != nil {
			allocs, err := im.config.PortRegistry.GetAllocationsByInstance(ctx, instanceID)
			if err != nil {
				im.logger.Warn().Err(err).Msg("failed to get port allocations for cleanup")
			} else {
				for _, alloc := range allocs {
					if err := tx.PortAllocation.DeleteOneID(alloc.ID).Exec(ctx); err != nil {
						im.logger.Warn().Err(err).Str("allocation_id", alloc.ID).Msg("failed to delete port allocation")
					}
				}
			}
		}

		// 3. Release allocated VLANs
		if im.config.VLANAllocator != nil {
			allocs, err := im.config.VLANAllocator.GetAllocationsByInstance(ctx, instanceID)
			if err != nil {
				im.logger.Warn().Err(err).Msg("failed to get VLAN allocations for cleanup")
			} else {
				for _, alloc := range allocs {
					if err := tx.VLANAllocation.DeleteOneID(alloc.ID).Exec(ctx); err != nil {
						im.logger.Warn().Err(err).Str("allocation_id", alloc.ID).Msg("failed to delete VLAN allocation")
					}
				}
			}
		}

		// 4. Delete instance record
		if err := tx.ServiceInstance.DeleteOneID(instanceID).Exec(ctx); err != nil {
			return fmt.Errorf("failed to delete instance record: %w", err)
		}

		return nil
	}(); err != nil {
		tx.Rollback()
		return err
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	im.logger.Info().Str("instance_id", instanceID).Msg("Instance deleted successfully")

	return nil
}
