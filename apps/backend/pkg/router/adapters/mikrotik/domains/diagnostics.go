package domains

import (
	"context"
	"fmt"

	"backend/internal/router"
	"backend/internal/services/ports"
)

// Compile-time interface check.
var _ ports.DiagnosticsAdapter = (*MikroTikDiagnosticsAdapter)(nil)

// MikroTikDiagnosticsAdapter implements ports.DiagnosticsAdapter for MikroTik RouterOS.
type MikroTikDiagnosticsAdapter struct {
	port router.RouterPort
}

// NewDiagnosticsAdapter creates a new MikroTik diagnostics adapter.
func NewDiagnosticsAdapter(port router.RouterPort) *MikroTikDiagnosticsAdapter {
	return &MikroTikDiagnosticsAdapter{port: port}
}

func (a *MikroTikDiagnosticsAdapter) Ping(ctx context.Context, address string, count int) ([]map[string]string, error) {
	result, err := a.port.ExecuteCommand(ctx, router.Command{
		Path:   "/tool/ping",
		Action: "execute",
		Args: map[string]string{
			"address": address,
			"count":   fmt.Sprintf("%d", count),
		},
	})
	if err != nil {
		return nil, fmt.Errorf("ping: %w", err)
	}
	return result.Data, nil
}

func (a *MikroTikDiagnosticsAdapter) Traceroute(ctx context.Context, address string, maxHops int) ([]map[string]string, error) {
	args := map[string]string{
		"address": address,
	}
	if maxHops > 0 {
		args["max-hops"] = fmt.Sprintf("%d", maxHops)
	}

	result, err := a.port.ExecuteCommand(ctx, router.Command{
		Path:   "/tool/traceroute",
		Action: "execute",
		Args:   args,
	})
	if err != nil {
		return nil, fmt.Errorf("traceroute: %w", err)
	}
	return result.Data, nil
}

func (a *MikroTikDiagnosticsAdapter) DNSLookup(ctx context.Context, name string, recordType string) ([]map[string]string, error) {
	args := map[string]string{
		"name": name,
	}
	if recordType != "" {
		args["type"] = recordType
	}

	result, err := a.port.ExecuteCommand(ctx, router.Command{
		Path:   "/tool/dns-lookup",
		Action: "execute",
		Args:   args,
	})
	if err != nil {
		return nil, fmt.Errorf("dns lookup: %w", err)
	}
	return result.Data, nil
}

func (a *MikroTikDiagnosticsAdapter) GetSystemResource(ctx context.Context) (map[string]string, error) {
	result, err := a.port.ExecuteCommand(ctx, router.Command{
		Path:   "/system/resource",
		Action: "print",
	})
	if err != nil {
		return nil, fmt.Errorf("get system resource: %w", err)
	}
	if len(result.Data) == 0 {
		return map[string]string{}, nil
	}
	return result.Data[0], nil
}

func (a *MikroTikDiagnosticsAdapter) GetSystemHealth(ctx context.Context) (map[string]string, error) {
	result, err := a.port.ExecuteCommand(ctx, router.Command{
		Path:   "/system/health",
		Action: "print",
	})
	if err != nil {
		return nil, fmt.Errorf("get system health: %w", err)
	}
	if len(result.Data) == 0 {
		return map[string]string{}, nil
	}
	return result.Data[0], nil
}

func (a *MikroTikDiagnosticsAdapter) GetLogs(ctx context.Context, topic string, limit int) ([]map[string]string, error) {
	args := map[string]string{}
	if topic != "" {
		args["topics"] = topic
	}

	result, err := a.port.ExecuteCommand(ctx, router.Command{
		Path:   "/log",
		Action: "print",
		Args:   args,
	})
	if err != nil {
		return nil, fmt.Errorf("get logs: %w", err)
	}

	data := result.Data
	if limit > 0 && len(data) > limit {
		data = data[len(data)-limit:]
	}
	return data, nil
}
