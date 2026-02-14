package orchestrator

import (
	"context"
	"fmt"

	"backend/generated/ent"
	"backend/generated/ent/serviceinstance"
	"backend/internal/events"
	"backend/internal/features"
)

// canTransition checks if a state transition is allowed
func (im *InstanceManager) canTransition(from InstanceStatus, to InstanceStatus) bool {
	validTargets, exists := ValidTransitions[from]
	if !exists {
		return false
	}

	for _, valid := range validTargets {
		if valid == to {
			return true
		}
	}
	return false
}

// updateInstanceStatus updates an instance's status in the database
func (im *InstanceManager) updateInstanceStatus(ctx context.Context, instanceID string, status InstanceStatus) error {
	_, err := im.config.Store.ServiceInstance.UpdateOneID(instanceID).
		SetStatus(serviceinstance.Status(status)).
		Save(ctx)
	return err
}

// emitStateChangeEvent publishes a state change event for an instance
func (im *InstanceManager) emitStateChangeEvent(ctx context.Context, instanceID string, fromStatus string, toStatus string) {
	if im.config.EventBus == nil {
		return
	}

	instance, err := im.config.Store.ServiceInstance.
		Query().
		Where(serviceinstance.ID(instanceID)).
		Only(ctx)

	if err != nil {
		im.logger.Warn().
			Err(err).
			Str("instance_id", instanceID).
			Msg("failed to fetch instance for state change event, publishing with partial context")

		event := events.NewServiceStateChangedEvent(
			instanceID,
			"unknown",
			"unknown",
			fromStatus,
			toStatus,
			"",
			err.Error(),
			"instance-manager",
		)

		if err := im.config.EventBus.Publish(ctx, event); err != nil {
			im.logger.Error().
				Err(err).
				Str("instance_id", instanceID).
				Msg("failed to publish state change event")
		}
		return
	}

	reason := ""
	errorMessage := ""

	if toStatus == string(StatusFailed) && instance.UnavailableReason != "" {
		errorMessage = instance.UnavailableReason
	}

	event := events.NewServiceStateChangedEvent(
		instanceID,
		instance.FeatureID,
		instance.InstanceName,
		fromStatus,
		toStatus,
		reason,
		errorMessage,
		"instance-manager",
	)

	if err := im.config.EventBus.Publish(ctx, event); err != nil {
		im.logger.Error().
			Err(err).
			Str("instance_id", instanceID).
			Str("from_status", fromStatus).
			Str("to_status", toStatus).
			Msg("failed to publish state change event")
	}
}

// buildProcessArgs constructs process arguments from manifest and instance config
func (im *InstanceManager) buildProcessArgs(manifest *features.Manifest, instance *ent.ServiceInstance) []string {
	return []string{}
}

// buildProcessEnv constructs environment variables from manifest and instance config
func (im *InstanceManager) buildProcessEnv(manifest *features.Manifest, instance *ent.ServiceInstance) []string {
	env := []string{}
	for key, value := range manifest.EnvironmentVars {
		env = append(env, fmt.Sprintf("%s=%s", key, value))
	}

	// Inject GOMEMLIMIT for Go services (NAS-8.15)
	if manifest.RecommendedRAM > 0 {
		isGoService := im.isGoService(manifest)
		if isGoService {
			goMemLimit := int64(float64(manifest.RecommendedRAM) * 0.9)
			env = append(env, fmt.Sprintf("GOMEMLIMIT=%d", goMemLimit))

			im.logger.Debug().
				Str("instance_id", instance.ID).
				Str("feature_id", manifest.ID).
				Int64("recommended_ram_bytes", manifest.RecommendedRAM).
				Int64("gomemlimit_bytes", goMemLimit).
				Msg("injected GOMEMLIMIT for Go service")
		}
	}

	return env
}

// isGoService determines if a service is written in Go based on manifest metadata
func (im *InstanceManager) isGoService(manifest *features.Manifest) bool {
	goServices := map[string]bool{
		"xray":      true,
		"xray-core": true,
		"sing-box":  true,
		"singbox":   true,
		"frpc":      true,
		"frps":      true,
	}

	if goServices[manifest.ID] {
		return true
	}

	for _, tag := range manifest.Tags {
		if tag == "golang" || tag == "go" {
			return true
		}
	}

	return false
}
