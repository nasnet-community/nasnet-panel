package connection

import (
	"context"
	"fmt"
	"time"

	"github.com/cenkalti/backoff/v4"
	"go.uber.org/zap"
)

// startReconnection starts the automatic reconnection process.
func (m *Manager) startReconnection(ctx context.Context, conn *Connection) {
	// Cancel any existing reconnection
	conn.CancelReconnect()

	loopCtx, cancel := context.WithCancel(ctx)
	conn.SetReconnectCancel(cancel)

	m.wg.Add(1)
	go func() {
		defer m.wg.Done()
		m.reconnectLoop(loopCtx, conn)
	}()
}

// reconnectLoop attempts to reconnect with exponential backoff.
func (m *Manager) reconnectLoop(ctx context.Context, conn *Connection) {
	routerID := conn.RouterID
	prevState := conn.Status.State

	// Update state to reconnecting
	conn.UpdateStatus(func(status *Status) {
		_ = status.SetReconnecting(0, time.Now()) //nolint:errcheck // state transition failure is non-fatal, reconnection proceeds regardless
	})
	m.publishStatusChange(ctx, routerID, prevState, StateReconnecting, "")

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
		conn.UpdateStatus(func(status *Status) {
			status.ReconnectAttempts = attempt
		})

		m.logger.Info("reconnection attempt",
			zap.String("routerID", routerID),
			zap.Int("attempt", attempt),
		)

		// Try to connect
		cbResult, err := conn.CircuitBreaker.ExecuteWithContext(ctx, func(ctx context.Context) (any, error) {
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
			conn.UpdateStatus(func(status *Status) {
				status.LastError = err.Error()
				now := time.Now()
				status.LastErrorTime = &now
			})
			return err
		}

		// Success
		client, ok := cbResult.(RouterClient)
		if !ok {
			return fmt.Errorf("unexpected result type from circuit breaker")
		}
		conn.SetClient(client)
		return nil
	}

	err := backoff.Retry(operation, b)

	if err != nil {
		// Reconnection failed permanently
		if conn.IsManuallyDisconnected() {
			conn.UpdateStatus(func(status *Status) {
				_ = status.SetDisconnected(DisconnectReasonManual) //nolint:errcheck // state transition failure is non-fatal after permanent reconnection failure
			})
			m.publishStatusChange(ctx, routerID, StateReconnecting, StateDisconnected, "manual")
		} else {
			conn.UpdateStatus(func(status *Status) {
				_ = status.SetError(err.Error()) //nolint:errcheck // state transition failure is non-fatal after permanent reconnection failure
			})
			m.publishStatusChange(ctx, routerID, StateReconnecting, StateError, err.Error())
		}
		return
	}

	// Reconnection successful
	client := conn.GetClient()
	conn.UpdateStatus(func(status *Status) {
		_ = status.SetConnected(string(client.Protocol()), client.Version()) //nolint:errcheck // state transition failure is non-fatal, client is already reconnected
	})
	m.publishStatusChange(ctx, routerID, StateReconnecting, StateConnected, "")

	// Start health monitoring
	m.startHealthMonitoring(ctx, conn)

	m.logger.Info("router reconnected",
		zap.String("routerID", routerID),
		zap.Int("attempts", attempt),
	)
}
