package handler

// VPNClientResponse represents a VPN client in the API response.
type VPNClientResponse struct {
	ID           string `json:"id"`
	Name         string `json:"name"`
	Type         string `json:"type" example:"ovpn-out"`
	Running      bool   `json:"running"`
	Disabled     bool   `json:"disabled"`
	MTU          int    `json:"mtu"`
	MacAddress   string `json:"macAddress"`
	RxByte       int64  `json:"rxByte"`
	TxByte       int64  `json:"txByte"`
	RxPacket     int64  `json:"rxPacket"`
	TxPacket     int64  `json:"txPacket"`
	LastLinkUp   string `json:"lastLinkUp"`
	LastLinkDown string `json:"lastLinkDown"`
	LinkDowns    int    `json:"linkDowns"`
	Comment      string `json:"comment,omitempty"`
}

// UpdateVPNClientRequest represents a request to update VPN client settings.
type UpdateVPNClientRequest struct {
	Disabled *bool   `json:"disabled" example:"false"`
	Comment  *string `json:"comment" example:"Updated comment"`
}

// ServerStatusItem represents a server with name and enabled status.
type ServerStatusItem struct {
	Name    string `json:"name"`
	Enabled bool   `json:"enabled"`
}

// SingleServerStatus represents a single server with enabled status.
type SingleServerStatus struct {
	Enabled bool `json:"enabled"`
}

// VPNServersStatusResponse represents the status of all VPN servers.
type VPNServersStatusResponse struct {
	OvpnServers []ServerStatusItem  `json:"ovpnServers"`
	Wireguards  []ServerStatusItem  `json:"wireguards"`
	Pptp        *SingleServerStatus `json:"pptp"`
	L2tp        *SingleServerStatus `json:"l2tp"`
	Sstp        *SingleServerStatus `json:"sstp"`
}

// OvpnServerDetailsResponse represents OpenVPN server configuration details.
type OvpnServerDetailsResponse struct {
	Name                     string `json:"name"`
	Port                     int    `json:"port"`
	Mode                     string `json:"mode"`
	Protocol                 string `json:"protocol"`
	MacAddress               string `json:"macAddress"`
	Certificate              string `json:"certificate"`
	RequireClientCertificate bool   `json:"requireClientCertificate"`
	Auth                     string `json:"auth"`
	Cipher                   string `json:"cipher"`
	UserAuthMethod           string `json:"userAuthMethod"`
	Enabled                  bool   `json:"enabled"`
}

// PptpServerDetailsResponse represents PPTP server configuration details.
type PptpServerDetailsResponse struct {
	Enabled bool   `json:"enabled"`
	Auth    string `json:"auth"`
	Profile string `json:"profile"`
}

// L2tpServerDetailsResponse represents L2TP server configuration details.
type L2tpServerDetailsResponse struct {
	Enabled            bool   `json:"enabled"`
	Auth               string `json:"auth"`
	Profile            string `json:"profile"`
	IPsec              bool   `json:"ipsec"`
	IPsecSecret        string `json:"ipsecSecret"`
	OneSessionPerHost  bool   `json:"oneSessionPerHost"`
	AcceptProtoVersion string `json:"protocol"`
}

// SstpServerDetailsResponse represents SSTP server configuration details.
type SstpServerDetailsResponse struct {
	Enabled                 bool   `json:"enabled"`
	Port                    int    `json:"port"`
	Profile                 string `json:"profile"`
	Auth                    string `json:"auth"`
	Certificate             string `json:"certificate"`
	VerifyClientCertificate bool   `json:"verifyClientCertificate"`
	TLSVersion              string `json:"tlsVersion"`
	Ciphers                 string `json:"ciphers"`
	PFS                     string `json:"pfs"`
}

// WireguardServerDetailsResponse represents WireGuard server configuration details.
type WireguardServerDetailsResponse struct {
	ID         string `json:"id"`
	Name       string `json:"name"`
	Port       int    `json:"port"`
	PrivateKey string `json:"privateKey"`
	PublicKey  string `json:"publicKey"`
	Running    bool   `json:"running"`
	Enabled    bool   `json:"enabled"`
}
