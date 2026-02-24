//go:build linux

package resources

import (
	"context"
	"fmt"
	"os"
	"sync"
	"time"

	"backend/internal/events"

	"go.uber.org/zap"
)

const (
	// PollingIntervalSeconds is the interval for resource polling (10 seconds)
	PollingIntervalSeconds = 10

	// WarningThresholdPercent is the threshold for emitting resource warnings (80%)
	WarningThresholdPercent = 80.0

	// WarningClearThresholdPercent is the threshold for clearing warnings (hysteresis, 70%)
	WarningClearThresholdPercent = 70.0

	// WarningCooldownMinutes is the cooldown period between warnings for the same instance (5 minutes)
	WarningCooldownMinutes = 5

	// trendSampleCount is the number of recent samples kept for trend detection
	trendSampleCount = 10

	// trendRisingFactor means current > average * 1.1 → RISING
	trendRisingFactor = 1.1

	// trendFallingFactor means current < average * 0.9 → FALLING
	trendFallingFactor = 0.9
)

// MonitoredInstance represents a service instance being monitored for resource usage
type MonitoredInstance struct {
	InstanceID     string
	FeatureID      string
	InstanceName   string
	PID            int
	MemoryLimitMB  int
	LastWarningAt  time.Time // Last time warning was emitted
	InWarningState bool      // Whether currently in warning state (for hysteresis)

	// Circular buffer for trend detection (last trendSampleCount memory samples in MB)
	memorySamples [trendSampleCount]uint64
	sampleIndex   int // Next write position in the circular buffer
	sampleCount   int // How many samples have been written (capped at trendSampleCount)
}

// ResourcePollerConfig configures the ResourcePoller
type ResourcePollerConfig struct {
	ResourceLimiter *ResourceLimiter
	EventBus        events.EventBus
	Logger          *zap.Logger
}

// ResourcePoller monitors resource usage for service instances and emits warnings
type ResourcePoller struct {
	mu        sync.RWMutex
	config    ResourcePollerConfig
	publisher *events.Publisher
	instances map[string]*MonitoredInstance // instanceID -> MonitoredInstance
	logger    *zap.Logger
	ctx       context.Context
	cancel    context.CancelFunc
	wg        sync.WaitGroup
	running   bool
}

// NewResourcePoller creates a new ResourcePoller instance
func NewResourcePoller(config ResourcePollerConfig) (*ResourcePoller, error) {
	if config.ResourceLimiter == nil {
		return nil, fmt.Errorf("ResourceLimiter is required")
	}

	if config.EventBus == nil {
		return nil, fmt.Errorf("EventBus is required")
	}

	rp := &ResourcePoller{
		config:    config,
		publisher: events.NewPublisher(config.EventBus, "resource-poller"),
		instances: make(map[string]*MonitoredInstance),
		logger:    config.Logger,
	}

	if rp.logger == nil {
		rp.logger = zap.NewNop()
	}

	return rp, nil
}

// Start begins the resource monitoring loop
func (rp *ResourcePoller) Start(ctx context.Context) error {
	rp.mu.Lock()
	defer rp.mu.Unlock()

	if rp.running {
		return fmt.Errorf("resource poller already running")
	}

	rp.ctx, rp.cancel = context.WithCancel(ctx)
	rp.running = true

	rp.wg.Add(1)
	go rp.pollerLoop()

	rp.logger.Info("Resource poller started")
	return nil
}

// Stop stops the resource monitoring loop and waits for it to finish
func (rp *ResourcePoller) Stop() error {
	rp.mu.Lock()

	if !rp.running {
		rp.mu.Unlock()
		return fmt.Errorf("resource poller not running")
	}

	rp.cancel()
	rp.running = false
	rp.mu.Unlock()

	// Wait for poller loop to finish
	rp.wg.Wait()

	rp.logger.Info("Resource poller stopped")
	return nil
}

// AddInstance adds a service instance to be monitored
func (rp *ResourcePoller) AddInstance(instanceID, featureID, instanceName string, pid, memoryLimitMB int) error {
	rp.mu.Lock()
	defer rp.mu.Unlock()

	if pid <= 0 {
		return fmt.Errorf("invalid PID: %d", pid)
	}

	if memoryLimitMB <= 0 {
		return fmt.Errorf("invalid memory limit: %d MB", memoryLimitMB)
	}

	rp.instances[instanceID] = &MonitoredInstance{
		InstanceID:     instanceID,
		FeatureID:      featureID,
		InstanceName:   instanceName,
		PID:            pid,
		MemoryLimitMB:  memoryLimitMB,
		LastWarningAt:  time.Time{}, // Zero value = never warned
		InWarningState: false,
	}

	rp.logger.Info("Added instance to resource monitoring",
		zap.String("instance_id", instanceID),
		zap.String("feature_id", featureID),
		zap.Int("pid", pid),
		zap.Int("memory_limit_mb", memoryLimitMB))

	return nil
}

