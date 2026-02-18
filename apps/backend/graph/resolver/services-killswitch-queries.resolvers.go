package resolver

// This file handles kill switch query and subscription resolvers.

import (
	"backend/generated/ent"
	"backend/generated/ent/devicerouting"
	"backend/graph/model"
	"context"
	"fmt"

	"backend/internal/events"
)

// KillSwitchStatus resolves the killSwitchStatus query.
func (r *queryResolver) KillSwitchStatus(ctx context.Context, routerID, deviceID string) (*model.KillSwitchStatus, error) {
	// Query the device routing to get kill switch status
	dr, err := r.db.DeviceRouting.
		Query().
		Where(devicerouting.DeviceIDEQ(deviceID)).
		Only(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return nil, fmt.Errorf("device routing not found for device %s", deviceID)
		}
		return nil, fmt.Errorf("failed to query device routing: %w", err)
	}

	// Verify it belongs to the correct router
	if dr.RouterID != routerID {
		return nil, fmt.Errorf("routing does not belong to router")
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

	return &model.KillSwitchStatus{
		Enabled:              dr.KillSwitchEnabled,
		Mode:                 killSwitchMode,
		Active:               dr.KillSwitchActive,
		LastActivatedAt:      dr.KillSwitchActivatedAt,
		LastDeactivatedAt:    nil, // TODO: Track deactivation timestamps
		FallbackInterfaceID:  &dr.KillSwitchFallbackInterfaceID,
		ActivationCount:      activationCount,
		LastActivationReason: nil, // TODO: Track activation reason
	}, nil
}

// DeviceRoutingChanged resolves the deviceRoutingChanged subscription.
func (r *subscriptionResolver) DeviceRoutingChanged(ctx context.Context, routerID string) (<-chan *model.DeviceRoutingEvent, error) {
	// Create channel for events
	ch := make(chan *model.DeviceRoutingEvent, 10)

	// Subscribe to device routing events via event bus
	eventType := "device.routing.changed"
	err := r.EventBus.Subscribe(eventType, func(ctx context.Context, event events.Event) error {
		// Convert event to GraphQL model
		// TODO: Implement event conversion
		// For now, return nil
		return nil
	})
	if err != nil {
		return nil, fmt.Errorf("failed to subscribe to routing events: %w", err)
	}

	return ch, nil
}

// KillSwitchChanged resolves the killSwitchChanged subscription.
func (r *subscriptionResolver) KillSwitchChanged(ctx context.Context, routerID string) (<-chan *model.DeviceRoutingEvent, error) {
	// Create channel for events
	ch := make(chan *model.DeviceRoutingEvent, 10)

	// Subscribe to kill switch events via event bus
	eventType := "device.killswitch.*"
	err := r.EventBus.Subscribe(eventType, func(ctx context.Context, event events.Event) error {
		// Convert kill switch event to DeviceRoutingEvent
		// TODO: Implement event conversion based on event type
		// Events: device.killswitch.activated, device.killswitch.deactivated, device.killswitch.configured
		return nil
	})
	if err != nil {
		return nil, fmt.Errorf("failed to subscribe to kill switch events: %w", err)
	}

	return ch, nil
}
