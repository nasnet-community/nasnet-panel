package types

// VPNClient holds all VPN client configurations.
type VPNClient struct {
	Wireguard       []WireguardClientConfig `json:"wireguard,omitempty"`
	OpenVPN         []OpenVpnClientConfig   `json:"openVpn,omitempty"`
	L2TP            []L2tpClientConfig      `json:"l2tp,omitempty"`
	PPTP            []PptpClientConfig      `json:"pptp,omitempty"`
	SSTP            []SstpClientConfig      `json:"sstp,omitempty"`
	IKev2           []Ike2ClientConfig      `json:"ikev2,omitempty"`
	MultiLinkConfig *MultiLinkConfig        `json:"multiLinkConfig,omitempty"`
}

// === Shared Types ===

// Server represents a server address and port.
type Server struct {
	Address string `json:"address"`
	Port    int    `json:"port"`
}

// Credentials holds username and password.
type Credentials struct {
	Username string `json:"username"`
	Password string `json:"password"` //nolint:gosec // G101: credential field
}

// === Auth and Protocol Types ===

// AuthMethod represents authentication method.
type AuthMethod string

const (
	AuthMethodNone     AuthMethod = "none"
	AuthMethodPAP      AuthMethod = "pap"
	AuthMethodCHAP     AuthMethod = "chap"
	AuthMethodMSCHAP1  AuthMethod = "mschap1"
	AuthMethodMSCHAP2  AuthMethod = "mschap2"
	AuthMethodMSCHAPv2 AuthMethod = "mschapv2"
	AuthMethodEAP      AuthMethod = "eap"
)

// TLSVersion represents TLS protocol version.
type TLSVersion string

const (
	TLSVersion1_0    TLSVersion = "1.0"
	TLSVersion1_1    TLSVersion = "1.1"
	TLSVersion1_2    TLSVersion = "1.2"
	TLSVersion1_3    TLSVersion = "1.3"
	TLSVersionAny    TLSVersion = "any"
	TLSVersionOnly12 TLSVersion = "only-1.2"
	TLSVersionOnly13 TLSVersion = "only-1.3"
)

// NetworkProtocol represents network protocol.
type NetworkProtocol string

const (
	ProtocolUDP NetworkProtocol = "UDP"
	ProtocolTCP NetworkProtocol = "TCP"
)

// OpenVpnMode represents OpenVPN mode.
type OpenVpnMode string

const (
	OpenVpnModeP2P    OpenVpnMode = "p2p"
	OpenVpnModeServer OpenVpnMode = "server"
)

// OpenVpnCipherAlgorithm represents cipher algorithm.
type OpenVpnCipherAlgorithm string

const (
	CipherNone      OpenVpnCipherAlgorithm = "none"
	CipherAES128    OpenVpnCipherAlgorithm = "AES-128-CBC"
	CipherAES192    OpenVpnCipherAlgorithm = "AES-192-CBC"
	CipherAES256    OpenVpnCipherAlgorithm = "AES-256-CBC"
	CipherAES128GCM OpenVpnCipherAlgorithm = "AES-128-GCM"
	CipherAES256GCM OpenVpnCipherAlgorithm = "AES-256-GCM"
)

// OpenVpnDigestAlgorithm represents digest algorithm.
type OpenVpnDigestAlgorithm string

const (
	DigestNone   OpenVpnDigestAlgorithm = "none"
	DigestSHA1   OpenVpnDigestAlgorithm = "SHA1"
	DigestSHA256 OpenVpnDigestAlgorithm = "SHA256"
	DigestSHA512 OpenVpnDigestAlgorithm = "SHA512"
)

// IkeV2AuthMethod represents IKEv2 authentication method.
type IkeV2AuthMethod string

