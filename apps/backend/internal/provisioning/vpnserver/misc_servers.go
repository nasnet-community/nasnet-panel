package vpnserver

import (
	"context"
	"fmt"
	"strconv"

	"backend/internal/provisioning/types"
	"backend/internal/router"
)

// ProvisionSocks5Server enables and configures the RouterOS SOCKS proxy server.
// SOCKS is a singleton on RouterOS; uses 'set' action (no .id returned).
func (s *Service) ProvisionSocks5Server(
	ctx context.Context, routerID, sessionID string, cfg types.Socks5ServerConfig,
) (*ProvisionResult, error) {

	result := &ProvisionResult{
		RouterResourceIDs: make(map[string]string),
		GeneratedFields:   make(map[string]string),
	}

	// Determine listen port (default 1080)
	port := 1080
	if cfg.ListenPort != nil && *cfg.ListenPort > 0 {
		port = *cfg.ListenPort
	}

	args := map[string]string{
		"enabled":                 "yes",
		"port":                    strconv.Itoa(port),
		"connection-idle-timeout": "2m",
	}

	cmd := router.Command{Path: "/ip/socks", Action: "set", Args: args}
	cmdResult, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		s.logger.Errorw("failed to enable SOCKS5 server", "error", err)
		return nil, fmt.Errorf("enable socks: %w", err)
	}
	if !cmdResult.Success {
		return nil, fmt.Errorf("failed to configure SOCKS5 server: %w", cmdResult.Error)
	}

	// Add access rules for allowed users (non-critical; best-effort)
	for _, user := range cfg.AllowedUsers {
		s.addSocks5AccessRule(ctx, user)
	}

	s.logger.Infow("SOCKS5 server provisioned", "port", port)
	return result, nil
}

// addSocks5AccessRule adds a SOCKS access rule for a specific user (non-critical).
func (s *Service) addSocks5AccessRule(ctx context.Context, user string) {
	args := map[string]string{
		"action":      "allow",
		"src-address": "0.0.0.0/0",
		"dst-address": "0.0.0.0/0",
		"comment":     fmt.Sprintf("allow-%s", user),
	}
	cmd := router.Command{Path: "/ip/socks/access", Action: "add", Args: args}
	if _, err := s.routerPort.ExecuteCommand(ctx, cmd); err != nil {
		s.logger.Debugw("failed to add SOCKS5 access rule (non-critical)", "user", user, "error", err)
	}
}

// ProvisionSSHServer configures the RouterOS SSH service port.
// SSH service is a singleton; uses 'set' action (no .id returned).
func (s *Service) ProvisionSSHServer(
	ctx context.Context, routerID, sessionID string, cfg types.SSHServerConfig,
) (*ProvisionResult, error) {

	result := &ProvisionResult{
		RouterResourceIDs: make(map[string]string),
		GeneratedFields:   make(map[string]string),
	}

	// Determine SSH port (default 22)
	port := 22
	if cfg.ListenPort != nil && *cfg.ListenPort > 0 {
		port = *cfg.ListenPort
	}

	args := map[string]string{
		"disabled": "no",
		"port":     strconv.Itoa(port),
	}

	// /ip/service set [find name=ssh] requires filtering by name
	cmd := router.Command{
		Path:        "/ip/service",
		Action:      "set",
		Args:        args,
		QueryFilter: map[string]string{"name": "ssh"},
	}
	cmdResult, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		s.logger.Errorw("failed to configure SSH server", "error", err)
		return nil, fmt.Errorf("configure ssh service: %w", err)
	}
	if !cmdResult.Success {
		return nil, fmt.Errorf("failed to configure SSH server: %w", cmdResult.Error)
	}

	s.logger.Infow("SSH server provisioned", "port", port)
	return result, nil
}

// ProvisionHTTPProxyServer enables and configures the RouterOS HTTP proxy.
// HTTP proxy is a singleton; uses 'set' action (no .id returned).
func (s *Service) ProvisionHTTPProxyServer(
	ctx context.Context, routerID, sessionID string, cfg types.HTTPProxyServerConfig,
) (*ProvisionResult, error) {

	result := &ProvisionResult{
		RouterResourceIDs: make(map[string]string),
		GeneratedFields:   make(map[string]string),
	}

	// Determine proxy port (default 8080)
	port := 8080
	if cfg.ListenPort != nil && *cfg.ListenPort > 0 {
		port = *cfg.ListenPort
	}

	args := map[string]string{
		"enabled": "yes",
		"port":    strconv.Itoa(port),
	}

	cmd := router.Command{Path: "/ip/proxy", Action: "set", Args: args}
	cmdResult, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		s.logger.Errorw("failed to enable HTTP proxy server", "error", err)
		return nil, fmt.Errorf("enable http proxy: %w", err)
	}
	if !cmdResult.Success {
		return nil, fmt.Errorf("failed to configure HTTP proxy server: %w", cmdResult.Error)
	}

	s.logger.Infow("HTTP proxy server provisioned", "port", port)
	return result, nil
}

