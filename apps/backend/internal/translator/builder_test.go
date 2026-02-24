package translator

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestCommandBuilder_Basic(t *testing.T) {
	cmd := NewCommandBuilder("/interface/ethernet").
		WithAction(ActionSet).
		WithID("*1").
		Build()

	assert.Equal(t, "/interface/ethernet", cmd.Path)
	assert.Equal(t, ActionSet, cmd.Action)
	assert.Equal(t, "*1", cmd.ID)
}

func TestCommandBuilder_WithParams(t *testing.T) {
	cmd := NewCommandBuilder("/interface/ethernet").
		WithAction(ActionSet).
		WithID("*1").
		WithParam("disabled", false).
		WithParam("mtu", 1500).
		Build()

	assert.Equal(t, false, cmd.Parameters["disabled"])
	assert.Equal(t, 1500, cmd.Parameters["mtu"])
}

func TestCommandBuilder_WithParamsMap(t *testing.T) {
	params := map[string]interface{}{
		"name":     "bridge1",
		"protocol": "stp",
	}

	cmd := NewCommandBuilder("/interface/bridge").
		WithAction(ActionAdd).
		WithParams(params).
		Build()

	assert.Equal(t, "bridge1", cmd.Parameters["name"])
	assert.Equal(t, "stp", cmd.Parameters["protocol"])
}

func TestCommandBuilder_WithFilters(t *testing.T) {
	cmd := NewCommandBuilder("/interface").
		WithAction(ActionPrint).
		WithFilter("type", FilterOpEquals, "ether").
		WithFilter("running", FilterOpEquals, "yes").
		Build()

	require.Len(t, cmd.Filters, 2)
	assert.Equal(t, "type", cmd.Filters[0].Field)
	assert.Equal(t, FilterOpEquals, cmd.Filters[0].Operator)
	assert.Equal(t, "ether", cmd.Filters[0].Value)
}

func TestCommandBuilder_WithEqualFilter(t *testing.T) {
	cmd := NewCommandBuilder("/interface").
		WithAction(ActionPrint).
		WithEqualFilter("name", "ether1").
		Build()

	require.Len(t, cmd.Filters, 1)
	assert.Equal(t, "name", cmd.Filters[0].Field)
	assert.Equal(t, FilterOpEquals, cmd.Filters[0].Operator)
	assert.Equal(t, "ether1", cmd.Filters[0].Value)
}

func TestCommandBuilder_WithPropList(t *testing.T) {
	cmd := NewCommandBuilder("/interface").
		WithAction(ActionPrint).
		WithPropList("name", "type", "running").
		Build()

	assert.Equal(t, []string{"name", "type", "running"}, cmd.PropList)
}

func TestCommandBuilder_WithVersion(t *testing.T) {
	version := &RouterOSVersion{Major: 7, Minor: 13}

	cmd := NewCommandBuilder("/interface/ethernet").
		WithAction(ActionPrint).
		WithVersion(version).
		Build()

	require.NotNil(t, cmd.Version)
	assert.Equal(t, 7, cmd.Version.Major)
	assert.Equal(t, 13, cmd.Version.Minor)
}

func TestCommandBuilder_WithTimeout(t *testing.T) {
	cmd := NewCommandBuilder("/interface/ethernet").
		WithAction(ActionPrint).
		WithTimeout(30 * time.Second).
		Build()

	assert.Equal(t, 30*time.Second, cmd.Timeout)
}

func TestCommandBuilder_WithMetadata(t *testing.T) {
	cmd := NewCommandBuilder("/interface/ethernet").
		WithAction(ActionSet).
		WithRequestID("req-123").
		WithOperationName("UpdateInterface").
		WithFieldPath("mutation.updateInterface").
		WithRouterID("router-456").
		Build()

	assert.Equal(t, "req-123", cmd.Metadata.RequestID)
	assert.Equal(t, "UpdateInterface", cmd.Metadata.OperationName)
	assert.Equal(t, "mutation.updateInterface", cmd.Metadata.FieldPath)
	assert.Equal(t, "router-456", cmd.Metadata.RouterID)
}

func TestCommandBuilder_WithFullMetadata(t *testing.T) {
	meta := CommandMetadata{
		RequestID:     "req-123",
		OperationName: "UpdateInterface",
		FieldPath:     "mutation.updateInterface",
		RouterID:      "router-456",
	}

	cmd := NewCommandBuilder("/interface/ethernet").
		WithAction(ActionSet).
		WithMetadata(meta).
		Build()

	assert.Equal(t, meta, cmd.Metadata)
}

func TestCommandBuilder_BuildConvenienceMethods(t *testing.T) {
	t.Run("BuildGet", func(t *testing.T) {
		cmd := NewCommandBuilder("/interface").BuildGet()
		assert.Equal(t, ActionGet, cmd.Action)
	})

	t.Run("BuildPrint", func(t *testing.T) {
		cmd := NewCommandBuilder("/interface").BuildPrint()
		assert.Equal(t, ActionPrint, cmd.Action)
	})

	t.Run("BuildAdd", func(t *testing.T) {
		cmd := NewCommandBuilder("/interface/bridge").BuildAdd()
		assert.Equal(t, ActionAdd, cmd.Action)
	})

	t.Run("BuildSet", func(t *testing.T) {
		cmd := NewCommandBuilder("/interface").BuildSet()
		assert.Equal(t, ActionSet, cmd.Action)
	})

	t.Run("BuildRemove", func(t *testing.T) {
		cmd := NewCommandBuilder("/interface").BuildRemove()
		assert.Equal(t, ActionRemove, cmd.Action)
	})
}

