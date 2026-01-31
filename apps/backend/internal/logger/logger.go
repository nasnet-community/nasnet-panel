// Package logger provides structured logging for NasNetConnect using zap.
// It supports JSON output format for log aggregation and search.
package logger

import (
	"context"
	"os"
	"sync"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"

	internalerrors "backend/internal/errors"
)

var (
	// global logger instance
	globalLogger *zap.Logger
	globalSugar  *zap.SugaredLogger
	once         sync.Once
)

// Config holds logger configuration options.
type Config struct {
	// Level is the minimum log level (debug, info, warn, error)
	Level string
	// Development enables development mode (console output, stack traces)
	Development bool
	// JSONOutput enables JSON output format (for production log aggregation)
	JSONOutput bool
}

// DefaultConfig returns the default logger configuration.
func DefaultConfig() *Config {
	return &Config{
		Level:       "info",
		Development: false,
		JSONOutput:  true,
	}
}

// DevelopmentConfig returns configuration for development mode.
func DevelopmentConfig() *Config {
	return &Config{
		Level:       "debug",
		Development: true,
		JSONOutput:  false,
	}
}

// Init initializes the global logger with the given configuration.
// It is safe to call multiple times; only the first call takes effect.
func Init(cfg *Config) {
	once.Do(func() {
		if cfg == nil {
			cfg = DefaultConfig()
		}
		globalLogger = newLogger(cfg)
		globalSugar = globalLogger.Sugar()
	})
}

// newLogger creates a new zap logger with the given configuration.
func newLogger(cfg *Config) *zap.Logger {
	var level zapcore.Level
	switch cfg.Level {
	case "debug":
		level = zapcore.DebugLevel
	case "info":
		level = zapcore.InfoLevel
	case "warn":
		level = zapcore.WarnLevel
	case "error":
		level = zapcore.ErrorLevel
	default:
		level = zapcore.InfoLevel
	}

	encoderConfig := zapcore.EncoderConfig{
		TimeKey:        "timestamp",
		LevelKey:       "level",
		NameKey:        "logger",
		CallerKey:      "caller",
		FunctionKey:    zapcore.OmitKey,
		MessageKey:     "message",
		StacktraceKey:  "stacktrace",
		LineEnding:     zapcore.DefaultLineEnding,
		EncodeLevel:    zapcore.LowercaseLevelEncoder,
		EncodeTime:     zapcore.ISO8601TimeEncoder,
		EncodeDuration: zapcore.MillisDurationEncoder,
		EncodeCaller:   zapcore.ShortCallerEncoder,
	}

	var encoder zapcore.Encoder
	if cfg.JSONOutput {
		encoder = zapcore.NewJSONEncoder(encoderConfig)
	} else {
		encoderConfig.EncodeLevel = zapcore.CapitalColorLevelEncoder
		encoder = zapcore.NewConsoleEncoder(encoderConfig)
	}

	core := zapcore.NewCore(
		encoder,
		zapcore.AddSync(os.Stdout),
		level,
	)

	opts := []zap.Option{
		zap.AddCaller(),
	}

	if cfg.Development {
		opts = append(opts, zap.Development())
	}

	return zap.New(core, opts...)
}

// L returns the global logger. Init must be called first.
func L() *zap.Logger {
	if globalLogger == nil {
		Init(nil)
	}
	return globalLogger
}

// S returns the global sugared logger. Init must be called first.
func S() *zap.SugaredLogger {
	if globalSugar == nil {
		Init(nil)
	}
	return globalSugar
}

// Sync flushes any buffered log entries.
func Sync() error {
	if globalLogger != nil {
		return globalLogger.Sync()
	}
	return nil
}

// WithRequestID returns a logger with request ID field.
func WithRequestID(ctx context.Context) *zap.Logger {
	requestID := internalerrors.GetRequestID(ctx)
	if requestID == "" {
		return L()
	}
	return L().With(zap.String("request_id", requestID))
}

// WithFields returns a logger with additional fields.
func WithFields(fields ...zap.Field) *zap.Logger {
	return L().With(fields...)
}

// Debug logs a debug message.
func Debug(msg string, fields ...zap.Field) {
	L().Debug(msg, fields...)
}

// Info logs an info message.
func Info(msg string, fields ...zap.Field) {
	L().Info(msg, fields...)
}

// Warn logs a warning message.
func Warn(msg string, fields ...zap.Field) {
	L().Warn(msg, fields...)
}

// Error logs an error message.
func Error(msg string, fields ...zap.Field) {
	L().Error(msg, fields...)
}

// Fatal logs a fatal message and exits.
func Fatal(msg string, fields ...zap.Field) {
	L().Fatal(msg, fields...)
}

// DebugCtx logs a debug message with request context.
func DebugCtx(ctx context.Context, msg string, fields ...zap.Field) {
	WithRequestID(ctx).Debug(msg, fields...)
}

// InfoCtx logs an info message with request context.
func InfoCtx(ctx context.Context, msg string, fields ...zap.Field) {
	WithRequestID(ctx).Info(msg, fields...)
}

// WarnCtx logs a warning message with request context.
func WarnCtx(ctx context.Context, msg string, fields ...zap.Field) {
	WithRequestID(ctx).Warn(msg, fields...)
}

// ErrorCtx logs an error message with request context.
func ErrorCtx(ctx context.Context, msg string, fields ...zap.Field) {
	WithRequestID(ctx).Error(msg, fields...)
}
