package translator

import (
	"fmt"
	"regexp"
	"strconv"
	"strings"
	"time"
	"unicode"
)

// FieldMapping represents a mapping from a GraphQL field to a RouterOS field.
type FieldMapping struct {
	// GraphQLField is the field name in the GraphQL schema (camelCase).
	GraphQLField string `json:"graphqlField"`

	// MikroTikField is the field name in RouterOS API (kebab-case).
	MikroTikField string `json:"mikrotikField"`

	// Path is the RouterOS API path for this field (e.g., "/interface/ethernet").
	Path string `json:"path"`

	// Type indicates the field's value type for formatting.
	Type FieldType `json:"type,omitempty"`
}

// FieldType indicates how to format field values.
type FieldType string

const (
	FieldTypeString   FieldType = "string"
	FieldTypeInt      FieldType = "int"
	FieldTypeBool     FieldType = "bool"
	FieldTypeDuration FieldType = "duration"
	FieldTypeList     FieldType = "list"
	FieldTypeMAC      FieldType = "mac"
	FieldTypeIP       FieldType = "ip"
	FieldTypeSize     FieldType = "size" // Bytes with suffix
)

// MikroTik boolean string constants used in value formatting and parsing.
const (
	boolYes  = "yes"
	boolNo   = "no"
	boolTrue = "true"
)

// FieldMappingRegistry holds all field mappings extracted from the GraphQL schema.
// It is built at startup via schema introspection and used for command translation.
type FieldMappingRegistry struct {
	// mappingsByPath maps API path -> GraphQL field name -> FieldMapping
	mappingsByPath map[string]map[string]*FieldMapping

	// graphqlToMikrotik maps GraphQL type.field -> MikroTik field name
	graphqlToMikrotik map[string]string

	// mikrotikToGraphql maps API path + MikroTik field -> GraphQL field name
	mikrotikToGraphql map[string]string
}

// NewFieldMappingRegistry creates a new empty registry.
func NewFieldMappingRegistry() *FieldMappingRegistry {
	return &FieldMappingRegistry{
		mappingsByPath:    make(map[string]map[string]*FieldMapping),
		graphqlToMikrotik: make(map[string]string),
		mikrotikToGraphql: make(map[string]string),
	}
}

// Register adds a field mapping to the registry.
func (r *FieldMappingRegistry) Register(mapping *FieldMapping) {
	// Initialize path map if needed
	if _, ok := r.mappingsByPath[mapping.Path]; !ok {
		r.mappingsByPath[mapping.Path] = make(map[string]*FieldMapping)
	}

	r.mappingsByPath[mapping.Path][mapping.GraphQLField] = mapping
	r.graphqlToMikrotik[mapping.GraphQLField] = mapping.MikroTikField
	r.mikrotikToGraphql[mapping.Path+":"+mapping.MikroTikField] = mapping.GraphQLField
}

// GetMikroTikField returns the MikroTik field name for a GraphQL field.
func (r *FieldMappingRegistry) GetMikroTikField(graphqlField string) (string, bool) {
	field, ok := r.graphqlToMikrotik[graphqlField]
	return field, ok
}

// GetGraphQLField returns the GraphQL field name for a MikroTik field at a given path.
func (r *FieldMappingRegistry) GetGraphQLField(path, mikrotikField string) (string, bool) {
	field, ok := r.mikrotikToGraphql[path+":"+mikrotikField]
	return field, ok
}

// GetMapping returns the full mapping for a GraphQL field at a given path.
func (r *FieldMappingRegistry) GetMapping(path, graphqlField string) (*FieldMapping, bool) {
	if pathMappings, ok := r.mappingsByPath[path]; ok {
		mapping, found := pathMappings[graphqlField]
		return mapping, found
	}
	return nil, false
}

// GetMappingsForPath returns all mappings for a given API path.
func (r *FieldMappingRegistry) GetMappingsForPath(path string) map[string]*FieldMapping {
	return r.mappingsByPath[path]
}

