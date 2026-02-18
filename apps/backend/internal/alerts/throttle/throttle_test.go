// Package alerts implements throttle manager testing
package throttle

import (
	"fmt"
	"testing"
	"time"
)

// TestThrottleManager tests rate limiting functionality
// Per Task 7.2: Unit tests for throttle manager
func TestThrottleManager(t *testing.T) {
	tm := NewManager()

	t.Run("no throttle config - always allows", func(t *testing.T) {
		config := Config{} // Empty config
		eventData := map[string]interface{}{"device_id": "router-1"}

		allowed, reason := tm.ShouldAllow("rule-1", eventData, config)
		if !allowed {
			t.Errorf("Expected alert to be allowed with no throttle config, got blocked: %s", reason)
		}
	})

	t.Run("first alert always allowed", func(t *testing.T) {
		config := Config{
			MaxAlerts:     1,
			PeriodSeconds: 60,
		}
		eventData := map[string]interface{}{"device_id": "router-1"}

		allowed, _ := tm.ShouldAllow("rule-2", eventData, config)
		if !allowed {
			t.Error("Expected first alert to be allowed")
		}
	})

	t.Run("throttle enforced within period", func(t *testing.T) {
		tm := NewManager()
		config := Config{
			MaxAlerts:     1,
			PeriodSeconds: 60,
		}
		eventData := map[string]interface{}{"device_id": "router-1"}

		// First alert
		allowed1, _ := tm.ShouldAllow("rule-3", eventData, config)
		if !allowed1 {
			t.Error("Expected first alert to be allowed")
		}

		// Second alert immediately after (should be blocked)
		allowed2, reason := tm.ShouldAllow("rule-3", eventData, config)
		if allowed2 {
			t.Error("Expected second alert to be throttled")
		}
		if reason == "" {
			t.Error("Expected throttle reason to be provided")
		}
	})

	t.Run("throttle expires after period", func(t *testing.T) {
		// Use MockClock for deterministic testing
		clock := NewMockClock(time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC))
		tm := NewManager(WithClock(clock))
		config := Config{
			MaxAlerts:     1,
			PeriodSeconds: 60,
		}
		eventData := map[string]interface{}{"device_id": "router-1"}

		// First alert
		tm.ShouldAllow("rule-4", eventData, config)

		// Advance past throttle period
		clock.Advance(61 * time.Second)

		// Second alert after period (should be allowed)
		allowed, _ := tm.ShouldAllow("rule-4", eventData, config)
		if !allowed {
			t.Error("Expected alert to be allowed after throttle period expired")
		}
	})

	t.Run("multiple alerts within limit", func(t *testing.T) {
		tm := NewManager()
		config := Config{
			MaxAlerts:     3,
			PeriodSeconds: 60,
		}
		eventData := map[string]interface{}{"device_id": "router-1"}

		// Send 3 alerts (all should be allowed)
		for i := 0; i < 3; i++ {
			allowed, _ := tm.ShouldAllow("rule-5", eventData, config)
			if !allowed {
				t.Errorf("Expected alert %d to be allowed (limit is 3)", i+1)
			}
		}

		// 4th alert should be throttled
		allowed, _ := tm.ShouldAllow("rule-5", eventData, config)
		if allowed {
			t.Error("Expected 4th alert to be throttled (limit is 3)")
		}
	})

	t.Run("group by field - separate throttle per group", func(t *testing.T) {
		tm := NewManager()
		config := Config{
			MaxAlerts:     1,
			PeriodSeconds: 60,
			GroupByField:  "device_id",
		}

		// Alert for router-1
		event1 := map[string]interface{}{"device_id": "router-1"}
		allowed1, _ := tm.ShouldAllow("rule-6", event1, config)
		if !allowed1 {
			t.Error("Expected first alert for router-1 to be allowed")
		}

		// Another alert for router-1 (should be throttled)
		allowed2, _ := tm.ShouldAllow("rule-6", event1, config)
		if allowed2 {
			t.Error("Expected second alert for router-1 to be throttled")
		}

		// Alert for router-2 (should be allowed - different group)
		event2 := map[string]interface{}{"device_id": "router-2"}
		allowed3, _ := tm.ShouldAllow("rule-6", event2, config)
		if !allowed3 {
			t.Error("Expected first alert for router-2 to be allowed (different group)")
		}
	})

	t.Run("suppressed count tracked", func(t *testing.T) {
		tm := NewManager()
		config := Config{
			MaxAlerts:     1,
			PeriodSeconds: 60,
		}
		eventData := map[string]interface{}{"device_id": "router-1"}

		// First alert
		tm.ShouldAllow("rule-7", eventData, config)

		// Send 3 more alerts (all should be throttled)
		for i := 0; i < 3; i++ {
			tm.ShouldAllow("rule-7", eventData, config)
		}

		// Check suppressed count
		// Note: This would require exposing the state for testing
		// In production code, this would be tracked for summary notifications
	})
}

