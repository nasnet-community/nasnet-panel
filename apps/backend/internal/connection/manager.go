package connection

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/cenkalti/backoff/v4"
	"github.com/sony/gobreaker/v2"
	"go.uber.org/zap"

	"backend/internal/events"
)

// Manager handles connection lifecycle for all routers.
// It implements the ConnectionManager interface from the story specification.
type Manager struct {
	pool              *ConnectionPool
	cbFactory         *CircuitBreakerFactory
	eventBus          events.EventBus
	logger            *zap.Logger
	clientFactory     ClientFactory
	backoffConfig     BackoffConfig
	healthConfig      HealthConfig
	mu                sync.RWMutex
	closed            bool
	wg                sync.WaitGroup
}

// ClientFactory creates protocol-specific clients for routers.
type ClientFactory interface {
	// CreateClient creates a client for connecting to a router.
	CreateClient(ctx context.Context, config ConnectionConfig) (RouterClient, error)
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
		pool:          NewConnectionPool(),
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
		conn.UpdateStatus(func(status *ConnectionStatus) {
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

// GetConnection returns the connection for a router, or an error if not found.
func (m *Manager) GetConnection(routerID string) (*Connection, error) {
	conn := m.pool.Get(routerID)
	if conn == nil {
		return nil, fmt.Errorf("connection not found for router %s", routerID)
	}
	return conn, nil
}

// GetOrCreateConnection returns the connection for a router, creating one if needed.
func (m *Manager) GetOrCreateConnection(routerID string, config ConnectionConfig) *Connection {
	cb := m.cbFactory.Create(routerID)
	return m.pool.GetOrCreate(routerID, config, cb)
}

// Connect establishes a connection to a router.
func (m *Manager) Connect(ctx context.Context, routerID string, config ConnectionConfig) error {
	m.mu.RLock()
	if m.closed {
		m.mu.RUnlock()
		return fmt.Errorf("manager is closed")
	}
	m.mu.RUnlock()

	conn := m.GetOrCreateConnection(routerID, config)

	// Check if already connected
	if conn.IsConnected() {
		return nil
	}

	// Clear manual disconnect flag
	conn.SetManuallyDisconnected(false)

	// Get previous state for event
	prevState := conn.Status.State

	// Update state to connecting
	conn.UpdateStatus(func(status *ConnectionStatus) {
		_ = status.SetConnecting()
	})

	// Publish state change event
	m.publishStatusChange(routerID, prevState, StateConnecting, "")

	// Attempt connection through circuit breaker
	_, err := conn.CircuitBreaker.ExecuteWithContext(ctx, func(ctx context.Context) (any, error) {
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
		// Connection failed
		conn.UpdateStatus(func(status *ConnectionStatus) {
			_ = status.SetError(err.Error())
		})
		m.publishStatusChange(routerID, StateConnecting, StateError, err.Error())

		// Check if we should auto-reconnect
		if !conn.IsManuallyDisconnected() && conn.CircuitBreaker != nil && !conn.CircuitBreaker.IsOpen() {
			m.startReconnection(conn)
		}

		return err
	}

	// Connection successful
	client := err.(RouterClient)
	conn.SetClient(client)
	conn.UpdateStatus(func(status *ConnectionStatus) {
		_ = status.SetConnected(string(client.Protocol()), client.Version())
	})
	m.publishStatusChange(routerID, StateConnecting, StateConnected, "")

	// Start health monitoring
	m.startHealthMonitoring(conn)

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
	conn.UpdateStatus(func(status *ConnectionStatus) {
		_ = status.SetDisconnected(reason)
	})

	m.publishStatusChange(routerID, prevState, StateDisconnected, reason.String())

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

	// Trigger reconnection
	return m.Connect(ctx, routerID, conn.Config())
}

// startReconnection starts the automatic reconnection process.
func (m *Manager) startReconnection(conn *Connection) {
	// Cancel any existing reconnection
	conn.CancelReconnect()

	ctx, cancel := context.WithCancel(context.Background())
	conn.SetReconnectCancel(cancel)

	m.wg.Add(1)
	go func() {
		defer m.wg.Done()
		m.reconnectLoop(ctx, conn)
	}()
}

// reconnectLoop attempts to reconnect with exponential backoff.
func (m *Manager) reconnectLoop(ctx context.Context, conn *Connection) {
	routerID := conn.RouterID
	prevState := conn.Status.State

	// Update state to reconnecting
	conn.UpdateStatus(func(status *ConnectionStatus) {
		_ = status.SetReconnecting(0, time.Now())
	})
	m.publishStatusChange(routerID, prevState, StateReconnecting, "")

	b := NewExponentialBackoffWithContext(ctx, m.backoffConfig)
	attempt := 0

	operation := func() error {
		// Check if manually disconnected
		if conn.IsManuallyDisconnected() {
			return backoff.Permanent(fmt.Errorf("manually disconnected"))
		}

		// Check if circuit breaker is open
		if conn.CircuitBreaker != nil && conn.CircuitBreaker.IsOpen() {
			return backoff.Permanent(fmt.Errorf("circuit breaker open"))
		}

		attempt++
		conn.UpdateStatus(func(status *ConnectionStatus) {
			status.ReconnectAttempts = attempt
		})

		m.logger.Info("reconnection attempt",
			zap.String("routerID", routerID),
			zap.Int("attempt", attempt),
		)

		// Try to connect
		_, err := conn.CircuitBreaker.ExecuteWithContext(ctx, func(ctx context.Context) (any, error) {
			client, err := m.clientFactory.CreateClient(ctx, conn.Config())
			if err != nil {
				return nil, err
			}
			if err := client.Connect(ctx); err != nil {
				return nil, err
			}
			return client, nil
		})

		if err != nil {
			conn.UpdateStatus(func(status *ConnectionStatus) {
				status.LastError = err.Error()
				now := time.Now()
				status.LastErrorTime = &now
			})
			return err
		}

		// Success
		client := err.(RouterClient)
		conn.SetClient(client)
		return nil
	}

	err := backoff.Retry(operation, b)

	if err != nil {
		// Reconnection failed permanently
		if conn.IsManuallyDisconnected() {
			conn.UpdateStatus(func(status *ConnectionStatus) {
				_ = status.SetDisconnected(DisconnectReasonManual)
			})
			m.publishStatusChange(routerID, StateReconnecting, StateDisconnected, "manual")
		} else {
			conn.UpdateStatus(func(status *ConnectionStatus) {
				_ = status.SetError(err.Error())
			})
			m.publishStatusChange(routerID, StateReconnecting, StateError, err.Error())
		}
		return
	}

	// Reconnection successful
	client := conn.GetClient()
	conn.UpdateStatus(func(status *ConnectionStatus) {
		_ = status.SetConnected(string(client.Protocol()), client.Version())
	})
	m.publishStatusChange(routerID, StateReconnecting, StateConnected, "")

	// Start health monitoring
	m.startHealthMonitoring(conn)

	m.logger.Info("router reconnected",
		zap.String("routerID", routerID),
		zap.Int("attempts", attempt),
	)
}

// startHealthMonitoring starts the health check routine for a connection.
func (m *Manager) startHealthMonitoring(conn *Connection) {
	// Cancel any existing health monitoring
	conn.CancelHealthCheck()

	ctx, cancel := context.WithCancel(context.Background())
	conn.SetHealthCancel(cancel)

	m.wg.Add(1)
	go func() {
		defer m.wg.Done()
		m.healthCheckLoop(ctx, conn)
	}()
}

// healthCheckLoop periodically checks the health of a connection.
func (m *Manager) healthCheckLoop(ctx context.Context, conn *Connection) {
	ticker := time.NewTicker(m.healthConfig.Interval)
	defer ticker.Stop()

	routerID := conn.RouterID
	consecutiveFailures := 0

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			// Don't health check if not connected
			if conn.Status.State != StateConnected {
				continue
			}

			client := conn.GetClient()
			if client == nil {
				continue
			}

			// Perform health check with timeout
			checkCtx, checkCancel := context.WithTimeout(ctx, m.healthConfig.Timeout)
			err := client.Ping(checkCtx)
			checkCancel()

			if err != nil {
				consecutiveFailures++
				conn.Status.RecordHealthCheck(false)

				m.logger.Warn("health check failed",
					zap.String("routerID", routerID),
					zap.Int("consecutiveFailures", consecutiveFailures),
					zap.Error(err),
				)

				// Check if threshold exceeded
				if consecutiveFailures >= m.healthConfig.FailureThreshold {
					m.logger.Error("health check threshold exceeded, initiating reconnection",
						zap.String("routerID", routerID),
						zap.Int("failures", consecutiveFailures),
					)

					// Trigger reconnection
					prevState := conn.Status.State
					conn.UpdateStatus(func(status *ConnectionStatus) {
						_ = status.SetReconnecting(0, time.Now())
					})
					m.publishStatusChange(routerID, prevState, StateReconnecting, "health_check_failed")

					// Start reconnection
					m.startReconnection(conn)
					return
				}
			} else {
				consecutiveFailures = 0
				conn.Status.RecordHealthCheck(true)
			}
		}
	}
}

// publishStatusChange publishes a RouterStatusChangedEvent.
func (m *Manager) publishStatusChange(routerID string, from, to ConnectionState, errorMsg string) {
	if m.eventBus == nil {
		return
	}

	fromStatus := toRouterStatus(from)
	toStatus := toRouterStatus(to)

	event := events.NewRouterStatusChangedEvent(routerID, toStatus, fromStatus, "connection-manager")
	if errorMsg != "" {
		event.ErrorMessage = errorMsg
	}

	ctx, cancel := context.WithTimeout(context.Background(), 100*time.Millisecond)
	defer cancel()

	if err := m.eventBus.Publish(ctx, event); err != nil {
		m.logger.Error("failed to publish status change event",
			zap.String("routerID", routerID),
			zap.Error(err),
		)
	}
}

// toRouterStatus converts a ConnectionState to events.RouterStatus.
func toRouterStatus(state ConnectionState) events.RouterStatus {
	switch state {
	case StateConnected:
		return events.RouterStatusConnected
	case StateDisconnected:
		return events.RouterStatusDisconnected
	case StateConnecting, StateReconnecting:
		return events.RouterStatusReconnecting
	case StateError:
		return events.RouterStatusError
	default:
		return events.RouterStatusUnknown
	}
}

// GetStatus returns the connection status for a router.
func (m *Manager) GetStatus(routerID string) (ConnectionStatus, error) {
	conn := m.pool.Get(routerID)
	if conn == nil {
		return ConnectionStatus{}, fmt.Errorf("connection not found for router %s", routerID)
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

	// Disconnect first
	_ = m.Disconnect(routerID, DisconnectReasonShutdown)

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
