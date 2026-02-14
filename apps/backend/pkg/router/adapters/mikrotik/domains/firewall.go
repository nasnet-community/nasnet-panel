package domains

import (
	"context"
	"fmt"

	"backend/internal/router"
	"backend/internal/services/ports"
)

// Compile-time interface check.
var _ ports.FirewallAdapter = (*MikroTikFirewallAdapter)(nil)

// MikroTikFirewallAdapter implements ports.FirewallAdapter for MikroTik RouterOS.
type MikroTikFirewallAdapter struct {
	port router.RouterPort
}

// NewFirewallAdapter creates a new MikroTik firewall adapter.
func NewFirewallAdapter(port router.RouterPort) *MikroTikFirewallAdapter {
	return &MikroTikFirewallAdapter{port: port}
}

func (a *MikroTikFirewallAdapter) ListFilterRules(ctx context.Context, chain string) ([]map[string]string, error) {
	cmd := router.Command{
		Path:   "/ip/firewall/filter",
		Action: "print",
	}
	if chain != "" {
		cmd.Args = map[string]string{"chain": chain}
	}
	result, err := a.port.ExecuteCommand(ctx, cmd)
	if err != nil {
		return nil, fmt.Errorf("list filter rules: %w", err)
	}
	return result.Data, nil
}

func (a *MikroTikFirewallAdapter) GetFilterRule(ctx context.Context, id string) (map[string]string, error) {
	result, err := a.port.ExecuteCommand(ctx, router.Command{
		Path:   "/ip/firewall/filter",
		Action: "print",
		Args:   map[string]string{".id": id},
	})
	if err != nil {
		return nil, fmt.Errorf("get filter rule: %w", err)
	}
	if len(result.Data) == 0 {
		return nil, fmt.Errorf("filter rule not found: %s", id)
	}
	return result.Data[0], nil
}

func (a *MikroTikFirewallAdapter) CreateFilterRule(ctx context.Context, args map[string]string) (string, error) {
	result, err := a.port.ExecuteCommand(ctx, router.Command{
		Path:   "/ip/firewall/filter",
		Action: "add",
		Args:   args,
	})
	if err != nil {
		return "", fmt.Errorf("create filter rule: %w", err)
	}
	return resultID(result), nil
}

func (a *MikroTikFirewallAdapter) UpdateFilterRule(ctx context.Context, id string, args map[string]string) error {
	_, err := a.port.ExecuteCommand(ctx, router.Command{
		Path:   "/ip/firewall/filter",
		Action: "set",
		ID:     id,
		Args:   args,
	})
	if err != nil {
		return fmt.Errorf("update filter rule: %w", err)
	}
	return nil
}

func (a *MikroTikFirewallAdapter) DeleteFilterRule(ctx context.Context, id string) error {
	_, err := a.port.ExecuteCommand(ctx, router.Command{
		Path:   "/ip/firewall/filter",
		Action: "remove",
		ID:     id,
	})
	if err != nil {
		return fmt.Errorf("delete filter rule: %w", err)
	}
	return nil
}

func (a *MikroTikFirewallAdapter) MoveFilterRule(ctx context.Context, id string, destination string) error {
	_, err := a.port.ExecuteCommand(ctx, router.Command{
		Path:   "/ip/firewall/filter",
		Action: "move",
		Args: map[string]string{
			".id":         id,
			"destination": destination,
		},
	})
	if err != nil {
		return fmt.Errorf("move filter rule: %w", err)
	}
	return nil
}

func (a *MikroTikFirewallAdapter) ListNATRules(ctx context.Context, chain string) ([]map[string]string, error) {
	cmd := router.Command{
		Path:   "/ip/firewall/nat",
		Action: "print",
	}
	if chain != "" {
		cmd.Args = map[string]string{"chain": chain}
	}
	result, err := a.port.ExecuteCommand(ctx, cmd)
	if err != nil {
		return nil, fmt.Errorf("list nat rules: %w", err)
	}
	return result.Data, nil
}

