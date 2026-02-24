package resolver

// This file contains helper/conversion functions for service sharing resolvers.
// Query, mutation, and subscription resolvers are in service_sharing.resolvers.go.

import (
	"backend/generated/ent"
	"backend/graph/model"

	"backend/internal/features/sharing"
)

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

func convertRedactedFieldValues(values map[string]interface{}) map[string]interface{} {
	if values == nil {
		return make(map[string]interface{})
	}
	return values
}

// convertRedactedFieldValuesRequired converts redacted field values, treating nil as empty map.
// Unlike convertRedactedFieldValues, this variant is explicitly used for required fields
// where nil should be treated the same as an empty map.
func convertRedactedFieldValuesRequired(values map[string]interface{}) map[string]interface{} {
	if values == nil {
		return make(map[string]interface{})
	}
	return values
}

func convertEntInstanceToModel(instance *ent.ServiceInstance) *model.ServiceInstance {
	if instance == nil {
		return nil
	}

	var bindIP *string
	if instance.BindIP != "" {
		bindIP = &instance.BindIP
	}
	var binaryPath *string
	if instance.BinaryPath != "" {
		binaryPath = &instance.BinaryPath
	}
	var binaryVersion *string
	if instance.BinaryVersion != "" {
		binaryVersion = &instance.BinaryVersion
	}
	var binaryChecksum *string
	if instance.BinaryChecksum != "" {
		binaryChecksum = &instance.BinaryChecksum
	}

	return &model.ServiceInstance{
		ID:             instance.ID,
		FeatureID:      instance.FeatureID,
		InstanceName:   instance.InstanceName,
		RouterID:       instance.RouterID,
		Status:         model.ServiceInstanceStatus(instance.Status),
		VlanID:         instance.VlanID,
		BindIP:         bindIP,
		Ports:          instance.Ports,
		Config:         instance.Config,
		BinaryPath:     binaryPath,
		BinaryVersion:  binaryVersion,
		BinaryChecksum: binaryChecksum,
		CreatedAt:      instance.CreatedAt,
		UpdatedAt:      instance.UpdatedAt,
	}
}
