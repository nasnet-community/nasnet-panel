package trunk

import (
	"context"
	"fmt"

	"backend/internal/provisioning/types"
)

// createVLANsForInterface creates VLAN sub-interfaces on the given trunk interface
// for all base subnets, additional foreign/domestic subnets, and VPN client subnets.
// VLAN ID is derived from the 3rd octet of each subnet address (TS convention).
// VLAN name format: VLAN{id}-{trunkIF}-{networkName}
func (s *Service) createVLANsForInterface(
	ctx context.Context,
	trunkIF string,
	subnets types.Subnets,
	comment string,
	result *ProvisionResult,
) error {

	baseEntries := []struct {
		sub  *types.SubnetConfig
		name string
	}{
		{subnets.BaseSubnets.Split, "Split"},
		{subnets.BaseSubnets.Domestic, "Domestic"},
		{subnets.BaseSubnets.Foreign, "Foreign"},
		{subnets.BaseSubnets.VPN, "VPN"},
	}
	for _, e := range baseEntries {
		if e.sub == nil {
			continue
		}
		vlanID := thirdOctet(e.sub.Subnet)
		if vlanID == 0 {
			continue
		}
		id, err := s.createVLAN(ctx, trunkIF, vlanID, e.name, e.name+" Network VLAN", comment)
		if err != nil {
			return fmt.Errorf("VLAN for %s: %w", e.name, err)
		}
		result.VLANIDs = append(result.VLANIDs, id)
	}

	for _, sub := range subnets.ForeignSubnets {
		vlanID := thirdOctet(sub.Subnet)
		if vlanID == 0 {
			continue
		}
		networkName := "Foreign-" + sub.Name
		id, err := s.createVLAN(ctx, trunkIF, vlanID, networkName, networkName+" Network VLAN", comment)
		if err != nil {
			s.logger.Warnw("failed to create additional foreign VLAN", "subnet", sub.Name, "vlanID", vlanID, "error", err)
			continue
		}
		result.VLANIDs = append(result.VLANIDs, id)
	}

	for _, sub := range subnets.DomesticSubnets {
		vlanID := thirdOctet(sub.Subnet)
		if vlanID == 0 {
			continue
		}
		networkName := "Domestic-" + sub.Name
		id, err := s.createVLAN(ctx, trunkIF, vlanID, networkName, networkName+" Network VLAN", comment)
		if err != nil {
			s.logger.Warnw("failed to create additional domestic VLAN", "subnet", sub.Name, "vlanID", vlanID, "error", err)
			continue
		}
		result.VLANIDs = append(result.VLANIDs, id)
	}

	if subnets.VPNClientSubnets != nil {
		if err := s.createVPNClientVLANs(ctx, trunkIF, subnets.VPNClientSubnets, comment, result); err != nil {
			return fmt.Errorf("VPN client VLANs: %w", err)
		}
	}

	return nil
}

// createVPNClientVLANs creates VLAN sub-interfaces for all VPN client subnet types
// (Wireguard, OpenVPN, L2TP, PPTP, SSTP, IKEv2).
func (s *Service) createVPNClientVLANs(
	ctx context.Context,
	trunkIF string,
	vpn *types.VPNClientSubnets,
	comment string,
	result *ProvisionResult,
) error { //nolint:unparam // error return kept for interface consistency

	type vpnEntry struct {
		subs   []types.SubnetConfig
		prefix string
	}
	entries := []vpnEntry{
		{vpn.Wireguard, "WG-Client"},
		{vpn.OpenVPN, "OVPN-Client"},
		{vpn.L2TP, "L2TP-Client"},
		{vpn.PPTP, "PPTP-Client"},
		{vpn.SSTP, "SSTP-Client"},
		{vpn.IKev2, "IKEv2-Client"},
	}
	for _, e := range entries {
		for _, sub := range e.subs {
			vlanID := thirdOctet(sub.Subnet)
			if vlanID == 0 {
				continue
			}
			networkName := e.prefix + "-" + sub.Name
			id, err := s.createVLAN(ctx, trunkIF, vlanID, networkName, networkName+" Network VLAN", comment)

			if err != nil {
				s.logger.Warnw("failed to create VPN client VLAN",
					"type", e.prefix, "subnet", sub.Name, "vlanID", vlanID, "error", err)
				continue
			}
			result.VLANIDs = append(result.VLANIDs, id)
		}
	}
	return nil
}