const (
	IkeAuthPSK              IkeV2AuthMethod = "psk"
	IkeAuthRSA              IkeV2AuthMethod = "rsa"
	IkeAuthDSS              IkeV2AuthMethod = "dss"
	IkeAuthECDSA            IkeV2AuthMethod = "ecdsa"
	IkeAuthEAP              IkeV2AuthMethod = "eap"
	IkeAuthPSKFull          IkeV2AuthMethod = "pre-shared-key"
	IkeAuthDigitalSignature IkeV2AuthMethod = "digital-signature"
)

// IkeV2Protocol represents IKEv2 protocol.
type IkeV2Protocol string

const (
	IkeV2ProtoESP IkeV2Protocol = "esp"
	IkeV2ProtoAH  IkeV2Protocol = "ah"
)

// === Base VPN Config ===

// BaseVPNClientConfig holds common VPN client configuration.
type BaseVPNClientConfig struct {
	Name         string            `json:"name"`
	Priority     *int              `json:"priority,omitempty"`
	Weight       *int              `json:"weight,omitempty"`
	WANInterface *WANInterfaceType `json:"wanInterface,omitempty"`
}

// === Wireguard ===

// WireguardClientConfig defines a Wireguard client configuration.
type WireguardClientConfig struct {
	BaseVPNClientConfig
	InterfacePrivateKey     string  `json:"interfacePrivateKey"`
	InterfaceAddress        string  `json:"interfaceAddress"`
	InterfaceListenPort     int     `json:"interfaceListenPort"`
	InterfaceMTU            *int    `json:"interfaceMtu,omitempty"`
	InterfaceDNS            *string `json:"interfaceDns,omitempty"`
	PeerPublicKey           string  `json:"peerPublicKey"`
	PeerEndpointAddress     string  `json:"peerEndpointAddress"`
	PeerEndpointPort        int     `json:"peerEndpointPort"`
	PeerAllowedIPs          string  `json:"peerAllowedIps"`
	PeerPresharedKey        *string `json:"peerPresharedKey,omitempty"`
	PeerPersistentKeepalive *int    `json:"peerPersistentKeepalive,omitempty"`
}

// === OpenVPN ===

// OpenVpnClientCertificates holds OpenVPN client certificates.
type OpenVpnClientCertificates struct {
	CA                       string  `json:"ca"`
	Cert                     string  `json:"cert"`
	Key                      string  `json:"key"`
	ClientCertificateName    *string `json:"clientCertificateName,omitempty"`
	CaCertificateName        *string `json:"caCertificateName,omitempty"`
	CaCertificateContent     *string `json:"caCertificateContent,omitempty"`
	ClientCertificateContent *string `json:"clientCertificateContent,omitempty"`
	ClientKeyContent         *string `json:"clientKeyContent,omitempty"`
}

// OpenVpnClientConfig defines an OpenVPN client configuration.
type OpenVpnClientConfig struct {
	BaseVPNClientConfig
	Server                  Server                    `json:"server"`
	Mode                    OpenVpnMode               `json:"mode"`
	Protocol                NetworkProtocol           `json:"protocol"`
	Credentials             Credentials               `json:"credentials"`
	AuthType                AuthMethod                `json:"authType"`
	Auth                    *OpenVpnDigestAlgorithm   `json:"auth,omitempty"`
	Cipher                  *OpenVpnCipherAlgorithm   `json:"cipher,omitempty"`
	TLSVersion              *TLSVersion               `json:"tlsVersion,omitempty"`
	Certificates            OpenVpnClientCertificates `json:"certificates"`
	VerifyServerCertificate *bool                     `json:"verifyServerCertificate,omitempty"`
	RouteNoPull             *bool                     `json:"routeNoPull,omitempty"`
	OVPNFileContent         *string                   `json:"ovpnFileContent,omitempty"`
	KeyPassphrase           *string                   `json:"keyPassphrase,omitempty"`
}

// === PPTP ===

