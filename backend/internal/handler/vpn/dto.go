package vpn

import (
	"sync"
	"time"
)

// OvpnServerTask tracks the status and progress of an OpenVPN server creation task.
type OvpnServerTask struct {
	ID            string
	Status        string
	Progress      int
	CurrentStep   string
	StartTime     time.Time
	CompletedTime time.Time
	Error         string
	Result        map[string]interface{}
	mu            sync.RWMutex
}

// OvpnServerPool manages in-memory OpenVPN server creation tasks.
type OvpnServerPool struct {
	activeTasks      map[string]*OvpnServerTask
	mu               sync.RWMutex
	cleanupStarted   bool
	cleanupStartedMu sync.Mutex
}

// SstpServerTask tracks the status and progress of an SSTP server creation task.
type SstpServerTask struct {
	ID            string
	Status        string
	Progress      int
	CurrentStep   string
	StartTime     time.Time
	CompletedTime time.Time
	Error         string
	Result        map[string]interface{}
	mu            sync.RWMutex
}

// SstpServerPool manages in-memory SSTP server creation tasks.
type SstpServerPool struct {
	activeTasks      map[string]*SstpServerTask
	mu               sync.RWMutex
	cleanupStarted   bool
	cleanupStartedMu sync.Mutex
}

// L2tpRuleSpec describes one firewall rule the L2TP server needs.
type L2tpRuleSpec struct {
	Protocol string
	DstPort  string
	Suffix   string
}

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
	PingTime     string `json:"pingTime,omitempty"`
	PeerCount    *int   `json:"peerCount,omitempty"`
}

// UpdateVPNClientRequest represents a request to update VPN client settings.
type UpdateVPNClientRequest struct {
	Disabled *bool   `json:"disabled" example:"false"`
	Comment  *string `json:"comment" example:"Updated comment"`
}

// AddL2TPClientRequest represents a request to add an L2TP client. If Name
// is empty, a random two-word lowercase name is generated for it.
type AddL2TPClientRequest struct {
	Name        string  `json:"name" example:"my-l2tp/client"`
	ConnectTo   string  `json:"connectTo" example:"192.168.1.1"`
	User        string  `json:"user" example:"username"`
	Password    string  `json:"password" example:"password123"`
	Disabled    *bool   `json:"disabled" example:"false"`
	IPsecSecret *string `json:"ipsecSecret" example:"secretpassphrase123"`
	Comment     string  `json:"comment,omitempty" example:"Office L2TP client"`
}

// AddSSTPClientRequest represents a request to add an SSTP client. If Name is
// empty, a random two-word lowercase name is generated for it. Port defaults
// to 443.
type AddSSTPClientRequest struct {
	Name      string `json:"name" example:"my-sstp-client"`
	ConnectTo string `json:"connectTo" example:"vpn.example.com"`
	Port      *int   `json:"port" example:"443"`
	User      string `json:"user" example:"username"`
	Password  string `json:"password" example:"password123"`
	Disabled  *bool  `json:"disabled" example:"false"`
	Comment   string `json:"comment,omitempty" example:"Office SSTP client"`
}

// UpdateSSTPClientRequest represents a request to update an SSTP client. Only
// provided fields are changed.
type UpdateSSTPClientRequest struct {
	ConnectTo *string `json:"connectTo" example:"vpn.example.com"`
	Port      *int    `json:"port" example:"443"`
	User      *string `json:"user" example:"newusername"`
	Password  *string `json:"password" example:"newpassword123"`
	Disabled  *bool   `json:"disabled" example:"true"`
	Comment   *string `json:"comment" example:"Office SSTP client"`
}

