// Package alerts implements quiet hours filter testing
package alerts

import (
	"testing"
	"time"
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
