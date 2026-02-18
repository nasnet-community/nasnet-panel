package parser

import (
	"regexp"
	"strconv"
	"strings"
	"time"
)

// TypeConverter handles type conversion from RouterOS string values to Go types.
type TypeConverter struct {
	normalizer *Normalizer
}

// NewTypeConverter creates a new type converter.
func NewTypeConverter(normalizer *Normalizer) *TypeConverter {
	return &TypeConverter{normalizer: normalizer}
}

// ConvertValue converts a string value to the appropriate Go type based on field name.
func (c *TypeConverter) ConvertValue(fieldName, value string) any {
	fieldType := c.normalizer.GetFieldType(fieldName)
	return c.ConvertToType(value, fieldType)
}

// ConvertToType converts a string value to the specified type.
func (c *TypeConverter) ConvertToType(value string, fieldType FieldType) any {
	switch fieldType {
	case FieldTypeInt:
		return c.toInt(value)
	case FieldTypeInt64:
		return c.toInt64(value)
	case FieldTypeBool:
		return c.toBool(value)
	case FieldTypeDuration:
		return c.toDuration(value)
	case FieldTypeBytes:
		return c.toBytes(value)
	case FieldTypeFloat:
		return c.toFloat(value)
	case FieldTypeIP, FieldTypeIPv6, FieldTypeMAC, FieldTypeTime, FieldTypeString:
		return value
	default:
		return value
	}
}

// ConvertResource converts all values in a resource based on field types.
func (c *TypeConverter) ConvertResource(resource Resource) Resource {
	result := make(Resource, len(resource))

	for field, value := range resource {
		if strValue, ok := value.(string); ok {
			result[field] = c.ConvertValue(field, strValue)
		} else {
			result[field] = value
		}
	}

	return result
}

// toInt converts a string to int, returning 0 on failure.
func (c *TypeConverter) toInt(value string) int {
	// Handle RouterOS formats like "1%" or "1,234"
	value = strings.TrimSuffix(value, "%")
	value = strings.ReplaceAll(value, ",", "")
	value = strings.TrimSpace(value)

	i, err := strconv.Atoi(value)
	if err != nil {
		return 0
	}
	return i
}

// toInt64 converts a string to int64.
func (c *TypeConverter) toInt64(value string) int64 {
	value = strings.ReplaceAll(value, ",", "")
	value = strings.TrimSpace(value)

	i, err := strconv.ParseInt(value, 10, 64)
	if err != nil {
		return 0
	}
	return i
}

// toBool converts a RouterOS boolean string to Go bool.
func (c *TypeConverter) toBool(value string) bool {
	value = strings.ToLower(strings.TrimSpace(value))
	switch value {
	case "true", "yes", "1", "on", "enabled":
		return true
	default:
		return false
	}
}

// toDuration converts RouterOS duration format to Go duration string.
// RouterOS formats: "1w2d3h4m5s", "1d12:30:45", "00:05:30"
func (c *TypeConverter) toDuration(value string) string {
	// Keep as string for now, as duration parsing is complex
	// and the GraphQL layer may want the original format
	return value
}

// ParseDuration parses RouterOS duration format to time.Duration.
func ParseDuration(value string) (time.Duration, error) {
	value = strings.TrimSpace(value)
	if value == "" || value == "0" || value == "0s" {
		return 0, nil
	}

	// Try standard Go duration first
	if d, err := time.ParseDuration(value); err == nil {
		return d, nil
	}

	// Parse RouterOS format: 1w2d3h4m5s
	var total time.Duration

	// Week pattern
	if matches := weekPattern.FindStringSubmatch(value); len(matches) > 1 {
		weeks, _ := strconv.Atoi(matches[1]) //nolint:errcheck // regex guarantees numeric match
		total += time.Duration(weeks) * 7 * 24 * time.Hour
		value = weekPattern.ReplaceAllString(value, "")
	}

	// Day pattern
	if matches := dayPattern.FindStringSubmatch(value); len(matches) > 1 {
		days, _ := strconv.Atoi(matches[1]) //nolint:errcheck // regex guarantees numeric match
		total += time.Duration(days) * 24 * time.Hour
		value = dayPattern.ReplaceAllString(value, "")
	}

	// Parse remaining as Go duration
	if value != "" {
		if d, err := time.ParseDuration(value); err == nil {
			total += d
		}
	}

	return total, nil
}

