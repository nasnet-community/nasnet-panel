package diagnostics

import (
	"encoding/json"
	"strings"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNewReportFormatter(t *testing.T) {
	formatter := NewReportFormatter()
	assert.NotNil(t, formatter)
	assert.NotEmpty(t, formatter.sensitivePatterns)
}

func TestReportFormatter_FormatAsText(t *testing.T) {
	formatter := NewReportFormatter()

	responseTime := 50
	tlsIssuer := "CN=Test Issuer"
	tlsSubject := "CN=router.local"
	tlsExpiry := time.Now().Add(30 * 24 * time.Hour)
	docsURL := "https://docs.example.com/troubleshooting"

	report := &DiagnosticReport{
		RouterID:         "router-12345678",
		Timestamp:        time.Now(),
		NetworkReachable: true,
		PortStatus: []PortStatus{
			{Port: 8728, Service: "API", Open: true, ResponseTimeMs: &responseTime},
			{Port: 22, Service: "SSH", Open: false, Error: ptrString("connection refused")},
		},
		TLSStatus: &TLSStatus{
			Valid:     true,
			Issuer:    &tlsIssuer,
			Subject:   &tlsSubject,
			ExpiresAt: &tlsExpiry,
		},
		AuthStatus: AuthStatus{
			Tested:  true,
			Success: true,
		},
		Suggestions: []DiagnosticSuggestion{
			{
				Severity:    SuggestionSeverityInfo,
				Title:       "Connection looks healthy",
				Description: "All checks passed.",
				Action:      "No action required.",
				DocsURL:     &docsURL,
			},
		},
	}

	systemInfo := map[string]string{
		"platform": "linux",
		"version":  "1.0.0",
	}

	text := formatter.FormatAsText(report, systemInfo)

	// Verify structure
	assert.Contains(t, text, "NasNetConnect Diagnostic Report")
	assert.Contains(t, text, "Router ID:")
	assert.Contains(t, text, "Network Reachability")
	assert.Contains(t, text, "Port Status")
	assert.Contains(t, text, "TLS Certificate")
	assert.Contains(t, text, "Authentication")
	assert.Contains(t, text, "Recommendations")

	// Verify content
	assert.Contains(t, text, "✓ Router is reachable")
	assert.Contains(t, text, "8728")
	assert.Contains(t, text, "OPEN")
	assert.Contains(t, text, "SSH")
	assert.Contains(t, text, "CLOSED")

	// Verify system info
	assert.Contains(t, text, "System Information")
	assert.Contains(t, text, "platform")

	// Router ID should be partially redacted
	assert.Contains(t, text, "rout****5678")
}

func TestReportFormatter_FormatAsText_NetworkUnreachable(t *testing.T) {
	formatter := NewReportFormatter()

	report := &DiagnosticReport{
		RouterID:         "router-1",
		Timestamp:        time.Now(),
		NetworkReachable: false,
		PortStatus:       []PortStatus{},
	}

	text := formatter.FormatAsText(report, nil)

	assert.Contains(t, text, "✗ Router is NOT reachable")
}

func TestReportFormatter_FormatAsText_AuthNotTested(t *testing.T) {
	formatter := NewReportFormatter()

	report := &DiagnosticReport{
		RouterID:         "router-1",
		Timestamp:        time.Now(),
		NetworkReachable: true,
		PortStatus:       []PortStatus{},
		AuthStatus: AuthStatus{
			Tested: false,
		},
	}

	text := formatter.FormatAsText(report, nil)

	assert.Contains(t, text, "○ Authentication was not tested")
}

func TestReportFormatter_FormatAsText_AuthFailed(t *testing.T) {
	formatter := NewReportFormatter()

	// Use a non-sensitive error message that won't be redacted
	authErr := "invalid user account"
	authCode := "A500"
	report := &DiagnosticReport{
		RouterID:         "router-1",
		Timestamp:        time.Now(),
		NetworkReachable: true,
		PortStatus:       []PortStatus{},
		AuthStatus: AuthStatus{
			Tested:    true,
			Success:   false,
			Error:     &authErr,
			ErrorCode: &authCode,
		},
	}

	text := formatter.FormatAsText(report, nil)

	assert.Contains(t, text, "✗ Authentication FAILED")
	assert.Contains(t, text, "invalid user account")
	assert.Contains(t, text, "A500")
}

func TestReportFormatter_FormatAsJSON(t *testing.T) {
	formatter := NewReportFormatter()

	responseTime := 50
	report := &DiagnosticReport{
		RouterID:         "router-12345678",
		Timestamp:        time.Now(),
		NetworkReachable: true,
		PortStatus: []PortStatus{
			{Port: 8728, Service: "API", Open: true, ResponseTimeMs: &responseTime},
		},
		AuthStatus: AuthStatus{
			Tested:  true,
			Success: true,
		},
		Suggestions: []DiagnosticSuggestion{},
	}

	systemInfo := map[string]string{
		"platform": "linux",
	}

	jsonStr, err := formatter.FormatAsJSON(report, systemInfo)
	require.NoError(t, err)

	// Verify it's valid JSON
	var parsed map[string]interface{}
	err = json.Unmarshal([]byte(jsonStr), &parsed)
	require.NoError(t, err)

	// Verify structure
	assert.Contains(t, parsed, "timestamp")
	assert.Contains(t, parsed, "routerId")
	assert.Contains(t, parsed, "networkReachable")
	assert.Contains(t, parsed, "portStatus")
	assert.Contains(t, parsed, "authStatus")
	assert.Contains(t, parsed, "version")

	// Router ID should be partially redacted
	routerID := parsed["routerId"].(string)
	assert.Contains(t, routerID, "****")
}

func TestReportFormatter_Redact(t *testing.T) {
	formatter := NewReportFormatter()

	tests := []struct {
		input    string
		expected string
	}{
		{"router-12345678", "rout****5678"},
		{"short", "short"},
		{"exactly8", "exactly8"},
		{"123456789", "1234****6789"},
	}

	for _, tt := range tests {
		result := formatter.redact(tt.input)
		assert.Equal(t, tt.expected, result, "redact(%q)", tt.input)
	}
}

func TestReportFormatter_RedactValue(t *testing.T) {
	formatter := NewReportFormatter()

	tests := []struct {
		key      string
		value    string
		expected string
	}{
		{"password", "secret123", "[REDACTED]"},
		{"api_key", "abc123", "[REDACTED]"},
		{"token", "xyz", "[REDACTED]"},
		{"credential", "user:pass", "[REDACTED]"},
		{"private_key", "-----BEGIN", "[REDACTED]"},
		{"username", "admin", "admin"},         // Not sensitive
		{"host", "192.168.1.1", "192.168.1.1"}, // Not sensitive
	}

	for _, tt := range tests {
		result := formatter.redactValue(tt.key, tt.value)
		assert.Equal(t, tt.expected, result, "redactValue(%q, %q)", tt.key, tt.value)
	}
}

func TestReportFormatter_RedactMap(t *testing.T) {
	formatter := NewReportFormatter()

	input := map[string]string{
		"host":     "192.168.1.1",
		"password": "secret123",
		"api_key":  "abc123",
	}

	result := formatter.redactMap(input)

	assert.Equal(t, "192.168.1.1", result["host"])
	assert.Equal(t, "[REDACTED]", result["password"])
	assert.Equal(t, "[REDACTED]", result["api_key"])
}

func TestReportFormatter_RedactAuthStatus(t *testing.T) {
	formatter := NewReportFormatter()

	// Error with sensitive content
	errWithCreds := "authentication failed: invalid password for user"
	status := AuthStatus{
		Tested:  true,
		Success: false,
		Error:   &errWithCreds,
	}

	result := formatter.redactAuthStatus(status)

	assert.NotNil(t, result.Error)
	assert.Equal(t, "[error details redacted]", *result.Error)

	// Error without sensitive content
	errNormal := "connection timeout"
	status2 := AuthStatus{
		Tested:  true,
		Success: false,
		Error:   &errNormal,
	}

	result2 := formatter.redactAuthStatus(status2)
	assert.Equal(t, "connection timeout", *result2.Error)
}

func TestGetSeverityIcon(t *testing.T) {
	tests := []struct {
		severity SuggestionSeverity
		expected string
	}{
		{SuggestionSeverityInfo, "ℹ"},
		{SuggestionSeverityWarning, "⚠"},
		{SuggestionSeverityError, "✗"},
		{SuggestionSeverityCritical, "‼"},
		{SuggestionSeverity("UNKNOWN"), "•"},
	}

	for _, tt := range tests {
		result := getSeverityIcon(tt.severity)
		assert.Equal(t, tt.expected, result)
	}
}

func TestPadRight(t *testing.T) {
	tests := []struct {
		s        string
		width    int
		expected string
	}{
		{"test", 8, "test    "},
		{"long string", 5, "long string"},
		{"exact", 5, "exact"},
		{"", 3, "   "},
	}

	for _, tt := range tests {
		result := padRight(tt.s, tt.width)
		assert.Equal(t, tt.expected, result)
	}
}

func TestWrapText(t *testing.T) {
	tests := []struct {
		text     string
		width    int
		prefix   string
		expected string
	}{
		{
			text:     "Short text",
			width:    20,
			prefix:   "  ",
			expected: "Short text",
		},
		{
			text:     "This is a longer text that needs wrapping",
			width:    20,
			prefix:   "  ",
			expected: "This is a longer\n  text that needs\n  wrapping",
		},
	}

	for _, tt := range tests {
		result := wrapText(tt.text, tt.width, tt.prefix)
		assert.Equal(t, tt.expected, result)
	}
}

func TestReportFormatter_NoSensitiveDataLeak(t *testing.T) {
	// This is a security test to ensure sensitive data is never leaked
	formatter := NewReportFormatter()

	sensitiveData := []string{
		"password123",
		"api_key_secret",
		"private_key_value",
		"auth_token_value",
	}

	authErr := "authentication failed with password: password123"
	report := &DiagnosticReport{
		RouterID:         "router-1",
		Timestamp:        time.Now(),
		NetworkReachable: true,
		PortStatus:       []PortStatus{},
		AuthStatus: AuthStatus{
			Tested:  true,
			Success: false,
			Error:   &authErr,
		},
	}

	systemInfo := map[string]string{
		"host":     "192.168.1.1",
		"password": "password123",
		"api_key":  "api_key_secret",
		"token":    "auth_token_value",
	}

	// Test text format
	text := formatter.FormatAsText(report, systemInfo)
	for _, sensitive := range sensitiveData {
		assert.NotContains(t, text, sensitive, "sensitive data leaked in text: %s", sensitive)
	}

	// Test JSON format
	jsonStr, err := formatter.FormatAsJSON(report, systemInfo)
	require.NoError(t, err)
	for _, sensitive := range sensitiveData {
		assert.NotContains(t, jsonStr, sensitive, "sensitive data leaked in JSON: %s", sensitive)
	}
}

func TestReportFormatter_JSONValidity(t *testing.T) {
	formatter := NewReportFormatter()

	// Create a complex report with all fields
	responseTime := 50
	tlsErr := "certificate expired"
	authErr := "invalid credentials"
	docsURL := "https://docs.example.com"

	report := &DiagnosticReport{
		RouterID:         "router-12345678-90ab-cdef",
		Timestamp:        time.Now(),
		NetworkReachable: true,
		PortStatus: []PortStatus{
			{Port: 8728, Service: "API", Open: true, ResponseTimeMs: &responseTime},
			{Port: 22, Service: "SSH", Open: false, Error: ptrString("refused")},
		},
		TLSStatus: &TLSStatus{
			Valid: false,
			Error: &tlsErr,
		},
		AuthStatus: AuthStatus{
			Tested:    true,
			Success:   false,
			Error:     &authErr,
			ErrorCode: ptrString("A500"),
		},
		Suggestions: []DiagnosticSuggestion{
			{
				Severity:    SuggestionSeverityCritical,
				Title:       "Test Suggestion",
				Description: "Description with \"quotes\" and special chars: <>&",
				Action:      "Do something\nwith newlines",
				DocsURL:     &docsURL,
			},
		},
	}

	jsonStr, err := formatter.FormatAsJSON(report, nil)
	require.NoError(t, err)

	// Verify it's valid JSON
	var parsed map[string]interface{}
	err = json.Unmarshal([]byte(jsonStr), &parsed)
	require.NoError(t, err)

	// Verify special characters are properly escaped
	assert.True(t, json.Valid([]byte(jsonStr)))

	// Verify we can unmarshal it back to a struct
	var exportReport struct {
		RouterID    string `json:"routerId"`
		Suggestions []struct {
			Title       string `json:"title"`
			Description string `json:"description"`
		} `json:"suggestions"`
	}
	err = json.Unmarshal([]byte(jsonStr), &exportReport)
	require.NoError(t, err)
	assert.Equal(t, "Test Suggestion", exportReport.Suggestions[0].Title)

	// Verify special chars preserved
	assert.True(t, strings.Contains(exportReport.Suggestions[0].Description, "\"quotes\""))
}
