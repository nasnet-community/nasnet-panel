package resolver

// This file contains capability-related resolver implementations.
// These are kept separate from schema.resolvers.go to avoid gqlgen overwriting them.

import (
	"context"

	"backend/graph/model"
	"backend/internal/capability"
	"backend/internal/router/compatibility"
)

// RouterCapabilities is the resolver for the routerCapabilities query.
func (r *queryResolver) RouterCapabilities(ctx context.Context, routerID string) (*model.RouterCapabilities, error) {
	if r.CapabilityService == nil {
		return nil, nil // Service not configured
	}

	caps, err := r.CapabilityService.GetCapabilities(ctx, routerID, r.getRouterPort)
	if err != nil {
		return nil, err
	}

	return toGraphQLCapabilities(caps), nil
}

// RefreshCapabilities is the resolver for the refreshCapabilities mutation.
func (r *mutationResolver) RefreshCapabilities(ctx context.Context, routerID string) (*model.RefreshCapabilitiesPayload, error) {
	if r.CapabilityService == nil {
		return &model.RefreshCapabilitiesPayload{
			Errors: []*model.MutationError{{
				Code:    "SERVICE_UNAVAILABLE",
				Message: "Capability service not configured",
			}},
		}, nil
	}

	caps, err := r.CapabilityService.RefreshCapabilities(ctx, routerID, r.getRouterPort)
	if err != nil {
		return &model.RefreshCapabilitiesPayload{
			Errors: []*model.MutationError{{
				Code:    "REFRESH_FAILED",
				Message: err.Error(),
			}},
		}, nil
	}

	return &model.RefreshCapabilitiesPayload{
		Capabilities: toGraphQLCapabilities(caps),
	}, nil
}

// getRouterPort is a placeholder for getting a RouterPort from a router ID.
// This will be implemented when the router connection manager is integrated.
func (r *Resolver) getRouterPort(routerID string) (capability.RouterPort, error) {
	// TODO: Implement router connection manager lookup
	return nil, nil
}

// toGraphQLCapabilities converts internal Capabilities to GraphQL model.
func toGraphQLCapabilities(caps *capability.Capabilities) *model.RouterCapabilities {
	if caps == nil {
		return nil
	}

	// Convert capability entries
	entries := make([]*model.CapabilityEntry, 0, len(caps.Entries))
	for _, entry := range caps.Entries {
		entries = append(entries, &model.CapabilityEntry{
			Capability:  model.Capability(entry.Capability),
			Level:       toGraphQLLevel(entry.Level),
			Description: strPtr(entry.Description),
			Guidance:    strPtr(entry.Guidance),
		})
	}

	// Build VIF requirements and guidance
	vifReq := caps.CheckVIFRequirements()
	vifGuidance := caps.VIFGuidance()

	// Convert guidance steps to GraphQL model
	guidanceSteps := make([]*model.VIFGuidanceStep, 0, len(vifGuidance))
	for _, step := range vifGuidance {
		guidanceSteps = append(guidanceSteps, &model.VIFGuidanceStep{
			Step:          step.Step,
			Title:         step.Title,
			Description:   step.Description,
			Completed:     step.Completed,
			RouterCommand: strPtr(step.RouterCommand),
		})
	}

	// Build version-aware feature support lists
	integration := capability.NewVersionCapabilityIntegration()
	isCHR := detectCHRFromCaps(caps)

	supportedFeatures := integration.GetSupportedFeatures(caps, isCHR)
	unsupportedFeatures := integration.GetUnsupportedFeatures(caps, isCHR)

	supportedList := make([]*model.FeatureSupport, 0, len(supportedFeatures))
	for _, sf := range supportedFeatures {
		supportedList = append(supportedList, convertFeatureSupport(&sf))
	}

	unsupportedList := make([]*model.FeatureSupport, 0, len(unsupportedFeatures))
	for _, uf := range unsupportedFeatures {
		unsupportedList = append(unsupportedList, convertFeatureSupport(&uf))
	}

	// Build RouterOSVersion
	rosVersion := &model.RouterOSVersion{
		Raw:   caps.Software.Version.String(),
		Major: caps.Software.Version.Major,
		Minor: caps.Software.Version.Minor,
		Patch: caps.Software.Version.Patch,
		IsChr: isCHR,
	}
	if caps.Software.Version.Channel != "" {
		rosVersion.Channel = strPtr(caps.Software.Version.Channel)
	}

	return &model.RouterCapabilities{
		Hardware: &model.HardwareInfo{
			Architecture:     caps.Hardware.Architecture,
			Model:            strPtr(caps.Hardware.Model),
			BoardName:        strPtr(caps.Hardware.BoardName),
			TotalMemory:      model.Size(caps.Hardware.TotalMemory),
			AvailableStorage: model.Size(caps.Hardware.AvailableStorage),
			CPUCount:         caps.Hardware.CPUCount,
			HasWirelessChip:  caps.Hardware.HasWirelessChip,
			HasLTEModule:     caps.Hardware.HasLTEModule,
		},
		Software: &model.SoftwareInfo{
			Version:           caps.Software.Version.String(),
			VersionMajor:      caps.Software.Version.Major,
			VersionMinor:      caps.Software.Version.Minor,
			VersionPatch:      intPtrCap(caps.Software.Version.Patch),
			InstalledPackages: caps.Software.InstalledPackages,
			LicenseLevel:      caps.Software.LicenseLevel,
			UpdateChannel:     strPtr(caps.Software.UpdateChannel),
		},
		Container: &model.ContainerInfo{
			PackageInstalled:         caps.Container.PackageInstalled,
			Enabled:                  caps.Container.Enabled,
			RegistryConfigured:       caps.Container.RegistryConfigured,
			StorageAvailable:         model.Size(caps.Container.StorageAvailable),
			SupportsNetworkNamespace: caps.Container.SupportsNetworkNamespace,
			MaxContainers:            intPtrCap(caps.Container.MaxContainers),
		},
		Capabilities:        entries,
		SupportedFeatures:   supportedList,
		UnsupportedFeatures: unsupportedList,
		RouterOSVersion:     rosVersion,
		VifRequirements: &model.VIFRequirements{
			Met:               vifReq.Met,
			RouterOSVersion:   vifReq.RouterOSVersion,
			ContainerPackage:  vifReq.ContainerPackage,
			ContainerEnabled:  vifReq.ContainerEnabled,
			SufficientStorage: vifReq.SufficientStorage,
			NetworkNamespace:  vifReq.NetworkNamespace,
			MissingReasons:    vifReq.MissingReasons,
			GuidanceSteps:     guidanceSteps,
		},
		DetectedAt:   caps.DetectedAt,
		ExpiresAt:    caps.ExpiresAt,
		IsRefreshing: caps.IsRefreshing,
	}
}

