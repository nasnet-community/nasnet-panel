// Package alerts implements alert throttling to prevent spam.
package alerts

import (
	"context"
	"fmt"
	"sync"
	"time"
)

// EventBus defines the interface for publishing events.
// This is a minimal interface to avoid circular dependencies with the events package.
type EventBus interface {
	Publish(ctx context.Context, event interface{}) error
}

// ThrottleConfig defines rate limiting for alert rules.
type ThrottleConfig struct {
	MaxAlerts     int    `json:"maxAlerts"`     // Maximum alerts allowed in period
	PeriodSeconds int    `json:"periodSeconds"` // Time period in seconds
	GroupByField  string `json:"groupByField"`  // Optional field to group by (e.g., "interface.name")
}

// ThrottleManager manages rate limiting for alert rules.
// Per Task 1.6: Implement throttle manager with per-rule rate limiting.
// Per AC5: "1 per 10 minutes" only sends first occurrence, then summary after period.
type ThrottleManager struct {
	mu       sync.RWMutex
	states   map[string]*throttleState // ruleID -> throttle state
	clock    Clock                     // Time source (injectable for tests)
	eventBus EventBus                  // Event bus for publishing summary events
	stopCh   chan struct{}             // Channel to signal shutdown
}

// throttleState tracks throttle state for a single rule.
type throttleState struct {
	mu            sync.Mutex
	groupStates   map[string]*groupThrottleState // groupKey -> group state
	lastResetTime time.Time
	config        ThrottleConfig
}

// groupThrottleState tracks throttle state for a group within a rule using a sliding window.
// Uses a ring buffer to track timestamps of alerts within the window.
type groupThrottleState struct {
	timestamps      []time.Time // Ring buffer of alert timestamps within window
	head            int         // Index of next write position in ring buffer
	size            int         // Current number of timestamps in buffer
	suppressedCount int         // Number of suppressed alerts since first allowed alert
	lastCleanup     time.Time   // Last time cleanup was performed
}

// ThrottleOption is a functional option for configuring ThrottleManager.
type ThrottleOption func(*ThrottleManager)

// WithClock sets a custom clock for the ThrottleManager.
// Useful for testing with deterministic time.
func WithClock(clock Clock) ThrottleOption {
	return func(tm *ThrottleManager) {
		tm.clock = clock
	}
}

// WithEventBus sets the event bus for publishing summary events.
func WithEventBus(eventBus EventBus) ThrottleOption {
	return func(tm *ThrottleManager) {
		tm.eventBus = eventBus
	}
}

// NewThrottleManager creates a new ThrottleManager with optional configuration.
func NewThrottleManager(opts ...ThrottleOption) *ThrottleManager {
	tm := &ThrottleManager{
		states: make(map[string]*throttleState),
		clock:  RealClock{}, // Default to real time
		stopCh: make(chan struct{}),
	}

	for _, opt := range opts {
		opt(tm)
	}

	return tm
}

// newGroupThrottleState creates a new groupThrottleState with a ring buffer sized for maxAlerts.
func newGroupThrottleState(maxAlerts int, now time.Time) *groupThrottleState {
	return &groupThrottleState{
		timestamps:      make([]time.Time, maxAlerts),
		head:            0,
		size:            0,
		suppressedCount: 0,
		lastCleanup:     now,
	}
}

// countInWindow counts the number of alerts within the sliding window.
// Removes expired timestamps and returns the count of valid alerts.
func (g *groupThrottleState) countInWindow(now time.Time, window time.Duration) int {
	cutoff := now.Add(-window)
	validCount := 0

	// Count timestamps that are still within the window
	for i := 0; i < g.size; i++ {
		idx := (g.head - g.size + i + len(g.timestamps)) % len(g.timestamps)
		if g.timestamps[idx].After(cutoff) {
			validCount++
		}
	}

	return validCount
}

// addTimestamp adds a new timestamp to the ring buffer.
// Automatically wraps around when buffer is full, overwriting oldest entry.
func (g *groupThrottleState) addTimestamp(t time.Time) {
	g.timestamps[g.head] = t
	g.head = (g.head + 1) % len(g.timestamps)
	if g.size < len(g.timestamps) {
		g.size++
	}
}

