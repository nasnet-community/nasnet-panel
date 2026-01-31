package connection

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/sony/gobreaker/v2"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestCircuitBreaker_DefaultConfig(t *testing.T) {
	config := DefaultCircuitBreakerConfig()

	assert.Equal(t, uint32(3), config.MaxFailures)
	assert.Equal(t, 5*time.Minute, config.Timeout)
	assert.Equal(t, uint32(1), config.MaxRequests)
}

func TestCircuitBreaker_NewCircuitBreaker(t *testing.T) {
	config := CircuitBreakerConfig{
		MaxFailures: 3,
		Timeout:     5 * time.Second, // Shorter for testing
		MaxRequests: 1,
	}

	cb := NewCircuitBreaker("router-123", config)

	assert.NotNil(t, cb)
	assert.Equal(t, "router-123", cb.RouterID())
	assert.True(t, cb.IsClosed())
}

func TestCircuitBreaker_Execute_Success(t *testing.T) {
	config := CircuitBreakerConfig{
		MaxFailures: 3,
		Timeout:     5 * time.Second,
		MaxRequests: 1,
	}
	cb := NewCircuitBreaker("router-123", config)

	result, err := cb.Execute(func() (any, error) {
		return "success", nil
	})

	assert.NoError(t, err)
	assert.Equal(t, "success", result)
	assert.True(t, cb.IsClosed())
}

func TestCircuitBreaker_Execute_Failure(t *testing.T) {
	config := CircuitBreakerConfig{
		MaxFailures: 3,
		Timeout:     5 * time.Second,
		MaxRequests: 1,
	}
	cb := NewCircuitBreaker("router-123", config)

	expectedErr := errors.New("connection failed")

	result, err := cb.Execute(func() (any, error) {
		return nil, expectedErr
	})

	assert.Error(t, err)
	assert.Nil(t, result)
	assert.True(t, cb.IsClosed()) // Still closed after 1 failure
}

func TestCircuitBreaker_TripsAfterMaxFailures(t *testing.T) {
	config := CircuitBreakerConfig{
		MaxFailures: 3,
		Timeout:     5 * time.Second,
		MaxRequests: 1,
	}
	cb := NewCircuitBreaker("router-123", config)

	expectedErr := errors.New("connection failed")

	// Cause 3 failures to trip the circuit
	for i := 0; i < 3; i++ {
		_, _ = cb.Execute(func() (any, error) {
			return nil, expectedErr
		})
	}

	// Circuit should now be open
	assert.True(t, cb.IsOpen())
	assert.Equal(t, "OPEN", cb.StateString())

	// Further requests should fail fast
	result, err := cb.Execute(func() (any, error) {
		return "should not execute", nil
	})

	assert.Error(t, err)
	assert.Nil(t, result)
	assert.Equal(t, gobreaker.ErrOpenState, err)
}

func TestCircuitBreaker_StateChangeCallback(t *testing.T) {
	var callbackCalled bool
	var callbackRouterID string
	var callbackFrom, callbackTo gobreaker.State

	config := CircuitBreakerConfig{
		MaxFailures: 2,
		Timeout:     100 * time.Millisecond, // Short for testing
		MaxRequests: 1,
	}

	cb := NewCircuitBreaker("router-123", config, WithOnStateChange(func(routerID string, from, to gobreaker.State) {
		callbackCalled = true
		callbackRouterID = routerID
		callbackFrom = from
		callbackTo = to
	}))

	// Cause failures to trip the circuit
	for i := 0; i < 2; i++ {
		_, _ = cb.Execute(func() (any, error) {
			return nil, errors.New("fail")
		})
	}

	assert.True(t, callbackCalled)
	assert.Equal(t, "router-123", callbackRouterID)
	assert.Equal(t, gobreaker.StateClosed, callbackFrom)
	assert.Equal(t, gobreaker.StateOpen, callbackTo)
}

func TestCircuitBreaker_ExecuteWithContext_Cancellation(t *testing.T) {
	config := CircuitBreakerConfig{
		MaxFailures: 3,
		Timeout:     5 * time.Second,
		MaxRequests: 1,
	}
	cb := NewCircuitBreaker("router-123", config)

	ctx, cancel := context.WithCancel(context.Background())
	cancel() // Cancel immediately

	result, err := cb.ExecuteWithContext(ctx, func(ctx context.Context) (any, error) {
		return "should not execute", nil
	})

	assert.Error(t, err)
	assert.Nil(t, result)
	assert.Equal(t, context.Canceled, err)
}

func TestCircuitBreaker_Counts(t *testing.T) {
	config := CircuitBreakerConfig{
		MaxFailures: 5,
		Timeout:     5 * time.Second,
		MaxRequests: 1,
	}
	cb := NewCircuitBreaker("router-123", config)

	// Execute some successes and failures
	_, _ = cb.Execute(func() (any, error) { return "ok", nil })
	_, _ = cb.Execute(func() (any, error) { return nil, errors.New("fail") })
	_, _ = cb.Execute(func() (any, error) { return "ok", nil })
	_, _ = cb.Execute(func() (any, error) { return nil, errors.New("fail") })

	counts := cb.Counts()

	assert.Equal(t, uint32(4), counts.Requests)
	assert.Equal(t, uint32(2), counts.TotalSuccesses)
	assert.Equal(t, uint32(2), counts.TotalFailures)
	assert.Equal(t, uint32(1), counts.ConsecutiveFailures)
}

func TestCircuitBreakerFactory(t *testing.T) {
	var stateChanges []string

	config := CircuitBreakerConfig{
		MaxFailures: 3,
		Timeout:     5 * time.Second,
		MaxRequests: 1,
	}

	factory := NewCircuitBreakerFactory(config, func(routerID string, from, to gobreaker.State) {
		stateChanges = append(stateChanges, routerID)
	})

	cb1 := factory.Create("router-1")
	cb2 := factory.Create("router-2")

	assert.NotNil(t, cb1)
	assert.NotNil(t, cb2)
	assert.Equal(t, "router-1", cb1.RouterID())
	assert.Equal(t, "router-2", cb2.RouterID())
}

func TestCircuitBreaker_RecoveryAfterTimeout(t *testing.T) {
	config := CircuitBreakerConfig{
		MaxFailures: 2,
		Timeout:     100 * time.Millisecond, // Short timeout for testing
		MaxRequests: 1,
	}
	cb := NewCircuitBreaker("router-123", config)

	// Trip the circuit
	for i := 0; i < 2; i++ {
		_, _ = cb.Execute(func() (any, error) {
			return nil, errors.New("fail")
		})
	}

	require.True(t, cb.IsOpen())

	// Wait for timeout
	time.Sleep(150 * time.Millisecond)

	// Should be half-open now, try a successful call
	result, err := cb.Execute(func() (any, error) {
		return "success", nil
	})

	assert.NoError(t, err)
	assert.Equal(t, "success", result)
	assert.True(t, cb.IsClosed()) // Should be closed after successful recovery
}