// convertFeatureSupport converts capability.FeatureSupportInfo to model.FeatureSupport.
func convertFeatureSupport(sf *capability.FeatureSupportInfo) *model.FeatureSupport {
	level := model.CapabilityLevelNone
	if sf.Supported {
		level = model.CapabilityLevelFull
	}

	result := &model.FeatureSupport{
		FeatureID: sf.FeatureID,
		Name:      getFeatureNameFromID(sf.FeatureID),
		Supported: sf.Supported,
		Level:     level,
	}

	if sf.Reason != "" {
		result.Reason = strPtr(sf.Reason)
	}
	if sf.UpgradeURL != "" {
		result.UpgradeURL = strPtr(sf.UpgradeURL)
	}
	if len(sf.RequiredPkg) > 0 {
		result.RequiredPackages = sf.RequiredPkg
		result.MissingPackages = sf.RequiredPkg
	}

	return result
}

// getFeatureNameFromID converts a feature ID to a human-readable name.
func getFeatureNameFromID(featureID string) string {
	// Try to get name from compatibility matrix
	svc := compatibility.DefaultService
	_ = svc.LoadMatrix()

	fc := svc.GetFeatureCompatibility(featureID)
	if fc != nil && fc.Name != "" {
		return fc.Name
	}

	// Fallback: convert feature_id to "Feature Id"
	if featureID == "" {
		return ""
	}

	result := make([]byte, 0, len(featureID)+5)
	capitalizeNext := true

	for i := 0; i < len(featureID); i++ {
		c := featureID[i]
		if c == '_' {
			result = append(result, ' ')
			capitalizeNext = true
		} else if capitalizeNext {
			if c >= 'a' && c <= 'z' {
				result = append(result, c-32)
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

// detectCHRFromCaps checks if the router is a Cloud Hosted Router (CHR).
func detectCHRFromCaps(caps *capability.Capabilities) bool {
	if caps == nil {
		return false
	}

	boardName := caps.Hardware.BoardName
	modelName := caps.Hardware.Model

	if containsCHR(boardName) || containsCHR(modelName) {
		return true
	}

	arch := caps.Hardware.Architecture
	if (arch == "x86_64" || arch == "x86") && containsCHR(boardName) {
		return true
	}

	return false
}

// containsCHR checks if s contains "CHR" (case-insensitive).
func containsCHR(s string) bool {
	if len(s) < 3 {
		return false
	}
	for i := 0; i <= len(s)-3; i++ {
		c1 := s[i]
		c2 := s[i+1]
		c3 := s[i+2]
		// Convert to uppercase for comparison
		if c1 >= 'a' && c1 <= 'z' {
			c1 -= 32
		}
		if c2 >= 'a' && c2 <= 'z' {
			c2 -= 32
		}
		if c3 >= 'a' && c3 <= 'z' {
			c3 -= 32
		}
		if c1 == 'C' && c2 == 'H' && c3 == 'R' {
			return true
		}
	}
	return false
}

// toGraphQLLevel converts capability.Level to model.CapabilityLevel.
func toGraphQLLevel(level capability.Level) model.CapabilityLevel {
	switch level {
	case capability.LevelNone:
		return model.CapabilityLevelNone
	case capability.LevelBasic:
		return model.CapabilityLevelBasic
	case capability.LevelAdvanced:
		return model.CapabilityLevelAdvanced
	case capability.LevelFull:
		return model.CapabilityLevelFull
	default:
		return model.CapabilityLevelNone
	}
}

// intPtrCap returns a pointer to the int, or nil if zero.
// Named differently from intPtr in scanner.resolvers.go to avoid redeclaration.
func intPtrCap(i int) *int {
	if i == 0 {
		return nil
	}
	return &i
}
