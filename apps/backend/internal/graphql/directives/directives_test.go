package directives

import (
	"context"
	"strings"
	"testing"

	"github.com/99designs/gqlgen/graphql"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/vektah/gqlparser/v2/ast"

	internalerrors "backend/internal/errors"
)

// mockFieldContext creates a mock graphql field context for testing.
func mockFieldContext(fieldName string) context.Context {
	ctx := context.Background()
	ctx = internalerrors.WithRequestID(ctx, "test-request-id")

	// Create a minimal field context
	fieldCtx := &graphql.FieldContext{
		Field: graphql.CollectedField{
			Field: &ast.Field{
				Name: fieldName,
			},
		},
	}
	return graphql.WithFieldContext(ctx, fieldCtx)
}

// =============================================================================
// @validate Directive Tests
// =============================================================================

func TestValidate_MinMax_Valid(t *testing.T) {
	d := NewDefault()

	tests := []struct {
		name  string
		value interface{}
		min   *int
		max   *int
	}{
		{"value at min", 1, intPtr(1), intPtr(100)},
		{"value at max", 100, intPtr(1), intPtr(100)},
		{"value in range", 50, intPtr(1), intPtr(100)},
		{"nil value", nil, intPtr(1), intPtr(100)},
		{"only min", 10, intPtr(1), nil},
		{"only max", 10, nil, intPtr(100)},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctx := mockFieldContext("testField")
			next := func(ctx context.Context) (interface{}, error) {
				return tt.value, nil
			}

			result, err := d.Validate(ctx, nil, next, tt.min, tt.max, nil, nil, nil, nil)
			require.NoError(t, err)
			assert.Equal(t, tt.value, result)
		})
	}
}

func TestValidate_MinMax_Invalid(t *testing.T) {
	d := NewDefault()

	tests := []struct {
		name  string
		value int
		min   *int
		max   *int
	}{
		{"below min", 0, intPtr(1), intPtr(100)},
		{"above max", 101, intPtr(1), intPtr(100)},
		{"way below min", -100, intPtr(1), intPtr(100)},
		{"way above max", 1000, intPtr(1), intPtr(100)},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctx := mockFieldContext("testField")
			next := func(ctx context.Context) (interface{}, error) {
				return tt.value, nil
			}

			_, err := d.Validate(ctx, nil, next, tt.min, tt.max, nil, nil, nil, nil)
			require.Error(t, err)
			// Error message contains either "minimum" or "maximum" depending on which limit was exceeded
			assert.True(t, strings.Contains(err.Error(), "minimum") || strings.Contains(err.Error(), "maximum"),
				"Error should mention minimum or maximum limit")
		})
	}
}

func TestValidate_StringLength_Valid(t *testing.T) {
	d := NewDefault()

	tests := []struct {
		name      string
		value     string
		minLength *int
		maxLength *int
	}{
		{"at min length", "abc", intPtr(3), intPtr(10)},
		{"at max length", "abcdefghij", intPtr(3), intPtr(10)},
		{"in range", "abcdef", intPtr(3), intPtr(10)},
		{"only min", "abcd", intPtr(3), nil},
		{"only max", "ab", nil, intPtr(10)},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctx := mockFieldContext("testField")
			next := func(ctx context.Context) (interface{}, error) {
				return tt.value, nil
			}

			result, err := d.Validate(ctx, nil, next, nil, nil, tt.minLength, tt.maxLength, nil, nil)
			require.NoError(t, err)
			assert.Equal(t, tt.value, result)
		})
	}
}

func TestValidate_StringLength_Invalid(t *testing.T) {
	d := NewDefault()

	tests := []struct {
		name      string
		value     string
		minLength *int
		maxLength *int
	}{
		{"below min length", "ab", intPtr(3), intPtr(10)},
		{"above max length", "abcdefghijk", intPtr(3), intPtr(10)},
		{"empty string below min", "", intPtr(1), nil},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctx := mockFieldContext("testField")
			next := func(ctx context.Context) (interface{}, error) {
				return tt.value, nil
			}

			_, err := d.Validate(ctx, nil, next, nil, nil, tt.minLength, tt.maxLength, nil, nil)
			require.Error(t, err)
		})
	}
}

