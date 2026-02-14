package throttle

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

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
