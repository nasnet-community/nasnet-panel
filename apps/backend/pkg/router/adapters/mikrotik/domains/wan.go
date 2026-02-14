package domains

import (
	"context"
	"fmt"

	"backend/internal/router"
	"backend/internal/services/ports"
)

// Compile-time interface check.
var _ ports.WANAdapter = (*MikroTikWANAdapter)(nil)

// MikroTikWANAdapter implements ports.WANAdapter for MikroTik RouterOS.
type MikroTikWANAdapter struct {
	port router.RouterPort
}

// NewWANAdapter creates a new MikroTik WAN adapter.
func NewWANAdapter(port router.RouterPort) *MikroTikWANAdapter {
	return &MikroTikWANAdapter{port: port}
}

func (a *MikroTikWANAdapter) ListWANInterfaces(ctx context.Context) ([]map[string]string, error) {
	result, err := a.port.ExecuteCommand(ctx, router.Command{
		Path:   "/interface",
		Action: "print",
	})
	if err != nil {
		return nil, fmt.Errorf("list wan interfaces: %w", err)
	}
	return result.Data, nil
}

func (a *MikroTikWANAdapter) GetDHCPClient(ctx context.Context, interfaceID string) (map[string]string, error) {
	result, err := a.port.ExecuteCommand(ctx, router.Command{
		Path:   "/ip/dhcp-client",
		Action: "print",
		Args:   map[string]string{"interface": interfaceID},
	})
	if err != nil {
		return nil, fmt.Errorf("get dhcp client: %w", err)
	}
	if len(result.Data) == 0 {
		return nil, nil
	}
	return result.Data[0], nil
}

func (a *MikroTikWANAdapter) CreateDHCPClient(ctx context.Context, args map[string]string) (map[string]string, error) {
	result, err := a.port.ExecuteCommand(ctx, router.Command{
		Path:   "/ip/dhcp-client",
		Action: "add",
		Args:   args,
	})
	if err != nil {
		return nil, fmt.Errorf("create dhcp client: %w", err)
	}
	return flattenResult(result), nil
}

func (a *MikroTikWANAdapter) RemoveDHCPClient(ctx context.Context, id string) error {
	_, err := a.port.ExecuteCommand(ctx, router.Command{
		Path:   "/ip/dhcp-client",
		Action: "remove",
		ID:     id,
	})
	if err != nil {
		return fmt.Errorf("remove dhcp client: %w", err)
	}
	return nil
}

func (a *MikroTikWANAdapter) GetPPPoEClient(ctx context.Context, interfaceID string) (map[string]string, error) {
	result, err := a.port.ExecuteCommand(ctx, router.Command{
		Path:   "/interface/pppoe-client",
		Action: "print",
		Args:   map[string]string{"interface": interfaceID},
	})
	if err != nil {
		return nil, fmt.Errorf("get pppoe client: %w", err)
	}
	if len(result.Data) == 0 {
		return nil, nil
	}
	return result.Data[0], nil
}

func (a *MikroTikWANAdapter) CreatePPPoEClient(ctx context.Context, args map[string]string) (map[string]string, error) {
	result, err := a.port.ExecuteCommand(ctx, router.Command{
		Path:   "/interface/pppoe-client",
		Action: "add",
		Args:   args,
	})
	if err != nil {
		return nil, fmt.Errorf("create pppoe client: %w", err)
	}
	return flattenResult(result), nil
}

func (a *MikroTikWANAdapter) RemovePPPoEClient(ctx context.Context, id string) error {
	_, err := a.port.ExecuteCommand(ctx, router.Command{
		Path:   "/interface/pppoe-client",
		Action: "remove",
		ID:     id,
	})
	if err != nil {
		return fmt.Errorf("remove pppoe client: %w", err)
	}
	return nil
}

func (a *MikroTikWANAdapter) CreateStaticIP(ctx context.Context, args map[string]string) (map[string]string, error) {
	result, err := a.port.ExecuteCommand(ctx, router.Command{
		Path:   "/ip/address",
		Action: "add",
		Args:   args,
	})
	if err != nil {
		return nil, fmt.Errorf("create static ip: %w", err)
	}
	return flattenResult(result), nil
}

func (a *MikroTikWANAdapter) RemoveIPAddress(ctx context.Context, id string) error {
	_, err := a.port.ExecuteCommand(ctx, router.Command{
		Path:   "/ip/address",
		Action: "remove",
		ID:     id,
	})
	if err != nil {
		return fmt.Errorf("remove ip address: %w", err)
	}
	return nil
}

func (a *MikroTikWANAdapter) CreateRoute(ctx context.Context, args map[string]string) (map[string]string, error) {
	result, err := a.port.ExecuteCommand(ctx, router.Command{
		Path:   "/ip/route",
		Action: "add",
		Args:   args,
	})
	if err != nil {
		return nil, fmt.Errorf("create route: %w", err)
	}
	return flattenResult(result), nil
}

func (a *MikroTikWANAdapter) RemoveRoute(ctx context.Context, id string) error {
	_, err := a.port.ExecuteCommand(ctx, router.Command{
		Path:   "/ip/route",
		Action: "remove",
		ID:     id,
	})
	if err != nil {
		return fmt.Errorf("remove route: %w", err)
	}
	return nil
}

func (a *MikroTikWANAdapter) ListDefaultRoutes(ctx context.Context) ([]map[string]string, error) {
	result, err := a.port.ExecuteCommand(ctx, router.Command{
		Path:   "/ip/route",
		Action: "print",
		Args:   map[string]string{"dst-address": "0.0.0.0/0"},
	})
	if err != nil {
		return nil, fmt.Errorf("list default routes: %w", err)
	}
	return result.Data, nil
}

func (a *MikroTikWANAdapter) GetLTEModem(ctx context.Context, interfaceID string) (map[string]string, error) {
	result, err := a.port.ExecuteCommand(ctx, router.Command{
		Path:   "/interface/lte",
		Action: "print",
		Args:   map[string]string{".id": interfaceID},
	})
	if err != nil {
		return nil, fmt.Errorf("get lte modem: %w", err)
	}
	if len(result.Data) == 0 {
		return nil, fmt.Errorf("lte interface not found: %s", interfaceID)
	}
	return result.Data[0], nil
}

func (a *MikroTikWANAdapter) SetLTEModem(ctx context.Context, id string, args map[string]string) error {
	_, err := a.port.ExecuteCommand(ctx, router.Command{
		Path:   "/interface/lte",
		Action: "set",
		ID:     id,
		Args:   args,
	})
	if err != nil {
		return fmt.Errorf("set lte modem: %w", err)
	}
	return nil
}

func (a *MikroTikWANAdapter) PingGateway(ctx context.Context, address string, count int) (map[string]string, error) {
	result, err := a.port.ExecuteCommand(ctx, router.Command{
		Path:   "/tool/ping",
		Action: "execute",
		Args: map[string]string{
			"address": address,
			"count":   fmt.Sprintf("%d", count),
		},
	})
	if err != nil {
		return nil, fmt.Errorf("ping gateway: %w", err)
	}
	if len(result.Data) > 0 {
		return result.Data[0], nil
	}
	return map[string]string{"success": fmt.Sprintf("%v", result.Success)}, nil
}
