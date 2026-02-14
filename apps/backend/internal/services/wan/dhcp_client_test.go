package wan

import (
	"context"
	"testing"
	"time"

	"backend/internal/events"
	"backend/internal/router"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestConfigureDHCPClientInvalidatesCache tests cache invalidation on configuration.
func TestConfigureDHCPClientInvalidatesCache(t *testing.T) {
	service, mockPort, _ := createTestService()
	routerID := "test-router-123"

	// Configure mock responses
	mockPort.SetMockResponse("/ip/dhcp-client/print", router.CommandResult{
		Success: true,
		Data:    []map[string]string{},
	})
	mockPort.SetMockResponse("/ip/dhcp-client/add", router.CommandResult{
		Success: true,
	})

	// Pre-populate cache
	wans := []*WANInterfaceData{
		{ID: "wan1", InterfaceName: "ether1"},
	}
	service.cache.Set(routerID, wans)

	// Verify cache is populated
	assert.NotNil(t, service.cache.Get(routerID))

	// Configure DHCP (this will invalidate cache)
	ctx := context.Background()
	input := DhcpClientInput{
		Interface:       "ether1",
		AddDefaultRoute: true,
		UsePeerDNS:      true,
	}
	_, _ = service.ConfigureDHCPClient(ctx, routerID, input)

	// Cache should be invalidated
	assert.Nil(t, service.cache.Get(routerID))
}

// TestConfigureDHCPClientSuccess tests successful DHCP client configuration.
func TestConfigureDHCPClientSuccess(t *testing.T) {
	service, mockPort, _ := createTestService()

	// Configure mock to return successful responses
	mockPort.SetMockResponse("/ip/dhcp-client/print", router.CommandResult{
		Success: true,
		Data:    []map[string]string{}, // No existing DHCP client
	})

	mockPort.SetMockResponse("/ip/dhcp-client/add", router.CommandResult{
		Success: true,
		Data:    []map[string]string{},
	})

	// Mock DHCP status response (bound state)
	mockPort.SetMockResponse("/ip/dhcp-client/print", router.CommandResult{
		Success: true,
		Data: []map[string]string{
			{
				".id":         "*1",
				"interface":   "ether1",
				"disabled":    "false",
				"status":      "bound",
				"address":     "192.168.1.100",
				"dhcp-server": "192.168.1.1",
				"gateway":     "192.168.1.1",
			},
		},
	})

	ctx := context.Background()
	routerID := "test-router-123"

	input := DhcpClientInput{
		Interface:       "ether1",
		AddDefaultRoute: true,
		UsePeerDNS:      true,
		UsePeerNTP:      false,
		Comment:         "Primary WAN",
	}

	// Configure DHCP client
	result, err := service.ConfigureDHCPClient(ctx, routerID, input)

	// Verify no error
	require.NoError(t, err)
	require.NotNil(t, result)

	// Verify WAN data
	assert.Equal(t, "ether1", result.InterfaceName)
	assert.Equal(t, "DHCP", result.ConnectionType)
	assert.Equal(t, "CONNECTED", result.Status)
	assert.Equal(t, "192.168.1.100", result.PublicIP)
	assert.Equal(t, "192.168.1.1", result.Gateway)
	assert.True(t, result.IsDefaultRoute)

	// Verify DHCP client data
	require.NotNil(t, result.DhcpClient)
	assert.Equal(t, "ether1", result.DhcpClient.Interface)
	assert.Equal(t, "bound", result.DhcpClient.Status)
	assert.Equal(t, "192.168.1.100", result.DhcpClient.Address)
	assert.Equal(t, "192.168.1.1", result.DhcpClient.DhcpServer)
	assert.True(t, result.DhcpClient.AddDefaultRoute)
	assert.True(t, result.DhcpClient.UsePeerDNS)
	assert.False(t, result.DhcpClient.UsePeerNTP)
}

// TestConfigureDHCPClientRemovesExisting tests removing existing DHCP client before adding new one.
func TestConfigureDHCPClientRemovesExisting(t *testing.T) {
	service, mockPort, _ := createTestService()

	// First check response: existing DHCP client found
	existingCheckCalls := 0
	mockPort.SetMockResponseFn("/ip/dhcp-client/print", func(cmd router.Command) router.CommandResult {
		existingCheckCalls++
		if existingCheckCalls == 1 {
			// First call: return existing DHCP client
			return router.CommandResult{
				Success: true,
				Data: []map[string]string{
					{
						".id":       "*OLD",
						"interface": "ether1",
					},
				},
			}
		}
		// Subsequent calls: return new DHCP client status
		return router.CommandResult{
			Success: true,
			Data: []map[string]string{
				{
					".id":       "*1",
					"interface": "ether1",
					"status":    "searching",
				},
			},
		}
	})

	removeCallCount := 0
	mockPort.SetMockResponseFn("/ip/dhcp-client/remove", func(cmd router.Command) router.CommandResult {
		removeCallCount++
		// Verify we're removing the old DHCP client
		assert.Equal(t, "*OLD", cmd.Args[".id"])
		return router.CommandResult{Success: true}
	})

	mockPort.SetMockResponse("/ip/dhcp-client/add", router.CommandResult{
		Success: true,
	})

	ctx := context.Background()
	routerID := "test-router-123"

	input := DhcpClientInput{
		Interface:       "ether1",
		AddDefaultRoute: true,
		UsePeerDNS:      true,
	}

	// Configure DHCP client
	_, err := service.ConfigureDHCPClient(ctx, routerID, input)
	require.NoError(t, err)

	// Verify existing DHCP client was removed
	assert.Equal(t, 1, removeCallCount, "Expected existing DHCP client to be removed")
}

// TestConfigureDHCPClientPublishesEvents tests event publishing.
func TestConfigureDHCPClientPublishesEvents(t *testing.T) {
	mockPort := router.NewMockAdapter("test-router")
	mockBus := events.NewInMemoryEventBus()

	// Configure mock responses
	mockPort.SetMockResponse("/ip/dhcp-client/print", router.CommandResult{
		Success: true,
		Data:    []map[string]string{},
	})
	mockPort.SetMockResponse("/ip/dhcp-client/add", router.CommandResult{
		Success: true,
	})

	config := WANServiceConfig{
		RouterPort: mockPort,
		EventBus:   mockBus,
	}

	service := NewWANService(config)
	ctx := context.Background()
	routerID := "test-router-123"

	// Subscribe to events
	eventChan := mockBus.SubscribeChannel(ctx, "wan.*")
	receivedEvents := []events.Event{}

	go func() {
		for msg := range eventChan {
			if evt, ok := msg.(events.Event); ok {
				receivedEvents = append(receivedEvents, evt)
			}
		}
	}()

	input := DhcpClientInput{
		Interface:       "ether1",
		AddDefaultRoute: true,
		UsePeerDNS:      true,
	}

	// Configure DHCP client
	_, err := service.ConfigureDHCPClient(ctx, routerID, input)
	require.NoError(t, err)

	// Wait briefly for events to be processed
	time.Sleep(100 * time.Millisecond)

	// Verify events were published
	assert.GreaterOrEqual(t, len(receivedEvents), 1, "Expected at least 1 event to be published")

	// Check for WANConfiguredEvent
	foundConfiguredEvent := false
	for _, evt := range receivedEvents {
		if evt.GetType() == events.EventTypeWANConfigured {
			foundConfiguredEvent = true
			break
		}
	}
	assert.True(t, foundConfiguredEvent, "Expected WANConfiguredEvent to be published")
}

// TestConfigureDHCPClientAddsToHistory tests connection history tracking.
func TestConfigureDHCPClientAddsToHistory(t *testing.T) {
	service, mockPort, _ := createTestService()

	// Configure mock responses
	mockPort.SetMockResponse("/ip/dhcp-client/print", router.CommandResult{
		Success: true,
		Data:    []map[string]string{},
	})
	mockPort.SetMockResponse("/ip/dhcp-client/add", router.CommandResult{
		Success: true,
	})

	ctx := context.Background()
	routerID := "test-router-123"

	input := DhcpClientInput{
		Interface:       "ether1",
		AddDefaultRoute: true,
		UsePeerDNS:      true,
	}

	// Verify history is empty before configuration
	history := service.history.Get(routerID, 10)
	assert.Nil(t, history)

	// Configure DHCP client
	_, err := service.ConfigureDHCPClient(ctx, routerID, input)
	require.NoError(t, err)

	// Verify history was updated
	history = service.history.Get(routerID, 10)
	require.NotNil(t, history)
	assert.Len(t, history, 1)
	assert.Equal(t, "CONNECTED", history[0].EventType)
	assert.Equal(t, "DHCP client configured", history[0].Reason)
}
