package push

import (
	"context"
	"fmt"

	"backend/internal/notifications"

	"backend/internal/events"
)

// InAppChannel delivers notifications via GraphQL subscription dispatch.
type InAppChannel struct {
	eventBus events.EventBus
}

// NewInAppChannel creates a new in-app notification channel.
func NewInAppChannel(eventBus events.EventBus) *InAppChannel {
	return &InAppChannel{eventBus: eventBus}
}

// Name returns the channel identifier.
func (i *InAppChannel) Name() string { return "inapp" }

// Send delivers a notification via GraphQL subscription.
func (i *InAppChannel) Send(ctx context.Context, notification notifications.Notification) error {
	if i.eventBus == nil {
		return fmt.Errorf("event bus is not configured")
	}
	alertEvent := notifications.NewAlertNotificationEvent(notification, "inapp-channel")
	return i.eventBus.Publish(ctx, alertEvent)
}

// Test verifies the in-app channel configuration.
func (i *InAppChannel) Test(ctx context.Context, config map[string]interface{}) error {
	if i.eventBus == nil {
		return fmt.Errorf("event bus is not configured")
	}
	testNotification := notifications.Notification{
		Title:    "NasNetConnect Test",
		Message:  "In-app notifications are working!",
		Severity: "INFO",
	}
	return i.Send(ctx, testNotification)
}
