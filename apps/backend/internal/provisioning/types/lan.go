package types

// LANState holds all LAN-side configuration.
type LANState struct {
	Wireless  []WirelessConfig          `json:"wireless,omitempty"`
	VPNServer *VPNServer                `json:"vpnServer,omitempty"`
	Tunnel    *Tunnel                   `json:"tunnel,omitempty"`
	Interface []EthernetInterfaceConfig `json:"interface,omitempty"`
	Subnets   *Subnets                  `json:"subnets,omitempty"`
}

// WifiTarget represents the network a WiFi network serves.
type WifiTarget string

const (
	WifiTargetDomestic       WifiTarget = "Domestic"
	WifiTargetForeign        WifiTarget = "Foreign"
	WifiTargetVPN            WifiTarget = "VPN"
	WifiTargetSplit          WifiTarget = "Split"
	WifiTargetSingleDomestic WifiTarget = "SingleDomestic"
	WifiTargetSingleForeign  WifiTarget = "SingleForeign"
	WifiTargetSingleVPN      WifiTarget = "SingleVPN"
)

// WirelessConfig defines a WiFi network.
type WirelessConfig struct {
	SSID        string     `json:"ssid"`
	Password    string     `json:"password"`
	IsHide      bool       `json:"isHide"`
	IsDisabled  bool       `json:"isDisabled"`
	SplitBand   bool       `json:"splitBand"`
	WifiTarget  WifiTarget `json:"wifiTarget"`
	NetworkName string     `json:"networkName"`
}

// EthernetInterfaceConfig maps a physical port to a bridge.
type EthernetInterfaceConfig struct {
	Name   string `json:"name"`
	Bridge string `json:"bridge"`
}

// === Networks ===

// Networks holds network configurations for different types.
type Networks struct {
	BaseNetworks      *BaseNetworks      `json:"baseNetworks,omitempty"`
	ForeignNetworks   []string           `json:"foreignNetworks,omitempty"`
	DomesticNetworks  []string           `json:"domesticNetworks,omitempty"`
	VPNClientNetworks *VPNClientNetworks `json:"vpnClientNetworks,omitempty"`
	VPNServerNetworks *VPNServerNetworks `json:"vpnServerNetworks,omitempty"`
	TunnelNetworks    *TunnelNetworks    `json:"tunnelNetworks,omitempty"`
}

// BaseNetworks holds base network configuration flags.
type BaseNetworks struct {
	Split    *bool `json:"split,omitempty"`
	Domestic *bool `json:"domestic,omitempty"`
	Foreign  *bool `json:"foreign,omitempty"`
	VPN      *bool `json:"vpn,omitempty"`
}

// VPNClientNetworks holds VPN client network lists.
type VPNClientNetworks struct {
	Wireguard []string `json:"wireguard,omitempty"`
	OpenVPN   []string `json:"openVpn,omitempty"`
	L2TP      []string `json:"l2tp,omitempty"`
	PPTP      []string `json:"pptp,omitempty"`
	SSTP      []string `json:"sstp,omitempty"`
	IKev2     []string `json:"ikev2,omitempty"`
}

// VPNServerNetworks holds VPN server network configuration.
type VPNServerNetworks struct {
	Wireguard  []string `json:"wireguard,omitempty"`
	OpenVPN    []string `json:"openVpn,omitempty"`
	L2TP       *bool    `json:"l2tp,omitempty"`
	PPTP       *bool    `json:"pptp,omitempty"`
	SSTP       *bool    `json:"sstp,omitempty"`
	IKev2      *bool    `json:"ikev2,omitempty"`
	Socks5     *bool    `json:"socks5,omitempty"`
	SSH        *bool    `json:"ssh,omitempty"`
	HTTPProxy  *bool    `json:"httpProxy,omitempty"`
	BackToHome *bool    `json:"backToHome,omitempty"`
	ZeroTier   *bool    `json:"zeroTier,omitempty"`
}

// TunnelNetworks holds tunnel network lists.
type TunnelNetworks struct {
	IPIP  []string `json:"ipip,omitempty"`
	Eoip  []string `json:"eoip,omitempty"`
	Gre   []string `json:"gre,omitempty"`
	Vxlan []string `json:"vxlan,omitempty"`
}

// === Subnets ===

// SubnetConfig defines a named subnet.
type SubnetConfig struct {
	Name   string `json:"name"`
	Subnet string `json:"subnet"`
}

// Subnets holds subnet configurations for different types.
type Subnets struct {
	BaseSubnets      BaseSubnets       `json:"baseSubnets"`
	ForeignSubnets   []SubnetConfig    `json:"foreignSubnets,omitempty"`
	DomesticSubnets  []SubnetConfig    `json:"domesticSubnets,omitempty"`
	VPNClientSubnets *VPNClientSubnets `json:"vpnClientSubnets,omitempty"`
	VPNServerSubnets *VPNServerSubnets `json:"vpnServerSubnets,omitempty"`
	TunnelSubnets    *TunnelSubnets    `json:"tunnelSubnets,omitempty"`
}

// BaseSubnets holds base subnet configuration.
type BaseSubnets struct {
	Split    *SubnetConfig `json:"split,omitempty"`
	Domestic *SubnetConfig `json:"domestic,omitempty"`
	Foreign  *SubnetConfig `json:"foreign,omitempty"`
	VPN      *SubnetConfig `json:"vpn,omitempty"`
}

// VPNClientSubnets holds VPN client subnet configuration.
type VPNClientSubnets struct {
	Wireguard []SubnetConfig `json:"wireguard,omitempty"`
	OpenVPN   []SubnetConfig `json:"openVpn,omitempty"`
	L2TP      []SubnetConfig `json:"l2tp,omitempty"`
	PPTP      []SubnetConfig `json:"pptp,omitempty"`
	SSTP      []SubnetConfig `json:"sstp,omitempty"`
	IKev2     []SubnetConfig `json:"ikev2,omitempty"`
}

// VPNServerSubnets holds VPN server subnet configuration.
type VPNServerSubnets struct {
	Wireguard  []SubnetConfig `json:"wireguard,omitempty"`
	OpenVPN    []SubnetConfig `json:"openVpn,omitempty"`
	L2TP       *SubnetConfig  `json:"l2tp,omitempty"`
	PPTP       *SubnetConfig  `json:"pptp,omitempty"`
	SSTP       *SubnetConfig  `json:"sstp,omitempty"`
	IKev2      *SubnetConfig  `json:"ikev2,omitempty"`
	Socks5     *SubnetConfig  `json:"socks5,omitempty"`
	SSH        *SubnetConfig  `json:"ssh,omitempty"`
	HTTPProxy  *SubnetConfig  `json:"httpProxy,omitempty"`
	BackToHome *SubnetConfig  `json:"backToHome,omitempty"`
	ZeroTier   *SubnetConfig  `json:"zeroTier,omitempty"`
}

// TunnelSubnets holds tunnel subnet configuration.
type TunnelSubnets struct {
	IPIP  []SubnetConfig `json:"ipip,omitempty"`
	Eoip  []SubnetConfig `json:"eoip,omitempty"`
	Gre   []SubnetConfig `json:"gre,omitempty"`
	Vxlan []SubnetConfig `json:"vxlan,omitempty"`
}