// PptpClientConfig defines a PPTP client configuration.
type PptpClientConfig struct {
	BaseVPNClientConfig
	ConnectTo        Server       `json:"connectTo"`
	ConnectToAddress *string      `json:"connectToAddress,omitempty"`
	Credentials      Credentials  `json:"credentials"`
	AuthMethod       AuthMethod   `json:"authMethod"`
	AuthMethods      []AuthMethod `json:"authMethods,omitempty"`
	KeepaliveTimeout *int         `json:"keepaliveTimeout,omitempty"`
	DialOnDemand     *bool        `json:"dialOnDemand,omitempty"`
}

// === L2TP ===

// L2tpClientConfig defines an L2TP client configuration.
type L2tpClientConfig struct {
	BaseVPNClientConfig
	Server          Server       `json:"server"`
	Credentials     Credentials  `json:"credentials"`
	UseIPsec        *bool        `json:"useIpsec,omitempty"`
	IPsecSecret     *string      `json:"ipsecSecret,omitempty"`
	AuthMethod      AuthMethod   `json:"authMethod"`
	AuthMethods     []AuthMethod `json:"authMethods,omitempty"`
	ProtoVersion    *int         `json:"protoVersion,omitempty"`
	ProtoVersionStr *string      `json:"protoVersionStr,omitempty"`
	FastPath        *bool        `json:"fastPath,omitempty"`
	KeepAlive       *int         `json:"keepAlive,omitempty"`
	KeepAliveStr    *string      `json:"keepAliveStr,omitempty"`
	DialOnDemand    *bool        `json:"dialOnDemand,omitempty"`
	CookieLength    *int         `json:"cookieLength,omitempty"`
	DigestHash      *string      `json:"digestHash,omitempty"`
	CircuitId       *string      `json:"circuitId,omitempty"`
}

// === SSTP ===

// SstpClientConfig defines an SSTP client configuration.
type SstpClientConfig struct {
	BaseVPNClientConfig
	Server                             Server       `json:"server"`
	Credentials                        Credentials  `json:"credentials"`
	AuthMethod                         AuthMethod   `json:"authMethod"`
	AuthMethods                        []AuthMethod `json:"authMethods,omitempty"`
	Ciphers                            *string      `json:"ciphers,omitempty"`
	CiphersList                        []string     `json:"ciphersList,omitempty"`
	TLSVersion                         *TLSVersion  `json:"tlsVersion,omitempty"`
	Proxy                              *Server      `json:"proxy,omitempty"`
	SNI                                *string      `json:"sni,omitempty"`
	SNIEnabled                         *bool        `json:"sniEnabled,omitempty"`
	PFS                                *bool        `json:"pfs,omitempty"`
	PFSStr                             *string      `json:"pfsStr,omitempty"`
	DialOnDemand                       *bool        `json:"dialOnDemand,omitempty"`
	KeepAlive                          *int         `json:"keepAlive,omitempty"`
	VerifyServerCertificate            *bool        `json:"verifyServerCertificate,omitempty"`
	VerifyServerAddressFromCertificate *bool        `json:"verifyServerAddressFromCertificate,omitempty"`
	ClientCertificateName              *string      `json:"clientCertificateName,omitempty"`
}

// === IKEv2 ===

