package apperrors

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

// =============================================================================
// Sensitive Key Detection Tests
// =============================================================================

func TestIsSensitiveKey_PasswordPatterns(t *testing.T) {
	sensitiveKeys := []string{
		"password",
		"Password",
		"PASSWORD",
		"user_password",
		"userPassword",
		"passwd",
		"admin_passwd",
	}

	for _, key := range sensitiveKeys {
		t.Run(key, func(t *testing.T) {
			assert.True(t, IsSensitiveKey(key), "Key %q should be detected as sensitive", key)
		})
	}
}

func TestIsSensitiveKey_TokenPatterns(t *testing.T) {
	sensitiveKeys := []string{
		"token",
		"access_token",
		"accessToken",
		"refresh_token",
		"refreshToken",
		"auth_token",
		"bearer_token",
	}

	for _, key := range sensitiveKeys {
		t.Run(key, func(t *testing.T) {
			assert.True(t, IsSensitiveKey(key), "Key %q should be detected as sensitive", key)
		})
	}
}

func TestIsSensitiveKey_APIKeyPatterns(t *testing.T) {
	sensitiveKeys := []string{
		"api_key",
		"apiKey",
		"api-key",
		"apikey",
		"APIKey",
	}

	for _, key := range sensitiveKeys {
		t.Run(key, func(t *testing.T) {
			assert.True(t, IsSensitiveKey(key), "Key %q should be detected as sensitive", key)
		})
	}
}

func TestIsSensitiveKey_SecretPatterns(t *testing.T) {
	sensitiveKeys := []string{
		"secret",
		"client_secret",
		"clientSecret",
		"app_secret",
	}

	for _, key := range sensitiveKeys {
		t.Run(key, func(t *testing.T) {
			assert.True(t, IsSensitiveKey(key), "Key %q should be detected as sensitive", key)
		})
	}
}

func TestIsSensitiveKey_CredentialPatterns(t *testing.T) {
	sensitiveKeys := []string{
		"credential",
		"credentials",
		"user_credential",
	}

	for _, key := range sensitiveKeys {
		t.Run(key, func(t *testing.T) {
			assert.True(t, IsSensitiveKey(key), "Key %q should be detected as sensitive", key)
		})
	}
}

func TestIsSensitiveKey_AuthorizationPatterns(t *testing.T) {
	sensitiveKeys := []string{
		"authorization",
		"Authorization",
		"auth_header",
		"auth_code",
		"authCode",
	}

	for _, key := range sensitiveKeys {
		t.Run(key, func(t *testing.T) {
			assert.True(t, IsSensitiveKey(key), "Key %q should be detected as sensitive", key)
		})
	}
}

func TestIsSensitiveKey_SSHKeyPatterns(t *testing.T) {
	sensitiveKeys := []string{
		"ssh_key",
		"sshKey",
		"ssh-key",
		"private_key",
		"privateKey",
		"private-key",
	}

	for _, key := range sensitiveKeys {
		t.Run(key, func(t *testing.T) {
			assert.True(t, IsSensitiveKey(key), "Key %q should be detected as sensitive", key)
		})
	}
}

func TestIsSensitiveKey_NonSensitive(t *testing.T) {
	nonSensitiveKeys := []string{
		"username",
		"email",
		"name",
		"address",
		"port",
		"host",
		"routerId",
		"status",
		"error_code",
		"message",
	}

	for _, key := range nonSensitiveKeys {
		t.Run(key, func(t *testing.T) {
			assert.False(t, IsSensitiveKey(key), "Key %q should NOT be detected as sensitive", key)
		})
	}
}

// =============================================================================
// Sensitive Value Detection Tests
// =============================================================================

func TestIsSensitiveValue_JWTTokens(t *testing.T) {
	// JWT format: header.payload.signature (base64 encoded)
	jwtToken := "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"

	assert.True(t, IsSensitiveValue(jwtToken))
}

func TestIsSensitiveValue_BearerTokens(t *testing.T) {
	bearerToken := "Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U"

	assert.True(t, IsSensitiveValue(bearerToken))
}

