package config

import (
	"encoding/json"
	"fmt"
	"net"
)

// Field type constants
const (
	fieldTypeString = "string"
	fieldTypeInt    = "int"
	fieldTypeBool   = "bool"
	fieldTypeIP     = "ip"
	fieldTypePort   = "port"
	fieldTypeEnum   = "enum"
)

// Field represents a single configuration field in a service config schema.
type Field struct {
	Name         string      `json:"name"`
	Type         string      `json:"type"` // "string", "int", "bool", "ip", "port", "enum"
	Required     bool        `json:"required"`
	Default      interface{} `json:"default,omitempty"`
	Description  string      `json:"description"`
	EnumValues   []string    `json:"enum_values,omitempty"` // For enum type
	Min          *int        `json:"min,omitempty"`         // For int/port types
	Max          *int        `json:"max,omitempty"`         // For int/port types
	Sensitive    bool        `json:"sensitive"`             // Marks sensitive fields (passwords, keys)
	Placeholder  string      `json:"placeholder,omitempty"` // UI placeholder text
	ValidateFunc string      `json:"validate_func,omitempty"`
}

// Schema defines the configuration schema for a service type.
type Schema struct {
	ServiceType string  `json:"service_type"`
	Version     string  `json:"version"`
	Fields      []Field `json:"fields"`
}

// Validate validates the configuration schema.
// Note: Circular dependencies are not possible in this schema structure
// since Field only contains primitive types and string slices, not nested Field references.
func (s *Schema) Validate() error {
	if s.ServiceType == "" {
		return fmt.Errorf("service_type is required")
	}
	if s.Version == "" {
		return fmt.Errorf("version is required")
	}
	if len(s.Fields) == 0 {
		return fmt.Errorf("at least one field is required")
	}

	// Validate each field
	fieldNames := make(map[string]bool)
	for i, field := range s.Fields {
		if err := s.validateSchemaField(field, i, fieldNames); err != nil {
			return err
		}
		fieldNames[field.Name] = true
	}

	return nil
}

// validateSchemaField validates a single field in the schema.
func (s *Schema) validateSchemaField(field Field, index int, fieldNames map[string]bool) error {
	if field.Name == "" {
		return fmt.Errorf("field at index %d: name is required", index)
	}
	if fieldNames[field.Name] {
		return fmt.Errorf("duplicate field name: %s", field.Name)
	}

	if field.Type == "" {
		return fmt.Errorf("field %s: type is required", field.Name)
	}

	validTypes := map[string]bool{
		fieldTypeString: true,
		fieldTypeInt:    true,
		fieldTypeBool:   true,
		fieldTypeIP:     true,
		fieldTypePort:   true,
		fieldTypeEnum:   true,
	}
	if !validTypes[field.Type] {
		return fmt.Errorf("field %s: invalid type %s", field.Name, field.Type)
	}

	// Enum type must have enum_values
	if field.Type == fieldTypeEnum && len(field.EnumValues) == 0 {
		return fmt.Errorf("field %s: enum type requires enum_values", field.Name)
	}

	// Validate default value type if provided
	if field.Default != nil {
		if err := validateFieldValue(field.Name, field.Type, field.Default, field.EnumValues); err != nil {
			return fmt.Errorf("field %s: default value invalid: %w", field.Name, err)
		}
	}

	// Validate min/max for numeric types
	if field.Type == "int" || field.Type == "port" {
		if field.Min != nil && field.Max != nil && *field.Min > *field.Max {
			return fmt.Errorf("field %s: min (%d) cannot be greater than max (%d)", field.Name, *field.Min, *field.Max)
		}
	}
	return nil
}

// ValidateConfig validates a user configuration against the schema.
func (s *Schema) ValidateConfig(config map[string]interface{}) error {
	if config == nil {
		return fmt.Errorf("config cannot be nil")
	}
	if err := s.validateFieldValues(config); err != nil {
		return err
	}
	return s.checkUnknownFields(config)
}

// validateFieldValues validates each field's value against the schema constraints.
func (s *Schema) validateFieldValues(config map[string]interface{}) error {
	for _, field := range s.Fields {
		value, exists := config[field.Name]

		if !exists {
			if field.Required {
				return fmt.Errorf("required field %s is missing", field.Name)
			}
			continue
		}

		if err := validateFieldValue(field.Name, field.Type, value, field.EnumValues); err != nil {
			return err
		}

		if err := validateMinMax(field, value); err != nil {
			return err
		}
	}
	return nil
}

