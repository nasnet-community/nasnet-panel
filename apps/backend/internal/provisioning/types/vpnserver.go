package types

// VPNServer holds all VPN server configurations.
type VPNServer struct {
	Users            []VSCredentials         `json:"users,omitempty"`
	PptpServer       *PptpServerConfig       `json:"pptpServer,omitempty"`
	L2tpServer       *L2tpServerConfig       `json:"l2tpServer,omitempty"`
	SstpServer       *SstpServerConfig       `json:"sstpServer,omitempty"`
	OpenVpnServer    *OpenVpnServerConfig    `json:"openVpnServer,omitempty"`
	Ikev2Server      *Ike2ServerConfig       `json:"ikev2Server,omitempty"`
	WireguardServers []WireguardServerConfig `json:"wireguardServers,omitempty"`
	Socks5Server     *Socks5ServerConfig     `json:"socks5Server,omitempty"`
	SSHServer        *SSHServerConfig        `json:"sshServer,omitempty"`
	HTTPProxyServer  *HTTPProxyServerConfig  `json:"httpProxyServer,omitempty"`
	BackToHomeServer *BackToHomeServerConfig `json:"backToHomeServer,omitempty"`
	ZeroTierServer   *ZeroTierServerConfig   `json:"zeroTierServer,omitempty"`
}

// === Shared VPN Server Types ===

// VSCredentials represents VPN server user credentials.
type VSCredentials struct {
	Username string  `json:"username"`
	Password string  `json:"password"`
	Network  *string `json:"network,omitempty"`
}

// VSNetwork represents a VPN server network.
type VSNetwork struct {
	Name   string `json:"name"`
	Subnet string `json:"subnet"`
}

// BaseVPNServerConfig holds common VPN server configuration.
type BaseVPNServerConfig struct {
	Enabled          bool       `json:"enabled"`
	DefaultProfile   *string    `json:"defaultProfile,omitempty"`
	KeepaliveTimeout *int       `json:"keepaliveTimeout,omitempty"`
	Authentication   AuthMethod `json:"authentication,omitempty"`
	PacketSize       *int       `json:"packetSize,omitempty"`
	Network          *VSNetwork `json:"network,omitempty"`
}

// === PPTP Server ===

// PptpServerConfig defines PPTP server configuration.
type PptpServerConfig struct {
	BaseVPNServerConfig
	ListenAddress     *string `json:"listenAddress,omitempty"`
	Encryption        *string `json:"encryption,omitempty"`
	MPPEKeySize       *int    `json:"mppeKeySize,omitempty"`
	RequireMPPE       *bool   `json:"requireMppe,omitempty"`
	RequireEncryption *bool   `json:"requireEncryption,omitempty"`
}

// === L2TP Server ===

// L2tpServerConfig defines L2TP server configuration.
type L2tpServerConfig struct {
	BaseVPNServerConfig
	ListenAddress *string       `json:"listenAddress,omitempty"`
	UseIPsec      *bool         `json:"useIpsec,omitempty"`
	IPsecSecret   *string       `json:"ipsecSecret,omitempty"`
	L2TPVersion   *string       `json:"l2tpVersion,omitempty"`
	FastPath      *bool         `json:"fastPath,omitempty"`
	CookieLength  *int          `json:"cookieLength,omitempty"`
	DigestHash    *string       `json:"digestHash,omitempty"`
	CircuitId     *string       `json:"circuitId,omitempty"`
	L2TPV3Config  *L2TPV3Config `json:"l2tpv3Config,omitempty"`
}

// L2TPV3Config defines L2TPv3 specific configuration.
type L2TPV3Config struct {
	SessionID       *string `json:"sessionId,omitempty"`
	CookieLength    *int    `json:"cookieLength,omitempty"`
	L3Encapsulation *string `json:"l3Encapsulation,omitempty"`
}

// === SSTP Server ===

// SstpServerConfig defines SSTP server configuration.
type SstpServerConfig struct {
	BaseVPNServerConfig
	ListenAddress     *string     `json:"listenAddress,omitempty"`
	ListenPort        *int        `json:"listenPort,omitempty"`
	Certificate       string      `json:"certificate"`
	Ciphers           *string     `json:"ciphers,omitempty"`
	TLSVersion        *TLSVersion `json:"tlsVersion,omitempty"`
	RequireEncryption *bool       `json:"requireEncryption,omitempty"`
	CompressData      *bool       `json:"compressData,omitempty"`
}

