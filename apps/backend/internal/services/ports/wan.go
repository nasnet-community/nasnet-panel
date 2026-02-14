package ports

import (
	"context"
)

// WANAdapter provides WAN interface management operations.
// Implementations translate these calls into protocol-specific commands
// for managing DHCP clients, PPPoE connections, static IP configurations,
// and LTE modem settings.
type WANAdapter interface {
	// ListWANInterfaces retrieves all WAN-facing interfaces.
	ListWANInterfaces(ctx context.Context) ([]map[string]string, error)

	// GetDHCPClient retrieves DHCP client configuration for an interface.
	GetDHCPClient(ctx context.Context, interfaceID string) (map[string]string, error)

	// CreateDHCPClient configures a DHCP client on an interface.
	CreateDHCPClient(ctx context.Context, args map[string]string) (map[string]string, error)

	// RemoveDHCPClient removes DHCP client configuration from an interface.
	RemoveDHCPClient(ctx context.Context, id string) error

	// GetPPPoEClient retrieves PPPoE client configuration for an interface.
	GetPPPoEClient(ctx context.Context, interfaceID string) (map[string]string, error)

	// CreatePPPoEClient configures a PPPoE client on an interface.
	CreatePPPoEClient(ctx context.Context, args map[string]string) (map[string]string, error)

	// RemovePPPoEClient removes PPPoE client configuration from an interface.
	RemovePPPoEClient(ctx context.Context, id string) error

	// CreateStaticIP assigns a static IP address to an interface.
	CreateStaticIP(ctx context.Context, args map[string]string) (map[string]string, error)

	// RemoveIPAddress removes an IP address entry.
	RemoveIPAddress(ctx context.Context, id string) error

	// CreateRoute creates a static route (for static IP gateway).
	CreateRoute(ctx context.Context, args map[string]string) (map[string]string, error)

	// RemoveRoute removes a static route.
	RemoveRoute(ctx context.Context, id string) error

	// ListDefaultRoutes retrieves all default routes (for cleanup during reconfiguration).
	ListDefaultRoutes(ctx context.Context) ([]map[string]string, error)

	// GetLTEModem retrieves LTE modem configuration.
	GetLTEModem(ctx context.Context, interfaceID string) (map[string]string, error)

	// SetLTEModem configures an LTE modem.
	SetLTEModem(ctx context.Context, id string, args map[string]string) error

	// PingGateway performs a ping test to verify gateway reachability.
	PingGateway(ctx context.Context, address string, count int) (map[string]string, error)
}
