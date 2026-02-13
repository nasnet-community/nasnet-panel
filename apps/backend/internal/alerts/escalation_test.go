package alerts

import (
	"context"
	"sync"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/zap/zaptest"

	"backend/ent"
	"backend/ent/alert"
	"backend/ent/alertescalation"
	"backend/ent/alertrule"
	"backend/ent/enttest"
	"backend/internal/notifications"
)

// mockDispatcher tracks dispatched notifications for testing
type mockDispatcher struct {
	mu         sync.Mutex
	dispatched []mockDispatchCall
}

type mockDispatchCall struct {
	notification notifications.Notification
	channels     []string
	timestamp    time.Time
}

func (m *mockDispatcher) Dispatch(ctx context.Context, notification notifications.Notification, channels []string) []notifications.DeliveryResult {
	m.mu.Lock()
	defer m.mu.Unlock()

	m.dispatched = append(m.dispatched, mockDispatchCall{
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

func (m *mockDispatcher) GetDispatched() []mockDispatchCall {
	m.mu.Lock()
	defer m.mu.Unlock()
	return append([]mockDispatchCall{}, m.dispatched...)
}

// testHelpers provides common test utilities
type testHelpers struct {
	ctx        context.Context
	db         *ent.Client
	dispatcher *mockDispatcher
	logger     *zap.SugaredLogger
}

func newTestHelpers(t *testing.T) *testHelpers {
	return &testHelpers{
		ctx:        context.Background(),
		db:         enttest.Open(t, "sqlite3", "file:ent?mode=memory&_fk=1"),
		dispatcher: &mockDispatcher{},
		logger:     zaptest.NewLogger(t).Sugar(),
	}
}

func (h *testHelpers) Close() {
	h.db.Close()
}

func (h *testHelpers) createTestRule(escalationConfig map[string]interface{}) *ent.AlertRule {
	rule, err := h.db.AlertRule.Create().
		SetName("Test Rule").
		SetEventType("test.event").
		SetSeverity(alertrule.SeverityCRITICAL).
		SetChannels([]string{"inapp"}).
		SetEnabled(true).
		SetEscalation(escalationConfig).
		Save(h.ctx)
	if err != nil {
		panic(err)
	}
	return rule
}

func (h *testHelpers) createTestAlert(rule *ent.AlertRule) *ent.Alert {
	alertEntity, err := h.db.Alert.Create().
		SetRuleID(rule.ID).
		SetEventType(rule.EventType).
		SetSeverity(alert.SeverityCRITICAL).
		SetTitle("Test Alert").
		SetMessage("Test message").
		Save(h.ctx)
	if err != nil {
		panic(err)
	}
	return alertEntity
}

// TestEscalationEngine_TrackAlert verifies escalation is created and timer scheduled
// Per AC2: Start escalation tracking when alert is created
func TestEscalationEngine_TrackAlert(t *testing.T) {
	h := newTestHelpers(t)
	defer h.Close()

	engine := NewEscalationEngine(EscalationEngineConfig{
		DB:         h.db,
		Dispatcher: h.dispatcher,
		EventBus:   nil,
		Logger:     h.logger,
	})

	// Create rule with escalation config
	rule := h.createTestRule(map[string]interface{}{
		"enabled":                true,
		"requireAck":             true,
		"escalationDelaySeconds": 2,
		"maxEscalations":         3,
		"additionalChannels":     []string{"email"},
		"repeatIntervalSeconds":  []int{2, 4, 8},
	})

	// Create alert
	alertEntity := h.createTestAlert(rule)

	// Track alert for escalation
	err := engine.TrackAlert(h.ctx, alertEntity, rule)
	require.NoError(t, err)

	// Verify AlertEscalation record created in DB
	escalations, err := h.db.AlertEscalation.Query().
		Where(alertescalation.AlertIDEQ(alertEntity.ID)).
		All(h.ctx)
	require.NoError(t, err)
	assert.Len(t, escalations, 1)

	esc := escalations[0]
	assert.Equal(t, alertEntity.ID, esc.AlertID)
	assert.Equal(t, rule.ID, esc.RuleID)
	assert.Equal(t, 0, esc.CurrentLevel)
	assert.Equal(t, 3, esc.MaxLevel)
	assert.Equal(t, alertescalation.StatusPENDING, esc.Status)
	assert.NotNil(t, esc.NextEscalationAt)

	// Verify timer scheduled in memory
	engine.mu.RLock()
	state, exists := engine.escalations[alertEntity.ID]
	engine.mu.RUnlock()

	assert.True(t, exists, "escalation state should exist in memory")
	assert.NotNil(t, state.timer, "timer should be scheduled")
	assert.Equal(t, alertEntity.ID, state.alertID)
	assert.Equal(t, 0, state.currentLevel)
}

// TestEscalationEngine_CancelEscalation verifies timer stopped and DB updated
// Per AC5: Cancel immediately when alert is acknowledged
func TestEscalationEngine_CancelEscalation(t *testing.T) {
	h := newTestHelpers(t)
	defer h.Close()

	engine := NewEscalationEngine(EscalationEngineConfig{
		DB:         h.db,
		Dispatcher: h.dispatcher,
		EventBus:   nil,
		Logger:     h.logger,
	})

	// Create and track alert
	rule := h.createTestRule(map[string]interface{}{
		"enabled":                true,
		"requireAck":             true,
		"escalationDelaySeconds": 10,
		"maxEscalations":         3,
		"additionalChannels":     []string{"email"},
		"repeatIntervalSeconds":  []int{10, 20, 30},
	})

	alertEntity := h.createTestAlert(rule)
	err := engine.TrackAlert(h.ctx, alertEntity, rule)
	require.NoError(t, err)

	// Verify escalation exists
	engine.mu.RLock()
	state, exists := engine.escalations[alertEntity.ID]
	engine.mu.RUnlock()
	require.True(t, exists)

	// Cancel escalation
	err = engine.CancelEscalation(h.ctx, alertEntity.ID, "alert acknowledged")
	require.NoError(t, err)

	// Verify timer stopped and removed from map
	engine.mu.RLock()
	_, exists = engine.escalations[alertEntity.ID]
	engine.mu.RUnlock()
	assert.False(t, exists, "escalation should be removed from memory")

	// Verify cancelled flag set
	state.mu.Lock()
	assert.True(t, state.cancelled, "cancelled flag should be set")
	state.mu.Unlock()

	// Verify DB updated
	esc, err := h.db.AlertEscalation.Query().
		Where(alertescalation.AlertIDEQ(alertEntity.ID)).
		Only(h.ctx)
	require.NoError(t, err)
	assert.Equal(t, alertescalation.StatusRESOLVED, esc.Status)
	assert.NotNil(t, esc.ResolvedAt)
	assert.Equal(t, "alert acknowledged", esc.ResolvedBy)
}

// TestEscalationEngine_AcknowledgeBeforeTimeout verifies no escalation dispatched
// Per AC2: If acknowledged before timeout, no escalation occurs
func TestEscalationEngine_AcknowledgeBeforeTimeout(t *testing.T) {
	h := newTestHelpers(t)
	defer h.Close()

	engine := NewEscalationEngine(EscalationEngineConfig{
		DB:         h.db,
		Dispatcher: h.dispatcher,
		EventBus:   nil,
		Logger:     h.logger,
	})

	// Create and track alert with 2-second delay
	rule := h.createTestRule(map[string]interface{}{
		"enabled":                true,
		"requireAck":             true,
		"escalationDelaySeconds": 2,
		"maxEscalations":         3,
		"additionalChannels":     []string{"email"},
		"repeatIntervalSeconds":  []int{2, 4, 8},
	})

	alertEntity := h.createTestAlert(rule)
	err := engine.TrackAlert(h.ctx, alertEntity, rule)
	require.NoError(t, err)

	// Cancel before timer fires (within 2 seconds)
	err = engine.CancelEscalation(h.ctx, alertEntity.ID, "acknowledged early")
	require.NoError(t, err)

	// Wait longer than the delay to ensure timer would have fired
	time.Sleep(3 * time.Second)

	// Verify no notifications dispatched
	dispatched := h.dispatcher.GetDispatched()
	assert.Empty(t, dispatched, "no escalation notifications should be sent")

	// Verify escalation status is RESOLVED
	esc, err := h.db.AlertEscalation.Query().
		Where(alertescalation.AlertIDEQ(alertEntity.ID)).
		Only(h.ctx)
	require.NoError(t, err)
	assert.Equal(t, alertescalation.StatusRESOLVED, esc.Status)
	assert.Equal(t, "acknowledged early", esc.ResolvedBy)
}

// TestEscalationEngine_EscalateAfterTimeout verifies escalation triggered
// Per AC3: Escalate at 15min mark
func TestEscalationEngine_EscalateAfterTimeout(t *testing.T) {
	h := newTestHelpers(t)
	defer h.Close()

	engine := NewEscalationEngine(EscalationEngineConfig{
		DB:         h.db,
		Dispatcher: h.dispatcher,
		EventBus:   nil,
		Logger:     h.logger,
	})

	// Create and track alert with 1-second delay (time compression for testing)
	rule := h.createTestRule(map[string]interface{}{
		"enabled":                true,
		"requireAck":             true,
		"escalationDelaySeconds": 1,
		"maxEscalations":         3,
		"additionalChannels":     []string{"email"},
		"repeatIntervalSeconds":  []int{1, 2, 4},
	})

	alertEntity := h.createTestAlert(rule)
	err := engine.TrackAlert(h.ctx, alertEntity, rule)
	require.NoError(t, err)

	// Wait for first escalation to fire
	time.Sleep(2 * time.Second)

	// Verify notification dispatched
	dispatched := h.dispatcher.GetDispatched()
	require.Len(t, dispatched, 1, "one escalation notification should be sent")

	call := dispatched[0]
	assert.Contains(t, call.notification.Title, "[ESCALATED L1]")
	assert.Contains(t, call.channels, "inapp")  // Original channel
	assert.Contains(t, call.channels, "email") // Additional channel

	// Verify currentLevel incremented in DB
	esc, err := h.db.AlertEscalation.Query().
		Where(alertescalation.AlertIDEQ(alertEntity.ID)).
		Only(h.ctx)
	require.NoError(t, err)
	assert.Equal(t, 1, esc.CurrentLevel)
	assert.Equal(t, alertescalation.StatusPENDING, esc.Status)
}

// TestEscalationEngine_MultiLevelEscalation verifies 3 levels with increasing intervals
// Per AC4: Progress through levels with increasing intervals
func TestEscalationEngine_MultiLevelEscalation(t *testing.T) {
	h := newTestHelpers(t)
	defer h.Close()

	engine := NewEscalationEngine(EscalationEngineConfig{
		DB:         h.db,
		Dispatcher: h.dispatcher,
		EventBus:   nil,
		Logger:     h.logger,
	})

	// Create alert with 3 escalation levels (1s, 1s, 2s for testing)
	rule := h.createTestRule(map[string]interface{}{
		"enabled":                true,
		"requireAck":             true,
		"escalationDelaySeconds": 1,
		"maxEscalations":         3,
		"additionalChannels":     []string{"email", "pushover"},
		"repeatIntervalSeconds":  []int{1, 1, 2},
	})

	alertEntity := h.createTestAlert(rule)
	err := engine.TrackAlert(h.ctx, alertEntity, rule)
	require.NoError(t, err)

	// Wait for level 1 (1 second)
	time.Sleep(2 * time.Second)
	dispatched := h.dispatcher.GetDispatched()
	require.GreaterOrEqual(t, len(dispatched), 1)
	assert.Contains(t, dispatched[0].notification.Title, "[ESCALATED L1]")

	// Wait for level 2 (additional 1 second)
	time.Sleep(2 * time.Second)
	dispatched = h.dispatcher.GetDispatched()
	require.GreaterOrEqual(t, len(dispatched), 2)
	assert.Contains(t, dispatched[1].notification.Title, "[ESCALATED L2]")

	// Wait for level 3 (additional 2 seconds)
	time.Sleep(3 * time.Second)
	dispatched = h.dispatcher.GetDispatched()
	require.GreaterOrEqual(t, len(dispatched), 3)
	assert.Contains(t, dispatched[2].notification.Title, "[ESCALATED L3]")

	// Verify channels merged correctly (original inapp + additional email, pushover)
	for _, call := range dispatched {
		assert.Contains(t, call.channels, "inapp")
		assert.Contains(t, call.channels, "email")
		assert.Contains(t, call.channels, "pushover")
	}

	// Verify final DB state
	esc, err := h.db.AlertEscalation.Query().
		Where(alertescalation.AlertIDEQ(alertEntity.ID)).
		Only(h.ctx)
	require.NoError(t, err)
	assert.Equal(t, 3, esc.CurrentLevel)
}

// TestEscalationEngine_MaxLevelReached verifies stops at max level
// Per AC4: Stop at max level with final warning
func TestEscalationEngine_MaxLevelReached(t *testing.T) {
	h := newTestHelpers(t)
	defer h.Close()

	engine := NewEscalationEngine(EscalationEngineConfig{
		DB:         h.db,
		Dispatcher: h.dispatcher,
		EventBus:   nil,
		Logger:     h.logger,
	})

	// Create alert with maxEscalations=2
	rule := h.createTestRule(map[string]interface{}{
		"enabled":                true,
		"requireAck":             true,
		"escalationDelaySeconds": 1,
		"maxEscalations":         2,
		"additionalChannels":     []string{"email"},
		"repeatIntervalSeconds":  []int{1, 1},
	})

	alertEntity := h.createTestAlert(rule)
	err := engine.TrackAlert(h.ctx, alertEntity, rule)
	require.NoError(t, err)

	// Wait for both levels to trigger
	time.Sleep(5 * time.Second)

	// Verify exactly 2 escalations dispatched
	dispatched := h.dispatcher.GetDispatched()
	assert.Len(t, dispatched, 2, "should have exactly 2 escalations")

	// Verify status changed to MAX_REACHED
	esc, err := h.db.AlertEscalation.Query().
		Where(alertescalation.AlertIDEQ(alertEntity.ID)).
		Only(h.ctx)
	require.NoError(t, err)
	assert.Equal(t, alertescalation.StatusMAXREACHED, esc.Status)
	assert.Equal(t, 2, esc.CurrentLevel)

	// Verify no timer scheduled (removed from map)
	engine.mu.RLock()
	_, exists := engine.escalations[alertEntity.ID]
	engine.mu.RUnlock()
	assert.False(t, exists, "escalation should be removed after max level")

	// Wait a bit more to ensure no additional escalations
	time.Sleep(3 * time.Second)
	dispatched = h.dispatcher.GetDispatched()
	assert.Len(t, dispatched, 2, "should still have exactly 2 escalations")
}

// TestEscalationEngine_ChannelDeduplication verifies no duplicate channels
func TestEscalationEngine_ChannelDeduplication(t *testing.T) {
	h := newTestHelpers(t)
	defer h.Close()

	engine := NewEscalationEngine(EscalationEngineConfig{
		DB:         h.db,
		Dispatcher: h.dispatcher,
		EventBus:   nil,
		Logger:     h.logger,
	})

	// Create rule with channels that overlap with additional channels
	rule, err := h.db.AlertRule.Create().
		SetName("Test Rule").
		SetEventType("test.event").
		SetSeverity(alertrule.SeverityCRITICAL).
		SetChannels([]string{"email", "inapp"}). // email overlaps with additional
		SetEnabled(true).
		SetEscalation(map[string]interface{}{
			"enabled":                true,
			"requireAck":             true,
			"escalationDelaySeconds": 1,
			"maxEscalations":         1,
			"additionalChannels":     []string{"email", "telegram"}, // email is duplicate
			"repeatIntervalSeconds":  []int{1},
		}).
		Save(h.ctx)
	require.NoError(t, err)

	alertEntity := h.createTestAlert(rule)
	err = engine.TrackAlert(h.ctx, alertEntity, rule)
	require.NoError(t, err)

	// Wait for escalation
	time.Sleep(2 * time.Second)

	// Verify channels deduplicated
	dispatched := h.dispatcher.GetDispatched()
	require.Len(t, dispatched, 1)

	channels := dispatched[0].channels
	assert.Contains(t, channels, "email")
	assert.Contains(t, channels, "inapp")
	assert.Contains(t, channels, "telegram")

	// Count occurrences of "email" - should be exactly 1
	emailCount := 0
	for _, ch := range channels {
		if ch == "email" {
			emailCount++
		}
	}
	assert.Equal(t, 1, emailCount, "email should appear exactly once (deduplicated)")
}

// TestParseEscalationConfig_Valid verifies valid JSON parsing
func TestParseEscalationConfig_Valid(t *testing.T) {
	tests := []struct {
		name     string
		input    map[string]interface{}
		expected EscalationConfig
	}{
		{
			name: "complete config",
			input: map[string]interface{}{
				"enabled":                true,
				"requireAck":             true,
				"escalationDelaySeconds": 900,
				"maxEscalations":         3,
				"additionalChannels":     []interface{}{"email", "telegram"},
				"repeatIntervalSeconds":  []interface{}{900, 1800, 3600},
			},
			expected: EscalationConfig{
				Enabled:                true,
				RequireAck:             true,
				EscalationDelaySeconds: 900,
				MaxEscalations:         3,
				AdditionalChannels:     []string{"email", "telegram"},
				RepeatIntervalSeconds:  []int{900, 1800, 3600},
			},
		},
		// TODO: Add more test cases
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := parseEscalationConfig(tt.input)
			require.NoError(t, err)
			assert.Equal(t, tt.expected, result)
		})
	}
}

// TestParseEscalationConfig_Invalid verifies error handling
func TestParseEscalationConfig_Invalid(t *testing.T) {
	tests := []struct {
		name  string
		input interface{}
	}{
		{"nil input", nil},
		{"empty map", map[string]interface{}{}},
		{"wrong types", map[string]interface{}{"enabled": "true"}},
		// TODO: Add more invalid cases
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := parseEscalationConfig(tt.input)
			assert.Error(t, err)
		})
	}
}

