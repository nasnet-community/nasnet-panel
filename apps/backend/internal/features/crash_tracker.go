package features

import (
	"context"
	"fmt"
	"sync"
	"time"

	"backend/internal/events"

	"github.com/rs/zerolog"
)

// CrashRecord tracks a single crash event
type CrashRecord struct {
	InstanceID string
	FeatureID  string
	Timestamp  time.Time
	ExitCode   int
	ErrorMsg   string
}

// InstanceCrashHistory tracks crash history for a single instance
type InstanceCrashHistory struct {
	InstanceID   string
	FeatureID    string
	Crashes      []CrashRecord
	TotalCrashes int
	FirstCrash   time.Time
	LastCrash    time.Time
	Isolated     bool
	IsolatedAt   time.Time
}

// FeatureCrashTrackerConfig holds configuration for the crash tracker
type FeatureCrashTrackerConfig struct {
	EventBus         events.EventBus
	Logger           zerolog.Logger
	CrashThreshold   int           // Default: 5 crashes
	TimeWindow       time.Duration // Default: 1 hour
	IsolationEnabled bool          // Default: true
}

// FeatureCrashTracker monitors service crashes and isolates problematic instances
type FeatureCrashTracker struct {
	config   FeatureCrashTrackerConfig
	logger   zerolog.Logger
	mu       sync.RWMutex
	history  map[string]*InstanceCrashHistory // instanceID -> history
	isolated map[string]bool                  // instanceID -> is isolated
}

// NewFeatureCrashTracker creates a new crash tracker
func NewFeatureCrashTracker(config FeatureCrashTrackerConfig) (*FeatureCrashTracker, error) {
	if config.EventBus == nil {
		return nil, fmt.Errorf("event bus is required")
	}
	if config.CrashThreshold == 0 {
		config.CrashThreshold = 5
	}
	if config.TimeWindow == 0 {
		config.TimeWindow = 1 * time.Hour
	}
	if !config.IsolationEnabled {
		config.IsolationEnabled = true
	}

	tracker := &FeatureCrashTracker{
		config:   config,
		logger:   config.Logger.With().Str("component", "crash_tracker").Logger(),
		history:  make(map[string]*InstanceCrashHistory),
		isolated: make(map[string]bool),
	}

	// Subscribe to feature crashed events
	if err := config.EventBus.Subscribe(events.EventTypeFeatureCrashed, tracker.handleCrashEvent); err != nil {
		return nil, fmt.Errorf("failed to subscribe to crash events: %w", err)
	}

	return tracker, nil
}

// RecordCrash records a crash for an instance
func (t *FeatureCrashTracker) RecordCrash(instanceID, featureID string, exitCode int, errorMsg string) error {
	t.mu.Lock()
	defer t.mu.Unlock()

	now := time.Now()

	// Get or create history
	history, exists := t.history[instanceID]
	if !exists {
		history = &InstanceCrashHistory{
			InstanceID: instanceID,
			FeatureID:  featureID,
			Crashes:    make([]CrashRecord, 0),
			FirstCrash: now,
		}
		t.history[instanceID] = history
	}

	// Add crash record
	crash := CrashRecord{
		InstanceID: instanceID,
		FeatureID:  featureID,
		Timestamp:  now,
		ExitCode:   exitCode,
		ErrorMsg:   errorMsg,
	}
	history.Crashes = append(history.Crashes, crash)
	history.TotalCrashes++
	history.LastCrash = now

	// Clean up old crashes outside time window
	t.cleanupOldCrashes(history)

	// Check if threshold is exceeded
	recentCrashes := t.countRecentCrashes(history)

	t.logger.Info().
		Str("instance_id", instanceID).
		Str("feature_id", featureID).
		Int("exit_code", exitCode).
		Int("recent_crashes", recentCrashes).
		Int("threshold", t.config.CrashThreshold).
		Msg("Crash recorded")

	if recentCrashes >= t.config.CrashThreshold && !history.Isolated {
		return t.isolateInstance(instanceID, featureID, recentCrashes)
	}

	return nil
}

// cleanupOldCrashes removes crash records outside the time window
func (t *FeatureCrashTracker) cleanupOldCrashes(history *InstanceCrashHistory) {
	cutoff := time.Now().Add(-t.config.TimeWindow)
	filtered := make([]CrashRecord, 0)

	for _, crash := range history.Crashes {
		if crash.Timestamp.After(cutoff) {
			filtered = append(filtered, crash)
		}
	}

	history.Crashes = filtered
}

