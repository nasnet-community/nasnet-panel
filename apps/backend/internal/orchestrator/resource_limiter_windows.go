//go:build windows

package orchestrator

import (
	"context"
	"fmt"
	"time"

	"backend/internal/events"

	"github.com/rs/zerolog"
)

// ResourceUsage represents resource usage metrics for a process
type ResourceUsage struct {
	MemoryMB uint64    // Memory usage in MB
	PID      int       // Process ID
	Time     time.Time // Time of measurement
}

// ResourceLimiterConfig configures the ResourceLimiter
type ResourceLimiterConfig struct {
	EventBus events.EventBus
	Logger   zerolog.Logger
}

// ResourceLimiter manages cgroup resource limits (stub for Windows)
type ResourceLimiter struct {
	logger zerolog.Logger
}

// NewResourceLimiter creates a new ResourceLimiter instance (stub for Windows)
func NewResourceLimiter(config ResourceLimiterConfig) (*ResourceLimiter, error) {
	return &ResourceLimiter{
		logger: config.Logger,
	}, nil
}

// IsCgroupsEnabled returns false on Windows
func (rl *ResourceLimiter) IsCgroupsEnabled() bool {
	return false
}

// ApplyMemoryLimit applies memory limits to a process (stub for Windows)
func (rl *ResourceLimiter) ApplyMemoryLimit(ctx context.Context, pid int, memoryMB int, instanceID, featureID string) error {
	rl.logger.Warn().Msg("ResourceLimiter is not supported on Windows - cgroups are Linux-only")
	return nil
}

// GetResourceUsage retrieves current resource usage for a process (stub for Windows)
func (rl *ResourceLimiter) GetResourceUsage(pid int) (*ResourceUsage, error) {
	return nil, fmt.Errorf("resource usage monitoring not supported on Windows")
}

// StartMonitoring starts background monitoring for a process (stub for Windows)
func (rl *ResourceLimiter) StartMonitoring(ctx context.Context, pid int, instanceID, featureID string, memoryLimitMB int) error {
	rl.logger.Warn().Msg("Resource monitoring is not supported on Windows")
	return nil
}

// StopMonitoring stops background monitoring for a process (stub for Windows)
func (rl *ResourceLimiter) StopMonitoring(pid int) {
	rl.logger.Warn().Int("pid", pid).Msg("StopMonitoring called but not supported on Windows")
}

// Close shuts down the resource limiter (stub for Windows)
func (rl *ResourceLimiter) Close() error {
	return nil
}
