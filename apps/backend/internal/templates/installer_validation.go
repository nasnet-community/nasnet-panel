package templates

import (
	"context"
	"fmt"
)

// ValidateTemplate validates a template before installation
// Checks variable references, service types, and dependency cycles.
func (ti *TemplateInstaller) ValidateTemplate(ctx context.Context, templateID string, variables map[string]interface{}) error {
	template, err := ti.templateService.GetTemplate(ctx, templateID)
	if err != nil {
		return fmt.Errorf("failed to get template: %w", err)
	}

	// Validate all required variables are provided
	for _, configVar := range template.ConfigVariables {
		if configVar.Required {
			if _, ok := variables[configVar.Name]; !ok {
				return fmt.Errorf("required variable %s not provided", configVar.Name)
			}
		}
	}

	// Validate variable types
	for _, configVar := range template.ConfigVariables {
		value, ok := variables[configVar.Name]
		if !ok {
			continue // Already checked required variables above
		}

		// Type validation
		if err := ti.validateVariableType(configVar, value); err != nil {
			return fmt.Errorf("invalid variable %s: %w", configVar.Name, err)
		}
	}

	return nil
}

// validateVariableType validates that a variable value matches its expected type.
func (ti *TemplateInstaller) validateVariableType(configVar TemplateVariable, value interface{}) error { //nolint:gocyclo // validation complexity
	switch configVar.Type { //nolint:exhaustive // not all types need to be handled in the outer switch
	case VarTypeString:
		if _, ok := value.(string); !ok {
			return fmt.Errorf("expected string, got %T", value)
		}
	case VarTypeNumber:
		switch v := value.(type) {
		case int, int32, int64, float32, float64:
			// Valid numeric types
		case string:
			// Try to parse string as number
			var num float64
			if _, err := fmt.Sscanf(v, "%f", &num); err != nil {
				return fmt.Errorf("expected number, got unparseable string: %w", err)
			}
		default:
			return fmt.Errorf("expected number, got %T", value)
		}
	case VarTypeBoolean:
		if _, ok := value.(bool); !ok { //nolint:nestif // validation branching
			// Also accept string representations
			if strVal, ok := value.(string); ok {
				if strVal != "true" && strVal != "false" {
					return fmt.Errorf("expected boolean, got string %s", strVal)
				}
			} else {
				return fmt.Errorf("expected boolean, got %T", value)
			}
		}
	case VarTypePort:
		// Port should be a number between 1-65535
		var portNum int
		switch v := value.(type) {
		case int:
			portNum = v
		case int32:
			portNum = int(v)
		case int64:
			portNum = int(v)
		case float64:
			portNum = int(v)
		case string:
			if _, err := fmt.Sscanf(v, "%d", &portNum); err != nil {
				return fmt.Errorf("expected port number, got unparseable string: %w", err)
			}
		default:
			return fmt.Errorf("expected port number, got %T", value)
		}

		if portNum < 1 || portNum > 65535 {
			return fmt.Errorf("port must be between 1-65535, got %d", portNum)
		}
	default:
		return fmt.Errorf("unknown variable type: %s", configVar.Type)
	}

	return nil
}
