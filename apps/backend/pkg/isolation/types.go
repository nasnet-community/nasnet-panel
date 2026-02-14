// Package isolation provides reusable isolation primitives for service instances.
// It includes IP binding validation, directory separation, and port conflict detection.
package isolation

// Severity represents the severity level of an isolation violation.
type Severity string

const (
	SeverityError   Severity = "error"   // Blocks instance start
	SeverityWarning Severity = "warning" // Logged but allows start
)

// Violation represents a single isolation check failure.
type Violation struct {
	Layer       string   // Which isolation layer failed (IP, Directory, Port, Process)
	Description string   // Human-readable description
	Severity    Severity // Error or warning
}

// Report contains the results of isolation checks.
type Report struct {
	Passed         bool        // Overall pass/fail
	Violations     []Violation // List of violations found
	BindIP         string      // Validated bind IP
	AllocatedPorts []int       // Validated allocated ports
}

// CountWarnings counts the number of warnings in the report's violations.
func (r *Report) CountWarnings() int {
	count := 0
	for _, v := range r.Violations {
		if v.Severity == SeverityWarning {
			count++
		}
	}
	return count
}

// CountErrors counts the number of errors in the report's violations.
func (r *Report) CountErrors() int {
	count := 0
	for _, v := range r.Violations {
		if v.Severity == SeverityError {
			count++
		}
	}
	return count
}

// NewReport creates a new empty report that starts in a passed state.
func NewReport() *Report {
	return &Report{
		Passed:     true,
		Violations: []Violation{},
	}
}

// AddViolation adds a violation to the report and marks it as failed if the violation is an error.
func (r *Report) AddViolation(layer, description string, severity Severity) {
	r.Violations = append(r.Violations, Violation{
		Layer:       layer,
		Description: description,
		Severity:    severity,
	})
	if severity == SeverityError {
		r.Passed = false
	}
}