// SSTPClientResponse represents SSTP client details in the API response.
type SSTPClientResponse struct {
	ID                                 string `json:"id"`
	Name                               string `json:"name"`
	Disabled                           bool   `json:"disabled"`
	Running                            bool   `json:"running"`
	ConnectTo                          string `json:"connectTo"`
	Port                               int    `json:"port"`
	User                               string `json:"user"`
	Password                           string `json:"password"`
	Profile                            string `json:"profile"`
	KeepaliveTimeout                   int    `json:"keepaliveTimeout"`
	TLSVersion                         string `json:"tlsVersion"`
	VerifyServerCertificate            bool   `json:"verifyServerCertificate"`
	VerifyServerAddressFromCertificate bool   `json:"verifyServerAddressFromCertificate"`
	PFS                                bool   `json:"pfs"`
	Ciphers                            string `json:"ciphers"`
	Authentication                     string `json:"authentication"`
	Comment                            string `json:"comment,omitempty"`
	Status                             string `json:"status"`
	Uptime                             string `json:"uptime"`
	Encoding                           string `json:"encoding"`
	MTU                                int    `json:"mtu"`
	LocalAddress                       string `json:"localAddress"`
	RemoteAddress                      string `json:"remoteAddress"`
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
	Comment     *string `json:"comment" example:"Office L2TP client"`
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
	Comment          string `json:"comment,omitempty"`
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
	Name      string `json:"name"`
	Enabled   bool   `json:"enabled"`
	Port      int    `json:"port,omitempty"`
	Protocol  string `json:"protocol,omitempty"`
	PeerCount int    `json:"peerCount,omitempty"`
}

// SingleServerStatus represents a single server with enabled status.
type SingleServerStatus struct {
	Enabled  bool   `json:"enabled"`
	Port     int    `json:"port,omitempty"`
	Protocol string `json:"protocol,omitempty"`
}

// VPNServersStatusResponse represents the status of all VPN servers.
type VPNServersStatusResponse struct {
	OvpnServers []ServerStatusItem  `json:"ovpnServers"`
	WireGuards  []ServerStatusItem  `json:"wireguards"`
	Sstp        *SingleServerStatus `json:"sstp"`
	L2tp        *SingleServerStatus `json:"l2tp"`
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
	Comment                  string `json:"comment,omitempty"`
}

// PptpServerDetailsResponse represents PPTP server configuration details.
type PptpServerDetailsResponse struct {
	Enabled        bool             `json:"enabled"`
	Auth           string           `json:"auth"`
	Profile        string           `json:"profile"`
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
	UseCompression     string           `json:"useCompression"`
	UseEncryption      string           `json:"useEncryption"`
	OnlyOne            string           `json:"onlyOne"`
	ChangeTCPMSS       string           `json:"changeTcpMss"`
	DNSServer          string           `json:"dnsServer"`
	Secrets            []L2TPUserSecret `json:"secrets"`
}

// CreateL2tpServerRequest is the request to enable the L2TP server.
type CreateL2tpServerRequest struct {
	IPsecSecret string `json:"ipsecSecret" example:"secretpassphrase123"`
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
	UseCompression          string           `json:"useCompression"`
	UseEncryption           string           `json:"useEncryption"`
	OnlyOne                 string           `json:"onlyOne"`
	ChangeTCPMSS            string           `json:"changeTcpMss"`
	DNSServer               string           `json:"dnsServer"`
	Secrets                 []L2TPUserSecret `json:"secrets"`
}

// L2TPUserSecret represents an L2TP user credential.
type L2TPUserSecret struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// WireGuardInterfaceResponse represents WireGuard server configuration details.
type WireGuardInterfaceResponse struct {
	ID         string `json:"id"`
	Name       string `json:"name"`
	Port       int    `json:"port"`
	PrivateKey string `json:"privateKey"`
	PublicKey  string `json:"publicKey"`
	Running    bool   `json:"running"`
	Enabled    bool   `json:"enabled"`
}

