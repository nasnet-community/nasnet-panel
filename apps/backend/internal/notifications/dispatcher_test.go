package notifications

import (
	"context"
	"errors"
	"testing"
	"time"

	"go.uber.org/zap/zaptest"

	"backend/internal/events"
)

// MockChannel implements the Channel interface for testing.
type MockChannel struct {
	sendCalled  int
	testCalled  int
	shouldFail  bool
	failCount   int
	currentFail int
	name        string
}

func (m *MockChannel) Name() string {
	if m.name != "" {
		return m.name
	}
	return "mock"
}

func (m *MockChannel) Send(ctx context.Context, notification Notification) error {
	m.sendCalled++
	if m.shouldFail {
		m.currentFail++
		if m.currentFail <= m.failCount {
			return errors.New("mock channel send failed")
		}
	}
	return nil
}

func (m *MockChannel) Test(ctx context.Context, config map[string]interface{}) error {
	m.testCalled++
	return nil
}

// TestDispatchToMultipleChannels verifies dispatcher sends to all specified channels.
func TestDispatchToMultipleChannels(t *testing.T) {
	ctx := context.Background()
	logger := zaptest.NewLogger(t).Sugar()

	// Create mock channels
	emailChannel := &MockChannel{}
	telegramChannel := &MockChannel{}
	inappChannel := &MockChannel{}

	channels := map[string]Channel{
		"email":    emailChannel,
		"telegram": telegramChannel,
		"inapp":    inappChannel,
	}

	dispatcher := NewDispatcher(DispatcherConfig{
		Channels:       channels,
		Logger:         logger,
		MaxRetries:     3,
		InitialBackoff: 10 * time.Millisecond,
	})

	// Create notification
	notification := Notification{
		Title:    "Test Alert",
		Message:  "This is a test",
		Severity: "WARNING",
		Data:     map[string]interface{}{},
	}

	// Dispatch to multiple channels
	channelNames := []string{"email", "telegram", "inapp"}
	results := dispatcher.Dispatch(ctx, notification, channelNames)

	// Verify results
	if len(results) != 3 {
		t.Errorf("Expected 3 results, got %d", len(results))
	}

	for _, result := range results {
		if !result.Success {
			t.Errorf("Channel %s delivery failed: %s", result.Channel, result.Error)
		}
	}

	// Verify each channel received the notification
	if emailChannel.sendCalled != 1 {
		t.Errorf("Email channel: expected 1 send call, got %d", emailChannel.sendCalled)
	}
	if telegramChannel.sendCalled != 1 {
		t.Errorf("Telegram channel: expected 1 send call, got %d", telegramChannel.sendCalled)
	}
	if inappChannel.sendCalled != 1 {
		t.Errorf("InApp channel: expected 1 send call, got %d", inappChannel.sendCalled)
	}
}

// TestDispatchRetryLogic verifies retry with exponential backoff for failed deliveries.
func TestDispatchRetryLogic(t *testing.T) {
	ctx := context.Background()
	logger := zaptest.NewLogger(t).Sugar()

	// Create mock channel that fails first 2 attempts
	mockChannel := &MockChannel{
		shouldFail: true,
		failCount:  2, // Fail first 2 attempts, succeed on 3rd
	}

	channels := map[string]Channel{
		"test": mockChannel,
	}

	dispatcher := NewDispatcher(DispatcherConfig{
		Channels:       channels,
		Logger:         logger,
		MaxRetries:     3,
		InitialBackoff: 10 * time.Millisecond,
	})

	notification := Notification{
		Title:    "Test Alert",
		Message:  "This is a test",
		Severity: "CRITICAL",
		Data:     map[string]interface{}{},
	}

	// Dispatch
	results := dispatcher.Dispatch(ctx, notification, []string{"test"})

	// Verify eventual success after retries
	if len(results) != 1 {
		t.Fatalf("Expected 1 result, got %d", len(results))
	}

	if !results[0].Success {
		t.Errorf("Expected success after retries, got error: %s", results[0].Error)
	}

	// Verify retry attempts (fail 2, succeed 1 = 3 total calls)
	if mockChannel.sendCalled != 3 {
		t.Errorf("Expected 3 send calls (2 failures + 1 success), got %d", mockChannel.sendCalled)
	}
}

