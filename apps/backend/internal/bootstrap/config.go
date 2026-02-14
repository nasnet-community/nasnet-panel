package bootstrap

import (
	"log"
	"runtime"
	"runtime/debug"
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
func ApplyRuntimeConfig(cfg RuntimeConfig) {
	// Set GOMAXPROCS for resource-constrained environments
	runtime.GOMAXPROCS(cfg.GoMaxProcs)
	log.Printf("Runtime: GOMAXPROCS=%d", cfg.GoMaxProcs)

	// Set GC percentage (lower = more aggressive, higher = less frequent)
	debug.SetGCPercent(cfg.GCPercent)
	log.Printf("Runtime: GC percent=%d%%", cfg.GCPercent)

	// Set soft memory limit
	memLimit := cfg.MemoryLimitMB << 20 // Convert MB to bytes
	debug.SetMemoryLimit(memLimit)
	log.Printf("Runtime: Memory limit=%dMB", cfg.MemoryLimitMB)
}
