package bridge

import (
	"fmt"
	"sync"
	"time"

	"backend/internal/alerts/throttle"
)

// RateLimiter provides per-instance rate limiting for service alerts.
// Uses a fixed-window algorithm since service alerts are per-instance, not per-rule.
type RateLimiter struct {
	mu            sync.RWMutex
	Windows       map[string]*instanceWindow // Exported for testing
	maxAlerts     int
	windowSeconds int
	clock         throttle.Clock
	cleanupTicker *time.Ticker
	stopCh        chan struct{}
	wg            sync.WaitGroup
	closeOnce     sync.Once
}

type instanceWindow struct {
	windowStart     time.Time
	count           int
	suppressedCount int
}

// Option is a functional option for RateLimiter.
type Option func(*RateLimiter)

// WithClock sets a custom clock for the rate limiter.
func WithClock(clock throttle.Clock) Option {
	return func(rl *RateLimiter) {
		rl.clock = clock
	}
}

// WithMaxAlerts sets the maximum alerts per window (default: 5).
func WithMaxAlerts(maxVal int) Option {
	return func(rl *RateLimiter) {
		rl.maxAlerts = maxVal
	}
}

// WithWindowSeconds sets the window duration in seconds (default: 60).
func WithWindowSeconds(seconds int) Option {
	return func(rl *RateLimiter) {
		rl.windowSeconds = seconds
	}
}

// NewRateLimiter creates a new rate limiter with default config.
func NewRateLimiter(opts ...Option) *RateLimiter {
	rl := &RateLimiter{
		Windows:       make(map[string]*instanceWindow),
		maxAlerts:     5,
		windowSeconds: 60,
		clock:         throttle.RealClock{},
		stopCh:        make(chan struct{}),
	}

	for _, opt := range opts {
		opt(rl)
	}

	rl.cleanupTicker = time.NewTicker(5 * time.Minute)
	rl.wg.Add(1)
	go rl.cleanupWorker()

	return rl
}

// ShouldAllow checks if an alert for the given instance should be allowed.
func (rl *RateLimiter) ShouldAllow(instanceID string) (allowed bool, suppressed int, reason string) {
	if rl.maxAlerts <= 0 {
		return true, 0, ""
	}

	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := rl.clock.Now()
	window := time.Duration(rl.windowSeconds) * time.Second

	w, exists := rl.Windows[instanceID]
	if !exists {
		w = &instanceWindow{windowStart: now}
		rl.Windows[instanceID] = w
	}

	if now.Sub(w.windowStart) >= window {
		w.windowStart = now
		w.count = 0
		w.suppressedCount = 0
	}

	if w.count >= rl.maxAlerts {
		w.suppressedCount++
		summary := fmt.Sprintf(
			"Rate limit exceeded for instance %s: %d alerts in %d seconds (limit: %d). Suppressed: %d",
			instanceID, w.count, rl.windowSeconds, rl.maxAlerts, w.suppressedCount,
		)
		return false, w.suppressedCount, summary
	}

	w.count++
	return true, 0, ""
}

// GetSuppressedCount returns the number of suppressed alerts for an instance.
func (rl *RateLimiter) GetSuppressedCount(instanceID string) int {
	rl.mu.RLock()
	defer rl.mu.RUnlock()

	w, exists := rl.Windows[instanceID]
	if !exists {
		return 0
	}

	now := rl.clock.Now()
	window := time.Duration(rl.windowSeconds) * time.Second
	if now.Sub(w.windowStart) >= window {
		return 0
	}
	return w.suppressedCount
}

// GetWindowStats returns statistics for an instance's current window.
func (rl *RateLimiter) GetWindowStats(instanceID string) (count, suppressedCount int, windowStart time.Time, active bool) {
	rl.mu.RLock()
	defer rl.mu.RUnlock()

	w, exists := rl.Windows[instanceID]
	if !exists {
		return 0, 0, time.Time{}, false
	}

	now := rl.clock.Now()
	window := time.Duration(rl.windowSeconds) * time.Second
	if now.Sub(w.windowStart) >= window {
		return 0, 0, time.Time{}, false
	}
	return w.count, w.suppressedCount, w.windowStart, true
}

// Reset clears all window state for a specific instance.
func (rl *RateLimiter) Reset(instanceID string) {
	rl.mu.Lock()
	defer rl.mu.Unlock()
	delete(rl.Windows, instanceID)
}

// ResetAll clears all window state.
func (rl *RateLimiter) ResetAll() {
	rl.mu.Lock()
	defer rl.mu.Unlock()
	rl.Windows = make(map[string]*instanceWindow)
}

func (rl *RateLimiter) cleanupWorker() {
	defer rl.wg.Done()
	for {
		select {
		case <-rl.cleanupTicker.C:
			rl.Cleanup()
		case <-rl.stopCh:
			return
		}
	}
}

// Cleanup removes expired windows. Exported for testing.
func (rl *RateLimiter) Cleanup() {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := rl.clock.Now()
	window := time.Duration(rl.windowSeconds) * time.Second
	threshold := 2 * window

	expired := make([]string, 0)
	for id, w := range rl.Windows {
		if now.Sub(w.windowStart) >= threshold {
			expired = append(expired, id)
		}
	}
	for _, id := range expired {
		delete(rl.Windows, id)
	}
}

// Close stops the cleanup worker and releases resources.
// Safe to call multiple times.
func (rl *RateLimiter) Close() {
	rl.closeOnce.Do(func() {
		close(rl.stopCh)
		if rl.cleanupTicker != nil {
			rl.cleanupTicker.Stop()
		}
		rl.wg.Wait()
	})
}
