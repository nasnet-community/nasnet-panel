package router

import (
	"errors"
	"fmt"
)

// ConnectionErrorCode represents specific error types for connection failures.
type ConnectionErrorCode string

const (
	// ErrCodeAuthFailed indicates authentication failed (invalid credentials).
	ErrCodeAuthFailed ConnectionErrorCode = "AUTH_FAILED"

	// ErrCodeNetworkUnreachable indicates the host cannot be reached.
	ErrCodeNetworkUnreachable ConnectionErrorCode = "NETWORK_UNREACHABLE"

	// ErrCodeConnectionRefused indicates the port is closed or blocked.
	ErrCodeConnectionRefused ConnectionErrorCode = "CONNECTION_REFUSED"

	// ErrCodeProtocolMismatch indicates no compatible protocol was found.
	ErrCodeProtocolMismatch ConnectionErrorCode = "PROTOCOL_MISMATCH"

	// ErrCodeTimeout indicates a connection or response timeout.
	ErrCodeTimeout ConnectionErrorCode = "TIMEOUT"

	// ErrCodeDNSFailed indicates DNS resolution failed for hostname.
	ErrCodeDNSFailed ConnectionErrorCode = "DNS_FAILED"

	// ErrCodeDuplicateRouter indicates a router with same host/port exists.
	ErrCodeDuplicateRouter ConnectionErrorCode = "DUPLICATE_ROUTER"

	// ErrCodeTLSError indicates a TLS/SSL handshake failed.
	ErrCodeTLSError ConnectionErrorCode = "TLS_ERROR"

	// ErrCodeNotMikroTik indicates the device is not a MikroTik router.
	ErrCodeNotMikroTik ConnectionErrorCode = "NOT_MIKROTIK"

	// ErrCodeUnknown indicates an unknown or unexpected error.
	ErrCodeUnknown ConnectionErrorCode = "UNKNOWN"
)

// String returns the string representation of the error code.
func (c ConnectionErrorCode) String() string {
	return string(c)
}

// ConnectionError represents a detailed connection error with context.
type ConnectionError struct {
	// Code is the error classification code.
	Code ConnectionErrorCode

	// Message is a human-readable error message.
	Message string

	// Protocol is the protocol that failed (if specific to a protocol).
	Protocol *Protocol

	// Retryable indicates if the error is likely transient.
	Retryable bool

	// SuggestedAction provides guidance for resolving the error.
	SuggestedAction string

	// TimeoutMs is the timeout in milliseconds (for timeout errors).
	TimeoutMs int

	// Cause is the underlying error.
	Cause error
}

// Error implements the error interface.
func (e *ConnectionError) Error() string {
	if e.Cause != nil {
		return fmt.Sprintf("[%s] %s: %v", e.Code, e.Message, e.Cause)
	}
	return fmt.Sprintf("[%s] %s", e.Code, e.Message)
}

// Unwrap returns the underlying error for errors.Is/As.
func (e *ConnectionError) Unwrap() error {
	return e.Cause
}

// Is implements error matching for ConnectionError codes.
func (e *ConnectionError) Is(target error) bool {
	var connErr *ConnectionError
	if errors.As(target, &connErr) {
		return e.Code == connErr.Code
	}
	return false
}

// NewAuthError creates an authentication failed error.
func NewAuthError(cause error) *ConnectionError {
	return &ConnectionError{
		Code:            ErrCodeAuthFailed,
		Message:         "Authentication failed - invalid username or password",
		Retryable:       false,
		SuggestedAction: "Verify the username and password are correct. Ensure the user has API access enabled.",
		Cause:           cause,
	}
}

// NewNetworkUnreachableError creates a network unreachable error.
func NewNetworkUnreachableError(host string, cause error) *ConnectionError {
	return &ConnectionError{
		Code:            ErrCodeNetworkUnreachable,
		Message:         fmt.Sprintf("Cannot reach host %s", host),
		Retryable:       true,
		SuggestedAction: "Check network connectivity and ensure the router is powered on and connected to the network.",
		Cause:           cause,
	}
}

// NewConnectionRefusedError creates a connection refused error.
func NewConnectionRefusedError(host string, port int, protocol Protocol, cause error) *ConnectionError {
	return &ConnectionError{
		Code:            ErrCodeConnectionRefused,
		Message:         fmt.Sprintf("Connection refused to %s:%d (%s)", host, port, protocol),
		Protocol:        &protocol,
		Retryable:       false,
		SuggestedAction: fmt.Sprintf("Ensure port %d is open and the %s service is enabled on the router.", port, protocol),
		Cause:           cause,
	}
}

