package vif

import (
	"context"

	"backend/internal/router"
)

// MockRouterPort is a mock implementation of router.RouterPort for testing.
type MockRouterPort struct {
	commands       []router.Command
	nextID         string
	executeError   error
	queryResources []map[string]string
	queryError     error
}

func NewMockRouterPort() *MockRouterPort {
	return &MockRouterPort{
		commands: make([]router.Command, 0),
		nextID:   "*1",
	}
}

func (m *MockRouterPort) Connect(_ context.Context) error {
	return nil
}

func (m *MockRouterPort) Disconnect() error {
	return nil
}

func (m *MockRouterPort) IsConnected() bool {
	return true
}

func (m *MockRouterPort) Health(_ context.Context) router.HealthStatus {
	return router.HealthStatus{Status: router.StatusConnected}
}

func (m *MockRouterPort) Capabilities() router.PlatformCapabilities {
	return router.PlatformCapabilities{}
}

func (m *MockRouterPort) Info() (*router.RouterInfo, error) {
	return &router.RouterInfo{}, nil
}

func (m *MockRouterPort) ExecuteCommand(_ context.Context, cmd router.Command) (*router.CommandResult, error) {
	m.commands = append(m.commands, cmd)
	if m.executeError != nil {
		return nil, m.executeError
	}
	return &router.CommandResult{
		Success: true,
		ID:      m.nextID,
	}, nil
}

func (m *MockRouterPort) QueryState(_ context.Context, query router.StateQuery) (*router.StateResult, error) {
	if m.queryError != nil {
		return nil, m.queryError
	}
	return &router.StateResult{
		Resources: m.queryResources,
	}, nil
}

func (m *MockRouterPort) Protocol() router.Protocol {
	return router.ProtocolREST
}