// validateMinMax validates min/max constraints for int and port fields.
func validateMinMax(field Field, value interface{}) error {
	if (field.Type != fieldTypeInt && field.Type != fieldTypePort) || value == nil {
		return nil
	}

	var intVal int
	switch v := value.(type) {
	case int:
		intVal = v
	case float64:
		intVal = int(v)
	default:
		return fmt.Errorf("field %s: expected int, got %T", field.Name, value)
	}

	if field.Min != nil && intVal < *field.Min {
		return fmt.Errorf("field %s: value %d is less than minimum %d", field.Name, intVal, *field.Min)
	}
	if field.Max != nil && intVal > *field.Max {
		return fmt.Errorf("field %s: value %d is greater than maximum %d", field.Name, intVal, *field.Max)
	}
	return nil
}

// checkUnknownFields checks for fields in config not defined in the schema.
func (s *Schema) checkUnknownFields(config map[string]interface{}) error {
	fieldMap := make(map[string]bool, len(s.Fields))
	for _, field := range s.Fields {
		fieldMap[field.Name] = true
	}
	for key := range config {
		if !fieldMap[key] {
			return fmt.Errorf("unknown field: %s", key)
		}
	}
	return nil
}

// validateFieldValue validates a field value against its type.
func validateFieldValue(fieldName, fieldType string, value interface{}, enumValues []string) error {
	if value == nil {
		return nil
	}

	switch fieldType {
	case fieldTypeString:
		return validateStringField(fieldName, value)
	case fieldTypeInt:
		return validateIntField(fieldName, value)
	case fieldTypeBool:
		return validateBoolField(fieldName, value)
	case fieldTypeIP:
		return validateIPField(fieldName, value)
	case fieldTypePort:
		return validatePortField(fieldName, value)
	case fieldTypeEnum:
		return validateEnumField(fieldName, value, enumValues)
	default:
		return fmt.Errorf("field %s: unsupported type %s", fieldName, fieldType)
	}
}

func validateStringField(fieldName string, value interface{}) error {
	if _, ok := value.(string); !ok {
		return fmt.Errorf("field %s: expected string, got %T", fieldName, value)
	}
	return nil
}

func validateIntField(fieldName string, value interface{}) error {
	switch value.(type) {
	case int, float64:
		return nil
	default:
		return fmt.Errorf("field %s: expected int, got %T", fieldName, value)
	}
}

func validateBoolField(fieldName string, value interface{}) error {
	if _, ok := value.(bool); !ok {
		return fmt.Errorf("field %s: expected bool, got %T", fieldName, value)
	}
	return nil
}

func validateIPField(fieldName string, value interface{}) error {
	strVal, ok := value.(string)
	if !ok {
		return fmt.Errorf("field %s: expected IP address string, got %T", fieldName, value)
	}
	if net.ParseIP(strVal) == nil {
		return fmt.Errorf("field %s: invalid IP address: %s", fieldName, strVal)
	}
	return nil
}

func validatePortField(fieldName string, value interface{}) error {
	var intVal int
	switch v := value.(type) {
	case int:
		intVal = v
	case float64:
		intVal = int(v)
	default:
		return fmt.Errorf("field %s: expected port number, got %T", fieldName, value)
	}
	if intVal < 1 || intVal > 65535 {
		return fmt.Errorf("field %s: port must be between 1 and 65535, got %d", fieldName, intVal)
	}
	return nil
}

func validateEnumField(fieldName string, value interface{}, enumValues []string) error {
	strVal, ok := value.(string)
	if !ok {
		return fmt.Errorf("field %s: expected enum string, got %T", fieldName, value)
	}
	for _, enumVal := range enumValues {
		if strVal == enumVal {
			return nil
		}
	}
	return fmt.Errorf("field %s: invalid enum value %s (must be one of: %v)", fieldName, strVal, enumValues)
}

// MergeWithDefaults merges user config with default values from the schema.
func (s *Schema) MergeWithDefaults(userConfig map[string]interface{}) map[string]interface{} {
	result := make(map[string]interface{})

	// Start with default values
	for _, field := range s.Fields {
		if field.Default != nil {
			result[field.Name] = field.Default
		}
	}

	// Override with user-provided values
	for key, value := range userConfig {
		result[key] = value
	}

	return result
}

// ToJSON serializes the schema to JSON.
func (s *Schema) ToJSON() ([]byte, error) {
	return json.Marshal(s)
}

// FromJSON deserializes a schema from JSON.
func FromJSON(data []byte) (*Schema, error) {
	if len(data) == 0 {
		return nil, fmt.Errorf("schema JSON data is empty")
	}

	var schema Schema
	if err := json.Unmarshal(data, &schema); err != nil {
		return nil, fmt.Errorf("failed to unmarshal schema JSON: %w", err)
	}
	if err := schema.Validate(); err != nil {
		return nil, fmt.Errorf("schema validation failed: %w", err)
	}
	return &schema, nil
}