// TestDispatchMaxRetriesExhausted verifies failure after max retries.
func TestDispatchMaxRetriesExhausted(t *testing.T) {
	ctx := context.Background()
	logger := zaptest.NewLogger(t).Sugar()

	// Create mock channel that always fails
	mockChannel := &MockChannel{
		shouldFail: true,
		failCount:  100, // Always fail
	}

	channels := map[string]Channel{
		"test": mockChannel,
	}

	dispatcher := NewDispatcher(DispatcherConfig{
		Channels:       channels,
		Logger:         logger,
		MaxRetries:     3,
		InitialBackoff: 10 * time.Millisecond,
	})

	notification := Notification{
		Title:    "Test Alert",
		Message:  "This is a test",
		Severity: "CRITICAL",
		Data:     map[string]interface{}{},
	}

	// Dispatch
	results := dispatcher.Dispatch(ctx, notification, []string{"test"})

	// Verify failure after max retries
	if len(results) != 1 {
		t.Fatalf("Expected 1 result, got %d", len(results))
	}

	if results[0].Success {
		t.Error("Expected failure after exhausting retries")
	}

	if results[0].Error == "" {
		t.Error("Expected error message in result")
	}

	// Verify max retry attempts (1 initial + 3 retries = 4 total)
	if mockChannel.sendCalled != 4 {
		t.Errorf("Expected 4 send calls (1 initial + 3 retries), got %d", mockChannel.sendCalled)
	}
}

// TestDispatchUnknownChannel verifies handling of unknown channel names.
func TestDispatchUnknownChannel(t *testing.T) {
	ctx := context.Background()
	logger := zaptest.NewLogger(t).Sugar()

	dispatcher := NewDispatcher(DispatcherConfig{
		Channels:       map[string]Channel{},
		Logger:         logger,
		MaxRetries:     3,
		InitialBackoff: 10 * time.Millisecond,
	})

	notification := Notification{
		Title:    "Test Alert",
		Message:  "This is a test",
		Severity: "WARNING",
		Data:     map[string]interface{}{},
	}

	// Dispatch to unknown channel
	results := dispatcher.Dispatch(ctx, notification, []string{"unknown"})

	// Verify failure result
	if len(results) != 1 {
		t.Fatalf("Expected 1 result, got %d", len(results))
	}

	if results[0].Success {
		t.Error("Expected failure for unknown channel")
	}

	if results[0].Retryable {
		t.Error("Unknown channel error should not be retryable")
	}

	if results[0].Error == "" {
		t.Error("Expected error message for unknown channel")
	}
}

// TestHandleAlertCreatedEvent verifies the AlertCreatedEvent handler dispatches notifications.
func TestHandleAlertCreatedEvent(t *testing.T) {
	ctx := context.Background()
	logger := zaptest.NewLogger(t).Sugar()

	// Create mock channels
	emailChannel := &MockChannel{}
	inappChannel := &MockChannel{}

	channels := map[string]Channel{
		"email": emailChannel,
		"inapp": inappChannel,
	}

	dispatcher := NewDispatcher(DispatcherConfig{
		Channels:       channels,
		Logger:         logger,
		MaxRetries:     3,
		InitialBackoff: 10 * time.Millisecond,
	})

	// Create AlertCreatedEvent
	alertEvent := events.NewAlertCreatedEvent(
		"alert-123",
		"rule-456",
		"router.disconnected",
		"CRITICAL",
		"Router Offline",
		"Router router-1 is offline",
		"router-1",
		[]string{"email", "inapp"},
		map[string]interface{}{
			"test": "data",
		},
		"alert-engine",
	)

	// Handle event
	err := dispatcher.HandleAlertCreated(ctx, alertEvent)
	if err != nil {
		t.Errorf("HandleAlertCreated failed: %v", err)
	}

	// Verify both channels received notifications
	if emailChannel.sendCalled != 1 {
		t.Errorf("Email channel: expected 1 send call, got %d", emailChannel.sendCalled)
	}
	if inappChannel.sendCalled != 1 {
		t.Errorf("InApp channel: expected 1 send call, got %d", inappChannel.sendCalled)
	}
}

// TestHandleAlertCreatedEventWithDeviceID verifies device ID is included in notification.
func TestHandleAlertCreatedEventWithDeviceID(t *testing.T) {
	ctx := context.Background()
	logger := zaptest.NewLogger(t).Sugar()

	// Create mock channel that tracks received notifications
	var receivedNotification Notification
	mockChannel := &MockChannelWithCapture{
		onSend: func(n Notification) {
			receivedNotification = n
		},
	}

	channels := map[string]Channel{
		"test": mockChannel,
	}

	dispatcher := NewDispatcher(DispatcherConfig{
		Channels:       channels,
		Logger:         logger,
		MaxRetries:     3,
		InitialBackoff: 10 * time.Millisecond,
	})

	// Create AlertCreatedEvent with device ID
	alertEvent := events.NewAlertCreatedEvent(
		"alert-123",
		"rule-456",
		"router.disconnected",
		"WARNING",
		"Router Offline",
		"Router is offline",
		"device-789",
		[]string{"test"},
		map[string]interface{}{},
		"alert-engine",
	)

	// Handle event
	err := dispatcher.HandleAlertCreated(ctx, alertEvent)
	if err != nil {
		t.Errorf("HandleAlertCreated failed: %v", err)
	}

	// Verify device ID was included
	if receivedNotification.DeviceID == nil {
		t.Error("Expected DeviceID in notification, got nil")
	} else if *receivedNotification.DeviceID != "device-789" {
		t.Errorf("Expected DeviceID 'device-789', got '%s'", *receivedNotification.DeviceID)
	}

	// Verify metadata was added
	if receivedNotification.Data["alertId"] != "alert-123" {
		t.Error("Expected alertId in notification data")
	}
	if receivedNotification.Data["ruleId"] != "rule-456" {
		t.Error("Expected ruleId in notification data")
	}
	if receivedNotification.Data["eventType"] != "router.disconnected" {
		t.Error("Expected eventType in notification data")
	}
}

