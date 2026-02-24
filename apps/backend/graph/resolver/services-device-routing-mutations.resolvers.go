package resolver

// This file handles device routing mutation resolvers.

import (
	"backend/generated/ent/devicerouting"
	"backend/graph/model"
	"backend/internal/errors"
	"context"
)

// AssignDeviceRouting resolves the assignDeviceRouting mutation.
func (r *mutationResolver) AssignDeviceRouting(ctx context.Context, input model.AssignDeviceRoutingInput) (*model.DeviceRouting, error) {
	// Validate inputs
	if input.RouterID == "" {
		return nil, errors.NewValidationError("routerID", "", "required")
	}
	if input.DeviceID == "" {
		return nil, errors.NewValidationError("deviceID", "", "required")
	}
	if input.MacAddress == "" {
		return nil, errors.NewValidationError("macAddress", "", "required")
	}
	if input.RoutingMark == "" {
		return nil, errors.NewValidationError("routingMark", "", "required")
	}

	// Verify PBR engine is configured
	if r.Resolver.PBREngine == nil {
		return nil, errors.NewResourceError(errors.CodeDependencyNotReady, "PBR engine not configured", "PBREngine", "")
	}

	// Assign device routing
	result, err := r.Resolver.PBREngine.AssignDeviceRouting(
		ctx,
		input.DeviceID,
		input.MacAddress,
		input.RoutingMark,
		input.InstanceID,
	)
	if err != nil {
		return nil, errors.Wrap(err, errors.CodeCommandFailed, errors.CategoryProtocol, "failed to assign device routing")
	}

	if !result.Success {
		errMsg := "device routing assignment failed"
		if result.Error != nil {
			return nil, errors.Wrap(result.Error, errors.CodeCommandFailed, errors.CategoryProtocol, errMsg)
		}
		return nil, errors.NewRouterError(errors.CodeCommandFailed, errors.CategoryProtocol, errMsg)
	}

	// Query the created routing from DB
	dr, err := r.db.DeviceRouting.
		Query().
		Where(devicerouting.DeviceIDEQ(input.DeviceID)).
		Only(ctx)
	if err != nil {
		return nil, errors.Wrap(err, errors.CodeResourceNotFound, errors.CategoryResource, "failed to query created routing")
	}

	// Verify device routing is not nil
	if dr == nil {
		return nil, errors.NewResourceError(errors.CodeResourceNotFound, "created device routing is nil", "DeviceRouting", input.DeviceID)
	}

	return convertDeviceRouting(dr), nil
}

// RemoveDeviceRouting resolves the removeDeviceRouting mutation.
func (r *mutationResolver) RemoveDeviceRouting(ctx context.Context, routerID, deviceID string) (bool, error) {
	// Validate inputs
	if routerID == "" {
		return false, errors.NewValidationError("routerID", "", "required")
	}
	if deviceID == "" {
		return false, errors.NewValidationError("deviceID", "", "required")
	}

	// Verify PBR engine is configured
	if r.Resolver.PBREngine == nil {
		return false, errors.NewResourceError(errors.CodeDependencyNotReady, "PBR engine not configured", "PBREngine", "")
	}

	// Remove device routing
	if err := r.Resolver.PBREngine.RemoveDeviceRouting(ctx, deviceID); err != nil {
		return false, errors.Wrap(err, errors.CodeCommandFailed, errors.CategoryProtocol, "failed to remove device routing")
	}

	return true, nil
}

// BulkAssignRouting resolves the bulkAssignRouting mutation.
func (r *mutationResolver) BulkAssignRouting(ctx context.Context, input model.BulkAssignRoutingInput) (*model.BulkRoutingResult, error) {
	// Validate inputs
	if input.RouterID == "" {
		return nil, errors.NewValidationError("routerID", "", "required")
	}
	if len(input.Assignments) == 0 {
		return nil, errors.NewValidationError("assignments", 0, "at least one assignment is required")
	}

	// Verify PBR engine is configured
	if r.Resolver.PBREngine == nil {
		return nil, errors.NewResourceError(errors.CodeDependencyNotReady, "PBR engine not configured", "PBREngine", "")
	}

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
	results := r.Resolver.PBREngine.BulkAssignRouting(ctx, assignments)

	// Convert results to GraphQL model
	return convertBulkRoutingResult(results), nil
}
