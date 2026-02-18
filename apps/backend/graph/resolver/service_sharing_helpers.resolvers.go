package resolver

// This file contains helper/conversion functions for service sharing resolvers.
// Query, mutation, and subscription resolvers are in service_sharing.resolvers.go.

import (
	"backend/generated/ent"
	"backend/graph/model"

	"backend/internal/features/sharing"
)

//nolint:unused // may be used in service_sharing.resolvers.go
func convertConflictResolution(resolution *model.ConflictResolution) sharing.ConflictResolutionStrategy {
	if resolution == nil {
		return ""
	}
	switch *resolution {
	case model.ConflictResolutionSkip:
		return sharing.ConflictSkip
	case model.ConflictResolutionOverwrite:
		return sharing.ConflictOverwrite
	case model.ConflictResolutionRename:
		return sharing.ConflictRename
	default:
		return ""
	}
}

//nolint:unused // may be used in service_sharing.resolvers.go
func convertConflictResolutionRequired(resolution model.ConflictResolution) sharing.ConflictResolutionStrategy {
	switch resolution {
	case model.ConflictResolutionSkip:
		return sharing.ConflictSkip
	case model.ConflictResolutionOverwrite:
		return sharing.ConflictOverwrite
	case model.ConflictResolutionRename:
		return sharing.ConflictRename
	default:
		return sharing.ConflictSkip
	}
}

//nolint:unused // may be used in service_sharing.resolvers.go
func convertRedactedFieldValues(values map[string]interface{}) map[string]interface{} {
	if values == nil {
		return make(map[string]interface{})
	}
	return values
}

//nolint:unused // may be used in service_sharing.resolvers.go
func convertRedactedFieldValuesRequired(values map[string]interface{}) map[string]interface{} {
	if values == nil {
		return make(map[string]interface{})
	}
	return values
}

//nolint:unused // may be used in service_sharing.resolvers.go
func convertEntInstanceToModel(instance *ent.ServiceInstance) *model.ServiceInstance {
	if instance == nil {
		return nil
	}
	return &model.ServiceInstance{
		ID:             instance.ID,
		FeatureID:      instance.FeatureID,
		InstanceName:   instance.InstanceName,
		RouterID:       instance.RouterID,
		Status:         model.ServiceInstanceStatus(instance.Status),
		VlanID:         instance.VlanID,
		BindIP:         &instance.BindIP,
		Ports:          instance.Ports,
		Config:         instance.Config,
		BinaryPath:     &instance.BinaryPath,
		BinaryVersion:  &instance.BinaryVersion,
		BinaryChecksum: &instance.BinaryChecksum,
		CreatedAt:      instance.CreatedAt,
		UpdatedAt:      instance.UpdatedAt,
	}
}
