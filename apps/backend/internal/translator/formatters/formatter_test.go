package formatters

import (
	"encoding/json"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"backend/internal/translator"
)

func TestFormatterRegistry(t *testing.T) {
	registry := NewFormatterRegistry()

	t.Run("has all default formatters", func(t *testing.T) {
		_, ok := registry.Get(translator.ProtocolREST)
		assert.True(t, ok, "REST formatter should be registered")

		_, ok = registry.Get(translator.ProtocolAPI)
		assert.True(t, ok, "API formatter should be registered")

		_, ok = registry.Get(translator.ProtocolSSH)
		assert.True(t, ok, "SSH formatter should be registered")
	})

	t.Run("unknown protocol", func(t *testing.T) {
		_, ok := registry.Get(translator.Protocol("UNKNOWN"))
		assert.False(t, ok)
	})
}

// =============================================================================
// REST Formatter Tests
// =============================================================================

func TestRESTFormatter_Format(t *testing.T) {
	f := NewRESTFormatter()

	t.Run("print command", func(t *testing.T) {
		cmd := &translator.CanonicalCommand{
			Path:   "/interface/ethernet",
			Action: translator.ActionPrint,
		}

		data, err := f.Format(cmd)
		require.NoError(t, err)

		var req RESTRequest
		err = json.Unmarshal(data, &req)
		require.NoError(t, err)

		assert.Equal(t, "GET", req.Method)
		assert.Equal(t, "/rest/interface/ethernet", req.Path)
	})

	t.Run("print with filters", func(t *testing.T) {
		cmd := &translator.CanonicalCommand{
			Path:   "/interface",
			Action: translator.ActionPrint,
			Filters: []translator.Filter{
				{Field: "type", Operator: translator.FilterOpEquals, Value: "ether"},
			},
		}

		data, err := f.Format(cmd)
		require.NoError(t, err)

		var req RESTRequest
		err = json.Unmarshal(data, &req)
		require.NoError(t, err)

		assert.Equal(t, "GET", req.Method)
		assert.Equal(t, "ether", req.Query["type"])
	})

	t.Run("get by ID", func(t *testing.T) {
		cmd := &translator.CanonicalCommand{
			Path:   "/interface/ethernet",
			Action: translator.ActionGet,
			ID:     "*1",
		}

		data, err := f.Format(cmd)
		require.NoError(t, err)

		var req RESTRequest
		err = json.Unmarshal(data, &req)
		require.NoError(t, err)

		assert.Equal(t, "GET", req.Method)
		assert.Equal(t, "/rest/interface/ethernet/*1", req.Path)
	})

	t.Run("add command", func(t *testing.T) {
		cmd := &translator.CanonicalCommand{
			Path:   "/interface/bridge",
			Action: translator.ActionAdd,
			Parameters: map[string]interface{}{
				"name":          "bridge1",
				"protocol-mode": "stp",
			},
		}

		data, err := f.Format(cmd)
		require.NoError(t, err)

		var req RESTRequest
		err = json.Unmarshal(data, &req)
		require.NoError(t, err)

		assert.Equal(t, "PUT", req.Method)
		assert.Equal(t, "/rest/interface/bridge", req.Path)
		assert.Equal(t, "bridge1", req.Body["name"])
	})

	t.Run("set command", func(t *testing.T) {
		cmd := &translator.CanonicalCommand{
			Path:   "/interface/ethernet",
			Action: translator.ActionSet,
			ID:     "*1",
			Parameters: map[string]interface{}{
				"disabled": true,
			},
		}

		data, err := f.Format(cmd)
		require.NoError(t, err)

		var req RESTRequest
		err = json.Unmarshal(data, &req)
		require.NoError(t, err)

		assert.Equal(t, "PATCH", req.Method)
		assert.Equal(t, "/rest/interface/ethernet/*1", req.Path)
		assert.Equal(t, "yes", req.Body["disabled"])
	})

	t.Run("remove command", func(t *testing.T) {
		cmd := &translator.CanonicalCommand{
			Path:   "/interface/bridge",
			Action: translator.ActionRemove,
			ID:     "*A1",
		}

		data, err := f.Format(cmd)
		require.NoError(t, err)

		var req RESTRequest
		err = json.Unmarshal(data, &req)
		require.NoError(t, err)

		assert.Equal(t, "DELETE", req.Method)
		assert.Equal(t, "/rest/interface/bridge/*A1", req.Path)
	})
}

