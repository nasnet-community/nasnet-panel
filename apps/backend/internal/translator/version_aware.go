// Package translator implements version-aware command translation for RouterOS.
package translator

import (
	"strings"

	"backend/internal/router/compatibility"
)

// VersionAwareTranslator extends the standard translator with version-specific
// field and path mappings from the compatibility matrix.
type VersionAwareTranslator struct {
	*Translator
	compatSvc compatibility.Service
}

// NewVersionAwareTranslator creates a translator that uses the compatibility service
// for version-aware field and path translations.
func NewVersionAwareTranslator(cfg Config) *VersionAwareTranslator {
	return &VersionAwareTranslator{
		Translator: NewTranslator(cfg),
		compatSvc:  compatibility.DefaultService,
	}
}

// NewVersionAwareTranslatorWithService creates a translator with a custom compatibility service.
func NewVersionAwareTranslatorWithService(cfg Config, svc compatibility.Service) *VersionAwareTranslator {
	return &VersionAwareTranslator{
		Translator: NewTranslator(cfg),
		compatSvc:  svc,
	}
}

// GetCompatibilityVersion converts RouterOSVersion to compatibility.Version.
func (t *VersionAwareTranslator) GetCompatibilityVersion() *compatibility.Version {
	if t.version == nil {
		return nil
	}
	return &compatibility.Version{
		Major:   t.version.Major,
		Minor:   t.version.Minor,
		Patch:   t.version.Patch,
		Channel: t.version.Channel,
	}
}

// SetVersionFromCompatibility sets the translator version from a compatibility.Version.
func (t *VersionAwareTranslator) SetVersionFromCompatibility(v compatibility.Version) {
	t.version = &RouterOSVersion{
		Major:   v.Major,
		Minor:   v.Minor,
		Patch:   v.Patch,
		Channel: v.Channel,
	}
}

// TranslateFieldName translates a GraphQL field name to MikroTik format,
// using version-specific mappings from the compatibility matrix.
// Returns the MikroTik field name with graceful degradation:
//   - First tries version-specific mapping (v6.x vs v7.x)
//   - Falls back to registry-based mapping
//   - Falls back to camelCase-to-kebab-case conversion
//
// Supported versions:
//   - RouterOS 6.40+: Uses v6 field names from compatibility matrix
//   - RouterOS 7.0+: Uses v7 field names (new REST API format)
func (t *VersionAwareTranslator) TranslateFieldName(resource, graphqlField string) string {
	// First, try version-specific mapping from compatibility service
	if t.version != nil && t.compatSvc != nil {
		v := t.GetCompatibilityVersion()
		if v != nil {
			mikrotikField := t.compatSvc.GetFieldMapping(resource, graphqlField, *v)
			// If the field mapping returns something different from the input,
			// it means we found a mapping
			if mikrotikField != graphqlField {
				return mikrotikField
			}
		}
	}

	// Fall back to registry-based mapping
	if mapping, ok := t.registry.GetMapping(resourceToPath(resource), graphqlField); ok {
		return mapping.MikroTikField
	}

	// Fall back to global mapping
	if mikrotikField, ok := t.registry.GetMikroTikField(graphqlField); ok {
		return mikrotikField
	}

	// Default: convert camelCase to kebab-case
	return CamelToKebab(graphqlField)
}

// TranslatePath translates a resource identifier to the appropriate RouterOS API path
// based on the RouterOS version. Returns API path with graceful degradation:
//   - RouterOS 6.x: Uses CLI-style paths like "/ip firewall filter" (space-separated)
//   - RouterOS 7.x: Uses REST-style paths like "/ip/firewall/filter" (slash-separated)
//   - No version: Defaults to REST-style (v7.x format)
//
// This is critical for API compatibility across RouterOS major versions.
func (t *VersionAwareTranslator) TranslatePath(resource string) string {
	if t.version == nil {
		// No version set, use default path format (REST-style v7.x)
		return resourceToPath(resource)
	}

	if t.compatSvc == nil {
		// No compatibility service available, use default path format
		return resourceToPath(resource)
	}

	v := t.GetCompatibilityVersion()
	if v == nil {
		return resourceToPath(resource)
	}

	return t.compatSvc.GetPathMapping(resource, *v)
}

