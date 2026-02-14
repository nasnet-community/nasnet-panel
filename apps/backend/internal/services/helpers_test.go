package services

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestParseInt(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected int
		hasError bool
	}{
		{"valid positive", "42", 42, false},
		{"valid zero", "0", 0, false},
		{"empty string", "", 0, false},
		{"invalid format", "abc", 0, true},
		{"negative number", "-10", -10, false},
		{"with spaces", "  123  ", 0, true}, // trimming not done in parseInt
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := parseInt(tt.input)
			if tt.hasError {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
				assert.Equal(t, tt.expected, result)
			}
		})
	}
}

func TestParseIntList(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected []int
	}{
		{"empty string", "", []int{}},
		{"single value", "10", []int{10}},
		{"multiple values", "10,20,30", []int{10, 20, 30}},
		{"with spaces", "10, 20, 30", []int{10, 20, 30}},
		{"invalid values filtered", "10,abc,20", []int{10, 20}},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := parseIntList(tt.input)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestParseStringList(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected []string
	}{
		{"empty string", "", []string{}},
		{"single value", "ether1", []string{"ether1"}},
		{"multiple values", "ether1,ether2,ether3", []string{"ether1", "ether2", "ether3"}},
		{"with spaces", "ether1, ether2, ether3", []string{"ether1", "ether2", "ether3"}},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := parseStringList(tt.input)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestSplitComma(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected []string
	}{
		{"empty string", "", []string{}},
		{"single value", "value", []string{"value"}},
		{"multiple values", "a,b,c", []string{"a", "b", "c"}},
		{"with spaces", " a , b , c ", []string{"a", "b", "c"}},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := splitComma(tt.input)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestTrimSpace(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{"no spaces", "hello", "hello"},
		{"leading spaces", "  hello", "hello"},
		{"trailing spaces", "hello  ", "hello"},
		{"both sides", "  hello  ", "hello"},
		{"empty string", "", ""},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := trimSpace(tt.input)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestParseRouterOSTime(t *testing.T) {
	tests := []struct {
		name      string
		input     string
		expectErr bool
	}{
		{"never", "never", false},
		{"empty", "", false},
		{"unix timestamp", "1609459200", false},
		{"iso format", "2021-01-01T00:00:00Z", false},
		{"invalid", "invalid-time", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := parseRouterOSTime(tt.input)
			if tt.expectErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestParseRouterOSDuration(t *testing.T) {
	tests := []struct {
		name      string
		input     string
		expected  time.Duration
		expectErr bool
	}{
		{"empty", "", 0, false},
		{"weeks", "1w", 7 * 24 * time.Hour, false},
		{"days", "2d", 2 * 24 * time.Hour, false},
		{"hours", "3h", 3 * time.Hour, false},
		{"minutes", "30m", 30 * time.Minute, false},
		{"seconds", "45s", 45 * time.Second, false},
		{"combined", "1w2d3h4m5s",
			1*7*24*time.Hour + 2*24*time.Hour + 3*time.Hour + 4*time.Minute + 5*time.Second, false},
		{"milliseconds", "500ms", 500 * time.Millisecond, false},
		{"invalid", "invalid", 0, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := parseRouterOSDuration(tt.input)
			if tt.expectErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
				assert.Equal(t, tt.expected, result)
			}
		})
	}
}
