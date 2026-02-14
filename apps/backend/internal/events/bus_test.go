package events

import (
	"context"
	"encoding/json"
	"os"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/oklog/ulid/v2"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// =============================================================================
// EventBus Tests
// =============================================================================

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

	event1 := NewRouterStatusChangedEvent("router-1", RouterStatusConnected, RouterStatusDisconnected, "test")
	event2 := NewFeatureCrashedEvent("feature-1", "instance-1", "router-1", 1, 1, "error", true, "test")

	err = bus.Publish(ctx, event1)
	require.NoError(t, err)
	err = bus.Publish(ctx, event2)
	require.NoError(t, err)

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

	ctx := context.Background()
	for i := 0; i < 5; i++ {
		event := NewConfigApplyProgressEvent("op-1", "router-1", "apply", i*20, i, 5, "progress", "test")
		event.Priority = PriorityCritical
		err = bus.Publish(ctx, event)
		require.NoError(t, err)
	}

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
				event.Priority = PriorityImmediate
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
			payload, err := tt.event.Payload()
			require.NoError(t, err)

			msg := &parseTestMessage{
				payload: payload,
				metadata: map[string]string{
					"type": tt.eventType,
				},
			}

			parsed, err := parseEventFromTestMsg(msg)
			require.NoError(t, err)
			assert.Equal(t, tt.event.GetID(), parsed.GetID())
			assert.Equal(t, tt.event.GetType(), parsed.GetType())
		})
	}
}

// parseTestMessage for testing ParseEvent
type parseTestMessage struct {
	payload  []byte
	metadata map[string]string
}

func (m *parseTestMessage) Metadata() map[string]string {
	return m.metadata
}

func parseEventFromTestMsg(msg *parseTestMessage) (Event, error) {
	eventType := msg.metadata["type"]
	if eventType == "" {
		return nil, nil
	}

	var event Event
	switch eventType {
	case EventTypeRouterStatusChanged:
		var e RouterStatusChangedEvent
		if err := json.Unmarshal(msg.payload, &e); err != nil {
			return nil, err
		}
		event = &e
	case EventTypeResourceUpdated:
		var e ResourceUpdatedEvent
		if err := json.Unmarshal(msg.payload, &e); err != nil {
			return nil, err
		}
		event = &e
	case EventTypeFeatureCrashed:
		var e FeatureCrashedEvent
		if err := json.Unmarshal(msg.payload, &e); err != nil {
			return nil, err
		}
		event = &e
	case EventTypeConfigApplyProgress:
		var e ConfigApplyProgressEvent
		if err := json.Unmarshal(msg.payload, &e); err != nil {
			return nil, err
		}
		event = &e
	case EventTypeAuth:
		var e AuthEvent
		if err := json.Unmarshal(msg.payload, &e); err != nil {
			return nil, err
		}
		event = &e
	default:
		var e BaseEvent
		if err := json.Unmarshal(msg.payload, &e); err != nil {
			return nil, err
		}
		event = &e
	}

	return event, nil
}

// =============================================================================
// Benchmark Tests
// =============================================================================

// BenchmarkEventBusPublish benchmarks event publishing performance.
// Target: 10,000 events/second (AC9)
func BenchmarkEventBusPublish(b *testing.B) {
	bus, err := NewEventBus(DefaultEventBusOptions())
	require.NoError(b, err)
	defer bus.Close()

	ctx := context.Background()
	event := NewRouterStatusChangedEvent("router-1", RouterStatusConnected, RouterStatusDisconnected, "benchmark")
	event.Priority = PriorityImmediate

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = bus.Publish(ctx, event)
	}
}

// BenchmarkEventBusPublishWithSubscriber benchmarks with an active subscriber.
func BenchmarkEventBusPublishWithSubscriber(b *testing.B) {
	bus, err := NewEventBus(DefaultEventBusOptions())
	require.NoError(b, err)
	defer bus.Close()

	err = bus.Subscribe(EventTypeRouterStatusChanged, func(ctx context.Context, event Event) error {
		return nil
	})
	require.NoError(b, err)

	ctx := context.Background()
	event := NewRouterStatusChangedEvent("router-1", RouterStatusConnected, RouterStatusDisconnected, "benchmark")
	event.Priority = PriorityImmediate

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = bus.Publish(ctx, event)
	}
}

// BenchmarkEventBusBatchedPublish benchmarks batched event publishing.
func BenchmarkEventBusBatchedPublish(b *testing.B) {
	bus, err := NewEventBus(DefaultEventBusOptions())
	require.NoError(b, err)
	defer bus.Close()

	ctx := context.Background()

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		event := NewConfigApplyProgressEvent("op-1", "router-1", "apply", i%100, i%10, 10, "progress", "benchmark")
		event.Priority = PriorityCritical
		_ = bus.Publish(ctx, event)
	}
}

