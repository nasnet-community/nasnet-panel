package bridge

import (
	"context"
	"encoding/json"
	"fmt"

	"backend/internal/services/base"

	"backend/internal/events"
	"backend/internal/router"
)

// Service provides bridge configuration operations for MikroTik routers.
// It manages bridges, ports, VLANs, and STP status with 10-second undo support.
type Service struct {
	base.Service
	eventBus  events.EventBus
	undoStore *UndoStore
}

// NewService creates a new bridge service.
func NewService(config base.ServiceConfig) *Service {
	return &Service{
		Service:   base.NewService(config.RouterPort),
		eventBus:  config.EventBus,
		undoStore: NewUndoStore(),
	}
}

// GetBridges retrieves all bridges from a router.
func (s *Service) GetBridges(ctx context.Context, routerID string) ([]*Data, error) {
	if err := s.EnsureConnected(ctx); err != nil {
		return nil, err
	}

	result, err := s.Port().ExecuteCommand(ctx, router.Command{
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
func (s *Service) GetBridge(ctx context.Context, uuid string) (*Data, error) {
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
func (s *Service) CreateBridge(ctx context.Context, routerID string, input *CreateBridgeInput) (*Data, string, error) {
	if err := s.EnsureConnected(ctx); err != nil {
		return nil, "", err
	}

	builder := base.NewCommandArgsBuilder().AddString("name", input.Name)
	if input.Protocol != "" {
		builder.AddString("protocol", input.Protocol)
	}
	if input.Priority > 0 {
		builder.AddInt("priority", input.Priority)
	}
	if input.VlanFiltering {
		builder.AddBool("vlan-filtering", true)
	}
	if input.PVID > 0 {
		builder.AddInt("pvid", input.PVID)
	}
	if input.MTU > 0 {
		builder.AddInt("mtu", input.MTU)
	}
	if input.Comment != "" {
		builder.AddString("comment", input.Comment)
	}
	args := builder.Build()

	cmdResult, err := s.Port().ExecuteCommand(ctx, router.Command{
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
func (s *Service) UpdateBridge(ctx context.Context, uuid string, input *UpdateBridgeInput) (*Data, string, error) {
	previousState, err := s.GetBridge(ctx, uuid)
	if err != nil {
		return nil, "", fmt.Errorf("failed to get current bridge state: %w", err)
	}

	if connErr := s.EnsureConnected(ctx); connErr != nil {
		return nil, "", connErr
	}

	args := base.NewCommandArgsBuilder().
		AddOptionalString("protocol", input.Protocol).
		AddOptionalInt("priority", input.Priority).
		AddOptionalBool("vlan-filtering", input.VlanFiltering).
		AddOptionalInt("pvid", input.PVID).
		AddOptionalInt("mtu", input.MTU).
		AddOptionalBool("disabled", input.Disabled).
		AddOptionalString("comment", input.Comment).
		Build()

	_, execErr := s.Port().ExecuteCommand(ctx, router.Command{
		Path:   "/interface/bridge",
		Action: "set",
		ID:     uuid,
		Args:   args,
	})
	if execErr != nil {
		return nil, "", fmt.Errorf("failed to update bridge: %w", execErr)
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
func (s *Service) DeleteBridge(ctx context.Context, uuid string) (string, error) {
	previousState, err := s.GetBridge(ctx, uuid)
	if err != nil {
		return "", fmt.Errorf("failed to get current bridge state: %w", err)
	}

	if connErr := s.EnsureConnected(ctx); connErr != nil {
		return "", connErr
	}

	_, execErr := s.Port().ExecuteCommand(ctx, router.Command{
		Path:   "/interface/bridge",
		Action: "remove",
		ID:     uuid,
	})
	if execErr != nil {
		return "", fmt.Errorf("failed to delete bridge: %w", execErr)
	}

	operationID, err := s.undoStore.Add("delete", "bridge", previousState)
	if err != nil {
		return "", fmt.Errorf("failed to store undo operation: %w", err)
	}

	return operationID, nil
}

// UndoBridgeOperation reverts a bridge operation (within 10-second window).
func (s *Service) UndoBridgeOperation(ctx context.Context, operationID string) (*Data, error) {
	op, err := s.undoStore.Get(operationID)
	if err != nil {
		return nil, err
	}

	switch op.Type {
	case "create":
		return nil, fmt.Errorf("undo create not yet implemented")

	case "update":
		var previousState Data
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
		var previousState Data
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

// GetImpact analyzes the impact of deleting a bridge.
func (s *Service) GetImpact(ctx context.Context, uuid string) (*Impact, error) {
	b, err := s.GetBridge(ctx, uuid)
	if err != nil {
		return nil, err
	}

	impact := &Impact{
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
