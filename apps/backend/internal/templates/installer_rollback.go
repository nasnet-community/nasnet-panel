package templates

import (
	"context"
	"fmt"

	"go.uber.org/zap"

	"backend/internal/orchestrator/supervisor"
)

// rollbackInstances deletes all created instances on installation failure.
// Returns an error if any rollback operations fail, along with partial success information.
func (ti *TemplateInstaller) rollbackInstances(ctx context.Context, instanceIDs []string) error {
	if len(instanceIDs) == 0 {
		return nil
	}

	ti.logger.Warn("rolling back template installation - deleting created instances",
		zap.Int("instance_count", len(instanceIDs)))

	var rollbackErrors []error
	successCount := 0

	for _, instanceID := range instanceIDs {
		// Check context cancellation during rollback
		if ctx.Err() != nil {
			rollbackErrors = append(rollbackErrors, fmt.Errorf("rollback canceled for instance %s: %w", instanceID, ctx.Err()))
			continue
		}

		// Stop instance if running (supervisor may be nil in test/mock scenarios)
		sup := ti.instanceManager.Supervisor()
		if sup != nil {
			instance, exists := sup.Get(instanceID)
			if exists && instance != nil && instance.State() == supervisor.ProcessStateRunning {
				if err := ti.instanceManager.StopInstance(ctx, instanceID); err != nil {
					ti.logger.Error("failed to stop instance during rollback", zap.Error(err), zap.String("instance_id", instanceID))
					rollbackErrors = append(rollbackErrors, fmt.Errorf("failed to stop instance %s: %w", instanceID, err))
					continue
				}
			}
		}

		// Delete instance
		if err := ti.instanceManager.DeleteInstance(ctx, instanceID); err != nil {
			ti.logger.Error("failed to delete instance during rollback", zap.Error(err), zap.String("instance_id", instanceID))
			rollbackErrors = append(rollbackErrors, fmt.Errorf("failed to delete instance %s: %w", instanceID, err))
		} else {
			ti.logger.Info("instance deleted during rollback", zap.String("instance_id", instanceID))
			successCount++
		}
	}

	if len(rollbackErrors) > 0 {
		ti.logger.Warn("rollback completed with errors",
			zap.Int("rollback_successes", successCount),
			zap.Int("rollback_failures", len(rollbackErrors)))

		return fmt.Errorf("rollback completed with %d errors: %v", len(rollbackErrors), rollbackErrors)
	}

	ti.logger.Info("rollback completed successfully",
		zap.Int("rollback_successes", successCount))

	return nil
}
