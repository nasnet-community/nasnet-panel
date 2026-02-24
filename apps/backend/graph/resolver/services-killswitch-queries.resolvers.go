package resolver

// This file handles kill switch query and subscription resolvers.

import (
	"backend/generated/ent"
	"backend/generated/ent/devicerouting"
	"backend/graph/model"
	"backend/internal/errors"
	"backend/internal/events"
	"context"
)

// KillSwitchStatus resolves the killSwitchStatus query.
func (r *queryResolver) KillSwitchStatus(ctx context.Context, routerID, deviceID string) (*model.KillSwitchStatus, error) {
	// Validate inputs
	if routerID == "" {
		return nil, errors.NewValidationError("routerID", "", "required")
	}
	if deviceID == "" {
		return nil, errors.NewValidationError("deviceID", "", "required")
	}

	// Query the device routing to get kill switch status
	dr, err := r.db.DeviceRouting.
		Query().
		Where(devicerouting.DeviceIDEQ(deviceID)).
		Only(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return nil, errors.NewResourceError(errors.CodeResourceNotFound, "device routing not found", "DeviceRouting", deviceID)
		}
		return nil, errors.Wrap(err, errors.CodeResourceNotFound, errors.CategoryResource, "failed to query device routing")
	}

	// Verify device routing is not nil
	if dr == nil {
		return nil, errors.NewResourceError(errors.CodeResourceNotFound, "device routing is nil after query", "DeviceRouting", deviceID)
	}

	// Verify it belongs to the correct router
	if dr.RouterID != routerID {
		return nil, errors.NewValidationError("routerID", routerID, "routing does not belong to router")
	}

	// Map kill switch mode from DB to GraphQL enum
	var killSwitchMode model.KillSwitchMode
	//nolint:exhaustive // string value switch, default handles all cases
	switch dr.KillSwitchMode {
	case "block_all":
		killSwitchMode = model.KillSwitchModeBlockAll
	case "fallback_service":
		killSwitchMode = model.KillSwitchModeFallbackService
	case "allow_direct":
		killSwitchMode = model.KillSwitchModeAllowDirect
	default:
		killSwitchMode = model.KillSwitchModeBlockAll
	}

	// TODO: Query activation history for activation count and last deactivation timestamp
	// For now, we'll return basic info from the routing record
	activationCount := 0
	if dr.KillSwitchActivatedAt != nil {
		activationCount = 1 // Simple approximation
	}

	// Safe conversion of fallback interface ID to pointer
	fallbackInterfaceID := ""
	if dr.KillSwitchFallbackInterfaceID != "" {
		fallbackInterfaceID = dr.KillSwitchFallbackInterfaceID
	}

	return &model.KillSwitchStatus{
		Enabled:              dr.KillSwitchEnabled,
		Mode:                 killSwitchMode,
		Active:               dr.KillSwitchActive,
		LastActivatedAt:      dr.KillSwitchActivatedAt,
		LastDeactivatedAt:    nil, // TODO: Track deactivation timestamps
		FallbackInterfaceID:  &fallbackInterfaceID,
		ActivationCount:      activationCount,
		LastActivationReason: nil, // TODO: Track activation reason
	}, nil
}

// subscribeToDeviceRoutingEvents is a helper function that sets up subscription to events
// and returns a channel that sends GraphQL events to the client.
func (r *subscriptionResolver) subscribeToDeviceRoutingEvents(
	ctx context.Context, routerID, eventType, errorMessage string,
) (<-chan *model.DeviceRoutingEvent, error) {
	// Validate input
	if routerID == "" {
		return nil, errors.NewValidationError("routerID", "", "required")
	}

	// Verify event bus is configured
	if r.EventBus == nil {
		return nil, errors.NewResourceError(errors.CodeDependencyNotReady, "event bus not configured", "EventBus", "")
	}

	// Create channel for events
	ch := make(chan *model.DeviceRoutingEvent, 10)

	// Subscribe to events via event bus
	err := r.EventBus.Subscribe(eventType, func(ctx context.Context, event events.Event) error {
		// Convert event to GraphQL model and send to channel
		graphqlEvent := &model.DeviceRoutingEvent{
			// Fields would be populated from event payload
		}
		select {
		case ch <- graphqlEvent:
		case <-ctx.Done():
			return ctx.Err()
		}
		return nil
	})
	if err != nil {
		close(ch)
		return nil, errors.Wrap(err, errors.CodeCommandFailed, errors.CategoryProtocol, errorMessage)
	}

	// Ensure channel is closed when context is canceled
	go func() {
		<-ctx.Done()
		close(ch)
	}()

	return ch, nil
}

// DeviceRoutingChanged resolves the deviceRoutingChanged subscription.
func (r *subscriptionResolver) DeviceRoutingChanged(ctx context.Context, routerID string) (<-chan *model.DeviceRoutingEvent, error) {
	return r.subscribeToDeviceRoutingEvents(ctx, routerID, "device.routing.changed", "failed to subscribe to routing events")
}

// KillSwitchChanged resolves the killSwitchChanged subscription.
func (r *subscriptionResolver) KillSwitchChanged(ctx context.Context, routerID string) (<-chan *model.DeviceRoutingEvent, error) {
	return r.subscribeToDeviceRoutingEvents(ctx, routerID, "device.killswitch.*", "failed to subscribe to kill switch events")
}
