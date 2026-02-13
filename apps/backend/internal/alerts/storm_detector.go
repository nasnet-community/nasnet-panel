// Package alerts implements storm detection to prevent alert overload.
package alerts

import (
	"sync"
	"time"
)

// StormConfig holds configuration for storm detection.
type StormConfig struct {
	// Threshold is the maximum number of alerts per minute before storm mode activates
	Threshold int

	// WindowSeconds is the time window for counting alerts
	WindowSeconds int

	// CooldownSeconds is how long to suppress alerts after a storm is detected
	CooldownSeconds int
}

// DefaultStormConfig returns the default storm detection configuration.
func DefaultStormConfig() StormConfig {
	return StormConfig{
		Threshold:       100, // 100 alerts/min
		WindowSeconds:   60,  // 1 minute window
		CooldownSeconds: 300, // 5 minute cooldown
	}
}

// StormStatus represents the current storm detection status.
type StormStatus struct {
	// InStorm indicates whether storm mode is currently active
	InStorm bool

	// StormStartTime is when the storm was detected (zero if not in storm)
	StormStartTime time.Time

	// SuppressedCount is the number of alerts suppressed during this storm
	SuppressedCount int

	// CurrentRate is the current alert rate (alerts per minute)
	CurrentRate float64

	// CooldownRemaining is the remaining cooldown time (zero if not in cooldown)
	CooldownRemaining time.Duration
}

// StormDetector implements global rate limiting for alert storms.
// Thread-safe for concurrent use.
type StormDetector struct {
	config StormConfig
	clock  Clock

	mu              sync.RWMutex
	timestamps      []time.Time // Ring buffer of recent alert timestamps
	inStorm         bool
	stormStartTime  time.Time
	suppressedCount int
}

// NewStormDetector creates a new storm detector with the given configuration.
func NewStormDetector(config StormConfig, clock Clock) *StormDetector {
	if clock == nil {
		clock = RealClock{}
	}

	return &StormDetector{
		config:     config,
		clock:      clock,
		timestamps: make([]time.Time, 0, config.Threshold*2), // Pre-allocate with headroom
	}
}

// RecordAlert records a new alert and returns whether it should be allowed.
// Returns false if storm mode is active.
func (sd *StormDetector) RecordAlert() bool {
	sd.mu.Lock()
	defer sd.mu.Unlock()

	now := sd.clock.Now()
	windowStart := now.Add(-time.Duration(sd.config.WindowSeconds) * time.Second)

	// Remove timestamps outside the window
	sd.pruneOldTimestamps(windowStart)

	// Check if we're in cooldown period
	if sd.inStorm {
		cooldownEnd := sd.stormStartTime.Add(time.Duration(sd.config.CooldownSeconds) * time.Second)
		if now.Before(cooldownEnd) {
			// Still in cooldown - suppress this alert
			sd.suppressedCount++
			return false
		}

		// Cooldown expired - exit storm mode
		sd.inStorm = false
		sd.stormStartTime = time.Time{}
		sd.suppressedCount = 0
	}

	// Add current timestamp
	sd.timestamps = append(sd.timestamps, now)

	// Check if we've exceeded the threshold
	if len(sd.timestamps) > sd.config.Threshold {
		// Enter storm mode
		if !sd.inStorm {
			sd.inStorm = true
			sd.stormStartTime = now
			sd.suppressedCount = 0
		}
		return false
	}

	return true
}

// GetStatus returns the current storm detection status.
func (sd *StormDetector) GetStatus() StormStatus {
	sd.mu.RLock()
	defer sd.mu.RUnlock()

	now := sd.clock.Now()
	windowStart := now.Add(-time.Duration(sd.config.WindowSeconds) * time.Second)

	// Count alerts in current window
	alertCount := 0
	for _, ts := range sd.timestamps {
		if ts.After(windowStart) {
			alertCount++
		}
	}

	// Calculate current rate (alerts per minute)
	currentRate := float64(alertCount) / (float64(sd.config.WindowSeconds) / 60.0)

	status := StormStatus{
		InStorm:         sd.inStorm,
		StormStartTime:  sd.stormStartTime,
		SuppressedCount: sd.suppressedCount,
		CurrentRate:     currentRate,
	}

	// Calculate remaining cooldown
	if sd.inStorm {
		cooldownEnd := sd.stormStartTime.Add(time.Duration(sd.config.CooldownSeconds) * time.Second)
		remaining := cooldownEnd.Sub(now)
		if remaining > 0 {
			status.CooldownRemaining = remaining
		}
	}

	return status
}

// Reset clears all state and exits storm mode.
// Useful for testing or manual intervention.
func (sd *StormDetector) Reset() {
	sd.mu.Lock()
	defer sd.mu.Unlock()

	sd.timestamps = sd.timestamps[:0]
	sd.inStorm = false
	sd.stormStartTime = time.Time{}
	sd.suppressedCount = 0
}

// pruneOldTimestamps removes timestamps older than the window start.
// Must be called with lock held.
func (sd *StormDetector) pruneOldTimestamps(windowStart time.Time) {
	// Find first timestamp within window
	start := 0
	for start < len(sd.timestamps) && sd.timestamps[start].Before(windowStart) {
		start++
	}

	// Shift remaining timestamps to beginning of slice
	if start > 0 {
		copy(sd.timestamps, sd.timestamps[start:])
		sd.timestamps = sd.timestamps[:len(sd.timestamps)-start]
	}
}
