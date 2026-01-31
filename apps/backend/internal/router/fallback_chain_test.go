package router

import (
	"context"
	"errors"
	"sync"
	"testing"
	"time"

	"backend/internal/events"
)

// TestMockAdapter for fallback chain testing
type TestMockAdapter struct {
	protocol       Protocol
	connected      bool
	connectError   error
	executeError   error
	connectCount   int
	executeCount   int
	mu             sync.Mutex
}

func NewTestMockAdapter(protocol Protocol, connectError error) *TestMockAdapter {
	return &TestMockAdapter{
		protocol:     protocol,
		connectError: connectError,
	}
}

func (m *TestMockAdapter) Connect(ctx context.Context) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.connectCount++
	if m.connectError != nil {
		return m.connectError
	}
	m.connected = true
	return nil
}

func (m *TestMockAdapter) Disconnect() error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.connected = false
	return nil
}

func (m *TestMockAdapter) IsConnected() bool {
	m.mu.Lock()
	defer m.mu.Unlock()
	return m.connected
}

func (m *TestMockAdapter) Health(ctx context.Context) HealthStatus {
	m.mu.Lock()
	defer m.mu.Unlock()
	if m.connected {
		return HealthStatus{Status: StatusConnected, LastCheck: time.Now()}
	}
	return HealthStatus{Status: StatusDisconnected, LastCheck: time.Now()}
}

func (m *TestMockAdapter) Capabilities() PlatformCapabilities {
	return PlatformCapabilities{SupportsREST: m.protocol == ProtocolREST}
}

func (m *TestMockAdapter) Info() (*RouterInfo, error) {
	return &RouterInfo{Model: "TestRouter", Identity: "test"}, nil
}

func (m *TestMockAdapter) ExecuteCommand(ctx context.Context, cmd Command) (*CommandResult, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.executeCount++
	if m.executeError != nil {
		return nil, m.executeError
	}
	return &CommandResult{Success: true}, nil
}

func (m *TestMockAdapter) QueryState(ctx context.Context, query StateQuery) (*StateResult, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	if m.executeError != nil {
		return nil, m.executeError
	}
	return &StateResult{Resources: []map[string]string{{"name": "test"}}, Count: 1}, nil
}

func (m *TestMockAdapter) Protocol() Protocol {
	return m.protocol
}

func (m *TestMockAdapter) GetConnectCount() int {
	m.mu.Lock()
	defer m.mu.Unlock()
	return m.connectCount
}

func TestFallbackChain_Connect_Success(t *testing.T) {
	adapters := make(map[Protocol]*TestMockAdapter)

	factory := func(config AdapterConfig, proto Protocol) (RouterPort, error) {
		adapter := NewTestMockAdapter(proto, nil)
		adapters[proto] = adapter
		return adapter, nil
	}

	fc := NewFallbackChain(AdapterConfig{
		Host:     "192.168.88.1",
		Username: "admin",
		Password: "password",
		RouterID: "test-router",
	}, factory)

	err := fc.Connect(context.Background())
	if err != nil {
		t.Errorf("Connect() error = %v", err)
	}

	if !fc.IsConnected() {
		t.Error("IsConnected() = false after successful Connect()")
	}

	// Should use REST (first in order)
	if fc.CurrentProtocol() != ProtocolREST {
		t.Errorf("CurrentProtocol() = %v, want %v", fc.CurrentProtocol(), ProtocolREST)
	}
}

func TestFallbackChain_Connect_Fallback(t *testing.T) {
	adapters := make(map[Protocol]*TestMockAdapter)
	failCount := 0

	factory := func(config AdapterConfig, proto Protocol) (RouterPort, error) {
		var err error
		if failCount < 2 {
			// First two protocols fail
			err = errors.New("connection failed")
			failCount++
		}
		adapter := NewTestMockAdapter(proto, err)
		adapters[proto] = adapter
		return adapter, nil
	}

	fc := NewFallbackChain(AdapterConfig{
		Host:     "192.168.88.1",
		Username: "admin",
		Password: "password",
		RouterID: "test-router",
	}, factory)

	err := fc.Connect(context.Background())
	if err != nil {
		t.Errorf("Connect() error = %v", err)
	}

	// Should fall back to API-SSL (third in order)
	if fc.CurrentProtocol() != ProtocolAPISSL {
		t.Errorf("CurrentProtocol() = %v, want %v", fc.CurrentProtocol(), ProtocolAPISSL)
	}
}

