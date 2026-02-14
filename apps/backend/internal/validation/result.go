// Package validation provides a 7-stage validation pipeline for router
// configuration changes. Each stage progressively validates from schema
// correctness to dry-run simulation on the actual router hardware.
package validation

import (
	"fmt"
	"strings"
)

// Severity indicates how critical a validation finding is.
type Severity int

const (
	// SeverityInfo is a non-blocking informational finding.
	SeverityInfo Severity = iota
	// SeverityWarning is a non-blocking warning.
	SeverityWarning
	// SeverityError is a blocking validation error.
	SeverityError
)

// String returns the string representation of the severity.
func (s Severity) String() string {
	switch s {
	case SeverityInfo:
		return "info"
	case SeverityWarning:
		return "warning"
	case SeverityError:
		return "error"
	default:
		return "unknown"
	}
}

// ValidationError represents a single validation finding.
type ValidationError struct {
	// Stage is the stage that produced this error (1-7).
	Stage int

	// StageName is the human-readable stage name.
	StageName string

	// Severity indicates the finding severity.
	Severity Severity

	// Field is the field or resource path that failed validation.
	Field string

	// Message describes the validation failure.
	Message string

	// Code is a machine-readable error code (e.g., "VLAN_ID_RANGE").
	Code string

	// Suggestion is an optional remediation suggestion.
	Suggestion string
}

// Error implements the error interface.
func (e *ValidationError) Error() string {
	return fmt.Sprintf("[%s] %s: %s", e.StageName, e.Field, e.Message)
}

// ValidationResult holds the aggregate result of running the validation pipeline.
type ValidationResult struct {
	// Valid is true if no blocking errors were found.
	Valid bool

	// Errors contains all validation findings (info, warning, error).
	Errors []*ValidationError

	// StagesRun is the number of stages that executed.
	StagesRun int

	// StagesFailed lists stages that produced blocking errors.
	StagesFailed []int
}

// NewResult creates a new empty validation result.
func NewResult() *ValidationResult {
	return &ValidationResult{
		Valid:        true,
		Errors:       make([]*ValidationError, 0),
		StagesFailed: make([]int, 0),
	}
}

// AddError adds a validation error to the result.
func (r *ValidationResult) AddError(err *ValidationError) {
	r.Errors = append(r.Errors, err)
	if err.Severity == SeverityError {
		r.Valid = false
		// Track failed stage if not already tracked
		found := false
		for _, s := range r.StagesFailed {
			if s == err.Stage {
				found = true
				break
			}
		}
		if !found {
			r.StagesFailed = append(r.StagesFailed, err.Stage)
		}
	}
}

// Merge combines another result into this one.
func (r *ValidationResult) Merge(other *ValidationResult) {
	if other == nil {
		return
	}
	for _, err := range other.Errors {
		r.AddError(err)
	}
}

// HasErrors returns true if any blocking errors exist.
func (r *ValidationResult) HasErrors() bool {
	return !r.Valid
}

// ErrorCount returns the number of blocking errors.
func (r *ValidationResult) ErrorCount() int {
	count := 0
	for _, e := range r.Errors {
		if e.Severity == SeverityError {
			count++
		}
	}
	return count
}

// WarningCount returns the number of warnings.
func (r *ValidationResult) WarningCount() int {
	count := 0
	for _, e := range r.Errors {
		if e.Severity == SeverityWarning {
			count++
		}
	}
	return count
}

// Summary returns a human-readable summary of the validation result.
func (r *ValidationResult) Summary() string {
	if r.Valid {
		return fmt.Sprintf("Validation passed (%d stages, %d warnings)",
			r.StagesRun, r.WarningCount())
	}

	stageNames := make([]string, 0, len(r.StagesFailed))
	for _, s := range r.StagesFailed {
		stageNames = append(stageNames, fmt.Sprintf("stage %d", s))
	}

	return fmt.Sprintf("Validation failed: %d errors, %d warnings (failed: %s)",
		r.ErrorCount(), r.WarningCount(), strings.Join(stageNames, ", "))
}
