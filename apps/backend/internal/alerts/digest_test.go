package alerts

import (
	"context"
	"testing"
	"time"

	"backend/ent"
	"backend/ent/alertdigestentry"
	"backend/ent/enttest"
	"backend/internal/events"
	"backend/internal/notifications"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
	"go.uber.org/zap"

	_ "github.com/mattn/go-sqlite3"
)

// mockEventBus is a mock implementation of events.EventBus for testing.
type mockEventBus struct {
	mock.Mock
	published []events.Event
}

func newMockEventBus() *mockEventBus {
	return &mockEventBus{
		published: make([]events.Event, 0),
	}
}

func (m *mockEventBus) Publish(ctx context.Context, event events.Event) error {
	args := m.Called(ctx, event)
	m.published = append(m.published, event)
	return args.Error(0)
}

func (m *mockEventBus) Subscribe(topic string, handler events.EventHandler) error {
	args := m.Called(topic, handler)
	return args.Error(0)
}

func (m *mockEventBus) SubscribeAll(handler events.EventHandler) error {
	args := m.Called(handler)
	return args.Error(0)
}

func (m *mockEventBus) Unsubscribe(topic string) error {
	args := m.Called(topic)
	return args.Error(0)
}

func (m *mockEventBus) Close() error {
	args := m.Called()
	return args.Error(0)
}

// mockDispatcher is a mock implementation of notifications.Dispatcher for testing.
type mockDispatcher struct {
	mock.Mock
	dispatchCalls []mockDispatchCall
}

type mockDispatchCall struct {
	notification notifications.Notification
	channelIDs   []string
}

func newMockDispatcher() *mockDispatcher {
	return &mockDispatcher{
		dispatchCalls: make([]mockDispatchCall, 0),
	}
}

func (m *mockDispatcher) Dispatch(ctx context.Context, notification notifications.Notification, channelIDs []string) []notifications.DeliveryResult {
	m.dispatchCalls = append(m.dispatchCalls, mockDispatchCall{
		notification: notification,
		channelIDs:   channelIDs,
	})

	args := m.Called(ctx, notification, channelIDs)
	return args.Get(0).([]notifications.DeliveryResult)
}

// setupTestDB creates an in-memory SQLite database for testing.
func setupTestDB(t *testing.T) *ent.Client {
	client := enttest.Open(t, "sqlite3", "file:ent?mode=memory&cache=shared&_fk=1")
	return client
}

// setupDigestService creates a DigestService with test dependencies.
func setupDigestService(t *testing.T) (*DigestService, *ent.Client, *mockEventBus, *mockDispatcher) {
	db := setupTestDB(t)
	eventBus := newMockEventBus()
	dispatcher := newMockDispatcher()
	logger := zap.NewNop().Sugar()

	// Allow Publish to succeed by default
	eventBus.On("Publish", mock.Anything, mock.Anything).Return(nil)

	service, err := NewDigestService(DigestServiceConfig{
		DB:         db,
		EventBus:   eventBus,
		Dispatcher: dispatcher,
		Logger:     logger,
	})
	require.NoError(t, err)
	require.NotNil(t, service)

	return service, db, eventBus, dispatcher
}

// TestShouldQueue_DigestEnabled_NonCritical verifies non-critical alerts are queued when digest is enabled.
func TestShouldQueue_DigestEnabled_NonCritical(t *testing.T) {
	tests := []struct {
		name     string
		mode     string
		severity string
		expected bool
	}{
		{
			name:     "hourly mode with warning severity",
			mode:     "hourly",
			severity: "warning",
			expected: true,
		},
		{
			name:     "daily mode with info severity",
			mode:     "daily",
			severity: "info",
			expected: true,
		},
		{
			name:     "hourly mode with critical but no bypass",
			mode:     "hourly",
			severity: "critical",
			expected: true,
		},
	}

	service, db, _, _ := setupDigestService(t)
	defer db.Close()

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			config := DigestConfig{
				Mode:           tt.mode,
				BypassCritical: false,
			}

			result := service.ShouldQueue(config, tt.severity)
			assert.Equal(t, tt.expected, result)
		})
	}
}

// TestShouldQueue_DigestDisabled verifies immediate mode never queues alerts.
func TestShouldQueue_DigestDisabled(t *testing.T) {
	service, db, _, _ := setupDigestService(t)
	defer db.Close()

	tests := []struct {
		name     string
		severity string
	}{
		{name: "critical", severity: "critical"},
		{name: "warning", severity: "warning"},
		{name: "info", severity: "info"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			config := DigestConfig{
				Mode: "immediate",
			}

			result := service.ShouldQueue(config, tt.severity)
			assert.False(t, result, "immediate mode should never queue alerts")
		})
	}
}

