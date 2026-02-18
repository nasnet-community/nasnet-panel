package parser

import (
	"regexp"
	"strings"
	"sync"
	"unicode"
)

// Normalizer handles field name normalization from RouterOS to GraphQL format.
//
// RouterOS uses kebab-case field names (e.g., "listen-port", "LISTEN-PORT")
// while GraphQL uses camelCase (e.g., "listenPort").
//
// The normalizer maintains bidirectional mappings:
//   - Forward: GraphQL → RouterOS (from @mikrotik directives)
//   - Reverse: RouterOS → GraphQL (inverted at startup)
type Normalizer struct {
	// forwardMap maps GraphQL field names to RouterOS field names.
	// Key: listenPort, Value: listen-port
	forwardMap map[string]string

	// reverseMap maps RouterOS field names to GraphQL field names.
	// Key: listen-port (lowercase), Value: listenPort
	reverseMap map[string]string

	// typeRegistry maps field names to their expected types.
	typeRegistry map[string]FieldType

	// sensitiveFields contains field names that should never be logged.
	sensitiveFields map[string]bool

	mu sync.RWMutex
}

// NewNormalizer creates a new field name normalizer.
func NewNormalizer() *Normalizer {
	return &Normalizer{
		forwardMap:      make(map[string]string),
		reverseMap:      make(map[string]string),
		typeRegistry:    make(map[string]FieldType),
		sensitiveFields: make(map[string]bool),
	}
}

// RegisterMapping adds a field mapping from @mikrotik directive.
func (n *Normalizer) RegisterMapping(gqlField, rosField string) {
	n.mu.Lock()
	defer n.mu.Unlock()

	n.forwardMap[gqlField] = rosField
	n.reverseMap[strings.ToLower(rosField)] = gqlField
}

// RegisterType registers the expected type for a field.
func (n *Normalizer) RegisterType(gqlField string, fieldType FieldType) {
	n.mu.Lock()
	defer n.mu.Unlock()

	n.typeRegistry[gqlField] = fieldType
}

// MarkSensitive marks a field as sensitive (should not be logged).
func (n *Normalizer) MarkSensitive(gqlField string) {
	n.mu.Lock()
	defer n.mu.Unlock()

	n.sensitiveFields[gqlField] = true
}