// Ike2ClientConfig defines an IKEv2 client configuration.
type Ike2ClientConfig struct {
	BaseVPNClientConfig
	Server                Server          `json:"server"`
	ServerAddress         *string         `json:"serverAddress,omitempty"`
	Credentials           Credentials     `json:"credentials"`
	AuthMethod            IkeV2AuthMethod `json:"authMethod"`
	PresharedKey          *string         `json:"presharedKey,omitempty"`
	ClientCertificateName *string         `json:"clientCertificateName,omitempty"`
	CaCertificateName     *string         `json:"caCertificateName,omitempty"`
	EapMethods            []string        `json:"eapMethods,omitempty"`
	EncAlgorithm          []string        `json:"encAlgorithm,omitempty"`
	HashAlgorithm         []string        `json:"hashAlgorithm,omitempty"`
	DhGroup               []string        `json:"dhGroup,omitempty"`
	Lifetime              *string         `json:"lifetime,omitempty"`
	NatTraversal          *bool           `json:"natTraversal,omitempty"`
	DpdInterval           *string         `json:"dpdInterval,omitempty"`
	PfsGroup              *string         `json:"pfsGroup,omitempty"`
	ProposalLifetime      *string         `json:"proposalLifetime,omitempty"`
	PolicySrcAddress      *string         `json:"policySrcAddress,omitempty"`
	PolicyDstAddress      *string         `json:"policyDstAddress,omitempty"`
	PolicyAction          *string         `json:"policyAction,omitempty"`
	PolicyLevel           *string         `json:"policyLevel,omitempty"`
	EnableModeConfig      *bool           `json:"enableModeConfig,omitempty"`
	RequestAddressPool    *bool           `json:"requestAddressPool,omitempty"`
	SrcAddressList        *string         `json:"srcAddressList,omitempty"`
	ConnectionMark        *string         `json:"connectionMark,omitempty"`
	MyIdType              *string         `json:"myIdType,omitempty"`
	MyId                  *string         `json:"myId,omitempty"`
	RemoteIdType          *string         `json:"remoteIdType,omitempty"`
	RemoteId              *string         `json:"remoteId,omitempty"`
	GeneratePolicy        *string         `json:"generatePolicy,omitempty"`
	Port                  *int            `json:"port,omitempty"`
	LocalAddress          *string         `json:"localAddress,omitempty"`
	SendInitialContact    *bool           `json:"sendInitialContact,omitempty"`
	ProfileName           *string         `json:"profileName,omitempty"`
	PeerName              *string         `json:"peerName,omitempty"`
	ProposalName          *string         `json:"proposalName,omitempty"`
	PolicyGroupName       *string         `json:"policyGroupName,omitempty"`
	ModeConfigName        *string         `json:"modeConfigName,omitempty"`
	LocalIdentity         *string         `json:"localIdentity,omitempty"`
	RemoteIdentity        *string         `json:"remoteIdentity,omitempty"`
	Version               *string         `json:"version,omitempty"`
	EncryptionAlgorithm   *string         `json:"encryptionAlgorithm,omitempty"`
	IntegrityAlgorithm    *string         `json:"integrityAlgorithm,omitempty"`
	PRFAlgorithm          *string         `json:"prfAlgorithm,omitempty"`
	DHGroupIKE            *string         `json:"dhGroupIke,omitempty"`
	DHGroupESP            *string         `json:"dhGroupEsp,omitempty"`
	LifetimeIKE           *int            `json:"lifetimeIke,omitempty"`
	LifetimeESP           *int            `json:"lifetimeEsp,omitempty"`
	RekeyInterval         *int            `json:"rekeyInterval,omitempty"`
	DPDTimeout            *int            `json:"dpdTimeout,omitempty"`
	MobikeEnabled         *bool           `json:"mobikeEnabled,omitempty"`
	EagerModeEnabled      *bool           `json:"eagerModeEnabled,omitempty"`
	ChildSALifetime       *int            `json:"childSaLifetime,omitempty"`
	ChildSARekeyMargin    *int            `json:"childSaRekeyMargin,omitempty"`
	ChildSARekeyFuzz      *int            `json:"childSaRekeyFuzz,omitempty"`
	InitialContactEnabled *bool           `json:"initialContactEnabled,omitempty"`
	ForceEncapsulation    *bool           `json:"forceEncapsulation,omitempty"`
	InstallPolicy         *bool           `json:"installPolicy,omitempty"`
	Certificate           *string         `json:"certificate,omitempty"`
	PrivateKeyPassword    *string         `json:"privateKeyPassword,omitempty"`
	CertificateAuthority  *string         `json:"certificateAuthority,omitempty"`
	AllowedSubnet         *string         `json:"allowedSubnet,omitempty"`
	DialOnDemand          *bool           `json:"dialOnDemand,omitempty"`
}
