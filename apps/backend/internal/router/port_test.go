package router

import (
	"context"
	"testing"
	"time"
)

// portTestAdapter is a mock implementation of RouterPort for testing.
type portTestAdapter struct {
	connected bool
	protocol  Protocol
	health    HealthStatus
	info      *RouterInfo
	caps      PlatformCapabilities
}

func newPortTestAdapter(protocol Protocol) *portTestAdapter {
	return &portTestAdapter{
		protocol: protocol,
		health: HealthStatus{
			Status:    StatusDisconnected,
			LastCheck: time.Now(),
		},
		info: &RouterInfo{
			Model:    "MockRouter",
			Identity: "test-router",
			Version: RouterOSVersion{
				Major:   7,
				Minor:   12,
				Patch:   1,
				Channel: "stable",
				Raw:     "7.12.1",
			},
		},
		caps: PlatformCapabilities{
			SupportsREST:      true,
			SupportsBinaryAPI: true,
			SupportsSSH:       true,
		},
	}
}

func (m *portTestAdapter) Connect(ctx context.Context) error {
	m.connected = true
	m.health.Status = StatusConnected
	m.health.LastSuccess = time.Now()
	return nil
}

func (m *portTestAdapter) Disconnect() error {
	m.connected = false
	m.health.Status = StatusDisconnected
	return nil
}

func (m *portTestAdapter) IsConnected() bool {
	return m.connected
}

func (m *portTestAdapter) Health(ctx context.Context) HealthStatus {
	return m.health
}

func (m *portTestAdapter) Capabilities() PlatformCapabilities {
	return m.caps
}

func (m *portTestAdapter) Info() (*RouterInfo, error) {
	return m.info, nil
}

func (m *portTestAdapter) ExecuteCommand(ctx context.Context, cmd Command) (*CommandResult, error) {
	return &CommandResult{
		Success:  true,
		Duration: 10 * time.Millisecond,
	}, nil
}

func (m *portTestAdapter) QueryState(ctx context.Context, query StateQuery) (*StateResult, error) {
	return &StateResult{
		Resources: []map[string]string{
			{"name": "test", "type": "ether"},
		},
		Count:    1,
		Duration: 5 * time.Millisecond,
	}, nil
}

func (m *portTestAdapter) Protocol() Protocol {
	return m.protocol
}

// Compile-time verification that MockAdapter implements RouterPort.
var _ RouterPort = (*portTestAdapter)(nil)

func TestRouterPortInterface(t *testing.T) {
	t.Run("portTestAdapter implements RouterPort", func(t *testing.T) {
		var port RouterPort = newPortTestAdapter(ProtocolREST)

		// Test Connect
		err := port.Connect(context.Background())
		if err != nil {
			t.Errorf("Connect() error = %v", err)
		}

		// Test IsConnected
		if !port.IsConnected() {
			t.Error("IsConnected() = false, want true after Connect()")
		}

		// Test Health
		health := port.Health(context.Background())
		if health.Status != StatusConnected {
			t.Errorf("Health().Status = %v, want %v", health.Status, StatusConnected)
		}

		// Test Info
		info, err := port.Info()
		if err != nil {
			t.Errorf("Info() error = %v", err)
		}
		if info == nil {
			t.Error("Info() returned nil")
		}

		// Test Capabilities
		caps := port.Capabilities()
		if !caps.SupportsREST {
			t.Error("Capabilities().SupportsREST = false, want true")
		}

		// Test Protocol
		if port.Protocol() != ProtocolREST {
			t.Errorf("Protocol() = %v, want %v", port.Protocol(), ProtocolREST)
		}

		// Test ExecuteCommand
		result, err := port.ExecuteCommand(context.Background(), Command{
			Path:   "/interface",
			Action: "print",
		})
		if err != nil {
			t.Errorf("ExecuteCommand() error = %v", err)
		}
		if !result.Success {
			t.Error("ExecuteCommand().Success = false, want true")
		}

		// Test QueryState
		state, err := port.QueryState(context.Background(), StateQuery{
			Path: "/interface",
		})
		if err != nil {
			t.Errorf("QueryState() error = %v", err)
		}
		if state.Count == 0 {
			t.Error("QueryState().Count = 0, want > 0")
		}

		// Test Disconnect
		err = port.Disconnect()
		if err != nil {
			t.Errorf("Disconnect() error = %v", err)
		}
		if port.IsConnected() {
			t.Error("IsConnected() = true, want false after Disconnect()")
		}
	})
}

