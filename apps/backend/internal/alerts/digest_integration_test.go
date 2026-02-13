package alerts

import (
	"context"
	"testing"
	"time"

	"backend/ent"
	"backend/ent/alertdigestentry"
	"backend/ent/enttest"
	"backend/internal/notifications"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
	"go.uber.org/zap"

	_ "github.com/mattn/go-sqlite3"
)

// Integration test setup with full dependencies
func setupIntegrationTest(t *testing.T) (*DigestService, *DigestScheduler, *ent.Client, *mockEventBus, *mockDispatcher) {
	db := enttest.Open(t, "sqlite3", "file:integration?mode=memory&cache=shared&_fk=1")
	eventBus := newMockEventBus()
	dispatcher := newMockDispatcher()
	logger := zap.NewNop().Sugar()

	// Allow Publish to succeed by default
	eventBus.On("Publish", mock.Anything, mock.Anything).Return(nil)

	digestService, err := NewDigestService(DigestServiceConfig{
		DB:         db,
		EventBus:   eventBus,
		Dispatcher: dispatcher,
		Logger:     logger,
	})
	require.NoError(t, err)

	scheduler := NewDigestScheduler(DigestSchedulerConfig{
		DigestService: digestService,
		Logger:        logger,
	})

	t.Cleanup(func() {
		scheduler.Stop()
		db.Close()
	})

	return digestService, scheduler, db, eventBus, dispatcher
}

// TestIntegration_FullFlow verifies complete flow: events → rules → queue → compile → dispatch.
// Scenario: 15 alerts queued → digest compiled → ONE dispatch call with all alerts.
func TestIntegration_FullFlow(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping integration test in short mode")
	}

	service, _, db, eventBus, dispatcher := setupIntegrationTest(t)

	ctx := context.Background()
	channelID := "channel-full-flow"
	now := time.Now()

	// Simulate 15 alerts from rule matching
	alertCount := 15
	for i := 0; i < alertCount; i++ {
		alert := Alert{
			ID:        "",
			RuleID:    "rule-integration",
			Severity:  "warning",
			EventType: "router.cpu.high",
			Title:     "High CPU Usage",
			Message:   "CPU usage above threshold",
			Data: map[string]interface{}{
				"cpu_percent": 85.5,
				"router_id":   "router-123",
			},
		}

		// Queue alert for digest
		err := service.QueueAlert(ctx, alert, channelID, "email", false)
		require.NoError(t, err)
	}

	// Verify all alerts were queued
	queuedEntries, err := db.AlertDigestEntry.Query().
		Where(alertdigestentry.ChannelID(channelID)).
		All(ctx)
	require.NoError(t, err)
	assert.Len(t, queuedEntries, alertCount, "all alerts should be queued")

	// Verify events were published for each queue operation
	assert.Len(t, eventBus.published, alertCount, "should publish queue event for each alert")

	// Mock successful dispatch for ONE digest delivery
	dispatcher.On("Dispatch", mock.Anything, mock.Anything, mock.Anything).Return(
		[]notifications.DeliveryResult{
			{Channel: channelID, Success: true},
		},
	).Once()

	// Compile and deliver digest
	err = service.DeliverDigest(ctx, channelID)
	require.NoError(t, err)

	// Verify dispatcher was called EXACTLY ONCE with all alerts in one digest
	dispatcher.AssertNumberOfCalls(t, "Dispatch", 1)
	require.Len(t, dispatcher.dispatchCalls, 1)

	call := dispatcher.dispatchCalls[0]
	assert.Equal(t, []string{channelID}, call.channelIDs)
	assert.Contains(t, call.notification.Title, "15 alerts")
	assert.Equal(t, alertCount, call.notification.Data["total_count"])

	// Verify all entries are marked as delivered
	deliveredEntries, err := db.AlertDigestEntry.Query().
		Where(
			alertdigestentry.ChannelID(channelID),
			alertdigestentry.DeliveredAtNotNil(),
		).
		All(ctx)
	require.NoError(t, err)
	assert.Len(t, deliveredEntries, alertCount, "all entries should be marked as delivered")

	// Verify all entries share the same digest_id
	digestID := deliveredEntries[0].DigestID
	assert.NotEmpty(t, digestID)
	for _, entry := range deliveredEntries {
		assert.Equal(t, digestID, entry.DigestID, "all entries should share same digest_id")
	}
}

