//nolint:misspell // intentional package name
package handler

import (
	"nasnet-panel/pkg/utils"

	"nasnet-panel/pkg/routeros"
)

// VPNClientResponse represents a VPN client in the API response.
type VPNClientResponse struct {
	ID           string `json:"id"`
	Name         string `json:"name"`
	Type         string `json:"type" example:"ovpn-out"`
	Running      bool   `json:"running"`
	Disabled     bool   `json:"disabled"`
	MTU          int    `json:"mtu,omitempty"`
	MacAddress   string `json:"macAddress,omitempty"`
	RxByte       int64  `json:"rxByte"`
	TxByte       int64  `json:"txByte"`
	Rx           string `json:"rx"`
	Tx           string `json:"tx"`
	RxPacket     int64  `json:"rxPacket"`
	TxPacket     int64  `json:"txPacket"`
	LastLinkUp   string `json:"lastLinkUp,omitempty"`
	LastLinkDown string `json:"lastLinkDown,omitempty"`
	LinkDowns    int    `json:"linkDowns,omitempty"`
	Comment      string `json:"comment,omitempty"`
}

// UpdateVPNClientRequest represents a request to update VPN client settings.
type UpdateVPNClientRequest struct {
	Disabled *bool   `json:"disabled" example:"false"`
	Comment  *string `json:"comment" example:"Updated comment"`
}

// AddL2TPClientRequest represents a request to add an L2TP client.
type AddL2TPClientRequest struct {
	Name        string  `json:"name" example:"my-l2tp-client"`
	ConnectTo   string  `json:"connectTo" example:"192.168.1.1"`
	User        string  `json:"user" example:"username"`
	Password    string  `json:"password" example:"password123"`
	Disabled    *bool   `json:"disabled" example:"false"`
	IPsecSecret *string `json:"ipsecSecret" example:"secretpassphrase123"`
}

// UpdateL2TPClientRequest represents a request to update an L2TP client.
// Note: useIPsec is automatically determined based on whether ipsecSecret is provided.
// If ipsecSecret is provided, useIPsec will be true; otherwise, it will be false.
type UpdateL2TPClientRequest struct {
	ConnectTo   *string `json:"connectTo" example:"192.168.1.2"`
	User        *string `json:"user" example:"newusername"`
	Password    *string `json:"password" example:"newpassword123"`
	Disabled    *bool   `json:"disabled" example:"true"`
	IPsecSecret *string `json:"ipsecSecret" example:"newupdasecretpassphrase123"`
}

// L2TPClientResponse represents L2TP client details in the API response.
type L2TPClientResponse struct {
	ID               string `json:"id"`
	Name             string `json:"name"`
	Disabled         bool   `json:"disabled"`
	Running          bool   `json:"running"`
	MaxMTU           int    `json:"maxMtu"`
	MaxMRU           int    `json:"maxMru"`
	MRRU             string `json:"mrru"`
	ConnectTo        string `json:"connectTo"`
	User             string `json:"user"`
	Password         string `json:"password"`
	Profile          string `json:"profile"`
	KeepaliveTimeout int    `json:"keepaliveTimeout"`
	UsePeerDNS       bool   `json:"usePeerDns"`
	UseIPsec         bool   `json:"useIPsec"`
	IPsecSecret      string `json:"ipsecSecret"`
	AllowFastPath    bool   `json:"allowFastPath"`
	AddDefaultRoute  bool   `json:"addDefaultRoute"`
	DialOnDemand     bool   `json:"dialOnDemand"`
	Allow            string `json:"allow"`
	RandomSourcePort bool   `json:"randomSourcePort"`
	L2TPProtoVersion string `json:"l2tpProtoVersion"`
	L2TPv3DigestHash string `json:"l2tpv3DigestHash"`
	AddRoutes        bool   `json:"addRoutes"`
	Comment          string `json:"comment"`
	// Monitor data
	Status            string `json:"status"`
	Uptime            string `json:"uptime"`
	Encoding          string `json:"encoding"`
	MTU               int    `json:"mtu"`
	LocalAddress      string `json:"localAddress"`
	RemoteAddress     string `json:"remoteAddress"`
	LocalIPv6Address  string `json:"localIpv6Address"`
	RemoteIPv6Address string `json:"remoteIpv6Address"`
}

// ServerStatusItem represents a server with name and enabled status.
type ServerStatusItem struct {
	Name         string `json:"name"`
	Enabled      bool   `json:"enabled"`
	Port         int    `json:"port,omitempty"`
	Protocol     string `json:"protocol,omitempty"`
	LocalIP      string `json:"localIp,omitempty"`
	LocalIPPool  string `json:"localIpPool,omitempty"`
	RemoteIP     string `json:"remoteIp,omitempty"`
	RemoteIPPool string `json:"remoteIpPool,omitempty"`
}

