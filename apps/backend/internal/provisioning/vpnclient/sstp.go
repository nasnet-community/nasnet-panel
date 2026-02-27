package vpnclient

import (
	"context"
	"fmt"
	"strconv"

	"backend/internal/provisioning/types"
	"backend/internal/router"
)

// ProvisionSSTP provisions an SSTP VPN client on the router.
//
// This creates 4 ordered RouterOS resources:
//  1. /interface/sstp-client         - SSTP interface
//  2. /interface/list/member         - Add to interface lists (VPN-WAN)
//  3. /routing/table + /ip/route     - Routing table with default route
//  4. /ip/firewall/address-list      - VPN endpoint address list entry
//
// On failure at any step, previously created resources are rolled back.
func (s *Service) ProvisionSSTP( //nolint:dupl // each VPN protocol has distinct config despite similar structure
	ctx context.Context,
	routerID string,
	sessionID string,
	cfg types.SstpClientConfig,
) (*ProvisionResult, error) {

	comment := "nnc-provisioned-" + sessionID
	ifName := fmt.Sprintf("sstp-client-%s", cfg.Name)

	result := &ProvisionResult{
		RouterResourceIDs: make(map[string]string),
		InterfaceName:     ifName,
		GeneratedFields:   make(map[string]string),
	}

	// Step 1: Create SSTP interface
	sstpID, err := s.createSSTPInterface(ctx, ifName, cfg, comment)
	if err != nil {
		return nil, fmt.Errorf("step 1 (create interface) failed: %w", err)
	}
	result.RouterResourceIDs["/interface/sstp-client"] = sstpID
	s.logger.Infow("SSTP interface created", "name", ifName, "id", sstpID)

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
		s.rollbackSSTP(ctx, result)
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

	s.logger.Infow("SSTP client provisioned successfully",
		"name", cfg.Name,
		"interface", ifName,
		"resources", len(result.RouterResourceIDs),
	)

	return result, nil
}

// createSSTPInterface creates the SSTP interface on the router.
func (s *Service) createSSTPInterface( //nolint:gocyclo // SSTP has many optional TLS/proxy/certificate flags
	ctx context.Context,
	ifName string,
	cfg types.SstpClientConfig,
	comment string,
) (string, error) {

	// Build authentication= value: prefer AuthMethods slice (multiple), fall back to AuthMethod (single).
	authValue := buildAuthMethodString(cfg.AuthMethods, cfg.AuthMethod)

	args := map[string]string{
		"name":       ifName,
		"connect-to": cfg.Server.Address,
		"user":       cfg.Credentials.Username,
		"password":   cfg.Credentials.Password,
		"comment":    comment,
		"disabled":   "no",
	}
	if authValue != "" {
		args["authentication"] = authValue
	}

	// Set port if non-zero
	if cfg.Server.Port > 0 {
		args["port"] = strconv.Itoa(cfg.Server.Port)
	}

	// Set ciphers if provided
	if cfg.Ciphers != nil && *cfg.Ciphers != "" {
		args["ciphers"] = *cfg.Ciphers
	}

	// Set TLS version if provided
	if cfg.TLSVersion != nil && *cfg.TLSVersion != "" {
		args["tls-version"] = string(*cfg.TLSVersion)
	}

	// Set HTTP proxy if provided
	if cfg.Proxy != nil {
		args["http-proxy"] = cfg.Proxy.Address

		if cfg.Proxy.Port > 0 {
			args["proxy-port"] = strconv.Itoa(cfg.Proxy.Port)
		}
	}

	// Set SNI if provided (enable SNI via add-sni field)
	if cfg.SNI != nil && *cfg.SNI != "" {
		args["add-sni"] = boolYes
	}

	// Set PFS if provided
	if cfg.PFS != nil {
		args["pfs"] = boolToYesNo(*cfg.PFS)
	}

	// Set dial-on-demand if provided
	if cfg.DialOnDemand != nil {
		args["dial-on-demand"] = boolToYesNo(*cfg.DialOnDemand)
	}

	// Set keepalive timeout if provided
	if cfg.KeepAlive != nil {
		args["keepalive-timeout"] = strconv.Itoa(*cfg.KeepAlive)
	}

	// Set verify server certificate if provided
	if cfg.VerifyServerCertificate != nil {
		args["verify-server-certificate"] = boolToYesNo(*cfg.VerifyServerCertificate)
	}

	// Set verify server address from certificate if provided
	if cfg.VerifyServerAddressFromCertificate != nil {
		args["verify-server-address-from-certificate"] = boolToYesNo(*cfg.VerifyServerAddressFromCertificate)
	}

	// Set client certificate name if provided
	if cfg.ClientCertificateName != nil && *cfg.ClientCertificateName != "" {
		args["certificate"] = *cfg.ClientCertificateName
	}

	cmd := router.Command{
		Path:   "/interface/sstp-client",
		Action: "add",
		Args:   args,
	}

	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return "", fmt.Errorf("failed to create SSTP interface: %w", err)
	}
	if !result.Success {
		return "", fmt.Errorf("SSTP interface creation failed: %w", result.Error)
	}

	return result.ID, nil
}

// rollbackSSTP removes all created resources on provisioning failure.
func (s *Service) rollbackSSTP(
	ctx context.Context,
	result *ProvisionResult,
) {

	s.logger.Warnw("rolling back SSTP provisioning",
		"interface", result.InterfaceName,
		"resources", len(result.RouterResourceIDs),
	)

	if err := s.RemoveVPNClient(ctx, result); err != nil {
		s.logger.Errorw("rollback failed", "error", err)
	}
}
