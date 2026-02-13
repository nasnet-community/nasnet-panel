// Package alerts implements quiet hours filter testing
package alerts

import (
	"sync"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestQuietHoursFilter tests quiet hours suppression logic
// Per Task 7.3: Unit tests for quiet hours filter
func TestQuietHoursFilter(t *testing.T) {
	qh := NewQuietHoursFilter()

	t.Run("no quiet hours config - never suppress", func(t *testing.T) {
		config := QuietHoursConfig{} // Empty config
		suppress, _ := qh.ShouldSuppress(config, "WARNING", time.Now())
		if suppress {
			t.Error("Expected no suppression with empty config")
		}
	})

	t.Run("critical alerts bypass quiet hours", func(t *testing.T) {
		config := QuietHoursConfig{
			StartTime:      "22:00",
			EndTime:        "07:00",
			Timezone:       "UTC",
			BypassCritical: true,
		}

		// During quiet hours (midnight UTC)
		midnight := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)

		suppress, reason := qh.ShouldSuppress(config, "CRITICAL", midnight)
		if suppress {
			t.Errorf("Expected CRITICAL alert to bypass quiet hours, got suppressed: %s", reason)
		}
	})

	t.Run("non-critical alerts suppressed during quiet hours", func(t *testing.T) {
		config := QuietHoursConfig{
			StartTime:      "22:00",
			EndTime:        "07:00",
			Timezone:       "UTC",
			BypassCritical: true,
		}

		// During quiet hours (midnight UTC)
		midnight := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)

		suppress, reason := qh.ShouldSuppress(config, "WARNING", midnight)
		if !suppress {
			t.Error("Expected WARNING alert to be suppressed during quiet hours")
		}
		if reason == "" {
			t.Error("Expected suppression reason to be provided")
		}
	})

	t.Run("alerts allowed outside quiet hours", func(t *testing.T) {
		config := QuietHoursConfig{
			StartTime:      "22:00",
			EndTime:        "07:00",
			Timezone:       "UTC",
			BypassCritical: true,
		}

		// Outside quiet hours (noon UTC)
		noon := time.Date(2024, 1, 1, 12, 0, 0, 0, time.UTC)

		suppress, _ := qh.ShouldSuppress(config, "WARNING", noon)
		if suppress {
			t.Error("Expected alert to be allowed outside quiet hours")
		}
	})

	t.Run("quiet hours spanning midnight", func(t *testing.T) {
		config := QuietHoursConfig{
			StartTime:      "22:00",
			EndTime:        "07:00",
			Timezone:       "UTC",
			BypassCritical: true,
		}

		tests := []struct {
			name     string
			hour     int
			suppress bool
		}{
			{"before quiet hours", 21, false},
			{"start of quiet hours", 22, true},
			{"during night", 23, true},
			{"midnight", 0, true},
			{"early morning", 6, true},
			{"end of quiet hours", 7, false},
			{"after quiet hours", 8, false},
		}

		for _, tt := range tests {
			t.Run(tt.name, func(t *testing.T) {
				testTime := time.Date(2024, 1, 1, tt.hour, 0, 0, 0, time.UTC)
				suppress, _ := qh.ShouldSuppress(config, "WARNING", testTime)
				if suppress != tt.suppress {
					t.Errorf("At %02d:00, suppress = %v, want %v", tt.hour, suppress, tt.suppress)
				}
			})
		}
	})

	t.Run("normal daytime quiet hours", func(t *testing.T) {
		config := QuietHoursConfig{
			StartTime:      "09:00",
			EndTime:        "17:00",
			Timezone:       "UTC",
			BypassCritical: true,
		}

		tests := []struct {
			name     string
			hour     int
			suppress bool
		}{
			{"before quiet hours", 8, false},
			{"start of quiet hours", 9, true},
			{"mid-day", 12, true},
			{"end boundary", 16, true},
			{"after quiet hours", 17, false},
		}

		for _, tt := range tests {
			t.Run(tt.name, func(t *testing.T) {
				testTime := time.Date(2024, 1, 1, tt.hour, 0, 0, 0, time.UTC)
				suppress, _ := qh.ShouldSuppress(config, "INFO", testTime)
				if suppress != tt.suppress {
					t.Errorf("At %02d:00, suppress = %v, want %v", tt.hour, suppress, tt.suppress)
				}
			})
		}
	})

	t.Run("timezone handling", func(t *testing.T) {
		config := QuietHoursConfig{
			StartTime:      "22:00",
			EndTime:        "07:00",
			Timezone:       "America/New_York",
			BypassCritical: true,
		}

		// 3 AM UTC = 10 PM EST (previous day, during quiet hours in EST)
		testTime := time.Date(2024, 1, 1, 3, 0, 0, 0, time.UTC)

		suppress, _ := qh.ShouldSuppress(config, "WARNING", testTime)
		if !suppress {
			t.Error("Expected alert to be suppressed (3 AM UTC = 10 PM EST, during quiet hours)")
		}
	})

	t.Run("bypass critical disabled", func(t *testing.T) {
		config := QuietHoursConfig{
			StartTime:      "22:00",
			EndTime:        "07:00",
			Timezone:       "UTC",
			BypassCritical: false, // Critical alerts also suppressed
		}

		midnight := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)

		suppress, _ := qh.ShouldSuppress(config, "CRITICAL", midnight)
		if !suppress {
			t.Error("Expected CRITICAL alert to be suppressed when BypassCritical is false")
		}
	})
}

