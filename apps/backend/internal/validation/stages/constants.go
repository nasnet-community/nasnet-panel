package stages

// Operation constants
const (
	operationCreate = "create"
	operationUpdate = "update"
	operationDelete = "delete"
)

// Resource type constants
const (
	resourceTypeIPAddress  = "ip-address"
	resourceTypeVLAN       = "vlan"
	resourceTypeBridgePort = "bridge-port"
	resourceTypeBridge     = "bridge"
)

// Provisioning resource type constants
//
//nolint:unused // Reserved for future validation stage rules
const (
	// VPN Client types
	resourceTypeVPNWireguardClient = "vpn.wireguard.client"
	resourceTypeVPNOpenVPNClient   = "vpn.openvpn.client"
	resourceTypeVPNPPTPClient      = "vpn.pptp.client"
	resourceTypeVPNL2TPClient      = "vpn.l2tp.client"
	resourceTypeVPNSSTPClient      = "vpn.sstp.client"
	resourceTypeVPNIKEv2Client     = "vpn.ikev2.client"

	// VPN Server types
	resourceTypeVPNWireguardServer  = "vpn.wireguard.server"
	resourceTypeVPNWireguardPeer    = "vpn.wireguard.peer"
	resourceTypeVPNOpenVPNServer    = "vpn.openvpn.server"
	resourceTypeVPNPPTPServer       = "vpn.pptp.server"
	resourceTypeVPNL2TPServer       = "vpn.l2tp.server"
	resourceTypeVPNSSTPServer       = "vpn.sstp.server"
	resourceTypeVPNIKEv2Server      = "vpn.ikev2.server"
	resourceTypeVPNSocks5Server     = "vpn.socks5.server"
	resourceTypeVPNSSHServer        = "vpn.ssh.server"
	resourceTypeVPNHTTPProxyServer  = "vpn.httpproxy.server"
	resourceTypeVPNZeroTierServer   = "vpn.zerotier.server"
	resourceTypeVPNBackToHomeServer = "vpn.backtohome.server"

	// PPP types
	resourceTypeVPNPPPProfile     = "vpn.ppp.profile"
	resourceTypeVPNPPPSecret      = "vpn.ppp.secret"
	resourceTypeVPNPPPCertificate = "vpn.ppp.certificate"

	// WAN types
	resourceTypeWANLinkDomestic = "wan.link.domestic"
	resourceTypeWANLinkForeign  = "wan.link.foreign"
	resourceTypeWANMultilink    = "wan.multilink"
	resourceTypeWANDNS          = "wan.dns"

	// Tunnel types
	resourceTypeTunnelIPIP  = "tunnel.ipip"
	resourceTypeTunnelEoIP  = "tunnel.eoip"
	resourceTypeTunnelGRE   = "tunnel.gre"
	resourceTypeTunnelVXLAN = "tunnel.vxlan"

	// Network types
	resourceTypeLANNetworkBase     = "lan.network.base"
	resourceTypeLANWireless        = "lan.wireless"
	resourceTypeLANInterfaceBridge = "lan.interface.bridge"
	resourceTypeNetworkSubnet      = "network.subnet.assignment"

	// System types
	resourceTypeSystemIdentity = "system.identity"
	resourceTypeSystemServices = "system.services"
	resourceTypeSystemNTP      = "system.ntp"
	resourceTypeSystemDDNS     = "system.ddns"
	resourceTypeSystemUPNP     = "system.upnp"
	resourceTypeSystemNATPMP   = "system.natpmp"
	resourceTypeSystemSchedule = "system.schedule"
	resourceTypeGameRouting    = "application.game.routing"
)
