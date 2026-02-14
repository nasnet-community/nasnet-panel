// Package ports defines domain adapter interfaces for router communication.
// Services depend on these interfaces rather than directly constructing
// router.Command structs, enabling protocol-agnostic business logic.
package ports

import (
	"context"
)

// BridgeAdapter provides bridge management operations on a router.
// Implementations translate these calls into protocol-specific commands
// (e.g., RouterOS REST API /interface/bridge/*).
type BridgeAdapter interface {
	// ListBridges retrieves all bridge interfaces.
	ListBridges(ctx context.Context) ([]map[string]string, error)

	// GetBridge retrieves a single bridge by its RouterOS ID.
	GetBridge(ctx context.Context, id string) (map[string]string, error)

	// CreateBridge creates a new bridge with the given arguments.
	// Returns the created resource data including the assigned ID.
	CreateBridge(ctx context.Context, args map[string]string) (map[string]string, error)

	// UpdateBridge updates an existing bridge.
	UpdateBridge(ctx context.Context, id string, args map[string]string) error

	// DeleteBridge removes a bridge by ID.
	DeleteBridge(ctx context.Context, id string) error

	// ListBridgePorts retrieves all ports for a given bridge.
	ListBridgePorts(ctx context.Context, bridgeID string) ([]map[string]string, error)

	// AddBridgePort adds an interface as a port on a bridge.
	AddBridgePort(ctx context.Context, args map[string]string) (map[string]string, error)

	// UpdateBridgePort updates bridge port settings.
	UpdateBridgePort(ctx context.Context, id string, args map[string]string) error

	// RemoveBridgePort removes a port from a bridge.
	RemoveBridgePort(ctx context.Context, id string) error

	// ListBridgeVlans retrieves all VLAN entries for a bridge.
	ListBridgeVlans(ctx context.Context, bridgeID string) ([]map[string]string, error)

	// CreateBridgeVlan creates a VLAN entry on a bridge.
	CreateBridgeVlan(ctx context.Context, args map[string]string) (map[string]string, error)

	// DeleteBridgeVlan removes a VLAN entry from a bridge.
	DeleteBridgeVlan(ctx context.Context, id string) error

	// GetStpStatus retrieves STP/RSTP status for a bridge.
	GetStpStatus(ctx context.Context, bridgeID string) (map[string]string, error)

	// ListAllInterfaces retrieves all router interfaces (for available interfaces check).
	ListAllInterfaces(ctx context.Context) ([]map[string]string, error)
}
