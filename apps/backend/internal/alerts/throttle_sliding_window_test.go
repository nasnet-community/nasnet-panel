package alerts

import (
	"testing"
	"time"
)

// TestSlidingWindow_NoBurstAtBoundary demonstrates that sliding window prevents
// the "burst at boundary" exploit where 2x limit can be sent at period edges.
func TestSlidingWindow_NoBurstAtBoundary(t *testing.T) {
	startTime := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)
	clock := NewMockClock(startTime)
	tm := NewThrottleManager(WithClock(clock))

	config := ThrottleConfig{
		MaxAlerts:     3,
		PeriodSeconds: 60, // 1 minute window
	}

	eventData := map[string]interface{}{"test": "data"}

	// Send 3 alerts at the start (all should be allowed)
	for i := 0; i < 3; i++ {
		allowed, _ := tm.ShouldAllow("rule1", eventData, config)
		if !allowed {
			t.Errorf("Alert %d should be allowed", i+1)
		}
		clock.Advance(1 * time.Second)
	}

	// Try to send more - should be throttled
	allowed, _ := tm.ShouldAllow("rule1", eventData, config)
	if allowed {
		t.Errorf("Alert 4 should be throttled (3 in window)")
	}

	// Advance to 58 seconds (just before the "fixed window" would expire)
	// In a fixed window, this would allow 3 more alerts
	// In a sliding window, we still have 3 alerts in the last 60 seconds
	clock.Advance(55 * time.Second) // Now at 59 seconds total

	allowed, _ = tm.ShouldAllow("rule1", eventData, config)
	if allowed {
		t.Errorf("Alert at 59s should still be throttled (sliding window)")
	}

	// Advance just past the first alert (60+ seconds from start)
	clock.Advance(2 * time.Second) // Now at 61 seconds total

	// Now the first alert (at 0s) has fallen out of the 60s window
	// We should be able to send 1 alert
	allowed, _ = tm.ShouldAllow("rule1", eventData, config)
	if !allowed {
		t.Errorf("Alert at 61s should be allowed (first alert expired from window)")
	}

	// But immediately trying another should fail (still have 3 in window: 1s, 2s, 61s)
	allowed, _ = tm.ShouldAllow("rule1", eventData, config)
	if allowed {
		t.Errorf("Second alert at 61s should be throttled")
	}

	// Advance past the second alert
	clock.Advance(2 * time.Second) // Now at 63 seconds total

	// Now we should be able to send another (alerts at 2s, 61s, 63s)
	allowed, _ = tm.ShouldAllow("rule1", eventData, config)
	if !allowed {
		t.Errorf("Alert at 63s should be allowed")
	}
}

// TestSlidingWindow_SmoothRateLimiting tests that sliding window provides
// smooth rate limiting without bursts.
func TestSlidingWindow_SmoothRateLimiting(t *testing.T) {
	startTime := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)
	clock := NewMockClock(startTime)
	tm := NewThrottleManager(WithClock(clock))

	config := ThrottleConfig{
		MaxAlerts:     5,
		PeriodSeconds: 60, // 5 alerts per minute
	}

	eventData := map[string]interface{}{"test": "data"}

	// Simulate sending alerts every 10 seconds (smooth distribution)
	// This should allow exactly 5 alerts per 60-second window, no more
	// Note: throttled alerts are NOT added to the window
	results := []struct {
		time     time.Duration
		expected bool
		reason   string
	}{
		{0, true, "first alert at 0s"},
		{10 * time.Second, true, "second alert at 10s (1 in window: 0s)"},
		{10 * time.Second, true, "third alert at 20s (2 in window: 0s, 10s)"},
		{10 * time.Second, true, "fourth alert at 30s (3 in window: 0s, 10s, 20s)"},
		{10 * time.Second, true, "fifth alert at 40s (4 in window: 0s, 10s, 20s, 30s)"},
		{10 * time.Second, false, "sixth alert at 50s (5 in window, at limit - NOT added)"},
		{11 * time.Second, true, "seventh alert at 61s (4 in window: 10s, 20s, 30s, 40s)"},
		{10 * time.Second, true, "eighth alert at 71s (4 in window: 20s, 30s, 40s, 61s)"},
		{1 * time.Second, true, "ninth alert at 72s (5 in window: 20s, 30s, 40s, 61s, 71s)"},
		{1 * time.Second, false, "tenth alert at 73s (5 in window at limit)"},
	}

	for i, tc := range results {
		if tc.time > 0 {
			clock.Advance(tc.time)
		}

		allowed, summary := tm.ShouldAllow("rule1", eventData, config)
		if allowed != tc.expected {
			t.Errorf("Test %d (%s): expected allowed=%v, got %v (summary: %s) at time %v",
				i, tc.reason, tc.expected, allowed, summary, clock.Now())
		}
	}
}