// cleanup removes expired timestamps from the ring buffer to free up space.
// Should be called periodically to prevent the buffer from being full of old data.
func (g *groupThrottleState) cleanup(now time.Time, window time.Duration) {
	if now.Sub(g.lastCleanup) < window/2 {
		// Only cleanup every half-window to avoid excessive work
		return
	}

	cutoff := now.Add(-window)
	newSize := 0

	// Compact the ring buffer, keeping only timestamps within window
	for i := 0; i < g.size; i++ {
		idx := (g.head - g.size + i + len(g.timestamps)) % len(g.timestamps)
		if g.timestamps[idx].After(cutoff) {
			// This timestamp is still valid
			if newSize != i {
				// Move it to the new position
				newIdx := (g.head - g.size + newSize + len(g.timestamps)) % len(g.timestamps)
				g.timestamps[newIdx] = g.timestamps[idx]
			}
			newSize++
		}
	}

	g.size = newSize
	g.head = newSize % len(g.timestamps)
	g.lastCleanup = now
}

// ShouldAllow checks if an alert should be allowed based on throttle rules using a sliding window.
// Returns (allow bool, summary string).
// If allow is false, the alert should be suppressed and summary contains the reason.
// The sliding window prevents the "burst at boundary" exploit where 2x alerts can be sent
// at the edge of fixed time windows.
func (tm *ThrottleManager) ShouldAllow(ruleID string, eventData map[string]interface{}, config ThrottleConfig) (bool, string) {
	if config.MaxAlerts <= 0 || config.PeriodSeconds <= 0 {
		// No throttling configured
		return true, ""
	}

	// Get or create rule state
	tm.mu.Lock()
	state, exists := tm.states[ruleID]
	if !exists {
		state = &throttleState{
			groupStates:   make(map[string]*groupThrottleState),
			lastResetTime: tm.clock.Now(),
			config:        config,
		}
		tm.states[ruleID] = state
	}
	tm.mu.Unlock()

	// Determine group key
	groupKey := "default"
	if config.GroupByField != "" {
		if value, exists := getFieldValue(config.GroupByField, eventData); exists {
			groupKey = toString(value)
		}
	}

	// Check throttle for this group using sliding window
	state.mu.Lock()
	defer state.mu.Unlock()

	now := tm.clock.Now()
	window := time.Duration(config.PeriodSeconds) * time.Second

	// Get or create group state
	groupState, exists := state.groupStates[groupKey]
	if !exists {
		groupState = newGroupThrottleState(config.MaxAlerts, now)
		state.groupStates[groupKey] = groupState
	}

	// Perform cleanup to remove expired timestamps
	groupState.cleanup(now, window)

	// Count alerts in the current sliding window
	alertsInWindow := groupState.countInWindow(now, window)

	// Check if we're under the limit
	if alertsInWindow < config.MaxAlerts {
		// Allow this alert and add timestamp to ring buffer
		groupState.addTimestamp(now)
		return true, ""
	}

	// Over limit - suppress this alert
	groupState.suppressedCount++
	return false, fmt.Sprintf("throttled (limit: %d per %d seconds, current: %d)",
		config.MaxAlerts, config.PeriodSeconds, alertsInWindow)
}

// GetSummary retrieves throttle summary for a rule using sliding window data.
// Returns counts of allowed and suppressed alerts in the current window.
func (tm *ThrottleManager) GetSummary(ruleID string) map[string]interface{} {
	tm.mu.RLock()
	state, exists := tm.states[ruleID]
	tm.mu.RUnlock()

	if !exists {
		return map[string]interface{}{
			"configured": false,
		}
	}

	state.mu.Lock()
	defer state.mu.Unlock()

	now := tm.clock.Now()
	window := time.Duration(state.config.PeriodSeconds) * time.Second

	totalAllowed := 0
	totalSuppressed := 0
	groups := make([]map[string]interface{}, 0)

	for groupKey, groupState := range state.groupStates {
		alertsInWindow := groupState.countInWindow(now, window)
		totalAllowed += alertsInWindow
		totalSuppressed += groupState.suppressedCount

		// Find oldest and newest timestamps in window
		var oldestAlert, newestAlert time.Time
		for i := 0; i < groupState.size; i++ {
			idx := (groupState.head - groupState.size + i + len(groupState.timestamps)) % len(groupState.timestamps)
			ts := groupState.timestamps[idx]
			if ts.After(now.Add(-window)) {
				if oldestAlert.IsZero() || ts.Before(oldestAlert) {
					oldestAlert = ts
				}
				if newestAlert.IsZero() || ts.After(newestAlert) {
					newestAlert = ts
				}
			}
		}

		groups = append(groups, map[string]interface{}{
			"group":        groupKey,
			"allowed":      alertsInWindow,
			"suppressed":   groupState.suppressedCount,
			"oldest_alert": oldestAlert,
			"newest_alert": newestAlert,
			"window_start": now.Add(-window),
		})
	}

	return map[string]interface{}{
		"configured":       true,
		"max_alerts":       state.config.MaxAlerts,
		"period_seconds":   state.config.PeriodSeconds,
		"total_allowed":    totalAllowed,
		"total_suppressed": totalSuppressed,
		"groups":           groups,
		"window_type":      "sliding",
	}
}

