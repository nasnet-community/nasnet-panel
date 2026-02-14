package bridge

import (
	"context"
	"encoding/json"
	"fmt"

	"backend/internal/events"
	"backend/internal/router"
)

// BridgeService provides bridge configuration operations for MikroTik routers.
// It manages bridges, ports, VLANs, and STP status with 10-second undo support.
type BridgeService struct {
	routerPort router.RouterPort
	eventBus   events.EventBus
	undoStore  *UndoStore
}

// BridgeServiceConfig holds configuration for BridgeService.
type BridgeServiceConfig struct {
	RouterPort router.RouterPort
	EventBus   events.EventBus
}

// NewBridgeService creates a new bridge service.
func NewBridgeService(config BridgeServiceConfig) *BridgeService {
	return &BridgeService{
		routerPort: config.RouterPort,
		eventBus:   config.EventBus,
		undoStore:  NewUndoStore(),
	}
}

// GetBridges retrieves all bridges from a router.
func (s *BridgeService) GetBridges(ctx context.Context, routerID string) ([]*BridgeData, error) {
	if !s.routerPort.IsConnected() {
		if err := s.routerPort.Connect(ctx); err != nil {
			return nil, fmt.Errorf("failed to connect to router: %w", err)
		}
	}

	result, err := s.routerPort.ExecuteCommand(ctx, router.Command{
		Path:   "/interface/bridge",
		Action: "print",
	})
	if err != nil {
		return nil, fmt.Errorf("failed to fetch bridges: %w", err)
	}

	bridges, err := s.parseBridges(result.Data)
	if err != nil {
		return nil, fmt.Errorf("failed to parse bridges: %w", err)
	}

	for _, b := range bridges {
		ports, err := s.GetBridgePorts(ctx, b.UUID)
		if err != nil {
			return nil, fmt.Errorf("failed to get bridge ports: %w", err)
		}
		b.Ports = ports

		vlans, err := s.GetBridgeVlans(ctx, b.UUID)
		if err != nil {
			return nil, fmt.Errorf("failed to get bridge VLANs: %w", err)
		}
		b.Vlans = vlans

		if b.Protocol != "none" {
			stpStatus, err := s.GetStpStatus(ctx, b.UUID)
			if err == nil {
				b.StpStatus = stpStatus
			}
		}
	}

	return bridges, nil
}

// GetBridge retrieves a single bridge by UUID.
func (s *BridgeService) GetBridge(ctx context.Context, uuid string) (*BridgeData, error) {
	bridges, err := s.GetBridges(ctx, "")
	if err != nil {
		return nil, err
	}
	for _, b := range bridges {
		if b.UUID == uuid {
			return b, nil
		}
	}
	return nil, fmt.Errorf("bridge not found: %s", uuid)
}

// CreateBridge creates a new bridge.
func (s *BridgeService) CreateBridge(ctx context.Context, routerID string, input *CreateBridgeInput) (*BridgeData, string, error) {
	if !s.routerPort.IsConnected() {
		if err := s.routerPort.Connect(ctx); err != nil {
			return nil, "", fmt.Errorf("failed to connect to router: %w", err)
		}
	}

	args := map[string]string{"name": input.Name}
	if input.Protocol != "" {
		args["protocol"] = input.Protocol
	}
	if input.Priority > 0 {
		args["priority"] = fmt.Sprintf("%d", input.Priority)
	}
	if input.VlanFiltering {
		args["vlan-filtering"] = "yes"
	}
	if input.PVID > 0 {
		args["pvid"] = fmt.Sprintf("%d", input.PVID)
	}
	if input.MTU > 0 {
		args["mtu"] = fmt.Sprintf("%d", input.MTU)
	}
	if input.Comment != "" {
		args["comment"] = input.Comment
	}

	cmdResult, err := s.routerPort.ExecuteCommand(ctx, router.Command{
		Path:   "/interface/bridge",
		Action: "add",
		Args:   args,
	})
	if err != nil {
		return nil, "", fmt.Errorf("failed to create bridge: %w", err)
	}

	bridge, err := s.parseBridge(cmdResult.Data)
	if err != nil {
		return nil, "", fmt.Errorf("failed to parse created bridge: %w", err)
	}

	operationID, err := s.undoStore.Add("create", "bridge", nil)
	if err != nil {
		return nil, "", fmt.Errorf("failed to store undo operation: %w", err)
	}

	return bridge, operationID, nil
}

