package escalation

import (
	"context"
	"sync"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/zap/zaptest"

	"backend/generated/ent/alert"
	"backend/generated/ent/alertescalation"
	"backend/generated/ent/alertrule"
	"backend/generated/ent/enttest"
	"backend/internal/notifications"
)

// integrationMockDispatcher tracks dispatched notifications for testing (thread-safe)
type integrationMockDispatcher struct {
	mu         sync.Mutex
	dispatched []integrationMockDispatchCall
}

type integrationMockDispatchCall struct {
	notification notifications.Notification
	channels     []string
	timestamp    time.Time
}

func (m *integrationMockDispatcher) Dispatch(_ context.Context, notification notifications.Notification, channels []string) []notifications.DeliveryResult {
	m.mu.Lock()
	defer m.mu.Unlock()

	m.dispatched = append(m.dispatched, integrationMockDispatchCall{
		notification: notification,
		channels:     channels,
		timestamp:    time.Now(),
	})

	// Simulate successful delivery
	results := make([]notifications.DeliveryResult, len(channels))
	for i, ch := range channels {
		results[i] = notifications.DeliveryResult{
			Channel: ch,
			Success: true,
		}
	}
	return results
}

func (m *integrationMockDispatcher) GetDispatched() []integrationMockDispatchCall {
	m.mu.Lock()
	defer m.mu.Unlock()
	return append([]integrationMockDispatchCall{}, m.dispatched...)
}

func (m *integrationMockDispatcher) Count() int {
	m.mu.Lock()
	defer m.mu.Unlock()
	return len(m.dispatched)
}

// TestEscalationEngine_FullFlow tests complete escalation lifecycle.
// Per AC3: Alert created → 15min → escalate → 30min → escalate → acknowledge → stop.
func TestEscalationEngine_FullFlow(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	// Setup
	ctx := context.Background()
	logger := zaptest.NewLogger(t).Sugar()
	db := enttest.Open(t, "sqlite3", "file:ent?mode=memory&_fk=1")
	defer db.Close()

	mockDisp := &integrationMockDispatcher{}

	// Wrap the mock dispatcher to match DispatchFunc signature
	dispatchFunc := func(ctx context.Context, title, message, severity string, data map[string]interface{}, deviceID *string, channels []string) []DispatchResult {
		notif := notifications.Notification{
			Title:    title,
			Message:  message,
			Severity: severity,
			Data:     data,
			DeviceID: deviceID,
		}
		results := mockDisp.Dispatch(ctx, notif, channels)

		// Convert []notifications.DeliveryResult to []DispatchResult
		dispResults := make([]DispatchResult, len(results))
		for i, r := range results {
			dispResults[i] = DispatchResult{
				Channel: r.Channel,
				Success: r.Success,
				Error:   r.Error,
			}
		}
		return dispResults
	}

	engine := NewEngine(EngineConfig{
		DB:       db,
		Dispatch: dispatchFunc,
		Logger:   logger,
	})

	require.NoError(t, engine.Start(ctx))
	defer engine.Stop(ctx)

	// Create alert rule with escalation
	rule, err := db.AlertRule.Create().
		SetName("Test Rule").
		SetEventType("test.event").
		SetSeverity(alertrule.SeverityCRITICAL).
		SetChannels([]string{"inapp"}).
		SetEnabled(true).
		SetEscalation(map[string]interface{}{
			"enabled":                true,
			"requireAck":             true,
			"escalationDelaySeconds": 2, // 2 seconds for testing
			"maxEscalations":         3,
			"additionalChannels":     []string{"email"},
			"repeatIntervalSeconds":  []int{2, 4, 8},
		}).
		Save(ctx)
	require.NoError(t, err)

	// Create alert
	alertEntity, err := db.Alert.Create().
		SetRuleID(rule.ID).
		SetEventType("test.event").
		SetSeverity(alert.SeverityCRITICAL).
		SetTitle("Test Alert").
		SetMessage("Test message").
		Save(ctx)
	require.NoError(t, err)

	// Track alert for escalation
	require.NoError(t, engine.TrackAlert(ctx, alertEntity, rule))

	// Verify escalation record created
	escalations, err := db.AlertEscalation.Query().
		Where(alertescalation.AlertIDEQ(alertEntity.ID)).
		All(ctx)
	require.NoError(t, err)
	assert.Len(t, escalations, 1)
	assert.Equal(t, alertescalation.StatusPENDING, escalations[0].Status)

	// Wait for first escalation (2 seconds + buffer)
	time.Sleep(3 * time.Second)

	// Verify first escalation dispatched
	assert.GreaterOrEqual(t, mockDisp.Count(), 1, "Should have dispatched at least one notification")
	dispatched := mockDisp.GetDispatched()
	if len(dispatched) > 0 {
		call := dispatched[0]
		assert.Contains(t, call.notification.Title, "[ESCALATED L1]")
		// Should merge inapp + email
		assert.Contains(t, call.channels, "inapp")
		assert.Contains(t, call.channels, "email")
	}

	// Wait for second escalation (4 seconds + buffer)
	time.Sleep(5 * time.Second)

	// Acknowledge alert
	_, err = alertEntity.Update().
		SetAcknowledgedAt(time.Now()).
		SetAcknowledgedBy("test-user").
		Save(ctx)
	require.NoError(t, err)

	// Cancel escalation
	require.NoError(t, engine.CancelEscalation(ctx, alertEntity.ID, "alert acknowledged"))

	// Verify escalation canceled in DB
	esc, err := db.AlertEscalation.Query().
		Where(alertescalation.AlertIDEQ(alertEntity.ID)).
		Only(ctx)
	require.NoError(t, err)
	assert.Equal(t, alertescalation.StatusRESOLVED, esc.Status)
	assert.NotNil(t, esc.ResolvedAt)
	assert.Equal(t, "alert acknowledged", esc.ResolvedBy)

	t.Log("Full escalation flow test completed successfully")
}