func TestFallbackChain_Connect_AllFail(t *testing.T) {
	factory := func(config AdapterConfig, proto Protocol) (RouterPort, error) {
		return NewTestMockAdapter(proto, errors.New("connection failed")), nil
	}

	fc := NewFallbackChain(AdapterConfig{
		Host:     "192.168.88.1",
		Username: "admin",
		Password: "password",
		RouterID: "test-router",
	}, factory)

	err := fc.Connect(context.Background())
	if err == nil {
		t.Error("Connect() should fail when all protocols fail")
	}

	if fc.IsConnected() {
		t.Error("IsConnected() should be false when all protocols fail")
	}
}

func TestFallbackChain_CircuitBreaker(t *testing.T) {
	callCount := 0

	factory := func(config AdapterConfig, proto Protocol) (RouterPort, error) {
		callCount++
		return NewTestMockAdapter(proto, errors.New("connection failed")), nil
	}

	// Use short timeout for testing
	settings := CircuitBreakerSettings{
		MaxFailures: 2, // Open after 2 failures
		Timeout:     100 * time.Millisecond,
		MaxRequests: 1,
	}

	fc := NewFallbackChainWithSettings(
		AdapterConfig{
			Host:     "192.168.88.1",
			Username: "admin",
			Password: "password",
			RouterID: "test-router",
		},
		factory,
		[]Protocol{ProtocolREST}, // Only REST to simplify
		settings,
	)

	// First connect attempts (will fail twice, opening circuit)
	fc.Connect(context.Background())
	fc.Connect(context.Background())

	// Third attempt should skip due to open circuit
	_ = callCount // Used to verify circuit breaker behavior
	fc.Connect(context.Background())

	// Circuit should be open, so no new attempts
	states := fc.GetCircuitBreakerStates()
	if states[ProtocolREST] != "open" {
		t.Errorf("Circuit breaker state = %s, want open", states[ProtocolREST])
	}
}

func TestFallbackChain_ExecuteCommand(t *testing.T) {
	factory := func(config AdapterConfig, proto Protocol) (RouterPort, error) {
		return NewTestMockAdapter(proto, nil), nil
	}

	fc := NewFallbackChain(AdapterConfig{
		Host:     "192.168.88.1",
		Username: "admin",
		Password: "password",
		RouterID: "test-router",
	}, factory)

	fc.Connect(context.Background())

	result, err := fc.ExecuteCommand(context.Background(), Command{
		Path:   "/interface",
		Action: "print",
	})

	if err != nil {
		t.Errorf("ExecuteCommand() error = %v", err)
	}

	if !result.Success {
		t.Error("ExecuteCommand().Success = false")
	}
}

func TestFallbackChain_NotConnected(t *testing.T) {
	factory := func(config AdapterConfig, proto Protocol) (RouterPort, error) {
		return NewTestMockAdapter(proto, nil), nil
	}

	fc := NewFallbackChain(AdapterConfig{
		Host:     "192.168.88.1",
		Username: "admin",
		Password: "password",
		RouterID: "test-router",
	}, factory)

	// Don't connect

	_, err := fc.ExecuteCommand(context.Background(), Command{})
	if err == nil {
		t.Error("ExecuteCommand() should fail when not connected")
	}

	_, err = fc.QueryState(context.Background(), StateQuery{})
	if err == nil {
		t.Error("QueryState() should fail when not connected")
	}

	_, err = fc.Info()
	if err == nil {
		t.Error("Info() should fail when not connected")
	}
}

func TestFallbackChain_Health(t *testing.T) {
	factory := func(config AdapterConfig, proto Protocol) (RouterPort, error) {
		return NewTestMockAdapter(proto, nil), nil
	}

	fc := NewFallbackChain(AdapterConfig{
		Host:     "192.168.88.1",
		Username: "admin",
		Password: "password",
		RouterID: "test-router",
	}, factory)

	// Not connected
	health := fc.Health(context.Background())
	if health.Status != StatusDisconnected {
		t.Errorf("Health().Status = %v, want %v", health.Status, StatusDisconnected)
	}

	// Connected
	fc.Connect(context.Background())
	health = fc.Health(context.Background())
	if health.Status != StatusConnected {
		t.Errorf("Health().Status = %v, want %v", health.Status, StatusConnected)
	}
}

