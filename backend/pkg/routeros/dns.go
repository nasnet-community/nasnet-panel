package routeros

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
	Servers       *string
	DOHServer     *string
	VerifyDOHCert *bool
}

// DNSForwarder represents a named DNS forwarder from /ip/dns/forwarders,
// referenced by name from a matching /ip/dns/static forward-to entry.
type DNSForwarder struct {
	ID            string   `json:"id"`
	Name          string   `json:"name"`
	DNSServers    []string `json:"dnsServers"`
	DOHServers    []string `json:"dohServers"`
	VerifyDOHCert bool     `json:"verifyDohCert"`
	Comment       string   `json:"comment"`
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
		args = append(args, "=use-doh-server="+*config.DOHServer, "=allow-remote-requests=yes")
	}

	if config.VerifyDOHCert != nil {
		if *config.VerifyDOHCert {
			args = append(args, "=verify-doh-cert=yes")
		} else {
			args = append(args, "=verify-doh-cert=no")
		}
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

// ListDNSForwarders retrieves every named DNS forwarder from /ip/dns/forwarders.
func (c *Client) ListDNSForwarders() ([]DNSForwarder, error) {
	results, err := c.GetAll("/ip/dns/forwarders")
	if err != nil {
		return nil, fmt.Errorf("failed to list DNS forwarders: %w", err)
	}

	forwarders := make([]DNSForwarder, 0, len(results))
	for _, result := range results {
		forwarders = append(forwarders, DNSForwarder{
			ID:            result[".id"],
			Name:          result["name"],
			DNSServers:    parseStringList(result["dns-servers"]),
			DOHServers:    parseStringList(result["doh-servers"]),
			VerifyDOHCert: result["verify-doh-cert"] != "no",
			Comment:       result["comment"],
		})
	}

	return forwarders, nil
}

// SetDNSForwarderServers replaces the dns-servers value of the DNS forwarder
// identified by id (its RouterOS .id).
func (c *Client) SetDNSForwarderServers(id, dnsServers string) error {
	if id == "" {
		return fmt.Errorf("DNS forwarder ID is required")
	}

	_, err := c.Set("/ip/dns/forwarders", "=.id="+id, "=dns-servers="+dnsServers)
	if err != nil {
		return fmt.Errorf("failed to update DNS forwarder %s: %w", id, err)
	}

	return nil
}

// AddDNSForwarder creates a new /ip/dns/forwarders entry and returns its
// RouterOS .id, explicitly setting verify-doh-cert since RouterOS defaults it
// to yes if omitted.
func (c *Client) AddDNSForwarder(name, dnsServers string, verifyDOHCert bool) (string, error) {
	if name == "" {
		return "", fmt.Errorf("DNS forwarder name is required")
	}
	if dnsServers == "" {
		return "", fmt.Errorf("DNS forwarder dns-servers is required")
	}

	verifyStr := "no"
	if verifyDOHCert {
		verifyStr = "yes"
	}

	id, err := c.Add("/ip/dns/forwarders", "=name="+name, "=dns-servers="+dnsServers, "=verify-doh-cert="+verifyStr)
	if err != nil {
		return "", fmt.Errorf("failed to add DNS forwarder %s: %w", name, err)
	}

	return id, nil
}

// RemoveDNSForwarder deletes the /ip/dns/forwarders entry identified by id
// (its RouterOS .id).
func (c *Client) RemoveDNSForwarder(id string) error {
	if id == "" {
		return fmt.Errorf("DNS forwarder ID is required")
	}

	_, err := c.Remove("/ip/dns/forwarders", "=.id="+id)
	if err != nil {
		return fmt.Errorf("failed to remove DNS forwarder %s: %w", id, err)
	}

	return nil
}

// DNSForwarderFilter represents filter criteria for querying DNS forwarders.
// If all fields are empty/nil, every forwarder is returned. DNSServers and
// DOHServers match a forwarder whose corresponding list contains exactly the
// given value, not a substring or partial-list match, since RouterOS
// ?= filters compare the whole property value.
type DNSForwarderFilter struct {
	ID            string // Filter by item ID (RouterOS internal .id)
	Name          string // Filter by forwarder name
	DNSServers    string // Filter by exact dns-servers value (e.g. "1.1.1.1,8.8.8.8")
	DOHServers    string // Filter by exact doh-servers value
	VerifyDOHCert *bool  // Filter by verify-doh-cert (true/false, nil for any)
}

// FindDNSForwarders retrieves DNS forwarders matching the given filter criteria.
func (c *Client) FindDNSForwarders(filter DNSForwarderFilter) ([]DNSForwarder, error) {
	args := make([]string, 0)

	if filter.ID != "" {
		args = append(args, "?=.id="+filter.ID)
	}
	if filter.Name != "" {
		args = append(args, "?=name="+filter.Name)
	}
	if filter.DNSServers != "" {
		args = append(args, "?=dns-servers="+filter.DNSServers)
	}
	if filter.DOHServers != "" {
		args = append(args, "?=doh-servers="+filter.DOHServers)
	}
	if filter.VerifyDOHCert != nil {
		verifyStr := "no"
		if *filter.VerifyDOHCert {
			verifyStr = "yes"
		}
		args = append(args, "?=verify-doh-cert="+verifyStr)
	}

	results, err := c.GetAll("/ip/dns/forwarders", args...)
	if err != nil {
		return nil, fmt.Errorf("failed to find DNS forwarders: %w", err)
	}

	forwarders := make([]DNSForwarder, 0, len(results))
	for _, result := range results {
		forwarders = append(forwarders, DNSForwarder{
			ID:            result[".id"],
			Name:          result["name"],
			DNSServers:    parseStringList(result["dns-servers"]),
			DOHServers:    parseStringList(result["doh-servers"]),
			VerifyDOHCert: result["verify-doh-cert"] != "no",
			Comment:       result["comment"],
		})
	}

	return forwarders, nil
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
