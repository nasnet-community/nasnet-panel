// Package services provides business logic for VLAN management (NAS-6.7).
package services

import (
	"context"
	"fmt"

	"backend/generated/graphql"
	"backend/internal/router"
)

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