// === OpenVPN Server ===

// OpenVpnServerConfig defines OpenVPN server configuration.
type OpenVpnServerConfig struct {
	BaseVPNServerConfig
	ListenAddress            *string                   `json:"listenAddress,omitempty"`
	ListenPort               *int                      `json:"listenPort,omitempty"`
	Protocol                 NetworkProtocol           `json:"protocol"`
	Cipher                   *OpenVpnCipherAlgorithm   `json:"cipher,omitempty"`
	Auth                     *OpenVpnDigestAlgorithm   `json:"auth,omitempty"`
	TLSVersion               *TLSVersion               `json:"tlsVersion,omitempty"`
	Certificates             OpenVpnServerCertificates `json:"certificates"`
	RequireClientCertificate *bool                     `json:"requireClientCertificate,omitempty"`
	TLSAuth                  *string                   `json:"tlsAuth,omitempty"`
	CompressData             *bool                     `json:"compressData,omitempty"`
	AllowedSubnets           []string                  `json:"allowedSubnets,omitempty"`
	IPv6Config               *OpenVpnIPv6Config        `json:"ipv6Config,omitempty"`
	Encryption               *OpenVpnEncryptionConfig  `json:"encryption,omitempty"`
}

// OpenVpnServerCertificates holds OpenVPN server certificates.
type OpenVpnServerCertificates struct {
	CA   string  `json:"ca"`
	Cert string  `json:"cert"`
	Key  string  `json:"key"`
	DH   *string `json:"dh,omitempty"`
}

// OpenVpnIPv6Config holds IPv6 configuration for OpenVPN.
type OpenVpnIPv6Config struct {
	Enabled *bool   `json:"enabled,omitempty"`
	Subnet  *string `json:"subnet,omitempty"`
}

// OpenVpnEncryptionConfig holds encryption configuration for OpenVPN.
type OpenVpnEncryptionConfig struct {
	Algorithm *string `json:"algorithm,omitempty"`
	KeySize   *int    `json:"keySize,omitempty"`
}

// === IKEv2 Server ===

// Ike2ServerConfig defines IKEv2 server configuration.
type Ike2ServerConfig struct {
	BaseVPNServerConfig
	ListenAddress       *string                    `json:"listenAddress,omitempty"`
	ListenPort          *int                       `json:"listenPort,omitempty"`
	Certificate         VPNCertificateConfig       `json:"certificate"`
	Version             *string                    `json:"version,omitempty"`
	EncryptionAlgorithm *string                    `json:"encryptionAlgorithm,omitempty"`
	IntegrityAlgorithm  *string                    `json:"integrityAlgorithm,omitempty"`
	PRFAlgorithm        *string                    `json:"prfAlgorithm,omitempty"`
	DHGroupIKE          *string                    `json:"dhGroupIke,omitempty"`
	DHGroupESP          *string                    `json:"dhGroupEsp,omitempty"`
	ChildSALifetime     *int                       `json:"childSaLifetime,omitempty"`
	IKELifetime         *int                       `json:"ikeLifetime,omitempty"`
	RekeyInterval       *int                       `json:"rekeyInterval,omitempty"`
	DPDTimeout          *int                       `json:"dpdTimeout,omitempty"`
	MobikeEnabled       *bool                      `json:"mobikeEnabled,omitempty"`
	ForceEncapsulation  *bool                      `json:"forceEncapsulation,omitempty"`
	InstallPolicy       *bool                      `json:"installPolicy,omitempty"`
	IPsecProfile        *IpsecProfileConfig        `json:"ipsecProfile,omitempty"`
	IPsecProposal       *IpsecProposalConfig       `json:"ipsecProposal,omitempty"`
	IPsecPeers          []IPsecPeer                `json:"ipsecPeers,omitempty"`
	IPsecIdentity       *IpsecIdentityConfig       `json:"ipsecIdentity,omitempty"`
	IPsecModeConfig     []IpsecModeConfigItem      `json:"ipsecModeConfig,omitempty"`
	IPsecPolicyGroup    *IpsecPolicyGroupConfig    `json:"ipsecPolicyGroup,omitempty"`
	IPsecPolicyTemplate *IpsecPolicyTemplateConfig `json:"ipsecPolicyTemplate,omitempty"`
	IPPool              *IpPoolConfig              `json:"ipPool,omitempty"`
}

// IpsecProfileConfig holds IPsec profile configuration.
type IpsecProfileConfig struct {
	Name   string  `json:"name"`
	Phase1 *string `json:"phase1,omitempty"`
	Phase2 *string `json:"phase2,omitempty"`
}

