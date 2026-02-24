package health

import (
	"context"
	"sync"
	"time"

	"backend/internal/orchestrator/types"

	"backend/internal/events"

	"go.uber.org/zap"
)

const (
	// Scheduler tick interval - checks for due probes every 1 second
	healthCheckTickInterval = 1 * time.Second

	// Maximum concurrent health check goroutines
	maxConcurrentProbes = 5

	// Default health check settings
	defaultCheckInterval    = 30 * time.Second
	defaultFailureThreshold = 3
	defaultProbeTimeout     = 5 * time.Second
	defaultAutoRestart      = true

	// Min/max bounds for configurable settings
	minCheckInterval    = 10 * time.Second
	maxCheckInterval    = 5 * time.Minute
	minFailureThreshold = 1
	maxFailureThreshold = 10
)

// State represents the health status of a service instance
//
//nolint:revive // stuttering name kept for clarity as the primary state enum in the health package
type HealthState string

const (
	HealthStateHealthy   HealthState = "HEALTHY"   // All probes passing
	HealthStateUnhealthy HealthState = "UNHEALTHY" // Consecutive failures exceeded threshold
	HealthStateUnknown   HealthState = "UNKNOWN"   // Not yet checked or no probe configured
	HealthStateChecking  HealthState = "CHECKING"  // Probe in progress
)

// ConnectionState represents the connection status from a probe
type ConnectionState string

const (
	ConnectionStateConnected  ConnectionState = "CONNECTED"  // Probe succeeded
	ConnectionStateConnecting ConnectionState = "CONNECTING" // Probe in progress
	ConnectionStateFailed     ConnectionState = "FAILED"     // Probe failed
)

// InstanceHealthState tracks health status for a single service instance
type InstanceHealthState struct {
	InstanceID       string
	FeatureID        string
	RouterID         string
	Probe            types.HealthProbe
	CheckInterval    time.Duration
	FailureThreshold int
	AutoRestart      bool

	// Scheduling
	NextCheckAt   time.Time
	LastCheckedAt time.Time
	LastHealthyAt time.Time

	// Health tracking
	CurrentState     HealthState
	ConsecutiveFails int
	LastLatency      time.Duration
	LastError        error

	// Process tracking
	ProcessAlive     bool
	ConnectionStatus ConnectionState

	mu sync.RWMutex // Protects all fields
}

// RestartRequest represents a request to restart a service instance
type RestartRequest struct {
	InstanceID string
	Reason     string
}

// Checker is the central health monitoring service
// It uses a single-threaded scheduler with a 1s ticker for efficiency
//
//nolint:revive // stuttering name kept for clarity as the primary exported type in the health package
type HealthChecker struct {
	instances      map[string]*InstanceHealthState
	mu             sync.RWMutex
	ticker         *time.Ticker
	ctx            context.Context
	cancel         context.CancelFunc
	wg             sync.WaitGroup
	logger         *zap.Logger
	eventPublisher *events.Publisher
	restartChan    chan<- RestartRequest

	// Concurrency control
	probeSemaphore chan struct{} // Limits concurrent probe goroutines
}

// NewHealthChecker creates a new health checker service
func NewHealthChecker(logger *zap.Logger, eventPublisher *events.Publisher, restartChan chan<- RestartRequest) *HealthChecker {
	if logger == nil {
		logger = zap.NewNop()
	}
	ctx, cancel := context.WithCancel(context.Background())
	return &HealthChecker{
		instances:      make(map[string]*InstanceHealthState),
		ctx:            ctx,
		cancel:         cancel,
		logger:         logger.With(zap.String("component", "health_checker")),
		eventPublisher: eventPublisher,
		restartChan:    restartChan,
		probeSemaphore: make(chan struct{}, maxConcurrentProbes),
	}
}

// Start begins the health check scheduler
func (hc *HealthChecker) Start() {
	hc.logger.Info("Starting health checker service")
	hc.ticker = time.NewTicker(healthCheckTickInterval)

	hc.wg.Add(1)
	go hc.schedulerLoop()
}