func TestIsSensitiveValue_LongAlphanumeric(t *testing.T) {
	// Long alphanumeric strings often indicate API keys or tokens
	longKey := "abcdefghijklmnopqrstuvwxyz123456"

	assert.True(t, IsSensitiveValue(longKey))
}

func TestIsSensitiveValue_SHA256Hash(t *testing.T) {
	// 64 character hex string
	sha256 := "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"

	assert.True(t, IsSensitiveValue(sha256))
}

func TestIsSensitiveValue_NonSensitive(t *testing.T) {
	nonSensitiveValues := []string{
		"hello",
		"user@example.com",
		"abc123",
		"short",
		"validation failed",
		"router.local",
	}

	for _, value := range nonSensitiveValues {
		t.Run(value, func(t *testing.T) {
			assert.False(t, IsSensitiveValue(value), "Value %q should NOT be detected as sensitive", value)
		})
	}
}

// =============================================================================
// RedactString Tests
// =============================================================================

func TestRedactString_SensitiveKey(t *testing.T) {
	result := RedactString("password", "secret123")
	assert.Equal(t, "[REDACTED]", result)
}

func TestRedactString_SensitiveValue(t *testing.T) {
	jwt := "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U"
	result := RedactString("data", jwt)
	assert.Equal(t, "[REDACTED]", result)
}

func TestRedactString_NonSensitive(t *testing.T) {
	result := RedactString("username", "john")
	assert.Equal(t, "john", result)
}

// =============================================================================
// RedactMap Tests
// =============================================================================

func TestRedactMap_Nil(t *testing.T) {
	result := RedactMap(nil)
	assert.Nil(t, result)
}

func TestRedactMap_Empty(t *testing.T) {
	result := RedactMap(map[string]interface{}{})
	assert.Empty(t, result)
}

func TestRedactMap_MixedContent(t *testing.T) {
	input := map[string]interface{}{
		"username": "john",
		"password": "secret123",
		"api_key":  "key123",
		"routerId": "router-1",
		"error":    "connection failed",
	}

	result := RedactMap(input)

	assert.Equal(t, "john", result["username"])
	assert.Equal(t, "[REDACTED]", result["password"])
	assert.Equal(t, "[REDACTED]", result["api_key"])
	assert.Equal(t, "router-1", result["routerId"])
	assert.Equal(t, "connection failed", result["error"])
}

func TestRedactMap_NestedMap(t *testing.T) {
	input := map[string]interface{}{
		"connection": map[string]interface{}{
			"host":     "192.168.1.1",
			"password": "secret",
		},
	}

	result := RedactMap(input)

	nested := result["connection"].(map[string]interface{})
	// IP addresses are detected as sensitive and redacted
	assert.Equal(t, "[REDACTED]", nested["host"])
	assert.Equal(t, "[REDACTED]", nested["password"])
}

func TestRedactMap_Array(t *testing.T) {
	// Use "items" key (not sensitive) to test value-based redaction within arrays
	input := map[string]interface{}{
		"items": []interface{}{
			"eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U",
			"normal-value",
		},
	}

	result := RedactMap(input)

	items := result["items"].([]interface{})
	assert.Equal(t, "[REDACTED]", items[0])
	assert.Equal(t, "normal-value", items[1])
}

// =============================================================================
// RedactError Tests
// =============================================================================

func TestRedactError_Nil(t *testing.T) {
	result := RedactError(nil)
	assert.Nil(t, result)
}

func TestRedactError_WithSensitiveContext(t *testing.T) {
	err := NewRouterError(CodeAuthFailed, CategoryAuth, "auth failed")
	err.Context["username"] = "john"
	err.Context["password"] = "secret123"

	result := RedactError(err)

	assert.Equal(t, "john", result.Context["username"])
	assert.Equal(t, "[REDACTED]", result.Context["password"])

	// Original should not be modified
	assert.Equal(t, "secret123", err.Context["password"])
}

// =============================================================================
// RedactErrorForProduction Tests
// =============================================================================

