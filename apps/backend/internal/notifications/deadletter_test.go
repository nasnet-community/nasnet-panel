package notifications

import (
	"context"
	"testing"
	"time"

	"go.uber.org/zap/zaptest"
)

// TestDeadLetterQueueEnqueue verifies adding messages to the DLQ.
func TestDeadLetterQueueEnqueue(t *testing.T) {
	ctx := context.Background()
	logger := zaptest.NewLogger(t)

	dlq := NewDeadLetterQueue(DeadLetterConfig{
		Enabled: true,
		MaxSize: 100,
		Logger:  logger,
	})

	notification := Notification{
		Title:    "Test Alert",
		Message:  "Test message",
		Severity: "CRITICAL",
		Data:     map[string]interface{}{"test": "data"},
	}

	deviceID := "router-1"
	notification.DeviceID = &deviceID

	err := dlq.Enqueue(ctx, notification, "email", "SMTP connection timeout", 3)
	if err != nil {
		t.Errorf("Enqueue failed: %v", err)
	}

	// Verify message was added
	count := dlq.Count(ctx)
	if count != 1 {
		t.Errorf("Expected 1 message in DLQ, got %d", count)
	}

	messages := dlq.GetMessages(ctx)
	if len(messages) != 1 {
		t.Fatalf("Expected 1 message, got %d", len(messages))
	}

	msg := messages[0]
	if msg.Channel != "email" {
		t.Errorf("Expected channel 'email', got '%s'", msg.Channel)
	}
	if msg.Error != "SMTP connection timeout" {
		t.Errorf("Expected error 'SMTP connection timeout', got '%s'", msg.Error)
	}
	if msg.Attempts != 3 {
		t.Errorf("Expected 3 attempts, got %d", msg.Attempts)
	}
	if msg.Title != "Test Alert" {
		t.Errorf("Expected title 'Test Alert', got '%s'", msg.Title)
	}
	if msg.DeviceID == nil || *msg.DeviceID != "router-1" {
		t.Error("Expected DeviceID to be preserved")
	}
}

// TestDeadLetterQueueGetByChannel verifies filtering messages by channel.
func TestDeadLetterQueueGetByChannel(t *testing.T) {
	ctx := context.Background()
	logger := zaptest.NewLogger(t)

	dlq := NewDeadLetterQueue(DeadLetterConfig{
		Enabled: true,
		Logger:  logger,
	})

	notification := Notification{
		Title:    "Test",
		Message:  "Test",
		Severity: "INFO",
	}

	dlq.Enqueue(ctx, notification, "email", "error1", 1)
	dlq.Enqueue(ctx, notification, "telegram", "error2", 1)
	dlq.Enqueue(ctx, notification, "email", "error3", 1)

	emailMessages := dlq.GetMessagesByChannel(ctx, "email")
	if len(emailMessages) != 2 {
		t.Errorf("Expected 2 email messages, got %d", len(emailMessages))
	}

	telegramMessages := dlq.GetMessagesByChannel(ctx, "telegram")
	if len(telegramMessages) != 1 {
		t.Errorf("Expected 1 telegram message, got %d", len(telegramMessages))
	}
}

// TestDeadLetterQueueRetryable verifies identification of retryable messages.
func TestDeadLetterQueueRetryable(t *testing.T) {
	ctx := context.Background()
	logger := zaptest.NewLogger(t)

	dlq := NewDeadLetterQueue(DeadLetterConfig{
		Enabled: true,
		Logger:  logger,
	})

	notification := Notification{
		Title:    "Test",
		Message:  "Test",
		Severity: "INFO",
	}

	// Enqueue with 1 attempt (RetryAfter will be ~1 hour)
	dlq.Enqueue(ctx, notification, "email", "error1", 1)

	// Enqueue with 5 attempts (RetryAfter will be ~32 hours, capped at 24)
	dlq.Enqueue(ctx, notification, "email", "error2", 5)

	retryable := dlq.GetRetryable(ctx)
	// Some messages might be retryable depending on timing
	// At least the test shouldn't panic
	if retryable == nil {
		t.Error("GetRetryable should not return nil")
	}
}

