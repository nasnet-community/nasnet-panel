package services

import (
	"context"
	"testing"
	"time"

	"backend/internal/events"
	"backend/internal/router"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestNewWANHealthMonitor tests health monitor creation.
func TestNewWANHealthMonitor(t *testing.T) {
	mockPort := router.NewMockAdapter("test-router")
	mockBus := events.NewInMemoryEventBus()

	monitor := NewWANHealthMonitor(mockPort, mockBus)

	require.NotNil(t, monitor)
	assert.NotNil(t, monitor.routerPort)
	assert.NotNil(t, monitor.eventBus)
	assert.NotNil(t, monitor.eventPublisher)
	assert.NotNil(t, monitor.configs)
	assert.NotNil(t, monitor.status)
	assert.NotNil(t, monitor.stopChannels)
	assert.Equal(t, 10*time.Second, monitor.pollInterval)
}

// TestConfigureHealthCheck tests configuring health check with netwatch.
func TestConfigureHealthCheck(t *testing.T) {
	mockPort := router.NewMockAdapter("test-router")
	mockBus := events.NewInMemoryEventBus()

	// Mock netwatch responses
	mockPort.SetMockResponse("/tool/netwatch/print", router.CommandResult{
		Success: true,
		Data:    []map[string]string{}, // No existing entries
	})

	mockPort.SetMockResponse("/tool/netwatch/add", router.CommandResult{
		Success: true,
		Data:    []map[string]string{},
	})

	monitor := NewWANHealthMonitor(mockPort, mockBus)
	ctx := context.Background()
	routerID := "router-123"
	wanID := "wan1"

	config := WANHealthCheckConfig{
		Enabled:          true,
		Targets:          []string{"1.1.1.1", "8.8.8.8"},
		Interval:         10,
		Timeout:          2,
		FailureThreshold: 3,
	}

	err := monitor.ConfigureHealthCheck(ctx, routerID, wanID, config)
	require.NoError(t, err)

	// Verify config was stored
	monitor.mu.RLock()
	storedConfig := monitor.configs[routerID][wanID]
	monitor.mu.RUnlock()

	require.NotNil(t, storedConfig)
	assert.True(t, storedConfig.Enabled)
	assert.Len(t, storedConfig.Targets, 2)
	assert.Equal(t, 10, storedConfig.Interval)
}

// TestConfigureHealthCheckRemovesExisting tests removing existing netwatch entries.
func TestConfigureHealthCheckRemovesExisting(t *testing.T) {
	mockPort := router.NewMockAdapter("test-router")
	mockBus := events.NewInMemoryEventBus()

	// First print: return existing entries
	printCallCount := 0
	mockPort.SetMockResponseFn("/tool/netwatch/print", func(cmd router.Command) router.CommandResult {
		printCallCount++
		if printCallCount == 1 {
			// First call: return existing entries
			return router.CommandResult{
				Success: true,
				Data: []map[string]string{
					{
						".id":     "*OLD1",
						"host":    "1.1.1.1",
						"comment": "WAN Health Check: wan1",
					},
					{
						".id":     "*OLD2",
						"host":    "8.8.8.8",
						"comment": "WAN Health Check: wan1",
					},
				},
			}
		}
		// Subsequent calls: no entries
		return router.CommandResult{
			Success: true,
			Data:    []map[string]string{},
		}
	})

	removeCallCount := 0
	mockPort.SetMockResponseFn("/tool/netwatch/remove", func(cmd router.Command) router.CommandResult {
		removeCallCount++
		id := cmd.Args[".id"]
		assert.Contains(t, []string{"*OLD1", "*OLD2"}, id)
		return router.CommandResult{Success: true}
	})

	mockPort.SetMockResponse("/tool/netwatch/add", router.CommandResult{
		Success: true,
	})

	monitor := NewWANHealthMonitor(mockPort, mockBus)
	ctx := context.Background()
	routerID := "router-123"
	wanID := "wan1"

	config := WANHealthCheckConfig{
		Enabled:          true,
		Targets:          []string{"1.1.1.1"},
		Interval:         10,
		Timeout:          2,
		FailureThreshold: 3,
	}

	err := monitor.ConfigureHealthCheck(ctx, routerID, wanID, config)
	require.NoError(t, err)

	// Verify old entries were removed
	assert.Equal(t, 2, removeCallCount, "Expected 2 old netwatch entries to be removed")
}

// TestDisableHealthCheck tests disabling health monitoring.
func TestDisableHealthCheck(t *testing.T) {
	mockPort := router.NewMockAdapter("test-router")
	mockBus := events.NewInMemoryEventBus()

	mockPort.SetMockResponse("/tool/netwatch/print", router.CommandResult{
		Success: true,
		Data:    []map[string]string{},
	})

	monitor := NewWANHealthMonitor(mockPort, mockBus)
	ctx := context.Background()
	routerID := "router-123"
	wanID := "wan1"

	// First enable health check
	enabledConfig := WANHealthCheckConfig{
		Enabled:          true,
		Targets:          []string{"1.1.1.1"},
		Interval:         10,
		Timeout:          2,
		FailureThreshold: 3,
	}

	mockPort.SetMockResponse("/tool/netwatch/add", router.CommandResult{
		Success: true,
	})

	err := monitor.ConfigureHealthCheck(ctx, routerID, wanID, enabledConfig)
	require.NoError(t, err)

	// Now disable it
	disabledConfig := WANHealthCheckConfig{
		Enabled:          false,
		Targets:          []string{},
		Interval:         10,
		Timeout:          2,
		FailureThreshold: 3,
	}

	err = monitor.ConfigureHealthCheck(ctx, routerID, wanID, disabledConfig)
	require.NoError(t, err)

	// Status should be UNKNOWN when disabled
	status := monitor.GetHealthStatus(routerID, wanID)
	assert.Equal(t, WANHealthStatusUnknown, status)
}

// TestAggregateHealthStatus tests health status aggregation logic.
func TestAggregateHealthStatus(t *testing.T) {
	mockPort := router.NewMockAdapter("test-router")
	mockBus := events.NewInMemoryEventBus()

	monitor := NewWANHealthMonitor(mockPort, mockBus)

	tests := []struct {
		name           string
		reachableCount int
		totalTargets   int
		expectedStatus WANHealthStatus
	}{
		{
			name:           "all targets reachable",
			reachableCount: 3,
			totalTargets:   3,
			expectedStatus: WANHealthStatusHealthy,
		},
		{
			name:           "some targets reachable",
			reachableCount: 2,
			totalTargets:   3,
			expectedStatus: WANHealthStatusDegraded,
		},
		{
			name:           "one target reachable",
			reachableCount: 1,
			totalTargets:   3,
			expectedStatus: WANHealthStatusDegraded,
		},
		{
			name:           "no targets reachable",
			reachableCount: 0,
			totalTargets:   3,
			expectedStatus: WANHealthStatusDown,
		},
		{
			name:           "no targets configured",
			reachableCount: 0,
			totalTargets:   0,
			expectedStatus: WANHealthStatusUnknown,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			status := monitor.aggregateHealthStatus(tt.reachableCount, tt.totalTargets)
			assert.Equal(t, tt.expectedStatus, status)
		})
	}
}