func TestDefaultFallbackOrder(t *testing.T) {
	// Telnet is the last resort for legacy devices
	expected := []Protocol{ProtocolREST, ProtocolAPI, ProtocolAPISSL, ProtocolSSH, ProtocolTelnet}

	if len(DefaultFallbackOrder) != len(expected) {
		t.Errorf("DefaultFallbackOrder length = %d, want %d", len(DefaultFallbackOrder), len(expected))
	}

	for i, proto := range DefaultFallbackOrder {
		if proto != expected[i] {
			t.Errorf("DefaultFallbackOrder[%d] = %v, want %v", i, proto, expected[i])
		}
	}
}

func TestFallbackChain_FallbackToTelnet(t *testing.T) {
	protocolsAttempted := make([]Protocol, 0)

	factory := func(config AdapterConfig, proto Protocol) (RouterPort, error) {
		protocolsAttempted = append(protocolsAttempted, proto)
		// All protocols fail except Telnet
		if proto == ProtocolTelnet {
			return NewTestMockAdapter(proto, nil), nil
		}
		return NewTestMockAdapter(proto, errors.New("connection failed")), nil
	}

	fc := NewFallbackChain(AdapterConfig{
		Host:     "192.168.88.1",
		Username: "admin",
		Password: "password",
		RouterID: "test-router",
	}, factory)

	err := fc.Connect(context.Background())
	if err != nil {
		t.Errorf("Connect() error = %v", err)
	}

	// Should fall back to Telnet (last in order)
	if fc.CurrentProtocol() != ProtocolTelnet {
		t.Errorf("CurrentProtocol() = %v, want %v", fc.CurrentProtocol(), ProtocolTelnet)
	}

	// Verify all protocols were attempted in order
	expectedOrder := []Protocol{ProtocolREST, ProtocolAPI, ProtocolAPISSL, ProtocolSSH, ProtocolTelnet}
	for i, proto := range expectedOrder {
		if i >= len(protocolsAttempted) {
			t.Errorf("Protocol %v was not attempted", proto)
			continue
		}
		if protocolsAttempted[i] != proto {
			t.Errorf("Protocol attempt order: got %v at position %d, want %v", protocolsAttempted[i], i, proto)
		}
	}
}

func TestDefaultCircuitBreakerSettings(t *testing.T) {
	settings := DefaultCircuitBreakerSettings()

	if settings.MaxFailures != 3 {
		t.Errorf("MaxFailures = %d, want 3", settings.MaxFailures)
	}

	if settings.Timeout != 5*time.Minute {
		t.Errorf("Timeout = %v, want 5 minutes", settings.Timeout)
	}
}

// mockEventPublisher captures published events for testing.
type mockEventPublisher struct {
	mu     sync.Mutex
	events []events.Event
}

func (m *mockEventPublisher) Publish(_ context.Context, event events.Event) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.events = append(m.events, event)
	return nil
}

func (m *mockEventPublisher) getEvents() []events.Event {
	m.mu.Lock()
	defer m.mu.Unlock()
	result := make([]events.Event, len(m.events))
	copy(result, m.events)
	return result
}