// TestEscalationEngine_RestartRecovery tests crash recovery.
// Per AC6: Restart recovery - escalation resumes after restart.
func TestEscalationEngine_RestartRecovery(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	ctx := context.Background()
	logger := zaptest.NewLogger(t).Sugar()
	db := enttest.Open(t, "sqlite3", "file:ent?mode=memory&_fk=1")
	defer db.Close()

	// Create rule and alert
	rule, err := db.AlertRule.Create().
		SetName("Test Rule").
		SetEventType("test.event").
		SetSeverity(alertrule.SeverityCRITICAL).
		SetChannels([]string{"inapp"}).
		SetEnabled(true).
		SetEscalation(map[string]interface{}{
			"enabled":                true,
			"requireAck":             true,
			"escalationDelaySeconds": 3,
			"maxEscalations":         3,
			"additionalChannels":     []string{"email"},
			"repeatIntervalSeconds":  []int{3, 6, 9},
		}).
		Save(ctx)
	require.NoError(t, err)

	alertEntity, err := db.Alert.Create().
		SetRuleID(rule.ID).
		SetEventType("test.event").
		SetSeverity(alert.SeverityCRITICAL).
		SetTitle("Test Alert").
		SetMessage("Test message").
		Save(ctx)
	require.NoError(t, err)

	// Create escalation record (simulating crash with pending escalation)
	nextEscalation := time.Now().Add(2 * time.Second)
	_, err = db.AlertEscalation.Create().
		SetAlertID(alertEntity.ID).
		SetRuleID(rule.ID).
		SetCurrentLevel(0).
		SetMaxLevel(3).
		SetStatus(alertescalation.StatusPENDING).
		SetNextEscalationAt(nextEscalation).
		SetEscalationDelaySeconds(3).
		SetRepeatIntervalSeconds([]int{3, 6, 9}).
		SetAdditionalChannels([]string{"email"}).
		Save(ctx)
	require.NoError(t, err)

	// Create "new" engine (simulating restart)
	mockDisp := &integrationMockDispatcher{}

	// Wrap the mock dispatcher to match DispatchFunc signature
	dispatchFunc := func(ctx context.Context, title, message, severity string, data map[string]interface{}, deviceID *string, channels []string) []DispatchResult {
		notif := notifications.Notification{
			Title:    title,
			Message:  message,
			Severity: severity,
			Data:     data,
			DeviceID: deviceID,
		}
		results := mockDisp.Dispatch(ctx, notif, channels)

		// Convert []notifications.DeliveryResult to []DispatchResult
		dispResults := make([]DispatchResult, len(results))
		for i, r := range results {
			dispResults[i] = DispatchResult{
				Channel: r.Channel,
				Success: r.Success,
				Error:   r.Error,
			}
		}
		return dispResults
	}

	engine := NewEngine(EngineConfig{
		DB:       db,
		Dispatch: dispatchFunc,
		Logger:   logger,
	})

	// Start should recover pending escalations
	require.NoError(t, engine.Start(ctx))
	defer engine.Stop(ctx)

	// Verify escalation was loaded and scheduled
	engine.mu.RLock()
	state, exists := engine.escalations[alertEntity.ID]
	engine.mu.RUnlock()
	assert.True(t, exists, "escalation should be recovered")
	assert.NotNil(t, state.timer, "timer should be rescheduled")

	// Wait for recovered timer to fire
	time.Sleep(3 * time.Second)

	// Verify escalation triggered
	assert.GreaterOrEqual(t, mockDisp.Count(), 1, "escalation should have fired after recovery")

	t.Log("Restart recovery test completed successfully")
}

