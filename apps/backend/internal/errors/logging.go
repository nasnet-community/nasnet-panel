package errors

import (
	"context"
	"time"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

// LogLevel maps an error category to an appropriate log level.
// - Auth errors (failed login attempts) are INFO (expected behavior)
// - Validation errors are WARN (client mistakes)
// - Internal errors are ERROR (requires attention)
func LogLevel(category ErrorCategory) zapcore.Level {
	switch category {
	case CategoryAuth:
		// Auth failures are expected operational events
		return zapcore.InfoLevel
	case CategoryValidation:
		// Validation errors indicate client mistakes
		return zapcore.WarnLevel
	case CategoryInternal:
		// Internal errors require investigation
		return zapcore.ErrorLevel
	case CategoryProtocol, CategoryNetwork:
		// Protocol/network errors may indicate infrastructure issues
		return zapcore.WarnLevel
	case CategoryPlatform, CategoryResource:
		// Platform/resource errors are operational
		return zapcore.WarnLevel
	default:
		return zapcore.ErrorLevel
	}
}

// ErrorFields returns structured zap fields for a RouterError.
// Sensitive data is automatically redacted.
func ErrorFields(err error) []zap.Field {
	routerErr := GetRouterError(err)
	if routerErr == nil {
		return []zap.Field{
			zap.String("error_type", "unknown"),
			zap.String("error_message", err.Error()),
		}
	}

	fields := []zap.Field{
		zap.String("error_code", routerErr.Code),
		zap.String("error_category", string(routerErr.Category)),
		zap.String("error_message", routerErr.Message),
		zap.Bool("recoverable", routerErr.Recoverable),
	}

	// Add redacted context
	if len(routerErr.Context) > 0 {
		redactedCtx := RedactMap(routerErr.Context)
		fields = append(fields, zap.Any("context", redactedCtx))
	}

	// Add cause if present (redacted)
	if routerErr.Cause != nil {
		// Don't log the full cause in production - could contain sensitive info
		fields = append(fields, zap.Bool("has_cause", true))
	}

	return fields
}

// LogError logs an error with appropriate level and structured fields.
// The logger parameter should be a zap.Logger instance.
func LogError(logger *zap.Logger, err error) {
	routerErr := GetRouterError(err)

	var level zapcore.Level
	var msg string

	if routerErr != nil {
		level = LogLevel(routerErr.Category)
		msg = routerErr.Message
	} else {
		level = zapcore.ErrorLevel
		msg = err.Error()
	}

	fields := ErrorFields(err)

	switch level {
	case zapcore.DebugLevel:
		logger.Debug(msg, fields...)
	case zapcore.InfoLevel:
		logger.Info(msg, fields...)
	case zapcore.WarnLevel:
		logger.Warn(msg, fields...)
	case zapcore.ErrorLevel:
		logger.Error(msg, fields...)
	case zapcore.DPanicLevel, zapcore.PanicLevel, zapcore.FatalLevel, zapcore.InvalidLevel:
		logger.Error(msg, fields...)
	default:
		logger.Error(msg, fields...)
	}
}

// LogErrorCtx logs an error with context (request ID) and appropriate level.
func LogErrorCtx(ctx context.Context, logger *zap.Logger, err error) {
	requestID := GetRequestID(ctx)

	// Add request ID to the logger
	if requestID != "" {
		logger = logger.With(zap.String("request_id", requestID))
	}

	LogError(logger, err)
}

// LogErrorWithDuration logs an error with duration information.
// Useful for logging errors from operations with timing.
func LogErrorWithDuration(logger *zap.Logger, err error, duration time.Duration) {
	routerErr := GetRouterError(err)

	var level zapcore.Level
	var msg string

	if routerErr != nil {
		level = LogLevel(routerErr.Category)
		msg = routerErr.Message
	} else {
		level = zapcore.ErrorLevel
		msg = err.Error()
	}

	fields := ErrorFields(err)
	fields = append(fields, zap.Duration("duration", duration))

	switch level {
	case zapcore.DebugLevel:
		logger.Debug(msg, fields...)
	case zapcore.InfoLevel:
		logger.Info(msg, fields...)
	case zapcore.WarnLevel:
		logger.Warn(msg, fields...)
	case zapcore.ErrorLevel:
		logger.Error(msg, fields...)
	case zapcore.DPanicLevel, zapcore.PanicLevel, zapcore.FatalLevel, zapcore.InvalidLevel:
		logger.Error(msg, fields...)
	default:
		logger.Error(msg, fields...)
	}
}

// LogErrorCtxWithDuration combines context and duration logging.
func LogErrorCtxWithDuration(ctx context.Context, logger *zap.Logger, err error, duration time.Duration) {
	requestID := GetRequestID(ctx)

	if requestID != "" {
		logger = logger.With(zap.String("request_id", requestID))
	}

	LogErrorWithDuration(logger, err, duration)
}

// ErrorLogger provides a convenient interface for error logging.
type ErrorLogger struct {
	logger *zap.Logger
}

// NewErrorLogger creates a new ErrorLogger with the given zap.Logger.
func NewErrorLogger(logger *zap.Logger) *ErrorLogger {
	return &ErrorLogger{logger: logger}
}

// Log logs an error at the appropriate level.
func (el *ErrorLogger) Log(err error) {
	LogError(el.logger, err)
}

// LogCtx logs an error with context.
func (el *ErrorLogger) LogCtx(ctx context.Context, err error) {
	LogErrorCtx(ctx, el.logger, err)
}

// LogWithDuration logs an error with duration.
func (el *ErrorLogger) LogWithDuration(err error, duration time.Duration) {
	LogErrorWithDuration(el.logger, err, duration)
}

// LogCtxWithDuration logs an error with context and duration.
func (el *ErrorLogger) LogCtxWithDuration(ctx context.Context, err error, duration time.Duration) {
	LogErrorCtxWithDuration(ctx, el.logger, err, duration)
}

// With returns a new ErrorLogger with additional fields.
func (el *ErrorLogger) With(fields ...zap.Field) *ErrorLogger {
	return &ErrorLogger{logger: el.logger.With(fields...)}
}

// WithRequestID returns a new ErrorLogger with request ID from context.
func (el *ErrorLogger) WithRequestID(ctx context.Context) *ErrorLogger {
	requestID := GetRequestID(ctx)
	if requestID == "" {
		return el
	}
	return el.With(zap.String("request_id", requestID))
}