// TranslateFieldName converts a GraphQL field name (camelCase) to MikroTik format (kebab-case).
// Uses the registry first, falls back to automatic conversion.
func (r *FieldMappingRegistry) TranslateFieldName(graphqlField string) string {
	if mikrotikField, ok := r.GetMikroTikField(graphqlField); ok {
		return mikrotikField
	}
	return CamelToKebab(graphqlField)
}

// CamelToKebab converts camelCase to kebab-case.
// Example: "macAddress" -> "mac-address"
func CamelToKebab(s string) string {
	var result strings.Builder
	for i, r := range s {
		if unicode.IsUpper(r) {
			if i > 0 {
				result.WriteRune('-')
			}
			result.WriteRune(unicode.ToLower(r))
		} else {
			result.WriteRune(r)
		}
	}
	return result.String()
}

// KebabToCamel converts kebab-case to camelCase.
// Example: "mac-address" -> "macAddress"
// Special handling for MikroTik internal fields like ".id" -> "id"
func KebabToCamel(s string) string {
	// Handle MikroTik internal fields that start with "."
	s = strings.TrimPrefix(s, ".")

	var result strings.Builder
	capitalizeNext := false

	for _, r := range s {
		if r == '-' {
			capitalizeNext = true
			continue
		}
		if capitalizeNext {
			result.WriteRune(unicode.ToUpper(r))
			capitalizeNext = false
		} else {
			result.WriteRune(r)
		}
	}

	return result.String()
}

// =============================================================================
// Value Formatters for MikroTik-specific formats
// =============================================================================

// FormatMikroTikValue formats a Go value for MikroTik API.
func FormatMikroTikValue(value interface{}, fieldType FieldType) string {
	if value == nil {
		return ""
	}

	switch fieldType {
	case FieldTypeBool:
		return FormatBool(value)
	case FieldTypeDuration:
		return FormatDuration(value)
	case FieldTypeList:
		return FormatList(value)
	case FieldTypeSize:
		return FormatSize(value)
	case FieldTypeMAC:
		return fmt.Sprintf("%v", value)
	case FieldTypeIP:
		return fmt.Sprintf("%v", value)
	case FieldTypeString:
		return fmt.Sprintf("%v", value)
	case FieldTypeInt:
		return fmt.Sprintf("%v", value)
	default:
		return fmt.Sprintf("%v", value)
	}
}

// FormatBool formats a boolean for MikroTik (yes/no).
func FormatBool(value interface{}) string {
	switch v := value.(type) {
	case bool:
		if v {
			return boolYes
		}
		return boolNo
	case string:
		lower := strings.ToLower(v)
		if lower == boolTrue || lower == boolYes || lower == "1" {
			return boolYes
		}
		return boolNo
	default:
		return boolNo
	}
}

// FormatDuration formats a duration for MikroTik (e.g., 1d2h3m4s).
func FormatDuration(value interface{}) string {
	var d time.Duration

	switch v := value.(type) {
	case time.Duration:
		d = v
	case int:
		d = time.Duration(v) * time.Second
	case int64:
		d = time.Duration(v) * time.Second
	case string:
		// Already formatted, return as-is
		return v
	default:
		return ""
	}

	if d == 0 {
		return "0s"
	}

	var parts []string

	days := d / (24 * time.Hour)
	if days > 0 {
		parts = append(parts, fmt.Sprintf("%dd", days))
		d -= time.Duration(int64(days)) * 24 * time.Hour
	}

	hours := d / time.Hour
	if hours > 0 {
		parts = append(parts, fmt.Sprintf("%dh", hours))
		d -= time.Duration(int64(hours)) * time.Hour
	}

	minutes := d / time.Minute
	if minutes > 0 {
		parts = append(parts, fmt.Sprintf("%dm", minutes))
		d -= time.Duration(int64(minutes)) * time.Minute
	}

	seconds := d / time.Second
	if seconds > 0 {
		parts = append(parts, fmt.Sprintf("%ds", seconds))
	}

	return strings.Join(parts, "")
}

// FormatList formats a list for MikroTik (comma-separated).
func FormatList(value interface{}) string {
	switch v := value.(type) {
	case []string:
		return strings.Join(v, ",")
	case []interface{}:
		strs := make([]string, len(v))
		for i, item := range v {
			strs[i] = fmt.Sprintf("%v", item)
		}
		return strings.Join(strs, ",")
	case string:
		return v
	default:
		return fmt.Sprintf("%v", value)
	}
}

