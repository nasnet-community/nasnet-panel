package routeros

import (
	"fmt"
)

type DHCPServerConfig struct {
	Name              string
	Interface         string
	PoolName          string
	LeaseTime         string
	Disabled          bool
	Authoritative     bool
	AddArp            bool
	ConflictDetection bool
	ServerAddress     string
	AlwaysBroadcast   bool
	Comment           string
}

// DHCPServerNetworkConfig represents a DHCP server network configuration.
type DHCPServerNetworkConfig struct {
	Address    string
	Gateway    string
	DNSServers string
	Comment    string
}

type DHCPLeaseInfo struct {
	ID           string
	Address      string
	MacAddress   string
	ClientID     string
	HostName     string
	ServerName   string
	Status       string
	ExpiresAfter string
	LastSeen     string
	BridgePort   string
	Comment      string
	Dynamic      bool
}

type DHCPClientInfo struct {
	ID           string
	Name         string
	Interface    string
	Status       string
	Address      string
	Gateway      string
	PrimaryDNS   string
	SecondaryDNS string
	UsePeerDNS   bool
	UsePeerNTP   bool
	ExpiresAfter string
	Disabled     bool
	Comment      string
}

func (c *Client) ListDHCPServers() ([]map[string]string, error) {
	results, err := c.GetAll("/ip/dhcp-server")
	if err != nil {
		return nil, fmt.Errorf("failed to list DHCP servers: %w", err)
	}

	return results, nil
}

func (c *Client) GetDHCPServer(name string) (map[string]string, error) {
	results, err := c.GetAll("/ip/dhcp-server", "?=.id="+name)
	if err != nil {
		return nil, fmt.Errorf("failed to get DHCP server %s: %w", name, err)
	}

	if len(results) == 0 {
		return nil, fmt.Errorf("DHCP server %s not found", name)
	}

	return results[0], nil
}

// GetPoolRanges retrieves IP ranges for a given pool name from RouterOS.
func (c *Client) GetPoolRanges(poolName string) ([]string, error) {
	if poolName == "" {
		return []string{}, nil
	}

	results, err := c.GetAll("/ip/pool", "?=name="+poolName)
	if err != nil {
		return nil, fmt.Errorf("failed to get pool ranges: %w", err)
	}

	if len(results) == 0 {
		return []string{}, nil
	}

	ranges := results[0]["ranges"]
	if ranges == "" {
		return []string{}, nil
	}

	return []string{ranges}, nil
}

func (c *Client) AddDHCPServer(config DHCPServerConfig) (string, error) {
	args := []string{
		"=name=" + config.Name,
		"=interface=" + config.Interface,
		"=address-pool=" + config.PoolName,
	}

	if config.LeaseTime != "" {
		args = append(args, "=lease-time="+config.LeaseTime)
	}
	if config.Disabled {
		args = append(args, "=disabled=yes")
	} else {
		args = append(args, "=disabled=no")
	}
	if config.Authoritative {
		args = append(args, "=authoritative=yes")
	} else {
		args = append(args, "=authoritative=no")
	}
	if config.AddArp {
		args = append(args, "=add-arp=yes")
	} else {
		args = append(args, "=add-arp=no")
	}
	if config.ConflictDetection {
		args = append(args, "=conflict-detection=yes")
	} else {
		args = append(args, "=conflict-detection=no")
	}
	if config.AlwaysBroadcast {
		args = append(args, "=always-broadcast=yes")
	}
	if config.ServerAddress != "" {
		args = append(args, "=server-address="+config.ServerAddress)
	}
	if config.Comment != "" {
		args = append(args, "=comment="+config.Comment)
	}

	id, err := c.Add("/ip/dhcp-server", args...)
	if err != nil {
		return "", fmt.Errorf("failed to add DHCP server: %w", err)
	}

	return id, nil
}

func (c *Client) RemoveDHCPServer(name string) error {
	_, err := c.Remove("/ip/dhcp-server", "=.id="+name)
	if err != nil {
		return fmt.Errorf("failed to remove DHCP server: %w", err)
	}

	return nil
}

// ListDHCPServerNetworks retrieves all DHCP server network configurations.
func (c *Client) ListDHCPServerNetworks() ([]map[string]string, error) {
	results, err := c.GetAll("/ip/dhcp-server/network")
	if err != nil {
		return nil, fmt.Errorf("failed to list DHCP server networks: %w", err)
	}

	return results, nil
}

