package throttle

import (
	"context"
	"sync"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// -----------------------------------------------------------------------------
// Test Helpers
// -----------------------------------------------------------------------------

func createTestNotification(channelID, severity string) *QueuedNotification {
	return &QueuedNotification{
		ChannelID: channelID,
		AlertID:   "alert-123",
		Title:     "Test Alert",
		Message:   "Test message",
		Severity:  severity,
		EventType: "test.event",
		Data:      map[string]interface{}{"key": "value"},
	}
}

// mockDeliveryCallback tracks delivered notifications for testing.
type mockDeliveryCallback struct {
	mu            sync.Mutex
	deliveries    [][]QueuedNotification
	deliveryError error
}

func (m *mockDeliveryCallback) callback(ctx context.Context, notifications []QueuedNotification) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.deliveries = append(m.deliveries, notifications)
	return m.deliveryError
}

func (m *mockDeliveryCallback) getDeliveries() [][]QueuedNotification {
	m.mu.Lock()
	defer m.mu.Unlock()
	return m.deliveries
}

func (m *mockDeliveryCallback) getDeliveryCount() int {
	m.mu.Lock()
	defer m.mu.Unlock()
	return len(m.deliveries)
}

// -----------------------------------------------------------------------------
// Basic Functionality Tests
// -----------------------------------------------------------------------------

func TestNewQuietHoursQueueManager(t *testing.T) {
	clock := NewMockClock(time.Time{})
	config := QuietHoursConfig{
		StartTime:      "22:00",
		EndTime:        "07:00",
		Timezone:       "UTC",
		BypassCritical: true,
	}

	qm := NewQuietHoursQueueManager(
		WithQuietHoursClock(clock),
		WithQuietHoursConfig(config),
	)
	defer qm.Close()

	assert.NotNil(t, qm.filter)
	assert.NotNil(t, qm.clock)
	assert.Equal(t, config, qm.config)
}

// -----------------------------------------------------------------------------
// ShouldQueue Tests
// -----------------------------------------------------------------------------

func TestShouldQueue_DuringQuietHours(t *testing.T) {
	// Set time to 23:00 (in quiet hours: 22:00-07:00)
	clock := NewMockClock(time.Date(2024, 1, 15, 23, 0, 0, 0, time.UTC))
	config := QuietHoursConfig{
		StartTime:      "22:00",
		EndTime:        "07:00",
		Timezone:       "UTC",
		BypassCritical: true,
	}

	qm := NewQuietHoursQueueManager(
		WithQuietHoursClock(clock),
		WithQuietHoursConfig(config),
	)
	defer qm.Close()

	// WARNING should be queued
	queue, reason := qm.ShouldQueue("WARNING")
	assert.True(t, queue)
	assert.Contains(t, reason, "quiet hours active")

	// CRITICAL should bypass
	queue, reason = qm.ShouldQueue("CRITICAL")
	assert.False(t, queue)
	assert.Contains(t, reason, "critical bypasses")
}

func TestShouldQueue_OutsideQuietHours(t *testing.T) {
	// Set time to 10:00 (outside quiet hours: 22:00-07:00)
	clock := NewMockClock(time.Date(2024, 1, 15, 10, 0, 0, 0, time.UTC))
	config := QuietHoursConfig{
		StartTime:      "22:00",
		EndTime:        "07:00",
		Timezone:       "UTC",
		BypassCritical: true,
	}

	qm := NewQuietHoursQueueManager(
		WithQuietHoursClock(clock),
		WithQuietHoursConfig(config),
	)
	defer qm.Close()

	// Should not queue
	queue, reason := qm.ShouldQueue("WARNING")
	assert.False(t, queue)
	assert.Empty(t, reason)
}

// -----------------------------------------------------------------------------
// Enqueue Tests
// -----------------------------------------------------------------------------

