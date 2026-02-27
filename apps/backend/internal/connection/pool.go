package connection

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/cenkalti/backoff/v4"
)

// Protocol represents a router communication protocol.
type Protocol string

const (
	// ProtocolREST is the REST API protocol (RouterOS 7.1+).
	ProtocolREST Protocol = "REST"

	// ProtocolAPI is the binary API protocol (port 8728).
	ProtocolAPI Protocol = "API"

	// ProtocolAPISSL is the TLS-encrypted binary API (port 8729).
	ProtocolAPISSL Protocol = "API_SSL"

	// ProtocolSSH is the SSH protocol (port 22).
	ProtocolSSH Protocol = "SSH"

	// ProtocolTelnet is the Telnet protocol (port 23).
	ProtocolTelnet Protocol = "TELNET"
)

// String returns the string representation of the protocol.
func (p Protocol) String() string {
	return string(p)
}

// RouterClient is the interface for protocol-specific router clients.
// This abstracts the underlying protocol adapter.
type RouterClient interface {
	// Connect establishes a connection to the router.
	Connect(ctx context.Context) error

	// Disconnect closes the connection.
	Disconnect() error

	// IsConnected returns true if the client is connected.
	IsConnected() bool

	// Ping tests the connection with a lightweight operation.
	Ping(ctx context.Context) error

	// Protocol returns the protocol used by this client.
	Protocol() Protocol

	// Version returns the router version (may be empty if not connected).
	Version() string
}

// Connection represents a persistent connection to a router.
type Connection struct {
	// RouterID is the unique identifier for the router.
	RouterID string

	// Status holds the current connection status.
	Status *Status

	// Client is the protocol-specific client.
	Client RouterClient

	// CircuitBreaker protects the connection from repeated failures.
	CircuitBreaker *CircuitBreaker

	// config holds connection configuration.
	config Config

	// reconnectCancel cancels the reconnection goroutine.
	reconnectCancel context.CancelFunc

	// healthCancel cancels the health check goroutine.
	healthCancel context.CancelFunc

	// mu protects connection state.
	mu sync.RWMutex

	// manualDisconnect indicates the user manually disconnected.
	manualDisconnect bool

	// lastReconnectAttempt is when the last reconnection was attempted.
	lastReconnectAttempt time.Time
}

// Config holds configuration for a connection.
type Config struct {
	// Host is the router hostname or IP address.
	Host string

	// Port is the connection port.
	Port int

	// Username is the authentication username.
	Username string

	// Password is the authentication password.
	Password string //nolint:gosec // G101: credential field required for authentication

	// PreferredProtocol is the user's preferred protocol (optional).
	PreferredProtocol Protocol

	// ConnectionTimeout is the timeout for connection attempts.
	ConnectionTimeout time.Duration

	// HealthCheckInterval is the interval between health checks.
	HealthCheckInterval time.Duration
}

// DefaultConfig returns default connection configuration.
func DefaultConfig() Config {
	return Config{
		Port:                8728, // Default MikroTik API port
		ConnectionTimeout:   30 * time.Second,
		HealthCheckInterval: 30 * time.Second,
	}
}

// NewConnection creates a new Connection for a router.
func NewConnection(routerID string, config Config, cb *CircuitBreaker) *Connection {
	return &Connection{
		RouterID:       routerID,
		Status:         NewStatus(),
		CircuitBreaker: cb,
		config:         config,
	}
}

// GetStatus returns a copy of the current connection status.
func (c *Connection) GetStatus() Status {
	c.mu.RLock()
	defer c.mu.RUnlock()

	// Return a copy
	status := *c.Status
	if c.CircuitBreaker != nil {
		status.CircuitBreakerState = c.CircuitBreaker.StateString()
	}
	return status
}

// SetClient sets the protocol client for the connection.
func (c *Connection) SetClient(client RouterClient) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.Client = client
}

// GetClient returns the current protocol client.
func (c *Connection) GetClient() RouterClient {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.Client
}

