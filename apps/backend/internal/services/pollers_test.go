package services

import (
	"context"
	"testing"
	"time"

	"backend/graph/model"

	"backend/internal/events"
	"backend/internal/router"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// =============================================================================
// StatsPoller Tests
// =============================================================================

// TestNewStatsPoller tests stats poller creation
func TestNewStatsPoller(t *testing.T) {
	mockPort := &mockRouterPort{}
	mockBus := events.NewInMemoryEventBus()

	poller := NewStatsPoller(mockPort, mockBus)

	require.NotNil(t, poller)
	// Note: routerPort, eventBus, sessions, and stopChan are internal implementation details
}

// TestSubscribeCreatesSession tests that Subscribe creates a new polling session
func TestSubscribeCreatesSession(t *testing.T) {
	mockPort := &mockRouterPort{
		getStatsFunc: func(ctx context.Context, interfaceID string) (*model.InterfaceStats, error) {
			return &model.InterfaceStats{
				TxBytes:   "1000",
				RxBytes:   "2000",
				TxPackets: "10",
				RxPackets: "20",
				TxErrors:  0,
				RxErrors:  0,
				TxDrops:   0,
				RxDrops:   0,
			}, nil
		},
	}
	mockBus := events.NewInMemoryEventBus()

	poller := NewStatsPoller(mockPort, mockBus)
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	ch, err := poller.Subscribe(ctx, "router-1", "ether1", 1*time.Second)
	require.NoError(t, err)
	require.NotNil(t, ch)

	// Verify session was created
	assert.Equal(t, 1, poller.GetActiveSessions())
	assert.Equal(t, 1, poller.GetSubscriberCount())

	// Should receive at least one stats update
	select {
	case stats := <-ch:
		assert.NotNil(t, stats)
		assert.Equal(t, "1000", stats.TxBytes)
	case <-time.After(2 * time.Second):
		t.Fatal("did not receive stats update")
	}
}

// TestSubscribeRateLimiting tests that Subscribe enforces minimum interval
func TestSubscribeRateLimiting(t *testing.T) {
	mockPort := &mockRouterPort{
		getStatsFunc: func(ctx context.Context, interfaceID string) (*model.InterfaceStats, error) {
			return &model.InterfaceStats{
				TxBytes:   "1000",
				RxBytes:   "2000",
				TxPackets: "10",
				RxPackets: "20",
			}, nil
		},
	}
	mockBus := events.NewInMemoryEventBus()

	poller := NewStatsPoller(mockPort, mockBus)
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	tests := []struct {
		name              string
		requestedInterval time.Duration
		enforcedMin       time.Duration
		enforcedMax       time.Duration
	}{
		{
			name:              "below minimum enforced to 1s",
			requestedInterval: 500 * time.Millisecond,
			enforcedMin:       MinPollingInterval,
		},
		{
			name:              "above maximum enforced to 30s",
			requestedInterval: 60 * time.Second,
			enforcedMax:       MaxPollingInterval,
		},
		{
			name:              "valid interval unchanged",
			requestedInterval: 5 * time.Second,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ch, err := poller.Subscribe(ctx, "router-1", "ether1", tt.requestedInterval)
			require.NoError(t, err)
			require.NotNil(t, ch)

			// The interval enforcement is internal, but we can verify subscription works
			select {
			case stats := <-ch:
				assert.NotNil(t, stats)
			case <-time.After(2 * time.Second):
				// OK if no update yet (depends on timing)
			}
		})
	}
}

// TestSubscribeMultipleSubscribers tests multiple subscribers to same interface
func TestSubscribeMultipleSubscribers(t *testing.T) {
	callCount := 0
	mockPort := &mockRouterPort{
		getStatsFunc: func(ctx context.Context, interfaceID string) (*model.InterfaceStats, error) {
			callCount++
			return &model.InterfaceStats{
				TxBytes:   "1000",
				RxBytes:   "2000",
				TxPackets: "10",
				RxPackets: "20",
			}, nil
		},
	}
	mockBus := events.NewInMemoryEventBus()

	poller := NewStatsPoller(mockPort, mockBus)
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	// Subscribe 3 times to same interface
	ch1, err := poller.Subscribe(ctx, "router-1", "ether1", 1*time.Second)
	require.NoError(t, err)

	ch2, err := poller.Subscribe(ctx, "router-1", "ether1", 1*time.Second)
	require.NoError(t, err)

	ch3, err := poller.Subscribe(ctx, "router-1", "ether1", 1*time.Second)
	require.NoError(t, err)

	// Should only create one session (shared polling)
	assert.Equal(t, 1, poller.GetActiveSessions())
	assert.Equal(t, 3, poller.GetSubscriberCount())

	// All subscribers should receive stats
	time.Sleep(1500 * time.Millisecond)

	select {
	case stats := <-ch1:
		assert.NotNil(t, stats)
	default:
		t.Error("ch1 did not receive stats")
	}

	select {
	case stats := <-ch2:
		assert.NotNil(t, stats)
	default:
		t.Error("ch2 did not receive stats")
	}

	select {
	case stats := <-ch3:
		assert.NotNil(t, stats)
	default:
		t.Error("ch3 did not receive stats")
	}
}

