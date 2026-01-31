package errors

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"go.uber.org/zap/zaptest/observer"
)

// =============================================================================
// LogLevel Tests
// =============================================================================

func TestLogLevel_AuthCategory(t *testing.T) {
	// Auth errors should be INFO level (expected behavior)
	level := LogLevel(CategoryAuth)
	assert.Equal(t, zapcore.InfoLevel, level)
}

func TestLogLevel_ValidationCategory(t *testing.T) {
	// Validation errors should be WARN level
	level := LogLevel(CategoryValidation)
	assert.Equal(t, zapcore.WarnLevel, level)
}

func TestLogLevel_InternalCategory(t *testing.T) {
	// Internal errors should be ERROR level
	level := LogLevel(CategoryInternal)
	assert.Equal(t, zapcore.ErrorLevel, level)
}

func TestLogLevel_ProtocolCategory(t *testing.T) {
	// Protocol errors should be WARN level
	level := LogLevel(CategoryProtocol)
	assert.Equal(t, zapcore.WarnLevel, level)
}

func TestLogLevel_NetworkCategory(t *testing.T) {
	// Network errors should be WARN level
	level := LogLevel(CategoryNetwork)
	assert.Equal(t, zapcore.WarnLevel, level)
}

func TestLogLevel_PlatformCategory(t *testing.T) {
	// Platform errors should be WARN level
	level := LogLevel(CategoryPlatform)
	assert.Equal(t, zapcore.WarnLevel, level)
}

func TestLogLevel_ResourceCategory(t *testing.T) {
	// Resource errors should be WARN level
	level := LogLevel(CategoryResource)
	assert.Equal(t, zapcore.WarnLevel, level)
}

// =============================================================================
// ErrorFields Tests
// =============================================================================

func TestErrorFields_RouterError(t *testing.T) {
	err := NewRouterError(CodeValidationFailed, CategoryValidation, "test message")
	err.Recoverable = true
	err.Context["field"] = "username"

	fields := ErrorFields(err)

	// Convert to map for easier assertion
	fieldMap := fieldsToMap(fields)

	assert.Equal(t, CodeValidationFailed, fieldMap["error_code"])
	assert.Equal(t, "validation", fieldMap["error_category"])
	assert.Equal(t, "test message", fieldMap["error_message"])
	assert.Equal(t, true, fieldMap["recoverable"])
}

func TestErrorFields_WithSensitiveContext(t *testing.T) {
	err := NewRouterError(CodeAuthFailed, CategoryAuth, "auth failed")
	err.Context["username"] = "john"
	err.Context["password"] = "secret123"

	fields := ErrorFields(err)
	fieldMap := fieldsToMap(fields)

	// Context should be redacted
	ctx := fieldMap["context"].(map[string]interface{})
	assert.Equal(t, "john", ctx["username"])
	assert.Equal(t, "[REDACTED]", ctx["password"])
}

func TestErrorFields_WithCause(t *testing.T) {
	cause := errors.New("underlying error")
	err := NewRouterError(CodeProtocolError, CategoryProtocol, "protocol error").
		WithCause(cause)

	fields := ErrorFields(err)
	fieldMap := fieldsToMap(fields)

	// Should indicate presence of cause without exposing details
	assert.Equal(t, true, fieldMap["has_cause"])
}

func TestErrorFields_UnknownError(t *testing.T) {
	err := errors.New("unknown error")
	fields := ErrorFields(err)
	fieldMap := fieldsToMap(fields)

	assert.Equal(t, "unknown", fieldMap["error_type"])
	assert.Equal(t, "unknown error", fieldMap["error_message"])
}

// =============================================================================
// LogError Tests
// =============================================================================

func TestLogError_ValidationError(t *testing.T) {
	core, logs := observer.New(zapcore.DebugLevel)
	logger := zap.New(core)

	// Use the embedded RouterError directly to avoid type extraction issues
	valErr := NewValidationError("email", "invalid", "invalid format")
	LogError(logger, valErr.RouterError)

	require.Equal(t, 1, logs.Len())
	entry := logs.All()[0]

	// Validation errors should be WARN level
	assert.Equal(t, zapcore.WarnLevel, entry.Level)
	assert.Contains(t, entry.Message, "email")

	// Check fields
	fields := entryFieldsToMap(entry)
	assert.Equal(t, CodeValidationFailed, fields["error_code"])
	assert.Equal(t, "validation", fields["error_category"])
}