// IsConnected returns true if the connection is active.
func (c *Connection) IsConnected() bool {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.Status.State == StateConnected && c.Client != nil && c.Client.IsConnected()
}

// IsManuallyDisconnected returns true if the user manually disconnected.
func (c *Connection) IsManuallyDisconnected() bool {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.manualDisconnect
}

// SetManuallyDisconnected sets the manual disconnect flag.
func (c *Connection) SetManuallyDisconnected(manual bool) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.manualDisconnect = manual
}

// Config returns the connection configuration.
func (c *Connection) Config() Config {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.config
}

// SetPreferredProtocol sets the user's preferred protocol.
func (c *Connection) SetPreferredProtocol(protocol Protocol) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.config.PreferredProtocol = protocol
	c.Status.PreferredProtocol = string(protocol)
}

// Pool manages multiple router connections.
type Pool struct {
	connections    map[string]*Connection
	mu             sync.RWMutex
	maxConnections int
}

// NewPool creates a new connection pool with no connection limit.
func NewPool() *Pool {
	return &Pool{
		connections:    make(map[string]*Connection),
		maxConnections: 0, // 0 = unlimited
	}
}

// NewPoolWithLimit creates a new connection pool with a maximum connection limit.
func NewPoolWithLimit(maxConnections int) *Pool {
	return &Pool{
		connections:    make(map[string]*Connection),
		maxConnections: maxConnections,
	}
}

// Get returns the connection for a router, or nil if not found.
func (p *Pool) Get(routerID string) *Connection {
	p.mu.RLock()
	defer p.mu.RUnlock()
	return p.connections[routerID]
}

// GetOrCreate returns the connection for a router, creating one if it doesn't exist.
// Returns nil if max connections limit is reached.
func (p *Pool) GetOrCreate(routerID string, config Config, cb *CircuitBreaker) *Connection {
	p.mu.Lock()
	defer p.mu.Unlock()

	if conn, ok := p.connections[routerID]; ok {
		return conn
	}

	// Check max connections limit (0 = unlimited)
	if p.maxConnections > 0 && len(p.connections) >= p.maxConnections {
		return nil
	}

	conn := NewConnection(routerID, config, cb)
	p.connections[routerID] = conn
	return conn
}

// Add adds a connection to the pool.
func (p *Pool) Add(conn *Connection) {
	p.mu.Lock()
	defer p.mu.Unlock()
	p.connections[conn.RouterID] = conn
}

// Remove removes a connection from the pool.
func (p *Pool) Remove(routerID string) *Connection {
	p.mu.Lock()
	defer p.mu.Unlock()

	conn, ok := p.connections[routerID]
	if ok {
		delete(p.connections, routerID)
	}
	return conn
}

// GetAll returns all connections in the pool.
func (p *Pool) GetAll() []*Connection {
	p.mu.RLock()
	defer p.mu.RUnlock()

	conns := make([]*Connection, 0, len(p.connections))
	for _, conn := range p.connections {
		conns = append(conns, conn)
	}
	return conns
}

// Count returns the number of connections in the pool.
func (p *Pool) Count() int {
	p.mu.RLock()
	defer p.mu.RUnlock()
	return len(p.connections)
}

// CountByState returns the count of connections in a specific state.
func (p *Pool) CountByState(state State) int {
	p.mu.RLock()
	defer p.mu.RUnlock()

	count := 0
	for _, conn := range p.connections {
		if conn.Status.State == state {
			count++
		}
	}
	return count
}

// CloseAll closes all connections in the pool.
func (p *Pool) CloseAll(ctx context.Context) error {
	p.mu.Lock()
	// Get snapshot of connections and cancel funcs before unlocking
	connSnapshot := make([]*Connection, 0, len(p.connections))
	for _, conn := range p.connections {
		connSnapshot = append(connSnapshot, conn)
	}
	p.connections = make(map[string]*Connection)
	p.mu.Unlock()

	// Close connections outside the lock to avoid deadlock
	var lastErr error
	for _, conn := range connSnapshot {
		// Cancel any goroutines
		if conn.reconnectCancel != nil {
			conn.reconnectCancel()
		}
		if conn.healthCancel != nil {
			conn.healthCancel()
		}
		// Disconnect client
		if conn.Client != nil {
			if err := conn.Client.Disconnect(); err != nil {
				lastErr = err
			}
		}
	}
	return lastErr
}