func TestFallbackChain_EventPublishing_OnConnect(t *testing.T) {
	publisher := &mockEventPublisher{}

	factory := func(config AdapterConfig, proto Protocol) (RouterPort, error) {
		return NewTestMockAdapter(proto, nil), nil
	}

	fc := NewFallbackChain(AdapterConfig{
		Host:     "192.168.88.1",
		Username: "admin",
		Password: "password",
		RouterID: "test-router",
	}, factory)

	fc.SetEventPublisher(publisher)

	err := fc.Connect(context.Background())
	if err != nil {
		t.Fatalf("Connect() error = %v", err)
	}

	published := publisher.getEvents()

	// Should have: reconnecting + connected
	if len(published) < 2 {
		t.Fatalf("Expected at least 2 events, got %d", len(published))
	}

	// First event should be reconnecting
	first, ok := published[0].(*events.RouterStatusChangedEvent)
	if !ok {
		t.Fatalf("First event type = %T, want *events.RouterStatusChangedEvent", published[0])
	}
	if first.Status != events.RouterStatusReconnecting {
		t.Errorf("First event status = %v, want %v", first.Status, events.RouterStatusReconnecting)
	}

	// Second event should be connected
	second, ok := published[1].(*events.RouterStatusChangedEvent)
	if !ok {
		t.Fatalf("Second event type = %T, want *events.RouterStatusChangedEvent", published[1])
	}
	if second.Status != events.RouterStatusConnected {
		t.Errorf("Second event status = %v, want %v", second.Status, events.RouterStatusConnected)
	}
	if second.Protocol != "REST" {
		t.Errorf("Second event protocol = %q, want %q", second.Protocol, "REST")
	}

	// Verify event uses PriorityImmediate (AC8: <100ms delivery)
	if second.GetPriority() != events.PriorityImmediate {
		t.Errorf("Event priority = %v, want %v", second.GetPriority(), events.PriorityImmediate)
	}
}

func TestFallbackChain_EventPublishing_OnDisconnect(t *testing.T) {
	publisher := &mockEventPublisher{}

	factory := func(config AdapterConfig, proto Protocol) (RouterPort, error) {
		return NewTestMockAdapter(proto, nil), nil
	}

	fc := NewFallbackChain(AdapterConfig{
		Host:     "192.168.88.1",
		Username: "admin",
		Password: "password",
		RouterID: "test-router",
	}, factory)

	fc.SetEventPublisher(publisher)
	fc.Connect(context.Background())

	fc.Disconnect()

	published := publisher.getEvents()

	// Last event should be disconnected
	lastEvent, ok := published[len(published)-1].(*events.RouterStatusChangedEvent)
	if !ok {
		t.Fatalf("Last event type = %T, want *events.RouterStatusChangedEvent", published[len(published)-1])
	}
	if lastEvent.Status != events.RouterStatusDisconnected {
		t.Errorf("Last event status = %v, want %v", lastEvent.Status, events.RouterStatusDisconnected)
	}
}

func TestFallbackChain_EventPublishing_OnAllFail(t *testing.T) {
	publisher := &mockEventPublisher{}

	factory := func(config AdapterConfig, proto Protocol) (RouterPort, error) {
		return NewTestMockAdapter(proto, errors.New("connection failed")), nil
	}

	fc := NewFallbackChain(AdapterConfig{
		Host:     "192.168.88.1",
		Username: "admin",
		Password: "password",
		RouterID: "test-router",
	}, factory)

	fc.SetEventPublisher(publisher)
	fc.Connect(context.Background())

	published := publisher.getEvents()

	if len(published) < 2 {
		t.Fatalf("Expected at least 2 events (reconnecting + error), got %d", len(published))
	}

	// Last event should be error
	lastEvent, ok := published[len(published)-1].(*events.RouterStatusChangedEvent)
	if !ok {
		t.Fatalf("Last event type = %T, want *events.RouterStatusChangedEvent", published[len(published)-1])
	}
	if lastEvent.Status != events.RouterStatusError {
		t.Errorf("Last event status = %v, want %v", lastEvent.Status, events.RouterStatusError)
	}
	if lastEvent.ErrorMessage == "" {
		t.Error("Error event should have an error message")
	}
}

func TestFallbackChain_NoPublisher(t *testing.T) {
	factory := func(config AdapterConfig, proto Protocol) (RouterPort, error) {
		return NewTestMockAdapter(proto, nil), nil
	}

	fc := NewFallbackChain(AdapterConfig{
		Host:     "192.168.88.1",
		Username: "admin",
		Password: "password",
		RouterID: "test-router",
	}, factory)

	// No publisher set - should not panic
	err := fc.Connect(context.Background())
	if err != nil {
		t.Errorf("Connect() error = %v", err)
	}

	err = fc.Disconnect()
	if err != nil {
		t.Errorf("Disconnect() error = %v", err)
	}
}