// LoadDefaultMappings loads common RouterOS field mappings.
// This is called at startup before schema-based mappings are loaded.
func (n *Normalizer) LoadDefaultMappings() {
	// Common RouterOS field mappings
	defaults := map[string]string{
		// Interface fields
		"listenPort":  "listen-port",
		"mtu":         "mtu",
		"name":        "name",
		"comment":     "comment",
		"disabled":    "disabled",
		"running":     "running",
		"macAddress":  "mac-address",
		"actualMtu":   "actual-mtu",
		"defaultName": "default-name",
		"l2Mtu":       "l2mtu",

		// IP fields
		"address":     "address",
		"network":     "network",
		"interface":   "interface",
		"gateway":     "gateway",
		"dstAddress":  "dst-address",
		"srcAddress":  "src-address",
		"prefSrc":     "pref-src",
		"distance":    "distance",
		"scope":       "scope",
		"targetScope": "target-scope",

		// DHCP fields
		"activeAddress":    "active-address",
		"activeMacAddress": "active-mac-address",
		"hostName":         "host-name",
		"expiresAfter":     "expires-after",
		"leaseTime":        "lease-time",
		"server":           "server",
		"clientId":         "client-id",

		// Firewall fields
		"chain":           "chain",
		"action":          "action",
		"protocol":        "protocol",
		"srcPort":         "src-port",
		"dstPort":         "dst-port",
		"connectionState": "connection-state",
		"inInterface":     "in-interface",
		"outInterface":    "out-interface",
		"log":             "log",
		"logPrefix":       "log-prefix",

		// WireGuard fields
		"privateKey":          "private-key",
		"publicKey":           "public-key",
		"presharedKey":        "preshared-key",
		"endpoint":            "endpoint",
		"endpointPort":        "endpoint-port",
		"allowedAddress":      "allowed-address",
		"persistentKeepalive": "persistent-keepalive",

		// System fields
		"uptime":           "uptime",
		"version":          "version",
		"boardName":        "board-name",
		"platform":         "platform",
		"cpuLoad":          "cpu-load",
		"freeMemory":       "free-memory",
		"totalMemory":      "total-memory",
		"freeHddSpace":     "free-hdd-space",
		"totalHddSpace":    "total-hdd-space",
		"architectureName": "architecture-name",
		"identity":         "identity",

		// Common special fields
		"id":     ".id",
		"nextId": ".nextid",
		"dead":   ".dead",
	}

	for gql, ros := range defaults {
		n.RegisterMapping(gql, ros)
	}

	// Register sensitive fields
	sensitives := []string{
		"privateKey",
		"presharedKey",
		"password",
		"secret",
		"apiKey",
		"token",
	}

	for _, field := range sensitives {
		n.MarkSensitive(field)
	}

	// Register common field types
	types := map[string]FieldType{
		"listenPort":          FieldTypeInt,
		"mtu":                 FieldTypeInt,
		"l2Mtu":               FieldTypeInt,
		"actualMtu":           FieldTypeInt,
		"disabled":            FieldTypeBool,
		"running":             FieldTypeBool,
		"dynamic":             FieldTypeBool,
		"invalid":             FieldTypeBool,
		"log":                 FieldTypeBool,
		"uptime":              FieldTypeDuration,
		"expiresAfter":        FieldTypeDuration,
		"leaseTime":           FieldTypeDuration,
		"macAddress":          FieldTypeMAC,
		"address":             FieldTypeIP,
		"gateway":             FieldTypeIP,
		"dstAddress":          FieldTypeIP,
		"srcAddress":          FieldTypeIP,
		"cpuLoad":             FieldTypeInt,
		"freeMemory":          FieldTypeBytes,
		"totalMemory":         FieldTypeBytes,
		"freeHddSpace":        FieldTypeBytes,
		"totalHddSpace":       FieldTypeBytes,
		"distance":            FieldTypeInt,
		"scope":               FieldTypeInt,
		"targetScope":         FieldTypeInt,
		"srcPort":             FieldTypeInt,
		"dstPort":             FieldTypeInt,
		"endpointPort":        FieldTypeInt,
		"persistentKeepalive": FieldTypeDuration,
	}

	for field, ftype := range types {
		n.RegisterType(field, ftype)
	}
}

// NormalizeFieldName converts a RouterOS field name to GraphQL camelCase.
func (n *Normalizer) NormalizeFieldName(rosField string) string {
	n.mu.RLock()
	defer n.mu.RUnlock()

	// Check reverse mapping first (case-insensitive)
	lowerField := strings.ToLower(rosField)
	if gqlField, ok := n.reverseMap[lowerField]; ok {
		return gqlField
	}

	// Handle special RouterOS fields
	if strings.HasPrefix(rosField, ".") {
		// .id -> id, .nextid -> nextId
		return toCamelCase(strings.TrimPrefix(rosField, "."))
	}

	if strings.HasPrefix(rosField, "!") {
		// !disabled -> disabled (negation prefix)
		return toCamelCase(strings.TrimPrefix(rosField, "!"))
	}

	// Fallback: Convert kebab-case to camelCase
	return toCamelCase(rosField)
}

// NormalizeResource normalizes all field names in a resource.
func (n *Normalizer) NormalizeResource(resource map[string]any) Resource {
	normalized := make(Resource, len(resource))

	for rosField, value := range resource {
		gqlField := n.NormalizeFieldName(rosField)
		normalized[gqlField] = value
	}

	return normalized
}

