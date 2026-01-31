package translator

import (
	"testing"

	"backend/internal/router/compatibility"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestVersionAwareTranslator_New(t *testing.T) {
	vat := NewVersionAwareTranslator(TranslatorConfig{})
	require.NotNil(t, vat)
	require.NotNil(t, vat.Translator)
	require.NotNil(t, vat.compatSvc)
}

func TestVersionAwareTranslator_SetVersion(t *testing.T) {
	vat := NewVersionAwareTranslator(TranslatorConfig{})

	// Set version from compatibility.Version
	v := compatibility.Version{
		Major:   7,
		Minor:   13,
		Patch:   2,
		Channel: "stable",
	}
	vat.SetVersionFromCompatibility(v)

	require.NotNil(t, vat.version)
	assert.Equal(t, 7, vat.version.Major)
	assert.Equal(t, 13, vat.version.Minor)
	assert.Equal(t, 2, vat.version.Patch)
	assert.Equal(t, "stable", vat.version.Channel)
}

func TestVersionAwareTranslator_GetCompatibilityVersion(t *testing.T) {
	vat := NewVersionAwareTranslator(TranslatorConfig{})

	// Without version set
	assert.Nil(t, vat.GetCompatibilityVersion())

	// With version set
	vat.version = &RouterOSVersion{
		Major:   7,
		Minor:   13,
		Patch:   2,
		Channel: "stable",
	}

	cv := vat.GetCompatibilityVersion()
	require.NotNil(t, cv)
	assert.Equal(t, 7, cv.Major)
	assert.Equal(t, 13, cv.Minor)
	assert.Equal(t, 2, cv.Patch)
	assert.Equal(t, "stable", cv.Channel)
}

func TestVersionAwareTranslator_TranslateFieldName(t *testing.T) {
	tests := []struct {
		name          string
		version       *RouterOSVersion
		resource      string
		graphqlField  string
		expectedField string
	}{
		{
			name:          "ethernet name field v7",
			version:       &RouterOSVersion{Major: 7, Minor: 13, Patch: 2},
			resource:      "interface.ethernet",
			graphqlField:  "name",
			expectedField: "name",
		},
		{
			name:          "ethernet name field v6",
			version:       &RouterOSVersion{Major: 6, Minor: 49, Patch: 10},
			resource:      "interface.ethernet",
			graphqlField:  "name",
			expectedField: "default-name",
		},
		{
			name:          "ethernet mtu field v7",
			version:       &RouterOSVersion{Major: 7, Minor: 13, Patch: 2},
			resource:      "interface.ethernet",
			graphqlField:  "mtu",
			expectedField: "l2mtu",
		},
		{
			name:          "ethernet mtu field v6",
			version:       &RouterOSVersion{Major: 6, Minor: 49, Patch: 10},
			resource:      "interface.ethernet",
			graphqlField:  "mtu",
			expectedField: "mtu",
		},
		{
			name:          "unknown field falls back to camelToKebab",
			version:       &RouterOSVersion{Major: 7, Minor: 13, Patch: 2},
			resource:      "unknown.resource",
			graphqlField:  "someFieldName",
			expectedField: "some-field-name",
		},
		{
			name:          "no version set falls back",
			version:       nil,
			resource:      "interface.ethernet",
			graphqlField:  "macAddress",
			expectedField: "mac-address",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			vat := NewVersionAwareTranslator(TranslatorConfig{})
			vat.version = tt.version

			result := vat.TranslateFieldName(tt.resource, tt.graphqlField)
			assert.Equal(t, tt.expectedField, result)
		})
	}
}

