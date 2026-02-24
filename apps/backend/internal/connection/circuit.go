package connection

import (
	"context"
	"fmt"
	"time"

	"github.com/sony/gobreaker/v2"
)

// CircuitBreakerConfig holds configuration for the circuit breaker.
type CircuitBreakerConfig struct {
	// MaxFailures is the number of consecutive failures before opening the circuit.
	MaxFailures uint32

	// Timeout is the time to wait before attempting to close the circuit.
	Timeout time.Duration

	// MaxRequests is the number of requests allowed in half-open state.
	MaxRequests uint32
}

// DefaultCircuitBreakerConfig returns the default circuit breaker configuration.
// Per story spec: 3 failures -> OPEN, 5-minute cooldown.
func DefaultCircuitBreakerConfig() CircuitBreakerConfig {
	return CircuitBreakerConfig{
		MaxFailures: 3,
		Timeout:     5 * time.Minute,
		MaxRequests: 1,
	}
}

// CircuitBreaker wraps gobreaker for router connection management.
type CircuitBreaker struct {
	cb            *gobreaker.CircuitBreaker[any]
	config        CircuitBreakerConfig
	routerID      string
	onStateChange func(routerID string, from, to gobreaker.State)
}

// CircuitBreakerOption is a function that configures a CircuitBreaker.
type CircuitBreakerOption func(*CircuitBreaker)

// WithOnStateChange sets a callback for circuit breaker state changes.
func WithOnStateChange(fn func(routerID string, from, to gobreaker.State)) CircuitBreakerOption {
	return func(cb *CircuitBreaker) {
		cb.onStateChange = fn
	}
}

// NewCircuitBreaker creates a new circuit breaker for a router.
func NewCircuitBreaker(routerID string, config CircuitBreakerConfig, opts ...CircuitBreakerOption) *CircuitBreaker {
	wrapper := &CircuitBreaker{
		config:   config,
		routerID: routerID,
	}

	// Apply options
	for _, opt := range opts {
		opt(wrapper)
	}

	settings := gobreaker.Settings{
		Name:        fmt.Sprintf("router-%s", routerID),
		MaxRequests: config.MaxRequests,
		Interval:    0, // Don't clear counts automatically
		Timeout:     config.Timeout,
		ReadyToTrip: func(counts gobreaker.Counts) bool {
			return counts.ConsecutiveFailures >= config.MaxFailures
		},
		OnStateChange: func(name string, from, to gobreaker.State) {
			if wrapper.onStateChange != nil {
				wrapper.onStateChange(routerID, from, to)
			}
		},
	}

	wrapper.cb = gobreaker.NewCircuitBreaker[any](settings)
	return wrapper
}

// Execute runs a function with circuit breaker protection.
func (c *CircuitBreaker) Execute(fn func() (any, error)) (any, error) {
	return c.cb.Execute(fn)
}

// ExecuteWithContext runs a function with circuit breaker protection and context.
func (c *CircuitBreaker) ExecuteWithContext(ctx context.Context, fn func(ctx context.Context) (any, error)) (any, error) {
	return c.cb.Execute(func() (any, error) {
		select {
		case <-ctx.Done():
			return nil, ctx.Err()
		default:
			return fn(ctx)
		}
	})
}

// State returns the current state of the circuit breaker.
func (c *CircuitBreaker) State() gobreaker.State {
	return c.cb.State()
}

// StateString returns the string representation of the circuit breaker state.
func (c *CircuitBreaker) StateString() string {
	switch c.cb.State() {
	case gobreaker.StateClosed:
		return "CLOSED"
	case gobreaker.StateOpen:
		return "OPEN"
	case gobreaker.StateHalfOpen:
		return "HALF_OPEN"
	default:
		return "UNKNOWN"
	}
}

// IsOpen returns true if the circuit breaker is open.
func (c *CircuitBreaker) IsOpen() bool {
	return c.cb.State() == gobreaker.StateOpen
}

// IsClosed returns true if the circuit breaker is closed.
func (c *CircuitBreaker) IsClosed() bool {
	return c.cb.State() == gobreaker.StateClosed
}

// IsHalfOpen returns true if the circuit breaker is half-open.
func (c *CircuitBreaker) IsHalfOpen() bool {
	return c.cb.State() == gobreaker.StateHalfOpen
}

// Counts returns the current counts of the circuit breaker.
func (c *CircuitBreaker) Counts() gobreaker.Counts {
	return c.cb.Counts()
}

// RouterID returns the router ID associated with this circuit breaker.
func (c *CircuitBreaker) RouterID() string {
	return c.routerID
}

// CircuitBreakerFactory creates circuit breakers for routers.
type CircuitBreakerFactory struct {
	config        CircuitBreakerConfig
	onStateChange func(routerID string, from, to gobreaker.State)
}

// NewCircuitBreakerFactory creates a new factory with the given config.
func NewCircuitBreakerFactory(config CircuitBreakerConfig, onStateChange func(routerID string, from, to gobreaker.State)) *CircuitBreakerFactory {
	factory := &CircuitBreakerFactory{
		config:        config,
		onStateChange: onStateChange,
	}

	// Validate configuration
	if config.MaxFailures == 0 {
		config.MaxFailures = 3 // Default fallback
	}
	if config.Timeout == 0 {
		config.Timeout = 5 * time.Minute // Default fallback
	}

	return factory
}

// Create creates a new circuit breaker for a router.
func (f *CircuitBreakerFactory) Create(routerID string) *CircuitBreaker {
	return NewCircuitBreaker(routerID, f.config, WithOnStateChange(f.onStateChange))
}
