package compatibility

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestServiceLoadMatrix(t *testing.T) {
	svc := NewService()
	err := svc.LoadMatrix()
	require.NoError(t, err)

	matrix := svc.GetMatrix()
	require.NotNil(t, matrix)

	// Verify matrix metadata
	assert.Equal(t, "1.0", matrix.Version)
	assert.NotEmpty(t, matrix.Updated)

	// Verify features were loaded
	assert.NotEmpty(t, matrix.Features)
	assert.Contains(t, matrix.Features, "rest_api")
	assert.Contains(t, matrix.Features, "container")
	assert.Contains(t, matrix.Features, "wireguard")
}

func TestServiceGetFeatureCompatibility(t *testing.T) {
	svc := NewService()

	// Test known feature
	restAPI := svc.GetFeatureCompatibility("rest_api")
	require.NotNil(t, restAPI)
	assert.Equal(t, "rest_api", restAPI.ID)
	assert.Equal(t, "REST API", restAPI.Name)
	assert.Equal(t, "7.1", restAPI.VersionRange.Min)

	// Test CHR-specific version range
	container := svc.GetFeatureCompatibility("container")
	require.NotNil(t, container)
	assert.Equal(t, "7.4", container.VersionRange.Min)
	require.NotNil(t, container.VersionRangeCHR)
	assert.Equal(t, "7.6", container.VersionRangeCHR.Min)

	// Test unknown feature
	unknown := svc.GetFeatureCompatibility("nonexistent")
	assert.Nil(t, unknown)
}

func TestServiceIsFeatureSupported(t *testing.T) {
	svc := NewService()

	tests := []struct {
		name      string
		featureID string
		version   string
		isCHR     bool
		expected  bool
	}{
		// REST API (7.1+)
		{"REST API on 7.13", "rest_api", "7.13.2", false, true},
		{"REST API on 7.1", "rest_api", "7.1.0", false, true},
		{"REST API on 7.0", "rest_api", "7.0.0", false, false},
		{"REST API on 6.49", "rest_api", "6.49.10", false, false},

		// Binary API (6.40+)
		{"Binary API on 7.13", "binary_api", "7.13.2", false, true},
		{"Binary API on 6.49", "binary_api", "6.49.10", false, true},
		{"Binary API on 6.40", "binary_api", "6.40.0", false, true},
		{"Binary API on 6.39", "binary_api", "6.39.0", false, false},

		// Container (7.4+ / CHR 7.6+)
		{"Container on 7.6 physical", "container", "7.6.0", false, true},
		{"Container on 7.4 physical", "container", "7.4.0", false, true},
		{"Container on 7.3 physical", "container", "7.3.0", false, false},
		{"Container on 7.6 CHR", "container", "7.6.0", true, true},
		{"Container on 7.5 CHR", "container", "7.5.0", true, false}, // CHR needs 7.6+
		{"Container on 7.4 CHR", "container", "7.4.0", true, false},

		// WireGuard (7.0+)
		{"WireGuard on 7.0", "wireguard", "7.0.0", false, true},
		{"WireGuard on 6.49", "wireguard", "6.49.10", false, false},

		// Unknown feature
		{"Unknown feature", "nonexistent", "7.13.2", false, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			v, err := ParseVersion(tt.version)
			require.NoError(t, err)

			result := svc.IsFeatureSupported(tt.featureID, v, tt.isCHR)
			assert.Equal(t, tt.expected, result, "feature=%s version=%s isCHR=%v", tt.featureID, tt.version, tt.isCHR)
		})
	}
}

