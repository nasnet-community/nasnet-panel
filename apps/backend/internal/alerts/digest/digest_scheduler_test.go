package digest

import (
	"context"
	"sync"
	"testing"
	"time"

	"backend/generated/ent/enttest"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
	"go.uber.org/zap"

	_ "github.com/mattn/go-sqlite3"
)

// setupDigestScheduler creates a DigestScheduler with test dependencies.
func setupDigestScheduler(t *testing.T) (*DigestScheduler, *DigestService, *mockDispatcher) {
	db := enttest.Open(t, "sqlite3", "file:scheduler?mode=memory&cache=shared&_fk=1")
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

	return scheduler, digestService, dispatcher
}

// TestScheduleNext_DailyAt0900 verifies daily digest is scheduled for next 9:00 AM in timezone.
func TestScheduleNext_DailyAt0900(t *testing.T) {
	scheduler, _, _ := setupDigestScheduler(t)

	config := DigestConfig{
		Mode:     "daily",
		Schedule: "09:00",
		Timezone: "America/New_York",
	}

	channelID := "channel-daily"

	// Schedule next delivery
	scheduler.ScheduleNext(channelID, config)

	// Verify timer was created
	scheduler.mu.RLock()
	timer, exists := scheduler.timers[channelID]
	scheduler.mu.RUnlock()

	assert.True(t, exists, "timer should be created")
	assert.NotNil(t, timer)

	// Calculate expected next delivery
	location, err := time.LoadLocation(config.Timezone)
	require.NoError(t, err)

	now := time.Now().In(location)
	expectedNext := time.Date(now.Year(), now.Month(), now.Day(), 9, 0, 0, 0, location)
	if expectedNext.Before(now) || expectedNext.Equal(now) {
		expectedNext = expectedNext.Add(24 * time.Hour)
	}

	// Verify next delivery time
	nextDelivery, err := scheduler.GetNextDeliveryTime(channelID, config)
	require.NoError(t, err)
	assert.WithinDuration(t, expectedNext, nextDelivery, 2*time.Second)
}

// TestScheduleNext_IntervalBased verifies hourly digest scheduling.
func TestScheduleNext_IntervalBased(t *testing.T) {
	scheduler, _, _ := setupDigestScheduler(t)

	tests := []struct {
		name     string
		schedule string
		minute   int
	}{
		{
			name:     "hourly at :00",
			schedule: "00",
			minute:   0,
		},
		{
			name:     "hourly at :15",
			schedule: "15",
			minute:   15,
		},
		{
			name:     "hourly at :30",
			schedule: "30",
			minute:   30,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			config := DigestConfig{
				Mode:     "hourly",
				Schedule: tt.schedule,
				Timezone: "UTC",
			}

			channelID := "channel-hourly-" + tt.schedule

			// Schedule next delivery
			scheduler.ScheduleNext(channelID, config)

			// Verify timer was created
			scheduler.mu.RLock()
			_, exists := scheduler.timers[channelID]
			scheduler.mu.RUnlock()

			assert.True(t, exists, "timer should be created")

			// Verify next delivery time
			nextDelivery, err := scheduler.GetNextDeliveryTime(channelID, config)
			require.NoError(t, err)
			assert.Equal(t, tt.minute, nextDelivery.Minute())
		})
	}
}

// TestReschedule_CancelsOldTimer verifies old timer is stopped when rescheduling.
func TestReschedule_CancelsOldTimer(t *testing.T) {
	scheduler, _, _ := setupDigestScheduler(t)

	config := DigestConfig{
		Mode:     "daily",
		Schedule: "10:00",
		Timezone: "UTC",
	}

	channelID := "channel-reschedule"

	// Schedule initial delivery
	scheduler.ScheduleNext(channelID, config)

	// Verify timer was created
	scheduler.mu.RLock()
	firstTimer, exists := scheduler.timers[channelID]
	scheduler.mu.RUnlock()
	require.True(t, exists)
	require.NotNil(t, firstTimer)

	// Reschedule with new time
	newConfig := DigestConfig{
		Mode:     "daily",
		Schedule: "15:00",
		Timezone: "UTC",
	}
	scheduler.ScheduleNext(channelID, newConfig)

	// Verify new timer was created
	scheduler.mu.RLock()
	secondTimer, exists := scheduler.timers[channelID]
	scheduler.mu.RUnlock()
	require.True(t, exists)
	require.NotNil(t, secondTimer)

	// Note: We can't directly verify the old timer was stopped,
	// but we verify a new timer was created in its place
	assert.NotEqual(t, firstTimer, secondTimer, "timer should be replaced")
}

