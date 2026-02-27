package wan

import (
	"context"
	"fmt"

	"backend/internal/router"
)

// createRouterVLAN creates a VLAN interface on the router.
func (s *EgressService) createRouterVLAN(ctx context.Context, ifaceName string, vlanID int) error {
	_, err := s.routerPort.ExecuteCommand(ctx, router.Command{
		Path:   "/interface/vlan",
		Action: "add",
		Args: map[string]string{
			"name":      ifaceName,
			"vlan-id":   fmt.Sprintf("%d", vlanID),
			"interface": "ether1",
			"comment":   "nnc-egress",
		},
	})
	if err != nil {
		return fmt.Errorf("create router vlan: %w", err)
	}
	return nil
}

// removeRouterVLAN removes a VLAN interface from the router.
// RouterOS /interface/vlan/remove accepts the interface name directly via "numbers".
func (s *EgressService) removeRouterVLAN(ctx context.Context, ifaceName string) error {
	_, err := s.routerPort.ExecuteCommand(ctx, router.Command{
		Path:   "/interface/vlan",
		Action: "remove",
		Args: map[string]string{
			"numbers": ifaceName,
		},
	})
	if err != nil {
		return fmt.Errorf("remove router vlan: %w", err)
	}
	return nil
}

// createRouterIPAddress adds an IP address to a router interface.
func (s *EgressService) createRouterIPAddress(ctx context.Context, ifaceName, address string) error {
	_, err := s.routerPort.ExecuteCommand(ctx, router.Command{
		Path:   "/ip/address",
		Action: "add",
		Args: map[string]string{
			"address":   address,
			"interface": ifaceName,
			"comment":   "nnc-egress",
		},
	})
	if err != nil {
		return fmt.Errorf("create router ip address: %w", err)
	}
	return nil
}

// removeRouterIPAddress finds and removes an IP address entry by interface name.
// MikroTik /ip/address/remove requires the .id, so we print first to find it.
func (s *EgressService) removeRouterIPAddress(ctx context.Context, ifaceName string) error {
	result, err := s.routerPort.ExecuteCommand(ctx, router.Command{
		Path:   "/ip/address",
		Action: "print",
		QueryFilter: map[string]string{
			"interface": ifaceName,
			"comment":   "nnc-egress",
		},
	})
	if err != nil {
		return fmt.Errorf("query IP addresses: %w", err)
	}

	for _, entry := range result.Data {
		id, ok := entry[".id"]
		if !ok {
			continue
		}
		if _, rmErr := s.routerPort.ExecuteCommand(ctx, router.Command{
			Path:   "/ip/address",
			Action: "remove",
			Args:   map[string]string{"numbers": id},
		}); rmErr != nil {
			return fmt.Errorf("remove IP address %s: %w", id, rmErr)
		}
	}
	return nil
}

// createRouterDHCPPool creates a DHCP address pool on the router.
func (s *EgressService) createRouterDHCPPool(ctx context.Context, poolName, ranges string) error {
	_, err := s.routerPort.ExecuteCommand(ctx, router.Command{
		Path:   "/ip/pool",
		Action: "add",
		Args: map[string]string{
			"name":   poolName,
			"ranges": ranges,
		},
	})
	if err != nil {
		return fmt.Errorf("create router dhcp pool: %w", err)
	}
	return nil
}

// removeRouterDHCPPool finds and removes a DHCP pool by name.
// MikroTik /ip/pool/remove requires the .id, so we print first to find it.
func (s *EgressService) removeRouterDHCPPool(ctx context.Context, vlanID int) error {
	poolName := fmt.Sprintf("nnc-egress-%d", vlanID)
	result, err := s.routerPort.ExecuteCommand(ctx, router.Command{
		Path:   "/ip/pool",
		Action: "print",
		QueryFilter: map[string]string{
			"name": poolName,
		},
	})
	if err != nil {
		return fmt.Errorf("query DHCP pool: %w", err)
	}

	for _, entry := range result.Data {
		id, ok := entry[".id"]
		if !ok {
			continue
		}
		if _, rmErr := s.routerPort.ExecuteCommand(ctx, router.Command{
			Path:   "/ip/pool",
			Action: "remove",
			Args:   map[string]string{"numbers": id},
		}); rmErr != nil {
			return fmt.Errorf("remove DHCP pool %s: %w", id, rmErr)
		}
	}
	return nil
}