func TestServiceGetSupportedFeatures(t *testing.T) {
	svc := NewService()

	// RouterOS 7.13 should support many features
	v713, _ := ParseVersion("7.13.2")
	supported := svc.GetSupportedFeatures(v713, false)
	require.NotEmpty(t, supported)

	// Check that expected features are in the list
	featureIDs := make(map[string]bool)
	for _, f := range supported {
		featureIDs[f.ID] = true
	}

	assert.True(t, featureIDs["rest_api"], "7.13 should support REST API")
	assert.True(t, featureIDs["binary_api"], "7.13 should support Binary API")
	assert.True(t, featureIDs["container"], "7.13 should support Container")
	assert.True(t, featureIDs["wireguard"], "7.13 should support WireGuard")

	// RouterOS 6.40 should not support REST API or Container
	v640, _ := ParseVersion("6.40.0")
	supported640 := svc.GetSupportedFeatures(v640, false)
	featureIDs640 := make(map[string]bool)
	for _, f := range supported640 {
		featureIDs640[f.ID] = true
	}

	assert.False(t, featureIDs640["rest_api"], "6.40 should NOT support REST API")
	assert.False(t, featureIDs640["container"], "6.40 should NOT support Container")
	assert.True(t, featureIDs640["binary_api"], "6.40 should support Binary API")
}

func TestServiceGetUnsupportedFeatures(t *testing.T) {
	svc := NewService()

	// RouterOS 6.40 should have REST API and Container as unsupported
	v640, _ := ParseVersion("6.40.0")
	unsupported := svc.GetUnsupportedFeatures(v640, false)
	require.NotEmpty(t, unsupported)

	featureIDs := make(map[string]bool)
	for _, f := range unsupported {
		featureIDs[f.ID] = true
	}

	assert.True(t, featureIDs["rest_api"], "6.40 should NOT support REST API")
	assert.True(t, featureIDs["container"], "6.40 should NOT support Container")
	assert.True(t, featureIDs["wireguard"], "6.40 should NOT support WireGuard")
}

func TestServiceGetVersionRequirement(t *testing.T) {
	svc := NewService()

	// REST API requires 7.1+
	req := svc.GetVersionRequirement("rest_api", false)
	assert.Equal(t, "Requires RouterOS 7.1+", req)

	// Container requires 7.4+ (or 7.6+ for CHR)
	reqPhys := svc.GetVersionRequirement("container", false)
	assert.Equal(t, "Requires RouterOS 7.4+", reqPhys)

	reqCHR := svc.GetVersionRequirement("container", true)
	assert.Equal(t, "Requires RouterOS 7.6+", reqCHR)

	// Unknown feature
	reqUnknown := svc.GetVersionRequirement("nonexistent", false)
	assert.Empty(t, reqUnknown)
}