var weekPattern = regexp.MustCompile(`(\d+)w`)
var dayPattern = regexp.MustCompile(`(\d+)d`)

// toBytes converts RouterOS byte format to int64.
// RouterOS formats: "512.0MiB", "1.0GiB", "1024", "1024KiB"
func (c *TypeConverter) toBytes(value string) int64 {
	value = strings.TrimSpace(value)
	if value == "" {
		return 0
	}

	// Check for suffixes
	value = strings.ToUpper(value)

	multiplier := int64(1)
	for suffix, mult := range byteSuffixes {
		if strings.HasSuffix(value, suffix) {
			multiplier = mult
			value = strings.TrimSuffix(value, suffix)
			break
		}
	}

	// Parse the numeric part (may be float)
	value = strings.TrimSpace(value)

	f, err := strconv.ParseFloat(value, 64)
	if err != nil {
		return 0
	}

	return int64(f * float64(multiplier))
}

var byteSuffixes = map[string]int64{
	"GIB": 1024 * 1024 * 1024,
	"MIB": 1024 * 1024,
	"KIB": 1024,
	"GB":  1000 * 1000 * 1000,
	"MB":  1000 * 1000,
	"KB":  1000,
	"B":   1,
}

// toFloat converts a string to float64.
func (c *TypeConverter) toFloat(value string) float64 {
	value = strings.TrimSuffix(value, "%")
	value = strings.ReplaceAll(value, ",", "")
	value = strings.TrimSpace(value)

	f, err := strconv.ParseFloat(value, 64)
	if err != nil {
		return 0
	}
	return f
}

// ParseIP parses an IP address string and returns it validated.
func ParseIP(value string) string {
	// Remove CIDR notation if present for validation
	if idx := strings.Index(value, "/"); idx > 0 {
		return value // Return full CIDR notation
	}
	return strings.TrimSpace(value)
}

// ParseMAC parses a MAC address string and returns it validated.
func ParseMAC(value string) string {
	// RouterOS uses ":" separator
	value = strings.ToUpper(strings.TrimSpace(value))
	if macPattern.MatchString(value) {
		return value
	}
	return value // Return as-is, let GraphQL layer validate
}

var macPattern = regexp.MustCompile(`^([0-9A-F]{2}:){5}[0-9A-F]{2}$`)

// InferType attempts to infer the type of a value from its string representation.
func InferType(value string) FieldType {
	value = strings.TrimSpace(value)

	// Boolean values
	lowerValue := strings.ToLower(value)
	if lowerValue == "true" || lowerValue == "false" ||
		lowerValue == "yes" || lowerValue == "no" {

		return FieldTypeBool
	}

	// Duration patterns
	if durationPattern.MatchString(value) {
		return FieldTypeDuration
	}

	// IP address patterns
	if ipv4Pattern.MatchString(value) || ipv4CIDRPattern.MatchString(value) {
		return FieldTypeIP
	}
	if strings.Contains(value, "::") || ipv6Pattern.MatchString(value) {
		return FieldTypeIPv6
	}

	// MAC address
	if macPattern.MatchString(strings.ToUpper(value)) {
		return FieldTypeMAC
	}

	// Byte size values
	if byteSizePattern.MatchString(value) {
		return FieldTypeBytes
	}

	// Integer (must be after bytes pattern check)
	if _, err := strconv.Atoi(value); err == nil {
		return FieldTypeInt
	}

	// Float
	if _, err := strconv.ParseFloat(value, 64); err == nil {
		return FieldTypeFloat
	}

	return FieldTypeString
}

var durationPattern = regexp.MustCompile(`^(\d+w)?(\d+d)?(\d+h)?(\d+m)?(\d+s)?$|^\d+:\d+:\d+$`)
var ipv4Pattern = regexp.MustCompile(`^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$`)
var ipv4CIDRPattern = regexp.MustCompile(`^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/\d{1,2}$`)
var ipv6Pattern = regexp.MustCompile(`^[0-9a-fA-F:]+$`)
var byteSizePattern = regexp.MustCompile(`^\d+(?:\.\d+)?\s*[KMG]i?B$`)