// FormatSize formats a size value for MikroTik (bytes with optional suffix).
func FormatSize(value interface{}) string {
	var bytes int64

	switch v := value.(type) {
	case int:
		bytes = int64(v)
	case int64:
		bytes = v
	case float64:
		bytes = int64(v)
	case string:
		return v
	default:
		return ""
	}

	return fmt.Sprintf("%d", bytes)
}

// =============================================================================
// Value Parsers for MikroTik responses
// =============================================================================

// ParseMikroTikBool parses a MikroTik boolean (yes/no/true/false).
func ParseMikroTikBool(s string) bool {
	lower := strings.ToLower(s)
	return lower == boolYes || lower == boolTrue || lower == "1"
}

// ParseMikroTikDuration parses a MikroTik duration string (e.g., 1d2h3m4s, 1w2d).
func ParseMikroTikDuration(s string) (time.Duration, error) {
	if s == "" {
		return 0, nil
	}

	// Try parsing as plain seconds first (e.g., "3600")
	if secs, err := strconv.Atoi(s); err == nil {
		return time.Duration(secs) * time.Second, nil
	}

	// RouterOS duration format: NwNdNhNmNs (weeks, days, hours, minutes, seconds)
	re := regexp.MustCompile(`(?:(\d+)w)?(?:(\d+)d)?(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?`)
	matches := re.FindStringSubmatch(s)

	if matches == nil {
		return 0, fmt.Errorf("invalid duration format: %s", s)
	}

	var d time.Duration

	if matches[1] != "" { // weeks
		w, _ := strconv.Atoi(matches[1]) //nolint:errcheck // regex capture group `(\d+)` guarantees digits-only match
		d += time.Duration(w) * 7 * 24 * time.Hour
	}
	if matches[2] != "" { // days
		days, _ := strconv.Atoi(matches[2]) //nolint:errcheck // regex capture group `(\d+)` guarantees digits-only match
		d += time.Duration(days) * 24 * time.Hour
	}
	if matches[3] != "" { // hours
		h, _ := strconv.Atoi(matches[3]) //nolint:errcheck // regex capture group `(\d+)` guarantees digits-only match
		d += time.Duration(h) * time.Hour
	}
	if matches[4] != "" { // minutes
		m, _ := strconv.Atoi(matches[4]) //nolint:errcheck // regex capture group `(\d+)` guarantees digits-only match
		d += time.Duration(m) * time.Minute
	}
	if matches[5] != "" { // seconds
		secs, _ := strconv.Atoi(matches[5]) //nolint:errcheck // regex capture group `(\d+)` guarantees digits-only match
		d += time.Duration(secs) * time.Second
	}

	return d, nil
}

// ParseMikroTikList parses a MikroTik list value (comma-separated).
func ParseMikroTikList(s string) []string {
	if s == "" {
		return nil
	}
	parts := strings.Split(s, ",")
	result := make([]string, 0, len(parts))
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p != "" {
			result = append(result, p)
		}
	}
	return result
}

// ParseMikroTikSize parses a MikroTik size value (e.g., "1024", "10K", "1M").
func ParseMikroTikSize(s string) (int64, error) {
	if s == "" {
		return 0, nil
	}

	s = strings.TrimSpace(s)
	if s == "" {
		return 0, nil
	}

	// Check for suffix
	lastChar := s[len(s)-1]
	var multiplier int64 = 1

	switch unicode.ToUpper(rune(lastChar)) {
	case 'K':
		multiplier = 1024
		s = s[:len(s)-1]
	case 'M':
		multiplier = 1024 * 1024
		s = s[:len(s)-1]
	case 'G':
		multiplier = 1024 * 1024 * 1024
		s = s[:len(s)-1]
	}

	val, err := strconv.ParseInt(s, 10, 64)
	if err != nil {
		return 0, fmt.Errorf("invalid size format: %s", s)
	}

	return val * multiplier, nil
}

// =============================================================================
// Default MikroTik Field Mappings
// =============================================================================