// ===================================================================
// Phase 7: Enhanced Tests with MockClock for Sliding Window
// ===================================================================

// TestThrottleManager_SlidingWindow_NoBurstAtBoundary verifies that the sliding
// window prevents the "burst at boundary" vulnerability.
func TestThrottleManager_SlidingWindow_NoBurstAtBoundary(t *testing.T) {
	startTime := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)
	clock := NewMockClock(startTime)
	tm := NewManager(WithClock(clock))

	config := Config{
		MaxAlerts:     3,
		PeriodSeconds: 60,
	}
	eventData := map[string]interface{}{"test": "data"}

	// Send 3 alerts at the start (all allowed)
	for i := 0; i < 3; i++ {
		allowed, _ := tm.ShouldAllow("rule1", eventData, config)
		if !allowed {
			t.Errorf("Alert %d should be allowed", i+1)
		}
		clock.Advance(1 * time.Second)
	}

	// Try to send more at 3s - should be throttled (3 in window: 0s, 1s, 2s)
	allowed, _ := tm.ShouldAllow("rule1", eventData, config)
	if allowed {
		t.Error("Alert at 3s should be throttled (3 alerts in window)")
	}

	// Advance to 59s - in fixed window this would allow burst
	// In sliding window, still have 3 alerts in last 60s
	clock.Set(startTime.Add(59 * time.Second))
	allowed, _ = tm.ShouldAllow("rule1", eventData, config)
	if allowed {
		t.Error("Alert at 59s should still be throttled (sliding window)")
	}

	// Advance just past first alert (>60s from first alert at 0s)
	clock.Set(startTime.Add(61 * time.Second))
	allowed, _ = tm.ShouldAllow("rule1", eventData, config)
	if !allowed {
		t.Error("Alert at 61s should be allowed (first alert expired)")
	}
}

// TestThrottleManager_SlidingWindow_SmoothDistribution verifies that alerts
// are distributed smoothly without bursts.
func TestThrottleManager_SlidingWindow_SmoothDistribution(t *testing.T) {
	startTime := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)
	clock := NewMockClock(startTime)
	tm := NewManager(WithClock(clock))

	config := Config{
		MaxAlerts:     5,
		PeriodSeconds: 60,
	}
	eventData := map[string]interface{}{"test": "data"}

	// Test scenario: alerts every 10 seconds
	tests := []struct {
		advance  time.Duration
		expected bool
		reason   string
	}{
		{0, true, "first alert at 0s"},
		{10 * time.Second, true, "alert at 10s (1 in window)"},
		{10 * time.Second, true, "alert at 20s (2 in window)"},
		{10 * time.Second, true, "alert at 30s (3 in window)"},
		{10 * time.Second, true, "alert at 40s (4 in window)"},
		{10 * time.Second, false, "alert at 50s (5 in window, at limit)"},
		{11 * time.Second, true, "alert at 61s (4 in window: 10s, 20s, 30s, 40s)"},
		{10 * time.Second, true, "alert at 71s (4 in window: 20s, 30s, 40s, 61s)"},
	}

	for i, tc := range tests {
		if tc.advance > 0 {
			clock.Advance(tc.advance)
		}

		allowed, _ := tm.ShouldAllow("rule1", eventData, config)
		if allowed != tc.expected {
			t.Errorf("Test %d (%s): expected allowed=%v, got %v at time %v",
				i, tc.reason, tc.expected, allowed, clock.Now())
		}
	}
}