// BackoffConfig holds configuration for exponential backoff.
type BackoffConfig struct {
	InitialInterval     time.Duration
	MaxInterval         time.Duration
	Multiplier          float64
	RandomizationFactor float64
	MaxElapsedTime      time.Duration // 0 = infinite
}

// DefaultBackoffConfig returns the default backoff configuration.
// Per story spec: initial=1s, max=30s, multiplier=2, jitter=0.5
func DefaultBackoffConfig() BackoffConfig {
	return BackoffConfig{
		InitialInterval:     1 * time.Second,
		MaxInterval:         30 * time.Second,
		Multiplier:          2.0,
		RandomizationFactor: 0.5,
		MaxElapsedTime:      0, // Never give up
	}
}

// NewExponentialBackoff creates a new exponential backoff with the given config.
func NewExponentialBackoff(config BackoffConfig) *backoff.ExponentialBackOff {
	b := backoff.NewExponentialBackOff()
	b.InitialInterval = config.InitialInterval
	b.MaxInterval = config.MaxInterval
	b.Multiplier = config.Multiplier
	b.RandomizationFactor = config.RandomizationFactor
	b.MaxElapsedTime = config.MaxElapsedTime
	b.Reset()
	return b
}

// NewExponentialBackoffWithContext creates a backoff that respects context cancellation.
func NewExponentialBackoffWithContext(ctx context.Context, config BackoffConfig) backoff.BackOff {
	b := NewExponentialBackoff(config)
	return backoff.WithContext(b, ctx)
}

// CanAttemptReconnect checks if a reconnection attempt is allowed.
// Rate limits manual reconnection to 1 per 10 seconds.
func (c *Connection) CanAttemptReconnect() (bool, time.Duration) {
	c.mu.RLock()
	defer c.mu.RUnlock()

	// Check if circuit breaker is open
	if c.CircuitBreaker != nil && c.CircuitBreaker.IsOpen() {
		return false, 0
	}

	// Check rate limiting for manual reconnection (10 seconds)
	minInterval := 10 * time.Second
	timeSinceLastAttempt := time.Since(c.lastReconnectAttempt)
	if timeSinceLastAttempt < minInterval {
		return false, minInterval - timeSinceLastAttempt
	}

	return true, 0
}

// RecordReconnectAttempt records a reconnection attempt.
func (c *Connection) RecordReconnectAttempt() {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.lastReconnectAttempt = time.Now()
}

// SetReconnectCancel sets the cancel function for the reconnection goroutine.
func (c *Connection) SetReconnectCancel(cancel context.CancelFunc) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.reconnectCancel = cancel
}

// CancelReconnect cancels any active reconnection attempt.
func (c *Connection) CancelReconnect() {
	c.mu.Lock()
	cancel := c.reconnectCancel
	c.mu.Unlock()

	if cancel != nil {
		cancel()
	}
}

// SetHealthCancel sets the cancel function for the health check goroutine.
func (c *Connection) SetHealthCancel(cancel context.CancelFunc) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.healthCancel = cancel
}

// CancelHealthCheck cancels any active health check goroutine.
func (c *Connection) CancelHealthCheck() {
	c.mu.Lock()
	cancel := c.healthCancel
	c.mu.Unlock()

	if cancel != nil {
		cancel()
	}
}

// UpdateStatus atomically updates the connection status.
func (c *Connection) UpdateStatus(fn func(*Status)) {
	c.mu.Lock()
	defer c.mu.Unlock()
	fn(c.Status)
}

// TransitionError represents an error during state transition.
type TransitionError struct {
	RouterID string
	From     State
	To       State
	Reason   string
}

func (e *TransitionError) Error() string {
	return fmt.Sprintf("connection %s: invalid transition from %s to %s: %s", e.RouterID, e.From, e.To, e.Reason)
}
