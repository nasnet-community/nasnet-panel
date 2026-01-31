// Package mappings provides version-aware field and path mappings for RouterOS.
//
// RouterOS 6.x and 7.x have several differences in API paths and field names.
// This package allows the translator to adapt commands based on the target version.
package mappings

import (
	"encoding/json"
	"fmt"
	"os"
	"sync"

	"backend/internal/translator"
)

// VersionMapping defines how a path or field differs between RouterOS versions.
type VersionMapping struct {
	// Feature is the feature identifier (e.g., "wireless", "container").
	Feature string `json:"feature" yaml:"feature"`

	// MinVersion is the minimum RouterOS version that supports this feature.
	MinVersion *translator.RouterOSVersion `json:"minVersion,omitempty" yaml:"min_version,omitempty"`

	// PathMappings maps canonical paths to version-specific paths.
	PathMappings []PathMapping `json:"pathMappings,omitempty" yaml:"path_mappings,omitempty"`

	// FieldMappings maps canonical field names to version-specific names.
	FieldMappings []FieldVersionMapping `json:"fieldMappings,omitempty" yaml:"field_mappings,omitempty"`

	// Note describes the feature or version-specific behavior.
	Note string `json:"note,omitempty" yaml:"note,omitempty"`
}

// PathMapping defines a version-specific path override.
type PathMapping struct {
	// CanonicalPath is the standard path used in canonical commands.
	CanonicalPath string `json:"canonicalPath" yaml:"canonical_path"`

	// ROS6Path is the path for RouterOS 6.x (if different).
	ROS6Path string `json:"ros6Path,omitempty" yaml:"ros6_path,omitempty"`

	// ROS7Path is the path for RouterOS 7.x (if different).
	ROS7Path string `json:"ros7Path,omitempty" yaml:"ros7_path,omitempty"`

	// Note describes the reason for the difference.
	Note string `json:"note,omitempty" yaml:"note,omitempty"`
}

// FieldVersionMapping defines a version-specific field name override.
type FieldVersionMapping struct {
	// Path is the API path this mapping applies to.
	Path string `json:"path" yaml:"path"`

	// CanonicalField is the GraphQL/canonical field name.
	CanonicalField string `json:"canonicalField" yaml:"canonical_field"`

	// ROS6Field is the MikroTik field name for RouterOS 6.x.
	ROS6Field string `json:"ros6Field,omitempty" yaml:"ros6_field,omitempty"`

	// ROS7Field is the MikroTik field name for RouterOS 7.x.
	ROS7Field string `json:"ros7Field,omitempty" yaml:"ros7_field,omitempty"`

	// Note describes the reason for the difference.
	Note string `json:"note,omitempty" yaml:"note,omitempty"`
}

// VersionMappingRegistry holds all version-specific mappings.
type VersionMappingRegistry struct {
	mu sync.RWMutex

	// mappings indexed by feature name
	mappings map[string]*VersionMapping

	// pathMappings for quick path lookup: canonicalPath -> PathMapping
	pathMappings map[string]*PathMapping

	// fieldMappings for quick field lookup: "path:canonicalField" -> FieldVersionMapping
	fieldMappings map[string]*FieldVersionMapping
}

// NewVersionMappingRegistry creates a new registry with default mappings.
func NewVersionMappingRegistry() *VersionMappingRegistry {
	r := &VersionMappingRegistry{
		mappings:      make(map[string]*VersionMapping),
		pathMappings:  make(map[string]*PathMapping),
		fieldMappings: make(map[string]*FieldVersionMapping),
	}

	// Load default mappings
	r.loadDefaultMappings()

	return r
}

// Register adds a version mapping to the registry.
func (r *VersionMappingRegistry) Register(mapping *VersionMapping) {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.mappings[mapping.Feature] = mapping

	// Index path mappings
	for i := range mapping.PathMappings {
		pm := &mapping.PathMappings[i]
		r.pathMappings[pm.CanonicalPath] = pm
	}

	// Index field mappings
	for i := range mapping.FieldMappings {
		fm := &mapping.FieldMappings[i]
		key := fm.Path + ":" + fm.CanonicalField
		r.fieldMappings[key] = fm
	}
}

