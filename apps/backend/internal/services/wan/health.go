package wan

import (
	"context"
	"fmt"
	"sync"
	"time"

	"backend/internal/events"
	"backend/internal/router"
)

// WANHealthStatus represents the overall health status of a WAN interface.
//
//nolint:revive // exported WAN type
type WANHealthStatus string

const (
	WANHealthStatusHealthy  WANHealthStatus = "HEALTHY"
	WANHealthStatusDegraded WANHealthStatus = "DEGRADED"
	WANHealthStatusDown     WANHealthStatus = "DOWN"
	WANHealthStatusUnknown  WANHealthStatus = "UNKNOWN"
)

// HealthCheckTarget represents a single netwatch target.
type HealthCheckTarget struct {
	ID       string
	Host     string
	Interval string
	Timeout  string
	Status   string
	Since    time.Time
}

// WANHealthCheckConfig represents the health check configuration for a WAN interface.
//
//nolint:revive // exported WAN type
type WANHealthCheckConfig struct {
	Enabled          bool
	Targets          []string
	Interval         int
	Timeout          int
	FailureThreshold int
}

// WANHealthMonitor monitors WAN interface health using RouterOS netwatch.
//
//nolint:revive // exported WAN type
type WANHealthMonitor struct {
	routerPort     router.RouterPort
	eventBus       events.EventBus
	eventPublisher *events.Publisher
	configs        map[string]map[string]*WANHealthCheckConfig
	mu             sync.RWMutex
	status         map[string]map[string]WANHealthStatus
	statusMu       sync.RWMutex
	stopChannels   map[string]chan struct{}
	stopMu         sync.Mutex
	pollInterval   time.Duration
}

// NewWANHealthMonitor creates a new WAN health monitor.
func NewWANHealthMonitor(routerPort router.RouterPort, eventBus events.EventBus) *WANHealthMonitor {
	return &WANHealthMonitor{
		routerPort:     routerPort,
		eventBus:       eventBus,
		eventPublisher: events.NewPublisher(eventBus, "wan-health-monitor"),
		configs:        make(map[string]map[string]*WANHealthCheckConfig),
		status:         make(map[string]map[string]WANHealthStatus),
		stopChannels:   make(map[string]chan struct{}),
		pollInterval:   10 * time.Second,
	}
}

// ConfigureHealthCheck configures health monitoring for a WAN interface.
func (m *WANHealthMonitor) ConfigureHealthCheck(ctx context.Context, routerID, wanID string, config WANHealthCheckConfig) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if m.configs[routerID] == nil {
		m.configs[routerID] = make(map[string]*WANHealthCheckConfig)
	}

	m.configs[routerID][wanID] = &config

	if config.Enabled && len(config.Targets) > 0 {
		if err := m.startMonitoring(ctx, routerID, wanID, &config); err != nil {
			return fmt.Errorf("failed to start health monitoring: %w", err)
		}
	} else {
		m.stopMonitoring(routerID, wanID)
		m.setHealthStatus(routerID, wanID, WANHealthStatusUnknown)
	}

	return nil
}

// startMonitoring starts health monitoring for a WAN interface.
func (m *WANHealthMonitor) startMonitoring(ctx context.Context, routerID, wanID string, config *WANHealthCheckConfig) error {
	m.stopMonitoring(routerID, wanID)

	if err := m.configureNetwatch(ctx, routerID, wanID, config); err != nil {
		return fmt.Errorf("failed to configure netwatch: %w", err)
	}

	stopChan := make(chan struct{})
	m.stopMu.Lock()
	m.stopChannels[routerID+"-"+wanID] = stopChan
	m.stopMu.Unlock()

	go m.monitorLoop(ctx, routerID, wanID, config, stopChan)

	return nil
}

// stopMonitoring stops health monitoring for a WAN interface.
func (m *WANHealthMonitor) stopMonitoring(routerID, wanID string) {
	m.stopMu.Lock()
	defer m.stopMu.Unlock()

	key := routerID + "-" + wanID
	if stopChan, exists := m.stopChannels[key]; exists {
		close(stopChan)
		delete(m.stopChannels, key)
	}
}

// configureNetwatch configures RouterOS netwatch entries for health check targets.
func (m *WANHealthMonitor) configureNetwatch(ctx context.Context, routerID, wanID string, config *WANHealthCheckConfig) error {
	if err := m.removeNetwatchEntries(ctx, routerID, wanID); err != nil {
		return fmt.Errorf("failed to remove existing netwatch entries: %w", err)
	}

	for _, target := range config.Targets {
		cmd := router.Command{
			Path:   "/tool/netwatch",
			Action: "add",
			Args: map[string]string{
				"host":     target,
				"interval": fmt.Sprintf("%ds", config.Interval),
				"timeout":  fmt.Sprintf("%ds", config.Timeout),
				"comment":  fmt.Sprintf("WAN Health Check: %s", wanID),
			},
		}

		result, err := m.routerPort.ExecuteCommand(ctx, cmd)
		if err != nil {
			return fmt.Errorf("failed to add netwatch entry for %s: %w", target, err)
		}
		if !result.Success {
			return fmt.Errorf("netwatch add command failed for %s: %w", target, result.Error)
		}
	}

	return nil
}

