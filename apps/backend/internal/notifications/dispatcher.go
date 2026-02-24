// Package notifications implements notification dispatch with retry logic.
package notifications

import (
	"context"
	"fmt"
	"time"

	"go.uber.org/zap"

	"backend/generated/ent"
)

// Dispatcher manages notification delivery across multiple channels with retry logic.
// Per Task 3.9: Add retry logic with exponential backoff for failed deliveries (max 3 retries).
// Per Task 3.9: Add dead letter queue for failed notifications after max retries exhausted.
type Dispatcher struct {
	channels        map[string]Channel
	log             *zap.Logger
	digestService   DigestService            // Interface for digest operations
	templateService TemplateRenderer         // Optional template renderer for alert content
	db              *ent.Client              // Database client for querying alerts (needed for template rendering)
	digestConfigs   map[string]*DigestConfig // Per-channel digest configuration (NAS-18.11 Task 7)
	maxRetries      int                      // Retry configuration
	initialBackoff  time.Duration            // Retry configuration
	deadLetterQueue *DeadLetterQueue         // Dead letter queue for failed notifications (Task 3.9)
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
	Logger          *zap.Logger
	DigestService   DigestService            // Optional digest service for NAS-18.11
	TemplateService TemplateRenderer         // Optional template renderer for alert content (NAS-18.11 Task 5)
	DB              *ent.Client              // Database client (required if TemplateService is provided)
	DigestConfigs   map[string]*DigestConfig // Per-channel digest configuration (NAS-18.11 Task 7)
	MaxRetries      int                      // Default: 3
	InitialBackoff  time.Duration            // Default: 1 second
	DeadLetterQueue *DeadLetterQueue         // Optional DLQ for failed notifications (Task 3.9)
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

	digestConfigs := cfg.DigestConfigs
	if digestConfigs == nil {
		digestConfigs = make(map[string]*DigestConfig)
	}

	return &Dispatcher{
		channels:        cfg.Channels,
		log:             cfg.Logger,
		digestService:   cfg.DigestService,
		templateService: cfg.TemplateService,
		db:              cfg.DB,
		digestConfigs:   digestConfigs,
		maxRetries:      maxRetries,
		initialBackoff:  initialBackoff,
		deadLetterQueue: cfg.DeadLetterQueue,
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
				d.log.Warn("Failed to queue alert for digest",
					zap.String("channel", channelName),
					zap.String("alert_id", alert.ID),
					zap.Error(err))
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
// Returns nil if the channel doesn't exist or is not configured.
// Callers must check for nil before using the returned channel.
func (d *Dispatcher) GetChannel(name string) Channel {
	if d == nil || d.channels == nil {
		return nil
	}
	return d.channels[name]
}

// GetDeadLetterQueue returns the dead letter queue instance.
// Returns nil if DLQ is not configured.
func (d *Dispatcher) GetDeadLetterQueue() *DeadLetterQueue {
	return d.deadLetterQueue
}