func TestVersionAwareTranslator_TranslatePath(t *testing.T) {
	tests := []struct {
		name         string
		version      *RouterOSVersion
		resource     string
		expectedPath string
	}{
		{
			name:         "ip.address v7",
			version:      &RouterOSVersion{Major: 7, Minor: 13, Patch: 2},
			resource:     "ip.address",
			expectedPath: "/ip/address",
		},
		{
			name:         "ip.address v6",
			version:      &RouterOSVersion{Major: 6, Minor: 49, Patch: 10},
			resource:     "ip.address",
			expectedPath: "/ip address",
		},
		{
			name:         "ip.firewall.filter v7",
			version:      &RouterOSVersion{Major: 7, Minor: 13, Patch: 2},
			resource:     "ip.firewall.filter",
			expectedPath: "/ip/firewall/filter",
		},
		{
			name:         "ip.firewall.filter v6",
			version:      &RouterOSVersion{Major: 6, Minor: 49, Patch: 10},
			resource:     "ip.firewall.filter",
			expectedPath: "/ip firewall filter",
		},
		{
			name:         "interface.ethernet v7",
			version:      &RouterOSVersion{Major: 7, Minor: 13, Patch: 2},
			resource:     "interface.ethernet",
			expectedPath: "/interface/ethernet",
		},
		{
			name:         "interface.ethernet v6",
			version:      &RouterOSVersion{Major: 6, Minor: 49, Patch: 10},
			resource:     "interface.ethernet",
			expectedPath: "/interface ethernet",
		},
		{
			name:         "no version uses default path",
			version:      nil,
			resource:     "ip.address",
			expectedPath: "/ip/address",
		},
		{
			name:         "unknown resource returns resource as path",
			version:      &RouterOSVersion{Major: 7, Minor: 13, Patch: 2},
			resource:     "unknown.resource.path",
			expectedPath: "unknown.resource.path",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			vat := NewVersionAwareTranslator(TranslatorConfig{})
			vat.version = tt.version

			result := vat.TranslatePath(tt.resource)
			assert.Equal(t, tt.expectedPath, result)
		})
	}
}

func TestVersionAwareTranslator_TranslateToCanonicalVersionAware(t *testing.T) {
	t.Run("translates path and fields for v7", func(t *testing.T) {
		vat := NewVersionAwareTranslator(TranslatorConfig{})
		vat.version = &RouterOSVersion{Major: 7, Minor: 13, Patch: 2}

		cmd, err := vat.TranslateToCanonicalVersionAware(TranslateInput{
			Path:   "/ip/address",
			Action: ActionPrint,
			Fields: map[string]interface{}{
				"address":   "192.168.1.1/24",
				"interface": "ether1",
			},
		})

		require.NoError(t, err)
		require.NotNil(t, cmd)
		assert.Equal(t, "/ip/address", cmd.Path)
		assert.Equal(t, ActionPrint, cmd.Action)
	})

	t.Run("translates path and fields for v6", func(t *testing.T) {
		vat := NewVersionAwareTranslator(TranslatorConfig{})
		vat.version = &RouterOSVersion{Major: 6, Minor: 49, Patch: 10}

		cmd, err := vat.TranslateToCanonicalVersionAware(TranslateInput{
			Path:   "/ip/address",
			Action: ActionPrint,
			Fields: map[string]interface{}{
				"address":   "192.168.1.1/24",
				"interface": "ether1",
			},
		})

		require.NoError(t, err)
		require.NotNil(t, cmd)
		assert.Equal(t, "/ip address", cmd.Path)
	})

	t.Run("translates filters with version awareness", func(t *testing.T) {
		vat := NewVersionAwareTranslator(TranslatorConfig{})
		vat.version = &RouterOSVersion{Major: 7, Minor: 13, Patch: 2}

		cmd, err := vat.TranslateToCanonicalVersionAware(TranslateInput{
			Path:   "/interface/ethernet",
			Action: ActionPrint,
			Filters: map[string]interface{}{
				"name": "ether1",
			},
		})

		require.NoError(t, err)
		require.NotNil(t, cmd)
		assert.Len(t, cmd.Filters, 1)
		assert.Equal(t, "name", cmd.Filters[0].Field)
	})

	t.Run("translates proplist with version awareness", func(t *testing.T) {
		vat := NewVersionAwareTranslator(TranslatorConfig{})
		vat.version = &RouterOSVersion{Major: 6, Minor: 49, Patch: 10}

		cmd, err := vat.TranslateToCanonicalVersionAware(TranslateInput{
			Path:     "/interface/ethernet",
			Action:   ActionPrint,
			PropList: []string{"name", "mtu", "macAddress"},
		})

		require.NoError(t, err)
		require.NotNil(t, cmd)
		assert.Len(t, cmd.PropList, 3)
		// "name" should be translated to "default-name" for v6
		assert.Equal(t, "default-name", cmd.PropList[0])
		// "mtu" should remain "mtu" for v6
		assert.Equal(t, "mtu", cmd.PropList[1])
		// "macAddress" should be converted to kebab-case
		assert.Equal(t, "mac-address", cmd.PropList[2])
	})
}

