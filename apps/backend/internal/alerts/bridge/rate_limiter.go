package bridge

import (
	"fmt"
	"sync"
	"time"

	"backend/internal/alerts/throttle"
)

// ServiceAlertRateLimiter provides per-instance rate limiting for service alerts.
// Uses a fixed-window algorithm since service alerts are per-instance, not per-rule.
type ServiceAlertRateLimiter struct {
	mu            sync.RWMutex
	windows       map[string]*instanceWindow
	maxAlerts     int
	windowSeconds int
	clock         throttle.Clock
	cleanupTicker *time.Ticker
	stopCh        chan struct{}
	wg            sync.WaitGroup
}

type instanceWindow struct {
	windowStart     time.Time
	count           int
	suppressedCount int
}

// ServiceRateLimiterOption is a functional option for ServiceAlertRateLimiter.
type ServiceRateLimiterOption func(*ServiceAlertRateLimiter)

// WithServiceClock sets a custom clock for the rate limiter.
func WithServiceClock(clock throttle.Clock) ServiceRateLimiterOption {
	return func(srl *ServiceAlertRateLimiter) {
		srl.clock = clock
	}
}

// WithServiceMaxAlerts sets the maximum alerts per window (default: 5).
func WithServiceMaxAlerts(max int) ServiceRateLimiterOption {
	return func(srl *ServiceAlertRateLimiter) {
		srl.maxAlerts = max
	}
}

// WithServiceWindowSeconds sets the window duration in seconds (default: 60).
func WithServiceWindowSeconds(seconds int) ServiceRateLimiterOption {
	return func(srl *ServiceAlertRateLimiter) {
		srl.windowSeconds = seconds
	}
}

// NewServiceAlertRateLimiter creates a new rate limiter with default config.
func NewServiceAlertRateLimiter(opts ...ServiceRateLimiterOption) *ServiceAlertRateLimiter {
	srl := &ServiceAlertRateLimiter{
		windows:       make(map[string]*instanceWindow),
		maxAlerts:     5,
		windowSeconds: 60,
		clock:         throttle.RealClock{},
		stopCh:        make(chan struct{}),
	}

	for _, opt := range opts {
		opt(srl)
	}

	srl.cleanupTicker = time.NewTicker(5 * time.Minute)
	srl.wg.Add(1)
	go srl.cleanupWorker()

	return srl
}

// ShouldAllow checks if an alert for the given instance should be allowed.
func (srl *ServiceAlertRateLimiter) ShouldAllow(instanceID string) (bool, int, string) {
	if srl.maxAlerts <= 0 {
		return true, 0, ""
	}

	srl.mu.Lock()
	defer srl.mu.Unlock()

	now := srl.clock.Now()
	window := time.Duration(srl.windowSeconds) * time.Second

	w, exists := srl.windows[instanceID]
	if !exists {
		w = &instanceWindow{windowStart: now}
		srl.windows[instanceID] = w
	}

	if now.Sub(w.windowStart) >= window {
		w.windowStart = now
		w.count = 0
		w.suppressedCount = 0
	}

	if w.count >= srl.maxAlerts {
		w.suppressedCount++
		summary := fmt.Sprintf(
			"Rate limit exceeded for instance %s: %d alerts in %d seconds (limit: %d). Suppressed: %d",
			instanceID, w.count, srl.windowSeconds, srl.maxAlerts, w.suppressedCount,
		)
		return false, w.suppressedCount, summary
	}

	w.count++
	return true, 0, ""
}

// GetSuppressedCount returns the number of suppressed alerts for an instance.
func (srl *ServiceAlertRateLimiter) GetSuppressedCount(instanceID string) int {
	srl.mu.RLock()
	defer srl.mu.RUnlock()

	w, exists := srl.windows[instanceID]
	if !exists {
		return 0
	}

	now := srl.clock.Now()
	window := time.Duration(srl.windowSeconds) * time.Second
	if now.Sub(w.windowStart) >= window {
		return 0
	}
	return w.suppressedCount
}

// GetWindowStats returns statistics for an instance's current window.
func (srl *ServiceAlertRateLimiter) GetWindowStats(instanceID string) (int, int, time.Time, bool) {
	srl.mu.RLock()
	defer srl.mu.RUnlock()

	w, exists := srl.windows[instanceID]
	if !exists {
		return 0, 0, time.Time{}, false
	}

	now := srl.clock.Now()
	window := time.Duration(srl.windowSeconds) * time.Second
	if now.Sub(w.windowStart) >= window {
		return 0, 0, time.Time{}, false
	}
	return w.count, w.suppressedCount, w.windowStart, true
}

// Reset clears all window state for a specific instance.
func (srl *ServiceAlertRateLimiter) Reset(instanceID string) {
	srl.mu.Lock()
	defer srl.mu.Unlock()
	delete(srl.windows, instanceID)
}

// ResetAll clears all window state.
func (srl *ServiceAlertRateLimiter) ResetAll() {
	srl.mu.Lock()
	defer srl.mu.Unlock()
	srl.windows = make(map[string]*instanceWindow)
}

func (srl *ServiceAlertRateLimiter) cleanupWorker() {
	defer srl.wg.Done()
	for {
		select {
		case <-srl.cleanupTicker.C:
			srl.cleanup()
		case <-srl.stopCh:
			return
		}
	}
}

func (srl *ServiceAlertRateLimiter) cleanup() {
	srl.mu.Lock()
	defer srl.mu.Unlock()

	now := srl.clock.Now()
	window := time.Duration(srl.windowSeconds) * time.Second
	threshold := 2 * window

	expired := make([]string, 0)
	for id, w := range srl.windows {
		if now.Sub(w.windowStart) >= threshold {
			expired = append(expired, id)
		}
	}
	for _, id := range expired {
		delete(srl.windows, id)
	}
}

// Close stops the cleanup worker and releases resources.
func (srl *ServiceAlertRateLimiter) Close() {
	close(srl.stopCh)
	if srl.cleanupTicker != nil {
		srl.cleanupTicker.Stop()
	}
	srl.wg.Wait()
}