// countRecentCrashes counts crashes within the time window
func (t *FeatureCrashTracker) countRecentCrashes(history *InstanceCrashHistory) int {
	cutoff := time.Now().Add(-t.config.TimeWindow)
	count := 0

	for _, crash := range history.Crashes {
		if crash.Timestamp.After(cutoff) {
			count++
		}
	}

	return count
}

// isolateInstance marks an instance as isolated due to excessive crashes
func (t *FeatureCrashTracker) isolateInstance(instanceID, featureID string, crashCount int) error {
	if !t.config.IsolationEnabled {
		t.logger.Warn().
			Str("instance_id", instanceID).
			Msg("Crash threshold exceeded but isolation is disabled")
		return nil
	}

	history := t.history[instanceID]
	history.Isolated = true
	history.IsolatedAt = time.Now()
	t.isolated[instanceID] = true

	t.logger.Warn().
		Str("instance_id", instanceID).
		Str("feature_id", featureID).
		Int("crash_count", crashCount).
		Msg("Instance isolated due to excessive crashes")

	// Emit crash isolation event
	// TODO: Emit proper event via EventBus
	ctx := context.Background()
	_ = ctx // avoid unused variable

	return nil
}

// IsIsolated checks if an instance is isolated
func (t *FeatureCrashTracker) IsIsolated(instanceID string) bool {
	t.mu.RLock()
	defer t.mu.RUnlock()

	return t.isolated[instanceID]
}

// GetHistory returns crash history for an instance
func (t *FeatureCrashTracker) GetHistory(instanceID string) (*InstanceCrashHistory, bool) {
	t.mu.RLock()
	defer t.mu.RUnlock()

	history, exists := t.history[instanceID]
	if !exists {
		return nil, false
	}

	// Return a copy to avoid race conditions
	historyCopy := &InstanceCrashHistory{
		InstanceID:   history.InstanceID,
		FeatureID:    history.FeatureID,
		TotalCrashes: history.TotalCrashes,
		FirstCrash:   history.FirstCrash,
		LastCrash:    history.LastCrash,
		Isolated:     history.Isolated,
		IsolatedAt:   history.IsolatedAt,
		Crashes:      make([]CrashRecord, len(history.Crashes)),
	}
	copy(historyCopy.Crashes, history.Crashes)

	return historyCopy, true
}

// ResetHistory clears crash history for an instance
func (t *FeatureCrashTracker) ResetHistory(instanceID string) {
	t.mu.Lock()
	defer t.mu.Unlock()

	delete(t.history, instanceID)
	delete(t.isolated, instanceID)

	t.logger.Info().
		Str("instance_id", instanceID).
		Msg("Crash history reset")
}

// UndoIsolation removes isolation from an instance
func (t *FeatureCrashTracker) UndoIsolation(instanceID string) error {
	t.mu.Lock()
	defer t.mu.Unlock()

	history, exists := t.history[instanceID]
	if !exists {
		return fmt.Errorf("no history found for instance %s", instanceID)
	}

	history.Isolated = false
	delete(t.isolated, instanceID)

	t.logger.Info().
		Str("instance_id", instanceID).
		Msg("Isolation removed")

	return nil
}

// GetIsolatedInstances returns all isolated instance IDs
func (t *FeatureCrashTracker) GetIsolatedInstances() []string {
	t.mu.RLock()
	defer t.mu.RUnlock()

	isolated := make([]string, 0, len(t.isolated))
	for instanceID := range t.isolated {
		isolated = append(isolated, instanceID)
	}

	return isolated
}

// handleCrashEvent handles feature crashed events from the event bus
func (t *FeatureCrashTracker) handleCrashEvent(ctx context.Context, event events.Event) error {
	// Type assert to FeatureCrashedEvent
	// TODO: Implement proper event type assertion
	t.logger.Debug().
		Str("event_id", event.GetID().String()).
		Msg("Received feature crashed event")

	return nil
}

// GetStats returns tracker statistics
func (t *FeatureCrashTracker) GetStats() map[string]interface{} {
	t.mu.RLock()
	defer t.mu.RUnlock()

	totalInstances := len(t.history)
	isolatedCount := len(t.isolated)
	totalCrashes := 0

	for _, history := range t.history {
		totalCrashes += history.TotalCrashes
	}

	return map[string]interface{}{
		"total_instances":   totalInstances,
		"isolated_count":    isolatedCount,
		"total_crashes":     totalCrashes,
		"crash_threshold":   t.config.CrashThreshold,
		"time_window_hours": t.config.TimeWindow.Hours(),
	}
}
