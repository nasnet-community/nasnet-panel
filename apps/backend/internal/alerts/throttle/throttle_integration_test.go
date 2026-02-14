// Package alerts implements integration tests for throttle and storm detection
package throttle

import (
	"fmt"
	"sync"
	"testing"
	"time"
)

// TestIntegration_ThrottleAndStormDetector tests the full integration of
// throttle manager and storm detector working together.
func TestIntegration_ThrottleAndStormDetector(t *testing.T) {
	clock := NewMockClock(time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC))

	// Create throttle manager
	tm := NewThrottleManager(WithClock(clock))
	throttleConfig := ThrottleConfig{
		MaxAlerts:     5,
		PeriodSeconds: 60,
	}

	// Create storm detector
	stormConfig := StormConfig{
		Threshold:       50,
		WindowSeconds:   60,
		CooldownSeconds: 300,
	}
	sd := NewStormDetector(stormConfig, clock)

	eventData := map[string]interface{}{"device_id": "router-1"}

	// Scenario 1: Normal operation - below both limits
	for i := 0; i < 5; i++ {
		// Check throttle
		throttleAllowed, _ := tm.ShouldAllow("rule1", eventData, throttleConfig)
		if !throttleAllowed {
			t.Errorf("Alert %d: throttle should allow", i+1)
		}

		// Check storm detector
		stormAllowed := sd.RecordAlert()
		if !stormAllowed {
			t.Errorf("Alert %d: storm detector should allow", i+1)
		}
	}

	// Verify no storm
	stormStatus := sd.GetStatus()
	if stormStatus.InStorm {
		t.Error("Should not be in storm mode with 5 alerts")
	}

	// Scenario 2: Throttle limit reached but not storm
	for i := 0; i < 5; i++ {
		throttleAllowed, _ := tm.ShouldAllow("rule1", eventData, throttleConfig)
		if throttleAllowed {
			t.Error("Should be throttled after 5 alerts in window")
		}

		stormAllowed := sd.RecordAlert()
		if !stormAllowed {
			t.Error("Storm detector should still allow (below 50)")
		}
	}

	// Scenario 3: Storm threshold exceeded
	for i := 0; i < 45; i++ {
		sd.RecordAlert()
	}

	// Now at 55 total alerts - storm should activate
	if sd.RecordAlert() {
		t.Error("Storm detector should suppress after threshold")
	}

	stormStatus = sd.GetStatus()
	if !stormStatus.InStorm {
		t.Error("Should be in storm mode after 55 alerts")
	}

	// Scenario 4: During storm, throttle is irrelevant (storm takes precedence)
	clock.Advance(70 * time.Second) // Advance to clear throttle window

	// Throttle would allow (old alerts expired)
	throttleAllowed, _ := tm.ShouldAllow("rule1", eventData, throttleConfig)
	if !throttleAllowed {
		t.Error("Throttle should allow after window expiry")
	}

	// But storm still suppresses
	stormAllowed := sd.RecordAlert()
	if stormAllowed {
		t.Error("Storm detector should still suppress during cooldown")
	}
}

// TestIntegration_MultipleRulesWithStorm tests multiple throttle rules
// with shared storm detection.
func TestIntegration_MultipleRulesWithStorm(t *testing.T) {
	clock := NewMockClock(time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC))

	tm := NewThrottleManager(WithClock(clock))
	sd := NewStormDetector(DefaultStormConfig(), clock)

	rule1Config := ThrottleConfig{MaxAlerts: 5, PeriodSeconds: 60}
	rule2Config := ThrottleConfig{MaxAlerts: 10, PeriodSeconds: 60}

	eventData := map[string]interface{}{"test": "data"}

	// Send alerts for both rules
	for i := 0; i < 20; i++ {
		tm.ShouldAllow("rule1", eventData, rule1Config)
		tm.ShouldAllow("rule2", eventData, rule2Config)
		sd.RecordAlert()
		sd.RecordAlert()
	}

	// rule1 should be throttled (>5 in window)
	allowed1, _ := tm.ShouldAllow("rule1", eventData, rule1Config)
	if allowed1 {
		t.Error("rule1 should be throttled")
	}

	// rule2 should be throttled (>10 in window)
	allowed2, _ := tm.ShouldAllow("rule2", eventData, rule2Config)
	if allowed2 {
		t.Error("rule2 should be throttled")
	}

	// Check summaries
	summary1 := tm.GetSummary("rule1")
	if summary1["total_allowed"].(int) < 5 {
		t.Error("rule1 should have at least 5 allowed")
	}

	summary2 := tm.GetSummary("rule2")
	if summary2["total_allowed"].(int) < 10 {
		t.Error("rule2 should have at least 10 allowed")
	}

	// Storm detector should see total rate
	status := sd.GetStatus()
	if status.CurrentRate < 40 { // 40 alerts in 60 seconds
		t.Errorf("Expected rate >= 40, got %.2f", status.CurrentRate)
	}
}

