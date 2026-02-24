// Package stages provides the 7 validation stage implementations.
package stages

import (
	"context"
	"fmt"

	"backend/internal/validation"
)

// SchemaStage validates that all required fields are present and
// field types match their expected types (Stage 1).
type SchemaStage struct{}

func (s *SchemaStage) Number() int  { return 1 }
func (s *SchemaStage) Name() string { return "schema" }

// Validate checks schema correctness of the input.
func (s *SchemaStage) Validate(_ context.Context, input *validation.StageInput) *validation.Result {
	result := validation.NewResult()

	if input == nil {
		result.AddError(&validation.Error{
			Stage:     1,
			StageName: "schema",
			Severity:  validation.SeverityError,
			Field:     "",
			Message:   "validation input is nil",
			Code:      "NIL_INPUT",
		})
		return result
	}

	if input.ResourceType == "" {
		result.AddError(&validation.Error{
			Stage:     1,
			StageName: "schema",
			Severity:  validation.SeverityError,
			Field:     "resourceType",
			Message:   "resource type is required",
			Code:      "MISSING_RESOURCE_TYPE",
		})
		return result
	}

	if input.Operation == "" {
		result.AddError(&validation.Error{
			Stage:     1,
			StageName: "schema",
			Severity:  validation.SeverityError,
			Field:     "operation",
			Message:   "operation is required",
			Code:      "MISSING_OPERATION",
		})
		return result
	}

	// Validate operation
	validOps := map[string]bool{"create": true, "update": true, "delete": true}
	if !validOps[input.Operation] {
		result.AddError(&validation.Error{
			Stage:      1,
			StageName:  "schema",
			Severity:   validation.SeverityError,
			Field:      "operation",
			Message:    fmt.Sprintf("invalid operation: %s", input.Operation),
			Code:       "INVALID_OPERATION",
			Suggestion: "Use 'create', 'update', or 'delete'",
		})
	}

	// For update/delete, resource ID is required
	if (input.Operation == operationUpdate || input.Operation == operationDelete) && input.ResourceID == "" {
		result.AddError(&validation.Error{
			Stage:     1,
			StageName: "schema",
			Severity:  validation.SeverityError,
			Field:     "resourceId",
			Message:   "resource ID is required for " + input.Operation,
			Code:      "MISSING_RESOURCE_ID",
		})
	}

	// Check required fields per resource type
	s.validateRequiredFields(input, result)

	return result
}

// validateRequiredFields checks that required fields are present based on resource type.
func (s *SchemaStage) validateRequiredFields(input *validation.StageInput, result *validation.Result) {
	if input.Operation == operationDelete {
		return // No field validation needed for delete
	}

	required := resourceRequiredFields[input.ResourceType]
	if input.Operation == "update" {
		return // Updates don't require all fields
	}

	for _, field := range required {
		if _, ok := input.Fields[field]; !ok {
			result.AddError(&validation.Error{
				Stage:     1,
				StageName: "schema",
				Severity:  validation.SeverityError,
				Field:     field,
				Message:   fmt.Sprintf("required field '%s' is missing", field),
				Code:      "MISSING_REQUIRED_FIELD",
			})
		}
	}
}

// resourceRequiredFields maps resource types to their required fields for create.
var resourceRequiredFields = map[string][]string{
	"bridge":        {"name"},
	"bridge-port":   {"bridge", "interface"},
	"bridge-vlan":   {"bridge", "vlan-ids"},
	"vlan":          {"name", "vlan-id", "interface"},
	"route":         {"dst-address"},
	"ip-address":    {"address", "interface"},
	"firewall-rule": {"chain", "action"},
	"nat-rule":      {"chain", "action"},
	"dhcp-client":   {"interface"},
	"pppoe-client":  {"interface", "user", "password"},
	"static-dns":    {"name", "address"},
}