// removeNetwatchEntries removes all netwatch entries associated with a WAN interface.
func (m *WANHealthMonitor) removeNetwatchEntries(ctx context.Context, _routerID, wanID string) error {
	cmd := router.Command{
		Path:   "/tool/netwatch",
		Action: "print",
		Args: map[string]string{
			"?comment": fmt.Sprintf("WAN Health Check: %s", wanID),
		},
	}

	result, err := m.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return fmt.Errorf("failed to query netwatch entries: %w", err)
	}
	if !result.Success {
		return fmt.Errorf("netwatch print command failed: %w", result.Error)
	}

	for _, entry := range result.Data {
		id, ok := entry[".id"]
		if !ok {
			continue
		}

		removeCmd := router.Command{
			Path:   "/tool/netwatch",
			Action: "remove",
			Args: map[string]string{
				".id": id,
			},
		}

		if _, removeErr := m.routerPort.ExecuteCommand(ctx, removeCmd); removeErr != nil {
			continue
		}
	}

	return nil
}

// monitorLoop is the background goroutine that polls netwatch status.
func (m *WANHealthMonitor) monitorLoop(ctx context.Context, routerID, wanID string, config *WANHealthCheckConfig, stopChan chan struct{}) {
	ticker := time.NewTicker(m.pollInterval)
	defer ticker.Stop()

	for {
		select {
		case <-stopChan:
			return
		case <-ctx.Done():
			return
		case <-ticker.C:
			if err := m.checkHealth(ctx, routerID, wanID, config); err != nil {
				continue
			}
		}
	}
}

// checkHealth queries netwatch status and updates health status.
func (m *WANHealthMonitor) checkHealth(ctx context.Context, routerID, wanID string, _config *WANHealthCheckConfig) error {
	cmd := router.Command{
		Path:   "/tool/netwatch",
		Action: "print",
		Args: map[string]string{
			"?comment": fmt.Sprintf("WAN Health Check: %s", wanID),
		},
	}

	result, err := m.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return fmt.Errorf("failed to query netwatch status: %w", err)
	}
	if !result.Success {
		return fmt.Errorf("netwatch print command failed: %w", result.Error)
	}

	totalTargets := len(result.Data)
	reachableCount := 0

	for _, entry := range result.Data {
		status := entry["status"]
		if status == "up" {
			reachableCount++
		}
	}

	newStatus := m.aggregateHealthStatus(reachableCount, totalTargets)
	currentStatus := m.getHealthStatus(routerID, wanID)

	if newStatus != currentStatus {
		m.setHealthStatus(routerID, wanID, newStatus)

		event := events.NewWANHealthChangedEvent(
			routerID,
			wanID,
			"",
			string(newStatus),
			string(currentStatus),
			"",
		)
		event.ConsecutiveSuccesses = reachableCount
		event.LastCheckTime = time.Now()

		if err := m.eventBus.Publish(ctx, event); err != nil {
			// Log error but don't fail - no-op
			_ = err
		}
	}

	return nil
}

// aggregateHealthStatus determines overall health status based on target reachability.
func (m *WANHealthMonitor) aggregateHealthStatus(reachableCount, totalTargets int) WANHealthStatus {
	if totalTargets == 0 {
		return WANHealthStatusUnknown
	}

	if reachableCount == totalTargets {
		return WANHealthStatusHealthy
	}
	if reachableCount > 0 {
		return WANHealthStatusDegraded
	}
	return WANHealthStatusDown
}

// getHealthStatus retrieves the current health status for a WAN interface.
func (m *WANHealthMonitor) getHealthStatus(routerID, wanID string) WANHealthStatus {
	m.statusMu.RLock()
	defer m.statusMu.RUnlock()

	if routerStatus, exists := m.status[routerID]; exists {
		if status, exists := routerStatus[wanID]; exists {
			return status
		}
	}

	return WANHealthStatusUnknown
}

// setHealthStatus updates the health status for a WAN interface.
func (m *WANHealthMonitor) setHealthStatus(routerID, wanID string, status WANHealthStatus) {
	m.statusMu.Lock()
	defer m.statusMu.Unlock()

	if m.status[routerID] == nil {
		m.status[routerID] = make(map[string]WANHealthStatus)
	}

	m.status[routerID][wanID] = status
}

// GetHealthStatus returns the current health status for a WAN interface (public API).
func (m *WANHealthMonitor) GetHealthStatus(routerID, wanID string) WANHealthStatus {
	return m.getHealthStatus(routerID, wanID)
}

// Shutdown gracefully stops all health monitoring.
func (m *WANHealthMonitor) Shutdown() {
	m.stopMu.Lock()
	defer m.stopMu.Unlock()

	for key, stopChan := range m.stopChannels {
		close(stopChan)
		delete(m.stopChannels, key)
	}
}