// TestParseQuietHoursConfig tests configuration parsing
func TestParseQuietHoursConfig(t *testing.T) {
	tests := []struct {
		name      string
		input     map[string]interface{}
		wantError bool
	}{
		{
			name: "valid config",
			input: map[string]interface{}{
				"startTime":      "22:00",
				"endTime":        "07:00",
				"timezone":       "UTC",
				"bypassCritical": true,
			},
			wantError: false,
		},
		{
			name: "missing startTime",
			input: map[string]interface{}{
				"endTime":        "07:00",
				"timezone":       "UTC",
				"bypassCritical": true,
			},
			wantError: true,
		},
		{
			name: "invalid time format",
			input: map[string]interface{}{
				"startTime":      "22:00:00", // Invalid format (should be HH:MM)
				"endTime":        "07:00",
				"timezone":       "UTC",
				"bypassCritical": true,
			},
			wantError: true,
		},
		{
			name: "invalid timezone",
			input: map[string]interface{}{
				"startTime":      "22:00",
				"endTime":        "07:00",
				"timezone":       "Invalid/Timezone",
				"bypassCritical": true,
			},
			wantError: true,
		},
		{
			name: "defaults applied",
			input: map[string]interface{}{
				"startTime": "22:00",
				"endTime":   "07:00",
				// timezone and bypassCritical will use defaults
			},
			wantError: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := ParseQuietHoursConfig(tt.input)
			if (err != nil) != tt.wantError {
				t.Errorf("ParseQuietHoursConfig() error = %v, wantError %v", err, tt.wantError)
			}
		})
	}
}

// TestGetNextDeliveryTime tests digest delivery time calculation
func TestGetNextDeliveryTime(t *testing.T) {
	qh := NewQuietHoursFilter()

	config := QuietHoursConfig{
		StartTime:      "22:00",
		EndTime:        "07:00",
		Timezone:       "UTC",
		BypassCritical: true,
	}

	// Current time: 11 PM (during quiet hours)
	currentTime := time.Date(2024, 1, 1, 23, 0, 0, 0, time.UTC)

	nextDelivery, err := qh.GetNextDeliveryTime(config, currentTime)
	if err != nil {
		t.Fatalf("GetNextDeliveryTime() error = %v", err)
	}

	// Should be 7 AM the next day
	expectedHour := 7
	if nextDelivery.Hour() != expectedHour {
		t.Errorf("Next delivery hour = %d, want %d", nextDelivery.Hour(), expectedHour)
	}

	// Should be after current time
	if !nextDelivery.After(currentTime) {
		t.Error("Next delivery time should be after current time")
	}
}

