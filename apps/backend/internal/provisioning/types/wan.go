package types

// WANState holds all WAN-related configuration.
type WANState struct {
	WANLink   WANLinks   `json:"wanLink"`
	VPNClient *VPNClient `json:"vpnClient,omitempty"`
	DNSConfig *DNSConfig `json:"dnsConfig,omitempty"`
}

// WANLinks holds domestic and foreign WAN link groups.
type WANLinks struct {
	Foreign  *WANLink `json:"foreign,omitempty"`
	Domestic *WANLink `json:"domestic,omitempty"`
}

// WANLink holds a group of WAN link configs with optional multi-link.
type WANLink struct {
	WANConfigs      []WANLinkConfig  `json:"wanConfigs"`
	MultiLinkConfig *MultiLinkConfig `json:"multiLinkConfig,omitempty"`
}

// WANLinkConfig configures a single WAN link.
type WANLinkConfig struct {
	Name             string            `json:"name"`
	InterfaceConfig  InterfaceConfig   `json:"interfaceConfig"`
	ConnectionConfig *ConnectionConfig `json:"connectionConfig,omitempty"`
	Priority         *int              `json:"priority,omitempty"`
	Weight           *int              `json:"weight,omitempty"`
}

// InterfaceConfig defines the physical interface for a WAN link.
type InterfaceConfig struct {
	InterfaceName       string               `json:"interfaceName"`
	WirelessCredentials *WirelessCredentials `json:"wirelessCredentials,omitempty"`
	VLANID              *string              `json:"vlanId,omitempty"`
	MacAddress          *string              `json:"macAddress,omitempty"`
}

// WirelessCredentials holds WiFi credentials.
type WirelessCredentials struct {
	SSID     string `json:"ssid"`
	Password string `json:"password"`
}

// ConnectionConfig defines how a WAN link connects.
type ConnectionConfig struct {
	IsDHCP      *bool           `json:"isDhcp,omitempty"`
	PPPoE       *PPPoEConfig    `json:"pppoe,omitempty"`
	Static      *StaticIPConfig `json:"static,omitempty"`
	LTESettings *LTESettings    `json:"lteSettings,omitempty"`
}

// PPPoEConfig for PPPoE connections.
type PPPoEConfig struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// StaticIPConfig for static IP connections.
type StaticIPConfig struct {
	IPAddress string  `json:"ipAddress"`
	Subnet    string  `json:"subnet"`
	Gateway   string  `json:"gateway"`
	DNS       *string `json:"dns,omitempty"`
}

// LTESettings for LTE connections.
type LTESettings struct {
	APN string `json:"apn"`
}

// DNSConfig holds DNS configuration for each network type.
type DNSConfig struct {
	ForeignDNS  *string    `json:"foreignDns,omitempty"`
	VPNDNS      *string    `json:"vpnDns,omitempty"`
	DomesticDNS *string    `json:"domesticDns,omitempty"`
	SplitDNS    *string    `json:"splitDns,omitempty"`
	DOH         *DOHConfig `json:"doh,omitempty"`
}

// DOHConfig for DNS-over-HTTPS.
type DOHConfig struct {
	Domain    *string `json:"domain,omitempty"`
	BindingIP *string `json:"bindingIp,omitempty"`
}

// WANType for VPN client WAN interface selection.
type WANType string

const (
	WANTypeDomestic WANType = "Domestic"
	WANTypeForeign  WANType = "Foreign"
	WANTypeVPN      WANType = "VPN"
)

// WANInterfaceType associates a VPN client to a WAN link.
type WANInterfaceType struct {
	WANType WANType `json:"wanType"`
	WANName string  `json:"wanName"`
}
