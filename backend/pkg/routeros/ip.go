package routeros

import (
	"fmt"
	"strconv"
)

type IPAddressInfo struct {
	ID        string
	Address   string
	Interface string
	Network   string
	Broadcast string
	Disabled  bool
	Comment   string
}

type IPRouteInfo struct {
	ID          string
	DstAddress  string
	Gateway     string
	Distance    int
	Scope       string
	TargetScope string
	Disabled    bool
	Dynamic     bool
	Comment     string
}

type IPAddressConfig struct {
	Interface string
	Address   string // e.g., "192.168.1.10/24"
	Network   string
	Broadcast string
	Disabled  bool
	Comment   string
}

type IPRouteConfig struct {
	DstAddress  string
	Gateway     string
	Distance    int
	Scope       int
	TargetScope int
	Table       string
	Disabled    bool
	Comment     string
}

type DNSConfig struct {
	Servers              []string
	AllowRemoteRequests  bool
	CacheSize            int
	CacheMaxTTL          int
	CacheDnsTimeout      int
	MaxUdpPacketSize     int
	QueryServerTimeout   int
	QueryTotalTimeout    int
	TrustHostsFile       bool
	DynamicServersUseTcp bool
}

func (c *Client) ListIPAddresses() ([]IPAddressInfo, error) {
	results, err := c.GetAll("/ip/address")
	if err != nil {
		return nil, fmt.Errorf("failed to list IP addresses: %w", err)
	}

	addresses := make([]IPAddressInfo, 0)
	for _, result := range results {
		addresses = append(addresses, IPAddressInfo{
			ID:        result[".id"],
			Address:   result["address"],
			Interface: result["interface"],
			Network:   result["network"],
			Broadcast: result["broadcast"],
			Disabled:  result["disabled"] == "true",
			Comment:   result["comment"],
		})
	}

	return addresses, nil
}

func (c *Client) GetIPAddressesByInterface(ifName string) ([]IPAddressInfo, error) {
	results, err := c.GetAll("/ip/address", "interface="+ifName)
	if err != nil {
		return nil, fmt.Errorf("failed to get IP addresses for interface %s: %w", ifName, err)
	}

	addresses := make([]IPAddressInfo, 0)
	for _, result := range results {
		addresses = append(addresses, IPAddressInfo{
			ID:        result[".id"],
			Address:   result["address"],
			Interface: result["interface"],
			Network:   result["network"],
			Broadcast: result["broadcast"],
			Disabled:  result["disabled"] == "true",
			Comment:   result["comment"],
		})
	}

	return addresses, nil
}

func (c *Client) AddIPAddress(config IPAddressConfig) (string, error) {
	args := []string{
		"interface=" + config.Interface,
		"address=" + config.Address,
	}

	if config.Network != "" {
		args = append(args, "network="+config.Network)
	}
	if config.Broadcast != "" {
		args = append(args, "broadcast="+config.Broadcast)
	}
	if config.Disabled {
		args = append(args, "disabled=yes")
	}
	if config.Comment != "" {
		args = append(args, "comment="+config.Comment)
	}

	reply, err := c.Add("/ip/address", args...)
	if err != nil {
		return "", fmt.Errorf("failed to add IP address: %w", err)
	}

	if id := extractRetID(reply); id != "" {
		return id, nil
	}
	return "", fmt.Errorf("no ID returned")
}

func (c *Client) RemoveIPAddress(id string) error {
	_, err := c.Remove("/ip/address", "=.id="+id)
	if err != nil {
		return fmt.Errorf("failed to remove IP address: %w", err)
	}

	return nil
}

