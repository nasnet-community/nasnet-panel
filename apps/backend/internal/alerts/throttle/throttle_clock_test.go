package throttle

import (
	"sync"
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

func TestRealClock(t *testing.T) {
	clock := RealClock{}
	before := time.Now()
	clockTime := clock.Now()
	after := time.Now()

	if clockTime.Before(before) || clockTime.After(after) {
		t.Errorf("RealClock.Now() returned time outside expected range")
	}
}

func TestMockClock_NewMockClock(t *testing.T) {
	tests := []struct {
		name     string
		input    time.Time
		expected time.Time
	}{
		{
			name:     "zero time defaults to epoch",
			input:    time.Time{},
			expected: time.Unix(0, 0),
		},
		{
			name:     "non-zero time is preserved",
			input:    time.Date(2024, 1, 1, 12, 0, 0, 0, time.UTC),
			expected: time.Date(2024, 1, 1, 12, 0, 0, 0, time.UTC),
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			clock := NewMockClock(tt.input)
			if !clock.Now().Equal(tt.expected) {
				t.Errorf("NewMockClock(%v).Now() = %v, want %v", tt.input, clock.Now(), tt.expected)
			}
		})
	}
}

func TestMockClock_Set(t *testing.T) {
	clock := NewMockClock(time.Unix(0, 0))
	newTime := time.Date(2024, 6, 15, 10, 30, 0, 0, time.UTC)

	clock.Set(newTime)

	if !clock.Now().Equal(newTime) {
		t.Errorf("Set(%v) failed, Now() = %v", newTime, clock.Now())
	}
}

func TestMockClock_Advance(t *testing.T) {
	start := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)
	clock := NewMockClock(start)

	tests := []struct {
		name     string
		advance  time.Duration
		expected time.Time
	}{
		{
			name:     "advance by seconds",
			advance:  30 * time.Second,
			expected: start.Add(30 * time.Second),
		},
		{
			name:     "advance by minutes",
			advance:  5 * time.Minute,
			expected: start.Add(30*time.Second + 5*time.Minute),
		},
		{
			name:     "advance by hours",
			advance:  2 * time.Hour,
			expected: start.Add(30*time.Second + 5*time.Minute + 2*time.Hour),
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			clock.Advance(tt.advance)
			if !clock.Now().Equal(tt.expected) {
				t.Errorf("After Advance(%v), Now() = %v, want %v", tt.advance, clock.Now(), tt.expected)
			}
		})
	}
}

func TestMockClock_ConcurrentAccess(t *testing.T) {
	clock := NewMockClock(time.Unix(0, 0))
	done := make(chan bool)

	// Reader goroutines
	for i := 0; i < 10; i++ {
		go func() {
			for j := 0; j < 100; j++ {
				_ = clock.Now()
			}
			done <- true
		}()
	}

	// Writer goroutines
	for i := 0; i < 5; i++ {
		go func() {
			for j := 0; j < 100; j++ {
				clock.Advance(time.Second)
			}
			done <- true
		}()
	}

	// Wait for all goroutines
	for i := 0; i < 15; i++ {
		<-done
	}

	// Verify final time (5 writers * 100 advances * 1 second = 500 seconds)
	expected := time.Unix(500, 0)
	if !clock.Now().Equal(expected) {
		t.Errorf("After concurrent access, Now() = %v, want %v", clock.Now(), expected)
	}
}

// =============================================================================
// Storm detector tests (merged from storm_detector_test.go)
// =============================================================================

// TestStormDetector_NoStorm tests normal operation below threshold
func TestStormDetector_NoStorm(t *testing.T) {
	clock := NewMockClock(time.Now())
	config := StormConfig{
		Threshold:       100,
		WindowSeconds:   60,
		CooldownSeconds: 300,
	}
	sd := NewStormDetector(config, clock)

	// Send alerts below threshold
	for i := 0; i < 50; i++ {
		if !sd.RecordAlert() {
			t.Errorf("Alert %d was suppressed, expected to be allowed", i)
		}
	}

	status := sd.GetStatus()
	if status.InStorm {
		t.Error("Expected no storm mode with 50 alerts")
	}
	if status.SuppressedCount != 0 {
		t.Errorf("Expected 0 suppressed, got %d", status.SuppressedCount)
	}
}

// TestStormDetector_ThresholdTrigger tests storm activation at threshold
func TestStormDetector_ThresholdTrigger(t *testing.T) {
	clock := NewMockClock(time.Now())
	config := StormConfig{
		Threshold:       100,
		WindowSeconds:   60,
		CooldownSeconds: 300,
	}
	sd := NewStormDetector(config, clock)

	// Send exactly threshold alerts (should all be allowed)
	for i := 0; i < 100; i++ {
		if !sd.RecordAlert() {
			t.Errorf("Alert %d was suppressed, expected to be allowed", i)
		}
	}

	// 101st alert should trigger storm mode
	if sd.RecordAlert() {
		t.Error("Alert 101 was allowed, expected storm mode to activate")
	}

	status := sd.GetStatus()
	if !status.InStorm {
		t.Error("Expected storm mode to be active after threshold exceeded")
	}
	if status.StormStartTime.IsZero() {
		t.Error("Expected storm start time to be set")
	}
}

