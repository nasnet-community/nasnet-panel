package types

// ExtraConfigState holds extra configuration for the provisioning wizard.
type ExtraConfigState struct {
	RouterIdentity    *RouterIdentityRomon  `json:"routerIdentity,omitempty"`
	ServiceConfig     *ServiceConfig        `json:"serviceConfig,omitempty"`
	RUIConfig         *RUIConfig            `json:"ruiConfig,omitempty"`
	CertificateConfig *CertificateConfig    `json:"certificateConfig,omitempty"`
	NTPConfig         *NTPConfig            `json:"ntpConfig,omitempty"`
	GraphingConfig    *GraphingConfig       `json:"graphingConfig,omitempty"`
	CloudDDNSConfig   *CloudDDNSConfig      `json:"cloudDdnsConfig,omitempty"`
	UPNPConfig        *UPNPConfig           `json:"upnpConfig,omitempty"`
	NATPMPConfig      *NATPMPConfig         `json:"natpmpConfig,omitempty"`
	UsefulServices    *UsefulServicesConfig `json:"usefulServices,omitempty"`
}

// === Router Identity ===

// RouterIdentityRomon defines router identity and RoMON configuration.
type RouterIdentityRomon struct {
	RouterName    *string `json:"routerName,omitempty"`
	RouterComment *string `json:"routerComment,omitempty"`
	RoMONEnabled  *bool   `json:"romonEnabled,omitempty"`
	RoMONSecret   *string `json:"romonSecret,omitempty"`
}

// === Service Configuration ===

// ServiceConfig holds enabled services configuration.
type ServiceConfig struct {
	Services Services `json:"services"`
}

// Services defines which services are enabled.
type Services struct {
	API    *ServicePort `json:"api,omitempty"`
	APISSL *ServicePort `json:"apiSsl,omitempty"`
	FTP    *ServicePort `json:"ftp,omitempty"`
	SSH    *ServicePort `json:"ssh,omitempty"`
	Telnet *ServicePort `json:"telnet,omitempty"`
	Winbox *ServicePort `json:"winbox,omitempty"`
	Web    *ServicePort `json:"web,omitempty"`
	WebSSL *ServicePort `json:"webSsl,omitempty"`
}

// ServicePort defines a service with port configuration.
type ServicePort struct {
	Enabled *bool `json:"enabled,omitempty"`
	Port    *int  `json:"port,omitempty"`
}

// === RUI Configuration ===

// RUIConfig defines RUI (RouterOS User Interface) configuration.
type RUIConfig struct {
	Enabled        *bool   `json:"enabled,omitempty"`
	Port           *int    `json:"port,omitempty"`
	Theme          *string `json:"theme,omitempty"`
	LanguageCode   *string `json:"languageCode,omitempty"`
	SessionTimeout *int    `json:"sessionTimeout,omitempty"`
}

// === Interval Configuration ===

// IntervalConfig defines time intervals for various operations.
type IntervalConfig struct {
	HealthCheckInterval  *int `json:"healthCheckInterval,omitempty"`
	StatisticsInterval   *int `json:"statisticsInterval,omitempty"`
	BackupInterval       *int `json:"backupInterval,omitempty"`
	LogCleanupInterval   *int `json:"logCleanupInterval,omitempty"`
	CacheRefreshInterval *int `json:"cacheRefreshInterval,omitempty"`
}

// === Game Configuration ===

// GameConfig defines gaming/entertainment configuration.
type GameConfig struct {
	WAN2WAN        *bool `json:"wan2Wan,omitempty"`
	DoSProtection  *bool `json:"dosProtection,omitempty"`
	NetflowEnabled *bool `json:"netflowEnabled,omitempty"`
}

// === Certificate Configuration ===

// CertificateConfig defines certificate management.
type CertificateConfig struct {
	Enabled             *bool   `json:"enabled,omitempty"`
	CertificateProvider *string `json:"certificateProvider,omitempty"`
	AutoRenew           *bool   `json:"autoRenew,omitempty"`
	RenewalDaysBefore   *int    `json:"renewalDaysBefore,omitempty"`
}

// === NTP Configuration ===

// NTPConfig defines NTP (Network Time Protocol) configuration.
type NTPConfig struct {
	Enabled     *bool    `json:"enabled,omitempty"`
	Servers     []string `json:"servers,omitempty"`
	Interval    *int     `json:"interval,omitempty"`
	Synchronize *bool    `json:"synchronize,omitempty"`
}

// === Graphing Configuration ===

// GraphingConfig defines performance graphing configuration.
type GraphingConfig struct {
	Enabled   *bool   `json:"enabled,omitempty"`
	Interval  *int    `json:"interval,omitempty"`
	Retention *int    `json:"retention,omitempty"`
	Storage   *string `json:"storage,omitempty"`
}

// === DDNS Configuration ===

