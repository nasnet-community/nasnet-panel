// Package alerts implements alert engine testing
package alerts

import (
	"testing"
)

// TestEvaluateConditions tests condition evaluation logic
// Per Task 7.1: Unit tests for condition evaluation logic (100% coverage)
func TestEvaluateConditions(t *testing.T) {
	tests := []struct {
		name       string
		conditions []Condition
		eventData  map[string]interface{}
		want       bool
	}{
		{
			name: "single EQUALS condition - match",
			conditions: []Condition{
				{Field: "status", Operator: "EQUALS", Value: "offline"},
			},
			eventData: map[string]interface{}{
				"status": "offline",
			},
			want: true,
		},
		{
			name: "single EQUALS condition - no match",
			conditions: []Condition{
				{Field: "status", Operator: "EQUALS", Value: "offline"},
			},
			eventData: map[string]interface{}{
				"status": "online",
			},
			want: false,
		},
		{
			name: "NOT_EQUALS operator",
			conditions: []Condition{
				{Field: "status", Operator: "NOT_EQUALS", Value: "online"},
			},
			eventData: map[string]interface{}{
				"status": "offline",
			},
			want: true,
		},
		{
			name: "GREATER_THAN numeric condition",
			conditions: []Condition{
				{Field: "cpu", Operator: "GREATER_THAN", Value: "80"},
			},
			eventData: map[string]interface{}{
				"cpu": 90.0,
			},
			want: true,
		},
		{
			name: "LESS_THAN numeric condition",
			conditions: []Condition{
				{Field: "memory", Operator: "LESS_THAN", Value: "50"},
			},
			eventData: map[string]interface{}{
				"memory": 30.0,
			},
			want: true,
		},
		{
			name: "CONTAINS string operator",
			conditions: []Condition{
				{Field: "message", Operator: "CONTAINS", Value: "error"},
			},
			eventData: map[string]interface{}{
				"message": "Connection error occurred",
			},
			want: true,
		},
		{
			name: "REGEX operator - match",
			conditions: []Condition{
				{Field: "interface", Operator: "REGEX", Value: "^eth[0-9]+$"},
			},
			eventData: map[string]interface{}{
				"interface": "eth0",
			},
			want: true,
		},
		{
			name: "REGEX operator - no match",
			conditions: []Condition{
				{Field: "interface", Operator: "REGEX", Value: "^eth[0-9]+$"},
			},
			eventData: map[string]interface{}{
				"interface": "wlan0",
			},
			want: false,
		},
		{
			name: "multiple conditions - all match (AND logic)",
			conditions: []Condition{
				{Field: "status", Operator: "EQUALS", Value: "offline"},
				{Field: "cpu", Operator: "GREATER_THAN", Value: "80"},
			},
			eventData: map[string]interface{}{
				"status": "offline",
				"cpu":    90.0,
			},
			want: true,
		},
		{
			name: "multiple conditions - one fails",
			conditions: []Condition{
				{Field: "status", Operator: "EQUALS", Value: "offline"},
				{Field: "cpu", Operator: "GREATER_THAN", Value: "80"},
			},
			eventData: map[string]interface{}{
				"status": "offline",
				"cpu":    70.0, // Fails GREATER_THAN 80
			},
			want: false,
		},
		{
			name: "nested field with dot notation",
			conditions: []Condition{
				{Field: "device.name", Operator: "EQUALS", Value: "router-1"},
			},
			eventData: map[string]interface{}{
				"device": map[string]interface{}{
					"name": "router-1",
				},
			},
			want: true,
		},
		{
			name: "missing field",
			conditions: []Condition{
				{Field: "nonexistent", Operator: "EQUALS", Value: "value"},
			},
			eventData: map[string]interface{}{
				"status": "online",
			},
			want: false,
		},
		{
			name: "empty conditions array",
			conditions: []Condition{},
			eventData: map[string]interface{}{
				"status": "online",
			},
			want: true, // No conditions = always match
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := EvaluateConditions(tt.conditions, tt.eventData)
			if got != tt.want {
				t.Errorf("EvaluateConditions() = %v, want %v", got, tt.want)
			}
		})
	}
}

// TestParseConditions tests condition parsing from JSON
func TestParseConditions(t *testing.T) {
	tests := []struct {
		name      string
		input     []map[string]interface{}
		wantLen   int
		wantError bool
	}{
		{
			name: "valid conditions array",
			input: []map[string]interface{}{
				{"field": "status", "operator": "EQUALS", "value": "offline"},
				{"field": "cpu", "operator": "GREATER_THAN", "value": "80"},
			},
			wantLen:   2,
			wantError: false,
		},
		{
			name:      "empty array",
			input:     []map[string]interface{}{},
			wantLen:   0,
			wantError: false,
		},
		{
			name:      "nil input",
			input:     nil,
			wantLen:   0,
			wantError: false,
		},
		{
			name: "invalid operator",
			input: []map[string]interface{}{
				{"field": "status", "operator": "INVALID_OP", "value": "test"},
			},
			wantLen:   1, // Still parses, validation happens at evaluation
			wantError: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := ParseConditions(tt.input)
			if (err != nil) != tt.wantError {
				t.Errorf("ParseConditions() error = %v, wantError %v", err, tt.wantError)
				return
			}
			if len(got) != tt.wantLen {
				t.Errorf("ParseConditions() returned %d conditions, want %d", len(got), tt.wantLen)
			}
		})
	}
}

// TestGetFieldValue tests nested field extraction
func TestGetFieldValue(t *testing.T) {
	tests := []struct {
		name      string
		data      map[string]interface{}
		field     string
		wantValue interface{}
		wantFound bool
	}{
		{
			name:      "simple field",
			data:      map[string]interface{}{"status": "online"},
			field:     "status",
			wantValue: "online",
			wantFound: true,
		},
		{
			name: "nested field with dot notation",
			data: map[string]interface{}{
				"device": map[string]interface{}{
					"name": "router-1",
				},
			},
			field:     "device.name",
			wantValue: "router-1",
			wantFound: true,
		},
		{
			name: "deeply nested field",
			data: map[string]interface{}{
				"interface": map[string]interface{}{
					"stats": map[string]interface{}{
						"rx_bytes": 1024,
					},
				},
			},
			field:     "interface.stats.rx_bytes",
			wantValue: 1024,
			wantFound: true,
		},
		{
			name:      "nonexistent field",
			data:      map[string]interface{}{"status": "online"},
			field:     "nonexistent",
			wantValue: nil,
			wantFound: false,
		},
		{
			name: "partial nested path exists",
			data: map[string]interface{}{
				"device": map[string]interface{}{
					"name": "router-1",
				},
			},
			field:     "device.nonexistent",
			wantValue: nil,
			wantFound: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			gotValue, gotFound := getFieldValue(tt.field, tt.data)
			if gotFound != tt.wantFound {
				t.Errorf("getFieldValue() found = %v, want %v", gotFound, tt.wantFound)
			}
			if gotFound && gotValue != tt.wantValue {
				t.Errorf("getFieldValue() value = %v, want %v", gotValue, tt.wantValue)
			}
		})
	}
}
