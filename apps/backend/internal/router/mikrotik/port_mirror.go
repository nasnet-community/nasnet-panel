package mikrotik

import (
	"context"
	"fmt"
	"strings"

	"backend/graph/model"
	"backend/internal/router"
)

// GetPortMirrors retrieves all port mirror configurations from RouterOS.
// Port mirroring in MikroTik is configured using bridge port mirror-ingress and mirror-egress properties.
// We group ports by their mirror target to create logical mirror configurations.
func (a *MikroTikAdapter) GetPortMirrors(
	ctx context.Context,
	routerID string,
) ([]*model.PortMirror, error) {
	// Query all bridge ports with mirror properties
	cmd := router.Command{
		Path:   "/interface/bridge/port",
		Action: "print",
		Props: []string{
			".id",
			"interface",
			"mirror-target",
			"mirror-ingress",
			"mirror-egress",
			"comment",
		},
	}

	result, err := a.Execute(ctx, cmd)
	if err != nil {
		return nil, fmt.Errorf("failed to execute RouterOS command: %w", err)
	}

	// Group ports by mirror target to create logical mirror configurations
	return groupPortMirrors(result), nil
}

// GetPortMirror retrieves a specific port mirror configuration by ID.
// The ID is derived from the destination interface name.
func (a *MikroTikAdapter) GetPortMirror(
	ctx context.Context,
	routerID string,
	mirrorID string,
) (*model.PortMirror, error) {
	mirrors, err := a.GetPortMirrors(ctx, routerID)
	if err != nil {
		return nil, err
	}

	for _, mirror := range mirrors {
		if mirror.ID == mirrorID {
			return mirror, nil
		}
	}

	return nil, fmt.Errorf("port mirror not found: %s", mirrorID)
}

// CreatePortMirror creates a new port mirror configuration.
// This sets mirror-ingress and/or mirror-egress on the specified source ports.
func (a *MikroTikAdapter) CreatePortMirror(
	ctx context.Context,
	routerID string,
	input *model.CreatePortMirrorInput,
) (*model.PortMirror, error) {
	// Validate that source interfaces exist and are bridge members
	for _, sourceID := range input.SourceInterfaceIds {
		if err := a.validateBridgeMember(ctx, sourceID); err != nil {
			return nil, fmt.Errorf("source interface %s: %w", sourceID, err)
		}
	}

	// Validate that destination interface exists
	if err := a.validateInterface(ctx, input.DestinationInterfaceID); err != nil {
		return nil, fmt.Errorf("destination interface: %w", err)
	}

	// Get destination interface name
	destInterface, err := a.getInterfaceName(ctx, input.DestinationInterfaceID)
	if err != nil {
		return nil, fmt.Errorf("failed to get destination interface: %w", err)
	}

	// Determine which mirror fields to set based on direction
	direction := model.MirrorDirectionBoth
	if input.Direction != nil {
		direction = *input.Direction
	}

	// Update each source port with mirror settings
	for _, sourceID := range input.SourceInterfaceIds {
		args := make(map[string]string)

		switch direction {
		case model.MirrorDirectionIngress:
			args["mirror-ingress"] = destInterface
		case model.MirrorDirectionEgress:
			args["mirror-egress"] = destInterface
		case model.MirrorDirectionBoth:
			args["mirror-ingress"] = destInterface
			args["mirror-egress"] = destInterface
		}

		if input.Comment != nil && *input.Comment != "" {
			args["comment"] = *input.Comment
		}

		cmd := router.Command{
			Path:   "/interface/bridge/port",
			Action: "set",
			ID:     sourceID,
			Args:   args,
		}

		if _, err := a.Execute(ctx, cmd); err != nil {
			return nil, fmt.Errorf("failed to set mirror on port %s: %w", sourceID, err)
		}
	}

	// Return the created mirror configuration
	return a.GetPortMirror(ctx, routerID, destInterface)
}

