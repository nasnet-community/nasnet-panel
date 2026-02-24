package network

import (
	"context"
	"fmt"
	"strings"

	"backend/internal/router"
)

// createPool creates an IP address pool.
func (s *Service) createPool(ctx context.Context, name, ranges, comment string) (string, error) {
	cmd := router.Command{
		Path:   "/ip/pool",
		Action: "add",
		Args: map[string]string{
			"name":    name,
			"ranges":  ranges,
			"comment": comment,
		},
	}

	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return "", fmt.Errorf("failed to create pool %s: %w", name, err)
	}

	if !result.Success {
		return "", fmt.Errorf("pool creation failed for %s: %w", name, result.Error)
	}

	s.logger.Infow("pool created", "name", name, "ranges", ranges, "id", result.ID)
	return result.ID, nil
}

// createDHCPServer creates a DHCP server.
func (s *Service) createDHCPServer(ctx context.Context, name, iface, pool, leaseTime, comment string) (string, error) {
	args := map[string]string{
		"name":         name,
		"interface":    iface,
		"address-pool": pool,
		"comment":      comment,
	}

	if leaseTime != "" {
		args["lease-time"] = leaseTime
	}

	cmd := router.Command{
		Path:   "/ip/dhcp-server",
		Action: "add",
		Args:   args,
	}

	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return "", fmt.Errorf("failed to create DHCP server %s: %w", name, err)
	}

	if !result.Success {
		return "", fmt.Errorf("DHCP server creation failed for %s: %w", name, result.Error)
	}

	s.logger.Infow("DHCP server created", "name", name, "interface", iface, "id", result.ID)
	return result.ID, nil
}

// createDHCPNetwork creates a DHCP server network configuration.
func (s *Service) createDHCPNetwork(ctx context.Context, address, gateway string, dnsServers []string, comment string) (string, error) {
	args := map[string]string{
		"address": address,
		"gateway": gateway,
		"comment": comment,
	}

	if len(dnsServers) > 0 {
		args["dns-server"] = strings.Join(dnsServers, ",")
	}

	cmd := router.Command{
		Path:   "/ip/dhcp-server/network",
		Action: "add",
		Args:   args,
	}

	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return "", fmt.Errorf("failed to create DHCP network %s: %w", address, err)
	}

	if !result.Success {
		return "", fmt.Errorf("DHCP network creation failed for %s: %w", address, result.Error)
	}

	s.logger.Infow("DHCP network created", "address", address, "gateway", gateway, "id", result.ID)
	return result.ID, nil
}

// addIPAddress assigns an IP address to an interface.
func (s *Service) addIPAddress(ctx context.Context, address, iface, comment string) (string, error) {
	cmd := router.Command{
		Path:   "/ip/address",
		Action: "add",
		Args: map[string]string{
			"address":   address,
			"interface": iface,
			"comment":   comment,
		},
	}

	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return "", fmt.Errorf("failed to add IP address %s to %s: %w", address, iface, err)
	}

	if !result.Success {
		return "", fmt.Errorf("IP address assignment failed for %s: %w", address, result.Error)
	}

	s.logger.Infow("IP address added", "address", address, "interface", iface, "id", result.ID)
	return result.ID, nil
}

// removePoolByComment removes IP pools by comment (idempotent cleanup).
func (s *Service) removePoolByComment(ctx context.Context, comment string) error {
	return s.removeByComment(ctx, "/ip/pool", comment)
}

// removeDHCPServerByComment removes DHCP servers by comment (idempotent cleanup).
func (s *Service) removeDHCPServerByComment(ctx context.Context, comment string) error {
	return s.removeByComment(ctx, "/ip/dhcp-server", comment)
}

// removeDHCPNetworkByComment removes DHCP networks by comment (idempotent cleanup).
func (s *Service) removeDHCPNetworkByComment(ctx context.Context, comment string) error {
	return s.removeByComment(ctx, "/ip/dhcp-server/network", comment)
}

// removeIPAddressByComment removes IP addresses by comment (idempotent cleanup).
func (s *Service) removeIPAddressByComment(ctx context.Context, comment string) error {
	return s.removeByComment(ctx, "/ip/address", comment)
}
