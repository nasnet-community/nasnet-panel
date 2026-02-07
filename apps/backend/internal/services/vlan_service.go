// Package services provides business logic for VLAN management (NAS-6.7).
package services

import (
	"context"
	"fmt"

	"backend/graph/model"
	"backend/internal/router"
)

// VlanService handles VLAN interface management operations.
type VlanService struct {
	port router.RouterPort
}

// NewVlanService creates a new VLAN service.
func NewVlanService(port router.RouterPort) *VlanService {
	return &VlanService{
		port: port,
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
type VlanPortConfigInput struct {
	PortID      string
	Mode        string // "access" or "trunk"
	PVID        *int
	TaggedVlans []int
}

// VlanPortConfigResult represents the result of port configuration.
type VlanPortConfigResult struct {
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
	if filter != nil {
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
		if filter.NameContains.IsSet() && filter.NameContains.Value() != nil && *filter.NameContains.Value() != "" {
			// Name contains filter (RouterOS doesn't support LIKE, will need client-side filtering)
			// For now, we'll fetch all and filter later in a more complete implementation
		}
	}

	result, err := s.port.ExecuteCommand(ctx, cmd)
	if err != nil {
		return nil, fmt.Errorf("failed to list vlans: %w", err)
	}

	if !result.Success {
		return nil, fmt.Errorf("command failed: %v", result.Error)
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
func (s *VlanService) GetVlan(ctx context.Context, routerID string, id string) (*model.Vlan, error) {
	cmd := router.Command{
		Path:   "/interface/vlan",
		Action: "print",
		Args: map[string]string{
			".id": id,
		},
	}

	result, err := s.port.ExecuteCommand(ctx, cmd)
	if err != nil {
		return nil, fmt.Errorf("failed to get vlan: %w", err)
	}

	if !result.Success || len(result.Data) == 0 {
		return nil, fmt.Errorf("vlan not found")
	}

	return s.mapVlanData(result.Data[0]), nil
}

// CheckVlanIDAvailable checks if a VLAN ID is available on a specific parent interface.
// Returns true if the VLAN ID is not already in use, false otherwise.
func (s *VlanService) CheckVlanIDAvailable(ctx context.Context, routerID string, vlanID int, parentInterfaceID string, excludeID *string) (bool, error) {
	cmd := router.Command{
		Path:   "/interface/vlan",
		Action: "print",
		Args: map[string]string{
			"vlan-id":   fmt.Sprintf("%d", vlanID),
			"interface": parentInterfaceID,
		},
	}

	result, err := s.port.ExecuteCommand(ctx, cmd)
	if err != nil {
		return false, fmt.Errorf("failed to check vlan id availability: %w", err)
	}

	if !result.Success {
		return false, fmt.Errorf("command failed: %v", result.Error)
	}

	// If no VLANs found, the ID is available
	if len(result.Data) == 0 {
		return true, nil
	}

	// If excludeID is provided, check if the only match is the excluded VLAN
	if excludeID != nil && len(result.Data) == 1 {
		if result.Data[0][".id"] == *excludeID {
			return true, nil
		}
	}

	// VLAN ID is already in use
	return false, nil
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

	args := map[string]string{
		"name":     input.Name,
		"vlan-id":  fmt.Sprintf("%d", input.VlanID),
		"interface": input.InterfaceID,
	}

	if input.MTU != nil {
		args["mtu"] = fmt.Sprintf("%d", *input.MTU)
	}

	if input.Comment != nil && *input.Comment != "" {
		args["comment"] = *input.Comment
	}

	if input.Disabled {
		args["disabled"] = "yes"
	} else {
		args["disabled"] = "no"
	}

	cmd := router.Command{
		Path:   "/interface/vlan",
		Action: "add",
		Args:   args,
	}

	result, err := s.port.ExecuteCommand(ctx, cmd)
	if err != nil {
		return nil, fmt.Errorf("failed to create vlan: %w", err)
	}

	if !result.Success {
		return nil, fmt.Errorf("command failed: %v", result.Error)
	}

	// Fetch the created VLAN to return complete data
	return s.GetVlan(ctx, routerID, result.ID)
}

// UpdateVlan updates an existing VLAN interface.
// Maps to: /interface/vlan/set
func (s *VlanService) UpdateVlan(ctx context.Context, routerID string, id string, input UpdateVlanInput) (*model.Vlan, error) {
	args := map[string]string{
		".id": id,
	}

	// Update fields that are provided
	if input.Name != nil {
		args["name"] = *input.Name
	}

	if input.VlanID != nil {
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

		args["vlan-id"] = fmt.Sprintf("%d", *input.VlanID)
	}

	if input.InterfaceID != nil {
		args["interface"] = *input.InterfaceID
	}

	if input.MTU != nil {
		args["mtu"] = fmt.Sprintf("%d", *input.MTU)
	}

	if input.Comment != nil {
		args["comment"] = *input.Comment
	}

	if input.Disabled != nil {
		if *input.Disabled {
			args["disabled"] = "yes"
		} else {
			args["disabled"] = "no"
		}
	}

	cmd := router.Command{
		Path:   "/interface/vlan",
		Action: "set",
		Args:   args,
	}

	result, err := s.port.ExecuteCommand(ctx, cmd)
	if err != nil {
		return nil, fmt.Errorf("failed to update vlan: %w", err)
	}

	if !result.Success {
		return nil, fmt.Errorf("command failed: %v", result.Error)
	}

	// Fetch the updated VLAN
	return s.GetVlan(ctx, routerID, id)
}

// DeleteVlan deletes a VLAN interface.
// Maps to: /interface/vlan/remove
func (s *VlanService) DeleteVlan(ctx context.Context, routerID string, id string) error {
	cmd := router.Command{
		Path:   "/interface/vlan",
		Action: "remove",
		Args: map[string]string{
			".id": id,
		},
	}

	result, err := s.port.ExecuteCommand(ctx, cmd)
	if err != nil {
		return fmt.Errorf("failed to delete vlan: %w", err)
	}

	if !result.Success {
		return fmt.Errorf("command failed: %v", result.Error)
	}

	return nil
}

// ConfigureVlanPort configures a bridge port for VLAN access or trunk mode.
// For access mode: sets PVID and admits only untagged frames.
// For trunk mode: sets PVID and allows tagged frames for specified VLANs.
// Maps to: /interface/bridge/port/set
func (s *VlanService) ConfigureVlanPort(ctx context.Context, routerID string, input VlanPortConfigInput) (*VlanPortConfigResult, error) {
	args := map[string]string{
		".id": input.PortID,
	}

	// Set PVID if provided
	if input.PVID != nil {
		args["pvid"] = fmt.Sprintf("%d", *input.PVID)
	}

	// Configure based on mode
	switch input.Mode {
	case "access":
		// Access mode: admit only untagged frames
		args["frame-types"] = "admit-only-untagged-and-priority-tagged"
		// No tagged VLANs in access mode

	case "trunk":
		// Trunk mode: admit all frames
		args["frame-types"] = "admit-all"
		// Tagged VLANs will be configured separately in bridge vlan table

	default:
		return nil, fmt.Errorf("invalid vlan port mode: %s (must be 'access' or 'trunk')", input.Mode)
	}

	cmd := router.Command{
		Path:   "/interface/bridge/port",
		Action: "set",
		Args:   args,
	}

	result, err := s.port.ExecuteCommand(ctx, cmd)
	if err != nil {
		return nil, fmt.Errorf("failed to configure vlan port: %w", err)
	}

	if !result.Success {
		return nil, fmt.Errorf("command failed: %v", result.Error)
	}

	return &VlanPortConfigResult{
		Success: true,
		Message: fmt.Sprintf("Port configured in %s mode successfully", input.Mode),
	}, nil
}

// ===========================================================================
// Helper Functions
// ===========================================================================

// mapVlanData converts RouterOS data to GraphQL model.
func (s *VlanService) mapVlanData(data map[string]string) *model.Vlan {
	// Parse VLAN ID
	vlanID, _ := parseInt(data["vlan-id"])

	vlan := &model.Vlan{
		ID:     data[".id"],
		Name:   data["name"],
		VlanID: vlanID,
		Interface: &model.Interface{
			ID:   data["interface"],
			Name: data["interface"],
		},
		Disabled: parseBool(data["disabled"]),
		Running:  parseBool(data["running"]),
	}

	// Optional fields
	if mtu := data["mtu"]; mtu != "" {
		mtuVal, _ := parseInt(mtu)
		vlan.Mtu = &mtuVal
	}

	if comment := data["comment"]; comment != "" {
		vlan.Comment = &comment
	}

	return vlan
}