func TestProtocolString(t *testing.T) {
	tests := []struct {
		protocol Protocol
		want     string
	}{
		{ProtocolREST, "REST"},
		{ProtocolAPI, "API"},
		{ProtocolAPISSL, "API-SSL"},
		{ProtocolSSH, "SSH"},
		{ProtocolTelnet, "Telnet"},
		{Protocol(99), "Unknown"},
	}

	for _, tt := range tests {
		t.Run(tt.want, func(t *testing.T) {
			if got := tt.protocol.String(); got != tt.want {
				t.Errorf("Protocol.String() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestProtocolDefaultPort(t *testing.T) {
	tests := []struct {
		protocol Protocol
		want     int
	}{
		{ProtocolREST, 80},
		{ProtocolAPI, 8728},
		{ProtocolAPISSL, 8729},
		{ProtocolSSH, 22},
		{ProtocolTelnet, 23},
		{Protocol(99), 0},
	}

	for _, tt := range tests {
		t.Run(tt.protocol.String(), func(t *testing.T) {
			if got := tt.protocol.DefaultPort(); got != tt.want {
				t.Errorf("Protocol.DefaultPort() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestConnectionStatusString(t *testing.T) {
	tests := []struct {
		status ConnectionStatus
		want   string
	}{
		{StatusDisconnected, "DISCONNECTED"},
		{StatusConnecting, "CONNECTING"},
		{StatusConnected, "CONNECTED"},
		{StatusReconnecting, "RECONNECTING"},
		{StatusError, "ERROR"},
		{ConnectionStatus(99), "UNKNOWN"},
	}

	for _, tt := range tests {
		t.Run(tt.want, func(t *testing.T) {
			if got := tt.status.String(); got != tt.want {
				t.Errorf("ConnectionStatus.String() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestRouterOSVersionSupportsREST(t *testing.T) {
	tests := []struct {
		name    string
		version RouterOSVersion
		want    bool
	}{
		{"7.12.1 supports REST", RouterOSVersion{Major: 7, Minor: 12, Patch: 1}, true},
		{"7.1.0 supports REST", RouterOSVersion{Major: 7, Minor: 1, Patch: 0}, true},
		{"7.0.0 does not support REST", RouterOSVersion{Major: 7, Minor: 0, Patch: 0}, false},
		{"6.49.0 does not support REST", RouterOSVersion{Major: 6, Minor: 49, Patch: 0}, false},
		{"8.0.0 supports REST", RouterOSVersion{Major: 8, Minor: 0, Patch: 0}, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := tt.version.SupportsREST(); got != tt.want {
				t.Errorf("RouterOSVersion.SupportsREST() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestRouterOSVersionIsVersion6(t *testing.T) {
	tests := []struct {
		version RouterOSVersion
		want    bool
	}{
		{RouterOSVersion{Major: 6, Minor: 49}, true},
		{RouterOSVersion{Major: 7, Minor: 12}, false},
		{RouterOSVersion{Major: 5, Minor: 26}, false},
	}

	for _, tt := range tests {
		t.Run(tt.version.String(), func(t *testing.T) {
			if got := tt.version.IsVersion6(); got != tt.want {
				t.Errorf("RouterOSVersion.IsVersion6() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestRouterOSVersionString(t *testing.T) {
	tests := []struct {
		version RouterOSVersion
		want    string
	}{
		{RouterOSVersion{Major: 7, Minor: 12, Patch: 1, Raw: "7.12.1"}, "7.12.1"},
		{RouterOSVersion{Major: 7, Minor: 12, Patch: 0}, "7.12"},
		{RouterOSVersion{Major: 7, Minor: 12, Patch: 1}, "7.12.1"},
		{RouterOSVersion{Major: 6, Minor: 49, Patch: 7}, "6.49.7"},
	}

	for _, tt := range tests {
		t.Run(tt.want, func(t *testing.T) {
			if got := tt.version.String(); got != tt.want {
				t.Errorf("RouterOSVersion.String() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestAdapterError(t *testing.T) {
	t.Run("with cause", func(t *testing.T) {
		cause := &AdapterError{
			Protocol:  ProtocolSSH,
			Operation: "dial",
			Message:   "timeout",
		}
		err := &AdapterError{
			Protocol:  ProtocolREST,
			Operation: "connect",
			Message:   "connection failed",
			Cause:     cause,
			Retryable: true,
		}

		got := err.Error()
		want := "REST connect: connection failed: SSH dial: timeout"
		if got != want {
			t.Errorf("AdapterError.Error() = %v, want %v", got, want)
		}

		// Test Unwrap
		if err.Unwrap() != cause {
			t.Error("AdapterError.Unwrap() did not return cause")
		}
	})

	t.Run("without cause", func(t *testing.T) {
		err := &AdapterError{
			Protocol:  ProtocolAPI,
			Operation: "login",
			Message:   "authentication failed",
		}

		got := err.Error()
		want := "API login: authentication failed"
		if got != want {
			t.Errorf("AdapterError.Error() = %v, want %v", got, want)
		}
	})
}