// TestIntegration_ConcurrentAccessStressTest tests thread safety under load.
func TestIntegration_ConcurrentAccessStressTest(t *testing.T) {
	clock := NewMockClock(time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC))
	tm := NewThrottleManager(WithClock(clock))
	sd := NewStormDetector(DefaultStormConfig(), clock)

	config := ThrottleConfig{MaxAlerts: 100, PeriodSeconds: 60}

	var wg sync.WaitGroup
	numGoroutines := 20
	alertsPerGoroutine := 100

	// Concurrently send alerts
	for i := 0; i < numGoroutines; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			eventData := map[string]interface{}{"goroutine": fmt.Sprintf("worker-%d", id)}

			for j := 0; j < alertsPerGoroutine; j++ {
				tm.ShouldAllow("concurrent-rule", eventData, config)
				sd.RecordAlert()
			}
		}(i)
	}

	// Concurrently read status
	for i := 0; i < numGoroutines; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for j := 0; j < alertsPerGoroutine; j++ {
				tm.GetSummary("concurrent-rule")
				sd.GetStatus()
			}
		}()
	}

	wg.Wait()

	// Verify consistency
	summary := tm.GetSummary("concurrent-rule")
	if !summary["configured"].(bool) {
		t.Error("Expected rule to be configured")
	}

	status := sd.GetStatus()
	if status.CurrentRate < 0 {
		t.Error("Invalid negative rate")
	}
}

// TestIntegration_TimeBasedScenarios tests realistic time-based scenarios.
func TestIntegration_TimeBasedScenarios(t *testing.T) {
	startTime := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)
	clock := NewMockClock(startTime)
	tm := NewThrottleManager(WithClock(clock))
	sd := NewStormDetector(StormConfig{
		Threshold:       10,
		WindowSeconds:   60,
		CooldownSeconds: 120,
	}, clock)

	config := ThrottleConfig{MaxAlerts: 3, PeriodSeconds: 60}
	eventData := map[string]interface{}{"test": "data"}

	// Phase 1: Morning spike (0-11 seconds) - 11 alerts to trigger storm (threshold is 10)
	for i := 0; i < 11; i++ {
		tm.ShouldAllow("rule1", eventData, config)
		sd.RecordAlert()
		clock.Advance(1 * time.Second)
	}

	// Storm should be active (>10 alerts)
	status := sd.GetStatus()
	if !status.InStorm {
		t.Error("Storm should be active after morning spike (11 alerts > 10 threshold)")
	}

	// Phase 2: During cooldown
	// At 11s, storm started. Cooldown is 120s, so it ends at 131s
	// Test at 60s (still in cooldown)
	clock.Set(startTime.Add(60 * time.Second))
	if sd.RecordAlert() {
		t.Error("Alert at 60s should be suppressed during storm cooldown")
	}

	// Test at 120s (still in cooldown - ends at 131s)
	clock.Set(startTime.Add(120 * time.Second))
	if sd.RecordAlert() {
		t.Error("Alert at 120s should still be suppressed")
	}

	// Phase 3: After cooldown (at 132 seconds, past the 131s cooldown end)
	clock.Set(startTime.Add(132 * time.Second))

	// Storm should have cleared
	if !sd.RecordAlert() {
		t.Errorf("Alert at 132s should be allowed after cooldown. Status: InStorm=%v, Cooldown=%v",
			sd.GetStatus().InStorm, sd.GetStatus().CooldownRemaining)
	}

	status = sd.GetStatus()
	if status.InStorm {
		t.Errorf("Storm should be cleared after cooldown. Remaining: %v", status.CooldownRemaining)
	}

	// Phase 4: Normal operation resumes
	for i := 0; i < 3; i++ {
		allowed, _ := tm.ShouldAllow("rule1", eventData, config)
		if !allowed {
			t.Errorf("Alert %d should be allowed in normal operation", i+1)
		}

		if !sd.RecordAlert() {
			t.Error("Storm detector should allow in normal operation")
		}

		clock.Advance(1 * time.Second)
	}
}

