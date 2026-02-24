package wan

import (
	"context"
	"fmt"

	"backend/internal/provisioning/types"
	"backend/internal/router"
)

// provisionLTE configures an LTE modem WAN interface.
// RouterOS commands:
//
//	/interface/lte/apn/add name=apn-ISP apn=internet
//	/interface/lte/set [find] apn-profiles=apn-ISP
func (s *Service) provisionLTE(
	ctx context.Context,
	link types.WANLinkConfig,
	comment string,
) (*ProvisionResult, error) {

	lte := link.ConnectionConfig.LTESettings
	iface := link.InterfaceConfig.InterfaceName

	// 1. Create APN profile if APN is specified
	var apnID string
	if lte.APN != "" {
		apnName := fmt.Sprintf("apn-%s", link.Name)
		apnArgs := map[string]string{
			"name":    apnName,
			"apn":     lte.APN,
			"comment": comment,
		}

		apnCmd := router.Command{
			Path:   "/interface/lte/apn/add",
			Action: "add",
			Args:   apnArgs,
		}

		apnResult, err := s.routerPort.ExecuteCommand(ctx, apnCmd)
		if err != nil {
			return nil, fmt.Errorf("failed to create APN profile: %w", err)
		}

		if !apnResult.Success {
			return nil, fmt.Errorf("APN profile creation failed: %w", apnResult.Error)
		}

		apnID = apnResult.ID

		// 2. Set the APN profile on the LTE interface
		setCmd := router.Command{
			Path:   "/interface/lte/set",
			Action: "set",
			Args: map[string]string{
				"numbers":      iface,
				"apn-profiles": apnName,
			},
		}

		if _, setErr := s.routerPort.ExecuteCommand(ctx, setCmd); setErr != nil {
			s.logger.Warnw("failed to set APN profile on LTE interface", "error", setErr)
		}
	}

	// 3. Enable the LTE interface
	enableCmd := router.Command{
		Path:   "/interface/lte/set",
		Action: "set",
		Args: map[string]string{
			"numbers":  iface,
			"disabled": "no",
		},
	}

	if _, enableErr := s.routerPort.ExecuteCommand(ctx, enableCmd); enableErr != nil {
		s.logger.Warnw("failed to enable LTE interface", "error", enableErr)
	}

	s.logger.Infow("LTE interface provisioned", "interface", iface, "apn", lte.APN, "apnID", apnID)

	return &ProvisionResult{
		InterfaceID:   apnID,
		InterfaceName: iface,
	}, nil
}
