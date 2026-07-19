package routeros

import (
	"fmt"
	"net"
	"regexp"
	"strconv"
	"strings"

	"nasnet-panel/pkg/utils"
)

// VPNClientInfo represents a VPN client interface.
type VPNClientInfo struct {
	ID           string
	Name         string
	Type         string
	Running      bool
	Disabled     bool
	MTU          int
	MacAddress   string
	RxByte       int64
	TxByte       int64
	RxPacket     int64
	TxPacket     int64
	LastLinkUp   string
	LastLinkDown string
	LinkDowns    int
	Comment      string
}

// L2TPClientInfo represents L2TP client configuration details.
type L2TPClientInfo struct {
	ID               string
	Name             string
	Disabled         bool
	Running          bool
	MaxMTU           int
	MaxMRU           int
	MRRU             string
	ConnectTo        string
	User             string
	Password         string
	Profile          string
	KeepaliveTimeout int
	UsePeerDNS       bool
	UseIPsec         bool
	IPsecSecret      string
	AllowFastPath    bool
	AddDefaultRoute  bool
	DialOnDemand     bool
	Allow            string
	RandomSourcePort bool
	L2TPProtoVersion string
	L2TPv3DigestHash string
	AddRoutes        bool
	Comment          string
	// Monitor data
	Status            string
	Uptime            string
	Encoding          string
	MTU               int
	LocalAddress      string
	RemoteAddress     string
	LocalIPv6Address  string
	RemoteIPv6Address string
}

// OvpnServerInfo represents an OpenVPN server configuration.
type OvpnServerInfo struct {
	ID                string
	Name              string
	Disabled          bool
	Mode              string
	UserAuthMethod    string
	CertFile          string
	KeyFile           string
	ProtocolVersion   string
	Port              int
	CipherName        string
	AuthHashAlgorithm string
	RequireClientCert bool
	RequireEncryption bool
	KeepAliveTimeout  int
	DefaultGateway    bool
	MacAddress        string
	DefaultProfile    string
	Comment           string
}

// CreatePppSecretParams represents parameters for creating a PPP secret.
type CreatePppSecretParams struct {
	Name          string
	Password      string
	Service       string
	Profile       string
	Disabled      *bool
	LimitBytesIn  *int64
	LimitBytesOut *int64
	Comment       *string
	CallerID      *string
	Routes        *string
}

// PptpServerInfo represents the PPTP server configuration (single instance).
type PptpServerInfo struct {
	ID               string
	Enabled          bool
	MaxMTU           int
	MaxMRU           int
	MRRU             string
	Authentication   string
	KeepaliveTimeout int
	DefaultProfile   string
}

// L2tpServerInfo represents the L2TP server configuration (single instance).
type L2tpServerInfo struct {
	ID                   string
	Enabled              bool
	MaxMTU               int
	MaxMRU               int
	MRRU                 string
	Authentication       string
	KeepaliveTimeout     int
	MaxSessions          string
	DefaultProfile       string
	UseIPsec             string
	IPsecSecret          string
	CallerIDType         string
	OneSessionPerHost    bool
	AllowFastPath        bool
	L2TPv3CircuitID      string
	L2TPv3CookieLength   int
	L2TPv3DigestHash     string
	AcceptPseudowireType string
	AcceptProtoVersion   string
}

// SstpServerInfo represents the SSTP server configuration (single instance).
type SstpServerInfo struct {
	ID                      string
	Enabled                 bool
	Port                    int
	MaxMTU                  int
	MaxMRU                  int
	MRRU                    string
	KeepaliveTimeout        int
	DefaultProfile          string
	Authentication          string
	Certificate             string
	VerifyClientCertificate bool
	PFS                     string
	TLSVersion              string
	Ciphers                 string
}

// WireGuardInfo represents a WireGuard interface configuration.
type WireGuardInfo struct {
	ID         string
	Name       string
	Running    bool
	Disabled   bool
	MTU        int
	MacAddress string
	PublicKey  string
	PrivateKey string
	ListenPort int
	Comment    string
}

// L2TPProfileInfo represents an L2TP profile.
type L2TPProfileInfo struct {
	ID              string
	Name            string
	LocalAddress    string
	RemoteAddress   string
	DNSServer       string
	WINSServer      string
	UseIPv6         bool
	UseEncryption   string
	OnlyEncrypted   string
	ChangeIPAddress string
	UseCompression  string
	OnlyOne         string
	ChangeTCPMSS    string
	IPPool          string
	Comment         string
}

// L2TPSecret represents an L2TP user secret (username/password).
type L2TPSecret struct {
	Name     string
	Password string
	Comment  string
}

// L2TPIPPool represents an L2TP IP pool.
type L2TPIPPool struct {
	ID      string
	Name    string
	Ranges  string
	Comment string
}

// WireGuardClientConfig represents configuration for creating a WireGuard client interface.
type WireGuardClientConfig struct {
	Name       string
	PrivateKey *string
	ListenPort *int
	MTU        *int
	Disabled   *bool
	Comment    *string
}

// WireGuardPeerConfig contains the configuration for creating a WireGuard peer.
type WireGuardPeerConfig struct {
	InterfaceName        string
	PeerName             string
	PublicKey            *string
	PrivateKey           *string
	EndpointAddress      string
	EndpointPort         int
	AllowedAddresses     []string
	PresharedKey         *string
	PersistentKeepalive  *int
	SavePrivateKey       bool
	Disabled             *bool
	ClientEndpoint       *string
	ClientAddress        *string
	ClientKeepalive      *int
	ClientAllowedAddress *string
	ClientListenPort     *int
	ClientDNS            *string
	Comment              *string
	Responder            *bool
}

// UpdateWireGuardPeerConfig represents the configuration for updating a WireGuard peer.
type UpdateWireGuardPeerConfig struct {
	Name                 *string
	PublicKey            *string
	PrivateKey           *string
	EndpointAddress      *string
	EndpointPort         *int
	AllowedAddresses     *string
	PreSharedKey         *string
	PersistentKeepalive  *int
	Disabled             *bool
	ClientEndpoint       *string
	ClientAddress        *string
	ClientKeepalive      *int
	ClientAllowedAddress *string
	ClientListenPort     *int
	ClientDNS            *string
	Comment              *string
	Responder            *bool
}

// WireGuardPeerInfo represents a WireGuard peer configuration.
type WireGuardPeerInfo struct {
	ID                     string
	Name                   string
	InterfaceName          string
	PublicKey              string
	PrivateKey             string
	EndpointAddress        string
	EndpointPort           int
	CurrentEndpointAddress string
	CurrentEndpointPort    int
	AllowedAddresses       string
	PreSharedKey           string
	PersistentKeepalive    string
	ClientEndpoint         string
	ClientAllowedAddress   string
	LastHandshake          string
	RxBytes                int64
	TxBytes                int64
	Dynamic                bool
	Disabled               bool
	Comment                string
}

// PingResult represents the result of a ping operation.
type PingResult struct {
	Sent     int
	Received int
	Loss     float64
}

// VPN client interface types.
const (
	VPNTypeL2TPOut   = "l2tp-out"
	VPNTypeL2TPIn    = "l2tp-in"
	VPNTypeOVPNOut   = "ovpn-out"
	VPNTypeOVPNIn    = "ovpn-in"
	VPNTypePPPoEOut  = "pppoe-out"
	VPNTypePPPoEIn   = "pppoe-in"
	VPNTypeWireGuard = "wg"
	VPNTypePPTPOut   = "pptp-out"
	VPNTypePPTPIn    = "pptp-in"
	VPNTypeEoIP      = "eoip"
	VPNTypeGRE       = "gre"
	VPNTypeIPIP      = "ipip"
	VPNTypeSIT       = "sit"
)

