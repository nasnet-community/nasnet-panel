package provisioning

import (
	"backend/internal/common/ulid"
	"backend/internal/provisioning/types"
)

// decomposeVPNClients converts a VPNClient into individual vpn.*.client SessionResources.
func decomposeVPNClients(vpnClient types.VPNClient) []SessionResource {
	resources := make([]SessionResource, 0, len(vpnClient.Wireguard)+len(vpnClient.OpenVPN)+len(vpnClient.PPTP)+len(vpnClient.L2TP)+len(vpnClient.SSTP)+len(vpnClient.IKev2))

	for i := range vpnClient.Wireguard {
		wg := vpnClient.Wireguard[i]
		resources = append(resources, SessionResource{
			ID:           ulid.NewString(),
			ResourceType: "vpn.wireguard.client",
			Configuration: map[string]interface{}{
				"name":   wg.Name,
				"config": wg,
			},
			Relationships: map[string]interface{}{},
		})
	}

	for i := range vpnClient.OpenVPN {
		ovpn := vpnClient.OpenVPN[i]
		resources = append(resources, SessionResource{
			ID:           ulid.NewString(),
			ResourceType: "vpn.openvpn.client",
			Configuration: map[string]interface{}{
				"name":   ovpn.Name,
				"config": ovpn,
			},
			Relationships: map[string]interface{}{},
		})
	}

	for i := range vpnClient.PPTP {
		pptp := vpnClient.PPTP[i]
		resources = append(resources, SessionResource{
			ID:           ulid.NewString(),
			ResourceType: "vpn.pptp.client",
			Configuration: map[string]interface{}{
				"name":   pptp.Name,
				"config": pptp,
			},
			Relationships: map[string]interface{}{},
		})
	}

	for i := range vpnClient.L2TP {
		l2tp := vpnClient.L2TP[i]
		resources = append(resources, SessionResource{
			ID:           ulid.NewString(),
			ResourceType: "vpn.l2tp.client",
			Configuration: map[string]interface{}{
				"name":   l2tp.Name,
				"config": l2tp,
			},
			Relationships: map[string]interface{}{},
		})
	}

	for i := range vpnClient.SSTP {
		sstp := vpnClient.SSTP[i]
		resources = append(resources, SessionResource{
			ID:           ulid.NewString(),
			ResourceType: "vpn.sstp.client",
			Configuration: map[string]interface{}{
				"name":   sstp.Name,
				"config": sstp,
			},
			Relationships: map[string]interface{}{},
		})
	}

	for i := range vpnClient.IKev2 {
		ike := vpnClient.IKev2[i]
		resources = append(resources, SessionResource{
			ID:           ulid.NewString(),
			ResourceType: "vpn.ikev2.client",
			Configuration: map[string]interface{}{
				"name":   ike.Name,
				"config": ike,
			},
			Relationships: map[string]interface{}{},
		})
	}

	return resources
}
