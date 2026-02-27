package provisioning

import (
	"context"
	"fmt"

	"backend/internal/common/ulid"
	"backend/internal/provisioning/types"
)

// ImportStarState decomposes a StarState into a new session populated with
// individual SessionResource entries for WAN links, VPN clients, VPN servers,
// tunnels, and extra system configuration.
func (s *Service) ImportStarState(ctx context.Context, routerID string, state types.StarState) (*Session, error) {
	session, err := s.CreateSession(ctx, routerID, state)
	if err != nil {
		return nil, fmt.Errorf("creating session: %w", err)
	}

	// Foundational resources (always present)
	if err := s.importBaseConfig(session.ID); err != nil {
		return nil, err
	}
	if err := s.importSecurity(session.ID); err != nil {
		return nil, err
	}

	// Network resources
	if err := s.importNetworks(session.ID, state.Choose, state.LAN); err != nil {
		return nil, err
	}

	// WAN links
	if err := s.importWANLinks(session.ID, state.WAN); err != nil {
		return nil, err
	}
	if err := s.importVPNClients(session.ID, state.WAN.VPNClient); err != nil {
		return nil, err
	}

	// LAN resources
	if err := s.importLANResources(session.ID, state.LAN); err != nil {
		return nil, err
	}

	// Wireless
	if err := s.importWireless(session.ID, state.LAN); err != nil {
		return nil, err
	}

	// Extra config
	if err := s.importExtraConfig(session.ID, state.Extra); err != nil {
		return nil, err
	}

	// Games and schedules
	if err := s.importGames(session.ID, state.Extra); err != nil {
		return nil, err
	}
	if err := s.importSchedules(session.ID, state.Extra); err != nil {
		return nil, err
	}

	return s.GetSession(ctx, session.ID)
}

// importBaseConfig adds a foundational system.baseconfig resource (always present).
func (s *Service) importBaseConfig(sessionID string) error {
	r := SessionResource{
		ID:            ulid.NewString(),
		ResourceType:  "system.baseconfig",
		Configuration: map[string]interface{}{},
		Relationships: map[string]interface{}{},
	}
	return s.addResource(sessionID, r)
}

// importSecurity adds a foundational system.security resource (always present).
func (s *Service) importSecurity(sessionID string) error {
	r := SessionResource{
		ID:            ulid.NewString(),
		ResourceType:  "system.security",
		Configuration: map[string]interface{}{},
		Relationships: map[string]interface{}{},
	}
	return s.addResource(sessionID, r)
}

// importNetworks decomposes LAN subnets into lan.network.* resources.
func (s *Service) importNetworks(sessionID string, _ types.ChooseState, lan *types.LANState) error {
	if lan == nil || lan.Subnets == nil {
		return nil
	}
	subnets := lan.Subnets

	if subnets.BaseSubnets.Split != nil {
		if err := s.addNetworkResource(sessionID, "lan.network.split", *subnets.BaseSubnets.Split); err != nil {
			return err
		}
	}
	if subnets.BaseSubnets.Domestic != nil {
		if err := s.addNetworkResource(sessionID, "lan.network.domestic", *subnets.BaseSubnets.Domestic); err != nil {
			return err
		}
	}
	if subnets.BaseSubnets.Foreign != nil {
		if err := s.addNetworkResource(sessionID, "lan.network.foreign", *subnets.BaseSubnets.Foreign); err != nil {
			return err
		}
	}
	if subnets.BaseSubnets.VPN != nil {
		if err := s.addNetworkResource(sessionID, "lan.network.vpn", *subnets.BaseSubnets.VPN); err != nil {
			return err
		}
	}

	for _, sub := range subnets.ForeignSubnets {
		if err := s.addNetworkResource(sessionID, "lan.network.foreign", sub); err != nil {
			return err
		}
	}
	for _, sub := range subnets.DomesticSubnets {
		if err := s.addNetworkResource(sessionID, "lan.network.domestic", sub); err != nil {
			return err
		}
	}

	return nil
}

// addNetworkResource adds a single lan.network.* resource.
func (s *Service) addNetworkResource(sessionID, resourceType string, subnet types.SubnetConfig) error {
	r := SessionResource{
		ID:           ulid.NewString(),
		ResourceType: resourceType,
		Configuration: map[string]interface{}{
			"name":   subnet.Name,
			"subnet": subnet.Subnet,
		},
		Relationships: map[string]interface{}{},
	}
	return s.addResource(sessionID, r)
}

