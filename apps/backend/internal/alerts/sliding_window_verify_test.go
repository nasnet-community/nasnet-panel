package alerts

import (
	"fmt"
	"testing"
	"time"
)

// TestSlidingWindowVerify is a simple standalone test to verify sliding window behavior
func TestSlidingWindowVerify(t *testing.T) {
	// Test 1: Basic sliding window with no boundary burst
	t.Run("no_boundary_burst", func(t *testing.T) {
		startTime := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)
		clock := NewMockClock(startTime)
		tm := NewThrottleManager(WithClock(clock))

		config := ThrottleConfig{
			MaxAlerts:     3,
			PeriodSeconds: 60,
		}

		eventData := map[string]interface{}{"test": "data"}

		// Send 3 alerts immediately
		for i := 0; i < 3; i++ {
			allowed, _ := tm.ShouldAllow("test", eventData, config)
			if !allowed {
				t.Fatalf("Alert %d should be allowed", i+1)
			}
		}

		// 4th should be blocked
		allowed, _ := tm.ShouldAllow("test", eventData, config)
		if allowed {
			t.Fatal("4th alert should be blocked")
		}

		// Jump to 59s - still blocked in fixed window this would allow burst
		clock.Set(startTime.Add(59 * time.Second))
		allowed, _ = tm.ShouldAllow("test", eventData, config)
		if allowed {
			t.Fatal("Alert at 59s should still be blocked (sliding window)")
		}

		// Jump to 61s - first alert expires, one slot opens
		clock.Set(startTime.Add(61 * time.Second))
		allowed, _ = tm.ShouldAllow("test", eventData, config)
		if !allowed {
			t.Fatal("Alert at 61s should be allowed (first expired)")
		}

		fmt.Println("✓ No boundary burst vulnerability")
	})

	// Test 2: Ring buffer internals
	t.Run("ring_buffer_basics", func(t *testing.T) {
		now := time.Now()
		g := newGroupThrottleState(3, now)

		// Add 3 timestamps
		g.addTimestamp(now)
		g.addTimestamp(now.Add(10 * time.Second))
		g.addTimestamp(now.Add(20 * time.Second))

		// Should have 3 in window
		count := g.countInWindow(now.Add(25*time.Second), 60*time.Second)
		if count != 3 {
			t.Fatalf("Expected 3 in window, got %d", count)
		}

		// Add one more - should wrap around and overwrite first
		g.addTimestamp(now.Add(30 * time.Second))

		// Still should have 3 (buffer size is 3)
		if g.size != 3 {
			t.Fatalf("Expected size 3, got %d", g.size)
		}

		fmt.Println("✓ Ring buffer works correctly")
	})

	// Test 3: Count in window
	t.Run("count_in_window", func(t *testing.T) {
		now := time.Now()
		g := newGroupThrottleState(5, now)

		// Add timestamps at 0s, 10s, 21s, 30s, 70s
		g.addTimestamp(now)
		g.addTimestamp(now.Add(10 * time.Second))
		g.addTimestamp(now.Add(21 * time.Second))
		g.addTimestamp(now.Add(30 * time.Second))
		g.addTimestamp(now.Add(70 * time.Second))

		// At 80s with 60s window (>20s and <=80s), should have 3: 21s, 30s, 70s
		count := g.countInWindow(now.Add(80*time.Second), 60*time.Second)
		if count != 3 {
			t.Fatalf("Expected 3 in window, got %d", count)
		}

		fmt.Println("✓ Count in window accurate")
	})
}
