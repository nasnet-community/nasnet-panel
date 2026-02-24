package vpnclient

import (
	"context"
	"fmt"
	"strconv"

	"backend/internal/provisioning/types"
	"backend/internal/router"
)

// boolToYesNo converts a boolean to RouterOS "yes"/"no" string.
func boolToYesNo(b bool) string {
	if b {
		return boolYes
	}
	return "no"
}

// ProvisionOpenVPN provisions an OpenVPN client on the router.
//
// This creates 5 ordered RouterOS resources:
//  1. /interface/ovpn-client          - OpenVPN interface
//  2. /interface/list/member          - Add to interface lists (VPN-WAN)
//  3. /routing/table + /ip/route      - Routing table with default route
//  4. /ip/firewall/address-list       - VPN endpoint address list entry
//
// On failure at any step, previously created resources are rolled back.
func (s *Service) ProvisionOpenVPN( //nolint:dupl // each VPN protocol has distinct config despite similar structure
	ctx context.Context,
	routerID string,
	sessionID string,
	cfg types.OpenVpnClientConfig,
) (*ProvisionResult, error) {

	comment := "nnc-provisioned-" + sessionID
	ifName := fmt.Sprintf("ovpn-client-%s", cfg.Name)

	result := &ProvisionResult{
		RouterResourceIDs: make(map[string]string),
		InterfaceName:     ifName,
		GeneratedFields:   make(map[string]string),
	}

	// Step 1: Create OpenVPN interface
	ovpnID, err := s.createOpenVPNInterface(ctx, ifName, cfg, comment)
	if err != nil {
		return nil, fmt.Errorf("step 1 (create interface) failed: %w", err)
	}
	result.RouterResourceIDs["/interface/ovpn-client"] = ovpnID
	s.logger.Infow("OpenVPN interface created", "name", ifName, "id", ovpnID)

	// Step 2: Add to interface lists (VPN-WAN for routing)
	listID, err := s.addToInterfaceList(ctx, ifName, comment)
	if err != nil {
		// Non-critical: log and continue
		s.logger.Warnw("failed to add to interface list, continuing", "error", err)
	} else {
		result.RouterResourceIDs["/interface/list/member"] = listID
	}

	// Step 3: Create routing table and default route
	tableID, routeID, err := s.createRoutingTableAndRoute(ctx, cfg.Name, ifName, comment)
	if err != nil {
		s.rollbackOpenVPN(ctx, result)
		return nil, fmt.Errorf("step 3 (create routing) failed: %w", err)
	}
	result.RouterResourceIDs["/routing/table"] = tableID
	result.RouterResourceIDs["/ip/route"] = routeID

	// Step 4: Add VPN endpoint to address list (for VPN endpoint routing)
	addrListID, err := s.addEndpointToAddressList(ctx, cfg.Server.Address, comment)
	if err != nil {
		// Non-critical: log and continue
		s.logger.Warnw("failed to add endpoint to address list, continuing", "error", err)
	} else {
		result.RouterResourceIDs["/ip/firewall/address-list"] = addrListID
	}

	s.logger.Infow("OpenVPN client provisioned successfully",
		"name", cfg.Name,
		"interface", ifName,
		"resources", len(result.RouterResourceIDs),
	)

	return result, nil
}

// createOpenVPNInterface creates the OpenVPN interface on the router.
func (s *Service) createOpenVPNInterface(
	ctx context.Context,
	ifName string,
	cfg types.OpenVpnClientConfig,
	comment string,
) (string, error) {

	args := map[string]string{
		"name":       ifName,
		"connect-to": cfg.Server.Address,
		"user":       cfg.Credentials.Username,
		"password":   cfg.Credentials.Password,
		"protocol":   string(cfg.Protocol),
		"comment":    comment,
		"disabled":   "no",
	}

	// Set port if non-zero
	if cfg.Server.Port > 0 {
		args["port"] = strconv.Itoa(cfg.Server.Port)
	}

	// Set mode if provided (ip mode vs ethernet mode)
	if cfg.Mode != "" {
		args["mode"] = string(cfg.Mode)
	}

	// Set auth digest algorithm if provided
	if cfg.Auth != nil && *cfg.Auth != "" {
		args["auth"] = string(*cfg.Auth)
	}

	// Set cipher algorithm if provided
	if cfg.Cipher != nil && *cfg.Cipher != "" {
		args["cipher"] = string(*cfg.Cipher)
	}

	// Set TLS version if provided
	if cfg.TLSVersion != nil && *cfg.TLSVersion != "" {
		args["tls-version"] = string(*cfg.TLSVersion)
	}

	// Set verify server certificate if provided
	if cfg.VerifyServerCertificate != nil {
		args["verify-server-certificate"] = boolToYesNo(*cfg.VerifyServerCertificate)
	}

	// Set add-default-route based on RouteNoPull (inverse logic)
	addRoute := boolYes
	if cfg.RouteNoPull != nil && *cfg.RouteNoPull {
		addRoute = "no"
	}
	args["add-default-route"] = addRoute

	cmd := router.Command{
		Path:   "/interface/ovpn-client",
		Action: "add",
		Args:   args,
	}

	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return "", fmt.Errorf("failed to create OpenVPN interface: %w", err)
	}
	if !result.Success {
		return "", fmt.Errorf("OpenVPN interface creation failed: %w", result.Error)
	}

	return result.ID, nil
}

// rollbackOpenVPN removes all created resources on provisioning failure.
func (s *Service) rollbackOpenVPN(
	ctx context.Context,
	result *ProvisionResult,
) {

	s.logger.Warnw("rolling back OpenVPN provisioning",
		"interface", result.InterfaceName,
		"resources", len(result.RouterResourceIDs),
	)

	if err := s.RemoveVPNClient(ctx, result); err != nil {
		s.logger.Errorw("rollback failed", "error", err)
	}
}
