package errors

import (
	"context"
	"errors"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// =============================================================================
// Error Presenter Tests
// =============================================================================

func TestErrorPresenter_ValidationError(t *testing.T) {
	ctx := context.Background()
	ctx = WithRequestID(ctx, "test-request-123")
	ctx = WithProductionMode(ctx, false)

	valErr := NewValidationError("input.listenPort", 70000, "value 70000 exceeds maximum 65535")

	// Pass the embedded RouterError to match how errors.As works
	gqlErr := ErrorPresenter(ctx, valErr.RouterError)

	require.NotNil(t, gqlErr)
	assert.Contains(t, gqlErr.Message, "input.listenPort")
	assert.Contains(t, gqlErr.Message, "value 70000 exceeds maximum 65535")

	// Check extensions
	ext := gqlErr.Extensions
	assert.Equal(t, "V400", ext["code"])
	assert.Equal(t, "validation", ext["category"])
	assert.Equal(t, true, ext["recoverable"])
	assert.Equal(t, "test-request-123", ext["requestId"])
	assert.NotEmpty(t, ext["suggestedFix"])
	assert.NotEmpty(t, ext["docsUrl"])
}

func TestErrorPresenter_ProtocolError(t *testing.T) {
	ctx := context.Background()
	ctx = WithRequestID(ctx, "test-request-456")
	ctx = WithProductionMode(ctx, false)

	protoErr := NewProtocolError(CodeConnectionFailed, "connection refused", "SSH").
		WithRouter("router-1", "192.168.1.1")

	gqlErr := ErrorPresenter(ctx, protoErr.RouterError)

	require.NotNil(t, gqlErr)

	ext := gqlErr.Extensions
	assert.Equal(t, "R200", ext["code"])
	assert.Equal(t, "protocol", ext["category"])
	assert.Equal(t, true, ext["recoverable"])
	assert.Equal(t, "test-request-456", ext["requestId"])
	assert.NotEmpty(t, ext["suggestedFix"])
	assert.NotEmpty(t, ext["docsUrl"])
	assert.NotEmpty(t, ext["troubleshootingSteps"])
}

func TestErrorPresenter_AuthError(t *testing.T) {
	ctx := context.Background()
	ctx = WithRequestID(ctx, "test-request-789")

	authErr := NewAuthError(CodeInsufficientPermissions, "admin access required").
		WithPermissions("admin", "operator")

	gqlErr := ErrorPresenter(ctx, authErr.RouterError)

	require.NotNil(t, gqlErr)

	ext := gqlErr.Extensions
	assert.Equal(t, "A501", ext["code"])
	assert.Equal(t, "auth", ext["category"])
	assert.Equal(t, true, ext["recoverable"])
}

func TestErrorPresenter_NetworkError(t *testing.T) {
	ctx := context.Background()
	ctx = WithRequestID(ctx, "test-request-101")

	netErr := NewNetworkError(CodeHostUnreachable, "host unreachable", "192.168.1.1").
		WithPort(8728)

	gqlErr := ErrorPresenter(ctx, netErr.RouterError)

	require.NotNil(t, gqlErr)

	ext := gqlErr.Extensions
	assert.Equal(t, "N300", ext["code"])
	assert.Equal(t, "network", ext["category"])
	assert.NotEmpty(t, ext["troubleshootingSteps"])
}

func TestErrorPresenter_UnknownError(t *testing.T) {
	ctx := context.Background()
	ctx = WithRequestID(ctx, "test-request-unknown")
	ctx = WithProductionMode(ctx, false)

	unknownErr := errors.New("something went wrong")

	gqlErr := ErrorPresenter(ctx, unknownErr)

	require.NotNil(t, gqlErr)
	assert.Contains(t, gqlErr.Message, "something went wrong")

	ext := gqlErr.Extensions
	assert.Equal(t, "I500", ext["code"])
	assert.Equal(t, "internal", ext["category"])
	assert.Equal(t, false, ext["recoverable"])
}

func TestErrorPresenter_ProductionMode(t *testing.T) {
	ctx := context.Background()
	ctx = WithRequestID(ctx, "test-request-prod")
	ctx = WithProductionMode(ctx, true)

	// In production, internal error messages should be hidden
	unknownErr := errors.New("internal database error with sensitive data")

	gqlErr := ErrorPresenter(ctx, unknownErr)

	require.NotNil(t, gqlErr)
	// Should NOT contain the actual error message in production
	assert.NotContains(t, gqlErr.Message, "internal database error")
	assert.Contains(t, gqlErr.Message, "unexpected error")
}

// =============================================================================
// Error Extensions Format Tests (Golden Tests)
// =============================================================================

func TestErrorExtensions_RequiredFields(t *testing.T) {
	// AC6: Error must include code, message, field path, invalid value, suggested fix, docs URL

	ctx := context.Background()
	ctx = WithRequestID(ctx, "golden-test-1")

	valErr := NewValidationError("input.username", "a", "minimum length is 3 characters")

	// Pass the embedded RouterError for proper handling
	gqlErr := ErrorPresenter(ctx, valErr.RouterError)
	ext := gqlErr.Extensions

	// Required fields per AC6
	assert.Contains(t, ext, "code", "Must include error code")
	assert.Contains(t, ext, "category", "Must include category")
	assert.Contains(t, ext, "field", "Must include field path")
	assert.Contains(t, ext, "value", "Must include invalid value")
	assert.Contains(t, ext, "suggestedFix", "Must include suggested fix")
	assert.Contains(t, ext, "docsUrl", "Must include docs URL")
	assert.Contains(t, ext, "requestId", "Must include request ID")
	assert.Contains(t, ext, "recoverable", "Must include recoverable flag")
}

func TestErrorExtensions_DocsURLFormat(t *testing.T) {
	tests := []struct {
		code     string
		expected string
	}{
		{"V400", "https://docs.nasnet.io/errors/validation#v400"},
		{"R200", "https://docs.nasnet.io/errors/protocol#r200"},
		{"N300", "https://docs.nasnet.io/errors/network#n300"},
		{"A500", "https://docs.nasnet.io/errors/auth#a500"},
		{"S600", "https://docs.nasnet.io/errors/resource#s600"},
		{"P100", "https://docs.nasnet.io/errors/platform#p100"},
		{"I500", "https://docs.nasnet.io/errors/internal#i500"},
	}

	for _, tt := range tests {
		t.Run(tt.code, func(t *testing.T) {
			url := DocsURL(tt.code)
			assert.Equal(t, tt.expected, url)
		})
	}
}

// =============================================================================
// Context Functions Tests
// =============================================================================

func TestWithRequestID(t *testing.T) {
	ctx := context.Background()
	ctx = WithRequestID(ctx, "my-request-id")

	id := GetRequestID(ctx)
	assert.Equal(t, "my-request-id", id)
}

func TestGetRequestID_NotSet(t *testing.T) {
	ctx := context.Background()
	id := GetRequestID(ctx)
	assert.Equal(t, "", id)
}

func TestWithProductionMode(t *testing.T) {
	ctx := context.Background()

	ctx = WithProductionMode(ctx, true)
	assert.True(t, IsProductionMode(ctx))

	ctx = WithProductionMode(ctx, false)
	assert.False(t, IsProductionMode(ctx))
}

func TestIsProductionMode_NotSet(t *testing.T) {
	ctx := context.Background()
	assert.False(t, IsProductionMode(ctx))
}

// =============================================================================
// Convenience Function Tests
// =============================================================================

func TestNewGraphQLValidationError(t *testing.T) {
	ctx := context.Background()
	ctx = WithRequestID(ctx, "test-123")

	gqlErr := NewGraphQLValidationError(ctx, "email", "invalid email format", "not-an-email")

	require.NotNil(t, gqlErr)
	assert.Contains(t, gqlErr.Message, "email")
	// The presenter converts to gqlErr with extensions
	assert.NotEmpty(t, gqlErr.Extensions["code"])
	assert.NotEmpty(t, gqlErr.Extensions["requestId"])
}

func TestNewGraphQLAuthError(t *testing.T) {
	ctx := context.Background()
	ctx = WithRequestID(ctx, "test-456")

	gqlErr := NewGraphQLAuthError(ctx, "session expired", CodeSessionExpired)

	require.NotNil(t, gqlErr)
	assert.Contains(t, gqlErr.Message, "session expired")
	assert.NotEmpty(t, gqlErr.Extensions["code"])
}

func TestNewGraphQLProtocolError(t *testing.T) {
	ctx := context.Background()
	ctx = WithRequestID(ctx, "test-789")

	gqlErr := NewGraphQLProtocolError(ctx, "connection refused", "SSH", "router-1")

	require.NotNil(t, gqlErr)
	assert.Contains(t, gqlErr.Message, "connection refused")
	assert.NotEmpty(t, gqlErr.Extensions["code"])
}

// =============================================================================
// Error Recoverer Tests
// =============================================================================

func TestErrorRecoverer(t *testing.T) {
	ctx := context.Background()
	ctx = WithRequestID(ctx, "panic-request-123")

	err := ErrorRecoverer(ctx, "test panic")

	require.NotNil(t, err)

	// The recoverer returns an *InternalError which embeds *RouterError
	internalErr, ok := err.(*InternalError)
	require.True(t, ok, "Expected *InternalError type")
	assert.Equal(t, "I500", internalErr.Code)
	assert.Equal(t, CategoryInternal, internalErr.Category)
}

// =============================================================================
// PresenterConfig Tests
// =============================================================================

func TestNewErrorPresenter_WithConfig(t *testing.T) {
	config := &PresenterConfig{
		Production:  true,
		BaseDocsURL: "https://custom.docs.url",
	}

	presenter := NewErrorPresenter(config)
	require.NotNil(t, presenter)

	ctx := context.Background()
	ctx = WithRequestID(ctx, "config-test")

	unknownErr := errors.New("test error")
	gqlErr := presenter(ctx, unknownErr)

	// Should hide error message in production
	assert.NotContains(t, gqlErr.Message, "test error")
}

func TestNewErrorPresenter_NilConfig(t *testing.T) {
	presenter := NewErrorPresenter(nil)
	require.NotNil(t, presenter)

	ctx := context.Background()
	ctx = WithRequestID(ctx, "nil-config-test")

	unknownErr := errors.New("test error")
	gqlErr := presenter(ctx, unknownErr)

	// With default config (not production), should show error
	assert.Contains(t, gqlErr.Message, "test error")
}
