package dns

import (
	"context"
	"fmt"
	"strings"
)

// resolveServer determines which DNS server to use for the lookup.
// If input.Server is provided, uses that.
// Otherwise, retrieves the router's configured primary DNS server.
// Returns empty string if no valid server can be resolved.
func (s *Service) resolveServer(ctx context.Context, input *LookupInput) (string, error) {
	// Validate input
	if input == nil {
		return "", fmt.Errorf("lookup input cannot be nil")
	}

	// Use explicit server if provided
	if input.Server != nil && *input.Server != "" {
		server := strings.TrimSpace(*input.Server)
		if server == "" {
			return "", fmt.Errorf("DNS server address is empty")
		}
		return server, nil
	}

	// Get router's configured DNS servers
	servers, err := s.GetConfiguredServers(ctx, input.DeviceId)
	if err != nil {
		return "", fmt.Errorf("failed to get DNS servers: %w", err)
	}

	// Validate servers object
	if servers == nil {
		return "", fmt.Errorf("no DNS servers configured on router")
	}

	// Use primary DNS server
	primary := strings.TrimSpace(servers.Primary)
	if primary == "" {
		return "", fmt.Errorf("no DNS server configured on router")
	}

	return primary, nil
}
