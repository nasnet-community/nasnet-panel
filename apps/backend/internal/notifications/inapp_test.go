package notifications

import (
	"context"
	"encoding/json"
	"testing"
	"time"

	"backend/internal/events"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// mockEventBus is a mock implementation of events.EventBus for testing.
type mockEventBus struct {
	published []events.Event
	subscriptions map[string][]events.EventHandler
}

func newMockEventBus() *mockEventBus {
	return &mockEventBus{
		published: make([]events.Event, 0),
		subscriptions: make(map[string][]events.EventHandler),
	}
}

func (m *mockEventBus) Publish(ctx context.Context, event events.Event) error {
	m.published = append(m.published, event)

	// Trigger subscribers
	if handlers, ok := m.subscriptions[event.GetType()]; ok {
		for _, handler := range handlers {
			_ = handler(ctx, event)
		}
	}

	return nil
}

func (m *mockEventBus) Subscribe(topic string, handler events.EventHandler) error {
	if m.subscriptions[topic] == nil {
		m.subscriptions[topic] = make([]events.EventHandler, 0)
	}
	m.subscriptions[topic] = append(m.subscriptions[topic], handler)
	return nil
}

func (m *mockEventBus) SubscribeAll(handler events.EventHandler) error {
	// Not needed for these tests
	return nil
}

func (m *mockEventBus) Unsubscribe(topic string) error {
	delete(m.subscriptions, topic)
	return nil
}

func (m *mockEventBus) Close() error {
	return nil
}

func TestInAppChannel_Name(t *testing.T) {
	channel := NewInAppChannel(nil)
	assert.Equal(t, "inapp", channel.Name())
}

func TestInAppChannel_Send_WithNilEventBus(t *testing.T) {
	channel := NewInAppChannel(nil)

	notification := Notification{
		Title:    "Test Alert",
		Message:  "Test message",
		Severity: "CRITICAL",
	}

	err := channel.Send(context.Background(), notification)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "event bus is not configured")
}

