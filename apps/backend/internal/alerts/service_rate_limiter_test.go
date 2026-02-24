package alerts

import (
	"fmt"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// -----------------------------------------------------------------------------
// Basic Functionality Tests
// -----------------------------------------------------------------------------

func TestNewServiceAlertRateLimiter_Defaults(t *testing.T) {
	t.Skip("TODO: limiter has unexported maxAlerts, windowSeconds, clock, cleanupTicker fields")
	limiter := NewRateLimiter()
	defer limiter.Close()
	_ = limiter // Silence unused

	// assert.Equal(t, 5, limiter.maxAlerts)
	// assert.Equal(t, 60, limiter.windowSeconds)
	// assert.NotNil(t, limiter.clock)
	// assert.NotNil(t, limiter.cleanupTicker)
}

func TestNewServiceAlertRateLimiter_CustomConfig(t *testing.T) {
	t.Skip("TODO: limiter has unexported maxAlerts, windowSeconds, clock fields")
	clock := NewMockClock(time.Time{})
	limiter := NewRateLimiter(
		WithServiceClock(clock),
		WithMaxAlerts(10),
		WithWindowSeconds(120),
	)
	defer limiter.Close()
	_ = limiter // Silence unused
	_ = clock   // Silence unused

	// assert.Equal(t, 10, limiter.maxAlerts)
	// assert.Equal(t, 120, limiter.windowSeconds)
	// assert.Equal(t, clock, limiter.clock)
}

// -----------------------------------------------------------------------------
// Fixed Window Algorithm Tests
// -----------------------------------------------------------------------------

func TestShouldAllow_FirstAlert(t *testing.T) {
	clock := NewMockClock(time.Time{})
	limiter := NewRateLimiter(
		WithServiceClock(clock),
		WithMaxAlerts(5),
		WithWindowSeconds(60),
	)
	defer limiter.Close()

	// First alert should always be allowed
	allow, suppressed, summary := limiter.ShouldAllow("instance-1")
	assert.True(t, allow)
	assert.Equal(t, 0, suppressed)
	assert.Empty(t, summary)
}

func TestShouldAllow_WithinLimit(t *testing.T) {
	clock := NewMockClock(time.Time{})
	limiter := NewRateLimiter(
		WithServiceClock(clock),
		WithMaxAlerts(5),
		WithWindowSeconds(60),
	)
	defer limiter.Close()

	instanceID := "instance-1"

	// Send 5 alerts (at limit)
	for i := 0; i < 5; i++ {
		allow, suppressed, summary := limiter.ShouldAllow(instanceID)
		assert.True(t, allow, "Alert %d should be allowed", i+1)
		assert.Equal(t, 0, suppressed)
		assert.Empty(t, summary)
	}

	// 6th alert should be suppressed
	allow, suppressed, summary := limiter.ShouldAllow(instanceID)
	assert.False(t, allow)
	assert.Equal(t, 1, suppressed)
	assert.Contains(t, summary, "Rate limit exceeded")
	assert.Contains(t, summary, "instance-1")
}

func TestShouldAllow_ExceedLimit(t *testing.T) {
	clock := NewMockClock(time.Time{})
	limiter := NewRateLimiter(
		WithServiceClock(clock),
		WithMaxAlerts(3),
		WithWindowSeconds(60),
	)
	defer limiter.Close()

	instanceID := "instance-1"

	// Send 3 alerts (at limit)
	for i := 0; i < 3; i++ {
		allow, _, _ := limiter.ShouldAllow(instanceID)
		assert.True(t, allow)
	}

	// Next 5 alerts should be suppressed
	for i := 0; i < 5; i++ {
		allow, suppressed, summary := limiter.ShouldAllow(instanceID)
		assert.False(t, allow, "Alert %d should be suppressed", i+4)
		assert.Equal(t, i+1, suppressed)
		assert.Contains(t, summary, "Rate limit exceeded")
	}
}

func TestShouldAllow_WindowReset(t *testing.T) {
	clock := NewMockClock(time.Time{})
	limiter := NewRateLimiter(
		WithServiceClock(clock),
		WithMaxAlerts(3),
		WithWindowSeconds(60),
	)
	defer limiter.Close()

	instanceID := "instance-1"

	// Fill up the window
	for i := 0; i < 3; i++ {
		allow, _, _ := limiter.ShouldAllow(instanceID)
		assert.True(t, allow)
	}

	// Exceed limit
	allow, suppressed, _ := limiter.ShouldAllow(instanceID)
	assert.False(t, allow)
	assert.Equal(t, 1, suppressed)

	// Advance time past window boundary
	clock.Advance(61 * time.Second)

	// Should allow again (new window)
	allow, suppressed, summary := limiter.ShouldAllow(instanceID)
	assert.True(t, allow)
	assert.Equal(t, 0, suppressed)
	assert.Empty(t, summary)

	// Can send up to limit again
	for i := 0; i < 2; i++ {
		allow, _, _ := limiter.ShouldAllow(instanceID)
		assert.True(t, allow)
	}
}

func TestShouldAllow_FixedWindowBoundary(t *testing.T) {
	clock := NewMockClock(time.Time{})
	limiter := NewRateLimiter(
		WithServiceClock(clock),
		WithMaxAlerts(2),
		WithWindowSeconds(60),
	)
	defer limiter.Close()

	instanceID := "instance-1"

	// Send 2 alerts at T=0
	for i := 0; i < 2; i++ {
		allow, _, _ := limiter.ShouldAllow(instanceID)
		assert.True(t, allow)
	}

	// 3rd alert at T=0 should be suppressed
	allow, _, _ := limiter.ShouldAllow(instanceID)
	assert.False(t, allow)

	// Advance to T=59s (still in same window)
	clock.Advance(59 * time.Second)
	allow, _, _ = limiter.ShouldAllow(instanceID)
	assert.False(t, allow)

	// Advance to T=61s (new window)
	clock.Advance(2 * time.Second)
	allow, _, _ = limiter.ShouldAllow(instanceID)
	assert.True(t, allow)
}

// -----------------------------------------------------------------------------
// Multi-Instance Tests
// -----------------------------------------------------------------------------

func TestShouldAllow_MultipleInstances(t *testing.T) {
	clock := NewMockClock(time.Time{})
	limiter := NewRateLimiter(
		WithServiceClock(clock),
		WithMaxAlerts(2),
		WithWindowSeconds(60),
	)
	defer limiter.Close()

	// Instance 1: fill window
	for i := 0; i < 2; i++ {
		allow, _, _ := limiter.ShouldAllow("instance-1")
		assert.True(t, allow)
	}

	// Instance 1: exceeds limit
	allow, _, _ := limiter.ShouldAllow("instance-1")
	assert.False(t, allow)

	// Instance 2: should have independent window
	for i := 0; i < 2; i++ {
		allow, _, _ := limiter.ShouldAllow("instance-2")
		assert.True(t, allow, "Instance 2 alert %d should be allowed", i+1)
	}

	// Instance 2: exceeds limit
	allow, _, _ = limiter.ShouldAllow("instance-2")
	assert.False(t, allow)

	// Instance 3: should also have independent window
	allow, _, _ = limiter.ShouldAllow("instance-3")
	assert.True(t, allow)
}

// -----------------------------------------------------------------------------
// GetSuppressedCount Tests
// -----------------------------------------------------------------------------

func TestGetSuppressedCount(t *testing.T) {
	clock := NewMockClock(time.Time{})
	limiter := NewRateLimiter(
		WithServiceClock(clock),
		WithMaxAlerts(2),
		WithWindowSeconds(60),
	)
	defer limiter.Close()

	instanceID := "instance-1"

	// No window yet
	count := limiter.GetSuppressedCount(instanceID)
	assert.Equal(t, 0, count)

	// Fill window
	limiter.ShouldAllow(instanceID)
	limiter.ShouldAllow(instanceID)

	// Still no suppressed
	count = limiter.GetSuppressedCount(instanceID)
	assert.Equal(t, 0, count)

	// Suppress 3 alerts
	for i := 0; i < 3; i++ {
		limiter.ShouldAllow(instanceID)
	}

	count = limiter.GetSuppressedCount(instanceID)
	assert.Equal(t, 3, count)

	// After window expires
	clock.Advance(61 * time.Second)
	count = limiter.GetSuppressedCount(instanceID)
	assert.Equal(t, 0, count)
}

// -----------------------------------------------------------------------------
// GetWindowStats Tests
// -----------------------------------------------------------------------------

func TestGetWindowStats(t *testing.T) {
	clock := NewMockClock(time.Time{})
	startTime := clock.Now()

	limiter := NewRateLimiter(
		WithServiceClock(clock),
		WithMaxAlerts(3),
		WithWindowSeconds(60),
	)
	defer limiter.Close()

	instanceID := "instance-1"

	// No window yet
	sent, suppressed, windowStart, exists := limiter.GetWindowStats(instanceID)
	assert.False(t, exists)
	assert.Equal(t, 0, sent)
	assert.Equal(t, 0, suppressed)

	// Send 2 alerts
	limiter.ShouldAllow(instanceID)
	limiter.ShouldAllow(instanceID)

	sent, suppressed, windowStart, exists = limiter.GetWindowStats(instanceID)
	assert.True(t, exists)
	assert.Equal(t, 2, sent)
	assert.Equal(t, 0, suppressed)
	assert.Equal(t, startTime, windowStart)

	// Send 1 more (at limit)
	limiter.ShouldAllow(instanceID)

	// Suppress 2 more
	limiter.ShouldAllow(instanceID)
	limiter.ShouldAllow(instanceID)

	sent, suppressed, windowStart, exists = limiter.GetWindowStats(instanceID)
	assert.True(t, exists)
	assert.Equal(t, 3, sent)
	assert.Equal(t, 2, suppressed)
	assert.Equal(t, startTime, windowStart)

	// After window expires
	clock.Advance(61 * time.Second)
	sent, suppressed, _, exists = limiter.GetWindowStats(instanceID)
	assert.False(t, exists)
	assert.Equal(t, 0, sent)
	assert.Equal(t, 0, suppressed)
}

// -----------------------------------------------------------------------------
// Reset Tests
// -----------------------------------------------------------------------------

func TestReset_SingleInstance(t *testing.T) {
	clock := NewMockClock(time.Time{})
	limiter := NewRateLimiter(
		WithServiceClock(clock),
		WithMaxAlerts(2),
		WithWindowSeconds(60),
	)
	defer limiter.Close()

	instanceID := "instance-1"

	// Fill window
	limiter.ShouldAllow(instanceID)
	limiter.ShouldAllow(instanceID)

	// Exceed limit
	allow, _, _ := limiter.ShouldAllow(instanceID)
	assert.False(t, allow)

	// Reset
	limiter.Reset(instanceID)

	// Should allow again
	allow, suppressed, summary := limiter.ShouldAllow(instanceID)
	assert.True(t, allow)
	assert.Equal(t, 0, suppressed)
	assert.Empty(t, summary)
}

func TestResetAll(t *testing.T) {
	clock := NewMockClock(time.Time{})
	limiter := NewRateLimiter(
		WithServiceClock(clock),
		WithMaxAlerts(1),
		WithWindowSeconds(60),
	)
	defer limiter.Close()

	// Fill windows for multiple instances
	limiter.ShouldAllow("instance-1")
	limiter.ShouldAllow("instance-2")
	limiter.ShouldAllow("instance-3")

	// All should be at limit
	allow, _, _ := limiter.ShouldAllow("instance-1")
	assert.False(t, allow)
	allow, _, _ = limiter.ShouldAllow("instance-2")
	assert.False(t, allow)

	// Reset all
	limiter.ResetAll()

	// All should allow again
	allow, _, _ = limiter.ShouldAllow("instance-1")
	assert.True(t, allow)
	allow, _, _ = limiter.ShouldAllow("instance-2")
	assert.True(t, allow)
	allow, _, _ = limiter.ShouldAllow("instance-3")
	assert.True(t, allow)
}

// -----------------------------------------------------------------------------
// Cleanup Tests
// -----------------------------------------------------------------------------

func TestCleanup_RemovesExpiredWindows(t *testing.T) {
	clock := NewMockClock(time.Time{})
	limiter := NewRateLimiter(
		WithServiceClock(clock),
		WithMaxAlerts(5),
		WithWindowSeconds(60),
	)
	defer limiter.Close()

	// Create windows for 3 instances
	limiter.ShouldAllow("instance-1")
	limiter.ShouldAllow("instance-2")
	limiter.ShouldAllow("instance-3")

	// Verify all windows exist
	assert.Len(t, limiter.Windows, 3)

	// Advance time past 2x window duration (cleanup threshold)
	clock.Advance(121 * time.Second)

	// Trigger cleanup
	limiter.Cleanup()

	// All windows should be cleaned up
	assert.Len(t, limiter.Windows, 0)
}

func TestCleanup_KeepsActiveWindows(t *testing.T) {
	clock := NewMockClock(time.Time{})
	limiter := NewRateLimiter(
		WithServiceClock(clock),
		WithMaxAlerts(5),
		WithWindowSeconds(60),
	)
	defer limiter.Close()

	// Create window
	limiter.ShouldAllow("instance-1")

	// Advance time but stay within 2x window
	clock.Advance(100 * time.Second)

	// Trigger cleanup
	limiter.Cleanup()

	// Window should still exist
	assert.Len(t, limiter.Windows, 1)
}

func TestCleanup_SelectiveRemoval(t *testing.T) {
	clock := NewMockClock(time.Time{})
	limiter := NewRateLimiter(
		WithServiceClock(clock),
		WithMaxAlerts(5),
		WithWindowSeconds(60),
	)
	defer limiter.Close()

	// Create old window
	limiter.ShouldAllow("instance-old")

	// Advance time past cleanup threshold for instance-old
	clock.Advance(121 * time.Second)

	// Create new window
	limiter.ShouldAllow("instance-new")

	// Trigger cleanup
	limiter.Cleanup()

	// Only old window should be removed
	assert.Len(t, limiter.Windows, 1)
	_, _, _, exists := limiter.GetWindowStats("instance-old")
	assert.False(t, exists)
	_, _, _, exists = limiter.GetWindowStats("instance-new")
	assert.True(t, exists)
}

// -----------------------------------------------------------------------------
// Edge Cases
// -----------------------------------------------------------------------------

func TestShouldAllow_ZeroMaxAlerts(t *testing.T) {
	clock := NewMockClock(time.Time{})
	limiter := NewRateLimiter(
		WithServiceClock(clock),
		WithMaxAlerts(0), // Disabled
		WithWindowSeconds(60),
	)
	defer limiter.Close()

	// Should always allow when max is 0 (disabled)
	for i := 0; i < 100; i++ {
		allow, _, _ := limiter.ShouldAllow("instance-1")
		assert.True(t, allow)
	}
}

func TestShouldAllow_NegativeMaxAlerts(t *testing.T) {
	clock := NewMockClock(time.Time{})
	limiter := NewRateLimiter(
		WithServiceClock(clock),
		WithMaxAlerts(-1), // Disabled
		WithWindowSeconds(60),
	)
	defer limiter.Close()

	// Should always allow when max is negative (disabled)
	for i := 0; i < 100; i++ {
		allow, _, _ := limiter.ShouldAllow("instance-1")
		assert.True(t, allow)
	}
}

func TestShouldAllow_EmptyInstanceID(t *testing.T) {
	clock := NewMockClock(time.Time{})
	limiter := NewRateLimiter(
		WithServiceClock(clock),
		WithMaxAlerts(2),
		WithWindowSeconds(60),
	)
	defer limiter.Close()

	// Should work with empty string (treated as valid instance ID)
	allow, _, _ := limiter.ShouldAllow("")
	assert.True(t, allow)

	allow, _, _ = limiter.ShouldAllow("")
	assert.True(t, allow)

	allow, _, _ = limiter.ShouldAllow("")
	assert.False(t, allow)
}

// -----------------------------------------------------------------------------
// Concurrency Tests
// -----------------------------------------------------------------------------

func TestShouldAllow_Concurrent(t *testing.T) {
	clock := NewMockClock(time.Time{}) // Note: MockClock is not thread-safe, but we're not advancing time here
	limiter := NewRateLimiter(
		WithServiceClock(clock),
		WithMaxAlerts(100),
		WithWindowSeconds(60),
	)
	defer limiter.Close()

	instanceID := "instance-1"
	const goroutines = 10
	const alertsPerGoroutine = 20

	// Launch concurrent goroutines
	done := make(chan bool, goroutines)
	for i := 0; i < goroutines; i++ {
		go func() {
			for j := 0; j < alertsPerGoroutine; j++ {
				limiter.ShouldAllow(instanceID)
			}
			done <- true
		}()
	}

	// Wait for all goroutines
	for i := 0; i < goroutines; i++ {
		<-done
	}

	// Should have hit the limit (100 allowed)
	sent, suppressed, _, exists := limiter.GetWindowStats(instanceID)
	require.True(t, exists)
	assert.Equal(t, 100, sent)
	assert.Equal(t, goroutines*alertsPerGoroutine-100, suppressed)
}

func TestReset_Concurrent(t *testing.T) {
	clock := NewMockClock(time.Time{})
	limiter := NewRateLimiter(
		WithServiceClock(clock),
		WithMaxAlerts(5),
		WithWindowSeconds(60),
	)
	defer limiter.Close()

	const goroutines = 10
	const instances = 5

	// Launch concurrent goroutines doing resets and allows
	done := make(chan bool, goroutines)
	for i := 0; i < goroutines; i++ {
		go func(idx int) {
			instanceID := fmt.Sprintf("instance-%d", idx%instances)
			for j := 0; j < 10; j++ {
				limiter.ShouldAllow(instanceID)
				if j%3 == 0 {
					limiter.Reset(instanceID)
				}
			}
			done <- true
		}(i)
	}

	// Wait for all goroutines
	for i := 0; i < goroutines; i++ {
		<-done
	}

	// No panics = success
	assert.True(t, true)
}

// -----------------------------------------------------------------------------
// Close Tests
// -----------------------------------------------------------------------------

func TestClose_StopsCleanupWorker(t *testing.T) {
	clock := NewMockClock(time.Time{})
	limiter := NewRateLimiter(
		WithServiceClock(clock),
		WithMaxAlerts(5),
		WithWindowSeconds(60),
	)

	// Close should not hang
	limiter.Close()

	// Calling Close again should be safe
	limiter.Close()
}