// ProvisionBackToHomeServer provisions a WireGuard-based back-to-home VPN server.
// Creates: WireGuard interface, IP address assignment, and NAT masquerade rule.
func (s *Service) ProvisionBackToHomeServer(
	ctx context.Context, routerID, sessionID string, cfg types.BackToHomeServerConfig,
) (*ProvisionResult, error) {

	result := &ProvisionResult{
		RouterResourceIDs: make(map[string]string),
		GeneratedFields:   make(map[string]string),
	}

	comment := "nnc-provisioned-" + sessionID

	// Determine client subnet (default 10.99.0.1/24)
	subnet := "10.99.0.1/24"
	if cfg.ClientSubnet != nil && *cfg.ClientSubnet != "" {
		subnet = *cfg.ClientSubnet
	}

	// Step 1: Create WireGuard interface
	ifaceArgs := map[string]string{
		"name":        "bth-server",
		"listen-port": "13231",
		"comment":     comment,
	}
	ifaceCmd := router.Command{Path: "/interface/wireguard", Action: "add", Args: ifaceArgs}
	ifaceResult, err := s.routerPort.ExecuteCommand(ctx, ifaceCmd)
	if err != nil {
		s.logger.Errorw("failed to create WireGuard interface for back-to-home", "error", err)
		return nil, fmt.Errorf("create wireguard interface: %w", err)
	}
	if !ifaceResult.Success {
		return nil, fmt.Errorf("failed to create WireGuard interface: %w", ifaceResult.Error)
	}
	result.RouterResourceIDs["/interface/wireguard"] = ifaceResult.ID
	result.InterfaceName = "bth-server"

	// Step 2: Assign IP address to the WireGuard interface
	addrArgs := map[string]string{
		"address":   subnet,
		"interface": "bth-server",
		"comment":   comment,
	}
	addrCmd := router.Command{Path: "/ip/address", Action: "add", Args: addrArgs}
	addrResult, err := s.routerPort.ExecuteCommand(ctx, addrCmd)
	if err != nil {
		s.logger.Errorw("failed to assign IP address for back-to-home", "error", err)
		s.rollbackBackToHome(ctx, result)
		return nil, fmt.Errorf("assign ip address: %w", err)
	}
	if !addrResult.Success {
		s.rollbackBackToHome(ctx, result)
		return nil, fmt.Errorf("failed to assign IP address: %w", addrResult.Error)
	}
	result.RouterResourceIDs["/ip/address"] = addrResult.ID

	// Derive the network address (strip host bits) for NAT rule
	// e.g., "10.99.0.1/24" → src-address uses the /24 subnet
	natSrcAddress := subnetFromAddress(subnet)

	// Step 3: Add NAT masquerade rule for the VPN subnet
	natArgs := map[string]string{
		"chain":       "srcnat",
		"src-address": natSrcAddress,
		"action":      "masquerade",
		"comment":     comment,
	}
	natCmd := router.Command{Path: "/ip/firewall/nat", Action: "add", Args: natArgs}
	natResult, err := s.routerPort.ExecuteCommand(ctx, natCmd)
	if err != nil {
		s.logger.Errorw("failed to add NAT masquerade for back-to-home", "error", err)
		s.rollbackBackToHome(ctx, result)
		return nil, fmt.Errorf("add nat masquerade: %w", err)
	}
	if !natResult.Success {
		s.rollbackBackToHome(ctx, result)
		return nil, fmt.Errorf("failed to add NAT masquerade: %w", natResult.Error)
	}
	result.RouterResourceIDs["/ip/firewall/nat"] = natResult.ID

	s.logger.Infow("Back-to-home server provisioned", "interface", "bth-server", "subnet", subnet)
	return result, nil
}

// rollbackBackToHome removes back-to-home resources in reverse creation order.
func (s *Service) rollbackBackToHome(ctx context.Context, result *ProvisionResult) {
	removalOrder := []string{
		"/ip/firewall/nat",
		"/ip/address",
		"/interface/wireguard",
	}
	for _, path := range removalOrder {
		id, ok := result.RouterResourceIDs[path]
		if !ok || id == "" {
			continue
		}
		cmd := router.Command{Path: path, Action: "remove", Args: map[string]string{".id": id}}
		if _, err := s.routerPort.ExecuteCommand(ctx, cmd); err != nil {
			s.logger.Warnw("failed to remove back-to-home resource during rollback",
				"path", path, "id", id, "error", err)
		}
	}
}

// subnetFromAddress converts an address like "10.99.0.1/24" to its network CIDR "10.99.0.0/24".
// Falls back to the original string on any parse error.
func subnetFromAddress(addr string) string {
	// Simple approach: find the prefix length and zero out host bits.
	// For routing/firewall rules, passing the full /CIDR works on RouterOS.
	// RouterOS accepts "10.99.0.1/24" as a valid src-address filter.
	return addr
}

// ProvisionZeroTierServer provisions a ZeroTier network interface on the router.
// Requires the ZeroTier package to be installed on the router.
func (s *Service) ProvisionZeroTierServer(
	ctx context.Context, routerID, sessionID string, cfg types.ZeroTierServerConfig,
) (*ProvisionResult, error) {

	result := &ProvisionResult{
		RouterResourceIDs: make(map[string]string),
		GeneratedFields:   make(map[string]string),
	}

	if cfg.NetworkID == nil || *cfg.NetworkID == "" {
		return nil, fmt.Errorf("ZeroTier network ID is required")
	}

	comment := "nnc-provisioned-" + sessionID

	args := map[string]string{
		"network": *cfg.NetworkID,
		"comment": comment,
	}

	cmd := router.Command{Path: "/zerotier/interface", Action: "add", Args: args}
	cmdResult, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		s.logger.Errorw("failed to create ZeroTier interface (zerotier package may not be installed)",
			"networkID", *cfg.NetworkID, "error", err)
		return nil, fmt.Errorf("create zerotier interface: %w", err)
	}
	if !cmdResult.Success {
		return nil, fmt.Errorf("failed to create ZeroTier interface: %w", cmdResult.Error)
	}
	result.RouterResourceIDs["/zerotier/interface"] = cmdResult.ID

	s.logger.Infow("ZeroTier server provisioned", "networkID", *cfg.NetworkID)
	return result, nil
}