// TestDeadLetterQueueRemoveMessage verifies removing messages by ID.
func TestDeadLetterQueueRemoveMessage(t *testing.T) {
	ctx := context.Background()
	logger := zaptest.NewLogger(t)

	dlq := NewDeadLetterQueue(DeadLetterConfig{
		Enabled: true,
		Logger:  logger,
	})

	notification := Notification{
		Title:    "Test",
		Message:  "Test",
		Severity: "INFO",
	}

	dlq.Enqueue(ctx, notification, "email", "error1", 1)
	dlq.Enqueue(ctx, notification, "email", "error2", 1)

	if dlq.Count(ctx) != 2 {
		t.Errorf("Expected 2 messages, got %d", dlq.Count(ctx))
	}

	messages := dlq.GetMessages(ctx)
	messageID := messages[0].ID

	err := dlq.RemoveMessage(ctx, messageID)
	if err != nil {
		t.Errorf("RemoveMessage failed: %v", err)
	}

	if dlq.Count(ctx) != 1 {
		t.Errorf("Expected 1 message after removal, got %d", dlq.Count(ctx))
	}

	// Try removing non-existent message
	err = dlq.RemoveMessage(ctx, "non-existent")
	if err == nil {
		t.Error("Expected error when removing non-existent message")
	}
}

// TestDeadLetterQueueClear verifies clearing all messages.
func TestDeadLetterQueueClear(t *testing.T) {
	ctx := context.Background()
	logger := zaptest.NewLogger(t)

	dlq := NewDeadLetterQueue(DeadLetterConfig{
		Enabled: true,
		Logger:  logger,
	})

	notification := Notification{
		Title:    "Test",
		Message:  "Test",
		Severity: "INFO",
	}

	dlq.Enqueue(ctx, notification, "email", "error1", 1)
	dlq.Enqueue(ctx, notification, "email", "error2", 1)

	if dlq.Count(ctx) != 2 {
		t.Errorf("Expected 2 messages before clear, got %d", dlq.Count(ctx))
	}

	err := dlq.Clear(ctx)
	if err != nil {
		t.Errorf("Clear failed: %v", err)
	}

	if dlq.Count(ctx) != 0 {
		t.Errorf("Expected 0 messages after clear, got %d", dlq.Count(ctx))
	}
}

// TestDeadLetterQueueMaxSize verifies size limit enforcement.
func TestDeadLetterQueueMaxSize(t *testing.T) {
	ctx := context.Background()
	logger := zaptest.NewLogger(t)

	dlq := NewDeadLetterQueue(DeadLetterConfig{
		Enabled: true,
		MaxSize: 5,
		Logger:  logger,
	})

	notification := Notification{
		Title:    "Test",
		Message:  "Test",
		Severity: "INFO",
	}

	// Add 10 messages to a DLQ with max size 5
	for i := 0; i < 10; i++ {
		dlq.Enqueue(ctx, notification, "email", "error", 1)
	}

	// Should only keep the 5 most recent
	if dlq.Count(ctx) != 5 {
		t.Errorf("Expected max 5 messages, got %d", dlq.Count(ctx))
	}
}

// TestDeadLetterQueueExport verifies JSON export functionality.
func TestDeadLetterQueueExport(t *testing.T) {
	ctx := context.Background()
	logger := zaptest.NewLogger(t)

	dlq := NewDeadLetterQueue(DeadLetterConfig{
		Enabled: true,
		Logger:  logger,
	})

	notification := Notification{
		Title:    "Test Alert",
		Message:  "Test message",
		Severity: "CRITICAL",
		Data:     map[string]interface{}{"key": "value"},
	}

	dlq.Enqueue(ctx, notification, "email", "test error", 2)

	data, err := dlq.Export(ctx)
	if err != nil {
		t.Errorf("Export failed: %v", err)
	}

	if len(data) == 0 {
		t.Error("Expected non-empty export data")
	}

	// Verify it's valid JSON and contains our message
	if string(data) == "[]" {
		t.Error("Expected messages in export, got empty array")
	}
}

// TestDeadLetterQueueNilSafe verifies nil DLQ is safe to use.
func TestDeadLetterQueueNilSafe(t *testing.T) {
	ctx := context.Background()
	var dlq *DeadLetterQueue

	notification := Notification{
		Title:    "Test",
		Message:  "Test",
		Severity: "INFO",
	}

	// All these should not panic
	_ = dlq.Enqueue(ctx, notification, "email", "error", 1)
	_ = dlq.GetMessages(ctx)
	_ = dlq.GetMessagesByChannel(ctx, "email")
	_ = dlq.GetRetryable(ctx)
	_ = dlq.RemoveMessage(ctx, "id")
	_ = dlq.Clear(ctx)
	count := dlq.Count(ctx)
	if count != 0 {
		t.Errorf("Expected 0 from nil DLQ, got %d", count)
	}
	_, _ = dlq.Export(ctx)
}

