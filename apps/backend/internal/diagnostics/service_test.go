package diagnostics

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// MockRouterProvider implements RouterInfoProvider for testing.
type MockRouterProvider struct {
	hosts       map[string]string
	credentials map[string]struct{ user, pass string }
	hostErr     error
	credErr     error
}

func (m *MockRouterProvider) GetRouterHost(ctx context.Context, routerID string) (string, error) {
	if m.hostErr != nil {
		return "", m.hostErr
	}
	host, ok := m.hosts[routerID]
	if !ok {
		return "", errors.New("router not found")
	}
	return host, nil
}

func (m *MockRouterProvider) GetRouterCredentials(ctx context.Context, routerID string) (string, string, error) {
	if m.credErr != nil {
		return "", "", m.credErr
	}
	creds, ok := m.credentials[routerID]
	if !ok {
		return "", "", errors.New("credentials not found")
	}
	return creds.user, creds.pass, nil
}

func TestNewService(t *testing.T) {
	cfg := ServiceConfig{
		DocsBaseURL:     "https://docs.example.com",
		RateLimitPeriod: 5 * time.Second,
	}

	svc := NewService(cfg)

	assert.NotNil(t, svc)
	assert.NotNil(t, svc.scanner)
	assert.NotNil(t, svc.suggestionMapper)
	assert.NotNil(t, svc.reportFormatter)
	assert.Equal(t, 5*time.Second, svc.rateLimitPeriod)
}

func TestNewService_DefaultRateLimitPeriod(t *testing.T) {
	cfg := ServiceConfig{}
	svc := NewService(cfg)

	assert.Equal(t, DefaultRateLimitInterval, svc.rateLimitPeriod)
}

func TestService_RecordAttempt(t *testing.T) {
	svc := NewService(ServiceConfig{})

	attempt := ConnectionAttempt{
		Protocol:  ProtocolAPI,
		StartedAt: time.Now().Add(-100 * time.Millisecond),
		EndedAt:   time.Now(),
		Success:   true,
	}

	svc.RecordAttempt("router-1", attempt)

	attempts := svc.GetAttempts("router-1", 10)
	assert.Len(t, attempts, 1)
	assert.Equal(t, ProtocolAPI, attempts[0].Protocol)
	assert.True(t, attempts[0].Success)
}

func TestService_RecordAttempt_LimitHistory(t *testing.T) {
	svc := NewService(ServiceConfig{})

	// Record more than the limit
	for i := 0; i < DefaultAttemptHistoryLimit+10; i++ {
		attempt := ConnectionAttempt{
			Protocol:  ProtocolAPI,
			StartedAt: time.Now(),
			EndedAt:   time.Now(),
			Success:   true,
		}
		svc.RecordAttempt("router-1", attempt)
	}

	// Should be limited
	svc.attemptsMu.RLock()
	count := len(svc.attempts["router-1"])
	svc.attemptsMu.RUnlock()

	assert.Equal(t, DefaultAttemptHistoryLimit, count)
}

func TestService_GetConnectionAttempts(t *testing.T) {
	svc := NewService(ServiceConfig{})

	// Record 5 attempts
	for i := 0; i < 5; i++ {
		attempt := ConnectionAttempt{
			Protocol:  Protocol("PROTO_" + string(rune('A'+i))),
			StartedAt: time.Now().Add(time.Duration(i) * time.Second),
			EndedAt:   time.Now().Add(time.Duration(i)*time.Second + 100*time.Millisecond),
			Success:   i%2 == 0,
		}
		svc.RecordAttempt("router-1", attempt)
	}

	ctx := context.Background()

	// Get all attempts
	attempts, err := svc.GetConnectionAttempts(ctx, "router-1", 10)
	require.NoError(t, err)
	assert.Len(t, attempts, 5)

	// Should be newest first (reversed)
	assert.Equal(t, Protocol("PROTO_E"), attempts[0].Protocol)
	assert.Equal(t, Protocol("PROTO_A"), attempts[4].Protocol)

	// Get limited attempts
	attempts, err = svc.GetConnectionAttempts(ctx, "router-1", 2)
	require.NoError(t, err)
	assert.Len(t, attempts, 2)
}

func TestService_GetConnectionAttempts_NoAttempts(t *testing.T) {
	svc := NewService(ServiceConfig{})
	ctx := context.Background()

	attempts, err := svc.GetConnectionAttempts(ctx, "nonexistent", 10)
	require.NoError(t, err)
	assert.Len(t, attempts, 0)
}

func TestService_ClearAttempts(t *testing.T) {
	svc := NewService(ServiceConfig{})

	attempt := ConnectionAttempt{
		Protocol:  ProtocolAPI,
		StartedAt: time.Now(),
		EndedAt:   time.Now(),
		Success:   true,
	}
	svc.RecordAttempt("router-1", attempt)

	svc.ClearAttempts("router-1")

	attempts := svc.GetAttempts("router-1", 10)
	assert.Len(t, attempts, 0)
}

func TestService_GetCircuitBreakerStatus_Default(t *testing.T) {
	svc := NewService(ServiceConfig{})
	ctx := context.Background()

	status, err := svc.GetCircuitBreakerStatus(ctx, "router-1")
	require.NoError(t, err)
	assert.Equal(t, "router-1", status.RouterID)
	assert.Equal(t, CircuitBreakerStateClosed, status.State)
	assert.Equal(t, 0, status.FailureCount)
	assert.Equal(t, CircuitBreakerFailureThreshold, status.FailureThreshold)
}

