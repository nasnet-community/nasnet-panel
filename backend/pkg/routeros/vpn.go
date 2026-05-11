//nolint:misspell // package name is intentional: routeros not routers
package routeros

import (
	"fmt"
	"net"
	"strconv"

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
	Comment          string
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
	Comment              string
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
	Comment                 string
}

// WireguardInfo represents a WireGuard interface configuration.
type WireguardInfo struct {
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
}

// L2TPSecret represents an L2TP user secret (username/password).
type L2TPSecret struct {
	Name     string
	Password string
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
	InterfaceName       string
	PeerName            string
	PublicKey           *string
	PrivateKey          *string
	EndpointAddress     string
	EndpointPort        int
	AllowedAddresses    []string
	PresharedKey        *string
	PersistentKeepalive *int
}

// WireGuardPeerInfo represents a WireGuard peer configuration.
type WireGuardPeerInfo struct {
	ID                  string
	Name                string
	InterfaceName       string
	PublicKey           string
	EndpointAddress     string
	EndpointPort        int
	AllowedAddresses    string
	LastHandshake       int64
	RxBytes             int64
	TxBytes             int64
	PersistentKeepalive int
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
	result, err := c.GetFirst("/interface", "?=.id="+nameOrID)
	if err != nil {
		// Try by name
		result, err = c.GetFirst("/interface", "?=name="+nameOrID)
		if err != nil {
			return nil, fmt.Errorf("failed to get VPN client %s: %w", nameOrID, err)
		}
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
			name = "ovpn-server1" // Default name for single server in old format
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
	result, err := c.GetFirst("/interface/ovpn-server/server", "?=.id="+idOrName)
	if err == nil {
		return parseOvpnServerInfo(result), nil
	}

	result, err = c.GetFirst("/interface/ovpn-server/server", "?=name="+idOrName)
	if err != nil {
		return nil, fmt.Errorf("failed to get OpenVPN server %s: %w", idOrName, err)
	}

	return parseOvpnServerInfo(result), nil
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
		Comment:          result["comment"],
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
		Comment:              result["comment"],
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
		Comment:                 result["comment"],
	}, nil
}

// ListWireguards returns all WireGuard interfaces.
func (c *Client) ListWireguards() ([]WireguardInfo, error) {
	results, err := c.GetAll("/interface/wireguard")
	if err != nil {
		return nil, fmt.Errorf("failed to list WireGuard interfaces: %w", err)
	}

	interfaces := make([]WireguardInfo, 0)
	for _, result := range results {
		mtu, _ := strconv.Atoi(result["mtu"])
		listenPort, _ := strconv.Atoi(result["listen-port"])

		interfaces = append(interfaces, WireguardInfo{
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

// GetWireguard returns a specific WireGuard interface by name or ID.
func (c *Client) GetWireguard(nameOrID string) (*WireguardInfo, error) {
	result, err := c.GetFirst("/interface/wireguard", "?=.id="+nameOrID)
	if err == nil {
		return parseWireguardInfo(result), nil
	}

	result, err = c.GetFirst("/interface/wireguard", "?=name="+nameOrID)
	if err != nil {
		return nil, fmt.Errorf("failed to get WireGuard interface %s: %w", nameOrID, err)
	}

	return parseWireguardInfo(result), nil
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
		})
	}

	return secrets, nil
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
func (c *Client) GetL2TPClientInfo(name string) (*L2TPClientInfo, error) {
	result, err := c.GetFirst("/interface/l2tp-client", "?=name="+name)
	if err != nil {
		return nil, fmt.Errorf("failed to get L2TP client %s: %w", name, err)
	}

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
func (c *Client) CreateWireGuardInterface(config WireGuardClientConfig) (*WireguardInfo, error) {
	// Append "-client" suffix to interface name
	interfaceName := config.Name + "-client"

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
	wireguard, err := c.GetWireguard(interfaceName)
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
		lastHandshake, _ := strconv.ParseInt(result["last-handshake"], 10, 64)
		rxBytes, _ := strconv.ParseInt(result["rx-bytes"], 10, 64)
		txBytes, _ := strconv.ParseInt(result["tx-bytes"], 10, 64)
		keepalive, _ := strconv.Atoi(result["persistent-keepalive"])

		peers = append(peers, WireGuardPeerInfo{
			ID:                  result[".id"],
			Name:                result["name"],
			InterfaceName:       result["interface"],
			PublicKey:           result["public-key"],
			EndpointAddress:     result["endpoint-address"],
			EndpointPort:        endpointPort,
			AllowedAddresses:    result["allowed-address"],
			LastHandshake:       lastHandshake,
			RxBytes:             rxBytes,
			TxBytes:             txBytes,
			PersistentKeepalive: keepalive,
		})
	}

	return peers, nil
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

// CheckWireGuardStatus checks the status of a WireGuard interface and its connectivity.
// Returns (running, peersConnected) tuple.
func (c *Client) CheckWireGuardStatus(interfaceName string) (running, peersConnected bool) {
	if interfaceName == "" {
		return false, false
	}

	wireguard, err := c.GetWireguard(interfaceName)
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
		name = "ovpn-server1" // Default name for single server in old format
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

func parseWireguardInfo(result map[string]string) *WireguardInfo {
	mtu, _ := strconv.Atoi(result["mtu"])
	listenPort, _ := strconv.Atoi(result["listen-port"])

	return &WireguardInfo{
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