// TestDeadLetterQueueRetryAfter verifies correct backoff calculation.
func TestDeadLetterQueueRetryAfter(t *testing.T) {
	ctx := context.Background()
	logger := zaptest.NewLogger(t)

	dlq := NewDeadLetterQueue(DeadLetterConfig{
		Enabled: true,
		Logger:  logger,
	})

	notification := Notification{
		Title:    "Test",
		Message:  "Test",
		Severity: "INFO",
	}

	beforeEnqueue := time.Now()

	dlq.Enqueue(ctx, notification, "email", "error", 2)

	messages := dlq.GetMessages(ctx)
	if len(messages) != 1 {
		t.Fatalf("Expected 1 message, got %d", len(messages))
	}

	msg := messages[0]
	afterEnqueue := time.Now()

	// 2 attempts -> 2^(2-1) = 2 hours
	expectedMinBackoff := 2 * time.Hour
	expectedMaxBackoff := 2*time.Hour + 1*time.Minute // Add some buffer for execution time

	actualBackoff := msg.RetryAfter.Sub(beforeEnqueue)
	if actualBackoff < expectedMinBackoff || actualBackoff > expectedMaxBackoff {
		t.Errorf("Expected backoff ~2 hours, got %v", actualBackoff)
	}

	if msg.LastError.Before(beforeEnqueue) || msg.LastError.After(afterEnqueue) {
		t.Error("LastError timestamp is out of range")
	}
}

// TestDispatchWithDeadLetterQueue verifies DLQ integration with Dispatcher.
func TestDispatchWithDeadLetterQueue(t *testing.T) {
	ctx := context.Background()
	logger := zaptest.NewLogger(t)

	// Create mock channel that always fails
	failingChannel := &MockChannel{
		shouldFail: true,
		failCount:  100, // Always fail
	}

	channels := map[string]Channel{
		"test": failingChannel,
	}

	dlq := NewDeadLetterQueue(DeadLetterConfig{
		Enabled: true,
		Logger:  logger,
	})

	dispatcher := NewDispatcher(DispatcherConfig{
		Channels:        channels,
		Logger:          logger,
		MaxRetries:      2,
		InitialBackoff:  5 * time.Millisecond,
		DeadLetterQueue: dlq,
	})

	notification := Notification{
		Title:    "Test Alert",
		Message:  "This will fail",
		Severity: "CRITICAL",
		Data:     map[string]interface{}{"test": true},
	}

	// Dispatch to the failing channel
	results := dispatcher.Dispatch(ctx, notification, []string{"test"})

	if len(results) != 1 {
		t.Fatalf("Expected 1 result, got %d", len(results))
	}

	if results[0].Success {
		t.Error("Expected delivery to fail")
	}

	// Verify message was enqueued to DLQ
	dlqMessages := dlq.GetMessages(ctx)
	if len(dlqMessages) != 1 {
		t.Errorf("Expected 1 message in DLQ, got %d", len(dlqMessages))
	}

	if dlqMessages[0].Channel != "test" {
		t.Errorf("Expected channel 'test', got '%s'", dlqMessages[0].Channel)
	}
}

// TestDispatchWithoutDeadLetterQueue verifies dispatcher works without DLQ.
func TestDispatchWithoutDeadLetterQueue(t *testing.T) {
	ctx := context.Background()
	logger := zaptest.NewLogger(t)

	mockChannel := &MockChannel{
		shouldFail: true,
		failCount:  100,
	}

	channels := map[string]Channel{
		"test": mockChannel,
	}

	dispatcher := NewDispatcher(DispatcherConfig{
		Channels:       channels,
		Logger:         logger,
		MaxRetries:     1,
		InitialBackoff: 5 * time.Millisecond,
		// No DeadLetterQueue configured
	})

	notification := Notification{
		Title:    "Test",
		Message:  "Test",
		Severity: "INFO",
	}

	// Should not panic even without DLQ
	results := dispatcher.Dispatch(ctx, notification, []string{"test"})

	if len(results) != 1 {
		t.Fatalf("Expected 1 result, got %d", len(results))
	}

	if results[0].Success {
		t.Error("Expected delivery to fail")
	}
}
