package domains

import (
	"context"
	"fmt"

	"backend/internal/router"
	"backend/internal/services/ports"
)

// Compile-time interface checks.
var (
	_ ports.InterfaceAdapter = (*MikroTikInterfaceAdapter)(nil)
	_ ports.IPAddressAdapter = (*MikroTikIPAddressAdapter)(nil)
)

// MikroTikInterfaceAdapter implements ports.InterfaceAdapter for MikroTik RouterOS.
type MikroTikInterfaceAdapter struct {
	port router.RouterPort
}

// NewInterfaceAdapter creates a new MikroTik interface adapter.
func NewInterfaceAdapter(port router.RouterPort) *MikroTikInterfaceAdapter {
	return &MikroTikInterfaceAdapter{port: port}
}

func (a *MikroTikInterfaceAdapter) ListInterfaces(ctx context.Context, interfaceType string) ([]map[string]string, error) {
	path := "/interface"
	if interfaceType != "" {
		path = fmt.Sprintf("/interface/%s", interfaceType)
	}

	result, err := a.port.ExecuteCommand(ctx, router.Command{
		Path:   path,
		Action: "print",
	})
	if err != nil {
		return nil, fmt.Errorf("list interfaces: %w", err)
	}
	return result.Data, nil
}

func (a *MikroTikInterfaceAdapter) GetInterface(ctx context.Context, id string) (map[string]string, error) {
	result, err := a.port.ExecuteCommand(ctx, router.Command{
		Path:   "/interface",
		Action: "print",
		Args:   map[string]string{".id": id},
	})
	if err != nil {
		return nil, fmt.Errorf("get interface: %w", err)
	}
	if len(result.Data) == 0 {
		return nil, fmt.Errorf("interface not found: %s", id)
	}
	return result.Data[0], nil
}

func (a *MikroTikInterfaceAdapter) SetInterface(ctx context.Context, id string, args map[string]string) error {
	_, err := a.port.ExecuteCommand(ctx, router.Command{
		Path:   "/interface",
		Action: "set",
		ID:     id,
		Args:   args,
	})
	if err != nil {
		return fmt.Errorf("set interface: %w", err)
	}
	return nil
}

func (a *MikroTikInterfaceAdapter) EnableInterface(ctx context.Context, id string) error {
	_, err := a.port.ExecuteCommand(ctx, router.Command{
		Path:   "/interface",
		Action: "set",
		ID:     id,
		Args:   map[string]string{"disabled": "no"},
	})
	if err != nil {
		return fmt.Errorf("enable interface: %w", err)
	}
	return nil
}

func (a *MikroTikInterfaceAdapter) DisableInterface(ctx context.Context, id string) error {
	_, err := a.port.ExecuteCommand(ctx, router.Command{
		Path:   "/interface",
		Action: "set",
		ID:     id,
		Args:   map[string]string{"disabled": "yes"},
	})
	if err != nil {
		return fmt.Errorf("disable interface: %w", err)
	}
	return nil
}

func (a *MikroTikInterfaceAdapter) GetInterfaceStats(ctx context.Context, interfaceID string) (map[string]string, error) {
	result, err := a.port.ExecuteCommand(ctx, router.Command{
		Path:   "/interface",
		Action: "print",
		Args:   map[string]string{".id": interfaceID},
		Props:  []string{"tx-byte", "rx-byte", "tx-packet", "rx-packet", "tx-error", "rx-error", "tx-drop", "rx-drop"},
	})
	if err != nil {
		return nil, fmt.Errorf("get interface stats: %w", err)
	}
	if len(result.Data) == 0 {
		return nil, fmt.Errorf("interface not found: %s", interfaceID)
	}
	return result.Data[0], nil
}

func (a *MikroTikInterfaceAdapter) MonitorInterface(ctx context.Context, id string) (map[string]string, error) {
	result, err := a.port.ExecuteCommand(ctx, router.Command{
		Path:   "/interface",
		Action: "monitor",
		Args:   map[string]string{".id": id, "once": ""},
	})
	if err != nil {
		return nil, fmt.Errorf("monitor interface: %w", err)
	}
	if len(result.Data) == 0 {
		return nil, fmt.Errorf("no monitor data for interface: %s", id)
	}
	return result.Data[0], nil
}

