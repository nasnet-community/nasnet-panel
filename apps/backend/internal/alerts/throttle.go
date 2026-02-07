// Package alerts implements alert throttling to prevent spam.
package alerts

import (
	"fmt"
	"sync"
	"time"
)

// ThrottleConfig defines rate limiting for alert rules.
type ThrottleConfig struct {
	MaxAlerts      int    `json:"maxAlerts"`      // Maximum alerts allowed in period
	PeriodSeconds  int    `json:"periodSeconds"`  // Time period in seconds
	GroupByField   string `json:"groupByField"`   // Optional field to group by (e.g., "interface.name")
}

// ThrottleManager manages rate limiting for alert rules.
// Per Task 1.6: Implement throttle manager with per-rule rate limiting.
// Per AC5: "1 per 10 minutes" only sends first occurrence, then summary after period.
type ThrottleManager struct {
	mu     sync.RWMutex
	states map[string]*throttleState // ruleID -> throttle state
}

// throttleState tracks throttle state for a single rule.
type throttleState struct {
	mu             sync.Mutex
	groupStates    map[string]*groupThrottleState // groupKey -> group state
	lastResetTime  time.Time
	config         ThrottleConfig
}

// groupThrottleState tracks throttle state for a group within a rule.
type groupThrottleState struct {
	count         int       // Number of alerts in current period
	firstAlert    time.Time // Time of first alert in period
	periodStart   time.Time // Start of current throttle period
	suppressedCount int     // Number of suppressed alerts in this period
}

// NewThrottleManager creates a new ThrottleManager.
func NewThrottleManager() *ThrottleManager {
	return &ThrottleManager{
		states: make(map[string]*throttleState),
	}
}

// ShouldAllow checks if an alert should be allowed based on throttle rules.
// Returns (allow bool, summary string).
// If allow is false, the alert should be suppressed and summary contains the reason.
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
			lastResetTime: time.Now(),
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

	// Check throttle for this group
	state.mu.Lock()
	defer state.mu.Unlock()

	groupState, exists := state.groupStates[groupKey]
	now := time.Now()
	period := time.Duration(config.PeriodSeconds) * time.Second

	if !exists || now.Sub(groupState.periodStart) >= period {
		// First alert in period or period expired - reset
		if exists && groupState.suppressedCount > 0 {
			// Generate summary for previous period
			_ = fmt.Sprintf("Alert occurred %d more times during throttle period", groupState.suppressedCount)
			// This summary should be sent as a separate notification
			// For now, we'll just log it
		}

		state.groupStates[groupKey] = &groupThrottleState{
			count:           1,
			firstAlert:      now,
			periodStart:     now,
			suppressedCount: 0,
		}
		return true, "" // Allow first alert in new period
	}

	// Check if we've hit the limit
	if groupState.count >= config.MaxAlerts {
		// Throttle limit reached - suppress this alert
		groupState.suppressedCount++

		// Check if period has expired and we need to send summary
		if now.Sub(groupState.periodStart) >= period {
			summary := fmt.Sprintf("Alert occurred %d times (1 sent, %d suppressed)",
				groupState.count + groupState.suppressedCount, groupState.suppressedCount)

			// Reset for new period
			state.groupStates[groupKey] = &groupThrottleState{
				count:           0,
				firstAlert:      now,
				periodStart:     now,
				suppressedCount: 0,
			}

			return false, summary // Suppress but provide summary
		}

		return false, fmt.Sprintf("throttled (limit: %d per %d seconds)", config.MaxAlerts, config.PeriodSeconds)
	}

	// Under limit - allow the alert
	groupState.count++
	return true, ""
}

// GetSummary retrieves throttle summary for a rule.
// Returns counts of allowed and suppressed alerts in the current period.
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

	totalAllowed := 0
	totalSuppressed := 0
	groups := make([]map[string]interface{}, 0)

	for groupKey, groupState := range state.groupStates {
		totalAllowed += groupState.count
		totalSuppressed += groupState.suppressedCount

		groups = append(groups, map[string]interface{}{
			"group":      groupKey,
			"allowed":    groupState.count,
			"suppressed": groupState.suppressedCount,
			"first_alert": groupState.firstAlert,
			"period_start": groupState.periodStart,
		})
	}

	return map[string]interface{}{
		"configured":      true,
		"max_alerts":      state.config.MaxAlerts,
		"period_seconds":  state.config.PeriodSeconds,
		"total_allowed":   totalAllowed,
		"total_suppressed": totalSuppressed,
		"groups":          groups,
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
