// Package alerts implements the alert rules engine and condition evaluation.
package alerts

import (
	"fmt"
	"regexp"
	"strconv"
	"strings"
)

// ConditionOperator represents the type of comparison to perform.
type ConditionOperator string

const (
	OperatorEquals      ConditionOperator = "EQUALS"
	OperatorNotEquals   ConditionOperator = "NOT_EQUALS"
	OperatorGreaterThan ConditionOperator = "GREATER_THAN"
	OperatorLessThan    ConditionOperator = "LESS_THAN"
	OperatorContains    ConditionOperator = "CONTAINS"
	OperatorRegex       ConditionOperator = "REGEX"
)

// Condition represents a single alert rule condition.
type Condition struct {
	Field    string            `json:"field"`
	Operator ConditionOperator `json:"operator"`
	Value    string            `json:"value"`
}

// EvaluateConditions evaluates all conditions against event data.
// Returns true if ALL conditions match (AND logic).
// Per Task 1.5: Implement condition evaluation logic with equals, not_equals,
// greater, less, contains, regex operators.
func EvaluateConditions(conditions []Condition, eventData map[string]interface{}) bool {
	// Empty conditions always match
	if len(conditions) == 0 {
		return true
	}

	// All conditions must match (AND logic)
	for _, cond := range conditions {
		if !evaluateCondition(cond, eventData) {
			return false
		}
	}

	return true
}

// evaluateCondition evaluates a single condition against event data.
func evaluateCondition(cond Condition, eventData map[string]interface{}) bool {
	// Extract field value from event data
	fieldValue, exists := getFieldValue(cond.Field, eventData)
	if !exists {
		// Field doesn't exist in event data
		return false
	}

	// Convert both to strings for comparison
	fieldStr := toString(fieldValue)
	targetValue := cond.Value

	switch cond.Operator {
	case OperatorEquals:
		return fieldStr == targetValue

	case OperatorNotEquals:
		return fieldStr != targetValue

	case OperatorGreaterThan:
		return compareNumeric(fieldStr, targetValue, func(a, b float64) bool { return a > b })

	case OperatorLessThan:
		return compareNumeric(fieldStr, targetValue, func(a, b float64) bool { return a < b })

	case OperatorContains:
		return strings.Contains(strings.ToLower(fieldStr), strings.ToLower(targetValue))

	case OperatorRegex:
		matched, err := regexp.MatchString(targetValue, fieldStr)
		if err != nil {
			// Invalid regex pattern
			return false
		}
		return matched

	default:
		// Unknown operator
		return false
	}
}

// getFieldValue retrieves a field value from event data, supporting dot notation.
// Examples:
// - "cpu_usage" → eventData["cpu_usage"]
// - "interface.name" → eventData["interface"]["name"]
func getFieldValue(field string, data map[string]interface{}) (interface{}, bool) {
	parts := strings.Split(field, ".")
	current := data

	for i, part := range parts {
		value, exists := current[part]
		if !exists {
			return nil, false
		}

		// If this is the last part, return the value
		if i == len(parts)-1 {
			return value, true
		}

		// Otherwise, the value must be a map for nested access
		nestedMap, ok := value.(map[string]interface{})
		if !ok {
			return nil, false
		}
		current = nestedMap
	}

	return nil, false
}

// toString converts an interface{} value to string.
func toString(value interface{}) string {
	if value == nil {
		return ""
	}

	switch v := value.(type) {
	case string:
		return v
	case int:
		return strconv.Itoa(v)
	case int64:
		return strconv.FormatInt(v, 10)
	case float64:
		return strconv.FormatFloat(v, 'f', -1, 64)
	case bool:
		return strconv.FormatBool(v)
	default:
		return fmt.Sprintf("%v", v)
	}
}

// compareNumeric compares two string values as numbers using the provided comparison function.
func compareNumeric(a, b string, compare func(float64, float64) bool) bool {
	aNum, errA := strconv.ParseFloat(a, 64)
	bNum, errB := strconv.ParseFloat(b, 64)

	// Both must be valid numbers
	if errA != nil || errB != nil {
		return false
	}

	return compare(aNum, bNum)
}

// ParseConditions converts a JSON array of condition maps to typed Condition structs.
func ParseConditions(conditionsJSON []map[string]interface{}) ([]Condition, error) {
	conditions := make([]Condition, 0, len(conditionsJSON))

	for i, condMap := range conditionsJSON {
		field, ok := condMap["field"].(string)
		if !ok || field == "" {
			return nil, fmt.Errorf("condition %d: field is required", i)
		}

		operatorStr, ok := condMap["operator"].(string)
		if !ok || operatorStr == "" {
			return nil, fmt.Errorf("condition %d: operator is required", i)
		}

		value, ok := condMap["value"].(string)
		if !ok {
			// Try to convert to string if not already
			value = toString(condMap["value"])
		}

		conditions = append(conditions, Condition{
			Field:    field,
			Operator: ConditionOperator(operatorStr),
			Value:    value,
		})
	}

	return conditions, nil
}
