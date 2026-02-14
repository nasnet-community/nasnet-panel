package resolver

import (
	"backend/generated/ent/enttest"
	"backend/generated/graphql"
	
	"backend/internal/orchestrator"
	"context"
	"testing"
	"time"

	"github.com/rs/zerolog"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	_ "github.com/mattn/go-sqlite3"
)

// TestInstanceIsolation_VerifierNotAvailable tests the case where IsolationVerifier is not available
func TestInstanceIsolation_VerifierNotAvailable(t *testing.T) {
	// Setup in-memory database
	client := enttest.Open(t, "sqlite3", "file:ent?mode=memory&cache=shared&_fk=1")
	defer client.Close()

	// Create test router
	router := client.Router.Create().
		SetID("router-1").
		SetName("Test Router").
		SetHost("192.168.1.1").
		SetPort(8728).
		SetUsername("admin").
		SetConnectionType("API").
		SaveX(context.Background())

	// Create test instance
	instance := client.ServiceInstance.Create().
		SetID("instance-1").
		SetFeatureID("tor").
		SetInstanceName("test-tor").
		SetRouterID(router.ID).
		SetStatus("installed").
		SetPorts([]int{9050}).
		SetBindIP("10.0.0.1").
		SetBinaryPath("/data/services/tor/tor").
		SaveX(context.Background())

	// Create resolver without IsolationVerifier
	logger := zerolog.Nop()
	r := &Resolver{
		db: client,
		log: &testLogger{logger},
		InstanceManager: &orchestrator.InstanceManager{
			// IsolationVerifier is nil
		},
	}

	// Call InstanceIsolation query
	result, err := r.Query().InstanceIsolation(context.Background(), router.ID, instance.ID)
	require.NoError(t, err)
	assert.NotNil(t, result)
	assert.Empty(t, result.Violations, "Should have no violations when verifier is unavailable")
	assert.Nil(t, result.ResourceLimits, "Resource limits should be nil when verifier unavailable")
	assert.Nil(t, result.LastVerified, "LastVerified should be nil when verifier unavailable")
}

// TestInstanceIsolation_InstanceNotFound tests querying isolation for non-existent instance
func TestInstanceIsolation_InstanceNotFound(t *testing.T) {
	// Setup in-memory database
	client := enttest.Open(t, "sqlite3", "file:ent?mode=memory&cache=shared&_fk=1")
	defer client.Close()

	// Create test router
	router := client.Router.Create().
		SetID("router-1").
		SetName("Test Router").
		SetHost("192.168.1.1").
		SetPort(8728).
		SetUsername("admin").
		SetConnectionType("API").
		SaveX(context.Background())

	// Create resolver
	logger := zerolog.Nop()
	r := &Resolver{
		db:  client,
		log: &testLogger{logger},
	}

	// Call InstanceIsolation query for non-existent instance
	_, err := r.Query().InstanceIsolation(context.Background(), router.ID, "non-existent-instance")
	require.Error(t, err)
	assert.Contains(t, err.Error(), "service instance not found")
}

// TestSetResourceLimits_ServiceUnavailable tests mutation when InstanceManager is unavailable
func TestSetResourceLimits_ServiceUnavailable(t *testing.T) {
	// Setup in-memory database
	client := enttest.Open(t, "sqlite3", "file:ent?mode=memory&cache=shared&_fk=1")
	defer client.Close()

	// Create resolver without InstanceManager
	logger := zerolog.Nop()
	r := &Resolver{
		db:              client,
		log:             &testLogger{logger},
		InstanceManager: nil, // InstanceManager is nil
	}

	// Call SetResourceLimits mutation
	input := model.SetResourceLimitsInput{
		RouterID:   "router-1",
		InstanceID: "instance-1",
		MemoryMB:   50,
	}

	result, err := r.Mutation().SetResourceLimits(context.Background(), input)
	require.NoError(t, err)
	assert.NotNil(t, result)
	assert.False(t, result.Success)
	assert.Nil(t, result.ResourceLimits)
	require.Len(t, result.Errors, 1)
	assert.Equal(t, "SERVICE_UNAVAILABLE", result.Errors[0].Code)
	assert.Contains(t, result.Errors[0].Message, "Instance manager service is not available")
}