func TestLogError_AuthError(t *testing.T) {
	core, logs := observer.New(zapcore.DebugLevel)
	logger := zap.New(core)

	// Use the embedded RouterError directly
	authErr := NewAuthError(CodeSessionExpired, "session expired")
	LogError(logger, authErr.RouterError)

	require.Equal(t, 1, logs.Len())
	entry := logs.All()[0]

	// Auth errors should be INFO level
	assert.Equal(t, zapcore.InfoLevel, entry.Level)
}

func TestLogError_InternalError(t *testing.T) {
	core, logs := observer.New(zapcore.DebugLevel)
	logger := zap.New(core)

	err := NewInternalError("database error", nil)
	LogError(logger, err.RouterError)

	require.Equal(t, 1, logs.Len())
	entry := logs.All()[0]

	// Internal errors should be ERROR level
	assert.Equal(t, zapcore.ErrorLevel, entry.Level)
}

func TestLogError_UnknownError(t *testing.T) {
	core, logs := observer.New(zapcore.DebugLevel)
	logger := zap.New(core)

	err := errors.New("random error")
	LogError(logger, err)

	require.Equal(t, 1, logs.Len())
	entry := logs.All()[0]

	// Unknown errors should be ERROR level
	assert.Equal(t, zapcore.ErrorLevel, entry.Level)
	assert.Contains(t, entry.Message, "random error")
}

// =============================================================================
// LogErrorCtx Tests
// =============================================================================

func TestLogErrorCtx_WithRequestID(t *testing.T) {
	core, logs := observer.New(zapcore.DebugLevel)
	logger := zap.New(core)

	ctx := WithRequestID(context.Background(), "req-12345")
	err := NewValidationError("field", "value", "constraint")
	LogErrorCtx(ctx, logger, err.RouterError)

	require.Equal(t, 1, logs.Len())
	entry := logs.All()[0]

	fields := entryFieldsToMap(entry)
	assert.Equal(t, "req-12345", fields["request_id"])
}

func TestLogErrorCtx_WithoutRequestID(t *testing.T) {
	core, logs := observer.New(zapcore.DebugLevel)
	logger := zap.New(core)

	ctx := context.Background()
	err := NewValidationError("field", "value", "constraint")
	LogErrorCtx(ctx, logger, err.RouterError)

	require.Equal(t, 1, logs.Len())
	// Should still log, just without request_id field
}

// =============================================================================
// LogErrorWithDuration Tests
// =============================================================================

func TestLogErrorWithDuration(t *testing.T) {
	core, logs := observer.New(zapcore.DebugLevel)
	logger := zap.New(core)

	err := NewProtocolError(CodeConnectionTimeout, "connection timed out", "SSH")
	duration := 5 * time.Second
	LogErrorWithDuration(logger, err.RouterError, duration)

	require.Equal(t, 1, logs.Len())
	entry := logs.All()[0]

	fields := entryFieldsToMap(entry)
	// Duration should be logged
	assert.Contains(t, fields, "duration")
}

// =============================================================================
// LogErrorCtxWithDuration Tests
// =============================================================================

func TestLogErrorCtxWithDuration(t *testing.T) {
	core, logs := observer.New(zapcore.DebugLevel)
	logger := zap.New(core)

	ctx := WithRequestID(context.Background(), "req-67890")
	err := NewNetworkError(CodeNetworkTimeout, "timeout", "192.168.1.1")
	duration := 10 * time.Second
	LogErrorCtxWithDuration(ctx, logger, err.RouterError, duration)

	require.Equal(t, 1, logs.Len())
	entry := logs.All()[0]

	fields := entryFieldsToMap(entry)
	assert.Equal(t, "req-67890", fields["request_id"])
	assert.Contains(t, fields, "duration")
}

// =============================================================================
// ErrorLogger Tests
// =============================================================================

func TestErrorLogger_Log(t *testing.T) {
	core, logs := observer.New(zapcore.DebugLevel)
	logger := zap.New(core)

	el := NewErrorLogger(logger)
	err := NewValidationError("port", 70000, "must be <= 65535")
	el.Log(err.RouterError)

	require.Equal(t, 1, logs.Len())
	entry := logs.All()[0]
	assert.Equal(t, zapcore.WarnLevel, entry.Level)
}

