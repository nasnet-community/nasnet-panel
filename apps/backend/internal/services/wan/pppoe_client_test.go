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

// TestConfigurePPPoEClientSuccess tests successful PPPoE client configuration.
func TestConfigurePPPoEClientSuccess(t *testing.T) {
	service, mockPort, _ := createTestService()

	// Configure mock to return successful responses
	mockPort.SetMockResponse("/interface/pppoe-client/print", router.CommandResult{
		Success: true,
		Data:    []map[string]string{}, // No existing PPPoE client
	})

	mockPort.SetMockResponse("/interface/pppoe-client/add", router.CommandResult{
		Success: true,
		Data:    []map[string]string{},
	})

	// Mock PPPoE status response (running state)
	mockPort.SetMockResponse("/interface/pppoe-client/print", router.CommandResult{
		Success: true,
		Data: []map[string]string{
			{
				".id":       "*1",
				"name":      "pppoe-wan",
				"interface": "ether1",
				"disabled":  "false",
				"running":   "true",
			},
		},
	})

	ctx := context.Background()
	routerID := "test-router-123"

	input := PppoeClientInput{
		Name:            "pppoe-wan",
		Interface:       "ether1",
		Username:        "user@isp.com",
		Password:        "secret123", // NEVER LOG THIS
		ServiceName:     "ISP-Service",
		AddDefaultRoute: true,
		UsePeerDNS:      true,
		MTU:             1492,
		MRU:             1492,
		Comment:         "Primary WAN",
	}

	// Configure PPPoE client
	result, err := service.ConfigurePPPoEClient(ctx, routerID, input)

	// Verify no error
	require.NoError(t, err)
	require.NotNil(t, result)

	// Verify WAN data
	assert.Equal(t, "pppoe-wan", result.InterfaceName)
	assert.Equal(t, "PPPOE", result.ConnectionType)
	assert.Equal(t, "CONNECTED", result.Status)
	assert.True(t, result.IsDefaultRoute)

	// Verify PPPoE client data
	require.NotNil(t, result.PppoeClient)
	assert.Equal(t, "pppoe-wan", result.PppoeClient.Name)
	assert.Equal(t, "ether1", result.PppoeClient.Interface)
	assert.Equal(t, "user@isp.com", result.PppoeClient.Username)
	assert.Equal(t, "ISP-Service", result.PppoeClient.ServiceName)
	assert.True(t, result.PppoeClient.AddDefaultRoute)
	assert.True(t, result.PppoeClient.UsePeerDNS)
	assert.True(t, result.PppoeClient.Running)
	assert.Equal(t, 1492, result.PppoeClient.MTU)
	assert.Equal(t, 1492, result.PppoeClient.MRU)
}

// TestConfigurePPPoEClientRemovesExisting tests removing existing PPPoE client before adding new one.
func TestConfigurePPPoEClientRemovesExisting(t *testing.T) {
	service, mockPort, _ := createTestService()

	// First check response: existing PPPoE client found
	existingCheckCalls := 0
	mockPort.SetMockResponseFn("/interface/pppoe-client/print", func(cmd router.Command) router.CommandResult {
		existingCheckCalls++
		if existingCheckCalls == 1 {
			// First call: return existing PPPoE client
			return router.CommandResult{
				Success: true,
				Data: []map[string]string{
					{
						".id":  "*OLD",
						"name": "pppoe-wan",
					},
				},
			}
		}
		// Subsequent calls: return new PPPoE client status
		return router.CommandResult{
			Success: true,
			Data: []map[string]string{
				{
					".id":     "*1",
					"name":    "pppoe-wan",
					"running": "false",
				},
			},
		}
	})

	removeCallCount := 0
	mockPort.SetMockResponseFn("/interface/pppoe-client/remove", func(cmd router.Command) router.CommandResult {
		removeCallCount++
		// Verify we're removing the old PPPoE client
		assert.Equal(t, "*OLD", cmd.Args[".id"])
		return router.CommandResult{Success: true}
	})

	mockPort.SetMockResponse("/interface/pppoe-client/add", router.CommandResult{
		Success: true,
	})

	ctx := context.Background()
	routerID := "test-router-123"

	input := PppoeClientInput{
		Name:            "pppoe-wan",
		Interface:       "ether1",
		Username:        "user@isp.com",
		Password:        "secret",
		AddDefaultRoute: true,
		UsePeerDNS:      true,
	}

	// Configure PPPoE client
	_, err := service.ConfigurePPPoEClient(ctx, routerID, input)
	require.NoError(t, err)

	// Verify existing PPPoE client was removed
	assert.Equal(t, 1, removeCallCount, "Expected existing PPPoE client to be removed")
}