// TestDaysOfWeekFiltering tests day-of-week filtering logic with table-driven tests.
// This is the primary test for Task #1 (DaysOfWeek support).
func TestDaysOfWeekFiltering(t *testing.T) {
	filter := NewQuietHoursFilter()

	tests := []struct {
		name           string
		config         QuietHoursConfig
		testTime       time.Time
		severity       string
		wantSuppressed bool
		wantReasonPart string
	}{
		{
			name: "weekday-only config on weekend should not suppress",
			config: QuietHoursConfig{
				StartTime:      "22:00",
				EndTime:        "07:00",
				Timezone:       "UTC",
				BypassCritical: true,
				DaysOfWeek:     []int{1, 2, 3, 4, 5}, // Monday-Friday
			},
			testTime:       time.Date(2024, 1, 6, 23, 0, 0, 0, time.UTC), // Saturday night at 11pm
			severity:       "WARNING",
			wantSuppressed: false,
			wantReasonPart: "Saturday",
		},
		{
			name: "weekend-only config on weekday should not suppress",
			config: QuietHoursConfig{
				StartTime:      "22:00",
				EndTime:        "07:00",
				Timezone:       "UTC",
				BypassCritical: true,
				DaysOfWeek:     []int{0, 6}, // Sunday, Saturday
			},
			testTime:       time.Date(2024, 1, 3, 23, 0, 0, 0, time.UTC), // Wednesday night
			severity:       "WARNING",
			wantSuppressed: false,
			wantReasonPart: "Wednesday",
		},
		{
			name: "empty DaysOfWeek applies to all days (backward compatible)",
			config: QuietHoursConfig{
				StartTime:      "22:00",
				EndTime:        "07:00",
				Timezone:       "UTC",
				BypassCritical: true,
				DaysOfWeek:     []int{}, // Empty = all days
			},
			testTime:       time.Date(2024, 1, 6, 23, 0, 0, 0, time.UTC), // Saturday night
			severity:       "WARNING",
			wantSuppressed: true,
			wantReasonPart: "quiet hours active",
		},
		{
			name: "overnight range with matching day should suppress",
			config: QuietHoursConfig{
				StartTime:      "22:00",
				EndTime:        "07:00",
				Timezone:       "UTC",
				BypassCritical: true,
				DaysOfWeek:     []int{1, 2, 3, 4, 5}, // Monday-Friday
			},
			testTime:       time.Date(2024, 1, 2, 23, 30, 0, 0, time.UTC), // Tuesday 11:30pm
			severity:       "WARNING",
			wantSuppressed: true,
			wantReasonPart: "quiet hours active",
		},
		{
			name: "critical bypass works with day-of-week filter",
			config: QuietHoursConfig{
				StartTime:      "22:00",
				EndTime:        "07:00",
				Timezone:       "UTC",
				BypassCritical: true,
				DaysOfWeek:     []int{1, 2, 3, 4, 5}, // Monday-Friday
			},
			testTime:       time.Date(2024, 1, 2, 23, 30, 0, 0, time.UTC), // Tuesday 11:30pm
			severity:       "CRITICAL",
			wantSuppressed: false,
			wantReasonPart: "critical bypasses",
		},
		{
			name: "Sunday (day 0) filter works correctly",
			config: QuietHoursConfig{
				StartTime:      "22:00",
				EndTime:        "07:00",
				Timezone:       "UTC",
				BypassCritical: false,
				DaysOfWeek:     []int{0}, // Sunday only
			},
			testTime:       time.Date(2024, 1, 7, 23, 0, 0, 0, time.UTC), // Sunday night
			severity:       "WARNING",
			wantSuppressed: true,
			wantReasonPart: "quiet hours active",
		},
		{
			name: "Saturday (day 6) filter works correctly",
			config: QuietHoursConfig{
				StartTime:      "22:00",
				EndTime:        "07:00",
				Timezone:       "UTC",
				BypassCritical: false,
				DaysOfWeek:     []int{6}, // Saturday only
			},
			testTime:       time.Date(2024, 1, 6, 23, 0, 0, 0, time.UTC), // Saturday night
			severity:       "WARNING",
			wantSuppressed: true,
			wantReasonPart: "quiet hours active",
		},
		{
			name: "outside time range on matching day should not suppress",
			config: QuietHoursConfig{
				StartTime:      "22:00",
				EndTime:        "07:00",
				Timezone:       "UTC",
				BypassCritical: true,
				DaysOfWeek:     []int{1, 2, 3, 4, 5}, // Monday-Friday
			},
			testTime:       time.Date(2024, 1, 2, 12, 0, 0, 0, time.UTC), // Tuesday noon
			severity:       "WARNING",
			wantSuppressed: false,
			wantReasonPart: "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			suppressed, reason := filter.ShouldSuppress(tt.config, tt.severity, tt.testTime)
			assert.Equal(t, tt.wantSuppressed, suppressed, "suppression mismatch")
			if tt.wantReasonPart != "" {
				assert.Contains(t, reason, tt.wantReasonPart, "reason should contain expected part")
			}
		})
	}
}

