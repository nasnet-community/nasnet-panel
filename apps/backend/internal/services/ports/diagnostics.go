package ports

import (
	"context"
)

// DiagnosticsAdapter provides diagnostic and troubleshooting operations.
// Implementations translate these calls into protocol-specific commands
// (e.g., RouterOS /tool/ping, /tool/traceroute, /tool/dns-lookup).
type DiagnosticsAdapter interface {
	// Ping performs a ping test to a destination address.
	Ping(ctx context.Context, address string, count int) ([]map[string]string, error)

	// Traceroute performs a traceroute to a destination.
	Traceroute(ctx context.Context, address string, maxHops int) ([]map[string]string, error)

	// DNSLookup performs a DNS lookup for a hostname.
	DNSLookup(ctx context.Context, name string, recordType string) ([]map[string]string, error)

	// GetSystemResource retrieves system resource usage (CPU, memory, disk).
	GetSystemResource(ctx context.Context) (map[string]string, error)

	// GetSystemHealth retrieves hardware health (temperature, voltage, etc.).
	GetSystemHealth(ctx context.Context) (map[string]string, error)

	// GetLogs retrieves system log entries with optional filters.
	GetLogs(ctx context.Context, topic string, limit int) ([]map[string]string, error)
}
