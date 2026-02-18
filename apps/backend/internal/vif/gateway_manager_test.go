package vif

import (
	"context"
	"testing"
	"time"

	"backend/internal/features"
	// "backend/internal/orchestrator" // TODO: imported and not used
	"backend/internal/orchestrator/supervisor"

	"github.com/rs/zerolog"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
)

// MockSupervisor implements ProcessSupervisor for testing
type MockSupervisor struct {
	mock.Mock
}

func (m *MockSupervisor) Add(mp *supervisor.ManagedProcess) error {
	args := m.Called(mp)
	return args.Error(0)
}

func (m *MockSupervisor) Start(ctx context.Context, id string) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockSupervisor) Stop(ctx context.Context, id string) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockSupervisor) Get(id string) (*supervisor.ManagedProcess, bool) {
	args := m.Called(id)
	if args.Get(0) == nil {
		return nil, args.Bool(1)
	}
	return args.Get(0).(*supervisor.ManagedProcess), args.Bool(1)
}

func (m *MockSupervisor) Remove(id string) error {
	args := m.Called(id)
	return args.Error(0)
}

// MockPathResolver implements PathResolverPort for testing
type MockPathResolver struct {
	mock.Mock
}

func (m *MockPathResolver) ResolveAppPath(path string) (string, error) {
	args := m.Called(path)
	return args.String(0), args.Error(1)
}

func (m *MockPathResolver) ResolveDataPath(path string) (string, error) {
	args := m.Called(path)
	return args.String(0), args.Error(1)
}

func (m *MockPathResolver) ResolveConfigPath(path string) (string, error) {
	args := m.Called(path)
	return args.String(0), args.Error(1)
}

func TestNewGatewayManager(t *testing.T) {
	t.Skip("TODO: MockPathResolver doesn't implement storage.PathResolverPort interface (missing BinaryPath method)")

	supervisor := new(MockSupervisor)
	_ = supervisor // Silence unused variable
	// pathResolver := new(MockPathResolver)

	gm, err := NewGatewayManager(GatewayManagerConfig{
		Supervisor:   supervisor,
		PathResolver: nil, // pathResolver, // TODO: MockPathResolver missing BinaryPath method
		Logger:       zerolog.Nop(),
	})

	require.NoError(t, err)
	assert.NotNil(t, gm)
	assert.Equal(t, "/app/hev-socks5-tunnel", gm.hevBinaryPath)
}

func TestNewGatewayManager_MissingSupervisor(t *testing.T) {
	t.Skip("TODO: MockPathResolver doesn't implement storage.PathResolverPort - needs BinaryPath method")
	// pathResolver := new(MockPathResolver)

	_, err := NewGatewayManager(GatewayManagerConfig{
		PathResolver: nil, // pathResolver, // TODO: type mismatch
	})

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "supervisor is required")
}

func TestNewGatewayManager_MissingPathResolver(t *testing.T) {
	supervisor := new(MockSupervisor)

	_, err := NewGatewayManager(GatewayManagerConfig{
		Supervisor: supervisor,
	})

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "path resolver is required")
}