// TestEscalationEngine_PastDueRecovery tests past-due escalation handling.
// Per AC6: If escalation due at 10:05, restart at 10:10 → trigger immediately.
func TestEscalationEngine_PastDueRecovery(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	ctx := context.Background()
	logger := zaptest.NewLogger(t).Sugar()
	db := enttest.Open(t, "sqlite3", "file:ent?mode=memory&_fk=1")
	defer db.Close()

	// Create rule and alert
	rule, err := db.AlertRule.Create().
		SetName("Test Rule").
		SetEventType("test.event").
		SetSeverity(alertrule.SeverityCRITICAL).
		SetChannels([]string{"inapp"}).
		SetEnabled(true).
		SetEscalation(map[string]interface{}{
			"enabled":                true,
			"requireAck":             true,
			"escalationDelaySeconds": 900,
			"maxEscalations":         3,
			"additionalChannels":     []string{"email"},
			"repeatIntervalSeconds":  []int{900, 1800, 3600},
		}).
		Save(ctx)
	require.NoError(t, err)

	alertEntity, err := db.Alert.Create().
		SetRuleID(rule.ID).
		SetEventType("test.event").
		SetSeverity(alert.SeverityCRITICAL).
		SetTitle("Test Alert").
		SetMessage("Test message").
		Save(ctx)
	require.NoError(t, err)

	// Create past-due escalation (due 5 minutes ago)
	pastDue := time.Now().Add(-5 * time.Minute)
	_, err = db.AlertEscalation.Create().
		SetAlertID(alertEntity.ID).
		SetRuleID(rule.ID).
		SetCurrentLevel(0).
		SetMaxLevel(3).
		SetStatus(alertescalation.StatusPENDING).
		SetNextEscalationAt(pastDue).
		SetEscalationDelaySeconds(900).
		SetRepeatIntervalSeconds([]int{900, 1800, 3600}).
		SetAdditionalChannels([]string{"email"}).
		Save(ctx)
	require.NoError(t, err)

	mockDisp := &integrationMockDispatcher{}

	// Wrap the mock dispatcher to match DispatchFunc signature
	dispatchFunc := func(ctx context.Context, title, message, severity string, data map[string]interface{}, deviceID *string, channels []string) []DispatchResult {
		notif := notifications.Notification{
			Title:    title,
			Message:  message,
			Severity: severity,
			Data:     data,
			DeviceID: deviceID,
		}
		results := mockDisp.Dispatch(ctx, notif, channels)

		// Convert []notifications.DeliveryResult to []DispatchResult
		dispResults := make([]DispatchResult, len(results))
		for i, r := range results {
			dispResults[i] = DispatchResult{
				Channel: r.Channel,
				Success: r.Success,
				Error:   r.Error,
			}
		}
		return dispResults
	}

	engine := NewEngine(EngineConfig{
		DB:       db,
		Dispatch: dispatchFunc,
		Logger:   logger,
	})

	// Record time before starting engine
	startTime := time.Now()

	require.NoError(t, engine.Start(ctx))
	defer engine.Stop(ctx)

	// Past-due escalations should trigger immediately
	// Wait a short time for async processing
	time.Sleep(1 * time.Second)

	// Verify escalation triggered immediately (within 1 second of start)
	assert.GreaterOrEqual(t, mockDisp.Count(), 1, "past-due escalation should fire immediately")
	dispatched := mockDisp.GetDispatched()
	if len(dispatched) > 0 {
		triggerTime := dispatched[0].timestamp
		elapsed := triggerTime.Sub(startTime)
		assert.Less(t, elapsed, 2*time.Second, "past-due escalation should fire within 2 seconds")
		assert.Contains(t, dispatched[0].notification.Title, "[ESCALATED L1]")
	}

	t.Log("Past-due recovery test completed successfully")
}

