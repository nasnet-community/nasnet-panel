package mappings

import (
	"testing"

	"github.com/stretchr/testify/assert"

	"backend/internal/translator"
)

func TestVersionMappingRegistry_PathMappings(t *testing.T) {
	registry := NewVersionMappingRegistry()

	t.Run("ROS 6.x wireless path", func(t *testing.T) {
		version := &translator.RouterOSVersion{Major: 6, Minor: 49}
		path := registry.GetPath("/interface/wireless", version)
		assert.Equal(t, "/interface/wireless", path)
	})

	t.Run("ROS 7.x wireless path", func(t *testing.T) {
		version := &translator.RouterOSVersion{Major: 7, Minor: 13}
		path := registry.GetPath("/interface/wireless", version)
		assert.Equal(t, "/interface/wifiwave2", path)
	})

	t.Run("no version info returns canonical", func(t *testing.T) {
		path := registry.GetPath("/interface/wireless", nil)
		assert.Equal(t, "/interface/wireless", path)
	})

	t.Run("unmapped path returns as-is", func(t *testing.T) {
		version := &translator.RouterOSVersion{Major: 7, Minor: 13}
		path := registry.GetPath("/interface/ethernet", version)
		assert.Equal(t, "/interface/ethernet", path)
	})

	t.Run("BGP path mapping", func(t *testing.T) {
		ros6 := &translator.RouterOSVersion{Major: 6, Minor: 49}
		ros7 := &translator.RouterOSVersion{Major: 7, Minor: 13}

		assert.Equal(t, "/routing/bgp/instance", registry.GetPath("/routing/bgp/instance", ros6))
		assert.Equal(t, "/routing/bgp/connection", registry.GetPath("/routing/bgp/instance", ros7))
	})
}

func TestVersionMappingRegistry_FieldMappings(t *testing.T) {
	registry := NewVersionMappingRegistry()

	t.Run("ROS 6.x security profile field", func(t *testing.T) {
		version := &translator.RouterOSVersion{Major: 6, Minor: 49}
		field := registry.GetField("/interface/wireless", "securityProfile", version)
		assert.Equal(t, "security-profile", field)
	})

	t.Run("ROS 7.x security field", func(t *testing.T) {
		version := &translator.RouterOSVersion{Major: 7, Minor: 13}
		field := registry.GetField("/interface/wireless", "securityProfile", version)
		assert.Equal(t, "security", field)
	})

	t.Run("unmapped field returns as-is", func(t *testing.T) {
		version := &translator.RouterOSVersion{Major: 7, Minor: 13}
		field := registry.GetField("/interface/ethernet", "mtu", version)
		assert.Equal(t, "mtu", field)
	})
}

func TestVersionMappingRegistry_FeatureAvailability(t *testing.T) {
	registry := NewVersionMappingRegistry()

	t.Run("container not available on ROS 6.x", func(t *testing.T) {
		ros6 := &translator.RouterOSVersion{Major: 6, Minor: 49}
		assert.False(t, registry.IsFeatureAvailable("container", ros6))
	})

	t.Run("container available on ROS 7.4+", func(t *testing.T) {
		ros74 := &translator.RouterOSVersion{Major: 7, Minor: 4}
		ros75 := &translator.RouterOSVersion{Major: 7, Minor: 5}

		assert.True(t, registry.IsFeatureAvailable("container", ros74))
		assert.True(t, registry.IsFeatureAvailable("container", ros75))
	})

	t.Run("container not available on ROS 7.3", func(t *testing.T) {
		ros73 := &translator.RouterOSVersion{Major: 7, Minor: 3}
		assert.False(t, registry.IsFeatureAvailable("container", ros73))
	})

	t.Run("REST API requires ROS 7.1+", func(t *testing.T) {
		ros649 := &translator.RouterOSVersion{Major: 6, Minor: 49}
		ros70 := &translator.RouterOSVersion{Major: 7, Minor: 0}
		ros71 := &translator.RouterOSVersion{Major: 7, Minor: 1}
		ros713 := &translator.RouterOSVersion{Major: 7, Minor: 13}

		assert.False(t, registry.IsFeatureAvailable("rest-api", ros649))
		assert.False(t, registry.IsFeatureAvailable("rest-api", ros70))
		assert.True(t, registry.IsFeatureAvailable("rest-api", ros71))
		assert.True(t, registry.IsFeatureAvailable("rest-api", ros713))
	})

	t.Run("unknown feature assumed available", func(t *testing.T) {
		ros6 := &translator.RouterOSVersion{Major: 6, Minor: 49}
		assert.True(t, registry.IsFeatureAvailable("unknown-feature", ros6))
	})

	t.Run("nil version assumes available", func(t *testing.T) {
		assert.True(t, registry.IsFeatureAvailable("container", nil))
	})
}

