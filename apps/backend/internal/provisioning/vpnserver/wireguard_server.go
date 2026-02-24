package vpnserver

import (
	"context"
	"fmt"
	"strconv"

	"backend/internal/provisioning/types"
	"backend/internal/router"
)

// ProvisionWireGuardServer provisions a WireGuard VPN server on the router.
//
// This creates the following RouterOS resources in order:
//  1. /interface/wireguard          - WireGuard server interface
//  2. /ip/address                   - Server address on the interface
//  3. /interface/wireguard/peers    - One entry per configured peer
//  4. /interface/list/member        - Add to interface list (VPN-LAN)
//
// On failure at any step, previously created resources are rolled back.
// After creation, reads back the interface to capture the generated public key.
func (s *Service) ProvisionWireGuardServer(
	ctx context.Context,
	routerID string,
	sessionID string,
	cfg types.WireguardServerConfig,
) (*ProvisionResult, error) {

	comment := "nnc-provisioned-" + sessionID
	ifName := fmt.Sprintf("wireguard-server-%s", cfg.Name)

	result := &ProvisionResult{
		RouterResourceIDs: make(map[string]string),
		InterfaceName:     ifName,
		GeneratedFields:   make(map[string]string),
	}

	// Step 1: Create WireGuard interface
	wgID, err := s.createWireGuardServerInterface(ctx, ifName, cfg, comment)
	if err != nil {
		return nil, fmt.Errorf("step 1 (create WireGuard interface) failed: %w", err)
	}
	result.RouterResourceIDs["/interface/wireguard"] = wgID
	s.logger.Infow("WireGuard server interface created", "name", ifName, "id", wgID)

	// Step 2: Assign IP address to interface
	ipID, err := s.assignServerIPAddress(ctx, cfg.Interface.Address, ifName, comment)
	if err != nil {
		s.rollbackWireGuardServer(ctx, result)
		return nil, fmt.Errorf("step 2 (assign IP address) failed: %w", err)
	}
	result.RouterResourceIDs["/ip/address"] = ipID

	// Step 3: Create WireGuard peers
	for i, peer := range cfg.Peers {
		peerID, peerErr := s.createWireGuardServerPeer(ctx, ifName, peer, comment)
		if peerErr != nil {
			s.rollbackWireGuardServer(ctx, result)
			return nil, fmt.Errorf("step 3 (create peer %d) failed: %w", i, peerErr)
		}
		// Store last peer ID under the path (multi-peer: keyed by path+index below)
		peerKey := fmt.Sprintf("/interface/wireguard/peers[%d]", i)
		result.RouterResourceIDs[peerKey] = peerID
	}

	// Step 4: Add to interface list (VPN-LAN for server interfaces)
	listID, err := s.addServerToInterfaceList(ctx, ifName, "VPN-LAN", comment)
	if err != nil {
		// Non-critical: log and continue
		s.logger.Warnw("failed to add server to interface list, continuing", "error", err)
	} else {
		result.RouterResourceIDs["/interface/list/member"] = listID
	}

	// Confirm: Read back the interface to capture generated public key
	pubKey, err := s.readServerGeneratedPublicKey(ctx, ifName)
	if err != nil {
		s.logger.Warnw("failed to read generated public key", "error", err)
	} else {
		result.GeneratedFields["publicKey"] = pubKey
	}

	s.logger.Infow("WireGuard server provisioned successfully",
		"name", cfg.Name,
		"interface", ifName,
		"peers", len(cfg.Peers),
		"resources", len(result.RouterResourceIDs),
	)

	return result, nil
}

// createWireGuardServerInterface creates the WireGuard server interface on the router.
func (s *Service) createWireGuardServerInterface(
	ctx context.Context,
	ifName string,
	cfg types.WireguardServerConfig,
	comment string,
) (string, error) {

	args := map[string]string{
		"name":        ifName,
		"private-key": cfg.Interface.PrivateKey,
		"listen-port": strconv.Itoa(cfg.Interface.ListenPort),
		"comment":     comment,
	}

	if cfg.Interface.MTU != nil {
		args["mtu"] = strconv.Itoa(*cfg.Interface.MTU)
	}

	cmd := router.Command{
		Path:   "/interface/wireguard",
		Action: "add",
		Args:   args,
	}

	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return "", fmt.Errorf("failed to create WireGuard server interface: %w", err)
	}
	if !result.Success {
		return "", fmt.Errorf("WireGuard server interface creation failed: %w", result.Error)
	}

	return result.ID, nil
}

// assignServerIPAddress assigns the server IP address to the WireGuard interface.
func (s *Service) assignServerIPAddress(
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

// createWireGuardServerPeer creates a WireGuard peer entry on the server interface.
func (s *Service) createWireGuardServerPeer(
	ctx context.Context,
	ifName string,
	peer types.WireguardPeerConfig,
	comment string,
) (string, error) {

	args := map[string]string{
		"interface":       ifName,
		"public-key":      peer.PublicKey,
		"allowed-address": peer.AllowedIPs,
		"comment":         comment,
	}

	if peer.PresharedKey != nil && *peer.PresharedKey != "" {
		args["preshared-key"] = *peer.PresharedKey
	}

	if peer.PersistentKeepalive != nil {
		args["persistent-keepalive"] = fmt.Sprintf("%ds", *peer.PersistentKeepalive)
	}

	if peer.Endpoint != nil {
		args["endpoint-address"] = peer.Endpoint.Address
		args["endpoint-port"] = strconv.Itoa(peer.Endpoint.Port)
	}

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

// addServerToInterfaceList adds the WireGuard server interface to a list.
func (s *Service) addServerToInterfaceList(
	ctx context.Context,
	ifName string,
	listName string,
	comment string,
) (string, error) {

	cmd := router.Command{
		Path:   "/interface/list/member",
		Action: "add",
		Args: map[string]string{
			"interface": ifName,
			"list":      listName,
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

// readServerGeneratedPublicKey reads back the WireGuard interface to capture
// the router-generated public key (Confirm step of Apply-Confirm-Merge).
func (s *Service) readServerGeneratedPublicKey(
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

// rollbackWireGuardServer removes all created resources on provisioning failure.
func (s *Service) rollbackWireGuardServer(
	ctx context.Context,
	result *ProvisionResult,
) {

	s.logger.Warnw("rolling back WireGuard server provisioning",
		"interface", result.InterfaceName,
		"resources", len(result.RouterResourceIDs),
	)

	if err := s.RemoveVPNServer(ctx, result); err != nil {
		s.logger.Errorw("rollback failed", "error", err)
	}
}
