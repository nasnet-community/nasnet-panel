// Package notifications implements notification dispatch with retry logic.
package notifications

import (
	"context"
	"fmt"
	"time"

	"go.uber.org/zap"
)

// Dispatcher manages notification delivery across multiple channels with retry logic.
// Per Task 3.9: Add retry logic with exponential backoff for failed deliveries (max 3 retries).
type Dispatcher struct {
	channels map[string]Channel
	log      *zap.SugaredLogger

	// Retry configuration
	maxRetries     int
	initialBackoff time.Duration
}

// DispatcherConfig holds dispatcher configuration.
type DispatcherConfig struct {
	Channels       map[string]Channel
	Logger         *zap.SugaredLogger
	MaxRetries     int           // Default: 3
	InitialBackoff time.Duration // Default: 1 second
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
		channels:       cfg.Channels,
		log:            cfg.Logger,
		maxRetries:     maxRetries,
		initialBackoff: initialBackoff,
	}
}

// Dispatch sends a notification to all specified channels.
// Returns a slice of DeliveryResult for each channel.
func (d *Dispatcher) Dispatch(ctx context.Context, notification Notification, channelNames []string) []DeliveryResult {
	results := make([]DeliveryResult, 0, len(channelNames))

	for _, channelName := range channelNames {
		result := d.dispatchToChannel(ctx, notification, channelName)
		results = append(results, result)
	}

	return results
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
