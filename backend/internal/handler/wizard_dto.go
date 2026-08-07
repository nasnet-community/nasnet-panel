package handler

// VPNCredentialsResponse represents VPN credentials in the API response.
type VPNCredentialsResponse struct {
	Username   string `json:"username" example:"NNC_zN9RI61d"`
	Password   string `json:"password" example:"UmAaItfM"`
	Server     string `json:"server" example:"dij5t.vpn.s4i.co"`
	ExpiryDate string `json:"expiryDate" example:"11/21/2026"`
}

// WizardStatus represents the current status of a setup wizard.
type WizardStatus struct {
	Completed bool `json:"completed" example:"false"`
	Progress  int  `json:"progress" example:"0"`
}

// InterfaceConfig represents a network interface configuration.
type InterfaceConfig struct {
	Type      string `json:"type" example:"ether" enum:"ether,wifi"`
	Interface string `json:"interface" example:"ether1"`
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
	Foreign         *InterfaceConfig       `json:"foreign"`
	Domestic        *InterfaceConfig       `json:"domestic"`
	L2tpClient      *L2tpClientConfig      `json:"l2tpClient,omitempty"`
	WireGuardClient *WireGuardClientConfig `json:"wireguardClient,omitempty"`
	WiFiAP          *WiFiAPConfig          `json:"wifiAp,omitempty"`
	OvpnServer      *OvpnServerConfig      `json:"ovpnServer,omitempty"`
}