// vpnInterfaceTypes defines all VPN-related interface types.
var vpnInterfaceTypes = map[string]bool{
	VPNTypeL2TPOut:   true,
	VPNTypeL2TPIn:    true,
	VPNTypeOVPNOut:   true,
	VPNTypeOVPNIn:    true,
	VPNTypePPPoEOut:  true,
	VPNTypePPPoEIn:   true,
	VPNTypeWireGuard: true,
	VPNTypePPTPOut:   true,
	VPNTypePPTPIn:    true,
	VPNTypeEoIP:      true,
	VPNTypeGRE:       true,
	VPNTypeIPIP:      true,
	VPNTypeSIT:       true,
}

// vpnClientTypes defines only VPN client (outgoing) types, excluding server bindings.
var vpnClientTypes = map[string]bool{
	VPNTypeL2TPOut:   true,
	VPNTypeOVPNOut:   true,
	VPNTypePPTPOut:   true,
	VPNTypeWireGuard: true,
	VPNTypeEoIP:      true,
	VPNTypeGRE:       true,
	VPNTypeIPIP:      true,
	VPNTypeSIT:       true,
}

// IsVPNInterfaceType checks if a given type is a VPN interface type.
func IsVPNInterfaceType(interfaceType string) bool {
	return vpnInterfaceTypes[interfaceType]
}

// IsVPNClientType checks if a given type is a VPN client (outgoing) type.
func IsVPNClientType(interfaceType string) bool {
	return vpnClientTypes[interfaceType]
}

// ParseAddressOrPool determines if an address is an IP or pool name and returns the appropriate values.
func (c *Client) ParseAddressOrPool(address string) (ip, poolName string) {
	if address == "" {
		return "", ""
	}

	if net.ParseIP(address) != nil || (net.ParseIP(address[:len(address)-3]) != nil && len(address) > 3 && address[len(address)-3] == '/') {
		return address, ""
	}

	poolRanges, err := c.GetIPPoolRanges(address)
	if err == nil && poolRanges != "" {
		return poolRanges, address
	}

	return address, ""
}

// ListVPNClients returns all VPN client interfaces (excluding server bindings).
func (c *Client) ListVPNClients() ([]VPNClientInfo, error) {
	results, err := c.GetAll("/interface")
	if err != nil {
		return nil, fmt.Errorf("failed to list interfaces: %w", err)
	}

	vpnClients := make([]VPNClientInfo, 0)
	for _, result := range results {
		interfaceType := result["type"]

		if !IsVPNClientType(interfaceType) {
			continue
		}

		mtu, _ := strconv.Atoi(result["mtu"])
		rxByte, _ := strconv.ParseInt(result["rx-byte"], 10, 64)
		txByte, _ := strconv.ParseInt(result["tx-byte"], 10, 64)
		rxPacket, _ := strconv.ParseInt(result["rx-packet"], 10, 64)
		txPacket, _ := strconv.ParseInt(result["tx-packet"], 10, 64)
		linkDowns, _ := strconv.Atoi(result["link-downs"])

		vpnClients = append(vpnClients, VPNClientInfo{
			ID:           result[".id"],
			Name:         result["name"],
			Type:         interfaceType,
			Running:      result["running"] == "true",
			Disabled:     result["disabled"] == "true",
			MTU:          mtu,
			MacAddress:   result["mac-address"],
			RxByte:       rxByte,
			TxByte:       txByte,
			RxPacket:     rxPacket,
			TxPacket:     txPacket,
			LastLinkUp:   FormatRouterOSTime(result["last-link-up-time"]),
			LastLinkDown: FormatRouterOSTime(result["last-link-down-time"]),
			LinkDowns:    linkDowns,
			Comment:      result["comment"],
		})
	}

	return vpnClients, nil
}

// GetVPNClient returns a specific VPN client by name or ID.
func (c *Client) GetVPNClient(nameOrID string) (*VPNClientInfo, error) {
	var result map[string]string
	var err error

	// If it looks like an ID (starts with *), try by ID first
	if strings.HasPrefix(nameOrID, "*") {
		result, err = c.GetByID("/interface", nameOrID)
	} else {
		// Otherwise try by name
		result, err = c.GetFirst("/interface", "?=name="+nameOrID)
	}

	if err != nil {
		return nil, fmt.Errorf("failed to get VPN client %s: %w", nameOrID, err)
	}

	interfaceType := result["type"]
	if !IsVPNInterfaceType(interfaceType) {
		return nil, fmt.Errorf("interface %s is not a VPN client type", nameOrID)
	}

	mtu, _ := strconv.Atoi(result["mtu"])
	rxByte, _ := strconv.ParseInt(result["rx-byte"], 10, 64)
	txByte, _ := strconv.ParseInt(result["tx-byte"], 10, 64)
	rxPacket, _ := strconv.ParseInt(result["rx-packet"], 10, 64)
	txPacket, _ := strconv.ParseInt(result["tx-packet"], 10, 64)
	linkDowns, _ := strconv.Atoi(result["link-downs"])

	return &VPNClientInfo{
		ID:           result[".id"],
		Name:         result["name"],
		Type:         interfaceType,
		Running:      result["running"] == "true",
		Disabled:     result["disabled"] == "true",
		MTU:          mtu,
		MacAddress:   result["mac-address"],
		RxByte:       rxByte,
		TxByte:       txByte,
		RxPacket:     rxPacket,
		TxPacket:     txPacket,
		LastLinkUp:   FormatRouterOSTime(result["last-link-up-time"]),
		LastLinkDown: FormatRouterOSTime(result["last-link-down-time"]),
		LinkDowns:    linkDowns,
		Comment:      result["comment"],
	}, nil
}

// SetVPNClientDisabled enables or disables a VPN client.
func (c *Client) SetVPNClientDisabled(nameOrID string, disabled bool) error {
	// Verify it's a VPN client first and get the actual ID
	vpnClient, err := c.GetVPNClient(nameOrID)
	if err != nil {
		return err
	}

	value := "no"
	if disabled {
		value = "yes"
	}
	_, err = c.Set("/interface", "=.id="+vpnClient.ID, "disabled="+value)
	if err != nil {
		return fmt.Errorf("failed to set VPN client disabled status: %w", err)
	}

	return nil
}

// UpdateVPNClientSettings updates VPN client settings (disabled status and/or comment).
func (c *Client) UpdateVPNClientSettings(nameOrID string, disabled *bool, comment *string) error {
	// Verify it's a VPN client first and get the actual ID
	vpnClient, err := c.GetVPNClient(nameOrID)
	if err != nil {
		return err
	}

	args := []string{"=.id=" + vpnClient.ID}

	if disabled != nil {
		value := "no"
		if *disabled {
			value = "yes"
		}
		args = append(args, "=disabled="+value)
	}

	if comment != nil {
		args = append(args, "=comment="+*comment)
	}

	// If no fields to update, return early
	if len(args) == 1 {
		return nil
	}

	_, err = c.Set("/interface", args...)
	if err != nil {
		return fmt.Errorf("failed to update VPN client settings: %w", err)
	}

	return nil
}

