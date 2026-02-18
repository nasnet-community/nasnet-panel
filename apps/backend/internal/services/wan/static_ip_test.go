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

// TestConfigureStaticIPSuccess tests successful Static IP configuration.
func TestConfigureStaticIPSuccess(t *testing.T) {
	service, mockPort, _ := createTestService()

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

	ctx := context.Background()
	routerID := "test-router-123"

	input := StaticIPInput{
		Interface:    "ether1",
		Address:      "203.0.113.10/24",
		Gateway:      "203.0.113.1",
		PrimaryDNS:   "1.1.1.1",
		SecondaryDNS: "1.0.0.1",
		Comment:      "Static WAN",
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
	require.NotNil(t, result.StaticConfig)
	assert.Equal(t, "ether1", result.StaticConfig.Interface)
	assert.Equal(t, "203.0.113.10/24", result.StaticConfig.Address)
	assert.Equal(t, "203.0.113.1", result.StaticConfig.Gateway)
	assert.Equal(t, "1.1.1.1", result.StaticConfig.PrimaryDNS)
	assert.Equal(t, "1.0.0.1", result.StaticConfig.SecondaryDNS)
}

// TestConfigureStaticIPRemovesExistingIP tests removing existing IP addresses on interface.
func TestConfigureStaticIPRemovesExistingIP(t *testing.T) {
	service, mockPort, _ := createTestService()

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

	ctx := context.Background()
	routerID := "test-router-123"

	input := StaticIPInput{
		Interface: "ether1",
		Address:   "203.0.113.10/24",
		Gateway:   "203.0.113.1",
	}

	// Configure Static IP
	_, err := service.ConfigureStaticIP(ctx, routerID, input)
	require.NoError(t, err)

	// Verify existing IP was removed
	assert.Equal(t, 1, removeCallCount, "Expected existing IP to be removed")
}

// TestConfigureStaticIPRemovesExistingRoutes tests removing existing default routes.
func TestConfigureStaticIPRemovesExistingRoutes(t *testing.T) {
	service, mockPort, _ := createTestService()

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

	ctx := context.Background()
	routerID := "test-router-123"

	input := StaticIPInput{
		Interface: "ether1",
		Address:   "203.0.113.10/24",
		Gateway:   "203.0.113.1",
	}

	// Configure Static IP
	_, err := service.ConfigureStaticIP(ctx, routerID, input)
	require.NoError(t, err)

	// Verify existing routes were removed
	assert.Equal(t, 2, removeRouteCallCount, "Expected 2 existing default routes to be removed")
}

// TestConfigureStaticIPInvalidatesCache tests cache invalidation on configuration.
func TestConfigureStaticIPInvalidatesCache(t *testing.T) {
	service, mockPort, _ := createTestService()
	routerID := "test-router-123"

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
		Interface: "ether1",
		Address:   "203.0.113.10/24",
		Gateway:   "203.0.113.1",
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
	eventChan := mockBus.SubscribeChannel(ctx, "wan.*")
	receivedEvents := []events.Event{}

	go func() {
		for msg := range eventChan {
			if evt, ok := msg.(events.Event); ok {
				receivedEvents = append(receivedEvents, evt)
			}
		}
	}()

	input := StaticIPInput{
		Interface:  "ether1",
		Address:    "203.0.113.10/24",
		Gateway:    "203.0.113.1",
		PrimaryDNS: "1.1.1.1",
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