// TestIntegration_FieldGroupingWithStorm tests grouped throttling with storm detection.
func TestIntegration_FieldGroupingWithStorm(t *testing.T) {
	clock := NewMockClock(time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC))
	tm := NewThrottleManager(WithClock(clock))
	sd := NewStormDetector(StormConfig{
		Threshold:       30,
		WindowSeconds:   60,
		CooldownSeconds: 60,
	}, clock)

	config := ThrottleConfig{
		MaxAlerts:     5,
		PeriodSeconds: 60,
		GroupByField:  "device",
	}

	// Send alerts for 3 different devices
	devices := []string{"router-1", "router-2", "router-3"}

	for _, device := range devices {
		for i := 0; i < 10; i++ {
			eventData := map[string]interface{}{"device": device}

			throttleAllowed, _ := tm.ShouldAllow("rule1", eventData, config)
			sd.RecordAlert() // Record for storm detection

			// First 5 per device should pass throttle
			if i < 5 && !throttleAllowed {
				t.Errorf("Alert %d for %s should pass throttle", i+1, device)
			}

			// After 5 per device, throttle should block
			if i >= 5 && throttleAllowed {
				t.Errorf("Alert %d for %s should be throttled", i+1, device)
			}
		}
	}

	// Send one more alert to trigger storm (31st > 30 threshold)
	stormAllowed := sd.RecordAlert()
	if stormAllowed {
		t.Error("31st alert should trigger storm (>30 threshold)")
	}

	// Verify per-device throttling
	summary := tm.GetSummary("rule1")
	groups := summary["groups"].([]map[string]interface{})
	if len(groups) != 3 {
		t.Errorf("Expected 3 groups, got %d", len(groups))
	}

	// Verify global storm
	status := sd.GetStatus()
	if !status.InStorm {
		t.Error("Expected storm mode after 31 alerts (threshold 30)")
	}
}

// TestIntegration_ResetAndRecovery tests system recovery after reset.
func TestIntegration_ResetAndRecovery(t *testing.T) {
	clock := NewMockClock(time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC))
	tm := NewThrottleManager(WithClock(clock))
	sd := NewStormDetector(StormConfig{
		Threshold:       10,
		WindowSeconds:   60,
		CooldownSeconds: 300,
	}, clock)

	config := ThrottleConfig{MaxAlerts: 5, PeriodSeconds: 60}
	eventData := map[string]interface{}{"test": "data"}

	// Create throttle and storm state
	for i := 0; i < 20; i++ {
		tm.ShouldAllow("rule1", eventData, config)
		sd.RecordAlert()
	}

	// Verify both are in suppression mode
	throttleAllowed, _ := tm.ShouldAllow("rule1", eventData, config)
	stormAllowed := sd.RecordAlert()

	if throttleAllowed {
		t.Error("Should be throttled before reset")
	}
	if stormAllowed {
		t.Error("Should be in storm before reset")
	}

	// Reset both
	tm.Reset("rule1")
	sd.Reset()

	// Both should allow alerts now
	throttleAllowed, _ = tm.ShouldAllow("rule1", eventData, config)
	stormAllowed = sd.RecordAlert()

	if !throttleAllowed {
		t.Error("Should allow after throttle reset")
	}
	if !stormAllowed {
		t.Error("Should allow after storm reset")
	}

	// Verify clean state
	summary := tm.GetSummary("rule1")
	if !summary["configured"].(bool) {
		t.Error("Rule should be configured after first alert post-reset")
	}

	status := sd.GetStatus()
	if status.InStorm {
		t.Error("Should not be in storm after reset")
	}
	if status.SuppressedCount != 0 {
		t.Error("Suppressed count should be 0 after reset")
	}
}

// BenchmarkIntegration_ThrottleAndStorm benchmarks the combined pipeline.
func BenchmarkIntegration_ThrottleAndStorm(b *testing.B) {
	clock := NewMockClock(time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC))
	tm := NewThrottleManager(WithClock(clock))
	sd := NewStormDetector(DefaultStormConfig(), clock)

	config := ThrottleConfig{MaxAlerts: 100, PeriodSeconds: 60}
	eventData := map[string]interface{}{"test": "data"}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		tm.ShouldAllow("bench-rule", eventData, config)
		sd.RecordAlert()
	}
}

// BenchmarkIntegration_ConcurrentPipeline benchmarks concurrent pipeline processing.
func BenchmarkIntegration_ConcurrentPipeline(b *testing.B) {
	clock := NewMockClock(time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC))
	tm := NewThrottleManager(WithClock(clock))
	sd := NewStormDetector(DefaultStormConfig(), clock)

	config := ThrottleConfig{MaxAlerts: 100, PeriodSeconds: 60}

	b.RunParallel(func(pb *testing.PB) {
		eventData := map[string]interface{}{"test": "data"}
		for pb.Next() {
			tm.ShouldAllow("bench-rule", eventData, config)
			sd.RecordAlert()
		}
	})
}
