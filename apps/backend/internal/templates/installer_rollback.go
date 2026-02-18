package templates

import (
	"context"

	"backend/internal/orchestrator/supervisor"
)

// rollbackInstances deletes all created instances on installation failure.
func (ti *TemplateInstaller) rollbackInstances(ctx context.Context, instanceIDs []string) {
	ti.logger.Warn().
		Int("instance_count", len(instanceIDs)).
		Msg("rolling back template installation - deleting created instances")

	for _, instanceID := range instanceIDs {
		// Get instance to check status
		instance, exists := ti.instanceManager.Supervisor().Get(instanceID)
		if exists && instance != nil {
			// Stop instance if running
			if instance.State() == supervisor.ProcessStateRunning {
				if err := ti.instanceManager.StopInstance(ctx, instanceID); err != nil {
					ti.logger.Error().Err(err).Str("instance_id", instanceID).Msg("failed to stop instance during rollback")
				}
			}
		}

		// Delete instance
		if err := ti.instanceManager.DeleteInstance(ctx, instanceID); err != nil {
			ti.logger.Error().Err(err).Str("instance_id", instanceID).Msg("failed to delete instance during rollback")
		} else {
			ti.logger.Info().Str("instance_id", instanceID).Msg("instance deleted during rollback")
		}
	}
}
