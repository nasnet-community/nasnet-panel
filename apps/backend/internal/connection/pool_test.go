package connection

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestProtocol_String(t *testing.T) {
	tests := []struct {
		protocol Protocol
		expected string
	}{
		{ProtocolREST, "REST"},
		{ProtocolAPI, "API"},
		{ProtocolAPISSL, "API_SSL"},
		{ProtocolSSH, "SSH"},
		{ProtocolTelnet, "TELNET"},
	}

	for _, tt := range tests {
		t.Run(string(tt.protocol), func(t *testing.T) {
			assert.Equal(t, tt.expected, tt.protocol.String())
		})
	}
}

func TestDefaultConnectionConfig(t *testing.T) {
	config := DefaultConnectionConfig()

	assert.Equal(t, 8728, config.Port)
	assert.Equal(t, 30*time.Second, config.ConnectionTimeout)
	assert.Equal(t, 30*time.Second, config.HealthCheckInterval)
}

func TestNewConnection(t *testing.T) {
	config := ConnectionConfig{
		Host:     "192.168.88.1",
		Port:     8728,
		Username: "admin",
		Password: "secret",
	}

	cbConfig := DefaultCircuitBreakerConfig()
	cb := NewCircuitBreaker("router-1", cbConfig)

	conn := NewConnection("router-1", config, cb)

	assert.NotNil(t, conn)
	assert.Equal(t, "router-1", conn.RouterID)
	assert.NotNil(t, conn.Status)
	assert.Equal(t, StateDisconnected, conn.Status.State)
	assert.NotNil(t, conn.CircuitBreaker)
}

func TestConnection_GetStatus(t *testing.T) {
	config := ConnectionConfig{
		Host:     "192.168.88.1",
		Port:     8728,
		Username: "admin",
		Password: "secret",
	}

	cbConfig := DefaultCircuitBreakerConfig()
	cb := NewCircuitBreaker("router-1", cbConfig)
	conn := NewConnection("router-1", config, cb)

	status := conn.GetStatus()

	assert.Equal(t, StateDisconnected, status.State)
	assert.Equal(t, "CLOSED", status.CircuitBreakerState)
}

func TestConnection_SetPreferredProtocol(t *testing.T) {
	config := ConnectionConfig{
		Host:     "192.168.88.1",
		Port:     8728,
		Username: "admin",
	}

	conn := NewConnection("router-1", config, nil)
	conn.SetPreferredProtocol(ProtocolSSH)

	assert.Equal(t, ProtocolSSH, conn.Config().PreferredProtocol)
	assert.Equal(t, "SSH", conn.Status.PreferredProtocol)
}

func TestConnection_ManualDisconnect(t *testing.T) {
	conn := NewConnection("router-1", ConnectionConfig{}, nil)

	assert.False(t, conn.IsManuallyDisconnected())

	conn.SetManuallyDisconnected(true)
	assert.True(t, conn.IsManuallyDisconnected())

	conn.SetManuallyDisconnected(false)
	assert.False(t, conn.IsManuallyDisconnected())
}

func TestConnection_CanAttemptReconnect(t *testing.T) {
	conn := NewConnection("router-1", ConnectionConfig{}, nil)

	// First attempt should be allowed
	canAttempt, waitTime := conn.CanAttemptReconnect()
	assert.True(t, canAttempt)
	assert.Zero(t, waitTime)

	// Record an attempt
	conn.RecordReconnectAttempt()

	// Immediate second attempt should be rate limited
	canAttempt, waitTime = conn.CanAttemptReconnect()
	assert.False(t, canAttempt)
	assert.Greater(t, waitTime, time.Duration(0))
}

func TestConnection_UpdateStatus(t *testing.T) {
	conn := NewConnection("router-1", ConnectionConfig{}, nil)

	conn.UpdateStatus(func(status *ConnectionStatus) {
		_ = status.SetConnecting()
	})

	assert.Equal(t, StateConnecting, conn.Status.State)
}

func TestConnectionPool_NewConnectionPool(t *testing.T) {
	pool := NewConnectionPool()

	assert.NotNil(t, pool)
	assert.Zero(t, pool.Count())
}

func TestConnectionPool_Add(t *testing.T) {
	pool := NewConnectionPool()
	conn := NewConnection("router-1", ConnectionConfig{}, nil)

	pool.Add(conn)

	assert.Equal(t, 1, pool.Count())
	assert.Equal(t, conn, pool.Get("router-1"))
}

func TestConnectionPool_Get(t *testing.T) {
	pool := NewConnectionPool()
	conn := NewConnection("router-1", ConnectionConfig{}, nil)
	pool.Add(conn)

	// Existing connection
	found := pool.Get("router-1")
	assert.Equal(t, conn, found)

	// Non-existent connection
	notFound := pool.Get("router-2")
	assert.Nil(t, notFound)
}

func TestConnectionPool_GetOrCreate(t *testing.T) {
	pool := NewConnectionPool()
	config := ConnectionConfig{
		Host:     "192.168.88.1",
		Port:     8728,
		Username: "admin",
	}

	cbConfig := DefaultCircuitBreakerConfig()
	cb := NewCircuitBreaker("router-1", cbConfig)

	// First call creates
	conn1 := pool.GetOrCreate("router-1", config, cb)
	assert.NotNil(t, conn1)
	assert.Equal(t, 1, pool.Count())

	// Second call returns existing
	conn2 := pool.GetOrCreate("router-1", config, cb)
	assert.Equal(t, conn1, conn2)
	assert.Equal(t, 1, pool.Count())
}

