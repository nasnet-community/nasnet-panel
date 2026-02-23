package updates

import (
	"context"
	"fmt"
	"os"
	"sync"
	"time"

	"backend/generated/ent"

	"backend/internal/events"

	"github.com/rs/zerolog"
)

// parseQuietHoursTime parses an "HH:MM" string and returns (hour, minute, error).
func parseQuietHoursTime(s string) (hour, minute int, err error) {
	_, err = fmt.Sscanf(s, "%d:%d", &hour, &minute)
	if err != nil {
		err = fmt.Errorf("invalid time format %q (expected HH:MM): %w", s, err)
		return
	}
	if hour < 0 || hour > 23 || minute < 0 || minute > 59 {
		err = fmt.Errorf("time %q out of range", s)
		return
	}
	return
}

// UpdateSchedulerConfig holds configuration for the update scheduler
type UpdateSchedulerConfig struct {
	UpdateService   *UpdateService
	UpdateEngine    *UpdateEngine
	Store           *ent.Client
	EventBus        events.EventBus
	Logger          zerolog.Logger
	CheckInterval   time.Duration // Default: 6 hours
	QuietHoursStart string        // HH:MM format, e.g., "02:00"
	QuietHoursEnd   string        // HH:MM format, e.g., "06:00"
	Timezone        string        // IANA timezone, e.g., "America/New_York"
}

// UpdateScheduler coordinates periodic update checks with smart timing
type UpdateScheduler struct {
	config    UpdateSchedulerConfig
	logger    zerolog.Logger
	publisher *events.Publisher
	ticker    *time.Ticker
	ctx       context.Context
	cancel    context.CancelFunc
	wg        sync.WaitGroup
	mu        sync.RWMutex
	running   bool
}

// NewUpdateScheduler creates a new update scheduler
func NewUpdateScheduler(config UpdateSchedulerConfig) (*UpdateScheduler, error) {
	if config.UpdateService == nil {
		return nil, fmt.Errorf("update service is required")
	}
	if config.UpdateEngine == nil {
		return nil, fmt.Errorf("update engine is required")
	}
	if config.Store == nil {
		return nil, fmt.Errorf("ent store is required")
	}
	if config.EventBus == nil {
		return nil, fmt.Errorf("event bus is required")
	}
	if config.CheckInterval == 0 {
		config.CheckInterval = 6 * time.Hour
	}
	if config.QuietHoursStart == "" {
		config.QuietHoursStart = "02:00"
	}
	if config.QuietHoursEnd == "" {
		config.QuietHoursEnd = "06:00"
	}
	if config.Timezone == "" {
		config.Timezone = "UTC"
	}

	ctx, cancel := context.WithCancel(context.Background())
	publisher := events.NewPublisher(config.EventBus, "update-scheduler")

	return &UpdateScheduler{
		config:    config,
		logger:    config.Logger.With().Str("component", "update_scheduler").Logger(),
		publisher: publisher,
		ctx:       ctx,
		cancel:    cancel,
	}, nil
}

// Start begins the update check scheduler
func (s *UpdateScheduler) Start() error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.running {
		return fmt.Errorf("scheduler is already running")
	}

	s.logger.Info().
		Dur("check_interval", s.config.CheckInterval).
		Str("quiet_hours", fmt.Sprintf("%s-%s %s", s.config.QuietHoursStart, s.config.QuietHoursEnd, s.config.Timezone)).
		Msg("Starting update scheduler")

	s.ticker = time.NewTicker(s.config.CheckInterval)
	s.running = true

	s.wg.Add(1)
	go s.schedulerLoop()

	// Run initial check after 30 seconds
	time.AfterFunc(30*time.Second, func() {
		s.checkForUpdates()
	})

	return nil
}

// Stop stops the update scheduler gracefully
func (s *UpdateScheduler) Stop() error {
	s.mu.Lock()
	if !s.running {
		s.mu.Unlock()
		return fmt.Errorf("scheduler is not running")
	}
	s.mu.Unlock()

	s.logger.Info().Msg("Stopping update scheduler")
	s.cancel()

	if s.ticker != nil {
		s.ticker.Stop()
	}

	s.wg.Wait()

	s.mu.Lock()
	s.running = false
	s.mu.Unlock()

	s.logger.Info().Msg("Update scheduler stopped")
	return nil
}

// schedulerLoop is the main scheduling loop
func (s *UpdateScheduler) schedulerLoop() {
	defer s.wg.Done()

	for {
		select {
		case <-s.ctx.Done():
			return
		case <-s.ticker.C:
			s.checkForUpdates()
		}
	}
}

