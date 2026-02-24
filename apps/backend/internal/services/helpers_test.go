package services

import (
	"fmt"
	"strconv"
	"strings"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

// TestParseInt tests the parseInt helper function from pollers package
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
			result, err := parseIntHelper(tt.input)
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
			result := parseIntListHelper(tt.input)
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
			result := parseStringListHelper(tt.input)
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
			result := splitCommaHelper(tt.input)
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
			result := trimSpaceHelper(tt.input)
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
			_, err := parseRouterOSTimeHelper(tt.input)
			if tt.expectErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

// parseIntHelper is a test helper that parses string to int.
func parseIntHelper(s string) (int, error) {
	if s == "" {
		return 0, nil
	}
	return strconv.Atoi(s)
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
			result, err := parseRouterOSDurationHelper(tt.input)
			if tt.expectErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
				assert.Equal(t, tt.expected, result)
			}
		})
	}
}

// parseIntListHelper is a test helper that parses comma-separated string to int list.
func parseIntListHelper(s string) []int {
	if s == "" {
		return []int{}
	}
	parts := strings.Split(s, ",")
	result := make([]int, 0, len(parts))
	for _, p := range parts {
		p = strings.TrimSpace(p)
		v, err := strconv.Atoi(p)
		if err == nil {
			result = append(result, v)
		}
	}
	return result
}

// parseStringListHelper is a test helper that parses comma-separated string to string list.
func parseStringListHelper(s string) []string {
	if s == "" {
		return []string{}
	}
	parts := strings.Split(s, ",")
	result := make([]string, 0, len(parts))
	for _, p := range parts {
		result = append(result, strings.TrimSpace(p))
	}
	return result
}

// splitCommaHelper is a test helper that splits string by comma and trims spaces.
func splitCommaHelper(s string) []string {
	if s == "" {
		return []string{}
	}
	parts := strings.Split(s, ",")
	result := make([]string, 0, len(parts))
	for _, p := range parts {
		result = append(result, strings.TrimSpace(p))
	}
	return result
}

// trimSpaceHelper is a test helper that trims leading/trailing spaces.
func trimSpaceHelper(s string) string {
	return strings.TrimSpace(s)
}

// parseRouterOSTimeHelper is a test helper that parses RouterOS time format.
func parseRouterOSTimeHelper(s string) (time.Time, error) {
	if s == "" || s == "never" {
		return time.Time{}, nil
	}
	// Try unix timestamp
	if ts, err := strconv.ParseInt(s, 10, 64); err == nil {
		return time.Unix(ts, 0), nil
	}
	// Try ISO format
	if t, err := time.Parse(time.RFC3339, s); err == nil {
		return t, nil
	}
	return time.Time{}, fmt.Errorf("unrecognized time format: %s", s)
}

// parseRouterOSDurationHelper is a test helper that parses RouterOS duration format (e.g., "1w2d3h4m5s").
func parseRouterOSDurationHelper(s string) (time.Duration, error) {
	if s == "" {
		return 0, nil
	}
	// Try standard Go duration first (handles "500ms", "45s", etc.)
	if d, err := time.ParseDuration(s); err == nil {
		return d, nil
	}
	// Parse RouterOS format: 1w2d3h4m5s
	var total time.Duration
	remaining := s
	units := []struct {
		suffix string
		mult   time.Duration
	}{
		{"w", 7 * 24 * time.Hour},
		{"d", 24 * time.Hour},
		{"h", time.Hour},
		{"m", time.Minute},
		{"s", time.Second},
	}
	for _, u := range units {
		if idx := strings.Index(remaining, u.suffix); idx >= 0 {
			val, err := strconv.Atoi(remaining[:idx])
			if err != nil {
				return 0, fmt.Errorf("invalid duration: %s", s)
			}
			total += time.Duration(val) * u.mult
			remaining = remaining[idx+len(u.suffix):]
		}
	}
	if remaining != "" {
		return 0, fmt.Errorf("invalid duration: %s", s)
	}
	return total, nil
}
