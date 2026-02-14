package ports

import (
	"context"
)

// FirewallAdapter provides firewall management operations.
// Implementations translate these calls into protocol-specific commands
// (e.g., RouterOS /ip/firewall/filter/*, /ip/firewall/nat/*,
// /ip/firewall/address-list/*).
type FirewallAdapter interface {
	// ListFilterRules retrieves firewall filter rules for a given chain.
	ListFilterRules(ctx context.Context, chain string) ([]map[string]string, error)

	// GetFilterRule retrieves a single filter rule by ID.
	GetFilterRule(ctx context.Context, id string) (map[string]string, error)

	// CreateFilterRule creates a new firewall filter rule.
	CreateFilterRule(ctx context.Context, args map[string]string) (string, error)

	// UpdateFilterRule updates an existing filter rule.
	UpdateFilterRule(ctx context.Context, id string, args map[string]string) error

	// DeleteFilterRule removes a filter rule by ID.
	DeleteFilterRule(ctx context.Context, id string) error

	// MoveFilterRule moves a filter rule to a new position.
	MoveFilterRule(ctx context.Context, id string, destination string) error

	// ListNATRules retrieves NAT rules for a given chain (srcnat/dstnat).
	ListNATRules(ctx context.Context, chain string) ([]map[string]string, error)

	// CreateNATRule creates a new NAT rule.
	CreateNATRule(ctx context.Context, args map[string]string) (string, error)

	// UpdateNATRule updates an existing NAT rule.
	UpdateNATRule(ctx context.Context, id string, args map[string]string) error

	// DeleteNATRule removes a NAT rule by ID.
	DeleteNATRule(ctx context.Context, id string) error

	// ListAddressLists retrieves address list entries with optional name filter.
	ListAddressLists(ctx context.Context, listName string) ([]map[string]string, error)

	// CreateAddressListEntry adds an entry to an address list.
	CreateAddressListEntry(ctx context.Context, args map[string]string) (string, error)

	// DeleteAddressListEntry removes an address list entry by ID.
	DeleteAddressListEntry(ctx context.Context, id string) error

	// ListMangleRules retrieves mangle rules for a given chain.
	ListMangleRules(ctx context.Context, chain string) ([]map[string]string, error)

	// CreateMangleRule creates a new mangle rule.
	CreateMangleRule(ctx context.Context, args map[string]string) (string, error)

	// UpdateMangleRule updates an existing mangle rule.
	UpdateMangleRule(ctx context.Context, id string, args map[string]string) error

	// DeleteMangleRule removes a mangle rule by ID.
	DeleteMangleRule(ctx context.Context, id string) error
}
