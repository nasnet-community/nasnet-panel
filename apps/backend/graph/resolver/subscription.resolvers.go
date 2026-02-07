package resolver

// Subscription resolver implementations for NAS-2.6
// These resolvers connect GraphQL subscriptions to the Watermill event bus

import (
	"backend/graph/model"
	"backend/internal/events"
	"context"
	"log"
	"time"
)

// RouterStatusChanged subscribes to router status change events.
// If routerID is provided, only events for that router are streamed.
// If routerID is nil, all router status changes are streamed.
func (r *subscriptionResolver) RouterStatusChanged(ctx context.Context, routerID *string) (<-chan *model.RouterStatusEvent, error) {
	// Create a buffered channel for events
	ch := make(chan *model.RouterStatusEvent, 10)

	// Subscribe to the event bus
	if r.EventBus != nil {
		handler := func(eventCtx context.Context, event events.Event) error {
			// Type assert to RouterStatusChangedEvent
			statusEvent, ok := event.(*events.RouterStatusChangedEvent)
			if !ok {
				return nil // Skip non-matching events
			}

			// Filter by routerID if specified
			if routerID != nil && statusEvent.RouterID != *routerID {
				return nil
			}

			// Convert to GraphQL model
			graphQLEvent := &model.RouterStatusEvent{
				Router: &model.Router{
					ID: statusEvent.RouterID,
					// Note: Full router data should be loaded from DB in production
					Status: convertRouterStatus(statusEvent.Status),
				},
				PreviousStatus: convertRouterStatus(statusEvent.PreviousStatus),
				NewStatus:      convertRouterStatus(statusEvent.Status),
				Timestamp:      statusEvent.GetTimestamp(),
			}

			// Non-blocking send with context check
			select {
			case <-ctx.Done():
				return ctx.Err()
			case ch <- graphQLEvent:
				return nil
			default:
				// Channel full, log warning but don't block
				log.Printf("[SUBSCRIPTION] RouterStatusChanged channel full, dropping event for router %s", statusEvent.RouterID)
				return nil
			}
		}

		if err := r.EventBus.Subscribe(events.EventTypeRouterStatusChanged, handler); err != nil {
			close(ch)
			return nil, err
		}
	}

	// Clean up when context is cancelled
	go func() {
		<-ctx.Done()
		close(ch)
	}()

	return ch, nil
}

// InterfaceTraffic subscribes to interface traffic updates.
// This is a polling subscription that fetches traffic data at regular intervals.
func (r *subscriptionResolver) InterfaceTraffic(ctx context.Context, routerID string, interfaceID *string) (<-chan *model.InterfaceTrafficEvent, error) {
	ch := make(chan *model.InterfaceTrafficEvent, 5)

	// Default polling interval from @realtime directive (1000ms)
	interval := 1 * time.Second

	go func() {
		defer close(ch)

		ticker := time.NewTicker(interval)
		defer ticker.Stop()

		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				// In production, this would fetch real traffic data from the router
				// For now, we emit placeholder events
				event := &model.InterfaceTrafficEvent{
					InterfaceID:   "placeholder",
					InterfaceName: "eth0",
					TxRate:        "0",
					RxRate:        "0",
					TxTotal:       "0",
					RxTotal:       "0",
					Timestamp:     time.Now(),
				}

				if interfaceID != nil {
					event.InterfaceID = *interfaceID
				}

				select {
				case ch <- event:
				case <-ctx.Done():
					return
				}
			}
		}
	}()

	return ch, nil
}

// ResourceUpdated subscribes to resource update events (create, update, delete).
// If resourceID is provided, only events for that specific resource are streamed.
// If resourceID is nil, all resource updates are streamed.
func (r *subscriptionResolver) ResourceUpdated(ctx context.Context, resourceID *string) (<-chan *model.ResourceUpdatedEvent, error) {
	ch := make(chan *model.ResourceUpdatedEvent, 20)

	if r.EventBus != nil {
		// Handler for all resource event types
		handler := func(eventCtx context.Context, event events.Event) error {
			resourceEvent, ok := event.(*events.ResourceUpdatedEvent)
			if !ok {
				return nil
			}

			// Filter by resourceID if specified
			if resourceID != nil && resourceEvent.ResourceUUID.String() != *resourceID {
				return nil
			}

			// Convert to GraphQL model
			graphQLEvent := &model.ResourceUpdatedEvent{
				ResourceID:    resourceEvent.ResourceUUID.String(),
				ResourceType:  resourceEvent.ResourceType,
				RouterID:      resourceEvent.RouterID,
				Version:       resourceEvent.NewVersion,
				ChangedFields: resourceEvent.ChangedFields,
				ChangeType:    convertChangeType(resourceEvent.ChangeType),
				Timestamp:     resourceEvent.GetTimestamp(),
			}

			select {
			case <-ctx.Done():
				return ctx.Err()
			case ch <- graphQLEvent:
				return nil
			default:
				log.Printf("[SUBSCRIPTION] ResourceUpdated channel full, dropping event for resource %s", resourceEvent.ResourceUUID)
				return nil
			}
		}

		// Subscribe to all resource event types
		for _, eventType := range []string{
			events.EventTypeResourceCreated,
			events.EventTypeResourceUpdated,
			events.EventTypeResourceDeleted,
		} {
			if err := r.EventBus.Subscribe(eventType, handler); err != nil {
				close(ch)
				return nil, err
			}
		}
	}

	go func() {
		<-ctx.Done()
		close(ch)
	}()

	return ch, nil
}