// Reset clears throttle state for a rule.
// Useful when rule configuration changes.
func (tm *ThrottleManager) Reset(ruleID string) {
	tm.mu.Lock()
	defer tm.mu.Unlock()
	delete(tm.states, ruleID)
}

// Cleanup removes stale throttle states (for rules that no longer exist).
// Should be called periodically.
func (tm *ThrottleManager) Cleanup(activeRuleIDs []string) {
	activeSet := make(map[string]bool)
	for _, id := range activeRuleIDs {
		activeSet[id] = true
	}

	tm.mu.Lock()
	defer tm.mu.Unlock()

	for ruleID := range tm.states {
		if !activeSet[ruleID] {
			delete(tm.states, ruleID)
		}
	}
}

// ParseThrottleConfig converts a JSON map to ThrottleConfig.
func ParseThrottleConfig(configJSON map[string]interface{}) (ThrottleConfig, error) {
	config := ThrottleConfig{}

	if maxAlerts, ok := configJSON["maxAlerts"].(float64); ok {
		config.MaxAlerts = int(maxAlerts)
	} else if maxAlerts, ok := configJSON["maxAlerts"].(int); ok {
		config.MaxAlerts = maxAlerts
	} else {
		return config, fmt.Errorf("maxAlerts is required and must be a number")
	}

	if periodSeconds, ok := configJSON["periodSeconds"].(float64); ok {
		config.PeriodSeconds = int(periodSeconds)
	} else if periodSeconds, ok := configJSON["periodSeconds"].(int); ok {
		config.PeriodSeconds = periodSeconds
	} else {
		return config, fmt.Errorf("periodSeconds is required and must be a number")
	}

	if groupByField, ok := configJSON["groupByField"].(string); ok {
		config.GroupByField = groupByField
	}

	return config, nil
}

// StartSummaryWorker starts a background worker that delivers throttle summaries.
// The worker runs on a 1-minute ticker and sends summaries for rules with suppressions.
// This ensures users receive periodic updates about throttled alerts without spam.
func (tm *ThrottleManager) StartSummaryWorker(ctx context.Context, summaryInterval time.Duration) {
	ticker := time.NewTicker(summaryInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			tm.deliverSummaries(ctx)
		case <-tm.stopCh:
			return
		case <-ctx.Done():
			return
		}
	}
}

// deliverSummaries publishes throttle summary events for rules with suppressions.
// This method is called periodically by the summary worker.
func (tm *ThrottleManager) deliverSummaries(ctx context.Context) {
	if tm.eventBus == nil {
		return // No event bus configured, skip
	}

	tm.mu.RLock()
	ruleIDs := make([]string, 0, len(tm.states))
	for ruleID := range tm.states {
		ruleIDs = append(ruleIDs, ruleID)
	}
	tm.mu.RUnlock()

	// Iterate through each rule and publish summary if there are suppressions
	for _, ruleID := range ruleIDs {
		summary := tm.GetSummary(ruleID)

		// Only publish if configured and has suppressions
		if configured, ok := summary["configured"].(bool); !ok || !configured {
			continue
		}

		totalSuppressed, _ := summary["total_suppressed"].(int)
		if totalSuppressed == 0 {
			continue // No suppressions, skip
		}

		// Extract summary data
		totalAllowed, _ := summary["total_allowed"].(int)
		periodSeconds, _ := summary["period_seconds"].(int)
		groups, _ := summary["groups"].([]map[string]interface{})

		// Create and publish ThrottleSummaryEvent
		// We need to import the notifications package event type
		// To avoid import cycles, we'll create a simple struct that matches the event interface
		event := &throttleSummaryEvent{
			ruleID:          ruleID,
			totalAllowed:    totalAllowed,
			totalSuppressed: totalSuppressed,
			periodSeconds:   periodSeconds,
			groups:          groups,
		}

		if err := tm.eventBus.Publish(ctx, event); err != nil {
			// Log error but don't fail - this is best-effort delivery
			// In production, this would use the logger passed to ThrottleManager
			fmt.Printf("failed to publish throttle summary for rule %s: %v\n", ruleID, err)
		}

		// After publishing summary, reset suppressed counts for next period
		tm.resetSuppressionCounts(ruleID)
	}
}

