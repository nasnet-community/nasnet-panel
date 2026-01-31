package translator

import (
	"context"
	"fmt"
	"strconv"
	"strings"
)

// ResponseTranslator handles converting MikroTik responses to GraphQL format.
type ResponseTranslator struct {
	registry *FieldMappingRegistry
}

// NewResponseTranslator creates a new response translator.
func NewResponseTranslator(registry *FieldMappingRegistry) *ResponseTranslator {
	if registry == nil {
		registry = BuildDefaultRegistry()
	}
	return &ResponseTranslator{registry: registry}
}

// TranslateResponse converts a canonical response to GraphQL-compatible format.
func (rt *ResponseTranslator) TranslateResponse(ctx context.Context, path string, response *CanonicalResponse) (*CanonicalResponse, error) {
	if response == nil {
		return nil, fmt.Errorf("nil response")
	}

	// Error responses pass through unchanged
	if !response.Success {
		return response, nil
	}

	// Translate data based on type
	switch data := response.Data.(type) {
	case map[string]interface{}:
		translated := rt.translateRecord(path, data)
		return &CanonicalResponse{
			Success:  true,
			Data:     translated,
			ID:       response.ID,
			Metadata: response.Metadata,
		}, nil

	case []map[string]interface{}:
		translated := make([]map[string]interface{}, len(data))
		for i, record := range data {
			translated[i] = rt.translateRecord(path, record)
		}
		return &CanonicalResponse{
			Success:  true,
			Data:     translated,
			ID:       response.ID,
			Metadata: response.Metadata,
		}, nil

	default:
		// No translation needed for other types
		return response, nil
	}
}

// translateRecord converts a single MikroTik record to GraphQL format.
func (rt *ResponseTranslator) translateRecord(path string, record map[string]interface{}) map[string]interface{} {
	result := make(map[string]interface{}, len(record))

	for mikrotikField, value := range record {
		graphqlField := rt.translateFieldName(path, mikrotikField)
		translatedValue := rt.translateValue(path, mikrotikField, value)
		result[graphqlField] = translatedValue
	}

	return result
}

// translateFieldName converts a MikroTik field name to GraphQL format.
func (rt *ResponseTranslator) translateFieldName(path, mikrotikField string) string {
	// Check registry first
	if graphqlField, ok := rt.registry.GetGraphQLField(path, mikrotikField); ok {
		return graphqlField
	}

	// Fall back to automatic conversion
	return KebabToCamel(mikrotikField)
}

// translateValue converts a MikroTik value to the appropriate Go/GraphQL type.
func (rt *ResponseTranslator) translateValue(path, mikrotikField string, value interface{}) interface{} {
	// Get field mapping to determine type
	graphqlField := rt.translateFieldName(path, mikrotikField)
	mapping, hasMapping := rt.registry.GetMapping(path, graphqlField)

	// Handle enabled/disabled inversion:
	// When MikroTik field is "disabled" but GraphQL field is "enabled",
	// the boolean value must be inverted.
	invertBool := hasMapping && mikrotikField == "disabled" && graphqlField == "enabled"

	// Convert string values based on field type
	strVal, isString := value.(string)
	if !isString {
		if invertBool {
			if b, ok := value.(bool); ok {
				return !b
			}
		}
		return value
	}

	if hasMapping {
		result := rt.convertByType(strVal, mapping.Type)
		if invertBool {
			if b, ok := result.(bool); ok {
				return !b
			}
		}
		return result
	}

	// Auto-detect common patterns
	return rt.autoConvert(mikrotikField, strVal)
}

// convertByType converts a string value based on the known field type.
func (rt *ResponseTranslator) convertByType(value string, fieldType FieldType) interface{} {
	switch fieldType {
	case FieldTypeBool:
		return ParseMikroTikBool(value)

	case FieldTypeInt:
		if i, err := strconv.ParseInt(value, 10, 64); err == nil {
			// Return int for values that fit in int32 range for JSON/GraphQL compatibility
			if i >= -2147483648 && i <= 2147483647 {
				return int(i)
			}
			return i
		}
		return value

	case FieldTypeDuration:
		if d, err := ParseMikroTikDuration(value); err == nil {
			return d.String()
		}
		return value

	case FieldTypeSize:
		if size, err := ParseMikroTikSize(value); err == nil {
			return size
		}
		return value

	case FieldTypeList:
		return ParseMikroTikList(value)

	default:
		return value
	}
}