// TestIntegration_MixedSeverities verifies critical alerts bypass while warnings are queued.
// Scenario: 5 critical (immediate) + 10 warning (queued) → critical sent immediately, warning in digest.
func TestIntegration_MixedSeverities(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping integration test in short mode")
	}

	service, _, db, _, dispatcher := setupIntegrationTest(t)

	ctx := context.Background()
	channelID := "channel-mixed"

	digestConfig := DigestConfig{
		Mode:           "hourly",
		BypassCritical: true,
	}

	// Simulate 5 critical alerts (should NOT be queued)
	criticalCount := 5
	for i := 0; i < criticalCount; i++ {
		alert := Alert{
			ID:        "",
			RuleID:    "rule-critical",
			Severity:  "critical",
			EventType: "router.offline",
			Title:     "Router Offline",
			Message:   "Critical: Router is offline",
		}

		// Check if should queue (should return false for critical with bypass)
		shouldQueue := service.ShouldQueue(digestConfig, alert.Severity)
		assert.False(t, shouldQueue, "critical should bypass digest")

		// In production, these would be sent immediately (not queued)
		// For testing, we verify the ShouldQueue logic
	}

	// Simulate 10 warning alerts (should be queued)
	warningCount := 10
	for i := 0; i < warningCount; i++ {
		alert := Alert{
			ID:        "",
			RuleID:    "rule-warning",
			Severity:  "warning",
			EventType: "router.cpu.high",
			Title:     "High CPU",
			Message:   "Warning: CPU usage high",
		}

		// Verify should queue
		shouldQueue := service.ShouldQueue(digestConfig, alert.Severity)
		assert.True(t, shouldQueue, "warning should be queued")

		// Queue alert
		err := service.QueueAlert(ctx, alert, channelID, "email", false)
		require.NoError(t, err)
	}

	// Verify only warnings were queued
	queuedEntries, err := db.AlertDigestEntry.Query().
		Where(alertdigestentry.ChannelID(channelID)).
		All(ctx)
	require.NoError(t, err)
	assert.Len(t, queuedEntries, warningCount, "only warning alerts should be queued")

	// Verify all queued entries are warnings
	for _, entry := range queuedEntries {
		assert.Equal(t, alertdigestentry.SeverityWarning, entry.Severity)
	}

	// Mock successful dispatch
	dispatcher.On("Dispatch", mock.Anything, mock.Anything, mock.Anything).Return(
		[]notifications.DeliveryResult{
			{Channel: channelID, Success: true},
		},
	)

	// Deliver digest (only warnings)
	err = service.DeliverDigest(ctx, channelID)
	require.NoError(t, err)

	// Verify digest contains only warnings
	require.Len(t, dispatcher.dispatchCalls, 1)
	call := dispatcher.dispatchCalls[0]
	severityCounts := call.notification.Data["severity_counts"].(map[string]int)
	assert.Equal(t, warningCount, severityCounts["warning"])
	assert.Equal(t, 0, severityCounts["critical"])
}

// TestIntegration_EmptyPeriod verifies behavior when no alerts are queued.
// Scenario: No alerts → no digest sent OR "all clear" if sendEmpty=true.
func TestIntegration_EmptyPeriod(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping integration test in short mode")
	}

	service, _, _, _, dispatcher := setupIntegrationTest(t)

	ctx := context.Background()
	channelID := "channel-empty"

	t.Run("sendEmpty=false", func(t *testing.T) {
		// Mock dispatcher (should NOT be called)
		dispatcher.On("Dispatch", mock.Anything, mock.Anything, mock.Anything).Return(
			[]notifications.DeliveryResult{
				{Channel: channelID, Success: true},
			},
		).Maybe()

		// Deliver digest (no pending alerts)
		err := service.DeliverDigest(ctx, channelID)
		require.NoError(t, err)

		// Verify dispatcher was NOT called
		dispatcher.AssertNotCalled(t, "Dispatch")
	})

	t.Run("sendEmpty=true", func(t *testing.T) {
		// Reset mock
		dispatcher.ExpectedCalls = nil
		dispatcher.Calls = nil

		// Mock dispatcher for "all clear" notification
		dispatcher.On("Dispatch", mock.Anything, mock.MatchedBy(func(n notifications.Notification) bool {
			return n.Title == "NasNet Digest: All Clear"
		}), mock.Anything).Return(
			[]notifications.DeliveryResult{
				{Channel: channelID, Success: true},
			},
		).Once()

		// Send empty digest
		err := service.HandleEmptyDigest(ctx, channelID, true)
		require.NoError(t, err)

		// Verify "all clear" was sent
		dispatcher.AssertCalled(t, "Dispatch", mock.Anything, mock.MatchedBy(func(n notifications.Notification) bool {
			return n.Title == "NasNet Digest: All Clear"
		}), mock.Anything)
	})
}