// UpdatePortMirror updates an existing port mirror configuration.
func (a *MikroTikAdapter) UpdatePortMirror(
	ctx context.Context,
	routerID string,
	mirrorID string,
	input *model.UpdatePortMirrorInput,
) (*model.PortMirror, error) {
	// Get existing mirror to know which ports to update
	existingMirror, err := a.GetPortMirror(ctx, routerID, mirrorID)
	if err != nil {
		return nil, err
	}

	// If source interfaces or destination changed, we need to clear old config and set new
	if input.SourceInterfaceIds != nil || input.DestinationInterfaceID != nil {
		// Clear existing mirror settings on old source ports
		for _, source := range existingMirror.SourceInterfaces {
			clearArgs := map[string]string{
				"mirror-ingress": "",
				"mirror-egress":  "",
			}

			cmd := router.Command{
				Path:   "/interface/bridge/port",
				Action: "set",
				ID:     source.ID,
				Args:   clearArgs,
			}

			if _, err := a.Execute(ctx, cmd); err != nil {
				return nil, fmt.Errorf("failed to clear mirror on port %s: %w", source.ID, err)
			}
		}

		// Set new configuration
		sourceIDs := input.SourceInterfaceIds
		if sourceIDs == nil {
			// Use existing sources
			sourceIDs = make([]string, len(existingMirror.SourceInterfaces))
			for i, src := range existingMirror.SourceInterfaces {
				sourceIDs[i] = src.ID
			}
		}

		destID := input.DestinationInterfaceID
		if destID == nil {
			destID = &existingMirror.DestinationInterface.ID
		}

		destInterface, err := a.getInterfaceName(ctx, *destID)
		if err != nil {
			return nil, fmt.Errorf("failed to get destination interface: %w", err)
		}

		direction := existingMirror.Direction
		if input.Direction != nil {
			direction = *input.Direction
		}

		for _, sourceID := range sourceIDs {
			args := make(map[string]string)

			switch direction {
			case model.MirrorDirectionIngress:
				args["mirror-ingress"] = destInterface
			case model.MirrorDirectionEgress:
				args["mirror-egress"] = destInterface
			case model.MirrorDirectionBoth:
				args["mirror-ingress"] = destInterface
				args["mirror-egress"] = destInterface
			}

			if input.Comment != nil {
				args["comment"] = *input.Comment
			}

			cmd := router.Command{
				Path:   "/interface/bridge/port",
				Action: "set",
				ID:     sourceID,
				Args:   args,
			}

			if _, err := a.Execute(ctx, cmd); err != nil {
				return nil, fmt.Errorf("failed to set mirror on port %s: %w", sourceID, err)
			}
		}

		return a.GetPortMirror(ctx, routerID, destInterface)
	}

	// Only updating direction or comment on existing ports
	if input.Direction != nil || input.Comment != nil {
		destInterface, err := a.getInterfaceName(ctx, existingMirror.DestinationInterface.ID)
		if err != nil {
			return nil, err
		}

		direction := existingMirror.Direction
		if input.Direction != nil {
			direction = *input.Direction
		}

		for _, source := range existingMirror.SourceInterfaces {
			args := make(map[string]string)

			// Clear existing settings first
			args["mirror-ingress"] = ""
			args["mirror-egress"] = ""

			// Set new direction
			switch direction {
			case model.MirrorDirectionIngress:
				args["mirror-ingress"] = destInterface
			case model.MirrorDirectionEgress:
				args["mirror-egress"] = destInterface
			case model.MirrorDirectionBoth:
				args["mirror-ingress"] = destInterface
				args["mirror-egress"] = destInterface
			}

			if input.Comment != nil {
				args["comment"] = *input.Comment
			}

			cmd := router.Command{
				Path:   "/interface/bridge/port",
				Action: "set",
				ID:     source.ID,
				Args:   args,
			}

			if _, err := a.Execute(ctx, cmd); err != nil {
				return nil, fmt.Errorf("failed to update mirror on port %s: %w", source.ID, err)
			}
		}

		return a.GetPortMirror(ctx, routerID, destInterface)
	}

	// No changes
	return existingMirror, nil
}

// DeletePortMirror removes a port mirror configuration.
// This clears mirror-ingress and mirror-egress on all source ports.
func (a *MikroTikAdapter) DeletePortMirror(
	ctx context.Context,
	routerID string,
	mirrorID string,
) error {
	// Get existing mirror to know which ports to clear
	existingMirror, err := a.GetPortMirror(ctx, routerID, mirrorID)
	if err != nil {
		return err
	}

	// Clear mirror settings on all source ports
	for _, source := range existingMirror.SourceInterfaces {
		args := map[string]string{
			"mirror-ingress": "",
			"mirror-egress":  "",
		}

		cmd := router.Command{
			Path:   "/interface/bridge/port",
			Action: "set",
			ID:     source.ID,
			Args:   args,
		}

		if _, err := a.Execute(ctx, cmd); err != nil {
			return fmt.Errorf("failed to clear mirror on port %s: %w", source.ID, err)
		}
	}

	return nil
}

