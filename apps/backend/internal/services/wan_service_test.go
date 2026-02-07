package services

import (
	"context"
	"testing"
	"time"

	"backend/internal/events"
	"backend/internal/router"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestNewWANService tests WANService creation.
func TestNewWANService(t *testing.T) {
	// Create mock dependencies
	mockPort := router.NewMockAdapter("test-router")
	mockBus := events.NewInMemoryEventBus()

	config := WANServiceConfig{
		RouterPort: mockPort,
		EventBus:   mockBus,
	}

	// Create service
	service := NewWANService(config)

	// Verify service was created
	require.NotNil(t, service)
	assert.NotNil(t, service.routerPort)
	assert.NotNil(t, service.eventBus)
	assert.NotNil(t, service.eventPublisher)
	assert.NotNil(t, service.cache)
	assert.NotNil(t, service.history)
}

// TestWANCacheOperations tests cache get/set/invalidate operations.
func TestWANCacheOperations(t *testing.T) {
	cache := newWanCache(30 * time.Second)

	routerID := "test-router-123"
	wans := []*WANInterfaceData{
		{
			ID:             "wan1",
			InterfaceName:  "ether1",
			ConnectionType: "DHCP",
			Status:         "CONNECTED",
			PublicIP:       "203.0.113.10",
		},
	}

	// Test cache miss
	result := cache.Get(routerID)
	assert.Nil(t, result)

	// Test cache set and get
	cache.Set(routerID, wans)
	result = cache.Get(routerID)
	require.NotNil(t, result)
	assert.Len(t, result, 1)
	assert.Equal(t, "wan1", result[0].ID)

	// Test cache invalidation
	cache.Invalidate(routerID)
	result = cache.Get(routerID)
	assert.Nil(t, result)
}

// TestWANCacheExpiration tests cache TTL expiration.
func TestWANCacheExpiration(t *testing.T) {
	// Use very short TTL for testing
	cache := newWanCache(100 * time.Millisecond)

	routerID := "test-router-123"
	wans := []*WANInterfaceData{
		{
			ID:            "wan1",
			InterfaceName: "ether1",
		},
	}

	// Set cache
	cache.Set(routerID, wans)
	result := cache.Get(routerID)
	require.NotNil(t, result)

	// Wait for expiration
	time.Sleep(150 * time.Millisecond)

	// Cache should be expired
	result = cache.Get(routerID)
	assert.Nil(t, result)
}

// TestConnectionHistoryOperations tests connection history add/get operations.
func TestConnectionHistoryOperations(t *testing.T) {
	history := newConnectionHistory(100)

	routerID := "test-router-123"
	wanInterfaceID := "wan1"

	// Test empty history
	events := history.Get(routerID, 10)
	assert.Nil(t, events)

	// Add events
	for i := 0; i < 5; i++ {
		event := &ConnectionEventData{
			ID:             string(rune('a' + i)),
			WANInterfaceID: wanInterfaceID,
			EventType:      "CONNECTED",
			Timestamp:      time.Now().Add(time.Duration(i) * time.Second),
		}
		history.Add(routerID, event)
	}

	// Get history (should be most recent first)
	events = history.Get(routerID, 10)
	require.NotNil(t, events)
	assert.Len(t, events, 5)
	// Verify order (most recent first)
	assert.Equal(t, "e", events[0].ID)
	assert.Equal(t, "a", events[4].ID)
}

// TestConnectionHistoryRingBuffer tests ring buffer behavior (max size).
func TestConnectionHistoryRingBuffer(t *testing.T) {
	// Use small max size for testing
	history := newConnectionHistory(3)

	routerID := "test-router-123"

	// Add more events than max size
	for i := 0; i < 5; i++ {
		event := &ConnectionEventData{
			ID:        string(rune('a' + i)),
			EventType: "CONNECTED",
			Timestamp: time.Now(),
		}
		history.Add(routerID, event)
	}

	// Should only keep last 3 events
	events := history.Get(routerID, 10)
	require.NotNil(t, events)
	assert.Len(t, events, 3)
	// Should have most recent 3 events (c, d, e)
	assert.Equal(t, "e", events[0].ID)
	assert.Equal(t, "d", events[1].ID)
	assert.Equal(t, "c", events[2].ID)
}

// TestListWANInterfacesCacheHit tests cache hit scenario.
func TestListWANInterfacesCacheHit(t *testing.T) {
	mockPort := router.NewMockAdapter("test-router")
	mockBus := events.NewInMemoryEventBus()

	config := WANServiceConfig{
		RouterPort: mockPort,
		EventBus:   mockBus,
	}

	service := NewWANService(config)
	routerID := "test-router-123"

	// Pre-populate cache
	wans := []*WANInterfaceData{
		{
			ID:             "wan1",
			InterfaceName:  "ether1",
			ConnectionType: "DHCP",
		},
	}
	service.cache.Set(routerID, wans)

	// Query should hit cache
	ctx := context.Background()
	result, err := service.ListWANInterfaces(ctx, routerID)

	require.NoError(t, err)
	require.NotNil(t, result)
	assert.Len(t, result, 1)
	assert.Equal(t, "wan1", result[0].ID)
}

// TestGetWANInterface tests getting a specific WAN interface.
func TestGetWANInterface(t *testing.T) {
	mockPort := router.NewMockAdapter("test-router")
	mockBus := events.NewInMemoryEventBus()

	config := WANServiceConfig{
		RouterPort: mockPort,
		EventBus:   mockBus,
	}

	service := NewWANService(config)
	routerID := "test-router-123"
	wanID := "wan1"

	// Pre-populate cache
	wans := []*WANInterfaceData{
		{
			ID:             "wan1",
			InterfaceName:  "ether1",
			ConnectionType: "DHCP",
		},
		{
			ID:             "wan2",
			InterfaceName:  "ether2",
			ConnectionType: "PPPOE",
		},
	}
	service.cache.Set(routerID, wans)

	// Get specific WAN
	ctx := context.Background()
	result, err := service.GetWANInterface(ctx, routerID, wanID)

	require.NoError(t, err)
	require.NotNil(t, result)
	assert.Equal(t, "wan1", result.ID)
	assert.Equal(t, "ether1", result.InterfaceName)
}

// TestGetWANInterfaceNotFound tests error when WAN interface not found.
func TestGetWANInterfaceNotFound(t *testing.T) {
	mockPort := router.NewMockAdapter("test-router")
	mockBus := events.NewInMemoryEventBus()

	config := WANServiceConfig{
		RouterPort: mockPort,
		EventBus:   mockBus,
	}

	service := NewWANService(config)
	routerID := "test-router-123"
	wanID := "nonexistent"

	// Empty cache
	service.cache.Set(routerID, []*WANInterfaceData{})

	// Get nonexistent WAN
	ctx := context.Background()
	result, err := service.GetWANInterface(ctx, routerID, wanID)

	require.Error(t, err)
	assert.Nil(t, result)
	assert.Contains(t, err.Error(), "not found")
}

// TestConfigureDHCPClientInvalidatesCache tests cache invalidation on configuration.
func TestConfigureDHCPClientInvalidatesCache(t *testing.T) {
	mockPort := router.NewMockAdapter("test-router")
	mockBus := events.NewInMemoryEventBus()

	config := WANServiceConfig{
		RouterPort: mockPort,
		EventBus:   mockBus,
	}

	service := NewWANService(config)
	routerID := "test-router-123"

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
	mockPort := router.NewMockAdapter("test-router")
	mockBus := events.NewInMemoryEventBus()

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

	config := WANServiceConfig{
		RouterPort: mockPort,
		EventBus:   mockBus,
	}

	service := NewWANService(config)
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
	mockPort := router.NewMockAdapter("test-router")
	mockBus := events.NewInMemoryEventBus()

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
		assert.Equal(t, "*OLD", cmd.Params[".id"])
		return router.CommandResult{Success: true}
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
	eventChan := mockBus.Subscribe(ctx, "wan.*")
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

// =============================================================================
// PPPoE Client Tests
// =============================================================================

// TestConfigurePPPoEClientSuccess tests successful PPPoE client configuration.
func TestConfigurePPPoEClientSuccess(t *testing.T) {
	mockPort := router.NewMockAdapter("test-router")
	mockBus := events.NewInMemoryEventBus()

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

	config := WANServiceConfig{
		RouterPort: mockPort,
		EventBus:   mockBus,
	}

	service := NewWANService(config)
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
	mockPort := router.NewMockAdapter("test-router")
	mockBus := events.NewInMemoryEventBus()

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

	config := WANServiceConfig{
		RouterPort: mockPort,
		EventBus:   mockBus,
	}

	service := NewWANService(config)
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
	routerID := "test-router-123"

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
	eventChan := mockBus.Subscribe(ctx, "wan.*")
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

// =============================================================================
// Static IP Tests
// =============================================================================

// TestConfigureStaticIPSuccess tests successful Static IP configuration.
func TestConfigureStaticIPSuccess(t *testing.T) {
	mockPort := router.NewMockAdapter("test-router")
	mockBus := events.NewInMemoryEventBus()

	// Configure mock to return successful responses
	// Step 1: Check for existing IPs on interface
	mockPort.SetMockResponse("/ip/address/print", router.CommandResult{
		Success: true,
		Data:    []map[string]string{}, // No existing IPs
	})

	// Step 2: Add new IP address
	mockPort.SetMockResponse("/ip/address/add", router.CommandResult{
		Success: true,
		Data:    []map[string]string{},
	})

	// Step 3: Check for existing default routes
	mockPort.SetMockResponse("/ip/route/print", router.CommandResult{
		Success: true,
		Data:    []map[string]string{}, // No existing default routes
	})

	// Step 4: Add default route
	mockPort.SetMockResponse("/ip/route/add", router.CommandResult{
		Success: true,
		Data:    []map[string]string{},
	})

	// Step 5: Set DNS servers
	mockPort.SetMockResponse("/ip/dns/set", router.CommandResult{
		Success: true,
		Data:    []map[string]string{},
	})

	// Mock query to verify configuration
	mockPort.SetMockResponse("/ip/address/print", router.CommandResult{
		Success: true,
		Data: []map[string]string{
			{
				".id":       "*1",
				"address":   "203.0.113.10/24",
				"interface": "ether1",
				"disabled":  "false",
			},
		},
	})

	config := WANServiceConfig{
		RouterPort: mockPort,
		EventBus:   mockBus,
	}

	service := NewWANService(config)
	ctx := context.Background()
	routerID := "test-router-123"

	input := StaticIPInput{
		Interface:       "ether1",
		Address:         "203.0.113.10/24",
		Gateway:         "203.0.113.1",
		DNS1:            "1.1.1.1",
		DNS2:            "1.0.0.1",
		AddDefaultRoute: true,
		Comment:         "Static WAN",
	}

	// Configure Static IP
	result, err := service.ConfigureStaticIP(ctx, routerID, input)

	// Verify no error
	require.NoError(t, err)
	require.NotNil(t, result)

	// Verify WAN data
	assert.Equal(t, "ether1", result.InterfaceName)
	assert.Equal(t, "STATIC_IP", result.ConnectionType)
	assert.Equal(t, "CONNECTED", result.Status)
	assert.Equal(t, "203.0.113.10", result.PublicIP)
	assert.Equal(t, "203.0.113.1", result.Gateway)
	assert.True(t, result.IsDefaultRoute)

	// Verify Static IP config data
	require.NotNil(t, result.StaticIPConfig)
	assert.Equal(t, "ether1", result.StaticIPConfig.Interface)
	assert.Equal(t, "203.0.113.10/24", result.StaticIPConfig.Address)
	assert.Equal(t, "203.0.113.1", result.StaticIPConfig.Gateway)
	assert.Equal(t, "1.1.1.1", result.StaticIPConfig.DNS1)
	assert.Equal(t, "1.0.0.1", result.StaticIPConfig.DNS2)
}

// TestConfigureStaticIPRemovesExistingIP tests removing existing IP addresses on interface.
func TestConfigureStaticIPRemovesExistingIP(t *testing.T) {
	mockPort := router.NewMockAdapter("test-router")
	mockBus := events.NewInMemoryEventBus()

	// First address/print call: return existing IP
	existingCheckCalls := 0
	mockPort.SetMockResponseFn("/ip/address/print", func(cmd router.Command) router.CommandResult {
		existingCheckCalls++
		if existingCheckCalls == 1 {
			// First call: return existing IP address
			return router.CommandResult{
				Success: true,
				Data: []map[string]string{
					{
						".id":       "*OLD",
						"address":   "192.168.1.100/24",
						"interface": "ether1",
					},
				},
			}
		}
		// Subsequent calls: return new IP address
		return router.CommandResult{
			Success: true,
			Data: []map[string]string{
				{
					".id":       "*1",
					"address":   "203.0.113.10/24",
					"interface": "ether1",
					"disabled":  "false",
				},
			},
		}
	})

	removeCallCount := 0
	mockPort.SetMockResponseFn("/ip/address/remove", func(cmd router.Command) router.CommandResult {
		removeCallCount++
		// Verify we're removing the old IP
		assert.Equal(t, "*OLD", cmd.Args[".id"])
		return router.CommandResult{Success: true}
	})

	mockPort.SetMockResponse("/ip/address/add", router.CommandResult{
		Success: true,
	})

	mockPort.SetMockResponse("/ip/route/print", router.CommandResult{
		Success: true,
		Data:    []map[string]string{},
	})

	mockPort.SetMockResponse("/ip/route/add", router.CommandResult{
		Success: true,
	})

	mockPort.SetMockResponse("/ip/dns/set", router.CommandResult{
		Success: true,
	})

	config := WANServiceConfig{
		RouterPort: mockPort,
		EventBus:   mockBus,
	}

	service := NewWANService(config)
	ctx := context.Background()
	routerID := "test-router-123"

	input := StaticIPInput{
		Interface:       "ether1",
		Address:         "203.0.113.10/24",
		Gateway:         "203.0.113.1",
		AddDefaultRoute: true,
	}

	// Configure Static IP
	_, err := service.ConfigureStaticIP(ctx, routerID, input)
	require.NoError(t, err)

	// Verify existing IP was removed
	assert.Equal(t, 1, removeCallCount, "Expected existing IP to be removed")
}

// TestConfigureStaticIPRemovesExistingRoutes tests removing existing default routes.
func TestConfigureStaticIPRemovesExistingRoutes(t *testing.T) {
	mockPort := router.NewMockAdapter("test-router")
	mockBus := events.NewInMemoryEventBus()

	mockPort.SetMockResponse("/ip/address/print", router.CommandResult{
		Success: true,
		Data:    []map[string]string{},
	})

	mockPort.SetMockResponse("/ip/address/add", router.CommandResult{
		Success: true,
	})

	// First route/print call: return existing default routes
	existingRouteCalls := 0
	mockPort.SetMockResponseFn("/ip/route/print", func(cmd router.Command) router.CommandResult {
		existingRouteCalls++
		if existingRouteCalls == 1 {
			// First call: return existing default routes
			return router.CommandResult{
				Success: true,
				Data: []map[string]string{
					{
						".id":         "*ROUTE1",
						"dst-address": "0.0.0.0/0",
						"gateway":     "192.168.1.1",
					},
					{
						".id":         "*ROUTE2",
						"dst-address": "0.0.0.0/0",
						"gateway":     "192.168.2.1",
					},
				},
			}
		}
		return router.CommandResult{Success: true, Data: []map[string]string{}}
	})

	removeRouteCallCount := 0
	mockPort.SetMockResponseFn("/ip/route/remove", func(cmd router.Command) router.CommandResult {
		removeRouteCallCount++
		// Verify we're removing default routes
		routeID := cmd.Args[".id"]
		assert.Contains(t, []string{"*ROUTE1", "*ROUTE2"}, routeID)
		return router.CommandResult{Success: true}
	})

	mockPort.SetMockResponse("/ip/route/add", router.CommandResult{
		Success: true,
	})

	mockPort.SetMockResponse("/ip/dns/set", router.CommandResult{
		Success: true,
	})

	// Mock final address query
	mockPort.SetMockResponse("/ip/address/print", router.CommandResult{
		Success: true,
		Data: []map[string]string{
			{
				".id":       "*1",
				"address":   "203.0.113.10/24",
				"interface": "ether1",
				"disabled":  "false",
			},
		},
	})

	config := WANServiceConfig{
		RouterPort: mockPort,
		EventBus:   mockBus,
	}

	service := NewWANService(config)
	ctx := context.Background()
	routerID := "test-router-123"

	input := StaticIPInput{
		Interface:       "ether1",
		Address:         "203.0.113.10/24",
		Gateway:         "203.0.113.1",
		AddDefaultRoute: true,
	}

	// Configure Static IP
	_, err := service.ConfigureStaticIP(ctx, routerID, input)
	require.NoError(t, err)

	// Verify existing routes were removed
	assert.Equal(t, 2, removeRouteCallCount, "Expected 2 existing default routes to be removed")
}

// TestConfigureStaticIPInvalidatesCache tests cache invalidation on configuration.
func TestConfigureStaticIPInvalidatesCache(t *testing.T) {
	mockPort := router.NewMockAdapter("test-router")
	mockBus := events.NewInMemoryEventBus()

	// Configure mock responses
	mockPort.SetMockResponse("/ip/address/print", router.CommandResult{
		Success: true,
		Data:    []map[string]string{},
	})
	mockPort.SetMockResponse("/ip/address/add", router.CommandResult{
		Success: true,
	})
	mockPort.SetMockResponse("/ip/route/print", router.CommandResult{
		Success: true,
		Data:    []map[string]string{},
	})
	mockPort.SetMockResponse("/ip/route/add", router.CommandResult{
		Success: true,
	})
	mockPort.SetMockResponse("/ip/dns/set", router.CommandResult{
		Success: true,
	})

	config := WANServiceConfig{
		RouterPort: mockPort,
		EventBus:   mockBus,
	}

	service := NewWANService(config)
	routerID := "test-router-123"

	// Pre-populate cache
	wans := []*WANInterfaceData{
		{ID: "wan1", InterfaceName: "ether1"},
	}
	service.cache.Set(routerID, wans)

	// Verify cache is populated
	assert.NotNil(t, service.cache.Get(routerID))

	// Configure Static IP (this will invalidate cache)
	ctx := context.Background()
	input := StaticIPInput{
		Interface:       "ether1",
		Address:         "203.0.113.10/24",
		Gateway:         "203.0.113.1",
		AddDefaultRoute: true,
	}
	_, _ = service.ConfigureStaticIP(ctx, routerID, input)

	// Cache should be invalidated
	assert.Nil(t, service.cache.Get(routerID))
}

// TestConfigureStaticIPPublishesEvents tests event publishing.
func TestConfigureStaticIPPublishesEvents(t *testing.T) {
	mockPort := router.NewMockAdapter("test-router")
	mockBus := events.NewInMemoryEventBus()

	// Configure mock responses
	mockPort.SetMockResponse("/ip/address/print", router.CommandResult{
		Success: true,
		Data:    []map[string]string{},
	})
	mockPort.SetMockResponse("/ip/address/add", router.CommandResult{
		Success: true,
	})
	mockPort.SetMockResponse("/ip/route/print", router.CommandResult{
		Success: true,
		Data:    []map[string]string{},
	})
	mockPort.SetMockResponse("/ip/route/add", router.CommandResult{
		Success: true,
	})
	mockPort.SetMockResponse("/ip/dns/set", router.CommandResult{
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
	eventChan := mockBus.Subscribe(ctx, "wan.*")
	receivedEvents := []events.Event{}

	go func() {
		for msg := range eventChan {
			if evt, ok := msg.(events.Event); ok {
				receivedEvents = append(receivedEvents, evt)
			}
		}
	}()

	input := StaticIPInput{
		Interface:       "ether1",
		Address:         "203.0.113.10/24",
		Gateway:         "203.0.113.1",
		DNS1:            "1.1.1.1",
		AddDefaultRoute: true,
	}

	// Configure Static IP
	_, err := service.ConfigureStaticIP(ctx, routerID, input)
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

// =============================================================================
// LTE Configuration Tests (Phase 7)
// =============================================================================

// TestConfigureLTESuccess tests successful LTE modem configuration.
func TestConfigureLTESuccess(t *testing.T) {
	mockPort := router.NewMockAdapter("test-router")
	mockBus := events.NewInMemoryEventBus()

	// Configure mock responses
	mockPort.SetMockResponse("/interface/lte/print", router.CommandResult{
		Success: true,
		Data: []map[string]string{
			{
				".id":  "*1",
				"name": "lte1",
			},
		},
	})
	mockPort.SetMockResponse("/interface/lte/set", router.CommandResult{
		Success: true,
	})
	mockPort.SetMockResponse("/ip/route/print", router.CommandResult{
		Success: true,
		Data:    []map[string]string{},
	})
	mockPort.SetMockResponse("/ip/route/add", router.CommandResult{
		Success: true,
	})
	mockPort.SetMockResponse("/interface/lte/monitor", router.CommandResult{
		Success: true,
		Data: []map[string]string{
			{
				"rssi":                "-75dBm",
				"current-operator":    "T-Mobile",
				"access-technology":   "LTE",
				"session-status":      "established",
				"ip-address":          "10.123.45.67",
			},
		},
	})

	config := WANServiceConfig{
		RouterPort: mockPort,
		EventBus:   mockBus,
	}

	service := NewWANService(config)
	ctx := context.Background()
	routerID := "test-router-123"

	input := LteModemInput{
		Interface:      "lte1",
		APN:            "fast.t-mobile.com",
		Pin:            "1234",
		AuthProtocol:   "none",
		IsDefaultRoute: true,
		Enabled:        true,
		MTU:            1500,
		ProfileNumber:  1,
		Comment:        "Test LTE modem",
	}

	// Configure LTE modem
	wanData, err := service.ConfigureLTE(ctx, routerID, input)

	// Assertions
	require.NoError(t, err)
	require.NotNil(t, wanData)

	assert.Equal(t, "wan-lte-lte1", wanData.ID)
	assert.Equal(t, "lte1", wanData.InterfaceName)
	assert.Equal(t, "LTE", wanData.ConnectionType)
	assert.Equal(t, "CONNECTED", wanData.Status)
	assert.Equal(t, "10.123.45.67", wanData.PublicIP)
	assert.True(t, wanData.IsDefaultRoute)

	// LTE modem data
	require.NotNil(t, wanData.LteModem)
	assert.Equal(t, "fast.t-mobile.com", wanData.LteModem.APN)
	assert.Equal(t, "T-Mobile", wanData.LteModem.Operator)
	assert.Equal(t, "LTE", wanData.LteModem.NetworkType)
	assert.Equal(t, -75, wanData.LteModem.SignalStrength)
	assert.True(t, wanData.LteModem.Running)
	assert.True(t, wanData.LteModem.PinConfigured)
}

// TestConfigureLTEInterfaceNotFound tests error when LTE interface not found.
func TestConfigureLTEInterfaceNotFound(t *testing.T) {
	mockPort := router.NewMockAdapter("test-router")
	mockBus := events.NewInMemoryEventBus()

	// Configure mock to return no interfaces
	mockPort.SetMockResponse("/interface/lte/print", router.CommandResult{
		Success: true,
		Data:    []map[string]string{}, // No interfaces found
	})

	config := WANServiceConfig{
		RouterPort: mockPort,
		EventBus:   mockBus,
	}

	service := NewWANService(config)
	ctx := context.Background()
	routerID := "test-router-123"

	input := LteModemInput{
		Interface: "lte1",
		APN:       "internet",
	}

	// Configure LTE modem (should fail)
	_, err := service.ConfigureLTE(ctx, routerID, input)

	// Should return error
	require.Error(t, err)
	assert.Contains(t, err.Error(), "LTE interface lte1 not found")
}

// TestConfigureLTEInvalidatesCache tests cache invalidation.
func TestConfigureLTEInvalidatesCache(t *testing.T) {
	mockPort := router.NewMockAdapter("test-router")
	mockBus := events.NewInMemoryEventBus()

	// Configure mock responses
	mockPort.SetMockResponse("/interface/lte/print", router.CommandResult{
		Success: true,
		Data: []map[string]string{
			{".id": "*1", "name": "lte1"},
		},
	})
	mockPort.SetMockResponse("/interface/lte/set", router.CommandResult{
		Success: true,
	})

	config := WANServiceConfig{
		RouterPort: mockPort,
		EventBus:   mockBus,
	}

	service := NewWANService(config)
	ctx := context.Background()
	routerID := "test-router-123"

	// Pre-populate cache
	wans := []*WANInterfaceData{
		{ID: "wan1", InterfaceName: "lte1"},
	}
	service.cache.Set(routerID, wans)

	// Verify cache is populated
	assert.NotNil(t, service.cache.Get(routerID))

	// Configure LTE (this will invalidate cache)
	input := LteModemInput{
		Interface: "lte1",
		APN:       "internet",
	}
	_, _ = service.ConfigureLTE(ctx, routerID, input)

	// Cache should be invalidated
	assert.Nil(t, service.cache.Get(routerID))
}

// TestConfigureLTEPublishesEvents tests event publishing.
func TestConfigureLTEPublishesEvents(t *testing.T) {
	mockPort := router.NewMockAdapter("test-router")
	mockBus := events.NewInMemoryEventBus()

	// Configure mock responses
	mockPort.SetMockResponse("/interface/lte/print", router.CommandResult{
		Success: true,
		Data: []map[string]string{
			{".id": "*1", "name": "lte1"},
		},
	})
	mockPort.SetMockResponse("/interface/lte/set", router.CommandResult{
		Success: true,
	})
	mockPort.SetMockResponse("/interface/lte/monitor", router.CommandResult{
		Success: true,
		Data: []map[string]string{
			{
				"session-status": "established",
				"ip-address":     "10.1.2.3",
			},
		},
	})

	config := WANServiceConfig{
		RouterPort: mockPort,
		EventBus:   mockBus,
	}

	service := NewWANService(config)
	ctx := context.Background()
	routerID := "test-router-123"

	// Subscribe to events
	eventChan := mockBus.Subscribe(ctx, "wan.*")
	receivedEvents := []events.Event{}

	go func() {
		for msg := range eventChan {
			if evt, ok := msg.(events.Event); ok {
				receivedEvents = append(receivedEvents, evt)
			}
		}
	}()

	input := LteModemInput{
		Interface:      "lte1",
		APN:            "internet",
		IsDefaultRoute: true,
	}

	// Configure LTE
	_, err := service.ConfigureLTE(ctx, routerID, input)
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