// ListOvpnServers returns all OpenVPN server configurations.
func (c *Client) ListOvpnServers() ([]OvpnServerInfo, error) {
	results, err := c.GetAll("/interface/ovpn-server/server")
	if err != nil {
		return nil, fmt.Errorf("failed to list OpenVPN servers: %w", err)
	}

	servers := make([]OvpnServerInfo, 0)
	for _, result := range results {
		port, _ := strconv.Atoi(result["port"])
		keepAliveTimeout, _ := strconv.Atoi(result["keepalive-timeout"])

		// Handle old RouterOS versions that only support single OpenVPN server
		// Old format: no .id field, uses "enabled" instead of "disabled"
		id := result[".id"]
		if id == "" {
			id = "*1" // RouterOS convention for single items
		}

		name := result["name"]
		if name == "" {
			name = "ovpn/server1" // Default name for single server in old format
		}

		// Determine disabled status: new format uses "disabled", old format uses "enabled"
		var disabled bool
		if disabledStr, ok := result["disabled"]; ok && disabledStr != "" {
			disabled = disabledStr == "true"
		} else if enabledStr, ok := result["enabled"]; ok && enabledStr != "" {
			// Old format: "enabled" field, so disabled = !enabled
			disabled = enabledStr != "true"
		}

		// Protocol defaults to "tcp" if not specified
		protocol := result["protocol"]
		if protocol == "" {
			protocol = "tcp"
		}

		servers = append(servers, OvpnServerInfo{
			ID:                id,
			Name:              name,
			Disabled:          disabled,
			Mode:              result["mode"],
			UserAuthMethod:    result["user-auth-method"],
			CertFile:          result["certificate"],
			KeyFile:           result["key"],
			ProtocolVersion:   protocol,
			Port:              port,
			CipherName:        result["cipher"],
			AuthHashAlgorithm: result["auth"],
			RequireClientCert: result["require-client-certificate"] == "true",
			RequireEncryption: result["require-encryption"] == "true",
			KeepAliveTimeout:  keepAliveTimeout,
			DefaultGateway:    result["default-gateway"] == "true",
			MacAddress:        result["mac-address"],
			DefaultProfile:    result["default-profile"],
			Comment:           result["comment"],
		})
	}

	return servers, nil
}

// GetOvpnServer returns a specific OpenVPN server by ID or name.
func (c *Client) GetOvpnServer(idOrName string) (*OvpnServerInfo, error) {
	var result map[string]string
	var err error

	// If it looks like an ID (starts with *), try by ID first
	if strings.HasPrefix(idOrName, "*") {
		result, err = c.GetByID("/interface/ovpn-server/server", idOrName)
	} else {
		// Otherwise try by name
		result, err = c.GetFirst("/interface/ovpn-server/server", "?=name="+idOrName)
	}

	if err != nil {
		return nil, fmt.Errorf("failed to get OpenVPN server %s: %w", idOrName, err)
	}

	return parseOvpnServerInfo(result), nil
}

// AddOvpnServer creates a new OpenVPN server configuration.
func (c *Client) AddOvpnServer(name string, port int, mode, protocol, certificate string, requireClientCert bool, auth, cipher, profile string) (string, error) {
	args := []string{
		"=name=" + name,
		"=port=" + strconv.Itoa(port),
		"=mode=" + mode,
		"=protocol=" + protocol,
		"=certificate=" + certificate,
		"=auth=" + auth,
		"=cipher=" + cipher,
		"=redirect-gateway=def1",
		"=disabled=no",
	}

	if profile != "" {
		args = append(args, "=default-profile="+profile)
	}

	if requireClientCert {
		args = append(args, "=require-client-certificate=true")
	}

	id, err := c.Add("/interface/ovpn-server/server", args...)
	if err != nil {
		return "", fmt.Errorf("failed to add OpenVPN server: %w", err)
	}

	return id, nil
}

// FindNextAvailableOvpnPort finds the next available port for OpenVPN server with the specified protocol.
func (c *Client) FindNextAvailableOvpnPort(startPort int, protocol string) (int, error) {
	if protocol != "tcp" && protocol != "udp" {
		return 0, fmt.Errorf("invalid protocol: must be 'tcp' or 'udp'")
	}

	servers, err := c.ListOvpnServers()
	if err != nil {
		return 0, fmt.Errorf("failed to list OpenVPN servers: %w", err)
	}

	port := startPort
	for {
		occupied := false
		for i := range servers {
			if servers[i].Port == port && servers[i].ProtocolVersion == protocol {
				occupied = true
				break
			}
		}
		if !occupied {
			return port, nil
		}
		port++
		if port > 65535 {
			return 0, fmt.Errorf("no available ports found")
		}
	}
}

// GetPptpServer returns the PPTP server configuration.
func (c *Client) GetPptpServer() (*PptpServerInfo, error) {
	result, err := c.GetFirst("/interface/pptp-server/server")
	if err != nil {
		return nil, fmt.Errorf("failed to get PPTP server: %w", err)
	}

	maxMTU, _ := strconv.Atoi(result["max-mtu"])
	maxMRU, _ := strconv.Atoi(result["max-mru"])
	keepaliveTimeout, _ := strconv.Atoi(result["keepalive-timeout"])

	return &PptpServerInfo{
		ID:               result[".id"],
		Enabled:          result["enabled"] == "true",
		MaxMTU:           maxMTU,
		MaxMRU:           maxMRU,
		MRRU:             result["mrru"],
		Authentication:   result["authentication"],
		KeepaliveTimeout: keepaliveTimeout,
		DefaultProfile:   result["default-profile"],
	}, nil
}

// GetL2tpServer returns the L2TP server configuration.
func (c *Client) GetL2tpServer() (*L2tpServerInfo, error) {
	result, err := c.GetFirst("/interface/l2tp-server/server")
	if err != nil {
		return nil, fmt.Errorf("failed to get L2TP server: %w", err)
	}

	maxMTU, _ := strconv.Atoi(result["max-mtu"])
	maxMRU, _ := strconv.Atoi(result["max-mru"])
	keepaliveTimeout, _ := strconv.Atoi(result["keepalive-timeout"])
	l2tpv3CookieLength, _ := strconv.Atoi(result["l2tpv3-cookie-length"])

	return &L2tpServerInfo{
		ID:                   result[".id"],
		Enabled:              result["enabled"] == "true",
		MaxMTU:               maxMTU,
		MaxMRU:               maxMRU,
		MRRU:                 result["mrru"],
		Authentication:       result["authentication"],
		KeepaliveTimeout:     keepaliveTimeout,
		MaxSessions:          result["max-sessions"],
		DefaultProfile:       result["default-profile"],
		UseIPsec:             result["use-ipsec"],
		IPsecSecret:          result["ipsec-secret"],
		CallerIDType:         result["caller-id-type"],
		OneSessionPerHost:    result["one-session-per-host"] == "true",
		AllowFastPath:        result["allow-fast-path"] == "true",
		L2TPv3CircuitID:      result["l2tpv3-circuit-id"],
		L2TPv3CookieLength:   l2tpv3CookieLength,
		L2TPv3DigestHash:     result["l2tpv3-digest-hash"],
		AcceptPseudowireType: result["accept-pseudowire-type"],
		AcceptProtoVersion:   result["accept-proto-version"],
	}, nil
}

// GetSstpServer returns the SSTP server configuration.
func (c *Client) GetSstpServer() (*SstpServerInfo, error) {
	result, err := c.GetFirst("/interface/sstp-server/server")
	if err != nil {
		return nil, fmt.Errorf("failed to get SSTP server: %w", err)
	}

	port, _ := strconv.Atoi(result["port"])
	maxMTU, _ := strconv.Atoi(result["max-mtu"])
	maxMRU, _ := strconv.Atoi(result["max-mru"])
	keepaliveTimeout, _ := strconv.Atoi(result["keepalive-timeout"])

	return &SstpServerInfo{
		ID:                      result[".id"],
		Enabled:                 result["enabled"] == "true",
		Port:                    port,
		MaxMTU:                  maxMTU,
		MaxMRU:                  maxMRU,
		MRRU:                    result["mrru"],
		KeepaliveTimeout:        keepaliveTimeout,
		DefaultProfile:          result["default-profile"],
		Authentication:          result["authentication"],
		Certificate:             result["certificate"],
		VerifyClientCertificate: result["verify-client-certificate"] == "true",
		PFS:                     result["pfs"],
		TLSVersion:              result["tls-version"],
		Ciphers:                 result["ciphers"],
	}, nil
}