// autoConvert attempts to detect and convert common value patterns.
func (rt *ResponseTranslator) autoConvert(field, value string) interface{} {
	// Handle MikroTik boolean values
	lower := strings.ToLower(value)
	if lower == "yes" || lower == "no" || lower == "true" || lower == "false" {
		return ParseMikroTikBool(value)
	}

	// Handle disabled/enabled pattern
	if field == "disabled" {
		return ParseMikroTikBool(value)
	}

	// Handle numeric values
	if i, err := strconv.ParseInt(value, 10, 64); err == nil {
		// Keep small numbers as int, large as int64
		if i >= -2147483648 && i <= 2147483647 {
			return int(i)
		}
		return i
	}

	// Keep as string
	return value
}

// TransformDisabledToEnabled converts the "disabled" field to "enabled" with inverted value.
// This is useful for GraphQL schemas that use "enabled" instead of "disabled".
func (rt *ResponseTranslator) TransformDisabledToEnabled(record map[string]interface{}) map[string]interface{} {
	if disabled, ok := record["disabled"]; ok {
		delete(record, "disabled")
		// Invert the boolean value
		switch v := disabled.(type) {
		case bool:
			record["enabled"] = !v
		case string:
			record["enabled"] = !ParseMikroTikBool(v)
		}
	}
	return record
}

// TransformIDField converts ".id" field to "id".
// Note: KebabToCamel already handles this, but this is explicit for clarity.
func (rt *ResponseTranslator) TransformIDField(record map[string]interface{}) map[string]interface{} {
	if id, ok := record[".id"]; ok {
		delete(record, ".id")
		record["id"] = id
	}
	return record
}

// NormalizeRecord applies common transformations to a MikroTik record.
func (rt *ResponseTranslator) NormalizeRecord(record map[string]interface{}) map[string]interface{} {
	record = rt.TransformIDField(record)
	record = rt.TransformDisabledToEnabled(record)
	return record
}

// BatchTranslator handles translation of batch command responses.
type BatchTranslator struct {
	rt *ResponseTranslator
}

// NewBatchTranslator creates a new batch translator.
func NewBatchTranslator(registry *FieldMappingRegistry) *BatchTranslator {
	return &BatchTranslator{
		rt: NewResponseTranslator(registry),
	}
}

// TranslateBatch translates a slice of responses from batch command execution.
func (bt *BatchTranslator) TranslateBatch(ctx context.Context, paths []string, responses []*CanonicalResponse) ([]*CanonicalResponse, error) {
	if len(paths) != len(responses) {
		return nil, fmt.Errorf("path count (%d) does not match response count (%d)", len(paths), len(responses))
	}

	result := make([]*CanonicalResponse, len(responses))
	for i, response := range responses {
		translated, err := bt.rt.TranslateResponse(ctx, paths[i], response)
		if err != nil {
			return nil, fmt.Errorf("failed to translate response %d: %w", i, err)
		}
		result[i] = translated
	}

	return result, nil
}

// StreamingResponseTranslator handles translation of streaming responses (subscriptions).
type StreamingResponseTranslator struct {
	rt   *ResponseTranslator
	path string
}

// NewStreamingResponseTranslator creates a translator for streaming responses.
func NewStreamingResponseTranslator(path string, registry *FieldMappingRegistry) *StreamingResponseTranslator {
	return &StreamingResponseTranslator{
		rt:   NewResponseTranslator(registry),
		path: path,
	}
}

// Translate converts a single streaming response event.
func (srt *StreamingResponseTranslator) Translate(ctx context.Context, response *CanonicalResponse) (*CanonicalResponse, error) {
	return srt.rt.TranslateResponse(ctx, srt.path, response)
}

// TranslateChannel creates a channel that receives translated responses.
func (srt *StreamingResponseTranslator) TranslateChannel(ctx context.Context, input <-chan *CanonicalResponse) <-chan *CanonicalResponse {
	output := make(chan *CanonicalResponse)

	go func() {
		defer close(output)
		for {
			select {
			case <-ctx.Done():
				return
			case response, ok := <-input:
				if !ok {
					return
				}
				translated, err := srt.Translate(ctx, response)
				if err != nil {
					// Send error response on translation failure
					output <- &CanonicalResponse{
						Success: false,
						Error: &CommandError{
							Code:     "TRANSLATION_ERROR",
							Message:  err.Error(),
							Category: ErrorCategoryInternal,
						},
					}
					continue
				}
				output <- translated
			}
		}
	}()

	return output
}