// GetPath returns the version-appropriate path.
func (r *VersionMappingRegistry) GetPath(canonicalPath string, version *translator.RouterOSVersion) string {
	r.mu.RLock()
	defer r.mu.RUnlock()

	pm, ok := r.pathMappings[canonicalPath]
	if !ok {
		return canonicalPath
	}

	if version == nil {
		// No version info, return canonical
		return canonicalPath
	}

	if version.IsROS7() && pm.ROS7Path != "" {
		return pm.ROS7Path
	}

	if version.IsROS6() && pm.ROS6Path != "" {
		return pm.ROS6Path
	}

	return canonicalPath
}

// GetField returns the version-appropriate field name.
func (r *VersionMappingRegistry) GetField(path, canonicalField string, version *translator.RouterOSVersion) string {
	r.mu.RLock()
	defer r.mu.RUnlock()

	key := path + ":" + canonicalField
	fm, ok := r.fieldMappings[key]
	if !ok {
		return canonicalField
	}

	if version == nil {
		return canonicalField
	}

	if version.IsROS7() && fm.ROS7Field != "" {
		return fm.ROS7Field
	}

	if version.IsROS6() && fm.ROS6Field != "" {
		return fm.ROS6Field
	}

	return canonicalField
}

// IsFeatureAvailable checks if a feature is available for the given version.
func (r *VersionMappingRegistry) IsFeatureAvailable(feature string, version *translator.RouterOSVersion) bool {
	r.mu.RLock()
	defer r.mu.RUnlock()

	mapping, ok := r.mappings[feature]
	if !ok {
		// Unknown feature, assume available
		return true
	}

	if mapping.MinVersion == nil {
		return true
	}

	if version == nil {
		// No version info, assume available
		return true
	}

	return version.IsAtLeast(mapping.MinVersion.Major, mapping.MinVersion.Minor)
}

// LoadFromFile loads version mappings from a JSON file.
func (r *VersionMappingRegistry) LoadFromFile(path string) error {
	data, err := os.ReadFile(path)
	if err != nil {
		return fmt.Errorf("failed to read mappings file: %w", err)
	}

	var mappings []VersionMapping
	if err := json.Unmarshal(data, &mappings); err != nil {
		return fmt.Errorf("failed to parse mappings file: %w", err)
	}

	for i := range mappings {
		r.Register(&mappings[i])
	}

	return nil
}

