package dns

import (
	"context"
	"fmt"
)

// resolveServer determines which DNS server to use for the lookup.
// If input.Server is provided, uses that.
// Otherwise, retrieves the router's configured primary DNS server.
func (s *Service) resolveServer(ctx context.Context, input *DnsLookupInput) (string, error) {
	// Use explicit server if provided
	if input.Server != nil && *input.Server != "" {
		return *input.Server, nil
	}

	// Get router's configured DNS servers
	servers, err := s.GetConfiguredServers(ctx, input.DeviceId)
	if err != nil {
		return "", fmt.Errorf("failed to get DNS servers: %w", err)
	}

	// Use primary DNS server
	if servers.Primary == "" {
		return "", fmt.Errorf("no DNS server configured on router")
	}

	return servers.Primary, nil
}
