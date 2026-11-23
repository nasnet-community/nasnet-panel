package config

import (
	"sync"

	"nasnet-panel/internal/db"
)

// ReconfigStartResponse is the response for POST /api/config/reconfig. The management WiFi
// credentials are present only when a new management WiFi network was generated.
type ReconfigStartResponse struct {
	ManagementWiFiSSID     string `json:"managementWiFiSSID,omitempty"`
	ManagementWiFiPassword string `json:"managementWiFiPassword,omitempty"`
}

// ReconfigStatusResponse is the response for GET /api/config/reconfig/status. Progress is the
// percentage of the whole reconfiguration, Step names what is being done right now, and Warnings
// lists the stored items that could not be applied again without failing the reconfiguration.
type ReconfigStatusResponse struct {
	State    string   `json:"state" example:"running"`
	Step     string   `json:"step" example:"Configuring WiFi access points"`
	Progress int      `json:"progress" example:"35"`
	Error    string   `json:"error,omitempty"`
	Warnings []string `json:"warnings,omitempty"`
}

type reconfigError struct {
	Status  int
	Message string
	Err     error
}

type reconfigJob struct {
	mu       sync.Mutex
	state    string
	step     string
	progress int
	err      string
	warnings []string
}

type reconfigPlan struct {
	templateData   map[string]any
	stored         *db.StoredConfig
	managementWifi WiFiAP
	warnings       []string
	livePorts      map[string]int
}

type reconfigExtra struct {
	step string
	run  func() []error
}

// WireGuardPeerTemplateData is one peer entry for the wizard's WireGuard
// client template block.
type WireGuardPeerTemplateData struct {
	PublicKey           string
	EndpointAddress     string
	EndpointPort        string
	PreSharedKey        string
	AllowedAddress      string
	PersistentKeepalive string
}

// WizardSaveData is what HandleFinalizeWizard hands to the code that stores the
// wizard configuration in the router's database.
type WizardSaveData struct {
	Request              *FinalizeWizardRequest
	DomesticEnabled      bool
	Foreign              *InterfaceConfig
	Domestic             *InterfaceConfig
	VPNClients           []VPNClient
	CertificateTimestamp int64
	WifiAPs              []WiFiAP
	BridgePorts          []BridgePort
}

// WireGuardClientTemplateData is the wizard template's WireGuard client block.
type WireGuardClientTemplateData struct {
	InterfacePrivateKey string
	InterfaceAddress    string
	Peers               []WireGuardPeerTemplateData
}

// VPNClient is one failover VPN client as the templates see it: its tunnel, its
// place in the failover order and its pinned LAN segment. Index starts at 1 and
// decides the role, the probe address and the segment subnet.
type VPNClient struct {
	Index     int
	Name      string
	Role      string
	ProbeIP   string
	Bridge    string
	ListName  string
	Table     string
	Subnet    string
	Network   string
	Gateway   string
	Address   string
	PoolRange string
	L2tp      *L2tpClientConfig
	WireGuard *WireGuardClientTemplateData
}

// VPNCredentialsResponse represents the router's VPN account in the API response.
type VPNCredentialsResponse struct {
	Username  string `json:"username" example:"NNC_zN9RI61d"`
	Password  string `json:"password" example:"UmAaItfM"`
	Server    string `json:"server" example:"dij5t.vpn.s4i.co"`
	Fallback1 string `json:"fallback1" example:"ai4mo.vpn.s4i.co"`
	Fallback2 string `json:"fallback2" example:"vav9r.vpn.s4i.co"`
}

// WizardStatus represents the current status of a setup wizard.
type WizardStatus struct {
	Completed bool   `json:"completed" example:"false"`
	Progress  int    `json:"progress" example:"0"`
	Failed    bool   `json:"failed" example:"false"`
	Message   string `json:"message,omitempty" example:"Configuring WiFi access points"`
}

// InterfaceConfig represents a network interface configuration.
type InterfaceConfig struct {
	Interface string
	Type      string
	Type2     string
	SSID      string
	Password  string
	AuthType  string

	StaticIP     string
	StaticPrefix int
	Gateway      string
}

// InterfaceConfigRequest represents a network interface configuration. Type is
// deliberately absent: it's recognized by looking the interface up on the
// router rather than trusted from the request.
type InterfaceConfigRequest struct {
	Interface string `json:"interface" example:"ether1"`
	Type      string `json:"type" example:"ether"`
	SSID      string `json:"ssid,omitempty" example:"MyWiFiNetwork"`
	Password  string `json:"password,omitempty" example:"wifiPassword123"`
	AuthType  string `json:"authType,omitempty" example:"wpa2-psk,wpa3-psk"`
	IP        string `json:"ip,omitempty" example:"192.168.1.50/24"`
	Gateway   string `json:"gateway,omitempty" example:"192.168.1.1"`
}

// L2tpClientConfig represents L2TP client configuration.
type L2tpClientConfig struct {
	ConnectTo   string `json:"connectTo" example:"192.168.1.1"`
	User        string `json:"user" example:"username"`
	Password    string `json:"password" example:"password123"`
	IPsecSecret string `json:"ipsecSecret" example:"secretpassphrase123"`
}

// WireGuardClientConfig represents WireGuard client configuration.
type WireGuardClientConfig struct {
	Config string `json:"config" example:"[Interface]\nListenPort = 51820\n..."`
}

// WiFiAPConfig represents WiFi AP configuration.
type WiFiAPConfig struct {
	SSID     string `json:"ssid" example:"MyAccessPoint"`
	Password string `json:"password" example:"apPassword123"`
	Split    bool   `json:"split" example:"false"`
}

// WiFiAP represents WiFi AP properties.
type WiFiAP struct {
	Name        string
	DefaultName string
	NameToSet   string
	SSID        string
	Password    string
	Band        string
}

// BridgePort represents bridge port properties.
type BridgePort struct {
	Name        string
	DefaultName string
	Type        string
}

// OvpnUser represents an OpenVPN user.
type OvpnUser struct {
	Username string `json:"username" example:"vpnuser"`
	Password string `json:"password" example:"userpassword123"`
}

// OvpnServerConfig represents OpenVPN server configuration.
type OvpnServerConfig struct {
	ClientCertificatePassword string     `json:"clientCertificatePassword" example:"cert-password123"`
	Users                     []OvpnUser `json:"users"`
}

// FinalizeWizardRequest represents the complete wizard finalization request. The VPN
// clients are not part of it: they come from the NasNet API account of the router.
type FinalizeWizardRequest struct {
	Foreign    *InterfaceConfigRequest `json:"foreign"`
	Domestic   *InterfaceConfigRequest `json:"domestic"`
	WiFiAP     *WiFiAPConfig           `json:"wifiAp,omitempty"`
	OvpnServer *OvpnServerConfig       `json:"ovpnServer,omitempty"`
}