// TestSlidingWindow_GroupIsolation tests that different groups maintain
// independent sliding windows.
func TestSlidingWindow_GroupIsolation(t *testing.T) {
	startTime := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)
	clock := NewMockClock(startTime)
	tm := NewThrottleManager(WithClock(clock))

	config := ThrottleConfig{
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
		t.Errorf("eth0 should be throttled")
	}

	// But eth1 should still be allowed (different group)
	allowed, _ = tm.ShouldAllow("rule1", map[string]interface{}{"interface": "eth1"}, config)
	if !allowed {
		t.Errorf("eth1 should be allowed (different group)")
	}

	allowed, _ = tm.ShouldAllow("rule1", map[string]interface{}{"interface": "eth1"}, config)
	if !allowed {
		t.Errorf("eth1 second alert should be allowed")
	}

	// Now eth1 should also be throttled
	allowed, _ = tm.ShouldAllow("rule1", map[string]interface{}{"interface": "eth1"}, config)
	if allowed {
		t.Errorf("eth1 should now be throttled")
	}

	// Advance time past window for eth0
	clock.Advance(61 * time.Second)

	// eth0 should be allowed again
	allowed, _ = tm.ShouldAllow("rule1", map[string]interface{}{"interface": "eth0"}, config)
	if !allowed {
		t.Errorf("eth0 should be allowed after window expiry")
	}

	// eth1 should also be allowed (same time has passed)
	allowed, _ = tm.ShouldAllow("rule1", map[string]interface{}{"interface": "eth1"}, config)
	if !allowed {
		t.Errorf("eth1 should be allowed after window expiry")
	}
}

// TestSlidingWindow_SuppressionCounting tests that suppressed alerts are
// correctly counted.
func TestSlidingWindow_SuppressionCounting(t *testing.T) {
	startTime := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)
	clock := NewMockClock(startTime)
	tm := NewThrottleManager(WithClock(clock))

	config := ThrottleConfig{
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
}

// TestSlidingWindow_RingBufferWrapAround tests that the ring buffer correctly
// wraps around and overwrites old data.
func TestSlidingWindow_RingBufferWrapAround(t *testing.T) {
	startTime := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)
	clock := NewMockClock(startTime)
	tm := NewThrottleManager(WithClock(clock))

	config := ThrottleConfig{
		MaxAlerts:     3,
		PeriodSeconds: 60,
	}

	eventData := map[string]interface{}{"test": "data"}

	// Fill the ring buffer
	for i := 0; i < 3; i++ {
		tm.ShouldAllow("rule1", eventData, config)
		clock.Advance(1 * time.Second)
	}

	// Advance past the window so all timestamps expire
	clock.Advance(60 * time.Second) // Now at 63 seconds

	// Send 3 more alerts - should reuse the buffer slots
	for i := 0; i < 3; i++ {
		allowed, _ := tm.ShouldAllow("rule1", eventData, config)
		if !allowed {
			t.Errorf("Alert %d after window reset should be allowed", i+1)
		}
		clock.Advance(1 * time.Second)
	}

	// Verify we're at the limit
	allowed, _ := tm.ShouldAllow("rule1", eventData, config)
	if allowed {
		t.Errorf("Should be throttled after refilling buffer")
	}
}

// TestSlidingWindow_Performance tests that window operations are O(maxAlerts).
func TestSlidingWindow_Performance(t *testing.T) {
	startTime := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)
	clock := NewMockClock(startTime)
	tm := NewThrottleManager(WithClock(clock))

	config := ThrottleConfig{
		MaxAlerts:     100, // Large window
		PeriodSeconds: 300,
	}

	eventData := map[string]interface{}{"test": "data"}

	// Fill the window with 100 alerts
	start := time.Now()
	for i := 0; i < 100; i++ {
		tm.ShouldAllow("rule1", eventData, config)
		clock.Advance(1 * time.Second)
	}

	// Perform 1000 throttle checks
	for i := 0; i < 1000; i++ {
		tm.ShouldAllow("rule1", eventData, config)
	}
	elapsed := time.Since(start)

	// Should complete in well under 100ms for 1000 operations
	if elapsed > 100*time.Millisecond {
		t.Errorf("Performance test took too long: %v (expected <100ms)", elapsed)
	}

	// Average should be <0.1ms per operation
	avgPerOp := elapsed / 1000
	if avgPerOp > 100*time.Microsecond {
		t.Logf("Warning: Average per operation is %v (expected <100µs)", avgPerOp)
	}
}

// TestSlidingWindow_CleanupReducesMemory tests that cleanup() removes
// expired timestamps to prevent memory growth.
func TestSlidingWindow_CleanupReducesMemory(t *testing.T) {
	startTime := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)
	clock := NewMockClock(startTime)
	tm := NewThrottleManager(WithClock(clock))

	config := ThrottleConfig{
		MaxAlerts:     10,
		PeriodSeconds: 60,
	}

	eventData := map[string]interface{}{"test": "data"}

	// Fill window with 10 alerts
	for i := 0; i < 10; i++ {
		tm.ShouldAllow("rule1", eventData, config)
		clock.Advance(1 * time.Second)
	}

	// Get the group state
	tm.mu.RLock()
	state := tm.states["rule1"]
	tm.mu.RUnlock()

	state.mu.Lock()
	groupState := state.groupStates["default"]
	initialSize := groupState.size
	state.mu.Unlock()

	if initialSize != 10 {
		t.Errorf("Expected initial size 10, got %d", initialSize)
	}

	// Advance past the window
	clock.Advance(70 * time.Second)

	// Trigger cleanup by calling ShouldAllow
	tm.ShouldAllow("rule1", eventData, config)

	// Check that size has been reduced
	state.mu.Lock()
	finalSize := groupState.size
	state.mu.Unlock()

	// All old timestamps should be cleaned up, leaving only the new one
	if finalSize > 1 {
		t.Errorf("Expected size <= 1 after cleanup, got %d", finalSize)
	}
}
