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

	if err := s.importWANLinks(session.ID, state.WAN); err != nil {
		return nil, err
	}

	if err := s.importVPNClients(session.ID, state.WAN.VPNClient); err != nil {
		return nil, err
	}

	if err := s.importLANResources(session.ID, state.LAN); err != nil {
		return nil, err
	}

	if err := s.importExtraConfig(session.ID, state.Extra); err != nil {
		return nil, err
	}

	return s.GetSession(ctx, session.ID)
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
