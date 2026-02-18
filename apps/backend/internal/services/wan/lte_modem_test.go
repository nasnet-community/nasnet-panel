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

// TestConfigureLTESuccess tests successful LTE modem configuration.
func TestConfigureLTESuccess(t *testing.T) {
	service, mockPort, _ := createTestService()

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
				"rssi":              "-75dBm",
				"current-operator":  "T-Mobile",
				"access-technology": "LTE",
				"session-status":    "established",
				"ip-address":        "10.123.45.67",
			},
		},
	})

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
	service, mockPort, _ := createTestService()

	// Configure mock to return no interfaces
	mockPort.SetMockResponse("/interface/lte/print", router.CommandResult{
		Success: true,
		Data:    []map[string]string{}, // No interfaces found
	})

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
	service, mockPort, _ := createTestService()
	routerID := "test-router-123"

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

	// Pre-populate cache
	wans := []*WANInterfaceData{
		{ID: "wan1", InterfaceName: "lte1"},
	}
	service.cache.Set(routerID, wans)

	// Verify cache is populated
	assert.NotNil(t, service.cache.Get(routerID))

	// Configure LTE (this will invalidate cache)
	ctx := context.Background()
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
	eventChan := mockBus.SubscribeChannel(ctx, "wan.*")
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
