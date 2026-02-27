package vpnclient

import (
	"context"
	"fmt"
	"strconv"

	"backend/internal/provisioning/types"
	"backend/internal/router"
)

// ProvisionWireGuard provisions a WireGuard VPN client on the router.
//
// This creates 6 ordered RouterOS resources:
//  1. /interface/wireguard          - WireGuard interface
//  2. /interface/wireguard/peers    - Peer configuration
//  3. /ip/address                   - Tunnel IP address
//  4. /interface/list/member        - Add to interface lists (WAN, VPN-WAN)
//  5. /routing/table + /ip/route    - Routing table with default route
//  6. /ip/firewall/address-list     - VPN endpoint address list entry
//
// On failure at any step, previously created resources are rolled back.
func (s *Service) ProvisionWireGuard(
	ctx context.Context,
	routerID string,
	sessionID string,
	cfg types.WireguardClientConfig,
) (*ProvisionResult, error) {

	comment := "nnc-provisioned-" + sessionID
	ifName := fmt.Sprintf("wireguard-client-%s", cfg.Name)

	result := &ProvisionResult{
		RouterResourceIDs: make(map[string]string),
		InterfaceName:     ifName,
		GeneratedFields:   make(map[string]string),
	}

	// Step 1: Create WireGuard interface
	wgID, err := s.createWireGuardInterface(ctx, ifName, cfg, comment)
	if err != nil {
		return nil, fmt.Errorf("step 1 (create interface) failed: %w", err)
	}
	result.RouterResourceIDs["/interface/wireguard"] = wgID
	s.logger.Infow("WireGuard interface created", "name", ifName, "id", wgID)

	// Step 2: Create WireGuard peer
	peerID, err := s.createWireGuardPeer(ctx, ifName, cfg, comment)
	if err != nil {
		s.rollbackWireGuard(ctx, result)
		return nil, fmt.Errorf("step 2 (create peer) failed: %w", err)
	}
	result.RouterResourceIDs["/interface/wireguard/peers"] = peerID

	// Step 3: Assign IP address to interface
	ipID, err := s.assignIPAddress(ctx, cfg.InterfaceAddress, ifName, comment)
	if err != nil {
		s.rollbackWireGuard(ctx, result)
		return nil, fmt.Errorf("step 3 (assign IP) failed: %w", err)
	}
	result.RouterResourceIDs["/ip/address"] = ipID

	// Step 4: Add to interface lists (VPN-WAN for routing)
	listID, err := s.addToInterfaceList(ctx, ifName, comment)
	if err != nil {
		// Non-critical: log and continue
		s.logger.Warnw("failed to add to interface list, continuing", "error", err)
	} else {
		result.RouterResourceIDs["/interface/list/member"] = listID
	}

	// Step 5: Create routing table and default route
	tableID, routeID, err := s.createRoutingTableAndRoute(ctx, cfg.Name, ifName, comment)
	if err != nil {
		s.rollbackWireGuard(ctx, result)
		return nil, fmt.Errorf("step 5 (create routing) failed: %w", err)
	}
	result.RouterResourceIDs["/routing/table"] = tableID
	result.RouterResourceIDs["/ip/route"] = routeID

	// Step 6: Add VPN endpoint to address list (for VPN endpoint routing)
	addrListID, err := s.addEndpointToAddressList(ctx, cfg.PeerEndpointAddress, comment)
	if err != nil {
		// Non-critical: log and continue
		s.logger.Warnw("failed to add endpoint to address list, continuing", "error", err)
	} else {
		result.RouterResourceIDs["/ip/firewall/address-list"] = addrListID
	}

	// Confirm: Read back the interface to capture generated public key
	pubKey, err := s.readGeneratedPublicKey(ctx, ifName)
	if err != nil {
		s.logger.Warnw("failed to read generated public key", "error", err)
	} else {
		result.GeneratedFields["publicKey"] = pubKey
	}

	s.logger.Infow("WireGuard client provisioned successfully",
		"name", cfg.Name,
		"interface", ifName,
		"resources", len(result.RouterResourceIDs),
	)

	return result, nil
}