// createRouterDHCPServer creates a DHCP server on the router.
func (s *EgressService) createRouterDHCPServer(ctx context.Context, ifaceName, poolName string, vlanID int) error {
	serverName := fmt.Sprintf("nnc-egress-%d", vlanID)
	_, err := s.routerPort.ExecuteCommand(ctx, router.Command{
		Path:   "/ip/dhcp-server",
		Action: "add",
		Args: map[string]string{
			"name":         serverName,
			"interface":    ifaceName,
			"address-pool": poolName,
			"comment":      "nnc-egress",
		},
	})
	if err != nil {
		return fmt.Errorf("create router dhcp server: %w", err)
	}
	return nil
}

// removeRouterDHCPServer finds and removes a DHCP server by name.
// MikroTik /ip/dhcp-server/remove requires the .id, so we print first to find it.
func (s *EgressService) removeRouterDHCPServer(ctx context.Context, vlanID int) error {
	serverName := fmt.Sprintf("nnc-egress-%d", vlanID)
	result, err := s.routerPort.ExecuteCommand(ctx, router.Command{
		Path:   "/ip/dhcp-server",
		Action: "print",
		QueryFilter: map[string]string{
			"name": serverName,
		},
	})
	if err != nil {
		return fmt.Errorf("query DHCP server: %w", err)
	}

	for _, entry := range result.Data {
		id, ok := entry[".id"]
		if !ok {
			continue
		}
		if _, rmErr := s.routerPort.ExecuteCommand(ctx, router.Command{
			Path:   "/ip/dhcp-server",
			Action: "remove",
			Args:   map[string]string{"numbers": id},
		}); rmErr != nil {
			return fmt.Errorf("remove DHCP server %s: %w", id, rmErr)
		}
	}
	return nil
}

// createRouterDHCPNetwork creates a DHCP network on the router.
func (s *EgressService) createRouterDHCPNetwork(ctx context.Context, network, gateway string, _ int) error {
	_, err := s.routerPort.ExecuteCommand(ctx, router.Command{
		Path:   "/ip/dhcp-server/network",
		Action: "add",
		Args: map[string]string{
			"address": network,
			"gateway": gateway,
			"comment": "nnc-egress",
		},
	})
	if err != nil {
		return fmt.Errorf("create router dhcp network: %w", err)
	}
	return nil
}

// removeRouterDHCPNetwork finds and removes a DHCP network by address.
// MikroTik /ip/dhcp-server/network/remove requires the .id, so we print first.
func (s *EgressService) removeRouterDHCPNetwork(ctx context.Context, vlanID int) error {
	network := fmt.Sprintf("10.99.%d.0/24", vlanID)
	result, err := s.routerPort.ExecuteCommand(ctx, router.Command{
		Path:   "/ip/dhcp-server/network",
		Action: "print",
		QueryFilter: map[string]string{
			"address": network,
		},
	})
	if err != nil {
		return fmt.Errorf("query DHCP network: %w", err)
	}

	for _, entry := range result.Data {
		id, ok := entry[".id"]
		if !ok {
			continue
		}
		if _, rmErr := s.routerPort.ExecuteCommand(ctx, router.Command{
			Path:   "/ip/dhcp-server/network",
			Action: "remove",
			Args:   map[string]string{"numbers": id},
		}); rmErr != nil {
			return fmt.Errorf("remove DHCP network %s: %w", id, rmErr)
		}
	}
	return nil
}
