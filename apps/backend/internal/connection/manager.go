package connection

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/sony/gobreaker/v2"
	"go.uber.org/zap"

	"backend/internal/events"
)

// Manager handles connection lifecycle for all routers.
// It implements the ConnectionManager interface from the story specification.
type Manager struct {
	pool          *Pool
	cbFactory     *CircuitBreakerFactory
	eventBus      events.EventBus
	logger        *zap.Logger
	clientFactory ClientFactory
	backoffConfig BackoffConfig
	healthConfig  HealthConfig
	mu            sync.RWMutex
	closed        bool
	wg            sync.WaitGroup
}

// ClientFactory creates protocol-specific clients for routers.
type ClientFactory interface {
	// CreateClient creates a client for connecting to a router.
	CreateClient(ctx context.Context, config Config) (RouterClient, error)
}

// HealthConfig holds configuration for health monitoring.
type HealthConfig struct {
	// Interval is the time between health checks.
	Interval time.Duration

	// Timeout is the timeout for a single health check.
	Timeout time.Duration

	// FailureThreshold is the number of consecutive failures before marking unhealthy.
	FailureThreshold int
}

// DefaultHealthConfig returns the default health configuration.
func DefaultHealthConfig() HealthConfig {
	return HealthConfig{
		Interval:         30 * time.Second,
		Timeout:          5 * time.Second,
		FailureThreshold: 3,
	}
}

// ManagerConfig holds configuration for the connection manager.
type ManagerConfig struct {
	CircuitBreaker CircuitBreakerConfig
	Backoff        BackoffConfig
	Health         HealthConfig
}

// DefaultManagerConfig returns the default manager configuration.
func DefaultManagerConfig() ManagerConfig {
	return ManagerConfig{
		CircuitBreaker: DefaultCircuitBreakerConfig(),
		Backoff:        DefaultBackoffConfig(),
		Health:         DefaultHealthConfig(),
	}
}

// NewManager creates a new connection manager.
func NewManager(
	eventBus events.EventBus,
	clientFactory ClientFactory,
	logger *zap.Logger,
	config ManagerConfig,
) *Manager {

	m := &Manager{
		pool:          NewPool(),
		eventBus:      eventBus,
		logger:        logger.Named("connection-manager"),
		clientFactory: clientFactory,
		backoffConfig: config.Backoff,
		healthConfig:  config.Health,
	}

	// Create circuit breaker factory with state change callback
	m.cbFactory = NewCircuitBreakerFactory(config.CircuitBreaker, m.onCircuitBreakerStateChange)

	return m
}

// onCircuitBreakerStateChange is called when a circuit breaker changes state.
func (m *Manager) onCircuitBreakerStateChange(routerID string, from, to gobreaker.State) {
	m.logger.Info("circuit breaker state changed",
		zap.String("routerID", routerID),
		zap.String("from", from.String()),
		zap.String("to", to.String()),
	)

	// Update connection status
	conn := m.pool.Get(routerID)
	if conn != nil {
		conn.UpdateStatus(func(status *Status) {
			status.CircuitBreakerState = stateToString(to)
		})
	}
}

func stateToString(s gobreaker.State) string {
	switch s {
	case gobreaker.StateClosed:
		return "CLOSED"
	case gobreaker.StateOpen:
		return "OPEN"
	case gobreaker.StateHalfOpen:
		return "HALF_OPEN"
	default:
		return "UNKNOWN"
	}
}

// handleConnectionError handles the error response when connection fails.
// It updates the connection status, publishes status change event, and determines
// whether automatic reconnection should be triggered.
func (m *Manager) handleConnectionError(ctx context.Context, routerID string, conn *Connection, err error) error {
	// Update status to error state
	conn.UpdateStatus(func(status *Status) {
		_ = status.SetError(err.Error()) //nolint:errcheck // state transition failure is non-fatal, error is already being returned
	})
	m.publishStatusChange(ctx, routerID, StateConnecting, StateError, err.Error())

	// Check if we should auto-reconnect
	if !conn.IsManuallyDisconnected() {
		shouldReconnect := true
		if conn.CircuitBreaker == nil {
			shouldReconnect = false
		} else if conn.CircuitBreaker.IsOpen() {
			shouldReconnect = false
		}
		if shouldReconnect {
			m.startReconnection(ctx, conn)
		}
	}

	return err
}