func TestErrorLogger_LogCtx(t *testing.T) {
	core, logs := observer.New(zapcore.DebugLevel)
	logger := zap.New(core)

	el := NewErrorLogger(logger)
	ctx := WithRequestID(context.Background(), "test-req-123")
	err := NewAuthError(CodeAuthFailed, "auth failed")
	el.LogCtx(ctx, err.RouterError)

	require.Equal(t, 1, logs.Len())
	entry := logs.All()[0]

	fields := entryFieldsToMap(entry)
	assert.Equal(t, "test-req-123", fields["request_id"])
}

func TestErrorLogger_LogWithDuration(t *testing.T) {
	core, logs := observer.New(zapcore.DebugLevel)
	logger := zap.New(core)

	el := NewErrorLogger(logger)
	err := NewProtocolError(CodeConnectionFailed, "failed", "SSH")
	el.LogWithDuration(err.RouterError, 2*time.Second)

	require.Equal(t, 1, logs.Len())
	entry := logs.All()[0]

	fields := entryFieldsToMap(entry)
	assert.Contains(t, fields, "duration")
}

func TestErrorLogger_With(t *testing.T) {
	core, logs := observer.New(zapcore.DebugLevel)
	logger := zap.New(core)

	el := NewErrorLogger(logger)
	elWithFields := el.With(zap.String("router_id", "router-1"))
	err := NewProtocolError(CodeConnectionFailed, "failed", "SSH")
	elWithFields.Log(err.RouterError)

	require.Equal(t, 1, logs.Len())
	entry := logs.All()[0]

	fields := entryFieldsToMap(entry)
	assert.Equal(t, "router-1", fields["router_id"])
}

func TestErrorLogger_WithRequestID(t *testing.T) {
	core, logs := observer.New(zapcore.DebugLevel)
	logger := zap.New(core)

	el := NewErrorLogger(logger)
	ctx := WithRequestID(context.Background(), "ctx-req-456")
	elWithReqID := el.WithRequestID(ctx)
	err := NewValidationError("field", "value", "constraint")
	elWithReqID.Log(err.RouterError)

	require.Equal(t, 1, logs.Len())
	entry := logs.All()[0]

	fields := entryFieldsToMap(entry)
	assert.Equal(t, "ctx-req-456", fields["request_id"])
}

func TestErrorLogger_WithRequestID_NoRequestID(t *testing.T) {
	core, logs := observer.New(zapcore.DebugLevel)
	logger := zap.New(core)

	el := NewErrorLogger(logger)
	ctx := context.Background() // No request ID
	elWithReqID := el.WithRequestID(ctx)
	err := NewValidationError("field", "value", "constraint")
	elWithReqID.Log(err.RouterError)

	require.Equal(t, 1, logs.Len())
	// Should work fine, just without the request_id field
}

// =============================================================================
// Helper Functions
// =============================================================================

func fieldsToMap(fields []zap.Field) map[string]interface{} {
	result := make(map[string]interface{})
	for _, f := range fields {
		switch f.Type {
		case zapcore.StringType:
			result[f.Key] = f.String
		case zapcore.BoolType:
			result[f.Key] = f.Integer == 1
		case zapcore.Int64Type:
			result[f.Key] = f.Integer
		case zapcore.DurationType:
			result[f.Key] = time.Duration(f.Integer)
		default:
			if f.Interface != nil {
				result[f.Key] = f.Interface
			}
		}
	}
	return result
}

func entryFieldsToMap(entry observer.LoggedEntry) map[string]interface{} {
	result := make(map[string]interface{})
	for _, f := range entry.Context {
		switch f.Type {
		case zapcore.StringType:
			result[f.Key] = f.String
		case zapcore.BoolType:
			result[f.Key] = f.Integer == 1
		case zapcore.Int64Type:
			result[f.Key] = f.Integer
		case zapcore.DurationType:
			result[f.Key] = time.Duration(f.Integer)
		default:
			if f.Interface != nil {
				result[f.Key] = f.Interface
			}
		}
	}
	return result
}
