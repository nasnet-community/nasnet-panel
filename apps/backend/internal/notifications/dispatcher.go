// Package notifications implements notification dispatch with retry logic.
package notifications

import (
	"context"
	"fmt"
	"time"

	"backend/ent"
	"backend/internal/events"
	"go.uber.org/zap"
)

// Dispatcher manages notification delivery across multiple channels with retry logic.
// Per Task 3.9: Add retry logic with exponential backoff for failed deliveries (max 3 retries).
type Dispatcher struct {
	channels        map[string]Channel
	log             *zap.SugaredLogger
	digestService   DigestService    // Interface for digest operations
	templateService TemplateRenderer // Optional template renderer for alert content
	db              *ent.Client      // Database client for querying alerts (needed for template rendering)

	// Retry configuration
	maxRetries     int
	initialBackoff time.Duration
}

// DigestService defines methods for digest queuing (NAS-18.11 Task 7).
type DigestService interface {
	QueueAlert(ctx context.Context, alert Alert, channelID, channelType string, bypassSent bool) error
}

// Alert represents an alert for digest queuing (NAS-18.11 Task 7).
type Alert struct {
	ID        string
	RuleID    string
	Severity  string
	EventType string
	Title     string
	Message   string
	Data      map[string]interface{}
}

// DigestConfig defines digest delivery configuration (NAS-18.11 Task 7).
type DigestConfig struct {
	Enabled        bool
	BypassCritical bool
}

// DispatcherConfig holds dispatcher configuration.
type DispatcherConfig struct {
	Channels        map[string]Channel
	Logger          *zap.SugaredLogger
	DigestService   DigestService    // Optional digest service for NAS-18.11
	TemplateService TemplateRenderer // Optional template renderer for alert content (NAS-18.11 Task 5)
	DB              *ent.Client      // Database client (required if TemplateService is provided)
	MaxRetries      int              // Default: 3
	InitialBackoff  time.Duration    // Default: 1 second
}

// NewDispatcher creates a new notification dispatcher.
func NewDispatcher(cfg DispatcherConfig) *Dispatcher {
	maxRetries := cfg.MaxRetries
	if maxRetries == 0 {
		maxRetries = 3
	}

	initialBackoff := cfg.InitialBackoff
	if initialBackoff == 0 {
		initialBackoff = 1 * time.Second
	}

	return &Dispatcher{
		channels:        cfg.Channels,
		log:             cfg.Logger,
		digestService:   cfg.DigestService,
		templateService: cfg.TemplateService,
		db:              cfg.DB,
		maxRetries:      maxRetries,
		initialBackoff:  initialBackoff,
	}
}

// Dispatch sends a notification to all specified channels.
// Returns a slice of DeliveryResult for each channel.
// Per NAS-18.11 Task 7: Split channels into immediate vs digest based on config.
func (d *Dispatcher) Dispatch(ctx context.Context, notification Notification, channelNames []string) []DeliveryResult {
	results := make([]DeliveryResult, 0, len(channelNames))

	// Split channels based on digest configuration
	immediateChannels := []string{}
	digestChannels := []string{}

	for _, channelName := range channelNames {
		digestConfig := d.getDigestConfig(channelName)

		// Determine if alert should be queued for digest
		isCritical := notification.Severity == "critical"
		shouldQueue := digestConfig != nil &&
			digestConfig.Enabled &&
			!(isCritical && digestConfig.BypassCritical)

		if shouldQueue {
			// Queue for digest delivery
			digestChannels = append(digestChannels, channelName)

			// If critical with bypass, also send immediately
			if isCritical && digestConfig.BypassCritical {
				immediateChannels = append(immediateChannels, channelName)
			}
		} else {
			// Send immediately
			immediateChannels = append(immediateChannels, channelName)
		}
	}

	// Queue alerts for digest channels
	if d.digestService != nil && len(digestChannels) > 0 {
		alert := Alert{
			ID:        getAlertID(notification),
			RuleID:    getRuleID(notification),
			Severity:  notification.Severity,
			EventType: getEventType(notification),
			Title:     notification.Title,
			Message:   notification.Message,
			Data:      notification.Data,
		}

		for _, channelName := range digestChannels {
			// Determine if this was also sent immediately (bypass case)
			bypassSent := containsString(immediateChannels, channelName)

			// Queue for digest
			if err := d.digestService.QueueAlert(ctx, alert, channelName, "email", bypassSent); err != nil {
				d.log.Warnw("failed to queue alert for digest",
					"channel", channelName,
					"alert_id", alert.ID,
					"error", err)
			}
		}
	}

	// Dispatch to immediate channels
	for _, channelName := range immediateChannels {
		result := d.dispatchToChannel(ctx, notification, channelName)
		results = append(results, result)
	}

	return results
}

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
	if d.templateService != nil && d.db != nil {
		// Try to get alert from notification data first
		var alert *ent.Alert
		if alertData, ok := notification.Data["alert"]; ok {
			alert, _ = alertData.(*ent.Alert)
		}

		// If not in data, try to query by alertId
		if alert == nil {
			if alertID, ok := notification.Data["alertId"].(string); ok && alertID != "" {
				// Query the alert from database
				var err error
				alert, err = d.db.Alert.Get(ctx, alertID)
				if err != nil {
					d.log.Warnw("failed to query alert for template rendering",
						"channel", channelName,
						"alert_id", alertID,
						"error", err)
				}
			}
		}

		// If we have an alert, render the template
		if alert != nil {
			subject, body, err := d.templateService.RenderAlert(ctx, alert, channelName)
			if err != nil {
				// Log warning but continue with original notification
				d.log.Warnw("template render failed, using original notification",
					"channel", channelName,
					"alert_id", alert.ID,
					"error", err)
			} else {
				// Replace notification content with rendered template
				notification.Title = subject
				notification.Message = body
				d.log.Debugw("rendered alert template",
					"channel", channelName,
					"alert_id", alert.ID,
					"subject_length", len(subject),
					"body_length", len(body))
			}
		}
	}

	// Attempt delivery with retries
	var lastErr error
	backoff := d.initialBackoff

	for attempt := 0; attempt <= d.maxRetries; attempt++ {
		if attempt > 0 {
			// Wait with exponential backoff
			select {
			case <-time.After(backoff):
				// Continue with retry
			case <-ctx.Done():
				// Context cancelled
				return DeliveryResult{
					Channel:   channelName,
					Success:   false,
					Error:     "context cancelled during retry",
					Retryable: false,
				}
			}

			d.log.Infow("retrying notification delivery",
				"channel", channelName,
				"attempt", attempt,
				"backoff_ms", backoff.Milliseconds())

			// Exponential backoff (double each time)
			backoff *= 2
		}

		// Attempt delivery
		err := channel.Send(ctx, notification)
		if err == nil {
			// Success!
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

	// All retries exhausted
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

// TestChannel tests a notification channel configuration.
func (d *Dispatcher) TestChannel(ctx context.Context, channelName string, config map[string]interface{}) error {
	channel, exists := d.channels[channelName]
	if !exists {
		return fmt.Errorf("channel '%s' not configured", channelName)
	}

	return channel.Test(ctx, config)
}

// GetChannels returns a list of all registered channel names.
func (d *Dispatcher) GetChannels() []string {
	channels := make([]string, 0, len(d.channels))
	for name := range d.channels {
		channels = append(channels, name)
	}
	return channels
}

// GetChannel returns a specific channel by name.
// Returns nil if the channel doesn't exist.
func (d *Dispatcher) GetChannel(name string) Channel {
	return d.channels[name]
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