// Stop stops the health checker and waits for all probes to complete
func (hc *HealthChecker) Stop() {
	hc.logger.Info("Stopping health checker service")
	hc.cancel()

	if hc.ticker != nil {
		hc.ticker.Stop()
	}

	hc.wg.Wait()
	hc.logger.Info("Health checker service stopped")
}

// schedulerLoop is the main scheduling loop that runs every 1s
// It scans all instances and spawns probe goroutines for due checks
func (hc *HealthChecker) schedulerLoop() {
	defer hc.wg.Done()

	for {
		select {
		case <-hc.ctx.Done():
			return
		case now := <-hc.ticker.C:
			hc.processDueChecks(now)
		}
	}
}

// processDueChecks scans all instances and checks those due for health check
// This is O(n) but runs every 1s, so it's efficient for typical instance counts
func (hc *HealthChecker) processDueChecks(now time.Time) {
	hc.mu.RLock()
	dueInstances := make([]*InstanceHealthState, 0)

	for _, state := range hc.instances {
		state.mu.RLock()
		if now.After(state.NextCheckAt) || now.Equal(state.NextCheckAt) {
			dueInstances = append(dueInstances, state)
		}
		state.mu.RUnlock()
	}
	hc.mu.RUnlock()

	// Spawn probe goroutines for due instances (bounded by semaphore)
	for _, state := range dueInstances {
		// Non-blocking send - if semaphore is full, skip this check
		select {
		case hc.probeSemaphore <- struct{}{}:
			hc.wg.Add(1)
			go hc.performHealthCheck(state)
		default:
			hc.logger.Warn("Skipped health check - max concurrent probes reached", zap.String("instance_id", state.InstanceID))
		}
	}
}

// performHealthCheck executes a health probe for a single instance
func (hc *HealthChecker) performHealthCheck(state *InstanceHealthState) {
	defer hc.wg.Done()
	defer func() { <-hc.probeSemaphore }() // Release semaphore

	// Update state to CHECKING
	state.mu.Lock()
	previousState := state.CurrentState
	state.CurrentState = HealthStateChecking
	state.ConnectionStatus = ConnectionStateConnecting
	state.mu.Unlock()

	// Perform the probe with timeout
	ctx, cancel := context.WithTimeout(hc.ctx, defaultProbeTimeout)
	defer cancel()

	result := CheckWithResult(ctx, state.Probe)

	// Update state based on result
	state.mu.Lock()
	defer state.mu.Unlock()

	now := time.Now()
	state.LastCheckedAt = now
	state.LastLatency = result.Latency
	state.LastError = result.Error
	state.ProcessAlive = result.Healthy // Assuming probe checks process

	if result.Healthy {
		// Success - reset failure counter
		state.ConsecutiveFails = 0
		state.CurrentState = HealthStateHealthy
		state.ConnectionStatus = ConnectionStateConnected
		state.LastHealthyAt = now
	} else {
		// Failure - increment counter
		state.ConsecutiveFails++
		state.ConnectionStatus = ConnectionStateFailed

		if state.ConsecutiveFails >= state.FailureThreshold {
			state.CurrentState = HealthStateUnhealthy
		} else {
			// Still failing but under threshold - keep previous state
			state.CurrentState = previousState
		}

		hc.logger.Warn("Health check failed", zap.String("instance_id", state.InstanceID), zap.String("feature_id", state.FeatureID), zap.Int("consecutive_fails", state.ConsecutiveFails), zap.Int("threshold", state.FailureThreshold), zap.Error(result.Error))
	}

	// Schedule next check
	state.NextCheckAt = now.Add(state.CheckInterval)

	// Publish health event if state changed
	if previousState != state.CurrentState {
		hc.publishHealthEvent(state, previousState)
	}

	// Trigger restart if unhealthy and auto-restart enabled
	if state.CurrentState == HealthStateUnhealthy && state.AutoRestart {
		hc.requestRestart(state)
	}
}
