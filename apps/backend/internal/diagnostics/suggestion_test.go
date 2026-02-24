package diagnostics

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestNewSuggestionMapper(t *testing.T) {
	mapper := NewSuggestionMapper("")
	assert.NotNil(t, mapper)
	assert.Equal(t, "https://docs.nasnetconnect.io", mapper.docsBaseURL)

	mapper = NewSuggestionMapper("https://custom.docs.io")
	assert.Equal(t, "https://custom.docs.io", mapper.docsBaseURL)
}

func TestSuggestionMapper_GenerateSuggestions_NetworkUnreachable(t *testing.T) {
	mapper := NewSuggestionMapper("")

	report := &DiagnosticReport{
		NetworkReachable: false,
		PortStatus:       []PortStatus{},
	}

	suggestions := mapper.GenerateSuggestions(report)

	assert.Len(t, suggestions, 1)
	assert.Equal(t, SuggestionSeverityCritical, suggestions[0].Severity)
	assert.Contains(t, suggestions[0].Title, "unreachable")
}

func TestSuggestionMapper_GenerateSuggestions_AllPortsClosed(t *testing.T) {
	mapper := NewSuggestionMapper("")

	closedErr := "connection refused"
	report := &DiagnosticReport{
		NetworkReachable: true,
		PortStatus: []PortStatus{
			{Port: 8728, Service: "API", Open: false, Error: &closedErr},
			{Port: 8729, Service: "API-SSL", Open: false, Error: &closedErr},
			{Port: 22, Service: "SSH", Open: false, Error: &closedErr},
		},
	}

	suggestions := mapper.GenerateSuggestions(report)

	assert.NotEmpty(t, suggestions)
	// Should include "all ports closed" suggestion
	hasCritical := false
	for _, s := range suggestions {
		if s.Severity == SuggestionSeverityCritical {
			hasCritical = true
			break
		}
	}
	assert.True(t, hasCritical)
}

func TestSuggestionMapper_GenerateSuggestions_APIPortClosed(t *testing.T) {
	mapper := NewSuggestionMapper("")

	closedErr := "connection refused"
	report := &DiagnosticReport{
		NetworkReachable: true,
		PortStatus: []PortStatus{
			{Port: 8728, Service: "API", Open: false, Error: &closedErr},
			{Port: 8729, Service: "API-SSL", Open: false, Error: &closedErr},
			{Port: 22, Service: "SSH", Open: true},
		},
	}

	suggestions := mapper.GenerateSuggestions(report)

	// Should suggest enabling API
	hasAPISuggestion := false
	for _, s := range suggestions {
		if s.Title == "API port (8728) is closed" {
			hasAPISuggestion = true
			assert.Equal(t, SuggestionSeverityWarning, s.Severity)
			break
		}
	}
	assert.True(t, hasAPISuggestion)
}

func TestSuggestionMapper_GenerateSuggestions_TLSError(t *testing.T) {
	mapper := NewSuggestionMapper("")

	tlsErr := "certificate has expired"
	report := &DiagnosticReport{
		NetworkReachable: true,
		PortStatus: []PortStatus{
			{Port: 8728, Service: "API", Open: true},
		},
		TLSStatus: &TLSStatus{
			Valid: false,
			Error: &tlsErr,
		},
	}

	suggestions := mapper.GenerateSuggestions(report)

	hasTLSSuggestion := false
	for _, s := range suggestions {
		if s.Title == "TLS certificate issue" {
			hasTLSSuggestion = true
			assert.Equal(t, SuggestionSeverityWarning, s.Severity)
			assert.Contains(t, s.Description, "expired")
			break
		}
	}
	assert.True(t, hasTLSSuggestion)
}

func TestSuggestionMapper_GenerateSuggestions_AuthFailed(t *testing.T) {
	mapper := NewSuggestionMapper("")

	report := &DiagnosticReport{
		NetworkReachable: true,
		PortStatus: []PortStatus{
			{Port: 8728, Service: "API", Open: true},
		},
		AuthStatus: AuthStatus{
			Tested:  true,
			Success: false,
		},
	}

	suggestions := mapper.GenerateSuggestions(report)

	hasAuthSuggestion := false
	for _, s := range suggestions {
		if s.Title == "Authentication failed" {
			hasAuthSuggestion = true
			assert.Equal(t, SuggestionSeverityError, s.Severity)
			break
		}
	}
	assert.True(t, hasAuthSuggestion)
}

