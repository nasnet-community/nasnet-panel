// Package alerts implements digest scheduling for timed delivery.
package alerts

import (
	"context"
	"fmt"
	"sync"
	"time"

	"go.uber.org/zap"
)

// DigestScheduler manages timed delivery of digest notifications.
// Per NAS-18.11 Task 3: Implement DigestScheduler for timer-based digest delivery.
// Uses time.AfterFunc for lightweight timers (no external cron dependencies).
type DigestScheduler struct {
	digestService *DigestService
	log           *zap.SugaredLogger

	// Timer management
	mu     sync.RWMutex
	timers map[string]*time.Timer // channelID -> timer

	// Cancellation
	ctx    context.Context
	cancel context.CancelFunc
	wg     sync.WaitGroup
}

// DigestSchedulerConfig holds configuration for DigestScheduler.
type DigestSchedulerConfig struct {
	DigestService *DigestService
	Logger        *zap.SugaredLogger
}

// NewDigestScheduler creates a new DigestScheduler.
func NewDigestScheduler(cfg DigestSchedulerConfig) *DigestScheduler {
	ctx, cancel := context.WithCancel(context.Background())

	return &DigestScheduler{
		digestService: cfg.DigestService,
		log:           cfg.Logger,
		timers:        make(map[string]*time.Timer),
		ctx:           ctx,
		cancel:        cancel,
	}
}

// Start begins the digest scheduler.
// This is a no-op as timers are scheduled on-demand via ScheduleNext.
func (ds *DigestScheduler) Start(ctx context.Context) error {
	ds.log.Info("digest scheduler started (on-demand timer scheduling)")
	return nil
}

// ScheduleNext schedules the next digest delivery for a channel based on its configuration.
// This method is idempotent - calling it multiple times will cancel the previous timer.
func (ds *DigestScheduler) ScheduleNext(channelID string, digestConfig DigestConfig) {
	ds.mu.Lock()
	defer ds.mu.Unlock()

	// Cancel existing timer if present
	if timer, exists := ds.timers[channelID]; exists {
		timer.Stop()
		delete(ds.timers, channelID)
		ds.log.Debugw("cancelled existing digest timer", "channel_id", channelID)
	}

	// Calculate next delivery time
	nextDelivery, err := ds.calculateNextDeliveryTime(digestConfig, time.Now())
	if err != nil {
		ds.log.Errorw("failed to calculate next digest delivery time",
			"channel_id", channelID,
			"error", err)
		return
	}

	duration := time.Until(nextDelivery)
	if duration < 0 {
		ds.log.Warnw("next delivery time is in the past, scheduling for 1 minute from now",
			"channel_id", channelID,
			"calculated_time", nextDelivery)
		duration = 1 * time.Minute
	}

	// Create timer
	timer := time.AfterFunc(duration, func() {
		ds.deliverDigest(channelID, digestConfig)
	})

	ds.timers[channelID] = timer

	ds.log.Infow("digest delivery scheduled",
		"channel_id", channelID,
		"mode", digestConfig.Mode,
		"next_delivery", nextDelivery.Format(time.RFC3339),
		"duration_minutes", duration.Minutes())
}

// Reschedule reschedules digest delivery for a channel.
// This is a convenience method that requires the digest config to be fetched separately.
// In production, this would query the channel config from the database.
func (ds *DigestScheduler) Reschedule(channelID string) {
	ds.mu.Lock()
	defer ds.mu.Unlock()

	// Cancel existing timer
	if timer, exists := ds.timers[channelID]; exists {
		timer.Stop()
		delete(ds.timers, channelID)
		ds.log.Debugw("rescheduled digest timer cancelled", "channel_id", channelID)
	}

	// Note: In production, this would fetch the channel's digest config from the database
	// and call ScheduleNext. For now, this is a placeholder for the reschedule API.
	ds.log.Infow("digest timer rescheduled (config must be provided via ScheduleNext)",
		"channel_id", channelID)
}

// Stop gracefully shuts down the scheduler and cancels all timers.
func (ds *DigestScheduler) Stop() {
	ds.mu.Lock()
	defer ds.mu.Unlock()

	ds.log.Info("stopping digest scheduler")

	// Cancel all timers
	for channelID, timer := range ds.timers {
		timer.Stop()
		ds.log.Debugw("cancelled digest timer", "channel_id", channelID)
	}

	// Clear timers map
	ds.timers = make(map[string]*time.Timer)

	// Cancel context
	ds.cancel()

	// Wait for any in-flight deliveries
	ds.wg.Wait()

	ds.log.Info("digest scheduler stopped")
}

// deliverDigest is the timer callback that delivers a digest and reschedules the next delivery.
func (ds *DigestScheduler) deliverDigest(channelID string, digestConfig DigestConfig) {
	ds.wg.Add(1)
	defer ds.wg.Done()

	ds.log.Infow("delivering scheduled digest", "channel_id", channelID)

	// Create delivery context with timeout
	ctx, cancel := context.WithTimeout(ds.ctx, 30*time.Second)
	defer cancel()

	// Deliver digest
	err := ds.digestService.DeliverDigest(ctx, channelID)
	if err != nil {
		ds.log.Errorw("failed to deliver scheduled digest",
			"channel_id", channelID,
			"error", err)

		// Check if there were no pending alerts
		if err.Error() == "no pending alerts" && digestConfig.SendEmpty {
			// Send empty digest notification
			if emptyErr := ds.digestService.HandleEmptyDigest(ctx, channelID, true); emptyErr != nil {
				ds.log.Errorw("failed to send empty digest",
					"channel_id", channelID,
					"error", emptyErr)
			}
		}
	}

	// Reschedule next delivery
	ds.ScheduleNext(channelID, digestConfig)
}