// RemoveInstance removes a service instance from monitoring
func (rp *ResourcePoller) RemoveInstance(instanceID string) {
	rp.mu.Lock()
	defer rp.mu.Unlock()

	if _, exists := rp.instances[instanceID]; exists {
		delete(rp.instances, instanceID)
		rp.logger.Info("Removed instance from resource monitoring",
			zap.String("instance_id", instanceID))
	}
}

// pollerLoop is the main monitoring loop that runs every 10 seconds
func (rp *ResourcePoller) pollerLoop() {
	defer rp.wg.Done()

	ticker := time.NewTicker(PollingIntervalSeconds * time.Second)
	defer ticker.Stop()

	rp.logger.Info("Resource poller loop started",
		zap.Int("interval_seconds", PollingIntervalSeconds),
		zap.Float64("warning_threshold_percent", WarningThresholdPercent))

	for {
		select {
		case <-rp.ctx.Done():
			rp.logger.Info("Resource poller loop stopped")
			return

		case <-ticker.C:
			rp.pollInstances()
		}
	}
}

// pollInstances polls resource usage for all monitored instances
func (rp *ResourcePoller) pollInstances() {
	rp.mu.RLock()
	// Create a snapshot of instances to avoid holding lock during polling
	instances := make([]*MonitoredInstance, 0, len(rp.instances))
	for _, inst := range rp.instances {
		instances = append(instances, inst)
	}
	rp.mu.RUnlock()

	for _, inst := range instances {
		rp.pollInstance(inst)
	}
}

// pollInstance polls resource usage for a single instance
func (rp *ResourcePoller) pollInstance(inst *MonitoredInstance) {
	// Get resource usage from ResourceLimiter
	usage, err := rp.config.ResourceLimiter.GetResourceUsage(inst.PID)
	if err != nil {
		// Check if process no longer exists (ENOENT)
		if os.IsNotExist(err) {
			rp.logger.Warn("Process no longer exists, removing from monitoring",
				zap.String("instance_id", inst.InstanceID),
				zap.Int("pid", inst.PID))
			rp.RemoveInstance(inst.InstanceID)
			return
		}

		rp.logger.Error("Failed to get resource usage",
			zap.Error(err),
			zap.String("instance_id", inst.InstanceID),
			zap.Int("pid", inst.PID))
		return
	}

	// Calculate usage percentage
	usagePercent := float64(usage.MemoryMB) / float64(inst.MemoryLimitMB) * 100

	// Record sample every poll so the trend buffer is always up to date,
	// regardless of whether a warning is emitted this cycle.
	rp.recordSample(inst, usage.MemoryMB)

	rp.logger.Debug("Polled instance resource usage",
		zap.String("instance_id", inst.InstanceID),
		zap.Uint64("memory_mb", usage.MemoryMB),
		zap.Int("limit_mb", inst.MemoryLimitMB),
		zap.Float64("usage_percent", usagePercent),
		zap.Bool("in_warning_state", inst.InWarningState))

	// Check if we should emit a warning
	rp.checkAndEmitWarning(inst, usage, usagePercent)
}