// TestSetResourceLimits_InvalidMemoryLimit tests mutation with invalid memory limit
func TestSetResourceLimits_InvalidMemoryLimit(t *testing.T) {
	// Setup in-memory database
	client := enttest.Open(t, "sqlite3", "file:ent?mode=memory&cache=shared&_fk=1")
	defer client.Close()

	// Create test router
	router := client.Router.Create().
		SetID("router-1").
		SetName("Test Router").
		SetHost("192.168.1.1").
		SetPort(8728).
		SetUsername("admin").
		SetConnectionType("API").
		SaveX(context.Background())

	// Create test instance
	instance := client.ServiceInstance.Create().
		SetID("instance-1").
		SetFeatureID("tor").
		SetInstanceName("test-tor").
		SetRouterID(router.ID).
		SetStatus("running").
		SetPorts([]int{9050}).
		SetBindIP("10.0.0.1").
		SetBinaryPath("/data/services/tor/tor").
		SaveX(context.Background())

	// Create mock ResourceLimiter
	logger := zerolog.Nop()
	resourceLimiter, err := orchestrator.NewResourceLimiter(orchestrator.ResourceLimiterConfig{
		EventBus: &mockEventBus{},
		Logger:   logger,
	})
	require.NoError(t, err)

	// Create resolver with mock InstanceManager
	r := &Resolver{
		db:  client,
		log: &testLogger{logger},
		InstanceManager: &mockInstanceManager{
			resourceLimiter: resourceLimiter,
		},
	}

	// Call SetResourceLimits mutation with invalid memory (below 16MB)
	input := model.SetResourceLimitsInput{
		RouterID:   router.ID,
		InstanceID: instance.ID,
		MemoryMB:   10, // Below minimum of 16MB
	}

	result, err := r.Mutation().SetResourceLimits(context.Background(), input)
	require.NoError(t, err)
	assert.NotNil(t, result)
	assert.False(t, result.Success)
	assert.Nil(t, result.ResourceLimits)
	require.Len(t, result.Errors, 1)
	assert.Equal(t, "INVALID_INPUT", result.Errors[0].Code)
	assert.Contains(t, result.Errors[0].Message, "below minimum 16MB")
}

// TestConvertIsolationSeverity tests severity conversion helper
func TestConvertIsolationSeverity(t *testing.T) {
	tests := []struct {
		name     string
		input    orchestrator.IsolationSeverity
		expected model.IsolationSeverity
	}{
		{
			name:     "Error severity",
			input:    orchestrator.SeverityError,
			expected: model.IsolationSeverityError,
		},
		{
			name:     "Warning severity",
			input:    orchestrator.SeverityWarning,
			expected: model.IsolationSeverityWarning,
		},
		{
			name:     "Unknown severity defaults to Info",
			input:    orchestrator.IsolationSeverity("unknown"),
			expected: model.IsolationSeverityInfo,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := convertIsolationSeverity(tt.input)
			assert.Equal(t, tt.expected, result)
		})
	}
}

// ============================================
// Mock Implementations
// ============================================

// testLogger implements the logger interface for testing
type testLogger struct {
	logger zerolog.Logger
}

func (l *testLogger) Errorw(msg string, keysAndValues ...interface{}) {
	l.logger.Error().Msg(msg)
}

func (l *testLogger) Infow(msg string, keysAndValues ...interface{}) {
	l.logger.Info().Msg(msg)
}

// mockEventBus implements a minimal EventBus for testing
type mockEventBus struct{}

func (m *mockEventBus) Publish(topic string, payload interface{}) error {
	return nil
}

func (m *mockEventBus) Subscribe(topic string) (<-chan interface{}, error) {
	ch := make(chan interface{})
	return ch, nil
}

func (m *mockEventBus) Close() error {
	return nil
}

// mockInstanceManager implements a minimal InstanceManager for testing
type mockInstanceManager struct {
	isolationVerifier *orchestrator.IsolationVerifier
	resourceLimiter   *orchestrator.ResourceLimiter
}

func (m *mockInstanceManager) IsolationVerifier() *orchestrator.IsolationVerifier {
	return m.isolationVerifier
}

func (m *mockInstanceManager) ResourceLimiter() *orchestrator.ResourceLimiter {
	return m.resourceLimiter
}