// MikroTikIPAddressAdapter implements ports.IPAddressAdapter for MikroTik RouterOS.
type MikroTikIPAddressAdapter struct {
	port router.RouterPort
}

// NewIPAddressAdapter creates a new MikroTik IP address adapter.
func NewIPAddressAdapter(port router.RouterPort) *MikroTikIPAddressAdapter {
	return &MikroTikIPAddressAdapter{port: port}
}

func (a *MikroTikIPAddressAdapter) ListIPAddresses(ctx context.Context, interfaceFilter string) ([]map[string]string, error) {
	cmd := router.Command{
		Path:   "/ip/address",
		Action: "print",
	}
	if interfaceFilter != "" {
		cmd.Args = map[string]string{"interface": interfaceFilter}
	}

	result, err := a.port.ExecuteCommand(ctx, cmd)
	if err != nil {
		return nil, fmt.Errorf("list ip addresses: %w", err)
	}
	return result.Data, nil
}

func (a *MikroTikIPAddressAdapter) GetIPAddress(ctx context.Context, id string) (map[string]string, error) {
	result, err := a.port.ExecuteCommand(ctx, router.Command{
		Path:   "/ip/address",
		Action: "print",
		Args:   map[string]string{".id": id},
	})
	if err != nil {
		return nil, fmt.Errorf("get ip address: %w", err)
	}
	if len(result.Data) == 0 {
		return nil, fmt.Errorf("ip address not found: %s", id)
	}
	return result.Data[0], nil
}

func (a *MikroTikIPAddressAdapter) CreateIPAddress(ctx context.Context, args map[string]string) (map[string]string, error) {
	result, err := a.port.ExecuteCommand(ctx, router.Command{
		Path:   "/ip/address",
		Action: "add",
		Args:   args,
	})
	if err != nil {
		return nil, fmt.Errorf("create ip address: %w", err)
	}
	return flattenResult(result), nil
}

func (a *MikroTikIPAddressAdapter) UpdateIPAddress(ctx context.Context, id string, args map[string]string) error {
	_, err := a.port.ExecuteCommand(ctx, router.Command{
		Path:   "/ip/address",
		Action: "set",
		ID:     id,
		Args:   args,
	})
	if err != nil {
		return fmt.Errorf("update ip address: %w", err)
	}
	return nil
}

func (a *MikroTikIPAddressAdapter) DeleteIPAddress(ctx context.Context, id string) error {
	_, err := a.port.ExecuteCommand(ctx, router.Command{
		Path:   "/ip/address",
		Action: "remove",
		ID:     id,
	})
	if err != nil {
		return fmt.Errorf("delete ip address: %w", err)
	}
	return nil
}

func (a *MikroTikIPAddressAdapter) ListDHCPServers(ctx context.Context) ([]map[string]string, error) {
	result, err := a.port.ExecuteCommand(ctx, router.Command{
		Path:   "/ip/dhcp-server",
		Action: "print",
	})
	if err != nil {
		return nil, fmt.Errorf("list dhcp servers: %w", err)
	}
	return result.Data, nil
}

func (a *MikroTikIPAddressAdapter) ListRoutes(ctx context.Context) ([]map[string]string, error) {
	result, err := a.port.ExecuteCommand(ctx, router.Command{
		Path:   "/ip/route",
		Action: "print",
	})
	if err != nil {
		return nil, fmt.Errorf("list routes: %w", err)
	}
	return result.Data, nil
}

func (a *MikroTikIPAddressAdapter) ListNATRules(ctx context.Context) ([]map[string]string, error) {
	result, err := a.port.ExecuteCommand(ctx, router.Command{
		Path:   "/ip/firewall/nat",
		Action: "print",
	})
	if err != nil {
		return nil, fmt.Errorf("list nat rules: %w", err)
	}
	return result.Data, nil
}

func (a *MikroTikIPAddressAdapter) ListFirewallRules(ctx context.Context) ([]map[string]string, error) {
	result, err := a.port.ExecuteCommand(ctx, router.Command{
		Path:   "/ip/firewall/filter",
		Action: "print",
	})
	if err != nil {
		return nil, fmt.Errorf("list firewall rules: %w", err)
	}
	return result.Data, nil
}
