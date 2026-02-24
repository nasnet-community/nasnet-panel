package vpnclient

import (
	"context"
	"fmt"
	"strconv"

	"backend/internal/provisioning/types"
	"backend/internal/router"
)

// ProvisionL2TP provisions an L2TP VPN client on the router.
//
// This creates 4 ordered RouterOS resources:
//  1. /interface/l2tp-client         - L2TP interface
//  2. /interface/list/member         - Add to interface lists (VPN-WAN)
//  3. /routing/table + /ip/route     - Routing table with default route
//  4. /ip/firewall/address-list      - VPN endpoint address list entry
//
// On failure at any step, previously created resources are rolled back.
func (s *Service) ProvisionL2TP( //nolint:dupl // each VPN protocol has distinct config despite similar structure
	ctx context.Context,
	routerID string,
	sessionID string,
	cfg types.L2tpClientConfig,
) (*ProvisionResult, error) {

	comment := "nnc-provisioned-" + sessionID
	ifName := fmt.Sprintf("l2tp-client-%s", cfg.Name)

	result := &ProvisionResult{
		RouterResourceIDs: make(map[string]string),
		InterfaceName:     ifName,
		GeneratedFields:   make(map[string]string),
	}

	// Step 1: Create L2TP interface
	l2tpID, err := s.createL2TPInterface(ctx, ifName, cfg, comment)
	if err != nil {
		return nil, fmt.Errorf("step 1 (create interface) failed: %w", err)
	}
	result.RouterResourceIDs["/interface/l2tp-client"] = l2tpID
	s.logger.Infow("L2TP interface created", "name", ifName, "id", l2tpID)

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
		s.rollbackL2TP(ctx, result)
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

	s.logger.Infow("L2TP client provisioned successfully",
		"name", cfg.Name,
		"interface", ifName,
		"resources", len(result.RouterResourceIDs),
	)

	return result, nil
}

// createL2TPInterface creates the L2TP interface on the router.
func (s *Service) createL2TPInterface( //nolint:gocyclo // L2TP has many optional protocol-level flags
	ctx context.Context,
	ifName string,
	cfg types.L2tpClientConfig,
	comment string,
) (string, error) {

	args := map[string]string{
		"name":       ifName,
		"connect-to": cfg.Server.Address,
		"user":       cfg.Credentials.Username,
		"password":   cfg.Credentials.Password,
		"allow":      string(cfg.AuthMethod),
		"comment":    comment,
		"disabled":   "no",
	}

	// Set use-ipsec if provided
	if cfg.UseIPsec != nil {
		args["use-ipsec"] = boolToYesNo(*cfg.UseIPsec)

		// Set ipsec-secret if UseIPsec is true and IPsecSecret is provided
		if *cfg.UseIPsec && cfg.IPsecSecret != nil && *cfg.IPsecSecret != "" {
			args["ipsec-secret"] = *cfg.IPsecSecret
		}
	}

	// Set allow-fast-path: disable if UseIPsec=true, enable otherwise
	if cfg.UseIPsec != nil && *cfg.UseIPsec {
		args["allow-fast-path"] = "no"
	} else {
		args["allow-fast-path"] = boolYes
	}

	// Always use random source port for L2TP
	args["random-source-port"] = boolYes

	// Set keepalive timeout if provided
	if cfg.KeepAlive != nil {
		args["keepalive-timeout"] = strconv.Itoa(*cfg.KeepAlive)
	}

	// Set dial-on-demand if provided
	if cfg.DialOnDemand != nil {
		args["dial-on-demand"] = boolToYesNo(*cfg.DialOnDemand)
	}

	// Set L2TP protocol version if provided
	if cfg.ProtoVersion != nil {
		// Map version number to RouterOS string
		protoStr := fmt.Sprintf("l2tpv%d", *cfg.ProtoVersion)
		args["l2tp-proto-version"] = protoStr
	}

	// L2TPv3-specific settings (only if ProtoVersion=3)
	if cfg.ProtoVersion != nil && *cfg.ProtoVersion == 3 {
		// Set L2TPv3 cookie length if provided
		if cfg.CookieLength != nil {
			args["l2tpv3-cookie-length"] = strconv.Itoa(*cfg.CookieLength)
		}

		// Set L2TPv3 digest hash if provided
		if cfg.DigestHash != nil && *cfg.DigestHash != "" {
			args["l2tpv3-digest-hash"] = *cfg.DigestHash
		}

		// Set L2TPv3 circuit ID if provided
		if cfg.CircuitId != nil && *cfg.CircuitId != "" {
			args["l2tpv3-circuit-id"] = *cfg.CircuitId
		}
	}

	cmd := router.Command{
		Path:   "/interface/l2tp-client",
		Action: "add",
		Args:   args,
	}

	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return "", fmt.Errorf("failed to create L2TP interface: %w", err)
	}
	if !result.Success {
		return "", fmt.Errorf("L2TP interface creation failed: %w", result.Error)
	}

	return result.ID, nil
}

// rollbackL2TP removes all created resources on provisioning failure.
func (s *Service) rollbackL2TP(
	ctx context.Context,
	result *ProvisionResult,
) {

	s.logger.Warnw("rolling back L2TP provisioning",
		"interface", result.InterfaceName,
		"resources", len(result.RouterResourceIDs),
	)

	if err := s.RemoveVPNClient(ctx, result); err != nil {
		s.logger.Errorw("rollback failed", "error", err)
	}
}