// IpsecProposalConfig holds IPsec proposal configuration.
type IpsecProposalConfig struct {
	Name                string  `json:"name"`
	EncryptionAlgorithm string  `json:"encryptionAlgorithm"`
	AuthAlgorithm       string  `json:"authAlgorithm"`
	DHGroup             *string `json:"dhGroup,omitempty"`
}

// IPsecPeer holds IPsec peer configuration.
type IPsecPeer struct {
	Address        string   `json:"address"`
	PreSharedKey   *string  `json:"preSharedKey,omitempty"`
	Certificate    *string  `json:"certificate,omitempty"`
	AllowedSubnets []string `json:"allowedSubnets,omitempty"`
}

// IpsecIdentityConfig holds IPsec identity configuration.
type IpsecIdentityConfig struct {
	Type    string `json:"type"`
	Content string `json:"content"`
}

// IpsecModeConfigItem holds IPsec mode config item.
type IpsecModeConfigItem struct {
	Type  string  `json:"type"`
	Value *string `json:"value,omitempty"`
}

// IpsecPolicyGroupConfig holds IPsec policy group configuration.
type IpsecPolicyGroupConfig struct {
	Name              string  `json:"name"`
	Direction         string  `json:"direction"`
	SourceSubnet      string  `json:"sourceSubnet"`
	DestinationSubnet string  `json:"destinationSubnet"`
	Protocol          *string `json:"protocol,omitempty"`
	SourcePort        *int    `json:"sourcePort,omitempty"`
	DestinationPort   *int    `json:"destinationPort,omitempty"`
}

// IpsecPolicyTemplateConfig holds IPsec policy template configuration.
type IpsecPolicyTemplateConfig struct {
	Name             string  `json:"name"`
	SourceSubnetType string  `json:"sourceSubnetType"`
	SourceSubnet     *string `json:"sourceSubnet,omitempty"`
	DestSubnetType   string  `json:"destSubnetType"`
	DestSubnet       *string `json:"destSubnet,omitempty"`
}

// IpPoolConfig holds IP pool configuration.
type IpPoolConfig struct {
	Name      string  `json:"name"`
	StartIP   string  `json:"startIp"`
	EndIP     string  `json:"endIp"`
	DNSServer *string `json:"dnsServer,omitempty"`
	NTPServer *string `json:"ntpServer,omitempty"`
}

// === Wireguard Server ===

// WireguardServerConfig defines a Wireguard server configuration.
type WireguardServerConfig struct {
	Name      string                   `json:"name"`
	Interface WireguardInterfaceConfig `json:"interface"`
	Peers     []WireguardPeerConfig    `json:"peers,omitempty"`
}

// WireguardInterfaceConfig defines Wireguard interface configuration.
type WireguardInterfaceConfig struct {
	PrivateKey string  `json:"privateKey"`
	Address    string  `json:"address"`
	ListenPort int     `json:"listenPort"`
	MTU        *int    `json:"mtu,omitempty"`
	DNS        *string `json:"dns,omitempty"`
}

// WireguardPeerConfig defines a Wireguard peer configuration.
type WireguardPeerConfig struct {
	PublicKey           string               `json:"publicKey"`
	AllowedIPs          string               `json:"allowedIps"`
	Endpoint            *Server              `json:"endpoint,omitempty"`
	PresharedKey        *string              `json:"presharedKey,omitempty"`
	PersistentKeepalive *int                 `json:"persistentKeepalive,omitempty"`
	Client              *WireguardPeerClient `json:"client,omitempty"`
}

// WireguardPeerClient holds Wireguard peer client information.
type WireguardPeerClient struct {
	Name    string `json:"name"`
	Enabled *bool  `json:"enabled,omitempty"`
}

// === PPP Profile and Secrets ===

// PPPProfile defines a PPP profile.
type PPPProfile struct {
	Name     string             `json:"name"`
	General  *PPPGeneralConfig  `json:"general,omitempty"`
	Protocol *PPPProtocolConfig `json:"protocol,omitempty"`
	Limits   *PPPLimitsConfig   `json:"limits,omitempty"`
	Queue    *PPPQueueConfig    `json:"queue,omitempty"`
	Scripts  *PPPScriptsConfig  `json:"scripts,omitempty"`
}