// GetConnection returns the connection for a router, or an error if not found.
func (m *Manager) GetConnection(routerID string) (*Connection, error) {
	conn := m.pool.Get(routerID)
	if conn == nil {
		return nil, fmt.Errorf("connection not found for router %s", routerID)
	}
	return conn, nil
}

// GetOrCreateConnection returns the connection for a router, creating one if needed.
// Returns nil if the connection cannot be created (e.g., max connections limit reached).
func (m *Manager) GetOrCreateConnection(routerID string, config Config) *Connection {
	cb := m.cbFactory.Create(routerID)
	conn := m.pool.GetOrCreate(routerID, config, cb)
	if conn == nil {
		m.logger.Warn("failed to create connection, pool limit reached",
			zap.String("routerID", routerID),
		)
	}
	return conn
}

// Connect establishes a connection to a router.
func (m *Manager) Connect(ctx context.Context, routerID string, config Config) error {
	m.mu.RLock()
	if m.closed {
		m.mu.RUnlock()
		return fmt.Errorf("manager is closed")
	}
	m.mu.RUnlock()

	conn := m.GetOrCreateConnection(routerID, config)
	if conn == nil {
		return fmt.Errorf("failed to create connection for router %s: pool limit reached", routerID)
	}

	// Check if already connected
	if conn.IsConnected() {
		return nil
	}

	// Clear manual disconnect flag
	conn.SetManuallyDisconnected(false)

	// Get previous state for event
	prevState := conn.Status.State

	// Update state to connecting
	conn.UpdateStatus(func(status *Status) {
		_ = status.SetConnecting() //nolint:errcheck // status transition is best-effort during connect initiation
	})

	// Publish state change event
	m.publishStatusChange(ctx, routerID, prevState, StateConnecting, "")

	// Attempt connection through circuit breaker
	cbResult, err := conn.CircuitBreaker.ExecuteWithContext(ctx, func(ctx context.Context) (any, error) {
		client, err := m.clientFactory.CreateClient(ctx, config)
		if err != nil {
			return nil, fmt.Errorf("failed to create client: %w", err)
		}

		if err := client.Connect(ctx); err != nil {
			return nil, fmt.Errorf("failed to connect: %w", err)
		}

		return client, nil
	})

	if err != nil {
		return m.handleConnectionError(ctx, routerID, conn, err)
	}

	// Connection successful
	client, ok := cbResult.(RouterClient)
	if !ok {
		return fmt.Errorf("unexpected result type from circuit breaker")
	}
	conn.SetClient(client)
	conn.UpdateStatus(func(status *Status) {
		_ = status.SetConnected(string(client.Protocol()), client.Version()) //nolint:errcheck // status transition is best-effort, client is already connected
	})
	m.publishStatusChange(ctx, routerID, StateConnecting, StateConnected, "")

	// Start health monitoring
	m.startHealthMonitoring(ctx, conn)

	m.logger.Info("router connected",
		zap.String("routerID", routerID),
		zap.String("protocol", string(client.Protocol())),
	)

	return nil
}

// Disconnect closes the connection to a router.
func (m *Manager) Disconnect(routerID string, reason DisconnectReason) error {
	conn := m.pool.Get(routerID)
	if conn == nil {
		return fmt.Errorf("connection not found for router %s", routerID)
	}

	prevState := conn.Status.State

	// Mark as manually disconnected if user initiated
	if reason == DisconnectReasonManual {
		conn.SetManuallyDisconnected(true)
	}

	// Cancel health monitoring
	conn.CancelHealthCheck()

	// Cancel reconnection
	conn.CancelReconnect()

	// Disconnect client
	if conn.Client != nil {
		if err := conn.Client.Disconnect(); err != nil {
			m.logger.Warn("error disconnecting client", zap.Error(err))
		}
	}

	// Update status
	conn.UpdateStatus(func(status *Status) {
		_ = status.SetDisconnected(reason) //nolint:errcheck // status transition is best-effort during disconnect
	})

	// Use background context for disconnect event publishing
	bgCtx := context.Background()
	m.publishStatusChange(bgCtx, routerID, prevState, StateDisconnected, reason.String())

	m.logger.Info("router disconnected",
		zap.String("routerID", routerID),
		zap.String("reason", reason.String()),
	)

	return nil
}

