package router

import (
	"context"
	"fmt"
	"log"
	"sync"
	"time"

	"backend/internal/events"

	"github.com/sony/gobreaker"
)

// DefaultFallbackOrder defines the protocol fallback sequence.
// Telnet is the last resort for legacy RouterOS devices without API/SSH.
var DefaultFallbackOrder = []Protocol{
	ProtocolREST,   // RouterOS 7.1+ (fastest, JSON-based)
	ProtocolAPI,    // Binary API on port 8728
	ProtocolAPISSL, // TLS-encrypted binary API on port 8729
	ProtocolSSH,    // Universal fallback
	ProtocolTelnet, // Legacy only - INSECURE, last resort
}

// CircuitBreakerSettings configures the circuit breaker behavior.
type CircuitBreakerSettings struct {
	// MaxFailures is the number of consecutive failures before opening.
	MaxFailures uint32

	// Timeout is how long the circuit stays open before trying half-open.
	Timeout time.Duration

	// MaxRequests in half-open state before deciding to close.
	MaxRequests uint32
}

// DefaultCircuitBreakerSettings returns the default circuit breaker configuration.
func DefaultCircuitBreakerSettings() CircuitBreakerSettings {
	return CircuitBreakerSettings{
		MaxFailures: 3,
		Timeout:     5 * time.Minute,
		MaxRequests: 1,
	}
}

// AdapterFactory creates adapters for a given protocol.
type AdapterFactory func(config AdapterConfig, protocol Protocol) (RouterPort, error)

// EventPublisher is the interface for publishing connection events.
type EventPublisher interface {
	Publish(ctx context.Context, event events.Event) error
}

// FallbackChain manages protocol fallback with circuit breakers.
type FallbackChain struct {
	config        AdapterConfig
	fallbackOrder []Protocol
	breakers      map[Protocol]*gobreaker.CircuitBreaker
	factory       AdapterFactory
	currentPort   RouterPort
	currentProto  Protocol
	mu            sync.RWMutex

	// Health check configuration
	healthCheckInterval time.Duration
	healthCheckChan     chan struct{}

	// Event publishing
	eventPublisher EventPublisher
	previousStatus events.RouterStatus

	// Logging
	logPrefix string
}

// NewFallbackChain creates a new protocol fallback chain.
func NewFallbackChain(config AdapterConfig, factory AdapterFactory) *FallbackChain {
	return NewFallbackChainWithSettings(config, factory, DefaultFallbackOrder, DefaultCircuitBreakerSettings())
}

// NewFallbackChainWithSettings creates a fallback chain with custom settings.
func NewFallbackChainWithSettings(
	config AdapterConfig,
	factory AdapterFactory,
	fallbackOrder []Protocol,
	cbSettings CircuitBreakerSettings,
) *FallbackChain {
	fc := &FallbackChain{
		config:              config,
		fallbackOrder:       fallbackOrder,
		breakers:            make(map[Protocol]*gobreaker.CircuitBreaker),
		factory:             factory,
		healthCheckInterval: 30 * time.Second,
		logPrefix:           fmt.Sprintf("[FallbackChain:%s]", config.Host),
		previousStatus:      events.RouterStatusUnknown,
	}

	// Create circuit breaker for each protocol
	for _, proto := range fallbackOrder {
		fc.breakers[proto] = fc.createCircuitBreaker(proto, cbSettings)
	}

	return fc
}

// SetEventPublisher sets the event publisher for connection events.
// This enables AC8: RouterStatusChangedEvent publishing.
func (fc *FallbackChain) SetEventPublisher(publisher EventPublisher) {
	fc.mu.Lock()
	defer fc.mu.Unlock()
	fc.eventPublisher = publisher
}

// publishStatusChange publishes a RouterStatusChangedEvent if a publisher is set.
func (fc *FallbackChain) publishStatusChange(ctx context.Context, newStatus events.RouterStatus, protocol string, errorMsg string) {
	if fc.eventPublisher == nil {
		return
	}

	event := events.NewRouterStatusChangedEvent(
		fc.config.RouterID,
		newStatus,
		fc.previousStatus,
		"FallbackChain",
	)
	event.Protocol = protocol
	event.ErrorMessage = errorMsg

	// Use a short context to avoid blocking connection operations
	publishCtx, cancel := context.WithTimeout(ctx, 100*time.Millisecond)
	defer cancel()

	if err := fc.eventPublisher.Publish(publishCtx, event); err != nil {
		log.Printf("%s Failed to publish status event: %v", fc.logPrefix, err)
	}

	fc.previousStatus = newStatus
}

