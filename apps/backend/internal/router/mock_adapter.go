package router

import (
	"context"
	"fmt"
	"time"
)

// MockAdapter provides test implementation of RouterPort for development.
// This adapter returns mock data for troubleshooting diagnostic commands.
// It should be replaced with a real RouterPort adapter when ClientFactory is implemented.
type MockAdapter struct {
	routerID string
}

// NewMockAdapter creates a new mock router adapter for testing.
func NewMockAdapter(routerID string) *MockAdapter {
	return &MockAdapter{routerID: routerID}
}

// ExecuteCommand simulates RouterOS command execution with canned responses.
// Returns mock data based on command path to support troubleshooting diagnostics.
func (m *MockAdapter) ExecuteCommand(ctx context.Context, cmd Command) (*CommandResult, error) {
	switch cmd.Path {
	case "/interface":
		// Mock WAN interface status - interface is up and running
		return &CommandResult{
			Success: true,
			Data: []map[string]string{
				{
					"name":     "ether1",
					"disabled": "false",
					"running":  "true",
					".id":      "*1",
				},
			},
		}, nil

	case "/ip/route":
		// Mock default route with gateway
		return &CommandResult{
			Success: true,
			Data: []map[string]string{
				{
					"dst-address": "0.0.0.0/0",
					"gateway":     "192.168.1.1",
					"interface":   "ether1",
					".id":         "*1",
				},
			},
		}, nil

	case "/ip/firewall/nat":
		// Mock NAT masquerade rule
		return &CommandResult{
			Success: true,
			Data: []map[string]string{
				{
					"chain":         "srcnat",
					"action":        "masquerade",
					"out-interface": "ether1",
					"disabled":      "false",
					".id":           "*1",
				},
			},
		}, nil

	case "/ip/dns":
		// Mock DNS configuration
		return &CommandResult{
			Success: true,
			Data: []map[string]string{
				{
					"servers":        "8.8.8.8,8.8.4.4",
					"allow-remote":   "no",
					"cache-size":     "2048KiB",
					"cache-used":     "128KiB",
					"cache-max-ttl":  "1w",
				},
			},
		}, nil

	case "/ip/dhcp-client":
		// Mock DHCP client status
		return &CommandResult{
			Success: true,
			Data: []map[string]string{
				{
					"interface": "ether1",
					"status":    "bound",
					"address":   "192.168.1.100/24",
					"gateway":   "192.168.1.1",
					"disabled":  "false",
					".id":       "*1",
				},
			},
		}, nil

	case "/ping":
		// Mock ping command success
		// Real implementation would parse cmd.Query for target
		return &CommandResult{
			Success: true,
			Data: []map[string]string{
				{
					"host":        "8.8.8.8",
					"sent":        "4",
					"received":    "4",
					"packet-loss": "0",
					"min-rtt":     "10ms",
					"avg-rtt":     "12ms",
					"max-rtt":     "15ms",
				},
			},
		}, nil

	case "/tool/dns-lookup":
		// Mock DNS resolution
		return &CommandResult{
			Success: true,
			Data: []map[string]string{
				{
					"name":    "google.com",
					"address": "142.250.185.78",
				},
			},
		}, nil

	default:
		// Unknown command - return empty success
		return &CommandResult{
			Success: true,
			Data:    []map[string]string{},
		}, nil
	}
}

// GetRouterID returns the router ID this adapter is connected to.
func (m *MockAdapter) GetRouterID() string {
	return m.routerID
}

// Close is a no-op for mock adapter since there's no real connection.
func (m *MockAdapter) Close() error {
	return nil
}

// Connect is a no-op for mock adapter (always connected).
func (m *MockAdapter) Connect(ctx context.Context) error {
	return nil
}

// Disconnect is a no-op for mock adapter.
func (m *MockAdapter) Disconnect() error {
	return nil
}

// IsConnected always returns true for mock adapter.
func (m *MockAdapter) IsConnected() bool {
	return true
}

// Health returns healthy status for mock adapter.
func (m *MockAdapter) Health(ctx context.Context) HealthStatus {
	return HealthStatus{
		Status:              StatusConnected,
		LastCheck:           time.Now(),
		LastSuccess:         time.Now(),
		ConsecutiveFailures: 0,
		Latency:             10 * time.Millisecond,
	}
}