// TestReschedule_API verifies Reschedule method cancels timer.
func TestReschedule_API(t *testing.T) {
	scheduler, _, _ := setupDigestScheduler(t)

	config := DigestConfig{
		Mode:     "hourly",
		Schedule: "00",
		Timezone: "UTC",
	}

	channelID := "channel-reschedule-api"

	// Schedule initial delivery
	scheduler.ScheduleNext(channelID, config)

	// Verify timer exists
	scheduler.mu.RLock()
	_, exists := scheduler.timers[channelID]
	scheduler.mu.RUnlock()
	require.True(t, exists)

	// Call Reschedule (which cancels but doesn't recreate)
	scheduler.Reschedule(channelID)

	// Verify timer was cancelled
	scheduler.mu.RLock()
	_, exists = scheduler.timers[channelID]
	scheduler.mu.RUnlock()
	assert.False(t, exists, "timer should be cancelled after Reschedule")
}

// TestStop_CancelsAllTimers verifies all timers are cancelled on stop.
func TestStop_CancelsAllTimers(t *testing.T) {
	scheduler, _, _ := setupDigestScheduler(t)

	config := DigestConfig{
		Mode:     "daily",
		Schedule: "09:00",
		Timezone: "UTC",
	}

	// Schedule multiple channels
	channels := []string{"channel-1", "channel-2", "channel-3"}
	for _, channelID := range channels {
		scheduler.ScheduleNext(channelID, config)
	}

	// Verify all timers exist
	scheduler.mu.RLock()
	timerCount := len(scheduler.timers)
	scheduler.mu.RUnlock()
	assert.Equal(t, 3, timerCount)

	// Stop scheduler
	scheduler.Stop()

	// Verify all timers were cancelled
	scheduler.mu.RLock()
	timerCount = len(scheduler.timers)
	scheduler.mu.RUnlock()
	assert.Equal(t, 0, timerCount, "all timers should be cancelled")
}

// TestConcurrentQueueAlert verifies goroutine safety during concurrent scheduling.
func TestConcurrentQueueAlert(t *testing.T) {
	scheduler, _, _ := setupDigestScheduler(t)

	config := DigestConfig{
		Mode:     "hourly",
		Schedule: "00",
		Timezone: "UTC",
	}

	// Run concurrent scheduling operations
	var wg sync.WaitGroup
	concurrency := 10
	iterations := 20

	for i := 0; i < concurrency; i++ {
		wg.Add(1)
		go func(workerID int) {
			defer wg.Done()

			for j := 0; j < iterations; j++ {
				channelID := "channel-concurrent"

				// Randomly schedule or reschedule
				if j%2 == 0 {
					scheduler.ScheduleNext(channelID, config)
				} else {
					scheduler.Reschedule(channelID)
				}

				// Small delay to increase interleaving
				time.Sleep(time.Microsecond)
			}
		}(i)
	}

	// Wait for all goroutines
	wg.Wait()

	// Verify scheduler is still functional
	scheduler.mu.RLock()
	timerCount := len(scheduler.timers)
	scheduler.mu.RUnlock()

	// Should have at most 1 timer (all concurrent ops were on same channel)
	assert.LessOrEqual(t, timerCount, 1, "concurrent operations should not corrupt state")
}

// TestScheduleNext_ImmediateModeReturnsError verifies immediate mode doesn't schedule.
func TestScheduleNext_ImmediateModeReturnsError(t *testing.T) {
	scheduler, _, _ := setupDigestScheduler(t)

	config := DigestConfig{
		Mode:     "immediate",
		Timezone: "UTC",
	}

	channelID := "channel-immediate"

	// Attempt to schedule (should log error but not panic)
	scheduler.ScheduleNext(channelID, config)

	// Verify no timer was created
	scheduler.mu.RLock()
	_, exists := scheduler.timers[channelID]
	scheduler.mu.RUnlock()

	assert.False(t, exists, "immediate mode should not create timer")
}