func (a *MikroTikFirewallAdapter) CreateNATRule(ctx context.Context, args map[string]string) (string, error) {
	result, err := a.port.ExecuteCommand(ctx, router.Command{
		Path:   "/ip/firewall/nat",
		Action: "add",
		Args:   args,
	})
	if err != nil {
		return "", fmt.Errorf("create nat rule: %w", err)
	}
	return resultID(result), nil
}

func (a *MikroTikFirewallAdapter) UpdateNATRule(ctx context.Context, id string, args map[string]string) error {
	_, err := a.port.ExecuteCommand(ctx, router.Command{
		Path:   "/ip/firewall/nat",
		Action: "set",
		ID:     id,
		Args:   args,
	})
	if err != nil {
		return fmt.Errorf("update nat rule: %w", err)
	}
	return nil
}

func (a *MikroTikFirewallAdapter) DeleteNATRule(ctx context.Context, id string) error {
	_, err := a.port.ExecuteCommand(ctx, router.Command{
		Path:   "/ip/firewall/nat",
		Action: "remove",
		ID:     id,
	})
	if err != nil {
		return fmt.Errorf("delete nat rule: %w", err)
	}
	return nil
}

func (a *MikroTikFirewallAdapter) ListAddressLists(ctx context.Context, listName string) ([]map[string]string, error) {
	cmd := router.Command{
		Path:   "/ip/firewall/address-list",
		Action: "print",
	}
	if listName != "" {
		cmd.Args = map[string]string{"list": listName}
	}
	result, err := a.port.ExecuteCommand(ctx, cmd)
	if err != nil {
		return nil, fmt.Errorf("list address lists: %w", err)
	}
	return result.Data, nil
}

func (a *MikroTikFirewallAdapter) CreateAddressListEntry(ctx context.Context, args map[string]string) (string, error) {
	result, err := a.port.ExecuteCommand(ctx, router.Command{
		Path:   "/ip/firewall/address-list",
		Action: "add",
		Args:   args,
	})
	if err != nil {
		return "", fmt.Errorf("create address list entry: %w", err)
	}
	return resultID(result), nil
}

func (a *MikroTikFirewallAdapter) DeleteAddressListEntry(ctx context.Context, id string) error {
	_, err := a.port.ExecuteCommand(ctx, router.Command{
		Path:   "/ip/firewall/address-list",
		Action: "remove",
		ID:     id,
	})
	if err != nil {
		return fmt.Errorf("delete address list entry: %w", err)
	}
	return nil
}

func (a *MikroTikFirewallAdapter) ListMangleRules(ctx context.Context, chain string) ([]map[string]string, error) {
	cmd := router.Command{
		Path:   "/ip/firewall/mangle",
		Action: "print",
	}
	if chain != "" {
		cmd.Args = map[string]string{"chain": chain}
	}
	result, err := a.port.ExecuteCommand(ctx, cmd)
	if err != nil {
		return nil, fmt.Errorf("list mangle rules: %w", err)
	}
	return result.Data, nil
}

func (a *MikroTikFirewallAdapter) CreateMangleRule(ctx context.Context, args map[string]string) (string, error) {
	result, err := a.port.ExecuteCommand(ctx, router.Command{
		Path:   "/ip/firewall/mangle",
		Action: "add",
		Args:   args,
	})
	if err != nil {
		return "", fmt.Errorf("create mangle rule: %w", err)
	}
	return resultID(result), nil
}

func (a *MikroTikFirewallAdapter) UpdateMangleRule(ctx context.Context, id string, args map[string]string) error {
	_, err := a.port.ExecuteCommand(ctx, router.Command{
		Path:   "/ip/firewall/mangle",
		Action: "set",
		ID:     id,
		Args:   args,
	})
	if err != nil {
		return fmt.Errorf("update mangle rule: %w", err)
	}
	return nil
}

func (a *MikroTikFirewallAdapter) DeleteMangleRule(ctx context.Context, id string) error {
	_, err := a.port.ExecuteCommand(ctx, router.Command{
		Path:   "/ip/firewall/mangle",
		Action: "remove",
		ID:     id,
	})
	if err != nil {
		return fmt.Errorf("delete mangle rule: %w", err)
	}
	return nil
}