// TestShouldQueue_CriticalWithBypass verifies critical alerts bypass digest when configured.
func TestShouldQueue_CriticalWithBypass(t *testing.T) {
	service, db, _, _ := setupDigestService(t)
	defer db.Close()

	config := DigestConfig{
		Mode:           "hourly",
		BypassCritical: true,
	}

	result := service.ShouldQueue(config, "critical")
	assert.False(t, result, "critical alerts should bypass digest when BypassCritical=true")
}

// TestShouldQueue_CriticalWithoutBypass verifies critical alerts are queued when bypass is disabled.
func TestShouldQueue_CriticalWithoutBypass(t *testing.T) {
	service, db, _, _ := setupDigestService(t)
	defer db.Close()

	config := DigestConfig{
		Mode:           "daily",
		BypassCritical: false,
	}

	result := service.ShouldQueue(config, "critical")
	assert.True(t, result, "critical alerts should be queued when BypassCritical=false")
}

// TestShouldQueue_SeverityFiltering verifies severity filtering in digest config.
func TestShouldQueue_SeverityFiltering(t *testing.T) {
	service, db, _, _ := setupDigestService(t)
	defer db.Close()

	tests := []struct {
		name       string
		severities []string
		testSev    string
		expected   bool
	}{
		{
			name:       "warning in list",
			severities: []string{"warning", "info"},
			testSev:    "warning",
			expected:   true,
		},
		{
			name:       "critical not in list",
			severities: []string{"warning", "info"},
			testSev:    "critical",
			expected:   false,
		},
		{
			name:       "empty list includes all",
			severities: []string{},
			testSev:    "critical",
			expected:   true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			config := DigestConfig{
				Mode:       "hourly",
				Severities: tt.severities,
			}

			result := service.ShouldQueue(config, tt.testSev)
			assert.Equal(t, tt.expected, result)
		})
	}
}

// TestQueueAlert_PersistsEntry verifies alert is persisted to database.
func TestQueueAlert_PersistsEntry(t *testing.T) {
	service, db, eventBus, _ := setupDigestService(t)
	defer db.Close()

	ctx := context.Background()
	alert := Alert{
		ID:        "alert-001",
		RuleID:    "rule-001",
		Severity:  "warning",
		EventType: "router.offline",
		Title:     "Router Offline",
		Message:   "Router is offline",
		Data: map[string]interface{}{
			"router_id": "router-123",
		},
	}

	err := service.QueueAlert(ctx, alert, "channel-001", "email", false)
	require.NoError(t, err)

	// Verify entry was created
	entries, err := db.AlertDigestEntry.Query().
		Where(alertdigestentry.AlertID(alert.ID)).
		All(ctx)
	require.NoError(t, err)
	require.Len(t, entries, 1)

	entry := entries[0]
	assert.Equal(t, alert.ID, entry.AlertID)
	assert.Equal(t, alert.RuleID, entry.RuleID)
	assert.Equal(t, "channel-001", entry.ChannelID)
	assert.Equal(t, "email", entry.ChannelType)
	assert.Equal(t, alertdigestentry.Severity(alert.Severity), entry.Severity)
	assert.Equal(t, alert.EventType, entry.EventType)
	assert.Equal(t, alert.Title, entry.Title)
	assert.Equal(t, alert.Message, entry.Message)
	assert.False(t, entry.BypassSent)
	assert.Nil(t, entry.DeliveredAt)
	assert.NotNil(t, entry.QueuedAt)

	// Verify event was published
	eventBus.AssertCalled(t, "Publish", mock.Anything, mock.MatchedBy(func(e events.Event) bool {
		return e.GetType() == "alert.digest.queued"
	}))
}

// TestQueueAlert_WithBypassSent verifies bypass_sent flag is persisted.
func TestQueueAlert_WithBypassSent(t *testing.T) {
	service, db, _, _ := setupDigestService(t)
	defer db.Close()

	ctx := context.Background()
	alert := Alert{
		ID:        "alert-002",
		RuleID:    "rule-002",
		Severity:  "critical",
		EventType: "router.offline",
		Title:     "Critical Alert",
		Message:   "Critical issue",
	}

	err := service.QueueAlert(ctx, alert, "channel-002", "webhook", true)
	require.NoError(t, err)

	// Verify bypass_sent flag
	entry, err := db.AlertDigestEntry.Query().
		Where(alertdigestentry.AlertID(alert.ID)).
		Only(ctx)
	require.NoError(t, err)
	assert.True(t, entry.BypassSent, "bypass_sent should be true")
}