// UpdateBridge updates an existing bridge.
func (s *BridgeService) UpdateBridge(ctx context.Context, uuid string, input *UpdateBridgeInput) (*BridgeData, string, error) {
	previousState, err := s.GetBridge(ctx, uuid)
	if err != nil {
		return nil, "", fmt.Errorf("failed to get current bridge state: %w", err)
	}

	if !s.routerPort.IsConnected() {
		if err := s.routerPort.Connect(ctx); err != nil {
			return nil, "", fmt.Errorf("failed to connect to router: %w", err)
		}
	}

	args := make(map[string]string)
	if input.Protocol != nil {
		args["protocol"] = *input.Protocol
	}
	if input.Priority != nil {
		args["priority"] = fmt.Sprintf("%d", *input.Priority)
	}
	if input.VlanFiltering != nil {
		if *input.VlanFiltering {
			args["vlan-filtering"] = "yes"
		} else {
			args["vlan-filtering"] = "no"
		}
	}
	if input.PVID != nil {
		args["pvid"] = fmt.Sprintf("%d", *input.PVID)
	}
	if input.MTU != nil {
		args["mtu"] = fmt.Sprintf("%d", *input.MTU)
	}
	if input.Disabled != nil {
		if *input.Disabled {
			args["disabled"] = "yes"
		} else {
			args["disabled"] = "no"
		}
	}
	if input.Comment != nil {
		args["comment"] = *input.Comment
	}

	_, err = s.routerPort.ExecuteCommand(ctx, router.Command{
		Path:   "/interface/bridge",
		Action: "set",
		ID:     uuid,
		Args:   args,
	})
	if err != nil {
		return nil, "", fmt.Errorf("failed to update bridge: %w", err)
	}

	updatedBridge, err := s.GetBridge(ctx, uuid)
	if err != nil {
		return nil, "", fmt.Errorf("failed to get updated bridge: %w", err)
	}

	operationID, err := s.undoStore.Add("update", "bridge", previousState)
	if err != nil {
		return nil, "", fmt.Errorf("failed to store undo operation: %w", err)
	}

	return updatedBridge, operationID, nil
}

// DeleteBridge deletes a bridge.
func (s *BridgeService) DeleteBridge(ctx context.Context, uuid string) (string, error) {
	previousState, err := s.GetBridge(ctx, uuid)
	if err != nil {
		return "", fmt.Errorf("failed to get current bridge state: %w", err)
	}

	if !s.routerPort.IsConnected() {
		if err := s.routerPort.Connect(ctx); err != nil {
			return "", fmt.Errorf("failed to connect to router: %w", err)
		}
	}

	_, err = s.routerPort.ExecuteCommand(ctx, router.Command{
		Path:   "/interface/bridge",
		Action: "remove",
		ID:     uuid,
	})
	if err != nil {
		return "", fmt.Errorf("failed to delete bridge: %w", err)
	}

	operationID, err := s.undoStore.Add("delete", "bridge", previousState)
	if err != nil {
		return "", fmt.Errorf("failed to store undo operation: %w", err)
	}

	return operationID, nil
}

// UndoBridgeOperation reverts a bridge operation (within 10-second window).
func (s *BridgeService) UndoBridgeOperation(ctx context.Context, operationID string) (*BridgeData, error) {
	op, err := s.undoStore.Get(operationID)
	if err != nil {
		return nil, err
	}

	switch op.Type {
	case "create":
		return nil, fmt.Errorf("undo create not yet implemented")

	case "update":
		var previousState BridgeData
		if err := json.Unmarshal(op.PreviousState, &previousState); err != nil {
			return nil, fmt.Errorf("failed to unmarshal previous state: %w", err)
		}

		input := &UpdateBridgeInput{
			Protocol:      &previousState.Protocol,
			Priority:      &previousState.Priority,
			VlanFiltering: &previousState.VlanFiltering,
			PVID:          &previousState.PVID,
			MTU:           &previousState.MTU,
			Disabled:      &previousState.Disabled,
			Comment:       &previousState.Comment,
		}

		restoredBridge, _, err := s.UpdateBridge(ctx, previousState.UUID, input)
		if err != nil {
			return nil, fmt.Errorf("failed to restore bridge: %w", err)
		}
		s.undoStore.Delete(operationID)
		return restoredBridge, nil

	case "delete":
		var previousState BridgeData
		if err := json.Unmarshal(op.PreviousState, &previousState); err != nil {
			return nil, fmt.Errorf("failed to unmarshal previous state: %w", err)
		}

		input := &CreateBridgeInput{
			Name:          previousState.Name,
			Protocol:      previousState.Protocol,
			Priority:      previousState.Priority,
			VlanFiltering: previousState.VlanFiltering,
			PVID:          previousState.PVID,
			MTU:           previousState.MTU,
			Comment:       previousState.Comment,
		}

		recreatedBridge, _, err := s.CreateBridge(ctx, "", input)
		if err != nil {
			return nil, fmt.Errorf("failed to recreate bridge: %w", err)
		}
		s.undoStore.Delete(operationID)
		return recreatedBridge, nil

	default:
		return nil, fmt.Errorf("unknown operation type: %s", op.Type)
	}
}

// GetBridgeImpact analyzes the impact of deleting a bridge.
func (s *BridgeService) GetBridgeImpact(ctx context.Context, uuid string) (*BridgeImpact, error) {
	b, err := s.GetBridge(ctx, uuid)
	if err != nil {
		return nil, err
	}

	impact := &BridgeImpact{
		PortsToRelease:      make([]string, 0),
		IPAddressesToRemove: make([]string, 0),
		DHCPServersAffected: make([]string, 0),
		RoutesAffected:      make([]string, 0),
	}

	for _, port := range b.Ports {
		impact.PortsToRelease = append(impact.PortsToRelease, port.InterfaceName)
	}
	impact.IPAddressesToRemove = b.IPAddresses

	return impact, nil
}
