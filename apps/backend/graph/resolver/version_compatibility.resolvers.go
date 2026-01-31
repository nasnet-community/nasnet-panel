package resolver

// This file contains version compatibility-related resolver implementations.
// It implements the GraphQL queries for feature support based on RouterOS version.

import (
	"context"

	"backend/graph/model"
	"backend/internal/capability"
	"backend/internal/router/compatibility"
)

// getVersionIntegration returns the version capability integration service.
func (r *Resolver) getVersionIntegration() *capability.VersionCapabilityIntegration {
	return capability.NewVersionCapabilityIntegration()
}

// IsFeatureSupported is the resolver for the isFeatureSupported query.
func (r *queryResolver) IsFeatureSupported(ctx context.Context, routerID string, featureID string) (*model.FeatureSupport, error) {
	if r.CapabilityService == nil {
		return &model.FeatureSupport{
			FeatureID: featureID,
			Supported: false,
			Reason:    strPtr("Capability service not configured"),
		}, nil
	}

	caps, err := r.CapabilityService.GetCapabilities(ctx, routerID, r.getRouterPort)
	if err != nil {
		return &model.FeatureSupport{
			FeatureID: featureID,
			Supported: false,
			Reason:    strPtr("Failed to get router capabilities: " + err.Error()),
		}, nil
	}

	integration := r.getVersionIntegration()
	isCHR := detectCHR(caps)
	support := integration.GetFeatureSupport(caps, featureID, isCHR)

	return toGraphQLFeatureSupport(support, featureID), nil
}

// SupportedFeatures is the resolver for the supportedFeatures query.
func (r *queryResolver) SupportedFeatures(ctx context.Context, routerID string) ([]*model.FeatureSupport, error) {
	if r.CapabilityService == nil {
		return []*model.FeatureSupport{}, nil
	}

	caps, err := r.CapabilityService.GetCapabilities(ctx, routerID, r.getRouterPort)
	if err != nil {
		return nil, err
	}

	integration := r.getVersionIntegration()
	isCHR := detectCHR(caps)
	supported := integration.GetSupportedFeatures(caps, isCHR)

	result := make([]*model.FeatureSupport, 0, len(supported))
	for _, s := range supported {
		result = append(result, toGraphQLFeatureSupport(&s, s.FeatureID))
	}

	return result, nil
}

// UnsupportedFeatures is the resolver for the unsupportedFeatures query.
func (r *queryResolver) UnsupportedFeatures(ctx context.Context, routerID string) ([]*model.FeatureSupport, error) {
	if r.CapabilityService == nil {
		return []*model.FeatureSupport{}, nil
	}

	caps, err := r.CapabilityService.GetCapabilities(ctx, routerID, r.getRouterPort)
	if err != nil {
		return nil, err
	}

	integration := r.getVersionIntegration()
	isCHR := detectCHR(caps)
	unsupported := integration.GetUnsupportedFeatures(caps, isCHR)

	result := make([]*model.FeatureSupport, 0, len(unsupported))
	for _, u := range unsupported {
		result = append(result, toGraphQLFeatureSupport(&u, u.FeatureID))
	}

	return result, nil
}

// CompatibilityMatrix is the resolver for the compatibilityMatrix query.
func (r *queryResolver) CompatibilityMatrix(ctx context.Context) ([]*model.FeatureCompatibilityInfo, error) {
	svc := compatibility.DefaultService
	if err := svc.LoadMatrix(); err != nil {
		return nil, err
	}

	matrix := svc.GetMatrix()
	if matrix == nil {
		return []*model.FeatureCompatibilityInfo{}, nil
	}

	result := make([]*model.FeatureCompatibilityInfo, 0, len(matrix.Features))
	for id, fc := range matrix.Features {
		info := &model.FeatureCompatibilityInfo{
			FeatureID:        id,
			Name:             fc.Name,
			MinVersion:       fc.VersionRange.Min,
			RequiredPackages: fc.RequiredPackages,
			DependsOn:        fc.DependsOn,
		}

		if fc.VersionRange.Max != "" {
			info.MaxVersion = strPtr(fc.VersionRange.Max)
		}

		if fc.VersionRangeCHR != nil && fc.VersionRangeCHR.Min != "" {
			info.MinVersionChr = strPtr(fc.VersionRangeCHR.Min)
		}

		if fc.UpgradeURL != "" {
			info.UpgradeURL = strPtr(fc.UpgradeURL)
		}

		// Ensure slices are not nil for GraphQL
		if info.RequiredPackages == nil {
			info.RequiredPackages = []string{}
		}
		if info.DependsOn == nil {
			info.DependsOn = []string{}
		}

		result = append(result, info)
	}

	return result, nil
}

