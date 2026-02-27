package wan

import (
	"context"
	"fmt"
	"strings"

	"backend/internal/provisioning/types"
	"backend/internal/router"
)

// GetWANInterface returns the final interface name for a WAN link after
// applying MACVLAN/VLAN transformations, matching the TS GetWANInterface() logic.
//
// TS reference: libs/ros-cmd-generator/src/lib/modules/wan/WAN/WANInterfaceUtils.ts
func GetWANInterface(link types.WANLinkConfig) string {
	cfg := link.InterfaceConfig
	name := link.Name
	iface := cfg.InterfaceName

	// PPPoE creates its own virtual interface named pppoe-client-<name>
	// Matches TS GetWANInterface: `pppoe-client-${name}`
	if link.ConnectionConfig != nil && link.ConnectionConfig.PPPoE != nil {
		return "pppoe-client-" + name
	}

	// LTE uses the physical interface directly
	if (link.ConnectionConfig != nil && link.ConnectionConfig.LTESettings != nil) ||
		strings.HasPrefix(strings.ToLower(iface), "lte") {

		return iface
	}

	// MACVLAN on VLAN: MacVLAN-VLAN{vlanId}-{iface}-{name}-{name}
	if cfg.MacAddress != nil && cfg.VLANID != nil {
		vlanName := fmt.Sprintf("VLAN%s-%s-%s", *cfg.VLANID, iface, name)
		return fmt.Sprintf("MacVLAN-%s-%s", vlanName, name)
	}

	// MACVLAN only: MacVLAN-{iface}-{name}
	if cfg.MacAddress != nil {
		return fmt.Sprintf("MacVLAN-%s-%s", iface, name)
	}

	// VLAN with auto-MACVLAN: MacVLAN-VLAN{vlanId}-{iface}-{name}-{name}
	if cfg.VLANID != nil {
		vlanName := fmt.Sprintf("VLAN%s-%s-%s", *cfg.VLANID, iface, name)
		return fmt.Sprintf("MacVLAN-%s-%s", vlanName, name)
	}

	// Auto-MACVLAN for ethernet, wifi, sfp interfaces
	if requiresAutoMACVLAN(iface) {
		return fmt.Sprintf("MacVLAN-%s-%s", iface, name)
	}

	return iface
}

// requiresAutoMACVLAN returns true for interface types that require automatic
// MACVLAN creation (ethernet, wifi, wlan, sfp).
//
// TS reference: requiresAutoMACVLAN() in WANInterfaceUtils.ts
func requiresAutoMACVLAN(interfaceName string) bool {
	lower := strings.ToLower(interfaceName)
	return strings.HasPrefix(lower, "ether") ||
		strings.HasPrefix(lower, "wifi") ||
		strings.HasPrefix(lower, "wlan") ||
		strings.HasPrefix(lower, "sfp")
}

// provisionInterfaceConfig creates the MACVLAN/VLAN virtual interfaces needed
// for a WAN link before the connection (DHCP/PPPoE/Static) is configured.
//
// This mirrors the TS generateInterfaceConfig() function.
//
// TS reference: libs/ros-cmd-generator/src/lib/modules/wan/WAN/WANInterface.ts
func (s *Service) provisionInterfaceConfig(
	ctx context.Context,
	link types.WANLinkConfig,
	comment string,
) error {

	cfg := link.InterfaceConfig
	name := link.Name
	iface := cfg.InterfaceName

	// LTE: no virtual interfaces needed
	if strings.HasPrefix(strings.ToLower(iface), "lte") {
		return nil
	}

	switch {
	case cfg.MacAddress != nil && cfg.VLANID != nil:
		// 1. Create VLAN interface
		vlanName := fmt.Sprintf("VLAN%s-%s-%s", *cfg.VLANID, iface, name)
		if err := s.createVLAN(ctx, vlanName, iface, *cfg.VLANID, comment); err != nil {
			return err
		}
		// 2. Create MACVLAN on top of VLAN
		macvlanName := fmt.Sprintf("MacVLAN-%s-%s", vlanName, name)
		return s.createMACVLAN(ctx, macvlanName, vlanName, cfg.MacAddress, comment)

	case cfg.MacAddress != nil:
		// MACVLAN only
		macvlanName := fmt.Sprintf("MacVLAN-%s-%s", iface, name)
		return s.createMACVLAN(ctx, macvlanName, iface, cfg.MacAddress, comment)

	case cfg.VLANID != nil:
		// VLAN + auto-MACVLAN
		vlanName := fmt.Sprintf("VLAN%s-%s-%s", *cfg.VLANID, iface, name)
		if err := s.createVLAN(ctx, vlanName, iface, *cfg.VLANID, comment); err != nil {
			return err
		}
		macvlanName := fmt.Sprintf("MacVLAN-%s-%s", vlanName, name)
		return s.createMACVLAN(ctx, macvlanName, vlanName, nil, comment)

	case requiresAutoMACVLAN(iface):
		// Auto-MACVLAN for ethernet/wifi/sfp
		macvlanName := fmt.Sprintf("MacVLAN-%s-%s", iface, name)
		return s.createMACVLAN(ctx, macvlanName, iface, nil, comment)
	}

	return nil
}