func TestSuggestionMapper_GenerateSuggestions_AllHealthy(t *testing.T) {
	mapper := NewSuggestionMapper("")

	report := &DiagnosticReport{
		NetworkReachable: true,
		PortStatus: []PortStatus{
			{Port: 8728, Service: "API", Open: true},
			{Port: 22, Service: "SSH", Open: true},
		},
		TLSStatus: &TLSStatus{
			Valid: true,
		},
		AuthStatus: AuthStatus{
			Tested:  true,
			Success: true,
		},
	}

	suggestions := mapper.GenerateSuggestions(report)

	// Should have one "healthy" suggestion
	assert.Len(t, suggestions, 1)
	assert.Equal(t, SuggestionSeverityInfo, suggestions[0].Severity)
	assert.Contains(t, suggestions[0].Title, "healthy")
}

func TestSuggestionMapper_MapErrorToSuggestion(t *testing.T) {
	mapper := NewSuggestionMapper("")

	tests := []struct {
		category     ErrorCategory
		detail       string
		wantSeverity SuggestionSeverity
		wantTitle    string
	}{
		{
			category:     ErrorCategoryTimeout,
			detail:       "request timed out",
			wantSeverity: SuggestionSeverityError,
			wantTitle:    "Connection timeout",
		},
		{
			category:     ErrorCategoryRefused,
			detail:       "port 8728",
			wantSeverity: SuggestionSeverityError,
			wantTitle:    "Connection refused",
		},
		{
			category:     ErrorCategoryAuthFailed,
			detail:       "wrong password",
			wantSeverity: SuggestionSeverityError,
			wantTitle:    "Authentication failed",
		},
		{
			category:     ErrorCategoryProtocolError,
			detail:       "unexpected response",
			wantSeverity: SuggestionSeverityError,
			wantTitle:    "Protocol error",
		},
		{
			category:     ErrorCategoryNetworkError,
			detail:       "DNS failed",
			wantSeverity: SuggestionSeverityError,
			wantTitle:    "Network error",
		},
		{
			category:     ErrorCategoryTLSError,
			detail:       "cert expired",
			wantSeverity: SuggestionSeverityWarning,
			wantTitle:    "TLS/SSL error",
		},
		{
			category:     ErrorCategory("UNKNOWN"),
			detail:       "something happened",
			wantSeverity: SuggestionSeverityError,
			wantTitle:    "Connection error",
		},
	}

	for _, tt := range tests {
		t.Run(string(tt.category), func(t *testing.T) {
			suggestion := mapper.MapErrorToSuggestion(tt.category, tt.detail)
			assert.Equal(t, tt.wantSeverity, suggestion.Severity)
			assert.Equal(t, tt.wantTitle, suggestion.Title)
			assert.NotEmpty(t, suggestion.Description)
			assert.NotEmpty(t, suggestion.Action)
			assert.NotNil(t, suggestion.DocsURL)
		})
	}
}

func TestHasOpenPort(t *testing.T) {
	ports := []PortStatus{
		{Port: 8728, Service: "API", Open: true},
		{Port: 22, Service: "SSH", Open: false},
		{Port: 8729, Service: "API-SSL", Open: true},
	}

	assert.True(t, hasOpenPort(ports, "API"))
	assert.True(t, hasOpenPort(ports, "API-SSL"))
	assert.False(t, hasOpenPort(ports, "SSH"))
	assert.False(t, hasOpenPort(ports, "Telnet"))
}

func TestSuggestionMapper_DocsURLs(t *testing.T) {
	mapper := NewSuggestionMapper("https://docs.example.com")

	// Test that all suggestion methods include docs URLs
	report := &DiagnosticReport{
		NetworkReachable: false,
	}

	suggestions := mapper.GenerateSuggestions(report)
	assert.Len(t, suggestions, 1)
	assert.NotNil(t, suggestions[0].DocsURL)
	assert.Contains(t, *suggestions[0].DocsURL, "https://docs.example.com")
}

func TestSuggestionMapper_GenerateSuggestions_SSHPortClosed(t *testing.T) {
	mapper := NewSuggestionMapper("")

	closedErr := "connection refused"
	report := &DiagnosticReport{
		NetworkReachable: true,
		PortStatus: []PortStatus{
			{Port: 8728, Service: "API", Open: true},
			{Port: 22, Service: "SSH", Open: false, Error: &closedErr},
		},
	}

	suggestions := mapper.GenerateSuggestions(report)

	// Should suggest enabling SSH (info level)
	hasSSHSuggestion := false
	for _, s := range suggestions {
		if s.Title == "SSH port (22) is closed" {
			hasSSHSuggestion = true
			assert.Equal(t, SuggestionSeverityInfo, s.Severity)
			assert.Contains(t, s.Description, "fallback")
			assert.NotEmpty(t, s.Action)
			assert.NotNil(t, s.DocsURL)
			break
		}
	}
	assert.True(t, hasSSHSuggestion)
}