func TestEnqueue_Success(t *testing.T) {
	clock := NewMockClock(time.Time{})
	qm := NewQuietHoursQueueManager(WithQuietHoursClock(clock))
	defer qm.Close()

	notif := createTestNotification("channel-1", "WARNING")
	err := qm.Enqueue(notif)
	require.NoError(t, err)

	count := qm.GetQueuedCount("channel-1")
	assert.Equal(t, 1, count)
}

func TestEnqueue_QueueCapacity(t *testing.T) {
	clock := NewMockClock(time.Time{})
	qm := NewQuietHoursQueueManager(WithQuietHoursClock(clock))
	defer qm.Close()

	// Fill queue to capacity (100 items)
	for i := 0; i < 100; i++ {
		notif := createTestNotification("channel-1", "WARNING")
		err := qm.Enqueue(notif)
		require.NoError(t, err)
	}

	// 101st item should fail
	notif := createTestNotification("channel-1", "WARNING")
	err := qm.Enqueue(notif)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "queue full")
}

func TestEnqueue_MultiplChannels(t *testing.T) {
	clock := NewMockClock(time.Time{})
	qm := NewQuietHoursQueueManager(WithQuietHoursClock(clock))
	defer qm.Close()

	// Enqueue to channel-1
	for i := 0; i < 5; i++ {
		notif := createTestNotification("channel-1", "WARNING")
		err := qm.Enqueue(notif)
		require.NoError(t, err)
	}

	// Enqueue to channel-2
	for i := 0; i < 3; i++ {
		notif := createTestNotification("channel-2", "INFO")
		err := qm.Enqueue(notif)
		require.NoError(t, err)
	}

	assert.Equal(t, 5, qm.GetQueuedCount("channel-1"))
	assert.Equal(t, 3, qm.GetQueuedCount("channel-2"))

	counts := qm.GetAllQueuedCounts()
	assert.Equal(t, 2, len(counts))
	assert.Equal(t, 5, counts["channel-1"])
	assert.Equal(t, 3, counts["channel-2"])
}

func TestEnqueue_TTLTimestamps(t *testing.T) {
	startTime := time.Date(2024, 1, 15, 10, 0, 0, 0, time.UTC)
	clock := NewMockClock(startTime)
	qm := NewQuietHoursQueueManager(WithQuietHoursClock(clock))
	defer qm.Close()

	notif := createTestNotification("channel-1", "WARNING")
	err := qm.Enqueue(notif)
	require.NoError(t, err)

	// Check that timestamps were set correctly
	qm.mu.RLock()
	queue := qm.queues["channel-1"]
	require.NotNil(t, queue)
	require.Len(t, queue.notifications, 1)

	queued := queue.notifications[0]
	assert.Equal(t, startTime, queued.QueuedAt)
	assert.Equal(t, startTime.Add(24*time.Hour), queued.TTLExpiresAt)
	qm.mu.RUnlock()
}

// -----------------------------------------------------------------------------
// Queue Management Tests
// -----------------------------------------------------------------------------

func TestClearQueue(t *testing.T) {
	clock := NewMockClock(time.Time{})
	qm := NewQuietHoursQueueManager(WithQuietHoursClock(clock))
	defer qm.Close()

	// Add notifications
	for i := 0; i < 5; i++ {
		notif := createTestNotification("channel-1", "WARNING")
		qm.Enqueue(notif)
	}
	for i := 0; i < 3; i++ {
		notif := createTestNotification("channel-2", "INFO")
		qm.Enqueue(notif)
	}

	// Clear channel-1
	qm.ClearQueue("channel-1")

	assert.Equal(t, 0, qm.GetQueuedCount("channel-1"))
	assert.Equal(t, 3, qm.GetQueuedCount("channel-2"))
}