// AddDHCPServerNetwork creates a new DHCP server network configuration.
func (c *Client) AddDHCPServerNetwork(config DHCPServerNetworkConfig) (string, error) {
	args := []string{
		"=address=" + config.Address,
	}

	if config.Gateway != "" {
		args = append(args, "=gateway="+config.Gateway)
	}
	if config.DNSServers != "" {
		args = append(args, "=dns-server="+config.DNSServers)
	}
	if config.Comment != "" {
		args = append(args, "=comment="+config.Comment)
	}

	id, err := c.Add("/ip/dhcp-server/network", args...)
	if err != nil {
		return "", fmt.Errorf("failed to add DHCP server network: %w", err)
	}

	return id, nil
}

func (c *Client) SetDHCPServer(name string, updates map[string]string) error {
	args := []string{"=.id=" + name}

	for key, value := range updates {
		args = append(args, key+"="+value)
	}

	_, err := c.Set("/ip/dhcp-server", args...)
	if err != nil {
		return fmt.Errorf("failed to update DHCP server: %w", err)
	}

	return nil
}

func (c *Client) ListDHCPPools() ([]map[string]string, error) {
	results, err := c.GetAll("/ip/pool")
	if err != nil {
		return nil, fmt.Errorf("failed to list DHCP pools: %w", err)
	}

	return results, nil
}

func (c *Client) ListDHCPLeases() ([]DHCPLeaseInfo, error) {
	results, err := c.GetAll("/ip/dhcp-server/lease")
	if err != nil {
		return nil, fmt.Errorf("failed to list DHCP leases: %w", err)
	}

	leases := make([]DHCPLeaseInfo, 0)
	for _, result := range results {
		leases = append(leases, DHCPLeaseInfo{
			ID:           result[".id"],
			Address:      result["address"],
			MacAddress:   result["mac-address"],
			ClientID:     result["client-id"],
			HostName:     result["host-name"],
			ServerName:   result["server"],
			Status:       result["status"],
			ExpiresAfter: result["expires-after"],
			LastSeen:     result["last-seen"],
			Comment:      result["comment"],
			Dynamic:      result["dynamic"] == "true",
		})
	}

	return leases, nil
}

func (c *Client) GetDHCPLeasesByServer(serverName string) ([]DHCPLeaseInfo, error) {
	results, err := c.GetAll("/ip/dhcp-server/lease", "server="+serverName)
	if err != nil {
		return nil, fmt.Errorf("failed to get DHCP leases for server %s: %w", serverName, err)
	}

	leases := make([]DHCPLeaseInfo, 0)
	for _, result := range results {
		leases = append(leases, DHCPLeaseInfo{
			ID:           result[".id"],
			Address:      result["address"],
			MacAddress:   result["mac-address"],
			ClientID:     result["client-id"],
			HostName:     result["host-name"],
			ServerName:   result["server"],
			Status:       result["status"],
			ExpiresAfter: result["expires-after"],
			LastSeen:     result["last-seen"],
			Comment:      result["comment"],
			Dynamic:      result["dynamic"] == "true",
		})
	}

	return leases, nil
}

func (c *Client) RemoveDHCPLease(id string) error {
	_, err := c.Remove("/ip/dhcp-server/lease", "=.id="+id)
	if err != nil {
		return fmt.Errorf("failed to remove DHCP lease: %w", err)
	}

	return nil
}

// FindDHCPLeaseByMAC finds a DHCP lease by its MAC address.
func (c *Client) FindDHCPLeaseByMAC(macAddress string) (*DHCPLeaseInfo, error) {
	results, err := c.GetAll("/ip/dhcp-server/lease", "?=mac-address="+macAddress)
	if err != nil {
		return nil, fmt.Errorf("failed to find DHCP lease: %w", err)
	}

	if len(results) == 0 {
		return nil, nil
	}

	result := results[0]
	return &DHCPLeaseInfo{
		ID:           result[".id"],
		Address:      result["address"],
		MacAddress:   result["mac-address"],
		ClientID:     result["client-id"],
		HostName:     result["host-name"],
		ServerName:   result["server"],
		Status:       result["status"],
		ExpiresAfter: result["expires-after"],
		LastSeen:     result["last-seen"],
		Comment:      result["comment"],
		Dynamic:      result["dynamic"] == "true",
	}, nil
}

func (c *Client) ListDHCPClients() ([]DHCPClientInfo, error) {
	results, err := c.GetAll("/ip/dhcp-client")
	if err != nil {
		return nil, fmt.Errorf("failed to list DHCP clients: %w", err)
	}

	clients := make([]DHCPClientInfo, 0)
	for _, result := range results {
		clients = append(clients, DHCPClientInfo{
			ID:           result[".id"],
			Interface:    result["interface"],
			Status:       result["status"],
			Address:      result["address"],
			Gateway:      result["gateway"],
			PrimaryDNS:   result["primary-dns"],
			SecondaryDNS: result["secondary-dns"],
			Name:         result["name"],
			UsePeerDNS:   result["use-peer-dns"] == "true",
			UsePeerNTP:   result["use-peer-ntp"] == "true",
			ExpiresAfter: result["expires-after"],
			Disabled:     result["disabled"] == "true",
			Comment:      result["comment"],
		})
	}

	return clients, nil
}