func TestInAppChannel_Send_PublishesFullNotificationData(t *testing.T) {
	mockBus := newMockEventBus()
	channel := NewInAppChannel(mockBus)

	deviceID := "router-123"
	notification := Notification{
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

	ctx := context.Background()
	err := channel.Send(ctx, notification)
	require.NoError(t, err)

	// Verify event was published
	require.Len(t, mockBus.published, 1)

	publishedEvent := mockBus.published[0]

	// Verify event type
	assert.Equal(t, "alert.inapp.notification", publishedEvent.GetType())

	// Verify priority
	assert.Equal(t, events.PriorityCritical, publishedEvent.GetPriority())

	// Verify source
	assert.Equal(t, "inapp-channel", publishedEvent.GetSource())

	// Type assert to AlertNotificationEvent
	alertEvent, ok := publishedEvent.(*AlertNotificationEvent)
	require.True(t, ok, "Published event should be AlertNotificationEvent")

	// Verify all notification fields are present
	assert.Equal(t, notification.Title, alertEvent.Title)
	assert.Equal(t, notification.Message, alertEvent.Message)
	assert.Equal(t, notification.Severity, alertEvent.Severity)
	assert.Equal(t, *notification.DeviceID, alertEvent.DeviceID)
	assert.Equal(t, "rule-456", alertEvent.RuleID)
	assert.NotNil(t, alertEvent.Data)
	assert.Equal(t, "router-123", alertEvent.Data["routerId"])
	assert.Equal(t, "offline", alertEvent.Data["status"])
}

func TestInAppChannel_Send_EventPayloadContainsAllFields(t *testing.T) {
	mockBus := newMockEventBus()
	channel := NewInAppChannel(mockBus)

	deviceID := "router-789"
	notification := Notification{
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

	err := channel.Send(context.Background(), notification)
	require.NoError(t, err)
	require.Len(t, mockBus.published, 1)

	// Get the payload
	payload, err := mockBus.published[0].Payload()
	require.NoError(t, err)

	// Parse payload JSON
	var parsedEvent map[string]interface{}
	err = json.Unmarshal(payload, &parsedEvent)
	require.NoError(t, err)

	// Verify all fields are in payload
	assert.Equal(t, "alert.inapp.notification", parsedEvent["type"])
	assert.Equal(t, "CPU High", parsedEvent["title"])
	assert.Equal(t, "CPU usage is above 90%", parsedEvent["message"])
	assert.Equal(t, "WARNING", parsedEvent["severity"])
	assert.Equal(t, "router-789", parsedEvent["deviceId"])
	assert.Equal(t, "rule-cpu", parsedEvent["ruleId"])

	// Verify data map
	dataMap, ok := parsedEvent["data"].(map[string]interface{})
	require.True(t, ok)
	assert.Equal(t, "rule-cpu", dataMap["ruleId"])
	assert.Equal(t, 95.5, dataMap["cpuUsage"])
	assert.Equal(t, 90.0, dataMap["threshold"])
}

func TestInAppChannel_Send_WithoutDeviceID(t *testing.T) {
	mockBus := newMockEventBus()
	channel := NewInAppChannel(mockBus)

	notification := Notification{
		Title:    "System Alert",
		Message:  "General system notification",
		Severity: "INFO",
	}

	err := channel.Send(context.Background(), notification)
	require.NoError(t, err)
	require.Len(t, mockBus.published, 1)

	alertEvent, ok := mockBus.published[0].(*AlertNotificationEvent)
	require.True(t, ok)

	// DeviceID should be empty string
	assert.Empty(t, alertEvent.DeviceID)
}

func TestInAppChannel_Send_WithoutRuleID(t *testing.T) {
	mockBus := newMockEventBus()
	channel := NewInAppChannel(mockBus)

	notification := Notification{
		Title:    "Manual Alert",
		Message:  "Manually triggered notification",
		Severity: "INFO",
		Data:     map[string]interface{}{
			"source": "manual",
		},
	}

	err := channel.Send(context.Background(), notification)
	require.NoError(t, err)
	require.Len(t, mockBus.published, 1)

	alertEvent, ok := mockBus.published[0].(*AlertNotificationEvent)
	require.True(t, ok)

	// RuleID should be empty string
	assert.Empty(t, alertEvent.RuleID)
}

func TestInAppChannel_Test(t *testing.T) {
	mockBus := newMockEventBus()
	channel := NewInAppChannel(mockBus)

	err := channel.Test(context.Background(), nil)
	require.NoError(t, err)

	// Verify test notification was sent
	require.Len(t, mockBus.published, 1)

	alertEvent, ok := mockBus.published[0].(*AlertNotificationEvent)
	require.True(t, ok)

	assert.Equal(t, "NasNetConnect Test", alertEvent.Title)
	assert.Equal(t, "In-app notifications are working!", alertEvent.Message)
	assert.Equal(t, "INFO", alertEvent.Severity)
}

func TestInAppChannel_Test_WithNilEventBus(t *testing.T) {
	channel := NewInAppChannel(nil)

	err := channel.Test(context.Background(), nil)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "event bus is not configured")
}

func TestAlertNotificationEvent_Payload(t *testing.T) {
	deviceID := "router-abc"
	notification := Notification{
		Title:    "Interface Down",
		Message:  "Interface ether1 is down",
		Severity: "CRITICAL",
		DeviceID: &deviceID,
		Data: map[string]interface{}{
			"ruleId":        "rule-interface",
			"interfaceName": "ether1",
			"status":        "down",
		},
	}

	event := NewAlertNotificationEvent(notification, "test-source")

	payload, err := event.Payload()
	require.NoError(t, err)

	var parsed map[string]interface{}
	err = json.Unmarshal(payload, &parsed)
	require.NoError(t, err)

	// Verify BaseEvent fields
	assert.NotEmpty(t, parsed["id"])
	assert.Equal(t, "alert.inapp.notification", parsed["type"])
	assert.Equal(t, "test-source", parsed["source"])
	assert.NotEmpty(t, parsed["timestamp"])

	// Verify notification fields
	assert.Equal(t, "Interface Down", parsed["title"])
	assert.Equal(t, "Interface ether1 is down", parsed["message"])
	assert.Equal(t, "CRITICAL", parsed["severity"])
	assert.Equal(t, "router-abc", parsed["deviceId"])
	assert.Equal(t, "rule-interface", parsed["ruleId"])
}

func TestInAppChannel_Send_ConcurrentCalls(t *testing.T) {
	mockBus := newMockEventBus()
	channel := NewInAppChannel(mockBus)

	ctx := context.Background()
	numConcurrent := 10
	done := make(chan bool, numConcurrent)

	for i := 0; i < numConcurrent; i++ {
		go func(index int) {
			notification := Notification{
				Title:    "Concurrent Alert",
				Message:  "Test concurrent notification",
				Severity: "INFO",
				Data: map[string]interface{}{
					"index": index,
				},
			}
			err := channel.Send(ctx, notification)
			assert.NoError(t, err)
			done <- true
		}(i)
	}

	// Wait for all goroutines to complete
	timeout := time.After(5 * time.Second)
	for i := 0; i < numConcurrent; i++ {
		select {
		case <-done:
			// Success
		case <-timeout:
			t.Fatal("Test timed out")
		}
	}

	// Verify all events were published
	assert.Len(t, mockBus.published, numConcurrent)
}

func TestNewAlertNotificationEvent_ExtractsRuleID(t *testing.T) {
	tests := []struct {
		name           string
		notification   Notification
		expectedRuleID string
	}{
		{
			name: "RuleID in data",
			notification: Notification{
				Title:    "Test",
				Message:  "Test message",
				Severity: "INFO",
				Data: map[string]interface{}{
					"ruleId": "rule-123",
				},
			},
			expectedRuleID: "rule-123",
		},
		{
			name: "No ruleID in data",
			notification: Notification{
				Title:    "Test",
				Message:  "Test message",
				Severity: "INFO",
				Data: map[string]interface{}{
					"other": "value",
				},
			},
			expectedRuleID: "",
		},
		{
			name: "Nil data",
			notification: Notification{
				Title:    "Test",
				Message:  "Test message",
				Severity: "INFO",
			},
			expectedRuleID: "",
		},
		{
			name: "RuleID wrong type",
			notification: Notification{
				Title:    "Test",
				Message:  "Test message",
				Severity: "INFO",
				Data: map[string]interface{}{
					"ruleId": 12345, // number instead of string
				},
			},
			expectedRuleID: "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			event := NewAlertNotificationEvent(tt.notification, "test")
			assert.Equal(t, tt.expectedRuleID, event.RuleID)
		})
	}
}