func TestVersionAwareTranslator_IsFeatureSupported(t *testing.T) {
	tests := []struct {
		name      string
		version   *RouterOSVersion
		featureID string
		isCHR     bool
		expected  bool
	}{
		{
			name:      "REST API supported on 7.13",
			version:   &RouterOSVersion{Major: 7, Minor: 13, Patch: 2},
			featureID: "rest_api",
			isCHR:     false,
			expected:  true,
		},
		{
			name:      "REST API not supported on 6.49",
			version:   &RouterOSVersion{Major: 6, Minor: 49, Patch: 10},
			featureID: "rest_api",
			isCHR:     false,
			expected:  false,
		},
		{
			name:      "Container supported on 7.6 physical",
			version:   &RouterOSVersion{Major: 7, Minor: 6, Patch: 0},
			featureID: "container",
			isCHR:     false,
			expected:  true,
		},
		{
			name:      "Container not supported on 7.5 CHR",
			version:   &RouterOSVersion{Major: 7, Minor: 5, Patch: 0},
			featureID: "container",
			isCHR:     true,
			expected:  false,
		},
		{
			name:      "Container supported on 7.6 CHR",
			version:   &RouterOSVersion{Major: 7, Minor: 6, Patch: 0},
			featureID: "container",
			isCHR:     true,
			expected:  true,
		},
		{
			name:      "No version set assumes supported",
			version:   nil,
			featureID: "rest_api",
			isCHR:     false,
			expected:  true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			vat := NewVersionAwareTranslator(TranslatorConfig{})
			vat.version = tt.version

			result := vat.IsFeatureSupported(tt.featureID, tt.isCHR)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestVersionAwareTranslator_GetVersionRequirement(t *testing.T) {
	vat := NewVersionAwareTranslator(TranslatorConfig{})

	tests := []struct {
		featureID string
		isCHR     bool
		expected  string
	}{
		{"rest_api", false, "Requires RouterOS 7.1+"},
		{"container", false, "Requires RouterOS 7.4+"},
		{"container", true, "Requires RouterOS 7.6+"},
		{"binary_api", false, "Requires RouterOS 6.40+"},
	}

	for _, tt := range tests {
		t.Run(tt.featureID, func(t *testing.T) {
			result := vat.GetVersionRequirement(tt.featureID, tt.isCHR)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestResourceToPath(t *testing.T) {
	tests := []struct {
		resource string
		expected string
	}{
		{"ip.address", "/ip/address"},
		{"ip.firewall.filter", "/ip/firewall/filter"},
		{"interface.ethernet", "/interface/ethernet"},
		{"system.resource", "/system/resource"},
		{"/ip/address", "/ip/address"}, // Already a path
		{"", ""},
	}

	for _, tt := range tests {
		t.Run(tt.resource, func(t *testing.T) {
			result := resourceToPath(tt.resource)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestPathToResource(t *testing.T) {
	tests := []struct {
		path     string
		expected string
	}{
		{"/ip/address", "ip.address"},
		{"/ip/firewall/filter", "ip.firewall.filter"},
		{"/interface/ethernet", "interface.ethernet"},
		{"/system/resource", "system.resource"},
		{"ip.address", "ip.address"}, // No leading slash
		{"", ""},
	}

	for _, tt := range tests {
		t.Run(tt.path, func(t *testing.T) {
			result := pathToResource(tt.path)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestVersionAwareTranslatorWithCustomService(t *testing.T) {
	// Create a custom compatibility service
	svc := compatibility.NewService()

	vat := NewVersionAwareTranslatorWithService(TranslatorConfig{}, svc)
	require.NotNil(t, vat)
	assert.Equal(t, svc, vat.compatSvc)

	// Verify it works
	vat.version = &RouterOSVersion{Major: 7, Minor: 13, Patch: 2}
	assert.True(t, vat.IsFeatureSupported("rest_api", false))
}
