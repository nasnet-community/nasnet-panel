package orchestrator

import (
	"context"
	"errors"
	"fmt"
	"sync"
	"testing"
	"time"

	"backend/internal/events"
	"backend/internal/features"

	"github.com/rs/zerolog"
)

// mockProbe is a test probe that can be configured to succeed or fail
type mockProbe struct {
	name       string
	shouldFail bool
	delay      time.Duration
	callCount  int
	mu         sync.Mutex
}

func newMockProbe(name string) *mockProbe {
	return &mockProbe{name: name}
}

func (m *mockProbe) Check(ctx context.Context) error {
	m.mu.Lock()
	m.callCount++
	m.mu.Unlock()

	if m.delay > 0 {
		time.Sleep(m.delay)
	}

	if m.shouldFail {
		return fmt.Errorf("mock probe %s failed", m.name)
	}
	return nil
}

func (m *mockProbe) Name() string {
	return m.name
}

func (m *mockProbe) GetCallCount() int {
	m.mu.Lock()
	defer m.mu.Unlock()
	return m.callCount
}

func (m *mockProbe) SetShouldFail(fail bool) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.shouldFail = fail
}

// testRestartChan creates a buffered channel for restart requests
func testRestartChan() chan RestartRequest {
	return make(chan RestartRequest, 10)
}

// testLogger creates a no-op logger for tests
func testLogger() zerolog.Logger {
	return zerolog.Nop()
}

// testPublisher creates a mock event publisher
func testPublisher() *events.Publisher {
	// For now, return nil - full publisher requires Watermill setup
	// In integration tests, we'll use a real publisher
	return nil
}

func TestNewHealthChecker(t *testing.T) {
	restartChan := testRestartChan()
	hc := NewHealthChecker(testLogger(), testPublisher(), restartChan)

	if hc == nil {
		t.Fatal("Expected non-nil HealthChecker")
	}

	if hc.instances == nil {
		t.Error("Expected initialized instances map")
	}

	if hc.probeSemaphore == nil {
		t.Error("Expected initialized probe semaphore")
	}

	if cap(hc.probeSemaphore) != maxConcurrentProbes {
		t.Errorf("Expected semaphore capacity %d, got %d", maxConcurrentProbes, cap(hc.probeSemaphore))
	}
}

func TestHealthChecker_AddInstance(t *testing.T) {
	restartChan := testRestartChan()
	hc := NewHealthChecker(testLogger(), testPublisher(), restartChan)

	probe := newMockProbe("test-probe")
	healthSpec := &features.HealthSpec{
		IntervalSeconds:  60,
		FailureThreshold: 5,
		AutoRestart:      false,
	}

	hc.AddInstance("inst-1", "feature-1", "router-1", probe, healthSpec)

	hc.mu.RLock()
	state, exists := hc.instances["inst-1"]
	hc.mu.RUnlock()

	if !exists {
		t.Fatal("Expected instance to be added")
	}

	if state.InstanceID != "inst-1" {
		t.Errorf("Expected instance ID 'inst-1', got '%s'", state.InstanceID)
	}

	if state.FeatureID != "feature-1" {
		t.Errorf("Expected feature ID 'feature-1', got '%s'", state.FeatureID)
	}

	if state.CheckInterval != 60*time.Second {
		t.Errorf("Expected check interval 60s, got %v", state.CheckInterval)
	}

	if state.FailureThreshold != 5 {
		t.Errorf("Expected failure threshold 5, got %d", state.FailureThreshold)
	}

	if state.AutoRestart != false {
		t.Error("Expected auto-restart to be false")
	}

	if state.CurrentState != HealthStateUnknown {
		t.Errorf("Expected initial state UNKNOWN, got %v", state.CurrentState)
	}
}