// ListWireGuards returns all WireGuard interfaces.
func (c *Client) ListWireGuards() ([]WireGuardInfo, error) {
	results, err := c.GetAll("/interface/wireguard")
	if err != nil {
		return nil, fmt.Errorf("failed to list WireGuard interfaces: %w", err)
	}

	interfaces := make([]WireGuardInfo, 0)
	for _, result := range results {
		mtu, _ := strconv.Atoi(result["mtu"])
		listenPort, _ := strconv.Atoi(result["listen-port"])

		interfaces = append(interfaces, WireGuardInfo{
			ID:         result[".id"],
			Name:       result["name"],
			Running:    result["running"] == "true",
			Disabled:   result["disabled"] == "true",
			MTU:        mtu,
			MacAddress: result["mac-address"],
			PublicKey:  result["public-key"],
			PrivateKey: result["private-key"],
			ListenPort: listenPort,
			Comment:    result["comment"],
		})
	}

	return interfaces, nil
}

// GetWireGuard returns a specific WireGuard interface by name or ID.
func (c *Client) GetWireGuard(nameOrID string) (*WireGuardInfo, error) {
	var result map[string]string
	var err error

	// If it looks like an ID (starts with *), try by ID first
	if strings.HasPrefix(nameOrID, "*") {
		result, err = c.GetByID("/interface/wireguard", nameOrID)
	} else {
		// Otherwise try by name
		result, err = c.GetFirst("/interface/wireguard", "?=name="+nameOrID)
	}

	if err != nil {
		return nil, fmt.Errorf("failed to get WireGuard interface %s: %w", nameOrID, err)
	}

	return parseWireGuardInfo(result), nil
}

// GetL2TPProfile returns L2TP profile details by name.
func (c *Client) GetL2TPProfile(profileName string) (*L2TPProfileInfo, error) {
	result, err := c.GetFirst("/ppp/profile", "?=name="+profileName)
	if err != nil {
		return nil, fmt.Errorf("failed to get L2TP profile %s: %w", profileName, err)
	}

	return &L2TPProfileInfo{
		ID:              result[".id"],
		Name:            result["name"],
		LocalAddress:    result["local-address"],
		RemoteAddress:   result["remote-address"],
		DNSServer:       result["dns-server"],
		WINSServer:      result["wins-server"],
		UseIPv6:         result["use-ipv6"] == "yes",
		UseEncryption:   result["use-encryption"],
		OnlyEncrypted:   result["only-encrypted"],
		ChangeIPAddress: result["change-tcp-mss"],
		UseCompression:  result["use-compression"],
		OnlyOne:         result["only-one"],
		ChangeTCPMSS:    result["change-tcp-mss"],
		IPPool:          result["pool"],
		Comment:         result["comment"],
	}, nil
}

// GetL2TPSecretsForProfile returns all secrets for an L2TP profile.
func (c *Client) GetL2TPSecretsForProfile(profileName string) ([]L2TPSecret, error) {
	results, err := c.GetAll("/ppp/secret", "?=profile="+profileName)
	if err != nil {
		return nil, fmt.Errorf("failed to get L2TP secrets for profile %s: %w", profileName, err)
	}

	var secrets []L2TPSecret
	for _, result := range results {
		secrets = append(secrets, L2TPSecret{
			Name:     result["name"],
			Password: result["password"],
			Comment:  result["comment"],
		})
	}

	return secrets, nil
}

// GetPppSecretByNameAndService checks if a PPP secret exists by name and service.
func (c *Client) GetPppSecretByNameAndService(username, service string) (bool, error) {
	result, err := c.GetFirst("/ppp/secret", "?=name="+username, "?=service="+service)
	if err != nil {
		if err.Error() == "no results found" {
			return false, nil
		}
		return false, err
	}
	if result != nil && result["name"] != "" {
		return true, nil
	}
	return false, nil
}

// GetPppSecretsByProfile returns all PPP secrets for a given profile.
func (c *Client) GetPppSecretsByProfile(profileName string) ([]map[string]string, error) {
	results, err := c.GetAll("/ppp/secret", "?=profile="+profileName)
	if err != nil {
		if err.Error() == "no results found" {
			return []map[string]string{}, nil
		}
		return nil, fmt.Errorf("failed to get PPP secrets for profile %s: %w", profileName, err)
	}
	return results, nil
}

// RemovePppSecret deletes a PPP secret by name and service.
func (c *Client) RemovePppSecret(username, service string) error {
	result, err := c.GetFirst("/ppp/secret", "?=name="+username, "?=service="+service)
	if err != nil {
		return fmt.Errorf("failed to find PPP secret %s for service %s: %w", username, service, err)
	}
	_, err = c.Remove("/ppp/secret", "=.id="+result[".id"])
	if err != nil {
		return fmt.Errorf("failed to remove PPP secret %s: %w", username, err)
	}
	return nil
}

// RemovePppSecretByNameOrID deletes a PPP secret by username or ID, regardless of service type.
func (c *Client) RemovePppSecretByNameOrID(usernameOrID string) error {
	var result map[string]string
	var err error

	// If it looks like an ID (starts with *), try by ID first
	if strings.HasPrefix(usernameOrID, "*") {
		result, err = c.GetByID("/ppp/secret", usernameOrID)
	} else {
		// Otherwise try by name
		result, err = c.GetFirst("/ppp/secret", "?=name="+usernameOrID)
	}

	if err != nil {
		return fmt.Errorf("failed to find PPP secret %s: %w", usernameOrID, err)
	}

	_, err = c.Remove("/ppp/secret", "=.id="+result[".id"])
	if err != nil {
		return fmt.Errorf("failed to remove PPP secret %s: %w", usernameOrID, err)
	}
	return nil
}

// UpdatePppSecretParams represents parameters for updating a PPP secret.
type UpdatePppSecretParams struct {
	Name          *string
	Password      *string
	Profile       *string
	Disabled      *bool
	LimitBytesIn  *int64
	LimitBytesOut *int64
	Comment       *string
	CallerID      *string
	Routes        *string
}

// UpdatePppSecret updates a PPP secret by username or ID with the given parameters.
func (c *Client) UpdatePppSecret(usernameOrID string, params UpdatePppSecretParams) (map[string]string, error) {
	var result map[string]string
	var err error

	// If it looks like an ID (starts with *), try by ID first
	if strings.HasPrefix(usernameOrID, "*") {
		result, err = c.GetByID("/ppp/secret", usernameOrID)
	} else {
		// Otherwise try by name
		result, err = c.GetFirst("/ppp/secret", "?=name="+usernameOrID)
	}

	if err != nil {
		return nil, fmt.Errorf("failed to find PPP secret %s: %w", usernameOrID, err)
	}

	id := result[".id"]
	args := make([]string, 0, 8)
	args = append(args, "=.id="+id)

	if params.Name != nil {
		args = append(args, "=name="+*params.Name)
	}
	if params.Password != nil {
		args = append(args, "=password="+*params.Password)
	}
	if params.Profile != nil {
		args = append(args, "=profile="+*params.Profile)
	}
	if params.Disabled != nil {
		args = append(args, "=disabled="+fmt.Sprintf("%v", *params.Disabled))
	}
	if params.LimitBytesIn != nil {
		args = append(args, "=limit-bytes-in="+fmt.Sprintf("%d", *params.LimitBytesIn))
	}
	if params.LimitBytesOut != nil {
		args = append(args, "=limit-bytes-out="+fmt.Sprintf("%d", *params.LimitBytesOut))
	}
	if params.Comment != nil {
		args = append(args, "=comment="+*params.Comment)
	}
	if params.CallerID != nil {
		args = append(args, "=caller-id="+*params.CallerID)
	}
	if params.Routes != nil {
		args = append(args, "=routes="+*params.Routes)
	}

	_, err = c.Set("/ppp/secret", args...)
	if err != nil {
		return nil, fmt.Errorf("failed to update PPP secret %s: %w", usernameOrID, err)
	}

	result, err = c.GetByID("/ppp/secret", id)
	if err != nil {
		return nil, fmt.Errorf("failed to retrieve updated PPP secret: %w", err)
	}

	return result, nil
}

