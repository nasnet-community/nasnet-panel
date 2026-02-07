package services

import (
	"context"
	"fmt"
	"sync"
	"time"

	"backend/internal/events"
	"backend/internal/router"
)

// WANHealthStatus represents the overall health status of a WAN interface.
type WANHealthStatus string

const (
	// WANHealthStatusHealthy indicates all health check targets are reachable.
	WANHealthStatusHealthy WANHealthStatus = "HEALTHY"
	// WANHealthStatusDegraded indicates some (but not all) targets are reachable.
	WANHealthStatusDegraded WANHealthStatus = "DEGRADED"
	// WANHealthStatusDown indicates all health check targets are unreachable.
	WANHealthStatusDown WANHealthStatus = "DOWN"
	// WANHealthStatusUnknown indicates health check is disabled or not configured.
	WANHealthStatusUnknown WANHealthStatus = "UNKNOWN"
)

// HealthCheckTarget represents a single netwatch target.
type HealthCheckTarget struct {
	ID       string // RouterOS .id
	Host     string // Target IP/hostname
	Interval string // Check interval (e.g., "10s")
	Timeout  string // Check timeout (e.g., "2s")
	Status   string // "up" or "down"
	Since    time.Time
}

// WANHealthCheckConfig represents the health check configuration for a WAN interface.
type WANHealthCheckConfig struct {
	Enabled          bool
	Targets          []string // List of target IPs/hostnames to monitor
	Interval         int      // Check interval in seconds (default: 10)
	Timeout          int      // Check timeout in seconds (default: 2)
	FailureThreshold int      // Number of consecutive failures before marking down (default: 3)
}

// WANHealthMonitor monitors WAN interface health using RouterOS netwatch.
type WANHealthMonitor struct {
	routerPort    router.RouterPort
	eventBus      events.EventBus
	eventPublisher *events.Publisher

	// Health check configurations per router per WAN interface
	configs map[string]map[string]*WANHealthCheckConfig // routerID -> wanID -> config
	mu      sync.RWMutex

	// Current health status per router per WAN interface
	status map[string]map[string]WANHealthStatus // routerID -> wanID -> status
	statusMu sync.RWMutex

	// Stop channels for each monitor goroutine
	stopChannels map[string]chan struct{} // routerID-wanID -> stop channel
	stopMu       sync.Mutex

	// Polling interval for checking netwatch status
	pollInterval time.Duration
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
		pollInterval:   10 * time.Second, // Default: check every 10 seconds
	}
}

// ConfigureHealthCheck configures health monitoring for a WAN interface.
func (m *WANHealthMonitor) ConfigureHealthCheck(ctx context.Context, routerID, wanID string, config WANHealthCheckConfig) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	// Initialize router map if needed
	if m.configs[routerID] == nil {
		m.configs[routerID] = make(map[string]*WANHealthCheckConfig)
	}

	// Store config
	m.configs[routerID][wanID] = &config

	// If health check is enabled, start monitoring
	if config.Enabled && len(config.Targets) > 0 {
		if err := m.startMonitoring(ctx, routerID, wanID, &config); err != nil {
			return fmt.Errorf("failed to start health monitoring: %w", err)
		}
	} else {
		// If disabled, stop monitoring
		m.stopMonitoring(routerID, wanID)
		// Set status to UNKNOWN
		m.setHealthStatus(routerID, wanID, WANHealthStatusUnknown)
	}

	return nil
}

// startMonitoring starts health monitoring for a WAN interface.
func (m *WANHealthMonitor) startMonitoring(ctx context.Context, routerID, wanID string, config *WANHealthCheckConfig) error {
	// Stop existing monitoring if any
	m.stopMonitoring(routerID, wanID)

	// Configure netwatch entries on the router
	if err := m.configureNetwatch(ctx, routerID, wanID, config); err != nil {
		return fmt.Errorf("failed to configure netwatch: %w", err)
	}

	// Start background goroutine to poll netwatch status
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
	// Remove existing netwatch entries for this WAN interface
	if err := m.removeNetwatchEntries(ctx, routerID, wanID); err != nil {
		return fmt.Errorf("failed to remove existing netwatch entries: %w", err)
	}

	// Add netwatch entry for each target
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
			return fmt.Errorf("netwatch add command failed for %s: %s", target, result.Error)
		}
	}

	return nil
}

// removeNetwatchEntries removes all netwatch entries associated with a WAN interface.
func (m *WANHealthMonitor) removeNetwatchEntries(ctx context.Context, routerID, wanID string) error {
	// Query existing netwatch entries with matching comment
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
		return fmt.Errorf("netwatch print command failed: %s", result.Error)
	}

	// Remove each entry
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

		if _, err := m.routerPort.ExecuteCommand(ctx, removeCmd); err != nil {
			// Log error but continue removing others
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
			// Poll netwatch status
			if err := m.checkHealth(ctx, routerID, wanID, config); err != nil {
				// Log error but continue monitoring
				continue
			}
		}
	}
}

// checkHealth queries netwatch status and updates health status.
func (m *WANHealthMonitor) checkHealth(ctx context.Context, routerID, wanID string, config *WANHealthCheckConfig) error {
	// Query netwatch entries for this WAN interface
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
		return fmt.Errorf("netwatch print command failed: %s", result.Error)
	}

	// Count reachable vs unreachable targets
	totalTargets := len(result.Data)
	reachableCount := 0

	for _, entry := range result.Data {
		status := entry["status"]
		if status == "up" {
			reachableCount++
		}
	}

	// Aggregate health status based on reachability
	newStatus := m.aggregateHealthStatus(reachableCount, totalTargets)

	// Get current status
	currentStatus := m.getHealthStatus(routerID, wanID)

	// If status changed, update and publish event
	if newStatus != currentStatus {
		m.setHealthStatus(routerID, wanID, newStatus)

		// Publish WANHealthChangedEvent
		event := events.NewWANHealthChangedEvent(
			routerID,
			wanID,
			"", // Interface name (will be populated by caller if needed)
			string(newStatus),
			string(currentStatus),
			"", // Target (aggregate status doesn't have single target)
		)
		event.ConsecutiveSuccesses = reachableCount
		event.LastCheckTime = time.Now()

		if err := m.eventBus.Publish(ctx, event); err != nil {
			// Log error but don't fail
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
		// All targets reachable
		return WANHealthStatusHealthy
	} else if reachableCount > 0 {
		// Some targets reachable
		return WANHealthStatusDegraded
	} else {
		// No targets reachable
		return WANHealthStatusDown
	}
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
