package sharing

import (
	"context"
	"fmt"
	"strings"

	"backend/generated/ent"
)

// ImportValidationResult contains the validation results for an import
type ImportValidationResult struct {
	Valid                bool                   `json:"valid"`
	Errors               []ValidationError      `json:"errors"`
	Warnings             []ValidationWarning    `json:"warnings"`
	RedactedFields       []string               `json:"redactedFields,omitempty"`
	ConflictingInstances []*ent.ServiceInstance `json:"conflictingInstances,omitempty"`
	RequiresUserInput    bool                   `json:"requiresUserInput"`
}

// ValidationError represents a blocking validation error
type ValidationError struct {
	Stage   string `json:"stage"` // schema, syntax, cross-resource, dependency, conflict, capability, dry-run
	Field   string `json:"field,omitempty"`
	Code    string `json:"code"` // V400, V403, S602, etc.
	Message string `json:"message"`
}

// ValidationWarning represents a non-blocking warning
type ValidationWarning struct {
	Stage   string `json:"stage"`
	Message string `json:"message"`
}

// ConflictResolutionStrategy defines how to handle conflicts
type ConflictResolutionStrategy string

const (
	ConflictSkip      ConflictResolutionStrategy = "SKIP"
	ConflictOverwrite ConflictResolutionStrategy = "OVERWRITE"
	ConflictRename    ConflictResolutionStrategy = "RENAME"
)

// ImportOptions configures import behavior
type ImportOptions struct {
	UserID              string
	ConflictResolution  ConflictResolutionStrategy
	RedactedFieldValues map[string]interface{} // User-provided values for redacted fields
	DeviceFilter        []string               // MAC addresses to filter routing rules
	DryRun              bool
}

// Import validates an import package without applying it
func (s *Service) Import(ctx context.Context, pkg *ServiceExportPackage, options ImportOptions) (*ImportValidationResult, error) {
	result := &ImportValidationResult{
		Valid:    true,
		Errors:   []ValidationError{},
		Warnings: []ValidationWarning{},
	}

	// Stage 1: Schema version validation
	if err := s.validateSchemaVersion(pkg.SchemaVersion, result); err != nil {
		return result, err
	}

	// Stage 2: Syntax validation
	s.validateSyntax(pkg, result)

	// Stage 3: Cross-resource validation
	s.validateCrossResource(ctx, pkg, result)

	// Stage 4: Dependency validation
	if err := s.validateDependencies(ctx, pkg, result); err != nil {
		return result, err
	}

	// Stage 5: Conflict detection
	if err := s.detectConflicts(ctx, pkg, options, result); err != nil {
		return result, err
	}

	// Stage 6: Capability validation
	s.validateCapabilities(pkg, result)

	// Stage 7: Dry-run validation
	if options.DryRun {
		if err := s.performDryRun(ctx, pkg, options, result); err != nil {
			return result, err
		}
	}

	// Check for redacted fields
	if pkg.IncludesSecrets {
		result.RedactedFields = s.findRedactedFields(pkg.Config)
		if len(result.RedactedFields) > 0 {
			result.RequiresUserInput = true
			result.Valid = false
			result.Errors = append(result.Errors, ValidationError{
				Stage:   "syntax",
				Code:    "V400",
				Message: fmt.Sprintf("Redacted fields require user input: %s", strings.Join(result.RedactedFields, ", ")),
			})
		}
	}

	// Mark as invalid if errors exist
	if len(result.Errors) > 0 {
		result.Valid = false
	}

	return result, nil
}