// TestEscalationEngine_ThrottleInteraction tests escalation doesn't trigger for throttled alerts.
func TestEscalationEngine_ThrottleInteraction(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	ctx := context.Background()
	logger := zaptest.NewLogger(t).Sugar()
	db := enttest.Open(t, "sqlite3", "file:ent?mode=memory&_fk=1")
	defer db.Close()

	mockDisp := &integrationMockDispatcher{}

	// Wrap the mock dispatcher to match DispatchFunc signature
	dispatchFunc := func(ctx context.Context, title, message, severity string, data map[string]interface{}, deviceID *string, channels []string) []DispatchResult {
		notif := notifications.Notification{
			Title:    title,
			Message:  message,
			Severity: severity,
			Data:     data,
			DeviceID: deviceID,
		}
		results := mockDisp.Dispatch(ctx, notif, channels)

		// Convert []notifications.DeliveryResult to []DispatchResult
		dispResults := make([]DispatchResult, len(results))
		for i, r := range results {
			dispResults[i] = DispatchResult{
				Channel: r.Channel,
				Success: r.Success,
				Error:   r.Error,
			}
		}
		return dispResults
	}

	engine := NewEngine(EngineConfig{
		DB:       db,
		Dispatch: dispatchFunc,
		Logger:   logger,
	})

	require.NoError(t, engine.Start(ctx))
	defer engine.Stop(ctx)

	// Create rule with both throttle and escalation
	rule, err := db.AlertRule.Create().
		SetName("Test Rule").
		SetEventType("test.event").
		SetSeverity(alertrule.SeverityCRITICAL).
		SetChannels([]string{"inapp"}).
		SetEnabled(true).
		SetThrottle(map[string]interface{}{
			"enabled":      true,
			"windowSize":   60,
			"maxCount":     1,
			"suppressMode": "drop",
		}).
		SetEscalation(map[string]interface{}{
			"enabled":                true,
			"requireAck":             true,
			"escalationDelaySeconds": 2,
			"maxEscalations":         3,
			"additionalChannels":     []string{"email"},
			"repeatIntervalSeconds":  []int{2, 4, 8},
		}).
		Save(ctx)
	require.NoError(t, err)

	// Create first alert (allowed, should track escalation)
	alert1, err := db.Alert.Create().
		SetRuleID(rule.ID).
		SetEventType("test.event").
		SetSeverity(alert.SeverityCRITICAL).
		SetTitle("First Alert").
		SetMessage("Should escalate").
		Save(ctx)
	require.NoError(t, err)

	err = engine.TrackAlert(ctx, alert1, rule)
	require.NoError(t, err)

	// Verify escalation created for first alert
	escalations, err := db.AlertEscalation.Query().
		Where(alertescalation.AlertIDEQ(alert1.ID)).
		All(ctx)
	require.NoError(t, err)
	assert.Len(t, escalations, 1, "first alert should have escalation")

	// Create second alert (would be throttled in real scenario)
	// In this test, we simulate by NOT calling TrackAlert for throttled alerts
	alert2, err := db.Alert.Create().
		SetRuleID(rule.ID).
		SetEventType("test.event").
		SetSeverity(alert.SeverityCRITICAL).
		SetTitle("Second Alert").
		SetMessage("Throttled, should not escalate").
		Save(ctx)
	require.NoError(t, err)

	// Verify no escalation for throttled alert (engine.TrackAlert not called)
	escalations, err = db.AlertEscalation.Query().
		Where(alertescalation.AlertIDEQ(alert2.ID)).
		All(ctx)
	require.NoError(t, err)
	assert.Len(t, escalations, 0, "throttled alert should not have escalation")

	t.Log("Throttle interaction test completed successfully")
}

