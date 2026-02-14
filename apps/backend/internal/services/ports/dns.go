package ports

import (
	"context"
)

// DNSAdapter provides DNS server management operations.
// Implementations translate these calls into protocol-specific commands
// (e.g., RouterOS /ip/dns/*, /ip/dns/static/*).
type DNSAdapter interface {
	// GetDNSConfig retrieves the DNS server configuration.
	GetDNSConfig(ctx context.Context) (map[string]string, error)

	// SetDNSConfig updates the DNS server configuration.
	SetDNSConfig(ctx context.Context, args map[string]string) error

	// ListStaticDNS retrieves all static DNS entries.
	ListStaticDNS(ctx context.Context) ([]map[string]string, error)

	// CreateStaticDNS creates a new static DNS entry.
	CreateStaticDNS(ctx context.Context, args map[string]string) (string, error)

	// UpdateStaticDNS updates an existing static DNS entry.
	UpdateStaticDNS(ctx context.Context, id string, args map[string]string) error

	// DeleteStaticDNS removes a static DNS entry by ID.
	DeleteStaticDNS(ctx context.Context, id string) error

	// GetDNSCache retrieves DNS cache entries.
	GetDNSCache(ctx context.Context) ([]map[string]string, error)

	// FlushDNSCache clears the DNS cache.
	FlushDNSCache(ctx context.Context) error
}