// EnablePortMirror enables an existing port mirror configuration.
func (a *MikroTikAdapter) EnablePortMirror(
	ctx context.Context,
	routerID string,
	mirrorID string,
) (*model.PortMirror, error) {
	mirror, err := a.GetPortMirror(ctx, routerID, mirrorID)
	if err != nil {
		return nil, err
	}

	if mirror.Enabled {
		return mirror, nil
	}

	// Re-apply mirror settings
	destInterface, err := a.getInterfaceName(ctx, mirror.DestinationInterface.ID)
	if err != nil {
		return nil, err
	}

	for _, source := range mirror.SourceInterfaces {
		args := make(map[string]string)

		switch mirror.Direction {
		case model.MirrorDirectionIngress:
			args["mirror-ingress"] = destInterface
		case model.MirrorDirectionEgress:
			args["mirror-egress"] = destInterface
		case model.MirrorDirectionBoth:
			args["mirror-ingress"] = destInterface
			args["mirror-egress"] = destInterface
		}

		cmd := router.Command{
			Path:   "/interface/bridge/port",
			Action: "set",
			ID:     source.ID,
			Args:   args,
		}

		if _, err := a.Execute(ctx, cmd); err != nil {
			return nil, fmt.Errorf("failed to enable mirror on port %s: %w", source.ID, err)
		}
	}

	return a.GetPortMirror(ctx, routerID, mirrorID)
}

// DisablePortMirror disables a port mirror configuration without deleting it.
func (a *MikroTikAdapter) DisablePortMirror(
	ctx context.Context,
	routerID string,
	mirrorID string,
) (*model.PortMirror, error) {
	mirror, err := a.GetPortMirror(ctx, routerID, mirrorID)
	if err != nil {
		return nil, err
	}

	if !mirror.Enabled {
		return mirror, nil
	}

	// Clear mirror settings (but keep comment for re-enabling)
	for _, source := range mirror.SourceInterfaces {
		args := map[string]string{
			"mirror-ingress": "",
			"mirror-egress":  "",
		}

		cmd := router.Command{
			Path:   "/interface/bridge/port",
			Action: "set",
			ID:     source.ID,
			Args:   args,
		}

		if _, err := a.Execute(ctx, cmd); err != nil {
			return nil, fmt.Errorf("failed to disable mirror on port %s: %w", source.ID, err)
		}
	}

	return a.GetPortMirror(ctx, routerID, mirrorID)
}

// Helper functions

// groupPortMirrors groups bridge ports by their mirror target to create logical mirror configurations.
func groupPortMirrors(ports []map[string]interface{}) []*model.PortMirror {
	// Group by destination interface
	mirrorGroups := make(map[string]*portMirrorGroup)

	for _, port := range ports {
		ingress, hasIngress := port["mirror-ingress"].(string)
		egress, hasEgress := port["mirror-egress"].(string)

		if !hasIngress && !hasEgress {
			continue
		}

		// Determine destination and direction
		var dest string
		var direction model.MirrorDirection

		if hasIngress && ingress != "" && hasEgress && egress != "" {
			if ingress == egress {
				dest = ingress
				direction = model.MirrorDirectionBoth
			} else {
				// Different targets for ingress/egress - treat as separate mirrors
				if ingress != "" {
					addPortToGroup(mirrorGroups, ingress, model.MirrorDirectionIngress, port)
				}
				if egress != "" {
					addPortToGroup(mirrorGroups, egress, model.MirrorDirectionEgress, port)
				}
				continue
			}
		} else if hasIngress && ingress != "" {
			dest = ingress
			direction = model.MirrorDirectionIngress
		} else if hasEgress && egress != "" {
			dest = egress
			direction = model.MirrorDirectionEgress
		} else {
			continue
		}

		addPortToGroup(mirrorGroups, dest, direction, port)
	}

	// Convert groups to PortMirror structs
	result := make([]*model.PortMirror, 0, len(mirrorGroups))
	for dest, group := range mirrorGroups {
		mirror := &model.PortMirror{
			ID:                   dest,
			Name:                 fmt.Sprintf("mirror-%s", dest),
			DestinationInterface: createInterfaceStub(dest),
			SourceInterfaces:     group.sources,
			Direction:            group.direction,
			Enabled:              true,
		}

		if group.comment != "" {
			mirror.Comment = &group.comment
		}

		result = append(result, mirror)
	}

	return result
}

type portMirrorGroup struct {
	sources   []*model.Interface
	direction model.MirrorDirection
	comment   string
}