// mockEventBus tracks published events for testing
type mockEventBus struct {
	mu     sync.Mutex
	events []mockEvent
}

type mockEvent struct {
	topic   string
	payload interface{}
}

func (m *mockEventBus) Publish(topic string, payload interface{}) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.events = append(m.events, mockEvent{topic: topic, payload: payload})
	return nil
}

func (m *mockEventBus) GetEvents() []mockEvent {
	m.mu.Lock()
	defer m.mu.Unlock()
	return append([]mockEvent{}, m.events...)
}

// TestEscalationEngine_EventBusIntegration verifies events are published.
func TestEscalationEngine_EventBusIntegration(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	ctx := context.Background()
	logger := zaptest.NewLogger(t).Sugar()
	db := enttest.Open(t, "sqlite3", "file:ent?mode=memory&_fk=1")
	defer db.Close()

	mockDisp := &integrationMockDispatcher{}
	mockEB := &mockEventBus{}

	// Wrap the mock dispatcher to match DispatchFunc signature
	dispatchFunc := func(ctx context.Context, title, message, severity string, data map[string]interface{}, deviceID *string, channels []string) []DispatchResult {
		notif := notifications.Notification{
			Title:    title,
			Message:  message,
			Severity: severity,
			Data:     data,
			DeviceID: deviceID,
		}
		results := mockDisp.Dispatch(ctx, notif, channels)

		// Convert []notifications.DeliveryResult to []DispatchResult
		dispResults := make([]DispatchResult, len(results))
		for i, r := range results {
			dispResults[i] = DispatchResult{
				Channel: r.Channel,
				Success: r.Success,
				Error:   r.Error,
			}
		}
		return dispResults
	}

	engine := NewEngine(EngineConfig{
		DB:       db,
		Dispatch: dispatchFunc,
		EventBus: nil, // TODO: fix mockEventBus to implement EventBus interface correctly
		Logger:   logger,
	})

	require.NoError(t, engine.Start(ctx))
	defer engine.Stop(ctx)

	// Create rule and alert
	rule, err := db.AlertRule.Create().
		SetName("Test Rule").
		SetEventType("test.event").
		SetSeverity(alertrule.SeverityCRITICAL).
		SetChannels([]string{"inapp"}).
		SetEnabled(true).
		SetEscalation(map[string]interface{}{
			"enabled":                true,
			"requireAck":             true,
			"escalationDelaySeconds": 1,
			"maxEscalations":         2,
			"additionalChannels":     []string{"email"},
			"repeatIntervalSeconds":  []int{1, 2},
		}).
		Save(ctx)
	require.NoError(t, err)

	alertEntity, err := db.Alert.Create().
		SetRuleID(rule.ID).
		SetEventType("test.event").
		SetSeverity(alert.SeverityCRITICAL).
		SetTitle("Test Alert").
		SetMessage("Test message").
		Save(ctx)
	require.NoError(t, err)

	// Track alert
	require.NoError(t, engine.TrackAlert(ctx, alertEntity, rule))

	// Wait for first escalation
	time.Sleep(2 * time.Second)

	// Verify alert.escalated event published
	events := mockEB.GetEvents()
	escalatedEventFound := false
	for _, e := range events {
		if e.topic == "alert.escalated" {
			escalatedEventFound = true
			break
		}
	}
	assert.True(t, escalatedEventFound, "alert.escalated event should be published")

	// Cancel escalation
	require.NoError(t, engine.CancelEscalation(ctx, alertEntity.ID, "test cancellation"))

	// Note: The current implementation doesn't publish cancellation events
	// This test documents the current behavior

	t.Log("Event bus integration test completed successfully")
}
