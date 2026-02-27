package trunk

import (
	"context"
	"fmt"
	"net"
	"strings"

	"backend/internal/provisioning/types"
	"backend/internal/router"
)

// createVLAN creates a VLAN sub-interface on the given trunk interface.
// Name follows the TS convention: VLAN{id}-{trunkIF}-{networkName}.
func (s *Service) createVLAN(ctx context.Context, trunkIF string, vlanID int, networkName, vlanComment, sessionComment string) (string, error) {
	name := vlanInterfaceName(vlanID, trunkIF, networkName)
	cmd := router.Command{
		Path:   "/interface/vlan",
		Action: "add",
		Args: map[string]string{
			"name":      name,
			"vlan-id":   fmt.Sprintf("%d", vlanID),
			"interface": trunkIF,
			"comment":   vlanComment + " (" + sessionComment + ")",
		},
	}
	res, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return "", fmt.Errorf("failed to create VLAN: %w", err)
	}

	if !res.Success {
		return "", fmt.Errorf("VLAN creation failed: %w", res.Error)
	}
	return res.ID, nil
}

// createBridge creates a bridge interface for a LAN segment.
func (s *Service) createBridge(ctx context.Context, bridgeName, comment string) (string, error) {
	cmd := router.Command{
		Path:   "/interface/bridge",
		Action: "add",
		Args: map[string]string{
			"name":    bridgeName,
			"comment": comment,
		},
	}
	res, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return "", fmt.Errorf("failed to create bridge: %w", err)
	}
	if !res.Success {
		return "", fmt.Errorf("bridge creation failed: %w", res.Error)
	}
	return res.ID, nil
}

// addToBridge adds an interface as a port on a bridge.
func (s *Service) addToBridge(ctx context.Context, ifName, bridgeName, portComment, sessionComment string) (string, error) {
	cmd := router.Command{
		Path:   "/interface/bridge/port",
		Action: "add",
		Args: map[string]string{
			"interface": ifName,
			"bridge":    bridgeName,
			"comment":   portComment + " (" + sessionComment + ")",
		},
	}
	res, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return "", fmt.Errorf("failed to add interface to bridge: %w", err)
	}
	if !res.Success {
		return "", fmt.Errorf("bridge port add failed: %w", res.Error)
	}
	return res.ID, nil
}

// commentInterface sets a comment on the trunk ethernet interface.
func (s *Service) commentInterface(ctx context.Context, ifName, sessionComment string) error {
	cmd := router.Command{
		Path:   "/interface/ethernet",
		Action: "set",
		Args: map[string]string{
			"numbers": ifName,
			"comment": "Trunk Interface (" + sessionComment + ")",
		},
	}
	_, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return fmt.Errorf("failed to set interface comment: %w", err)
	}
	return nil
}

// createDHCPClient creates a DHCP client on the specified bridge interface.
func (s *Service) createDHCPClient(ctx context.Context, bridgeName, comment string) (string, error) {
	cmd := router.Command{
		Path:   "/ip/dhcp-client",
		Action: "add",
		Args: map[string]string{
			"interface": bridgeName,
			"comment":   comment,
		},
	}
	res, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return "", fmt.Errorf("failed to create DHCP client: %w", err)
	}
	if !res.Success {
		return "", fmt.Errorf("DHCP client creation failed: %w", res.Error)
	}
	return res.ID, nil
}

// removeByComment removes all resources at the given RouterOS path that carry the comment.
func (s *Service) removeByComment(ctx context.Context, path, comment string) error {
	cmd := router.Command{
		Path:        path,
		Action:      "print",
		QueryFilter: map[string]string{"comment": comment},
		Props:       []string{".id"},
	}
	res, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return fmt.Errorf("failed to query %s: %w", path, err)
	}
	for _, item := range res.Data {
		if id, ok := item[".id"]; ok {
			removeCmd := router.Command{
				Path:   path,
				Action: "remove",
				Args:   map[string]string{".id": id},
			}
			if _, rmErr := s.routerPort.ExecuteCommand(ctx, removeCmd); rmErr != nil {
				s.logger.Warnw("failed to remove resource", "path", path, "id", id, "error", rmErr)
			}
		}
	}
	return nil
}