// NewProtocolMismatchError creates a protocol mismatch error.
func NewProtocolMismatchError(attempedProtocols []Protocol) *ConnectionError {
	protocolList := ""
	for i, p := range attempedProtocols {
		if i > 0 {
			protocolList += ", "
		}
		protocolList += p.String()
	}
	return &ConnectionError{
		Code:            ErrCodeProtocolMismatch,
		Message:         "No compatible protocol found after trying: " + protocolList,
		Retryable:       false,
		SuggestedAction: "Ensure at least one of the following is enabled: REST API (RouterOS 7.1+), Binary API (port 8728), SSH (port 22), or Telnet (port 23).",
	}
}

// NewTimeoutError creates a timeout error.
func NewTimeoutError(protocol Protocol, timeoutMs int) *ConnectionError {
	return &ConnectionError{
		Code:            ErrCodeTimeout,
		Message:         fmt.Sprintf("Connection timed out after %dms using %s", timeoutMs, protocol),
		Protocol:        &protocol,
		Retryable:       true,
		SuggestedAction: "Check network latency and router responsiveness. The router may be under heavy load.",
		TimeoutMs:       timeoutMs,
	}
}

// NewDNSError creates a DNS resolution failed error.
func NewDNSError(hostname string, cause error) *ConnectionError {
	return &ConnectionError{
		Code:            ErrCodeDNSFailed,
		Message:         fmt.Sprintf("DNS resolution failed for hostname: %s", hostname),
		Retryable:       true,
		SuggestedAction: "Verify the hostname is correct and DNS is properly configured. Try using the IP address directly.",
		Cause:           cause,
	}
}

// NewDuplicateRouterError creates a duplicate router error.
func NewDuplicateRouterError(host string, port int, existingRouterID string) *ConnectionError {
	return &ConnectionError{
		Code:            ErrCodeDuplicateRouter,
		Message:         fmt.Sprintf("A router with host %s and port %d already exists (ID: %s)", host, port, existingRouterID),
		Retryable:       false,
		SuggestedAction: "Use the existing router or remove it first before adding a new one.",
	}
}

// NewTLSError creates a TLS handshake error.
func NewTLSError(cause error) *ConnectionError {
	return &ConnectionError{
		Code:            ErrCodeTLSError,
		Message:         "TLS/SSL handshake failed",
		Retryable:       false,
		SuggestedAction: "Check the router's certificate configuration or try a non-TLS protocol.",
		Cause:           cause,
	}
}

// NewNotMikroTikError creates a not-MikroTik error.
func NewNotMikroTikError(host string) *ConnectionError {
	return &ConnectionError{
		Code:            ErrCodeNotMikroTik,
		Message:         fmt.Sprintf("Device at %s does not appear to be a MikroTik router", host),
		Retryable:       false,
		SuggestedAction: "Verify the IP address is correct and points to a MikroTik RouterOS device.",
	}
}

// NewUnknownError creates an unknown error.
func NewUnknownError(cause error) *ConnectionError {
	return &ConnectionError{
		Code:            ErrCodeUnknown,
		Message:         "An unexpected error occurred",
		Retryable:       true,
		SuggestedAction: "Check the router logs and try again. If the problem persists, check the NasNetConnect logs for details.",
		Cause:           cause,
	}
}

// ClassifyError analyzes an error and returns an appropriate ConnectionError.
func ClassifyError(err error, protocol Protocol, host string, port int) *ConnectionError {
	if err == nil {
		return nil
	}

	errStr := err.Error()

	// Check for specific error patterns
	switch {
	case containsAny(errStr, "authentication", "login", "password", "credentials", "unauthorized", "wrong"):
		return NewAuthError(err)

	case containsAny(errStr, "no route to host", "network is unreachable", "host unreachable"):
		return NewNetworkUnreachableError(host, err)

	case containsAny(errStr, "connection refused", "refused"):
		return NewConnectionRefusedError(host, port, protocol, err)

	case containsAny(errStr, "timeout", "deadline exceeded", "timed out"):
		return NewTimeoutError(protocol, 10000) // Default timeout

	case containsAny(errStr, "no such host", "lookup", "dns", "resolve"):
		return NewDNSError(host, err)

	case containsAny(errStr, "tls", "certificate", "x509", "ssl", "handshake"):
		return NewTLSError(err)

	default:
		return NewUnknownError(err)
	}
}

// containsAny checks if s contains any of the substrings (case-insensitive).
func containsAny(s string, substrings ...string) bool {
	lower := toLower(s)
	for _, sub := range substrings {
		if contains(lower, toLower(sub)) {
			return true
		}
	}
	return false
}

// toLower is a simple lowercase conversion without importing strings.
func toLower(s string) string {
	result := make([]byte, len(s))
	for i := 0; i < len(s); i++ {
		c := s[i]
		if c >= 'A' && c <= 'Z' {
			c += 'a' - 'A'
		}
		result[i] = c
	}
	return string(result)
}

// contains checks if s contains substr.
func contains(s, substr string) bool {
	if len(substr) > len(s) {
		return false
	}
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