// DefaultInterfaceMappings returns the default field mappings for interface types.
func DefaultInterfaceMappings() []*FieldMapping {
	return []*FieldMapping{
		{GraphQLField: "name", MikroTikField: "name", Path: "/interface", Type: FieldTypeString},
		{GraphQLField: "type", MikroTikField: "type", Path: "/interface", Type: FieldTypeString},
		{GraphQLField: "enabled", MikroTikField: "disabled", Path: "/interface", Type: FieldTypeBool},
		{GraphQLField: "running", MikroTikField: "running", Path: "/interface", Type: FieldTypeBool},
		{GraphQLField: "macAddress", MikroTikField: "mac-address", Path: "/interface", Type: FieldTypeMAC},
		{GraphQLField: "mtu", MikroTikField: "mtu", Path: "/interface", Type: FieldTypeInt},
		{GraphQLField: "comment", MikroTikField: "comment", Path: "/interface", Type: FieldTypeString},
		{GraphQLField: "txBytes", MikroTikField: "tx-byte", Path: "/interface", Type: FieldTypeSize},
		{GraphQLField: "rxBytes", MikroTikField: "rx-byte", Path: "/interface", Type: FieldTypeSize},
	}
}

// DefaultRouterMappings returns the default field mappings for router types.
func DefaultRouterMappings() []*FieldMapping {
	return []*FieldMapping{
		{GraphQLField: "version", MikroTikField: "version", Path: "/system/resource", Type: FieldTypeString},
		{GraphQLField: "model", MikroTikField: "model", Path: "/system/routerboard", Type: FieldTypeString},
		{GraphQLField: "uptime", MikroTikField: "uptime", Path: "/system/resource", Type: FieldTypeDuration},
		{GraphQLField: "cpuLoad", MikroTikField: "cpu-load", Path: "/system/resource", Type: FieldTypeInt},
		{GraphQLField: "freeMemory", MikroTikField: "free-memory", Path: "/system/resource", Type: FieldTypeSize},
		{GraphQLField: "totalMemory", MikroTikField: "total-memory", Path: "/system/resource", Type: FieldTypeSize},
		{GraphQLField: "freeHddSpace", MikroTikField: "free-hdd-space", Path: "/system/resource", Type: FieldTypeSize},
		{GraphQLField: "totalHddSpace", MikroTikField: "total-hdd-space", Path: "/system/resource", Type: FieldTypeSize},
		{GraphQLField: "boardName", MikroTikField: "board-name", Path: "/system/resource", Type: FieldTypeString},
		{GraphQLField: "architectureName", MikroTikField: "architecture-name", Path: "/system/resource", Type: FieldTypeString},
	}
}

// DefaultIPAddressMappings returns the default field mappings for IP addresses.
func DefaultIPAddressMappings() []*FieldMapping {
	return []*FieldMapping{
		{GraphQLField: "address", MikroTikField: "address", Path: "/ip/address", Type: FieldTypeString},
		{GraphQLField: "network", MikroTikField: "network", Path: "/ip/address", Type: FieldTypeIP},
		{GraphQLField: "interface", MikroTikField: "interface", Path: "/ip/address", Type: FieldTypeString},
		{GraphQLField: "disabled", MikroTikField: "disabled", Path: "/ip/address", Type: FieldTypeBool},
		{GraphQLField: "invalid", MikroTikField: "invalid", Path: "/ip/address", Type: FieldTypeBool},
		{GraphQLField: "dynamic", MikroTikField: "dynamic", Path: "/ip/address", Type: FieldTypeBool},
		{GraphQLField: "comment", MikroTikField: "comment", Path: "/ip/address", Type: FieldTypeString},
	}
}

// BuildDefaultRegistry creates a registry with all default mappings.
func BuildDefaultRegistry() *FieldMappingRegistry {
	registry := NewFieldMappingRegistry()

	// Register interface mappings
	for _, m := range DefaultInterfaceMappings() {
		registry.Register(m)
	}

	// Register router mappings
	for _, m := range DefaultRouterMappings() {
		registry.Register(m)
	}

	// Register IP address mappings
	for _, m := range DefaultIPAddressMappings() {
		registry.Register(m)
	}

	return registry
}
