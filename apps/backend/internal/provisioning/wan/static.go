package wan

import (
	"context"
	"fmt"

	"backend/internal/provisioning/types"
	"backend/internal/router"
)

// provisionStatic configures a static IP on the WAN interface.
// RouterOS commands:
//
//	/ip/address/add address=203.0.113.5/24 interface=ether1
//	/ip/route/add dst-address=0.0.0.0/0 gateway=203.0.113.1
//	/ip/dns/set servers=8.8.8.8,8.8.4.4
func (s *Service) provisionStatic(
	ctx context.Context,
	link types.WANLinkConfig,
	comment string,
) (*ProvisionResult, error) {

	static := link.ConnectionConfig.Static
	// Use the final virtual interface (MACVLAN/VLAN) not the raw physical interface
	iface := GetWANInterface(link)

	// 1. Add IP address
	ipArgs := map[string]string{
		"address":   fmt.Sprintf("%s/%s", static.IPAddress, static.Subnet),
		"interface": iface,
		"comment":   comment,
	}

	ipCmd := router.Command{
		Path:   "/ip/address/add",
		Action: "add",
		Args:   ipArgs,
	}

	ipResult, err := s.routerPort.ExecuteCommand(ctx, ipCmd)
	if err != nil {
		return nil, fmt.Errorf("failed to add IP address: %w", err)
	}

	if !ipResult.Success {
		return nil, fmt.Errorf("IP address creation failed: %w", ipResult.Error)
	}

	// 2. Add default route
	routeArgs := map[string]string{
		"dst-address": "0.0.0.0/0",
		"gateway":     static.Gateway,
		"comment":     comment,
	}

	routeCmd := router.Command{
		Path:   "/ip/route/add",
		Action: "add",
		Args:   routeArgs,
	}

	routeResult, err := s.routerPort.ExecuteCommand(ctx, routeCmd)
	if err != nil {
		return nil, fmt.Errorf("failed to add default route: %w", err)
	}

	if !routeResult.Success {
		return nil, fmt.Errorf("default route creation failed: %w", routeResult.Error)
	}

	// 3. Set DNS if provided
	if static.DNS != nil && *static.DNS != "" {
		dnsServers := *static.DNS
		dnsCmd := router.Command{
			Path:   "/ip/dns/set",
			Action: "set",
			Args: map[string]string{
				"servers": dnsServers,
			},
		}

		if _, dnsErr := s.routerPort.ExecuteCommand(ctx, dnsCmd); dnsErr != nil {
			s.logger.Warnw("failed to set DNS servers", "error", dnsErr)
		}
	}

	s.logger.Infow(
		"static IP provisioned",
		"interface", iface,
		"address", static.IPAddress,
		"gateway", static.Gateway,
		"ipID", ipResult.ID,
		"routeID", routeResult.ID,
	)

	return &ProvisionResult{
		IPAddressID:   ipResult.ID,
		RouteID:       routeResult.ID,
		InterfaceName: iface,
	}, nil
}