// TestIntegration_QuietHours verifies alert suppression and digest queuing.
// Scenario: Alert during quiet hours → suppressed → queued to digest → delivered at next scheduled time.
func TestIntegration_QuietHours(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping integration test in short mode")
	}

	service, _, db, _, dispatcher := setupIntegrationTest(t)

	ctx := context.Background()
	channelID := "channel-quiet"

	// Simulate alert during quiet hours (would be suppressed by QuietHoursFilter)
	// In production, the alert would pass through QuietHoursFilter first,
	// which would determine if it should be queued for digest delivery.

	// For this test, we simulate that the alert was suppressed and queued
	alert := Alert{
		ID:        "",
		RuleID:    "rule-quiet",
		Severity:  "warning",
		EventType: "router.update.available",
		Title:     "Update Available",
		Message:   "Router update available",
	}

	// Queue alert (simulating quiet hours suppression)
	err := service.QueueAlert(ctx, alert, channelID, "email", false)
	require.NoError(t, err)

	// Verify alert was queued
	queuedEntries, err := db.AlertDigestEntry.Query().
		Where(alertdigestentry.ChannelID(channelID)).
		All(ctx)
	require.NoError(t, err)
	assert.Len(t, queuedEntries, 1)

	// Simulate next scheduled delivery (after quiet hours)
	dispatcher.On("Dispatch", mock.Anything, mock.Anything, mock.Anything).Return(
		[]notifications.DeliveryResult{
			{Channel: channelID, Success: true},
		},
	)

	// Deliver digest
	err = service.DeliverDigest(ctx, channelID)
	require.NoError(t, err)

	// Verify alert was delivered in digest
	dispatcher.AssertCalled(t, "Dispatch", mock.Anything, mock.Anything, mock.Anything)

	// Verify entry is marked as delivered
	deliveredEntries, err := db.AlertDigestEntry.Query().
		Where(
			alertdigestentry.ChannelID(channelID),
			alertdigestentry.DeliveredAtNotNil(),
		).
		All(ctx)
	require.NoError(t, err)
	assert.Len(t, deliveredEntries, 1)
}

// TestIntegration_MultipleChannels verifies independent digest queues per channel.
// Scenario: Email daily + webhook 15-min → same alert queued independently → delivered separately.
func TestIntegration_MultipleChannels(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping integration test in short mode")
	}

	service, _, db, _, dispatcher := setupIntegrationTest(t)

	ctx := context.Background()
	emailChannelID := "channel-email-daily"
	webhookChannelID := "channel-webhook-15min"

	// Simulate same alert sent to both channels with different digest configs
	alert := Alert{
		ID:        "",
		RuleID:    "rule-multi-channel",
		Severity:  "warning",
		EventType: "router.bandwidth.high",
		Title:     "High Bandwidth",
		Message:   "Bandwidth usage is high",
		Data: map[string]interface{}{
			"bandwidth_mbps": 950,
		},
	}

	// Queue for email channel (daily digest)
	err := service.QueueAlert(ctx, alert, emailChannelID, "email", false)
	require.NoError(t, err)

	// Queue for webhook channel (15-min digest)
	err = service.QueueAlert(ctx, alert, webhookChannelID, "webhook", false)
	require.NoError(t, err)

	// Verify both channels have independent queue entries
	emailEntries, err := db.AlertDigestEntry.Query().
		Where(alertdigestentry.ChannelID(emailChannelID)).
		All(ctx)
	require.NoError(t, err)
	assert.Len(t, emailEntries, 1)

	webhookEntries, err := db.AlertDigestEntry.Query().
		Where(alertdigestentry.ChannelID(webhookChannelID)).
		All(ctx)
	require.NoError(t, err)
	assert.Len(t, webhookEntries, 1)

	// Verify entries have correct channel types
	assert.Equal(t, "email", emailEntries[0].ChannelType)
	assert.Equal(t, "webhook", webhookEntries[0].ChannelType)

	// Mock successful dispatch for both channels
	dispatcher.On("Dispatch", mock.Anything, mock.Anything, []string{emailChannelID}).Return(
		[]notifications.DeliveryResult{
			{Channel: emailChannelID, Success: true},
		},
	).Once()

	dispatcher.On("Dispatch", mock.Anything, mock.Anything, []string{webhookChannelID}).Return(
		[]notifications.DeliveryResult{
			{Channel: webhookChannelID, Success: true},
		},
	).Once()

	// Deliver email digest
	err = service.DeliverDigest(ctx, emailChannelID)
	require.NoError(t, err)

	// Deliver webhook digest
	err = service.DeliverDigest(ctx, webhookChannelID)
	require.NoError(t, err)

	// Verify both dispatches occurred
	dispatcher.AssertNumberOfCalls(t, "Dispatch", 2)

	// Verify independent delivery tracking
	emailDelivered, err := db.AlertDigestEntry.Query().
		Where(
			alertdigestentry.ChannelID(emailChannelID),
			alertdigestentry.DeliveredAtNotNil(),
		).
		All(ctx)
	require.NoError(t, err)
	assert.Len(t, emailDelivered, 1)

	webhookDelivered, err := db.AlertDigestEntry.Query().
		Where(
			alertdigestentry.ChannelID(webhookChannelID),
			alertdigestentry.DeliveredAtNotNil(),
		).
		All(ctx)
	require.NoError(t, err)
	assert.Len(t, webhookDelivered, 1)

	// Verify different digest IDs (delivered separately)
	assert.NotEqual(t, emailDelivered[0].DigestID, webhookDelivered[0].DigestID,
		"each channel should have independent digest_id")
}

