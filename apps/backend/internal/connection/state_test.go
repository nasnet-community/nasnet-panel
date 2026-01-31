package connection

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestConnectionState_String(t *testing.T) {
	tests := []struct {
		state    ConnectionState
		expected string
	}{
		{StateDisconnected, "disconnected"},
		{StateConnecting, "connecting"},
		{StateConnected, "connected"},
		{StateReconnecting, "reconnecting"},
		{StateError, "error"},
		{ConnectionState(99), "unknown"},
	}

	for _, tt := range tests {
		t.Run(tt.expected, func(t *testing.T) {
			assert.Equal(t, tt.expected, tt.state.String())
		})
	}
}

func TestConnectionState_ToGraphQL(t *testing.T) {
	tests := []struct {
		state    ConnectionState
		expected string
	}{
		{StateDisconnected, "DISCONNECTED"},
		{StateConnecting, "CONNECTING"},
		{StateConnected, "CONNECTED"},
		{StateReconnecting, "CONNECTING"}, // Maps to CONNECTING
		{StateError, "ERROR"},
	}

	for _, tt := range tests {
		t.Run(tt.state.String(), func(t *testing.T) {
			assert.Equal(t, tt.expected, tt.state.ToGraphQL())
		})
	}
}

func TestParseConnectionState(t *testing.T) {
	tests := []struct {
		input     string
		expected  ConnectionState
		expectErr bool
	}{
		{"disconnected", StateDisconnected, false},
		{"DISCONNECTED", StateDisconnected, false},
		{"connecting", StateConnecting, false},
		{"CONNECTING", StateConnecting, false},
		{"connected", StateConnected, false},
		{"CONNECTED", StateConnected, false},
		{"reconnecting", StateReconnecting, false},
		{"error", StateError, false},
		{"invalid", StateDisconnected, true},
	}

	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			state, err := ParseConnectionState(tt.input)
			if tt.expectErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
				assert.Equal(t, tt.expected, state)
			}
		})
	}
}

func TestConnectionState_CanTransitionTo(t *testing.T) {
	tests := []struct {
		from    ConnectionState
		to      ConnectionState
		allowed bool
	}{
		// From DISCONNECTED
		{StateDisconnected, StateConnecting, true},
		{StateDisconnected, StateConnected, false},
		{StateDisconnected, StateReconnecting, false},
		{StateDisconnected, StateError, false},

		// From CONNECTING
		{StateConnecting, StateConnected, true},
		{StateConnecting, StateError, true},
		{StateConnecting, StateDisconnected, true},
		{StateConnecting, StateReconnecting, false},

		// From CONNECTED
		{StateConnected, StateReconnecting, true},
		{StateConnected, StateDisconnected, true},
		{StateConnected, StateConnecting, false},
		{StateConnected, StateError, false},

		// From RECONNECTING
		{StateReconnecting, StateConnected, true},
		{StateReconnecting, StateError, true},
		{StateReconnecting, StateDisconnected, true},
		{StateReconnecting, StateConnecting, false},

		// From ERROR
		{StateError, StateDisconnected, true},
		{StateError, StateConnecting, true},
		{StateError, StateConnected, false},
		{StateError, StateReconnecting, false},
	}

	for _, tt := range tests {
		t.Run(tt.from.String()+"_to_"+tt.to.String(), func(t *testing.T) {
			assert.Equal(t, tt.allowed, tt.from.CanTransitionTo(tt.to))
		})
	}
}

func TestDisconnectReason_ShouldAutoReconnect(t *testing.T) {
	tests := []struct {
		reason          DisconnectReason
		shouldReconnect bool
	}{
		{DisconnectReasonUnknown, false},
		{DisconnectReasonManual, false},
		{DisconnectReasonNetworkFailure, true},
		{DisconnectReasonAuthFailure, false},
		{DisconnectReasonTimeout, true},
		{DisconnectReasonCircuitOpen, false},
		{DisconnectReasonShutdown, false},
	}

	for _, tt := range tests {
		t.Run(tt.reason.String(), func(t *testing.T) {
			assert.Equal(t, tt.shouldReconnect, tt.reason.ShouldAutoReconnect())
		})
	}
}

