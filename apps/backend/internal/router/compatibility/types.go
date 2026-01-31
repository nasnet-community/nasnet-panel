package compatibility

// CapabilityLevel represents the support level for a feature.
type CapabilityLevel string

const (
	// CapabilityNone means feature not supported (hide in UI).
	CapabilityNone CapabilityLevel = "none"
	// CapabilityBasic means limited support (show with warnings).
	CapabilityBasic CapabilityLevel = "basic"
	// CapabilityAdvanced means full RouterOS native support.
	CapabilityAdvanced CapabilityLevel = "advanced"
	// CapabilityFull means complete support including container-based features.
	CapabilityFull CapabilityLevel = "full"
)

// FeatureCompatibility defines version requirements for a feature.
type FeatureCompatibility struct {
	// ID is the unique feature identifier (e.g., "rest_api", "container", "wireguard").
	ID string `json:"id" yaml:"id"`
	// Name is the human-readable feature name.
	Name string `json:"name" yaml:"name"`
	// Description provides details about the feature.
	Description string `json:"description,omitempty" yaml:"description,omitempty"`
	// VersionRange specifies the supported RouterOS versions.
	VersionRange VersionRange `json:"version_range" yaml:"version_range"`
	// VersionRangeCHR is an optional override for Cloud Hosted Router (CHR).
	// Some features have different requirements on CHR vs physical devices.
	VersionRangeCHR *VersionRange `json:"version_range_chr,omitempty" yaml:"version_range_chr,omitempty"`
	// CapabilityLevel indicates the support level when available.
	CapabilityLevel CapabilityLevel `json:"capability_level" yaml:"capability_level"`
	// RequiredPackages lists MikroTik packages that must be installed.
	RequiredPackages []string `json:"required_packages,omitempty" yaml:"required_packages,omitempty"`
	// DependsOn lists other feature IDs this feature depends on.
	DependsOn []string `json:"depends_on,omitempty" yaml:"depends_on,omitempty"`
	// UpgradeURL is a link to MikroTik upgrade documentation.
	UpgradeURL string `json:"upgrade_url,omitempty" yaml:"upgrade_url,omitempty"`
}

// FieldMapping defines version-specific field name mappings for MikroTik API.
type FieldMapping struct {
	// Default is the field name to use when no version-specific mapping exists.
	Default string `json:"default" yaml:"default"`
	// V6 is the field name for RouterOS 6.x.
	V6 string `json:"v6,omitempty" yaml:"v6,omitempty"`
	// V7 is the field name for RouterOS 7.x.
	V7 string `json:"v7,omitempty" yaml:"v7,omitempty"`
}

// ResourceFieldMappings defines all field mappings for a resource type.
type ResourceFieldMappings struct {
	// Resource is the resource path (e.g., "interface.ether", "ip.address").
	Resource string `json:"resource" yaml:"resource"`
	// Fields maps GraphQL field names to their version-specific MikroTik field names.
	Fields map[string]FieldMapping `json:"fields" yaml:"fields"`
}

// PathMapping defines version-specific API paths.
type PathMapping struct {
	// Default is the path to use when no version-specific mapping exists.
	Default string `json:"default" yaml:"default"`
	// V6 is the path for RouterOS 6.x (CLI-style: "/ip firewall filter").
	V6 string `json:"v6,omitempty" yaml:"v6,omitempty"`
	// V7 is the path for RouterOS 7.x (REST-style: "/ip/firewall/filter").
	V7 string `json:"v7,omitempty" yaml:"v7,omitempty"`
}

// CompatibilityMatrix is the complete version compatibility configuration.
type CompatibilityMatrix struct {
	// Version is the matrix schema version.
	Version string `json:"version" yaml:"version"`
	// Updated is when this matrix was last updated.
	Updated string `json:"updated" yaml:"updated"`
	// Features maps feature IDs to their compatibility definitions.
	Features map[string]FeatureCompatibility `json:"features" yaml:"features"`
	// FieldMappings maps resource types to their field mappings.
	FieldMappings map[string]ResourceFieldMappings `json:"field_mappings" yaml:"field_mappings"`
	// PathMappings maps resource types to their API path mappings.
	PathMappings map[string]PathMapping `json:"path_mappings" yaml:"path_mappings"`
}

// FeatureSupport represents the support status for a feature on a specific router.
type FeatureSupport struct {
	// FeatureID is the feature identifier.
	FeatureID string `json:"featureId"`
	// Supported indicates whether the feature is available.
	Supported bool `json:"supported"`
	// Reason explains why the feature is not supported (if applicable).
	Reason string `json:"reason,omitempty"`
	// UpgradeURL links to upgrade documentation (if applicable).
	UpgradeURL string `json:"upgradeUrl,omitempty"`
}

// UpgradePriority indicates the urgency of an upgrade.
type UpgradePriority string

const (
	PriorityCritical UpgradePriority = "CRITICAL"
	PriorityHigh     UpgradePriority = "HIGH"
	PriorityMedium   UpgradePriority = "MEDIUM"
	PriorityLow      UpgradePriority = "LOW"
)

// UpgradeStep represents a single step in the upgrade process.
type UpgradeStep struct {
	Step        int    `json:"step"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Command     string `json:"command,omitempty"`
	Optional    bool   `json:"optional"`
}

// UpgradeImpact describes the impact of an upgrade on router operation.
type UpgradeImpact struct {
	RequiresReboot    bool     `json:"requiresReboot"`
	EstimatedDowntime string   `json:"estimatedDowntime,omitempty"`
	BackupRecommended bool     `json:"backupRecommended"`
	BreakingChanges   []string `json:"breakingChanges"`
}

// UpgradeRecommendation provides actionable guidance for enabling a feature.
type UpgradeRecommendation struct {
	// FeatureID is the feature that requires upgrade.
	FeatureID string `json:"featureId"`
	// FeatureName is the human-readable feature name.
	FeatureName string `json:"featureName"`
	// CurrentVersion is the current RouterOS version string.
	CurrentVersion string `json:"currentVersion"`
	// RequiredVersion is the minimum required version for this feature.
	RequiredVersion string `json:"requiredVersion"`
	// IsMajorUpgrade indicates if this is a major version upgrade (e.g., 6.x to 7.x).
	IsMajorUpgrade bool `json:"isMajorUpgrade"`
	// Priority indicates the urgency of the upgrade.
	Priority UpgradePriority `json:"priority"`
	// Steps contains step-by-step upgrade instructions.
	Steps []UpgradeStep `json:"steps"`
	// Impact describes the impact on router operation.
	Impact UpgradeImpact `json:"impact"`
	// DocumentationURL links to upgrade documentation.
	DocumentationURL string `json:"documentationUrl,omitempty"`
	// Warnings contains important notes about this upgrade.
	Warnings []string `json:"warnings"`
}

// RouterOSVersionInfo contains parsed version information for a router.
type RouterOSVersionInfo struct {
	// Version is the parsed version.
	Version Version `json:"version"`
	// Formatted is the original version string.
	Formatted string `json:"formatted"`
	// IsCHR indicates if this is a Cloud Hosted Router.
	IsCHR bool `json:"isChr"`
	// Architecture is the CPU architecture (arm, arm64, x86, etc.).
	Architecture string `json:"architecture,omitempty"`
}