// Reconnect manually triggers a reconnection attempt.
func (m *Manager) Reconnect(ctx context.Context, routerID string) error {
	conn := m.pool.Get(routerID)
	if conn == nil {
		return fmt.Errorf("connection not found for router %s", routerID)
	}

	// Check rate limiting
	canAttempt, waitTime := conn.CanAttemptReconnect()
	if !canAttempt {
		return fmt.Errorf("reconnection rate limited, wait %v", waitTime)
	}

	// Clear manual disconnect flag
	conn.SetManuallyDisconnected(false)

	// Record the attempt
	conn.RecordReconnectAttempt()

	// Trigger reconnection - will handle nil CircuitBreaker safely
	return m.Connect(ctx, routerID, conn.Config())
}

// GetStatus returns the connection status for a router.
func (m *Manager) GetStatus(routerID string) (Status, error) {
	conn := m.pool.Get(routerID)
	if conn == nil {
		return Status{}, fmt.Errorf("connection not found for router %s", routerID)
	}
	return conn.GetStatus(), nil
}

// GetAllConnections returns all connections.
func (m *Manager) GetAllConnections() []*Connection {
	return m.pool.GetAll()
}

// SetPreferredProtocol sets the preferred protocol for a router.
func (m *Manager) SetPreferredProtocol(routerID string, protocol Protocol) error {
	conn := m.pool.Get(routerID)
	if conn == nil {
		return fmt.Errorf("connection not found for router %s", routerID)
	}
	conn.SetPreferredProtocol(protocol)

	m.logger.Info("preferred protocol set",
		zap.String("routerID", routerID),
		zap.String("protocol", string(protocol)),
	)

	return nil
}

// RemoveConnection removes a connection from the pool.
func (m *Manager) RemoveConnection(routerID string) error {
	conn := m.pool.Get(routerID)
	if conn == nil {
		return fmt.Errorf("connection not found for router %s", routerID)
	}

	// Disconnect first - best-effort, we still remove from pool regardless of disconnect error
	_ = m.Disconnect(routerID, DisconnectReasonShutdown) //nolint:errcheck // best-effort disconnect before pool removal

	// Remove from pool
	m.pool.Remove(routerID)

	m.logger.Info("connection removed",
		zap.String("routerID", routerID),
	)

	return nil
}

// Close shuts down the connection manager.
func (m *Manager) Close() error {
	m.mu.Lock()
	m.closed = true
	m.mu.Unlock()

	// Close all connections
	if err := m.pool.CloseAll(context.Background()); err != nil {
		m.logger.Warn("error closing connections", zap.Error(err))
	}

	// Wait for goroutines to finish
	m.wg.Wait()

	m.logger.Info("connection manager closed")
	return nil
}

// Stats returns statistics about the connection manager.
type ManagerStats struct {
	TotalConnections int
	Connected        int
	Connecting       int
	Disconnected     int
	Reconnecting     int
	Error            int
}

// Stats returns current manager statistics.
func (m *Manager) Stats() ManagerStats {
	return ManagerStats{
		TotalConnections: m.pool.Count(),
		Connected:        m.pool.CountByState(StateConnected),
		Connecting:       m.pool.CountByState(StateConnecting),
		Disconnected:     m.pool.CountByState(StateDisconnected),
		Reconnecting:     m.pool.CountByState(StateReconnecting),
		Error:            m.pool.CountByState(StateError),
	}
}