// CreatePppSecret creates a new PPP secret with the given parameters.
func (c *Client) CreatePppSecret(params CreatePppSecretParams) (map[string]string, error) {
	args := []string{
		"=name=" + params.Name,
		"=password=" + params.Password,
		"=service=" + params.Service,
		"=profile=" + params.Profile,
	}

	if params.Disabled != nil {
		args = append(args, "=disabled="+fmt.Sprintf("%v", *params.Disabled))
	}
	if params.LimitBytesIn != nil {
		args = append(args, "=limit-bytes-in="+fmt.Sprintf("%d", *params.LimitBytesIn))
	}
	if params.LimitBytesOut != nil {
		args = append(args, "=limit-bytes-out="+fmt.Sprintf("%d", *params.LimitBytesOut))
	}
	if params.Comment != nil && *params.Comment != "" {
		args = append(args, "=comment="+*params.Comment)
	}
	if params.CallerID != nil && *params.CallerID != "" {
		args = append(args, "=caller-id="+*params.CallerID)
	}
	if params.Routes != nil && *params.Routes != "" {
		args = append(args, "=routes="+*params.Routes)
	}

	id, err := c.Add("/ppp/secret", args...)
	if err != nil {
		return nil, fmt.Errorf("failed to create PPP secret: %w", err)
	}

	result, err := c.GetByID("/ppp/secret", id)
	if err != nil {
		return nil, fmt.Errorf("failed to retrieve created PPP secret: %w", err)
	}

	return result, nil
}

// RemovePppProfile deletes a PPP profile by name.
func (c *Client) RemovePppProfile(name string) error {
	result, err := c.GetFirst("/ppp/profile", "?=name="+name)
	if err != nil {
		return fmt.Errorf("failed to find PPP profile %s: %w", name, err)
	}
	_, err = c.Remove("/ppp/profile", "=.id="+result[".id"])
	if err != nil {
		return fmt.Errorf("failed to remove PPP profile %s: %w", name, err)
	}
	return nil
}

// RemoveOvpnServer deletes an OpenVPN server by name or ID.
func (c *Client) RemoveOvpnServer(nameOrID string) error {
	var id string
	result, err := c.GetFirst("/interface/ovpn-server/server", "?=name="+nameOrID)
	if err == nil {
		id = result[".id"]
	} else {
		result, err = c.GetFirst("/interface/ovpn-server/server", "?=.id="+nameOrID)
		if err != nil {
			return fmt.Errorf("failed to find OpenVPN server %s: %w", nameOrID, err)
		}
		id = result[".id"]
	}
	_, err = c.Remove("/interface/ovpn-server/server", "=.id="+id)
	if err != nil {
		return fmt.Errorf("failed to remove OpenVPN server %s: %w", nameOrID, err)
	}
	return nil
}

// GetL2TPIPPoolsForProfile returns IP pools assigned to an L2TP profile.
func (c *Client) GetL2TPIPPoolsForProfile(profileName string) ([]L2TPIPPool, error) {
	results, err := c.GetAll("/ip/pool", "?=name="+profileName)
	if err != nil {
		return nil, fmt.Errorf("failed to get L2TP IP pools for profile %s: %w", profileName, err)
	}

	var pools []L2TPIPPool
	for _, result := range results {
		pools = append(pools, L2TPIPPool{
			ID:      result[".id"],
			Name:    result["name"],
			Ranges:  result["ranges"],
			Comment: result["comment"],
		})
	}

	return pools, nil
}

// GetIPPoolRanges returns the IP ranges for a given pool name.
func (c *Client) GetIPPoolRanges(poolName string) (string, error) {
	result, err := c.GetFirst("/ip/pool", "?=name="+poolName)
	if err != nil {
		return "", fmt.Errorf("failed to get IP pool ranges for %s: %w", poolName, err)
	}

	return result["ranges"], nil
}

// ProfileExists checks if a PPP profile with the given name exists.
func (c *Client) ProfileExists(profileName string) (bool, error) {
	result, err := c.GetFirst("/ppp/profile", "?=name="+profileName)
	if err != nil {
		if fmt.Sprint(err) == "no results found" {
			return false, nil
		}
		return false, fmt.Errorf("failed to check profile existence: %w", err)
	}

	return result != nil && result[".id"] != "", nil
}

// CreateVPNProfile creates a PPP profile with default settings for VPN clients (L2TP, PPTP, SSTP, etc).
func (c *Client) CreateVPNProfile(profileName string) error {
	args := []string{"=name=" + profileName}
	_, err := c.Add("/ppp/profile", args...)
	if err != nil {
		return fmt.Errorf("failed to create VPN profile %s: %w", profileName, err)
	}

	return nil
}

// AddL2TPClient adds a new L2TP client with the given parameters.
func (c *Client) AddL2TPClient(name, connectTo, user, password, profileName, ipsecSecret string, useIPsec, disabled bool) error {
	args := []string{
		"=name=" + name,
		"=connect-to=" + connectTo,
		"=user=" + user,
		"=password=" + password,
		"=profile=" + profileName,
		"=use-ipsec=" + utils.ToYesNo(useIPsec),
		"=disabled=" + utils.ToYesNo(disabled),
	}

	if useIPsec && ipsecSecret != "" {
		args = append(args, "=ipsec-secret="+ipsecSecret)
	}

	_, err := c.Add("/interface/l2tp-client", args...)
	if err != nil {
		return fmt.Errorf("failed to add L2TP client %s: %w", name, err)
	}

	return nil
}

// UpdateL2TPClient updates L2TP client settings.
func (c *Client) UpdateL2TPClient(nameOrID string, connectTo, user, password *string, disabled *bool, ipsecSecret *string, useIPsec *bool) error {
	// Get the L2TP client to find its ID
	vpnClient, err := c.GetVPNClient(nameOrID)
	if err != nil {
		return fmt.Errorf("L2TP client not found: %w", err)
	}

	args := []string{"=.id=" + vpnClient.ID}

	if connectTo != nil && *connectTo != "" {
		args = append(args, "=connect-to="+*connectTo)
	}

	if user != nil && *user != "" {
		args = append(args, "=user="+*user)
	}

	if password != nil && *password != "" {
		args = append(args, "=password="+*password)
	}

	if disabled != nil {
		args = append(args, "=disabled="+utils.ToYesNo(*disabled))
	}

	if useIPsec != nil {
		args = append(args, "=use-ipsec="+utils.ToYesNo(*useIPsec))
	}

	if ipsecSecret != nil && *ipsecSecret != "" {
		args = append(args, "=ipsec-secret="+*ipsecSecret)
	}

	// If only the ID is provided, nothing to update
	if len(args) == 1 {
		return nil
	}

	_, err = c.Set("/interface/l2tp-client", args...)
	if err != nil {
		return fmt.Errorf("failed to update L2TP client %s: %w", nameOrID, err)
	}

	return nil
}