func TestConnectionPool_Remove(t *testing.T) {
	pool := NewConnectionPool()
	conn := NewConnection("router-1", ConnectionConfig{}, nil)
	pool.Add(conn)

	removed := pool.Remove("router-1")

	assert.Equal(t, conn, removed)
	assert.Zero(t, pool.Count())
	assert.Nil(t, pool.Get("router-1"))

	// Removing non-existent returns nil
	notFound := pool.Remove("router-2")
	assert.Nil(t, notFound)
}

func TestConnectionPool_GetAll(t *testing.T) {
	pool := NewConnectionPool()
	conn1 := NewConnection("router-1", ConnectionConfig{}, nil)
	conn2 := NewConnection("router-2", ConnectionConfig{}, nil)
	conn3 := NewConnection("router-3", ConnectionConfig{}, nil)

	pool.Add(conn1)
	pool.Add(conn2)
	pool.Add(conn3)

	all := pool.GetAll()

	assert.Len(t, all, 3)
}

func TestConnectionPool_CountByState(t *testing.T) {
	pool := NewConnectionPool()

	conn1 := NewConnection("router-1", ConnectionConfig{}, nil)
	conn2 := NewConnection("router-2", ConnectionConfig{}, nil)
	conn3 := NewConnection("router-3", ConnectionConfig{}, nil)

	// Set different states
	conn2.UpdateStatus(func(status *ConnectionStatus) {
		_ = status.SetConnecting()
		_ = status.SetConnected("API", "7.12")
	})

	conn3.UpdateStatus(func(status *ConnectionStatus) {
		_ = status.SetConnecting()
	})

	pool.Add(conn1)
	pool.Add(conn2)
	pool.Add(conn3)

	assert.Equal(t, 1, pool.CountByState(StateDisconnected))
	assert.Equal(t, 1, pool.CountByState(StateConnected))
	assert.Equal(t, 1, pool.CountByState(StateConnecting))
	assert.Equal(t, 0, pool.CountByState(StateError))
}

func TestConnectionPool_CloseAll(t *testing.T) {
	pool := NewConnectionPool()

	conn1 := NewConnection("router-1", ConnectionConfig{}, nil)
	conn2 := NewConnection("router-2", ConnectionConfig{}, nil)

	pool.Add(conn1)
	pool.Add(conn2)

	err := pool.CloseAll(context.Background())

	assert.NoError(t, err)
	assert.Zero(t, pool.Count())
}

func TestDefaultBackoffConfig(t *testing.T) {
	config := DefaultBackoffConfig()

	assert.Equal(t, 1*time.Second, config.InitialInterval)
	assert.Equal(t, 30*time.Second, config.MaxInterval)
	assert.Equal(t, 2.0, config.Multiplier)
	assert.Equal(t, 0.5, config.RandomizationFactor)
	assert.Zero(t, config.MaxElapsedTime)
}

func TestNewExponentialBackoff(t *testing.T) {
	config := BackoffConfig{
		InitialInterval:     1 * time.Second,
		MaxInterval:         30 * time.Second,
		Multiplier:          2.0,
		RandomizationFactor: 0.5,
		MaxElapsedTime:      0,
	}

	b := NewExponentialBackoff(config)

	assert.NotNil(t, b)
	assert.Equal(t, 1*time.Second, b.InitialInterval)
	assert.Equal(t, 30*time.Second, b.MaxInterval)
}

func TestNewExponentialBackoffWithContext(t *testing.T) {
	ctx := context.Background()
	config := DefaultBackoffConfig()

	b := NewExponentialBackoffWithContext(ctx, config)

	assert.NotNil(t, b)
}

func TestTransitionError(t *testing.T) {
	err := &TransitionError{
		RouterID: "router-1",
		From:     StateDisconnected,
		To:       StateConnected,
		Reason:   "must go through CONNECTING",
	}

	expected := "connection router-1: invalid transition from disconnected to connected: must go through CONNECTING"
	assert.Equal(t, expected, err.Error())
}

func TestConnection_CancelFunctions(t *testing.T) {
	conn := NewConnection("router-1", ConnectionConfig{}, nil)

	// Test reconnect cancel
	ctx1, cancel1 := context.WithCancel(context.Background())
	conn.SetReconnectCancel(cancel1)

	// Should not panic when canceling
	conn.CancelReconnect()

	// Verify context was canceled
	select {
	case <-ctx1.Done():
		// Expected
	default:
		t.Error("reconnect context should be canceled")
	}

	// Test health cancel
	ctx2, cancel2 := context.WithCancel(context.Background())
	conn.SetHealthCancel(cancel2)

	conn.CancelHealthCheck()

	select {
	case <-ctx2.Done():
		// Expected
	default:
		t.Error("health context should be canceled")
	}
}

func TestConnection_CircuitBreakerRateLimiting(t *testing.T) {
	cbConfig := CircuitBreakerConfig{
		MaxFailures: 2,
		Timeout:     100 * time.Millisecond,
		MaxRequests: 1,
	}
	cb := NewCircuitBreaker("router-1", cbConfig)

	conn := NewConnection("router-1", ConnectionConfig{}, cb)

	// Trip the circuit breaker
	for i := 0; i < 2; i++ {
		_, _ = cb.Execute(func() (any, error) {
			return nil, errors.New("test failure")
		})
	}

	// When circuit is open, should not allow reconnection
	canAttempt, _ := conn.CanAttemptReconnect()
	assert.False(t, canAttempt)
}