func TestShorthandBuilders(t *testing.T) {
	t.Run("Print", func(t *testing.T) {
		cmd := Print("/interface").
			WithEqualFilter("type", "ether").
			Build()

		assert.Equal(t, "/interface", cmd.Path)
		assert.Equal(t, ActionPrint, cmd.Action)
	})

	t.Run("Get", func(t *testing.T) {
		cmd := Get("/interface/ethernet", "*1").Build()

		assert.Equal(t, "/interface/ethernet", cmd.Path)
		assert.Equal(t, ActionGet, cmd.Action)
		assert.Equal(t, "*1", cmd.ID)
	})

	t.Run("Add", func(t *testing.T) {
		cmd := Add("/interface/bridge").
			WithParam("name", "bridge1").
			Build()

		assert.Equal(t, "/interface/bridge", cmd.Path)
		assert.Equal(t, ActionAdd, cmd.Action)
		assert.Equal(t, "bridge1", cmd.Parameters["name"])
	})

	t.Run("Set", func(t *testing.T) {
		cmd := Set("/interface/ethernet", "*1").
			WithParam("disabled", false).
			Build()

		assert.Equal(t, "/interface/ethernet", cmd.Path)
		assert.Equal(t, ActionSet, cmd.Action)
		assert.Equal(t, "*1", cmd.ID)
	})

	t.Run("Remove", func(t *testing.T) {
		cmd := Remove("/interface/bridge", "*A1").Build()

		assert.Equal(t, "/interface/bridge", cmd.Path)
		assert.Equal(t, ActionRemove, cmd.Action)
		assert.Equal(t, "*A1", cmd.ID)
	})

	t.Run("Enable", func(t *testing.T) {
		cmd := Enable("/interface/ethernet", "*1").Build()

		assert.Equal(t, "/interface/ethernet", cmd.Path)
		assert.Equal(t, ActionEnable, cmd.Action)
		assert.Equal(t, "*1", cmd.ID)
	})

	t.Run("Disable", func(t *testing.T) {
		cmd := Disable("/interface/ethernet", "*1").Build()

		assert.Equal(t, "/interface/ethernet", cmd.Path)
		assert.Equal(t, ActionDisable, cmd.Action)
		assert.Equal(t, "*1", cmd.ID)
	})
}

func TestCommandBuilder_ComplexCommand(t *testing.T) {
	version := &RouterOSVersion{Major: 7, Minor: 13, Patch: 2}

	// Simulate a realistic interface update command
	cmd := NewCommandBuilder("/interface/ethernet").
		WithAction(ActionSet).
		WithID("*1").
		WithParam("disabled", false).
		WithParam("mtu", 1500).
		WithParam("comment", "Main uplink").
		WithVersion(version).
		WithTimeout(30 * time.Second).
		WithRequestID("req-abc123").
		WithOperationName("UpdateInterface").
		WithRouterID("router-001").
		Build()

	// Verify all fields are set correctly
	assert.Equal(t, "/interface/ethernet", cmd.Path)
	assert.Equal(t, ActionSet, cmd.Action)
	assert.Equal(t, "*1", cmd.ID)
	assert.Equal(t, false, cmd.Parameters["disabled"])
	assert.Equal(t, 1500, cmd.Parameters["mtu"])
	assert.Equal(t, "Main uplink", cmd.Parameters["comment"])
	assert.Equal(t, version, cmd.Version)
	assert.Equal(t, 30*time.Second, cmd.Timeout)
	assert.Equal(t, "req-abc123", cmd.Metadata.RequestID)
	assert.Equal(t, "UpdateInterface", cmd.Metadata.OperationName)
	assert.Equal(t, "router-001", cmd.Metadata.RouterID)
}

func TestCommandBuilder_ValidationErrors(t *testing.T) {
	t.Run("missing path panics", func(t *testing.T) {
		defer func() {
			r := recover()
			require.NotNil(t, r)
			assert.Contains(t, r.(string), "Path is required")
		}()

		NewCommandBuilder("").
			WithAction(ActionPrint).
			Build()
	})

	t.Run("missing action panics", func(t *testing.T) {
		defer func() {
			r := recover()
			require.NotNil(t, r)
			assert.Contains(t, r.(string), "Action is required")
		}()

		NewCommandBuilder("/interface").Build()
	})

	t.Run("nil params is safe", func(t *testing.T) {
		cmd := NewCommandBuilder("/interface").
			WithAction(ActionPrint).
			WithParams(nil).
			Build()

		require.NotNil(t, cmd)
		assert.Equal(t, 0, len(cmd.Parameters))
	})
}