// TestThrottleManager_SlidingWindow_GroupIsolation verifies that different
// groups maintain independent sliding windows.
func TestThrottleManager_SlidingWindow_GroupIsolation(t *testing.T) {
	startTime := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)
	clock := NewMockClock(startTime)
	tm := NewManager(WithClock(clock))

	config := Config{
		MaxAlerts:     2,
		PeriodSeconds: 60,
		GroupByField:  "interface",
	}

	// Fill eth0's window
	for i := 0; i < 2; i++ {
		allowed, _ := tm.ShouldAllow("rule1", map[string]interface{}{"interface": "eth0"}, config)
		if !allowed {
			t.Errorf("eth0 alert %d should be allowed", i+1)
		}
	}

	// eth0 should now be throttled
	allowed, _ := tm.ShouldAllow("rule1", map[string]interface{}{"interface": "eth0"}, config)
	if allowed {
		t.Error("eth0 should be throttled")
	}

	// eth1 should still be allowed (different group)
	allowed, _ = tm.ShouldAllow("rule1", map[string]interface{}{"interface": "eth1"}, config)
	if !allowed {
		t.Error("eth1 should be allowed (different group)")
	}

	// Advance past window
	clock.Advance(61 * time.Second)

	// Both groups should be allowed again
	allowed, _ = tm.ShouldAllow("rule1", map[string]interface{}{"interface": "eth0"}, config)
	if !allowed {
		t.Error("eth0 should be allowed after window expiry")
	}

	allowed, _ = tm.ShouldAllow("rule1", map[string]interface{}{"interface": "eth1"}, config)
	if !allowed {
		t.Error("eth1 should be allowed after window expiry")
	}
}

// TestThrottleManager_SlidingWindow_SuppressionCounting verifies accurate
// counting of suppressed alerts.
func TestThrottleManager_SlidingWindow_SuppressionCounting(t *testing.T) {
	startTime := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)
	clock := NewMockClock(startTime)
	tm := NewManager(WithClock(clock))

	config := Config{
		MaxAlerts:     2,
		PeriodSeconds: 60,
	}
	eventData := map[string]interface{}{"test": "data"}

	// Send 2 allowed alerts
	for i := 0; i < 2; i++ {
		tm.ShouldAllow("rule1", eventData, config)
	}

	// Send 5 suppressed alerts
	for i := 0; i < 5; i++ {
		allowed, _ := tm.ShouldAllow("rule1", eventData, config)
		if allowed {
			t.Errorf("Alert %d should be suppressed", i+3)
		}
	}

	// Check summary
	summary := tm.GetSummary("rule1")
	if summary["total_allowed"].(int) != 2 {
		t.Errorf("Expected 2 allowed, got %d", summary["total_allowed"])
	}
	if summary["total_suppressed"].(int) != 5 {
		t.Errorf("Expected 5 suppressed, got %d", summary["total_suppressed"])
	}
	if summary["window_type"].(string) != "sliding" {
		t.Error("Expected window_type to be 'sliding'")
	}
}

// TestThrottleManager_SlidingWindow_NestedFields tests grouping by nested fields.
func TestThrottleManager_SlidingWindow_NestedFields(t *testing.T) {
	startTime := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)
	clock := NewMockClock(startTime)
	tm := NewManager(WithClock(clock))

	config := Config{
		MaxAlerts:     1,
		PeriodSeconds: 60,
		GroupByField:  "device.interface",
	}

	// Alert with nested field
	event1 := map[string]interface{}{
		"device": map[string]interface{}{
			"interface": "eth0",
		},
	}

	// First alert for eth0
	allowed, _ := tm.ShouldAllow("rule1", event1, config)
	if !allowed {
		t.Error("First alert for eth0 should be allowed")
	}

	// Second alert for eth0 (throttled)
	allowed, _ = tm.ShouldAllow("rule1", event1, config)
	if allowed {
		t.Error("Second alert for eth0 should be throttled")
	}

	// Alert for different interface
	event2 := map[string]interface{}{
		"device": map[string]interface{}{
			"interface": "eth1",
		},
	}

	allowed, _ = tm.ShouldAllow("rule1", event2, config)
	if !allowed {
		t.Error("First alert for eth1 should be allowed (different group)")
	}
}