// TestStormDetector_Cooldown tests cooldown period behavior
func TestStormDetector_Cooldown(t *testing.T) {
	clock := NewMockClock(time.Now())
	config := StormConfig{
		Threshold:       10,
		WindowSeconds:   60,
		CooldownSeconds: 300,
	}
	sd := NewStormDetector(config, clock)

	// Trigger storm
	for i := 0; i < 11; i++ {
		sd.RecordAlert()
	}

	status := sd.GetStatus()
	if !status.InStorm {
		t.Fatal("Expected storm mode to be active")
	}

	// Try to send alert during cooldown
	clock.Advance(60 * time.Second) // Advance 1 minute
	if sd.RecordAlert() {
		t.Error("Alert was allowed during cooldown period")
	}

	status = sd.GetStatus()
	if status.SuppressedCount != 1 {
		t.Errorf("Expected 1 suppressed alert, got %d", status.SuppressedCount)
	}
	if status.CooldownRemaining <= 0 {
		t.Error("Expected cooldown remaining to be positive")
	}

	// Advance past cooldown period
	clock.Advance(240 * time.Second) // Total 5 minutes = 300 seconds

	// Next alert should be allowed (storm mode exits)
	if !sd.RecordAlert() {
		t.Error("Alert was suppressed after cooldown expired")
	}

	status = sd.GetStatus()
	if status.InStorm {
		t.Error("Expected storm mode to be inactive after cooldown")
	}
}

// TestStormDetector_WindowSliding tests that old alerts slide out of window
func TestStormDetector_WindowSliding(t *testing.T) {
	clock := NewMockClock(time.Now())
	config := StormConfig{
		Threshold:       10,
		WindowSeconds:   60,
		CooldownSeconds: 300,
	}
	sd := NewStormDetector(config, clock)

	// Send 10 alerts (at threshold)
	for i := 0; i < 10; i++ {
		if !sd.RecordAlert() {
			t.Errorf("Alert %d was suppressed", i)
		}
	}

	// Advance time past window
	clock.Advance(61 * time.Second)

	// Old alerts should have slid out, new alert should be allowed
	if !sd.RecordAlert() {
		t.Error("Alert was suppressed after window expired")
	}

	status := sd.GetStatus()
	if status.InStorm {
		t.Error("Expected no storm mode after window expired")
	}
}

// TestStormDetector_CurrentRate tests rate calculation
func TestStormDetector_CurrentRate(t *testing.T) {
	clock := NewMockClock(time.Now())
	config := StormConfig{
		Threshold:       100,
		WindowSeconds:   60,
		CooldownSeconds: 300,
	}
	sd := NewStormDetector(config, clock)

	// Send 30 alerts
	for i := 0; i < 30; i++ {
		sd.RecordAlert()
	}

	status := sd.GetStatus()
	// 30 alerts in 60 seconds = 30 alerts/min
	if status.CurrentRate < 29 || status.CurrentRate > 31 {
		t.Errorf("Expected rate ~30/min, got %.2f", status.CurrentRate)
	}
}

// TestStormDetector_SuppressedCount tests suppression counting
func TestStormDetector_SuppressedCount(t *testing.T) {
	clock := NewMockClock(time.Now())
	config := StormConfig{
		Threshold:       5,
		WindowSeconds:   60,
		CooldownSeconds: 60,
	}
	sd := NewStormDetector(config, clock)

	// Trigger storm
	for i := 0; i < 6; i++ {
		sd.RecordAlert()
	}

	status := sd.GetStatus()
	if !status.InStorm {
		t.Fatal("Expected storm mode")
	}

	// Send 10 more alerts during storm
	for i := 0; i < 10; i++ {
		if sd.RecordAlert() {
			t.Error("Alert was allowed during storm")
		}
	}

	status = sd.GetStatus()
	if status.SuppressedCount != 10 {
		t.Errorf("Expected 10 suppressed, got %d", status.SuppressedCount)
	}
}