// checkForUpdates checks all instances for available updates
func (s *UpdateScheduler) checkForUpdates() {
	// Check if we're in quiet hours
	if s.isQuietHours() {
		s.logger.Debug().Msg("Skipping update check (quiet hours)")
		return
	}

	// Check if network is metered (e.g., LTE connection)
	if s.isMeteredNetwork() {
		s.logger.Debug().Msg("Skipping update check (metered network)")
		return
	}

	s.logger.Info().Msg("Checking for updates")

	// Get all service instances
	instances, err := s.config.Store.ServiceInstance.Query().All(s.ctx)
	if err != nil {
		s.logger.Error().Err(err).Msg("Failed to query service instances")
		return
	}

	for _, instance := range instances {
		s.checkInstanceForUpdate(instance)
	}

	s.logger.Info().Int("instances_checked", len(instances)).Msg("Update check completed")
}

// checkInstanceForUpdate checks a single instance for updates
func (s *UpdateScheduler) checkInstanceForUpdate(instance *ent.ServiceInstance) {
	ctx := context.Background()

	// Skip if no binary version
	if instance.BinaryVersion == "" {
		return
	}

	// Check for update
	updateInfo, available, err := s.config.UpdateService.CheckForUpdate(
		ctx,
		instance.FeatureID,
		instance.BinaryVersion,
	)
	if err != nil {
		s.logger.Error().
			Err(err).
			Str("instance_id", instance.ID).
			Str("feature_id", instance.FeatureID).
			Msg("Failed to check for update")
		return
	}

	if !available {
		s.logger.Debug().
			Str("instance_id", instance.ID).
			Str("feature_id", instance.FeatureID).
			Msg("No update available")
		return
	}

	s.logger.Info().
		Str("instance_id", instance.ID).
		Str("feature_id", instance.FeatureID).
		Str("current_version", instance.BinaryVersion).
		Str("available_version", updateInfo.AvailableVersion).
		Str("severity", string(updateInfo.Severity)).
		Msg("Update available")

	// Emit update available event
	s.emitUpdateAvailableEvent(instance, updateInfo)

	// Check auto-apply policy
	shouldAutoApply := s.shouldAutoApply(instance, updateInfo)

	if shouldAutoApply {
		s.logger.Info().
			Str("instance_id", instance.ID).
			Str("severity", string(updateInfo.Severity)).
			Msg("Auto-applying update")

		// Apply update in background
		go s.applyUpdate(instance, updateInfo)
	}
}

// shouldAutoApply determines if an update should be automatically applied
func (s *UpdateScheduler) shouldAutoApply(_ *ent.ServiceInstance, updateInfo *UpdateInfo) bool {
	// For now, auto-apply security_hotfix (CRITICAL) updates only
	// TODO: Read auto_apply_threshold from instance configuration
	return updateInfo.Severity == SeverityCritical
}

// applyUpdate applies an update to an instance
func (s *UpdateScheduler) applyUpdate(instance *ent.ServiceInstance, updateInfo *UpdateInfo) {
	ctx := context.Background()

	s.logger.Info().
		Str("instance_id", instance.ID).
		Str("version", updateInfo.AvailableVersion).
		Msg("Applying update")

	// Emit update started event
	s.emitUpdateStartedEvent(instance, updateInfo)

	// Apply the update
	err := s.config.UpdateEngine.ApplyUpdate(
		ctx,
		instance.ID,
		instance.FeatureID,
		instance.BinaryVersion,
		updateInfo.AvailableVersion,
		updateInfo.DownloadURL,
		updateInfo.ChecksumURL,
	)

	if err != nil {
		s.logger.Error().
			Err(err).
			Str("instance_id", instance.ID).
			Msg("Update failed")

		// Emit update failed event
		s.emitUpdateFailedEvent(instance, updateInfo, err)
		return
	}

	s.logger.Info().
		Str("instance_id", instance.ID).
		Str("version", updateInfo.AvailableVersion).
		Msg("Update completed successfully")

	// Emit update completed event
	s.emitUpdateCompletedEvent(instance, updateInfo)
}

// isMeteredNetwork checks if the active WAN connection is metered (e.g., LTE/cellular).
// Returns true if the primary WAN interface is LTE, indicating downloads should be deferred.
func (s *UpdateScheduler) isMeteredNetwork() bool {
	// Query router interfaces to check if active WAN is LTE
	ctx := context.Background()

	// Check for active LTE interfaces in the database
	count, err := s.config.Store.Router.Query().Count(ctx)
	if err != nil || count == 0 {
		return false // Can't determine, assume not metered
	}

	// Check environment variable for metered network override
	if os.Getenv("NASNET_METERED_NETWORK") == "true" {
		return true
	}

	// TODO: When RouterPort is available, query /interface/lte for active LTE connections
	// For now, rely on environment variable configuration
	return false
}