// TestCheckHealthPublishesEvent tests event publishing on health status change.
func TestCheckHealthPublishesEvent(t *testing.T) {
	mockPort := router.NewMockAdapter("test-router")
	mockBus := events.NewInMemoryEventBus()

	// Configure netwatch to return healthy targets
	mockPort.SetMockResponse("/tool/netwatch/print", router.CommandResult{
		Success: true,
		Data: []map[string]string{
			{
				".id":     "*1",
				"host":    "1.1.1.1",
				"status":  "up",
				"comment": "WAN Health Check: wan1",
			},
			{
				".id":     "*2",
				"host":    "8.8.8.8",
				"status":  "up",
				"comment": "WAN Health Check: wan1",
			},
		},
	})

	monitor := NewWANHealthMonitor(mockPort, mockBus)
	ctx := context.Background()
	routerID := "router-123"
	wanID := "wan1"

	// Subscribe to events
	eventChan := mockBus.Subscribe(ctx, "wan.*")
	receivedEvents := []events.Event{}

	go func() {
		for msg := range eventChan {
			if evt, ok := msg.(events.Event); ok {
				receivedEvents = append(receivedEvents, evt)
			}
		}
	}()

	// Set initial status to DOWN
	monitor.setHealthStatus(routerID, wanID, WANHealthStatusDown)

	// Check health (should detect HEALTHY and publish event)
	config := &WANHealthCheckConfig{
		Enabled:          true,
		Targets:          []string{"1.1.1.1", "8.8.8.8"},
		Interval:         10,
		Timeout:          2,
		FailureThreshold: 3,
	}

	err := monitor.checkHealth(ctx, routerID, wanID, config)
	require.NoError(t, err)

	// Wait for event processing
	time.Sleep(100 * time.Millisecond)

	// Verify event was published
	assert.GreaterOrEqual(t, len(receivedEvents), 1, "Expected at least 1 event to be published")

	// Check for WANHealthChangedEvent
	foundHealthEvent := false
	for _, evt := range receivedEvents {
		if evt.GetType() == events.EventTypeWANHealthChanged {
			foundHealthEvent = true
			break
		}
	}
	assert.True(t, foundHealthEvent, "Expected WANHealthChangedEvent to be published")

	// Verify status was updated to HEALTHY
	status := monitor.GetHealthStatus(routerID, wanID)
	assert.Equal(t, WANHealthStatusHealthy, status)
}

