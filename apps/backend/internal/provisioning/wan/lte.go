package wan

import (
	"context"
	"fmt"

	"backend/internal/provisioning/types"
	"backend/internal/router"
)

// provisionLTE configures an LTE modem WAN interface.
// RouterOS commands (matches TS LTE() in WANConnectionUtils.ts):
//
//	/interface/lte/set [find default-name=lte1] allow-roaming=yes apn-profiles=<apn>
//	/interface/lte/apn/add add-default-route=no apn=<apn> name=<apn> use-network-apn=yes use-peer-dns=no
func (s *Service) provisionLTE(
	ctx context.Context,
	link types.WANLinkConfig,
	comment string,
) (*ProvisionResult, error) {

	lte := link.ConnectionConfig.LTESettings
	iface := link.InterfaceConfig.InterfaceName

	// 1. Create APN profile matching TS LTE() behavior:
	//    add-default-route=no, use-network-apn=yes, use-peer-dns=no
	var apnID string
	if lte.APN != "" {
		apnArgs := map[string]string{
			"name":              lte.APN, // TS uses APN value as name
			"apn":               lte.APN,
			"add-default-route": "no",  // Match TS: no default route from DHCP
			"use-network-apn":   "yes", // Match TS setting
			"use-peer-dns":      "no",  // Match TS setting
			"comment":           comment,
		}

		apnCmd := router.Command{
			Path:   "/interface/lte/apn",
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

		// 2. Set the APN profile on the LTE interface with allow-roaming=yes
		// Matches TS: set [find default-name=lte1] allow-roaming=yes apn-profiles=<apn>
		setCmd := router.Command{
			Path:   "/interface/lte",
			Action: "set",
			Args: map[string]string{
				"numbers":       iface,
				"apn-profiles":  lte.APN, // Use APN name as profile name (same value)
				"allow-roaming": "yes",   // Match TS setting
			},
		}

		if _, setErr := s.routerPort.ExecuteCommand(ctx, setCmd); setErr != nil {
			s.logger.Warnw("failed to set APN profile on LTE interface", "error", setErr)
		}
	}

	s.logger.Infow("LTE interface provisioned", "interface", iface, "apn", lte.APN, "apnID", apnID)

	return &ProvisionResult{
		InterfaceID:   apnID,
		InterfaceName: iface,
	}, nil
}