// PPPGeneralConfig holds PPP general configuration.
type PPPGeneralConfig struct {
	SessionTimeout  *int  `json:"sessionTimeout,omitempty"`
	IdleTimeout     *int  `json:"idleTimeout,omitempty"`
	UseIpv6         *bool `json:"useIpv6,omitempty"`
	ChangeIpAddress *bool `json:"changeIpAddress,omitempty"`
}

// PPPProtocolConfig holds PPP protocol configuration.
type PPPProtocolConfig struct {
	Compression *bool `json:"compression,omitempty"`
	Encryption  *bool `json:"encryption,omitempty"`
}

// PPPLimitsConfig holds PPP limits configuration.
type PPPLimitsConfig struct {
	RateLimit       *int `json:"rateLimit,omitempty"`
	BurstLimit      *int `json:"burstLimit,omitempty"`
	ConnectionLimit *int `json:"connectionLimit,omitempty"`
}

// PPPQueueConfig holds PPP queue configuration.
type PPPQueueConfig struct {
	Name      string `json:"name"`
	Direction string `json:"direction"`
	Priority  int    `json:"priority"`
}

// PPPScriptsConfig holds PPP scripts configuration.
type PPPScriptsConfig struct {
	OnConnect    *string `json:"onConnect,omitempty"`
	OnDisconnect *string `json:"onDisconnect,omitempty"`
}

// PppSecret represents a PPP secret (user).
type PppSecret struct {
	Name          string  `json:"name"`
	Password      string  `json:"password"`
	Service       string  `json:"service"`
	CallerID      *string `json:"callerId,omitempty"`
	Profile       *string `json:"profile,omitempty"`
	DisabledUntil *string `json:"disabledUntil,omitempty"`
	Comment       *string `json:"comment,omitempty"`
}

// === SOCKS5 Server ===

// Socks5ServerConfig defines SOCKS5 server configuration.
type Socks5ServerConfig struct {
	Enabled       bool       `json:"enabled"`
	ListenAddress *string    `json:"listenAddress,omitempty"`
	ListenPort    *int       `json:"listenPort,omitempty"`
	AllowedUsers  []string   `json:"allowedUsers,omitempty"`
	Network       *VSNetwork `json:"network,omitempty"`
}

// === SSH Server ===

// SSHServerConfig defines SSH server configuration.
type SSHServerConfig struct {
	Enabled       bool       `json:"enabled"`
	ListenAddress *string    `json:"listenAddress,omitempty"`
	ListenPort    *int       `json:"listenPort,omitempty"`
	AllowedUsers  []string   `json:"allowedUsers,omitempty"`
	Network       *VSNetwork `json:"network,omitempty"`
}

// === HTTP Proxy Server ===

// HTTPProxyServerConfig defines HTTP proxy server configuration.
type HTTPProxyServerConfig struct {
	Enabled       bool       `json:"enabled"`
	ListenAddress *string    `json:"listenAddress,omitempty"`
	ListenPort    *int       `json:"listenPort,omitempty"`
	AllowedUsers  []string   `json:"allowedUsers,omitempty"`
	Network       *VSNetwork `json:"network,omitempty"`
}

// === Back-to-Home Server ===

// BackToHomeServerConfig defines back-to-home server configuration.
type BackToHomeServerConfig struct {
	Enabled        bool       `json:"enabled"`
	ClientSubnet   *string    `json:"clientSubnet,omitempty"`
	AllowedDevices []string   `json:"allowedDevices,omitempty"`
	Network        *VSNetwork `json:"network,omitempty"`
}

// === ZeroTier Server ===

// ZeroTierServerConfig defines ZeroTier server configuration.
type ZeroTierServerConfig struct {
	Enabled        bool       `json:"enabled"`
	NetworkID      *string    `json:"networkId,omitempty"`
	AllowedMembers []string   `json:"allowedMembers,omitempty"`
	Network        *VSNetwork `json:"network,omitempty"`
}

// === VPN Certificate ===

// VPNCertificateConfig holds VPN certificate configuration.
type VPNCertificateConfig struct {
	Name       string  `json:"name"`
	CommonName string  `json:"commonName"`
	Country    *string `json:"country,omitempty"`
	State      *string `json:"state,omitempty"`
	City       *string `json:"city,omitempty"`
	Org        *string `json:"org,omitempty"`
	Unit       *string `json:"unit,omitempty"`
	Email      *string `json:"email,omitempty"`
	ValidFrom  *string `json:"validFrom,omitempty"`
	ValidTo    *string `json:"validTo,omitempty"`
}