func TestClearAllQueues(t *testing.T) {
	clock := NewMockClock(time.Time{})
	qm := NewQuietHoursQueueManager(WithQuietHoursClock(clock))
	defer qm.Close()

	// Add notifications to multiple channels
	for i := 0; i < 5; i++ {
		notif := createTestNotification("channel-1", "WARNING")
		qm.Enqueue(notif)
	}
	for i := 0; i < 3; i++ {
		notif := createTestNotification("channel-2", "INFO")
		qm.Enqueue(notif)
	}

	// Clear all
	qm.ClearAllQueues()

	assert.Equal(t, 0, qm.GetQueuedCount("channel-1"))
	assert.Equal(t, 0, qm.GetQueuedCount("channel-2"))
	assert.Empty(t, qm.GetAllQueuedCounts())
}

// -----------------------------------------------------------------------------
// TTL Expiration Tests
// -----------------------------------------------------------------------------

func TestProcessQueues_TTLExpiration(t *testing.T) {
	startTime := time.Date(2024, 1, 15, 10, 0, 0, 0, time.UTC)
	clock := NewMockClock(startTime)

	// Set quiet hours to always active (so we can test TTL without delivery)
	config := QuietHoursConfig{
		StartTime:      "00:00",
		EndTime:        "23:59",
		Timezone:       "UTC",
		BypassCritical: false,
	}

	qm := NewQuietHoursQueueManager(
		WithQuietHoursClock(clock),
		WithQuietHoursConfig(config),
	)
	defer qm.Close()

	// Add notification
	notif := createTestNotification("channel-1", "WARNING")
	qm.Enqueue(notif)
	assert.Equal(t, 1, qm.GetQueuedCount("channel-1"))

	// Advance time by 25 hours (past TTL)
	clock.Advance(25 * time.Hour)

	// Process queues to remove expired
	qm.processQueues()

	// Notification should be removed
	assert.Equal(t, 0, qm.GetQueuedCount("channel-1"))
}

func TestProcessQueues_TTLKeepsValid(t *testing.T) {
	startTime := time.Date(2024, 1, 15, 10, 0, 0, 0, time.UTC)
	clock := NewMockClock(startTime)

	// Set quiet hours to always active
	config := QuietHoursConfig{
		StartTime:      "00:00",
		EndTime:        "23:59",
		Timezone:       "UTC",
		BypassCritical: false,
	}

	qm := NewQuietHoursQueueManager(
		WithQuietHoursClock(clock),
		WithQuietHoursConfig(config),
	)
	defer qm.Close()

	// Add notification
	notif := createTestNotification("channel-1", "WARNING")
	qm.Enqueue(notif)

	// Advance time by 23 hours (before TTL)
	clock.Advance(23 * time.Hour)

	// Process queues
	qm.processQueues()

	// Notification should still be there
	assert.Equal(t, 1, qm.GetQueuedCount("channel-1"))
}

// -----------------------------------------------------------------------------
// Batch Delivery Tests
// -----------------------------------------------------------------------------

func TestProcessQueues_DeliveryAtQuietHoursEnd(t *testing.T) {
	// Start at 23:00 (in quiet hours: 22:00-07:00)
	startTime := time.Date(2024, 1, 15, 23, 0, 0, 0, time.UTC)
	clock := NewMockClock(startTime)

	config := QuietHoursConfig{
		StartTime:      "22:00",
		EndTime:        "07:00",
		Timezone:       "UTC",
		BypassCritical: true,
	}

	mockCallback := &mockDeliveryCallback{}
	qm := NewQuietHoursQueueManager(
		WithQuietHoursClock(clock),
		WithQuietHoursConfig(config),
		WithDeliveryCallback(mockCallback.callback),
	)
	defer qm.Close()

	// Add notifications while in quiet hours
	for i := 0; i < 5; i++ {
		notif := createTestNotification("channel-1", "WARNING")
		qm.Enqueue(notif)
	}
	assert.Equal(t, 5, qm.GetQueuedCount("channel-1"))

	// Advance to 08:00 (quiet hours ended at 07:00)
	clock.Advance(9 * time.Hour) // 23:00 + 9h = 08:00

	// Process queues (simulates worker tick)
	qm.processQueues()

	// Queue should be cleared
	assert.Equal(t, 0, qm.GetQueuedCount("channel-1"))

	// Delivery should have been attempted
	// Note: delivery happens async, so we need to wait a bit
	time.Sleep(100 * time.Millisecond)

	deliveryCount := mockCallback.getDeliveryCount()
	assert.Equal(t, 1, deliveryCount)

	deliveries := mockCallback.getDeliveries()
	if len(deliveries) > 0 {
		assert.Len(t, deliveries[0], 5)
	}
}

