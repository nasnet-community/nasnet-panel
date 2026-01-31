// Package errors provides a hierarchical error system for NasNetConnect.
// It implements rich error diagnostics with categories, codes, context,
// and suggested fixes for improved debugging and user feedback.
package errors

import (
	"errors"
	"fmt"
)

// ErrorCategory represents the type/domain of an error.
type ErrorCategory string

const (
	CategoryPlatform   ErrorCategory = "platform"   // Platform-specific errors (RouterOS version, capabilities)
	CategoryProtocol   ErrorCategory = "protocol"   // Protocol-level errors (SSH, API, Telnet)
	CategoryNetwork    ErrorCategory = "network"    // Network connectivity errors
	CategoryValidation ErrorCategory = "validation" // Data validation errors
	CategoryAuth       ErrorCategory = "auth"       // Authentication/authorization errors
	CategoryResource   ErrorCategory = "resource"   // Resource state errors
	CategoryInternal   ErrorCategory = "internal"   // Internal system errors
)

// Error codes by category:
// - P1xx: Platform errors
// - R2xx: Protocol errors
// - N3xx: Network errors
// - V4xx: Validation errors
// - A5xx: Auth errors
// - S6xx: Resource errors
const (
	// Platform errors (P1xx)
	CodePlatformNotSupported    = "P100"
	CodeCapabilityNotAvailable  = "P101"
	CodeVersionTooOld           = "P102"
	CodePackageMissing          = "P103"

	// Protocol errors (R2xx)
	CodeConnectionFailed        = "R200"
	CodeConnectionTimeout       = "R201"
	CodeProtocolError           = "R202"
	CodeAllProtocolsFailed      = "R203"
	CodeAuthenticationFailed    = "R204"
	CodeCommandFailed           = "R205"

	// Network errors (N3xx)
	CodeHostUnreachable         = "N300"
	CodeDNSResolutionFailed     = "N301"
	CodeNetworkTimeout          = "N302"
	CodePortClosed              = "N303"

	// Validation errors (V4xx)
	CodeValidationFailed        = "V400"
	CodeSchemaValidationFailed  = "V401"
	CodeReferenceNotFound       = "V402"
	CodeCircularDependency      = "V403"
	CodeConflictDetected        = "V404"
	CodeInvalidFormat           = "V405"
	CodeOutOfRange              = "V406"

	// Auth errors (A5xx)
	CodeAuthFailed              = "A500"
	CodeInsufficientPermissions = "A501"
	CodeSessionExpired          = "A502"
	CodeInvalidCredentials      = "A503"
	CodeAccessDenied            = "A504"

	// Resource errors (S6xx)
	CodeResourceNotFound        = "S600"
	CodeResourceLocked          = "S601"
	CodeInvalidStateTransition  = "S602"
	CodeDependencyNotReady      = "S603"
	CodeResourceBusy            = "S604"
)

// RouterError is the base error type for all NasNetConnect errors.
// It provides structured error information including code, category,
// recoverability status, and contextual data.
type RouterError struct {
	Code        string                 // Error code (e.g., "V400", "R200")
	Category    ErrorCategory          // Error category for grouping
	Message     string                 // Human-readable error message
	Recoverable bool                   // Whether the error is recoverable
	Context     map[string]interface{} // Additional context data
	Cause       error                  // Underlying error (for wrapping)
}

// Error implements the error interface.
func (e *RouterError) Error() string {
	if e.Cause != nil {
		return fmt.Sprintf("[%s] %s: %v", e.Code, e.Message, e.Cause)
	}
	return fmt.Sprintf("[%s] %s", e.Code, e.Message)
}

// Unwrap returns the underlying error for errors.Is/As support.
func (e *RouterError) Unwrap() error {
	return e.Cause
}

// Is implements errors.Is for RouterError comparison by code.
func (e *RouterError) Is(target error) bool {
	var t *RouterError
	if errors.As(target, &t) {
		return e.Code == t.Code
	}
	return false
}

// WithContext returns a copy of the error with additional context.
func (e *RouterError) WithContext(key string, value interface{}) *RouterError {
	newErr := *e
	if newErr.Context == nil {
		newErr.Context = make(map[string]interface{})
	} else {
		// Copy existing context
		newCtx := make(map[string]interface{}, len(e.Context)+1)
		for k, v := range e.Context {
			newCtx[k] = v
		}
		newErr.Context = newCtx
	}
	newErr.Context[key] = value
	return &newErr
}