// RemoveL2TPClient removes an L2TP client by name or ID.
func (c *Client) RemoveL2TPClient(nameOrID string) error {
	// Get the L2TP client to find its ID
	vpnClient, err := c.GetVPNClient(nameOrID)
	if err != nil {
		return fmt.Errorf("L2TP client not found: %w", err)
	}

	_, err = c.Remove("/interface/l2tp-client", "=.id="+vpnClient.ID)
	if err != nil {
		return fmt.Errorf("failed to remove L2TP client %s: %w", nameOrID, err)
	}

	return nil
}

// GetL2TPClientInfo retrieves detailed information about an L2TP client.
func (c *Client) GetL2TPClientInfo(nameOrID string) (*L2TPClientInfo, error) {
	var result map[string]string
	var err error

	// If it looks like an ID (starts with *), try by ID first
	if strings.HasPrefix(nameOrID, "*") {
		result, err = c.GetByID("/interface/l2tp-client", nameOrID)
	} else {
		// Otherwise try by name
		result, err = c.GetFirst("/interface/l2tp-client", "?=name="+nameOrID)
	}

	if err != nil {
		return nil, fmt.Errorf("failed to get L2TP client %s: %w", nameOrID, err)
	}

	return parseL2TPClientInfo(c, result)
}

func parseL2TPClientInfo(c *Client, result map[string]string) (*L2TPClientInfo, error) {
	maxMTU, _ := strconv.Atoi(result["max-mtu"])
	maxMRU, _ := strconv.Atoi(result["max-mru"])
	keepaliveTimeout, _ := strconv.Atoi(result["keepalive-timeout"])

	l2tpClient := &L2TPClientInfo{
		ID:               result[".id"],
		Name:             result["name"],
		Disabled:         result["disabled"] == "true",
		Running:          result["running"] == "true",
		MaxMTU:           maxMTU,
		MaxMRU:           maxMRU,
		MRRU:             result["mrru"],
		ConnectTo:        result["connect-to"],
		User:             result["user"],
		Password:         result["password"],
		Profile:          result["profile"],
		KeepaliveTimeout: keepaliveTimeout,
		UsePeerDNS:       result["use-peer-dns"] == "yes",
		UseIPsec:         result["use-ipsec"] == "true" || result["use-ipsec"] == "yes",
		IPsecSecret:      result["ipsec-secret"],
		AllowFastPath:    result["allow-fast-path"] == "true" || result["allow-fast-path"] == "yes",
		AddDefaultRoute:  result["add-default-route"] == "true" || result["add-default-route"] == "yes",
		DialOnDemand:     result["dial-on-demand"] == "true" || result["dial-on-demand"] == "yes",
		Allow:            result["allow"],
		RandomSourcePort: result["random-source-port"] == "true" || result["random-source-port"] == "yes",
		L2TPProtoVersion: result["l2tp-proto-version"],
		L2TPv3DigestHash: result["l2tpv3-digest-hash"],
		AddRoutes:        result["add-routes"] == "yes" || result["add-routes"] == "true",
		Comment:          result["comment"],
	}

	// Get monitor data
	monitorReply, err := c.Execute("/interface/l2tp-client/monitor", "=once=yes", "=.id="+result[".id"])
	if err == nil && monitorReply != nil && len(monitorReply.Re) > 0 {
		monitor := monitorReply.Re[0].Map
		mtu, _ := strconv.Atoi(monitor["mtu"])
		l2tpClient.Status = monitor["status"]
		l2tpClient.Uptime = utils.FormatRouterOSDuration(monitor["uptime"])
		l2tpClient.Encoding = monitor["encoding"]
		l2tpClient.MTU = mtu
		l2tpClient.LocalAddress = monitor["local-address"]
		l2tpClient.RemoteAddress = monitor["remote-address"]
		l2tpClient.LocalIPv6Address = monitor["local-ipv6-address"]
		l2tpClient.RemoteIPv6Address = monitor["remote-ipv6-address"]
	}

	return l2tpClient, nil
}

// CreateWireGuardInterface creates a new WireGuard client interface with the specified configuration.
// The interface name will have "-client" suffix appended automatically.
func (c *Client) CreateWireGuardInterface(config WireGuardClientConfig) (*WireGuardInfo, error) {
	// Append "-client" suffix to interface name
	interfaceName := config.Name

	// Build add arguments
	args := []string{"=name=" + interfaceName}

	if config.PrivateKey != nil && *config.PrivateKey != "" {
		args = append(args, "=private-key="+*config.PrivateKey)
	}

	if config.ListenPort != nil && *config.ListenPort > 0 {
		args = append(args, "=listen-port="+strconv.Itoa(*config.ListenPort))
	}

	if config.MTU != nil && *config.MTU > 0 {
		args = append(args, "=mtu="+strconv.Itoa(*config.MTU))
	}

	if config.Disabled != nil && *config.Disabled {
		args = append(args, "=disabled=yes")
	}

	if config.Comment != nil && *config.Comment != "" {
		args = append(args, "=comment="+*config.Comment)
	}

	// Create WireGuard interface
	_, err := c.Add("/interface/wireguard", args...)
	if err != nil {
		return nil, fmt.Errorf("failed to create WireGuard interface: %w", err)
	}

	// Retrieve created interface details
	wireguard, err := c.GetWireGuard(interfaceName)
	if err != nil {
		return nil, fmt.Errorf("failed to retrieve WireGuard interface: %w", err)
	}

	return wireguard, nil
}

// AddWireGuardPeer creates a WireGuard peer in the RouterOS device.
func (c *Client) AddWireGuardPeer(config WireGuardPeerConfig) (string, error) {
	args := []string{
		"=name=" + config.PeerName,
		"=interface=" + config.InterfaceName,
		"=public-key=" + *config.PublicKey,
		"=endpoint-address=" + config.EndpointAddress,
		"=endpoint-port=" + strconv.Itoa(config.EndpointPort),
	}

	if len(config.AllowedAddresses) > 0 {
		args = append(args, "=allowed-address="+config.AllowedAddresses[0])
		for _, addr := range config.AllowedAddresses[1:] {
			args = append(args, "=allowed-address="+addr)
		}
	}

	if config.PresharedKey != nil && *config.PresharedKey != "" {
		args = append(args, "=preshared-key="+*config.PresharedKey)
	}

	if config.PersistentKeepalive != nil && *config.PersistentKeepalive > 0 {
		args = append(args, "=persistent-keepalive="+strconv.Itoa(*config.PersistentKeepalive))
	}

	if config.SavePrivateKey && config.PrivateKey != nil && *config.PrivateKey != "" {
		args = append(args, "=private-key="+*config.PrivateKey)
	}

	if config.ClientEndpoint != nil && *config.ClientEndpoint != "" {
		args = append(args, "=client-endpoint="+*config.ClientEndpoint)
	}

	if config.ClientAddress != nil && *config.ClientAddress != "" {
		args = append(args, "=client-address="+*config.ClientAddress)
	}

	if config.ClientKeepalive != nil && *config.ClientKeepalive > 0 {
		args = append(args, "=client-keepalive="+strconv.Itoa(*config.ClientKeepalive))
	}

	if config.ClientAllowedAddress != nil && *config.ClientAllowedAddress != "" {
		args = append(args, "=client-allowed-address="+*config.ClientAllowedAddress)
	}

	if config.ClientListenPort != nil && *config.ClientListenPort > 0 {
		args = append(args, "=client-listen-port="+strconv.Itoa(*config.ClientListenPort))
	}

	if config.ClientDNS != nil && *config.ClientDNS != "" {
		args = append(args, "=client-dns="+*config.ClientDNS)
	}

	if config.Comment != nil && *config.Comment != "" {
		args = append(args, "=comment="+*config.Comment)
	}

	if config.Responder != nil && *config.Responder {
		args = append(args, "=responder=true")
	}

	id, err := c.Add("/interface/wireguard/peers", args...)
	if err != nil {
		return "", fmt.Errorf("failed to add WireGuard peer: %w", err)
	}

	return id, nil
}

