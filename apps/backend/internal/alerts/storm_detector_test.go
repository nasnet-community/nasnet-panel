// Package alerts implements storm detector testing
package alerts

import (
	"sync"
	"testing"
	"time"
)

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
