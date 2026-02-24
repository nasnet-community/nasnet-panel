package provisioning

import (
	"backend/internal/common/ulid"
	"backend/internal/provisioning/types"
)

// decomposeTunnels converts a Tunnel into individual tunnel.* SessionResources.
func decomposeTunnels(tunnel types.Tunnel) []SessionResource {
	resources := make([]SessionResource, 0, len(tunnel.IPIP)+len(tunnel.Eoip)+len(tunnel.Gre)+len(tunnel.Vxlan))

	for _, ipip := range tunnel.IPIP {
		resources = append(resources, SessionResource{
			ID:           ulid.NewString(),
			ResourceType: "tunnel.ipip",
			Configuration: map[string]interface{}{
				"name":          ipip.Name,
				"localAddress":  ipip.LocalAddress,
				"remoteAddress": ipip.RemoteAddress,
				"enabled":       ipip.Enabled,
				"mtu":           ipip.MTU,
				"allowFastPath": ipip.AllowFastPath,
				"keepAlive":     ipip.KeepAlive,
			},
			Relationships: map[string]interface{}{},
		})
	}

	for _, eoip := range tunnel.Eoip {
		resources = append(resources, SessionResource{
			ID:           ulid.NewString(),
			ResourceType: "tunnel.eoip",
			Configuration: map[string]interface{}{
				"name":          eoip.Name,
				"localAddress":  eoip.LocalAddress,
				"remoteAddress": eoip.RemoteAddress,
				"tunnelId":      eoip.TunnelID,
				"enabled":       eoip.Enabled,
				"mtu":           eoip.MTU,
				"allowFastPath": eoip.AllowFastPath,
				"keepAlive":     eoip.KeepAlive,
			},
			Relationships: map[string]interface{}{},
		})
	}

	for _, gre := range tunnel.Gre {
		resources = append(resources, SessionResource{
			ID:           ulid.NewString(),
			ResourceType: "tunnel.gre",
			Configuration: map[string]interface{}{
				"name":          gre.Name,
				"localAddress":  gre.LocalAddress,
				"remoteAddress": gre.RemoteAddress,
				"enabled":       gre.Enabled,
				"mtu":           gre.MTU,
				"allowFastPath": gre.AllowFastPath,
				"keepAlive":     gre.KeepAlive,
				"keyId":         gre.KeyID,
			},
			Relationships: map[string]interface{}{},
		})
	}

	for _, vxlan := range tunnel.Vxlan {
		resources = append(resources, SessionResource{
			ID:           ulid.NewString(),
			ResourceType: "tunnel.vxlan",
			Configuration: map[string]interface{}{
				"name":          vxlan.Name,
				"localAddress":  vxlan.LocalAddress,
				"remoteAddress": vxlan.RemoteAddress,
				"vni":           vxlan.VNI,
				"vxlanId":       vxlan.VxlanID,
				"vteps":         vxlan.VTeps,
				"fdb":           vxlan.FDB,
				"enabled":       vxlan.Enabled,
				"mtu":           vxlan.MTU,
			},
			Relationships: map[string]interface{}{},
		})
	}

	return resources
}

