package translator

import (
	"context"
	"errors"
	"testing"
	"time"

	"backend/internal/router"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestAdapterBridge_ToRouterCommand(t *testing.T) {
	bridge := NewAdapterBridge(nil)

	t.Run("basic print command", func(t *testing.T) {
		cmd := &CanonicalCommand{
			Path:   "/interface",
			Action: ActionPrint,
		}

		result := bridge.ToRouterCommand(cmd)
		assert.Equal(t, "/interface", result.Path)
		assert.Equal(t, "print", result.Action)
	})

	t.Run("add command with parameters", func(t *testing.T) {
		cmd := &CanonicalCommand{
			Path:   "/interface/bridge",
			Action: ActionAdd,
			Parameters: map[string]interface{}{
				"name":    "bridge1",
				"comment": "Main bridge",
			},
		}

		result := bridge.ToRouterCommand(cmd)
		assert.Equal(t, "add", result.Action)
		assert.Equal(t, "bridge1", result.Args["name"])
		assert.Equal(t, "Main bridge", result.Args["comment"])
	})

	t.Run("set command with ID", func(t *testing.T) {
		cmd := &CanonicalCommand{
			Path:   "/interface/ethernet",
			Action: ActionSet,
			ID:     "*1",
			Parameters: map[string]interface{}{
				"mtu": 1500,
			},
		}

		result := bridge.ToRouterCommand(cmd)
		assert.Equal(t, "*1", result.ID)
		assert.Equal(t, "1500", result.Args["mtu"])
	})

	t.Run("print with filters", func(t *testing.T) {
		cmd := &CanonicalCommand{
			Path:   "/interface",
			Action: ActionPrint,
			Filters: []Filter{
				{Field: "type", Value: "ether", Operator: FilterOpEquals},
				{Field: "disabled", Value: "no", Operator: FilterOpEquals},
			},
		}

		result := bridge.ToRouterCommand(cmd)
		assert.Contains(t, result.Query, "type=ether")
		assert.Contains(t, result.Query, "disabled=no")
	})

	t.Run("print with proplist", func(t *testing.T) {
		cmd := &CanonicalCommand{
			Path:     "/interface",
			Action:   ActionPrint,
			PropList: []string{"name", "mac-address", "mtu"},
		}

		result := bridge.ToRouterCommand(cmd)
		assert.Equal(t, "name,mac-address,mtu", result.Args[".proplist"])
	})

	t.Run("nil command returns empty", func(t *testing.T) {
		result := bridge.ToRouterCommand(nil)
		assert.Equal(t, "", result.Path)
	})
}

func TestAdapterBridge_FromCommandResult(t *testing.T) {
	bridge := NewAdapterBridge(nil)

	t.Run("successful result with data", func(t *testing.T) {
		result := &router.CommandResult{
			Success: true,
			Data: []map[string]string{
				{"name": "ether1", ".id": "*1"},
				{"name": "ether2", ".id": "*2"},
			},
			Duration: 50 * time.Millisecond,
		}

		response := bridge.FromCommandResult(result, ProtocolAPI)
		require.True(t, response.Success)

		data := response.Data.([]map[string]interface{})
		require.Len(t, data, 2)
		assert.Equal(t, "ether1", data[0]["name"])
		assert.Equal(t, 2, response.Metadata.RecordCount)
		assert.Equal(t, ProtocolAPI, response.Metadata.Protocol)
	})

	t.Run("successful result with ID", func(t *testing.T) {
		result := &router.CommandResult{
			Success: true,
			ID:      "*A1",
		}

		response := bridge.FromCommandResult(result, ProtocolREST)
		require.True(t, response.Success)
		assert.Equal(t, "*A1", response.ID)
	})

	t.Run("failed result", func(t *testing.T) {
		result := &router.CommandResult{
			Success: false,
			Error:   errors.New("item not found"),
		}

		response := bridge.FromCommandResult(result, ProtocolSSH)
		require.False(t, response.Success)
		assert.Equal(t, "ADAPTER_ERROR", response.Error.Code)
		assert.Contains(t, response.Error.Message, "not found")
		assert.Equal(t, ErrorCategoryNotFound, response.Error.Category)
	})

	t.Run("nil result returns success", func(t *testing.T) {
		response := bridge.FromCommandResult(nil, ProtocolAPI)
		require.True(t, response.Success)
	})

	t.Run("adapter error with retryable flag", func(t *testing.T) {
		adapterErr := &router.AdapterError{
			Protocol:  router.ProtocolAPI,
			Operation: "ExecuteCommand",
			Message:   "connection reset",
			Retryable: true,
		}
		result := &router.CommandResult{
			Success: false,
			Error:   adapterErr,
		}

		response := bridge.FromCommandResult(result, ProtocolAPI)
		require.False(t, response.Success)
		assert.Equal(t, ErrorCategoryConnection, response.Error.Category)
	})
}

func TestMapRouterProtocol(t *testing.T) {
	tests := []struct {
		input    router.Protocol
		expected Protocol
	}{
		{router.ProtocolREST, ProtocolREST},
		{router.ProtocolAPI, ProtocolAPI},
		{router.ProtocolAPISSL, ProtocolAPI},
		{router.ProtocolSSH, ProtocolSSH},
		{router.ProtocolTelnet, ProtocolSSH},
	}

	for _, tt := range tests {
		t.Run(tt.input.String(), func(t *testing.T) {
			assert.Equal(t, tt.expected, MapRouterProtocol(tt.input))
		})
	}
}

func TestMapRouterVersion(t *testing.T) {
	t.Run("converts version", func(t *testing.T) {
		v := &router.RouterOSVersion{Major: 7, Minor: 13, Patch: 1}
		result := MapRouterVersion(v)
		assert.Equal(t, 7, result.Major)
		assert.Equal(t, 13, result.Minor)
		assert.Equal(t, 1, result.Patch)
	})

	t.Run("nil version returns nil", func(t *testing.T) {
		assert.Nil(t, MapRouterVersion(nil))
	})
}

// mockRouterPort implements router.RouterPort for testing.
type mockRouterPort struct {
	protocol     router.Protocol
	info         *router.RouterInfo
	infoErr      error
	execResults  []*router.CommandResult
	execErrors   []error
	execIndex    int
	connected    bool
	lastCommands []router.Command
}

func (m *mockRouterPort) Connect(ctx context.Context) error { m.connected = true; return nil }
func (m *mockRouterPort) Disconnect() error                 { m.connected = false; return nil }
func (m *mockRouterPort) IsConnected() bool                 { return m.connected }
func (m *mockRouterPort) Health(ctx context.Context) router.HealthStatus {
	return router.HealthStatus{Status: router.StatusConnected}
}
func (m *mockRouterPort) Capabilities() router.PlatformCapabilities {
	return router.PlatformCapabilities{}
}
func (m *mockRouterPort) Info() (*router.RouterInfo, error) {
	return m.info, m.infoErr
}
func (m *mockRouterPort) ExecuteCommand(ctx context.Context, cmd router.Command) (*router.CommandResult, error) {
	m.lastCommands = append(m.lastCommands, cmd)
	if m.execIndex >= len(m.execResults) {
		return &router.CommandResult{Success: true}, nil
	}
	result := m.execResults[m.execIndex]
	var err error
	if m.execIndex < len(m.execErrors) {
		err = m.execErrors[m.execIndex]
	}
	m.execIndex++
	return result, err
}
func (m *mockRouterPort) QueryState(ctx context.Context, query router.StateQuery) (*router.StateResult, error) {
	return &router.StateResult{}, nil
}
func (m *mockRouterPort) Protocol() router.Protocol {
	return m.protocol
}

func TestTranslatingPort_Query(t *testing.T) {
	mock := &mockRouterPort{
		protocol:  router.ProtocolAPI,
		connected: true,
		info: &router.RouterInfo{
			Version: router.RouterOSVersion{Major: 7, Minor: 13},
		},
		execResults: []*router.CommandResult{
			{
				Success: true,
				Data: []map[string]string{
					{".id": "*1", "name": "ether1", "mac-address": "00:11:22:33:44:55"},
					{".id": "*2", "name": "ether2", "mac-address": "AA:BB:CC:DD:EE:FF"},
				},
			},
		},
	}

	translator := NewDefaultTranslator()
	tp := NewTranslatingPort(mock, translator)

	result, err := tp.Query(
		context.Background(),
		"/interface",
		map[string]interface{}{"type": "ether"},
		[]string{"name", "macAddress"},
		CommandMetadata{RequestID: "req-1"},
	)

	require.NoError(t, err)
	require.True(t, result.Success)

	data := result.Data.([]map[string]interface{})
	require.Len(t, data, 2)
	// Field names should be translated to camelCase
	assert.Equal(t, "*1", data[0]["id"])
	assert.Equal(t, "ether1", data[0]["name"])
	assert.Equal(t, "00:11:22:33:44:55", data[0]["macAddress"])
}

func TestTranslatingPort_Create(t *testing.T) {
	mock := &mockRouterPort{
		protocol:  router.ProtocolREST,
		connected: true,
		info: &router.RouterInfo{
			Version: router.RouterOSVersion{Major: 7, Minor: 13},
		},
		execResults: []*router.CommandResult{
			{
				Success: true,
				ID:      "*A1",
			},
		},
	}

	translator := NewDefaultTranslator()
	tp := NewTranslatingPort(mock, translator)

	result, err := tp.Create(
		context.Background(),
		"/interface/bridge",
		map[string]interface{}{"name": "bridge1"},
		CommandMetadata{},
	)

	require.NoError(t, err)
	require.True(t, result.Success)
	assert.Equal(t, "*A1", result.ID)

	// Verify command was sent correctly
	require.Len(t, mock.lastCommands, 1)
	assert.Equal(t, "/interface/bridge", mock.lastCommands[0].Path)
	assert.Equal(t, "add", mock.lastCommands[0].Action)
	assert.Equal(t, "bridge1", mock.lastCommands[0].Args["name"])
}

func TestTranslatingPort_Update(t *testing.T) {
	mock := &mockRouterPort{
		protocol:  router.ProtocolAPI,
		connected: true,
		execResults: []*router.CommandResult{
			{Success: true},
		},
	}

	translator := NewDefaultTranslator()
	tp := NewTranslatingPort(mock, translator)

	result, err := tp.Update(
		context.Background(),
		"/interface/ethernet",
		"*1",
		map[string]interface{}{"enabled": false, "mtu": 1400},
		CommandMetadata{},
	)

	require.NoError(t, err)
	require.True(t, result.Success)

	// Verify enabled -> disabled inversion
	cmd := mock.lastCommands[0]
	assert.Equal(t, "set", cmd.Action)
	assert.Equal(t, "*1", cmd.ID)
	// enabled=false should become disabled=true
	assert.Equal(t, "true", cmd.Args["disabled"])
}

func TestTranslatingPort_Delete(t *testing.T) {
	mock := &mockRouterPort{
		protocol:  router.ProtocolSSH,
		connected: true,
		execResults: []*router.CommandResult{
			{Success: true},
		},
	}

	translator := NewDefaultTranslator()
	tp := NewTranslatingPort(mock, translator)

	result, err := tp.Delete(
		context.Background(),
		"/interface/bridge",
		"*A1",
		CommandMetadata{},
	)

	require.NoError(t, err)
	require.True(t, result.Success)

	cmd := mock.lastCommands[0]
	assert.Equal(t, "remove", cmd.Action)
	assert.Equal(t, "*A1", cmd.ID)
}

func TestTranslatingPort_ErrorHandling(t *testing.T) {
	t.Run("adapter execution error", func(t *testing.T) {
		mock := &mockRouterPort{
			protocol:    router.ProtocolAPI,
			connected:   true,
			execResults: []*router.CommandResult{nil},
			execErrors:  []error{errors.New("connection refused")},
		}

		translator := NewDefaultTranslator()
		tp := NewTranslatingPort(mock, translator)

		result, err := tp.Query(context.Background(), "/interface", nil, nil, CommandMetadata{})
		require.NoError(t, err) // Error is in the response, not returned
		require.False(t, result.Success)
		assert.Equal(t, ErrorCategoryConnection, result.Error.Category)
	})

	t.Run("adapter result error", func(t *testing.T) {
		mock := &mockRouterPort{
			protocol:  router.ProtocolREST,
			connected: true,
			execResults: []*router.CommandResult{
				{
					Success: false,
					Error:   errors.New("no such item"),
				},
			},
		}

		translator := NewDefaultTranslator()
		tp := NewTranslatingPort(mock, translator)

		result, err := tp.Get(context.Background(), "/interface", "*999", CommandMetadata{})
		require.NoError(t, err)
		require.False(t, result.Success)
		assert.Equal(t, ErrorCategoryNotFound, result.Error.Category)
	})
}

func TestBatchExecutor(t *testing.T) {
	t.Run("execute batch successfully", func(t *testing.T) {
		mock := &mockRouterPort{
			protocol:  router.ProtocolAPI,
			connected: true,
			execResults: []*router.CommandResult{
				{Success: true, ID: "*A1"},
				{Success: true},
			},
		}

		translator := NewDefaultTranslator()
		tp := NewTranslatingPort(mock, translator)
		be := NewBatchExecutor(tp)

		commands := []BatchCommand{
			{
				Command: &CanonicalCommand{
					Path:       "/interface/bridge",
					Action:     ActionAdd,
					Parameters: map[string]interface{}{"name": "bridge1"},
				},
				StopOnError: true,
			},
			{
				Command: &CanonicalCommand{
					Path:       "/interface/bridge/port",
					Action:     ActionAdd,
					Parameters: map[string]interface{}{"bridge": "bridge1", "interface": "ether2"},
				},
				StopOnError: false,
			},
		}

		result := be.Execute(context.Background(), commands)
		assert.Equal(t, -1, result.FailedIndex)
		require.Len(t, result.Results, 2)
		assert.True(t, result.Results[0].Success)
		assert.True(t, result.Results[1].Success)
	})

	t.Run("stop on error", func(t *testing.T) {
		mock := &mockRouterPort{
			protocol:  router.ProtocolAPI,
			connected: true,
			execResults: []*router.CommandResult{
				{Success: false, Error: errors.New("invalid name")},
			},
		}

		translator := NewDefaultTranslator()
		tp := NewTranslatingPort(mock, translator)
		be := NewBatchExecutor(tp)

		commands := []BatchCommand{
			{
				Command:     &CanonicalCommand{Path: "/interface/bridge", Action: ActionAdd},
				StopOnError: true,
			},
			{
				Command:     &CanonicalCommand{Path: "/interface/bridge/port", Action: ActionAdd},
				StopOnError: false,
			},
		}

		result := be.Execute(context.Background(), commands)
		assert.Equal(t, 0, result.FailedIndex)
		assert.False(t, result.Results[0].Success)
		// Second command should be skipped
		assert.False(t, result.Results[1].Success)
		assert.Equal(t, "SKIPPED", result.Results[1].Error.Code)
	})

	t.Run("context cancellation", func(t *testing.T) {
		mock := &mockRouterPort{
			protocol:  router.ProtocolAPI,
			connected: true,
		}

		translator := NewDefaultTranslator()
		tp := NewTranslatingPort(mock, translator)
		be := NewBatchExecutor(tp)

		ctx, cancel := context.WithCancel(context.Background())
		cancel() // Cancel immediately

		commands := []BatchCommand{
			{Command: &CanonicalCommand{Path: "/interface", Action: ActionPrint}},
		}

		result := be.Execute(ctx, commands)
		assert.Equal(t, 0, result.FailedIndex)
		assert.False(t, result.Results[0].Success)
		assert.Equal(t, "CANCELLED", result.Results[0].Error.Code)
	})
}
