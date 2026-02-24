package wan

import (
	"context"
	"fmt"

	"backend/internal/provisioning/types"
	"backend/internal/router"
)

// provisionPPPoE creates a PPPoE client interface for the WAN link.
// RouterOS commands:
//
//	/interface/pppoe-client/add name=pppoe-ISP1 interface=ether1 user=username password=password disabled=no
func (s *Service) provisionPPPoE(
	ctx context.Context,
	link types.WANLinkConfig,
	comment string,
) (*ProvisionResult, error) {

	pppoe := link.ConnectionConfig.PPPoE
	iface := link.InterfaceConfig.InterfaceName
	pppoeIfName := fmt.Sprintf("pppoe-%s", link.Name)

	// Create PPPoE client interface
	args := map[string]string{
		"name":              pppoeIfName,
		"interface":         iface,
		"user":              pppoe.Username,
		"password":          pppoe.Password,
		"disabled":          "no",
		"add-default-route": "yes",
		"use-peer-dns":      "yes",
		"comment":           comment,
	}

	cmd := router.Command{
		Path:   "/interface/pppoe-client/add",
		Action: "add",
		Args:   args,
	}

	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return nil, fmt.Errorf("failed to create PPPoE client: %w", err)
	}

	if !result.Success {
		return nil, fmt.Errorf("PPPoE client creation failed: %w", result.Error)
	}

	s.logger.Infow("PPPoE client provisioned", "name", pppoeIfName, "interface", iface, "id", result.ID)

	return &ProvisionResult{
		InterfaceID:   result.ID,
		InterfaceName: pppoeIfName,
	}, nil
}