// TestCompileDigest_GroupsBySeverity verifies digest compilation groups by severity.
func TestCompileDigest_GroupsBySeverity(t *testing.T) {
	service, db, _, _ := setupDigestService(t)
	defer db.Close()

	ctx := context.Background()
	channelID := "channel-digest"
	now := time.Now()

	// Create entries with different severities
	severityCounts := map[string]int{
		"critical": 5,
		"warning":  8,
		"info":     2,
	}

	for severity, count := range severityCounts {
		for i := 0; i < count; i++ {
			_, err := db.AlertDigestEntry.Create().
				SetAlertID("").
				SetRuleID("rule-001").
				SetChannelID(channelID).
				SetChannelType("email").
				SetSeverity(alertdigestentry.Severity(severity)).
				SetEventType("test.event").
				SetTitle("Test Alert").
				SetMessage("Test message").
				SetQueuedAt(now.Add(-time.Duration(i) * time.Minute)).
				Save(ctx)
			require.NoError(t, err)
		}
	}

	// Compile digest
	since := now.Add(-1 * time.Hour)
	payload, err := service.CompileDigest(ctx, channelID, since)
	require.NoError(t, err)
	require.NotNil(t, payload)

	// Verify totals
	assert.Equal(t, 15, payload.TotalCount, "total should be 5+8+2=15")
	assert.Len(t, payload.Entries, 15)
	assert.Equal(t, channelID, payload.ChannelID)
	assert.Equal(t, "email", payload.ChannelType)

	// Verify severity counts
	assert.Equal(t, 5, payload.SeverityCounts["critical"])
	assert.Equal(t, 8, payload.SeverityCounts["warning"])
	assert.Equal(t, 2, payload.SeverityCounts["info"])
}

// TestCompileDigest_EmptyPeriod verifies nil is returned when no entries exist.
func TestCompileDigest_EmptyPeriod(t *testing.T) {
	service, db, _, _ := setupDigestService(t)
	defer db.Close()

	ctx := context.Background()
	channelID := "channel-empty"
	since := time.Now().Add(-24 * time.Hour)

	payload, err := service.CompileDigest(ctx, channelID, since)
	require.NoError(t, err)
	assert.Nil(t, payload, "should return nil when no pending alerts")
}

// TestCompileDigest_OnlyPendingEntries verifies only undelivered entries are included.
func TestCompileDigest_OnlyPendingEntries(t *testing.T) {
	service, db, _, _ := setupDigestService(t)
	defer db.Close()

	ctx := context.Background()
	channelID := "channel-pending"
	now := time.Now()

	// Create pending entry
	_, err := db.AlertDigestEntry.Create().
		SetAlertID("").
		SetRuleID("rule-001").
		SetChannelID(channelID).
		SetChannelType("email").
		SetSeverity(alertdigestentry.SeverityCritical).
		SetEventType("test.event").
		SetTitle("Pending Alert").
		SetMessage("Test message").
		SetQueuedAt(now.Add(-30 * time.Minute)).
		Save(ctx)
	require.NoError(t, err)

	// Create delivered entry (should be excluded)
	deliveredAt := now.Add(-5 * time.Minute)
	_, err = db.AlertDigestEntry.Create().
		SetAlertID("").
		SetRuleID("rule-002").
		SetChannelID(channelID).
		SetChannelType("email").
		SetSeverity(alertdigestentry.SeverityWarning).
		SetEventType("test.event").
		SetTitle("Delivered Alert").
		SetMessage("Test message").
		SetQueuedAt(now.Add(-45 * time.Minute)).
		SetDeliveredAt(deliveredAt).
		SetDigestID("digest-old").
		Save(ctx)
	require.NoError(t, err)

	// Compile digest
	since := now.Add(-1 * time.Hour)
	payload, err := service.CompileDigest(ctx, channelID, since)
	require.NoError(t, err)
	require.NotNil(t, payload)

	// Verify only pending entry is included
	assert.Equal(t, 1, payload.TotalCount)
	assert.Equal(t, "Pending Alert", payload.Entries[0].Title)
}

