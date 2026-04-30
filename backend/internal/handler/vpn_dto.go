package handler

import "fmt"

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
	Rx           string `json:"rx"`
	Tx           string `json:"tx"`
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
	Name         string `json:"name"`
	Enabled      bool   `json:"enabled"`
	Port         int    `json:"port,omitempty"`
	LocalIP      string `json:"localIp,omitempty"`
	LocalIPPool  string `json:"localIpPool,omitempty"`
	RemoteIP     string `json:"remoteIp,omitempty"`
	RemoteIPPool string `json:"remoteIpPool,omitempty"`
}

// SingleServerStatus represents a single server with enabled status.
type SingleServerStatus struct {
	Enabled      bool   `json:"enabled"`
	Port         int    `json:"port,omitempty"`
	LocalIP      string `json:"localIp,omitempty"`
	LocalIPPool  string `json:"localIpPool,omitempty"`
	RemoteIP     string `json:"remoteIp,omitempty"`
	RemoteIPPool string `json:"remoteIpPool,omitempty"`
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
	Enabled        bool             `json:"enabled"`
	Auth           string           `json:"auth"`
	Profile        string           `json:"profile"`
	LocalAddress   string           `json:"localAddress"`
	RemoteAddress  string           `json:"remoteAddress"`
	UseCompression string           `json:"useCompression"`
	UseEncryption  string           `json:"useEncryption"`
	OnlyOne        string           `json:"onlyOne"`
	ChangeTCPMSS   string           `json:"changeTcpMss"`
	DNSServer      string           `json:"dnsServer"`
	Secrets        []L2TPUserSecret `json:"secrets"`
}

// L2tpServerDetailsResponse represents L2TP server configuration details.
type L2tpServerDetailsResponse struct {
	Enabled            bool             `json:"enabled"`
	Auth               string           `json:"auth"`
	Profile            string           `json:"profile"`
	IPsec              string           `json:"ipsec"`
	IPsecSecret        string           `json:"ipsecSecret"`
	OneSessionPerHost  bool             `json:"oneSessionPerHost"`
	AcceptProtoVersion string           `json:"protocol"`
	LocalAddress       string           `json:"localAddress"`
	RemoteAddress      string           `json:"remoteAddress"`
	UseCompression     string           `json:"useCompression"`
	UseEncryption      string           `json:"useEncryption"`
	OnlyOne            string           `json:"onlyOne"`
	ChangeTCPMSS       string           `json:"changeTcpMss"`
	DNSServer          string           `json:"dnsServer"`
	Secrets            []L2TPUserSecret `json:"secrets"`
}

// SstpServerDetailsResponse represents SSTP server configuration details.
type SstpServerDetailsResponse struct {
	Enabled                 bool             `json:"enabled"`
	Port                    int              `json:"port"`
	Profile                 string           `json:"profile"`
	Auth                    string           `json:"auth"`
	Certificate             string           `json:"certificate"`
	VerifyClientCertificate bool             `json:"verifyClientCertificate"`
	TLSVersion              string           `json:"tlsVersion"`
	Ciphers                 string           `json:"ciphers"`
	PFS                     string           `json:"pfs"`
	LocalAddress            string           `json:"localAddress"`
	RemoteAddress           string           `json:"remoteAddress"`
	UseCompression          string           `json:"useCompression"`
	UseEncryption           string           `json:"useEncryption"`
	OnlyOne                 string           `json:"onlyOne"`
	ChangeTCPMSS            string           `json:"changeTcpMss"`
	DNSServer               string           `json:"dnsServer"`
	Secrets                 []L2TPUserSecret `json:"secrets"`
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

// L2TPUserSecret represents an L2TP user credential.
type L2TPUserSecret struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

func formatBytes(bytes int64) string {
	const (
		unit = 1024
	)
	if bytes < unit {
		return fmt.Sprintf("%d B", bytes)
	}
	div, exp := int64(unit), 0
	for n := bytes / unit; n >= unit; n /= unit {
		div *= unit
		exp++
	}
	return fmt.Sprintf("%.2f %cB", float64(bytes)/float64(div), "KMGTPE"[exp])
}
