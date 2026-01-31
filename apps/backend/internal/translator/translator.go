package translator

import (
	"context"
	"fmt"
	"strings"
)

// Translator converts GraphQL operations to canonical commands and responses.
// It uses field mappings from @mikrotik directives to perform the translation.
type Translator struct {
	registry *FieldMappingRegistry
	version  *RouterOSVersion
}

// TranslatorConfig holds configuration for creating a Translator.
type TranslatorConfig struct {
	// Registry is the field mapping registry (uses default if nil).
	Registry *FieldMappingRegistry

	// Version is the target RouterOS version for version-aware translations.
	Version *RouterOSVersion
}

// NewTranslator creates a new Translator with the given configuration.
func NewTranslator(cfg TranslatorConfig) *Translator {
	registry := cfg.Registry
	if registry == nil {
		registry = BuildDefaultRegistry()
	}

	return &Translator{
		registry: registry,
		version:  cfg.Version,
	}
}

// NewDefaultTranslator creates a Translator with default configuration.
func NewDefaultTranslator() *Translator {
	return NewTranslator(TranslatorConfig{})
}

// SetVersion updates the target RouterOS version.
func (t *Translator) SetVersion(version *RouterOSVersion) {
	t.version = version
}

// GetRegistry returns the field mapping registry.
func (t *Translator) GetRegistry() *FieldMappingRegistry {
	return t.registry
}

// =============================================================================
// GraphQL -> Canonical Command Translation
// =============================================================================

// TranslateInput contains the parameters for translating a GraphQL operation.
type TranslateInput struct {
	// Path is the RouterOS API path (e.g., "/interface/ethernet").
	Path string

	// Action is the operation to perform.
	Action Action

	// ID is the target item ID for get/set/remove operations.
	ID string

	// Fields are the GraphQL field values to translate.
	Fields map[string]interface{}

	// Filters are query filters for print operations.
	Filters map[string]interface{}

	// PropList limits which fields to return (for print operations).
	PropList []string

	// Metadata contains request context.
	Metadata CommandMetadata
}

// TranslateToCanonical converts GraphQL input to a canonical command.
func (t *Translator) TranslateToCanonical(input TranslateInput) (*CanonicalCommand, error) {
	cmd := &CanonicalCommand{
		Path:       input.Path,
		Action:     input.Action,
		ID:         input.ID,
		Parameters: make(map[string]interface{}),
		Filters:    make([]Filter, 0),
		Version:    t.version,
		Metadata:   input.Metadata,
	}

	// Translate field names and values
	for graphqlField, value := range input.Fields {
		mikrotikField := t.translateFieldName(input.Path, graphqlField)
		translatedValue := t.translateFieldValue(input.Path, graphqlField, value)
		cmd.Parameters[mikrotikField] = translatedValue
	}

	// Translate filters
	for graphqlField, value := range input.Filters {
		mikrotikField := t.translateFieldName(input.Path, graphqlField)
		cmd.Filters = append(cmd.Filters, Filter{
			Field:    mikrotikField,
			Operator: FilterOpEquals,
			Value:    t.translateFieldValue(input.Path, graphqlField, value),
		})
	}

	// Translate proplist
	if len(input.PropList) > 0 {
		translatedProps := make([]string, len(input.PropList))
		for i, prop := range input.PropList {
			translatedProps[i] = t.translateFieldName(input.Path, prop)
		}
		cmd.PropList = translatedProps
	}

	return cmd, nil
}

// translateFieldName converts a GraphQL field name to MikroTik format.
func (t *Translator) translateFieldName(path, graphqlField string) string {
	// First check the registry for explicit mappings
	if mapping, ok := t.registry.GetMapping(path, graphqlField); ok {
		return mapping.MikroTikField
	}

	// Fall back to global mapping
	if mikrotikField, ok := t.registry.GetMikroTikField(graphqlField); ok {
		return mikrotikField
	}

	// Default: convert camelCase to kebab-case
	return CamelToKebab(graphqlField)
}

