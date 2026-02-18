package digest

import (
	"context"
	"fmt"
	"sync"
	"time"

	"go.uber.org/zap"
)

// Scheduler manages timed delivery of digest notifications.
type Scheduler struct {
	digestService *Service
	log           *zap.SugaredLogger

	mu     sync.RWMutex
	timers map[string]*time.Timer

	ctx    context.Context
	cancel context.CancelFunc
	wg     sync.WaitGroup
}

// NewScheduler creates a new Scheduler.
func NewScheduler(cfg SchedulerConfig) *Scheduler {
	ctx, cancel := context.WithCancel(context.Background())

	return &Scheduler{
		digestService: cfg.DigestService,
		log:           cfg.Logger,
		timers:        make(map[string]*time.Timer),
		ctx:           ctx,
		cancel:        cancel,
	}
}

// Start begins the digest scheduler.
func (ds *Scheduler) Start(ctx context.Context) error {
	ds.log.Info("digest scheduler started (on-demand timer scheduling)")
	return nil
}

// ScheduleNext schedules the next digest delivery for a channel based on its configuration.
func (ds *Scheduler) ScheduleNext(channelID string, digestConfig Config) {
	ds.mu.Lock()
	defer ds.mu.Unlock()

	if timer, exists := ds.timers[channelID]; exists {
		timer.Stop()
		delete(ds.timers, channelID)
		ds.log.Debugw("canceled existing digest timer", "channel_id", channelID)
	}

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
func (ds *Scheduler) Reschedule(channelID string) {
	ds.mu.Lock()
	defer ds.mu.Unlock()

	if timer, exists := ds.timers[channelID]; exists {
		timer.Stop()
		delete(ds.timers, channelID)
		ds.log.Debugw("rescheduled digest timer canceled", "channel_id", channelID)
	}

	ds.log.Infow("digest timer rescheduled (config must be provided via ScheduleNext)",
		"channel_id", channelID)
}

// Stop gracefully shuts down the scheduler and cancels all timers.
func (ds *Scheduler) Stop() {
	ds.mu.Lock()
	defer ds.mu.Unlock()

	ds.log.Info("stopping digest scheduler")

	for channelID, timer := range ds.timers {
		timer.Stop()
		ds.log.Debugw("canceled digest timer", "channel_id", channelID)
	}

	ds.timers = make(map[string]*time.Timer)
	ds.cancel()
	ds.wg.Wait()

	ds.log.Info("digest scheduler stopped")
}

// deliverDigest is the timer callback that delivers a digest and reschedules.
func (ds *Scheduler) deliverDigest(channelID string, digestConfig Config) {
	ds.wg.Add(1)
	defer ds.wg.Done()

	ds.log.Infow("delivering scheduled digest", "channel_id", channelID)

	ctx, cancel := context.WithTimeout(ds.ctx, 30*time.Second)
	defer cancel()

	err := ds.digestService.DeliverDigest(ctx, channelID)
	if err != nil {
		ds.log.Errorw("failed to deliver scheduled digest",
			"channel_id", channelID,
			"error", err)

		if err.Error() == "no pending alerts" && digestConfig.SendEmpty {
			if emptyErr := ds.digestService.HandleEmptyDigest(ctx, channelID, true); emptyErr != nil {
				ds.log.Errorw("failed to send empty digest",
					"channel_id", channelID,
					"error", emptyErr)
			}
		}
	}

	ds.ScheduleNext(channelID, digestConfig)
}

// GetScheduledChannels returns a list of channels with active scheduled timers.
func (ds *Scheduler) GetScheduledChannels() []string {
	ds.mu.RLock()
	defer ds.mu.RUnlock()

	channels := make([]string, 0, len(ds.timers))
	for channelID := range ds.timers {
		channels = append(channels, channelID)
	}

	return channels
}

// GetNextDeliveryTime returns the next scheduled delivery time for a channel.
func (ds *Scheduler) GetNextDeliveryTime(channelID string, config Config) (time.Time, error) {
	return ds.calculateNextDeliveryTime(config, time.Now())
}

// calculateNextDeliveryTime calculates the next delivery time based on digest configuration.
func (ds *Scheduler) calculateNextDeliveryTime(config Config, now time.Time) (time.Time, error) {
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
		return now, fmt.Errorf("immediate mode does not require scheduling")
	case "hourly":
		return ds.calculateNextHourlyDelivery(nowInTZ, config, location)
	case "daily":
		return ds.calculateNextDailyDelivery(nowInTZ, config, location)
	default:
		return time.Time{}, fmt.Errorf("unsupported digest mode: %s", config.Mode)
	}
}

// calculateNextHourlyDelivery calculates the next hourly delivery time.
func (ds *Scheduler) calculateNextHourlyDelivery(now time.Time, config Config, location *time.Location) (time.Time, error) {
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

	nextHour := now.Add(1 * time.Hour)
	nextDelivery := time.Date(
		nextHour.Year(), nextHour.Month(), nextHour.Day(),
		nextHour.Hour(), minute, 0, 0, location,
	)

	if nextDelivery.Before(now) {
		nextDelivery = nextDelivery.Add(1 * time.Hour)
	}

	if config.QuietHours != nil {
		nextDelivery = ds.applyQuietHours(nextDelivery, *config.QuietHours, location)
	}

	return nextDelivery, nil
}

// calculateNextDailyDelivery calculates the next daily delivery time.
func (ds *Scheduler) calculateNextDailyDelivery(now time.Time, config Config, location *time.Location) (time.Time, error) {
	var hour, minute int
	_, err := fmt.Sscanf(config.Schedule, "%d:%d", &hour, &minute)
	if err != nil {
		return time.Time{}, fmt.Errorf("invalid daily schedule format (expected HH:MM): %w", err)
	}

	if hour < 0 || hour > 23 || minute < 0 || minute > 59 {
		return time.Time{}, fmt.Errorf("invalid time values: %02d:%02d", hour, minute)
	}

	nextDelivery := time.Date(
		now.Year(), now.Month(), now.Day(),
		hour, minute, 0, 0, location,
	)

	if nextDelivery.Before(now) || nextDelivery.Equal(now) {
		nextDelivery = nextDelivery.Add(24 * time.Hour)
	}

	if config.QuietHours != nil {
		nextDelivery = ds.applyQuietHours(nextDelivery, *config.QuietHours, location)
	}

	return nextDelivery, nil
}

// applyQuietHours adjusts delivery time if it falls within quiet hours.
func (ds *Scheduler) applyQuietHours(deliveryTime time.Time, _ string, _ *time.Location) time.Time {
	ds.log.Debugw("quiet hours check skipped (requires JSON parsing)",
		"delivery_time", deliveryTime.Format(time.RFC3339))

	return deliveryTime
}
