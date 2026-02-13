package alerts

import (
	"testing"
	"time"
)

// TestThrottleManager_WithMockClock verifies that ThrottleManager uses injected clock
func TestThrottleManager_WithMockClock(t *testing.T) {
	startTime := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)
	clock := NewMockClock(startTime)
	tm := NewThrottleManager(WithClock(clock))

	config := ThrottleConfig{
		MaxAlerts:     2,
		PeriodSeconds: 60, // 1 minute
	}

	eventData := map[string]interface{}{"test": "data"}

	// First alert should be allowed
	allowed, summary := tm.ShouldAllow("rule1", eventData, config)
	if !allowed {
		t.Errorf("First alert should be allowed, got summary: %s", summary)
	}

	// Second alert should be allowed (under limit)
	allowed, summary = tm.ShouldAllow("rule1", eventData, config)
	if !allowed {
		t.Errorf("Second alert should be allowed, got summary: %s", summary)
	}

	// Third alert should be throttled (at limit)
	allowed, summary = tm.ShouldAllow("rule1", eventData, config)
	if allowed {
		t.Errorf("Third alert should be throttled")
	}

	// Advance time by 30 seconds (still within period)
	clock.Advance(30 * time.Second)

	// Fourth alert should still be throttled
	allowed, summary = tm.ShouldAllow("rule1", eventData, config)
	if allowed {
		t.Errorf("Fourth alert should still be throttled")
	}

	// Advance time past the throttle period (total 61 seconds)
	clock.Advance(31 * time.Second)

	// Fifth alert should be allowed (new period started)
	allowed, summary = tm.ShouldAllow("rule1", eventData, config)
	if !allowed {
		t.Errorf("Fifth alert should be allowed (new period), got summary: %s", summary)
	}
}

// TestThrottleManager_DefaultClock verifies backward compatibility with real clock
func TestThrottleManager_DefaultClock(t *testing.T) {
	tm := NewThrottleManager() // No options - should use RealClock

	config := ThrottleConfig{
		MaxAlerts:     1,
		PeriodSeconds: 1,
	}

	eventData := map[string]interface{}{"test": "data"}

	// First alert should be allowed
	allowed, _ := tm.ShouldAllow("rule1", eventData, config)
	if !allowed {
		t.Errorf("First alert should be allowed")
	}

	// Second alert should be throttled
	allowed, _ = tm.ShouldAllow("rule1", eventData, config)
	if allowed {
		t.Errorf("Second alert should be throttled")
	}

	// Wait for period to expire
	time.Sleep(1100 * time.Millisecond)

	// Third alert should be allowed (new period)
	allowed, _ = tm.ShouldAllow("rule1", eventData, config)
	if !allowed {
		t.Errorf("Third alert should be allowed after period expires")
	}
}

// TestThrottleManager_DeterministicTiming tests complex throttle scenarios with precise time control
func TestThrottleManager_DeterministicTiming(t *testing.T) {
	startTime := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)
	clock := NewMockClock(startTime)
	tm := NewThrottleManager(WithClock(clock))

	config := ThrottleConfig{
		MaxAlerts:     3,
		PeriodSeconds: 300, // 5 minutes
		GroupByField:  "interface",
	}

	// Test multiple groups with precise timing
	tests := []struct {
		name           string
		interface_name string
		advanceBy      time.Duration
		expectAllowed  bool
		description    string
	}{
		{"eth0-1", "eth0", 0, true, "first alert for eth0"},
		{"eth1-1", "eth1", 10 * time.Second, true, "first alert for eth1"},
		{"eth0-2", "eth0", 20 * time.Second, true, "second alert for eth0"},
		{"eth0-3", "eth0", 30 * time.Second, true, "third alert for eth0 (at limit)"},
		{"eth0-4", "eth0", 40 * time.Second, false, "fourth alert for eth0 (throttled)"},
		{"eth1-2", "eth1", 50 * time.Second, true, "second alert for eth1 (different group)"},
		{"eth0-5", "eth0", 50 * time.Second, false, "fifth alert for eth0 (still throttled at 200s)"},
		{"eth0-6", "eth0", 101 * time.Second, true, "sixth alert for eth0 (new period after 301s total)"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.advanceBy > 0 {
				clock.Advance(tt.advanceBy)
			}

			eventData := map[string]interface{}{"interface": tt.interface_name}
			allowed, summary := tm.ShouldAllow("rule1", eventData, config)

			if allowed != tt.expectAllowed {
				t.Errorf("%s: expected allowed=%v, got %v (summary: %s) at time %v",
					tt.description, tt.expectAllowed, allowed, summary, clock.Now())
			}
		})
	}
}

// TestThrottleManager_MultipleRules tests that different rules have independent clocks
func TestThrottleManager_MultipleRules(t *testing.T) {
	startTime := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)
	clock := NewMockClock(startTime)
	tm := NewThrottleManager(WithClock(clock))

	config1 := ThrottleConfig{MaxAlerts: 1, PeriodSeconds: 60}
	config2 := ThrottleConfig{MaxAlerts: 1, PeriodSeconds: 120}

	eventData := map[string]interface{}{"test": "data"}

	// First alerts for both rules
	allowed1, _ := tm.ShouldAllow("rule1", eventData, config1)
	allowed2, _ := tm.ShouldAllow("rule2", eventData, config2)

	if !allowed1 || !allowed2 {
		t.Errorf("First alerts should be allowed for both rules")
	}

	// Second alerts should be throttled
	allowed1, _ = tm.ShouldAllow("rule1", eventData, config1)
	allowed2, _ = tm.ShouldAllow("rule2", eventData, config2)

	if allowed1 || allowed2 {
		t.Errorf("Second alerts should be throttled for both rules")
	}

	// Advance 61 seconds - rule1 period expired, rule2 still active
	clock.Advance(61 * time.Second)

	allowed1, _ = tm.ShouldAllow("rule1", eventData, config1)
	allowed2, _ = tm.ShouldAllow("rule2", eventData, config2)

	if !allowed1 {
		t.Errorf("rule1 should allow after 61 seconds")
	}
	if allowed2 {
		t.Errorf("rule2 should still throttle after 61 seconds")
	}

	// Advance another 60 seconds (total 121) - both periods expired
	clock.Advance(60 * time.Second)

	allowed1, _ = tm.ShouldAllow("rule1", eventData, config1)
	allowed2, _ = tm.ShouldAllow("rule2", eventData, config2)

	if !allowed1 || !allowed2 {
		t.Errorf("Both rules should allow after their periods expire")
	}
}
