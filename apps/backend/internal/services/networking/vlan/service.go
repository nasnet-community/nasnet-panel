// Package vlan provides business logic for VLAN management (NAS-6.7).
package vlan

import (
	"context"
	"fmt"

	"backend/graph/model"
	"backend/internal/services/base"

	"backend/internal/router"
)

// VlanService handles VLAN interface management operations.
type VlanService struct { //nolint:revive // used across packages
	base.Service
}

// NewVlanService creates a new VLAN service.
func NewVlanService(port router.RouterPort) *VlanService {
	return &VlanService{
		Service: base.NewService(port),
	}
}

// CreateVlanInput contains parameters for creating a VLAN.
type CreateVlanInput struct {
	Name        string
	VlanID      int
	InterfaceID string
	MTU         *int
	Comment     *string
	Disabled    bool
}

// UpdateVlanInput contains parameters for updating a VLAN.
type UpdateVlanInput struct {
	Name        *string
	VlanID      *int
	InterfaceID *string
	MTU         *int
	Comment     *string
	Disabled    *bool
}

// VlanPortConfigInput contains parameters for configuring a VLAN port.
type VlanPortConfigInput struct { //nolint:revive // used across packages
	PortID      string
	Mode        string // "access" or "trunk"
	PVID        *int
	TaggedVlans []int
}

// VlanPortConfigResult represents the result of port configuration.
type VlanPortConfigResult struct { //nolint:revive // used across packages
	Success bool
	Message string
}

// ===========================================================================
// Query Operations
// ===========================================================================

// ListVlans fetches all VLAN interfaces from the router with optional filtering.
// Maps to: /interface/vlan/print
func (s *VlanService) ListVlans(ctx context.Context, routerID string, filter *model.VlanFilter) ([]*model.Vlan, error) {
	cmd := router.Command{
		Path:   "/interface/vlan",
		Action: "print",
		Args:   make(map[string]string),
	}

	// Apply filters if provided
	if filter != nil { //nolint:nestif // VLAN filter/update logic
		if filter.ParentInterface.IsSet() && filter.ParentInterface.Value() != nil && *filter.ParentInterface.Value() != "" {
			cmd.Args["interface"] = *filter.ParentInterface.Value()
		}
		if filter.VlanIDRange.IsSet() && filter.VlanIDRange.Value() != nil {
			// Filter by VLAN ID range (note: RouterOS may need custom filtering)
			vlanRange := filter.VlanIDRange.Value()
			if vlanRange.Min.IsSet() && vlanRange.Min.Value() != nil {
				// For now, just filter by min value
				// Full range filtering would require client-side filtering after query
				cmd.Args["vlan-id"] = fmt.Sprintf("%d", *vlanRange.Min.Value())
			}
		}
		// Name contains filter (RouterOS doesn't support LIKE, will need client-side filtering)
		// For now, we'll fetch all and filter later in a more complete implementation
		if filter.NameContains.IsSet() && filter.NameContains.Value() != nil && *filter.NameContains.Value() != "" {
			_ = filter.NameContains
		}
	}

	result, err := s.Port().ExecuteCommand(ctx, cmd)
	if err != nil {
		return nil, fmt.Errorf("failed to list vlans: %w", err)
	}

	if !result.Success {
		return nil, fmt.Errorf("command failed: %w", result.Error)
	}

	// Convert RouterOS response to GraphQL model
	vlans := make([]*model.Vlan, 0, len(result.Data))
	for _, data := range result.Data {
		vlan := s.mapVlanData(data)
		vlans = append(vlans, vlan)
	}

	return vlans, nil
}

// GetVlan fetches a single VLAN interface by ID.
func (s *VlanService) GetVlan(ctx context.Context, routerID, id string) (*model.Vlan, error) {
	cmd := router.Command{
		Path:   "/interface/vlan",
		Action: "print",
		Args: map[string]string{
			".id": id,
		},
	}

	result, err := s.Port().ExecuteCommand(ctx, cmd)
	if err != nil {
		return nil, fmt.Errorf("failed to get vlan: %w", err)
	}

	if !result.Success || len(result.Data) == 0 {
		return nil, fmt.Errorf("vlan not found")
	}

	return s.mapVlanData(result.Data[0]), nil
}

// ===========================================================================
// Mutation Operations
// ===========================================================================