// createBridgesForNetworks creates all LAN bridges required by the given subnets.
// Mirrors the TS createBridgesForNetworks function from SlaveUtils.ts.
func (s *Service) createBridgesForNetworks(
	ctx context.Context,
	subnets types.Subnets,
	comment string,
	result *ProvisionResult,
) error {

	baseEntries := []struct {
		sub  *types.SubnetConfig
		name string
	}{
		{subnets.BaseSubnets.Split, "LANBridgeSplit"},
		{subnets.BaseSubnets.Domestic, "LANBridgeDomestic"},
		{subnets.BaseSubnets.Foreign, "LANBridgeForeign"},
		{subnets.BaseSubnets.VPN, "LANBridgeVPN"},
	}
	for _, e := range baseEntries {
		if e.sub == nil {
			continue
		}
		id, err := s.createBridge(ctx, e.name, comment)
		if err != nil {
			return fmt.Errorf("failed to create base bridge %s: %w", e.name, err)
		}
		result.BridgeIDs = append(result.BridgeIDs, id)
	}

	for _, sub := range subnets.ForeignSubnets {
		bridgeName := "LANBridgeForeign-" + sub.Name
		id, err := s.createBridge(ctx, bridgeName, comment)
		if err != nil {
			s.logger.Warnw("failed to create foreign bridge", "name", bridgeName, "error", err)
			continue
		}
		result.BridgeIDs = append(result.BridgeIDs, id)
	}

	for _, sub := range subnets.DomesticSubnets {
		bridgeName := "LANBridgeDomestic-" + sub.Name
		id, err := s.createBridge(ctx, bridgeName, comment)
		if err != nil {
			s.logger.Warnw("failed to create domestic bridge", "name", bridgeName, "error", err)
			continue
		}
		result.BridgeIDs = append(result.BridgeIDs, id)
	}

	if subnets.VPNClientSubnets != nil {
		for _, subs := range [][]types.SubnetConfig{
			subnets.VPNClientSubnets.Wireguard,
			subnets.VPNClientSubnets.OpenVPN,
			subnets.VPNClientSubnets.L2TP,
			subnets.VPNClientSubnets.PPTP,
			subnets.VPNClientSubnets.SSTP,
			subnets.VPNClientSubnets.IKev2,
		} {
			for _, sub := range subs {
				bridgeName := "LANBridgeVPN-" + sub.Name
				id, err := s.createBridge(ctx, bridgeName, comment)
				if err != nil {
					s.logger.Warnw("failed to create VPN client bridge", "name", bridgeName, "error", err)
					continue
				}
				result.BridgeIDs = append(result.BridgeIDs, id)
			}
		}
	}

	return nil
}

// createDHCPClientsOnBridges creates DHCP clients on all LAN bridges so the slave
// router can obtain IP addresses from the master's DHCP servers.
// Mirrors the TS createDHCPClientsOnBridges function from SlaveUtils.ts.
func (s *Service) createDHCPClientsOnBridges(
	ctx context.Context,
	subnets types.Subnets,
	comment string,
	result *ProvisionResult,
) error { //nolint:unparam // error return kept for interface consistency

	addClient := func(bridgeName string) {
		id, err := s.createDHCPClient(ctx, bridgeName, comment)
		if err != nil {
			s.logger.Warnw("failed to create DHCP client", "bridge", bridgeName, "error", err)
			return
		}
		result.DHCPClientIDs = append(result.DHCPClientIDs, id)
	}

	if subnets.BaseSubnets.Split != nil {
		addClient("LANBridgeSplit")
	}
	if subnets.BaseSubnets.Domestic != nil {
		addClient("LANBridgeDomestic")
	}
	if subnets.BaseSubnets.Foreign != nil {
		addClient("LANBridgeForeign")
	}
	if subnets.BaseSubnets.VPN != nil {
		addClient("LANBridgeVPN")
	}

	for _, sub := range subnets.ForeignSubnets {
		addClient("LANBridgeForeign-" + sub.Name)
	}
	for _, sub := range subnets.DomesticSubnets {
		addClient("LANBridgeDomestic-" + sub.Name)
	}

	if subnets.VPNClientSubnets != nil {
		for _, subs := range [][]types.SubnetConfig{
			subnets.VPNClientSubnets.Wireguard,
			subnets.VPNClientSubnets.OpenVPN,
			subnets.VPNClientSubnets.L2TP,
			subnets.VPNClientSubnets.PPTP,
			subnets.VPNClientSubnets.SSTP,
			subnets.VPNClientSubnets.IKev2,
		} {
			for _, sub := range subs {
				addClient("LANBridgeVPN-" + sub.Name)
			}
		}
	}

	return nil
}

// vlanInterfaceName constructs the VLAN interface name using the TS convention.
// Format: VLAN{id}-{trunkIF}-{networkName}
func vlanInterfaceName(vlanID int, trunkIF, networkName string) string {
	return fmt.Sprintf("VLAN%d-%s-%s", vlanID, trunkIF, networkName)
}

// thirdOctet extracts the 3rd octet from a CIDR or bare IP address to use as VLAN ID.
// Example: "192.168.10.0/24" → 10, "10.0.5.1" → 5.
func thirdOctet(cidr string) int {
	ipStr := cidr
	if idx := strings.IndexByte(cidr, '/'); idx >= 0 {
		ipStr = cidr[:idx]
	}
	ip := net.ParseIP(ipStr)
	if ip == nil {
		return 0
	}
	ip4 := ip.To4()
	if ip4 == nil {
		return 0
	}
	return int(ip4[2])
}