// checkAndEmitWarning checks if a warning should be emitted based on hysteresis and cooldown
func (rp *ResourcePoller) checkAndEmitWarning(inst *MonitoredInstance, usage *ResourceUsage, usagePercent float64) {
	now := time.Now()

	// Hysteresis logic:
	// - Enter warning state at 80% (WarningThresholdPercent)
	// - Exit warning state at 70% (WarningClearThresholdPercent)
	shouldWarn := false

	if !inst.InWarningState && usagePercent >= WarningThresholdPercent {
		// Entering warning state (crossing 80% threshold)
		shouldWarn = true
		inst.InWarningState = true

		rp.logger.Warn("Instance crossed warning threshold",
			zap.String("instance_id", inst.InstanceID),
			zap.Float64("usage_percent", usagePercent),
			zap.Float64("threshold_percent", WarningThresholdPercent))

	} else if inst.InWarningState && usagePercent < WarningClearThresholdPercent {
		// Exiting warning state (dropping below 70% threshold)
		inst.InWarningState = false

		rp.logger.Info("Instance dropped below warning clear threshold",
			zap.String("instance_id", inst.InstanceID),
			zap.Float64("usage_percent", usagePercent),
			zap.Float64("clear_threshold_percent", WarningClearThresholdPercent))

	} else if inst.InWarningState {
		// Already in warning state, check cooldown
		timeSinceLastWarning := now.Sub(inst.LastWarningAt)
		cooldownDuration := WarningCooldownMinutes * time.Minute

		if timeSinceLastWarning >= cooldownDuration {
			shouldWarn = true
			rp.logger.Info("Cooldown expired, re-emitting warning",
				zap.String("instance_id", inst.InstanceID),
				zap.Float64("usage_percent", usagePercent),
				zap.Duration("time_since_last_warning", timeSinceLastWarning))
		}
	}

	// Emit warning if needed
	if shouldWarn {
		rp.emitResourceWarning(inst, usage, usagePercent)
		inst.LastWarningAt = now
	}
}

// emitResourceWarning emits a ResourceWarningEvent
func (rp *ResourcePoller) emitResourceWarning(inst *MonitoredInstance, usage *ResourceUsage, usagePercent float64) {
	event := events.NewResourceWarningEvent(
		inst.InstanceID,
		inst.FeatureID,
		"",                                       // RouterID (not available in poller context)
		"memory",                                 // ResourceType
		fmt.Sprintf("%d MB", usage.MemoryMB),     // CurrentUsage
		fmt.Sprintf("%d MB", inst.MemoryLimitMB), // LimitValue
		usage.Time.Format(time.RFC3339),          // DetectedAt
		fmt.Sprintf("Consider stopping or reducing memory limit for %s", inst.InstanceName), // RecommendedAction
		"",                                    // CgroupPath
		rp.computeTrend(inst, usage.MemoryMB), // TrendDirection
		"resource-poller",
		int(WarningThresholdPercent), // ThresholdPercent
		usagePercent,                 // UsagePercent
	)

	if err := rp.publisher.Publish(rp.ctx, event); err != nil {
		rp.logger.Error("Failed to publish ResourceWarningEvent",
			zap.Error(err),
			zap.String("instance_id", inst.InstanceID))
	} else {
		rp.logger.Warn("Emitted ResourceWarningEvent",
			zap.String("instance_id", inst.InstanceID),
			zap.String("feature_id", inst.FeatureID),
			zap.Float64("usage_percent", usagePercent))
	}
}

// recordSample appends currentMB into inst's circular buffer.
// Called on every poll cycle so the buffer is always current.
func (rp *ResourcePoller) recordSample(inst *MonitoredInstance, currentMB uint64) {
	inst.memorySamples[inst.sampleIndex] = currentMB
	inst.sampleIndex = (inst.sampleIndex + 1) % trendSampleCount
	if inst.sampleCount < trendSampleCount {
		inst.sampleCount++
	}
}

// computeTrend returns the trend direction for inst based on its sample buffer:
//
//	"rising"  – current > average * 1.1
//	"falling" – current < average * 0.9
//	"stable"  – otherwise (including when fewer than 2 samples exist)
func (rp *ResourcePoller) computeTrend(inst *MonitoredInstance, currentMB uint64) string {
	if inst.sampleCount < 2 {
		return "stable"
	}

	var sum uint64
	for i := 0; i < inst.sampleCount; i++ {
		sum += inst.memorySamples[i]
	}
	avg := float64(sum) / float64(inst.sampleCount)
	current := float64(currentMB)

	switch {
	case current > avg*trendRisingFactor:
		return "rising"
	case current < avg*trendFallingFactor:
		return "falling"
	default:
		return "stable"
	}
}

// GetMonitoredInstances returns a copy of currently monitored instances
func (rp *ResourcePoller) GetMonitoredInstances() map[string]*MonitoredInstance {
	rp.mu.RLock()
	defer rp.mu.RUnlock()

	// Return a copy to avoid race conditions
	instances := make(map[string]*MonitoredInstance, len(rp.instances))
	for k, v := range rp.instances {
		// Create a copy of the instance
		instCopy := *v
		instances[k] = &instCopy
	}

	return instances
}
