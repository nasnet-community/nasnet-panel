package domains

import (
	"context"
	"fmt"

	"backend/internal/router"
	"backend/internal/services/ports"
)

// Compile-time interface check.
var _ ports.RouteAdapter = (*MikroTikRouteAdapter)(nil)

// MikroTikRouteAdapter implements ports.RouteAdapter for MikroTik RouterOS.
type MikroTikRouteAdapter struct {
	port router.RouterPort
}

// NewRouteAdapter creates a new MikroTik route adapter.
func NewRouteAdapter(port router.RouterPort) *MikroTikRouteAdapter {
	return &MikroTikRouteAdapter{port: port}
}

func (a *MikroTikRouteAdapter) ListRoutes(ctx context.Context, filters map[string]string) ([]map[string]string, error) {
	cmd := router.Command{
		Path:   "/ip/route",
		Action: "print",
		Args:   filters,
	}
	if cmd.Args == nil {
		cmd.Args = make(map[string]string)
	}

	result, err := a.port.ExecuteCommand(ctx, cmd)
	if err != nil {
		return nil, fmt.Errorf("list routes: %w", err)
	}
	if !result.Success {
		return nil, fmt.Errorf("list routes failed: %v", result.Error)
	}
	return result.Data, nil
}

func (a *MikroTikRouteAdapter) GetRoute(ctx context.Context, id string) (map[string]string, error) {
	result, err := a.port.ExecuteCommand(ctx, router.Command{
		Path:   "/ip/route",
		Action: "print",
		Args:   map[string]string{".id": id},
	})
	if err != nil {
		return nil, fmt.Errorf("get route: %w", err)
	}
	if !result.Success || len(result.Data) == 0 {
		return nil, fmt.Errorf("route not found: %s", id)
	}
	return result.Data[0], nil
}

func (a *MikroTikRouteAdapter) CreateRoute(ctx context.Context, args map[string]string) (string, error) {
	result, err := a.port.ExecuteCommand(ctx, router.Command{
		Path:   "/ip/route",
		Action: "add",
		Args:   args,
	})
	if err != nil {
		return "", fmt.Errorf("create route: %w", err)
	}
	if !result.Success {
		return "", fmt.Errorf("create route failed: %v", result.Error)
	}
	return resultID(result), nil
}

func (a *MikroTikRouteAdapter) UpdateRoute(ctx context.Context, id string, args map[string]string) error {
	args[".id"] = id
	result, err := a.port.ExecuteCommand(ctx, router.Command{
		Path:   "/ip/route",
		Action: "set",
		Args:   args,
	})
	if err != nil {
		return fmt.Errorf("update route: %w", err)
	}
	if !result.Success {
		return fmt.Errorf("update route failed: %v", result.Error)
	}
	return nil
}

func (a *MikroTikRouteAdapter) DeleteRoute(ctx context.Context, id string) error {
	result, err := a.port.ExecuteCommand(ctx, router.Command{
		Path:   "/ip/route",
		Action: "remove",
		Args:   map[string]string{".id": id},
	})
	if err != nil {
		return fmt.Errorf("delete route: %w", err)
	}
	if !result.Success {
		return fmt.Errorf("delete route failed: %v", result.Error)
	}
	return nil
}

func (a *MikroTikRouteAdapter) PingAddress(ctx context.Context, address string, count int) (map[string]string, error) {
	result, err := a.port.ExecuteCommand(ctx, router.Command{
		Path:   "/tool/ping",
		Action: "execute",
		Args: map[string]string{
			"address": address,
			"count":   fmt.Sprintf("%d", count),
		},
	})
	if err != nil {
		return nil, fmt.Errorf("ping address: %w", err)
	}
	data := map[string]string{"success": fmt.Sprintf("%v", result.Success)}
	if len(result.Data) > 0 {
		for k, v := range result.Data[0] {
			data[k] = v
		}
	}
	return data, nil
}

func (a *MikroTikRouteAdapter) ListTunnelInterfaces(ctx context.Context, tunnelType string) ([]map[string]string, error) {
	result, err := a.port.ExecuteCommand(ctx, router.Command{
		Path:   fmt.Sprintf("/interface/%s", tunnelType),
		Action: "print",
	})
	if err != nil {
		return nil, fmt.Errorf("list %s tunnels: %w", tunnelType, err)
	}
	if !result.Success {
		return nil, fmt.Errorf("list %s tunnels failed: %v", tunnelType, result.Error)
	}
	return result.Data, nil
}
