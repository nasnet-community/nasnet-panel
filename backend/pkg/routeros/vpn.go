//nolint:misspell // package name is intentional: routeros not routers
package routeros

import (
	"fmt"
	"strconv"
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

// IsVPNInterfaceType checks if a given type is a VPN interface type.
func IsVPNInterfaceType(interfaceType string) bool {
	return vpnInterfaceTypes[interfaceType]
}

// ListVPNClients returns all VPN client interfaces.
func (c *Client) ListVPNClients() ([]VPNClientInfo, error) {
	results, err := c.GetAll("/interface")
	if err != nil {
		return nil, fmt.Errorf("failed to list interfaces: %w", err)
	}

	vpnClients := make([]VPNClientInfo, 0)
	for _, result := range results {
		interfaceType := result["type"]

		// Filter by VPN interface types
		if !IsVPNInterfaceType(interfaceType) {
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
			LastLinkUp:   result["last-link-up-time"],
			LastLinkDown: result["last-link-down-time"],
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
		LastLinkUp:   result["last-link-up-time"],
		LastLinkDown: result["last-link-down-time"],
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
	Comment           string
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

		servers = append(servers, OvpnServerInfo{
			ID:                result[".id"],
			Name:              result["name"],
			Disabled:          result["disabled"] == "true",
			Mode:              result["mode"],
			UserAuthMethod:    result["user-auth-method"],
			CertFile:          result["certificate"],
			KeyFile:           result["key"],
			ProtocolVersion:   result["protocol"],
			Port:              port,
			CipherName:        result["cipher"],
			AuthHashAlgorithm: result["auth"],
			RequireClientCert: result["require-client-certificate"] == "true",
			RequireEncryption: result["require-encryption"] == "true",
			KeepAliveTimeout:  keepAliveTimeout,
			DefaultGateway:    result["default-gateway"] == "true",
			MacAddress:        result["mac-address"],
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

func parseOvpnServerInfo(result map[string]string) *OvpnServerInfo {
	port, _ := strconv.Atoi(result["port"])
	keepAliveTimeout, _ := strconv.Atoi(result["keepalive-timeout"])

	return &OvpnServerInfo{
		ID:                result[".id"],
		Name:              result["name"],
		Disabled:          result["disabled"] == "true",
		Mode:              result["mode"],
		UserAuthMethod:    result["user-auth-method"],
		CertFile:          result["certificate"],
		KeyFile:           result["key"],
		ProtocolVersion:   result["protocol"],
		Port:              port,
		CipherName:        result["cipher"],
		AuthHashAlgorithm: result["auth"],
		RequireClientCert: result["require-client-certificate"] == "true",
		RequireEncryption: result["require-encryption"] == "true",
		KeepAliveTimeout:  keepAliveTimeout,
		DefaultGateway:    result["default-gateway"] == "true",
		MacAddress:        result["mac-address"],
		Comment:           result["comment"],
	}
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
	UseIPsec             bool
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
		UseIPsec:             result["use-ipsec"] == "yes",
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
