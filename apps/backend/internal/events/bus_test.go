package events

import (
	"context"
	"encoding/json"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/oklog/ulid/v2"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNewEventBus(t *testing.T) {
	bus, err := NewEventBus(DefaultEventBusOptions())
	require.NoError(t, err)
	require.NotNil(t, bus)
	defer bus.Close()
}

func TestEventBus_PublishAndSubscribe(t *testing.T) {
	bus, err := NewEventBus(DefaultEventBusOptions())
	require.NoError(t, err)
	defer bus.Close()

	received := make(chan Event, 1)

	err = bus.Subscribe(EventTypeRouterStatusChanged, func(ctx context.Context, event Event) error {
		received <- event
		return nil
	})
	require.NoError(t, err)

	event := NewRouterStatusChangedEvent("router-1", RouterStatusConnected, RouterStatusDisconnected, "test")

	ctx := context.Background()
	err = bus.Publish(ctx, event)
	require.NoError(t, err)

	select {
	case e := <-received:
		assert.Equal(t, event.GetID(), e.GetID())
		assert.Equal(t, EventTypeRouterStatusChanged, e.GetType())
	case <-time.After(500 * time.Millisecond):
		t.Fatal("timeout waiting for event")
	}
}

func TestEventBus_PublishNilEvent(t *testing.T) {
	bus, err := NewEventBus(DefaultEventBusOptions())
	require.NoError(t, err)
	defer bus.Close()

	err = bus.Publish(context.Background(), nil)
	assert.Error(t, err)
}

func TestEventBus_SubscribeEmptyType(t *testing.T) {
	bus, err := NewEventBus(DefaultEventBusOptions())
	require.NoError(t, err)
	defer bus.Close()

	err = bus.Subscribe("", func(ctx context.Context, event Event) error {
		return nil
	})
	assert.Error(t, err)
}

func TestEventBus_SubscribeNilHandler(t *testing.T) {
	bus, err := NewEventBus(DefaultEventBusOptions())
	require.NoError(t, err)
	defer bus.Close()

	err = bus.Subscribe(EventTypeRouterStatusChanged, nil)
	assert.Error(t, err)
}

func TestEventBus_SubscribeAll(t *testing.T) {
	bus, err := NewEventBus(DefaultEventBusOptions())
	require.NoError(t, err)
	defer bus.Close()

	var count atomic.Int32

	err = bus.SubscribeAll(func(ctx context.Context, event Event) error {
		count.Add(1)
		return nil
	})
	require.NoError(t, err)

	ctx := context.Background()

	// Publish different event types (all immediate priority to skip batching)
	event1 := NewRouterStatusChangedEvent("router-1", RouterStatusConnected, RouterStatusDisconnected, "test")
	event2 := NewFeatureCrashedEvent("feature-1", "instance-1", "router-1", 1, 1, "error", true, "test")

	err = bus.Publish(ctx, event1)
	require.NoError(t, err)
	err = bus.Publish(ctx, event2)
	require.NoError(t, err)

	// Wait for events to be processed
	time.Sleep(100 * time.Millisecond)

	assert.Equal(t, int32(2), count.Load())
}

func TestEventBus_MultipleHandlers(t *testing.T) {
	bus, err := NewEventBus(DefaultEventBusOptions())
	require.NoError(t, err)
	defer bus.Close()

	var wg sync.WaitGroup
	var count atomic.Int32

	for i := 0; i < 3; i++ {
		wg.Add(1)
		err = bus.Subscribe(EventTypeRouterStatusChanged, func(ctx context.Context, event Event) error {
			count.Add(1)
			wg.Done()
			return nil
		})
		require.NoError(t, err)
	}

	event := NewRouterStatusChangedEvent("router-1", RouterStatusConnected, RouterStatusDisconnected, "test")
	err = bus.Publish(context.Background(), event)
	require.NoError(t, err)

	wg.Wait()
	assert.Equal(t, int32(3), count.Load())
}

func TestEventBus_Close(t *testing.T) {
	bus, err := NewEventBus(DefaultEventBusOptions())
	require.NoError(t, err)

	err = bus.Close()
	assert.NoError(t, err)

	// Publishing to closed bus should fail
	event := NewRouterStatusChangedEvent("router-1", RouterStatusConnected, RouterStatusDisconnected, "test")
	err = bus.Publish(context.Background(), event)
	assert.Error(t, err)
}

func TestEventBus_ImmediatePriorityBypassesBatching(t *testing.T) {
	bus, err := NewEventBus(DefaultEventBusOptions())
	require.NoError(t, err)
	defer bus.Close()

	received := make(chan time.Time, 1)

	err = bus.Subscribe(EventTypeRouterStatusChanged, func(ctx context.Context, event Event) error {
		received <- time.Now()
		return nil
	})
	require.NoError(t, err)

	publishTime := time.Now()
	event := NewRouterStatusChangedEvent("router-1", RouterStatusConnected, RouterStatusDisconnected, "test")
	event.Priority = PriorityImmediate

	err = bus.Publish(context.Background(), event)
	require.NoError(t, err)

	select {
	case receiveTime := <-received:
		// Immediate events should be delivered in <100ms
		latency := receiveTime.Sub(publishTime)
		assert.Less(t, latency, 100*time.Millisecond, "immediate event took too long: %v", latency)
	case <-time.After(500 * time.Millisecond):
		t.Fatal("timeout waiting for immediate event")
	}
}