// CreateWireGuardInterfaceRequest represents a request to create a WireGuard
// client interface. If Name is empty, a random two-word lowercase name is
// generated for it.
type CreateWireGuardInterfaceRequest struct {
	Name                  string  `json:"name" example:"office"`
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

// CreateWireGuardServerRequest represents a request to create a WireGuard server interface.
// The name will have "-server" appended automatically. If Name is empty, a
// random two-word lowercase name is generated for it before that suffix is applied.
// If localAddress is not provided, it will be auto-assigned as 10.100.x.1/24 where x is auto-incremented.
type CreateWireGuardServerRequest struct {
	Name         string  `json:"name" example:"office"`
	LocalAddress *string `json:"localAddress" example:"10.8.0.1/24"`
	MTU          *int    `json:"mtu" example:"1420"`
	ListenPort   *int    `json:"listenPort" example:"51820"`
	PrivateKey   *string `json:"privateKey" example:"KIEp..."`
	Disabled     *bool   `json:"disabled" example:"false"`
	Comment      *string `json:"comment,omitempty" example:"Office VPN server"`
}

// WireGuardServerCreateResponse represents the response after creating a WireGuard server.
type WireGuardServerCreateResponse struct {
	ID           string `json:"id"`
	Name         string `json:"name"`
	LocalAddress string `json:"localAddress"`
	MTU          int    `json:"mtu"`
	ListenPort   int    `json:"listenPort"`
	PublicKey    string `json:"publicKey"`
	PrivateKey   string `json:"privateKey"`
	Disabled     bool   `json:"disabled"`
	Comment      string `json:"comment,omitempty"`
}

// UpdateWireGuardInterfaceRequest represents a request to update a WireGuard interface.
type UpdateWireGuardInterfaceRequest struct {
	Disabled   *bool   `json:"disabled" example:"false"`
	Comment    *string `json:"comment" example:"Updated comment"`
	MTU        *int    `json:"mtu" example:"1420"`
	ListenPort *int    `json:"listenPort" example:"13231"`
	PrivateKey *string `json:"privateKey" example:"KIEp5mJ2Llk..."`
}

// WireGuardPeerResponse represents a WireGuard peer in the API response.
type WireGuardPeerResponse struct {
	ID                     string `json:"id"`
	Name                   string `json:"name"`
	InterfaceName          string `json:"interfaceName"`
	PublicKey              string `json:"publicKey"`
	PrivateKey             string `json:"privateKey,omitempty"`
	EndpointAddress        string `json:"endpointAddress"`
	EndpointPort           int    `json:"endpointPort,omitempty"`
	CurrentEndpointAddress string `json:"currentEndpointAddress"`
	CurrentEndpointPort    int    `json:"currentEndpointPort,omitempty"`
	AllowedAddresses       string `json:"allowedAddresses"`
	PreSharedKey           string `json:"preSharedKey,omitempty"`
	PersistentKeepalive    string `json:"persistentKeepalive"`
	ClientEndpoint         string `json:"clientEndpoint,omitempty"`
	ClientAllowedAddress   string `json:"clientAllowedAddress,omitempty"`
	LastHandshake          string `json:"lastHandshake"`
	RxBytes                int64  `json:"rxBytes"`
	TxBytes                int64  `json:"txBytes"`
	Rx                     string `json:"rx"`
	Tx                     string `json:"tx"`
	Dynamic                bool   `json:"dynamic"`
	Disabled               bool   `json:"disabled"`
}

// UpdateWireGuardPeerRequest represents a request to update a WireGuard peer.
type UpdateWireGuardPeerRequest struct {
	Name                 *string `json:"name" example:"updated-peer-name"`
	EndpointAddress      *string `json:"endpointAddress" example:"203.0.113.50"`
	EndpointPort         *int    `json:"endpointPort" example:"51820"`
	AllowedAddresses     *string `json:"allowedAddresses" example:"192.168.1.0/24,10.0.0.0/8"`
	PrivateKey           *string `json:"privateKey" example:"KIEp5mJ2Llk..."`
	PublicKey            *string `json:"publicKey" example:"wV8gHkfwQ3z3YTSQ1byU2uygaLdu8twzugKFoHVofXs="`
	PreSharedKey         *string `json:"preSharedKey" example:"qWbXwZgTbDGt66iCUtRHAtGju6w/Oyw3FLk/OPa+U1Y="`
	PersistentKeepalive  *int    `json:"persistentKeepalive" example:"25"`
	Disabled             *bool   `json:"disabled" example:"false"`
	ClientEndpoint       *string `json:"clientEndpoint" example:"10.0.0.1"`
	ClientAddress        *string `json:"clientAddress" example:"10.0.0.2"`
	ClientKeepalive      *int    `json:"clientKeepalive" example:"10"`
	ClientAllowedAddress *string `json:"clientAllowedAddress" example:"10.0.0.0/24"`
	ClientListenPort     *int    `json:"clientListenPort" example:"51820"`
	ClientDNS            *string `json:"clientDNS" example:"8.8.8.8,8.8.4.4"`
	Comment              *string `json:"comment" example:"Office VPN Peer"`
	Responder            *bool   `json:"responder" example:"false"`
}

// WireGuardDetailedResponse represents a complete WireGuard client with interface and peers.
type WireGuardDetailedResponse struct {
	ID         string                  `json:"id"`
	Name       string                  `json:"name"`
	Running    bool                    `json:"running"`
	Disabled   bool                    `json:"disabled"`
	MTU        int                     `json:"mtu"`
	MacAddress string                  `json:"macAddress"`
	PublicKey  string                  `json:"publicKey"`
	PrivateKey string                  `json:"privateKey"`
	ListenPort int                     `json:"listenPort"`
	Comment    string                  `json:"comment,omitempty"`
	Peers      []WireGuardPeerResponse `json:"peers"`
}

// CreateWireGuardServerPeerRequest represents a request to add a peer to a WireGuard server.
type CreateWireGuardServerPeerRequest struct {
	InterfaceName       string  `json:"interfaceName" binding:"required" example:"wg-server"`
	Name                *string `json:"name" example:"office-peer-1"`
	EndpointAddress     string  `json:"endpointAddress" example:"203.0.113.50" binding:"required"`
	EndpointPort        int     `json:"endpointPort" example:"51820" binding:"required"`
	AllowedAddresses    string  `json:"allowedAddresses" example:"192.168.1.0/24"`
	PrivateKey          *string `json:"privateKey" example:"KIEp5mJ2Llk..."`
	PublicKey           *string `json:"publicKey" example:"wV8gHkfwQ3z3YTSQ1byU2uygaLdu8twzugKFoHVofXs="`
	PreSharedKey        *string `json:"preSharedKey" example:"qWbXwZgTbDGt66iCUtRHAtGju6w/Oyw3FLk/OPa+U1Y="`
	PersistentKeepalive *int    `json:"persistentKeepalive" example:"25"`
	SavePrivateKey      *bool   `json:"savePrivateKey" example:"false"`
	Disabled            *bool   `json:"disabled" example:"false"`
	ClientEndpoint      *string `json:"clientEndpoint" example:"10.0.0.1"`
	ClientAddress       *string `json:"clientAddress" example:"10.0.0.2"`
	ClientDNS           *string `json:"clientDNS" example:"8.8.8.8,8.8.4.4"`
	ClientKeepalive     *int    `json:"clientKeepalive" example:"30"`
	ClientListenPort    *int    `json:"clientListenPort" example:"51820"`
	Comment             *string `json:"comment" example:"Office VPN Peer"`
	Responder           *bool   `json:"responder" example:"false"`
}

// WireGuardServerPeerCreateResponse represents the response after creating a peer on a WireGuard server.
type WireGuardServerPeerCreateResponse struct {
	Name                 string `json:"name"`
	InterfaceName        string `json:"interfaceName"`
	PublicKey            string `json:"publicKey"`
	PrivateKey           string `json:"privateKey"`
	PreSharedKey         string `json:"preSharedKey"`
	EndpointAddress      string `json:"endpointAddress"`
	EndpointPort         int    `json:"endpointPort"`
	AllowedAddresses     string `json:"allowedAddresses"`
	PersistentKeepalive  int    `json:"persistentKeepalive"`
	ClientAddress        string `json:"clientAddress"`
	ClientDNS            string `json:"clientDNS"`
	ClientKeepalive      int    `json:"clientKeepalive"`
	ClientAllowedAddress string `json:"clientAllowedAddress"`
	ClientListenPort     int    `json:"clientListenPort,omitempty"`
	ClientEndpoint       string `json:"clientEndpoint,omitempty"`
	Disabled             bool   `json:"disabled"`
}

// ImportWireGuardConfigRequest represents a request to import a WireGuard
// client configuration. If InterfaceName is empty, a random two-word
// lowercase name is generated for it.
type ImportWireGuardConfigRequest struct {
	InterfaceName string `json:"interfaceName" example:"wg-client"`
	Config        string `json:"config" binding:"required" example:"[Interface]\nListenPort = 51820\n..."`
}

// ImportWireGuardConfigResponse represents the response after importing a WireGuard configuration.
type ImportWireGuardConfigResponse struct {
	InterfaceName           string   `json:"interfaceName"`
	InterfaceIP             string   `json:"interfaceIP"`
	PeerNames               []string `json:"peerNames"`
	ImportedPeerCount       int      `json:"importedPeerCount"`
	ReusedExistingInterface bool     `json:"reusedExistingInterface"`
	SkippedDuplicatePeers   []string `json:"skippedDuplicatePeers"`
}

// CreateOvpnServerRequest represents a request to create an OpenVPN server with client certificate.
type CreateOvpnServerRequest struct {
	ClientCertificatePassword string    `json:"clientCertificatePassword" binding:"required" example:"cert-password123"`
	Users                     []VpnUser `json:"users" binding:"required"`
}

// VpnUser represents a user to be created on the OpenVPN server.
type VpnUser struct {
	Username string `json:"username" binding:"required" example:"vpnuser"`
	Password string `json:"password" binding:"required" example:"userpassword123"`
}

// UpdateOvpnServerEnabledRequest represents a request to enable or disable an
// OpenVPN server.
type UpdateOvpnServerEnabledRequest struct {
	Enabled bool `json:"enabled" example:"true"`
}

// ExportOvpnClientRequest represents a request to export OVPN client configuration.
type ExportOvpnClientRequest struct {
	ServerName    string `query:"serverName" binding:"required" example:"OpenVPN-Server-1779215157"`
	PublicAddress string `query:"publicAddress" binding:"required" example:"192.168.1.100"`
}

// PPPSecret represents a PPP secret (user) for VPN authentication.
type PPPSecret struct {
	ID            string `json:".id"`
	Name          string `json:"name"`
	Service       string `json:"service"`
	Profile       string `json:"profile"`
	Password      string `json:"password"`
	Disabled      bool   `json:"disabled"`
	LimitBytesIn  int64  `json:"limit-bytes-in"`
	LimitBytesOut int64  `json:"limit-bytes-out"`
	Comment       string `json:"comment,omitempty"`
	CallerID      string `json:"caller-id,omitempty"`
	Routes        string `json:"routes,omitempty"`
	DialerName    string `json:"dialer-name,omitempty"`
	AddressPool   string `json:"address-pool,omitempty"`
	PoolName      string `json:"pool-name,omitempty"`
	PoolNumber    string `json:"pool-number,omitempty"`
}

// VPNUserResponse represents a PPP secret in the API response.
type VPNUserResponse struct {
	ID            string `json:"id"`
	Name          string `json:"name"`
	Service       string `json:"service"`
	Profile       string `json:"profile"`
	Password      string `json:"password"`
	Disabled      bool   `json:"disabled"`
	LimitBytesIn  int64  `json:"limitBytesIn"`
	LimitBytesOut int64  `json:"limitBytesOut"`
	CallerID      string `json:"callerId,omitempty"`
	Routes        string `json:"routes,omitempty"`
	Comment       string `json:"comment,omitempty"`
}

// CreateVPNUserRequest represents a request to create a new VPN user (PPP secret).
type CreateVPNUserRequest struct {
	Name          string  `json:"name"`
	Password      string  `json:"password"`
	Profile       string  `json:"profile"`
	Disabled      *bool   `json:"disabled,omitempty"`
	LimitBytesIn  *int64  `json:"limitBytesIn,omitempty"`
	LimitBytesOut *int64  `json:"limitBytesOut,omitempty"`
	Comment       *string `json:"comment,omitempty"`
}

// UpdateVPNUserByIDRequest represents a request to update an existing VPN user (PPP secret).
type UpdateVPNUserByIDRequest struct {
	Name          *string `json:"name,omitempty"`
	Password      *string `json:"password,omitempty"`
	Profile       *string `json:"profile,omitempty"`
	Disabled      *bool   `json:"disabled,omitempty"`
	LimitBytesIn  *int64  `json:"limitBytesIn,omitempty"`
	LimitBytesOut *int64  `json:"limitBytesOut,omitempty"`
	Comment       *string `json:"comment,omitempty"`
}

// PPPActiveSessionResponse represents one active (connected) PPP-based VPN
// session in the API response — PPTP, L2TP, SSTP, OVPN and PPPoE all
// authenticate through PPP and are reported here, distinguished by service.
type PPPActiveSessionResponse struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	Service   string `json:"service" example:"sstp"`
	Address   string `json:"address,omitempty"`
	CallerID  string `json:"callerID,omitempty"`
	Uptime    string `json:"uptime"`
	Encoding  string `json:"encoding,omitempty"`
	SessionID string `json:"sessionID,omitempty"`
}