func TestRedactErrorForProduction_InternalError(t *testing.T) {
	err := NewInternalError("database connection failed: connection refused", nil)
	err.Context["sql_query"] = "SELECT * FROM users"
	err.Context["stack_trace"] = "at main.go:123"

	result := RedactErrorForProduction(err.RouterError, "req-123")

	// Internal error should have generic message
	assert.Equal(t, "An internal error occurred. Please try again later.", result.Message)
	// Should have request ID
	assert.Equal(t, "req-123", result.Context["requestId"])
	// Should NOT have internal details
	assert.NotContains(t, result.Context, "sql_query")
	assert.NotContains(t, result.Context, "stack_trace")
}

func TestRedactErrorForProduction_ValidationError(t *testing.T) {
	// Use a JWT-like token as the value (detected as sensitive by value pattern)
	sensitiveToken := "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U"
	err := NewValidationError("token_field", sensitiveToken, "invalid format")

	result := RedactErrorForProduction(err.RouterError, "req-456")

	// Message should be preserved for non-internal errors
	assert.Contains(t, result.Message, "token_field")
	// Request ID should be added
	assert.Equal(t, "req-456", result.Context["requestId"])
	// Sensitive values in context should be redacted (JWT detected by value pattern)
	assert.Equal(t, "[REDACTED]", result.Context["value"])
	// Cause should be nil in production
	assert.Nil(t, result.Cause)
}

func TestRedactErrorForProduction_Nil(t *testing.T) {
	result := RedactErrorForProduction(nil, "req-123")
	assert.Nil(t, result)
}

// =============================================================================
// Custom Redactor Tests
// =============================================================================

func TestRedactor_AddPattern(t *testing.T) {
	r := NewRedactor()
	err := r.AddPattern(`(?i)custom_secret`)
	assert.NoError(t, err)

	assert.True(t, r.IsSensitive("custom_secret"))
	assert.True(t, r.IsSensitive("CUSTOM_SECRET"))
}

func TestRedactor_AllowKey(t *testing.T) {
	r := NewRedactor()
	r.AllowKey("password_hash") // Even though it contains "password"

	// Normally "password_hash" would be sensitive due to "password" substring
	assert.True(t, IsSensitiveKey("password_hash"), "Global function should detect password_hash as sensitive")
	// But with AllowKey on the Redactor instance, it's not detected as sensitive by that instance
	assert.False(t, r.IsSensitive("password_hash"), "Redactor.IsSensitive should return false for allowed keys")
}

func TestRedactor_Redact(t *testing.T) {
	r := NewRedactor()
	r.AddPattern(`(?i)custom_field`)
	r.AllowKey("allowed_secret") // Allow a specific key

	input := map[string]interface{}{
		"custom_field":   "should be redacted",
		"allowed_secret": "should NOT be redacted",
		"password":       "should be redacted",
		"username":       "visible",
	}

	result := r.Redact(input)

	assert.Equal(t, "[REDACTED]", result["custom_field"])
	assert.Equal(t, "should NOT be redacted", result["allowed_secret"])
	assert.Equal(t, "[REDACTED]", result["password"])
	assert.Equal(t, "visible", result["username"])
}

func TestRedactor_AddPattern_InvalidRegex(t *testing.T) {
	r := NewRedactor()
	err := r.AddPattern("[invalid")
	assert.Error(t, err, "Should return error for invalid regex pattern")
}

// =============================================================================
// Table-Driven Sensitive Pattern Tests
// =============================================================================