// TestAlertQueueOperations tests AlertQueue basic operations.
// This tests Task #2 (AlertQueue implementation).
func TestAlertQueueOperations(t *testing.T) {
	t.Run("empty queue operations", func(t *testing.T) {
		queue := NewAlertQueue()
		assert.Equal(t, 0, queue.Count(), "new queue should be empty")
		assert.Empty(t, queue.GetByDevice("device1"), "should return empty slice for non-existent device")

		dequeued := queue.DequeueAll()
		assert.Empty(t, dequeued, "dequeue on empty queue should return empty map")
	})

	t.Run("enqueue and count", func(t *testing.T) {
		queue := NewAlertQueue()

		alert1 := QueuedAlert{
			RuleID:    "rule1",
			EventType: "cpu.high",
			Severity:  "WARNING",
			Timestamp: time.Now(),
			DeviceID:  "device1",
			EventData: map[string]interface{}{"cpu": 85.5},
		}

		alert2 := QueuedAlert{
			RuleID:    "rule2",
			EventType: "memory.high",
			Severity:  "ERROR",
			Timestamp: time.Now(),
			DeviceID:  "device1",
			EventData: map[string]interface{}{"memory": 92.3},
		}

		alert3 := QueuedAlert{
			RuleID:    "rule1",
			EventType: "cpu.high",
			Severity:  "WARNING",
			Timestamp: time.Now(),
			DeviceID:  "device2",
			EventData: map[string]interface{}{"cpu": 90.0},
		}

		queue.Enqueue(alert1)
		assert.Equal(t, 1, queue.Count(), "count should be 1 after first enqueue")

		queue.Enqueue(alert2)
		assert.Equal(t, 2, queue.Count(), "count should be 2 after second enqueue")

		queue.Enqueue(alert3)
		assert.Equal(t, 3, queue.Count(), "count should be 3 after third enqueue")
	})

	t.Run("get by device", func(t *testing.T) {
		queue := NewAlertQueue()

		alert1 := QueuedAlert{
			RuleID:    "rule1",
			EventType: "cpu.high",
			Severity:  "WARNING",
			Timestamp: time.Now(),
			DeviceID:  "device1",
		}

		alert2 := QueuedAlert{
			RuleID:    "rule2",
			EventType: "memory.high",
			Severity:  "ERROR",
			Timestamp: time.Now(),
			DeviceID:  "device2",
		}

		queue.Enqueue(alert1)
		queue.Enqueue(alert2)

		device1Alerts := queue.GetByDevice("device1")
		require.Len(t, device1Alerts, 1, "device1 should have 1 alert")
		assert.Equal(t, "rule1", device1Alerts[0].RuleID)

		device2Alerts := queue.GetByDevice("device2")
		require.Len(t, device2Alerts, 1, "device2 should have 1 alert")
		assert.Equal(t, "rule2", device2Alerts[0].RuleID)

		// GetByDevice should not remove alerts
		assert.Equal(t, 2, queue.Count(), "count should still be 2 after GetByDevice")
	})

	t.Run("dequeue all atomically clears queue", func(t *testing.T) {
		queue := NewAlertQueue()

		alert1 := QueuedAlert{RuleID: "rule1", DeviceID: "device1"}
		alert2 := QueuedAlert{RuleID: "rule2", DeviceID: "device2"}

		queue.Enqueue(alert1)
		queue.Enqueue(alert2)

		dequeued := queue.DequeueAll()
		require.Len(t, dequeued, 2, "should dequeue 2 devices")
		assert.Len(t, dequeued["device1"], 1, "device1 should have 1 alert")
		assert.Len(t, dequeued["device2"], 1, "device2 should have 1 alert")

		// Queue should be empty after dequeue
		assert.Equal(t, 0, queue.Count(), "queue should be empty after DequeueAll")

		// Subsequent dequeue should return empty
		dequeued2 := queue.DequeueAll()
		assert.Empty(t, dequeued2, "second dequeue should return empty map")
	})

	t.Run("clear operation", func(t *testing.T) {
		queue := NewAlertQueue()

		queue.Enqueue(QueuedAlert{RuleID: "rule1", DeviceID: "device1"})
		queue.Enqueue(QueuedAlert{RuleID: "rule2", DeviceID: "device2"})
		assert.Equal(t, 2, queue.Count())

		queue.Clear()
		assert.Equal(t, 0, queue.Count(), "queue should be empty after Clear")
		assert.Empty(t, queue.GetByDevice("device1"), "device1 should have no alerts after clear")
	})
}

