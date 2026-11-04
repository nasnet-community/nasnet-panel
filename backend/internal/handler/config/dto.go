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
	WireGuard            *WireGuardClientTemplateData
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

// VPNCredentialsResponse represents VPN credentials in the API response.
type VPNCredentialsResponse struct {
	Username   string `json:"username" example:"NNC_zN9RI61d"`
	Password   string `json:"password" example:"UmAaItfM"`
	Server     string `json:"server" example:"dij5t.vpn.s4i.co"`
	ExpiryDate string `json:"expiryDate" example:"11/21/2026"`
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
}

// InterfaceConfigRequest represents a network interface configuration. Type is
// deliberately absent: it's recognized by looking the interface up on the
// router rather than trusted from the request.
type InterfaceConfigRequest struct {
	Interface string `json:"interface" example:"ether1"`
	Type      string `json:"type" example:"ether"`
	SSID      string `json:"ssid,omitempty" example:"MyWiFiNetwork"`
	Password  string `json:"password,omitempty" example:"wifiPassword123"`
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

// FinalizeWizardRequest represents the complete wizard finalization request.
type FinalizeWizardRequest struct {
	Foreign         *InterfaceConfigRequest `json:"foreign"`
	Domestic        *InterfaceConfigRequest `json:"domestic"`
	L2tpClient      *L2tpClientConfig       `json:"l2tpClient,omitempty"`
	WireGuardClient *WireGuardClientConfig  `json:"wireguardClient,omitempty"`
	WiFiAP          *WiFiAPConfig           `json:"wifiAp,omitempty"`
	OvpnServer      *OvpnServerConfig       `json:"ovpnServer,omitempty"`
}