// TranslateToCanonicalVersionAware converts GraphQL input to a canonical command
// with version-aware field and path translations.
func (t *VersionAwareTranslator) TranslateToCanonicalVersionAware(input TranslateInput) (*CanonicalCommand, error) {
	// Use version-aware path translation
	translatedPath := input.Path
	if t.version != nil {
		// Extract resource identifier from path
		resource := pathToResource(input.Path)
		translatedPath = t.TranslatePath(resource)
	}

	cmd := &CanonicalCommand{
		Path:       translatedPath,
		Action:     input.Action,
		ID:         input.ID,
		Parameters: make(map[string]interface{}),
		Filters:    make([]Filter, 0),
		Version:    t.version,
		Metadata:   input.Metadata,
	}

	// Get resource identifier for field mapping
	resource := pathToResource(input.Path)

	// Translate field names and values with version awareness
	for graphqlField, value := range input.Fields {
		mikrotikField := t.TranslateFieldName(resource, graphqlField)
		translatedValue := t.translateFieldValue(input.Path, graphqlField, value)
		cmd.Parameters[mikrotikField] = translatedValue
	}

	// Translate filters
	for graphqlField, value := range input.Filters {
		mikrotikField := t.TranslateFieldName(resource, graphqlField)
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
			translatedProps[i] = t.TranslateFieldName(resource, prop)
		}
		cmd.PropList = translatedProps
	}

	return cmd, nil
}

// IsFeatureSupported checks if a feature is supported for the current RouterOS version.
// Returns true if the feature is available, false if not supported on this version.
// Uses graceful degradation: if version is unknown, assumes supported to avoid blocking operations.
//
// Feature gating strategy:
//   - REST API: Requires RouterOS 7.1+ (not available in v6.x)
//   - Container: Requires RouterOS 7.4+ (physical), 7.6+ (CHR - more restrictive)
//   - WireGuard VPN: Requires RouterOS 7.0+
//   - Binary API: Available RouterOS 6.40+
func (t *VersionAwareTranslator) IsFeatureSupported(featureID string, isCHR bool) bool {
	if t.version == nil {
		// If no version is set, assume feature is supported (graceful degradation)
		return true
	}

	if t.compatSvc == nil {
		// If no compatibility service available, assume feature is supported
		return true
	}

	v := t.GetCompatibilityVersion()
	if v == nil {
		return true
	}

	return t.compatSvc.IsFeatureSupported(featureID, *v, isCHR)
}

// GetVersionRequirement returns a human-readable version requirement for a feature.
func (t *VersionAwareTranslator) GetVersionRequirement(featureID string, isCHR bool) string {
	if t.compatSvc == nil {
		return "Version requirement unavailable"
	}
	return t.compatSvc.GetVersionRequirement(featureID, isCHR)
}

// resourceToPath converts a resource identifier (dot notation) to API path format.
// Example: "ip.address" -> "/ip/address"
func resourceToPath(resource string) string {
	if resource == "" {
		return ""
	}
	if resource[0] == '/' {
		return resource // Already a path
	}

	// Convert dot notation to path
	result := "/" + strings.ReplaceAll(resource, ".", "/")
	return result
}

// pathToResource converts an API path to resource identifier (dot notation).
// Example: "/ip/address" -> "ip.address"
func pathToResource(path string) string {
	if path == "" {
		return ""
	}

	// Remove leading slash
	if path[0] == '/' {
		path = path[1:]
	}

	// Convert slashes to dots
	result := strings.ReplaceAll(path, "/", ".")
	return result
}