// createVLAN creates a VLAN sub-interface.
// RouterOS: /interface/vlan/add name=<n> interface=<parent> vlan-id=<id>
func (s *Service) createVLAN(
	ctx context.Context,
	vlanName, parentIface, vlanID, comment string,
) error {

	args := map[string]string{
		"name":      vlanName,
		"interface": parentIface,
		"vlan-id":   vlanID,
		"comment":   comment,
	}

	cmd := router.Command{
		Path:   "/interface/vlan",
		Action: "add",
		Args:   args,
	}

	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return fmt.Errorf("failed to create VLAN interface %s: %w", vlanName, err)
	}

	if !result.Success {
		return fmt.Errorf("VLAN interface creation failed for %s: %w", vlanName, result.Error)
	}

	s.logger.Infow("VLAN interface created", "name", vlanName, "parent", parentIface, "vlanID", vlanID)
	return nil
}

// createMACVLAN creates a MACVLAN interface on top of a parent interface.
// RouterOS: /interface/macvlan/add name=<n> interface=<parent> mode=private [mac-address=<mac>]
func (s *Service) createMACVLAN(
	ctx context.Context,
	macvlanName, parentIface string,
	macAddress *string,
	comment string,
) error {

	args := map[string]string{
		"name":      macvlanName,
		"interface": parentIface,
		"mode":      "private",
		"comment":   comment,
	}

	if macAddress != nil && *macAddress != "" {
		args["mac-address"] = *macAddress
	}

	cmd := router.Command{
		Path:   "/interface/macvlan",
		Action: "add",
		Args:   args,
	}

	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return fmt.Errorf("failed to create MACVLAN interface %s: %w", macvlanName, err)
	}

	if !result.Success {
		return fmt.Errorf("MACVLAN interface creation failed for %s: %w", macvlanName, result.Error)
	}

	s.logger.Infow("MACVLAN interface created", "name", macvlanName, "parent", parentIface)
	return nil
}

// addToWANList adds the final WAN interface to BOTH "WAN" and "${Network}-WAN" interface lists.
// This matches TS WANIfaceList() behavior which adds to both lists:
//   - list="WAN"  (all WAN interfaces)
//   - list="${Network}-WAN"  (e.g., "Foreign-WAN" or "Domestic-WAN")
//
// RouterOS: /interface/list/member/add list=WAN interface=<name>
//
//	/interface/list/member/add list=Foreign-WAN interface=<name>
func (s *Service) addToWANList(
	ctx context.Context,
	interfaceName, networkType, comment string,
) error {

	// networkType is "domestic" or "foreign" — capitalize for list name
	networkName := "Foreign"
	if networkType == "domestic" {
		networkName = "Domestic"
	}

	// Add to "WAN" list (all WAN interfaces)
	cmd := router.Command{
		Path:   "/interface/list/member",
		Action: "add",
		Args: map[string]string{
			"list":      "WAN",
			"interface": interfaceName,
			"comment":   comment,
		},
	}

	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return fmt.Errorf("failed to add %s to WAN interface list: %w", interfaceName, err)
	}
	if !result.Success {
		return fmt.Errorf("adding %s to WAN interface list failed: %w", interfaceName, result.Error)
	}

	s.logger.Infow("interface added to WAN list", "interface", interfaceName, "list", "WAN")

	// Add to "${Network}-WAN" list (e.g., "Foreign-WAN" or "Domestic-WAN")
	networkListName := networkName + "-WAN"
	cmd2 := router.Command{
		Path:   "/interface/list/member",
		Action: "add",
		Args: map[string]string{
			"list":      networkListName,
			"interface": interfaceName,
			"comment":   comment,
		},
	}

	result2, err2 := s.routerPort.ExecuteCommand(ctx, cmd2)
	if err2 != nil {
		// Non-critical: log and continue if ${Network}-WAN list doesn't exist yet
		s.logger.Warnw("failed to add interface to network-specific WAN list",
			"interface", interfaceName,
			"list", networkListName,
			"error", err2,
		)
		return nil
	}
	if !result2.Success {
		s.logger.Warnw("adding interface to network-specific WAN list failed",
			"interface", interfaceName,
			"list", networkListName,
			"error", result2.Error,
		)
		return nil
	}

	s.logger.Infow("interface added to network-specific WAN list", "interface", interfaceName, "list", networkListName)
	return nil
}