func TestRESTFormatter_Parse(t *testing.T) {
	f := NewRESTFormatter()

	t.Run("parse list response", func(t *testing.T) {
		response := `[{"name":"ether1","type":"ether"},{"name":"ether2","type":"ether"}]`

		result, err := f.Parse([]byte(response))
		require.NoError(t, err)
		require.True(t, result.Success)

		data := result.Data.([]map[string]interface{})
		assert.Len(t, data, 2)
		assert.Equal(t, "ether1", data[0]["name"])
	})

	t.Run("parse single object response", func(t *testing.T) {
		response := `{"name":"ether1","type":"ether","mtu":"1500"}`

		result, err := f.Parse([]byte(response))
		require.NoError(t, err)
		require.True(t, result.Success)

		data := result.Data.(map[string]interface{})
		assert.Equal(t, "ether1", data["name"])
	})

	t.Run("parse add response", func(t *testing.T) {
		response := `{"ret":"*A1B2C3"}`

		result, err := f.Parse([]byte(response))
		require.NoError(t, err)
		require.True(t, result.Success)
		assert.Equal(t, "*A1B2C3", result.ID)
	})

	t.Run("parse error response", func(t *testing.T) {
		response := `{"error":404,"message":"no such item","detail":"interface not found"}`

		result, err := f.Parse([]byte(response))
		require.NoError(t, err)
		require.False(t, result.Success)
		assert.Equal(t, translator.ErrorCategoryNotFound, result.Error.Category)
	})
}

// =============================================================================
// API Formatter Tests
// =============================================================================

func TestAPIFormatter_Format(t *testing.T) {
	f := NewAPIFormatter()

	t.Run("print command", func(t *testing.T) {
		cmd := &translator.CanonicalCommand{
			Path:   "/interface/ethernet",
			Action: translator.ActionPrint,
		}

		data, err := f.Format(cmd)
		require.NoError(t, err)

		var apiCmd APICommand
		err = json.Unmarshal(data, &apiCmd)
		require.NoError(t, err)

		assert.Equal(t, "/interface/ethernet/print", apiCmd.Command)
	})

	t.Run("add command", func(t *testing.T) {
		cmd := &translator.CanonicalCommand{
			Path:   "/interface/bridge",
			Action: translator.ActionAdd,
			Parameters: map[string]interface{}{
				"name":          "bridge1",
				"protocol-mode": "stp",
			},
		}

		data, err := f.Format(cmd)
		require.NoError(t, err)

		var apiCmd APICommand
		err = json.Unmarshal(data, &apiCmd)
		require.NoError(t, err)

		assert.Equal(t, "/interface/bridge/add", apiCmd.Command)
		assert.Contains(t, apiCmd.Args, "=name=bridge1")
		assert.Contains(t, apiCmd.Args, "=protocol-mode=stp")
	})

	t.Run("set command with ID", func(t *testing.T) {
		cmd := &translator.CanonicalCommand{
			Path:   "/interface/ethernet",
			Action: translator.ActionSet,
			ID:     "*1",
			Parameters: map[string]interface{}{
				"disabled": false,
			},
		}

		data, err := f.Format(cmd)
		require.NoError(t, err)

		var apiCmd APICommand
		err = json.Unmarshal(data, &apiCmd)
		require.NoError(t, err)

		assert.Equal(t, "/interface/ethernet/set", apiCmd.Command)
		assert.Contains(t, apiCmd.Args, "=.id=*1")
		assert.Contains(t, apiCmd.Args, "=disabled=no")
	})

	t.Run("print with filter", func(t *testing.T) {
		cmd := &translator.CanonicalCommand{
			Path:   "/interface",
			Action: translator.ActionPrint,
			Filters: []translator.Filter{
				{Field: "type", Operator: translator.FilterOpEquals, Value: "ether"},
			},
		}

		data, err := f.Format(cmd)
		require.NoError(t, err)

		var apiCmd APICommand
		err = json.Unmarshal(data, &apiCmd)
		require.NoError(t, err)

		assert.Contains(t, apiCmd.Args, "?type=ether")
	})
}

func TestAPIFormatter_Parse(t *testing.T) {
	f := NewAPIFormatter()

	t.Run("parse JSON response", func(t *testing.T) {
		response := `{"re":[{"name":"ether1","type":"ether"},{"name":"ether2","type":"ether"}]}`

		result, err := f.Parse([]byte(response))
		require.NoError(t, err)
		require.True(t, result.Success)

		data := result.Data.([]map[string]interface{})
		assert.Len(t, data, 2)
	})

	t.Run("parse add response", func(t *testing.T) {
		response := `{"done":{"ret":"*A1"}}`

		result, err := f.Parse([]byte(response))
		require.NoError(t, err)
		require.True(t, result.Success)
		assert.Equal(t, "*A1", result.ID)
	})

	t.Run("parse trap response", func(t *testing.T) {
		response := `{"trap":{"category":"2","message":"no such item"}}`

		result, err := f.Parse([]byte(response))
		require.NoError(t, err)
		require.False(t, result.Success)
		assert.Equal(t, translator.ErrorCategoryNotFound, result.Error.Category)
	})
}

