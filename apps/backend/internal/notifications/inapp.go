// Package notifications implements in-app notification delivery via GraphQL subscriptions.
package notifications

import (
	"context"
	"fmt"

	"backend/internal/events"
)

// InAppChannel delivers notifications via GraphQL subscription dispatch.
// Per Task 3.6: Implement InAppChannel via GraphQL subscription dispatch.
type InAppChannel struct {
	eventBus events.EventBus
}

// NewInAppChannel creates a new in-app notification channel.
func NewInAppChannel(eventBus events.EventBus) *InAppChannel {
	return &InAppChannel{
		eventBus: eventBus,
	}
}

// Name returns the channel identifier.
func (i *InAppChannel) Name() string {
	return "inapp"
}

// Send delivers a notification via GraphQL subscription.
// Per AC7: Alerts arrive via GraphQL subscription, notification area updates without refresh.
func (i *InAppChannel) Send(ctx context.Context, notification Notification) error {
	if i.eventBus == nil {
		return fmt.Errorf("event bus is not configured")
	}

	// Create alert event for GraphQL subscription
	alertEvent := events.NewBaseEvent("alert.inapp.notification", events.PriorityCritical, "inapp-channel")

	// Publish event that GraphQL subscription will pick up
	return i.eventBus.Publish(ctx, &alertEvent)
}

// Test verifies the in-app channel configuration.
func (i *InAppChannel) Test(ctx context.Context, config map[string]interface{}) error {
	if i.eventBus == nil {
		return fmt.Errorf("event bus is not configured")
	}

	// Send test notification
	testNotification := Notification{
		Title:    "NasNetConnect Test",
		Message:  "In-app notifications are working!",
		Severity: "INFO",
	}

	return i.Send(ctx, testNotification)
}