// importWireless decomposes LAN wireless configs into system.wireless.* resources.
func (s *Service) importWireless(sessionID string, lan *types.LANState) error {
	if lan == nil || len(lan.Wireless) == 0 {
		return nil
	}
	for i, wCfg := range lan.Wireless {
		r := SessionResource{
			ID:           ulid.NewString(),
			ResourceType: fmt.Sprintf("system.wireless.%d", i),
			Configuration: map[string]interface{}{
				"ssid":        wCfg.SSID,
				"password":    wCfg.Password,
				"isHide":      wCfg.IsHide,
				"isDisabled":  wCfg.IsDisabled,
				"splitBand":   wCfg.SplitBand,
				"wifiTarget":  wCfg.WifiTarget,
				"networkName": wCfg.NetworkName,
			},
			Relationships: map[string]interface{}{},
		}
		if err := s.addResource(sessionID, r); err != nil {
			return fmt.Errorf("adding wireless resource %d: %w", i, err)
		}
	}
	return nil
}

// importGames decomposes extra game entries into system.game.* resources.
func (s *Service) importGames(sessionID string, extra *types.ExtraConfigState) error {
	if extra == nil || len(extra.Games) == 0 {
		return nil
	}
	for i, game := range extra.Games {
		r := SessionResource{
			ID:           ulid.NewString(),
			ResourceType: fmt.Sprintf("system.game.%d", i),
			Configuration: map[string]interface{}{
				"name":    game.Name,
				"network": game.Network,
				"ports":   game.Ports,
			},
			Relationships: map[string]interface{}{},
		}
		if err := s.addResource(sessionID, r); err != nil {
			return fmt.Errorf("adding game resource %d: %w", i, err)
		}
	}
	return nil
}

// importSchedules decomposes RUIConfig schedule fields into system.scheduler.* resources.
func (s *Service) importSchedules(sessionID string, extra *types.ExtraConfigState) error {
	if extra == nil || extra.RUIConfig == nil {
		return nil
	}
	rui := extra.RUIConfig

	if rui.Timezone != nil {
		r := SessionResource{
			ID:           ulid.NewString(),
			ResourceType: "system.scheduler.timezone",
			Configuration: map[string]interface{}{
				"timezone": *rui.Timezone,
			},
			Relationships: map[string]interface{}{},
		}
		if err := s.addResource(sessionID, r); err != nil {
			return fmt.Errorf("adding timezone resource: %w", err)
		}
	}

	if rui.Reboot != nil {
		r := SessionResource{
			ID:           ulid.NewString(),
			ResourceType: "system.scheduler.reboot",
			Configuration: map[string]interface{}{
				"interval": rui.Reboot.Interval,
				"time":     rui.Reboot.Time,
			},
			Relationships: map[string]interface{}{},
		}
		if err := s.addResource(sessionID, r); err != nil {
			return fmt.Errorf("adding reboot schedule resource: %w", err)
		}
	}

	if rui.Update != nil {
		r := SessionResource{
			ID:           ulid.NewString(),
			ResourceType: "system.scheduler.update",
			Configuration: map[string]interface{}{
				"interval": rui.Update.Interval,
				"time":     rui.Update.Time,
			},
			Relationships: map[string]interface{}{},
		}
		if err := s.addResource(sessionID, r); err != nil {
			return fmt.Errorf("adding update schedule resource: %w", err)
		}
	}

	if rui.IPAddressUpdate != nil {
		r := SessionResource{
			ID:           ulid.NewString(),
			ResourceType: "system.scheduler.ipaddress",
			Configuration: map[string]interface{}{
				"interval": rui.IPAddressUpdate.Interval,
				"time":     rui.IPAddressUpdate.Time,
			},
			Relationships: map[string]interface{}{},
		}
		if err := s.addResource(sessionID, r); err != nil {
			return fmt.Errorf("adding IP address update schedule resource: %w", err)
		}
	}

	return nil
}

