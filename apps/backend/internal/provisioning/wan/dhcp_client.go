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
//	/ip/dhcp-client/add interface=ether1 add-default-route=yes use-peer-dns=yes disabled=no
func (s *Service) provisionDHCP(
	ctx context.Context,
	link types.WANLinkConfig,
	comment string,
) (*ProvisionResult, error) {

	iface := link.InterfaceConfig.InterfaceName

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

	// Add new DHCP client
	args := map[string]string{
		"interface":         iface,
		"add-default-route": "yes",
		"use-peer-dns":      "yes",
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