// ActiveVPNConnectionsResponse represents every currently active VPN
// connection across all VPN types: PPPSessions covers PPP-based VPN types
// (PPTP, L2TP, SSTP, OVPN, PPPoE) from /ppp/active, and WireGuardPeers
// covers WireGuard peers that have completed at least one handshake.
type ActiveVPNConnectionsResponse struct {
	PPPSessions    []PPPActiveSessionResponse    `json:"pppSessions"`
	WireGuardPeers []ActiveWireGuardPeerResponse `json:"wireguardPeers"`
}

// ActiveWireGuardPeerResponse represents one active WireGuard peer in the
// GET /api/vpn/active response — a reduced field set compared to
// WireGuardPeerResponse, scoped to what's relevant for an active-connection
// listing.
type ActiveWireGuardPeerResponse struct {
	ID               string `json:"id"`
	Name             string `json:"name"`
	InterfaceName    string `json:"interfaceName"`
	PublicKey        string `json:"publicKey"`
	AllowedAddresses string `json:"allowedAddresses"`
	ClientAddress    string `json:"clientAddress"`
	LastHandshake    string `json:"lastHandshake" example:"1d 12:12:12"`
	RxBytes          int64  `json:"rxBytes"`
	TxBytes          int64  `json:"txBytes"`
	Rx               string `json:"rx"`
	Tx               string `json:"tx"`
	Dynamic          bool   `json:"dynamic"`
	Disabled         bool   `json:"disabled"`
}

// VPNProfileResponse represents a PPP profile in the API response.
type VPNProfileResponse struct {
	ID                 string   `json:"id"`
	Name               string   `json:"name"`
	Default            bool     `json:"default"`
	LocalAddress       string   `json:"localAddress,omitempty"`
	RemoteAddress      string   `json:"remoteAddress,omitempty"`
	RemoteAddressRange []string `json:"remoteAddressRange,omitempty"`
	DNSServer          string   `json:"dnsServer,omitempty"`
	RateLimit          string   `json:"rateLimit,omitempty"`
	SessionTimeout     string   `json:"sessionTimeout,omitempty"`
	IdleTimeout        string   `json:"idleTimeout,omitempty"`
	Comment            string   `json:"comment,omitempty"`
}
