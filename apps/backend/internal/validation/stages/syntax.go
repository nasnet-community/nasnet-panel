package stages

import (
	"context"
	"fmt"
	"net"
	"strings"

	"backend/internal/validation"
)

// SyntaxStage validates field value formats and syntax (Stage 2).
// Checks IP addresses, CIDR notation, port ranges, MAC addresses, etc.
type SyntaxStage struct{}

func (s *SyntaxStage) Number() int  { return 2 }
func (s *SyntaxStage) Name() string { return "syntax" }

// Validate checks syntax correctness of field values.
func (s *SyntaxStage) Validate(_ context.Context, input *validation.StageInput) *validation.Result {
	result := validation.NewResult()

	if input.Operation == "delete" {
		return result
	}

	for field, value := range input.Fields {
		s.validateField(field, value, result)
	}

	return result
}

// validateField dispatches field-specific syntax validation.
//
//nolint:gocyclo // syntax validation complexity
func (s *SyntaxStage) validateField(field string, value interface{}, result *validation.Result) {
	strVal, isStr := value.(string)
	intVal, isInt := value.(int)

	switch {
	case strings.HasSuffix(field, "-address") && isStr && strings.Contains(strVal, "/"):
		s.validateCIDR(field, strVal, result)
	case strings.HasSuffix(field, "-address") && isStr:
		s.validateIP(field, strVal, result)
	case field == "vlan-id" && isInt:
		s.validateVLANID(field, intVal, result)
	case field == "mtu" && isInt:
		s.validateMTU(field, intVal, result)
	case field == "distance" && isInt:
		s.validateDistance(field, intVal, result)
	case field == "priority" && isInt:
		s.validatePriority(field, intVal, result)
	case field == "mac-address" && isStr:
		s.validateMAC(field, strVal, result)
	}
}

func (s *SyntaxStage) validateIP(field, value string, result *validation.Result) {
	if net.ParseIP(value) == nil {
		result.AddError(&validation.Error{
			Stage:      2,
			StageName:  "syntax",
			Severity:   validation.SeverityError,
			Field:      field,
			Message:    fmt.Sprintf("invalid IP address: %s", value),
			Code:       "INVALID_IP",
			Suggestion: "Use format: 192.168.1.1",
		})
	}
}

func (s *SyntaxStage) validateCIDR(field, value string, result *validation.Result) {
	_, _, err := net.ParseCIDR(value)
	if err != nil {
		result.AddError(&validation.Error{
			Stage:      2,
			StageName:  "syntax",
			Severity:   validation.SeverityError,
			Field:      field,
			Message:    fmt.Sprintf("invalid CIDR notation: %s", value),
			Code:       "INVALID_CIDR",
			Suggestion: "Use format: 192.168.1.0/24",
		})
	}
}

func (s *SyntaxStage) validateVLANID(field string, value int, result *validation.Result) {
	if value < 1 || value > 4094 {
		result.AddError(&validation.Error{
			Stage:      2,
			StageName:  "syntax",
			Severity:   validation.SeverityError,
			Field:      field,
			Message:    fmt.Sprintf("VLAN ID %d out of range", value),
			Code:       "VLAN_ID_RANGE",
			Suggestion: "VLAN ID must be between 1 and 4094",
		})
	}
}

func (s *SyntaxStage) validateMTU(field string, value int, result *validation.Result) {
	if value < 68 || value > 65535 {
		result.AddError(&validation.Error{
			Stage:      2,
			StageName:  "syntax",
			Severity:   validation.SeverityError,
			Field:      field,
			Message:    fmt.Sprintf("MTU %d out of range", value),
			Code:       "MTU_RANGE",
			Suggestion: "MTU must be between 68 and 65535",
		})
	}
}

func (s *SyntaxStage) validateDistance(field string, value int, result *validation.Result) {
	if value < 0 || value > 255 {
		result.AddError(&validation.Error{
			Stage:      2,
			StageName:  "syntax",
			Severity:   validation.SeverityError,
			Field:      field,
			Message:    fmt.Sprintf("distance %d out of range", value),
			Code:       "DISTANCE_RANGE",
			Suggestion: "Distance must be between 0 and 255",
		})
	}
}

func (s *SyntaxStage) validatePriority(field string, value int, result *validation.Result) {
	if value < 0 || value > 65535 {
		result.AddError(&validation.Error{
			Stage:      2,
			StageName:  "syntax",
			Severity:   validation.SeverityError,
			Field:      field,
			Message:    fmt.Sprintf("priority %d out of range", value),
			Code:       "PRIORITY_RANGE",
			Suggestion: "Priority must be between 0 and 65535",
		})
	}
}

func (s *SyntaxStage) validateMAC(field, value string, result *validation.Result) {
	_, err := net.ParseMAC(value)
	if err != nil {
		result.AddError(&validation.Error{
			Stage:      2,
			StageName:  "syntax",
			Severity:   validation.SeverityError,
			Field:      field,
			Message:    fmt.Sprintf("invalid MAC address: %s", value),
			Code:       "INVALID_MAC",
			Suggestion: "Use format: AA:BB:CC:DD:EE:FF",
		})
	}
}