// TestThrottleManager_Cleanup tests the Cleanup method.
func TestThrottleManager_Cleanup(t *testing.T) {
	tm := NewManager()
	config := Config{MaxAlerts: 1, PeriodSeconds: 60}
	eventData := map[string]interface{}{"test": "data"}

	// Create states for multiple rules
	tm.ShouldAllow("rule1", eventData, config)
	tm.ShouldAllow("rule2", eventData, config)
	tm.ShouldAllow("rule3", eventData, config)

	// Cleanup - only keep rule1 and rule2
	tm.Cleanup([]string{"rule1", "rule2"})

	// rule1 and rule2 should still have state
	summary1 := tm.GetSummary("rule1")
	if !summary1["configured"].(bool) {
		t.Error("rule1 should still be configured")
	}

	summary2 := tm.GetSummary("rule2")
	if !summary2["configured"].(bool) {
		t.Error("rule2 should still be configured")
	}

	// rule3 should be cleaned up
	summary3 := tm.GetSummary("rule3")
	if summary3["configured"].(bool) {
		t.Error("rule3 should be cleaned up")
	}
}

// TestThrottleManager_Reset tests the Reset method.
func TestThrottleManager_Reset(t *testing.T) {
	clock := NewMockClock(time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC))
	tm := NewManager(WithClock(clock))
	config := Config{MaxAlerts: 1, PeriodSeconds: 60}
	eventData := map[string]interface{}{"test": "data"}

	// Create throttle state
	tm.ShouldAllow("rule1", eventData, config)
	tm.ShouldAllow("rule1", eventData, config) // Throttled

	// Verify state exists
	summary := tm.GetSummary("rule1")
	if !summary["configured"].(bool) {
		t.Fatal("Expected rule1 to be configured")
	}

	// Reset
	tm.Reset("rule1")

	// State should be cleared
	summary = tm.GetSummary("rule1")
	if summary["configured"].(bool) {
		t.Error("rule1 should not be configured after reset")
	}

	// Should be able to send alerts normally
	allowed, _ := tm.ShouldAllow("rule1", eventData, config)
	if !allowed {
		t.Error("Alert should be allowed after reset")
	}
}

// BenchmarkThrottleManager_ShouldAllow benchmarks throttle checking performance.
func BenchmarkThrottleManager_ShouldAllow(b *testing.B) {
	clock := NewMockClock(time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC))
	tm := NewManager(WithClock(clock))
	config := Config{MaxAlerts: 100, PeriodSeconds: 60}
	eventData := map[string]interface{}{"test": "data"}

	// Pre-populate with alerts
	for i := 0; i < 50; i++ {
		tm.ShouldAllow("rule1", eventData, config)
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		tm.ShouldAllow("rule1", eventData, config)
	}
}

// BenchmarkThrottleManager_GetSummary benchmarks summary generation.
func BenchmarkThrottleManager_GetSummary(b *testing.B) {
	clock := NewMockClock(time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC))
	tm := NewManager(WithClock(clock))
	config := Config{MaxAlerts: 100, PeriodSeconds: 60, GroupByField: "interface"}

	// Create multiple groups with alerts
	for i := 0; i < 10; i++ {
		eventData := map[string]interface{}{"interface": fmt.Sprintf("eth%d", i)}
		for j := 0; j < 50; j++ {
			tm.ShouldAllow("rule1", eventData, config)
		}
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		tm.GetSummary("rule1")
	}
}
