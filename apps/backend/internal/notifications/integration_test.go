// +build integration

package notifications_test

import (
	"context"
	"testing"
	"time"

	"backend/internal/events"
	"backend/internal/notifications"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestInAppChannelIntegration verifies end-to-end InAppChannel with real event bus.
func TestInAppChannelIntegration(t *testing.T) {
	// Create real event bus
	eventBus := events.NewEventBus(events.DefaultEventBusOptions())
	defer eventBus.Close()

	// Create InAppChannel
	channel := notifications.NewInAppChannel(eventBus)

	// Create context
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Create channel to receive events
	receivedEvents := make(chan *notifications.AlertNotificationEvent, 1)

	// Subscribe to events
	err := eventBus.Subscribe("alert.inapp.notification", func(ctx context.Context, event events.Event) error {
		alertEvent, ok := event.(*notifications.AlertNotificationEvent)
		if ok {
			receivedEvents <- alertEvent
		}
		return nil
	})
	require.NoError(t, err)

	// Send notification
	deviceID := "router-test"
	notification := notifications.Notification{
		Title:    "Integration Test Alert",
		Message:  "Testing InAppChannel with real event bus",
		Severity: "CRITICAL",
		DeviceID: &deviceID,
		Data: map[string]interface{}{
			"ruleId": "rule-integration",
			"test":   true,
		},
	}

	err = channel.Send(ctx, notification)
	require.NoError(t, err)

	// Wait for event
	select {
	case received := <-receivedEvents:
		assert.Equal(t, "Integration Test Alert", received.Title)
		assert.Equal(t, "Testing InAppChannel with real event bus", received.Message)
		assert.Equal(t, "CRITICAL", received.Severity)
		assert.Equal(t, "router-test", received.DeviceID)
		assert.Equal(t, "rule-integration", received.RuleID)
		assert.True(t, received.Data["test"].(bool))

	case <-ctx.Done():
		t.Fatal("Timeout waiting for event")
	}
}
