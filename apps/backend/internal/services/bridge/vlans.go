package bridge

import (
	"context"
	"fmt"

	"backend/internal/router"
)

// GetBridgeVlans retrieves all VLANs for a bridge.
func (s *BridgeService) GetBridgeVlans(ctx context.Context, bridgeID string) ([]*BridgeVlanData, error) {
	if !s.routerPort.IsConnected() {
		if err := s.routerPort.Connect(ctx); err != nil {
			return nil, fmt.Errorf("failed to connect to router: %w", err)
		}
	}

	result, err := s.routerPort.ExecuteCommand(ctx, router.Command{
		Path:   "/interface/bridge/vlan",
		Action: "print",
		Query:  fmt.Sprintf("?bridge=%s", bridgeID),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to fetch bridge VLANs: %w", err)
	}

	vlans, err := s.parseBridgeVlans(result.Data)
	if err != nil {
		return nil, fmt.Errorf("failed to parse bridge VLANs: %w", err)
	}

	return vlans, nil
}

// CreateBridgeVlan creates a VLAN entry on a bridge.
func (s *BridgeService) CreateBridgeVlan(ctx context.Context, bridgeID string, input *CreateBridgeVlanInput) (*BridgeVlanData, error) {
	if !s.routerPort.IsConnected() {
		if err := s.routerPort.Connect(ctx); err != nil {
			return nil, fmt.Errorf("failed to connect to router: %w", err)
		}
	}

	args := map[string]string{
		"bridge":   bridgeID,
		"vlan-ids": fmt.Sprintf("%d", input.VlanID),
	}

	if len(input.TaggedPortIDs) > 0 {
		args["tagged"] = input.TaggedPortIDs[0]
	}

	if len(input.UntaggedPortIDs) > 0 {
		args["untagged"] = input.UntaggedPortIDs[0]
	}

	result, err := s.routerPort.ExecuteCommand(ctx, router.Command{
		Path:   "/interface/bridge/vlan",
		Action: "add",
		Args:   args,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create bridge VLAN: %w", err)
	}

	vlan, err := s.parseBridgeVlan(result.Data)
	if err != nil {
		return nil, fmt.Errorf("failed to parse created bridge VLAN: %w", err)
	}

	return vlan, nil
}

// DeleteBridgeVlan deletes a VLAN entry from a bridge.
func (s *BridgeService) DeleteBridgeVlan(ctx context.Context, uuid string) error {
	if !s.routerPort.IsConnected() {
		if err := s.routerPort.Connect(ctx); err != nil {
			return fmt.Errorf("failed to connect to router: %w", err)
		}
	}

	_, err := s.routerPort.ExecuteCommand(ctx, router.Command{
		Path:   "/interface/bridge/vlan",
		Action: "remove",
		ID:     uuid,
	})
	if err != nil {
		return fmt.Errorf("failed to delete bridge VLAN: %w", err)
	}

	return nil
}

// GetStpStatus retrieves STP status for a bridge.
func (s *BridgeService) GetStpStatus(ctx context.Context, bridgeID string) (*BridgeStpStatusData, error) {
	if !s.routerPort.IsConnected() {
		if err := s.routerPort.Connect(ctx); err != nil {
			return nil, fmt.Errorf("failed to connect to router: %w", err)
		}
	}

	result, err := s.routerPort.ExecuteCommand(ctx, router.Command{
		Path:   "/interface/bridge",
		Action: "monitor",
		Args: map[string]string{
			"bridge": bridgeID,
		},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to fetch STP status: %w", err)
	}

	stpStatus, err := s.parseStpStatus(result.Data)
	if err != nil {
		return nil, fmt.Errorf("failed to parse STP status: %w", err)
	}

	return stpStatus, nil
}
