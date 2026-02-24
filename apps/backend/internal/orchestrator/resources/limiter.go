//go:build linux

package resources

import (
	"bufio"
	"context"
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"time"

	"backend/internal/events"

	"go.uber.org/zap"
)

const (
	// MinimumMemoryLimitMB is the minimum allowed memory limit (16MB)
	MinimumMemoryLimitMB = 16

	// SoftLimitPercentage is the percentage of hard limit for soft limit (80%)
	SoftLimitPercentage = 0.8

	// MonitoringIntervalSeconds is the interval for monitoring goroutine (10s)
	MonitoringIntervalSeconds = 10

	// ResourceWarningThreshold is the percentage of memory usage to trigger warning (80%)
	ResourceWarningThreshold = 0.8

	// CgroupBasePath is the base path for cgroups v2
	CgroupBasePath = "/sys/fs/cgroup/nasnet-services"

	// EventTypeResourceWarning is the event type for resource warnings
	EventTypeResourceWarning = "resource.warning"
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
	Logger   *zap.SugaredLogger
}

// ResourceLimiter manages cgroups v2 memory limits for service instances
type ResourceLimiter struct {
	config         ResourceLimiterConfig
	publisher      *events.Publisher
	cgroupsEnabled bool
	mu             sync.RWMutex
	monitors       map[int]context.CancelFunc // PID -> cancel function
	logger         *zap.SugaredLogger
}

// NewResourceLimiter creates a new ResourceLimiter instance
func NewResourceLimiter(config ResourceLimiterConfig) (*ResourceLimiter, error) {
	if config.EventBus == nil {
		return nil, fmt.Errorf("EventBus is required")
	}

	if config.Logger == nil {
		config.Logger = zap.NewNop().Sugar()
	}

	rl := &ResourceLimiter{
		config:    config,
		publisher: events.NewPublisher(config.EventBus, "resource-limiter"),
		monitors:  make(map[int]context.CancelFunc),
		logger:    config.Logger,
	}

	// Check if cgroups v2 is available
	rl.cgroupsEnabled = rl.checkCgroupsAvailability()

	if !rl.cgroupsEnabled {
		rl.logger.Warn("cgroups v2 not available - resource limits will not be enforced")
	} else {
		rl.logger.Info("cgroups v2 available - resource limits enabled")
	}

	return rl, nil
}

// checkCgroupsAvailability checks if cgroups v2 is available
func (rl *ResourceLimiter) checkCgroupsAvailability() bool {
	// Check if /sys/fs/cgroup/cgroup.controllers exists (cgroups v2 indicator)
	if _, err := os.Stat("/sys/fs/cgroup/cgroup.controllers"); err == nil {
		return true
	}

	// Check /proc/mounts for cgroup2
	file, err := os.Open("/proc/mounts")
	if err != nil {
		return false
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := scanner.Text()
		if strings.Contains(line, "cgroup2") {
			return true
		}
	}

	return false
}

// IsCgroupsEnabled returns whether cgroups v2 is available and enabled
func (rl *ResourceLimiter) IsCgroupsEnabled() bool {
	return rl.cgroupsEnabled
}

// ApplyMemoryLimit applies memory limits to a process using cgroups v2
func (rl *ResourceLimiter) ApplyMemoryLimit(ctx context.Context, pid int, memoryMB int, instanceID, featureID string) error {
	if memoryMB < MinimumMemoryLimitMB {
		return fmt.Errorf("memory limit %dMB is below minimum %dMB", memoryMB, MinimumMemoryLimitMB)
	}

	if !rl.cgroupsEnabled {
		rl.logger.Debugw("cgroups not available - skipping memory limit enforcement",
			"pid", pid,
			"memoryMB", memoryMB,
			"instance_id", instanceID)
		return nil
	}

	// Create cgroup directory for this instance (use instance ID for clarity)
	cgroupPath := filepath.Join(CgroupBasePath, instanceID)
	if err := os.MkdirAll(cgroupPath, 0o755); err != nil {
		return fmt.Errorf("failed to create cgroup directory %s: %w", cgroupPath, err)
	}

	// Calculate limits in bytes
	hardLimitBytes := uint64(memoryMB) * 1024 * 1024
	softLimitBytes := uint64(float64(hardLimitBytes) * SoftLimitPercentage)

	// Write hard limit to memory.max
	memoryMaxPath := filepath.Join(cgroupPath, "memory.max")
	if err := os.WriteFile(memoryMaxPath, []byte(fmt.Sprintf("%d", hardLimitBytes)), 0o644); err != nil {
		return fmt.Errorf("failed to write memory.max: %w", err)
	}

	// Write soft limit to memory.high
	memoryHighPath := filepath.Join(cgroupPath, "memory.high")
	if err := os.WriteFile(memoryHighPath, []byte(fmt.Sprintf("%d", softLimitBytes)), 0o644); err != nil {
		return fmt.Errorf("failed to write memory.high: %w", err)
	}

	// Add process to cgroup
	procsPath := filepath.Join(cgroupPath, "cgroup.procs")
	if err := os.WriteFile(procsPath, []byte(fmt.Sprintf("%d", pid)), 0o644); err != nil {
		return fmt.Errorf("failed to add process to cgroup: %w", err)
	}

	rl.logger.Infow("applied memory limits via cgroups v2",
		"pid", pid,
		"memoryMB", memoryMB,
		"instance_id", instanceID,
		"feature_id", featureID,
		"hardLimitBytes", hardLimitBytes,
		"softLimitBytes", softLimitBytes,
		"cgroup_path", cgroupPath)

	return nil
}