// TestGetScheduledChannels verifies list of scheduled channels.
func TestGetScheduledChannels(t *testing.T) {
	scheduler, _, _ := setupDigestScheduler(t)

	config := DigestConfig{
		Mode:     "daily",
		Schedule: "09:00",
		Timezone: "UTC",
	}

	// Initially no channels
	channels := scheduler.GetScheduledChannels()
	assert.Empty(t, channels)

	// Schedule multiple channels
	expectedChannels := []string{"channel-a", "channel-b", "channel-c"}
	for _, channelID := range expectedChannels {
		scheduler.ScheduleNext(channelID, config)
	}

	// Verify all channels are listed
	channels = scheduler.GetScheduledChannels()
	assert.Len(t, channels, 3)

	// Verify all expected channels are present (order may vary)
	for _, expected := range expectedChannels {
		assert.Contains(t, channels, expected)
	}
}

// TestCalculateNextDeliveryTime_InvalidTimezone verifies fallback to UTC.
func TestCalculateNextDeliveryTime_InvalidTimezone(t *testing.T) {
	scheduler, _, _ := setupDigestScheduler(t)

	config := DigestConfig{
		Mode:     "daily",
		Schedule: "09:00",
		Timezone: "Invalid/Timezone",
	}

	now := time.Now()

	// Should fallback to UTC and not error
	nextDelivery, err := scheduler.calculateNextDeliveryTime(config, now)
	require.NoError(t, err)
	assert.Equal(t, "UTC", nextDelivery.Location().String())
}

// TestCalculateNextDeliveryTime_DailyInvalidSchedule verifies error on invalid schedule.
func TestCalculateNextDeliveryTime_DailyInvalidSchedule(t *testing.T) {
	scheduler, _, _ := setupDigestScheduler(t)

	tests := []struct {
		name     string
		schedule string
	}{
		{name: "invalid format", schedule: "not-a-time"},
		{name: "invalid hour", schedule: "25:00"},
		{name: "invalid minute", schedule: "09:99"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			config := DigestConfig{
				Mode:     "daily",
				Schedule: tt.schedule,
				Timezone: "UTC",
			}

			now := time.Now()
			_, err := scheduler.calculateNextDeliveryTime(config, now)
			assert.Error(t, err)
		})
	}
}

// TestCalculateNextDeliveryTime_HourlyInvalidSchedule verifies error on invalid minute.
func TestCalculateNextDeliveryTime_HourlyInvalidSchedule(t *testing.T) {
	scheduler, _, _ := setupDigestScheduler(t)

	tests := []struct {
		name     string
		schedule string
	}{
		{name: "invalid minute", schedule: "99"},
		{name: "negative minute", schedule: "-1"},
		{name: "non-numeric", schedule: "abc"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			config := DigestConfig{
				Mode:     "hourly",
				Schedule: tt.schedule,
				Timezone: "UTC",
			}

			now := time.Now()
			_, err := scheduler.calculateNextDeliveryTime(config, now)
			assert.Error(t, err)
		})
	}
}

// TestDeliverDigest_Integration verifies full delivery flow through scheduler.
func TestDeliverDigest_Integration(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping integration test in short mode")
	}

	scheduler, digestService, dispatcher := setupDigestScheduler(t)

	ctx := context.Background()
	channelID := "channel-integration"
	now := time.Now()

	// Create pending alert
	alert := Alert{
		ID:        "alert-scheduler-001",
		RuleID:    "rule-001",
		Severity:  "warning",
		EventType: "test.event",
		Title:     "Scheduler Test Alert",
		Message:   "Testing scheduler integration",
	}

	err := digestService.QueueAlert(ctx, alert, channelID, "email", false)
	require.NoError(t, err)

	// Mock successful dispatch
	dispatcher.On("Dispatch", mock.Anything, mock.Anything, mock.Anything).Return(
		[]notifications.DeliveryResult{
			{Channel: channelID, Success: true},
		},
	)

	// Manually trigger delivery (simulating timer callback)
	config := DigestConfig{
		Mode:     "hourly",
		Schedule: "00",
		Timezone: "UTC",
	}

	scheduler.deliverDigest(channelID, config)

	// Verify dispatcher was called
	dispatcher.AssertCalled(t, "Dispatch", mock.Anything, mock.Anything, mock.Anything)

	// Verify entry was marked as delivered
	entries, err := digestService.db.AlertDigestEntry.Query().All(ctx)
	require.NoError(t, err)
	require.Len(t, entries, 1)
	assert.NotNil(t, entries[0].DeliveredAt, "entry should be marked as delivered")
}
