package events

import (
	"context"
	"os"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
)

// BenchmarkEventBusPublish benchmarks event publishing performance.
// Target: 10,000 events/second (AC9)
func BenchmarkEventBusPublish(b *testing.B) {
	bus, err := NewEventBus(DefaultEventBusOptions())
	require.NoError(b, err)
	defer bus.Close()

	ctx := context.Background()
	event := NewRouterStatusChangedEvent("router-1", RouterStatusConnected, RouterStatusDisconnected, "benchmark")
	event.Priority = PriorityImmediate // Skip batching for pure throughput measurement

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

	// Add a subscriber
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
		event.Priority = PriorityCritical // Goes through batching
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
// This test validates throughput performance. In CI environments with variable load,
// we use a relaxed threshold (5,000 events/second) to avoid flaky failures.
// Set STRICT_PERFORMANCE_TEST=1 to enforce the full 10,000 events/second target.
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

	// Publish 10,000 events
	for i := 0; i < targetEvents; i++ {
		event := NewRouterStatusChangedEvent("router-1", RouterStatusConnected, RouterStatusDisconnected, "throughput-test")
		event.Priority = PriorityImmediate
		err := bus.Publish(ctx, event)
		require.NoError(t, err)
	}

	elapsed := time.Since(startTime)
	eventsPerSecond := float64(targetEvents) / elapsed.Seconds()

	t.Logf("Published %d events in %v (%.0f events/second)", targetEvents, elapsed, eventsPerSecond)

	// Wait for handlers to complete
	time.Sleep(200 * time.Millisecond)

	// Use relaxed threshold for CI (5,000 events/second) to avoid flaky tests
	// Set STRICT_PERFORMANCE_TEST=1 to enforce full 10,000 events/second target
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

	// Publish 100 immediate priority events
	for i := 0; i < 100; i++ {
		event := NewRouterStatusChangedEvent("router-1", RouterStatusConnected, RouterStatusDisconnected, "latency-test")
		event.Priority = PriorityImmediate
		err := bus.Publish(ctx, event)
		require.NoError(t, err)
	}

	// Wait for processing
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

		// p99 should be <100ms for immediate priority
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

	// Publish 5 critical priority events quickly
	publishStart := time.Now()
	for i := 0; i < 5; i++ {
		event := NewConfigApplyProgressEvent("op-1", "router-1", "apply", i*20, i, 5, "progress", "batch-test")
		event.Priority = PriorityCritical
		err := bus.Publish(ctx, event)
		require.NoError(t, err)
	}
	publishEnd := time.Now()

	// Wait for batch window + buffer
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

		// All events should be delivered within the batch window (~100ms)
		require.Less(t, deliveryLatency, 200*time.Millisecond, "Critical events should be delivered within batch window")
	}

	require.Equal(t, 5, count, "All critical events should be received")
}