// createWireGuardInterface creates the WireGuard interface on the router.
func (s *Service) createWireGuardInterface(
	ctx context.Context,
	ifName string,
	cfg types.WireguardClientConfig,
	comment string,
) (string, error) {

	args := map[string]string{
		"name":        ifName,
		"private-key": cfg.InterfacePrivateKey,
		"listen-port": strconv.Itoa(cfg.InterfaceListenPort),
		"comment":     comment,
	}

	if cfg.InterfaceMTU != nil {
		args["mtu"] = strconv.Itoa(*cfg.InterfaceMTU)
	}

	cmd := router.Command{
		Path:   "/interface/wireguard",
		Action: "add",
		Args:   args,
	}

	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return "", fmt.Errorf("failed to create WireGuard interface: %w", err)
	}
	if !result.Success {
		return "", fmt.Errorf("WireGuard interface creation failed: %w", result.Error)
	}

	return result.ID, nil
}

// createWireGuardPeer creates the WireGuard peer configuration.
func (s *Service) createWireGuardPeer(
	ctx context.Context,
	ifName string,
	cfg types.WireguardClientConfig,
	comment string,
) (string, error) {

	args := map[string]string{
		"interface":        ifName,
		"public-key":       cfg.PeerPublicKey,
		"endpoint-address": cfg.PeerEndpointAddress,
		"endpoint-port":    strconv.Itoa(cfg.PeerEndpointPort),
		"allowed-address":  cfg.PeerAllowedIPs,
		"comment":          comment,
	}

	if cfg.PeerPresharedKey != nil && *cfg.PeerPresharedKey != "" {
		args["preshared-key"] = *cfg.PeerPresharedKey
	}

	// Default to 25s keepalive (matching TS WireGuard behavior) unless explicitly overridden.
	keepalive := 25
	if cfg.PeerPersistentKeepalive != nil {
		keepalive = *cfg.PeerPersistentKeepalive
	}
	args["persistent-keepalive"] = fmt.Sprintf("%ds", keepalive)

	cmd := router.Command{
		Path:   "/interface/wireguard/peers",
		Action: "add",
		Args:   args,
	}

	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return "", fmt.Errorf("failed to create WireGuard peer: %w", err)
	}
	if !result.Success {
		return "", fmt.Errorf("WireGuard peer creation failed: %w", result.Error)
	}

	return result.ID, nil
}

// assignIPAddress assigns the tunnel IP address to the WireGuard interface.
func (s *Service) assignIPAddress(
	ctx context.Context,
	address string,
	ifName string,
	comment string,
) (string, error) {

	cmd := router.Command{
		Path:   "/ip/address",
		Action: "add",
		Args: map[string]string{
			"address":   address,
			"interface": ifName,
			"comment":   comment,
		},
	}

	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return "", fmt.Errorf("failed to assign IP address: %w", err)
	}
	if !result.Success {
		return "", fmt.Errorf("IP address assignment failed: %w", result.Error)
	}

	return result.ID, nil
}

// addToInterfaceList adds the WireGuard interface to the VPN-WAN interface list.
func (s *Service) addToInterfaceList(
	ctx context.Context,
	ifName string,
	comment string,
) (string, error) {

	cmd := router.Command{
		Path:   "/interface/list/member",
		Action: "add",
		Args: map[string]string{
			"interface": ifName,
			"list":      "VPN-WAN",
			"comment":   comment,
		},
	}

	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return "", fmt.Errorf("failed to add to interface list: %w", err)
	}
	if !result.Success {
		return "", fmt.Errorf("interface list addition failed: %w", result.Error)
	}

	return result.ID, nil
}

