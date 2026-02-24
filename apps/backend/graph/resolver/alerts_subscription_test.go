package resolver

import (
	"context"
	"testing"
	"time"

	"backend/graph/model"

	"backend/internal/notifications"

	"backend/internal/events"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// mockEventBusForSubscription is a mock event bus for testing subscriptions.
type mockEventBusForSubscription struct {
	subscriptions map[string][]events.EventHandler
}

func newMockEventBusForSubscription() *mockEventBusForSubscription {
	return &mockEventBusForSubscription{
		subscriptions: make(map[string][]events.EventHandler),
	}
}

func (m *mockEventBusForSubscription) Publish(ctx context.Context, event events.Event) error {
	// Trigger all subscribers for this topic
	if handlers, ok := m.subscriptions[event.GetType()]; ok {
		for _, handler := range handlers {
			if err := handler(ctx, event); err != nil {
				return err
			}
		}
	}
	return nil
}

func (m *mockEventBusForSubscription) Subscribe(topic string, handler events.EventHandler) error {
	if m.subscriptions[topic] == nil {
		m.subscriptions[topic] = make([]events.EventHandler, 0)
	}
	m.subscriptions[topic] = append(m.subscriptions[topic], handler)
	return nil
}

func (m *mockEventBusForSubscription) SubscribeAll(handler events.EventHandler) error {
	// Not needed for these tests
	return nil
}

func (m *mockEventBusForSubscription) Unsubscribe(topic string) error {
	delete(m.subscriptions, topic)
	return nil
}

func (m *mockEventBusForSubscription) Close() error {
	return nil
}

func TestAlertEventsSubscription_ReceivesNotifications(t *testing.T) {
	mockBus := newMockEventBusForSubscription()
	resolver := &Resolver{
		EventBus: mockBus,
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Subscribe to alert events
	subResolver := resolver.Subscription()
	eventChan, err := subResolver.AlertEvents(ctx, nil)
	require.NoError(t, err)
	require.NotNil(t, eventChan)

	// Create and publish a test notification event
	deviceID := "router-123"
	notification := notifications.Notification{
		Title:    "Router Offline",
		Message:  "Router MikroTik-Office has gone offline",
		Severity: "CRITICAL",
		DeviceID: &deviceID,
		Data: map[string]interface{}{
			"ruleId":   "rule-456",
			"routerId": "router-123",
			"status":   "offline",
		},
	}

	alertEvent := notifications.NewAlertNotificationEvent(notification, "test-source")

	// Publish event in a goroutine
	go func() {
		time.Sleep(100 * time.Millisecond)
		_ = mockBus.Publish(ctx, alertEvent)
	}()

	// Wait for event to arrive
	select {
	case receivedEvent := <-eventChan:
		require.NotNil(t, receivedEvent)
		assert.Equal(t, model.AlertActionCreated, receivedEvent.Action)
		require.NotNil(t, receivedEvent.Alert)
		assert.Equal(t, "Router Offline", receivedEvent.Alert.Title)
		assert.Equal(t, "Router MikroTik-Office has gone offline", receivedEvent.Alert.Message)
		assert.Equal(t, model.AlertSeverityCritical, receivedEvent.Alert.Severity)
		assert.NotNil(t, receivedEvent.Alert.DeviceID)
		assert.Equal(t, "router-123", *receivedEvent.Alert.DeviceID)

	case <-ctx.Done():
		t.Fatal("Timeout waiting for alert event")
	}
}

func TestAlertEventsSubscription_FiltersDeviceID(t *testing.T) {
	mockBus := newMockEventBusForSubscription()
	resolver := &Resolver{
		EventBus: mockBus,
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Subscribe with device ID filter
	targetDeviceID := "router-123"
	subResolver := resolver.Subscription()
	eventChan, err := subResolver.AlertEvents(ctx, &targetDeviceID)
	require.NoError(t, err)
	require.NotNil(t, eventChan)

	// Publish event for different device (should be filtered out)
	deviceID1 := "router-456"
	notification1 := notifications.Notification{
		Title:    "Alert for Router 456",
		Message:  "Different router",
		Severity: "INFO",
		DeviceID: &deviceID1,
	}
	event1 := notifications.NewAlertNotificationEvent(notification1, "test")
	_ = mockBus.Publish(ctx, event1)

	// Publish event for target device (should pass through)
	deviceID2 := "router-123"
	notification2 := notifications.Notification{
		Title:    "Alert for Router 123",
		Message:  "Target router",
		Severity: "CRITICAL",
		DeviceID: &deviceID2,
	}
	event2 := notifications.NewAlertNotificationEvent(notification2, "test")

	// Publish in goroutine
	go func() {
		time.Sleep(100 * time.Millisecond)
		_ = mockBus.Publish(ctx, event2)
	}()

	// Should only receive event for router-123
	select {
	case receivedEvent := <-eventChan:
		require.NotNil(t, receivedEvent)
		assert.Equal(t, "Alert for Router 123", receivedEvent.Alert.Title)
		assert.Equal(t, "router-123", *receivedEvent.Alert.DeviceID)

	case <-time.After(2 * time.Second):
		t.Fatal("Timeout waiting for filtered alert event")
	}
}

func TestAlertEventsSubscription_CompleteAlertObject(t *testing.T) {
	mockBus := newMockEventBusForSubscription()
	resolver := &Resolver{
		EventBus: mockBus,
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	subResolver := resolver.Subscription()
	eventChan, err := subResolver.AlertEvents(ctx, nil)
	require.NoError(t, err)

	// Create comprehensive notification
	deviceID := "router-789"
	notification := notifications.Notification{
		Title:    "CPU High",
		Message:  "CPU usage is above 90%",
		Severity: "WARNING",
		DeviceID: &deviceID,
		Data: map[string]interface{}{
			"ruleId":    "rule-cpu",
			"cpuUsage":  95.5,
			"threshold": 90.0,
		},
	}

	alertEvent := notifications.NewAlertNotificationEvent(notification, "cpu-monitor")

	go func() {
		time.Sleep(100 * time.Millisecond)
		_ = mockBus.Publish(ctx, alertEvent)
	}()

	select {
	case receivedEvent := <-eventChan:
		require.NotNil(t, receivedEvent)
		alert := receivedEvent.Alert

		// Verify all alert fields
		assert.NotEmpty(t, alert.ID)
		assert.Equal(t, "rule-cpu", alert.Rule.ID)
		assert.Equal(t, "alert.notification", alert.EventType)
		assert.Equal(t, model.AlertSeverityWarning, alert.Severity)
		assert.Equal(t, "CPU High", alert.Title)
		assert.Equal(t, "CPU usage is above 90%", alert.Message)
		assert.NotNil(t, alert.Data)
		assert.NotNil(t, alert.DeviceID)
		assert.Equal(t, "router-789", *alert.DeviceID)
		assert.NotZero(t, alert.TriggeredAt)

		// Verify data map
		dataMap := alert.Data
		assert.Equal(t, "rule-cpu", dataMap["ruleId"])
		assert.Equal(t, 95.5, dataMap["cpuUsage"])
		assert.Equal(t, 90.0, dataMap["threshold"])

	case <-ctx.Done():
		t.Fatal("Timeout waiting for complete alert event")
	}
}

func TestAlertEventsSubscription_MultipleEvents(t *testing.T) {
	mockBus := newMockEventBusForSubscription()
	resolver := &Resolver{
		EventBus: mockBus,
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	subResolver := resolver.Subscription()
	eventChan, err := subResolver.AlertEvents(ctx, nil)
	require.NoError(t, err)

	// Publish multiple events
	events := []notifications.Notification{
		{
			Title:    "Alert 1",
			Message:  "First alert",
			Severity: "CRITICAL",
		},
		{
			Title:    "Alert 2",
			Message:  "Second alert",
			Severity: "WARNING",
		},
		{
			Title:    "Alert 3",
			Message:  "Third alert",
			Severity: "INFO",
		},
	}

	go func() {
		time.Sleep(100 * time.Millisecond)
		for _, notif := range events {
			event := notifications.NewAlertNotificationEvent(notif, "test")
			_ = mockBus.Publish(ctx, event)
			time.Sleep(50 * time.Millisecond)
		}
	}()

	// Receive all three events
	received := 0
	timeout := time.After(3 * time.Second)

	for received < len(events) {
		select {
		case receivedEvent := <-eventChan:
			require.NotNil(t, receivedEvent)
			assert.Equal(t, model.AlertActionCreated, receivedEvent.Action)
			received++

		case <-timeout:
			t.Fatalf("Timeout after receiving %d/%d events", received, len(events))
		}
	}

	assert.Equal(t, len(events), received)
}

func TestAlertEventsSubscription_WithNilEventBus(t *testing.T) {
	resolver := &Resolver{
		EventBus: nil,
	}

	ctx := context.Background()
	subResolver := resolver.Subscription()
	eventChan, err := subResolver.AlertEvents(ctx, nil)

	require.Error(t, err)
	assert.Contains(t, err.Error(), "event bus is not available")
	require.NotNil(t, eventChan)

	// Channel should be closed
	_, ok := <-eventChan
	assert.False(t, ok, "Channel should be closed")
}

func TestAlertEventsSubscription_ChannelFullSkipsEvent(t *testing.T) {
	mockBus := newMockEventBusForSubscription()
	resolver := &Resolver{
		EventBus: mockBus,
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	subResolver := resolver.Subscription()
	eventChan, err := subResolver.AlertEvents(ctx, nil)
	require.NoError(t, err)
	require.NotNil(t, eventChan)
	defer func() {
		// Drain remaining events to prevent goroutine leak
		for range eventChan {
		}
	}()

	// Fill the channel buffer (capacity 10)
	for i := 0; i < 10; i++ {
		notification := notifications.Notification{
			Title:    "Fill Alert",
			Message:  "Filling buffer",
			Severity: "INFO",
		}
		event := notifications.NewAlertNotificationEvent(notification, "test")
		_ = mockBus.Publish(ctx, event)
	}

	// Publish one more event (should be skipped due to full buffer)
	notification := notifications.Notification{
		Title:    "Overflow Alert",
		Message:  "Should be skipped",
		Severity: "INFO",
	}
	event := notifications.NewAlertNotificationEvent(notification, "test")
	err = mockBus.Publish(ctx, event)

	// Should not error (event is silently dropped)
	assert.NoError(t, err)

	// Drain the channel to verify we only got 10 events
	count := 0
	timeout := time.After(1 * time.Second)

drainLoop:
	for {
		select {
		case <-eventChan:
			count++
		case <-timeout:
			break drainLoop
		}
	}

	assert.Equal(t, 10, count)
}

func TestAlertEventsSubscription_ContextCancellation(t *testing.T) {
	mockBus := newMockEventBusForSubscription()
	resolver := &Resolver{
		EventBus: mockBus,
	}

	ctx, cancel := context.WithCancel(context.Background())

	subResolver := resolver.Subscription()
	eventChan, err := subResolver.AlertEvents(ctx, nil)
	require.NoError(t, err)
	require.NotNil(t, eventChan)

	// Cancel context immediately
	cancel()
	defer cancel() // Ensure cancel is called even if it's already cancelled

	// Channel should be closed after cancellation
	timeout := time.After(2 * time.Second)
	select {
	case _, ok := <-eventChan:
		assert.False(t, ok, "Channel should be closed after context cancellation")
	case <-timeout:
		t.Fatal("Timeout waiting for channel close")
	}
}

func TestAlertEventsSubscription_IgnoresNonAlertEvents(t *testing.T) {
	mockBus := newMockEventBusForSubscription()
	resolver := &Resolver{
		EventBus: mockBus,
	}

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	subResolver := resolver.Subscription()
	eventChan, err := subResolver.AlertEvents(ctx, nil)
	require.NoError(t, err)

	// Publish a different event type (should be ignored)
	baseEvent := events.NewBaseEvent("alert.inapp.notification", events.PriorityCritical, "test")
	go func() {
		time.Sleep(100 * time.Millisecond)
		_ = mockBus.Publish(ctx, &baseEvent)
	}()

	// Should not receive the base event (wrong type)
	select {
	case receivedEvent := <-eventChan:
		t.Fatalf("Should not have received event, got: %+v", receivedEvent)
	case <-time.After(500 * time.Millisecond):
		// Expected - no event received
	}
}