// ConfigureDHCPClient ensures a DHCP client exists for the given interface and
// applies the canonical "WAN client" settings:
//   - use-peer-dns=yes
//   - use-peer-ntp=yes
//   - add-default-route=no
//   - disabled=no (enabled)
//
// If a client already exists for the interface it is updated in place; otherwise
// a new one is created. Returns the resolved interface name and the DHCP client
// `.id`.
func (c *Client) ConfigureDHCPClient(nameOrID string) (interfaceName, clientID string, err error) {
	interfaceName, err = c.resolveInterfaceName(nameOrID)
	if err != nil {
		return "", "", err
	}

	existing, err := c.GetFirst("/ip/dhcp-client", "?interface="+interfaceName)
	if err == nil && existing[".id"] != "" {
		clientID = existing[".id"]
		_, err = c.Set("/ip/dhcp-client",
			"=.id="+clientID,
			"=use-peer-dns=no",
			"=use-peer-ntp=no",
			"=add-default-route=no",
			"=disabled=no",
		)
		if err != nil {
			return interfaceName, "", fmt.Errorf("failed to update DHCP client for %s: %w", interfaceName, err)
		}
		return interfaceName, clientID, nil
	}

	clientID, err = c.Add("/ip/dhcp-client",
		"=interface="+interfaceName,
		"=use-peer-dns=no",
		"=use-peer-ntp=no",
		"=add-default-route=no",
		"=disabled=no",
	)
	if err != nil {
		return interfaceName, "", fmt.Errorf("failed to add DHCP client for %s: %w", interfaceName, err)
	}

	return interfaceName, clientID, nil
}

// resolveInterfaceName accepts either an interface .id or a name and returns
// the canonical name as known to RouterOS.
func (c *Client) resolveInterfaceName(nameOrID string) (string, error) {
	if nameOrID == "" {
		return "", fmt.Errorf("interface name or ID is required")
	}

	result, err := c.GetFirst("/interface", "?=.id="+nameOrID)
	if err == nil && result["name"] != "" {
		return result["name"], nil
	}

	result, err = c.GetFirst("/interface", "?name="+nameOrID)
	if err != nil || result["name"] == "" {
		return "", fmt.Errorf("interface %s not found", nameOrID)
	}

	return result["name"], nil
}

func (c *Client) AddDHCPClient(interfaceName string, useDHCPv6 bool, comment string) (string, error) {
	args := []string{
		"interface=" + interfaceName,
	}

	if useDHCPv6 {
		args = append(args, "dhcpv6=yes")
	}
	if comment != "" {
		args = append(args, "comment="+comment)
	}

	id, err := c.Add("/ip/dhcp-client", args...)
	if err != nil {
		return "", fmt.Errorf("failed to add DHCP client: %w", err)
	}

	return id, nil
}

func (c *Client) RemoveDHCPClient(id string) error {
	_, err := c.Remove("/ip/dhcp-client", "=.id="+id)
	if err != nil {
		return fmt.Errorf("failed to remove DHCP client: %w", err)
	}

	return nil
}

func (c *Client) ReleaseDHCPLease(id string) error {
	_, err := c.Execute("/ip/dhcp-server/lease/release", "=.id="+id)
	if err != nil {
		return fmt.Errorf("failed to release DHCP lease: %w", err)
	}

	return nil
}

func (c *Client) MakeDHCPLeaseStatic(id string) error {
	_, err := c.Execute("/ip/dhcp-server/lease/make-static", "=.id="+id)
	if err != nil {
		return fmt.Errorf("failed to make DHCP lease static: %w", err)
	}

	return nil
}

// PopulateBridgePorts adds bridge port information to DHCP leases.
// It fetches all bridge hosts once and matches them in-memory to minimize API queries.
func (c *Client) PopulateBridgePorts(leases []DHCPLeaseInfo) {
	hosts, err := c.GetAllBridgeHosts()
	if err != nil {
		return
	}

	// Create a map for O(1) lookup
	hostMap := make(map[string]string)
	for _, host := range hosts {
		hostMap[host.MacAddress] = host.OnInterface
	}

	// Match leases to bridge hosts
	for i := range leases {
		if leases[i].MacAddress != "" {
			if port, exists := hostMap[leases[i].MacAddress]; exists {
				leases[i].BridgePort = port
			}
		}
	}
}
