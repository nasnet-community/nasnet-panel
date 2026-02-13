package alerts

import (
	"testing"
	"time"
)

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