// addVLANsToBridges adds each VLAN interface to its corresponding LAN bridge.
// Mirrors the TS addVLANsToBridges function from SlaveUtils.ts.
func (s *Service) addVLANsToBridges(
	ctx context.Context,
	trunkIF string,
	subnets types.Subnets,
	comment string,
	result *ProvisionResult,
) error {

	baseEntries := []struct {
		sub        *types.SubnetConfig
		name       string
		bridgeName string
	}{
		{subnets.BaseSubnets.Split, "Split", "LANBridgeSplit"},
		{subnets.BaseSubnets.Domestic, "Domestic", "LANBridgeDomestic"},
		{subnets.BaseSubnets.Foreign, "Foreign", "LANBridgeForeign"},
		{subnets.BaseSubnets.VPN, "VPN", "LANBridgeVPN"},
	}
	for _, e := range baseEntries {
		if e.sub == nil {
			continue
		}
		vlanID := thirdOctet(e.sub.Subnet)
		if vlanID == 0 {
			continue
		}
		vlanName := vlanInterfaceName(vlanID, trunkIF, e.name)
		portID, err := s.addToBridge(ctx, vlanName, e.bridgeName, e.name+" VLAN to Bridge", comment)
		if err != nil {
			return fmt.Errorf("bridge port for %s: %w", e.name, err)
		}
		result.BridgePortIDs = append(result.BridgePortIDs, portID)
	}

	for _, sub := range subnets.ForeignSubnets {
		vlanID := thirdOctet(sub.Subnet)
		if vlanID == 0 {
			continue
		}
		networkName := "Foreign-" + sub.Name
		vlanName := vlanInterfaceName(vlanID, trunkIF, networkName)
		portID, err := s.addToBridge(ctx, vlanName, "LANBridgeForeign-"+sub.Name, networkName+" VLAN to Bridge", comment)
		if err != nil {
			s.logger.Warnw("failed to add foreign VLAN to bridge", "subnet", sub.Name, "error", err)
			continue
		}
		result.BridgePortIDs = append(result.BridgePortIDs, portID)
	}

	for _, sub := range subnets.DomesticSubnets {
		vlanID := thirdOctet(sub.Subnet)
		if vlanID == 0 {
			continue
		}
		networkName := "Domestic-" + sub.Name
		vlanName := vlanInterfaceName(vlanID, trunkIF, networkName)
		portID, err := s.addToBridge(ctx, vlanName, "LANBridgeDomestic-"+sub.Name, networkName+" VLAN to Bridge", comment)
		if err != nil {
			s.logger.Warnw("failed to add domestic VLAN to bridge", "subnet", sub.Name, "error", err)
			continue
		}
		result.BridgePortIDs = append(result.BridgePortIDs, portID)
	}

	if subnets.VPNClientSubnets != nil {
		if err := s.addVPNClientVLANsToBridges(ctx, trunkIF, subnets.VPNClientSubnets, comment, result); err != nil {
			s.logger.Warnw("failed to add some VPN client VLANs to bridges", "error", err)
		}
	}

	return nil
}

// addVPNClientVLANsToBridges adds VPN client VLAN interfaces to their LANBridgeVPN-{name} bridges.
func (s *Service) addVPNClientVLANsToBridges(
	ctx context.Context,
	trunkIF string,
	vpn *types.VPNClientSubnets,
	comment string,
	result *ProvisionResult,
) error { //nolint:unparam // error return kept for interface consistency

	type vpnEntry struct {
		subs   []types.SubnetConfig
		prefix string
	}
	entries := []vpnEntry{
		{vpn.Wireguard, "WG-Client"},
		{vpn.OpenVPN, "OVPN-Client"},
		{vpn.L2TP, "L2TP-Client"},
		{vpn.PPTP, "PPTP-Client"},
		{vpn.SSTP, "SSTP-Client"},
		{vpn.IKev2, "IKEv2-Client"},
	}
	for _, e := range entries {
		for _, sub := range e.subs {
			vlanID := thirdOctet(sub.Subnet)
			if vlanID == 0 {
				continue
			}
			networkName := e.prefix + "-" + sub.Name
			vlanName := vlanInterfaceName(vlanID, trunkIF, networkName)
			portID, err := s.addToBridge(ctx, vlanName, "LANBridgeVPN-"+sub.Name, networkName+" VLAN to Bridge", comment)
			if err != nil {
				s.logger.Warnw("failed to add VPN client VLAN to bridge",
					"type", e.prefix, "subnet", sub.Name, "error", err)
				continue
			}
			result.BridgePortIDs = append(result.BridgePortIDs, portID)
		}
	}
	return nil
}
