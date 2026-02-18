// Package notifications implements notification dispatch with retry logic.
package notifications

import (
	"context"
	"fmt"
	"time"

	"backend/generated/ent"

	"backend/internal/events"
)

// getDigestConfig retrieves digest configuration for a channel.
// Returns nil if digest is not configured for the channel.
func (d *Dispatcher) getDigestConfig(channelName string) *DigestConfig {
	// TODO: In production, fetch from database or configuration
	// For now, return nil (digest disabled by default)
	// This will be populated when channel configuration is implemented
	return nil
}

// Helper functions to extract alert metadata from notification
func getAlertID(n Notification) string {
	if n.Data != nil {
		if id, ok := n.Data["alertId"].(string); ok {
			return id
		}
	}
	return ""
}

func getRuleID(n Notification) string {
	if n.Data != nil {
		if id, ok := n.Data["ruleId"].(string); ok {
			return id
		}
	}
	return ""
}

func getEventType(n Notification) string {
	if n.Data != nil {
		if et, ok := n.Data["eventType"].(string); ok {
			return et
		}
	}
	return ""
}

// dispatchToChannel sends notification to a single channel with retry logic.
func (d *Dispatcher) dispatchToChannel(ctx context.Context, notification Notification, channelName string) DeliveryResult {
	channel, exists := d.channels[channelName]
	if !exists {
		d.log.Warnw("unknown notification channel", "channel", channelName)
		return DeliveryResult{
			Channel:   channelName,
			Success:   false,
			Error:     fmt.Sprintf("channel '%s' not configured", channelName),
			Retryable: false,
		}
	}

	// Render templates if template service is available (NAS-18.11 Task 5)
	d.renderAlertTemplate(ctx, &notification, channelName)

	// Attempt delivery with retries
	return d.deliverWithRetries(ctx, channel, notification, channelName)
}

// renderAlertTemplate applies alert template rendering to the notification if configured.
func (d *Dispatcher) renderAlertTemplate(ctx context.Context, notification *Notification, channelName string) {
	if d.templateService == nil || d.db == nil {
		return
	}

	alert := d.resolveAlert(ctx, notification, channelName)
	if alert == nil {
		return
	}

	subject, body, err := d.templateService.RenderAlert(ctx, alert, channelName)
	if err != nil {
		d.log.Warnw("template render failed, using original notification",
			"channel", channelName,
			"alert_id", alert.ID,
			"error", err)
		return
	}

	notification.Title = subject
	notification.Message = body
	d.log.Debugw("rendered alert template",
		"channel", channelName,
		"alert_id", alert.ID,
		"subject_length", len(subject),
		"body_length", len(body))
}

// resolveAlert attempts to find the alert from notification data or database.
func (d *Dispatcher) resolveAlert(ctx context.Context, notification *Notification, channelName string) *ent.Alert {
	if alertData, ok := notification.Data["alert"]; ok {
		if alert, ok := alertData.(*ent.Alert); ok {
			return alert
		}
	}

	if alertID, ok := notification.Data["alertId"].(string); ok && alertID != "" {
		alert, err := d.db.Alert.Get(ctx, alertID)
		if err != nil {
			d.log.Warnw("failed to query alert for template rendering",
				"channel", channelName,
				"alert_id", alertID,
				"error", err)
			return nil
		}
		return alert
	}

	return nil
}

// deliverWithRetries attempts to send a notification with exponential backoff retries.
func (d *Dispatcher) deliverWithRetries(ctx context.Context, channel Channel, notification Notification, channelName string) DeliveryResult {
	var lastErr error
	backoff := d.initialBackoff

	for attempt := 0; attempt <= d.maxRetries; attempt++ {
		if attempt > 0 {
			select {
			case <-time.After(backoff):
			case <-ctx.Done():
				return DeliveryResult{
					Channel:   channelName,
					Success:   false,
					Error:     "context canceled during retry",
					Retryable: false,
				}
			}

			d.log.Infow("retrying notification delivery",
				"channel", channelName,
				"attempt", attempt,
				"backoff_ms", backoff.Milliseconds())

			backoff *= 2
		}

		err := channel.Send(ctx, notification)
		if err == nil {
			if attempt > 0 {
				d.log.Infow("notification delivered after retry",
					"channel", channelName,
					"attempts", attempt+1)
			}
			return DeliveryResult{
				Channel:   channelName,
				Success:   true,
				Retryable: false,
			}
		}

		lastErr = err
		d.log.Warnw("notification delivery failed",
			"channel", channelName,
			"attempt", attempt+1,
			"error", err)
	}

	return DeliveryResult{
		Channel:   channelName,
		Success:   false,
		Error:     lastErr.Error(),
		Retryable: d.isRetryable(lastErr),
	}
}

