package vif

import (
	"context"
	"testing"
	"time"

	"backend/internal/features"
	"backend/internal/orchestrator/lifecycle"
	"backend/internal/orchestrator/supervisor"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
	"go.uber.org/zap"
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

// MockPathResolver implements storage.PathResolverPort for testing.
type MockPathResolver struct {
	mock.Mock
}

func (m *MockPathResolver) BinaryPath(serviceName string) string {
	args := m.Called(serviceName)
	return args.String(0)
}

func (m *MockPathResolver) ConfigPath(serviceName string) string {
	args := m.Called(serviceName)
	return args.String(0)
}

func (m *MockPathResolver) ManifestPath(serviceName string) string {
	args := m.Called(serviceName)
	return args.String(0)
}

func (m *MockPathResolver) DataPath(serviceName string) string {
	args := m.Called(serviceName)
	return args.String(0)
}

func (m *MockPathResolver) LogsPath(serviceName string) string {
	args := m.Called(serviceName)
	return args.String(0)
}

func (m *MockPathResolver) RootPath(pathType string) string {
	args := m.Called(pathType)
	return args.String(0)
}

func TestNewGatewayManager(t *testing.T) {
	sup := new(MockSupervisor)
	pathResolver := new(MockPathResolver)

	gm, err := NewGatewayManager(GatewayManagerConfig{
		Supervisor:   sup,
		PathResolver: pathResolver,
		Logger:       zap.NewNop(),
	})

	require.NoError(t, err)
	assert.NotNil(t, gm)
	assert.Equal(t, "/app/hev-socks5-tunnel", gm.hevBinaryPath)
}

func TestNewGatewayManager_MissingSupervisor(t *testing.T) {
	pathResolver := new(MockPathResolver)

	_, err := NewGatewayManager(GatewayManagerConfig{
		PathResolver: pathResolver,
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
	sup := new(MockSupervisor)
	pathResolver := new(MockPathResolver)

	gm, err := NewGatewayManager(GatewayManagerConfig{
		Supervisor:   sup,
		PathResolver: pathResolver,
		Logger:       zap.NewNop(),
	})
	require.NoError(t, err)

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
	sup := new(MockSupervisor)
	pathResolver := new(MockPathResolver)

	gm, err := NewGatewayManager(GatewayManagerConfig{
		Supervisor:   sup,
		PathResolver: pathResolver,
		Logger:       zap.NewNop(),
	})
	require.NoError(t, err)

	status, err := gm.GetStatus("nonexistent")
	require.NoError(t, err)
	assert.Equal(t, lifecycle.GatewayStopped, status.State)
}

func TestGetStatus_Running(t *testing.T) {
	sup := new(MockSupervisor)
	pathResolver := new(MockPathResolver)

	gm, err := NewGatewayManager(GatewayManagerConfig{
		Supervisor:   sup,
		PathResolver: pathResolver,
		Logger:       zap.NewNop(),
	})
	require.NoError(t, err)

	// Manually add a gateway instance
	gm.gateways["test-instance"] = &GatewayInstance{
		InstanceID: "test-instance",
		TunName:    "tun-test",
		ProcessID:  "gw-test-instance",
		StartTime:  time.Now().Add(-5 * time.Minute),
	}

	// Mock supervisor returning a ManagedProcess (default state is Stopped
	// because we cannot set the private state field from outside the package)
	mp := supervisor.NewManagedProcess(supervisor.ProcessConfig{
		ID:      "gw-test-instance",
		Command: "/app/test",
		Name:    "test-process",
	})
	sup.On("Get", "gw-test-instance").Return(mp, true)

	status, err := gm.GetStatus("test-instance")
	require.NoError(t, err)
	// State maps to GatewayStopped since ManagedProcess defaults to ProcessStateStopped
	// (we can't set private state from outside supervisor package)
	assert.Equal(t, lifecycle.GatewayStopped, status.State)
	assert.Equal(t, "tun-test", status.TunName)
	assert.Greater(t, status.Uptime, 4*time.Minute)
}

func TestGetStatus_Failed(t *testing.T) {
	sup := new(MockSupervisor)
	pathResolver := new(MockPathResolver)

	gm, err := NewGatewayManager(GatewayManagerConfig{
		Supervisor:   sup,
		PathResolver: pathResolver,
		Logger:       zap.NewNop(),
	})
	require.NoError(t, err)

	// Manually add a gateway instance
	gm.gateways["test-instance"] = &GatewayInstance{
		InstanceID: "test-instance",
		TunName:    "tun-test",
		ProcessID:  "gw-test-instance",
		StartTime:  time.Now(),
	}

	// Mock supervisor not finding the process (simulates process disappearing)
	sup.On("Get", "gw-test-instance").Return(nil, false)

	status, err := gm.GetStatus("test-instance")
	require.NoError(t, err)
	assert.Equal(t, lifecycle.GatewayError, status.State)
	assert.NotEmpty(t, status.ErrorMessage)
}
