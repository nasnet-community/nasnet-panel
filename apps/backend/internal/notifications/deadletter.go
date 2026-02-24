// Package notifications implements notification dispatch with retry logic.
package notifications

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"
	"time"

	"go.uber.org/zap"

	"backend/internal/utils"
)

// DeadLetterQueue manages failed notifications for later retry or investigation.
// Per Task 3.9: Dead letter queue for failed notifications after max retries exhausted.
type DeadLetterQueue struct {
	messages []*DeadLetterMessage
	mu       sync.RWMutex
	log      *zap.Logger
	maxSize  int // Maximum number of messages to keep (0 = unlimited)
}

// DeadLetterMessage represents a failed notification attempt.
type DeadLetterMessage struct {
	ID           string                 `json:"id"`
	Channel      string                 `json:"channel"`
	Title        string                 `json:"title"`
	Message      string                 `json:"message"`
	Severity     string                 `json:"severity"`
	Data         map[string]interface{} `json:"data"`
	DeviceID     *string                `json:"deviceId,omitempty"`
	Error        string                 `json:"error"`
	Attempts     int                    `json:"attempts"`
	FirstError   time.Time              `json:"firstError"`
	LastError    time.Time              `json:"lastError"`
	RetryAfter   time.Time              `json:"retryAfter,omitempty"`
	Notification Notification           `json:"notification"`
}

// DeadLetterConfig configures the dead letter queue.
type DeadLetterConfig struct {
	Enabled bool
	MaxSize int // 0 = unlimited
	Logger  *zap.Logger
}

// NewDeadLetterQueue creates a new dead letter queue instance.
func NewDeadLetterQueue(cfg DeadLetterConfig) *DeadLetterQueue {
	if cfg.Logger == nil {
		cfg.Logger = zap.NewNop()
	}

	dlq := &DeadLetterQueue{
		messages: make([]*DeadLetterMessage, 0),
		log:      cfg.Logger,
		maxSize:  cfg.MaxSize,
	}

	if cfg.MaxSize == 0 {
		dlq.maxSize = 10000 // Default: keep up to 10k messages
	}

	return dlq
}

// Enqueue adds a failed notification to the dead letter queue.
func (d *DeadLetterQueue) Enqueue(ctx context.Context, notification Notification, channel, errorMsg string, attempts int) error {
	if d == nil {
		return nil // DLQ not configured
	}

	d.mu.Lock()
	defer d.mu.Unlock()

	now := time.Now()

	msg := &DeadLetterMessage{
		ID:           utils.GenerateID(),
		Channel:      channel,
		Title:        notification.Title,
		Message:      notification.Message,
		Severity:     notification.Severity,
		Data:         notification.Data,
		DeviceID:     notification.DeviceID,
		Error:        errorMsg,
		Attempts:     attempts,
		FirstError:   now,
		LastError:    now,
		RetryAfter:   now.Add(24 * time.Hour), // Retry after 24 hours by default
		Notification: notification,
	}

	// Add exponential backoff for next retry (double for each attempt, capped at 24 hours)
	if attempts > 1 {
		// For 2 attempts: 2 hours, 3 attempts: 4 hours, 4 attempts: 8 hours, etc.
		// Cap shift at 4 to prevent overflow (1 << 4 = 16 hours, well under 24 hour cap)
		shift := attempts - 1
		if shift < 0 {
			shift = 0
		}
		if shift > 4 {
			shift = 4
		}
		backoff := time.Duration(1<<shift) * time.Hour
		if backoff > 24*time.Hour {
			backoff = 24 * time.Hour
		}
		msg.RetryAfter = now.Add(backoff)
	}

	d.messages = append(d.messages, msg)

	// Enforce size limit: remove oldest messages if we exceed max size
	if d.maxSize > 0 && len(d.messages) > d.maxSize {
		// Keep the most recent maxSize messages
		d.messages = d.messages[len(d.messages)-d.maxSize:]
	}

	d.log.Info("Failed notification enqueued to dead letter queue",
		zap.String("message_id", msg.ID),
		zap.String("channel", channel),
		zap.Int("attempts", attempts),
		zap.String("retry_after", msg.RetryAfter.Format(time.RFC3339)),
		zap.String("error", errorMsg))

	return nil
}

// GetMessages returns all messages in the dead letter queue.
func (d *DeadLetterQueue) GetMessages(ctx context.Context) []*DeadLetterMessage {
	if d == nil {
		return nil
	}

	d.mu.RLock()
	defer d.mu.RUnlock()

	result := make([]*DeadLetterMessage, len(d.messages))
	copy(result, d.messages)
	return result
}

// GetMessagesByChannel returns messages for a specific channel.
func (d *DeadLetterQueue) GetMessagesByChannel(ctx context.Context, channel string) []*DeadLetterMessage {
	if d == nil {
		return nil
	}

	d.mu.RLock()
	defer d.mu.RUnlock()

	result := make([]*DeadLetterMessage, 0)
	for _, msg := range d.messages {
		if msg.Channel == channel {
			result = append(result, msg)
		}
	}
	return result
}

// GetRetryable returns messages that are ready for retry (RetryAfter <= now).
func (d *DeadLetterQueue) GetRetryable(ctx context.Context) []*DeadLetterMessage {
	if d == nil {
		return nil
	}

	d.mu.RLock()
	defer d.mu.RUnlock()

	now := time.Now()
	result := make([]*DeadLetterMessage, 0)
	for _, msg := range d.messages {
		if msg.RetryAfter.IsZero() || msg.RetryAfter.Before(now) || msg.RetryAfter.Equal(now) {
			result = append(result, msg)
		}
	}
	return result
}

// RemoveMessage removes a message from the dead letter queue by ID.
func (d *DeadLetterQueue) RemoveMessage(ctx context.Context, messageID string) error {
	if d == nil {
		return nil
	}

	d.mu.Lock()
	defer d.mu.Unlock()

	for i, msg := range d.messages {
		if msg.ID == messageID {
			// Remove message by slicing
			d.messages = append(d.messages[:i], d.messages[i+1:]...)
			d.log.Debug("Removed message from dead letter queue", zap.String("message_id", messageID))
			return nil
		}
	}

	return fmt.Errorf("message not found: %s", messageID)
}

// Clear removes all messages from the dead letter queue.
func (d *DeadLetterQueue) Clear(ctx context.Context) error {
	if d == nil {
		return nil
	}

	d.mu.Lock()
	defer d.mu.Unlock()

	count := len(d.messages)
	d.messages = make([]*DeadLetterMessage, 0)
	d.log.Info("Dead letter queue cleared", zap.Int("messages_removed", count))
	return nil
}

// Count returns the number of messages in the dead letter queue.
func (d *DeadLetterQueue) Count(ctx context.Context) int {
	if d == nil {
		return 0
	}

	d.mu.RLock()
	defer d.mu.RUnlock()

	return len(d.messages)
}

// Export exports all dead letter messages as JSON for backup/analysis.
func (d *DeadLetterQueue) Export(ctx context.Context) ([]byte, error) {
	if d == nil {
		return json.Marshal([]DeadLetterMessage{})
	}

	d.mu.RLock()
	defer d.mu.RUnlock()

	return json.MarshalIndent(d.messages, "", "  ")
}
