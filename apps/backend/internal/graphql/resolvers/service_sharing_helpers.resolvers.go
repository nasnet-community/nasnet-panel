package resolver

// This file contains helper/conversion functions for service sharing resolvers.
// Query, mutation, and subscription resolvers are in service_sharing.resolvers.go.

import (
	"backend/generated/ent"
	"backend/generated/graphql"
	
	"backend/internal/features/sharing"
)

func convertExportPackageToModel(pkg *sharing.ServiceExportPackage) *model.ServiceExportPackage {
	// Convert routing rules
	var routingRules []*model.RoutingRule
	for _, rule := range pkg.RoutingRules {
		routingRules = append(routingRules, &model.RoutingRule{
			Chain:          rule.Chain,
			Action:         rule.Action,
			SrcAddress:     &rule.SrcAddress,
			DstAddress:     &rule.DstAddress,
			Protocol:       &rule.Protocol,
			Comment:        &rule.Comment,
			RoutingMark:    &rule.RoutingMark,
			NewRoutingMark: &rule.NewRoutingMark,
		})
	}

	return &model.ServiceExportPackage{
		SchemaVersion:    pkg.SchemaVersion,
		ExportedAt:       pkg.ExportedAt,
		ServiceType:      pkg.ServiceType,
		ServiceName:      pkg.ServiceName,
		BinaryVersion:    pkg.BinaryVersion,
		Config:           pkg.Config,
		RoutingRules:     routingRules,
		IncludesSecrets:  pkg.IncludesSecrets,
		ExportedByUserID: &pkg.ExportedByUserID,
	}
}

func convertValidationResultToModel(result *sharing.ImportValidationResult) *model.ImportValidationResult {
	// Convert errors
	var errors []*model.ImportValidationError
	for _, err := range result.Errors {
		errors = append(errors, &model.ImportValidationError{
			Stage:   err.Stage,
			Field:   &err.Field,
			Code:    err.Code,
			Message: err.Message,
		})
	}

	// Convert warnings
	var warnings []*model.ImportValidationWarning
	for _, warn := range result.Warnings {
		warnings = append(warnings, &model.ImportValidationWarning{
			Stage:   warn.Stage,
			Message: warn.Message,
		})
	}

	// Convert conflicting instances
	var conflicts []*model.ServiceInstance
	for _, instance := range result.ConflictingInstances {
		conflicts = append(conflicts, convertEntInstanceToModel(instance))
	}

	return &model.ImportValidationResult{
		Valid:                result.Valid,
		Errors:               errors,
		Warnings:             warnings,
		RedactedFields:       result.RedactedFields,
		ConflictingInstances: conflicts,
		RequiresUserInput:    result.RequiresUserInput,
	}
}

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