// ConfigApplyProgress subscribes to configuration apply progress events.
// This streams real-time progress updates for a specific configuration apply operation.
func (r *subscriptionResolver) ConfigApplyProgress(ctx context.Context, operationID string) (<-chan *model.ConfigProgress, error) {
	ch := make(chan *model.ConfigProgress, 10)

	if r.EventBus != nil {
		handler := func(eventCtx context.Context, event events.Event) error {
			progressEvent, ok := event.(*events.ConfigApplyProgressEvent)
			if !ok {
				return nil
			}

			// Filter by operationID
			if progressEvent.OperationID != operationID {
				return nil
			}

			// Convert to GraphQL model
			graphQLEvent := &model.ConfigProgress{
				OperationID: progressEvent.OperationID,
				Status:      convertConfigApplyStatus(progressEvent.Stage),
				Percentage:  progressEvent.Progress,
				Message:     progressEvent.Message,
				CurrentStep: &progressEvent.ResourcesApplied,
				TotalSteps:  &progressEvent.ResourcesTotal,
				Timestamp:   progressEvent.GetTimestamp(),
			}

			select {
			case <-ctx.Done():
				return ctx.Err()
			case ch <- graphQLEvent:
				return nil
			default:
				log.Printf("[SUBSCRIPTION] ConfigApplyProgress channel full, dropping event for operation %s", operationID)
				return nil
			}
		}

		if err := r.EventBus.Subscribe(events.EventTypeConfigApplyProgress, handler); err != nil {
			close(ch)
			return nil, err
		}
	}

	go func() {
		<-ctx.Done()
		close(ch)
	}()

	return ch, nil
}

// Helper functions for type conversions

// convertRouterStatus converts internal RouterStatus to GraphQL ConnectionStatus
func convertRouterStatus(status events.RouterStatus) model.ConnectionStatus {
	switch status {
	case events.RouterStatusConnected:
		return model.ConnectionStatusConnected
	case events.RouterStatusDisconnected:
		return model.ConnectionStatusDisconnected
	case events.RouterStatusReconnecting:
		return model.ConnectionStatusConnecting
	case events.RouterStatusError:
		return model.ConnectionStatusError
	default:
		return model.ConnectionStatusDisconnected
	}
}

// convertChangeType converts internal ChangeType to GraphQL ChangeType
func convertChangeType(ct events.ChangeType) model.ChangeType {
	switch ct {
	case events.ChangeTypeCreate:
		return model.ChangeTypeCreate
	case events.ChangeTypeUpdate:
		return model.ChangeTypeUpdate
	case events.ChangeTypeDelete:
		return model.ChangeTypeDelete
	default:
		return model.ChangeTypeUpdate
	}
}

// convertConfigApplyStatus converts stage string to GraphQL ConfigApplyStatus
func convertConfigApplyStatus(stage string) model.ConfigApplyStatus {
	switch stage {
	case "pending":
		return model.ConfigApplyStatusPending
	case "validating":
		return model.ConfigApplyStatusValidating
	case "applying":
		return model.ConfigApplyStatusApplying
	case "verifying":
		return model.ConfigApplyStatusVerifying
	case "completed":
		return model.ConfigApplyStatusCompleted
	case "failed":
		return model.ConfigApplyStatusFailed
	case "rolled_back":
		return model.ConfigApplyStatusRolledBack
	default:
		return model.ConfigApplyStatusPending
	}
}

// InterfaceStatusChanged subscribes to interface status change events.
// If interfaceID is provided, only events for that interface are streamed.
// If interfaceID is nil, all interface status changes for the router are streamed.
func (r *subscriptionResolver) InterfaceStatusChanged(ctx context.Context, routerID string, interfaceID *string) (<-chan *model.InterfaceStatusEvent, error) {
	// Create a buffered channel for events
	ch := make(chan *model.InterfaceStatusEvent, 10)

	// Subscribe to the event bus
	if r.EventBus != nil {
		handler := func(eventCtx context.Context, event events.Event) error {
			// Type assert to InterfaceStatusChangedEvent
			statusEvent, ok := event.(*events.InterfaceStatusChangedEvent)
			if !ok {
				return nil // Skip non-matching events
			}

			// Filter by routerID
			if statusEvent.RouterID != routerID {
				return nil
			}

			// Filter by interfaceID if specified
			if interfaceID != nil && statusEvent.InterfaceID != *interfaceID {
				return nil
			}

			// Convert status to GraphQL enum
			status := convertInterfaceStatusString(statusEvent.Status)
			previousStatus := convertInterfaceStatusString(statusEvent.PreviousStatus)

			// Convert to GraphQL model
			graphQLEvent := &model.InterfaceStatusEvent{
				InterfaceID:    statusEvent.InterfaceID,
				InterfaceName:  statusEvent.InterfaceName,
				Status:         status,
				PreviousStatus: previousStatus,
				Timestamp:      statusEvent.GetTimestamp(),
			}

			// Non-blocking send with context check
			select {
			case <-ctx.Done():
				return ctx.Err()
			case ch <- graphQLEvent:
				return nil
			default:
				// Channel full, log warning but don't block
				log.Printf("[SUBSCRIPTION] InterfaceStatusChanged channel full, dropping event for interface %s", statusEvent.InterfaceName)
				return nil
			}
		}

		if err := r.EventBus.Subscribe(events.EventTypeInterfaceStatusChanged, handler); err != nil {
			close(ch)
			return nil, err
		}
	}

	// Clean up when context is cancelled
	go func() {
		<-ctx.Done()
		close(ch)
	}()

	return ch, nil
}

// convertInterfaceStatusString converts status string to GraphQL InterfaceStatus enum.
func convertInterfaceStatusString(status string) model.InterfaceStatus {
	switch status {
	case "UP":
		return model.InterfaceStatusUp
	case "DOWN":
		return model.InterfaceStatusDown
	case "DISABLED":
		return model.InterfaceStatusDisabled
	default:
		return model.InterfaceStatusUnknown
	}
}
