package errors

import (
	"errors"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// =============================================================================
// Error Category Tests
// =============================================================================

func TestErrorCategories_AllDefined(t *testing.T) {
	// AC: All 6 error categories must be defined
	categories := []ErrorCategory{
		CategoryPlatform,
		CategoryProtocol,
		CategoryNetwork,
		CategoryValidation,
		CategoryAuth,
		CategoryResource,
		CategoryInternal,
	}

	expectedValues := []string{
		"platform",
		"protocol",
		"network",
		"validation",
		"auth",
		"resource",
		"internal",
	}

	require.Equal(t, len(expectedValues), len(categories))
	for i, cat := range categories {
		assert.Equal(t, expectedValues[i], string(cat))
	}
}

// =============================================================================
// Error Code Tests
// =============================================================================

func TestErrorCodes_PlatformCodes(t *testing.T) {
	// P1xx codes
	assert.Equal(t, "P100", CodePlatformNotSupported)
	assert.Equal(t, "P101", CodeCapabilityNotAvailable)
	assert.Equal(t, "P102", CodeVersionTooOld)
	assert.Equal(t, "P103", CodePackageMissing)
}

func TestErrorCodes_ProtocolCodes(t *testing.T) {
	// R2xx codes
	assert.Equal(t, "R200", CodeConnectionFailed)
	assert.Equal(t, "R201", CodeConnectionTimeout)
	assert.Equal(t, "R202", CodeProtocolError)
	assert.Equal(t, "R203", CodeAllProtocolsFailed)
	assert.Equal(t, "R204", CodeAuthenticationFailed)
	assert.Equal(t, "R205", CodeCommandFailed)
}

func TestErrorCodes_NetworkCodes(t *testing.T) {
	// N3xx codes
	assert.Equal(t, "N300", CodeHostUnreachable)
	assert.Equal(t, "N301", CodeDNSResolutionFailed)
	assert.Equal(t, "N302", CodeNetworkTimeout)
	assert.Equal(t, "N303", CodePortClosed)
}

func TestErrorCodes_ValidationCodes(t *testing.T) {
	// V4xx codes
	assert.Equal(t, "V400", CodeValidationFailed)
	assert.Equal(t, "V401", CodeSchemaValidationFailed)
	assert.Equal(t, "V402", CodeReferenceNotFound)
	assert.Equal(t, "V403", CodeCircularDependency)
	assert.Equal(t, "V404", CodeConflictDetected)
	assert.Equal(t, "V405", CodeInvalidFormat)
	assert.Equal(t, "V406", CodeOutOfRange)
}

func TestErrorCodes_AuthCodes(t *testing.T) {
	// A5xx codes
	assert.Equal(t, "A500", CodeAuthFailed)
	assert.Equal(t, "A501", CodeInsufficientPermissions)
	assert.Equal(t, "A502", CodeSessionExpired)
	assert.Equal(t, "A503", CodeInvalidCredentials)
	assert.Equal(t, "A504", CodeAccessDenied)
}

func TestErrorCodes_ResourceCodes(t *testing.T) {
	// S6xx codes
	assert.Equal(t, "S600", CodeResourceNotFound)
	assert.Equal(t, "S601", CodeResourceLocked)
	assert.Equal(t, "S602", CodeInvalidStateTransition)
	assert.Equal(t, "S603", CodeDependencyNotReady)
	assert.Equal(t, "S604", CodeResourceBusy)
}

// =============================================================================
// RouterError Base Type Tests
// =============================================================================

func TestRouterError_Error(t *testing.T) {
	err := NewRouterError(CodeValidationFailed, CategoryValidation, "test message")
	assert.Equal(t, "[V400] test message", err.Error())
}

func TestRouterError_ErrorWithCause(t *testing.T) {
	cause := errors.New("underlying error")
	err := NewRouterError(CodeValidationFailed, CategoryValidation, "test message").
		WithCause(cause)
	assert.Contains(t, err.Error(), "test message")
	assert.Contains(t, err.Error(), "underlying error")
}

func TestRouterError_Unwrap(t *testing.T) {
	cause := errors.New("underlying error")
	err := NewRouterError(CodeValidationFailed, CategoryValidation, "test message").
		WithCause(cause)

	unwrapped := err.Unwrap()
	assert.Equal(t, cause, unwrapped)
}

func TestRouterError_Is(t *testing.T) {
	err1 := NewRouterError(CodeValidationFailed, CategoryValidation, "message 1")
	err2 := NewRouterError(CodeValidationFailed, CategoryValidation, "message 2")
	err3 := NewRouterError(CodeAuthFailed, CategoryAuth, "message 3")

	// Same code should match
	assert.True(t, err1.Is(err2))
	// Different codes should not match
	assert.False(t, err1.Is(err3))
}

func TestRouterError_WithContext(t *testing.T) {
	err := NewRouterError(CodeValidationFailed, CategoryValidation, "test")
	err = err.WithContext("field", "username").
		WithContext("value", "abc")

	assert.Equal(t, "username", err.Context["field"])
	assert.Equal(t, "abc", err.Context["value"])
}

func TestRouterError_WithContextPreservesExisting(t *testing.T) {
	err := NewRouterError(CodeValidationFailed, CategoryValidation, "test").
		WithContext("field1", "value1")

	// Adding new context should not modify original
	err2 := err.WithContext("field2", "value2")

	assert.Equal(t, "value1", err.Context["field1"])
	assert.Nil(t, err.Context["field2"])
	assert.Equal(t, "value1", err2.Context["field1"])
	assert.Equal(t, "value2", err2.Context["field2"])
}

// =============================================================================
// Specialized Error Type Tests
// =============================================================================

func TestPlatformError_Creation(t *testing.T) {
	err := NewPlatformError(CodePlatformNotSupported, "MikroTik only", "openwrt")

	assert.Equal(t, CodePlatformNotSupported, err.Code)
	assert.Equal(t, CategoryPlatform, err.Category)
	assert.Equal(t, "openwrt", err.Platform)
	assert.False(t, err.Recoverable)
}

func TestPlatformError_WithVersion(t *testing.T) {
	err := NewPlatformError(CodeVersionTooOld, "version too old", "mikrotik").
		WithVersion("6.39")

	assert.Equal(t, "6.39", err.Version)
	assert.Equal(t, "6.39", err.Context["version"])
}

func TestProtocolError_Creation(t *testing.T) {
	err := NewProtocolError(CodeConnectionFailed, "connection refused", "SSH")

	assert.Equal(t, CodeConnectionFailed, err.Code)
	assert.Equal(t, CategoryProtocol, err.Category)
	assert.Equal(t, "SSH", err.Protocol)
	assert.True(t, err.Recoverable) // Protocol errors are often recoverable
}

func TestProtocolError_WithRouter(t *testing.T) {
	err := NewProtocolError(CodeConnectionFailed, "connection refused", "SSH").
		WithRouter("router-1", "192.168.1.1")

	assert.Equal(t, "router-1", err.RouterID)
	assert.Equal(t, "192.168.1.1", err.RouterHost)
	assert.Equal(t, "router-1", err.Context["routerId"])
	assert.Equal(t, "192.168.1.1", err.Context["routerHost"])
}

func TestProtocolError_WithConnectionID(t *testing.T) {
	err := NewProtocolError(CodeConnectionFailed, "connection refused", "SSH").
		WithConnectionID("conn-123")

	assert.Equal(t, "conn-123", err.ConnectionID)
	assert.Equal(t, "conn-123", err.Context["connectionId"])
}

func TestValidationError_Creation(t *testing.T) {
	err := NewValidationError("input.port", 70000, "must be between 1 and 65535")

	assert.Equal(t, CodeValidationFailed, err.Code)
	assert.Equal(t, CategoryValidation, err.Category)
	assert.Equal(t, "input.port", err.Field)
	assert.Equal(t, 70000, err.Value)
	assert.Equal(t, "must be between 1 and 65535", err.Constraint)
	assert.True(t, err.Recoverable)
}

func TestValidationError_WithCode(t *testing.T) {
	err := NewValidationError("email", "invalid", "invalid format").
		WithCode(CodeInvalidFormat)

	assert.Equal(t, CodeInvalidFormat, err.Code)
}

func TestAuthError_Creation(t *testing.T) {
	err := NewAuthError(CodeInsufficientPermissions, "admin required")

	assert.Equal(t, CodeInsufficientPermissions, err.Code)
	assert.Equal(t, CategoryAuth, err.Category)
	assert.True(t, err.Recoverable)
}

func TestAuthError_WithPermissions(t *testing.T) {
	err := NewAuthError(CodeInsufficientPermissions, "admin required").
		WithPermissions("admin", "operator")

	assert.Equal(t, "admin", err.RequiredPermission)
	assert.Equal(t, "operator", err.CurrentPermission)
	assert.Equal(t, "admin", err.Context["requiredPermission"])
	assert.Equal(t, "operator", err.Context["currentPermission"])
}

func TestAuthError_WithUserID(t *testing.T) {
	err := NewAuthError(CodeAccessDenied, "access denied").
		WithUserID("user-123")

	assert.Equal(t, "user-123", err.UserID)
	assert.Equal(t, "user-123", err.Context["userId"])
}

func TestNetworkError_Creation(t *testing.T) {
	err := NewNetworkError(CodeHostUnreachable, "host unreachable", "192.168.1.1")

	assert.Equal(t, CodeHostUnreachable, err.Code)
	assert.Equal(t, CategoryNetwork, err.Category)
	assert.Equal(t, "192.168.1.1", err.Host)
	assert.True(t, err.Recoverable)
}

func TestNetworkError_WithPort(t *testing.T) {
	err := NewNetworkError(CodePortClosed, "port closed", "192.168.1.1").
		WithPort(8728)

	assert.Equal(t, 8728, err.Port)
	assert.Equal(t, 8728, err.Context["port"])
}

func TestNetworkError_WithTimeout(t *testing.T) {
	err := NewNetworkError(CodeNetworkTimeout, "timed out", "192.168.1.1").
		WithTimeout(5000)

	assert.Equal(t, 5000, err.Timeout)
	assert.Equal(t, 5000, err.Context["timeoutMs"])
}

func TestResourceError_Creation(t *testing.T) {
	err := NewResourceError(CodeResourceNotFound, "not found", "interface", "eth0")

	assert.Equal(t, CodeResourceNotFound, err.Code)
	assert.Equal(t, CategoryResource, err.Category)
	assert.Equal(t, "interface", err.ResourceType)
	assert.Equal(t, "eth0", err.ResourceID)
	assert.True(t, err.Recoverable)
}

func TestResourceError_WithState(t *testing.T) {
	err := NewResourceError(CodeInvalidStateTransition, "invalid transition", "vpn", "vpn-1").
		WithState("connecting")

	assert.Equal(t, "connecting", err.CurrentState)
	assert.Equal(t, "connecting", err.Context["currentState"])
}

func TestInternalError_Creation(t *testing.T) {
	cause := errors.New("database error")
	err := NewInternalError("internal error", cause)

	assert.Equal(t, "I500", err.Code)
	assert.Equal(t, CategoryInternal, err.Category)
	assert.False(t, err.Recoverable)
	assert.Equal(t, cause, err.Cause)
}

func TestInternalError_WithComponent(t *testing.T) {
	err := NewInternalError("internal error", nil).
		WithComponent("database")

	assert.Equal(t, "database", err.Component)
	assert.Equal(t, "database", err.Context["component"])
}

// =============================================================================
// Helper Function Tests
// =============================================================================

func TestIsRouterError(t *testing.T) {
	routerErr := NewRouterError(CodeValidationFailed, CategoryValidation, "test")
	regularErr := errors.New("regular error")

	assert.True(t, IsRouterError(routerErr))
	assert.False(t, IsRouterError(regularErr))
}

func TestGetRouterError(t *testing.T) {
	routerErr := NewRouterError(CodeValidationFailed, CategoryValidation, "test")

	got := GetRouterError(routerErr)
	require.NotNil(t, got)
	assert.Equal(t, CodeValidationFailed, got.Code)

	regularErr := errors.New("regular error")
	assert.Nil(t, GetRouterError(regularErr))
}

func TestIsCategory(t *testing.T) {
	valErr := NewValidationError("field", "value", "constraint")
	authErr := NewAuthError(CodeAuthFailed, "auth failed")

	assert.True(t, IsCategory(valErr.RouterError, CategoryValidation))
	assert.False(t, IsCategory(valErr.RouterError, CategoryAuth))
	assert.True(t, IsCategory(authErr.RouterError, CategoryAuth))
}

func TestIsRecoverable(t *testing.T) {
	recoverableErr := NewValidationError("field", "value", "constraint")
	nonRecoverableErr := NewInternalError("internal", nil)

	assert.True(t, IsRecoverable(recoverableErr.RouterError))
	assert.False(t, IsRecoverable(nonRecoverableErr.RouterError))
}

func TestWrap(t *testing.T) {
	originalErr := errors.New("original error")
	wrapped := Wrap(originalErr, CodeProtocolError, CategoryProtocol, "wrapped message")

	assert.Equal(t, CodeProtocolError, wrapped.Code)
	assert.Equal(t, CategoryProtocol, wrapped.Category)
	assert.Equal(t, "wrapped message", wrapped.Message)
	assert.Equal(t, originalErr, wrapped.Cause)

	// Verify unwrapping works
	assert.True(t, errors.Is(wrapped, originalErr))
}

// =============================================================================
// Error Chain Tests
// =============================================================================

func TestErrorChain_Unwrapping(t *testing.T) {
	rootCause := errors.New("root cause")

	// Create a RouterError with a cause
	routerErr := NewRouterError(CodeConnectionFailed, CategoryProtocol, "connection failed").
		WithCause(rootCause)

	// Should be able to find root cause via errors.Is
	assert.True(t, errors.Is(routerErr, rootCause))

	// Should be able to get the router error via errors.As
	var gotRouterErr *RouterError
	assert.True(t, errors.As(routerErr, &gotRouterErr))
	assert.Equal(t, CodeConnectionFailed, gotRouterErr.Code)

	// Test with wrapped error using Wrap helper
	wrapped := Wrap(rootCause, CodeProtocolError, CategoryProtocol, "wrapped error")
	assert.True(t, errors.Is(wrapped, rootCause))
}

func TestProtocolError_ErrorChain(t *testing.T) {
	// ProtocolError has its embedded RouterError which contains the cause
	protoErr := NewProtocolError(CodeConnectionFailed, "connection failed", "SSH")

	// Set cause on the embedded RouterError
	rootCause := errors.New("network unreachable")
	protoErr.RouterError.Cause = rootCause

	// Should be able to find cause through the RouterError's Unwrap
	assert.True(t, errors.Is(protoErr.RouterError, rootCause))

	// Access Protocol through the error
	assert.Equal(t, "SSH", protoErr.Protocol)
}