// importWANLinks decomposes WANState into wan.link.* and wan.multilink.* resources.
func (s *Service) importWANLinks(sessionID string, wanState types.WANState) error {
	if err := s.appendWANLinkGroup(sessionID, wanState.WANLink.Domestic, "domestic"); err != nil {
		return err
	}
	if err := s.appendWANLinkGroup(sessionID, wanState.WANLink.Foreign, "foreign"); err != nil {
		return err
	}
	if wanState.DNSConfig != nil {
		r := SessionResource{
			ID:           ulid.NewString(),
			ResourceType: "system.dns",
			Configuration: map[string]interface{}{
				"dnsConfig": wanState.DNSConfig,
			},
			Relationships: map[string]interface{}{},
		}
		if err := s.addResource(sessionID, r); err != nil {
			return fmt.Errorf("adding system.dns resource: %w", err)
		}
	}
	return nil
}

// importVPNClients adds VPN client resources from a WAN VPNClient config.
func (s *Service) importVPNClients(sessionID string, vpnClient *types.VPNClient) error {
	if vpnClient == nil {
		return nil
	}
	for _, r := range decomposeVPNClients(*vpnClient) {
		if err := s.addResource(sessionID, r); err != nil {
			return fmt.Errorf("adding vpn client resource: %w", err)
		}
	}
	return nil
}

// importLANResources adds VPN server and tunnel resources from the LAN state.
func (s *Service) importLANResources(sessionID string, lan *types.LANState) error {
	if lan == nil {
		return nil
	}
	if err := s.importVPNServers(sessionID, lan.VPNServer); err != nil {
		return err
	}
	return s.importTunnels(sessionID, lan.Tunnel)
}

// importVPNServers adds VPN server resources from a LAN VPNServer config.
func (s *Service) importVPNServers(sessionID string, vpnServer *types.VPNServer) error {
	if vpnServer == nil {
		return nil
	}
	for _, r := range decomposeVPNServers(*vpnServer) {
		if err := s.addResource(sessionID, r); err != nil {
			return fmt.Errorf("adding vpn server resource: %w", err)
		}
	}
	return nil
}

// importTunnels adds tunnel resources from a LAN Tunnel config.
func (s *Service) importTunnels(sessionID string, tunnel *types.Tunnel) error {
	if tunnel == nil {
		return nil
	}
	for _, r := range decomposeTunnels(*tunnel) {
		if err := s.addResource(sessionID, r); err != nil {
			return fmt.Errorf("adding tunnel resource: %w", err)
		}
	}
	return nil
}

// importExtraConfig adds system config resources from an ExtraConfigState.
func (s *Service) importExtraConfig(sessionID string, extra *types.ExtraConfigState) error {
	if extra == nil {
		return nil
	}
	for _, r := range decomposeExtraConfig(*extra) {
		if err := s.addResource(sessionID, r); err != nil {
			return fmt.Errorf("adding extra config resource: %w", err)
		}
	}
	return nil
}

// appendWANLinkGroup adds wan.link.* and optionally wan.multilink.* resources for one link group.
func (s *Service) appendWANLinkGroup(sessionID string, links *types.WANLink, linkType string) error {
	if links == nil {
		return nil
	}
	for _, cfg := range links.WANConfigs {
		r := SessionResource{
			ID:           ulid.NewString(),
			ResourceType: "wan.link." + linkType,
			Configuration: map[string]interface{}{
				"name":             cfg.Name,
				"interfaceConfig":  cfg.InterfaceConfig,
				"connectionConfig": cfg.ConnectionConfig,
				"priority":         cfg.Priority,
				"weight":           cfg.Weight,
			},
			Relationships: map[string]interface{}{},
		}
		if err := s.addResource(sessionID, r); err != nil {
			return fmt.Errorf("adding wan.link.%s resource: %w", linkType, err)
		}
	}
	if links.MultiLinkConfig != nil {
		r := SessionResource{
			ID:           ulid.NewString(),
			ResourceType: "wan.multilink." + linkType,
			Configuration: map[string]interface{}{
				"multiLinkConfig": links.MultiLinkConfig,
			},
			Relationships: map[string]interface{}{},
		}
		if err := s.addResource(sessionID, r); err != nil {
			return fmt.Errorf("adding wan.multilink.%s resource: %w", linkType, err)
		}
	}
	return nil
}
