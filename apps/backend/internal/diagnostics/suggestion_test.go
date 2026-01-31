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
