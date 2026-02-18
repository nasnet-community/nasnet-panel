package compatibility

// This file contains upgrade recommendation logic for RouterOS versions.
// Types are defined in types.go.

// GetUpgradeRecommendation returns upgrade guidance for a specific feature.
func (s *service) GetUpgradeRecommendation(featureID string, currentVersion Version, isCHR bool) *UpgradeRecommendation {
	if err := s.LoadMatrix(); err != nil {
		return nil
	}

	fc := s.GetFeatureCompatibility(featureID)
	if fc == nil {
		return nil
	}

	// If feature is already supported, no upgrade needed
	if s.IsFeatureSupported(featureID, currentVersion, isCHR) {
		return nil
	}

	// Determine required version
	requiredVersionStr := fc.VersionRange.Min
	if isCHR && fc.VersionRangeCHR != nil && fc.VersionRangeCHR.Min != "" {
		requiredVersionStr = fc.VersionRangeCHR.Min
	}

	requiredVersion, err := ParseVersion(requiredVersionStr)
	if err != nil {
		return nil
	}

	// Determine if this is a major upgrade (e.g., 6.x to 7.x)
	isMajorUpgrade := currentVersion.Major < requiredVersion.Major

	// Determine priority based on feature type
	priority := determinePriority(featureID, isMajorUpgrade)

	// Build upgrade steps
	steps := buildUpgradeSteps(currentVersion, requiredVersion, fc, isMajorUpgrade)

	// Build impact assessment
	impact := buildImpact(currentVersion, requiredVersion, isMajorUpgrade)

	// Build warnings
	warnings := buildWarnings(currentVersion, requiredVersion, fc, isMajorUpgrade)

	return &UpgradeRecommendation{
		FeatureID:        featureID,
		FeatureName:      fc.Name,
		CurrentVersion:   currentVersion.String(),
		RequiredVersion:  requiredVersionStr,
		IsMajorUpgrade:   isMajorUpgrade,
		Priority:         priority,
		Steps:            steps,
		Impact:           impact,
		DocumentationURL: fc.UpgradeURL,
		Warnings:         warnings,
	}
}

// GetAllUpgradeRecommendations returns upgrade recommendations for all unsupported features.
func (s *service) GetAllUpgradeRecommendations(currentVersion Version, isCHR bool) []UpgradeRecommendation {
	if err := s.LoadMatrix(); err != nil {
		return nil
	}

	unsupported := s.GetUnsupportedFeatures(currentVersion, isCHR)
	recommendations := make([]UpgradeRecommendation, 0, len(unsupported))

	for _, fc := range unsupported {
		rec := s.GetUpgradeRecommendation(fc.ID, currentVersion, isCHR)
		if rec != nil {
			recommendations = append(recommendations, *rec)
		}
	}

	// Sort by priority (Critical first)
	sortRecommendationsByPriority(recommendations)

	return recommendations
}

// determinePriority assigns a priority level based on the feature type.
func determinePriority(featureID string, _isMajorUpgrade bool) UpgradePriority {
	// Security-related features are critical
	securityFeatures := map[string]bool{
		"api_ssl": true,
		"acme":    true,
	}
	if securityFeatures[featureID] {
		return PriorityCritical
	}

	// Modern API features are high priority
	apiFeatures := map[string]bool{
		"rest_api": true,
	}
	if apiFeatures[featureID] {
		return PriorityHigh
	}

	// VPN and networking features are medium
	networkFeatures := map[string]bool{
		"wireguard":       true,
		"container":       true,
		"zerotier":        true,
		"wifiwave2":       true,
		"iot_lora":        true,
		"iot_lorawan_gw":  true,
		"thread_border":   true,
		"matter_commissi": true,
	}
	if networkFeatures[featureID] {
		return PriorityMedium
	}

	// Everything else is low priority
	return PriorityLow
}

