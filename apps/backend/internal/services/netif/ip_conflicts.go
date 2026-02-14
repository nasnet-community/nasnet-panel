package netif

import (
	"context"
	"fmt"
	"net"
	"strings"

	"backend/internal/router"
)

// CheckConflict checks for IP address conflicts.
func (s *IPAddressService) CheckConflict(
	ctx context.Context,
	routerID, address string,
	interfaceName *string,
	excludeID *string,
) (*ConflictResult, error) {
	ip, network, err := net.ParseCIDR(address)
	if err != nil {
		return nil, fmt.Errorf("invalid CIDR: %w", err)
	}

	existingIPs, err := s.ListIPAddresses(ctx, routerID, nil)
	if err != nil {
		return nil, err
	}

	conflicts := []IPConflict{}

	for _, existing := range existingIPs {
		if excludeID != nil && existing.ID == *excludeID {
			continue
		}
		if existing.Dynamic {
			continue
		}

		existingIP, existingNet, err := net.ParseCIDR(existing.Address)
		if err != nil {
			continue
		}

		if ip.Equal(existingIP) && (interfaceName == nil || existing.Interface != *interfaceName) {
			conflicts = append(conflicts, IPConflict{
				ID:           existing.ID,
				Address:      existing.Address,
				Interface:    existing.Interface,
				ConflictType: "EXACT",
				Explanation:  fmt.Sprintf("IP %s already assigned to interface %s", ip.String(), existing.Interface),
			})
			continue
		}

		if network.Contains(existingIP) || existingNet.Contains(ip) {
			if interfaceName == nil || existing.Interface != *interfaceName {
				conflicts = append(conflicts, IPConflict{
					ID:           existing.ID,
					Address:      existing.Address,
					Interface:    existing.Interface,
					ConflictType: "SUBNET_OVERLAP",
					Explanation:  fmt.Sprintf("Subnet overlaps with %s on interface %s", existing.Address, existing.Interface),
				})
			}
		}

		broadcast := GetBroadcast(network)
		if ip.Equal(broadcast) {
			conflicts = append(conflicts, IPConflict{
				ID:           existing.ID,
				Address:      existing.Address,
				Interface:    existing.Interface,
				ConflictType: "BROADCAST",
				Explanation:  "IP is the broadcast address of the subnet",
			})
		}

		if ip.Equal(network.IP) {
			conflicts = append(conflicts, IPConflict{
				ID:           existing.ID,
				Address:      existing.Address,
				Interface:    existing.Interface,
				ConflictType: "NETWORK",
				Explanation:  "IP is the network address (not usable for hosts)",
			})
		}
	}

	message := "No conflicts detected"
	if len(conflicts) > 0 {
		message = fmt.Sprintf("Found %d conflict(s)", len(conflicts))
	}

	return &ConflictResult{
		HasConflict: len(conflicts) > 0,
		Conflicts:   conflicts,
		Message:     message,
	}, nil
}

// GetDependencies checks what depends on an IP address.
func (s *IPAddressService) GetDependencies(
	ctx context.Context,
	routerID, ipID string,
) (*DependencyResult, error) {
	ipAddr, err := s.GetIPAddress(ctx, routerID, ipID)
	if err != nil {
		return nil, err
	}

	ip := strings.Split(ipAddr.Address, "/")[0]

	result := &DependencyResult{
		IPAddressID:   ipID,
		DHCPServers:   []DHCPServerInfo{},
		Routes:        []RouteInfo{},
		NATRules:      []NATRuleInfo{},
		FirewallRules: []FirewallRuleInfo{},
	}

	dhcpServers, err := s.fetchDHCPServers(ctx, routerID)
	if err == nil {
		for _, dhcp := range dhcpServers {
			if dhcp.Gateway == ip {
				result.DHCPServers = append(result.DHCPServers, dhcp)
			}
		}
	}

	routes, err := s.fetchRoutes(ctx, routerID)
	if err == nil {
		for _, route := range routes {
			if route.Gateway == ip {
				result.Routes = append(result.Routes, route)
			}
		}
	}

	natRules, err := s.fetchNATRules(ctx, routerID)
	if err == nil {
		for _, nat := range natRules {
			if containsIP(nat.SrcAddress, ip) || containsIP(nat.DstAddress, ip) || containsIP(nat.ToAddress, ip) {
				result.NATRules = append(result.NATRules, nat)
			}
		}
	}

	firewallRules, err := s.fetchFirewallRules(ctx, routerID)
	if err == nil {
		for _, fw := range firewallRules {
			if containsIP(fw.SrcAddress, ip) || containsIP(fw.DstAddress, ip) {
				result.FirewallRules = append(result.FirewallRules, fw)
			}
		}
	}

	result.HasDependencies = len(result.DHCPServers) > 0 ||
		len(result.Routes) > 0 ||
		len(result.NATRules) > 0 ||
		len(result.FirewallRules) > 0

	return result, nil
}

func (s *IPAddressService) fetchDHCPServers(ctx context.Context, routerID string) ([]DHCPServerInfo, error) {
	cmd := router.Command{
		Path:   "/ip/dhcp-server/network",
		Action: "print",
	}
	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return nil, err
	}
	servers := make([]DHCPServerInfo, 0)
	for _, data := range result.Data {
		servers = append(servers, DHCPServerInfo{
			ID:        data[".id"],
			Name:      data["name"],
			Interface: data["interface"],
			Gateway:   data["gateway"],
			Disabled:  data["disabled"] == "true",
		})
	}
	return servers, nil
}

func (s *IPAddressService) fetchRoutes(ctx context.Context, routerID string) ([]RouteInfo, error) {
	cmd := router.Command{
		Path:   "/ip/route",
		Action: "print",
	}
	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return nil, err
	}
	routes := make([]RouteInfo, 0)
	for _, data := range result.Data {
		routes = append(routes, RouteInfo{
			ID:          data[".id"],
			Destination: data["dst-address"],
			Gateway:     data["gateway"],
			Interface:   data["interface"],
			Active:      data["active"] == "true",
		})
	}
	return routes, nil
}

func (s *IPAddressService) fetchNATRules(ctx context.Context, routerID string) ([]NATRuleInfo, error) {
	cmd := router.Command{
		Path:   "/ip/firewall/nat",
		Action: "print",
	}
	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return nil, err
	}
	rules := make([]NATRuleInfo, 0)
	for _, data := range result.Data {
		rules = append(rules, NATRuleInfo{
			ID:         data[".id"],
			Chain:      data["chain"],
			Action:     data["action"],
			SrcAddress: data["src-address"],
			DstAddress: data["dst-address"],
			ToAddress:  data["to-address"],
			Disabled:   data["disabled"] == "true",
		})
	}
	return rules, nil
}

func (s *IPAddressService) fetchFirewallRules(ctx context.Context, routerID string) ([]FirewallRuleInfo, error) {
	cmd := router.Command{
		Path:   "/ip/firewall/filter",
		Action: "print",
	}
	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return nil, err
	}
	rules := make([]FirewallRuleInfo, 0)
	for _, data := range result.Data {
		rules = append(rules, FirewallRuleInfo{
			ID:           data[".id"],
			Chain:        data["chain"],
			Action:       data["action"],
			SrcAddress:   data["src-address"],
			DstAddress:   data["dst-address"],
			InInterface:  data["in-interface"],
			OutInterface: data["out-interface"],
			Disabled:     data["disabled"] == "true",
		})
	}
	return rules, nil
}
