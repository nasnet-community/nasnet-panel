// Package capability provides router capability detection and caching.
// This file integrates the capability detector with the version compatibility service.
package capability

import (
	"backend/internal/router/compatibility"
)

// VersionCapabilityIntegration provides methods to integrate hardware/software
// capability detection with version-based feature compatibility.
type VersionCapabilityIntegration struct {
	compatSvc compatibility.Service
}

// NewVersionCapabilityIntegration creates a new integration helper.
func NewVersionCapabilityIntegration() *VersionCapabilityIntegration {
	return &VersionCapabilityIntegration{
		compatSvc: compatibility.DefaultService,
	}
}

// NewVersionCapabilityIntegrationWithService creates an integration with a custom service.
func NewVersionCapabilityIntegrationWithService(svc compatibility.Service) *VersionCapabilityIntegration {
	return &VersionCapabilityIntegration{
		compatSvc: svc,
	}
}

// ConvertToCompatibilityVersion converts capability.RouterOSVersion to compatibility.Version.
func ConvertToCompatibilityVersion(v RouterOSVersion) compatibility.Version {
	return compatibility.Version{
		Major:   v.Major,
		Minor:   v.Minor,
		Patch:   v.Patch,
		Channel: v.Channel,
	}
}

// ConvertFromCompatibilityVersion converts compatibility.Version to capability.RouterOSVersion.
func ConvertFromCompatibilityVersion(v compatibility.Version) RouterOSVersion {
	return RouterOSVersion{
		Major:   v.Major,
		Minor:   v.Minor,
		Patch:   v.Patch,
		Channel: v.Channel,
		Raw:     v.String(),
	}
}

// GetFeatureSupport returns detailed feature support information for a router.
func (i *VersionCapabilityIntegration) GetFeatureSupport(
	caps *Capabilities,
	featureID string,
	isCHR bool,
) *FeatureSupportInfo {
	v := ConvertToCompatibilityVersion(caps.Software.Version)
	support := i.compatSvc.GetFeatureSupport(featureID, v, isCHR)

	// Check for required packages
	fc := i.compatSvc.GetFeatureCompatibility(featureID)
	if fc != nil && len(fc.RequiredPackages) > 0 {
		missingPkgs := getMissingPackages(caps.Software.InstalledPackages, fc.RequiredPackages)
		if len(missingPkgs) > 0 {
			return &FeatureSupportInfo{
				FeatureID:   featureID,
				Supported:   false,
				Reason:      "Missing required packages: " + joinStrings(missingPkgs, ", "),
				UpgradeURL:  support.UpgradeURL,
				RequiredPkg: missingPkgs,
			}
		}
	}

	return &FeatureSupportInfo{
		FeatureID:  featureID,
		Supported:  support.Supported,
		Reason:     support.Reason,
		UpgradeURL: support.UpgradeURL,
	}
}

// FeatureSupportInfo contains detailed information about feature support.
type FeatureSupportInfo struct {
	// FeatureID is the feature identifier.
	FeatureID string `json:"featureId"`

	// Supported indicates if the feature is supported on this router.
	Supported bool `json:"supported"`

	// Reason explains why the feature is not supported (if applicable).
	Reason string `json:"reason,omitempty"`

	// UpgradeURL is a link to MikroTik docs for upgrading.
	UpgradeURL string `json:"upgradeUrl,omitempty"`

	// RequiredPkg lists packages that need to be installed.
	RequiredPkg []string `json:"requiredPkg,omitempty"`
}

// GetSupportedFeatures returns all features supported by the given capabilities.
func (i *VersionCapabilityIntegration) GetSupportedFeatures(caps *Capabilities, isCHR bool) []FeatureSupportInfo {
	v := ConvertToCompatibilityVersion(caps.Software.Version)
	supported := i.compatSvc.GetSupportedFeatures(v, isCHR)

	result := make([]FeatureSupportInfo, 0, len(supported))
	for _, fc := range supported {
		// Check for required packages
		if len(fc.RequiredPackages) > 0 {
			missing := getMissingPackages(caps.Software.InstalledPackages, fc.RequiredPackages)
			if len(missing) > 0 {
				// Version supports it, but packages are missing - skip from supported
				continue
			}
		}

		result = append(result, FeatureSupportInfo{
			FeatureID:  fc.ID,
			Supported:  true,
			UpgradeURL: fc.UpgradeURL,
		})
	}

	return result
}