// TestAlertQueueConcurrency tests thread-safe concurrent access to AlertQueue.
// Critical for production reliability (10 goroutines).
func TestAlertQueueConcurrency(t *testing.T) {
	queue := NewAlertQueue()
	const numGoroutines = 10
	const alertsPerGoroutine = 100

	var wg sync.WaitGroup

	t.Run("concurrent enqueue operations", func(t *testing.T) {
		queue.Clear()

		// Enqueue from multiple goroutines
		for i := 0; i < numGoroutines; i++ {
			wg.Add(1)
			go func(goroutineID int) {
				defer wg.Done()
				for j := 0; j < alertsPerGoroutine; j++ {
					queue.Enqueue(QueuedAlert{
						RuleID:    "rule1",
						EventType: "test.event",
						Severity:  "INFO",
						Timestamp: time.Now(),
						DeviceID:  "device1",
						EventData: map[string]interface{}{
							"goroutine": goroutineID,
							"index":     j,
						},
					})
				}
			}(i)
		}

		wg.Wait()

		// Verify count
		expectedCount := numGoroutines * alertsPerGoroutine
		actualCount := queue.Count()
		assert.Equal(t, expectedCount, actualCount, "all alerts should be enqueued without data loss")
	})

	t.Run("concurrent reads and writes", func(t *testing.T) {
		queue.Clear()

		var readWg sync.WaitGroup

		// Start readers (non-modifying operations)
		for i := 0; i < 5; i++ {
			readWg.Add(1)
			go func() {
				defer readWg.Done()
				for j := 0; j < 100; j++ {
					_ = queue.Count()
					_ = queue.GetByDevice("device1")
				}
			}()
		}

		// Start writers (modifying operations)
		for i := 0; i < 5; i++ {
			readWg.Add(1)
			go func(id int) {
				defer readWg.Done()
				for j := 0; j < 100; j++ {
					queue.Enqueue(QueuedAlert{
						RuleID:   "rule1",
						DeviceID: "device1",
					})
				}
			}(i)
		}

		readWg.Wait()

		// Should complete without data races or panics
		assert.True(t, queue.Count() >= 0, "queue should maintain consistent state")
	})

	t.Run("concurrent dequeue operations", func(t *testing.T) {
		queue.Clear()

		// Populate queue
		for i := 0; i < 100; i++ {
			queue.Enqueue(QueuedAlert{
				RuleID:   "rule1",
				DeviceID: "device1",
			})
		}

		var dequeueWg sync.WaitGroup
		dequeueResults := make([]map[string][]QueuedAlert, 3)

		// Multiple goroutines trying to dequeue
		for i := 0; i < 3; i++ {
			dequeueWg.Add(1)
			go func(idx int) {
				defer dequeueWg.Done()
				dequeueResults[idx] = queue.DequeueAll()
			}(i)
		}

		dequeueWg.Wait()

		// Only one dequeue should get the alerts, others should get empty
		nonEmptyCount := 0
		for _, result := range dequeueResults {
			if len(result) > 0 {
				nonEmptyCount++
			}
		}

		assert.Equal(t, 1, nonEmptyCount, "only one DequeueAll should return alerts (atomic operation)")
		assert.Equal(t, 0, queue.Count(), "queue should be empty after dequeues")
	})
}

