// Package alerts implements alert throttling to prevent spam.
package alerts

import (
	"sync"
	"time"
)

// Clock is an interface for time operations, allowing time injection in tests.
type Clock interface {
	Now() time.Time
}

// RealClock implements Clock using the actual system time.
type RealClock struct{}

// Now returns the current system time.
func (RealClock) Now() time.Time {
	return time.Now()
}

// MockClock implements Clock with controllable time for testing.
type MockClock struct {
	mu      sync.RWMutex
	current time.Time
}

// NewMockClock creates a MockClock starting at the given time.
// If t is zero, it starts at Unix epoch.
func NewMockClock(t time.Time) *MockClock {
	if t.IsZero() {
		t = time.Unix(0, 0)
	}
	return &MockClock{
		current: t,
	}
}

// Now returns the current mock time.
func (m *MockClock) Now() time.Time {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.current
}

// Set sets the mock clock to a specific time.
func (m *MockClock) Set(t time.Time) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.current = t
}

// Advance moves the mock clock forward by the given duration.
func (m *MockClock) Advance(d time.Duration) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.current = m.current.Add(d)
}
