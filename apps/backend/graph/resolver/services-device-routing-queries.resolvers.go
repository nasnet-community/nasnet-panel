package resolver

// This file handles device routing query resolvers.

import (
	"backend/generated/ent"
	"backend/generated/ent/devicerouting"
	"backend/graph/model"
	"backend/internal/vif/routing"
	"context"
	"fmt"
)

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
func (r *queryResolver) DeviceRouting(ctx context.Context, routerID, routingID string) (*model.DeviceRouting, error) {
	// Query specific device routing
	dr, err := r.db.DeviceRouting.Get(ctx, routingID)
	if err != nil {
		if ent.IsNotFound(err) {
			return nil, fmt.Errorf("device routing not found: %w", err)
		}
		return nil, fmt.Errorf("failed to query device routing: %w", err)
	}

	// Verify it belongs to the correct router
	if dr.RouterID != routerID {
		return nil, fmt.Errorf("routing does not belong to router")
	}

	return convertDeviceRouting(dr), nil
}