// toGraphQLFeatureSupport converts internal FeatureSupportInfo to GraphQL model.
func toGraphQLFeatureSupport(support *capability.FeatureSupportInfo, featureID string) *model.FeatureSupport {
	if support == nil {
		return &model.FeatureSupport{
			FeatureID: featureID,
			Supported: false,
			Level:     model.CapabilityLevelNone,
		}
	}

	// Get feature name from compatibility matrix
	name := getFeatureName(featureID)

	// Determine level based on support
	level := model.CapabilityLevelNone
	if support.Supported {
		level = model.CapabilityLevelFull
	}

	// Get required version
	svc := compatibility.DefaultService
	requiredVersion := svc.GetVersionRequirement(featureID, false)

	result := &model.FeatureSupport{
		FeatureID:       support.FeatureID,
		Name:            name,
		Supported:       support.Supported,
		Level:           level,
		RequiredVersion: strPtr(requiredVersion),
	}

	if support.Reason != "" {
		result.Reason = strPtr(support.Reason)
	}

	if support.UpgradeURL != "" {
		result.UpgradeURL = strPtr(support.UpgradeURL)
	}

	if len(support.RequiredPkg) > 0 {
		result.RequiredPackages = support.RequiredPkg
		result.MissingPackages = support.RequiredPkg
	}

	return result
}

// getFeatureName returns a human-readable name for a feature ID.
func getFeatureName(featureID string) string {
	svc := compatibility.DefaultService
	_ = svc.LoadMatrix()

	fc := svc.GetFeatureCompatibility(featureID)
	if fc != nil && fc.Name != "" {
		return fc.Name
	}

	// Fallback: convert feature ID to title case
	return featureIDToName(featureID)
}

// featureIDToName converts a feature ID like "rest_api" to "Rest Api".
func featureIDToName(id string) string {
	if id == "" {
		return ""
	}

	result := make([]byte, 0, len(id)+5)
	capitalizeNext := true

	for i := 0; i < len(id); i++ {
		c := id[i]
		if c == '_' {
			result = append(result, ' ')
			capitalizeNext = true
		} else if capitalizeNext {
			if c >= 'a' && c <= 'z' {
				result = append(result, c-32) // Uppercase
			} else {
				result = append(result, c)
			}
			capitalizeNext = false
		} else {
			result = append(result, c)
		}
	}

	return string(result)
}

// detectCHR checks if the router is a Cloud Hosted Router (CHR).
func detectCHR(caps *capability.Capabilities) bool {
	if caps == nil {
		return false
	}

	// CHR can be detected by:
	// 1. Board name containing "CHR"
	// 2. Architecture being "x86_64" or "x86" (common for CHR)
	// 3. Model field containing "CHR"
	boardName := caps.Hardware.BoardName
	model := caps.Hardware.Model

	if containsIgnoreCase(boardName, "CHR") || containsIgnoreCase(model, "CHR") {
		return true
	}

	// x86 architecture with specific patterns often indicates CHR
	arch := caps.Hardware.Architecture
	if (arch == "x86_64" || arch == "x86") && containsIgnoreCase(boardName, "x86") {
		return true
	}

	return false
}

