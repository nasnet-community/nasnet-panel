package throttle

import (
	"context"
	"errors"
	"strconv"
	"strings"
	"sync"
	"time"

	"go.uber.org/zap"
)

// StatusData represents throttle status for a rule (for GraphQL).
type StatusData struct {
	RuleID          string
	IsThrottled     bool
	SuppressedCount int
	WindowStart     time.Time
	WindowEnd       time.Time
	Groups          []GroupStatusData
}

// GroupStatusData represents throttle status for a group.
type GroupStatusData struct {
	GroupKey        string
	IsThrottled     bool
	SuppressedCount int
	WindowStart     time.Time
	WindowEnd       time.Time
}

// GetStatus returns structured throttle status for all rules or a specific rule.
func (tm *Manager) GetStatus(ruleID *string) []StatusData {
	tm.mu.RLock()
	defer tm.mu.RUnlock()

	if ruleID != nil && *ruleID != "" {
		state, exists := tm.states[*ruleID]
		if !exists {
			return []StatusData{}
		}
		status := tm.getStatusForRule(*ruleID, state)
		return []StatusData{status}
	}

	results := make([]StatusData, 0, len(tm.states))

	for id, state := range tm.states {
		status := tm.getStatusForRule(id, state)
		results = append(results, status)
	}

	return results
}

func (tm *Manager) getStatusForRule(ruleID string, state *throttleState) StatusData {
	state.mu.Lock()
	defer state.mu.Unlock()

	now := tm.clock.Now()
	window := time.Duration(state.config.PeriodSeconds) * time.Second
	windowStart := now.Add(-window)
	windowEnd := now

	totalSuppressed := 0
	isThrottled := false
	groups := make([]GroupStatusData, 0, len(state.groupStates))

	for groupKey, groupState := range state.groupStates {
		alertsInWindow := groupState.countInWindow(now, window)
		groupIsThrottled := alertsInWindow >= state.config.MaxAlerts

		if groupIsThrottled {
			isThrottled = true
		}

		totalSuppressed += groupState.suppressedCount

		groups = append(groups, GroupStatusData{
			GroupKey:        groupKey,
			IsThrottled:     groupIsThrottled,
			SuppressedCount: groupState.suppressedCount,
			WindowStart:     windowStart,
			WindowEnd:       windowEnd,
		})
	}

	return StatusData{
		RuleID:          ruleID,
		IsThrottled:     isThrottled,
		SuppressedCount: totalSuppressed,
		WindowStart:     windowStart,
		WindowEnd:       windowEnd,
		Groups:          groups,
	}
}

// StartSummaryWorker runs a background worker that delivers throttle summaries.
func (tm *Manager) StartSummaryWorker(ctx context.Context, summaryInterval time.Duration, logger *zap.Logger) {
	ticker := time.NewTicker(summaryInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			tm.deliverSummaries(ctx, logger)
		case <-tm.stopCh:
			return
		case <-ctx.Done():
			return
		}
	}
}

func (tm *Manager) deliverSummaries(ctx context.Context, logger *zap.Logger) {
	if tm.eventBus == nil {
		return
	}

	tm.mu.RLock()
	ruleIDs := make([]string, 0, len(tm.states))
	for ruleID := range tm.states {
		ruleIDs = append(ruleIDs, ruleID)
	}
	tm.mu.RUnlock()

	for _, ruleID := range ruleIDs {
		summary := tm.GetSummary(ruleID)

		if configured, ok := summary["configured"].(bool); !ok || !configured {
			continue
		}

		totalSuppressed, ok := summary["total_suppressed"].(int)
		if !ok || totalSuppressed == 0 {
			continue
		}

		totalAllowed, _ := summary["total_allowed"].(int)         //nolint:errcheck // intentional, use 0 default
		periodSeconds, _ := summary["period_seconds"].(int)       //nolint:errcheck // intentional, use 0 default
		groups, _ := summary["groups"].([]map[string]interface{}) //nolint:errcheck // intentional, use nil default

		event := map[string]interface{}{
			"type":             "throttle.summary",
			"rule_id":          ruleID,
			"total_allowed":    totalAllowed,
			"total_suppressed": totalSuppressed,
			"period_seconds":   periodSeconds,
			"groups":           groups,
		}

		if err := tm.eventBus.Publish(ctx, event); err != nil {
			logger.Error("failed to publish throttle summary", zap.String("rule_id", ruleID), zap.Error(err))
		}

		tm.resetSuppressionCounts(ruleID)
	}
}

func (tm *Manager) resetSuppressionCounts(ruleID string) {
	tm.mu.RLock()
	state, exists := tm.states[ruleID]
	tm.mu.RUnlock()

	if !exists {
		return
	}

	state.mu.Lock()
	defer state.mu.Unlock()

	for _, groupState := range state.groupStates {
		groupState.suppressedCount = 0
	}
}

// Stop gracefully shuts down the throttle manager.
func (tm *Manager) Stop() {
	close(tm.stopCh)
}

// ParseConfig converts a JSON map to Config.
func ParseConfig(configJSON map[string]interface{}) (Config, error) {
	config := Config{}

	switch maxAlerts := configJSON["maxAlerts"].(type) {
	case float64:
		config.MaxAlerts = int(maxAlerts)
	case int:
		config.MaxAlerts = maxAlerts
	default:
		return config, errors.New("maxAlerts is required and must be a number")
	}

	switch periodSeconds := configJSON["periodSeconds"].(type) {
	case float64:
		config.PeriodSeconds = int(periodSeconds)
	case int:
		config.PeriodSeconds = periodSeconds
	default:
		return config, errors.New("periodSeconds is required and must be a number")
	}

	if groupByField, ok := configJSON["groupByField"].(string); ok {
		config.GroupByField = groupByField
	}

	return config, nil
}