// NormalizeResources normalizes all field names in a slice of resources.
func (n *Normalizer) NormalizeResources(resources []map[string]any) []Resource {
	result := make([]Resource, len(resources))
	for i, resource := range resources {
		result[i] = n.NormalizeResource(resource)
	}
	return result
}

// GetFieldType returns the expected type for a normalized field.
func (n *Normalizer) GetFieldType(gqlField string) FieldType {
	n.mu.RLock()
	defer n.mu.RUnlock()

	if ftype, ok := n.typeRegistry[gqlField]; ok {
		return ftype
	}
	return FieldTypeString
}

// IsSensitive returns true if the field should not be logged.
func (n *Normalizer) IsSensitive(gqlField string) bool {
	n.mu.RLock()
	defer n.mu.RUnlock()

	return n.sensitiveFields[gqlField]
}

// GetRouterOSField returns the RouterOS field name for a GraphQL field.
func (n *Normalizer) GetRouterOSField(gqlField string) string {
	n.mu.RLock()
	defer n.mu.RUnlock()

	if rosField, ok := n.forwardMap[gqlField]; ok {
		return rosField
	}

	// Fallback: Convert camelCase to kebab-case
	return toKebabCase(gqlField)
}

// SanitizeForLogging removes sensitive field values from a resource.
func (n *Normalizer) SanitizeForLogging(resource Resource) Resource {
	sanitized := make(Resource, len(resource))

	for field, value := range resource {
		if n.IsSensitive(field) {
			sanitized[field] = "[REDACTED]"
		} else {
			sanitized[field] = value
		}
	}

	return sanitized
}

// toCamelCase converts kebab-case or UPPER-CASE to camelCase.
func toCamelCase(s string) string {
	s = strings.ToLower(s)
	parts := strings.Split(s, "-")
	if len(parts) == 1 {
		parts = strings.Split(s, "_") // Also handle snake_case
	}

	var result strings.Builder
	for i, part := range parts {
		if part == "" {
			continue
		}
		if i == 0 {
			result.WriteString(part)
		} else {
			result.WriteString(capitalize(part))
		}
	}

	return result.String()
}

// capitalize capitalizes the first letter of a string.
func capitalize(s string) string {
	if s == "" {
		return s
	}
	runes := []rune(s)
	runes[0] = unicode.ToUpper(runes[0])
	return string(runes)
}

// toKebabCase converts camelCase to kebab-case.
func toKebabCase(s string) string {
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

// ParseFlags parses RouterOS table flags into structured boolean fields.
func ParseFlags(flagStr string) TableFlags {
	flags := TableFlags{Raw: flagStr}

	for _, ch := range flagStr {
		switch ch {
		case 'X':
			flags.Disabled = true
		case 'R':
			flags.Running = true
		case 'D':
			flags.Dynamic = true
		case 'I':
			flags.Invalid = true
		case 'A':
			flags.Active = true
		case 'C':
			flags.Connected = true
		case 'S':
			flags.Static = true
		}
	}

	return flags
}

// ApplyFlagsToResource adds flag fields to a resource.
func ApplyFlagsToResource(resource Resource, flags TableFlags) {
	if flags.Disabled {
		resource["disabled"] = true
	}
	if flags.Running {
		resource["running"] = true
	}
	if flags.Dynamic {
		resource["dynamic"] = true
	}
	if flags.Invalid {
		resource["invalid"] = true
	}
	if flags.Active {
		resource["active"] = true
	}
	if flags.Connected {
		resource["connected"] = true
	}
	if flags.Static {
		resource["static"] = true
	}
}

// flagLinePattern matches RouterOS flag definition lines.
var flagLinePattern = regexp.MustCompile(`^Flags:\s*(.+)$`)

// IsFlagDefinitionLine checks if a line is a flag definition (e.g., "Flags: X - disabled, R - running").
func IsFlagDefinitionLine(line string) bool {
	return flagLinePattern.MatchString(line)
}
