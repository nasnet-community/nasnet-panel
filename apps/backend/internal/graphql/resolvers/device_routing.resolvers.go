// Code for device routing GraphQL resolvers (NAS-8.3)
package resolver

import (
	"context"
	"fmt"

	"backend/generated/ent"
	"backend/generated/ent/devicerouting"
	"backend/generated/graphql"
	
	"backend/internal/events"
	"backend/internal/router"
	"backend/internal/vif/isolation"
	"backend/internal/vif/routing"
)

// ==============================================================================
// Query Resolvers
// ==============================================================================

// DeviceRoutingMatrix resolves the deviceRoutingMatrix query.
func (r *queryResolver) DeviceRoutingMatrix(ctx context.Context, routerID string) (*model.DeviceRoutingMatrix, error) {
	// Get router port for this router
	routerPort, err := r.getRouterPortTyped(ctx, routerID)
	if err != nil {
		return nil, fmt.Errorf("failed to get router port: %w", err)
	}

	// Create routing matrix service
	matrixService := routing.NewRoutingMatrixService(routerPort, r.db)

	// Query the full device routing matrix
	matrix, err := matrixService.GetDeviceRoutingMatrix(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get device routing matrix: %w", err)
	}

	// Convert to GraphQL model
	return convertDeviceRoutingMatrix(matrix), nil
}

// DeviceRoutings resolves the deviceRoutings query.
func (r *queryResolver) DeviceRoutings(ctx context.Context, routerID string) ([]*model.DeviceRouting, error) {
	// Query all device routings for this router
	routings, err := r.db.DeviceRouting.
		Query().
		Where(devicerouting.RouterIDEQ(routerID)).
		All(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to query device routings: %w", err)
	}

	// Convert to GraphQL model
	result := make([]*model.DeviceRouting, len(routings))
	for i, dr := range routings {
		result[i] = convertDeviceRouting(dr)
	}

	return result, nil
}

// DeviceRouting resolves the deviceRouting query.
func (r *queryResolver) DeviceRouting(ctx context.Context, routerID string, routingID string) (*model.DeviceRouting, error) {
	// Query specific device routing
	dr, err := r.db.DeviceRouting.Get(ctx, routingID)
	if err != nil {
		if ent.IsNotFound(err) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to query device routing: %w", err)
	}

	// Verify it belongs to the correct router
	if dr.RouterID != routerID {
		return nil, fmt.Errorf("routing does not belong to router")
	}

	return convertDeviceRouting(dr), nil
}

// ==============================================================================
// Mutation Resolvers
// ==============================================================================

// AssignDeviceRouting resolves the assignDeviceRouting mutation.
func (r *mutationResolver) AssignDeviceRouting(ctx context.Context, input model.AssignDeviceRoutingInput) (*model.DeviceRouting, error) {
	// Get router port for this router
	routerPort, err := r.getRouterPortTyped(ctx, input.RouterID)
	if err != nil {
		return nil, fmt.Errorf("failed to get router port: %w", err)
	}

	// Create PBR engine
	pbrEngine := routing.NewPBREngine(routerPort, r.db, r.EventBus, r.EventPublisher)

	// Assign device routing
	result, err := pbrEngine.AssignDeviceRouting(
		ctx,
		input.DeviceID,
		input.MacAddress,
		input.RoutingMark,
		input.InstanceID,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to assign device routing: %w", err)
	}

	if !result.Success {
		return nil, fmt.Errorf("device routing assignment failed: %v", result.Error)
	}

	// Query the created routing from DB
	dr, err := r.db.DeviceRouting.
		Query().
		Where(devicerouting.DeviceIDEQ(input.DeviceID)).
		Only(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to query created routing: %w", err)
	}

	return convertDeviceRouting(dr), nil
}

// RemoveDeviceRouting resolves the removeDeviceRouting mutation.
func (r *mutationResolver) RemoveDeviceRouting(ctx context.Context, routerID string, deviceID string) (bool, error) {
	// Get router port for this router
	routerPort, err := r.getRouterPortTyped(ctx, routerID)
	if err != nil {
		return false, fmt.Errorf("failed to get router port: %w", err)
	}

	// Create PBR engine
	pbrEngine := routing.NewPBREngine(routerPort, r.db, r.EventBus, r.EventPublisher)

	// Remove device routing
	if err := pbrEngine.RemoveDeviceRouting(ctx, deviceID); err != nil {
		return false, fmt.Errorf("failed to remove device routing: %w", err)
	}

	return true, nil
}