// createRoutingTableAndRoute creates a routing table and default route for the VPN.
func (s *Service) createRoutingTableAndRoute(
	ctx context.Context,
	vpnName string,
	ifName string,
	comment string,
) (tableID, routeID string, err error) {

	tableName := fmt.Sprintf("to-VPN-%s", vpnName)

	// Create routing table
	tableCmd := router.Command{
		Path:   "/routing/table",
		Action: "add",
		Args: map[string]string{
			"name":    tableName,
			"fib":     boolYes,
			"comment": comment,
		},
	}

	tableResult, err := s.routerPort.ExecuteCommand(ctx, tableCmd)
	if err != nil {
		return "", "", fmt.Errorf("failed to create routing table: %w", err)
	}
	if !tableResult.Success {
		return "", "", fmt.Errorf("routing table creation failed: %w", tableResult.Error)
	}

	// Create default route through the WireGuard interface
	routeCmd := router.Command{
		Path:   "/ip/route",
		Action: "add",
		Args: map[string]string{
			"dst-address":   "0.0.0.0/0",
			"gateway":       ifName,
			"routing-table": tableName,
			"comment":       comment,
		},
	}

	routeResult, err := s.routerPort.ExecuteCommand(ctx, routeCmd)
	if err != nil {
		// Rollback: remove the routing table we just created
		removeCmd := router.Command{
			Path:   "/routing/table",
			Action: "remove",
			Args:   map[string]string{".id": tableResult.ID},
		}
		_, _ = s.routerPort.ExecuteCommand(ctx, removeCmd) //nolint:errcheck // best-effort rollback cleanup
		return "", "", fmt.Errorf("failed to create route: %w", err)
	}
	if !routeResult.Success {
		removeCmd := router.Command{
			Path:   "/routing/table",
			Action: "remove",
			Args:   map[string]string{".id": tableResult.ID},
		}
		_, _ = s.routerPort.ExecuteCommand(ctx, removeCmd) //nolint:errcheck // best-effort rollback cleanup
		return "", "", fmt.Errorf("route creation failed: %w", routeResult.Error)
	}

	return tableResult.ID, routeResult.ID, nil
}

// addEndpointToAddressList adds the VPN endpoint to the VPNE address list.
// This ensures the VPN endpoint IP itself is routed via the correct WAN,
// not via the VPN tunnel (which would create a routing loop).
func (s *Service) addEndpointToAddressList(
	ctx context.Context,
	endpointAddress string,
	comment string,
) (string, error) {

	cmd := router.Command{
		Path:   "/ip/firewall/address-list",
		Action: "add",
		Args: map[string]string{
			"list":    "VPNE",
			"address": endpointAddress,
			"comment": comment,
		},
	}

	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return "", fmt.Errorf("failed to add endpoint to address list: %w", err)
	}
	if !result.Success {
		return "", fmt.Errorf("address list addition failed: %w", result.Error)
	}

	return result.ID, nil
}

// readGeneratedPublicKey reads back the WireGuard interface to capture
// the router-generated public key (Confirm step of Apply-Confirm-Merge).
func (s *Service) readGeneratedPublicKey(
	ctx context.Context,
	ifName string,
) (string, error) {

	cmd := router.Command{
		Path:   "/interface/wireguard",
		Action: "print",
		Args: map[string]string{
			"?name": ifName,
		},
		Props: []string{"public-key"},
	}

	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return "", fmt.Errorf("failed to read WireGuard interface: %w", err)
	}
	if !result.Success || len(result.Data) == 0 {
		return "", fmt.Errorf("no WireGuard interface found with name %s", ifName)
	}

	pubKey, ok := result.Data[0]["public-key"]
	if !ok {
		return "", fmt.Errorf("public-key field not found in response")
	}

	return pubKey, nil
}

// rollbackWireGuard removes all created resources on provisioning failure.
func (s *Service) rollbackWireGuard(
	ctx context.Context,
	result *ProvisionResult,
) {

	s.logger.Warnw("rolling back WireGuard provisioning",
		"interface", result.InterfaceName,
		"resources", len(result.RouterResourceIDs),
	)

	if err := s.RemoveVPNClient(ctx, result); err != nil {
		s.logger.Errorw("rollback failed", "error", err)
	}
}