// TestIntegration_CriticalBypassWithDigestHistory verifies critical alerts sent immediately
// but still appear in digest for historical context.
func TestIntegration_CriticalBypassWithDigestHistory(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping integration test in short mode")
	}

	service, _, db, _, dispatcher := setupIntegrationTest(t)

	ctx := context.Background()
	channelID := "channel-bypass-history"

	// Simulate critical alert that was sent immediately but also queued for digest
	alert := Alert{
		ID:        "",
		RuleID:    "rule-critical-bypass",
		Severity:  "critical",
		EventType: "router.offline",
		Title:     "Critical: Router Offline",
		Message:   "Router has gone offline",
	}

	// Queue with bypass_sent=true (alert was already sent immediately)
	err := service.QueueAlert(ctx, alert, channelID, "email", true)
	require.NoError(t, err)

	// Verify entry exists with bypass_sent flag
	entries, err := db.AlertDigestEntry.Query().
		Where(alertdigestentry.ChannelID(channelID)).
		All(ctx)
	require.NoError(t, err)
	assert.Len(t, entries, 1)
	assert.True(t, entries[0].BypassSent, "bypass_sent should be true")
	assert.Equal(t, alertdigestentry.SeverityCritical, entries[0].Severity)

	// Mock successful dispatch
	dispatcher.On("Dispatch", mock.Anything, mock.Anything, mock.Anything).Return(
		[]notifications.DeliveryResult{
			{Channel: channelID, Success: true},
		},
	)

	// Deliver digest (should include critical alert for historical context)
	err = service.DeliverDigest(ctx, channelID)
	require.NoError(t, err)

	// Verify digest was sent (includes bypassed critical alert)
	dispatcher.AssertCalled(t, "Dispatch", mock.Anything, mock.Anything, mock.Anything)

	// Verify entry is marked as delivered
	deliveredEntries, err := db.AlertDigestEntry.Query().
		Where(
			alertdigestentry.ChannelID(channelID),
			alertdigestentry.DeliveredAtNotNil(),
		).
		All(ctx)
	require.NoError(t, err)
	assert.Len(t, deliveredEntries, 1)
}

// TestIntegration_RetryOnFailure verifies digest delivery retries on transient failures.
func TestIntegration_RetryOnFailure(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping integration test in short mode")
	}

	service, _, db, _, dispatcher := setupIntegrationTest(t)

	ctx := context.Background()
	channelID := "channel-retry"

	// Queue alert
	alert := Alert{
		ID:        "",
		RuleID:    "rule-retry",
		Severity:  "warning",
		EventType: "test.event",
		Title:     "Test Alert",
		Message:   "Test message",
	}

	err := service.QueueAlert(ctx, alert, channelID, "email", false)
	require.NoError(t, err)

	// Mock failed dispatch (simulating transient failure)
	dispatcher.On("Dispatch", mock.Anything, mock.Anything, mock.Anything).Return(
		[]notifications.DeliveryResult{
			{Channel: channelID, Success: false, Error: "network timeout", Retryable: true},
		},
	).Once()

	// Attempt delivery (should fail)
	err = service.DeliverDigest(ctx, channelID)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "digest delivery failed")

	// Verify entry is NOT marked as delivered on failure
	entries, err := db.AlertDigestEntry.Query().
		Where(alertdigestentry.ChannelID(channelID)).
		All(ctx)
	require.NoError(t, err)
	assert.Len(t, entries, 1)
	assert.Nil(t, entries[0].DeliveredAt, "should not be marked delivered on failure")

	// Reset mock for successful retry
	dispatcher.ExpectedCalls = nil
	dispatcher.Calls = nil
	dispatcher.On("Dispatch", mock.Anything, mock.Anything, mock.Anything).Return(
		[]notifications.DeliveryResult{
			{Channel: channelID, Success: true},
		},
	)

	// Retry delivery (should succeed)
	err = service.DeliverDigest(ctx, channelID)
	require.NoError(t, err)

	// Verify entry is NOW marked as delivered
	deliveredEntries, err := db.AlertDigestEntry.Query().
		Where(
			alertdigestentry.ChannelID(channelID),
			alertdigestentry.DeliveredAtNotNil(),
		).
		All(ctx)
	require.NoError(t, err)
	assert.Len(t, deliveredEntries, 1)
}