func TestServiceGetFieldMapping(t *testing.T) {
	svc := NewService()

	// Version 7.x
	v7, _ := ParseVersion("7.13.2")

	// Version 6.x
	v6, _ := ParseVersion("6.49.10")

	tests := []struct {
		name     string
		resource string
		field    string
		version  Version
		expected string
	}{
		// interface.ethernet mappings
		{"ethernet name v7", "interface.ethernet", "name", v7, "name"},
		{"ethernet name v6", "interface.ethernet", "name", v6, "default-name"},
		{"ethernet running v7", "interface.ethernet", "running", v7, "running"},
		{"ethernet running v6", "interface.ethernet", "running", v6, "running"},
		{"ethernet mtu v7", "interface.ethernet", "mtu", v7, "l2mtu"},
		{"ethernet mtu v6", "interface.ethernet", "mtu", v6, "mtu"},

		// ip.address mappings
		{"ip address v7", "ip.address", "address", v7, "address"},
		{"ip interface v7", "ip.address", "interface", v7, "interface"},

		// Unknown resource/field
		{"unknown resource", "unknown.resource", "field", v7, "field"},
		{"unknown field", "ip.address", "unknown_field", v7, "unknown_field"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := svc.GetFieldMapping(tt.resource, tt.field, tt.version)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestServiceGetPathMapping(t *testing.T) {
	svc := NewService()

	v7, _ := ParseVersion("7.13.2")
	v6, _ := ParseVersion("6.49.10")

	tests := []struct {
		name     string
		resource string
		version  Version
		expected string
	}{
		{"ip.address v7", "ip.address", v7, "/ip/address"},
		{"ip.address v6", "ip.address", v6, "/ip address"},
		{"ip.firewall.filter v7", "ip.firewall.filter", v7, "/ip/firewall/filter"},
		{"ip.firewall.filter v6", "ip.firewall.filter", v6, "/ip firewall filter"},
		{"interface.ethernet v7", "interface.ethernet", v7, "/interface/ethernet"},
		{"interface.ethernet v6", "interface.ethernet", v6, "/interface ethernet"},
		{"system.resource v7", "system.resource", v7, "/system/resource"},
		{"system.resource v6", "system.resource", v6, "/system resource"},
		{"unknown resource", "unknown.resource", v7, "unknown.resource"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := svc.GetPathMapping(tt.resource, tt.version)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestServiceGetFeatureSupport(t *testing.T) {
	svc := NewService()

	v713, _ := ParseVersion("7.13.2")
	v640, _ := ParseVersion("6.40.0")

	// Supported feature
	support := svc.GetFeatureSupport("rest_api", v713, false)
	assert.Equal(t, "rest_api", support.FeatureID)
	assert.True(t, support.Supported)
	assert.Empty(t, support.Reason)
	assert.NotEmpty(t, support.UpgradeURL)

	// Unsupported feature
	unsupport := svc.GetFeatureSupport("rest_api", v640, false)
	assert.Equal(t, "rest_api", unsupport.FeatureID)
	assert.False(t, unsupport.Supported)
	assert.Equal(t, "Requires RouterOS 7.1+", unsupport.Reason)
	assert.NotEmpty(t, unsupport.UpgradeURL)

	// Unknown feature
	unknown := svc.GetFeatureSupport("nonexistent", v713, false)
	assert.False(t, unknown.Supported)
	assert.Equal(t, "Unknown feature", unknown.Reason)
}

func TestDefaultServiceFunctions(t *testing.T) {
	// Test package-level convenience functions
	err := LoadMatrix()
	require.NoError(t, err)

	// GetFeatureCompatibility
	feature := GetFeatureCompatibility("rest_api")
	require.NotNil(t, feature)
	assert.Equal(t, "REST API", feature.Name)

	// IsFeatureSupported
	v713, _ := ParseVersion("7.13.2")
	assert.True(t, IsFeatureSupported("rest_api", v713, false))
	assert.False(t, IsFeatureSupported("rest_api", MustParseVersion("6.49.10"), false))

	// GetVersionRequirement
	req := GetVersionRequirement("container", true)
	assert.Equal(t, "Requires RouterOS 7.6+", req)

	// GetFieldMapping
	field := GetFieldMapping("interface.ethernet", "name", v713)
	assert.Equal(t, "name", field)

	// GetPathMapping
	path := GetPathMapping("ip.address", v713)
	assert.Equal(t, "/ip/address", path)
}

func TestServiceConcurrentAccess(t *testing.T) {
	svc := NewService()

	// Concurrent reads should not cause race conditions
	done := make(chan bool)

	for i := 0; i < 10; i++ {
		go func() {
			for j := 0; j < 100; j++ {
				_ = svc.GetFeatureCompatibility("rest_api")
				v, _ := ParseVersion("7.13.2")
				_ = svc.IsFeatureSupported("container", v, false)
				_ = svc.GetFieldMapping("ip.address", "address", v)
			}
			done <- true
		}()
	}

	// Wait for all goroutines
	for i := 0; i < 10; i++ {
		<-done
	}
}

func TestServiceLazyLoading(t *testing.T) {
	svc := NewService()

	// Matrix should not be loaded yet
	s := svc.(*service)
	s.mu.RLock()
	assert.Nil(t, s.matrix)
	s.mu.RUnlock()

	// First access should trigger lazy load
	feature := svc.GetFeatureCompatibility("rest_api")
	require.NotNil(t, feature)

	// Matrix should now be loaded
	s.mu.RLock()
	assert.NotNil(t, s.matrix)
	s.mu.RUnlock()
}