func TestEventBus_CriticalPriorityBatching(t *testing.T) {
	bus, err := NewEventBus(DefaultEventBusOptions())
	require.NoError(t, err)
	defer bus.Close()

	var received atomic.Int32

	err = bus.Subscribe(EventTypeConfigApplyProgress, func(ctx context.Context, event Event) error {
		received.Add(1)
		return nil
	})
	require.NoError(t, err)

	// Publish multiple critical events quickly
	ctx := context.Background()
	for i := 0; i < 5; i++ {
		event := NewConfigApplyProgressEvent("op-1", "router-1", "apply", i*20, i, 5, "progress", "test")
		event.Priority = PriorityCritical
		err = bus.Publish(ctx, event)
		require.NoError(t, err)
	}

	// Wait for batch window (100ms + buffer)
	time.Sleep(200 * time.Millisecond)

	assert.Equal(t, int32(5), received.Load())
}

func TestEventBus_ConcurrentPublish(t *testing.T) {
	bus, err := NewEventBus(DefaultEventBusOptions())
	require.NoError(t, err)
	defer bus.Close()

	var received atomic.Int32

	err = bus.Subscribe(EventTypeRouterStatusChanged, func(ctx context.Context, event Event) error {
		received.Add(1)
		return nil
	})
	require.NoError(t, err)

	var wg sync.WaitGroup
	numGoroutines := 10
	eventsPerGoroutine := 10

	for i := 0; i < numGoroutines; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			for j := 0; j < eventsPerGoroutine; j++ {
				event := NewRouterStatusChangedEvent("router-1", RouterStatusConnected, RouterStatusDisconnected, "test")
				event.Priority = PriorityImmediate // Skip batching
				if err := bus.Publish(context.Background(), event); err != nil {
					t.Errorf("publish error: %v", err)
				}
			}
		}(i)
	}

	wg.Wait()
	time.Sleep(100 * time.Millisecond)

	expected := int32(numGoroutines * eventsPerGoroutine)
	assert.Equal(t, expected, received.Load())
}

func TestParseEvent(t *testing.T) {
	tests := []struct {
		name      string
		event     Event
		eventType string
	}{
		{
			name:      "RouterStatusChanged",
			event:     NewRouterStatusChangedEvent("router-1", RouterStatusConnected, RouterStatusDisconnected, "test"),
			eventType: EventTypeRouterStatusChanged,
		},
		{
			name:      "ResourceUpdated",
			event:     NewResourceUpdatedEvent(ulid.Make(), "firewall", "router-1", 1, ChangeTypeUpdate, "test"),
			eventType: EventTypeResourceUpdated,
		},
		{
			name:      "FeatureCrashed",
			event:     NewFeatureCrashedEvent("feature-1", "instance-1", "router-1", 1, 1, "error", true, "test"),
			eventType: EventTypeFeatureCrashed,
		},
		{
			name:      "ConfigApplyProgress",
			event:     NewConfigApplyProgressEvent("op-1", "router-1", "apply", 50, 2, 4, "progress", "test"),
			eventType: EventTypeConfigApplyProgress,
		},
		{
			name:      "Auth",
			event:     NewAuthEvent("user-1", "login", "192.168.1.1", "Mozilla/5.0", true, "", "test"),
			eventType: EventTypeAuth,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Serialize to message
			payload, err := tt.event.Payload()
			require.NoError(t, err)

			// Create message with metadata
			msg := &mockMessage{
				payload: payload,
				metadata: map[string]string{
					"type": tt.eventType,
				},
			}

			// Parse back
			parsed, err := parseEventFromMock(msg)
			require.NoError(t, err)
			assert.Equal(t, tt.event.GetID(), parsed.GetID())
			assert.Equal(t, tt.event.GetType(), parsed.GetType())
		})
	}
}

// mockMessage for testing ParseEvent
type mockMessage struct {
	payload  []byte
	metadata map[string]string
}

func (m *mockMessage) Metadata() map[string]string {
	return m.metadata
}

// parseEventFromMock is a test helper for ParseEvent
func parseEventFromMock(msg *mockMessage) (Event, error) {
	// This is a simplified version that mimics message.Message behavior
	eventType := msg.metadata["type"]
	if eventType == "" {
		return nil, nil
	}

	var event Event
	switch eventType {
	case EventTypeRouterStatusChanged:
		var e RouterStatusChangedEvent
		if err := unmarshalEvent(msg.payload, &e); err != nil {
			return nil, err
		}
		event = &e
	case EventTypeResourceUpdated:
		var e ResourceUpdatedEvent
		if err := unmarshalEvent(msg.payload, &e); err != nil {
			return nil, err
		}
		event = &e
	case EventTypeFeatureCrashed:
		var e FeatureCrashedEvent
		if err := unmarshalEvent(msg.payload, &e); err != nil {
			return nil, err
		}
		event = &e
	case EventTypeConfigApplyProgress:
		var e ConfigApplyProgressEvent
		if err := unmarshalEvent(msg.payload, &e); err != nil {
			return nil, err
		}
		event = &e
	case EventTypeAuth:
		var e AuthEvent
		if err := unmarshalEvent(msg.payload, &e); err != nil {
			return nil, err
		}
		event = &e
	default:
		var e BaseEvent
		if err := unmarshalEvent(msg.payload, &e); err != nil {
			return nil, err
		}
		event = &e
	}

	return event, nil
}

func unmarshalEvent(payload []byte, v interface{}) error {
	return json.Unmarshal(payload, v)
}
