package ports

import (
	"context"
)

// VLANAdapter provides VLAN interface management operations.
// Implementations translate these calls into protocol-specific commands
// (e.g., RouterOS /interface/vlan/* and /interface/bridge/port/*).
type VLANAdapter interface {
	// ListVLANs retrieves all VLAN interfaces with optional filters.
	ListVLANs(ctx context.Context, filters map[string]string) ([]map[string]string, error)

	// GetVLAN retrieves a single VLAN interface by its RouterOS ID.
	GetVLAN(ctx context.Context, id string) (map[string]string, error)

	// CreateVLAN creates a new VLAN interface.
	CreateVLAN(ctx context.Context, args map[string]string) (string, error)

	// UpdateVLAN updates an existing VLAN interface.
	UpdateVLAN(ctx context.Context, id string, args map[string]string) error

	// DeleteVLAN removes a VLAN interface by ID.
	DeleteVLAN(ctx context.Context, id string) error

	// SetBridgePort configures bridge port VLAN settings (PVID, frame-types).
	SetBridgePort(ctx context.Context, id string, args map[string]string) error
}
