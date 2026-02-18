package connection

import (
	"context"
	"time"

	"go.uber.org/zap"
)

// startHealthMonitoring starts the health check routine for a connection.
func (m *Manager) startHealthMonitoring(ctx context.Context, conn *Connection) {
	// Cancel any existing health monitoring
	conn.CancelHealthCheck()

	loopCtx, cancel := context.WithCancel(ctx)
	conn.SetHealthCancel(cancel)

	m.wg.Add(1)
	go func() {
		defer m.wg.Done()
		m.healthCheckLoop(loopCtx, conn)
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
					conn.UpdateStatus(func(status *Status) {
						_ = status.SetReconnecting(0, time.Now()) //nolint:errcheck // state transition failure is non-fatal, reconnection proceeds regardless
					})
					m.publishStatusChange(ctx, routerID, prevState, StateReconnecting, "health_check_failed")

					// Start reconnection
					m.startReconnection(ctx, conn)
					return
				}
			} else {
				consecutiveFailures = 0
				conn.Status.RecordHealthCheck(true)
			}
		}
	}
}