// MockChannelWithCapture is a mock channel that captures sent notifications.
type MockChannelWithCapture struct {
	onSend func(Notification)
}

func (m *MockChannelWithCapture) Name() string {
	return "mock-capture"
}

func (m *MockChannelWithCapture) Send(ctx context.Context, notification Notification) error {
	if m.onSend != nil {
		m.onSend(notification)
	}
	return nil
}

func (m *MockChannelWithCapture) Test(ctx context.Context, config map[string]interface{}) error {
	return nil
}

// TestGetChannels verifies listing registered channels.
func TestGetChannels(t *testing.T) {
	logger := zaptest.NewLogger(t).Sugar()

	channels := map[string]Channel{
		"email":    &MockChannel{},
		"telegram": &MockChannel{},
		"pushover": &MockChannel{},
	}

	dispatcher := NewDispatcher(DispatcherConfig{
		Channels: channels,
		Logger:   logger,
	})

	// Get channel list
	channelList := dispatcher.GetChannels()

	// Verify all channels are listed
	if len(channelList) != 3 {
		t.Errorf("Expected 3 channels, got %d", len(channelList))
	}

	// Verify channel names
	channelMap := make(map[string]bool)
	for _, name := range channelList {
		channelMap[name] = true
	}

	if !channelMap["email"] || !channelMap["telegram"] || !channelMap["pushover"] {
		t.Error("Not all expected channels in list")
	}
}

// TestDispatchWithTemplateRendering verifies template rendering integration (NAS-18.11 Task 5).
func TestDispatchWithTemplateRendering(t *testing.T) {
	// This test verifies the backward compatibility when templateService is nil
	ctx := context.Background()
	logger := zaptest.NewLogger(t).Sugar()

	// Track received notification
	var receivedNotification Notification
	mockChannel := &MockChannelWithCapture{
		onSend: func(n Notification) {
			receivedNotification = n
		},
	}

	channels := map[string]Channel{
		"email": mockChannel,
	}

	// Create dispatcher WITHOUT template service (backward compatibility)
	dispatcher := NewDispatcher(DispatcherConfig{
		Channels:        channels,
		Logger:          logger,
		TemplateService: nil, // No template service
		DB:              nil, // No DB
		MaxRetries:      3,
		InitialBackoff:  10 * time.Millisecond,
	})

	// Create notification with alert metadata
	notification := Notification{
		Title:    "Original Title",
		Message:  "Original Message",
		Severity: "CRITICAL",
		Data: map[string]interface{}{
			"alertId":   "alert-123",
			"ruleId":    "rule-456",
			"eventType": "router.offline",
		},
	}

	// Dispatch notification
	results := dispatcher.Dispatch(ctx, notification, []string{"email"})

	// Verify success
	if len(results) != 1 || !results[0].Success {
		t.Fatalf("Expected successful dispatch, got results: %+v", results)
	}

	// Verify original content was used (no template rendering)
	if receivedNotification.Title != "Original Title" {
		t.Errorf("Expected original title 'Original Title', got '%s'", receivedNotification.Title)
	}
	if receivedNotification.Message != "Original Message" {
		t.Errorf("Expected original message 'Original Message', got '%s'", receivedNotification.Message)
	}
}

// MockTemplateRenderer is a mock implementation of TemplateRenderer for testing.
type MockTemplateRenderer struct {
	renderCalled bool
	renderError  error
	subject      string
	body         string
}

func (m *MockTemplateRenderer) RenderAlert(ctx context.Context, alert interface{}, channel string) (subject, body string, err error) {
	m.renderCalled = true
	if m.renderError != nil {
		return "", "", m.renderError
	}
	return m.subject, m.body, nil
}

// TestDispatchWithTemplateRenderingSuccess verifies successful template rendering.
func TestDispatchWithTemplateRenderingSuccess(t *testing.T) {
	// Note: This test uses a mock since we don't have a real Alert entity here.
	// Full integration testing with real database would be in integration_test.go (Task 7).
	t.Skip("Skipping: Requires real ent.Alert entity and DB setup. See integration_test.go for full test.")
}

// TestDispatchWithTemplateRenderingFallback verifies fallback on template error.
func TestDispatchWithTemplateRenderingFallback(t *testing.T) {
	// Note: This test would verify that dispatcher falls back to original content
	// when template rendering fails. Requires full ent setup.
	t.Skip("Skipping: Requires real ent.Alert entity and DB setup. See integration_test.go for full test.")
}
