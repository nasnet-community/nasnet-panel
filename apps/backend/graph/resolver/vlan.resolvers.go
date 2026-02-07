package resolver

// This file implements resolvers for VLAN management (NAS-6.7)
// Generated manually following NasNetConnect resolver patterns

import (
	"context"
	"fmt"

	"backend/graph/model"
	"backend/internal/services"
)

// ===========================================================================
// Query Resolvers
// ===========================================================================

// Vlans is the resolver for the vlans field.
func (r *queryResolver) Vlans(ctx context.Context, routerID string, filter *model.VlanFilter) ([]*model.Vlan, error) {
	if r.VlanService == nil {
		return nil, fmt.Errorf("vlan service not available")
	}

	vlans, err := r.VlanService.ListVlans(ctx, routerID, filter)
	if err != nil {
		return nil, fmt.Errorf("failed to list vlans: %w", err)
	}

	return vlans, nil
}

// Vlan is the resolver for the vlan field.
func (r *queryResolver) Vlan(ctx context.Context, routerID string, id string) (*model.Vlan, error) {
	if r.VlanService == nil {
		return nil, fmt.Errorf("vlan service not available")
	}

	vlan, err := r.VlanService.GetVlan(ctx, routerID, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get vlan: %w", err)
	}

	return vlan, nil
}

// CheckVlanIDAvailable is the resolver for the checkVlanIdAvailable field.
func (r *queryResolver) CheckVlanIDAvailable(ctx context.Context, routerID string, vlanID int, parentInterfaceID string, excludeID *string) (bool, error) {
	if r.VlanService == nil {
		return false, fmt.Errorf("vlan service not available")
	}

	available, err := r.VlanService.CheckVlanIDAvailable(ctx, routerID, vlanID, parentInterfaceID, excludeID)
	if err != nil {
		return false, fmt.Errorf("failed to check vlan id availability: %w", err)
	}

	return available, nil
}

// ===========================================================================
// Mutation Resolvers
// ===========================================================================

// CreateVlan is the resolver for the createVlan field.
func (r *mutationResolver) CreateVlan(ctx context.Context, routerID string, input model.VlanInput) (*model.VlanPayload, error) {
	if r.VlanService == nil {
		return &model.VlanPayload{
			Errors: []*model.MutationError{{
				Code:    "SERVICE_UNAVAILABLE",
				Message: "VLAN service is not available",
			}},
		}, nil
	}

	// Convert GraphQL input to service input
	var mtu *int
	if input.Mtu.IsSet() {
		mtu = input.Mtu.Value()
	}

	var comment *string
	if input.Comment.IsSet() {
		comment = input.Comment.Value()
	}

	serviceInput := services.CreateVlanInput{
		Name:        input.Name,
		VlanID:      input.VlanID,
		InterfaceID: input.Interface,
		MTU:         mtu,
		Comment:     comment,
		Disabled:    false, // Default to enabled
	}

	// Create VLAN
	vlan, err := r.VlanService.CreateVlan(ctx, routerID, serviceInput)
	if err != nil {
		return &model.VlanPayload{
			Errors: []*model.MutationError{{
				Code:    "CREATE_FAILED",
				Message: err.Error(),
			}},
		}, nil
	}

	return &model.VlanPayload{
		Vlan: vlan,
	}, nil
}

// UpdateVlan is the resolver for the updateVlan field.
func (r *mutationResolver) UpdateVlan(ctx context.Context, routerID string, id string, input model.VlanInput) (*model.VlanPayload, error) {
	if r.VlanService == nil {
		return &model.VlanPayload{
			Errors: []*model.MutationError{{
				Code:    "SERVICE_UNAVAILABLE",
				Message: "VLAN service is not available",
			}},
		}, nil
	}

	// Convert GraphQL input to service input
	serviceInput := services.UpdateVlanInput{
		Name:        &input.Name,
		VlanID:      &input.VlanID,
		InterfaceID: &input.Interface,
		MTU:         input.Mtu,
		Comment:     input.Comment,
		Disabled:    input.Disabled,
	}

	// Update VLAN
	vlan, err := r.VlanService.UpdateVlan(ctx, routerID, id, serviceInput)
	if err != nil {
		return &model.VlanPayload{
			Errors: []*model.MutationError{{
				Code:    "UPDATE_FAILED",
				Message: err.Error(),
			}},
		}, nil
	}

	return &model.VlanPayload{
		Vlan: vlan,
	}, nil
}

// DeleteVlan is the resolver for the deleteVlan field.
func (r *mutationResolver) DeleteVlan(ctx context.Context, routerID string, id string) (*model.DeletePayload, error) {
	if r.VlanService == nil {
		return &model.DeletePayload{
			Errors: []*model.MutationError{{
				Code:    "SERVICE_UNAVAILABLE",
				Message: "VLAN service is not available",
			}},
		}, nil
	}

	// Delete VLAN
	err := r.VlanService.DeleteVlan(ctx, routerID, id)
	if err != nil {
		return &model.DeletePayload{
			Errors: []*model.MutationError{{
				Code:    "DELETE_FAILED",
				Message: err.Error(),
			}},
		}, nil
	}

	return &model.DeletePayload{
		Success:   true,
		DeletedID: &id,
	}, nil
}

// ConfigureVlanPort is the resolver for the configureVlanPort field.
func (r *mutationResolver) ConfigureVlanPort(ctx context.Context, routerID string, portID string, config model.VlanPortConfig) (*model.VlanPortConfigPayload, error) {
	if r.VlanService == nil {
		return &model.VlanPortConfigPayload{
			Errors: []*model.MutationError{{
				Code:    "SERVICE_UNAVAILABLE",
				Message: "VLAN service is not available",
			}},
		}, nil
	}

	// Convert GraphQL input to service input
	serviceInput := services.VlanPortConfigInput{
		PortID:      portID,
		Mode:        string(config.Mode),
		PVID:        config.Pvid,
		TaggedVlans: config.TaggedVlanIds,
	}

	// Configure port
	result, err := r.VlanService.ConfigureVlanPort(ctx, routerID, serviceInput)
	if err != nil {
		return &model.VlanPortConfigPayload{
			Errors: []*model.MutationError{{
				Code:    "CONFIG_FAILED",
				Message: err.Error(),
			}},
		}, nil
	}

	return &model.VlanPortConfigPayload{
		Success: result.Success,
		Message: &result.Message,
	}, nil
}

// ===========================================================================
// Subscription Resolvers
// ===========================================================================

// VlanChanged is the resolver for the vlanChanged field.
func (r *subscriptionResolver) VlanChanged(ctx context.Context, routerID string) (<-chan *model.VlanEvent, error) {
	// Create channel for GraphQL subscription
	eventChannel := make(chan *model.VlanEvent, 10)

	// Subscribe to VLAN events from event bus
	if r.EventBus == nil {
		close(eventChannel)
		return eventChannel, fmt.Errorf("event bus is not available")
	}

	// TODO: Subscribe to actual VLAN change events
	// For now, just return the channel (will be implemented with event bus)

	// Handle cleanup when context is cancelled
	go func() {
		<-ctx.Done()
		close(eventChannel)
	}()

	return eventChannel, nil
}