// GetResourceUsage reads resource usage from /proc/{pid}/status
func (rl *ResourceLimiter) GetResourceUsage(pid int) (*ResourceUsage, error) {
	statusPath := fmt.Sprintf("/proc/%d/status", pid)
	file, err := os.Open(statusPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open %s: %w", statusPath, err)
	}
	defer file.Close()

	var memoryKB uint64
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := scanner.Text()
		if strings.HasPrefix(line, "VmRSS:") {
			// VmRSS format: "VmRSS:     12345 kB"
			fields := strings.Fields(line)
			if len(fields) >= 2 {
				memoryKB, err = strconv.ParseUint(fields[1], 10, 64)
				if err != nil {
					return nil, fmt.Errorf("failed to parse VmRSS value: %w", err)
				}
				break
			}
		}
	}

	if err := scanner.Err(); err != nil {
		return nil, fmt.Errorf("error reading status file: %w", err)
	}

	return &ResourceUsage{
		MemoryMB: memoryKB / 1024,
		PID:      pid,
		Time:     time.Now(),
	}, nil
}

// StartMonitoring starts monitoring resource usage for a process
func (rl *ResourceLimiter) StartMonitoring(ctx context.Context, pid int, instanceID, featureID string, memoryLimitMB int) error {
	if pid <= 0 {
		return fmt.Errorf("invalid PID: %d", pid)
	}

	// Create a cancellable context for this monitor
	monitorCtx, cancel := context.WithCancel(context.Background())

	rl.mu.Lock()
	// Stop existing monitor if any
	if existingCancel, exists := rl.monitors[pid]; exists {
		existingCancel()
	}
	rl.monitors[pid] = cancel
	rl.mu.Unlock()

	// Start monitoring goroutine
	go rl.monitorLoop(monitorCtx, pid, instanceID, featureID, memoryLimitMB)

	rl.logger.Infow("started resource monitoring",
		"pid", pid,
		"instance_id", instanceID,
		"feature_id", featureID,
		"memoryLimitMB", memoryLimitMB)

	return nil
}

// StopMonitoring stops monitoring for a process
func (rl *ResourceLimiter) StopMonitoring(pid int) {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	if cancel, exists := rl.monitors[pid]; exists {
		cancel()
		delete(rl.monitors, pid)
		rl.logger.Infow("stopped resource monitoring", "pid", pid)
	}
}

// monitorLoop is the monitoring goroutine that polls resource usage
func (rl *ResourceLimiter) monitorLoop(ctx context.Context, pid int, instanceID, featureID string, memoryLimitMB int) {
	ticker := time.NewTicker(MonitoringIntervalSeconds * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			usage, err := rl.GetResourceUsage(pid)
			if err != nil {
				// Process might have exited
				rl.logger.Debugw("failed to get resource usage - process may have exited", "pid", pid, "instance_id", instanceID, "error", err)
				return
			}

			// Check if memory usage exceeds threshold
			usagePercent := float64(usage.MemoryMB) / float64(memoryLimitMB)
			if usagePercent >= ResourceWarningThreshold {
				rl.emitResourceWarning(ctx, instanceID, featureID, pid, usage, memoryLimitMB)
			}
		}
	}
}

// emitResourceWarning emits a ResourceWarningEvent
func (rl *ResourceLimiter) emitResourceWarning(ctx context.Context, instanceID, featureID string, pid int, usage *ResourceUsage, limitMB int) {
	usagePercent := float64(usage.MemoryMB) / float64(limitMB) * 100

	// Use the ResourceWarningEvent from domain_events_extended.go
	event := events.NewResourceWarningEvent(
		instanceID,
		featureID,
		"",       // routerID
		"memory", // resourceType
		fmt.Sprintf("%.0fMB", float64(usage.MemoryMB)), // currentUsage
		fmt.Sprintf("%dMB", limitMB),                   // limitValue
		time.Now().UTC().Format(time.RFC3339),          // detectedAt
		"consider reducing memory usage",               // recommendedAction
		"",                                             // cgroupPath
		"",                                             // trendDirection
		"resource-limiter",                             // source
		int(ResourceWarningThreshold*100),              // thresholdPercent
		usagePercent,                                   // usagePercent
	)

	if err := rl.publisher.Publish(ctx, event); err != nil {
		rl.logger.Errorw("failed to publish resource warning event",
			"error", err,
			"pid", pid,
			"instance_id", instanceID,
			"memoryMB", usage.MemoryMB)
	} else {
		rl.logger.Warnw("resource warning: memory usage exceeds threshold",
			"pid", pid,
			"instance_id", instanceID,
			"feature_id", featureID,
			"memoryMB", usage.MemoryMB,
			"limitMB", limitMB,
			"usagePercent", usagePercent)
	}
}

// Close cleans up resources
func (rl *ResourceLimiter) Close() error {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	// Stop all monitors
	for pid, cancel := range rl.monitors {
		cancel()
		rl.logger.Debugw("stopped monitoring during cleanup", "pid", pid)
	}
	rl.monitors = make(map[int]context.CancelFunc)

	return nil
}
