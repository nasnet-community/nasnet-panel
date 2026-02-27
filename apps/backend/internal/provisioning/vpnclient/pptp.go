package vpnclient

import (
	"context"
	"fmt"
	"strconv"

	"backend/internal/provisioning/types"
	"backend/internal/router"
)

// ProvisionPPTP provisions a PPTP VPN client on the router.
//
// This creates 4 ordered RouterOS resources:
//  1. /interface/pptp-client         - PPTP interface
//  2. /interface/list/member         - Add to interface lists (VPN-WAN)
//  3. /routing/table + /ip/route     - Routing table with default route
//  4. /ip/firewall/address-list      - VPN endpoint address list entry
//
// On failure at any step, previously created resources are rolled back.
func (s *Service) ProvisionPPTP( //nolint:dupl // each VPN protocol has distinct config despite similar structure
	ctx context.Context,
	routerID string,
	sessionID string,
	cfg types.PptpClientConfig,
) (*ProvisionResult, error) {

	comment := "nnc-provisioned-" + sessionID
	ifName := fmt.Sprintf("pptp-client-%s", cfg.Name)

	result := &ProvisionResult{
		RouterResourceIDs: make(map[string]string),
		InterfaceName:     ifName,
		GeneratedFields:   make(map[string]string),
	}

	// Step 1: Create PPTP interface
	pptpID, err := s.createPPTPInterface(ctx, ifName, cfg, comment)
	if err != nil {
		return nil, fmt.Errorf("step 1 (create interface) failed: %w", err)
	}
	result.RouterResourceIDs["/interface/pptp-client"] = pptpID
	s.logger.Infow("PPTP interface created", "name", ifName, "id", pptpID)

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
		s.rollbackPPTP(ctx, result)
		return nil, fmt.Errorf("step 3 (create routing) failed: %w", err)
	}
	result.RouterResourceIDs["/routing/table"] = tableID
	result.RouterResourceIDs["/ip/route"] = routeID

	// Step 4: Add VPN endpoint to address list (for VPN endpoint routing)
	addrListID, err := s.addEndpointToAddressList(ctx, cfg.ConnectTo.Address, comment)
	if err != nil {
		// Non-critical: log and continue
		s.logger.Warnw("failed to add endpoint to address list, continuing", "error", err)
	} else {
		result.RouterResourceIDs["/ip/firewall/address-list"] = addrListID
	}

	s.logger.Infow("PPTP client provisioned successfully",
		"name", cfg.Name,
		"interface", ifName,
		"resources", len(result.RouterResourceIDs),
	)

	return result, nil
}

// createPPTPInterface creates the PPTP interface on the router.
func (s *Service) createPPTPInterface(
	ctx context.Context,
	ifName string,
	cfg types.PptpClientConfig,
	comment string,
) (string, error) {

	// Build allow= value: prefer AuthMethods slice (multiple), fall back to AuthMethod (single).
	allowValue := buildAuthMethodString(cfg.AuthMethods, cfg.AuthMethod)

	args := map[string]string{
		"name":       ifName,
		"connect-to": cfg.ConnectTo.Address,
		"user":       cfg.Credentials.Username,
		"password":   cfg.Credentials.Password,
		"comment":    comment,
		"disabled":   "no",
	}
	if allowValue != "" {
		args["allow"] = allowValue
	}

	// Set port if non-zero
	if cfg.ConnectTo.Port > 0 {
		args["port"] = strconv.Itoa(cfg.ConnectTo.Port)
	}

	// Set keepalive timeout if provided
	if cfg.KeepaliveTimeout != nil {
		args["keepalive-timeout"] = strconv.Itoa(*cfg.KeepaliveTimeout)
	}

	// Set dial-on-demand if provided
	if cfg.DialOnDemand != nil {
		args["dial-on-demand"] = boolToYesNo(*cfg.DialOnDemand)
	}

	cmd := router.Command{
		Path:   "/interface/pptp-client",
		Action: "add",
		Args:   args,
	}

	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return "", fmt.Errorf("failed to create PPTP interface: %w", err)
	}
	if !result.Success {
		return "", fmt.Errorf("PPTP interface creation failed: %w", result.Error)
	}

	return result.ID, nil
}

// rollbackPPTP removes all created resources on provisioning failure.
func (s *Service) rollbackPPTP(
	ctx context.Context,
	result *ProvisionResult,
) {

	s.logger.Warnw("rolling back PPTP provisioning",
		"interface", result.InterfaceName,
		"resources", len(result.RouterResourceIDs),
	)

	if err := s.RemoveVPNClient(ctx, result); err != nil {
		s.logger.Errorw("rollback failed", "error", err)
	}
}