// DDNSEntry defines a single DDNS entry.
type DDNSEntry struct {
	Enabled   *bool   `json:"enabled,omitempty"`
	Interface *string `json:"interface,omitempty"`
	Service   *string `json:"service,omitempty"`
	Username  *string `json:"username,omitempty"`
	Password  *string `json:"password,omitempty"`
	Domain    *string `json:"domain,omitempty"`
	Interval  *int    `json:"interval,omitempty"`
}

// CloudDDNSConfig defines cloud DDNS configuration.
type CloudDDNSConfig struct {
	Enabled *bool       `json:"enabled,omitempty"`
	Entries []DDNSEntry `json:"entries,omitempty"`
}

// === UPNP Configuration ===

// UPNPConfig defines UPnP (Universal Plug and Play) configuration.
type UPNPConfig struct {
	Enabled            *bool   `json:"enabled,omitempty"`
	AllowDevice2Device *bool   `json:"allowDevice2Device,omitempty"`
	ExternalIPAddress  *string `json:"externalIpAddress,omitempty"`
	AllowedPorts       []int   `json:"allowedPorts,omitempty"`
	LeaseTime          *int    `json:"leaseTime,omitempty"`
}

// === NAT-PMP Configuration ===

// NATPMPConfig defines NAT-PMP configuration.
type NATPMPConfig struct {
	Enabled    *bool   `json:"enabled,omitempty"`
	ExternalIP *string `json:"externalIp,omitempty"`
	Lifetime   *int    `json:"lifetime,omitempty"`
}

// === Useful Services ===

// UsefulServicesConfig defines useful services configuration.
type UsefulServicesConfig struct {
	SMTPRelayEnabled *bool   `json:"smtpRelayEnabled,omitempty"`
	DNSRelayEnabled  *bool   `json:"dnsRelayEnabled,omitempty"`
	ProxyEnabled     *bool   `json:"proxyEnabled,omitempty"`
	DHCPRelayEnabled *bool   `json:"dhcpRelayEnabled,omitempty"`
	BandwidthLimit   *string `json:"bandwidthLimit,omitempty"`
}

// === Tunnel Types ===

// TunnelType represents the type of tunnel.
type TunnelType string

const (
	TunnelTypeIPIP  TunnelType = "ipip"
	TunnelTypeEoip  TunnelType = "eoip"
	TunnelTypeGre   TunnelType = "gre"
	TunnelTypeVxlan TunnelType = "vxlan"
)

// Tunnel holds all tunnel configurations.
type Tunnel struct {
	IPIP  []IpipTunnelConfig  `json:"ipip,omitempty"`
	Eoip  []EoipTunnelConfig  `json:"eoip,omitempty"`
	Gre   []GreTunnelConfig   `json:"gre,omitempty"`
	Vxlan []VxlanTunnelConfig `json:"vxlan,omitempty"`
}

// === Base Tunnel Config ===

// BaseTunnelConfig holds common tunnel configuration.
type BaseTunnelConfig struct {
	Name          string  `json:"name"`
	LocalAddress  string  `json:"localAddress"`
	RemoteAddress string  `json:"remoteAddress"`
	Enabled       *bool   `json:"enabled,omitempty"`
	MTU           *int    `json:"mtu,omitempty"`
	Comment       *string `json:"comment,omitempty"`
}

// === IPIP Tunnel ===

// IpipTunnelConfig defines IPIP tunnel configuration.
type IpipTunnelConfig struct {
	BaseTunnelConfig
	AllowFastPath *bool `json:"allowFastPath,omitempty"`
	KeepAlive     *int  `json:"keepAlive,omitempty"`
}

// === EoIP Tunnel ===

// EoipTunnelConfig defines EoIP tunnel configuration.
type EoipTunnelConfig struct {
	BaseTunnelConfig
	TunnelID      int   `json:"tunnelId"`
	AllowFastPath *bool `json:"allowFastPath,omitempty"`
	KeepAlive     *int  `json:"keepAlive,omitempty"`
}

// === GRE Tunnel ===

// GreTunnelConfig defines GRE tunnel configuration.
type GreTunnelConfig struct {
	BaseTunnelConfig
	AllowFastPath *bool `json:"allowFastPath,omitempty"`
	KeepAlive     *int  `json:"keepAlive,omitempty"`
	KeyID         *int  `json:"keyId,omitempty"`
}

// === VXLAN Tunnel ===

// VxlanTunnelConfig defines VXLAN tunnel configuration.
type VxlanTunnelConfig struct {
	BaseTunnelConfig
	VNI     int             `json:"vni"`
	VxlanID *int            `json:"vxlanId,omitempty"`
	VTeps   []string        `json:"vteps,omitempty"`
	FDB     *VxlanFDBConfig `json:"fdb,omitempty"`
}

// VxlanFDBConfig defines VXLAN Forwarding Database configuration.
type VxlanFDBConfig struct {
	Mode              *string  `json:"mode,omitempty"`
	Timeout           *int     `json:"timeout,omitempty"`
	MaxLearnedAddress *int     `json:"maxLearnedAddress,omitempty"`
	Dynamic           *bool    `json:"dynamic,omitempty"`
	Static            []string `json:"static,omitempty"`
}
