//go:build linux

package orchestrator

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"testing"
	"time"

	"backend/internal/events"

	"github.com/rs/zerolog"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// mockEventBus is a simple mock implementation of EventBus for testing
type mockEventBus struct {
	mu             sync.Mutex
	publishedEvents []events.Event
}

func newMockEventBus() *mockEventBus {
	return &mockEventBus{
		publishedEvents: make([]events.Event, 0),
	}
}

func (m *mockEventBus) Publish(ctx context.Context, event events.Event) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.publishedEvents = append(m.publishedEvents, event)
	return nil
}

func (m *mockEventBus) Subscribe(eventType string, handler events.EventHandler) error {
	return nil
}

func (m *mockEventBus) SubscribeAll(handler events.EventHandler) error {
	return nil
}

func (m *mockEventBus) Close() error {
	return nil
}

func (m *mockEventBus) getPublishedEvents() []events.Event {
	m.mu.Lock()
	defer m.mu.Unlock()
	return append([]events.Event{}, m.publishedEvents...)
}

func (m *mockEventBus) reset() {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.publishedEvents = make([]events.Event, 0)
}

// TestNewResourceLimiter tests the constructor
func TestNewResourceLimiter(t *testing.T) {
	t.Run("requires EventBus", func(t *testing.T) {
		config := ResourceLimiterConfig{
			Logger: zerolog.Nop(),
		}
		_, err := NewResourceLimiter(config)
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "EventBus is required")
	})

	t.Run("creates successfully with valid config", func(t *testing.T) {
		bus := newMockEventBus()
		config := ResourceLimiterConfig{
			EventBus: bus,
			Logger:   zerolog.Nop(),
		}
		rl, err := NewResourceLimiter(config)
		require.NoError(t, err)
		assert.NotNil(t, rl)
		assert.NotNil(t, rl.publisher)
		assert.NotNil(t, rl.monitors)
	})
}

// TestApplyMemoryLimitSuccess tests successful memory limit application
func TestApplyMemoryLimitSuccess(t *testing.T) {
	bus := newMockEventBus()
	config := ResourceLimiterConfig{
		EventBus: bus,
		Logger:   zerolog.Nop(),
	}
	rl, err := NewResourceLimiter(config)
	require.NoError(t, err)

	if !rl.cgroupsEnabled {
		t.Skip("cgroups v2 not available on this system")
	}

	// Use current process PID for testing
	pid := os.Getpid()
	memoryMB := 64

	// Create base cgroup directory
	err = os.MkdirAll(CgroupBasePath, 0755)
	require.NoError(t, err)

	// Apply memory limit
	err = rl.ApplyMemoryLimit(pid, memoryMB)
	require.NoError(t, err)

	// Verify cgroup files were created
	cgroupPath := filepath.Join(CgroupBasePath, fmt.Sprintf("instance-%d", pid))

	// Check memory.max
	memoryMaxPath := filepath.Join(cgroupPath, "memory.max")
	content, err := os.ReadFile(memoryMaxPath)
	require.NoError(t, err)
	expectedHardLimit := uint64(memoryMB) * 1024 * 1024
	assert.Contains(t, string(content), fmt.Sprintf("%d", expectedHardLimit))

	// Check memory.high
	memoryHighPath := filepath.Join(cgroupPath, "memory.high")
	content, err = os.ReadFile(memoryHighPath)
	require.NoError(t, err)
	expectedSoftLimit := uint64(float64(expectedHardLimit) * SoftLimitPercentage)
	assert.Contains(t, string(content), fmt.Sprintf("%d", expectedSoftLimit))

	// Cleanup
	os.RemoveAll(cgroupPath)
}

// TestGetResourceUsage tests reading resource usage from /proc
func TestGetResourceUsage(t *testing.T) {
	bus := newMockEventBus()
	config := ResourceLimiterConfig{
		EventBus: bus,
		Logger:   zerolog.Nop(),
	}
	rl, err := NewResourceLimiter(config)
	require.NoError(t, err)

	// Use current process PID
	pid := os.Getpid()

	usage, err := rl.GetResourceUsage(pid)
	require.NoError(t, err)
	assert.NotNil(t, usage)
	assert.Equal(t, pid, usage.PID)
	assert.Greater(t, usage.MemoryMB, uint64(0))
	assert.False(t, usage.Time.IsZero())
}

// TestMonitoringLoopTriggersWarning tests that monitoring emits warnings at 80%
func TestMonitoringLoopTriggersWarning(t *testing.T) {
	bus := newMockEventBus()
	config := ResourceLimiterConfig{
		EventBus: bus,
		Logger:   zerolog.Nop(),
	}
	rl, err := NewResourceLimiter(config)
	require.NoError(t, err)

	pid := os.Getpid()

	// Get current usage
	usage, err := rl.GetResourceUsage(pid)
	require.NoError(t, err)

	// Set limit slightly above current usage to trigger warning
	// Memory limit of 1MB should trigger warning since current usage is higher
	memoryLimitMB := 1

	callbackCalled := false
	var callbackUsage *ResourceUsage
	callback := func(u *ResourceUsage) {
		callbackCalled = true
		callbackUsage = u
	}

	// Start monitoring with short interval for testing
	err = rl.StartMonitoring(pid, memoryLimitMB, callback)
	require.NoError(t, err)

	// Wait for at least one monitoring cycle (we'll wait 2 seconds for safety)
	time.Sleep(2 * time.Second)

	// Stop monitoring
	rl.StopMonitoring(pid)

	// Verify callback was called
	assert.True(t, callbackCalled, "callback should have been called")
	assert.NotNil(t, callbackUsage)

	// Verify warning event was published (should trigger since usage > 80% of limit)
	events := bus.getPublishedEvents()
	if usage.MemoryMB > uint64(float64(memoryLimitMB)*ResourceWarningThreshold) {
		assert.Greater(t, len(events), 0, "should have published at least one warning event")
		// Find resource warning event
		foundWarning := false
		for _, event := range events {
			if event.GetType() == EventTypeResourceWarning {
				foundWarning = true
				break
			}
		}
		assert.True(t, foundWarning, "should have published ResourceWarningEvent")
	}
}