func TestService_CircuitBreakerTrips(t *testing.T) {
	svc := NewService(ServiceConfig{})
	ctx := context.Background()

	// Record failures to trip the circuit breaker
	for i := 0; i < CircuitBreakerFailureThreshold; i++ {
		attempt := ConnectionAttempt{
			Protocol:  ProtocolAPI,
			StartedAt: time.Now(),
			EndedAt:   time.Now(),
			Success:   false,
		}
		svc.RecordAttempt("router-1", attempt)
	}

	status, err := svc.GetCircuitBreakerStatus(ctx, "router-1")
	require.NoError(t, err)
	assert.Equal(t, CircuitBreakerStateOpen, status.State)
	assert.Equal(t, CircuitBreakerFailureThreshold, status.FailureCount)
	assert.NotNil(t, status.CooldownRemainingSeconds)
}

func TestService_CircuitBreakerResets(t *testing.T) {
	svc := NewService(ServiceConfig{})
	ctx := context.Background()

	// Trip the circuit breaker
	for i := 0; i < CircuitBreakerFailureThreshold; i++ {
		svc.RecordAttempt("router-1", ConnectionAttempt{Success: false})
	}

	// Verify it's open
	status, _ := svc.GetCircuitBreakerStatus(ctx, "router-1")
	assert.Equal(t, CircuitBreakerStateOpen, status.State)

	// Reset it
	status, err := svc.ResetCircuitBreaker(ctx, "router-1")
	require.NoError(t, err)
	assert.Equal(t, CircuitBreakerStateClosed, status.State)
	assert.Equal(t, 0, status.FailureCount)
}

func TestService_CircuitBreakerRecovery(t *testing.T) {
	svc := NewService(ServiceConfig{})

	// Record a failure
	svc.RecordAttempt("router-1", ConnectionAttempt{Success: false})
	svc.RecordAttempt("router-1", ConnectionAttempt{Success: false})

	// Should still be closed (not at threshold)
	svc.cbMu.RLock()
	info := svc.cbState["router-1"]
	svc.cbMu.RUnlock()
	assert.Equal(t, CircuitBreakerStateClosed, info.state)
	assert.Equal(t, 2, info.failureCount)

	// Record a success
	svc.RecordAttempt("router-1", ConnectionAttempt{Success: true})

	// Failure count should reset
	svc.cbMu.RLock()
	info = svc.cbState["router-1"]
	svc.cbMu.RUnlock()
	assert.Equal(t, CircuitBreakerStateClosed, info.state)
	assert.Equal(t, 0, info.failureCount)
}

func TestService_RateLimit(t *testing.T) {
	svc := NewService(ServiceConfig{
		RateLimitPeriod: 100 * time.Millisecond,
		RouterProvider: &MockRouterProvider{
			hosts: map[string]string{
				"router-1": "192.168.1.1",
			},
		},
	})

	ctx := context.Background()

	// First call should succeed
	_, err := svc.RunDiagnostics(ctx, "router-1")
	require.NoError(t, err)

	// Second call immediately should be rate limited
	_, err = svc.RunDiagnostics(ctx, "router-1")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "rate limited")

	// Wait and try again
	time.Sleep(150 * time.Millisecond)
	_, err = svc.RunDiagnostics(ctx, "router-1")
	require.NoError(t, err)
}

func TestService_RunDiagnostics_NoRouterProvider(t *testing.T) {
	svc := NewService(ServiceConfig{})
	ctx := context.Background()

	_, err := svc.RunDiagnostics(ctx, "router-1")
	assert.Error(t, err)
}

func TestClassifyError(t *testing.T) {
	tests := []struct {
		name     string
		err      error
		expected ErrorCategory
	}{
		{
			name:     "timeout error",
			err:      errors.New("connection timeout"),
			expected: ErrorCategoryTimeout,
		},
		{
			name:     "deadline exceeded",
			err:      errors.New("context deadline exceeded"),
			expected: ErrorCategoryTimeout,
		},
		{
			name:     "connection refused",
			err:      errors.New("dial tcp: connection refused"),
			expected: ErrorCategoryRefused,
		},
		{
			name:     "auth error",
			err:      errors.New("authentication failed"),
			expected: ErrorCategoryAuthFailed,
		},
		{
			name:     "password error",
			err:      errors.New("invalid password"),
			expected: ErrorCategoryAuthFailed,
		},
		{
			name:     "tls error",
			err:      errors.New("tls handshake failed"),
			expected: ErrorCategoryTLSError,
		},
		{
			name:     "certificate error",
			err:      errors.New("x509 certificate error"),
			expected: ErrorCategoryTLSError,
		},
		{
			name:     "network error",
			err:      errors.New("no route to host"),
			expected: ErrorCategoryNetworkError,
		},
		{
			name:     "unknown error",
			err:      errors.New("some random error"),
			expected: ErrorCategoryProtocolError,
		},
		{
			name:     "nil error",
			err:      nil,
			expected: "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := ClassifyError(tt.err)
			assert.Equal(t, tt.expected, result)
		})
	}
}
