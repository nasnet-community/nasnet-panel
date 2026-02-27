// Package ssh provides SSH-specific implementations for router communication.
package ssh

import (
	"context"
	"fmt"

	"backend/internal/router"
	"backend/internal/router/ssh/parser"
)

// Translator handles translation between canonical commands and SSH format.
type Translator struct {
	parserService parser.SSHParserService
	normalizer    *parser.Normalizer
	converter     *parser.TypeConverter
}

// NewTranslator creates a new SSH translator with the parser service.
func NewTranslator() *Translator {
	normalizer := parser.NewNormalizer()
	normalizer.LoadDefaultMappings()

	config := parser.DefaultParserConfig()
	parserService := parser.NewSSHParserService(config, normalizer)
	converter := parser.NewTypeConverter(normalizer)

	return &Translator{
		parserService: parserService,
		normalizer:    normalizer,
		converter:     converter,
	}
}

// NewTranslatorWithConfig creates a translator with custom configuration.
func NewTranslatorWithConfig(config parser.ParserConfig) *Translator {
	normalizer := parser.NewNormalizer()
	normalizer.LoadDefaultMappings()

	parserService := parser.NewSSHParserService(config, normalizer)
	converter := parser.NewTypeConverter(normalizer)

	return &Translator{
		parserService: parserService,
		normalizer:    normalizer,
		converter:     converter,
	}
}

// ParseResponse parses SSH command output into router.CommandResult format.
func (t *Translator) ParseResponse(ctx context.Context, raw string, hints parser.ParseHints) (*router.CommandResult, error) {
	result, err := t.parserService.ParseResponse(ctx, raw, hints)
	if err != nil {
		return &router.CommandResult{
			Success:   false,
			Error:     err,
			RawOutput: raw,
		}, fmt.Errorf("parse SSH response: %w", err)
	}

	// Convert parser.Resource to []map[string]string for router.CommandResult
	data := make([]map[string]string, len(result.Resources))
	for i, resource := range result.Resources {
		data[i] = resourceToStringMap(resource)
	}

	return &router.CommandResult{
		Success:   true,
		Data:      data,
		RawOutput: raw,
	}, nil
}

// GetParseHintsFromCommand creates ParseHints from a router.Command.
func GetParseHintsFromCommand(cmd router.Command) parser.ParseHints {
	hints := parser.ParseHints{
		ResourcePath: cmd.Path,
	}

	// Map action to command type
	switch cmd.Action {
	case "print":
		hints.CommandType = parser.CommandPrint
	case "print detail":
		hints.CommandType = parser.CommandPrintDetail
	case "print terse":
		hints.CommandType = parser.CommandPrintTerse
	case "export":
		hints.CommandType = parser.CommandExport
	case "export verbose":
		hints.CommandType = parser.CommandExportVerbose
	case "get":
		hints.CommandType = parser.CommandGet
	default:
		hints.CommandType = parser.CommandPrint
	}

	return hints
}

// resourceToStringMap converts a parser.Resource to map[string]string.
func resourceToStringMap(resource parser.Resource) map[string]string {
	result := make(map[string]string, len(resource))

	for k, v := range resource {
		switch val := v.(type) {
		case string:
			result[k] = val
		case bool:
			if val {
				result[k] = "true"
			} else {
				result[k] = "false"
			}
		case int:
			result[k] = intToString(val)
		case int64:
			result[k] = int64ToString(val)
		case float64:
			result[k] = floatToString(val)
		default:
			// For any other type, try to format as string
			result[k] = formatAny(v)
		}
	}

	return result
}

// intToString converts an int to string without fmt package.
func intToString(i int) string {
	if i == 0 {
		return "0"
	}

	negative := false
	if i < 0 {
		negative = true
		i = -i
	}

	// Build string in reverse
	var digits [20]byte
	pos := len(digits)
	for i > 0 {
		pos--
		digits[pos] = byte('0' + i%10)
		i /= 10
	}

	if negative {
		pos--
		digits[pos] = '-'
	}

	return string(digits[pos:])
}

// int64ToString converts an int64 to string.
func int64ToString(i int64) string {
	if i == 0 {
		return "0"
	}

	negative := false
	if i < 0 {
		negative = true
		i = -i
	}

	var digits [20]byte
	pos := len(digits)
	for i > 0 {
		pos--
		digits[pos] = byte('0' + i%10)
		i /= 10
	}

	if negative {
		pos--
		digits[pos] = '-'
	}

	return string(digits[pos:])
}

// floatToString converts a float64 to string with basic formatting.
func floatToString(f float64) string {
	// Simple implementation - for precise formatting, use strconv
	if f == float64(int64(f)) {
		return int64ToString(int64(f))
	}
	// Fall back to approximate string
	return formatAny(f)
}

// formatAny formats any value as a string.
func formatAny(v any) string {
	switch val := v.(type) {
	case string:
		return val
	case nil:
		return ""
	default:
		// Use fmt package as fallback for complex types
		return anyToString(val)
	}
}

// anyToString converts any value to string using simple formatting.
func anyToString(v any) string {
	// Simple type switch for basic types
	switch val := v.(type) {
	case string:
		return val
	case int:
		return intToString(val)
	case int64:
		return int64ToString(val)
	case bool:
		if val {
			return "true"
		}
		return "false"
	default:
		return "<complex>"
	}
}

// RegisterFieldMapping adds a field mapping to the normalizer.
func (t *Translator) RegisterFieldMapping(gqlField, rosField string) {
	t.normalizer.RegisterMapping(gqlField, rosField)
}

// GetNormalizer returns the normalizer for advanced use cases.
func (t *Translator) GetNormalizer() *parser.Normalizer {
	return t.normalizer
}

// GetParserService returns the parser service for advanced use cases.
func (t *Translator) GetParserService() parser.SSHParserService {
	return t.parserService
}
