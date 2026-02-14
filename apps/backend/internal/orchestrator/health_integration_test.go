package orchestrator

import (
	"context"
	"testing"
	"time"

	"entgo.io/ent/dialect"
	"github.com/ThreeDotsLabs/watermill/message"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"apps/backend/ent"
	"apps/backend/ent/enttest"
	"apps/backend/ent/serviceinstance"
	"apps/backend/internal/events"
	"apps/backend/internal/features"
)

// TestHealthMonitoringLifecycle tests the complete health monitoring lifecycle
// from instance creation to health tracking to cleanup.
func TestHealthMonitoringLifecycle(t *testing.T) {
	// Setup test database
	client := enttest.Open(t, dialect.SQLite, "file:ent?mode=memory&cache=shared&_fk=1")
	defer client.Close()

	// Setup test event bus
	pubSub := message.NewPubSub()
	defer pubSub.Close()

	bus := events.NewBus(pubSub)
	publisher := events.NewPublisher(bus)

	// Create mock manifest with health spec
	manifest := &features.Manifest{
		ID:      "test-service",
		Version: "1.0.0",
		Health: &features.HealthSpec{
			Type:             "tcp",
			TCPAddress:       "localhost:9999",
			IntervalSeconds:  1,
			FailureThreshold: 3,
			TimeoutSeconds:   5,
			AutoRestart:      true,
		},
	}

	// Create test router
	router, err := client.Router.Create().
		SetName("test-router").
		SetAddress("192.168.1.1").
		Save(context.Background())
	require.NoError(t, err)

	// Create service instance
	instance, err := client.ServiceInstance.Create().
		SetInstanceName("test-instance").
		SetFeatureID("test-service").
		SetBinaryVersion("1.0.0").
		SetBinaryPath("/tmp/test-binary").
		SetStatus(serviceinstance.StatusRunning).
		SetRouterID(router.ID).
		SetHealthStatus(serviceinstance.HealthStatusUNKNOWN).
		SetHealthProcessAlive(false).
		SetHealthConnectionStatus(serviceinstance.HealthConnectionStatusUNKNOWN).
		SetHealthConsecutiveFails(0).
		SetHealthCheckIntervalSeconds(1).
		SetHealthFailureThreshold(3).
		Save(context.Background())
	require.NoError(t, err)

	// Create health checker with mock probe
	healthCheckCalled := make(chan bool, 10)
	mockProbe := &MockHealthProbe{
		checkFunc: func(ctx context.Context) error {
			healthCheckCalled <- true
			return nil // Healthy
		},
	}

	restartChan := make(chan RestartRequest, 10)
	checker := NewHealthChecker(client, publisher, restartChan)

	// Register instance with health checker
	err = checker.RegisterInstance(context.Background(), instance.ID, mockProbe)
	require.NoError(t, err)

	// Start health checker
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	go checker.Start(ctx)

	// Wait for at least 2 health checks (2+ seconds with 1s interval)
	select {
	case <-healthCheckCalled:
		t.Log("First health check completed")
	case <-time.After(2 * time.Second):
		t.Fatal("Timeout waiting for first health check")
	}

	select {
	case <-healthCheckCalled:
		t.Log("Second health check completed")
	case <-time.After(2 * time.Second):
		t.Fatal("Timeout waiting for second health check")
	}

	// Verify instance health status updated in database
	updatedInstance, err := client.ServiceInstance.Get(context.Background(), instance.ID)
	require.NoError(t, err)
	assert.Equal(t, serviceinstance.HealthStatusHEALTHY, updatedInstance.HealthStatus)
	assert.True(t, updatedInstance.HealthProcessAlive)
	assert.Equal(t, serviceinstance.HealthConnectionStatusCONNECTED, updatedInstance.HealthConnectionStatus)
	assert.Equal(t, 0, updatedInstance.HealthConsecutiveFails)
	assert.NotNil(t, updatedInstance.HealthLastHealthyAt)

	// Unregister instance
	checker.UnregisterInstance(instance.ID)

	// Verify instance removed from checker
	assert.NotContains(t, checker.instances, instance.ID)
}