func TestHealthChecker_AddInstance_Defaults(t *testing.T) {
	restartChan := testRestartChan()
	hc := NewHealthChecker(testLogger(), testPublisher(), restartChan)

	probe := newMockProbe("test-probe")

	// Add instance with nil health spec (should use defaults)
	hc.AddInstance("inst-1", "feature-1", "router-1", probe, nil)

	hc.mu.RLock()
	state := hc.instances["inst-1"]
	hc.mu.RUnlock()

	if state.CheckInterval != defaultCheckInterval {
		t.Errorf("Expected default check interval %v, got %v", defaultCheckInterval, state.CheckInterval)
	}

	if state.FailureThreshold != defaultFailureThreshold {
		t.Errorf("Expected default failure threshold %d, got %d", defaultFailureThreshold, state.FailureThreshold)
	}

	if state.AutoRestart != defaultAutoRestart {
		t.Errorf("Expected default auto-restart %v, got %v", defaultAutoRestart, state.AutoRestart)
	}
}

func TestHealthChecker_RemoveInstance(t *testing.T) {
	restartChan := testRestartChan()
	hc := NewHealthChecker(testLogger(), testPublisher(), restartChan)

	probe := newMockProbe("test-probe")
	hc.AddInstance("inst-1", "feature-1", "router-1", probe, nil)

	hc.RemoveInstance("inst-1")

	hc.mu.RLock()
	_, exists := hc.instances["inst-1"]
	hc.mu.RUnlock()

	if exists {
		t.Error("Expected instance to be removed")
	}
}

func TestHealthChecker_GetInstanceHealth(t *testing.T) {
	restartChan := testRestartChan()
	hc := NewHealthChecker(testLogger(), testPublisher(), restartChan)

	probe := newMockProbe("test-probe")
	hc.AddInstance("inst-1", "feature-1", "router-1", probe, nil)

	health, err := hc.GetInstanceHealth("inst-1")
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	if health.InstanceID != "inst-1" {
		t.Errorf("Expected instance ID 'inst-1', got '%s'", health.InstanceID)
	}

	if health.CurrentState != HealthStateUnknown {
		t.Errorf("Expected state UNKNOWN, got %v", health.CurrentState)
	}
}

func TestHealthChecker_GetInstanceHealth_NotFound(t *testing.T) {
	restartChan := testRestartChan()
	hc := NewHealthChecker(testLogger(), testPublisher(), restartChan)

	_, err := hc.GetInstanceHealth("nonexistent")
	if err == nil {
		t.Error("Expected error for nonexistent instance")
	}
}

func TestHealthChecker_UpdateConfig(t *testing.T) {
	restartChan := testRestartChan()
	hc := NewHealthChecker(testLogger(), testPublisher(), restartChan)

	probe := newMockProbe("test-probe")
	hc.AddInstance("inst-1", "feature-1", "router-1", probe, nil)

	err := hc.UpdateConfig("inst-1", 45*time.Second, 7)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	health, _ := hc.GetInstanceHealth("inst-1")
	if health.CheckInterval != 45*time.Second {
		t.Errorf("Expected check interval 45s, got %v", health.CheckInterval)
	}

	if health.FailureThreshold != 7 {
		t.Errorf("Expected failure threshold 7, got %d", health.FailureThreshold)
	}
}

func TestHealthChecker_UpdateConfig_InvalidInterval(t *testing.T) {
	restartChan := testRestartChan()
	hc := NewHealthChecker(testLogger(), testPublisher(), restartChan)

	probe := newMockProbe("test-probe")
	hc.AddInstance("inst-1", "feature-1", "router-1", probe, nil)

	// Too short
	err := hc.UpdateConfig("inst-1", 5*time.Second, 3)
	if err == nil {
		t.Error("Expected error for interval too short")
	}

	// Too long
	err = hc.UpdateConfig("inst-1", 10*time.Minute, 3)
	if err == nil {
		t.Error("Expected error for interval too long")
	}
}