// BulkAssignRouting resolves the bulkAssignRouting mutation.
func (r *mutationResolver) BulkAssignRouting(ctx context.Context, input model.BulkAssignRoutingInput) (*model.BulkRoutingResult, error) {
	// Get router port for this router
	routerPort, err := r.getRouterPortTyped(ctx, input.RouterID)
	if err != nil {
		return nil, fmt.Errorf("failed to get router port: %w", err)
	}

	// Create PBR engine
	pbrEngine := routing.NewPBREngine(routerPort, r.db, r.EventBus, r.EventPublisher)

	// Convert input to engine format
	assignments := make([]struct {
		DeviceID    string
		MacAddress  string
		RoutingMark string
		InstanceID  string
	}, len(input.Assignments))

	for i, a := range input.Assignments {
		assignments[i].DeviceID = a.DeviceID
		assignments[i].MacAddress = a.MacAddress
		assignments[i].RoutingMark = a.RoutingMark
		assignments[i].InstanceID = a.InstanceID
	}

	// Execute bulk assignment
	results := pbrEngine.BulkAssignRouting(ctx, assignments)

	// Convert results to GraphQL model
	return convertBulkRoutingResult(results), nil
}

// SetKillSwitch resolves the setKillSwitch mutation.
func (r *mutationResolver) SetKillSwitch(ctx context.Context, input model.SetKillSwitchInput) (*model.DeviceRouting, error) {
	// Get router port for this router
	routerPort, err := r.getRouterPortTyped(ctx, input.RouterID)
	if err != nil {
		return nil, fmt.Errorf("failed to get router port: %w", err)
	}

	// Query the existing device routing
	dr, err := r.db.DeviceRouting.
		Query().
		Where(devicerouting.DeviceIDEQ(input.DeviceID)).
		Only(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return nil, fmt.Errorf("device routing not found for device %s", input.DeviceID)
		}
		return nil, fmt.Errorf("failed to query device routing: %w", err)
	}

	// Create KillSwitchManager
	killSwitchManager := isolation.NewKillSwitchManager(routerPort, r.db, r.EventBus, r.EventPublisher)

	if input.Enabled {
		// Map kill switch mode from GraphQL to isolation mode
		killSwitchMode := isolation.KillSwitchModeBlockAll
		switch input.Mode {
		case model.KillSwitchModeBlockAll:
			killSwitchMode = isolation.KillSwitchModeBlockAll
		case model.KillSwitchModeFallbackService:
			killSwitchMode = isolation.KillSwitchModeFallbackService
		case model.KillSwitchModeAllowDirect:
			killSwitchMode = isolation.KillSwitchModeAllowDirect
		}

		fallbackInterfaceID := ""
		if input.FallbackInterfaceID.IsSet() && input.FallbackInterfaceID.Value() != nil {
			fallbackInterfaceID = *input.FallbackInterfaceID.Value()
		}

		if err := killSwitchManager.Enable(ctx, dr.ID, killSwitchMode, fallbackInterfaceID); err != nil {
			return nil, fmt.Errorf("failed to enable kill switch: %w", err)
		}
	} else {
		if err := killSwitchManager.Disable(ctx, dr.ID); err != nil {
			return nil, fmt.Errorf("failed to disable kill switch: %w", err)
		}
	}

	// Query the updated routing from DB
	updatedRouting, err := r.db.DeviceRouting.Get(ctx, dr.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to query updated routing: %w", err)
	}

	return convertDeviceRouting(updatedRouting), nil
}

// KillSwitchStatus resolves the killSwitchStatus query.
func (r *queryResolver) KillSwitchStatus(ctx context.Context, routerID string, deviceID string) (*model.KillSwitchStatus, error) {
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
	killSwitchMode := model.KillSwitchModeBlockAll
	switch dr.KillSwitchMode {
	case "block_all":
		killSwitchMode = model.KillSwitchModeBlockAll
	case "fallback_service":
		killSwitchMode = model.KillSwitchModeFallbackService
	case "allow_direct":
		killSwitchMode = model.KillSwitchModeAllowDirect
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

// ==============================================================================
// Subscription Resolvers
// ==============================================================================

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

// getRouterPortTyped retrieves a typed router.RouterPort for a given router ID.
func (r *queryResolver) getRouterPortTyped(ctx context.Context, routerID string) (router.RouterPort, error) {
	// TODO: Implement router port retrieval via RouterService
	return nil, fmt.Errorf("getRouterPortTyped not implemented")
}

// getRouterPortTyped retrieves a typed router.RouterPort for mutation resolvers.
func (r *mutationResolver) getRouterPortTyped(ctx context.Context, routerID string) (router.RouterPort, error) {
	// TODO: Implement router port retrieval via RouterService
	return nil, fmt.Errorf("getRouterPortTyped not implemented")
}