// TestStormDetector_Reset tests manual reset functionality
func TestStormDetector_Reset(t *testing.T) {
	clock := NewMockClock(time.Now())
	config := StormConfig{
		Threshold:       10,
		WindowSeconds:   60,
		CooldownSeconds: 300,
	}
	sd := NewStormDetector(config, clock)

	// Trigger storm
	for i := 0; i < 15; i++ {
		sd.RecordAlert()
	}

	status := sd.GetStatus()
	if !status.InStorm {
		t.Fatal("Expected storm mode")
	}

	// Reset
	sd.Reset()

	status = sd.GetStatus()
	if status.InStorm {
		t.Error("Expected storm mode to be inactive after reset")
	}
	if status.SuppressedCount != 0 {
		t.Error("Expected suppressed count to be 0 after reset")
	}
	if status.CurrentRate != 0 {
		t.Error("Expected current rate to be 0 after reset")
	}

	// Should be able to send alerts normally
	if !sd.RecordAlert() {
		t.Error("Alert was suppressed after reset")
	}
}

// TestStormDetector_ConcurrentAccess tests thread safety
func TestStormDetector_ConcurrentAccess(t *testing.T) {
	clock := NewMockClock(time.Now())
	config := StormConfig{
		Threshold:       1000,
		WindowSeconds:   60,
		CooldownSeconds: 300,
	}
	sd := NewStormDetector(config, clock)

	var wg sync.WaitGroup
	numGoroutines := 10
	alertsPerGoroutine := 100

	// Concurrently record alerts
	for i := 0; i < numGoroutines; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for j := 0; j < alertsPerGoroutine; j++ {
				sd.RecordAlert()
			}
		}()
	}

	// Concurrently read status
	for i := 0; i < numGoroutines; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for j := 0; j < alertsPerGoroutine; j++ {
				sd.GetStatus()
			}
		}()
	}

	wg.Wait()

	// Verify final state is consistent
	status := sd.GetStatus()
	if status.CurrentRate < 0 {
		t.Error("Invalid negative rate")
	}
}

// TestStormDetector_Performance tests that checks complete within 1ms
func TestStormDetector_Performance(t *testing.T) {
	clock := NewMockClock(time.Now())
	config := StormConfig{
		Threshold:       100,
		WindowSeconds:   60,
		CooldownSeconds: 300,
	}
	sd := NewStormDetector(config, clock)

	// Pre-populate with alerts near threshold
	for i := 0; i < 90; i++ {
		sd.RecordAlert()
	}

	// Measure time for 1000 operations
	start := time.Now()
	for i := 0; i < 1000; i++ {
		sd.RecordAlert()
	}
	elapsed := time.Since(start)

	avgPerOp := elapsed / 1000
	if avgPerOp > time.Millisecond {
		t.Errorf("Performance requirement violated: avg %v per operation (max 1ms)", avgPerOp)
	}
}

// TestStormDetector_DefaultConfig tests default configuration
func TestStormDetector_DefaultConfig(t *testing.T) {
	config := DefaultStormConfig()

	if config.Threshold != 100 {
		t.Errorf("Expected threshold 100, got %d", config.Threshold)
	}
	if config.WindowSeconds != 60 {
		t.Errorf("Expected window 60s, got %d", config.WindowSeconds)
	}
	if config.CooldownSeconds != 300 {
		t.Errorf("Expected cooldown 300s, got %d", config.CooldownSeconds)
	}
}

// TestStormDetector_NilClock tests that nil clock defaults to RealClock
func TestStormDetector_NilClock(t *testing.T) {
	config := DefaultStormConfig()
	sd := NewStormDetector(config, nil)

	// Should not panic
	if !sd.RecordAlert() {
		t.Error("Alert was suppressed with empty state")
	}

	status := sd.GetStatus()
	if status.InStorm {
		t.Error("Unexpected storm mode")
	}
}

// TestStormDetector_CooldownRemaining tests cooldown calculation
func TestStormDetector_CooldownRemaining(t *testing.T) {
	clock := NewMockClock(time.Now())
	config := StormConfig{
		Threshold:       5,
		WindowSeconds:   60,
		CooldownSeconds: 300,
	}
	sd := NewStormDetector(config, clock)

	// Trigger storm
	for i := 0; i < 6; i++ {
		sd.RecordAlert()
	}

	// Check remaining time
	status := sd.GetStatus()
	if status.CooldownRemaining <= 0 {
		t.Error("Expected positive cooldown remaining")
	}
	if status.CooldownRemaining > 300*time.Second {
		t.Errorf("Cooldown remaining too large: %v", status.CooldownRemaining)
	}

	// Advance partway through cooldown
	clock.Advance(100 * time.Second)
	status = sd.GetStatus()
	if status.CooldownRemaining <= 0 || status.CooldownRemaining >= 300*time.Second {
		t.Errorf("Expected cooldown remaining ~200s, got %v", status.CooldownRemaining)
	}

	// Advance past cooldown
	clock.Advance(210 * time.Second)
	status = sd.GetStatus()
	if status.CooldownRemaining != 0 {
		t.Errorf("Expected cooldown remaining 0, got %v", status.CooldownRemaining)
	}
}