// TestEscalationEngine_ConcurrentAccess verifies goroutine safety
func TestEscalationEngine_ConcurrentAccess(t *testing.T) {
	h := newTestHelpers(t)
	defer h.Close()

	engine := NewEscalationEngine(EscalationEngineConfig{
		DB:         h.db,
		Dispatcher: h.dispatcher,
		EventBus:   nil,
		Logger:     h.logger,
	})

	rule := h.createTestRule(map[string]interface{}{
		"enabled":                true,
		"requireAck":             true,
		"escalationDelaySeconds": 5,
		"maxEscalations":         3,
		"additionalChannels":     []string{"email"},
		"repeatIntervalSeconds":  []int{5, 10, 15},
	})

	var wg sync.WaitGroup
	numGoroutines := 10

	// Spawn goroutines to track alerts concurrently
	for i := 0; i < numGoroutines; i++ {
		wg.Add(1)
		go func(idx int) {
			defer wg.Done()
			alertEntity := h.createTestAlert(rule)
			_ = engine.TrackAlert(h.ctx, alertEntity, rule)
		}(i)
	}

	// Spawn goroutines to cancel escalations concurrently
	wg.Add(numGoroutines)
	go func() {
		time.Sleep(100 * time.Millisecond) // Let some track first
		escalations, _ := h.db.AlertEscalation.Query().All(h.ctx)
		for i, esc := range escalations {
			if i >= numGoroutines {
				break
			}
			go func(e *ent.AlertEscalation) {
				defer wg.Done()
				_ = engine.CancelEscalation(h.ctx, e.AlertID, "concurrent cancel")
			}(esc)
		}
	}()

	// Wait for all operations to complete
	done := make(chan struct{})
	go func() {
		wg.Wait()
		close(done)
	}()

	select {
	case <-done:
		// Success - all operations completed
	case <-time.After(10 * time.Second):
		t.Fatal("concurrent access test timed out")
	}

	// Verify no panics occurred and state is consistent
	// (The -race detector will catch any data races)
	engine.mu.RLock()
	mapSize := len(engine.escalations)
	engine.mu.RUnlock()

	// Some escalations may still be active, some cancelled
	t.Logf("Final escalation map size: %d", mapSize)
}

// TestValidateEscalationConfig verifies config validation
func TestValidateEscalationConfig(t *testing.T) {
	tests := []struct {
		name      string
		config    EscalationConfig
		expectErr bool
	}{
		{
			name: "valid config",
			config: EscalationConfig{
				EscalationDelaySeconds: 900,
				MaxEscalations:         3,
				RepeatIntervalSeconds:  []int{900, 1800},
			},
			expectErr: false,
		},
		{
			name: "zero delay",
			config: EscalationConfig{
				EscalationDelaySeconds: 0,
				MaxEscalations:         3,
				RepeatIntervalSeconds:  []int{900},
			},
			expectErr: true,
		},
		{
			name: "too many levels",
			config: EscalationConfig{
				EscalationDelaySeconds: 900,
				MaxEscalations:         11,
				RepeatIntervalSeconds:  []int{900},
			},
			expectErr: true,
		},
		{
			name: "empty intervals",
			config: EscalationConfig{
				EscalationDelaySeconds: 900,
				MaxEscalations:         3,
				RepeatIntervalSeconds:  []int{},
			},
			expectErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validateEscalationConfig(tt.config)
			if tt.expectErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}
