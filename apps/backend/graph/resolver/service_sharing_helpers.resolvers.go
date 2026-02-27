package resolver

// This file contains helper/conversion functions for service sharing resolvers.
// Query, mutation, and subscription resolvers are in service_sharing.resolvers.go.

import (
	"backend/generated/ent"
	"backend/graph/model"
	"backend/internal/features/sharing"
	"encoding/json"
	"fmt"
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

// convertSharingExportToModel converts a ServiceExportPackage to a GraphQL ServiceExportPackage.
func convertSharingExportToModel(pkg *sharing.ServiceExportPackage) *model.ServiceExportPackage {
	if pkg == nil {
		return nil
	}

	var routingRules []*model.RoutingRule
	for _, rule := range pkg.RoutingRules {
		srcAddr := rule.SrcAddress
		dstAddr := rule.DstAddress
		proto := rule.Protocol
		comment := rule.Comment
		routingMark := rule.RoutingMark
		newRoutingMark := rule.NewRoutingMark

		routingRules = append(routingRules, &model.RoutingRule{
			Chain:          rule.Chain,
			Action:         rule.Action,
			SrcAddress:     &srcAddr,
			DstAddress:     &dstAddr,
			Protocol:       &proto,
			Comment:        &comment,
			RoutingMark:    &routingMark,
			NewRoutingMark: &newRoutingMark,
		})
	}

	var exportedByUserID *string
	if pkg.ExportedByUserID != "" {
		exportedByUserID = &pkg.ExportedByUserID
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
		ExportedByUserID: exportedByUserID,
	}
}

// mapToExportPackage converts a raw map[string]any to a sharing.ServiceExportPackage.
func mapToExportPackage(input map[string]any) (*sharing.ServiceExportPackage, error) {
	if input == nil {
		return nil, fmt.Errorf("export package data is required")
	}

	// Marshal and unmarshal to convert the map to a structured type
	data, err := json.Marshal(input)
	if err != nil {
		return nil, err
	}

	var pkg sharing.ServiceExportPackage
	if err := json.Unmarshal(data, &pkg); err != nil {
		return nil, err
	}

	return &pkg, nil
}

// convertValidationResultToModel converts an ImportValidationResult to a GraphQL ImportValidationResult.
func convertValidationResultToModel(result *sharing.ImportValidationResult) *model.ImportValidationResult {
	if result == nil {
		return &model.ImportValidationResult{
			Valid:    true,
			Errors:   []*model.ImportValidationError{},
			Warnings: []*model.ImportValidationWarning{},
		}
	}

	var errors []*model.ImportValidationError
	for _, err := range result.Errors {
		field := err.Field
		errors = append(errors, &model.ImportValidationError{
			Stage:   err.Stage,
			Field:   &field,
			Code:    err.Code,
			Message: err.Message,
		})
	}

	var warnings []*model.ImportValidationWarning
	for _, warn := range result.Warnings {
		warnings = append(warnings, &model.ImportValidationWarning{
			Stage:   warn.Stage,
			Message: warn.Message,
		})
	}

	return &model.ImportValidationResult{
		Valid:                result.Valid,
		Errors:               errors,
		Warnings:             warnings,
		RequiresUserInput:    result.RequiresUserInput,
		RedactedFields:       result.RedactedFields,
		ConflictingInstances: nil, // TODO: convert ConflictingInstances if needed
	}
}