func TestProcessQueues_NoDeliveryDuringQuietHours(t *testing.T) {
	// Start at 23:00 (in quiet hours)
	startTime := time.Date(2024, 1, 15, 23, 0, 0, 0, time.UTC)
	clock := NewMockClock(startTime)

	config := QuietHoursConfig{
		StartTime:      "22:00",
		EndTime:        "07:00",
		Timezone:       "UTC",
		BypassCritical: true,
	}

	mockCallback := &mockDeliveryCallback{}
	qm := NewQuietHoursQueueManager(
		WithQuietHoursClock(clock),
		WithQuietHoursConfig(config),
		WithDeliveryCallback(mockCallback.callback),
	)
	defer qm.Close()

	// Add notifications
	for i := 0; i < 3; i++ {
		notif := createTestNotification("channel-1", "WARNING")
		qm.Enqueue(notif)
	}

	// Advance time but stay in quiet hours (23:00 + 1h = 00:00)
	clock.Advance(1 * time.Hour)

	// Process queues
	qm.processQueues()

	// Queue should still have notifications
	assert.Equal(t, 3, qm.GetQueuedCount("channel-1"))

	// No delivery should have happened
	time.Sleep(100 * time.Millisecond)
	assert.Equal(t, 0, mockCallback.getDeliveryCount())
}

// -----------------------------------------------------------------------------
// FlushAll Tests
// -----------------------------------------------------------------------------

func TestFlushAll_DelivesAllQueued(t *testing.T) {
	clock := NewMockClock(time.Time{})
	mockCallback := &mockDeliveryCallback{}
	qm := NewQuietHoursQueueManager(
		WithQuietHoursClock(clock),
		WithDeliveryCallback(mockCallback.callback),
	)
	defer qm.Close()

	// Add notifications to multiple channels
	for i := 0; i < 5; i++ {
		notif := createTestNotification("channel-1", "WARNING")
		qm.Enqueue(notif)
	}
	for i := 0; i < 3; i++ {
		notif := createTestNotification("channel-2", "INFO")
		qm.Enqueue(notif)
	}

	// Flush all
	ctx := context.Background()
	err := qm.FlushAll(ctx)
	require.NoError(t, err)

	// All queues should be cleared
	assert.Equal(t, 0, qm.GetQueuedCount("channel-1"))
	assert.Equal(t, 0, qm.GetQueuedCount("channel-2"))

	// Delivery should have been called with all 8 notifications
	deliveries := mockCallback.getDeliveries()
	require.Len(t, deliveries, 1)
	assert.Len(t, deliveries[0], 8)
}

func TestFlushAll_NoCallback(t *testing.T) {
	clock := NewMockClock(time.Time{})
	qm := NewQuietHoursQueueManager(WithQuietHoursClock(clock))
	defer qm.Close()

	// Add notification
	notif := createTestNotification("channel-1", "WARNING")
	qm.Enqueue(notif)

	// Flush without callback should error
	ctx := context.Background()
	err := qm.FlushAll(ctx)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "no delivery callback")
}

