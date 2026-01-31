//go:build integration

package compatibility

import (
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// Integration tests for version compatibility against CHR Docker.
// Run with: go test -tags=integration ./internal/router/compatibility/...
//
// Prerequisites:
//   docker-compose -f docker-compose.test.yml up -d
//
// These tests require a running CHR Docker container configured via fixtures/chr-init.rsc.

// skipIfNoCHR skips the test if CHR Docker is not available.
func skipIfNoCHR(t *testing.T) {
	if os.Getenv("CHR_INTEGRATION") != "1" {
		t.Skip("Skipping CHR integration test. Set CHR_INTEGRATION=1 to run.")
	}
}

// TestIntegration_VersionParsing tests version parsing against CHR version strings.
func TestIntegration_VersionParsing(t *testing.T) {
	// Test parsing various CHR version string formats
	chrVersions := []struct {
		raw      string
		expected Version
	}{
		{
			raw:      "7.12 (stable)",
			expected: Version{Major: 7, Minor: 12, Patch: 0, Channel: "stable"},
		},
		{
			raw:      "7.13.2 (stable)",
			expected: Version{Major: 7, Minor: 13, Patch: 2, Channel: "stable"},
		},
		{
			raw:      "6.49.10 (long-term)",
			expected: Version{Major: 6, Minor: 49, Patch: 10, Channel: "long-term"},
		},
		{
			raw:      "7.14beta1",
			expected: Version{Major: 7, Minor: 14, Patch: 0, Channel: "beta"},
		},
		{
			raw:      "7.14rc1",
			expected: Version{Major: 7, Minor: 14, Patch: 0, Channel: "rc"},
		},
	}

	for _, tc := range chrVersions {
		t.Run(tc.raw, func(t *testing.T) {
			v, err := ParseVersion(tc.raw)
			require.NoError(t, err)
			assert.Equal(t, tc.expected.Major, v.Major)
			assert.Equal(t, tc.expected.Minor, v.Minor)
			assert.Equal(t, tc.expected.Patch, v.Patch)
			if tc.expected.Channel != "" {
				assert.Equal(t, tc.expected.Channel, v.Channel)
			}
		})
	}
}

// TestIntegration_CHR712FeatureSupport tests feature support for CHR 7.12.
func TestIntegration_CHR712FeatureSupport(t *testing.T) {
	svc := NewService()

	// CHR 7.12 version
	v, err := ParseVersion("7.12 (stable)")
	require.NoError(t, err)

	t.Run("REST API is supported", func(t *testing.T) {
		assert.True(t, svc.IsFeatureSupported("rest_api", v, true), "REST API should be supported on CHR 7.12")
	})

	t.Run("Binary API is supported", func(t *testing.T) {
		assert.True(t, svc.IsFeatureSupported("binary_api", v, true), "Binary API should be supported on CHR 7.12")
	})

	t.Run("API-SSL is supported", func(t *testing.T) {
		assert.True(t, svc.IsFeatureSupported("api_ssl", v, true), "API-SSL should be supported on CHR 7.12")
	})

	t.Run("Container requires 7.6+ for CHR", func(t *testing.T) {
		assert.True(t, svc.IsFeatureSupported("container", v, true), "Container should be supported on CHR 7.12 (>= 7.6)")
	})

	t.Run("WireGuard is supported", func(t *testing.T) {
		assert.True(t, svc.IsFeatureSupported("wireguard", v, true), "WireGuard should be supported on CHR 7.12")
	})

	t.Run("ACME is supported", func(t *testing.T) {
		assert.True(t, svc.IsFeatureSupported("acme", v, true), "ACME should be supported on CHR 7.12 (>= 7.10)")
	})

	t.Run("WiFi Wave2 is supported", func(t *testing.T) {
		// WiFi Wave2 requires 7.13+, so not supported on 7.12
		assert.False(t, svc.IsFeatureSupported("wifiwave2", v, true), "WiFi Wave2 should NOT be supported on CHR 7.12 (<7.13)")
	})
}

// TestIntegration_CHR76FeatureSupport tests feature support for CHR 7.6 boundary.
func TestIntegration_CHR76FeatureSupport(t *testing.T) {
	svc := NewService()

	// CHR 7.6 - container minimum for CHR
	v76, err := ParseVersion("7.6")
	require.NoError(t, err)

	// CHR 7.5 - just below container threshold
	v75, err := ParseVersion("7.5")
	require.NoError(t, err)

	t.Run("Container supported on CHR 7.6", func(t *testing.T) {
		assert.True(t, svc.IsFeatureSupported("container", v76, true))
	})

	t.Run("Container NOT supported on CHR 7.5", func(t *testing.T) {
		assert.False(t, svc.IsFeatureSupported("container", v75, true))
	})

	t.Run("Container supported on physical 7.4", func(t *testing.T) {
		v74, _ := ParseVersion("7.4")
		assert.True(t, svc.IsFeatureSupported("container", v74, false)) // Physical, not CHR
	})
}

// TestIntegration_FieldMappingCHR tests field mappings for CHR versions.
func TestIntegration_FieldMappingCHR(t *testing.T) {
	svc := NewService()

	// CHR 7.12 uses v7 field names
	v712, err := ParseVersion("7.12 (stable)")
	require.NoError(t, err)

	t.Run("ethernet name field on CHR 7.12", func(t *testing.T) {
		field := svc.GetFieldMapping("interface.ethernet", "name", v712)
		assert.Equal(t, "name", field)
	})

	t.Run("ethernet mtu field on CHR 7.12", func(t *testing.T) {
		field := svc.GetFieldMapping("interface.ethernet", "mtu", v712)
		assert.Equal(t, "l2mtu", field) // v7 uses l2mtu
	})
}

// TestIntegration_PathMappingCHR tests path mappings for CHR versions.
func TestIntegration_PathMappingCHR(t *testing.T) {
	svc := NewService()

	v712, err := ParseVersion("7.12 (stable)")
	require.NoError(t, err)

	v649, err := ParseVersion("6.49.10 (long-term)")
	require.NoError(t, err)

	t.Run("ip.address path on CHR 7.12", func(t *testing.T) {
		path := svc.GetPathMapping("ip.address", v712)
		assert.Equal(t, "/ip/address", path) // REST-style for v7
	})

	t.Run("ip.address path on ROS 6.49", func(t *testing.T) {
		path := svc.GetPathMapping("ip.address", v649)
		assert.Equal(t, "/ip address", path) // CLI-style for v6
	})

	t.Run("interface.ethernet path on CHR 7.12", func(t *testing.T) {
		path := svc.GetPathMapping("interface.ethernet", v712)
		assert.Equal(t, "/interface/ethernet", path)
	})
}

// TestIntegration_UpgradeRecommendationsCHR tests upgrade recommendations for CHR.
func TestIntegration_UpgradeRecommendationsCHR(t *testing.T) {
	svc := NewService().(*service)

	// CHR 7.5 - needs upgrade for container
	v75, err := ParseVersion("7.5")
	require.NoError(t, err)

	t.Run("Container upgrade recommendation for CHR 7.5", func(t *testing.T) {
		rec := svc.GetUpgradeRecommendation("container", v75, true)
		require.NotNil(t, rec)
		assert.Equal(t, "container", rec.FeatureID)
		assert.Equal(t, "7.5.0", rec.CurrentVersion)
		assert.Equal(t, "7.6", rec.RequiredVersion) // CHR requires 7.6+
		assert.False(t, rec.IsMajorUpgrade)         // 7.5 to 7.6 is minor
		assert.NotEmpty(t, rec.Steps)
		assert.True(t, rec.Impact.RequiresReboot)
	})

	// CHR 6.49 - needs major upgrade for most v7 features
	v649, err := ParseVersion("6.49.10")
	require.NoError(t, err)

	t.Run("REST API upgrade recommendation for CHR 6.49", func(t *testing.T) {
		rec := svc.GetUpgradeRecommendation("rest_api", v649, true)
		require.NotNil(t, rec)
		assert.Equal(t, "rest_api", rec.FeatureID)
		assert.True(t, rec.IsMajorUpgrade) // 6.x to 7.x
		assert.NotEmpty(t, rec.Impact.BreakingChanges)
		assert.Contains(t, rec.Warnings, "Major version upgrades cannot be easily rolled back")
	})

	// Already supported feature - no recommendation
	v713, err := ParseVersion("7.13.2")
	require.NoError(t, err)

	t.Run("No recommendation for supported feature", func(t *testing.T) {
		rec := svc.GetUpgradeRecommendation("rest_api", v713, true)
		assert.Nil(t, rec, "Should not return recommendation for supported feature")
	})
}

// TestIntegration_AllUpgradeRecommendationsCHR tests getting all recommendations for CHR.
func TestIntegration_AllUpgradeRecommendationsCHR(t *testing.T) {
	svc := NewService().(*service)

	// CHR 6.49 needs many upgrades
	v649, err := ParseVersion("6.49.10")
	require.NoError(t, err)

	recs := svc.GetAllUpgradeRecommendations(v649, true)

	t.Run("Multiple recommendations for CHR 6.49", func(t *testing.T) {
		assert.NotEmpty(t, recs)

		featureIDs := make(map[string]bool)
		for _, rec := range recs {
			featureIDs[rec.FeatureID] = true
			t.Logf("Recommendation: %s -> %s (major: %v, priority: %s)",
				rec.FeatureID, rec.RequiredVersion, rec.IsMajorUpgrade, rec.Priority)
		}

		// Should recommend REST API, Container, WireGuard, etc.
		assert.True(t, featureIDs["rest_api"], "Should recommend REST API upgrade")
		assert.True(t, featureIDs["wireguard"], "Should recommend WireGuard upgrade")
	})

	// CHR 7.13 has few/no upgrades needed
	v713, err := ParseVersion("7.13.2")
	require.NoError(t, err)

	recs713 := svc.GetAllUpgradeRecommendations(v713, true)

	t.Run("Fewer recommendations for CHR 7.13", func(t *testing.T) {
		assert.Less(t, len(recs713), len(recs),
			"CHR 7.13 should need fewer upgrades than 6.49")
		t.Logf("CHR 6.49 recommendations: %d, CHR 7.13 recommendations: %d",
			len(recs), len(recs713))
	})
}

// TestIntegration_FeatureSupportDetails tests detailed feature support info.
func TestIntegration_FeatureSupportDetails(t *testing.T) {
	svc := NewService()

	v649, err := ParseVersion("6.49.10")
	require.NoError(t, err)

	v713, err := ParseVersion("7.13.2")
	require.NoError(t, err)

	t.Run("REST API support details for 6.49", func(t *testing.T) {
		support := svc.GetFeatureSupport("rest_api", v649, false)
		assert.False(t, support.Supported)
		assert.Contains(t, support.Reason, "7.1")
		assert.NotEmpty(t, support.UpgradeURL)
	})

	t.Run("REST API support details for 7.13", func(t *testing.T) {
		support := svc.GetFeatureSupport("rest_api", v713, false)
		assert.True(t, support.Supported)
		assert.Empty(t, support.Reason)
	})

	t.Run("Container support details for CHR 7.5", func(t *testing.T) {
		v75, _ := ParseVersion("7.5")
		support := svc.GetFeatureSupport("container", v75, true) // CHR
		assert.False(t, support.Supported)
		assert.Contains(t, support.Reason, "7.6") // CHR needs 7.6+
	})
}

// TestIntegration_CompatibilityMatrixContents tests the matrix contents are valid.
func TestIntegration_CompatibilityMatrixContents(t *testing.T) {
	svc := NewService()
	err := svc.LoadMatrix()
	require.NoError(t, err)

	matrix := svc.GetMatrix()
	require.NotNil(t, matrix)

	t.Run("Has required features", func(t *testing.T) {
		requiredFeatures := []string{
			"rest_api",
			"binary_api",
			"api_ssl",
			"container",
			"wireguard",
			"zerotier",
			"acme",
		}

		for _, fid := range requiredFeatures {
			fc := svc.GetFeatureCompatibility(fid)
			require.NotNil(t, fc, "Missing feature: %s", fid)
			assert.NotEmpty(t, fc.Name, "Feature %s missing name", fid)
			assert.NotEmpty(t, fc.VersionRange.Min, "Feature %s missing min version", fid)
		}
	})

	t.Run("Has field mappings", func(t *testing.T) {
		assert.NotEmpty(t, matrix.FieldMappings, "Should have field mappings")

		// Check interface.ethernet mappings
		ethMappings, ok := matrix.FieldMappings["interface.ethernet"]
		require.True(t, ok, "Should have interface.ethernet field mappings")
		assert.NotEmpty(t, ethMappings.Fields)
	})

	t.Run("Has path mappings", func(t *testing.T) {
		assert.NotEmpty(t, matrix.PathMappings, "Should have path mappings")

		// Check ip.address path mapping
		ipAddrMapping, ok := matrix.PathMappings["ip.address"]
		require.True(t, ok, "Should have ip.address path mapping")
		assert.NotEmpty(t, ipAddrMapping.V7Path)
		assert.NotEmpty(t, ipAddrMapping.V6Path)
	})
}

// TestIntegration_VersionRequirementStrings tests human-readable requirement strings.
func TestIntegration_VersionRequirementStrings(t *testing.T) {
	svc := NewService()

	tests := []struct {
		featureID string
		isCHR     bool
		contains  string
	}{
		{"rest_api", false, "7.1"},
		{"binary_api", false, "6.40"},
		{"container", false, "7.4"},
		{"container", true, "7.6"}, // CHR specific
		{"wireguard", false, "7.0"},
		{"acme", false, "7.10"},
	}

	for _, tc := range tests {
		name := tc.featureID
		if tc.isCHR {
			name += " (CHR)"
		}
		t.Run(name, func(t *testing.T) {
			req := svc.GetVersionRequirement(tc.featureID, tc.isCHR)
			assert.Contains(t, req, tc.contains)
		})
	}
}
