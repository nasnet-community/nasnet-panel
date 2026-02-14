package ports

import (
	"context"
)

// RouteAdapter provides IP route management operations.
// Implementations translate these calls into protocol-specific commands
// (e.g., RouterOS /ip/route/*).
type RouteAdapter interface {
	// ListRoutes retrieves all IP routes with optional filters.
	// Filters may include routing-table, static/dynamic/connected/bgp/ospf flags.
	ListRoutes(ctx context.Context, filters map[string]string) ([]map[string]string, error)

	// GetRoute retrieves a single route by its RouterOS ID.
	GetRoute(ctx context.Context, id string) (map[string]string, error)

	// CreateRoute creates a new static route.
	CreateRoute(ctx context.Context, args map[string]string) (string, error)

	// UpdateRoute updates an existing route.
	UpdateRoute(ctx context.Context, id string, args map[string]string) error

	// DeleteRoute removes a route by ID.
	DeleteRoute(ctx context.Context, id string) error

	// PingAddress performs a ping to check gateway/destination reachability.
	// Returns ping result data (avg-rtt, packet-loss, etc.).
	PingAddress(ctx context.Context, address string, count int) (map[string]string, error)

	// ListTunnelInterfaces retrieves VPN/tunnel interfaces of a given type.
	// tunnelType is one of: wireguard, ovpn, l2tp, pptp, sstp, ipsec-peer, gre, eoip.
	ListTunnelInterfaces(ctx context.Context, tunnelType string) ([]map[string]string, error)
}