func TestSuggestionMapper_GenerateSuggestions_MultipleIssues(t *testing.T) {
	mapper := NewSuggestionMapper("")

	closedErr := "connection refused"
	tlsErr := "certificate expired"
	report := &DiagnosticReport{
		NetworkReachable: true,
		PortStatus: []PortStatus{
			{Port: 8728, Service: "API", Open: false, Error: &closedErr},
			{Port: 8729, Service: "API-SSL", Open: false, Error: &closedErr},
			{Port: 22, Service: "SSH", Open: true},
		},
		TLSStatus: &TLSStatus{
			Valid: false,
			Error: &tlsErr,
		},
		AuthStatus: AuthStatus{
			Tested:  false,
			Success: false,
		},
	}

	suggestions := mapper.GenerateSuggestions(report)

	// Should have multiple suggestions
	assert.True(t, len(suggestions) >= 2, "should have at least 2 suggestions")

	// Verify severity levels are appropriate
	hasCritical := false
	hasWarning := false
	for _, s := range suggestions {
		if s.Severity == SuggestionSeverityCritical {
			hasCritical = true
		}
		if s.Severity == SuggestionSeverityWarning {
			hasWarning = true
		}
		// All suggestions should have action and docs URL
		assert.NotEmpty(t, s.Title)
		assert.NotEmpty(t, s.Description)
		assert.NotEmpty(t, s.Action)
		assert.NotNil(t, s.DocsURL)
	}
	assert.True(t, hasCritical || hasWarning, "should have at least one critical or warning suggestion")
}

func TestSuggestionMapper_MapErrorToSuggestion_AllCategoriesHaveDocs(t *testing.T) {
	mapper := NewSuggestionMapper("https://docs.example.com")

	categories := []ErrorCategory{
		ErrorCategoryTimeout,
		ErrorCategoryRefused,
		ErrorCategoryAuthFailed,
		ErrorCategoryProtocolError,
		ErrorCategoryNetworkError,
		ErrorCategoryTLSError,
	}

	for _, category := range categories {
		suggestion := mapper.MapErrorToSuggestion(category, "test detail")
		assert.NotNil(t, suggestion.DocsURL, "category %s should have docs URL", category)
		assert.NotEmpty(t, suggestion.Title, "category %s should have title", category)
		assert.NotEmpty(t, suggestion.Action, "category %s should have action", category)
	}
}

func TestContainsCI(t *testing.T) {
	tests := []struct {
		s      string
		substr string
		want   bool
	}{
		{"CONNECTION TIMEOUT", "timeout", true},
		{"connection refused", "REFUSED", true},
		{"Authentication Failed", "auth", true},
		{"DEADLINE EXCEEDED", "deadline", true},
		{"no route to host", "route", true},
		{"something else", "xyz", false},
		{"", "test", false},
		{"test", "", false},
	}

	for _, tt := range tests {
		result := containsCI(tt.s, tt.substr)
		assert.Equal(t, tt.want, result, "containsCI(%q, %q) = %v, want %v", tt.s, tt.substr, result, tt.want)
	}
}

func TestStringContains(t *testing.T) {
	tests := []struct {
		s      string
		substr string
		want   bool
	}{
		{"hello world", "world", true},
		{"hello world", "lo wo", true},
		{"hello world", "xyz", false},
		{"test", "test", true},
		{"", "test", false},
		{"test", "", false},
	}

	for _, tt := range tests {
		result := stringContains(tt.s, tt.substr)
		assert.Equal(t, tt.want, result, "stringContains(%q, %q) = %v, want %v", tt.s, tt.substr, result, tt.want)
	}
}

func TestToLower(t *testing.T) {
	tests := []struct {
		s    string
		want string
	}{
		{"HELLO", "hello"},
		{"Hello World", "hello world"},
		{"123!@#", "123!@#"},
		{"", ""},
		{"lowercase", "lowercase"},
	}

	for _, tt := range tests {
		result := toLower(tt.s)
		assert.Equal(t, tt.want, result, "toLower(%q) = %q, want %q", tt.s, result, tt.want)
	}
}