// Capabilities returns mock platform capabilities (MikroTik).
func (m *MockAdapter) Capabilities() PlatformCapabilities {
	return PlatformCapabilities{
		SupportsREST:      true,
		SupportsBinaryAPI: true,
		SupportsAPISSL:    true,
		SupportsSSH:       true,
		SupportsWireGuard: true,
		SupportsIPv6:      true,
		HasWireless:       false,
		HasLTE:            false,
	}
}

// Info returns mock router information.
func (m *MockAdapter) Info() (*RouterInfo, error) {
	return &RouterInfo{
		Model:        "CHR",
		Version:      RouterOSVersion{Major: 7, Minor: 13, Patch: 0},
		Identity:     "Mock Router",
		Uptime:       26*time.Hour + 30*time.Minute,
		Architecture: "x86_64",
	}, nil
}

// QueryState returns mock state data.
func (m *MockAdapter) QueryState(ctx context.Context, query StateQuery) (*StateResult, error) {
	return &StateResult{
		Resources: []map[string]string{},
		Count:     0,
	}, nil
}

// Protocol returns the simulated protocol (API for mock).
func (m *MockAdapter) Protocol() Protocol {
	return ProtocolAPI
}

// SetupMockAdapterWithErrors creates a mock adapter that returns errors for specific commands.
// Useful for testing error scenarios in troubleshooting.
func SetupMockAdapterWithErrors(routerID string, errorPaths map[string]string) *MockAdapterWithErrors {
	return &MockAdapterWithErrors{
		routerID:   routerID,
		errorPaths: errorPaths,
	}
}

// MockAdapterWithErrors is a mock adapter that can simulate command failures.
type MockAdapterWithErrors struct {
	routerID   string
	errorPaths map[string]string // path -> error message
}

// ExecuteCommand simulates command execution with errors for specified paths.
func (m *MockAdapterWithErrors) ExecuteCommand(ctx context.Context, cmd Command) (*CommandResult, error) {
	if errMsg, hasError := m.errorPaths[cmd.Path]; hasError {
		return nil, fmt.Errorf("%s", errMsg)
	}

	// Fallback to default mock behavior
	mockAdapter := &MockAdapter{routerID: m.routerID}
	return mockAdapter.ExecuteCommand(ctx, cmd)
}

// GetRouterID returns the router ID.
func (m *MockAdapterWithErrors) GetRouterID() string {
	return m.routerID
}

// Close is a no-op.
func (m *MockAdapterWithErrors) Close() error {
	return nil
}

// Protocol returns simulated protocol.
func (m *MockAdapterWithErrors) Protocol() Protocol {
	return ProtocolAPI
}

// IsConnected always returns true.
func (m *MockAdapterWithErrors) IsConnected() bool {
	return true
}

// Connect is a no-op for mock adapter.
func (m *MockAdapterWithErrors) Connect(ctx context.Context) error {
	return nil
}

// Disconnect is a no-op for mock adapter.
func (m *MockAdapterWithErrors) Disconnect() error {
	return nil
}

// Health returns healthy status.
func (m *MockAdapterWithErrors) Health(ctx context.Context) HealthStatus {
	mockAdapter := &MockAdapter{routerID: m.routerID}
	return mockAdapter.Health(ctx)
}

// Capabilities returns mock capabilities.
func (m *MockAdapterWithErrors) Capabilities() PlatformCapabilities {
	mockAdapter := &MockAdapter{routerID: m.routerID}
	return mockAdapter.Capabilities()
}

// Info returns mock router information.
func (m *MockAdapterWithErrors) Info() (*RouterInfo, error) {
	mockAdapter := &MockAdapter{routerID: m.routerID}
	return mockAdapter.Info()
}

// QueryState returns mock state data.
func (m *MockAdapterWithErrors) QueryState(ctx context.Context, query StateQuery) (*StateResult, error) {
	mockAdapter := &MockAdapter{routerID: m.routerID}
	return mockAdapter.QueryState(ctx, query)
}
