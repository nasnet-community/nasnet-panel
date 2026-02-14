// Package domains provides MikroTik-specific implementations of domain adapter
// interfaces. Each adapter translates high-level domain operations into
// RouterOS commands via the router.RouterPort interface.
package domains

import (
	"context"
	"fmt"

	"backend/internal/router"
	"backend/internal/services/ports"
)

// Compile-time interface check.
var _ ports.BridgeAdapter = (*MikroTikBridgeAdapter)(nil)

// MikroTikBridgeAdapter implements ports.BridgeAdapter for MikroTik RouterOS.
type MikroTikBridgeAdapter struct {
	port router.RouterPort
}

// NewBridgeAdapter creates a new MikroTik bridge adapter.
func NewBridgeAdapter(port router.RouterPort) *MikroTikBridgeAdapter {
	return &MikroTikBridgeAdapter{port: port}
}

func (a *MikroTikBridgeAdapter) ListBridges(ctx context.Context) ([]map[string]string, error) {
	result, err := a.port.ExecuteCommand(ctx, router.Command{
		Path:   "/interface/bridge",
		Action: "print",
	})
	if err != nil {
		return nil, fmt.Errorf("list bridges: %w", err)
	}
	return result.Data, nil
}

func (a *MikroTikBridgeAdapter) GetBridge(ctx context.Context, id string) (map[string]string, error) {
	result, err := a.port.ExecuteCommand(ctx, router.Command{
		Path:   "/interface/bridge",
		Action: "print",
		Args:   map[string]string{".id": id},
	})
	if err != nil {
		return nil, fmt.Errorf("get bridge: %w", err)
	}
	if len(result.Data) == 0 {
		return nil, fmt.Errorf("bridge not found: %s", id)
	}
	return result.Data[0], nil
}

func (a *MikroTikBridgeAdapter) CreateBridge(ctx context.Context, args map[string]string) (map[string]string, error) {
	result, err := a.port.ExecuteCommand(ctx, router.Command{
		Path:   "/interface/bridge",
		Action: "add",
		Args:   args,
	})
	if err != nil {
		return nil, fmt.Errorf("create bridge: %w", err)
	}
	return flattenResult(result), nil
}

func (a *MikroTikBridgeAdapter) UpdateBridge(ctx context.Context, id string, args map[string]string) error {
	_, err := a.port.ExecuteCommand(ctx, router.Command{
		Path:   "/interface/bridge",
		Action: "set",
		ID:     id,
		Args:   args,
	})
	if err != nil {
		return fmt.Errorf("update bridge: %w", err)
	}
	return nil
}

func (a *MikroTikBridgeAdapter) DeleteBridge(ctx context.Context, id string) error {
	_, err := a.port.ExecuteCommand(ctx, router.Command{
		Path:   "/interface/bridge",
		Action: "remove",
		ID:     id,
	})
	if err != nil {
		return fmt.Errorf("delete bridge: %w", err)
	}
	return nil
}

func (a *MikroTikBridgeAdapter) ListBridgePorts(ctx context.Context, bridgeID string) ([]map[string]string, error) {
	cmd := router.Command{
		Path:   "/interface/bridge/port",
		Action: "print",
	}
	if bridgeID != "" {
		cmd.Query = fmt.Sprintf("?bridge=%s", bridgeID)
	}

	result, err := a.port.ExecuteCommand(ctx, cmd)
	if err != nil {
		return nil, fmt.Errorf("list bridge ports: %w", err)
	}
	return result.Data, nil
}

func (a *MikroTikBridgeAdapter) AddBridgePort(ctx context.Context, args map[string]string) (map[string]string, error) {
	result, err := a.port.ExecuteCommand(ctx, router.Command{
		Path:   "/interface/bridge/port",
		Action: "add",
		Args:   args,
	})
	if err != nil {
		return nil, fmt.Errorf("add bridge port: %w", err)
	}
	return flattenResult(result), nil
}

func (a *MikroTikBridgeAdapter) UpdateBridgePort(ctx context.Context, id string, args map[string]string) error {
	_, err := a.port.ExecuteCommand(ctx, router.Command{
		Path:   "/interface/bridge/port",
		Action: "set",
		ID:     id,
		Args:   args,
	})
	if err != nil {
		return fmt.Errorf("update bridge port: %w", err)
	}
	return nil
}

func (a *MikroTikBridgeAdapter) RemoveBridgePort(ctx context.Context, id string) error {
	_, err := a.port.ExecuteCommand(ctx, router.Command{
		Path:   "/interface/bridge/port",
		Action: "remove",
		ID:     id,
	})
	if err != nil {
		return fmt.Errorf("remove bridge port: %w", err)
	}
	return nil
}

func (a *MikroTikBridgeAdapter) ListBridgeVlans(ctx context.Context, bridgeID string) ([]map[string]string, error) {
	cmd := router.Command{
		Path:   "/interface/bridge/vlan",
		Action: "print",
	}
	if bridgeID != "" {
		cmd.Query = fmt.Sprintf("?bridge=%s", bridgeID)
	}

	result, err := a.port.ExecuteCommand(ctx, cmd)
	if err != nil {
		return nil, fmt.Errorf("list bridge vlans: %w", err)
	}
	return result.Data, nil
}

func (a *MikroTikBridgeAdapter) CreateBridgeVlan(ctx context.Context, args map[string]string) (map[string]string, error) {
	result, err := a.port.ExecuteCommand(ctx, router.Command{
		Path:   "/interface/bridge/vlan",
		Action: "add",
		Args:   args,
	})
	if err != nil {
		return nil, fmt.Errorf("create bridge vlan: %w", err)
	}
	return flattenResult(result), nil
}

func (a *MikroTikBridgeAdapter) DeleteBridgeVlan(ctx context.Context, id string) error {
	_, err := a.port.ExecuteCommand(ctx, router.Command{
		Path:   "/interface/bridge/vlan",
		Action: "remove",
		ID:     id,
	})
	if err != nil {
		return fmt.Errorf("delete bridge vlan: %w", err)
	}
	return nil
}

func (a *MikroTikBridgeAdapter) GetStpStatus(ctx context.Context, bridgeID string) (map[string]string, error) {
	result, err := a.port.ExecuteCommand(ctx, router.Command{
		Path:   "/interface/bridge",
		Action: "monitor",
		Args:   map[string]string{"bridge": bridgeID},
	})
	if err != nil {
		return nil, fmt.Errorf("get stp status: %w", err)
	}
	if len(result.Data) == 0 {
		return nil, fmt.Errorf("no STP data for bridge: %s", bridgeID)
	}
	return result.Data[0], nil
}

func (a *MikroTikBridgeAdapter) ListAllInterfaces(ctx context.Context) ([]map[string]string, error) {
	result, err := a.port.ExecuteCommand(ctx, router.Command{
		Path:   "/interface",
		Action: "print",
	})
	if err != nil {
		return nil, fmt.Errorf("list interfaces: %w", err)
	}
	return result.Data, nil
}
