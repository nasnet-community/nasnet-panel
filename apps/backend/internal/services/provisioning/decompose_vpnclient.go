package provisioning

import (
	"backend/internal/common/ulid"
	"backend/internal/provisioning/types"
)

// decomposeVPNClients converts a VPNClient into individual vpn.*.client SessionResources.
func decomposeVPNClients(vpnClient types.VPNClient) []SessionResource {
	resources := make([]SessionResource, 0, len(vpnClient.Wireguard)+len(vpnClient.OpenVPN)+len(vpnClient.PPTP)+len(vpnClient.L2TP)+len(vpnClient.SSTP)+len(vpnClient.IKev2))

	for _, wg := range vpnClient.Wireguard {
		resources = append(resources, SessionResource{
			ID:           ulid.NewString(),
			ResourceType: "vpn.wireguard.client",
			Configuration: map[string]interface{}{
				"name":                    wg.Name,
				"interfacePrivateKey":     wg.InterfacePrivateKey,
				"interfaceAddress":        wg.InterfaceAddress,
				"interfaceListenPort":     wg.InterfaceListenPort,
				"interfaceMtu":            wg.InterfaceMTU,
				"interfaceDns":            wg.InterfaceDNS,
				"peerPublicKey":           wg.PeerPublicKey,
				"peerEndpointAddress":     wg.PeerEndpointAddress,
				"peerEndpointPort":        wg.PeerEndpointPort,
				"peerAllowedIps":          wg.PeerAllowedIPs,
				"peerPresharedKey":        wg.PeerPresharedKey,
				"peerPersistentKeepalive": wg.PeerPersistentKeepalive,
				"priority":                wg.Priority,
				"weight":                  wg.Weight,
				"wanInterface":            wg.WANInterface,
			},
			Relationships: map[string]interface{}{},
		})
	}

	for _, ovpn := range vpnClient.OpenVPN {
		resources = append(resources, SessionResource{
			ID:           ulid.NewString(),
			ResourceType: "vpn.openvpn.client",
			Configuration: map[string]interface{}{
				"name":                    ovpn.Name,
				"server":                  ovpn.Server,
				"mode":                    ovpn.Mode,
				"protocol":                ovpn.Protocol,
				"credentials":             ovpn.Credentials,
				"authType":                ovpn.AuthType,
				"cipher":                  ovpn.Cipher,
				"tlsVersion":              ovpn.TLSVersion,
				"certificates":            ovpn.Certificates,
				"verifyServerCertificate": ovpn.VerifyServerCertificate,
				"routeNoPull":             ovpn.RouteNoPull,
				"priority":                ovpn.Priority,
				"weight":                  ovpn.Weight,
				"wanInterface":            ovpn.WANInterface,
			},
			Relationships: map[string]interface{}{},
		})
	}

	for _, pptp := range vpnClient.PPTP {
		resources = append(resources, SessionResource{
			ID:           ulid.NewString(),
			ResourceType: "vpn.pptp.client",
			Configuration: map[string]interface{}{
				"name":             pptp.Name,
				"connectTo":        pptp.ConnectTo,
				"credentials":      pptp.Credentials,
				"authMethod":       pptp.AuthMethod,
				"keepaliveTimeout": pptp.KeepaliveTimeout,
				"dialOnDemand":     pptp.DialOnDemand,
				"priority":         pptp.Priority,
				"weight":           pptp.Weight,
				"wanInterface":     pptp.WANInterface,
			},
			Relationships: map[string]interface{}{},
		})
	}

	for _, l2tp := range vpnClient.L2TP {
		resources = append(resources, SessionResource{
			ID:           ulid.NewString(),
			ResourceType: "vpn.l2tp.client",
			Configuration: map[string]interface{}{
				"name":         l2tp.Name,
				"server":       l2tp.Server,
				"credentials":  l2tp.Credentials,
				"useIpsec":     l2tp.UseIPsec,
				"ipsecSecret":  l2tp.IPsecSecret,
				"authMethod":   l2tp.AuthMethod,
				"protoVersion": l2tp.ProtoVersion,
				"fastPath":     l2tp.FastPath,
				"keepAlive":    l2tp.KeepAlive,
				"dialOnDemand": l2tp.DialOnDemand,
				"priority":     l2tp.Priority,
				"weight":       l2tp.Weight,
				"wanInterface": l2tp.WANInterface,
			},
			Relationships: map[string]interface{}{},
		})
	}

	for _, sstp := range vpnClient.SSTP {
		resources = append(resources, SessionResource{
			ID:           ulid.NewString(),
			ResourceType: "vpn.sstp.client",
			Configuration: map[string]interface{}{
				"name":                               sstp.Name,
				"server":                             sstp.Server,
				"credentials":                        sstp.Credentials,
				"authMethod":                         sstp.AuthMethod,
				"ciphers":                            sstp.Ciphers,
				"tlsVersion":                         sstp.TLSVersion,
				"sni":                                sstp.SNI,
				"dialOnDemand":                       sstp.DialOnDemand,
				"keepAlive":                          sstp.KeepAlive,
				"verifyServerCertificate":            sstp.VerifyServerCertificate,
				"verifyServerAddressFromCertificate": sstp.VerifyServerAddressFromCertificate,
				"priority":                           sstp.Priority,
				"weight":                             sstp.Weight,
				"wanInterface":                       sstp.WANInterface,
			},
			Relationships: map[string]interface{}{},
		})
	}

	for _, ike := range vpnClient.IKev2 {
		resources = append(resources, SessionResource{
			ID:           ulid.NewString(),
			ResourceType: "vpn.ikev2.client",
			Configuration: map[string]interface{}{
				"name":                ike.Name,
				"server":              ike.Server,
				"credentials":         ike.Credentials,
				"authMethod":          ike.AuthMethod,
				"localIdentity":       ike.LocalIdentity,
				"remoteIdentity":      ike.RemoteIdentity,
				"encryptionAlgorithm": ike.EncryptionAlgorithm,
				"integrityAlgorithm":  ike.IntegrityAlgorithm,
				"dhGroupIke":          ike.DHGroupIKE,
				"dhGroupEsp":          ike.DHGroupESP,
				"lifetimeIke":         ike.LifetimeIKE,
				"lifetimeEsp":         ike.LifetimeESP,
				"rekeyInterval":       ike.RekeyInterval,
				"dpdTimeout":          ike.DPDTimeout,
				"mobikeEnabled":       ike.MobikeEnabled,
				"forceEncapsulation":  ike.ForceEncapsulation,
				"allowedSubnet":       ike.AllowedSubnet,
				"dialOnDemand":        ike.DialOnDemand,
				"priority":            ike.Priority,
				"weight":              ike.Weight,
				"wanInterface":        ike.WANInterface,
			},
			Relationships: map[string]interface{}{},
		})
	}

	return resources
}