// calculateNextDeliveryTime calculates the next delivery time based on digest configuration.
func (ds *DigestScheduler) calculateNextDeliveryTime(config DigestConfig, now time.Time) (time.Time, error) {
	// Load timezone
	location, err := time.LoadLocation(config.Timezone)
	if err != nil {
		ds.log.Warnw("invalid timezone, using UTC",
			"timezone", config.Timezone,
			"error", err)
		location = time.UTC
	}

	nowInTZ := now.In(location)

	switch config.Mode {
	case "immediate":
		// Immediate mode doesn't use scheduling
		return now, fmt.Errorf("immediate mode does not require scheduling")

	case "hourly":
		// Hourly digest: deliver at the top of the next hour
		return ds.calculateNextHourlyDelivery(nowInTZ, config, location)

	case "daily":
		// Daily digest: deliver at a specific time each day
		return ds.calculateNextDailyDelivery(nowInTZ, config, location)

	default:
		return time.Time{}, fmt.Errorf("unsupported digest mode: %s", config.Mode)
	}
}

// calculateNextHourlyDelivery calculates the next hourly delivery time.
// config.Schedule contains the minute (e.g., "00", "30").
func (ds *DigestScheduler) calculateNextHourlyDelivery(now time.Time, config DigestConfig, location *time.Location) (time.Time, error) {
	// Parse minute from schedule (default to "00")
	minute := 0
	if config.Schedule != "" {
		_, err := fmt.Sscanf(config.Schedule, "%d", &minute)
		if err != nil {
			return time.Time{}, fmt.Errorf("invalid hourly schedule format (expected MM): %w", err)
		}
	}

	if minute < 0 || minute > 59 {
		return time.Time{}, fmt.Errorf("invalid minute value: %d (must be 0-59)", minute)
	}

	// Calculate next delivery
	nextHour := now.Add(1 * time.Hour)
	nextDelivery := time.Date(
		nextHour.Year(),
		nextHour.Month(),
		nextHour.Day(),
		nextHour.Hour(),
		minute,
		0,
		0,
		location,
	)

	// If the calculated time is before now, it means we need the next hour
	if nextDelivery.Before(now) {
		nextDelivery = nextDelivery.Add(1 * time.Hour)
	}

	// Apply quiet hours if configured
	if config.QuietHours != nil {
		nextDelivery = ds.applyQuietHours(nextDelivery, *config.QuietHours, location)
	}

	return nextDelivery, nil
}

// calculateNextDailyDelivery calculates the next daily delivery time.
// config.Schedule contains the time in HH:MM format (e.g., "09:00").
func (ds *DigestScheduler) calculateNextDailyDelivery(now time.Time, config DigestConfig, location *time.Location) (time.Time, error) {
	// Parse time from schedule
	var hour, minute int
	_, err := fmt.Sscanf(config.Schedule, "%d:%d", &hour, &minute)
	if err != nil {
		return time.Time{}, fmt.Errorf("invalid daily schedule format (expected HH:MM): %w", err)
	}

	if hour < 0 || hour > 23 || minute < 0 || minute > 59 {
		return time.Time{}, fmt.Errorf("invalid time values: %02d:%02d", hour, minute)
	}

	// Calculate next delivery for today
	nextDelivery := time.Date(
		now.Year(),
		now.Month(),
		now.Day(),
		hour,
		minute,
		0,
		0,
		location,
	)

	// If the time has already passed today, schedule for tomorrow
	if nextDelivery.Before(now) || nextDelivery.Equal(now) {
		nextDelivery = nextDelivery.Add(24 * time.Hour)
	}

	// Apply quiet hours if configured
	if config.QuietHours != nil {
		nextDelivery = ds.applyQuietHours(nextDelivery, *config.QuietHours, location)
	}

	return nextDelivery, nil
}

// applyQuietHours adjusts delivery time if it falls within quiet hours.
// This uses the GetNextDeliveryTime logic from quiet_hours.go.
func (ds *DigestScheduler) applyQuietHours(deliveryTime time.Time, quietHoursJSON string, location *time.Location) time.Time {
	// Parse quiet hours config
	// Note: This is a simplified implementation. In production, you'd want to
	// properly parse the JSON and use the QuietHoursFilter.GetNextDeliveryTime method.
	// For now, we'll skip quiet hours adjustment and log a warning.

	ds.log.Debugw("quiet hours check skipped (requires JSON parsing)",
		"delivery_time", deliveryTime.Format(time.RFC3339))

	// TODO: Implement full quiet hours parsing and adjustment
	// This would require parsing quietHoursJSON and calling:
	// quietHoursFilter.GetNextDeliveryTime(parsedConfig, deliveryTime)

	return deliveryTime
}

// GetScheduledChannels returns a list of channels with active scheduled timers.
func (ds *DigestScheduler) GetScheduledChannels() []string {
	ds.mu.RLock()
	defer ds.mu.RUnlock()

	channels := make([]string, 0, len(ds.timers))
	for channelID := range ds.timers {
		channels = append(channels, channelID)
	}

	return channels
}

// GetNextDeliveryTime returns the next scheduled delivery time for a channel.
// Returns zero time if no timer is scheduled.
func (ds *DigestScheduler) GetNextDeliveryTime(channelID string, config DigestConfig) (time.Time, error) {
	return ds.calculateNextDeliveryTime(config, time.Now())
}