// TestDeliverDigest_MarksDelivered verifies entries are marked as delivered.
func TestDeliverDigest_MarksDelivered(t *testing.T) {
	service, db, _, dispatcher := setupDigestService(t)
	defer db.Close()

	ctx := context.Background()
	channelID := "channel-deliver"
	now := time.Now()

	// Create pending entries
	entryIDs := make([]string, 3)
	for i := 0; i < 3; i++ {
		entry, err := db.AlertDigestEntry.Create().
			SetAlertID("").
			SetRuleID("rule-001").
			SetChannelID(channelID).
			SetChannelType("email").
			SetSeverity(alertdigestentry.SeverityWarning).
			SetEventType("test.event").
			SetTitle("Test Alert").
			SetMessage("Test message").
			SetQueuedAt(now.Add(-time.Duration(i) * time.Minute)).
			Save(ctx)
		require.NoError(t, err)
		entryIDs[i] = entry.ID.String()
	}

	// Mock successful dispatch
	dispatcher.On("Dispatch", mock.Anything, mock.Anything, mock.Anything).Return(
		[]notifications.DeliveryResult{
			{Channel: channelID, Success: true},
		},
	)

	// Deliver digest
	err := service.DeliverDigest(ctx, channelID)
	require.NoError(t, err)

	// Verify entries are marked as delivered
	entries, err := db.AlertDigestEntry.Query().
		Where(alertdigestentry.ChannelID(channelID)).
		All(ctx)
	require.NoError(t, err)
	require.Len(t, entries, 3)

	for _, entry := range entries {
		assert.NotNil(t, entry.DeliveredAt, "delivered_at should be set")
		assert.NotEmpty(t, entry.DigestID, "digest_id should be set")
	}
}

// TestDeliverDigest_CallsDispatcher verifies dispatcher is called once with correct payload.
func TestDeliverDigest_CallsDispatcher(t *testing.T) {
	service, db, _, dispatcher := setupDigestService(t)
	defer db.Close()

	ctx := context.Background()
	channelID := "channel-dispatch"
	now := time.Now()

	// Create pending entry
	_, err := db.AlertDigestEntry.Create().
		SetAlertID("").
		SetRuleID("rule-001").
		SetChannelID(channelID).
		SetChannelType("email").
		SetSeverity(alertdigestentry.SeverityCritical).
		SetEventType("test.event").
		SetTitle("Test Alert").
		SetMessage("Test message").
		SetQueuedAt(now.Add(-10 * time.Minute)).
		Save(ctx)
	require.NoError(t, err)

	// Mock successful dispatch
	dispatcher.On("Dispatch", mock.Anything, mock.Anything, mock.Anything).Return(
		[]notifications.DeliveryResult{
			{Channel: channelID, Success: true},
		},
	)

	// Deliver digest
	err = service.DeliverDigest(ctx, channelID)
	require.NoError(t, err)

	// Verify dispatcher was called exactly once
	dispatcher.AssertNumberOfCalls(t, "Dispatch", 1)

	// Verify channel ID was passed
	require.Len(t, dispatcher.dispatchCalls, 1)
	assert.Equal(t, []string{channelID}, dispatcher.dispatchCalls[0].channelIDs)
	assert.Contains(t, dispatcher.dispatchCalls[0].notification.Title, "Alert Digest")
}

// TestDeliverDigest_FailureReturnsError verifies error is returned on delivery failure.
func TestDeliverDigest_FailureReturnsError(t *testing.T) {
	service, db, _, dispatcher := setupDigestService(t)
	defer db.Close()

	ctx := context.Background()
	channelID := "channel-fail"
	now := time.Now()

	// Create pending entry
	_, err := db.AlertDigestEntry.Create().
		SetAlertID("").
		SetRuleID("rule-001").
		SetChannelID(channelID).
		SetChannelType("email").
		SetSeverity(alertdigestentry.SeverityWarning).
		SetEventType("test.event").
		SetTitle("Test Alert").
		SetMessage("Test message").
		SetQueuedAt(now.Add(-10 * time.Minute)).
		Save(ctx)
	require.NoError(t, err)

	// Mock failed dispatch
	dispatcher.On("Dispatch", mock.Anything, mock.Anything, mock.Anything).Return(
		[]notifications.DeliveryResult{
			{Channel: channelID, Success: false, Error: "smtp connection failed"},
		},
	)

	// Deliver digest
	err = service.DeliverDigest(ctx, channelID)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "digest delivery failed")

	// Verify entries are NOT marked as delivered
	entries, err := db.AlertDigestEntry.Query().
		Where(alertdigestentry.ChannelID(channelID)).
		All(ctx)
	require.NoError(t, err)
	require.Len(t, entries, 1)
	assert.Nil(t, entries[0].DeliveredAt, "delivered_at should remain nil on failure")
}