// GetUnsupportedFeatures returns all features not supported by the given capabilities.
func (i *VersionCapabilityIntegration) GetUnsupportedFeatures(caps *Capabilities, isCHR bool) []FeatureSupportInfo {
	v := ConvertToCompatibilityVersion(caps.Software.Version)
	unsupported := i.compatSvc.GetUnsupportedFeatures(v, isCHR)

	result := make([]FeatureSupportInfo, 0, len(unsupported))
	for _, fc := range unsupported {
		result = append(result, FeatureSupportInfo{
			FeatureID:   fc.ID,
			Supported:   false,
			Reason:      i.compatSvc.GetVersionRequirement(fc.ID, isCHR),
			UpgradeURL:  fc.UpgradeURL,
			RequiredPkg: fc.RequiredPackages,
		})
	}

	// Also add features where packages are missing
	supported := i.compatSvc.GetSupportedFeatures(v, isCHR)
	for _, fc := range supported {
		if len(fc.RequiredPackages) > 0 {
			missing := getMissingPackages(caps.Software.InstalledPackages, fc.RequiredPackages)
			if len(missing) > 0 {
				result = append(result, FeatureSupportInfo{
					FeatureID:   fc.ID,
					Supported:   false,
					Reason:      "Missing required packages: " + joinStrings(missing, ", "),
					UpgradeURL:  fc.UpgradeURL,
					RequiredPkg: missing,
				})
			}
		}
	}

	return result
}

// EnhanceCapabilities enriches the capabilities with version-based feature information.
// This merges hardware detection with version compatibility data.
func (i *VersionCapabilityIntegration) EnhanceCapabilities(caps *Capabilities, isCHR bool) {
	v := ConvertToCompatibilityVersion(caps.Software.Version)

	// Enhance REST API capability
	if i.compatSvc.IsFeatureSupported("rest_api", v, isCHR) {
		caps.SetEntry(CapabilityRESTAPI, LevelFull,
			"REST API is available (RouterOS 7.1+)",
			"")
	} else {
		caps.SetEntry(CapabilityRESTAPI, LevelNone,
			i.compatSvc.GetVersionRequirement("rest_api", isCHR),
			"Upgrade to RouterOS 7.1+ for REST API support")
	}

	// Enhance Binary API capability
	if i.compatSvc.IsFeatureSupported("binary_api", v, isCHR) {
		if i.compatSvc.IsFeatureSupported("api_ssl", v, isCHR) {
			caps.SetEntry(CapabilityBinaryAPI, LevelFull,
				"Binary API with SSL support",
				"")
		} else {
			caps.SetEntry(CapabilityBinaryAPI, LevelAdvanced,
				"Binary API available (no SSL)",
				"Upgrade to RouterOS 6.43+ for API-SSL support")
		}
	} else {
		caps.SetEntry(CapabilityBinaryAPI, LevelNone,
			i.compatSvc.GetVersionRequirement("binary_api", isCHR),
			"")
	}

	// Enhance ZeroTier capability
	if i.compatSvc.IsFeatureSupported("zerotier", v, isCHR) {
		zt := i.compatSvc.GetFeatureCompatibility("zerotier")
		if zt != nil && len(zt.RequiredPackages) > 0 {
			missing := getMissingPackages(caps.Software.InstalledPackages, zt.RequiredPackages)
			if len(missing) > 0 {
				caps.SetEntry(CapabilityZeroTier, LevelBasic,
					"ZeroTier version supported but package not installed",
					"Install the ZeroTier package")
			} else {
				caps.SetEntry(CapabilityZeroTier, LevelFull,
					"Native ZeroTier support available",
					"")
			}
		}
	}

	// Enhance ACME (Let's Encrypt) capability
	if i.compatSvc.IsFeatureSupported("acme", v, isCHR) {
		caps.SetEntry(CapabilityACME, LevelFull,
			"ACME (Let's Encrypt) certificate support available",
			"")
	} else {
		caps.SetEntry(CapabilityACME, LevelNone,
			i.compatSvc.GetVersionRequirement("acme", isCHR),
			"Upgrade to RouterOS 7.10+ for automatic certificate management")
	}

	// Enhance WiFi Wave2 capability
	if caps.Hardware.HasWirelessChip && i.compatSvc.IsFeatureSupported("wifi_wave2", v, isCHR) {
		caps.SetEntry(CapabilityWiFiWave2, LevelFull,
			"WiFi Wave2 configuration interface available",
			"")
	} else if caps.Hardware.HasWirelessChip {
		caps.SetEntry(CapabilityWiFiWave2, LevelNone,
			"WiFi Wave2 requires RouterOS 7.13+",
			"Upgrade to RouterOS 7.13+ for WiFi Wave2 interface")
	}
}

// Additional capability constants for version-specific features
const (
	CapabilityRESTAPI   Capability = "REST_API"
	CapabilityBinaryAPI Capability = "BINARY_API"
	CapabilityACME      Capability = "ACME"
	CapabilityWiFiWave2 Capability = "WIFI_WAVE2"
)

// getMissingPackages returns packages from required that are not in installed.
func getMissingPackages(installed, required []string) []string {
	installedSet := make(map[string]bool)
	for _, pkg := range installed {
		installedSet[pkg] = true
	}

	missing := make([]string, 0)
	for _, req := range required {
		if !installedSet[req] {
			missing = append(missing, req)
		}
	}
	return missing
}

// joinStrings joins a slice of strings with a separator.
func joinStrings(strs []string, sep string) string {
	if len(strs) == 0 {
		return ""
	}
	result := strs[0]
	for i := 1; i < len(strs); i++ {
		result += sep + strs[i]
	}
	return result
}
