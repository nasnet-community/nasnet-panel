// Package connection provides connection management for router connections
// with automatic reconnection, circuit breaker, and health monitoring.
package connection

import (
	"errors"
	"fmt"
	"time"
)

// ConnectionState represents the current state of a router connection.
type ConnectionState int

const (
	// StateDisconnected - No active connection to the router.
	StateDisconnected ConnectionState = iota

	// StateConnecting - Connection attempt in progress.
	StateConnecting

	// StateConnected - Active and responsive connection.
	StateConnected

	// StateReconnecting - Connection lost, attempting to reconnect.
	StateReconnecting

	// StateError - Connection failed with error, not auto-reconnecting.
	StateError
)

// String returns the string representation of the connection state.
func (s ConnectionState) String() string {
	switch s {
	case StateDisconnected:
		return "disconnected"
	case StateConnecting:
		return "connecting"
	case StateConnected:
		return "connected"
	case StateReconnecting:
		return "reconnecting"
	case StateError:
		return "error"
	default:
		return "unknown"
	}
}

// ToGraphQL returns the GraphQL enum value for the connection state.
func (s ConnectionState) ToGraphQL() string {
	switch s {
	case StateDisconnected:
		return "DISCONNECTED"
	case StateConnecting:
		return "CONNECTING"
	case StateConnected:
		return "CONNECTED"
	case StateReconnecting:
		return "CONNECTING" // Map reconnecting to CONNECTING in GraphQL
	case StateError:
		return "ERROR"
	default:
		return "DISCONNECTED"
	}
}

// ParseConnectionState parses a string into a ConnectionState.
func ParseConnectionState(s string) (ConnectionState, error) {
	switch s {
	case "disconnected", "DISCONNECTED":
		return StateDisconnected, nil
	case "connecting", "CONNECTING":
		return StateConnecting, nil
	case "connected", "CONNECTED":
		return StateConnected, nil
	case "reconnecting", "RECONNECTING":
		return StateReconnecting, nil
	case "error", "ERROR":
		return StateError, nil
	default:
		return StateDisconnected, fmt.Errorf("unknown connection state: %s", s)
	}
}

// DisconnectReason indicates why a connection was disconnected.
type DisconnectReason int

const (
	// DisconnectReasonUnknown - Reason unknown.
	DisconnectReasonUnknown DisconnectReason = iota

	// DisconnectReasonManual - User manually disconnected.
	DisconnectReasonManual

	// DisconnectReasonNetworkFailure - Network error caused disconnection.
	DisconnectReasonNetworkFailure

	// DisconnectReasonAuthFailure - Authentication failed.
	DisconnectReasonAuthFailure

	// DisconnectReasonTimeout - Connection timed out.
	DisconnectReasonTimeout

	// DisconnectReasonCircuitOpen - Circuit breaker is open.
	DisconnectReasonCircuitOpen

	// DisconnectReasonShutdown - Application is shutting down.
	DisconnectReasonShutdown
)

// String returns the string representation of the disconnect reason.
func (r DisconnectReason) String() string {
	switch r {
	case DisconnectReasonUnknown:
		return "unknown"
	case DisconnectReasonManual:
		return "manual"
	case DisconnectReasonNetworkFailure:
		return "network_failure"
	case DisconnectReasonAuthFailure:
		return "auth_failure"
	case DisconnectReasonTimeout:
		return "timeout"
	case DisconnectReasonCircuitOpen:
		return "circuit_open"
	case DisconnectReasonShutdown:
		return "shutdown"
	default:
		return "unknown"
	}
}

// ShouldAutoReconnect returns true if this disconnect reason should trigger automatic reconnection.
func (r DisconnectReason) ShouldAutoReconnect() bool {
	switch r {
	case DisconnectReasonNetworkFailure, DisconnectReasonTimeout:
		return true
	case DisconnectReasonManual, DisconnectReasonAuthFailure, DisconnectReasonShutdown:
		return false
	case DisconnectReasonCircuitOpen:
		return false // Circuit breaker handles recovery
	default:
		return false
	}
}

// ErrInvalidStateTransition is returned when an invalid state transition is attempted.
var ErrInvalidStateTransition = errors.New("invalid state transition")

// validTransitions defines the valid state transitions.
// Key: current state, Value: slice of valid next states
var validTransitions = map[ConnectionState][]ConnectionState{
	StateDisconnected: {StateConnecting},
	StateConnecting:   {StateConnected, StateError, StateDisconnected},
	StateConnected:    {StateReconnecting, StateDisconnected},
	StateReconnecting: {StateConnected, StateError, StateDisconnected},
	StateError:        {StateDisconnected, StateConnecting},
}

// CanTransitionTo checks if a transition from current to next state is valid.
func (s ConnectionState) CanTransitionTo(next ConnectionState) bool {
	validNext, ok := validTransitions[s]
	if !ok {
		return false
	}
	for _, valid := range validNext {
		if valid == next {
			return true
		}
	}
	return false
}

