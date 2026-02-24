package network

import (
	"context"
	"fmt"

	"backend/internal/router"
)

// createAddressListEntries creates firewall address list entries for a network.
func (s *Service) createAddressListEntries(ctx context.Context, networkName, address, comment string) ([]string, error) {
	var entryIDs []string

	// Create the main network address list entry
	entryID, err := s.createAddressList(ctx, networkName, address, comment)
	if err != nil {
		return nil, fmt.Errorf("failed to create address list entry: %w", err)
	}

	entryIDs = append(entryIDs, entryID)

	s.logger.Infow("address list entries created", "network", networkName, "address", address, "count", len(entryIDs))
	return entryIDs, nil
}

// createAddressList creates a firewall address list entry.
func (s *Service) createAddressList(ctx context.Context, list, address, comment string) (string, error) {
	cmd := router.Command{
		Path:   "/ip/firewall/address-list",
		Action: "add",
		Args: map[string]string{
			"list":    list,
			"address": address,
			"comment": comment,
		},
	}

	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return "", fmt.Errorf("failed to create address list entry for %s: %w", list, err)
	}

	if !result.Success {
		return "", fmt.Errorf("address list creation failed for %s: %w", list, result.Error)
	}

	s.logger.Infow("address list entry created", "list", list, "address", address, "id", result.ID)
	return result.ID, nil
}

// removeAddressListByComment removes address list entries by comment (idempotent cleanup).
func (s *Service) removeAddressListByComment(ctx context.Context, comment string) error {
	return s.removeByComment(ctx, "/ip/firewall/address-list", comment)
}
