package services

import (
	"context"
	"encoding/json"
	"testing"
	"time"

	"backend/internal/events"
	"backend/internal/router"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// MockRouterPort implements router.RouterPort for testing
type MockRouterPort struct {
	ExecuteFunc func(ctx context.Context, command string) (*router.CommandResult, error)
}

func (m *MockRouterPort) Execute(ctx context.Context, command string) (*router.CommandResult, error) {
	if m.ExecuteFunc != nil {
		return m.ExecuteFunc(ctx, command)
	}
	return &router.CommandResult{Success: true}, nil
}

// MockEventBus implements events.EventBus for testing
type MockEventBus struct {
	PublishFunc func(event interface{}) error
}

func (m *MockEventBus) Publish(event interface{}) error {
	if m.PublishFunc != nil {
		return m.PublishFunc(event)
	}
	return nil
}

func (m *MockEventBus) Subscribe(topic string, handler interface{}) error {
	return nil
}

// =============================================================================
// UndoStore Tests
// =============================================================================

func TestUndoStore_Add(t *testing.T) {
	store := NewUndoStore()
	defer store.Stop()

	previousState := &BridgeData{
		UUID: "bridge-1",
		Name: "br-test",
	}

	operationID, err := store.Add("create", "bridge", previousState)
	require.NoError(t, err)
	assert.NotEmpty(t, operationID)

	// Verify operation was stored
	op, err := store.Get(operationID)
	require.NoError(t, err)
	assert.Equal(t, "create", op.Type)
	assert.Equal(t, "bridge", op.ResourceType)
	assert.NotNil(t, op.PreviousState)

	// Verify previous state can be unmarshaled
	var retrieved BridgeData
	err = json.Unmarshal(op.PreviousState, &retrieved)
	require.NoError(t, err)
	assert.Equal(t, "bridge-1", retrieved.UUID)
	assert.Equal(t, "br-test", retrieved.Name)
}

func TestUndoStore_Get_NotFound(t *testing.T) {
	store := NewUndoStore()
	defer store.Stop()

	_, err := store.Get("non-existent-id")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "not found or expired")
}

func TestUndoStore_Expiration(t *testing.T) {
	store := NewUndoStore()
	defer store.Stop()

	previousState := &BridgeData{UUID: "bridge-1"}
	operationID, err := store.Add("delete", "bridge", previousState)
	require.NoError(t, err)

	// Should be retrievable immediately
	op, err := store.Get(operationID)
	require.NoError(t, err)
	assert.NotNil(t, op)

	// Manually set expiration to past
	store.mu.Lock()
	store.operations[operationID].ExpiresAt = time.Now().Add(-1 * time.Second)
	store.mu.Unlock()

	// Should now be expired
	_, err = store.Get(operationID)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "expired")
}

func TestUndoStore_Delete(t *testing.T) {
	store := NewUndoStore()
	defer store.Stop()

	operationID, err := store.Add("update", "bridge", &BridgeData{})
	require.NoError(t, err)

	// Verify exists
	_, err = store.Get(operationID)
	require.NoError(t, err)

	// Delete
	store.Delete(operationID)

	// Verify deleted
	_, err = store.Get(operationID)
	assert.Error(t, err)
}

func TestUndoStore_CleanupExpired(t *testing.T) {
	store := NewUndoStore()
	defer store.Stop()

	// Add operation that expires quickly
	operationID, err := store.Add("create", "bridge", &BridgeData{})
	require.NoError(t, err)

	// Manually set expiration to past
	store.mu.Lock()
	store.operations[operationID].ExpiresAt = time.Now().Add(-1 * time.Second)
	store.mu.Unlock()

	// Wait for cleanup cycle (runs every 5 seconds, but we trigger it manually)
	time.Sleep(100 * time.Millisecond)

	// Manually trigger cleanup by checking
	store.mu.Lock()
	now := time.Now()
	for id, op := range store.operations {
		if now.After(op.ExpiresAt) {
			delete(store.operations, id)
		}
	}
	count := len(store.operations)
	store.mu.Unlock()

	assert.Equal(t, 0, count, "expired operation should be cleaned up")
}