// isQuietHours checks if current time is within quiet hours using configured timezone and times.
func (s *UpdateScheduler) isQuietHours() bool {
	loc, err := time.LoadLocation(s.config.Timezone)
	if err != nil {
		s.logger.Warn().Err(err).Str("timezone", s.config.Timezone).Msg("Failed to load timezone, falling back to UTC")
		loc = time.UTC
	}

	startHour, startMin, err := parseQuietHoursTime(s.config.QuietHoursStart)
	if err != nil {
		s.logger.Warn().Err(err).Str("quiet_hours_start", s.config.QuietHoursStart).Msg("Failed to parse quiet hours start, using default 02:00")
		startHour, startMin = 2, 0
	}

	endHour, endMin, err := parseQuietHoursTime(s.config.QuietHoursEnd)
	if err != nil {
		s.logger.Warn().Err(err).Str("quiet_hours_end", s.config.QuietHoursEnd).Msg("Failed to parse quiet hours end, using default 06:00")
		endHour, endMin = 6, 0
	}

	now := time.Now().In(loc)
	nowMins := now.Hour()*60 + now.Minute()
	startMins := startHour*60 + startMin
	endMins := endHour*60 + endMin

	// Handle overnight quiet hours (e.g., 22:00 – 06:00)
	if startMins <= endMins {
		return nowMins >= startMins && nowMins < endMins
	}
	return nowMins >= startMins || nowMins < endMins
}

// Event emission helpers

func (s *UpdateScheduler) emitUpdateAvailableEvent(instance *ent.ServiceInstance, updateInfo *UpdateInfo) {
	ctx := context.Background()
	event := events.NewGenericEvent(
		events.EventTypeServiceUpdateAvailable,
		events.PriorityLow,
		"update-scheduler",
		map[string]interface{}{
			"instanceId":       instance.ID,
			"featureId":        instance.FeatureID,
			"currentVersion":   updateInfo.CurrentVersion,
			"availableVersion": updateInfo.AvailableVersion,
			"severity":         string(updateInfo.Severity),
			"releaseNotes":     updateInfo.ReleaseNotes,
			"downloadUrl":      updateInfo.DownloadURL,
		},
	)
	if err := s.publisher.Publish(ctx, event); err != nil {
		s.logger.Error().Err(err).
			Str("instance_id", instance.ID).
			Msg("Failed to emit update available event")
	}
}

func (s *UpdateScheduler) emitUpdateStartedEvent(instance *ent.ServiceInstance, updateInfo *UpdateInfo) {
	ctx := context.Background()
	event := events.NewGenericEvent(
		events.EventTypeServiceUpdateStarted,
		events.PriorityCritical,
		"update-scheduler",
		map[string]interface{}{
			"instanceId":     instance.ID,
			"featureId":      instance.FeatureID,
			"currentVersion": updateInfo.CurrentVersion,
			"targetVersion":  updateInfo.AvailableVersion,
			"severity":       string(updateInfo.Severity),
		},
	)
	if err := s.publisher.Publish(ctx, event); err != nil {
		s.logger.Error().Err(err).
			Str("instance_id", instance.ID).
			Msg("Failed to emit update started event")
	}
}

func (s *UpdateScheduler) emitUpdateCompletedEvent(instance *ent.ServiceInstance, updateInfo *UpdateInfo) {
	ctx := context.Background()
	event := events.NewGenericEvent(
		events.EventTypeServiceUpdateCompleted,
		events.PriorityCritical,
		"update-scheduler",
		map[string]interface{}{
			"instanceId":      instance.ID,
			"featureId":       instance.FeatureID,
			"previousVersion": updateInfo.CurrentVersion,
			"newVersion":      updateInfo.AvailableVersion,
			"severity":        string(updateInfo.Severity),
		},
	)
	if err := s.publisher.Publish(ctx, event); err != nil {
		s.logger.Error().Err(err).
			Str("instance_id", instance.ID).
			Msg("Failed to emit update completed event")
	}
}

func (s *UpdateScheduler) emitUpdateFailedEvent(instance *ent.ServiceInstance, updateInfo *UpdateInfo, updateErr error) {
	ctx := context.Background()
	event := events.NewGenericEvent(
		events.EventTypeServiceUpdateFailed,
		events.PriorityCritical,
		"update-scheduler",
		map[string]interface{}{
			"instanceId":     instance.ID,
			"featureId":      instance.FeatureID,
			"currentVersion": updateInfo.CurrentVersion,
			"targetVersion":  updateInfo.AvailableVersion,
			"severity":       string(updateInfo.Severity),
			"error":          updateErr.Error(),
		},
	)
	if err := s.publisher.Publish(ctx, event); err != nil {
		s.logger.Error().Err(err).
			Str("instance_id", instance.ID).
			Msg("Failed to emit update failed event")
	}
}