// GetFieldValue retrieves a value from nested map data using dot notation.
func GetFieldValue(field string, data map[string]interface{}) (interface{}, bool) {
	parts := strings.Split(field, ".")
	current := data
	for i, part := range parts {
		value, exists := current[part]
		if !exists {
			return nil, false
		}
		if i == len(parts)-1 {
			return value, true
		}
		nestedMap, ok := value.(map[string]interface{})
		if !ok {
			return nil, false
		}
		current = nestedMap
	}
	return nil, false
}

// ToString converts an interface{} value to string.
func ToString(value interface{}) string {
	if value == nil {
		return ""
	}
	switch v := value.(type) {
	case string:
		return v
	case int:
		return strconv.Itoa(v)
	case int64:
		return strconv.FormatInt(v, 10)
	case float64:
		return strconv.FormatFloat(v, 'f', -1, 64)
	case bool:
		return strconv.FormatBool(v)
	default:
		// For unsupported types, return empty string instead of formatting
		return ""
	}
}

// =============================================================================
// Storm detection (merged from storm.go)
// =============================================================================

// StormConfig holds configuration for storm detection.
type StormConfig struct {
	Threshold       int
	WindowSeconds   int
	CooldownSeconds int
}

// DefaultStormConfig returns the default storm detection configuration.
func DefaultStormConfig() StormConfig {
	return StormConfig{
		Threshold:       100,
		WindowSeconds:   60,
		CooldownSeconds: 300,
	}
}

// StormStatus represents the current storm detection status.
type StormStatus struct {
	InStorm           bool
	StormStartTime    time.Time
	SuppressedCount   int
	CurrentRate       float64
	ThresholdRate     float64
	CooldownRemaining time.Duration
}

// StormDetector implements global rate limiting for alert storms.
type StormDetector struct {
	config StormConfig
	clock  Clock

	mu              sync.RWMutex
	timestamps      []time.Time
	inStorm         bool
	stormStartTime  time.Time
	suppressedCount int
}

// NewStormDetector creates a new storm detector.
func NewStormDetector(config StormConfig, clock Clock) *StormDetector {
	if clock == nil {
		clock = RealClock{}
	}
	return &StormDetector{
		config:     config,
		clock:      clock,
		timestamps: make([]time.Time, 0, config.Threshold*2),
	}
}

// RecordAlert records a new alert and returns whether it should be allowed.
func (sd *StormDetector) RecordAlert() bool {
	sd.mu.Lock()
	defer sd.mu.Unlock()

	now := sd.clock.Now()
	windowStart := now.Add(-time.Duration(sd.config.WindowSeconds) * time.Second)

	sd.pruneOldTimestamps(windowStart)

	if sd.inStorm {
		cooldownEnd := sd.stormStartTime.Add(time.Duration(sd.config.CooldownSeconds) * time.Second)
		if now.Before(cooldownEnd) {
			sd.suppressedCount++
			return false
		}
		sd.inStorm = false
		sd.stormStartTime = time.Time{}
		sd.suppressedCount = 0
	}

	sd.timestamps = append(sd.timestamps, now)

	if len(sd.timestamps) > sd.config.Threshold {
		if !sd.inStorm {
			sd.inStorm = true
			sd.stormStartTime = now
			sd.suppressedCount = 0
		}
		return false
	}

	return true
}

// GetStatus returns the current storm detection status.
func (sd *StormDetector) GetStatus() StormStatus {
	sd.mu.RLock()
	defer sd.mu.RUnlock()

	now := sd.clock.Now()
	windowStart := now.Add(-time.Duration(sd.config.WindowSeconds) * time.Second)

	alertCount := 0
	for _, ts := range sd.timestamps {
		if ts.After(windowStart) {
			alertCount++
		}
	}

	currentRate := float64(alertCount) / (float64(sd.config.WindowSeconds) / 60.0)
	thresholdRate := float64(sd.config.Threshold) / (float64(sd.config.WindowSeconds) / 60.0)

	status := StormStatus{
		InStorm:         sd.inStorm,
		StormStartTime:  sd.stormStartTime,
		SuppressedCount: sd.suppressedCount,
		CurrentRate:     currentRate,
		ThresholdRate:   thresholdRate,
	}

	if sd.inStorm {
		cooldownEnd := sd.stormStartTime.Add(time.Duration(sd.config.CooldownSeconds) * time.Second)
		remaining := cooldownEnd.Sub(now)
		if remaining > 0 {
			status.CooldownRemaining = remaining
		}
	}

	return status
}

// Reset clears all state and exits storm mode.
func (sd *StormDetector) Reset() {
	sd.mu.Lock()
	defer sd.mu.Unlock()

	sd.timestamps = sd.timestamps[:0]
	sd.inStorm = false
	sd.stormStartTime = time.Time{}
	sd.suppressedCount = 0
}

func (sd *StormDetector) pruneOldTimestamps(windowStart time.Time) {
	start := 0
	for start < len(sd.timestamps) && sd.timestamps[start].Before(windowStart) {
		start++
	}
	if start > 0 {
		copy(sd.timestamps, sd.timestamps[start:])
		sd.timestamps = sd.timestamps[:len(sd.timestamps)-start]
	}
}