// SingleServerStatus represents a single server with enabled status.
type SingleServerStatus struct {
	Enabled      bool   `json:"enabled"`
	Port         int    `json:"port,omitempty"`
	Protocol     string `json:"protocol,omitempty"`
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

// CreateWireGuardInterfaceRequest represents a request to create a WireGuard client interface.
type CreateWireGuardInterfaceRequest struct {
	Name                  string  `json:"name" example:"office" binding:"required"`
	MTU                   *int    `json:"mtu" example:"1420"`
	ListenPort            *int    `json:"listenPort" example:"13231"`
	InterfacePrivateKey   *string `json:"interfacePrivateKey" example:"KIEp..."`
	Disabled              *bool   `json:"disabled" example:"false"`
	Comment               *string `json:"comment" example:"Office VPN client"`
	InterfaceLocalAddress string  `json:"interfaceLocalAddress" example:"10.0.0.1/24" binding:"required"`
	PeerPublicKey         *string `json:"peerPublicKey" example:"HIgo9xNzJMu7..."`
	PeerPrivateKey        *string `json:"peerPrivateKey" example:"KIEp5mJ2Llk..."`
	EndpointIP            string  `json:"endpointIP" example:"203.0.113.50" binding:"required"`
	EndpointPort          int     `json:"endpointPort" example:"51820" binding:"required"`
	AllowedAddress        string  `json:"allowedAddress" example:"192.168.1.0/24,10.0.0.0/8,2001:db8::/32" binding:"required"`
	PresharedKey          *string `json:"presharedKey" example:"HIgo9xNzJMu..."`
	PersistentKeepalive   *int    `json:"persistentKeepalive" example:"25"`
}

// WireGuardClientCreateResponse represents the response after creating a WireGuard client.
type WireGuardClientCreateResponse struct {
	ID                    string `json:"id"`
	Name                  string `json:"name"`
	MTU                   int    `json:"mtu" example:"1420"`
	ListenPort            int    `json:"listenPort" example:"13231"`
	InterfacePrivateKey   string `json:"interfacePrivateKey"`
	InterfacePublicKey    string `json:"interfacePublicKey"`
	InterfaceLocalAddress string `json:"interfaceLocalAddress"`
	Disabled              bool   `json:"disabled"`
	PeerName              string `json:"peerName"`
	PeerPublicKey         string `json:"peerPublicKey"`
	PeerPrivateKey        string `json:"peerPrivateKey"`
	EndpointIP            string `json:"endpointIP"`
	EndpointPort          int    `json:"endpointPort"`
	AllowedAddress        string `json:"allowedAddress"`
}

// ToVPNClientResponse converts a RouterOS VPNClientInfo to API VPNClientResponse.
func ToVPNClientResponse(vpn *routeros.VPNClientInfo) VPNClientResponse {
	return VPNClientResponse{
		ID:           vpn.ID,
		Name:         vpn.Name,
		Type:         vpn.Type,
		Running:      vpn.Running,
		Disabled:     vpn.Disabled,
		MTU:          vpn.MTU,
		MacAddress:   vpn.MacAddress,
		RxByte:       vpn.RxByte,
		TxByte:       vpn.TxByte,
		Rx:           utils.BytesToSizeString(vpn.RxByte),
		Tx:           utils.BytesToSizeString(vpn.TxByte),
		RxPacket:     vpn.RxPacket,
		TxPacket:     vpn.TxPacket,
		LastLinkUp:   vpn.LastLinkUp,
		LastLinkDown: vpn.LastLinkDown,
		LinkDowns:    vpn.LinkDowns,
		Comment:      vpn.Comment,
	}
}

// ToVPNClientResponseList converts a list of RouterOS VPNClientInfo to API responses.
func ToVPNClientResponseList(vpns []routeros.VPNClientInfo) []VPNClientResponse {
	response := make([]VPNClientResponse, len(vpns))
	for i := range vpns {
		response[i] = ToVPNClientResponse(&vpns[i])
	}
	return response
}

// ToL2TPClientResponse converts a RouterOS L2TPClientInfo to API L2TPClientResponse.
func ToL2TPClientResponse(l2tp *routeros.L2TPClientInfo) L2TPClientResponse {
	return L2TPClientResponse{
		ID:                l2tp.ID,
		Name:              l2tp.Name,
		Disabled:          l2tp.Disabled,
		Running:           l2tp.Running,
		MaxMTU:            l2tp.MaxMTU,
		MaxMRU:            l2tp.MaxMRU,
		MRRU:              l2tp.MRRU,
		ConnectTo:         l2tp.ConnectTo,
		User:              l2tp.User,
		Password:          l2tp.Password,
		Profile:           l2tp.Profile,
		KeepaliveTimeout:  l2tp.KeepaliveTimeout,
		UsePeerDNS:        l2tp.UsePeerDNS,
		UseIPsec:          l2tp.UseIPsec,
		IPsecSecret:       l2tp.IPsecSecret,
		AllowFastPath:     l2tp.AllowFastPath,
		AddDefaultRoute:   l2tp.AddDefaultRoute,
		DialOnDemand:      l2tp.DialOnDemand,
		Allow:             l2tp.Allow,
		RandomSourcePort:  l2tp.RandomSourcePort,
		L2TPProtoVersion:  l2tp.L2TPProtoVersion,
		L2TPv3DigestHash:  l2tp.L2TPv3DigestHash,
		AddRoutes:         l2tp.AddRoutes,
		Comment:           l2tp.Comment,
		Status:            l2tp.Status,
		Uptime:            l2tp.Uptime,
		Encoding:          l2tp.Encoding,
		MTU:               l2tp.MTU,
		LocalAddress:      l2tp.LocalAddress,
		RemoteAddress:     l2tp.RemoteAddress,
		LocalIPv6Address:  l2tp.LocalIPv6Address,
		RemoteIPv6Address: l2tp.RemoteIPv6Address,
	}
}