// CreateVlan creates a new VLAN interface.
// Maps to: /interface/vlan/add
func (s *VlanService) CreateVlan(ctx context.Context, routerID string, input CreateVlanInput) (*model.Vlan, error) {
	// Validate VLAN ID range
	if input.VlanID < 1 || input.VlanID > 4094 {
		return nil, fmt.Errorf("vlan id must be between 1 and 4094")
	}

	// Check if VLAN ID is available
	available, err := s.CheckVlanIDAvailable(ctx, routerID, input.VlanID, input.InterfaceID, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to check vlan id availability: %w", err)
	}
	if !available {
		return nil, fmt.Errorf("vlan id %d is already in use on interface %s", input.VlanID, input.InterfaceID)
	}

	args := base.NewCommandArgsBuilder().
		AddString("name", input.Name).
		AddInt("vlan-id", input.VlanID).
		AddString("interface", input.InterfaceID).
		AddOptionalInt("mtu", input.MTU).
		AddOptionalString("comment", input.Comment).
		AddBool("disabled", input.Disabled).
		Build()

	cmd := router.Command{
		Path:   "/interface/vlan",
		Action: "add",
		Args:   args,
	}

	result, err := s.Port().ExecuteCommand(ctx, cmd)
	if err != nil {
		return nil, fmt.Errorf("failed to create vlan: %w", err)
	}

	if !result.Success {
		return nil, fmt.Errorf("command failed: %w", result.Error)
	}

	// Fetch the created VLAN to return complete data
	return s.GetVlan(ctx, routerID, result.ID)
}

// UpdateVlan updates an existing VLAN interface.
// Maps to: /interface/vlan/set
func (s *VlanService) UpdateVlan(ctx context.Context, routerID, id string, input UpdateVlanInput) (*model.Vlan, error) {
	builder := base.NewCommandArgsBuilder().AddID(id)

	// Update fields that are provided
	if input.Name != nil {
		builder.AddString("name", *input.Name)
	}

	if input.VlanID != nil { //nolint:nestif // VLAN filter/update logic
		// Validate VLAN ID range
		if *input.VlanID < 1 || *input.VlanID > 4094 {
			return nil, fmt.Errorf("vlan id must be between 1 and 4094")
		}

		// If VLAN ID is being changed, check availability
		currentVlan, err := s.GetVlan(ctx, routerID, id)
		if err != nil {
			return nil, fmt.Errorf("failed to get current vlan: %w", err)
		}

		if currentVlan.VlanID != *input.VlanID {
			available, err := s.CheckVlanIDAvailable(ctx, routerID, *input.VlanID, currentVlan.Interface.ID, &id)
			if err != nil {
				return nil, fmt.Errorf("failed to check vlan id availability: %w", err)
			}
			if !available {
				return nil, fmt.Errorf("vlan id %d is already in use on interface %s", *input.VlanID, currentVlan.Interface.ID)
			}
		}

		builder.AddInt("vlan-id", *input.VlanID)
	}

	if input.InterfaceID != nil {
		builder.AddString("interface", *input.InterfaceID)
	}

	builder.AddOptionalInt("mtu", input.MTU)
	builder.AddOptionalString("comment", input.Comment)
	builder.AddOptionalBool("disabled", input.Disabled)

	args := builder.Build()

	cmd := router.Command{
		Path:   "/interface/vlan",
		Action: "set",
		Args:   args,
	}

	result, err := s.Port().ExecuteCommand(ctx, cmd)
	if err != nil {
		return nil, fmt.Errorf("failed to update vlan: %w", err)
	}

	if !result.Success {
		return nil, fmt.Errorf("command failed: %w", result.Error)
	}

	// Fetch the updated VLAN
	return s.GetVlan(ctx, routerID, id)
}

// DeleteVlan deletes a VLAN interface.
// Maps to: /interface/vlan/remove
func (s *VlanService) DeleteVlan(ctx context.Context, routerID, id string) error {
	cmd := router.Command{
		Path:   "/interface/vlan",
		Action: "remove",
		Args: map[string]string{
			".id": id,
		},
	}

	result, err := s.Port().ExecuteCommand(ctx, cmd)
	if err != nil {
		return fmt.Errorf("failed to delete vlan: %w", err)
	}

	if !result.Success {
		return fmt.Errorf("command failed: %w", result.Error)
	}

	return nil
}