func TestHealthChecker_UpdateConfig_InvalidThreshold(t *testing.T) {
	restartChan := testRestartChan()
	hc := NewHealthChecker(testLogger(), testPublisher(), restartChan)

	probe := newMockProbe("test-probe")
	hc.AddInstance("inst-1", "feature-1", "router-1", probe, nil)

	// Too low
	err := hc.UpdateConfig("inst-1", 30*time.Second, 0)
	if err == nil {
		t.Error("Expected error for threshold too low")
	}

	// Too high
	err = hc.UpdateConfig("inst-1", 30*time.Second, 15)
	if err == nil {
		t.Error("Expected error for threshold too high")
	}
}

func TestHealthChecker_UpdateConfig_NotFound(t *testing.T) {
	restartChan := testRestartChan()
	hc := NewHealthChecker(testLogger(), testPublisher(), restartChan)

	err := hc.UpdateConfig("nonexistent", 30*time.Second, 3)
	if err == nil {
		t.Error("Expected error for nonexistent instance")
	}
}

func TestHealthChecker_HealthCheckSuccess(t *testing.T) {
	restartChan := testRestartChan()
	hc := NewHealthChecker(testLogger(), testPublisher(), restartChan)

	probe := newMockProbe("test-probe")
	hc.AddInstance("inst-1", "feature-1", "router-1", probe, nil)

	// Get initial state
	hc.mu.RLock()
	state := hc.instances["inst-1"]
	hc.mu.RUnlock()

	// Manually perform health check
	hc.performHealthCheck(state)

	// Check results
	state.mu.RLock()
	defer state.mu.RUnlock()

	if state.CurrentState != HealthStateHealthy {
		t.Errorf("Expected state HEALTHY, got %v", state.CurrentState)
	}

	if state.ConsecutiveFails != 0 {
		t.Errorf("Expected 0 consecutive fails, got %d", state.ConsecutiveFails)
	}

	if state.ConnectionStatus != ConnectionStateConnected {
		t.Errorf("Expected connection CONNECTED, got %v", state.ConnectionStatus)
	}

	if probe.GetCallCount() != 1 {
		t.Errorf("Expected probe called once, got %d calls", probe.GetCallCount())
	}
}

func TestHealthChecker_HealthCheckFailure(t *testing.T) {
	restartChan := testRestartChan()
	hc := NewHealthChecker(testLogger(), testPublisher(), restartChan)

	probe := newMockProbe("test-probe")
	probe.SetShouldFail(true)

	healthSpec := &features.HealthSpec{
		IntervalSeconds:  30,
		FailureThreshold: 3,
		AutoRestart:      false, // Disable auto-restart for this test
	}

	hc.AddInstance("inst-1", "feature-1", "router-1", probe, healthSpec)

	hc.mu.RLock()
	state := hc.instances["inst-1"]
	hc.mu.RUnlock()

	// First failure
	hc.performHealthCheck(state)

	state.mu.RLock()
	if state.ConsecutiveFails != 1 {
		t.Errorf("Expected 1 consecutive fail, got %d", state.ConsecutiveFails)
	}
	if state.CurrentState == HealthStateUnhealthy {
		t.Error("Should not be unhealthy yet (threshold is 3)")
	}
	state.mu.RUnlock()

	// Second failure
	hc.performHealthCheck(state)

	state.mu.RLock()
	if state.ConsecutiveFails != 2 {
		t.Errorf("Expected 2 consecutive fails, got %d", state.ConsecutiveFails)
	}
	state.mu.RUnlock()

	// Third failure - should trigger UNHEALTHY
	hc.performHealthCheck(state)

	state.mu.RLock()
	defer state.mu.RUnlock()

	if state.ConsecutiveFails != 3 {
		t.Errorf("Expected 3 consecutive fails, got %d", state.ConsecutiveFails)
	}

	if state.CurrentState != HealthStateUnhealthy {
		t.Errorf("Expected state UNHEALTHY, got %v", state.CurrentState)
	}

	if state.ConnectionStatus != ConnectionStateFailed {
		t.Errorf("Expected connection FAILED, got %v", state.ConnectionStatus)
	}
}

