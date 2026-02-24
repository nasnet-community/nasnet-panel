package templates

import (
	"fmt"
	"regexp"
	"strings"

	"go.uber.org/zap"
)

// resolveServiceConfig resolves variable references in service configuration
// Supports nested maps and arrays with {{VARIABLE_NAME}} syntax.
func (ti *TemplateInstaller) resolveServiceConfig(config, variables map[string]interface{}) (map[string]interface{}, error) {
	resolved := make(map[string]interface{})

	for key, value := range config {
		resolvedValue, err := ti.resolveValue(value, variables)
		if err != nil {
			return nil, fmt.Errorf("failed to resolve key %s: %w", key, err)
		}
		resolved[key] = resolvedValue
	}

	return resolved, nil
}

// resolveValue recursively resolves a single value (string, map, array).
func (ti *TemplateInstaller) resolveValue(value interface{}, variables map[string]interface{}) (interface{}, error) {
	switch v := value.(type) {
	case string:
		return ti.resolveString(v, variables)
	case map[string]interface{}:
		return ti.resolveServiceConfig(v, variables)
	case []interface{}:
		resolved := make([]interface{}, len(v))
		for i, item := range v {
			resolvedItem, err := ti.resolveValue(item, variables)
			if err != nil {
				return nil, fmt.Errorf("failed to resolve array item %d: %w", i, err)
			}
			resolved[i] = resolvedItem
		}
		return resolved, nil
	default:
		// Non-string values (int, bool, etc.) are returned as-is
		return value, nil
	}
}

// resolveString resolves variable references in a string using double-brace syntax.
func (ti *TemplateInstaller) resolveString(input string, variables map[string]interface{}) (interface{}, error) {
	// Template variable pattern uses double-brace syntax
	pattern := regexp.MustCompile(`\{\{([A-Z_][A-Z0-9_.]*)\}\}`)

	// Check if the entire input string is ONLY a single variable reference
	matches := pattern.FindStringSubmatch(input)
	if len(matches) > 0 && strings.TrimSpace(input) == matches[0] {
		// Return the actual value (preserving type) for standalone variables
		varName := matches[1]
		if value, ok := variables[varName]; ok {
			return value, nil
		}
		// Missing variable in standalone reference is an error
		return nil, fmt.Errorf("variable {{%s}} not found", varName)
	}

	// Otherwise, perform string substitution for embedded variables
	resolved := pattern.ReplaceAllStringFunc(input, func(match string) string {
		// Extract variable name from {{VARIABLE_NAME}}
		subMatches := pattern.FindStringSubmatch(match)
		if len(subMatches) < 2 {
			return match // Should not happen, but defensive
		}
		varName := subMatches[1]

		if value, ok := variables[varName]; ok {
			return fmt.Sprintf("%v", value)
		}

		// Variable not found in string substitution - log and return as-is
		ti.logger.Warn("variable not found during resolution - using placeholder", zap.String("variable", varName))
		return match
	})

	return resolved, nil
}