// WithCause returns a copy of the error with a cause.
func (e *RouterError) WithCause(cause error) *RouterError {
	newErr := *e
	newErr.Cause = cause
	return &newErr
}

// NewRouterError creates a new RouterError with the given parameters.
func NewRouterError(code string, category ErrorCategory, message string) *RouterError {
	return &RouterError{
		Code:        code,
		Category:    category,
		Message:     message,
		Recoverable: false,
		Context:     make(map[string]interface{}),
	}
}

// PlatformError represents platform-specific errors (RouterOS version, capabilities).
type PlatformError struct {
	*RouterError
	Platform    string // Platform type (e.g., "mikrotik", "openwrt")
	Version     string // Platform version if known
	NativeError error  // Platform-native error if available
}

// NewPlatformError creates a new platform error.
func NewPlatformError(code string, message string, platform string) *PlatformError {
	return &PlatformError{
		RouterError: &RouterError{
			Code:        code,
			Category:    CategoryPlatform,
			Message:     message,
			Recoverable: false,
			Context:     make(map[string]interface{}),
		},
		Platform: platform,
	}
}

// WithVersion adds version info to the platform error.
func (e *PlatformError) WithVersion(version string) *PlatformError {
	newErr := *e
	newErr.Version = version
	newErr.Context["version"] = version
	return &newErr
}

// ProtocolError represents protocol-level errors (SSH, API, Telnet).
type ProtocolError struct {
	*RouterError
	Protocol     string // Protocol type (e.g., "ssh", "api", "rest", "telnet")
	RouterID     string // Router identifier
	RouterHost   string // Router host address
	ConnectionID string // Connection identifier if available
}

// NewProtocolError creates a new protocol error.
func NewProtocolError(code string, message string, protocol string) *ProtocolError {
	return &ProtocolError{
		RouterError: &RouterError{
			Code:        code,
			Category:    CategoryProtocol,
			Message:     message,
			Recoverable: true, // Protocol errors are often recoverable
			Context:     make(map[string]interface{}),
		},
		Protocol: protocol,
	}
}

// WithRouter adds router context to the protocol error.
func (e *ProtocolError) WithRouter(routerID, host string) *ProtocolError {
	newErr := *e
	newErr.RouterID = routerID
	newErr.RouterHost = host
	newErr.Context["routerId"] = routerID
	newErr.Context["routerHost"] = host
	return &newErr
}

// WithConnectionID adds connection ID to the protocol error.
func (e *ProtocolError) WithConnectionID(connID string) *ProtocolError {
	newErr := *e
	newErr.ConnectionID = connID
	newErr.Context["connectionId"] = connID
	return &newErr
}

// ValidationError represents data validation errors.
type ValidationError struct {
	*RouterError
	Field      string      // Field path (e.g., "input.listenPort")
	Value      interface{} // The invalid value
	Constraint string      // Validation constraint that failed
}

// NewValidationError creates a new validation error.
func NewValidationError(field string, value interface{}, constraint string) *ValidationError {
	return &ValidationError{
		RouterError: &RouterError{
			Code:        CodeValidationFailed,
			Category:    CategoryValidation,
			Message:     fmt.Sprintf("Validation failed for field '%s': %s", field, constraint),
			Recoverable: true,
			Context: map[string]interface{}{
				"field":      field,
				"value":      value,
				"constraint": constraint,
			},
		},
		Field:      field,
		Value:      value,
		Constraint: constraint,
	}
}

// WithCode allows overriding the default validation error code.
func (e *ValidationError) WithCode(code string) *ValidationError {
	newErr := *e
	newErr.Code = code
	return &newErr
}

// AuthError represents authentication/authorization errors.
type AuthError struct {
	*RouterError
	RequiredPermission string // Permission level required
	CurrentPermission  string // Current user's permission level
	UserID             string // User identifier (not full auth state)
}

// NewAuthError creates a new authentication/authorization error.
func NewAuthError(code string, message string) *AuthError {
	return &AuthError{
		RouterError: &RouterError{
			Code:        code,
			Category:    CategoryAuth,
			Message:     message,
			Recoverable: true,
			Context:     make(map[string]interface{}),
		},
	}
}