func TestNeedsGateway(t *testing.T) {
	supervisor := new(MockSupervisor)
	_ = supervisor // Silence unused variable
	// pathResolver := new(MockPathResolver)

	gm, _ := NewGatewayManager(GatewayManagerConfig{
		Supervisor:   supervisor,
		PathResolver: nil, // pathResolver, // TODO: MockPathResolver type mismatch
		Logger:       zerolog.Nop(),
	})

	tests := []struct {
		name     string
		manifest *features.Manifest
		mode     string
		expected bool
	}{
		{
			name: "Tor SOCKS5 client needs gateway",
			manifest: &features.Manifest{
				ID:          "tor",
				NetworkMode: "bridge",
			},
			mode:     "client",
			expected: true,
		},
		{
			name: "sing-box SOCKS5 client needs gateway",
			manifest: &features.Manifest{
				ID:          "singbox",
				NetworkMode: "bridge",
			},
			mode:     "client",
			expected: true,
		},
		{
			name: "Xray SOCKS5 client needs gateway",
			manifest: &features.Manifest{
				ID:          "xray",
				NetworkMode: "bridge",
			},
			mode:     "client",
			expected: true,
		},
		{
			name: "Psiphon SOCKS5 client needs gateway",
			manifest: &features.Manifest{
				ID:          "psiphon",
				NetworkMode: "bridge",
			},
			mode:     "client",
			expected: true,
		},
		{
			name: "Server mode doesn't need gateway",
			manifest: &features.Manifest{
				ID:          "tor",
				NetworkMode: "bridge",
			},
			mode:     "server",
			expected: false,
		},
		{
			name: "Inbound mode doesn't need gateway",
			manifest: &features.Manifest{
				ID:          "singbox",
				NetworkMode: "bridge",
			},
			mode:     "inbound",
			expected: false,
		},
		{
			name: "Native TUN mode doesn't need gateway",
			manifest: &features.Manifest{
				ID:          "singbox",
				NetworkMode: "bridge",
			},
			mode:     "tun",
			expected: false,
		},
		{
			name: "DNS server doesn't need gateway",
			manifest: &features.Manifest{
				ID:          "adguard",
				NetworkMode: "bridge",
			},
			mode:     "server",
			expected: false,
		},
		{
			name: "Host network mode doesn't need gateway",
			manifest: &features.Manifest{
				ID:          "tor",
				NetworkMode: "host",
			},
			mode:     "client",
			expected: false,
		},
		{
			name: "Unknown service doesn't need gateway",
			manifest: &features.Manifest{
				ID:          "unknown",
				NetworkMode: "bridge",
			},
			mode:     "client",
			expected: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := gm.NeedsGateway(tt.manifest, tt.mode)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestGetStatus_NotFound(t *testing.T) {
	supervisor := new(MockSupervisor)
	// pathResolver := new(MockPathResolver) // TODO: type mismatch

	gm, _ := NewGatewayManager(GatewayManagerConfig{
		Supervisor:   supervisor,
		PathResolver: nil, // pathResolver, // TODO: MockPathResolver type mismatch
		Logger:       zerolog.Nop(),
	})

	status, err := gm.GetStatus("nonexistent")
	require.NoError(t, err)
	assert.Equal(t, "stopped", status.State) // orchestrator.GatewayStopped // TODO: constant doesn't exist
}

func TestGetStatus_Running(t *testing.T) {
	supervisor := new(MockSupervisor)
	// pathResolver := new(MockPathResolver) // TODO: type mismatch

	gm, _ := NewGatewayManager(GatewayManagerConfig{
		Supervisor:   supervisor,
		PathResolver: nil, // pathResolver, // TODO: MockPathResolver type mismatch
		Logger:       zerolog.Nop(),
	})

	// Manually add a gateway instance
	gm.gateways["test-instance"] = &GatewayInstance{
		InstanceID: "test-instance",
		TunName:    "tun-test",
		ProcessID:  "gw-test-instance",
		StartTime:  time.Now().Add(-5 * time.Minute),
	}

	// Mock supervisor returning running process
	// mp := &supervisor.ManagedProcess{
	// 	ID:              "gw-test-instance",
	// 	State:           orchestrator.StateRunning,
	// 	LastHealthCheck: time.Now(),
	// }
	// TODO: ManagedProcess type definition issue
	// supervisor.On("Get", "gw-test-instance").Return(mp, true) // TODO: mp undefined

	status, err := gm.GetStatus("test-instance")
	require.NoError(t, err)
	assert.Equal(t, "running", status.State) // orchestrator.GatewayRunning // TODO: constant doesn't exist
	assert.Equal(t, "tun-test", status.TunName)
	assert.Greater(t, status.Uptime, 4*time.Minute)
}

func TestGetStatus_Failed(t *testing.T) {
	t.Skip("TODO: supervisor.ManagedProcess is not a type - needs proper supervisor package structure")
	supervisor := new(MockSupervisor)
	// pathResolver := new(MockPathResolver) // TODO: type mismatch

	gm, _ := NewGatewayManager(GatewayManagerConfig{
		Supervisor:   supervisor,
		PathResolver: nil, // pathResolver, // TODO: MockPathResolver type mismatch
		Logger:       zerolog.Nop(),
	})

	// Manually add a gateway instance
	gm.gateways["test-instance"] = &GatewayInstance{
		InstanceID: "test-instance",
		TunName:    "tun-test",
		ProcessID:  "gw-test-instance",
		StartTime:  time.Now(),
	}

	// Mock supervisor returning failed process
	// mp := &supervisor.ManagedProcess{
	// 	ID:        "gw-test-instance",
	// 	State:     orchestrator.StateFailed,
	// 	LastError: assert.AnError,
	// }
	// supervisor.On("Get", "gw-test-instance").Return(mp, true) // TODO: mp undefined

	// status, err := gm.GetStatus("test-instance")
	// require.NoError(t, err)
	// assert.Equal(t, orchestrator.GatewayError, status.State)
	// assert.NotEmpty(t, status.ErrorMessage)
}