// =============================================================================
// SSH Formatter Tests
// =============================================================================

func TestSSHFormatter_Format(t *testing.T) {
	f := NewSSHFormatter()

	t.Run("print command", func(t *testing.T) {
		cmd := &translator.CanonicalCommand{
			Path:   "/interface/ethernet",
			Action: translator.ActionPrint,
		}

		data, err := f.Format(cmd)
		require.NoError(t, err)

		var sshCmd SSHCommand
		err = json.Unmarshal(data, &sshCmd)
		require.NoError(t, err)

		assert.Equal(t, "/interface ethernet print", sshCmd.Script)
	})

	t.Run("add command", func(t *testing.T) {
		cmd := &translator.CanonicalCommand{
			Path:   "/interface/bridge",
			Action: translator.ActionAdd,
			Parameters: map[string]interface{}{
				"name": "bridge1",
			},
		}

		data, err := f.Format(cmd)
		require.NoError(t, err)

		var sshCmd SSHCommand
		err = json.Unmarshal(data, &sshCmd)
		require.NoError(t, err)

		assert.Contains(t, sshCmd.Script, "/interface bridge add")
		assert.Contains(t, sshCmd.Script, "name=bridge1")
	})

	t.Run("set command with ID", func(t *testing.T) {
		cmd := &translator.CanonicalCommand{
			Path:   "/interface/ethernet",
			Action: translator.ActionSet,
			ID:     "*1",
			Parameters: map[string]interface{}{
				"disabled": false,
			},
		}

		data, err := f.Format(cmd)
		require.NoError(t, err)

		var sshCmd SSHCommand
		err = json.Unmarshal(data, &sshCmd)
		require.NoError(t, err)

		assert.Contains(t, sshCmd.Script, "[find .id=*1]")
		assert.Contains(t, sshCmd.Script, "disabled=no")
	})

	t.Run("remove command", func(t *testing.T) {
		cmd := &translator.CanonicalCommand{
			Path:   "/interface/bridge",
			Action: translator.ActionRemove,
			ID:     "*A1",
		}

		data, err := f.Format(cmd)
		require.NoError(t, err)

		var sshCmd SSHCommand
		err = json.Unmarshal(data, &sshCmd)
		require.NoError(t, err)

		assert.Contains(t, sshCmd.Script, "remove")
		assert.Contains(t, sshCmd.Script, "[find .id=*A1]")
	})

	t.Run("value with spaces is quoted", func(t *testing.T) {
		cmd := &translator.CanonicalCommand{
			Path:   "/interface/bridge",
			Action: translator.ActionAdd,
			Parameters: map[string]interface{}{
				"comment": "Main bridge for LAN",
			},
		}

		data, err := f.Format(cmd)
		require.NoError(t, err)

		var sshCmd SSHCommand
		err = json.Unmarshal(data, &sshCmd)
		require.NoError(t, err)

		assert.Contains(t, sshCmd.Script, `comment="Main bridge for LAN"`)
	})
}

func TestSSHFormatter_Parse(t *testing.T) {
	f := NewSSHFormatter()

	t.Run("parse table output", func(t *testing.T) {
		response := `Flags: X - disabled; R - running
 0 R  ether1       ether  1500  00:11:22:33:44:55
 1 R  ether2       ether  1500  00:11:22:33:44:56`

		result, err := f.Parse([]byte(response))
		require.NoError(t, err)
		require.True(t, result.Success)

		data := result.Data.([]map[string]interface{})
		assert.Len(t, data, 2)
		assert.Equal(t, "ether1", data[0]["name"])
	})

	t.Run("parse ID return", func(t *testing.T) {
		response := `*A1B2C3`

		result, err := f.Parse([]byte(response))
		require.NoError(t, err)
		require.True(t, result.Success)
		assert.Equal(t, "*A1B2C3", result.ID)
	})

	t.Run("parse error response", func(t *testing.T) {
		response := `no such item`

		result, err := f.Parse([]byte(response))
		require.NoError(t, err)
		require.False(t, result.Success)
		assert.Equal(t, translator.ErrorCategoryNotFound, result.Error.Category)
	})

	t.Run("parse key-value output", func(t *testing.T) {
		response := `name: ether1
type: ether
mtu: 1500
mac-address: 00:11:22:33:44:55`

		result, err := f.Parse([]byte(response))
		require.NoError(t, err)
		require.True(t, result.Success)

		data := result.Data.([]map[string]interface{})
		assert.Equal(t, "ether1", data[0]["name"])
		assert.Equal(t, "1500", data[0]["mtu"])
	})
}