// TestCheckHealthDegradedState tests degraded health status.
func TestCheckHealthDegradedState(t *testing.T) {
	mockPort := router.NewMockAdapter("test-router")
	mockBus := events.NewInMemoryEventBus()

	// Configure netwatch to return mixed results (1 up, 1 down)
	mockPort.SetMockResponse("/tool/netwatch/print", router.CommandResult{
		Success: true,
		Data: []map[string]string{
			{
				".id":     "*1",
				"host":    "1.1.1.1",
				"status":  "up",
				"comment": "WAN Health Check: wan1",
			},
			{
				".id":     "*2",
				"host":    "8.8.8.8",
				"status":  "down",
				"comment": "WAN Health Check: wan1",
			},
		},
	})

	monitor := NewWANHealthMonitor(mockPort, mockBus)
	ctx := context.Background()
	routerID := "router-123"
	wanID := "wan1"

	config := &WANHealthCheckConfig{
		Enabled:          true,
		Targets:          []string{"1.1.1.1", "8.8.8.8"},
		Interval:         10,
		Timeout:          2,
		FailureThreshold: 3,
	}

	// Check health
	err := monitor.checkHealth(ctx, routerID, wanID, config)
	require.NoError(t, err)

	// Verify status is DEGRADED
	status := monitor.GetHealthStatus(routerID, wanID)
	assert.Equal(t, WANHealthStatusDegraded, status)
}

// TestGetHealthStatusDefault tests default UNKNOWN status.
func TestGetHealthStatusDefault(t *testing.T) {
	mockPort := router.NewMockAdapter("test-router")
	mockBus := events.NewInMemoryEventBus()

	monitor := NewWANHealthMonitor(mockPort, mockBus)

	// Get status for non-configured WAN
	status := monitor.GetHealthStatus("router-123", "wan-999")

	// Should return UNKNOWN for unconfigured WAN
	assert.Equal(t, WANHealthStatusUnknown, status)
}

// TestStopMonitoring tests graceful shutdown of monitoring.
func TestStopMonitoring(t *testing.T) {
	mockPort := router.NewMockAdapter("test-router")
	mockBus := events.NewInMemoryEventBus()

	mockPort.SetMockResponse("/tool/netwatch/print", router.CommandResult{
		Success: true,
		Data:    []map[string]string{},
	})

	mockPort.SetMockResponse("/tool/netwatch/add", router.CommandResult{
		Success: true,
	})

	monitor := NewWANHealthMonitor(mockPort, mockBus)
	ctx := context.Background()
	routerID := "router-123"
	wanID := "wan1"

	// Start monitoring
	config := WANHealthCheckConfig{
		Enabled:          true,
		Targets:          []string{"1.1.1.1"},
		Interval:         10,
		Timeout:          2,
		FailureThreshold: 3,
	}

	err := monitor.ConfigureHealthCheck(ctx, routerID, wanID, config)
	require.NoError(t, err)

	// Verify monitoring is running
	monitor.stopMu.Lock()
	_, exists := monitor.stopChannels[routerID+"-"+wanID]
	monitor.stopMu.Unlock()
	assert.True(t, exists, "Expected stop channel to exist")

	// Stop monitoring
	monitor.stopMonitoring(routerID, wanID)

	// Verify stop channel was closed and removed
	monitor.stopMu.Lock()
	_, exists = monitor.stopChannels[routerID+"-"+wanID]
	monitor.stopMu.Unlock()
	assert.False(t, exists, "Expected stop channel to be removed")
}

// TestShutdown tests graceful shutdown of all monitoring.
func TestShutdown(t *testing.T) {
	mockPort := router.NewMockAdapter("test-router")
	mockBus := events.NewInMemoryEventBus()

	mockPort.SetMockResponse("/tool/netwatch/print", router.CommandResult{
		Success: true,
		Data:    []map[string]string{},
	})

	mockPort.SetMockResponse("/tool/netwatch/add", router.CommandResult{
		Success: true,
	})

	monitor := NewWANHealthMonitor(mockPort, mockBus)
	ctx := context.Background()

	// Start monitoring for multiple WANs
	config := WANHealthCheckConfig{
		Enabled:          true,
		Targets:          []string{"1.1.1.1"},
		Interval:         10,
		Timeout:          2,
		FailureThreshold: 3,
	}

	err := monitor.ConfigureHealthCheck(ctx, "router-1", "wan1", config)
	require.NoError(t, err)

	err = monitor.ConfigureHealthCheck(ctx, "router-1", "wan2", config)
	require.NoError(t, err)

	// Verify both are running
	monitor.stopMu.Lock()
	count := len(monitor.stopChannels)
	monitor.stopMu.Unlock()
	assert.Equal(t, 2, count, "Expected 2 monitoring goroutines")

	// Shutdown
	monitor.Shutdown()

	// Verify all stop channels were closed and removed
	monitor.stopMu.Lock()
	count = len(monitor.stopChannels)
	monitor.stopMu.Unlock()
	assert.Equal(t, 0, count, "Expected all stop channels to be removed")
}