// TestAutoRestartOnFailure tests that health checker triggers auto-restart
// after consecutive failures exceed the threshold.
func TestAutoRestartOnFailure(t *testing.T) {
	// Setup test database
	client := enttest.Open(t, dialect.SQLite, "file:ent?mode=memory&cache=shared&_fk=1")
	defer client.Close()

	// Setup test event bus
	pubSub := message.NewPubSub()
	defer pubSub.Close()

	bus := events.NewBus(pubSub)
	publisher := events.NewPublisher(bus)

	// Create test router
	router, err := client.Router.Create().
		SetName("test-router").
		SetAddress("192.168.1.1").
		Save(context.Background())
	require.NoError(t, err)

	// Create service instance with auto-restart enabled
	instance, err := client.ServiceInstance.Create().
		SetInstanceName("failing-instance").
		SetFeatureID("test-service").
		SetBinaryVersion("1.0.0").
		SetBinaryPath("/tmp/test-binary").
		SetStatus(serviceinstance.StatusRunning).
		SetRouterID(router.ID).
		SetHealthStatus(serviceinstance.HealthStatusUNKNOWN).
		SetHealthProcessAlive(false).
		SetHealthConnectionStatus(serviceinstance.HealthConnectionStatusUNKNOWN).
		SetHealthConsecutiveFails(0).
		SetHealthCheckIntervalSeconds(1).
		SetHealthFailureThreshold(3).
		Save(context.Background())
	require.NoError(t, err)

	// Create mock probe that always fails
	mockProbe := &MockHealthProbe{
		checkFunc: func(ctx context.Context) error {
			return assert.AnError // Always fail
		},
	}

	restartChan := make(chan RestartRequest, 10)
	checker := NewHealthChecker(client, publisher, restartChan)

	// Register instance
	err = checker.RegisterInstance(context.Background(), instance.ID, mockProbe)
	require.NoError(t, err)

	// Start health checker
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	go checker.Start(ctx)

	// Wait for restart request (should trigger after 3 failures)
	select {
	case req := <-restartChan:
		assert.Equal(t, instance.ID, req.InstanceID)
		assert.Equal(t, 3, req.ConsecutiveFails)
		assert.Equal(t, time.Second, req.BackoffDelay) // First restart: 1s
		t.Log("Auto-restart triggered after 3 consecutive failures")
	case <-time.After(5 * time.Second):
		t.Fatal("Timeout waiting for restart request")
	}

	// Verify instance health status in database
	updatedInstance, err := client.ServiceInstance.Get(context.Background(), instance.ID)
	require.NoError(t, err)
	assert.Equal(t, serviceinstance.HealthStatusUNHEALTHY, updatedInstance.HealthStatus)
	assert.Equal(t, 3, updatedInstance.HealthConsecutiveFails)
}

// TestEventPublishing tests that health changes are published via Watermill event bus
func TestEventPublishing(t *testing.T) {
	// Setup test database
	client := enttest.Open(t, dialect.SQLite, "file:ent?mode=memory&cache=shared&_fk=1")
	defer client.Close()

	// Setup test event bus with subscriber
	pubSub := message.NewPubSub()
	defer pubSub.Close()

	bus := events.NewBus(pubSub)
	publisher := events.NewPublisher(bus)

	// Subscribe to health changed events
	eventChan := make(chan *events.FeatureHealthChangedEvent, 10)
	subscriber, err := bus.Subscribe(context.Background(), events.EventTypeHealthChanged)
	require.NoError(t, err)
	defer subscriber.Close()

	go func() {
		for msg := range subscriber.Messages() {
			event, err := events.DeserializeEvent(msg.Payload)
			if err != nil {
				t.Logf("Failed to deserialize event: %v", err)
				continue
			}
			if healthEvent, ok := event.(*events.FeatureHealthChangedEvent); ok {
				eventChan <- healthEvent
			}
			msg.Ack()
		}
	}()

	// Create test router
	router, err := client.Router.Create().
		SetName("test-router").
		SetAddress("192.168.1.1").
		Save(context.Background())
	require.NoError(t, err)

	// Create service instance
	instance, err := client.ServiceInstance.Create().
		SetInstanceName("event-test-instance").
		SetFeatureID("test-service").
		SetBinaryVersion("1.0.0").
		SetBinaryPath("/tmp/test-binary").
		SetStatus(serviceinstance.StatusRunning).
		SetRouterID(router.ID).
		SetHealthStatus(serviceinstance.HealthStatusUNKNOWN).
		SetHealthProcessAlive(false).
		SetHealthConnectionStatus(serviceinstance.HealthConnectionStatusUNKNOWN).
		SetHealthConsecutiveFails(0).
		SetHealthCheckIntervalSeconds(1).
		SetHealthFailureThreshold(3).
		Save(context.Background())
	require.NoError(t, err)

	// Create mock probe that transitions from healthy to unhealthy
	checkCount := 0
	mockProbe := &MockHealthProbe{
		checkFunc: func(ctx context.Context) error {
			checkCount++
			if checkCount <= 2 {
				return nil // Healthy first 2 checks
			}
			return assert.AnError // Fail subsequent checks
		},
	}

	restartChan := make(chan RestartRequest, 10)
	checker := NewHealthChecker(client, publisher, restartChan)

	// Register instance
	err = checker.RegisterInstance(context.Background(), instance.ID, mockProbe)
	require.NoError(t, err)

	// Start health checker
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	go checker.Start(ctx)

	// Wait for healthy event (state transition: UNKNOWN → HEALTHY)
	select {
	case event := <-eventChan:
		assert.Equal(t, instance.ID, event.InstanceID)
		assert.Equal(t, router.ID, event.RouterID)
		assert.Equal(t, "test-service", event.FeatureID)
		assert.Equal(t, "UNKNOWN", event.PreviousState)
		assert.Equal(t, "HEALTHY", event.CurrentState)
		assert.Equal(t, 0, event.ConsecutiveFails)
		t.Log("Received UNKNOWN → HEALTHY event")
	case <-time.After(3 * time.Second):
		t.Fatal("Timeout waiting for healthy event")
	}

	// Wait for unhealthy event (state transition: HEALTHY → UNHEALTHY)
	select {
	case event := <-eventChan:
		assert.Equal(t, instance.ID, event.InstanceID)
		assert.Equal(t, "HEALTHY", event.PreviousState)
		assert.Equal(t, "UNHEALTHY", event.CurrentState)
		assert.Greater(t, event.ConsecutiveFails, 0)
		t.Log("Received HEALTHY → UNHEALTHY event")
	case <-time.After(5 * time.Second):
		t.Fatal("Timeout waiting for unhealthy event")
	}
}