// GetWireGuardPeers retrieves all peers for a WireGuard interface.
func (c *Client) GetWireGuardPeers(interfaceName string) ([]WireGuardPeerInfo, error) {
	results, err := c.GetAll("/interface/wireguard/peers", "?=interface="+interfaceName)
	if err != nil {
		return nil, fmt.Errorf("failed to get WireGuard peers for interface %s: %w", interfaceName, err)
	}

	peers := make([]WireGuardPeerInfo, 0)
	for _, result := range results {
		endpointPort, _ := strconv.Atoi(result["endpoint-port"])
		currentEndpointPort, _ := strconv.Atoi(result["current-endpoint-port"])
		rxBytes, _ := strconv.ParseInt(result["rx"], 10, 64)
		txBytes, _ := strconv.ParseInt(result["tx"], 10, 64)
		dynamic := result["dynamic"] == "true"
		disabled := result["disabled"] == "true"

		peers = append(peers, WireGuardPeerInfo{
			ID:                     result[".id"],
			Name:                   result["name"],
			InterfaceName:          result["interface"],
			PublicKey:              result["public-key"],
			PrivateKey:             result["private-key"],
			EndpointAddress:        result["endpoint-address"],
			EndpointPort:           endpointPort,
			CurrentEndpointAddress: result["current-endpoint-address"],
			CurrentEndpointPort:    currentEndpointPort,
			AllowedAddresses:       result["allowed-address"],
			PreSharedKey:           result["preshared-key"],
			PersistentKeepalive:    result["persistent-keepalive"],
			ClientEndpoint:         result["client-endpoint"],
			ClientAllowedAddress:   result["client-allowed-address"],
			LastHandshake:          result["last-handshake"],
			RxBytes:                rxBytes,
			TxBytes:                txBytes,
			Dynamic:                dynamic,
			Disabled:               disabled,
			Comment:                result["comment"],
		})
	}

	return peers, nil
}

// GetWireGuardPeerByNameOrID returns a WireGuard peer by its name or ID.
func (c *Client) GetWireGuardPeerByNameOrID(nameOrID string) (*WireGuardPeerInfo, error) {
	if nameOrID == "" {
		return nil, fmt.Errorf("peer name or ID is required")
	}

	interfaces, err := c.ListWireGuards()
	if err != nil {
		return nil, err
	}

	for _, iface := range interfaces {
		peers, err := c.GetWireGuardPeers(iface.Name)
		if err != nil {
			continue
		}

		for i := range peers {
			if peers[i].ID == nameOrID || peers[i].Name == nameOrID {
				return &peers[i], nil
			}
		}
	}

	return nil, fmt.Errorf("WireGuard peer not found: %s", nameOrID)
}

// DeleteWireGuardPeer deletes a WireGuard peer by name or ID.
func (c *Client) DeleteWireGuardPeer(nameOrID string) error {
	if nameOrID == "" {
		return fmt.Errorf("peer name or ID is required")
	}

	// Get the peer to find its ID if name is provided
	peer, err := c.GetWireGuardPeerByNameOrID(nameOrID)
	if err != nil {
		return err
	}

	_, err = c.Remove("/interface/wireguard/peers", "=.id="+peer.ID)
	if err != nil {
		return fmt.Errorf("failed to delete WireGuard peer %s: %w", nameOrID, err)
	}

	return nil
}

// DeleteWireGuardInterface deletes a WireGuard interface along with all its peers and associated IP addresses.
func (c *Client) DeleteWireGuardInterface(nameOrID string) error {
	if nameOrID == "" {
		return fmt.Errorf("interface name or ID is required")
	}

	// Get the interface to find its ID and name if name is provided
	wg, err := c.GetWireGuard(nameOrID)
	if err != nil {
		return err
	}

	// Delete all peers associated with this interface
	peers, err := c.GetWireGuardPeers(wg.Name)
	if err == nil {
		for i := range peers {
			_, _ = c.Remove("/interface/wireguard/peers", "=.id="+peers[i].ID)
		}
	}

	// Delete all IP addresses associated with this interface
	addresses, err := c.GetIPAddressesByInterface(wg.Name)
	if err == nil {
		for _, addr := range addresses {
			_ = c.RemoveIPAddress(addr.ID)
		}
	}

	// Delete the interface itself
	_, err = c.Remove("/interface/wireguard", "=.id="+wg.ID)
	if err != nil {
		return fmt.Errorf("failed to delete WireGuard interface %s: %w", nameOrID, err)
	}

	return nil
}

// UpdateWireGuardPeer updates a WireGuard peer configuration.
func (c *Client) UpdateWireGuardPeer(peerID string, config UpdateWireGuardPeerConfig) error {
	if peerID == "" {
		return fmt.Errorf("peer ID is required")
	}

	args := []string{"=.id=" + peerID}

	if config.Name != nil && *config.Name != "" {
		args = append(args, "=name="+*config.Name)
	}
	if config.PublicKey != nil && *config.PublicKey != "" {
		args = append(args, "=public-key="+*config.PublicKey)
	}
	if config.PrivateKey != nil && *config.PrivateKey != "" {
		args = append(args, "=private-key="+*config.PrivateKey)
	}
	if config.EndpointAddress != nil && *config.EndpointAddress != "" {
		args = append(args, "=endpoint-address="+*config.EndpointAddress)
	}
	if config.EndpointPort != nil && *config.EndpointPort > 0 {
		args = append(args, "=endpoint-port="+strconv.Itoa(*config.EndpointPort))
	}
	if config.AllowedAddresses != nil && *config.AllowedAddresses != "" {
		args = append(args, "=allowed-address="+*config.AllowedAddresses)
	}
	if config.PreSharedKey != nil {
		if *config.PreSharedKey != "" {
			args = append(args, "=preshared-key="+*config.PreSharedKey)
		}
	}
	if config.PersistentKeepalive != nil && *config.PersistentKeepalive > 0 {
		args = append(args, "=persistent-keepalive="+strconv.Itoa(*config.PersistentKeepalive))
	}
	if config.ClientEndpoint != nil && *config.ClientEndpoint != "" {
		args = append(args, "=client-endpoint="+*config.ClientEndpoint)
	}
	if config.ClientAddress != nil && *config.ClientAddress != "" {
		args = append(args, "=client-address="+*config.ClientAddress)
	}
	if config.ClientKeepalive != nil && *config.ClientKeepalive > 0 {
		args = append(args, "=client-keepalive="+strconv.Itoa(*config.ClientKeepalive))
	}
	if config.ClientAllowedAddress != nil && *config.ClientAllowedAddress != "" {
		args = append(args, "=client-allowed-address="+*config.ClientAllowedAddress)
	}
	if config.ClientListenPort != nil && *config.ClientListenPort > 0 {
		args = append(args, "=client-listen-port="+strconv.Itoa(*config.ClientListenPort))
	}
	if config.ClientDNS != nil && *config.ClientDNS != "" {
		args = append(args, "=client-dns="+*config.ClientDNS)
	}
	if config.Comment != nil && *config.Comment != "" {
		args = append(args, "=comment="+*config.Comment)
	}
	if config.Responder != nil && *config.Responder {
		args = append(args, "=responder=yes")
	}
	if config.Disabled != nil {
		args = append(args, "=disabled="+strconv.FormatBool(*config.Disabled))
	}

	_, err := c.Set("/interface/wireguard/peers", args...)
	return err
}