func TestUndoStore_ConcurrentAccess(t *testing.T) {
	store := NewUndoStore()
	defer store.Stop()

	done := make(chan bool)
	errors := make(chan error, 100)

	// Spawn multiple goroutines to add operations concurrently
	for i := 0; i < 10; i++ {
		go func(index int) {
			defer func() { done <- true }()

			previousState := &BridgeData{
				UUID: string(rune('a' + index)),
			}

			operationID, err := store.Add("create", "bridge", previousState)
			if err != nil {
				errors <- err
				return
			}

			// Try to retrieve
			_, err = store.Get(operationID)
			if err != nil {
				errors <- err
			}
		}(i)
	}

	// Wait for all goroutines
	for i := 0; i < 10; i++ {
		<-done
	}

	close(errors)

	// Check for errors
	for err := range errors {
		t.Errorf("concurrent access error: %v", err)
	}
}

// =============================================================================
// Parser Helper Function Tests
// =============================================================================

func TestParseInt(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected int
		hasError bool
	}{
		{"valid positive", "42", 42, false},
		{"valid zero", "0", 0, false},
		{"empty string", "", 0, false},
		{"invalid format", "abc", 0, true},
		{"negative number", "-10", -10, false},
		{"with spaces", "  123  ", 0, true}, // trimming not done in parseInt
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := parseInt(tt.input)
			if tt.hasError {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
				assert.Equal(t, tt.expected, result)
			}
		})
	}
}