// TestDigestFormatting tests digest message generation and formatting.
func TestDigestFormatting(t *testing.T) {
	t.Run("empty alerts", func(t *testing.T) {
		digest := FormatDigest([]QueuedAlert{}, "device1")
		assert.Empty(t, digest, "empty alerts should produce empty digest")
	})

	t.Run("single alert", func(t *testing.T) {
		alerts := []QueuedAlert{
			{
				RuleID:    "rule1",
				EventType: "cpu.high",
				Severity:  "WARNING",
				Timestamp: time.Date(2024, 1, 1, 10, 0, 0, 0, time.UTC),
				DeviceID:  "device1",
			},
		}

		digest := FormatDigest(alerts, "device1")
		assert.Contains(t, digest, "Quiet Hours Digest for device1")
		assert.Contains(t, digest, "Total Alerts: 1")
		assert.Contains(t, digest, "WARNING (1)")
		assert.Contains(t, digest, "cpu.high: 1")
	})

	t.Run("multiple alerts grouped by severity", func(t *testing.T) {
		alerts := []QueuedAlert{
			{EventType: "cpu.high", Severity: "WARNING", Timestamp: time.Now(), DeviceID: "device1"},
			{EventType: "memory.high", Severity: "ERROR", Timestamp: time.Now(), DeviceID: "device1"},
			{EventType: "disk.full", Severity: "CRITICAL", Timestamp: time.Now(), DeviceID: "device1"},
			{EventType: "cpu.high", Severity: "WARNING", Timestamp: time.Now(), DeviceID: "device1"},
		}

		digest := FormatDigest(alerts, "device1")
		assert.Contains(t, digest, "Total Alerts: 4")
		assert.Contains(t, digest, "CRITICAL (1)")
		assert.Contains(t, digest, "ERROR (1)")
		assert.Contains(t, digest, "WARNING (2)")
		assert.Contains(t, digest, "cpu.high: 2", "should group duplicate event types")
		assert.Contains(t, digest, "memory.high: 1")
		assert.Contains(t, digest, "disk.full: 1")
	})

	t.Run("severity ordering (CRITICAL, ERROR, WARNING, INFO)", func(t *testing.T) {
		alerts := []QueuedAlert{
			{EventType: "test1", Severity: "INFO", Timestamp: time.Now(), DeviceID: "device1"},
			{EventType: "test2", Severity: "WARNING", Timestamp: time.Now(), DeviceID: "device1"},
			{EventType: "test3", Severity: "ERROR", Timestamp: time.Now(), DeviceID: "device1"},
			{EventType: "test4", Severity: "CRITICAL", Timestamp: time.Now(), DeviceID: "device1"},
		}

		digest := FormatDigest(alerts, "device1")

		// Check that severities appear in correct order using string index
		criticalIdx := indexOfSubstring(digest, "CRITICAL")
		errorIdx := indexOfSubstring(digest, "ERROR")
		warningIdx := indexOfSubstring(digest, "WARNING")
		infoIdx := indexOfSubstring(digest, "INFO")

		assert.NotEqual(t, -1, criticalIdx, "CRITICAL should be in digest")
		assert.NotEqual(t, -1, errorIdx, "ERROR should be in digest")
		assert.NotEqual(t, -1, warningIdx, "WARNING should be in digest")
		assert.NotEqual(t, -1, infoIdx, "INFO should be in digest")

		assert.Less(t, criticalIdx, errorIdx, "CRITICAL should appear before ERROR")
		assert.Less(t, errorIdx, warningIdx, "ERROR should appear before WARNING")
		assert.Less(t, warningIdx, infoIdx, "WARNING should appear before INFO")
	})

	t.Run("timestamp range included", func(t *testing.T) {
		alerts := []QueuedAlert{
			{
				EventType: "test1",
				Severity:  "INFO",
				Timestamp: time.Date(2024, 1, 1, 10, 0, 0, 0, time.UTC),
				DeviceID:  "device1",
			},
			{
				EventType: "test2",
				Severity:  "WARNING",
				Timestamp: time.Date(2024, 1, 1, 10, 30, 0, 0, time.UTC),
				DeviceID:  "device1",
			},
		}

		digest := FormatDigest(alerts, "device1")
		assert.Contains(t, digest, "Period:")
		assert.Contains(t, digest, "10:00:00")
		assert.Contains(t, digest, "10:30:00")
	})

	t.Run("empty severity defaults to INFO", func(t *testing.T) {
		alerts := []QueuedAlert{
			{
				EventType: "test1",
				Severity:  "", // Empty severity
				Timestamp: time.Now(),
				DeviceID:  "device1",
			},
		}

		digest := FormatDigest(alerts, "device1")
		assert.Contains(t, digest, "INFO (1)", "empty severity should default to INFO")
	})
}