// containsIgnoreCase checks if s contains substr (case-insensitive).
func containsIgnoreCase(s, substr string) bool {
	if len(substr) == 0 {
		return true
	}
	if len(s) < len(substr) {
		return false
	}

	sLower := toLowerASCII(s)
	substrLower := toLowerASCII(substr)

	for i := 0; i <= len(sLower)-len(substrLower); i++ {
		if sLower[i:i+len(substrLower)] == substrLower {
			return true
		}
	}
	return false
}

// toLowerASCII converts ASCII letters to lowercase.
func toLowerASCII(s string) string {
	result := make([]byte, len(s))
	for i := 0; i < len(s); i++ {
		c := s[i]
		if c >= 'A' && c <= 'Z' {
			result[i] = c + 32
		} else {
			result[i] = c
		}
	}
	return string(result)
}

// UpgradeRecommendation is the resolver for the upgradeRecommendation query.
func (r *queryResolver) UpgradeRecommendation(ctx context.Context, routerID string, featureID string) (*model.UpgradeRecommendation, error) {
	if r.CapabilityService == nil {
		return nil, nil
	}

	caps, err := r.CapabilityService.GetCapabilities(ctx, routerID, r.getRouterPort)
	if err != nil {
		return nil, err
	}

	// Get version requirement for the feature
	svc := compatibility.DefaultService
	if err := svc.LoadMatrix(); err != nil {
		return nil, err
	}

	isCHR := detectCHR(caps)
	requiredVersion := svc.GetVersionRequirement(featureID, isCHR)

	// If feature is already supported, no upgrade needed
	integration := r.getVersionIntegration()
	support := integration.GetFeatureSupport(caps, featureID, isCHR)
	if support != nil && support.Supported {
		return nil, nil
	}

	// Build upgrade recommendation
	currentVersion := caps.Software.Version.String()
	return &model.UpgradeRecommendation{
		FeatureID:       featureID,
		FeatureName:     getFeatureName(featureID),
		CurrentVersion:  currentVersion,
		RequiredVersion: requiredVersion,
		IsMajorUpgrade:  isMajorUpgrade(currentVersion, requiredVersion),
		Priority:        model.UpgradePriorityMedium,
	}, nil
}

// UpgradeRecommendations is the resolver for the upgradeRecommendations query.
func (r *queryResolver) UpgradeRecommendations(ctx context.Context, routerID string) ([]*model.UpgradeRecommendation, error) {
	if r.CapabilityService == nil {
		return []*model.UpgradeRecommendation{}, nil
	}

	caps, err := r.CapabilityService.GetCapabilities(ctx, routerID, r.getRouterPort)
	if err != nil {
		return nil, err
	}

	// Get all unsupported features and generate recommendations for each
	integration := r.getVersionIntegration()
	isCHR := detectCHR(caps)
	unsupported := integration.GetUnsupportedFeatures(caps, isCHR)

	svc := compatibility.DefaultService
	_ = svc.LoadMatrix()

	currentVersion := caps.Software.Version.String()
	recommendations := make([]*model.UpgradeRecommendation, 0)
	for _, u := range unsupported {
		requiredVersion := svc.GetVersionRequirement(u.FeatureID, isCHR)
		if requiredVersion != "" {
			recommendations = append(recommendations, &model.UpgradeRecommendation{
				FeatureID:       u.FeatureID,
				FeatureName:     getFeatureName(u.FeatureID),
				CurrentVersion:  currentVersion,
				RequiredVersion: requiredVersion,
				IsMajorUpgrade:  isMajorUpgrade(currentVersion, requiredVersion),
				Priority:        model.UpgradePriorityMedium,
			})
		}
	}

	return recommendations, nil
}

// isMajorUpgrade checks if upgrading from current to required is a major version upgrade.
func isMajorUpgrade(current, required string) bool {
	if len(current) == 0 || len(required) == 0 {
		return false
	}
	// Simple check: compare first digit (major version)
	return current[0] != required[0]
}