// translateFieldValue converts a GraphQL field value for MikroTik.
func (t *Translator) translateFieldValue(path, graphqlField string, value interface{}) interface{} {
	if value == nil {
		return nil
	}

	// Get field type from mapping
	fieldType := FieldTypeString
	if mapping, ok := t.registry.GetMapping(path, graphqlField); ok {
		fieldType = mapping.Type
	}

	// Handle special "enabled" -> "disabled" inversion
	if graphqlField == "enabled" {
		if boolVal, ok := value.(bool); ok {
			return !boolVal // Invert for MikroTik "disabled" field
		}
	}

	// Format based on field type
	switch fieldType {
	case FieldTypeBool:
		return FormatBool(value)
	case FieldTypeDuration:
		return FormatDuration(value)
	case FieldTypeList:
		return FormatList(value)
	default:
		return value
	}
}

// =============================================================================
// Canonical Response -> GraphQL Translation
// =============================================================================

// TranslateResponseToGraphQL converts a canonical response to GraphQL format.
func (t *Translator) TranslateResponseToGraphQL(ctx context.Context, path string, response *CanonicalResponse) (*CanonicalResponse, error) {
	if response == nil {
		return nil, fmt.Errorf("nil response")
	}

	if !response.Success {
		// Pass through error responses
		return response, nil
	}

	// Translate the data based on its type
	switch data := response.Data.(type) {
	case map[string]interface{}:
		translatedData := t.translateRecordToGraphQL(path, data)
		return &CanonicalResponse{
			Success:  true,
			Data:     translatedData,
			ID:       response.ID,
			Metadata: response.Metadata,
		}, nil

	case []map[string]interface{}:
		translatedList := make([]map[string]interface{}, len(data))
		for i, record := range data {
			translatedList[i] = t.translateRecordToGraphQL(path, record)
		}
		return &CanonicalResponse{
			Success:  true,
			Data:     translatedList,
			ID:       response.ID,
			Metadata: response.Metadata,
		}, nil

	case []interface{}:
		// Handle mixed list
		translatedList := make([]interface{}, len(data))
		for i, item := range data {
			if record, ok := item.(map[string]interface{}); ok {
				translatedList[i] = t.translateRecordToGraphQL(path, record)
			} else {
				translatedList[i] = item
			}
		}
		return &CanonicalResponse{
			Success:  true,
			Data:     translatedList,
			ID:       response.ID,
			Metadata: response.Metadata,
		}, nil

	default:
		// Pass through as-is
		return response, nil
	}
}

// translateRecordToGraphQL converts a single record from MikroTik to GraphQL format.
func (t *Translator) translateRecordToGraphQL(path string, record map[string]interface{}) map[string]interface{} {
	result := make(map[string]interface{}, len(record))

	for mikrotikField, value := range record {
		// Get GraphQL field name
		graphqlField, ok := t.registry.GetGraphQLField(path, mikrotikField)
		if !ok {
			// Fall back to automatic conversion
			graphqlField = KebabToCamel(mikrotikField)
		}

		// Get field type for value conversion
		fieldType := FieldTypeString
		if mapping, ok := t.registry.GetMapping(path, graphqlField); ok {
			fieldType = mapping.Type
		}

		// Convert value based on field type
		result[graphqlField] = t.translateValueToGraphQL(graphqlField, value, fieldType)
	}

	return result
}

// translateValueToGraphQL converts a MikroTik value to GraphQL format.
func (t *Translator) translateValueToGraphQL(graphqlField string, value interface{}, fieldType FieldType) interface{} {
	if value == nil {
		return nil
	}

	strVal, isString := value.(string)

	// Handle special "disabled" -> "enabled" inversion
	if graphqlField == "enabled" && isString {
		return !ParseMikroTikBool(strVal)
	}

	switch fieldType {
	case FieldTypeBool:
		if isString {
			return ParseMikroTikBool(strVal)
		}
		return value

	case FieldTypeDuration:
		if isString {
			d, err := ParseMikroTikDuration(strVal)
			if err == nil {
				return d.String()
			}
		}
		return value

	case FieldTypeList:
		if isString {
			return ParseMikroTikList(strVal)
		}
		return value

	case FieldTypeSize:
		if isString {
			size, err := ParseMikroTikSize(strVal)
			if err == nil {
				return size
			}
		}
		return value

	case FieldTypeInt:
		if isString {
			// Try to parse as integer
			var i int64
			if _, err := fmt.Sscanf(strVal, "%d", &i); err == nil {
				return i
			}
		}
		return value

	default:
		return value
	}
}