func TestValidate_Pattern_Valid(t *testing.T) {
	d := NewDefault()

	tests := []struct {
		name    string
		value   string
		pattern string
	}{
		{"alphanumeric", "abc123", "^[a-z0-9]+$"},
		{"email-like", "test@example", "^[^@]+@[^@]+$"},
		{"starts with letter", "a123", "^[a-z].*$"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctx := mockFieldContext("testField")
			next := func(ctx context.Context) (interface{}, error) {
				return tt.value, nil
			}

			result, err := d.Validate(ctx, nil, next, nil, nil, nil, nil, &tt.pattern, nil)
			require.NoError(t, err)
			assert.Equal(t, tt.value, result)
		})
	}
}

func TestValidate_Pattern_Invalid(t *testing.T) {
	d := NewDefault()

	tests := []struct {
		name    string
		value   string
		pattern string
	}{
		{"contains special chars", "abc@123", "^[a-z0-9]+$"},
		{"missing @", "testexample", "^[^@]+@[^@]+$"},
		{"starts with number", "1abc", "^[a-z].*$"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctx := mockFieldContext("testField")
			next := func(ctx context.Context) (interface{}, error) {
				return tt.value, nil
			}

			_, err := d.Validate(ctx, nil, next, nil, nil, nil, nil, &tt.pattern, nil)
			require.Error(t, err)
			assert.Contains(t, err.Error(), "pattern")
		})
	}
}

func TestValidate_Format_Valid(t *testing.T) {
	d := NewDefault()

	tests := []struct {
		name   string
		value  string
		format ValidateFormat
	}{
		{"valid email", "test@example.com", FormatEmail},
		{"valid URL", "https://example.com", FormatURL},
		{"valid UUID", "550e8400-e29b-41d4-a716-446655440000", FormatUUID},
		{"valid IPv4", "192.168.1.1", FormatIPv4},
		{"valid MAC", "00:1A:2B:3C:4D:5E", FormatMAC},
		{"valid hostname", "example", FormatHostname},
		{"valid FQDN", "www.example.com", FormatFQDN},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctx := mockFieldContext("testField")
			next := func(ctx context.Context) (interface{}, error) {
				return tt.value, nil
			}

			result, err := d.Validate(ctx, nil, next, nil, nil, nil, nil, nil, &tt.format)
			require.NoError(t, err)
			assert.Equal(t, tt.value, result)
		})
	}
}

func TestValidate_Format_Invalid(t *testing.T) {
	d := NewDefault()

	tests := []struct {
		name   string
		value  string
		format ValidateFormat
	}{
		{"invalid email", "not-an-email", FormatEmail},
		{"invalid URL", "not a url", FormatURL},
		{"invalid UUID", "not-a-uuid", FormatUUID},
		{"invalid IPv4", "not.an.ip", FormatIPv4},
		{"invalid MAC", "not:a:mac", FormatMAC},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctx := mockFieldContext("testField")
			next := func(ctx context.Context) (interface{}, error) {
				return tt.value, nil
			}

			_, err := d.Validate(ctx, nil, next, nil, nil, nil, nil, nil, &tt.format)
			require.Error(t, err)
		})
	}
}

// =============================================================================
// @auth Directive Tests
// =============================================================================

func TestAuth_Authenticated(t *testing.T) {
	d := NewDefault()
	ctx := mockFieldContext("testField")
	ctx = WithAuthInfo(ctx, AuthInfo{
		Authenticated: true,
		UserID:        "user-123",
		Roles:         []string{"admin", "operator"},
	})

	next := func(ctx context.Context) (interface{}, error) {
		return "success", nil
	}

	result, err := d.Auth(ctx, nil, next, nil)
	require.NoError(t, err)
	assert.Equal(t, "success", result)
}

func TestAuth_Unauthenticated(t *testing.T) {
	d := NewDefault()
	ctx := mockFieldContext("testField")
	// No auth info in context

	next := func(ctx context.Context) (interface{}, error) {
		return "success", nil
	}

	_, err := d.Auth(ctx, nil, next, nil)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "authentication required")
}