// createCircuitBreaker creates a circuit breaker for a protocol.
func (fc *FallbackChain) createCircuitBreaker(proto Protocol, settings CircuitBreakerSettings) *gobreaker.CircuitBreaker {
	name := fmt.Sprintf("router-%s-%s", fc.config.RouterID, proto.String())

	return gobreaker.NewCircuitBreaker(gobreaker.Settings{
		Name:        name,
		MaxRequests: settings.MaxRequests,
		Interval:    0, // Don't reset counts in interval
		Timeout:     settings.Timeout,
		ReadyToTrip: func(counts gobreaker.Counts) bool {
			return counts.ConsecutiveFailures >= settings.MaxFailures
		},
		OnStateChange: func(name string, from gobreaker.State, to gobreaker.State) {
			log.Printf("%s Circuit breaker %s: %s -> %s", fc.logPrefix, proto.String(), from.String(), to.String())
		},
	})
}

// Connect attempts to connect using the fallback chain.
func (fc *FallbackChain) Connect(ctx context.Context) error {
	fc.mu.Lock()
	defer fc.mu.Unlock()

	// Publish reconnecting status
	fc.publishStatusChange(ctx, events.RouterStatusReconnecting, "", "")

	var lastErr error

	for _, proto := range fc.fallbackOrder {
		log.Printf("%s Trying protocol: %s", fc.logPrefix, proto.String())

		cb := fc.breakers[proto]

		// Check circuit breaker state
		if cb.State() == gobreaker.StateOpen {
			log.Printf("%s Circuit breaker OPEN for %s, skipping", fc.logPrefix, proto.String())
			continue
		}

		// Execute connection through circuit breaker
		_, err := cb.Execute(func() (interface{}, error) {
			return fc.tryConnect(ctx, proto)
		})

		if err == nil {
			log.Printf("%s Connected successfully using %s", fc.logPrefix, proto.String())
			fc.currentProto = proto
			// Publish connected event (AC8: within 100ms)
			fc.publishStatusChange(ctx, events.RouterStatusConnected, proto.String(), "")
			return nil
		}

		log.Printf("%s Failed to connect with %s: %v", fc.logPrefix, proto.String(), err)
		lastErr = err
	}

	// Publish error status
	errMsg := ""
	if lastErr != nil {
		errMsg = lastErr.Error()
	}
	fc.publishStatusChange(ctx, events.RouterStatusError, "", errMsg)

	return fmt.Errorf("all protocols failed, last error: %w", lastErr)
}

// tryConnect attempts to connect with a specific protocol.
func (fc *FallbackChain) tryConnect(ctx context.Context, proto Protocol) (interface{}, error) {
	adapter, err := fc.factory(fc.config, proto)
	if err != nil {
		return nil, fmt.Errorf("failed to create adapter: %w", err)
	}

	err = adapter.Connect(ctx)
	if err != nil {
		return nil, err
	}

	fc.currentPort = adapter
	return adapter, nil
}

// Disconnect disconnects the current adapter.
func (fc *FallbackChain) Disconnect() error {
	fc.mu.Lock()
	defer fc.mu.Unlock()

	if fc.currentPort != nil {
		err := fc.currentPort.Disconnect()
		fc.currentPort = nil
		// Publish disconnected event
		fc.publishStatusChange(context.Background(), events.RouterStatusDisconnected, "", "")
		return err
	}
	return nil
}

// IsConnected returns true if connected.
func (fc *FallbackChain) IsConnected() bool {
	fc.mu.RLock()
	defer fc.mu.RUnlock()
	return fc.currentPort != nil && fc.currentPort.IsConnected()
}

// CurrentProtocol returns the currently connected protocol.
func (fc *FallbackChain) CurrentProtocol() Protocol {
	fc.mu.RLock()
	defer fc.mu.RUnlock()
	return fc.currentProto
}

// CurrentAdapter returns the current RouterPort adapter.
func (fc *FallbackChain) CurrentAdapter() RouterPort {
	fc.mu.RLock()
	defer fc.mu.RUnlock()
	return fc.currentPort
}

// ExecuteCommand executes a command through the current adapter.
func (fc *FallbackChain) ExecuteCommand(ctx context.Context, cmd Command) (*CommandResult, error) {
	fc.mu.RLock()
	adapter := fc.currentPort
	proto := fc.currentProto
	fc.mu.RUnlock()

	if adapter == nil {
		return nil, fmt.Errorf("not connected")
	}

	// Execute through circuit breaker
	cb := fc.breakers[proto]

	result, err := cb.Execute(func() (interface{}, error) {
		return adapter.ExecuteCommand(ctx, cmd)
	})

	if err != nil {
		// If circuit breaker opened, try reconnecting with fallback
		if cb.State() == gobreaker.StateOpen {
			log.Printf("%s Circuit breaker opened for %s, attempting reconnect", fc.logPrefix, proto.String())
			go fc.attemptReconnect(context.Background())
		}
		return nil, err
	}

	return result.(*CommandResult), nil
}

