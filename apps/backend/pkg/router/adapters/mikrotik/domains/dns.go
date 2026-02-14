package domains

import (
	"context"
	"fmt"

	"backend/internal/router"
	"backend/internal/services/ports"
)

// Compile-time interface check.
var _ ports.DNSAdapter = (*MikroTikDNSAdapter)(nil)

// MikroTikDNSAdapter implements ports.DNSAdapter for MikroTik RouterOS.
type MikroTikDNSAdapter struct {
	port router.RouterPort
}

// NewDNSAdapter creates a new MikroTik DNS adapter.
func NewDNSAdapter(port router.RouterPort) *MikroTikDNSAdapter {
	return &MikroTikDNSAdapter{port: port}
}

func (a *MikroTikDNSAdapter) GetDNSConfig(ctx context.Context) (map[string]string, error) {
	result, err := a.port.ExecuteCommand(ctx, router.Command{
		Path:   "/ip/dns",
		Action: "print",
	})
	if err != nil {
		return nil, fmt.Errorf("get dns config: %w", err)
	}
	if len(result.Data) == 0 {
		return map[string]string{}, nil
	}
	return result.Data[0], nil
}

func (a *MikroTikDNSAdapter) SetDNSConfig(ctx context.Context, args map[string]string) error {
	_, err := a.port.ExecuteCommand(ctx, router.Command{
		Path:   "/ip/dns",
		Action: "set",
		Args:   args,
	})
	if err != nil {
		return fmt.Errorf("set dns config: %w", err)
	}
	return nil
}

func (a *MikroTikDNSAdapter) ListStaticDNS(ctx context.Context) ([]map[string]string, error) {
	result, err := a.port.ExecuteCommand(ctx, router.Command{
		Path:   "/ip/dns/static",
		Action: "print",
	})
	if err != nil {
		return nil, fmt.Errorf("list static dns: %w", err)
	}
	return result.Data, nil
}

func (a *MikroTikDNSAdapter) CreateStaticDNS(ctx context.Context, args map[string]string) (string, error) {
	result, err := a.port.ExecuteCommand(ctx, router.Command{
		Path:   "/ip/dns/static",
		Action: "add",
		Args:   args,
	})
	if err != nil {
		return "", fmt.Errorf("create static dns: %w", err)
	}
	return resultID(result), nil
}

func (a *MikroTikDNSAdapter) UpdateStaticDNS(ctx context.Context, id string, args map[string]string) error {
	_, err := a.port.ExecuteCommand(ctx, router.Command{
		Path:   "/ip/dns/static",
		Action: "set",
		ID:     id,
		Args:   args,
	})
	if err != nil {
		return fmt.Errorf("update static dns: %w", err)
	}
	return nil
}

func (a *MikroTikDNSAdapter) DeleteStaticDNS(ctx context.Context, id string) error {
	_, err := a.port.ExecuteCommand(ctx, router.Command{
		Path:   "/ip/dns/static",
		Action: "remove",
		ID:     id,
	})
	if err != nil {
		return fmt.Errorf("delete static dns: %w", err)
	}
	return nil
}

func (a *MikroTikDNSAdapter) GetDNSCache(ctx context.Context) ([]map[string]string, error) {
	result, err := a.port.ExecuteCommand(ctx, router.Command{
		Path:   "/ip/dns/cache",
		Action: "print",
	})
	if err != nil {
		return nil, fmt.Errorf("get dns cache: %w", err)
	}
	return result.Data, nil
}

func (a *MikroTikDNSAdapter) FlushDNSCache(ctx context.Context) error {
	_, err := a.port.ExecuteCommand(ctx, router.Command{
		Path:   "/ip/dns/cache",
		Action: "flush",
	})
	if err != nil {
		return fmt.Errorf("flush dns cache: %w", err)
	}
	return nil
}