// PingPeerEndpoint pings a WireGuard peer endpoint address from a specific interface.
// Returns true if any packets were received (connection is active).
func (c *Client) PingPeerEndpoint(interfaceName, peerEndpoint string) (bool, error) {
	if interfaceName == "" || peerEndpoint == "" {
		return false, fmt.Errorf("interface name and peer endpoint are required")
	}

	reply, err := c.Execute("/tool/ping",
		"=count=1",
		"=interface="+interfaceName,
		"=interval=1000ms",
		"=address="+peerEndpoint,
	)
	if err != nil {
		return false, fmt.Errorf("failed to ping peer endpoint %s from interface %s: %w", peerEndpoint, interfaceName, err)
	}

	if reply == nil || len(reply.Re) == 0 {
		return false, nil
	}

	for _, sentence := range reply.Re {
		result := sentence.Map
		if result != nil {
			if received, err := strconv.Atoi(result["received"]); err == nil && received > 0 {
				return true, nil
			}
		}
	}

	return false, nil
}

// UpdateWireGuardInterface updates the properties of an existing WireGuard interface.
func (c *Client) UpdateWireGuardInterface(nameOrID string, config WireGuardClientConfig) error {
	if nameOrID == "" {
		return fmt.Errorf("interface name or ID is required")
	}

	wireguard, err := c.GetWireGuard(nameOrID)
	if err != nil {
		return err
	}

	args := []string{"=.id=" + wireguard.ID}

	if config.Disabled != nil {
		args = append(args, "=disabled="+strconv.FormatBool(*config.Disabled))
	}
	if config.Comment != nil {
		args = append(args, "=comment="+*config.Comment)
	}
	if config.MTU != nil {
		args = append(args, "=mtu="+strconv.Itoa(*config.MTU))
	}
	if config.ListenPort != nil {
		args = append(args, "=listen-port="+strconv.Itoa(*config.ListenPort))
	}
	if config.PrivateKey != nil {
		args = append(args, "=private-key="+*config.PrivateKey)
	}

	_, err = c.Set("/interface/wireguard", args...)
	return err
}

// CheckWireGuardStatus checks the status of a WireGuard interface and its connectivity.
// Returns (running, peersConnected) tuple.
func (c *Client) CheckWireGuardStatus(interfaceName string) (running, peersConnected bool) {
	if interfaceName == "" {
		return false, false
	}

	wireguard, err := c.GetWireGuard(interfaceName)
	if err != nil {
		return false, false
	}

	peers, err := c.GetWireGuardPeers(interfaceName)
	if err != nil || len(peers) == 0 {
		return wireguard.Running, false
	}

	for i := range peers {
		if peers[i].EndpointAddress == "" {
			continue
		}
		pingReply, err := c.PingPeerEndpoint(interfaceName, peers[i].EndpointAddress)
		if err == nil && pingReply {
			return wireguard.Running, true
		}
	}

	return wireguard.Running, false
}

func parseOvpnServerInfo(result map[string]string) *OvpnServerInfo {
	port, _ := strconv.Atoi(result["port"])
	keepAliveTimeout, _ := strconv.Atoi(result["keepalive-timeout"])

	// Handle old RouterOS versions that only support single OpenVPN server
	id := result[".id"]
	if id == "" {
		id = "*1" // RouterOS convention for single items
	}

	name := result["name"]
	if name == "" {
		name = "ovpn/server1" // Default name for single server in old format
	}

	// Determine disabled status: new format uses "disabled", old format uses "enabled"
	var disabled bool
	if disabledStr, ok := result["disabled"]; ok && disabledStr != "" {
		disabled = disabledStr == "true"
	} else if enabledStr, ok := result["enabled"]; ok && enabledStr != "" {
		// Old format: "enabled" field, so disabled = !enabled
		disabled = enabledStr != "true"
	}

	// Protocol defaults to "tcp" if not specified
	protocol := result["protocol"]
	if protocol == "" {
		protocol = "tcp"
	}

	return &OvpnServerInfo{
		ID:                id,
		Name:              name,
		Disabled:          disabled,
		Mode:              result["mode"],
		UserAuthMethod:    result["user-auth-method"],
		CertFile:          result["certificate"],
		KeyFile:           result["key"],
		ProtocolVersion:   protocol,
		Port:              port,
		CipherName:        result["cipher"],
		AuthHashAlgorithm: result["auth"],
		RequireClientCert: result["require-client-certificate"] == "true",
		RequireEncryption: result["require-encryption"] == "true",
		KeepAliveTimeout:  keepAliveTimeout,
		DefaultGateway:    result["default-gateway"] == "true",
		MacAddress:        result["mac-address"],
		DefaultProfile:    result["default-profile"],
		Comment:           result["comment"],
	}
}

// AddVpnProfile creates a new PPP profile for VPN servers.
func (c *Client) AddVpnProfile(name, localAddress, ipPool string) (string, error) {
	args := []string{
		"=name=" + name,
		"=local-address=" + localAddress,
		"=remote-address=" + ipPool,
	}

	id, err := c.Add("/ppp/profile", args...)
	if err != nil {
		return "", fmt.Errorf("failed to add VPN profile: %w", err)
	}

	return id, nil
}

// AddVpnSecret creates a new PPP secret (username/password) for a VPN profile.
func (c *Client) AddVpnSecret(username, password, profileName, service string) (string, error) {
	args := []string{
		"=name=" + username,
		"=password=" + password,
		"=profile=" + profileName,
		"=service=" + service,
	}

	id, err := c.Add("/ppp/secret", args...)
	if err != nil {
		return "", fmt.Errorf("failed to add VPN secret: %w", err)
	}

	return id, nil
}

func parseWireGuardInfo(result map[string]string) *WireGuardInfo {
	mtu, _ := strconv.Atoi(result["mtu"])
	listenPort, _ := strconv.Atoi(result["listen-port"])

	return &WireGuardInfo{
		ID:         result[".id"],
		Name:       result["name"],
		Running:    result["running"] == "true",
		Disabled:   result["disabled"] == "true",
		MTU:        mtu,
		MacAddress: result["mac-address"],
		PublicKey:  result["public-key"],
		PrivateKey: result["private-key"],
		ListenPort: listenPort,
		Comment:    result["comment"],
	}
}

// ExportOvpnClientConfiguration exports OpenVPN client configuration using RouterOS command.
func (c *Client) ExportOvpnClientConfiguration(serverName, serverAddress, caCertName, clientCertName string) (string, error) {
	args := []string{
		"=server=" + serverName,
		"=server-address=" + serverAddress,
		"=ca-certificate=" + fmt.Sprintf("%s.crt", caCertName),
		"=client-certificate=" + fmt.Sprintf("%s.crt", clientCertName),
		"=client-cert-key=" + fmt.Sprintf("%s.key", clientCertName),
	}

	reply, err := c.Execute("/interface/ovpn-server/server/export-client-configuration", args...)
	if err != nil {
		return "", fmt.Errorf("failed to export client configuration: %w", err)
	}

	if reply == nil || len(reply.Re) == 0 {
		return "", fmt.Errorf("export returned empty response")
	}

	// Extract filename from progress message using regex
	// Response format: "ovpn client configuration 'filename.ovpn' file exported"
	var fileName string
	for _, sentence := range reply.Re {
		if progressMsg, ok := sentence.Map["progress"]; ok && progressMsg != "" {
			// Use regex to extract filename from progress message
			re := regexp.MustCompile(`'([^']+\.ovpn)'`)
			matches := re.FindStringSubmatch(progressMsg)
			if len(matches) > 1 {
				fileName = matches[1]
				break
			}
		}
	}

	if fileName == "" {
		return "", fmt.Errorf("failed to extract filename from export response")
	}

	config, err := c.GetFileContents(fileName, 0)
	if err != nil {
		return "", fmt.Errorf("failed to read exported configuration: %w", err)
	}

	return config, nil
}