func TestFlushAll_EmptyQueues(t *testing.T) {
	clock := NewMockClock(time.Time{})
	mockCallback := &mockDeliveryCallback{}
	qm := NewQuietHoursQueueManager(
		WithQuietHoursClock(clock),
		WithDeliveryCallback(mockCallback.callback),
	)
	defer qm.Close()

	// Flush with no queued notifications
	ctx := context.Background()
	err := qm.FlushAll(ctx)
	require.NoError(t, err)

	// No delivery should have been called
	assert.Equal(t, 0, mockCallback.getDeliveryCount())
}

// -----------------------------------------------------------------------------
// Config Management Tests
// -----------------------------------------------------------------------------

func TestUpdateConfig(t *testing.T) {
	clock := NewMockClock(time.Time{})
	initialConfig := QuietHoursConfig{
		StartTime:      "22:00",
		EndTime:        "07:00",
		Timezone:       "UTC",
		BypassCritical: true,
	}

	qm := NewQuietHoursQueueManager(
		WithQuietHoursClock(clock),
		WithQuietHoursConfig(initialConfig),
	)
	defer qm.Close()

	// Verify initial config
	config := qm.GetConfig()
	assert.Equal(t, "22:00", config.StartTime)

	// Update config
	newConfig := QuietHoursConfig{
		StartTime:      "23:00",
		EndTime:        "08:00",
		Timezone:       "America/New_York",
		BypassCritical: false,
	}
	qm.UpdateConfig(newConfig)

	// Verify updated config
	config = qm.GetConfig()
	assert.Equal(t, "23:00", config.StartTime)
	assert.Equal(t, "08:00", config.EndTime)
	assert.Equal(t, "America/New_York", config.Timezone)
	assert.False(t, config.BypassCritical)
}

// -----------------------------------------------------------------------------
// Close Tests
// -----------------------------------------------------------------------------

func TestClose_StopsWorker(t *testing.T) {
	clock := NewMockClock(time.Time{})
	qm := NewQuietHoursQueueManager(WithQuietHoursClock(clock))

	// Close should not hang
	qm.Close()

	// Calling Close again should be safe
	qm.Close()
}

// -----------------------------------------------------------------------------
// Integration Tests
// -----------------------------------------------------------------------------

func TestIntegration_FullWorkflow(t *testing.T) {
	// Start at 23:00 (in quiet hours: 22:00-07:00)
	startTime := time.Date(2024, 1, 15, 23, 0, 0, 0, time.UTC)
	clock := NewMockClock(startTime)

	config := QuietHoursConfig{
		StartTime:      "22:00",
		EndTime:        "07:00",
		Timezone:       "UTC",
		BypassCritical: true,
	}

	mockCallback := &mockDeliveryCallback{}
	qm := NewQuietHoursQueueManager(
		WithQuietHoursClock(clock),
		WithQuietHoursConfig(config),
		WithDeliveryCallback(mockCallback.callback),
	)
	defer qm.Close()

	// Check should queue
	shouldQueue, _ := qm.ShouldQueue("WARNING")
	assert.True(t, shouldQueue)

	// Add 10 notifications
	for i := 0; i < 10; i++ {
		notif := createTestNotification("ntfy-channel", "WARNING")
		err := qm.Enqueue(notif)
		require.NoError(t, err)
	}
	assert.Equal(t, 10, qm.GetQueuedCount("ntfy-channel"))

	// Advance to end of quiet hours (08:00)
	clock.Advance(9 * time.Hour)

	// Check should not queue anymore
	shouldQueue, _ = qm.ShouldQueue("WARNING")
	assert.False(t, shouldQueue)

	// Process queues (simulates worker)
	qm.processQueues()

	// Wait for async delivery
	time.Sleep(100 * time.Millisecond)

	// Queue should be empty
	assert.Equal(t, 0, qm.GetQueuedCount("ntfy-channel"))

	// Delivery should have been called once with 10 notifications
	deliveries := mockCallback.getDeliveries()
	require.Len(t, deliveries, 1)
	assert.Len(t, deliveries[0], 10)
}