func (c *Client) ListIPRoutes() ([]IPRouteInfo, error) {
	results, err := c.GetAll("/ip/route")
	if err != nil {
		return nil, fmt.Errorf("failed to list IP routes: %w", err)
	}

	routes := make([]IPRouteInfo, 0)
	for _, result := range results {
		distance, _ := strconv.Atoi(result["distance"])
		routes = append(routes, IPRouteInfo{
			ID:          result[".id"],
			DstAddress:  result["dst-address"],
			Gateway:     result["gateway"],
			Distance:    distance,
			Scope:       result["scope"],
			TargetScope: result["target-scope"],
			Disabled:    result["disabled"] == "true",
			Dynamic:     result["dynamic"] == "true",
			Comment:     result["comment"],
		})
	}

	return routes, nil
}

func (c *Client) AddIPRoute(config IPRouteConfig) (string, error) {
	args := []string{
		"dst-address=" + config.DstAddress,
		"gateway=" + config.Gateway,
	}

	if config.Distance > 0 {
		args = append(args, "distance="+strconv.Itoa(config.Distance))
	}
	if config.Scope > 0 {
		args = append(args, "scope="+strconv.Itoa(config.Scope))
	}
	if config.TargetScope > 0 {
		args = append(args, "target-scope="+strconv.Itoa(config.TargetScope))
	}
	if config.Table != "" {
		args = append(args, "table="+config.Table)
	}
	if config.Disabled {
		args = append(args, "disabled=yes")
	}
	if config.Comment != "" {
		args = append(args, "comment="+config.Comment)
	}

	reply, err := c.Add("/ip/route", args...)
	if err != nil {
		return "", fmt.Errorf("failed to add IP route: %w", err)
	}

	if id := extractRetID(reply); id != "" {
		return id, nil
	}
	return "", fmt.Errorf("no ID returned")
}

func (c *Client) RemoveIPRoute(id string) error {
	_, err := c.Remove("/ip/route", "=.id="+id)
	if err != nil {
		return fmt.Errorf("failed to remove IP route: %w", err)
	}

	return nil
}

func (c *Client) GetDNSConfig() (*DNSConfig, error) {
	result, err := c.GetFirst("/ip/dns")
	if err != nil {
		return nil, fmt.Errorf("failed to get DNS config: %w", err)
	}

	cacheSize, _ := strconv.Atoi(result["cache-size"])
	cacheMaxTTL, _ := strconv.Atoi(result["cache-max-ttl"])
	cacheDnsTimeout, _ := strconv.Atoi(result["cache-dns-timeout"])
	maxUdpPacketSize, _ := strconv.Atoi(result["max-udp-packet-size"])
	queryServerTimeout, _ := strconv.Atoi(result["query-server-timeout"])
	queryTotalTimeout, _ := strconv.Atoi(result["query-total-timeout"])

	return &DNSConfig{
		Servers:              []string{result["servers"]},
		AllowRemoteRequests:  result["allow-remote-requests"] == "true",
		CacheSize:            cacheSize,
		CacheMaxTTL:          cacheMaxTTL,
		CacheDnsTimeout:      cacheDnsTimeout,
		MaxUdpPacketSize:     maxUdpPacketSize,
		QueryServerTimeout:   queryServerTimeout,
		QueryTotalTimeout:    queryTotalTimeout,
		TrustHostsFile:       result["use-doh-server"] == "true",
		DynamicServersUseTcp: result["dynamic-servers"] == "true",
	}, nil
}

func (c *Client) SetDNSConfig(config DNSConfig) error {
	args := []string{}

	if len(config.Servers) > 0 {
		args = append(args, "servers="+config.Servers[0])
	}
	if config.AllowRemoteRequests {
		args = append(args, "allow-remote-requests=yes")
	} else {
		args = append(args, "allow-remote-requests=no")
	}
	if config.CacheSize > 0 {
		args = append(args, "cache-size="+strconv.Itoa(config.CacheSize))
	}
	if config.CacheMaxTTL > 0 {
		args = append(args, "cache-max-ttl="+strconv.Itoa(config.CacheMaxTTL))
	}

	_, err := c.Set("/ip/dns", args...)
	if err != nil {
		return fmt.Errorf("failed to set DNS config: %w", err)
	}

	return nil
}