// WithPermissions adds permission context to the auth error.
func (e *AuthError) WithPermissions(required, current string) *AuthError {
	newErr := *e
	newErr.RequiredPermission = required
	newErr.CurrentPermission = current
	newErr.Context["requiredPermission"] = required
	newErr.Context["currentPermission"] = current
	return &newErr
}

// WithUserID adds user ID to the auth error (without exposing full auth state).
func (e *AuthError) WithUserID(userID string) *AuthError {
	newErr := *e
	newErr.UserID = userID
	newErr.Context["userId"] = userID
	return &newErr
}

// NetworkError represents network connectivity errors.
type NetworkError struct {
	*RouterError
	Host    string // Target host
	Port    int    // Target port
	Timeout int    // Timeout in milliseconds if applicable
}

// NewNetworkError creates a new network error.
func NewNetworkError(code string, message string, host string) *NetworkError {
	return &NetworkError{
		RouterError: &RouterError{
			Code:        code,
			Category:    CategoryNetwork,
			Message:     message,
			Recoverable: true,
			Context: map[string]interface{}{
				"host": host,
			},
		},
		Host: host,
	}
}

// WithPort adds port info to the network error.
func (e *NetworkError) WithPort(port int) *NetworkError {
	newErr := *e
	newErr.Port = port
	newErr.Context["port"] = port
	return &newErr
}

// WithTimeout adds timeout info to the network error.
func (e *NetworkError) WithTimeout(timeoutMs int) *NetworkError {
	newErr := *e
	newErr.Timeout = timeoutMs
	newErr.Context["timeoutMs"] = timeoutMs
	return &newErr
}

// ResourceError represents resource state errors.
type ResourceError struct {
	*RouterError
	ResourceType string // Type of resource
	ResourceID   string // Resource identifier
	CurrentState string // Current state if applicable
}

// NewResourceError creates a new resource error.
func NewResourceError(code string, message string, resourceType, resourceID string) *ResourceError {
	return &ResourceError{
		RouterError: &RouterError{
			Code:        code,
			Category:    CategoryResource,
			Message:     message,
			Recoverable: true,
			Context: map[string]interface{}{
				"resourceType": resourceType,
				"resourceId":   resourceID,
			},
		},
		ResourceType: resourceType,
		ResourceID:   resourceID,
	}
}

// WithState adds current state to the resource error.
func (e *ResourceError) WithState(state string) *ResourceError {
	newErr := *e
	newErr.CurrentState = state
	newErr.Context["currentState"] = state
	return &newErr
}

// InternalError represents internal system errors.
// In production, details are hidden from clients.
type InternalError struct {
	*RouterError
	StackTrace string // Stack trace (dev mode only)
	Component  string // Internal component that failed
}

// NewInternalError creates a new internal error.
func NewInternalError(message string, cause error) *InternalError {
	return &InternalError{
		RouterError: &RouterError{
			Code:        "I500",
			Category:    CategoryInternal,
			Message:     message,
			Recoverable: false,
			Context:     make(map[string]interface{}),
			Cause:       cause,
		},
	}
}

// WithComponent adds component info to the internal error.
func (e *InternalError) WithComponent(component string) *InternalError {
	newErr := *e
	newErr.Component = component
	newErr.Context["component"] = component
	return &newErr
}

// Helper functions for error checking

// IsRouterError checks if an error is a RouterError.
func IsRouterError(err error) bool {
	var routerErr *RouterError
	return errors.As(err, &routerErr)
}

// GetRouterError extracts a RouterError from an error chain.
func GetRouterError(err error) *RouterError {
	var routerErr *RouterError
	if errors.As(err, &routerErr) {
		return routerErr
	}
	return nil
}

// IsCategory checks if an error belongs to a specific category.
func IsCategory(err error, category ErrorCategory) bool {
	routerErr := GetRouterError(err)
	if routerErr != nil {
		return routerErr.Category == category
	}
	return false
}

// IsRecoverable checks if an error is recoverable.
func IsRecoverable(err error) bool {
	routerErr := GetRouterError(err)
	if routerErr != nil {
		return routerErr.Recoverable
	}
	return false
}

// Wrap wraps an error with a RouterError, preserving the error chain.
func Wrap(err error, code string, category ErrorCategory, message string) *RouterError {
	return &RouterError{
		Code:        code,
		Category:    category,
		Message:     message,
		Recoverable: false,
		Context:     make(map[string]interface{}),
		Cause:       err,
	}
}