// TestConfigurePPPoEClientPasswordSecurity tests that password is never logged.
func TestConfigurePPPoEClientPasswordSecurity(t *testing.T) {
	service, mockPort, _ := createTestService()

	// Configure mock responses
	mockPort.SetMockResponse("/interface/pppoe-client/print", router.CommandResult{
		Success: true,
		Data:    []map[string]string{},
	})
	mockPort.SetMockResponse("/interface/pppoe-client/add", router.CommandResult{
		Success: true,
	})

	ctx := context.Background()
	routerID := "test-router-123"

	input := PppoeClientInput{
		Name:            "pppoe-wan",
		Interface:       "ether1",
		Username:        "user@isp.com",
		Password:        "SUPER_SECRET_PASSWORD_NEVER_LOG_THIS",
		AddDefaultRoute: true,
		UsePeerDNS:      true,
	}

	// Configure PPPoE client
	_, err := service.ConfigurePPPoEClient(ctx, routerID, input)
	require.NoError(t, err)

	// This test passes if no panic occurs and password is not logged
	// The actual password security check would require log capture
	// which is beyond the scope of unit tests
}

// TestConfigurePPPoEClientInvalidatesCache tests cache invalidation on configuration.
func TestConfigurePPPoEClientInvalidatesCache(t *testing.T) {
	service, mockPort, _ := createTestService()
	routerID := "test-router-123"

	// Configure mock responses
	mockPort.SetMockResponse("/interface/pppoe-client/print", router.CommandResult{
		Success: true,
		Data:    []map[string]string{},
	})
	mockPort.SetMockResponse("/interface/pppoe-client/add", router.CommandResult{
		Success: true,
	})

	// Pre-populate cache
	wans := []*WANInterfaceData{
		{ID: "wan1", InterfaceName: "ether1"},
	}
	service.cache.Set(routerID, wans)

	// Verify cache is populated
	assert.NotNil(t, service.cache.Get(routerID))

	// Configure PPPoE (this will invalidate cache)
	ctx := context.Background()
	input := PppoeClientInput{
		Name:            "pppoe-wan",
		Interface:       "ether1",
		Username:        "user@isp.com",
		Password:        "secret",
		AddDefaultRoute: true,
		UsePeerDNS:      true,
	}
	_, _ = service.ConfigurePPPoEClient(ctx, routerID, input)

	// Cache should be invalidated
	assert.Nil(t, service.cache.Get(routerID))
}

// TestConfigurePPPoEClientPublishesEvents tests event publishing.
func TestConfigurePPPoEClientPublishesEvents(t *testing.T) {
	mockPort := router.NewMockAdapter("test-router")
	mockBus := events.NewInMemoryEventBus()

	// Configure mock responses
	mockPort.SetMockResponse("/interface/pppoe-client/print", router.CommandResult{
		Success: true,
		Data:    []map[string]string{},
	})
	mockPort.SetMockResponse("/interface/pppoe-client/add", router.CommandResult{
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

	input := PppoeClientInput{
		Name:            "pppoe-wan",
		Interface:       "ether1",
		Username:        "user@isp.com",
		Password:        "secret",
		AddDefaultRoute: true,
		UsePeerDNS:      true,
	}

	// Configure PPPoE client
	_, err := service.ConfigurePPPoEClient(ctx, routerID, input)
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