func addPortToGroup(groups map[string]*portMirrorGroup, dest string, direction model.MirrorDirection, port map[string]interface{}) {
	if groups[dest] == nil {
		groups[dest] = &portMirrorGroup{
			sources:   make([]*model.Interface, 0),
			direction: direction,
		}
	}

	group := groups[dest]

	// Add source interface
	if ifaceName, ok := port["interface"].(string); ok {
		sourceIface := &model.Interface{
			ID:   getString(port, ".id"),
			Name: ifaceName,
		}
		group.sources = append(group.sources, sourceIface)
	}

	// Update comment if present
	if comment, ok := port["comment"].(string); ok && comment != "" {
		group.comment = comment
	}
}

func createInterfaceStub(name string) *model.Interface {
	return &model.Interface{
		ID:   name,
		Name: name,
	}
}

func getString(data map[string]interface{}, key string) string {
	if val, ok := data[key].(string); ok {
		return val
	}
	return ""
}

// validateBridgeMember checks if an interface is a bridge member.
func (a *MikroTikAdapter) validateBridgeMember(ctx context.Context, interfaceID string) error {
	cmd := router.Command{
		Path:   "/interface/bridge/port",
		Action: "print",
		Query:  map[string]string{".id": interfaceID},
	}

	result, err := a.Execute(ctx, cmd)
	if err != nil {
		return fmt.Errorf("failed to query bridge port: %w", err)
	}

	if len(result) == 0 {
		return fmt.Errorf("interface is not a bridge member")
	}

	return nil
}

// validateInterface checks if an interface exists.
func (a *MikroTikAdapter) validateInterface(ctx context.Context, interfaceID string) error {
	cmd := router.Command{
		Path:   "/interface",
		Action: "print",
		Query:  map[string]string{".id": interfaceID},
	}

	result, err := a.Execute(ctx, cmd)
	if err != nil {
		return fmt.Errorf("failed to query interface: %w", err)
	}

	if len(result) == 0 {
		return fmt.Errorf("interface not found")
	}

	return nil
}

// getInterfaceName retrieves the name of an interface by ID.
func (a *MikroTikAdapter) getInterfaceName(ctx context.Context, interfaceID string) (string, error) {
	cmd := router.Command{
		Path:   "/interface",
		Action: "print",
		Query:  map[string]string{".id": interfaceID},
		Props:  []string{"name"},
	}

	result, err := a.Execute(ctx, cmd)
	if err != nil {
		return "", fmt.Errorf("failed to query interface: %w", err)
	}

	if len(result) == 0 {
		return "", fmt.Errorf("interface not found")
	}

	name := getString(result[0], "name")
	if name == "" {
		return "", fmt.Errorf("interface has no name")
	}

	return name, nil
}

// GetPortMirrorStats retrieves statistics for a port mirror destination interface.
func (a *MikroTikAdapter) GetPortMirrorStats(
	ctx context.Context,
	destinationInterfaceID string,
) (*model.PortMirrorStats, error) {
	// Query interface statistics
	cmd := router.Command{
		Path:   "/interface",
		Action: "print",
		Query:  map[string]string{".id": destinationInterfaceID},
		Props: []string{
			"tx-byte", "rx-byte",
			"tx-packet", "rx-packet",
			"tx-drop", "rx-drop",
		},
	}

	result, err := a.Execute(ctx, cmd)
	if err != nil {
		return nil, fmt.Errorf("failed to query interface stats: %w", err)
	}

	if len(result) == 0 {
		return nil, fmt.Errorf("interface not found")
	}

	stats := result[0]

	// Calculate mirrored traffic (this is an approximation based on RX traffic)
	// In reality, mirrored traffic stats would need to be tracked separately
	mirroredBytes := getString(stats, "rx-byte")
	mirroredPackets := getString(stats, "rx-packet")
	drops := parseInt(stats, "rx-drop") + parseInt(stats, "tx-drop")

	return &model.PortMirrorStats{
		MirroredBytes:   mirroredBytes,
		MirroredPackets: mirroredPackets,
		DestinationLoad: 0.0, // Would need to calculate based on interface capacity
		IsSaturated:     drops > 0,
	}, nil
}

func parseInt(data map[string]interface{}, key string) int {
	if val, ok := data[key].(int); ok {
		return val
	}
	if val, ok := data[key].(int64); ok {
		return int(val)
	}
	if val, ok := data[key].(float64); ok {
		return int(val)
	}
	if val, ok := data[key].(string); ok {
		// Try to parse string to int
		var result int
		fmt.Sscanf(val, "%d", &result)
		return result
	}
	return 0
}