// QueryState queries state through the current adapter.
func (fc *FallbackChain) QueryState(ctx context.Context, query StateQuery) (*StateResult, error) {
	fc.mu.RLock()
	adapter := fc.currentPort
	proto := fc.currentProto
	fc.mu.RUnlock()

	if adapter == nil {
		return nil, fmt.Errorf("not connected")
	}

	cb := fc.breakers[proto]

	result, err := cb.Execute(func() (interface{}, error) {
		return adapter.QueryState(ctx, query)
	})

	if err != nil {
		if cb.State() == gobreaker.StateOpen {
			go fc.attemptReconnect(context.Background())
		}
		return nil, err
	}

	return result.(*StateResult), nil
}

// attemptReconnect tries to reconnect with fallback protocols.
func (fc *FallbackChain) attemptReconnect(ctx context.Context) {
	fc.mu.Lock()
	defer fc.mu.Unlock()

	log.Printf("%s Attempting reconnection", fc.logPrefix)

	// Publish reconnecting status
	fc.publishStatusChange(ctx, events.RouterStatusReconnecting, "", "")

	// Disconnect current
	if fc.currentPort != nil {
		fc.currentPort.Disconnect()
		fc.currentPort = nil
	}

	// Try all protocols
	for _, proto := range fc.fallbackOrder {
		cb := fc.breakers[proto]
		if cb.State() == gobreaker.StateOpen {
			continue
		}

		_, err := cb.Execute(func() (interface{}, error) {
			return fc.tryConnect(ctx, proto)
		})

		if err == nil {
			log.Printf("%s Reconnected using %s", fc.logPrefix, proto.String())
			fc.currentProto = proto
			// Publish connected event
			fc.publishStatusChange(ctx, events.RouterStatusConnected, proto.String(), "")
			return
		}
	}

	log.Printf("%s Reconnection failed, all protocols exhausted", fc.logPrefix)
	fc.publishStatusChange(ctx, events.RouterStatusError, "", "all protocols exhausted")
}

// StartHealthCheck starts background health checking.
func (fc *FallbackChain) StartHealthCheck(ctx context.Context) {
	fc.healthCheckChan = make(chan struct{})

	go func() {
		ticker := time.NewTicker(fc.healthCheckInterval)
		defer ticker.Stop()

		for {
			select {
			case <-ctx.Done():
				return
			case <-fc.healthCheckChan:
				return
			case <-ticker.C:
				fc.performHealthCheck(ctx)
			}
		}
	}()
}

// StopHealthCheck stops the background health checker.
func (fc *FallbackChain) StopHealthCheck() {
	if fc.healthCheckChan != nil {
		close(fc.healthCheckChan)
	}
}

// performHealthCheck checks health and tries to recover from open circuits.
func (fc *FallbackChain) performHealthCheck(ctx context.Context) {
	fc.mu.RLock()
	connected := fc.currentPort != nil && fc.currentPort.IsConnected()
	fc.mu.RUnlock()

	if connected {
		// Perform simple ping
		_, err := fc.QueryState(ctx, StateQuery{
			Path:  "/system/identity",
			Limit: 1,
		})
		if err != nil {
			log.Printf("%s Health check failed: %v", fc.logPrefix, err)
		}
		return
	}

	// Not connected, try to reconnect
	log.Printf("%s Health check: not connected, attempting reconnect", fc.logPrefix)
	fc.attemptReconnect(ctx)
}

// GetCircuitBreakerStates returns the state of all circuit breakers.
func (fc *FallbackChain) GetCircuitBreakerStates() map[Protocol]string {
	states := make(map[Protocol]string)
	for proto, cb := range fc.breakers {
		states[proto] = cb.State().String()
	}
	return states
}

// Health returns aggregated health status.
func (fc *FallbackChain) Health(ctx context.Context) HealthStatus {
	fc.mu.RLock()
	defer fc.mu.RUnlock()

	if fc.currentPort == nil {
		return HealthStatus{
			Status:              StatusDisconnected,
			LastCheck:           time.Now(),
			CircuitBreakerState: "N/A",
		}
	}

	health := fc.currentPort.Health(ctx)

	// Add circuit breaker info
	if cb, ok := fc.breakers[fc.currentProto]; ok {
		health.CircuitBreakerState = cb.State().String()
	}

	return health
}

// Info returns router information from current adapter.
func (fc *FallbackChain) Info() (*RouterInfo, error) {
	fc.mu.RLock()
	adapter := fc.currentPort
	fc.mu.RUnlock()

	if adapter == nil {
		return nil, fmt.Errorf("not connected")
	}

	return adapter.Info()
}

// Capabilities returns capabilities from current adapter.
func (fc *FallbackChain) Capabilities() PlatformCapabilities {
	fc.mu.RLock()
	adapter := fc.currentPort
	fc.mu.RUnlock()

	if adapter == nil {
		return PlatformCapabilities{}
	}

	return adapter.Capabilities()
}
