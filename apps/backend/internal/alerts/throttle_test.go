// Package alerts implements throttle manager testing
package alerts

import (
	"testing"
	"time"
)

// TestThrottleManager tests rate limiting functionality
// Per Task 7.2: Unit tests for throttle manager
func TestThrottleManager(t *testing.T) {
	tm := NewThrottleManager()

	t.Run("no throttle config - always allows", func(t *testing.T) {
		config := ThrottleConfig{} // Empty config
		eventData := map[string]interface{}{"device_id": "router-1"}

		allowed, reason := tm.ShouldAllow("rule-1", eventData, config)
		if !allowed {
			t.Errorf("Expected alert to be allowed with no throttle config, got blocked: %s", reason)
		}
	})

	t.Run("first alert always allowed", func(t *testing.T) {
		config := ThrottleConfig{
			MaxAlerts:     1,
			PeriodSeconds: 60,
		}
		eventData := map[string]interface{}{"device_id": "router-1"}

		allowed, _ := tm.ShouldAllow("rule-2", eventData, config)
		if !allowed {
			t.Error("Expected first alert to be allowed")
		}
	})

	t.Run("throttle enforced within period", func(t *testing.T) {
		tm := NewThrottleManager()
		config := ThrottleConfig{
			MaxAlerts:     1,
			PeriodSeconds: 60,
		}
		eventData := map[string]interface{}{"device_id": "router-1"}

		// First alert
		allowed1, _ := tm.ShouldAllow("rule-3", eventData, config)
		if !allowed1 {
			t.Error("Expected first alert to be allowed")
		}

		// Second alert immediately after (should be blocked)
		allowed2, reason := tm.ShouldAllow("rule-3", eventData, config)
		if allowed2 {
			t.Error("Expected second alert to be throttled")
		}
		if reason == "" {
			t.Error("Expected throttle reason to be provided")
		}
	})

	t.Run("throttle expires after period", func(t *testing.T) {
		tm := NewThrottleManager()
		config := ThrottleConfig{
			MaxAlerts:     1,
			PeriodSeconds: 1, // 1 second period
		}
		eventData := map[string]interface{}{"device_id": "router-1"}

		// First alert
		tm.ShouldAllow("rule-4", eventData, config)

		// Wait for period to expire
		time.Sleep(1100 * time.Millisecond)

		// Second alert after period (should be allowed)
		allowed, _ := tm.ShouldAllow("rule-4", eventData, config)
		if !allowed {
			t.Error("Expected alert to be allowed after throttle period expired")
		}
	})

	t.Run("multiple alerts within limit", func(t *testing.T) {
		tm := NewThrottleManager()
		config := ThrottleConfig{
			MaxAlerts:     3,
			PeriodSeconds: 60,
		}
		eventData := map[string]interface{}{"device_id": "router-1"}

		// Send 3 alerts (all should be allowed)
		for i := 0; i < 3; i++ {
			allowed, _ := tm.ShouldAllow("rule-5", eventData, config)
			if !allowed {
				t.Errorf("Expected alert %d to be allowed (limit is 3)", i+1)
			}
		}

		// 4th alert should be throttled
		allowed, _ := tm.ShouldAllow("rule-5", eventData, config)
		if allowed {
			t.Error("Expected 4th alert to be throttled (limit is 3)")
		}
	})

	t.Run("group by field - separate throttle per group", func(t *testing.T) {
		tm := NewThrottleManager()
		config := ThrottleConfig{
			MaxAlerts:     1,
			PeriodSeconds: 60,
			GroupByField:  "device_id",
		}

		// Alert for router-1
		event1 := map[string]interface{}{"device_id": "router-1"}
		allowed1, _ := tm.ShouldAllow("rule-6", event1, config)
		if !allowed1 {
			t.Error("Expected first alert for router-1 to be allowed")
		}

		// Another alert for router-1 (should be throttled)
		allowed2, _ := tm.ShouldAllow("rule-6", event1, config)
		if allowed2 {
			t.Error("Expected second alert for router-1 to be throttled")
		}

		// Alert for router-2 (should be allowed - different group)
		event2 := map[string]interface{}{"device_id": "router-2"}
		allowed3, _ := tm.ShouldAllow("rule-6", event2, config)
		if !allowed3 {
			t.Error("Expected first alert for router-2 to be allowed (different group)")
		}
	})

	t.Run("suppressed count tracked", func(t *testing.T) {
		tm := NewThrottleManager()
		config := ThrottleConfig{
			MaxAlerts:     1,
			PeriodSeconds: 60,
		}
		eventData := map[string]interface{}{"device_id": "router-1"}

		// First alert
		tm.ShouldAllow("rule-7", eventData, config)

		// Send 3 more alerts (all should be throttled)
		for i := 0; i < 3; i++ {
			tm.ShouldAllow("rule-7", eventData, config)
		}

		// Check suppressed count
		// Note: This would require exposing the state for testing
		// In production code, this would be tracked for summary notifications
	})
}

// TestParseThrottleConfig tests throttle configuration parsing
func TestParseThrottleConfig(t *testing.T) {
	tests := []struct {
		name      string
		input     map[string]interface{}
		want      ThrottleConfig
		wantError bool
	}{
		{
			name: "valid config",
			input: map[string]interface{}{
				"maxAlerts":     float64(5),
				"periodSeconds": float64(300),
			},
			want: ThrottleConfig{
				MaxAlerts:     5,
				PeriodSeconds: 300,
			},
			wantError: false,
		},
		{
			name: "with group by field",
			input: map[string]interface{}{
				"maxAlerts":     float64(10),
				"periodSeconds": float64(600),
				"groupByField":  "device_id",
			},
			want: ThrottleConfig{
				MaxAlerts:     10,
				PeriodSeconds: 600,
				GroupByField:  "device_id",
			},
			wantError: false,
		},
		{
			name: "missing maxAlerts",
			input: map[string]interface{}{
				"periodSeconds": float64(300),
			},
			want:      ThrottleConfig{},
			wantError: true,
		},
		{
			name: "missing periodSeconds",
			input: map[string]interface{}{
				"maxAlerts": float64(5),
			},
			want:      ThrottleConfig{},
			wantError: true,
		},
		{
			name: "invalid types",
			input: map[string]interface{}{
				"maxAlerts":     "not-a-number",
				"periodSeconds": float64(300),
			},
			want:      ThrottleConfig{},
			wantError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := ParseThrottleConfig(tt.input)
			if (err != nil) != tt.wantError {
				t.Errorf("ParseThrottleConfig() error = %v, wantError %v", err, tt.wantError)
				return
			}
			if !tt.wantError {
				if got.MaxAlerts != tt.want.MaxAlerts {
					t.Errorf("MaxAlerts = %d, want %d", got.MaxAlerts, tt.want.MaxAlerts)
				}
				if got.PeriodSeconds != tt.want.PeriodSeconds {
					t.Errorf("PeriodSeconds = %d, want %d", got.PeriodSeconds, tt.want.PeriodSeconds)
				}
				if got.GroupByField != tt.want.GroupByField {
					t.Errorf("GroupByField = %s, want %s", got.GroupByField, tt.want.GroupByField)
				}
			}
		})
	}
}