// TestParseQuietHoursConfigExtended tests additional configuration parsing scenarios.
func TestParseQuietHoursConfigExtended(t *testing.T) {
	t.Run("daysOfWeek with float64 (JSON deserialization)", func(t *testing.T) {
		configJSON := map[string]interface{}{
			"startTime":  "22:00",
			"endTime":    "07:00",
			"daysOfWeek": []interface{}{1.0, 2.0, 3.0, 4.0, 5.0}, // JSON numbers are float64
		}

		config, err := ParseQuietHoursConfig(configJSON)
		require.NoError(t, err)
		assert.Equal(t, []int{1, 2, 3, 4, 5}, config.DaysOfWeek)
	})

	t.Run("daysOfWeek with []int (direct Go)", func(t *testing.T) {
		configJSON := map[string]interface{}{
			"startTime":  "22:00",
			"endTime":    "07:00",
			"daysOfWeek": []int{0, 6}, // Weekend
		}

		config, err := ParseQuietHoursConfig(configJSON)
		require.NoError(t, err)
		assert.Equal(t, []int{0, 6}, config.DaysOfWeek)
	})

	t.Run("invalid daysOfWeek value (out of range)", func(t *testing.T) {
		configJSON := map[string]interface{}{
			"startTime":  "22:00",
			"endTime":    "07:00",
			"daysOfWeek": []interface{}{1.0, 7.0}, // 7 is invalid (valid: 0-6)
		}

		_, err := ParseQuietHoursConfig(configJSON)
		require.Error(t, err)
		assert.Contains(t, err.Error(), "must be between 0 (Sunday) and 6 (Saturday)")
	})

	t.Run("invalid daysOfWeek type", func(t *testing.T) {
		configJSON := map[string]interface{}{
			"startTime":  "22:00",
			"endTime":    "07:00",
			"daysOfWeek": "invalid", // Wrong type
		}

		_, err := ParseQuietHoursConfig(configJSON)
		require.Error(t, err)
		assert.Contains(t, err.Error(), "must be an array")
	})
}

// indexOfSubstring returns the index of the first occurrence of substr in s, or -1 if not found.
func indexOfSubstring(s, substr string) int {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return i
		}
	}
	return -1
}