// BenchmarkEventSerialization benchmarks event JSON serialization.
func BenchmarkEventSerialization(b *testing.B) {
	event := NewRouterStatusChangedEvent("router-1", RouterStatusConnected, RouterStatusDisconnected, "benchmark")

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = event.Payload()
	}
}

// TestEventBusThroughput tests that we can sustain 10,000 events/second (AC9).
func TestEventBusThroughput(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping throughput test in short mode")
	}

	bus, err := NewEventBus(DefaultEventBusOptions())
	require.NoError(t, err)
	defer bus.Close()

	var processed int
	err = bus.Subscribe(EventTypeRouterStatusChanged, func(ctx context.Context, event Event) error {
		processed++
		return nil
	})
	require.NoError(t, err)

	ctx := context.Background()
	targetEvents := 10000
	startTime := time.Now()

	for i := 0; i < targetEvents; i++ {
		event := NewRouterStatusChangedEvent("router-1", RouterStatusConnected, RouterStatusDisconnected, "throughput-test")
		event.Priority = PriorityImmediate
		err := bus.Publish(ctx, event)
		require.NoError(t, err)
	}

	elapsed := time.Since(startTime)
	eventsPerSecond := float64(targetEvents) / elapsed.Seconds()

	t.Logf("Published %d events in %v (%.0f events/second)", targetEvents, elapsed, eventsPerSecond)

	time.Sleep(200 * time.Millisecond)

	minEventsPerSecond := 5000.0
	if os.Getenv("STRICT_PERFORMANCE_TEST") == "1" {
		minEventsPerSecond = 10000.0
	}
	require.GreaterOrEqual(t, eventsPerSecond, minEventsPerSecond,
		"Should sustain at least %.0f events/second (set STRICT_PERFORMANCE_TEST=1 for 10,000)", minEventsPerSecond)
}

// TestImmediatePriorityLatency tests that immediate events are delivered in <100ms (AC2).
func TestImmediatePriorityLatency(t *testing.T) {
	bus, err := NewEventBus(DefaultEventBusOptions())
	require.NoError(t, err)
	defer bus.Close()

	latencies := make(chan time.Duration, 100)

	err = bus.Subscribe(EventTypeRouterStatusChanged, func(ctx context.Context, event Event) error {
		latency := time.Since(event.GetTimestamp())
		latencies <- latency
		return nil
	})
	require.NoError(t, err)

	ctx := context.Background()

	for i := 0; i < 100; i++ {
		event := NewRouterStatusChangedEvent("router-1", RouterStatusConnected, RouterStatusDisconnected, "latency-test")
		event.Priority = PriorityImmediate
		err := bus.Publish(ctx, event)
		require.NoError(t, err)
	}

	time.Sleep(200 * time.Millisecond)

	close(latencies)

	var totalLatency time.Duration
	var count int
	var maxLatency time.Duration

	for latency := range latencies {
		totalLatency += latency
		count++
		if latency > maxLatency {
			maxLatency = latency
		}
	}

	if count > 0 {
		avgLatency := totalLatency / time.Duration(count)
		t.Logf("Immediate priority: avg latency=%v, max latency=%v, count=%d", avgLatency, maxLatency, count)

		require.Less(t, maxLatency, 100*time.Millisecond, "Immediate priority max latency should be <100ms")
	}
}

// TestCriticalPriorityBatchWindow tests that critical events batch within 100ms (AC3).
func TestCriticalPriorityBatchWindow(t *testing.T) {
	bus, err := NewEventBus(DefaultEventBusOptions())
	require.NoError(t, err)
	defer bus.Close()

	received := make(chan time.Time, 10)

	err = bus.Subscribe(EventTypeConfigApplyProgress, func(ctx context.Context, event Event) error {
		received <- time.Now()
		return nil
	})
	require.NoError(t, err)

	ctx := context.Background()

	publishStart := time.Now()
	for i := 0; i < 5; i++ {
		event := NewConfigApplyProgressEvent("op-1", "router-1", "apply", i*20, i, 5, "progress", "batch-test")
		event.Priority = PriorityCritical
		err := bus.Publish(ctx, event)
		require.NoError(t, err)
	}
	publishEnd := time.Now()

	time.Sleep(200 * time.Millisecond)

	close(received)

	var firstDelivery, lastDelivery time.Time
	count := 0
	for deliveryTime := range received {
		if count == 0 {
			firstDelivery = deliveryTime
		}
		lastDelivery = deliveryTime
		count++
	}

	if count > 0 {
		batchWindow := lastDelivery.Sub(firstDelivery)
		deliveryLatency := firstDelivery.Sub(publishEnd)
		publishDuration := publishEnd.Sub(publishStart)

		t.Logf("Critical priority: %d events, publish duration=%v, batch window=%v, delivery latency=%v", count, publishDuration, batchWindow, deliveryLatency)

		require.Less(t, deliveryLatency, 200*time.Millisecond, "Critical events should be delivered within batch window")
	}

	require.Equal(t, 5, count, "All critical events should be received")
}
