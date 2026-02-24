package bootstrap

import (
	"errors"
	"runtime"
	"runtime/debug"

	"go.uber.org/zap"
)

// RuntimeConfig holds runtime-specific configuration settings.
type RuntimeConfig struct {
	// GoMaxProcs sets the maximum number of OS threads
	GoMaxProcs int
	// GCPercent sets the garbage collection target percentage
	GCPercent int
	// MemoryLimitMB sets the soft memory limit in megabytes
	MemoryLimitMB int64
	// ScannerWorkers sets the number of concurrent scanner workers
	ScannerWorkers int
	// EventBusBufferSize sets the event bus buffer size
	EventBusBufferSize int
}

// DefaultProdRuntimeConfig returns production-optimized runtime settings.
func DefaultProdRuntimeConfig() RuntimeConfig {
	return RuntimeConfig{
		GoMaxProcs:         1,
		GCPercent:          10,
		MemoryLimitMB:      32,
		ScannerWorkers:     2,
		EventBusBufferSize: 256,
	}
}

// DefaultDevRuntimeConfig returns development-optimized runtime settings.
func DefaultDevRuntimeConfig() RuntimeConfig {
	return RuntimeConfig{
		GoMaxProcs:         2,
		GCPercent:          100, // Default Go GC
		MemoryLimitMB:      128,
		ScannerWorkers:     4,
		EventBusBufferSize: 1024,
	}
}

// ApplyRuntimeConfig applies runtime configuration settings.
// This configures GOMAXPROCS, GC percentage, and memory limits.
// Returns an error if the configuration values are invalid.
func ApplyRuntimeConfig(cfg RuntimeConfig, logger *zap.SugaredLogger) error {
	// Validate configuration values
	if cfg.GoMaxProcs < 1 {
		return errors.New("GoMaxProcs must be at least 1")
	}
	if cfg.GCPercent < 0 {
		return errors.New("GCPercent must be non-negative")
	}
	if cfg.MemoryLimitMB < 1 {
		return errors.New("MemoryLimitMB must be at least 1")
	}
	if cfg.ScannerWorkers < 1 {
		return errors.New("ScannerWorkers must be at least 1")
	}
	if cfg.EventBusBufferSize < 1 {
		return errors.New("EventBusBufferSize must be at least 1")
	}

	// Set GOMAXPROCS for resource-constrained environments
	runtime.GOMAXPROCS(cfg.GoMaxProcs)
	logger.Infow("Runtime configuration", zap.String("component", "GOMAXPROCS"), zap.Int("value", cfg.GoMaxProcs))

	// Set GC percentage (lower = more aggressive, higher = less frequent)
	debug.SetGCPercent(cfg.GCPercent)
	logger.Infow("Runtime configuration", zap.String("component", "GC percent"), zap.Int("value", cfg.GCPercent))

	// Set soft memory limit
	memLimit := cfg.MemoryLimitMB << 20 // Convert MB to bytes
	debug.SetMemoryLimit(memLimit)
	logger.Infow("Runtime configuration", zap.String("component", "Memory limit"), zap.String("value", "MB"), zap.Int64("megabytes", cfg.MemoryLimitMB))

	return nil
}
