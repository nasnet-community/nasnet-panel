package provisioning

import (
	"backend/internal/common/ulid"
	"backend/internal/provisioning/types"
)

// decomposeVPNServers converts a VPNServer into individual vpn.*.server SessionResources.
func decomposeVPNServers(vpnServer types.VPNServer) []SessionResource {
	resources := make([]SessionResource, 0, len(vpnServer.WireguardServers)+8)

	for _, wg := range vpnServer.WireguardServers {
		resources = append(resources, SessionResource{
			ID:           ulid.NewString(),
			ResourceType: "vpn.wireguard.server",
			Configuration: map[string]interface{}{
				"name":      wg.Name,
				"interface": wg.Interface,
				"peers":     wg.Peers,
			},
			Relationships: map[string]interface{}{},
		})
	}

	if vpnServer.PptpServer != nil {
		resources = append(resources, SessionResource{
			ID:           ulid.NewString(),
			ResourceType: "vpn.pptp.server",
			Configuration: map[string]interface{}{
				"server": vpnServer.PptpServer,
				"users":  vpnServer.Users,
			},
			Relationships: map[string]interface{}{},
		})
	}

	if vpnServer.L2tpServer != nil {
		resources = append(resources, SessionResource{
			ID:           ulid.NewString(),
			ResourceType: "vpn.l2tp.server",
			Configuration: map[string]interface{}{
				"server": vpnServer.L2tpServer,
				"users":  vpnServer.Users,
			},
			Relationships: map[string]interface{}{},
		})
	}

	if vpnServer.SstpServer != nil {
		resources = append(resources, SessionResource{
			ID:           ulid.NewString(),
			ResourceType: "vpn.sstp.server",
			Configuration: map[string]interface{}{
				"server": vpnServer.SstpServer,
				"users":  vpnServer.Users,
			},
			Relationships: map[string]interface{}{},
		})
	}

	if vpnServer.OpenVpnServer != nil {
		resources = append(resources, SessionResource{
			ID:           ulid.NewString(),
			ResourceType: "vpn.openvpn.server",
			Configuration: map[string]interface{}{
				"server": vpnServer.OpenVpnServer,
				"users":  vpnServer.Users,
			},
			Relationships: map[string]interface{}{},
		})
	}

	if vpnServer.Ikev2Server != nil {
		resources = append(resources, SessionResource{
			ID:           ulid.NewString(),
			ResourceType: "vpn.ikev2.server",
			Configuration: map[string]interface{}{
				"server": vpnServer.Ikev2Server,
			},
			Relationships: map[string]interface{}{},
		})
	}

	if vpnServer.Socks5Server != nil {
		resources = append(resources, SessionResource{
			ID:           ulid.NewString(),
			ResourceType: "vpn.socks5.server",
			Configuration: map[string]interface{}{
				"server": vpnServer.Socks5Server,
			},
			Relationships: map[string]interface{}{},
		})
	}

	if vpnServer.SSHServer != nil {
		resources = append(resources, SessionResource{
			ID:           ulid.NewString(),
			ResourceType: "vpn.ssh.server",
			Configuration: map[string]interface{}{
				"server": vpnServer.SSHServer,
			},
			Relationships: map[string]interface{}{},
		})
	}

	if vpnServer.HTTPProxyServer != nil {
		resources = append(resources, SessionResource{
			ID:           ulid.NewString(),
			ResourceType: "vpn.httpproxy.server",
			Configuration: map[string]interface{}{
				"server": vpnServer.HTTPProxyServer,
			},
			Relationships: map[string]interface{}{},
		})
	}

	if vpnServer.BackToHomeServer != nil {
		resources = append(resources, SessionResource{
			ID:           ulid.NewString(),
			ResourceType: "vpn.backtohome.server",
			Configuration: map[string]interface{}{
				"server": vpnServer.BackToHomeServer,
			},
			Relationships: map[string]interface{}{},
		})
	}

	if vpnServer.ZeroTierServer != nil {
		resources = append(resources, SessionResource{
			ID:           ulid.NewString(),
			ResourceType: "vpn.zerotier.server",
			Configuration: map[string]interface{}{
				"server": vpnServer.ZeroTierServer,
			},
			Relationships: map[string]interface{}{},
		})
	}

	return resources
}
