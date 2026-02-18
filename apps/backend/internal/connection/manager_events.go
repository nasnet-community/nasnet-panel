package connection

import (
	"context"
	"time"

	"go.uber.org/zap"

	"backend/internal/events"
)

// publishStatusChange publishes a RouterStatusChangedEvent.
func (m *Manager) publishStatusChange(ctx context.Context, routerID string, from, to State, errorMsg string) {
	if m.eventBus == nil {
		return
	}

	fromStatus := toRouterStatus(from)
	toStatus := toRouterStatus(to)

	event := events.NewRouterStatusChangedEvent(routerID, toStatus, fromStatus, "connection-manager")
	if errorMsg != "" {
		event.ErrorMessage = errorMsg
	}

	pubCtx, cancel := context.WithTimeout(ctx, 100*time.Millisecond)
	defer cancel()

	if err := m.eventBus.Publish(pubCtx, event); err != nil {
		m.logger.Error("failed to publish status change event",
			zap.String("routerID", routerID),
			zap.Error(err),
		)
	}
}

// toRouterStatus converts a State to events.RouterStatus.
func toRouterStatus(state State) events.RouterStatus {
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