func TestConnectionStatus_NewConnectionStatus(t *testing.T) {
	status := NewConnectionStatus()

	assert.Equal(t, StateDisconnected, status.State)
	assert.Empty(t, status.Protocol)
	assert.Nil(t, status.ConnectedAt)
	assert.Zero(t, status.ReconnectAttempts)
}

func TestConnectionStatus_SetConnected(t *testing.T) {
	status := NewConnectionStatus()

	// Must go through CONNECTING first
	err := status.SetConnecting()
	require.NoError(t, err)

	err = status.SetConnected("API", "7.12")
	require.NoError(t, err)

	assert.Equal(t, StateConnected, status.State)
	assert.Equal(t, "API", status.Protocol)
	assert.Equal(t, "7.12", status.Version)
	assert.NotNil(t, status.ConnectedAt)
	assert.Zero(t, status.ReconnectAttempts)
}

func TestConnectionStatus_SetDisconnected(t *testing.T) {
	status := NewConnectionStatus()

	// Connect first
	_ = status.SetConnecting()
	_ = status.SetConnected("API", "7.12")

	err := status.SetDisconnected(DisconnectReasonManual)
	require.NoError(t, err)

	assert.Equal(t, StateDisconnected, status.State)
	assert.Equal(t, DisconnectReasonManual, status.DisconnectReason)
	assert.NotNil(t, status.DisconnectedAt)
	assert.Nil(t, status.ConnectedAt)
}

func TestConnectionStatus_SetReconnecting(t *testing.T) {
	status := NewConnectionStatus()

	// Connect first, then trigger reconnect
	_ = status.SetConnecting()
	_ = status.SetConnected("API", "7.12")

	nextAttempt := time.Now().Add(5 * time.Second)
	err := status.SetReconnecting(3, nextAttempt)
	require.NoError(t, err)

	assert.Equal(t, StateReconnecting, status.State)
	assert.Equal(t, 3, status.ReconnectAttempts)
	assert.NotNil(t, status.NextReconnectAt)
}

func TestConnectionStatus_SetError(t *testing.T) {
	status := NewConnectionStatus()

	// Try to connect, then error
	_ = status.SetConnecting()

	err := status.SetError("connection refused")
	require.NoError(t, err)

	assert.Equal(t, StateError, status.State)
	assert.Equal(t, "connection refused", status.LastError)
	assert.NotNil(t, status.LastErrorTime)
}

func TestConnectionStatus_Uptime(t *testing.T) {
	status := NewConnectionStatus()

	// Not connected - should return 0
	assert.Zero(t, status.Uptime())

	// Connect
	_ = status.SetConnecting()
	_ = status.SetConnected("API", "7.12")

	// Should have some uptime now
	time.Sleep(10 * time.Millisecond)
	uptime := status.Uptime()
	assert.Greater(t, uptime, time.Duration(0))
}

func TestConnectionStatus_RecordHealthCheck(t *testing.T) {
	status := NewConnectionStatus()

	// Record passing checks
	status.RecordHealthCheck(true)
	assert.Equal(t, 1, status.HealthChecksPassed)
	assert.Equal(t, 0, status.HealthChecksFailed)

	status.RecordHealthCheck(true)
	assert.Equal(t, 2, status.HealthChecksPassed)
	assert.Equal(t, 0, status.HealthChecksFailed)

	// Record failing check - resets passed counter
	status.RecordHealthCheck(false)
	assert.Equal(t, 0, status.HealthChecksPassed)
	assert.Equal(t, 1, status.HealthChecksFailed)

	// Another pass - resets failed counter
	status.RecordHealthCheck(true)
	assert.Equal(t, 1, status.HealthChecksPassed)
	assert.Equal(t, 0, status.HealthChecksFailed)
}

func TestConnectionStatus_InvalidTransition(t *testing.T) {
	status := NewConnectionStatus()

	// Try invalid transition: DISCONNECTED -> CONNECTED (skipping CONNECTING)
	err := status.SetState(StateConnected)
	assert.Error(t, err)
	assert.ErrorIs(t, err, ErrInvalidStateTransition)

	// State should remain unchanged
	assert.Equal(t, StateDisconnected, status.State)
}