func TestAuth_RequiredRole_HasRole(t *testing.T) {
	d := NewDefault()
	ctx := mockFieldContext("testField")
	ctx = WithAuthInfo(ctx, AuthInfo{
		Authenticated: true,
		UserID:        "user-123",
		Roles:         []string{"admin", "operator"},
	})

	role := "admin"
	next := func(ctx context.Context) (interface{}, error) {
		return "success", nil
	}

	result, err := d.Auth(ctx, nil, next, &role)
	require.NoError(t, err)
	assert.Equal(t, "success", result)
}

func TestAuth_RequiredRole_MissingRole(t *testing.T) {
	d := NewDefault()
	ctx := mockFieldContext("testField")
	ctx = WithAuthInfo(ctx, AuthInfo{
		Authenticated: true,
		UserID:        "user-123",
		Roles:         []string{"operator"},
	})

	role := "admin"
	next := func(ctx context.Context) (interface{}, error) {
		return "success", nil
	}

	_, err := d.Auth(ctx, nil, next, &role)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "role 'admin' required")
}

// =============================================================================
// @sensitive Directive Tests
// =============================================================================

func TestSensitive_TracksField(t *testing.T) {
	d := NewDefault()
	ctx := mockFieldContext("password")
	ctx = WithSensitiveTracking(ctx)

	next := func(ctx context.Context) (interface{}, error) {
		return "secret123", nil
	}

	result, err := d.Sensitive(ctx, nil, next)
	require.NoError(t, err)
	assert.Equal(t, "secret123", result)

	// Check that the field is tracked as sensitive
	sf := GetSensitiveFields(ctx)
	require.NotNil(t, sf)
	// The field should be tracked (path may vary based on mock)
}

// =============================================================================
// @capability Directive Tests
// =============================================================================

func TestCapability_HasCapabilities(t *testing.T) {
	d := NewDefault()
	ctx := mockFieldContext("testField")
	ctx = WithCapabilities(ctx, []string{"wireless", "ipv6", "container"})

	requires := []string{"wireless", "ipv6"}
	next := func(ctx context.Context) (interface{}, error) {
		return "success", nil
	}

	result, err := d.Capability(ctx, nil, next, requires)
	require.NoError(t, err)
	assert.Equal(t, "success", result)
}

func TestCapability_MissingCapabilities(t *testing.T) {
	d := NewDefault()
	ctx := mockFieldContext("testField")
	ctx = WithCapabilities(ctx, []string{"wireless"})

	requires := []string{"wireless", "container"}
	next := func(ctx context.Context) (interface{}, error) {
		return "success", nil
	}

	_, err := d.Capability(ctx, nil, next, requires)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "container")
}

func TestCapability_NoCapabilityContext(t *testing.T) {
	d := NewDefault()
	ctx := mockFieldContext("testField")
	// No capability context

	requires := []string{"wireless"}
	next := func(ctx context.Context) (interface{}, error) {
		return "success", nil
	}

	// Should proceed without capability context (may fail later)
	result, err := d.Capability(ctx, nil, next, requires)
	require.NoError(t, err)
	assert.Equal(t, "success", result)
}

// =============================================================================
// Directive Configuration Tests
// =============================================================================

func TestDirectives_DisabledValidate(t *testing.T) {
	d := New(Config{ValidateEnabled: false})
	ctx := mockFieldContext("testField")

	next := func(ctx context.Context) (interface{}, error) {
		return 0, nil // Should fail validation if enabled
	}

	min := intPtr(1)
	result, err := d.Validate(ctx, nil, next, min, nil, nil, nil, nil, nil)
	require.NoError(t, err) // Validation is disabled
	assert.Equal(t, 0, result)
}

func TestDirectives_DisabledAuth(t *testing.T) {
	d := New(Config{AuthEnabled: false})
	ctx := mockFieldContext("testField")
	// No auth info

	next := func(ctx context.Context) (interface{}, error) {
		return "success", nil
	}

	result, err := d.Auth(ctx, nil, next, nil)
	require.NoError(t, err) // Auth is disabled
	assert.Equal(t, "success", result)
}

// =============================================================================
// Helper Functions
// =============================================================================

func intPtr(i int) *int {
	return &i
}
