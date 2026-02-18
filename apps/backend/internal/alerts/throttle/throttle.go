// Package throttle implements rate limiting and storm detection for alerts.
package throttle

import (
	"context"
	"fmt"
	"sync"
	"time"
)

// EventBus defines the interface for publishing events.
type EventBus interface {
	Publish(ctx context.Context, event interface{}) error
}

// Clock is an interface for time operations.
type Clock interface {
	Now() time.Time
}

// RealClock implements Clock using actual system time.
type RealClock struct{}

// Now returns the current system time.
func (RealClock) Now() time.Time { return time.Now() }

// MockClock implements Clock with controllable time for testing.
type MockClock struct {
	mu      sync.RWMutex
	current time.Time
}

// NewMockClock creates a MockClock starting at the given time.
func NewMockClock(t time.Time) *MockClock {
	if t.IsZero() {
		t = time.Unix(0, 0)
	}
	return &MockClock{current: t}
}

// Now returns the current mock time.
func (m *MockClock) Now() time.Time {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.current
}

// Set sets the mock clock to a specific time.
func (m *MockClock) Set(t time.Time) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.current = t
}

// Advance moves the mock clock forward by the given duration.
func (m *MockClock) Advance(d time.Duration) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.current = m.current.Add(d)
}

// Config defines rate limiting for alert rules.
type Config struct {
	MaxAlerts     int    `json:"maxAlerts"`
	PeriodSeconds int    `json:"periodSeconds"`
	GroupByField  string `json:"groupByField"`
}

// Manager manages rate limiting for alert rules.
type Manager struct {
	mu       sync.RWMutex
	states   map[string]*throttleState
	clock    Clock
	eventBus EventBus
	stopCh   chan struct{}
}

// throttleState tracks throttle state for a single rule.
type throttleState struct {
	mu            sync.Mutex
	groupStates   map[string]*groupThrottleState
	lastResetTime time.Time
	config        Config
}

// groupThrottleState tracks throttle state for a group using a sliding window.
type groupThrottleState struct {
	timestamps      []time.Time
	head            int
	size            int
	suppressedCount int
	lastCleanup     time.Time
}

// Option is a functional option for configuring Manager.
type Option func(*Manager)

// WithClock sets a custom clock for the Manager.
func WithClock(clock Clock) Option {
	return func(tm *Manager) { tm.clock = clock }
}

// WithEventBus sets the event bus for publishing summary events.
func WithEventBus(eventBus EventBus) Option {
	return func(tm *Manager) { tm.eventBus = eventBus }
}

// NewManager creates a new Manager with optional configuration.
func NewManager(opts ...Option) *Manager {
	tm := &Manager{
		states: make(map[string]*throttleState),
		clock:  RealClock{},
		stopCh: make(chan struct{}),
	}
	for _, opt := range opts {
		opt(tm)
	}
	return tm
}

func newGroupThrottleState(maxAlerts int, now time.Time) *groupThrottleState {
	return &groupThrottleState{
		timestamps:  make([]time.Time, maxAlerts),
		lastCleanup: now,
	}
}

func (g *groupThrottleState) countInWindow(now time.Time, window time.Duration) int {
	cutoff := now.Add(-window)
	validCount := 0
	for i := 0; i < g.size; i++ {
		idx := (g.head - g.size + i + len(g.timestamps)) % len(g.timestamps)
		if g.timestamps[idx].After(cutoff) {
			validCount++
		}
	}
	return validCount
}

func (g *groupThrottleState) addTimestamp(t time.Time) {
	g.timestamps[g.head] = t
	g.head = (g.head + 1) % len(g.timestamps)
	if g.size < len(g.timestamps) {
		g.size++
	}
}

func (g *groupThrottleState) cleanup(now time.Time, window time.Duration) {
	if now.Sub(g.lastCleanup) < window/2 {
		return
	}
	cutoff := now.Add(-window)
	newSize := 0
	for i := 0; i < g.size; i++ {
		idx := (g.head - g.size + i + len(g.timestamps)) % len(g.timestamps)
		if g.timestamps[idx].After(cutoff) {
			if newSize != i {
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

// ShouldAllow checks if an alert should be allowed based on throttle rules.
func (tm *Manager) ShouldAllow(ruleID string, eventData map[string]interface{}, config Config) (allowed bool, reason string) {
	if config.MaxAlerts <= 0 || config.PeriodSeconds <= 0 {
		return true, ""
	}

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

	groupKey := "default"
	if config.GroupByField != "" {
		if value, innerExists := GetFieldValue(config.GroupByField, eventData); innerExists {
			groupKey = ToString(value)
		}
	}

	state.mu.Lock()
	defer state.mu.Unlock()

	now := tm.clock.Now()
	window := time.Duration(config.PeriodSeconds) * time.Second

	groupState, exists := state.groupStates[groupKey]
	if !exists {
		groupState = newGroupThrottleState(config.MaxAlerts, now)
		state.groupStates[groupKey] = groupState
	}

	groupState.cleanup(now, window)
	alertsInWindow := groupState.countInWindow(now, window)

	if alertsInWindow < config.MaxAlerts {
		groupState.addTimestamp(now)
		return true, ""
	}

	groupState.suppressedCount++
	return false, fmt.Sprintf("throttled (limit: %d per %d seconds, current: %d)",
		config.MaxAlerts, config.PeriodSeconds, alertsInWindow)
}

// GetSummary retrieves throttle summary for a rule.
func (tm *Manager) GetSummary(ruleID string) map[string]interface{} {
	tm.mu.RLock()
	state, exists := tm.states[ruleID]
	tm.mu.RUnlock()

	if !exists {
		return map[string]interface{}{"configured": false}
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
			"group": groupKey, "allowed": alertsInWindow, "suppressed": groupState.suppressedCount,
			"oldest_alert": oldestAlert, "newest_alert": newestAlert, "window_start": now.Add(-window),
		})
	}

	return map[string]interface{}{
		"configured": true, "max_alerts": state.config.MaxAlerts,
		"period_seconds": state.config.PeriodSeconds, "total_allowed": totalAllowed,
		"total_suppressed": totalSuppressed, "groups": groups, "window_type": "sliding",
	}
}

// Reset clears throttle state for a rule.
func (tm *Manager) Reset(ruleID string) {
	tm.mu.Lock()
	defer tm.mu.Unlock()
	delete(tm.states, ruleID)
}

// Cleanup removes stale throttle states.
func (tm *Manager) Cleanup(activeRuleIDs []string) {
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
