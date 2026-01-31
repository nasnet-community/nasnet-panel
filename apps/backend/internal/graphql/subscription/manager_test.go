package subscription

import (
	"context"
	"testing"
	"time"

	"backend/internal/events"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNewManager(t *testing.T) {
	// Create manager without event bus
	m := NewManager(nil)
	require.NotNil(t, m)

	stats := m.GetStats()
	assert.Equal(t, 0, stats.ActiveSubscriptions)
	assert.Equal(t, uint64(0), stats.TotalDelivered)
	assert.Equal(t, uint64(0), stats.TotalDropped)
}

func TestSubscribe(t *testing.T) {
	m := NewManager(nil)
	defer m.Close()

	ch := make(chan events.Event, 10)

	id, err := m.Subscribe(SubscriptionOptions{
		EventTypes: []string{events.EventTypeRouterStatusChanged},
		Channel:    ch,
		Priority:   events.PriorityNormal,
	})

	require.NoError(t, err)
	assert.NotEmpty(t, id)

	stats := m.GetStats()
	assert.Equal(t, 1, stats.ActiveSubscriptions)
}

func TestUnsubscribe(t *testing.T) {
	m := NewManager(nil)
	defer m.Close()

	ch := make(chan events.Event, 10)

	id, err := m.Subscribe(SubscriptionOptions{
		EventTypes: []string{events.EventTypeRouterStatusChanged},
		Channel:    ch,
		Priority:   events.PriorityNormal,
	})
	require.NoError(t, err)

	err = m.Unsubscribe(id)
	require.NoError(t, err)

	stats := m.GetStats()
	assert.Equal(t, 0, stats.ActiveSubscriptions)
}

func TestUnsubscribeNotFound(t *testing.T) {
	m := NewManager(nil)
	defer m.Close()

	err := m.Unsubscribe([16]byte{}) // Invalid ID
	assert.Equal(t, ErrSubscriptionNotFound, err)
}

func TestHandleEvent(t *testing.T) {
	m := NewManager(nil)
	defer m.Close()

	ch := make(chan events.Event, 10)

	_, err := m.Subscribe(SubscriptionOptions{
		EventTypes: []string{events.EventTypeRouterStatusChanged},
		Channel:    ch,
		Priority:   events.PriorityNormal,
	})
	require.NoError(t, err)

	// Simulate an event
	event := events.NewRouterStatusChangedEvent(
		"router-1",
		events.RouterStatusConnected,
		events.RouterStatusDisconnected,
		"test",
	)

	err = m.handleEvent(context.Background(), event)
	require.NoError(t, err)

	// Check that event was delivered
	select {
	case received := <-ch:
		assert.Equal(t, event.GetID(), received.GetID())
	case <-time.After(time.Second):
		t.Fatal("expected event delivery")
	}
}

func TestEventFiltering(t *testing.T) {
	m := NewManager(nil)
	defer m.Close()

	ch := make(chan events.Event, 10)

	// Subscribe only to resource events
	_, err := m.Subscribe(SubscriptionOptions{
		EventTypes: []string{events.EventTypeResourceUpdated},
		Channel:    ch,
		Priority:   events.PriorityNormal,
	})
	require.NoError(t, err)

	// Send a router event (should be filtered out)
	routerEvent := events.NewRouterStatusChangedEvent(
		"router-1",
		events.RouterStatusConnected,
		events.RouterStatusDisconnected,
		"test",
	)

	err = m.handleEvent(context.Background(), routerEvent)
	require.NoError(t, err)

	// Verify no event was delivered
	select {
	case <-ch:
		t.Fatal("unexpected event delivery")
	case <-time.After(100 * time.Millisecond):
		// Expected - no event should be delivered
	}
}

func TestPriorityFiltering(t *testing.T) {
	m := NewManager(nil)
	defer m.Close()

	ch := make(chan events.Event, 10)

	// Subscribe only to immediate/critical events
	_, err := m.Subscribe(SubscriptionOptions{
		EventTypes: []string{"*"},
		Channel:    ch,
		Priority:   events.PriorityCritical, // Only immediate and critical
	})
	require.NoError(t, err)

	// Send a background event (should be filtered out)
	bgEvent := events.NewMetricUpdatedEvent(
		"router-1",
		"cpu",
		map[string]string{"usage": "50"},
		"test",
	)

	err = m.handleEvent(context.Background(), bgEvent)
	require.NoError(t, err)

	// Verify no event was delivered (background priority > critical)
	select {
	case <-ch:
		t.Fatal("unexpected event delivery")
	case <-time.After(100 * time.Millisecond):
		// Expected - no event should be delivered
	}

	// Send an immediate event (should be delivered)
	immEvent := events.NewRouterStatusChangedEvent(
		"router-1",
		events.RouterStatusConnected,
		events.RouterStatusDisconnected,
		"test",
	)

	err = m.handleEvent(context.Background(), immEvent)
	require.NoError(t, err)

	// Verify event was delivered
	select {
	case received := <-ch:
		assert.Equal(t, immEvent.GetID(), received.GetID())
	case <-time.After(time.Second):
		t.Fatal("expected event delivery")
	}
}

func TestCustomFilter(t *testing.T) {
	m := NewManager(nil)
	defer m.Close()

	ch := make(chan events.Event, 10)

	// Subscribe with custom filter for specific router
	targetRouterID := "router-123"
	_, err := m.Subscribe(SubscriptionOptions{
		EventTypes: []string{events.EventTypeRouterStatusChanged},
		Channel:    ch,
		Priority:   events.PriorityBackground,
		Filter: func(e events.Event) bool {
			if rse, ok := e.(*events.RouterStatusChangedEvent); ok {
				return rse.RouterID == targetRouterID
			}
			return false
		},
	})
	require.NoError(t, err)

	// Send event for different router (should be filtered)
	event1 := events.NewRouterStatusChangedEvent(
		"router-other",
		events.RouterStatusConnected,
		events.RouterStatusDisconnected,
		"test",
	)
	m.handleEvent(context.Background(), event1)

	select {
	case <-ch:
		t.Fatal("unexpected event delivery")
	case <-time.After(100 * time.Millisecond):
		// Expected
	}

	// Send event for target router (should be delivered)
	event2 := events.NewRouterStatusChangedEvent(
		targetRouterID,
		events.RouterStatusConnected,
		events.RouterStatusDisconnected,
		"test",
	)
	m.handleEvent(context.Background(), event2)

	select {
	case received := <-ch:
		assert.Equal(t, event2.GetID(), received.GetID())
	case <-time.After(time.Second):
		t.Fatal("expected event delivery")
	}
}

func TestChannelFullDropsEvents(t *testing.T) {
	m := NewManager(nil)
	defer m.Close()

	// Create a very small channel
	ch := make(chan events.Event, 1)

	_, err := m.Subscribe(SubscriptionOptions{
		EventTypes: []string{events.EventTypeRouterStatusChanged},
		Channel:    ch,
		Priority:   events.PriorityBackground,
	})
	require.NoError(t, err)

	// Send multiple events
	for i := 0; i < 5; i++ {
		event := events.NewRouterStatusChangedEvent(
			"router-1",
			events.RouterStatusConnected,
			events.RouterStatusDisconnected,
			"test",
		)
		m.handleEvent(context.Background(), event)
	}

	// Wait a bit for processing
	time.Sleep(50 * time.Millisecond)

	stats := m.GetStats()
	// Should have dropped some events
	assert.True(t, stats.TotalDropped > 0, "expected some dropped events")
}

func TestClose(t *testing.T) {
	m := NewManager(nil)

	ch := make(chan events.Event, 10)
	_, err := m.Subscribe(SubscriptionOptions{
		EventTypes: []string{events.EventTypeRouterStatusChanged},
		Channel:    ch,
		Priority:   events.PriorityNormal,
	})
	require.NoError(t, err)

	err = m.Close()
	require.NoError(t, err)

	// Subscriptions should be cleared
	stats := m.GetStats()
	assert.Equal(t, 0, stats.ActiveSubscriptions)

	// New subscriptions should fail
	_, err = m.Subscribe(SubscriptionOptions{
		Channel: ch,
	})
	assert.Equal(t, ErrManagerClosed, err)
}
