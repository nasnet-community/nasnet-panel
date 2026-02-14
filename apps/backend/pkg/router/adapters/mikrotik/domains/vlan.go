package domains

import (
	"context"
	"fmt"

	"backend/internal/router"
	"backend/internal/services/ports"
)

// Compile-time interface check.
var _ ports.VLANAdapter = (*MikroTikVLANAdapter)(nil)

// MikroTikVLANAdapter implements ports.VLANAdapter for MikroTik RouterOS.
type MikroTikVLANAdapter struct {
	port router.RouterPort
}

// NewVLANAdapter creates a new MikroTik VLAN adapter.
func NewVLANAdapter(port router.RouterPort) *MikroTikVLANAdapter {
	return &MikroTikVLANAdapter{port: port}
}

func (a *MikroTikVLANAdapter) ListVLANs(ctx context.Context, filters map[string]string) ([]map[string]string, error) {
	cmd := router.Command{
		Path:   "/interface/vlan",
		Action: "print",
		Args:   filters,
	}
	if cmd.Args == nil {
		cmd.Args = make(map[string]string)
	}

	result, err := a.port.ExecuteCommand(ctx, cmd)
	if err != nil {
		return nil, fmt.Errorf("list vlans: %w", err)
	}
	if !result.Success {
		return nil, fmt.Errorf("list vlans failed: %v", result.Error)
	}
	return result.Data, nil
}

func (a *MikroTikVLANAdapter) GetVLAN(ctx context.Context, id string) (map[string]string, error) {
	result, err := a.port.ExecuteCommand(ctx, router.Command{
		Path:   "/interface/vlan",
		Action: "print",
		Args:   map[string]string{".id": id},
	})
	if err != nil {
		return nil, fmt.Errorf("get vlan: %w", err)
	}
	if !result.Success || len(result.Data) == 0 {
		return nil, fmt.Errorf("vlan not found: %s", id)
	}
	return result.Data[0], nil
}

func (a *MikroTikVLANAdapter) CreateVLAN(ctx context.Context, args map[string]string) (string, error) {
	result, err := a.port.ExecuteCommand(ctx, router.Command{
		Path:   "/interface/vlan",
		Action: "add",
		Args:   args,
	})
	if err != nil {
		return "", fmt.Errorf("create vlan: %w", err)
	}
	if !result.Success {
		return "", fmt.Errorf("create vlan failed: %v", result.Error)
	}
	return resultID(result), nil
}

func (a *MikroTikVLANAdapter) UpdateVLAN(ctx context.Context, id string, args map[string]string) error {
	args[".id"] = id
	result, err := a.port.ExecuteCommand(ctx, router.Command{
		Path:   "/interface/vlan",
		Action: "set",
		Args:   args,
	})
	if err != nil {
		return fmt.Errorf("update vlan: %w", err)
	}
	if !result.Success {
		return fmt.Errorf("update vlan failed: %v", result.Error)
	}
	return nil
}

func (a *MikroTikVLANAdapter) DeleteVLAN(ctx context.Context, id string) error {
	result, err := a.port.ExecuteCommand(ctx, router.Command{
		Path:   "/interface/vlan",
		Action: "remove",
		Args:   map[string]string{".id": id},
	})
	if err != nil {
		return fmt.Errorf("delete vlan: %w", err)
	}
	if !result.Success {
		return fmt.Errorf("delete vlan failed: %v", result.Error)
	}
	return nil
}

func (a *MikroTikVLANAdapter) SetBridgePort(ctx context.Context, id string, args map[string]string) error {
	args[".id"] = id
	result, err := a.port.ExecuteCommand(ctx, router.Command{
		Path:   "/interface/bridge/port",
		Action: "set",
		Args:   args,
	})
	if err != nil {
		return fmt.Errorf("set bridge port: %w", err)
	}
	if !result.Success {
		return fmt.Errorf("set bridge port failed: %v", result.Error)
	}
	return nil
}
