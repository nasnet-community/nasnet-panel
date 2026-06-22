package handler

import (
	"time"
)

// VPNCredentialsResponse represents VPN credentials in the API response.
type VPNCredentialsResponse struct {
	Username   string `json:"username" example:"NNC_zN9RI61d"`
	Password   string `json:"password" example:"UmAaItfM"`
	Server     string `json:"server" example:"dij5t.vpn.s4i.co"`
	ExpiryDate string `json:"expiryDate" example:"11/21/2026"`
}

// WizardStatus represents the current status of a setup wizard.
type WizardStatus struct {
	Completed   bool       `json:"completed" example:"false"`
	CompletedAt *time.Time `json:"completedAt" example:"null"`
	CurrentStep string     `json:"currentStep" example:"step1"`
}

// UpdateWizardStatusRequest represents a request to update wizard status fields.
type UpdateWizardStatusRequest struct {
	Completed   *bool   `json:"completed" example:"false"`
	CurrentStep *string `json:"currentStep" example:"step2"`
}

// MaskingL2tpConfig represents L2TP masking configuration.
type MaskingL2tpConfig struct {
	ConnectTo   string `json:"connectTo" example:"192.168.1.1"`
	Disabled    bool   `json:"disabled" example:"false"`
	IPsecSecret string `json:"ipsecSecret" example:"secretpassphrase123"`
	Name        string `json:"name" example:"my-l2tp/client"`
	Password    string `json:"password" example:"password123"`
	User        string `json:"user" example:"username"`
}

// MaskingWireGuardConfig represents WireGuard masking configuration.
type MaskingWireGuardConfig struct {
	Config string `json:"config" example:"[Interface]\nListenPort = 51820\n..."`
}

// WiFiAPConfig represents WiFi AP configuration.
type WiFiAPConfig struct {
	SSID     string `json:"ssid" example:"MyWiFiNetwork"`
	Password string `json:"password" example:"wifiPassword123"`
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
	ForeignInterface  string                  `json:"foreignInterface" example:"ether1"`
	DomesticInterface string                  `json:"domesticInterface" example:"ether2"`
	L2tpClient        *MaskingL2tpConfig      `json:"l2tpClient"`
	WireGuardClient   *MaskingWireGuardConfig `json:"wireGuardClient"`
	WiFiAP            *WiFiAPConfig           `json:"wifiAP"`
	OvpnServer        *OvpnServerConfig       `json:"ovpnServer"`
}
