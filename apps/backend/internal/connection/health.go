package connection

import (
	"context"
	"sync"
	"time"

	"go.uber.org/zap"

	"backend/internal/events"
)

// HealthMonitor provides background health monitoring for connections
// during circuit breaker OPEN state.
type HealthMonitor struct {
	manager    *Manager
	logger     *zap.Logger
	eventBus   events.EventBus
	interval   time.Duration
	timeout    time.Duration
	mu         sync.RWMutex
	monitoring map[string]context.CancelFunc
}

// NewHealthMonitor creates a new health monitor.
func NewHealthMonitor(manager *Manager, eventBus events.EventBus, logger *zap.Logger) *HealthMonitor {
	// Validate required parameters
	if manager == nil {
		panic("manager cannot be nil")
	}
	if logger == nil {
		panic("logger cannot be nil")
	}

	return &HealthMonitor{
		manager:    manager,
		logger:     logger.Named("health-monitor"),
		eventBus:   eventBus,
		interval:   30 * time.Second,
		timeout:    5 * time.Second,
		monitoring: make(map[string]context.CancelFunc),
	}
}

// StartBackgroundMonitoring starts health checks for a router in OPEN circuit breaker state.
// This continues even when the circuit breaker is open to detect recovery.
func (h *HealthMonitor) StartBackgroundMonitoring(routerID string) {
	h.mu.Lock()

	// Cancel any existing monitoring for this router
	if cancel, exists := h.monitoring[routerID]; exists {
		cancel()
	}

	ctx, cancel := context.WithCancel(context.Background())
	h.monitoring[routerID] = cancel
	h.mu.Unlock()

	go h.backgroundHealthCheck(ctx, routerID)
}

// StopBackgroundMonitoring stops health monitoring for a router.
func (h *HealthMonitor) StopBackgroundMonitoring(routerID string) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if cancel, exists := h.monitoring[routerID]; exists {
		cancel()
		delete(h.monitoring, routerID)
	}
}

// StopAll stops all background monitoring.
func (h *HealthMonitor) StopAll() {
	h.mu.Lock()
	defer h.mu.Unlock()

	for _, cancel := range h.monitoring {
		cancel()
	}
	h.monitoring = make(map[string]context.CancelFunc)
}

// backgroundHealthCheck performs periodic health checks for a router.
func (h *HealthMonitor) backgroundHealthCheck(ctx context.Context, routerID string) {
	ticker := time.NewTicker(h.interval)
	defer ticker.Stop()

	h.logger.Info("starting background health monitoring",
		zap.String("routerID", routerID),
		zap.Duration("interval", h.interval),
	)

	for {
		select {
		case <-ctx.Done():
			h.logger.Info("stopped background health monitoring",
				zap.String("routerID", routerID),
			)
			return

		case <-ticker.C:
			h.performHealthCheck(ctx, routerID)
		}
	}
}

// performHealthCheck performs a single health check.
func (h *HealthMonitor) performHealthCheck(ctx context.Context, routerID string) {
	conn, err := h.manager.GetConnection(routerID)
	if err != nil {
		h.logger.Debug("connection not found during health check",
			zap.String("routerID", routerID),
		)
		return
	}

	// Only check if circuit breaker is open
	if conn.CircuitBreaker == nil || !conn.CircuitBreaker.IsOpen() {
		return
	}

	h.logger.Debug("performing background health check",
		zap.String("routerID", routerID),
	)

	// Try a lightweight probe
	config := conn.Config()
	checkCtx, cancel := context.WithTimeout(ctx, h.timeout)
	defer cancel()

	// Create a temporary client for probing
	if h.manager.clientFactory == nil {
		h.logger.Debug("background health check: client factory is nil",
			zap.String("routerID", routerID),
		)
		return
	}

	client, err := h.manager.clientFactory.CreateClient(checkCtx, config)
	if err != nil {
		h.logger.Debug("background health check: client creation failed",
			zap.String("routerID", routerID),
			zap.Error(err),
		)
		return
	}

	// Try to connect
	if err := client.Connect(checkCtx); err != nil {
		h.logger.Debug("background health check: connection failed",
			zap.String("routerID", routerID),
			zap.Error(err),
		)
		return
	}

	// Connection successful - ping to verify
	if err := client.Ping(checkCtx); err != nil {
		h.logger.Debug("background health check: ping failed",
			zap.String("routerID", routerID),
			zap.Error(err),
		)
		_ = client.Disconnect() //nolint:errcheck // best-effort cleanup of temporary probe client
		return
	}

	// Health check passed!
	h.logger.Info("background health check passed - router recovered",
		zap.String("routerID", routerID),
	)

	_ = client.Disconnect() //nolint:errcheck // best-effort cleanup of temporary probe client

	// Publish health check event
	h.publishHealthCheckEvent(checkCtx, routerID, true)
}

