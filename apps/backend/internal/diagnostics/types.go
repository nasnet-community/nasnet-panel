// Package diagnostics provides connection diagnostic tools for router troubleshooting.
package diagnostics

import (
	"context"
	"time"
)

// Protocol represents a router communication protocol.
type Protocol string

const (
	ProtocolREST   Protocol = "REST"
	ProtocolAPI    Protocol = "API"
	ProtocolAPISSL Protocol = "API_SSL"
	ProtocolSSH    Protocol = "SSH"
	ProtocolTelnet Protocol = "TELNET"
)

// ErrorCategory classifies connection errors for user-friendly suggestions.
type ErrorCategory string

const (
	ErrorCategoryTimeout       ErrorCategory = "TIMEOUT"
	ErrorCategoryRefused       ErrorCategory = "REFUSED"
	ErrorCategoryAuthFailed    ErrorCategory = "AUTH_FAILED"
	ErrorCategoryProtocolError ErrorCategory = "PROTOCOL_ERROR"
	ErrorCategoryNetworkError  ErrorCategory = "NETWORK_ERROR"
	ErrorCategoryTLSError      ErrorCategory = "TLS_ERROR"
)

// CircuitBreakerState represents the state of a circuit breaker.
type CircuitBreakerState string

const (
	CircuitBreakerStateClosed   CircuitBreakerState = "CLOSED"
	CircuitBreakerStateOpen     CircuitBreakerState = "OPEN"
	CircuitBreakerStateHalfOpen CircuitBreakerState = "HALF_OPEN"
)

// SuggestionSeverity indicates the severity of a diagnostic suggestion.
type SuggestionSeverity string

const (
	SuggestionSeverityInfo     SuggestionSeverity = "INFO"
	SuggestionSeverityWarning  SuggestionSeverity = "WARNING"
	SuggestionSeverityError    SuggestionSeverity = "ERROR"
	SuggestionSeverityCritical SuggestionSeverity = "CRITICAL"
)

// PortStatus represents the status of a single port check.
type PortStatus struct {
	Port           int     `json:"port"`
	Service        string  `json:"service"`
	Open           bool    `json:"open"`
	ResponseTimeMs *int    `json:"responseTimeMs,omitempty"`
	Error          *string `json:"error,omitempty"`
}

// TLSStatus represents the TLS certificate status of a router.
type TLSStatus struct {
	Valid     bool       `json:"valid"`
	Issuer    *string    `json:"issuer,omitempty"`
	Subject   *string    `json:"subject,omitempty"`
	ExpiresAt *time.Time `json:"expiresAt,omitempty"`
	Error     *string    `json:"error,omitempty"`
}

// AuthStatus represents the authentication test status.
type AuthStatus struct {
	Tested    bool    `json:"tested"`
	Success   bool    `json:"success"`
	Error     *string `json:"error,omitempty"`
	ErrorCode *string `json:"errorCode,omitempty"`
}

// DiagnosticSuggestion provides actionable troubleshooting guidance.
type DiagnosticSuggestion struct {
	Severity    SuggestionSeverity `json:"severity"`
	Title       string             `json:"title"`
	Description string             `json:"description"`
	Action      string             `json:"action"`
	DocsURL     *string            `json:"docsUrl,omitempty"`
}

// DiagnosticReport contains comprehensive diagnostic results for a router.
type DiagnosticReport struct {
	RouterID         string                 `json:"routerId"`
	Timestamp        time.Time              `json:"timestamp"`
	NetworkReachable bool                   `json:"networkReachable"`
	PortStatus       []PortStatus           `json:"portStatus"`
	TLSStatus        *TLSStatus             `json:"tlsStatus,omitempty"`
	AuthStatus       AuthStatus             `json:"authStatus"`
	Suggestions      []DiagnosticSuggestion `json:"suggestions"`
	RawReport        string                 `json:"rawReport"`
}

// ConnectionAttempt records a single protocol connection attempt.
type ConnectionAttempt struct {
	Protocol      Protocol       `json:"protocol"`
	StartedAt     time.Time      `json:"startedAt"`
	EndedAt       time.Time      `json:"endedAt"`
	Success       bool           `json:"success"`
	ErrorCode     *string        `json:"errorCode,omitempty"`
	ErrorMessage  *string        `json:"errorMessage,omitempty"`
	ErrorCategory *ErrorCategory `json:"errorCategory,omitempty"`
}

// CircuitBreakerStatus provides the current state of a router's circuit breaker.
type CircuitBreakerStatus struct {
	RouterID                 string              `json:"routerId"`
	State                    CircuitBreakerState `json:"state"`
	FailureCount             int                 `json:"failureCount"`
	FailureThreshold         int                 `json:"failureThreshold"`
	CooldownRemainingSeconds *int                `json:"cooldownRemainingSeconds,omitempty"`
	LastFailureAt            *time.Time          `json:"lastFailureAt,omitempty"`
	LastSuccessAt            *time.Time          `json:"lastSuccessAt,omitempty"`
}

// DiagnosticService defines the interface for connection diagnostics.
type DiagnosticService interface {
	// RunDiagnostics performs comprehensive diagnostics on a router connection.
	RunDiagnostics(ctx context.Context, routerID string) (*DiagnosticReport, error)

	// GetConnectionAttempts retrieves recent connection attempts for a router.
	GetConnectionAttempts(ctx context.Context, routerID string, limit int) ([]ConnectionAttempt, error)

	// GetCircuitBreakerStatus returns the current circuit breaker state for a router.
	GetCircuitBreakerStatus(ctx context.Context, routerID string) (*CircuitBreakerStatus, error)

	// ResetCircuitBreaker manually resets the circuit breaker for a router.
	ResetCircuitBreaker(ctx context.Context, routerID string) (*CircuitBreakerStatus, error)
}

// AttemptRecorder records protocol connection attempts.
type AttemptRecorder interface {
	// RecordAttempt records a connection attempt for a router.
	RecordAttempt(routerID string, attempt ConnectionAttempt)

	// GetAttempts retrieves recorded attempts for a router.
	GetAttempts(routerID string, limit int) []ConnectionAttempt

	// ClearAttempts clears recorded attempts for a router.
	ClearAttempts(routerID string)
}

// Standard MikroTik service ports
var StandardPorts = []struct {
	Port    int
	Service string
}{
	{8728, "API"},
	{8729, "API-SSL"},
	{22, "SSH"},
	{23, "Telnet"},
	{80, "HTTP"},
	{443, "HTTPS"},
}