func TestIsSensitiveKey_AllPatterns_TableDriven(t *testing.T) {
	tests := []struct {
		name     string
		keys     []string
		isSensit bool
	}{
		{
			name:     "Password variants",
			keys:     []string{"password", "Password", "PASSWORD", "user_password", "userPassword", "passwd", "admin_passwd"},
			isSensit: true,
		},
		{
			name:     "Token variants",
			keys:     []string{"token", "access_token", "accessToken", "refresh_token", "refreshToken", "auth_token", "bearer_token"},
			isSensit: true,
		},
		{
			name:     "API key variants",
			keys:     []string{"api_key", "apiKey", "api-key", "apikey", "APIKey"},
			isSensit: true,
		},
		{
			name:     "Secret variants",
			keys:     []string{"secret", "client_secret", "clientSecret", "app_secret"},
			isSensit: true,
		},
		{
			name:     "Credential variants",
			keys:     []string{"credential", "credentials", "user_credential"},
			isSensit: true,
		},
		{
			name:     "Authorization variants",
			keys:     []string{"authorization", "Authorization", "auth_header", "auth_code", "authCode"},
			isSensit: true,
		},
		{
			name:     "SSH key variants",
			keys:     []string{"ssh_key", "sshKey", "ssh-key", "private_key", "privateKey", "private-key"},
			isSensit: true,
		},
		{
			name:     "Non-sensitive keys",
			keys:     []string{"username", "email", "name", "address", "port", "host", "routerId", "status"},
			isSensit: false,
		},
	}

	for _, tt := range tests {
		for _, key := range tt.keys {
			t.Run(tt.name+"/"+key, func(t *testing.T) {
				result := IsSensitiveKey(key)
				assert.Equal(t, tt.isSensit, result, "Key %q should have sensitivity=%v", key, tt.isSensit)
			})
		}
	}
}

func TestIsSensitiveValue_Formats_TableDriven(t *testing.T) {
	tests := []struct {
		name        string
		value       string
		isSensitive bool
		description string
	}{
		{
			name:        "JWT token",
			value:       "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
			isSensitive: true,
			description: "JWT format (header.payload.signature)",
		},
		{
			name:        "Bearer token",
			value:       "Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U",
			isSensitive: true,
			description: "Bearer token prefix",
		},
		{
			name:        "Long alphanumeric string",
			value:       "abcdefghijklmnopqrstuvwxyz123456",
			isSensitive: true,
			description: "32+ character alphanumeric string",
		},
		{
			name:        "SHA256 hash",
			value:       "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
			isSensitive: true,
			description: "64 character hex string (SHA256)",
		},
		{
			name:        "Short hostname",
			value:       "router.local",
			isSensitive: false,
			description: "Common hostname",
		},
		{
			name:        "IP address",
			value:       "192.168.1.1",
			isSensitive: true, // IPv4 format is network-identifying info
			description: "IP address",
		},
		{
			name:        "Short string",
			value:       "hello",
			isSensitive: false,
			description: "Short string",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := IsSensitiveValue(tt.value)
			assert.Equal(t, tt.isSensitive, result, tt.description)
		})
	}
}

func TestRedactMap_ComplexStructures_TableDriven(t *testing.T) {
	tests := []struct {
		name   string
		input  map[string]interface{}
		assert func(t *testing.T, result map[string]interface{})
	}{
		{
			name: "Mixed sensitive and non-sensitive fields",
			input: map[string]interface{}{
				"username": "john",
				"password": "secret123",
				"api_key":  "key123",
				"routerId": "router-1",
				"error":    "connection failed",
			},
			assert: func(t *testing.T, result map[string]interface{}) {
				assert.Equal(t, "john", result["username"], "Non-sensitive fields should not be redacted")
				assert.Equal(t, "[REDACTED]", result["password"], "Sensitive fields should be redacted")
				assert.Equal(t, "[REDACTED]", result["api_key"], "Sensitive fields should be redacted")
				assert.Equal(t, "router-1", result["routerId"], "Non-sensitive fields should not be redacted")
				assert.Equal(t, "connection failed", result["error"], "Non-sensitive fields should not be redacted")
			},
		},
		{
			name: "Nested maps with sensitive data",
			input: map[string]interface{}{
				"connection": map[string]interface{}{
					"host":     "192.168.1.1",
					"password": "secret",
					"port":     8728,
				},
			},
			assert: func(t *testing.T, result map[string]interface{}) {
				nested := result["connection"].(map[string]interface{})
				// IPv4 addresses are detected as sensitive and redacted
				assert.Equal(t, "[REDACTED]", nested["host"], "IP addresses match sensitive pattern and should be redacted")
				assert.Equal(t, "[REDACTED]", nested["password"], "Sensitive nested fields should be redacted")
				assert.Equal(t, 8728, nested["port"], "Non-sensitive nested fields should not be redacted")
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := RedactMap(tt.input)
			tt.assert(t, result)
		})
	}
}