// isRetryable determines if an error is transient and worth retrying.
func (d *Dispatcher) isRetryable(err error) bool {
	if err == nil {
		return false
	}

	// Simple heuristic: network errors are generally retryable
	// Configuration errors are not
	errorStr := err.Error()

	// Non-retryable errors
	if contains(errorStr, "invalid") ||
		contains(errorStr, "unauthorized") ||
		contains(errorStr, "forbidden") ||
		contains(errorStr, "not configured") {

		return false
	}

	// Retryable errors
	return contains(errorStr, "timeout") ||
		contains(errorStr, "connection") ||
		contains(errorStr, "network") ||
		contains(errorStr, "temporary")
}

// containsString checks if a string slice contains a specific string.
func containsString(slice []string, str string) bool {
	for _, item := range slice {
		if item == str {
			return true
		}
	}
	return false
}

// contains checks if a string contains a substring (case-insensitive).
func contains(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || len(s) > len(substr) &&
		(s[:len(substr)] == substr || s[len(s)-len(substr):] == substr ||
			len(s) > len(substr)+1 && findSubstring(s, substr)))
}

// findSubstring performs simple substring search.
func findSubstring(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}

// HandleAlertCreated processes AlertCreatedEvent and dispatches notifications.
// This is the event handler subscribed to "alert.created" events in the event bus.
// It extracts the alert details, constructs a Notification, and dispatches to
// all channels configured in the alert rule.
func (d *Dispatcher) HandleAlertCreated(ctx context.Context, event events.Event) error {
	// Type assert to AlertCreatedEvent
	alertEvent, ok := event.(*events.AlertCreatedEvent)
	if !ok {
		d.log.Errorw("received non-AlertCreatedEvent in HandleAlertCreated",
			"event_type", event.GetType())
		return fmt.Errorf("expected AlertCreatedEvent, got %T", event)
	}

	d.log.Infow("processing alert created event",
		"alert_id", alertEvent.AlertID,
		"rule_id", alertEvent.RuleID,
		"severity", alertEvent.Severity,
		"channels", alertEvent.Channels)

	// Build notification from alert event
	notification := Notification{
		Title:    alertEvent.Title,
		Message:  alertEvent.Message,
		Severity: alertEvent.Severity,
		Data:     alertEvent.Data,
	}

	// Add device ID if present
	if alertEvent.DeviceID != "" {
		notification.DeviceID = &alertEvent.DeviceID
	}

	// Ensure data map exists
	if notification.Data == nil {
		notification.Data = make(map[string]interface{})
	}

	// Add alert metadata to notification data
	notification.Data["alertId"] = alertEvent.AlertID
	notification.Data["ruleId"] = alertEvent.RuleID
	notification.Data["eventType"] = alertEvent.EventType

	// Dispatch to all configured channels
	results := d.Dispatch(ctx, notification, alertEvent.Channels)

	// Log delivery results
	successCount := 0
	for _, result := range results {
		if result.Success {
			successCount++
		} else {
			d.log.Warnw("notification delivery failed",
				"alert_id", alertEvent.AlertID,
				"channel", result.Channel,
				"error", result.Error,
				"retryable", result.Retryable)
		}
	}

	d.log.Infow("alert notifications dispatched",
		"alert_id", alertEvent.AlertID,
		"total_channels", len(alertEvent.Channels),
		"successful", successCount)

	// Return nil even if some channels failed (we've logged failures)
	// The alert was created successfully, channel failures shouldn't break the flow
	return nil
}