// loadDefaultMappings loads the built-in version-specific mappings.
func (r *VersionMappingRegistry) loadDefaultMappings() {
	// Wireless mappings (major changes between ROS 6.x and 7.x)
	r.Register(&VersionMapping{
		Feature: "wireless",
		PathMappings: []PathMapping{
			{
				CanonicalPath: "/interface/wireless",
				ROS6Path:      "/interface/wireless",
				ROS7Path:      "/interface/wifiwave2",
				Note:          "RouterOS 7.x uses wifiwave2 for modern wireless hardware",
			},
			{
				CanonicalPath: "/interface/wireless/security-profiles",
				ROS6Path:      "/interface/wireless/security-profiles",
				ROS7Path:      "/interface/wifiwave2/security",
				Note:          "Security profile structure changed in ROS 7.x",
			},
		},
		FieldMappings: []FieldVersionMapping{
			{
				Path:           "/interface/wireless",
				CanonicalField: "securityProfile",
				ROS6Field:      "security-profile",
				ROS7Field:      "security",
			},
			{
				Path:           "/interface/wireless",
				CanonicalField: "frequencyMode",
				ROS6Field:      "frequency-mode",
				ROS7Field:      "channel",
			},
		},
	})

	// Container support (ROS 7.4+)
	r.Register(&VersionMapping{
		Feature:    "container",
		MinVersion: &translator.RouterOSVersion{Major: 7, Minor: 4},
		PathMappings: []PathMapping{
			{
				CanonicalPath: "/container",
				ROS7Path:      "/container",
				Note:          "Container support added in RouterOS 7.4",
			},
		},
	})

	// REST API (ROS 7.1+)
	r.Register(&VersionMapping{
		Feature:    "rest-api",
		MinVersion: &translator.RouterOSVersion{Major: 7, Minor: 1},
		Note:       "REST API requires RouterOS 7.1 or later",
	})

	// IoT package (ROS 7.x)
	r.Register(&VersionMapping{
		Feature:    "iot",
		MinVersion: &translator.RouterOSVersion{Major: 7, Minor: 0},
		PathMappings: []PathMapping{
			{
				CanonicalPath: "/iot/bluetooth",
				ROS7Path:      "/iot/bluetooth",
				Note:          "IoT Bluetooth support in RouterOS 7.x",
			},
			{
				CanonicalPath: "/iot/lora",
				ROS7Path:      "/iot/lora",
				Note:          "IoT LoRa support in RouterOS 7.x",
			},
		},
	})

	// Firewall changes
	r.Register(&VersionMapping{
		Feature: "firewall",
		FieldMappings: []FieldVersionMapping{
			{
				Path:           "/ip/firewall/filter",
				CanonicalField: "connectionState",
				ROS6Field:      "connection-state",
				ROS7Field:      "connection-state",
				Note:           "Same field name, but behavior may differ",
			},
		},
	})

	// Routing changes (ROS 7.x major overhaul)
	r.Register(&VersionMapping{
		Feature: "routing",
		PathMappings: []PathMapping{
			{
				CanonicalPath: "/routing/ospf/instance",
				ROS6Path:      "/routing/ospf/instance",
				ROS7Path:      "/routing/ospf/instance",
				Note:          "OSPF structure changed significantly in ROS 7.x",
			},
			{
				CanonicalPath: "/routing/bgp/instance",
				ROS6Path:      "/routing/bgp/instance",
				ROS7Path:      "/routing/bgp/connection",
				Note:          "BGP instances renamed to connections in ROS 7.x",
			},
		},
	})

	// Bridging changes
	r.Register(&VersionMapping{
		Feature: "bridge",
		FieldMappings: []FieldVersionMapping{
			{
				Path:           "/interface/bridge",
				CanonicalField: "protocolMode",
				ROS6Field:      "protocol-mode",
				ROS7Field:      "protocol-mode",
			},
			{
				Path:           "/interface/bridge",
				CanonicalField: "vlanFiltering",
				ROS6Field:      "vlan-filtering",
				ROS7Field:      "vlan-filtering",
			},
		},
	})
}

// ApplyVersionMapping applies version-specific transformations to a command.
func ApplyVersionMapping(cmd *translator.CanonicalCommand, registry *VersionMappingRegistry) *translator.CanonicalCommand {
	if cmd == nil || registry == nil {
		return cmd
	}

	// Apply path mapping
	originalPath := cmd.Path
	cmd.Path = registry.GetPath(originalPath, cmd.Version)

	// Apply field mappings to parameters
	if len(cmd.Parameters) > 0 {
		newParams := make(map[string]interface{}, len(cmd.Parameters))
		for field, value := range cmd.Parameters {
			newField := registry.GetField(originalPath, field, cmd.Version)
			newParams[newField] = value
		}
		cmd.Parameters = newParams
	}

	// Apply field mappings to filters
	for i := range cmd.Filters {
		cmd.Filters[i].Field = registry.GetField(originalPath, cmd.Filters[i].Field, cmd.Version)
	}

	// Apply field mappings to proplist
	if len(cmd.PropList) > 0 {
		newPropList := make([]string, len(cmd.PropList))
		for i, prop := range cmd.PropList {
			newPropList[i] = registry.GetField(originalPath, prop, cmd.Version)
		}
		cmd.PropList = newPropList
	}

	return cmd
}
