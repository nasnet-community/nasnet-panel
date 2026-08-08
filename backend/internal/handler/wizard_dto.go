package handler

import (
	"fmt"

	"nasnet-panel/pkg/routeros"
	"nasnet-panel/pkg/wgcfg"
)

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

// WireGuardClientTemplateData is the wizard template's WireGuard client block.
type WireGuardClientTemplateData struct {
	InterfacePrivateKey string
	InterfaceAddress    string
	Peers               []WireGuardPeerTemplateData
}

// buildWireGuardClientTemplateData parses a wg-quick config into the shape
// wizard.tmpl expects.
func buildWireGuardClientTemplateData(rawConfig string) (*WireGuardClientTemplateData, error) {
	cfg, err := wgcfg.FromWgQuick(rawConfig, "import")
	if err != nil {
		return nil, err
	}

	data := &WireGuardClientTemplateData{
		InterfacePrivateKey: cfg.PrivateKey.String(),
	}
	if len(cfg.Addresses) > 0 {
		data.InterfaceAddress = cfg.Addresses[0].String()
	}

	for i := range cfg.Peers {
		peer := cfg.Peers[i]
		p := WireGuardPeerTemplateData{PublicKey: peer.PublicKey.Base64()}
		if len(peer.Endpoints) > 0 {
			p.EndpointAddress = peer.Endpoints[0].Host
			p.EndpointPort = fmt.Sprintf("%d", peer.Endpoints[0].Port)
		}
		if !peer.PresharedKey.IsZero() {
			p.PreSharedKey = peer.PresharedKey.Base64()
		}
		if len(peer.AllowedIPs) > 0 {
			p.AllowedAddress = peer.AllowedIPs[0].String()
		}
		if peer.PersistentKeepalive > 0 {
			p.PersistentKeepalive = fmt.Sprintf("%d", peer.PersistentKeepalive)
		}
		data.Peers = append(data.Peers, p)
	}

	return data, nil
}

func getWifiBandFromRadios(radios []routeros.WiFiRadio, wifiInterfaceName string) string {
	for i := range radios {
		if radios[i].Interface == wifiInterfaceName {
			return radios[i].Band
		}
	}
	return ""
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
	Completed bool `json:"completed" example:"false"`
	Progress  int  `json:"progress" example:"0"`
}

// InterfaceConfig represents a network interface configuration.
type InterfaceConfig struct {
	Interface string
	Type      string
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
