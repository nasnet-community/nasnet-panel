package ports

import (
	"context"
)

// InterfaceAdapter provides network interface management operations.
// Implementations translate these calls into protocol-specific commands
// (e.g., RouterOS /interface/print, /interface/set).
type InterfaceAdapter interface {
	// ListInterfaces retrieves all network interfaces with optional type filter.
	ListInterfaces(ctx context.Context, interfaceType string) ([]map[string]string, error)

	// GetInterface retrieves a single interface by ID.
	GetInterface(ctx context.Context, id string) (map[string]string, error)

	// SetInterface updates interface properties.
	SetInterface(ctx context.Context, id string, args map[string]string) error

	// EnableInterface enables a disabled interface.
	EnableInterface(ctx context.Context, id string) error

	// DisableInterface disables an interface.
	DisableInterface(ctx context.Context, id string) error

	// GetInterfaceStats retrieves traffic statistics for an interface.
	GetInterfaceStats(ctx context.Context, interfaceID string) (map[string]string, error)

	// MonitorInterface starts monitoring an interface for real-time updates.
	MonitorInterface(ctx context.Context, id string) (map[string]string, error)
}

// IPAddressAdapter provides IP address management operations.
// Implementations translate these calls into protocol-specific commands
// (e.g., RouterOS /ip/address/*).
type IPAddressAdapter interface {
	// ListIPAddresses retrieves all IP addresses, optionally filtered by interface.
	ListIPAddresses(ctx context.Context, interfaceFilter string) ([]map[string]string, error)

	// GetIPAddress retrieves a single IP address entry by ID.
	GetIPAddress(ctx context.Context, id string) (map[string]string, error)

	// CreateIPAddress creates a new IP address assignment.
	CreateIPAddress(ctx context.Context, args map[string]string) (map[string]string, error)

	// UpdateIPAddress updates an existing IP address entry.
	UpdateIPAddress(ctx context.Context, id string, args map[string]string) error

	// DeleteIPAddress removes an IP address entry.
	DeleteIPAddress(ctx context.Context, id string) error

	// ListDHCPServers retrieves DHCP server configurations (for dependency checks).
	ListDHCPServers(ctx context.Context) ([]map[string]string, error)

	// ListRoutes retrieves IP routes (for dependency checks).
	ListRoutes(ctx context.Context) ([]map[string]string, error)

	// ListNATRules retrieves NAT rules (for dependency checks).
	ListNATRules(ctx context.Context) ([]map[string]string, error)

	// ListFirewallRules retrieves firewall filter rules (for dependency checks).
	ListFirewallRules(ctx context.Context) ([]map[string]string, error)
}
