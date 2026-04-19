package routeros

import (
	"fmt"
)

type DHCPServerConfig struct {
	Name          string
	Interface     string
	Address       string
	Network       string
	Gateway       string
	DNSServers    []string
	PoolName      string
	LeaseTime     string
	Disabled      bool
	Authoritative bool
	Comment       string
}

type DHCPPoolConfig struct {
	Name    string
	Ranges  string // e.g., "192.168.1.100-192.168.1.200"
	Comment string
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
	Comment      string
}

type DHCPClientInfo struct {
	ID           string
	Interface    string
	Status       string
	Address      string
	Gateway      string
	PrimaryDNS   string
	SecondaryDNS string
	DHCPV6       bool
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

func (c *Client) AddDHCPServer(config DHCPServerConfig) (string, error) {
	args := []string{
		"name=" + config.Name,
		"interface=" + config.Interface,
		"address-pool=" + config.PoolName,
	}

	if config.Gateway != "" {
		args = append(args, "gateway="+config.Gateway)
	}
	if len(config.DNSServers) > 0 {
		dnsServers := ""
		for i, dns := range config.DNSServers {
			if i > 0 {
				dnsServers += ","
			}
			dnsServers += dns
		}
		args = append(args, "dns-servers="+dnsServers)
	}
	if config.LeaseTime != "" {
		args = append(args, "lease-time="+config.LeaseTime)
	}
	if config.Disabled {
		args = append(args, "disabled=yes")
	}
	if config.Authoritative {
		args = append(args, "authoritative=yes")
	}
	if config.Comment != "" {
		args = append(args, "comment="+config.Comment)
	}

	reply, err := c.Add("/ip/dhcp-server", args...)
	if err != nil {
		return "", fmt.Errorf("failed to add DHCP server: %w", err)
	}

	if id := extractRetID(reply); id != "" {
		return id, nil
	}
	return "", fmt.Errorf("no ID returned")
}

func (c *Client) RemoveDHCPServer(name string) error {
	_, err := c.Remove("/ip/dhcp-server", "=.id="+name)
	if err != nil {
		return fmt.Errorf("failed to remove DHCP server: %w", err)
	}

	return nil
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

func (c *Client) AddDHCPPool(config DHCPPoolConfig) (string, error) {
	args := []string{
		"name=" + config.Name,
		"ranges=" + config.Ranges,
	}

	if config.Comment != "" {
		args = append(args, "comment="+config.Comment)
	}

	reply, err := c.Add("/ip/pool", args...)
	if err != nil {
		return "", fmt.Errorf("failed to add DHCP pool: %w", err)
	}

	if id := extractRetID(reply); id != "" {
		return id, nil
	}
	return "", fmt.Errorf("no ID returned")
}

func (c *Client) RemoveDHCPPool(name string) error {
	_, err := c.Remove("/ip/pool", "=.id="+name)
	if err != nil {
		return fmt.Errorf("failed to remove DHCP pool: %w", err)
	}

	return nil
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
			DHCPV6:       result["dhcp"] == "true",
			Comment:      result["comment"],
		})
	}

	return clients, nil
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

	reply, err := c.Add("/ip/dhcp-client", args...)
	if err != nil {
		return "", fmt.Errorf("failed to add DHCP client: %w", err)
	}

	if id := extractRetID(reply); id != "" {
		return id, nil
	}
	return "", fmt.Errorf("no ID returned")
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
