package capability

import (
	"testing"

	"backend/internal/router/compatibility"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestConvertToCompatibilityVersion(t *testing.T) {
	rosv := RouterOSVersion{
		Major:   7,
		Minor:   13,
		Patch:   2,
		Channel: "stable",
		Raw:     "7.13.2 (stable)",
	}

	cv := ConvertToCompatibilityVersion(rosv)

	assert.Equal(t, 7, cv.Major)
	assert.Equal(t, 13, cv.Minor)
	assert.Equal(t, 2, cv.Patch)
	assert.Equal(t, "stable", cv.Channel)
}

func TestConvertFromCompatibilityVersion(t *testing.T) {
	cv := compatibility.Version{
		Major:   6,
		Minor:   49,
		Patch:   10,
		Channel: "long-term",
	}

	rosv := ConvertFromCompatibilityVersion(cv)

	assert.Equal(t, 6, rosv.Major)
	assert.Equal(t, 49, rosv.Minor)
	assert.Equal(t, 10, rosv.Patch)
	assert.Equal(t, "long-term", rosv.Channel)
	assert.NotEmpty(t, rosv.Raw)
}

func TestVersionCapabilityIntegration_GetFeatureSupport(t *testing.T) {
	integration := NewVersionCapabilityIntegration()

	t.Run("REST API supported on 7.13", func(t *testing.T) {
		caps := NewCapabilities()
		caps.Software.Version = RouterOSVersion{Major: 7, Minor: 13, Patch: 2}

		support := integration.GetFeatureSupport(caps, "rest_api", false)

		require.NotNil(t, support)
		assert.Equal(t, "rest_api", support.FeatureID)
		assert.True(t, support.Supported)
		assert.Empty(t, support.Reason)
	})

	t.Run("REST API not supported on 6.49", func(t *testing.T) {
		caps := NewCapabilities()
		caps.Software.Version = RouterOSVersion{Major: 6, Minor: 49, Patch: 10}

		support := integration.GetFeatureSupport(caps, "rest_api", false)

		require.NotNil(t, support)
		assert.False(t, support.Supported)
		assert.Contains(t, support.Reason, "7.1")
	})

	t.Run("Container with missing package", func(t *testing.T) {
		caps := NewCapabilities()
		caps.Software.Version = RouterOSVersion{Major: 7, Minor: 13, Patch: 2}
		caps.Software.InstalledPackages = []string{"system", "routeros"} // no container

		support := integration.GetFeatureSupport(caps, "container", false)

		require.NotNil(t, support)
		assert.False(t, support.Supported)
		assert.Contains(t, support.Reason, "Missing required packages")
	})

	t.Run("Container with package installed", func(t *testing.T) {
		caps := NewCapabilities()
		caps.Software.Version = RouterOSVersion{Major: 7, Minor: 13, Patch: 2}
		caps.Software.InstalledPackages = []string{"system", "routeros", "container"}

		support := integration.GetFeatureSupport(caps, "container", false)

		require.NotNil(t, support)
		assert.True(t, support.Supported)
	})

	t.Run("Container CHR requires 7.6", func(t *testing.T) {
		caps := NewCapabilities()
		caps.Software.Version = RouterOSVersion{Major: 7, Minor: 5, Patch: 0}
		caps.Software.InstalledPackages = []string{"container"}

		support := integration.GetFeatureSupport(caps, "container", true) // CHR

		require.NotNil(t, support)
		assert.False(t, support.Supported)
	})
}

func TestVersionCapabilityIntegration_GetSupportedFeatures(t *testing.T) {
	integration := NewVersionCapabilityIntegration()

	t.Run("RouterOS 7.13 supports many features", func(t *testing.T) {
		caps := NewCapabilities()
		caps.Software.Version = RouterOSVersion{Major: 7, Minor: 13, Patch: 2}
		caps.Software.InstalledPackages = []string{
			"system", "routeros", "container", "wireguard",
		}

		supported := integration.GetSupportedFeatures(caps, false)

		require.NotEmpty(t, supported)

		// Check that expected features are supported
		featureIDs := make(map[string]bool)
		for _, f := range supported {
			featureIDs[f.FeatureID] = true
		}

		assert.True(t, featureIDs["rest_api"], "Should support REST API")
		assert.True(t, featureIDs["binary_api"], "Should support Binary API")
		assert.True(t, featureIDs["container"], "Should support Container")
		assert.True(t, featureIDs["wireguard"], "Should support WireGuard")
	})

	t.Run("RouterOS 6.40 has limited features", func(t *testing.T) {
		caps := NewCapabilities()
		caps.Software.Version = RouterOSVersion{Major: 6, Minor: 40, Patch: 0}
		caps.Software.InstalledPackages = []string{"system", "routeros"}

		supported := integration.GetSupportedFeatures(caps, false)

		featureIDs := make(map[string]bool)
		for _, f := range supported {
			featureIDs[f.FeatureID] = true
		}

		assert.True(t, featureIDs["binary_api"], "Should support Binary API")
		assert.False(t, featureIDs["rest_api"], "Should NOT support REST API")
		assert.False(t, featureIDs["container"], "Should NOT support Container")
	})
}

func TestVersionCapabilityIntegration_GetUnsupportedFeatures(t *testing.T) {
	integration := NewVersionCapabilityIntegration()

	t.Run("RouterOS 6.40 cannot use many features", func(t *testing.T) {
		caps := NewCapabilities()
		caps.Software.Version = RouterOSVersion{Major: 6, Minor: 40, Patch: 0}
		caps.Software.InstalledPackages = []string{"system", "routeros"}

		unsupported := integration.GetUnsupportedFeatures(caps, false)

		require.NotEmpty(t, unsupported)

		featureIDs := make(map[string]bool)
		for _, f := range unsupported {
			featureIDs[f.FeatureID] = true
		}

		assert.True(t, featureIDs["rest_api"], "REST API should be unsupported")
		assert.True(t, featureIDs["container"], "Container should be unsupported")
		assert.True(t, featureIDs["wireguard"], "WireGuard should be unsupported")
	})

	t.Run("Missing packages show as unsupported", func(t *testing.T) {
		caps := NewCapabilities()
		caps.Software.Version = RouterOSVersion{Major: 7, Minor: 13, Patch: 2}
		caps.Software.InstalledPackages = []string{"system", "routeros"} // no container

		unsupported := integration.GetUnsupportedFeatures(caps, false)

		// Container should appear as unsupported due to missing package
		var containerFound bool
		for _, f := range unsupported {
			if f.FeatureID == "container" {
				containerFound = true
				assert.Contains(t, f.Reason, "Missing required packages")
			}
		}
		assert.True(t, containerFound, "Container should be in unsupported list")
	})
}

func TestVersionCapabilityIntegration_EnhanceCapabilities(t *testing.T) {
	integration := NewVersionCapabilityIntegration()

	t.Run("Enhances capabilities for RouterOS 7.13", func(t *testing.T) {
		caps := NewCapabilities()
		caps.Software.Version = RouterOSVersion{Major: 7, Minor: 13, Patch: 2}
		caps.Software.InstalledPackages = []string{"container", "wireguard"}
		caps.Hardware.HasWirelessChip = true

		integration.EnhanceCapabilities(caps, false)

		assert.Equal(t, LevelFull, caps.GetLevel(CapabilityRESTAPI))
		assert.Equal(t, LevelFull, caps.GetLevel(CapabilityBinaryAPI))
		assert.Equal(t, LevelFull, caps.GetLevel(CapabilityACME))
		assert.Equal(t, LevelFull, caps.GetLevel(CapabilityWiFiWave2))
	})

	t.Run("Sets appropriate levels for RouterOS 6.49", func(t *testing.T) {
		caps := NewCapabilities()
		caps.Software.Version = RouterOSVersion{Major: 6, Minor: 49, Patch: 10}
		caps.Software.InstalledPackages = []string{"system"}

		integration.EnhanceCapabilities(caps, false)

		assert.Equal(t, LevelNone, caps.GetLevel(CapabilityRESTAPI))
		// 6.49 has API-SSL support (6.43+), so it gets LevelFull
		assert.Equal(t, LevelFull, caps.GetLevel(CapabilityBinaryAPI))
		assert.Equal(t, LevelNone, caps.GetLevel(CapabilityACME))
	})

	t.Run("Sets Advanced level for RouterOS 6.42 (no SSL)", func(t *testing.T) {
		caps := NewCapabilities()
		caps.Software.Version = RouterOSVersion{Major: 6, Minor: 42, Patch: 0}
		caps.Software.InstalledPackages = []string{"system"}

		integration.EnhanceCapabilities(caps, false)

		assert.Equal(t, LevelNone, caps.GetLevel(CapabilityRESTAPI))
		// 6.42 doesn't have API-SSL (requires 6.43+), so it gets LevelAdvanced
		assert.Equal(t, LevelAdvanced, caps.GetLevel(CapabilityBinaryAPI))
	})

	t.Run("Handles CHR flag correctly", func(t *testing.T) {
		caps := NewCapabilities()
		caps.Software.Version = RouterOSVersion{Major: 7, Minor: 5, Patch: 0}
		caps.Software.InstalledPackages = []string{"container"}

		// CHR requires 7.6+ for container
		integration.EnhanceCapabilities(caps, true)

		// Should still have REST API
		assert.Equal(t, LevelFull, caps.GetLevel(CapabilityRESTAPI))
	})
}

func TestGetMissingPackages(t *testing.T) {
	tests := []struct {
		name      string
		installed []string
		required  []string
		expected  []string
	}{
		{
			name:      "no missing packages",
			installed: []string{"system", "routeros", "container"},
			required:  []string{"container"},
			expected:  []string{},
		},
		{
			name:      "one missing package",
			installed: []string{"system", "routeros"},
			required:  []string{"container"},
			expected:  []string{"container"},
		},
		{
			name:      "multiple missing packages",
			installed: []string{"system"},
			required:  []string{"container", "wireguard"},
			expected:  []string{"container", "wireguard"},
		},
		{
			name:      "partial match",
			installed: []string{"system", "container"},
			required:  []string{"container", "wireguard"},
			expected:  []string{"wireguard"},
		},
		{
			name:      "empty required",
			installed: []string{"system", "routeros"},
			required:  []string{},
			expected:  []string{},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := getMissingPackages(tt.installed, tt.required)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestJoinStrings(t *testing.T) {
	tests := []struct {
		name     string
		strs     []string
		sep      string
		expected string
	}{
		{"empty slice", []string{}, ", ", ""},
		{"single item", []string{"one"}, ", ", "one"},
		{"two items", []string{"one", "two"}, ", ", "one, two"},
		{"three items", []string{"a", "b", "c"}, "-", "a-b-c"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := joinStrings(tt.strs, tt.sep)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestNewVersionCapabilityIntegrationWithService(t *testing.T) {
	customSvc := compatibility.NewService()
	integration := NewVersionCapabilityIntegrationWithService(customSvc)

	require.NotNil(t, integration)
	assert.Equal(t, customSvc, integration.compatSvc)
}