func TestHealthChecker_AutoRestart(t *testing.T) {
	restartChan := testRestartChan()
	hc := NewHealthChecker(testLogger(), testPublisher(), restartChan)

	probe := newMockProbe("test-probe")
	probe.SetShouldFail(true)

	healthSpec := &features.HealthSpec{
		IntervalSeconds:  30,
		FailureThreshold: 2, // Lower threshold for faster test
		AutoRestart:      true,
	}

	hc.AddInstance("inst-1", "feature-1", "router-1", probe, healthSpec)

	hc.mu.RLock()
	state := hc.instances["inst-1"]
	hc.mu.RUnlock()

	// Trigger failures until unhealthy
	hc.performHealthCheck(state)
	hc.performHealthCheck(state)

	// Check if restart was requested
	select {
	case req := <-restartChan:
		if req.InstanceID != "inst-1" {
			t.Errorf("Expected restart for inst-1, got %s", req.InstanceID)
		}
		if req.Reason == "" {
			t.Error("Expected restart reason to be set")
		}
	case <-time.After(100 * time.Millisecond):
		t.Error("Expected restart request to be sent")
	}
}

func TestHealthChecker_FailureRecovery(t *testing.T) {
	restartChan := testRestartChan()
	hc := NewHealthChecker(testLogger(), testPublisher(), restartChan)

	probe := newMockProbe("test-probe")
	probe.SetShouldFail(true)

	hc.AddInstance("inst-1", "feature-1", "router-1", probe, nil)

	hc.mu.RLock()
	state := hc.instances["inst-1"]
	hc.mu.RUnlock()

	// Cause 2 failures
	hc.performHealthCheck(state)
	hc.performHealthCheck(state)

	state.mu.RLock()
	if state.ConsecutiveFails != 2 {
		t.Errorf("Expected 2 consecutive fails, got %d", state.ConsecutiveFails)
	}
	state.mu.RUnlock()

	// Now make it succeed
	probe.SetShouldFail(false)
	hc.performHealthCheck(state)

	state.mu.RLock()
	defer state.mu.RUnlock()

	if state.ConsecutiveFails != 0 {
		t.Errorf("Expected consecutive fails to reset to 0, got %d", state.ConsecutiveFails)
	}

	if state.CurrentState != HealthStateHealthy {
		t.Errorf("Expected state HEALTHY after recovery, got %v", state.CurrentState)
	}
}

func TestHealthChecker_StartStop(t *testing.T) {
	restartChan := testRestartChan()
	hc := NewHealthChecker(testLogger(), testPublisher(), restartChan)

	hc.Start()

	// Wait briefly to ensure scheduler starts
	time.Sleep(50 * time.Millisecond)

	// Stop should not hang
	done := make(chan struct{})
	go func() {
		hc.Stop()
		close(done)
	}()

	select {
	case <-done:
		// Success
	case <-time.After(2 * time.Second):
		t.Error("Stop() hung - failed to stop gracefully")
	}
}

func TestHealthChecker_ConcurrentProbes(t *testing.T) {
	restartChan := testRestartChan()
	hc := NewHealthChecker(testLogger(), testPublisher(), restartChan)

	// Add more instances than maxConcurrentProbes
	for i := 0; i < maxConcurrentProbes+3; i++ {
		probe := newMockProbe(fmt.Sprintf("probe-%d", i))
		probe.delay = 100 * time.Millisecond // Slow probes
		hc.AddInstance(fmt.Sprintf("inst-%d", i), "feature-1", "router-1", probe, nil)
	}

	// Manually trigger checks for all at once
	hc.mu.RLock()
	states := make([]*InstanceHealthState, 0, len(hc.instances))
	for _, state := range hc.instances {
		states = append(states, state)
	}
	hc.mu.RUnlock()

	// Trigger all checks simultaneously
	for _, state := range states {
		go hc.performHealthCheck(state)
	}

	// Wait for all to complete
	time.Sleep(500 * time.Millisecond)

	// All probes should have been called (though some may have been delayed by semaphore)
	// This test mainly verifies we don't panic or deadlock
}