// buildUpgradeSteps creates the step-by-step upgrade instructions.
func buildUpgradeSteps(current, required Version, fc *FeatureCompatibility, isMajor bool) []UpgradeStep {
	steps := make([]UpgradeStep, 0)
	stepNum := 1

	// Step 1: Always backup first
	steps = append(steps, UpgradeStep{
		Step:        stepNum,
		Title:       "Create Configuration Backup",
		Description: "Export your current configuration before upgrading. This allows you to restore settings if needed.",
		Command:     "/export file=backup-before-upgrade",
		Optional:    false,
	})
	stepNum++

	// Step 2: Check for package updates
	steps = append(steps, UpgradeStep{
		Step:        stepNum,
		Title:       "Check Available Updates",
		Description: "Check what updates are available for your router.",
		Command:     "/system package update check-for-updates",
		Optional:    false,
	})
	stepNum++

	// Step 3: For major upgrades, special considerations
	if isMajor {
		steps = append(steps, UpgradeStep{
			Step:        stepNum,
			Title:       "Review Breaking Changes",
			Description: "RouterOS " + intToStr(required.Major) + ".x has breaking changes from " + intToStr(current.Major) + ".x. Review the changelog at https://mikrotik.com/download/changelogs before proceeding.",
			Optional:    false,
		})
		stepNum++

		// For 6.x to 7.x upgrade, recommend intermediate step
		if current.Major == 6 && required.Major == 7 {
			steps = append(steps, UpgradeStep{
				Step:        stepNum,
				Title:       "Upgrade to Latest 6.x First (Recommended)",
				Description: "Before upgrading to RouterOS 7.x, it's recommended to upgrade to the latest 6.49.x version first to ensure a smooth transition.",
				Command:     "/system package update set channel=long-term",
				Optional:    true,
			})
			stepNum++
		}
	}

	// Step 4: Download and install update
	steps = append(steps, UpgradeStep{
		Step:        stepNum,
		Title:       "Download and Install Update",
		Description: "Download the update package and install it. The router will reboot automatically.",
		Command:     "/system package update install",
		Optional:    false,
	})
	stepNum++

	// Step 5: Verify version after reboot
	steps = append(steps, UpgradeStep{
		Step:        stepNum,
		Title:       "Verify Upgrade",
		Description: "After the router reboots, verify that the upgrade was successful.",
		Command:     "/system resource print",
		Optional:    false,
	})
	stepNum++

	// Step 6: Install required packages if any
	if len(fc.RequiredPackages) > 0 {
		pkgList := joinStrSlice(fc.RequiredPackages, ", ")
		steps = append(steps, UpgradeStep{
			Step:        stepNum,
			Title:       "Install Required Packages",
			Description: "This feature requires additional packages: " + pkgList + ". Download from MikroTik's download page for your architecture.",
			Optional:    false,
		})
		stepNum++
	}

	// Step 7: Enable feature if needed
	if fc.ID == "container" {
		steps = append(steps, UpgradeStep{
			Step:        stepNum,
			Title:       "Enable Container Feature",
			Description: "Container support must be explicitly enabled and requires a reboot.",
			Command:     "/system/device-mode/update container=yes",
			Optional:    false,
		})
	}

	return steps
}

// buildImpact creates the impact assessment for the upgrade.
func buildImpact(current, required Version, isMajor bool) UpgradeImpact {
	impact := UpgradeImpact{
		RequiresReboot:    true,
		BackupRecommended: true,
		BreakingChanges:   make([]string, 0),
	}

	if isMajor {
		impact.EstimatedDowntime = "5-15 minutes (major version upgrade)"

		// Add known breaking changes for 6.x to 7.x
		if current.Major == 6 && required.Major == 7 {
			impact.BreakingChanges = append(impact.BreakingChanges,
				"Wireless configuration syntax changed significantly",
				"Some scripting functions have new syntax",
				"Container support requires explicit enablement",
				"API paths use /rest/ prefix in REST API",
			)
		}
	} else {
		impact.EstimatedDowntime = "2-5 minutes"
	}

	return impact
}

// buildWarnings generates warnings for the upgrade.
func buildWarnings(current, _ Version, fc *FeatureCompatibility, isMajor bool) []string {
	warnings := make([]string, 0)

	if isMajor {
		warnings = append(warnings,
			"Major version upgrades cannot be easily rolled back",
			"Test in a lab environment if possible before production upgrade",
		)
	}

	// Add feature-specific warnings
	switch fc.ID {
	case "container":
		warnings = append(warnings,
			"Container feature requires ARM64 or x86 architecture",
			"At least 100MB free storage is recommended",
		)
	case "wireguard":
		warnings = append(warnings,
			"WireGuard is only available in RouterOS 7.x",
		)
	case "rest_api":
		warnings = append(warnings,
			"REST API is enabled by default on port 443",
			"Ensure www-ssl service is properly secured",
		)
	}

	// Version-specific warnings
	if current.Major == 6 && current.Minor < 49 {
		warnings = append(warnings,
			"Consider upgrading to 6.49.x (long-term) before jumping to 7.x",
		)
	}

	return warnings
}

// sortRecommendationsByPriority sorts recommendations by priority (Critical first).
func sortRecommendationsByPriority(recs []UpgradeRecommendation) {
	// Simple bubble sort - small list so efficiency doesn't matter
	n := len(recs)
	for i := 0; i < n-1; i++ {
		for j := 0; j < n-i-1; j++ {
			if priorityValue(recs[j].Priority) > priorityValue(recs[j+1].Priority) {
				recs[j], recs[j+1] = recs[j+1], recs[j]
			}
		}
	}
}

// priorityValue returns a numeric value for priority (lower = higher priority).
func priorityValue(p UpgradePriority) int {
	switch p {
	case PriorityCritical:
		return 0
	case PriorityHigh:
		return 1
	case PriorityMedium:
		return 2
	case PriorityLow:
		return 3
	default:
		return 99
	}
}

// intToStr converts an int to string without fmt package.
func intToStr(i int) string {
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

// joinStrSlice joins strings with a separator.
func joinStrSlice(strs []string, sep string) string {
	if len(strs) == 0 {
		return ""
	}
	result := strs[0]
	for i := 1; i < len(strs); i++ {
		result += sep + strs[i]
	}
	return result
}