// decomposeExtraConfig converts an ExtraConfigState into individual system.* SessionResources.
func decomposeExtraConfig(extra types.ExtraConfigState) []SessionResource {
	resources := make([]SessionResource, 0, 10)

	if extra.RouterIdentity != nil {
		resources = append(resources, SessionResource{
			ID:           ulid.NewString(),
			ResourceType: "system.identity",
			Configuration: map[string]interface{}{
				"routerName":    extra.RouterIdentity.RouterName,
				"routerComment": extra.RouterIdentity.RouterComment,
				"romonEnabled":  extra.RouterIdentity.RoMONEnabled,
				"romonSecret":   extra.RouterIdentity.RoMONSecret,
			},
			Relationships: map[string]interface{}{},
		})
	}

	if extra.NTPConfig != nil {
		resources = append(resources, SessionResource{
			ID:           ulid.NewString(),
			ResourceType: "system.ntp",
			Configuration: map[string]interface{}{
				"enabled":     extra.NTPConfig.Enabled,
				"servers":     extra.NTPConfig.Servers,
				"interval":    extra.NTPConfig.Interval,
				"synchronize": extra.NTPConfig.Synchronize,
			},
			Relationships: map[string]interface{}{},
		})
	}

	if extra.ServiceConfig != nil {
		resources = append(resources, SessionResource{
			ID:           ulid.NewString(),
			ResourceType: "system.services",
			Configuration: map[string]interface{}{
				"services": extra.ServiceConfig.Services,
			},
			Relationships: map[string]interface{}{},
		})
	}

	if extra.CloudDDNSConfig != nil {
		resources = append(resources, SessionResource{
			ID:           ulid.NewString(),
			ResourceType: "system.ddns",
			Configuration: map[string]interface{}{
				"enabled": extra.CloudDDNSConfig.Enabled,
				"entries": extra.CloudDDNSConfig.Entries,
			},
			Relationships: map[string]interface{}{},
		})
	}

	if extra.UPNPConfig != nil {
		resources = append(resources, SessionResource{
			ID:           ulid.NewString(),
			ResourceType: "system.upnp",
			Configuration: map[string]interface{}{
				"enabled":            extra.UPNPConfig.Enabled,
				"allowDevice2Device": extra.UPNPConfig.AllowDevice2Device,
				"externalIpAddress":  extra.UPNPConfig.ExternalIPAddress,
				"allowedPorts":       extra.UPNPConfig.AllowedPorts,
				"leaseTime":          extra.UPNPConfig.LeaseTime,
			},
			Relationships: map[string]interface{}{},
		})
	}

	if extra.CertificateConfig != nil {
		resources = append(resources, SessionResource{
			ID:           ulid.NewString(),
			ResourceType: "system.certificate",
			Configuration: map[string]interface{}{
				"enabled":             extra.CertificateConfig.Enabled,
				"certificateProvider": extra.CertificateConfig.CertificateProvider,
				"autoRenew":           extra.CertificateConfig.AutoRenew,
				"renewalDaysBefore":   extra.CertificateConfig.RenewalDaysBefore,
			},
			Relationships: map[string]interface{}{},
		})
	}

	if extra.GraphingConfig != nil {
		resources = append(resources, SessionResource{
			ID:           ulid.NewString(),
			ResourceType: "system.graphing",
			Configuration: map[string]interface{}{
				"enabled":   extra.GraphingConfig.Enabled,
				"interval":  extra.GraphingConfig.Interval,
				"retention": extra.GraphingConfig.Retention,
				"storage":   extra.GraphingConfig.Storage,
			},
			Relationships: map[string]interface{}{},
		})
	}

	if extra.NATPMPConfig != nil {
		resources = append(resources, SessionResource{
			ID:           ulid.NewString(),
			ResourceType: "system.natpmp",
			Configuration: map[string]interface{}{
				"enabled":    extra.NATPMPConfig.Enabled,
				"externalIp": extra.NATPMPConfig.ExternalIP,
				"lifetime":   extra.NATPMPConfig.Lifetime,
			},
			Relationships: map[string]interface{}{},
		})
	}

	if extra.UsefulServices != nil {
		resources = append(resources, SessionResource{
			ID:           ulid.NewString(),
			ResourceType: "system.usefulServices",
			Configuration: map[string]interface{}{
				"smtpRelayEnabled": extra.UsefulServices.SMTPRelayEnabled,
				"dnsRelayEnabled":  extra.UsefulServices.DNSRelayEnabled,
				"proxyEnabled":     extra.UsefulServices.ProxyEnabled,
				"dhcpRelayEnabled": extra.UsefulServices.DHCPRelayEnabled,
				"bandwidthLimit":   extra.UsefulServices.BandwidthLimit,
			},
			Relationships: map[string]interface{}{},
		})
	}

	if extra.RUIConfig != nil {
		resources = append(resources, SessionResource{
			ID:           ulid.NewString(),
			ResourceType: "system.rui",
			Configuration: map[string]interface{}{
				"enabled":        extra.RUIConfig.Enabled,
				"port":           extra.RUIConfig.Port,
				"theme":          extra.RUIConfig.Theme,
				"languageCode":   extra.RUIConfig.LanguageCode,
				"sessionTimeout": extra.RUIConfig.SessionTimeout,
			},
			Relationships: map[string]interface{}{},
		})
	}

	return resources
}