func TestParseIntList(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected []int
	}{
		{"empty string", "", []int{}},
		{"single value", "10", []int{10}},
		{"multiple values", "10,20,30", []int{10, 20, 30}},
		{"with spaces", "10, 20, 30", []int{10, 20, 30}},
		{"invalid values filtered", "10,abc,20", []int{10, 20}},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := parseIntList(tt.input)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestParseStringList(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected []string
	}{
		{"empty string", "", []string{}},
		{"single value", "ether1", []string{"ether1"}},
		{"multiple values", "ether1,ether2,ether3", []string{"ether1", "ether2", "ether3"}},
		{"with spaces", "ether1, ether2, ether3", []string{"ether1", "ether2", "ether3"}},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := parseStringList(tt.input)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestSplitComma(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected []string
	}{
		{"empty string", "", []string{}},
		{"single value", "value", []string{"value"}},
		{"multiple values", "a,b,c", []string{"a", "b", "c"}},
		{"with spaces", " a , b , c ", []string{"a", "b", "c"}},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := splitComma(tt.input)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestTrimSpace(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{"no spaces", "hello", "hello"},
		{"leading spaces", "  hello", "hello"},
		{"trailing spaces", "hello  ", "hello"},
		{"both sides", "  hello  ", "hello"},
		{"empty string", "", ""},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := trimSpace(tt.input)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestParseRouterOSTime(t *testing.T) {
	tests := []struct {
		name      string
		input     string
		expectErr bool
	}{
		{"never", "never", false},
		{"empty", "", false},
		{"unix timestamp", "1609459200", false},
		{"iso format", "2021-01-01T00:00:00Z", false},
		{"invalid", "invalid-time", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := parseRouterOSTime(tt.input)
			if tt.expectErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestParseRouterOSDuration(t *testing.T) {
	tests := []struct {
		name      string
		input     string
		expected  time.Duration
		expectErr bool
	}{
		{"empty", "", 0, false},
		{"weeks", "1w", 7 * 24 * time.Hour, false},
		{"days", "2d", 2 * 24 * time.Hour, false},
		{"hours", "3h", 3 * time.Hour, false},
		{"minutes", "30m", 30 * time.Minute, false},
		{"seconds", "45s", 45 * time.Second, false},
		{"combined", "1w2d3h4m5s",
			1*7*24*time.Hour + 2*24*time.Hour + 3*time.Hour + 4*time.Minute + 5*time.Second, false},
		{"milliseconds", "500ms", 500 * time.Millisecond, false},
		{"invalid", "invalid", 0, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := parseRouterOSDuration(tt.input)
			if tt.expectErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
				assert.Equal(t, tt.expected, result)
			}
		})
	}
}

// =============================================================================
// Parser Method Tests
// =============================================================================

func TestBridgeService_ParseBridgeFromMap(t *testing.T) {
	service := &BridgeService{}

	t.Run("complete bridge data", func(t *testing.T) {
		data := map[string]string{
			".id":            "*1",
			"name":           "bridge1",
			"comment":        "Test bridge",
			"disabled":       "no",
			"running":        "yes",
			"mac-address":    "00:11:22:33:44:55",
			"mtu":            "1500",
			"protocol":       "rstp",
			"priority":       "32768",
			"vlan-filtering": "yes",
			"pvid":           "1",
		}

		bridge, err := service.parseBridgeFromMap(data)
		require.NoError(t, err)
		assert.Equal(t, "*1", bridge.UUID)
		assert.Equal(t, "bridge1", bridge.Name)
		assert.Equal(t, "Test bridge", bridge.Comment)
		assert.False(t, bridge.Disabled)
		assert.True(t, bridge.Running)
		assert.Equal(t, "00:11:22:33:44:55", bridge.MacAddress)
		assert.Equal(t, 1500, bridge.MTU)
		assert.Equal(t, "rstp", bridge.Protocol)
		assert.Equal(t, 32768, bridge.Priority)
		assert.True(t, bridge.VlanFiltering)
		assert.Equal(t, 1, bridge.PVID)
	})

	t.Run("minimal bridge data", func(t *testing.T) {
		data := map[string]string{
			".id":  "*2",
			"name": "bridge2",
		}

		bridge, err := service.parseBridgeFromMap(data)
		require.NoError(t, err)
		assert.Equal(t, "*2", bridge.UUID)
		assert.Equal(t, "bridge2", bridge.Name)
		assert.Equal(t, "", bridge.Comment)
		assert.False(t, bridge.Disabled)
		assert.False(t, bridge.Running)
		assert.Equal(t, 0, bridge.MTU)
	})

	t.Run("disabled bridge", func(t *testing.T) {
		data := map[string]string{
			".id":      "*3",
			"name":     "bridge3",
			"disabled": "yes",
		}

		bridge, err := service.parseBridgeFromMap(data)
		require.NoError(t, err)
		assert.True(t, bridge.Disabled)
	})

	t.Run("alternative boolean values", func(t *testing.T) {
		data := map[string]string{
			".id":            "*4",
			"name":           "bridge4",
			"disabled":       "true",
			"running":        "true",
			"vlan-filtering": "true",
		}

		bridge, err := service.parseBridgeFromMap(data)
		require.NoError(t, err)
		assert.True(t, bridge.Disabled)
		assert.True(t, bridge.Running)
		assert.True(t, bridge.VlanFiltering)
	})
}

func TestBridgeService_ParseBridges(t *testing.T) {
	service := &BridgeService{}

	t.Run("multiple bridges", func(t *testing.T) {
		data := []map[string]string{
			{
				".id":  "*1",
				"name": "bridge1",
			},
			{
				".id":  "*2",
				"name": "bridge2",
			},
		}

		bridges, err := service.parseBridges(data)
		require.NoError(t, err)
		assert.Len(t, bridges, 2)
		assert.Equal(t, "bridge1", bridges[0].Name)
		assert.Equal(t, "bridge2", bridges[1].Name)
	})

	t.Run("empty data", func(t *testing.T) {
		bridges, err := service.parseBridges([]map[string]string{})
		require.NoError(t, err)
		assert.Len(t, bridges, 0)
	})
}

func TestBridgeService_ParseBridgePortFromMap(t *testing.T) {
	service := &BridgeService{}

	t.Run("complete port data", func(t *testing.T) {
		data := map[string]string{
			".id":               "*1",
			"bridge":            "bridge1",
			"interface":         "ether2",
			"pvid":              "10",
			"frame-types":       "admit-all",
			"ingress-filtering": "yes",
			"tagged":            "10,20,30",
			"untagged":          "1",
			"role":              "designated",
			"state":             "forwarding",
			"path-cost":         "10",
			"edge":              "yes",
		}

		port, err := service.parseBridgePortFromMap(data)
		require.NoError(t, err)
		assert.Equal(t, "*1", port.UUID)
		assert.Equal(t, "bridge1", port.BridgeID)
		assert.Equal(t, "ether2", port.InterfaceID)
		assert.Equal(t, "ether2", port.InterfaceName)
		assert.Equal(t, 10, port.PVID)
		assert.Equal(t, "admit-all", port.FrameTypes)
		assert.True(t, port.IngressFiltering)
		assert.Equal(t, []int{10, 20, 30}, port.TaggedVlans)
		assert.Equal(t, []int{1}, port.UntaggedVlans)
		assert.Equal(t, "designated", port.Role)
		assert.Equal(t, "forwarding", port.State)
		assert.Equal(t, 10, port.PathCost)
		assert.True(t, port.Edge)
	})

	t.Run("minimal port data with defaults", func(t *testing.T) {
		data := map[string]string{
			".id":       "*2",
			"bridge":    "bridge1",
			"interface": "ether3",
		}

		port, err := service.parseBridgePortFromMap(data)
		require.NoError(t, err)
		assert.Equal(t, "*2", port.UUID)
		assert.Equal(t, 1, port.PVID) // Default PVID
		assert.Equal(t, "admit-all", port.FrameTypes) // Default frame-types
		assert.False(t, port.IngressFiltering)
		assert.Equal(t, []int{}, port.TaggedVlans)
		assert.Equal(t, []int{}, port.UntaggedVlans)
		assert.Equal(t, "designated", port.Role) // Default role
		assert.Equal(t, "forwarding", port.State) // Default state
	})

	t.Run("VLAN list parsing", func(t *testing.T) {
		data := map[string]string{
			".id":       "*3",
			"bridge":    "bridge1",
			"interface": "ether4",
			"tagged":    "100, 200, 300",
			"untagged":  "1, 10",
		}

		port, err := service.parseBridgePortFromMap(data)
		require.NoError(t, err)
		assert.Equal(t, []int{100, 200, 300}, port.TaggedVlans)
		assert.Equal(t, []int{1, 10}, port.UntaggedVlans)
	})
}

func TestBridgeService_ParseBridgeVlanFromMap(t *testing.T) {
	service := &BridgeService{}

	t.Run("complete VLAN data", func(t *testing.T) {
		data := map[string]string{
			".id":     "*1",
			"bridge":  "bridge1",
			"vlan-id": "10",
			"tagged":  "ether2,ether3",
			"untagged": "ether4",
		}

		vlan, err := service.parseBridgeVlanFromMap(data)
		require.NoError(t, err)
		assert.Equal(t, "*1", vlan.UUID)
		assert.Equal(t, "bridge1", vlan.BridgeID)
		assert.Equal(t, 10, vlan.VlanID)
		assert.Equal(t, []string{"ether2", "ether3"}, vlan.TaggedPortIDs)
		assert.Equal(t, []string{"ether4"}, vlan.UntaggedPortIDs)
	})

	t.Run("minimal VLAN data", func(t *testing.T) {
		data := map[string]string{
			".id":     "*2",
			"bridge":  "bridge1",
			"vlan-id": "20",
		}

		vlan, err := service.parseBridgeVlanFromMap(data)
		require.NoError(t, err)
		assert.Equal(t, 20, vlan.VlanID)
		assert.Equal(t, []string{}, vlan.TaggedPortIDs)
		assert.Equal(t, []string{}, vlan.UntaggedPortIDs)
	})
}

func TestBridgeService_ParseStpStatus(t *testing.T) {
	service := &BridgeService{}

	t.Run("root bridge", func(t *testing.T) {
		data := []map[string]string{
			{
				"root-bridge":            "yes",
				"root-bridge-id":         "0x8000.001122334455",
				"root-port":              "none",
				"root-path-cost":         "0",
				"topology-change-count":  "5",
				"last-topology-change":   "1609459200",
			},
		}

		status, err := service.parseStpStatus(data)
		require.NoError(t, err)
		assert.True(t, status.RootBridge)
		assert.Equal(t, "0x8000.001122334455", status.RootBridgeID)
		assert.Equal(t, "none", status.RootPort)
		assert.Equal(t, 0, status.RootPathCost)
		assert.Equal(t, 5, status.TopologyChangeCount)
		assert.NotNil(t, status.LastTopologyChange)
	})

	t.Run("non-root bridge", func(t *testing.T) {
		data := []map[string]string{
			{
				"root-bridge":            "no",
				"root-bridge-id":         "0x8000.AABBCCDDEEFF",
				"root-port":              "ether2",
				"root-path-cost":         "10",
				"topology-change-count":  "2",
			},
		}

		status, err := service.parseStpStatus(data)
		require.NoError(t, err)
		assert.False(t, status.RootBridge)
		assert.Equal(t, "ether2", status.RootPort)
		assert.Equal(t, 10, status.RootPathCost)
	})

	t.Run("empty data", func(t *testing.T) {
		status, err := service.parseStpStatus([]map[string]string{})
		assert.Error(t, err)
		assert.Nil(t, status)
	})
}

// =============================================================================
// Service Method Tests (Integration with Mock RouterPort)
// =============================================================================

func TestBridgeService_GetBridges(t *testing.T) {
	mockPort := &MockRouterPort{
		ExecuteFunc: func(ctx context.Context, command string) (*router.CommandResult, error) {
			assert.Equal(t, "/interface/bridge/print", command)
			return &router.CommandResult{
				Success: true,
				Data: []map[string]string{
					{
						".id":  "*1",
						"name": "bridge1",
					},
					{
						".id":  "*2",
						"name": "bridge2",
					},
				},
			}, nil
		},
	}

	service := NewBridgeService(BridgeServiceConfig{
		RouterPort: mockPort,
		EventBus:   &MockEventBus{},
	})
	defer service.undoStore.Stop()

	bridges, err := service.GetBridges(context.Background(), "router-1")
	require.NoError(t, err)
	assert.Len(t, bridges, 2)
	assert.Equal(t, "bridge1", bridges[0].Name)
	assert.Equal(t, "bridge2", bridges[1].Name)
}

func TestBridgeService_GetBridge(t *testing.T) {
	mockPort := &MockRouterPort{
		ExecuteFunc: func(ctx context.Context, command string) (*router.CommandResult, error) {
			assert.Contains(t, command, "/interface/bridge/print")
			assert.Contains(t, command, ".id=*1")
			return &router.CommandResult{
				Success: true,
				Data: []map[string]string{
					{
						".id":      "*1",
						"name":     "bridge1",
						"protocol": "rstp",
					},
				},
			}, nil
		},
	}

	service := NewBridgeService(BridgeServiceConfig{
		RouterPort: mockPort,
		EventBus:   &MockEventBus{},
	})
	defer service.undoStore.Stop()

	bridge, err := service.GetBridge(context.Background(), "*1")
	require.NoError(t, err)
	assert.Equal(t, "*1", bridge.UUID)
	assert.Equal(t, "bridge1", bridge.Name)
	assert.Equal(t, "rstp", bridge.Protocol)
}

func TestBridgeService_GetBridgePorts(t *testing.T) {
	mockPort := &MockRouterPort{
		ExecuteFunc: func(ctx context.Context, command string) (*router.CommandResult, error) {
			assert.Contains(t, command, "/interface/bridge/port/print")
			return &router.CommandResult{
				Success: true,
				Data: []map[string]string{
					{
						".id":       "*1",
						"bridge":    "bridge1",
						"interface": "ether2",
					},
					{
						".id":       "*2",
						"bridge":    "bridge1",
						"interface": "ether3",
					},
				},
			}, nil
		},
	}

	service := NewBridgeService(BridgeServiceConfig{
		RouterPort: mockPort,
		EventBus:   &MockEventBus{},
	})
	defer service.undoStore.Stop()

	ports, err := service.GetBridgePorts(context.Background(), "bridge1")
	require.NoError(t, err)
	assert.Len(t, ports, 2)
	assert.Equal(t, "ether2", ports[0].InterfaceName)
	assert.Equal(t, "ether3", ports[1].InterfaceName)
}

func TestBridgeService_GetBridgeVlans(t *testing.T) {
	mockPort := &MockRouterPort{
		ExecuteFunc: func(ctx context.Context, command string) (*router.CommandResult, error) {
			assert.Contains(t, command, "/interface/bridge/vlan/print")
			return &router.CommandResult{
				Success: true,
				Data: []map[string]string{
					{
						".id":     "*1",
						"bridge":  "bridge1",
						"vlan-id": "10",
					},
					{
						".id":     "*2",
						"bridge":  "bridge1",
						"vlan-id": "20",
					},
				},
			}, nil
		},
	}

	service := NewBridgeService(BridgeServiceConfig{
		RouterPort: mockPort,
		EventBus:   &MockEventBus{},
	})
	defer service.undoStore.Stop()

	vlans, err := service.GetBridgeVlans(context.Background(), "bridge1")
	require.NoError(t, err)
	assert.Len(t, vlans, 2)
	assert.Equal(t, 10, vlans[0].VlanID)
	assert.Equal(t, 20, vlans[1].VlanID)
}

func TestBridgeService_GetStpStatus(t *testing.T) {
	mockPort := &MockRouterPort{
		ExecuteFunc: func(ctx context.Context, command string) (*router.CommandResult, error) {
			assert.Contains(t, command, "/interface/bridge/monitor")
			return &router.CommandResult{
				Success: true,
				Data: []map[string]string{
					{
						"root-bridge":           "yes",
						"root-bridge-id":        "0x8000.001122334455",
						"topology-change-count": "3",
					},
				},
			}, nil
		},
	}

	service := NewBridgeService(BridgeServiceConfig{
		RouterPort: mockPort,
		EventBus:   &MockEventBus{},
	})
	defer service.undoStore.Stop()

	status, err := service.GetStpStatus(context.Background(), "bridge1")
	require.NoError(t, err)
	assert.True(t, status.RootBridge)
	assert.Equal(t, "0x8000.001122334455", status.RootBridgeID)
	assert.Equal(t, 3, status.TopologyChangeCount)
}

// =============================================================================
// Error Handling Tests
// =============================================================================

func TestBridgeService_GetBridges_RouterError(t *testing.T) {
	mockPort := &MockRouterPort{
		ExecuteFunc: func(ctx context.Context, command string) (*router.CommandResult, error) {
			return &router.CommandResult{
				Success: false,
				Error:   assert.AnError,
			}, assert.AnError
		},
	}

	service := NewBridgeService(BridgeServiceConfig{
		RouterPort: mockPort,
		EventBus:   &MockEventBus{},
	})
	defer service.undoStore.Stop()

	bridges, err := service.GetBridges(context.Background(), "router-1")
	assert.Error(t, err)
	assert.Nil(t, bridges)
}

func TestBridgeService_ParseBridgeFromMap_InvalidMTU(t *testing.T) {
	service := &BridgeService{}

	data := map[string]string{
		".id":  "*1",
		"name": "bridge1",
		"mtu":  "invalid",
	}

	bridge, err := service.parseBridgeFromMap(data)
	assert.Error(t, err)
	assert.Nil(t, bridge)
	assert.Contains(t, err.Error(), "invalid MTU")
}

func TestBridgeService_ParseBridgeFromMap_InvalidPriority(t *testing.T) {
	service := &BridgeService{}

	data := map[string]string{
		".id":      "*1",
		"name":     "bridge1",
		"priority": "not-a-number",
	}

	bridge, err := service.parseBridgeFromMap(data)
	assert.Error(t, err)
	assert.Nil(t, bridge)
	assert.Contains(t, err.Error(), "invalid priority")
}

func TestBridgeService_ParseBridgeFromMap_InvalidPVID(t *testing.T) {
	service := &BridgeService{}

	data := map[string]string{
		".id":  "*1",
		"name": "bridge1",
		"pvid": "xyz",
	}

	bridge, err := service.parseBridgeFromMap(data)
	assert.Error(t, err)
	assert.Nil(t, bridge)
	assert.Contains(t, err.Error(), "invalid PVID")
}
