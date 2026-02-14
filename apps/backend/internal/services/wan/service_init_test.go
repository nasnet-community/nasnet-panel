package wan

import (
	"context"
	"testing"

	"backend/internal/events"
	"backend/internal/router"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// createTestService creates a new WANService with mock dependencies for testing.
func createTestService() (*WANService, *router.MockAdapter, *events.InMemoryEventBus) {
	mockPort := router.NewMockAdapter("test-router")
	mockBus := events.NewInMemoryEventBus()

	config := WANServiceConfig{
		RouterPort: mockPort,
		EventBus:   mockBus,
	}

	service := NewWANService(config)
	return service, mockPort, mockBus
}

// setupMocks configures common mock responses for testing.
func setupMocks(mockPort *router.MockAdapter) {
	// Default empty responses for common queries
	mockPort.SetMockResponse("/ip/dhcp-client/print", router.CommandResult{
		Success: true,
		Data:    []map[string]string{},
	})

	mockPort.SetMockResponse("/interface/pppoe-client/print", router.CommandResult{
		Success: true,
		Data:    []map[string]string{},
	})

	mockPort.SetMockResponse("/ip/address/print", router.CommandResult{
		Success: true,
		Data:    []map[string]string{},
	})

	mockPort.SetMockResponse("/ip/route/print", router.CommandResult{
		Success: true,
		Data:    []map[string]string{},
	})

	mockPort.SetMockResponse("/interface/lte/print", router.CommandResult{
		Success: true,
		Data:    []map[string]string{},
	})
}

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

// subscribeToEvents subscribes to WAN events and returns a channel and slice for collecting events.
func subscribeToEvents(ctx context.Context, mockBus *events.InMemoryEventBus) (<-chan interface{}, *[]events.Event) {
	eventChan := mockBus.SubscribeChannel(ctx, "wan.*")
	receivedEvents := &[]events.Event{}

	go func() {
		for msg := range eventChan {
			if evt, ok := msg.(events.Event); ok {
				*receivedEvents = append(*receivedEvents, evt)
			}
		}
	}()

	return eventChan, receivedEvents
}
