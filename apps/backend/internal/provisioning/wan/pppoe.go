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
//	/interface/pppoe-client/add name=pppoe-client-ISP1 interface=ether1 user=username password=password
//	  dial-on-demand=yes add-default-route=no allow=chap,pap,mschap1,mschap2 disabled=no
//
// Matching TS PPPOEClient behavior: add-default-route=no, routes managed externally.
// Interface naming uses "pppoe-client-<name>" prefix matching TS convention.
func (s *Service) provisionPPPoE(
	ctx context.Context,
	link types.WANLinkConfig,
	comment string,
) (*ProvisionResult, error) {

	pppoe := link.ConnectionConfig.PPPoE
	iface := link.InterfaceConfig.InterfaceName
	// TS names it "pppoe-client-<name>" (WANConnectionUtils.ts PPPOEClient)
	pppoeIfName := fmt.Sprintf("pppoe-client-%s", link.Name)

	// Create PPPoE client interface matching TS PPPOEClient() behavior
	args := map[string]string{
		"name":              pppoeIfName,
		"interface":         iface,
		"user":              pppoe.Username,
		"password":          pppoe.Password,
		"disabled":          "no",
		"add-default-route": "no",                       // Route managed externally by multiwan/failover
		"dial-on-demand":    "yes",                      // Match TS PPPOEClient setting
		"allow":             "chap,pap,mschap1,mschap2", // Match TS PPPOEClient setting
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