// ConnectionStatus holds the complete status of a connection.
type ConnectionStatus struct {
	// State is the current connection state.
	State ConnectionState `json:"state"`

	// Protocol is the protocol currently in use (or last used).
	Protocol string `json:"protocol,omitempty"`

	// PreferredProtocol is the user's preferred protocol (if set).
	PreferredProtocol string `json:"preferredProtocol,omitempty"`

	// ConnectedAt is when the current connection was established.
	ConnectedAt *time.Time `json:"connectedAt,omitempty"`

	// DisconnectedAt is when the last disconnection occurred.
	DisconnectedAt *time.Time `json:"disconnectedAt,omitempty"`

	// LastError is the most recent error message.
	LastError string `json:"lastError,omitempty"`

	// LastErrorTime is when the last error occurred.
	LastErrorTime *time.Time `json:"lastErrorTime,omitempty"`

	// DisconnectReason is why the connection was disconnected.
	DisconnectReason DisconnectReason `json:"disconnectReason,omitempty"`

	// ReconnectAttempts is the number of reconnection attempts made.
	ReconnectAttempts int `json:"reconnectAttempts"`

	// NextReconnectAt is when the next reconnection attempt will be made.
	NextReconnectAt *time.Time `json:"nextReconnectAt,omitempty"`

	// CircuitBreakerState is the state of the circuit breaker.
	CircuitBreakerState string `json:"circuitBreakerState,omitempty"`

	// Version is the router version (if connected).
	Version string `json:"version,omitempty"`

	// LastHealthCheck is when the last health check was performed.
	LastHealthCheck *time.Time `json:"lastHealthCheck,omitempty"`

	// HealthChecksPassed is the count of consecutive passed health checks.
	HealthChecksPassed int `json:"healthChecksPassed"`

	// HealthChecksFailed is the count of consecutive failed health checks.
	HealthChecksFailed int `json:"healthChecksFailed"`
}

// Uptime returns the duration since the connection was established.
// Returns 0 if not connected.
func (cs *ConnectionStatus) Uptime() time.Duration {
	if cs.State != StateConnected || cs.ConnectedAt == nil {
		return 0
	}
	return time.Since(*cs.ConnectedAt)
}

// NewConnectionStatus creates a new ConnectionStatus in the disconnected state.
func NewConnectionStatus() *ConnectionStatus {
	return &ConnectionStatus{
		State: StateDisconnected,
	}
}

// SetState transitions the connection to a new state.
// Returns an error if the transition is invalid.
func (cs *ConnectionStatus) SetState(newState ConnectionState) error {
	if !cs.State.CanTransitionTo(newState) {
		return fmt.Errorf("%w: %s -> %s", ErrInvalidStateTransition, cs.State, newState)
	}
	cs.State = newState
	return nil
}

// SetConnected transitions to connected state and records the connection time.
func (cs *ConnectionStatus) SetConnected(protocol, version string) error {
	if err := cs.SetState(StateConnected); err != nil {
		return err
	}
	now := time.Now()
	cs.ConnectedAt = &now
	cs.Protocol = protocol
	cs.Version = version
	cs.ReconnectAttempts = 0
	cs.NextReconnectAt = nil
	cs.LastError = ""
	cs.LastErrorTime = nil
	cs.HealthChecksPassed = 0
	cs.HealthChecksFailed = 0
	return nil
}

// SetDisconnected transitions to disconnected state.
func (cs *ConnectionStatus) SetDisconnected(reason DisconnectReason) error {
	if err := cs.SetState(StateDisconnected); err != nil {
		return err
	}
	now := time.Now()
	cs.DisconnectedAt = &now
	cs.DisconnectReason = reason
	cs.ConnectedAt = nil
	return nil
}

// SetReconnecting transitions to reconnecting state.
func (cs *ConnectionStatus) SetReconnecting(attempt int, nextAttemptAt time.Time) error {
	if err := cs.SetState(StateReconnecting); err != nil {
		return err
	}
	cs.ReconnectAttempts = attempt
	cs.NextReconnectAt = &nextAttemptAt
	return nil
}

// SetError transitions to error state with an error message.
func (cs *ConnectionStatus) SetError(errMsg string) error {
	if err := cs.SetState(StateError); err != nil {
		return err
	}
	now := time.Now()
	cs.LastError = errMsg
	cs.LastErrorTime = &now
	return nil
}

// SetConnecting transitions to connecting state.
func (cs *ConnectionStatus) SetConnecting() error {
	return cs.SetState(StateConnecting)
}

// RecordHealthCheck records the result of a health check.
func (cs *ConnectionStatus) RecordHealthCheck(passed bool) {
	now := time.Now()
	cs.LastHealthCheck = &now
	if passed {
		cs.HealthChecksPassed++
		cs.HealthChecksFailed = 0
	} else {
		cs.HealthChecksFailed++
		cs.HealthChecksPassed = 0
	}
}