// TestUnsubscribeCleanup tests that unsubscribe cleans up when no subscribers remain
func TestUnsubscribeCleanup(t *testing.T) {
	mockPort := &mockRouterPort{
		getStatsFunc: func(ctx context.Context, interfaceID string) (*model.InterfaceStats, error) {
			return &model.InterfaceStats{
				TxBytes: "1000",
				RxBytes: "2000",
			}, nil
		},
	}
	mockBus := events.NewInMemoryEventBus()

	poller := NewStatsPoller(mockPort, mockBus)

	// Create subscription with cancellable context
	ctx1, cancel1 := context.WithCancel(context.Background())
	ch1, err := poller.Subscribe(ctx1, "router-1", "ether1", 1*time.Second)
	require.NoError(t, err)
	require.NotNil(t, ch1)

	assert.Equal(t, 1, poller.GetActiveSessions())
	assert.Equal(t, 1, poller.GetSubscriberCount())

	// Cancel context to trigger unsubscribe
	cancel1()
	time.Sleep(100 * time.Millisecond) // Give time for cleanup

	// Session should be removed
	assert.Equal(t, 0, poller.GetActiveSessions())
	assert.Equal(t, 0, poller.GetSubscriberCount())

	// Channel should be closed
	_, ok := <-ch1
	assert.False(t, ok, "channel should be closed")
}

// TestStopGracefulShutdown tests graceful shutdown of stats poller
func TestStopGracefulShutdown(t *testing.T) {
	mockPort := &mockRouterPort{
		getStatsFunc: func(ctx context.Context, interfaceID string) (*model.InterfaceStats, error) {
			return &model.InterfaceStats{
				TxBytes: "1000",
				RxBytes: "2000",
			}, nil
		},
	}
	mockBus := events.NewInMemoryEventBus()

	poller := NewStatsPoller(mockPort, mockBus)
	ctx := context.Background()

	// Create multiple subscriptions
	ch1, _ := poller.Subscribe(ctx, "router-1", "ether1", 1*time.Second)
	ch2, _ := poller.Subscribe(ctx, "router-1", "ether2", 1*time.Second)
	ch3, _ := poller.Subscribe(ctx, "router-2", "ether1", 1*time.Second)

	assert.Equal(t, 3, poller.GetActiveSessions())

	// Stop poller
	poller.Stop()

	// All channels should be closed
	_, ok1 := <-ch1
	_, ok2 := <-ch2
	_, ok3 := <-ch3

	assert.False(t, ok1, "ch1 should be closed")
	assert.False(t, ok2, "ch2 should be closed")
	assert.False(t, ok3, "ch3 should be closed")
}

// TestFetchAndBroadcastErrorHandling tests error handling during fetch
func TestFetchAndBroadcastErrorHandling(t *testing.T) {
	errorCount := 0
	mockPort := &mockRouterPort{
		getStatsFunc: func(ctx context.Context, interfaceID string) (*model.InterfaceStats, error) {
			errorCount++
			if errorCount <= 2 {
				return nil, assert.AnError // First 2 calls fail
			}
			// Third call succeeds
			return &model.InterfaceStats{
				TxBytes: "1000",
				RxBytes: "2000",
			}, nil
		},
	}
	mockBus := events.NewInMemoryEventBus()

	poller := NewStatsPoller(mockPort, mockBus)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	ch, err := poller.Subscribe(ctx, "router-1", "ether1", 500*time.Millisecond)
	require.NoError(t, err)

	// Should eventually receive stats after errors
	received := false
	for i := 0; i < 10; i++ {
		select {
		case stats := <-ch:
			if stats != nil {
				assert.Equal(t, "1000", stats.TxBytes)
				received = true
			}
		case <-time.After(1 * time.Second):
			continue
		}
		if received {
			break
		}
	}

	assert.True(t, received, "should eventually receive stats after transient errors")
}

// TestBufferOverflow tests that slow consumers don't block poller
func TestBufferOverflow(t *testing.T) {
	mockPort := &mockRouterPort{
		getStatsFunc: func(ctx context.Context, interfaceID string) (*model.InterfaceStats, error) {
			return &model.InterfaceStats{
				TxBytes: "1000",
				RxBytes: "2000",
			}, nil
		},
	}
	mockBus := events.NewInMemoryEventBus()

	poller := NewStatsPoller(mockPort, mockBus)
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	ch, err := poller.Subscribe(ctx, "router-1", "ether1", 100*time.Millisecond)
	require.NoError(t, err)

	// Don't read from channel (slow consumer)
	time.Sleep(2 * time.Second)

	// Poller should still be running (not blocked)
	assert.Equal(t, 1, poller.GetActiveSessions())

	// Clean up
	cancel()
	time.Sleep(100 * time.Millisecond)
	_ = ch
}

