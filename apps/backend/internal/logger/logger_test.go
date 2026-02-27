package logger

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/zap"

	internalerrors "backend/internal/apperrors"
)

// =============================================================================
// Config Tests
// =============================================================================

func TestDefaultConfig(t *testing.T) {
	cfg := DefaultConfig()

	assert.Equal(t, "info", cfg.Level)
	assert.False(t, cfg.Development)
	assert.True(t, cfg.JSONOutput)
}

func TestDevelopmentConfig(t *testing.T) {
	cfg := DevelopmentConfig()

	assert.Equal(t, "debug", cfg.Level)
	assert.True(t, cfg.Development)
	assert.False(t, cfg.JSONOutput)
}

// =============================================================================
// Logger Initialization Tests
// =============================================================================

func TestNewLogger_DefaultConfig(t *testing.T) {
	cfg := DefaultConfig()
	logger := newLogger(cfg)

	require.NotNil(t, logger)
}

func TestNewLogger_DevelopmentConfig(t *testing.T) {
	cfg := DevelopmentConfig()
	logger := newLogger(cfg)

	require.NotNil(t, logger)
}

func TestNewLogger_AllLogLevels(t *testing.T) {
	levels := []string{"debug", "info", "warn", "error", "unknown"}

	for _, level := range levels {
		t.Run(level, func(t *testing.T) {
			cfg := &Config{
				Level:       level,
				Development: false,
				JSONOutput:  true,
			}
			logger := newLogger(cfg)
			require.NotNil(t, logger)
		})
	}
}

// =============================================================================
// Global Logger Tests
// =============================================================================

func TestL_ReturnsLogger(t *testing.T) {
	logger := L()
	require.NotNil(t, logger)
}

func TestS_ReturnsSugaredLogger(t *testing.T) {
	sugar := S()
	require.NotNil(t, sugar)
}

// =============================================================================
// WithRequestID Tests
// =============================================================================

func TestWithRequestID_AddsField(t *testing.T) {
	ctx := internalerrors.WithRequestID(context.Background(), "test-request-123")
	logger := WithRequestID(ctx)

	require.NotNil(t, logger)
	// Logger should have request_id field (we can't easily verify this without checking)
}

func TestWithRequestID_EmptyRequestID(t *testing.T) {
	ctx := context.Background() // No request ID
	logger := WithRequestID(ctx)

	require.NotNil(t, logger)
	// Should return global logger without panic
}

// =============================================================================
// WithFields Tests
// =============================================================================

func TestWithFields(t *testing.T) {
	logger := WithFields(
		zap.String("key1", "value1"),
		zap.Int("key2", 42),
	)

	require.NotNil(t, logger)
}

// =============================================================================
// Log Functions Don't Panic Tests
// =============================================================================

func TestDebug_NoPanic(t *testing.T) {
	assert.NotPanics(t, func() {
		Debug("test debug message", zap.String("key", "value"))
	})
}

func TestInfo_NoPanic(t *testing.T) {
	assert.NotPanics(t, func() {
		Info("test info message", zap.String("key", "value"))
	})
}

func TestWarn_NoPanic(t *testing.T) {
	assert.NotPanics(t, func() {
		Warn("test warn message", zap.String("key", "value"))
	})
}

func TestError_NoPanic(t *testing.T) {
	assert.NotPanics(t, func() {
		Error("test error message", zap.String("key", "value"))
	})
}

// =============================================================================
// Context Log Functions Tests
// =============================================================================

func TestDebugCtx_NoPanic(t *testing.T) {
	ctx := internalerrors.WithRequestID(context.Background(), "req-123")
	assert.NotPanics(t, func() {
		DebugCtx(ctx, "test debug message", zap.String("key", "value"))
	})
}

func TestInfoCtx_NoPanic(t *testing.T) {
	ctx := internalerrors.WithRequestID(context.Background(), "req-123")
	assert.NotPanics(t, func() {
		InfoCtx(ctx, "test info message", zap.String("key", "value"))
	})
}

func TestWarnCtx_NoPanic(t *testing.T) {
	ctx := internalerrors.WithRequestID(context.Background(), "req-123")
	assert.NotPanics(t, func() {
		WarnCtx(ctx, "test warn message", zap.String("key", "value"))
	})
}

func TestErrorCtx_NoPanic(t *testing.T) {
	ctx := internalerrors.WithRequestID(context.Background(), "req-123")
	assert.NotPanics(t, func() {
		ErrorCtx(ctx, "test error message", zap.String("key", "value"))
	})
}

func TestContextLogFunctions_WithoutRequestID(t *testing.T) {
	ctx := context.Background() // No request ID

	assert.NotPanics(t, func() {
		DebugCtx(ctx, "debug")
		InfoCtx(ctx, "info")
		WarnCtx(ctx, "warn")
		ErrorCtx(ctx, "error")
	})
}

// =============================================================================
// Sync Tests
// =============================================================================

func TestSync_NoPanic(t *testing.T) {
	assert.NotPanics(t, func() {
		err := Sync()
		// Sync may return an error on some platforms (e.g., stdout sync on Windows)
		// but it should not panic
		_ = err
	})
}