// =============================================================================
// Convenience Methods for Common Operations
// =============================================================================

// TranslateQuery creates a print command for querying resources.
func (t *Translator) TranslateQuery(path string, filters map[string]interface{}, propList []string, meta CommandMetadata) (*CanonicalCommand, error) {
	return t.TranslateToCanonical(TranslateInput{
		Path:     path,
		Action:   ActionPrint,
		Filters:  filters,
		PropList: propList,
		Metadata: meta,
	})
}

// TranslateGet creates a get command for fetching a single resource.
func (t *Translator) TranslateGet(path string, id string, meta CommandMetadata) (*CanonicalCommand, error) {
	return t.TranslateToCanonical(TranslateInput{
		Path:     path,
		Action:   ActionGet,
		ID:       id,
		Metadata: meta,
	})
}

// TranslateCreate creates an add command for creating a resource.
func (t *Translator) TranslateCreate(path string, fields map[string]interface{}, meta CommandMetadata) (*CanonicalCommand, error) {
	return t.TranslateToCanonical(TranslateInput{
		Path:     path,
		Action:   ActionAdd,
		Fields:   fields,
		Metadata: meta,
	})
}

// TranslateUpdate creates a set command for updating a resource.
func (t *Translator) TranslateUpdate(path string, id string, fields map[string]interface{}, meta CommandMetadata) (*CanonicalCommand, error) {
	return t.TranslateToCanonical(TranslateInput{
		Path:     path,
		Action:   ActionSet,
		ID:       id,
		Fields:   fields,
		Metadata: meta,
	})
}

// TranslateDelete creates a remove command for deleting a resource.
func (t *Translator) TranslateDelete(path string, id string, meta CommandMetadata) (*CanonicalCommand, error) {
	return t.TranslateToCanonical(TranslateInput{
		Path:     path,
		Action:   ActionRemove,
		ID:       id,
		Metadata: meta,
	})
}

// =============================================================================
// Error Translation
// =============================================================================

// TranslateError converts a protocol-specific error to a canonical error.
func TranslateError(err error, protocol Protocol) *CommandError {
	if err == nil {
		return nil
	}

	errStr := err.Error()
	category := ErrorCategoryInternal
	code := "UNKNOWN"
	retryable := false

	// Detect error category from message
	switch {
	case strings.Contains(errStr, "not found"), strings.Contains(errStr, "no such item"):
		category = ErrorCategoryNotFound
		code = "NOT_FOUND"
	case strings.Contains(errStr, "already exists"), strings.Contains(errStr, "duplicate"):
		category = ErrorCategoryConflict
		code = "DUPLICATE"
	case strings.Contains(errStr, "invalid"), strings.Contains(errStr, "bad"):
		category = ErrorCategoryValidation
		code = "VALIDATION_ERROR"
	case strings.Contains(errStr, "permission"), strings.Contains(errStr, "denied"):
		category = ErrorCategoryPermission
		code = "PERMISSION_DENIED"
	case strings.Contains(errStr, "timeout"):
		category = ErrorCategoryTimeout
		code = "TIMEOUT"
		retryable = true
	case strings.Contains(errStr, "connection"), strings.Contains(errStr, "refused"):
		category = ErrorCategoryConnection
		code = "CONNECTION_ERROR"
		retryable = true
	}

	return &CommandError{
		Code:      code,
		Message:   errStr,
		Category:  category,
		Retryable: retryable,
		Details: map[string]interface{}{
			"protocol": string(protocol),
		},
	}
}
