package throttle

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestParseQuietHoursConfig tests configuration parsing.
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