// resetSuppressionCounts resets the suppressed count for all groups in a rule.
// This is called after delivering a summary to start fresh for the next period.
func (tm *ThrottleManager) resetSuppressionCounts(ruleID string) {
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
// This stops the summary worker and cleans up resources.
func (tm *ThrottleManager) Stop() {
	close(tm.stopCh)
}

// throttleSummaryEvent is a minimal event structure for throttle summaries.
// This avoids circular dependencies with the notifications package.
type throttleSummaryEvent struct {
	ruleID          string
	totalAllowed    int
	totalSuppressed int
	periodSeconds   int
	groups          []map[string]interface{}
}

// ThrottleStatusData represents throttle status for a rule (for GraphQL).
type ThrottleStatusData struct {
	RuleID          string
	IsThrottled     bool
	SuppressedCount int
	WindowStart     time.Time
	WindowEnd       time.Time
	Groups          []ThrottleGroupStatusData
}

// ThrottleGroupStatusData represents throttle status for a group (for GraphQL).
type ThrottleGroupStatusData struct {
	GroupKey        string
	IsThrottled     bool
	SuppressedCount int
	WindowStart     time.Time
	WindowEnd       time.Time
}

// GetStatus returns structured throttle status for all rules or a specific rule.
// This method is used by the GraphQL API to query throttle status.
func (tm *ThrottleManager) GetStatus(ruleID *string) []ThrottleStatusData {
	tm.mu.RLock()
	defer tm.mu.RUnlock()

	var results []ThrottleStatusData

	// If specific rule requested, only return that rule
	if ruleID != nil && *ruleID != "" {
		state, exists := tm.states[*ruleID]
		if !exists {
			return results // Return empty slice if rule not found
		}
		status := tm.getStatusForRule(*ruleID, state)
		return []ThrottleStatusData{status}
	}

	// Return status for all rules
	for id, state := range tm.states {
		status := tm.getStatusForRule(id, state)
		results = append(results, status)
	}

	return results
}

// getStatusForRule calculates throttle status for a single rule.
func (tm *ThrottleManager) getStatusForRule(ruleID string, state *throttleState) ThrottleStatusData {
	state.mu.Lock()
	defer state.mu.Unlock()

	now := tm.clock.Now()
	window := time.Duration(state.config.PeriodSeconds) * time.Second
	windowStart := now.Add(-window)
	windowEnd := now

	totalSuppressed := 0
	isThrottled := false
	groups := make([]ThrottleGroupStatusData, 0, len(state.groupStates))

	for groupKey, groupState := range state.groupStates {
		alertsInWindow := groupState.countInWindow(now, window)
		groupIsThrottled := alertsInWindow >= state.config.MaxAlerts

		if groupIsThrottled {
			isThrottled = true
		}

		totalSuppressed += groupState.suppressedCount

		groups = append(groups, ThrottleGroupStatusData{
			GroupKey:        groupKey,
			IsThrottled:     groupIsThrottled,
			SuppressedCount: groupState.suppressedCount,
			WindowStart:     windowStart,
			WindowEnd:       windowEnd,
		})
	}

	return ThrottleStatusData{
		RuleID:          ruleID,
		IsThrottled:     isThrottled,
		SuppressedCount: totalSuppressed,
		WindowStart:     windowStart,
		WindowEnd:       windowEnd,
		Groups:          groups,
	}
}
