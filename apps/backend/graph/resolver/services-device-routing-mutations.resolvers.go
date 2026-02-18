package resolver

// This file handles device routing mutation resolvers.

import (
	"backend/generated/ent/devicerouting"
	"backend/graph/model"
	"backend/internal/vif/routing"
	"context"
	"fmt"
)

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
		return nil, fmt.Errorf("device routing assignment failed: %w", result.Error)
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
func (r *mutationResolver) RemoveDeviceRouting(ctx context.Context, routerID, deviceID string) (bool, error) {
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
