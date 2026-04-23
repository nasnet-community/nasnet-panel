package routeros //nolint:misspell // intentional package name

import (
	"fmt"
	"strings"
)

// DNSInfo represents DNS configuration information.
type DNSInfo struct {
	Servers        []string `json:"servers"`
	DynamicServers []string `json:"dynamicServers"`
	DOHServer      string   `json:"dohServer"`
}

// DNSUpdateConfig represents DNS configuration to update.
type DNSUpdateConfig struct {
	Servers   *string
	DOHServer *string
}

// GetDNSInfo retrieves DNS configuration from RouterOS.
func (c *Client) GetDNSInfo() (*DNSInfo, error) {
	result, err := c.GetFirst("/ip/dns")
	if err != nil {
		return nil, fmt.Errorf("failed to get DNS info: %w", err)
	}

	servers := parseStringList(result["servers"])
	dynamicServers := parseStringList(result["dynamic-servers"])
	dohServer := result["use-doh-server"]

	return &DNSInfo{
		Servers:        servers,
		DynamicServers: dynamicServers,
		DOHServer:      dohServer,
	}, nil
}

// UpdateDNSConfig updates DNS configuration on RouterOS.
func (c *Client) UpdateDNSConfig(config DNSUpdateConfig) error {
	args := []string{}

	if config.Servers != nil {
		args = append(args, "=servers="+*config.Servers)
	}

	if config.DOHServer != nil {
		args = append(args, "=use-doh-server="+*config.DOHServer, "=verify-doh-cert=no", "=allow-remote-requests=yes")
	}

	if len(args) == 0 {
		return fmt.Errorf("no configuration parameters provided")
	}

	_, err := c.Set("/ip/dns", args...)
	if err != nil {
		return fmt.Errorf("failed to update DNS configuration on RouterOS: %w", err)
	}

	return nil
}

func parseStringList(value string) []string {
	if value == "" {
		return []string{}
	}

	var items []string
	for _, item := range strings.Split(value, ",") {
		item = strings.TrimSpace(item)
		if item != "" {
			items = append(items, item)
		}
	}
	return items
}