// TestHealthPersistence tests that health state persists across restarts
func TestHealthPersistence(t *testing.T) {
	// Setup test database (persistent across test phases)
	dbPath := "file:persistence_test.db?mode=memory&cache=shared&_fk=1"
	client := enttest.Open(t, dialect.SQLite, dbPath)

	// Setup test event bus
	pubSub := message.NewPubSub()
	defer pubSub.Close()

	bus := events.NewBus(pubSub)
	publisher := events.NewPublisher(bus)

	// Phase 1: Create instance and run health checks
	router, err := client.Router.Create().
		SetName("test-router").
		SetAddress("192.168.1.1").
		Save(context.Background())
	require.NoError(t, err)

	instance, err := client.ServiceInstance.Create().
		SetInstanceName("persist-test-instance").
		SetFeatureID("test-service").
		SetBinaryVersion("1.0.0").
		SetBinaryPath("/tmp/test-binary").
		SetStatus(serviceinstance.StatusRunning).
		SetRouterID(router.ID).
		SetHealthStatus(serviceinstance.HealthStatusUNKNOWN).
		SetHealthProcessAlive(false).
		SetHealthConnectionStatus(serviceinstance.HealthConnectionStatusUNKNOWN).
		SetHealthConsecutiveFails(0).
		SetHealthCheckIntervalSeconds(1).
		SetHealthFailureThreshold(3).
		Save(context.Background())
	require.NoError(t, err)

	// Create mock probe
	mockProbe := &MockHealthProbe{
		checkFunc: func(ctx context.Context) error {
			return nil // Healthy
		},
	}

	restartChan := make(chan RestartRequest, 10)
	checker := NewHealthChecker(client, publisher, restartChan)

	// Register and run health checker
	err = checker.RegisterInstance(context.Background(), instance.ID, mockProbe)
	require.NoError(t, err)

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	checker.Start(ctx)
	cancel()

	// Verify health status was persisted
	persistedInstance, err := client.ServiceInstance.Get(context.Background(), instance.ID)
	require.NoError(t, err)
	assert.Equal(t, serviceinstance.HealthStatusHEALTHY, persistedInstance.HealthStatus)
	assert.True(t, persistedInstance.HealthProcessAlive)
	assert.Equal(t, serviceinstance.HealthConnectionStatusCONNECTED, persistedInstance.HealthConnectionStatus)
	assert.NotNil(t, persistedInstance.HealthLastHealthyAt)
	lastHealthyAt := persistedInstance.HealthLastHealthyAt

	// Simulate container restart by closing and reopening database
	client.Close()
	client = enttest.Open(t, dialect.SQLite, dbPath)
	defer client.Close()

	// Phase 2: Verify health state persisted after "restart"
	restoredInstance, err := client.ServiceInstance.Get(context.Background(), instance.ID)
	require.NoError(t, err)
	assert.Equal(t, serviceinstance.HealthStatusHEALTHY, restoredInstance.HealthStatus)
	assert.True(t, restoredInstance.HealthProcessAlive)
	assert.Equal(t, serviceinstance.HealthConnectionStatusCONNECTED, restoredInstance.HealthConnectionStatus)
	assert.Equal(t, lastHealthyAt, restoredInstance.HealthLastHealthyAt)
	t.Log("Health state successfully persisted across container restart")
}

// MockHealthProbe is a test double for HealthProbe interface
type MockHealthProbe struct {
	checkFunc func(ctx context.Context) error
}

func (m *MockHealthProbe) Check(ctx context.Context) error {
	if m.checkFunc != nil {
		return m.checkFunc(ctx)
	}
	return nil
}
