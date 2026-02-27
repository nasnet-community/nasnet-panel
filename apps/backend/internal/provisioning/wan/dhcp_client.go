package wan

import (
	"context"
	"fmt"

	"backend/internal/provisioning/types"
	"backend/internal/router"
)

// provisionDHCP creates a DHCP client on the WAN interface.
// RouterOS commands:
//
//	/ip/dhcp-client/add interface=<final-iface> add-default-route=no use-peer-dns=no use-peer-ntp=no disabled=no
//
// Matching TS DHCPClient behavior: add-default-route=no, route management is
// handled externally by multiwan/failover routing tables.
//
// The interface used is the final interface after MACVLAN/VLAN transformations
// (e.g., MacVLAN-ether1-WAN1 instead of ether1).
func (s *Service) provisionDHCP(
	ctx context.Context,
	link types.WANLinkConfig,
	comment string,
) (*ProvisionResult, error) {

	// Use the final virtual interface (MACVLAN/VLAN) not the raw physical interface
	iface := GetWANInterface(link)

	// Check for existing DHCP client on this interface
	checkCmd := router.Command{
		Path:   "/ip/dhcp-client/print",
		Action: "print",
		Args: map[string]string{
			"interface": iface,
		},
	}

	checkResult, err := s.routerPort.ExecuteCommand(ctx, checkCmd)
	if err != nil {
		return nil, fmt.Errorf("failed to check existing DHCP client: %w", err)
	}

	// Remove existing if found
	if checkResult.Success && len(checkResult.Data) > 0 {
		for _, item := range checkResult.Data {
			if id, ok := item[".id"]; ok {
				removeCmd := router.Command{
					Path:   "/ip/dhcp-client/remove",
					Action: "remove",
					Args: map[string]string{
						".id": id,
					},
				}

				if _, removeErr := s.routerPort.ExecuteCommand(ctx, removeCmd); removeErr != nil {
					return nil, fmt.Errorf("failed to remove existing DHCP client: %w", removeErr)
				}
			}
		}
	}

	// Add new DHCP client.
	// Use add-default-route=no matching TS behavior — routes are managed externally
	// via per-link routing tables and multiwan/failover logic.
	args := map[string]string{
		"interface":         iface,
		"add-default-route": "no",
		"use-peer-dns":      "no",
		"use-peer-ntp":      "no",
		"disabled":          "no",
		"comment":           comment,
	}

	addCmd := router.Command{
		Path:   "/ip/dhcp-client/add",
		Action: "add",
		Args:   args,
	}

	addResult, err := s.routerPort.ExecuteCommand(ctx, addCmd)
	if err != nil {
		return nil, fmt.Errorf("failed to add DHCP client: %w", err)
	}

	if !addResult.Success {
		return nil, fmt.Errorf("DHCP client creation failed: %w", addResult.Error)
	}

	s.logger.Infow("DHCP client provisioned", "interface", iface, "id", addResult.ID)

	return &ProvisionResult{
		DHCPClientID:  addResult.ID,
		InterfaceName: iface,
	}, nil
}
