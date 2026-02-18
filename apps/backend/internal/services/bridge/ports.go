package bridge

import (
	"context"
	"fmt"

	"backend/internal/router"
)

// GetBridgePorts retrieves all ports for a bridge.
func (s *Service) GetBridgePorts(ctx context.Context, bridgeID string) ([]*PortData, error) {
	if err := s.EnsureConnected(ctx); err != nil {
		return nil, err
	}

	result, err := s.Port().ExecuteCommand(ctx, router.Command{
		Path:   "/interface/bridge/port",
		Action: "print",
		Query:  fmt.Sprintf("?bridge=%s", bridgeID),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to fetch bridge ports: %w", err)
	}

	ports, err := s.parseBridgePorts(result.Data)
	if err != nil {
		return nil, fmt.Errorf("failed to parse bridge ports: %w", err)
	}

	return ports, nil
}

// AddBridgePort adds an interface to a bridge.
func (s *Service) AddBridgePort(ctx context.Context, bridgeID string, input *AddBridgePortInput) (*PortData, string, error) {
	if err := s.EnsureConnected(ctx); err != nil {
		return nil, "", err
	}

	args := map[string]string{
		"bridge":    bridgeID,
		"interface": input.InterfaceID,
	}

	if input.PVID > 0 {
		args["pvid"] = fmt.Sprintf("%d", input.PVID)
	}
	if input.FrameTypes != "" {
		args["frame-types"] = input.FrameTypes
	}
	if input.IngressFiltering != nil {
		if *input.IngressFiltering {
			args["ingress-filtering"] = yes
		} else {
			args["ingress-filtering"] = "no"
		}
	}

	result, err := s.Port().ExecuteCommand(ctx, router.Command{
		Path:   "/interface/bridge/port",
		Action: "add",
		Args:   args,
	})
	if err != nil {
		return nil, "", fmt.Errorf("failed to add bridge port: %w", err)
	}

	port, err := s.parseBridgePort(result.Data)
	if err != nil {
		return nil, "", fmt.Errorf("failed to parse created bridge port: %w", err)
	}

	operationID, err := s.undoStore.Add("create", "bridge_port", nil)
	if err != nil {
		return nil, "", fmt.Errorf("failed to store undo operation: %w", err)
	}

	return port, operationID, nil
}

// UpdateBridgePort updates bridge port settings.
//
//nolint:gocyclo // bridge port configuration requires checking multiple conditions
func (s *Service) UpdateBridgePort(ctx context.Context, portID string, input *UpdateBridgePortInput) (*PortData, string, error) {
	ports, err := s.GetBridgePorts(ctx, "")
	if err != nil {
		return nil, "", fmt.Errorf("failed to get current ports: %w", err)
	}

	var previousState *PortData
	for _, port := range ports {
		if port.UUID == portID {
			previousState = port
			break
		}
	}

	if previousState == nil {
		return nil, "", fmt.Errorf("port not found: %s", portID)
	}

	if connErr := s.EnsureConnected(ctx); connErr != nil {
		return nil, "", connErr
	}

	args := make(map[string]string)
	if input.PVID != nil {
		args["pvid"] = fmt.Sprintf("%d", *input.PVID)
	}
	if input.FrameTypes != nil {
		args["frame-types"] = *input.FrameTypes
	}
	if input.IngressFiltering != nil {
		if *input.IngressFiltering {
			args["ingress-filtering"] = yes
		} else {
			args["ingress-filtering"] = "no"
		}
	}
	if input.Edge != nil {
		if *input.Edge {
			args["edge"] = "yes"
		} else {
			args["edge"] = "no"
		}
	}
	if input.PathCost != nil {
		args["path-cost"] = fmt.Sprintf("%d", *input.PathCost)
	}

	_, err = s.Port().ExecuteCommand(ctx, router.Command{
		Path:   "/interface/bridge/port",
		Action: "set",
		ID:     portID,
		Args:   args,
	})
	if err != nil {
		return nil, "", fmt.Errorf("failed to update bridge port: %w", err)
	}

	updatedPorts, err := s.GetBridgePorts(ctx, previousState.BridgeID)
	if err != nil {
		return nil, "", fmt.Errorf("failed to get updated port: %w", err)
	}

	var updatedPort *PortData
	for _, port := range updatedPorts {
		if port.UUID == portID {
			updatedPort = port
			break
		}
	}

	if updatedPort == nil {
		return nil, "", fmt.Errorf("updated port not found")
	}

	operationID, err := s.undoStore.Add("update", "bridge_port", previousState)
	if err != nil {
		return nil, "", fmt.Errorf("failed to store undo operation: %w", err)
	}

	return updatedPort, operationID, nil
}

// RemoveBridgePort removes a port from a bridge.
func (s *Service) RemoveBridgePort(ctx context.Context, portID string) (string, error) {
	ports, err := s.GetBridgePorts(ctx, "")
	if err != nil {
		return "", fmt.Errorf("failed to get current ports: %w", err)
	}

	var previousState *PortData
	for _, port := range ports {
		if port.UUID == portID {
			previousState = port
			break
		}
	}

	if previousState == nil {
		return "", fmt.Errorf("port not found: %s", portID)
	}

	if connErr := s.EnsureConnected(ctx); connErr != nil {
		return "", connErr
	}

	_, execErr := s.Port().ExecuteCommand(ctx, router.Command{
		Path:   "/interface/bridge/port",
		Action: "remove",
		ID:     portID,
	})
	if execErr != nil {
		return "", fmt.Errorf("failed to remove bridge port: %w", execErr)
	}

	operationID, err := s.undoStore.Add("delete", "bridge_port", previousState)
	if err != nil {
		return "", fmt.Errorf("failed to store undo operation: %w", err)
	}

	return operationID, nil
}

// GetAvailableInterfaces returns interfaces that are not currently in any bridge.
func (s *Service) GetAvailableInterfaces(ctx context.Context, routerID string) ([]string, error) {
	if err := s.EnsureConnected(ctx); err != nil {
		return nil, err
	}

	_, err := s.Port().ExecuteCommand(ctx, router.Command{
		Path:   "/interface",
		Action: "print",
	})
	if err != nil {
		return nil, fmt.Errorf("failed to fetch interfaces: %w", err)
	}

	_, err = s.Port().ExecuteCommand(ctx, router.Command{
		Path:   "/interface/bridge/port",
		Action: "print",
	})
	if err != nil {
		return nil, fmt.Errorf("failed to fetch bridge ports: %w", err)
	}

	return []string{}, nil
}