func TestApplyVersionMapping(t *testing.T) {
	registry := NewVersionMappingRegistry()

	t.Run("apply path mapping for ROS 7.x", func(t *testing.T) {
		cmd := &translator.CanonicalCommand{
			Path:    "/interface/wireless",
			Action:  translator.ActionPrint,
			Version: &translator.RouterOSVersion{Major: 7, Minor: 13},
		}

		result := ApplyVersionMapping(cmd, registry)
		assert.Equal(t, "/interface/wifiwave2", result.Path)
	})

	t.Run("apply field mapping for ROS 6.x", func(t *testing.T) {
		cmd := &translator.CanonicalCommand{
			Path:    "/interface/wireless",
			Action:  translator.ActionSet,
			Version: &translator.RouterOSVersion{Major: 6, Minor: 49},
			Parameters: map[string]interface{}{
				"securityProfile": "default",
			},
		}

		result := ApplyVersionMapping(cmd, registry)
		assert.Equal(t, "/interface/wireless", result.Path)
		assert.Equal(t, "default", result.Parameters["security-profile"])
		assert.NotContains(t, result.Parameters, "securityProfile")
	})

	t.Run("apply field mapping for ROS 7.x", func(t *testing.T) {
		cmd := &translator.CanonicalCommand{
			Path:    "/interface/wireless",
			Action:  translator.ActionSet,
			Version: &translator.RouterOSVersion{Major: 7, Minor: 13},
			Parameters: map[string]interface{}{
				"securityProfile": "default",
			},
		}

		result := ApplyVersionMapping(cmd, registry)
		assert.Equal(t, "/interface/wifiwave2", result.Path)
		assert.Equal(t, "default", result.Parameters["security"])
	})

	t.Run("apply filter field mapping", func(t *testing.T) {
		cmd := &translator.CanonicalCommand{
			Path:    "/interface/wireless",
			Action:  translator.ActionPrint,
			Version: &translator.RouterOSVersion{Major: 7, Minor: 13},
			Filters: []translator.Filter{
				{Field: "securityProfile", Operator: translator.FilterOpEquals, Value: "default"},
			},
		}

		result := ApplyVersionMapping(cmd, registry)
		assert.Equal(t, "security", result.Filters[0].Field)
	})

	t.Run("apply proplist field mapping", func(t *testing.T) {
		cmd := &translator.CanonicalCommand{
			Path:     "/interface/wireless",
			Action:   translator.ActionPrint,
			Version:  &translator.RouterOSVersion{Major: 7, Minor: 13},
			PropList: []string{"name", "securityProfile", "frequencyMode"},
		}

		result := ApplyVersionMapping(cmd, registry)
		assert.Contains(t, result.PropList, "security")
		assert.Contains(t, result.PropList, "channel")
		assert.Contains(t, result.PropList, "name")
	})

	t.Run("nil command returns nil", func(t *testing.T) {
		result := ApplyVersionMapping(nil, registry)
		assert.Nil(t, result)
	})

	t.Run("nil registry returns command unchanged", func(t *testing.T) {
		cmd := &translator.CanonicalCommand{
			Path:   "/interface/wireless",
			Action: translator.ActionPrint,
		}

		result := ApplyVersionMapping(cmd, nil)
		assert.Equal(t, cmd, result)
	})
}

func TestCustomVersionMapping(t *testing.T) {
	registry := NewVersionMappingRegistry()

	// Register custom mapping
	registry.Register(&VersionMapping{
		Feature:    "custom-feature",
		MinVersion: &translator.RouterOSVersion{Major: 7, Minor: 10},
		PathMappings: []PathMapping{
			{
				CanonicalPath: "/custom/path",
				ROS6Path:      "/old/custom/path",
				ROS7Path:      "/new/custom/path",
			},
		},
	})

	t.Run("custom path mapping ROS 6.x", func(t *testing.T) {
		ros6 := &translator.RouterOSVersion{Major: 6, Minor: 49}
		assert.Equal(t, "/old/custom/path", registry.GetPath("/custom/path", ros6))
	})

	t.Run("custom path mapping ROS 7.x", func(t *testing.T) {
		ros7 := &translator.RouterOSVersion{Major: 7, Minor: 13}
		assert.Equal(t, "/new/custom/path", registry.GetPath("/custom/path", ros7))
	})

	t.Run("custom feature availability", func(t *testing.T) {
		ros79 := &translator.RouterOSVersion{Major: 7, Minor: 9}
		ros710 := &translator.RouterOSVersion{Major: 7, Minor: 10}

		assert.False(t, registry.IsFeatureAvailable("custom-feature", ros79))
		assert.True(t, registry.IsFeatureAvailable("custom-feature", ros710))
	})
}