// TestGracefulFallbackWhenCgroupsUnavailable tests graceful fallback
func TestGracefulFallbackWhenCgroupsUnavailable(t *testing.T) {
	bus := newMockEventBus()
	config := ResourceLimiterConfig{
		EventBus: bus,
		Logger:   zerolog.Nop(),
	}
	rl, err := NewResourceLimiter(config)
	require.NoError(t, err)

	// Simulate cgroups unavailable
	rl.cgroupsEnabled = false

	pid := os.Getpid()
	memoryMB := 64

	// Should not return error when cgroups unavailable
	err = rl.ApplyMemoryLimit(pid, memoryMB)
	assert.NoError(t, err, "should gracefully handle cgroups unavailability")
}

// TestInvalidPIDHandling tests handling of invalid PIDs
func TestInvalidPIDHandling(t *testing.T) {
	bus := newMockEventBus()
	config := ResourceLimiterConfig{
		EventBus: bus,
		Logger:   zerolog.Nop(),
	}
	rl, err := NewResourceLimiter(config)
	require.NoError(t, err)

	t.Run("GetResourceUsage with non-existent PID", func(t *testing.T) {
		// Use a very high PID that likely doesn't exist
		invalidPID := 999999
		_, err := rl.GetResourceUsage(invalidPID)
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "failed to open")
	})

	t.Run("StartMonitoring with invalid PID", func(t *testing.T) {
		err := rl.StartMonitoring(0, 64, nil)
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "invalid PID")
	})

	t.Run("StartMonitoring with negative PID", func(t *testing.T) {
		err := rl.StartMonitoring(-1, 64, nil)
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "invalid PID")
	})
}

// TestMemoryLimitTooLow tests minimum memory limit enforcement
func TestMemoryLimitTooLow(t *testing.T) {
	bus := newMockEventBus()
	config := ResourceLimiterConfig{
		EventBus: bus,
		Logger:   zerolog.Nop(),
	}
	rl, err := NewResourceLimiter(config)
	require.NoError(t, err)

	pid := os.Getpid()

	// Test with memory limit below minimum
	err = rl.ApplyMemoryLimit(pid, 8) // 8MB < 16MB minimum
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "below minimum")

	// Test with 0 MB
	err = rl.ApplyMemoryLimit(pid, 0)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "below minimum")
}

// TestCgroupDirectoryCreation tests cgroup directory creation
func TestCgroupDirectoryCreation(t *testing.T) {
	bus := newMockEventBus()
	config := ResourceLimiterConfig{
		EventBus: bus,
		Logger:   zerolog.Nop(),
	}
	rl, err := NewResourceLimiter(config)
	require.NoError(t, err)

	if !rl.cgroupsEnabled {
		t.Skip("cgroups v2 not available on this system")
	}

	pid := os.Getpid()
	memoryMB := 32

	// Ensure clean state
	cgroupPath := filepath.Join(CgroupBasePath, fmt.Sprintf("instance-%d", pid))
	os.RemoveAll(cgroupPath)

	// Apply memory limit (should create directory)
	err = rl.ApplyMemoryLimit(pid, memoryMB)
	require.NoError(t, err)

	// Verify directory was created
	info, err := os.Stat(cgroupPath)
	require.NoError(t, err)
	assert.True(t, info.IsDir())

	// Verify it's readable
	assert.Equal(t, os.FileMode(0755), info.Mode().Perm())

	// Cleanup
	os.RemoveAll(cgroupPath)
}

// TestStopMonitoring tests stopping monitoring
func TestStopMonitoring(t *testing.T) {
	bus := newMockEventBus()
	config := ResourceLimiterConfig{
		EventBus: bus,
		Logger:   zerolog.Nop(),
	}
	rl, err := NewResourceLimiter(config)
	require.NoError(t, err)

	pid := os.Getpid()
	memoryMB := 64

	// Start monitoring
	err = rl.StartMonitoring(pid, memoryMB, nil)
	require.NoError(t, err)

	// Verify monitor was registered
	rl.mu.RLock()
	_, exists := rl.monitors[pid]
	rl.mu.RUnlock()
	assert.True(t, exists)

	// Stop monitoring
	rl.StopMonitoring(pid)

	// Verify monitor was removed
	rl.mu.RLock()
	_, exists = rl.monitors[pid]
	rl.mu.RUnlock()
	assert.False(t, exists)
}

// TestClose tests cleanup on close
func TestClose(t *testing.T) {
	bus := newMockEventBus()
	config := ResourceLimiterConfig{
		EventBus: bus,
		Logger:   zerolog.Nop(),
	}
	rl, err := NewResourceLimiter(config)
	require.NoError(t, err)

	pid := os.Getpid()
	memoryMB := 64

	// Start monitoring for multiple PIDs
	err = rl.StartMonitoring(pid, memoryMB, nil)
	require.NoError(t, err)

	// Verify monitors exist
	rl.mu.RLock()
	monitorCount := len(rl.monitors)
	rl.mu.RUnlock()
	assert.Greater(t, monitorCount, 0)

	// Close
	err = rl.Close()
	require.NoError(t, err)

	// Verify all monitors stopped
	rl.mu.RLock()
	assert.Equal(t, 0, len(rl.monitors))
	rl.mu.RUnlock()
}