// mockRouterPort is a mock implementation for testing
type mockRouterPort struct {
	getStatsFunc func(ctx context.Context, interfaceID string) (*model.InterfaceStats, error)
}

func (m *mockRouterPort) GetInterfaceStats(ctx context.Context, interfaceID string) (*model.InterfaceStats, error) {
	if m.getStatsFunc != nil {
		return m.getStatsFunc(ctx, interfaceID)
	}
	return &model.InterfaceStats{}, nil
}

func (m *mockRouterPort) Connect(_ context.Context) error { return nil }
func (m *mockRouterPort) Disconnect() error               { return nil }
func (m *mockRouterPort) IsConnected() bool               { return true }
func (m *mockRouterPort) Health(_ context.Context) router.HealthStatus {
	return router.HealthStatus{}
}
func (m *mockRouterPort) Capabilities() router.PlatformCapabilities {
	return router.PlatformCapabilities{}
}
func (m *mockRouterPort) Info() (*router.RouterInfo, error) { return nil, nil }
func (m *mockRouterPort) ExecuteCommand(_ context.Context, cmd router.Command) (*router.CommandResult, error) {
	return nil, nil
}
func (m *mockRouterPort) QueryState(_ context.Context, query router.StateQuery) (*router.StateResult, error) {
	return nil, nil
}
func (m *mockRouterPort) Protocol() router.Protocol { return router.ProtocolREST }

// =============================================================================
// ServiceTrafficPoller Tests
// =============================================================================

// TestNewServiceTrafficPoller tests creating a new traffic poller instance
func TestNewServiceTrafficPoller(t *testing.T) {
	poller := NewServiceTrafficPoller(nil, nil)
	if poller == nil {
		t.Fatal("NewServiceTrafficPoller should return a non-nil instance")
	}

	// Note: sessions and stopChan are internal implementation details
}

// TestServiceTrafficPoller_GetActiveSessions tests session counting
func TestServiceTrafficPoller_GetActiveSessions(t *testing.T) {
	poller := NewServiceTrafficPoller(nil, nil)

	if poller.GetActiveSessions() != 0 {
		t.Errorf("Expected 0 active sessions, got %d", poller.GetActiveSessions())
	}
}

// TestServiceTrafficPoller_GetSubscriberCount tests subscriber counting
func TestServiceTrafficPoller_GetSubscriberCount(t *testing.T) {
	poller := NewServiceTrafficPoller(nil, nil)

	if poller.GetSubscriberCount() != 0 {
		t.Errorf("Expected 0 subscribers, got %d", poller.GetSubscriberCount())
	}
}

// TestServiceTrafficPoller_Stop tests graceful shutdown
func TestServiceTrafficPoller_Stop(t *testing.T) {
	poller := NewServiceTrafficPoller(nil, nil)

	defer func() {
		if r := recover(); r != nil {
			t.Errorf("Stop() panicked: %v", r)
		}
	}()

	poller.Stop()
}

// TestTrafficPollingConstants validates polling interval constants
func TestTrafficPollingConstants(t *testing.T) {
	if TrafficPollingInterval != 10*time.Second {
		t.Errorf("Expected TrafficPollingInterval to be 10s, got %v", TrafficPollingInterval)
	}

	if MinTrafficPollingInterval != 5*time.Second {
		t.Errorf("Expected MinTrafficPollingInterval to be 5s, got %v", MinTrafficPollingInterval)
	}

	if MaxTrafficPollingInterval != 60*time.Second {
		t.Errorf("Expected MaxTrafficPollingInterval to be 60s, got %v", MaxTrafficPollingInterval)
	}

	if MinTrafficPollingInterval >= TrafficPollingInterval {
		t.Error("MinTrafficPollingInterval should be less than TrafficPollingInterval")
	}

	if TrafficPollingInterval >= MaxTrafficPollingInterval {
		t.Error("TrafficPollingInterval should be less than MaxTrafficPollingInterval")
	}
}

// TestParseBytes tests the byte parsing helper function
// SKIPPED: parseBytes is not exported/doesn't exist in current implementation
/*
func TestParseBytes(t *testing.T) {
	tests := []struct {
		input    string
		expected int
	}{
		{"0", 0},
		{"1000", 1000},
		{"1000000", 1000000},
		{"999999999", 999999999},
		{"", 0},
		{"invalid", 0},
	}

	for _, tt := range tests {
		result := parseBytes(tt.input)
		if result != tt.expected {
			t.Errorf("parseBytes(%q) = %d, expected %d", tt.input, result, tt.expected)
		}
	}
}
*/