// publishHealthCheckEvent publishes a health check event.
func (h *HealthMonitor) publishHealthCheckEvent(ctx context.Context, routerID string, passed bool) {
	if h.eventBus == nil {
		return
	}

	// Use the existing MetricUpdatedEvent for health check results
	values := map[string]string{
		"passed":    boolToString(passed),
		"timestamp": time.Now().Format(time.RFC3339),
	}

	event := events.NewMetricUpdatedEvent(routerID, "health_check", values, "health-monitor")

	pubCtx, cancel := context.WithTimeout(ctx, 100*time.Millisecond)
	defer cancel()

	if err := h.eventBus.Publish(pubCtx, event); err != nil {
		h.logger.Warn("failed to publish health check event",
			zap.String("routerID", routerID),
			zap.Error(err),
		)
	}
}

func boolToString(b bool) string {
	if b {
		return "true"
	}
	return "false"
}

// HealthResult represents the result of a health check.
type HealthResult struct {
	RouterID       string    `json:"routerId"`
	Healthy        bool      `json:"healthy"`
	CheckedAt      time.Time `json:"checkedAt"`
	ResponseTimeMs int64     `json:"responseTimeMs,omitempty"`
	Error          string    `json:"error,omitempty"`
}

// CheckHealth performs an immediate health check on a connection.
func (h *HealthMonitor) CheckHealth(ctx context.Context, routerID string) (*HealthResult, error) {
	conn, err := h.manager.GetConnection(routerID)
	if err != nil {
		return nil, err
	}

	result := &HealthResult{
		RouterID:  routerID,
		CheckedAt: time.Now(),
	}

	client := conn.GetClient()
	if client == nil || !client.IsConnected() {
		result.Healthy = false
		result.Error = "not connected"
		return result, nil
	}

	// Perform ping with timing
	start := time.Now()
	pingCtx, cancel := context.WithTimeout(ctx, h.timeout)
	defer cancel()

	if err := client.Ping(pingCtx); err != nil {
		result.Healthy = false
		result.Error = err.Error()
		result.ResponseTimeMs = time.Since(start).Milliseconds()
		return result, nil
	}

	result.Healthy = true
	result.ResponseTimeMs = time.Since(start).Milliseconds()

	// Record in connection status
	conn.Status.RecordHealthCheck(true)

	return result, nil
}

// IsHealthy returns true if the connection to a router is healthy.
func (h *HealthMonitor) IsHealthy(routerID string) bool {
	// Validate manager and pool
	if h.manager == nil {
		return false
	}

	conn := h.manager.pool.Get(routerID)
	if conn == nil {
		return false
	}

	status := conn.GetStatus()
	return status.State == StateConnected && status.HealthChecksFailed == 0
}

// GetHealthStats returns health statistics for a router.
func (h *HealthMonitor) GetHealthStats(routerID string) (*HealthStats, error) {
	conn, err := h.manager.GetConnection(routerID)
	if err != nil {
		return nil, err
	}

	status := conn.GetStatus()
	return &HealthStats{
		RouterID:          routerID,
		ConsecutivePassed: status.HealthChecksPassed,
		ConsecutiveFailed: status.HealthChecksFailed,
		LastCheck:         status.LastHealthCheck,
		IsHealthy:         status.State == StateConnected && status.HealthChecksFailed == 0,
	}, nil
}

// HealthStats contains health statistics for a connection.
type HealthStats struct {
	RouterID          string     `json:"routerId"`
	ConsecutivePassed int        `json:"consecutivePassed"`
	ConsecutiveFailed int        `json:"consecutiveFailed"`
	LastCheck         *time.Time `json:"lastCheck,omitempty"`
	IsHealthy         bool       `json:"isHealthy"`
}
