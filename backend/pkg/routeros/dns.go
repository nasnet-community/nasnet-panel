package routeros

import (
	"fmt"
	"strconv"
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

// AddDNSAdListConfig represents every field that can be set when creating a
// new /ip/dns/adlist entry. An adlist is either URL-based (URL) or backed by
// a locally stored file (File); exactly one of them should be supplied.
type AddDNSAdListConfig struct {
	URL       string
	File      string
	SSLVerify *bool
	Disabled  bool
	Comment   string
}

// DNSAdList represents an /ip/dns/adlist entry.
type DNSAdList struct {
	ID         string `json:"id"`
	URL        string `json:"url"`
	File       string `json:"file"`
	SSLVerify  bool   `json:"sslVerify"`
	MatchCount int    `json:"matchCount"`
	NameCount  int    `json:"nameCount"`
	Disabled   bool   `json:"disabled"`
	Comment    string `json:"comment"`
}

// DNSAdListUpdateConfig represents every field that can be changed on an
// existing /ip/dns/adlist entry via UpdateDNSAdList. Only non-nil fields are
// applied; everything else on the entry is left as it was.
type DNSAdListUpdateConfig struct {
	URL       *string
	File      *string
	SSLVerify *bool
	Disabled  *bool
	Comment   *string
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

// AddDNSAdList creates a new /ip/dns/adlist entry and returns its RouterOS
// .id.
func (c *Client) AddDNSAdList(config AddDNSAdListConfig) (string, error) {
	if config.URL == "" && config.File == "" {
		return "", fmt.Errorf("either URL or File is required")
	}

	args := []string{}

	if config.URL != "" {
		args = append(args, "=url="+config.URL)
	}
	if config.File != "" {
		args = append(args, "=file="+config.File)
	}
	if config.SSLVerify != nil {
		if *config.SSLVerify {
			args = append(args, "=ssl-verify=yes")
		} else {
			args = append(args, "=ssl-verify=no")
		}
	}
	if config.Disabled {
		args = append(args, "=disabled=yes")
	} else {
		args = append(args, "=disabled=no")
	}
	if config.Comment != "" {
		args = append(args, "=comment="+config.Comment)
	}

	id, err := c.Add("/ip/dns/adlist", args...)
	if err != nil {
		return "", fmt.Errorf("failed to add DNS adlist entry: %w", err)
	}

	return id, nil
}

// ListDNSAdLists retrieves every /ip/dns/adlist entry from RouterOS.
func (c *Client) ListDNSAdLists() ([]DNSAdList, error) {
	results, err := c.GetAll("/ip/dns/adlist")
	if err != nil {
		return nil, fmt.Errorf("failed to list DNS adlist entries: %w", err)
	}

	adLists := make([]DNSAdList, 0, len(results))
	for _, result := range results {
		matchCount, _ := strconv.Atoi(result["match-count"])
		nameCount, _ := strconv.Atoi(result["name-count"])

		adLists = append(adLists, DNSAdList{
			ID:         result[".id"],
			URL:        result["url"],
			File:       result["file"],
			SSLVerify:  parseRouterOSBool(result["ssl-verify"]),
			MatchCount: matchCount,
			NameCount:  nameCount,
			Disabled:   parseRouterOSBool(result["disabled"]),
			Comment:    result["comment"],
		})
	}

	return adLists, nil
}

// UpdateDNSAdList updates the /ip/dns/adlist entry identified by id (its
// RouterOS .id) with the non-nil fields of config.
func (c *Client) UpdateDNSAdList(id string, config DNSAdListUpdateConfig) error {
	if id == "" {
		return fmt.Errorf("DNS adlist ID is required")
	}

	args := []string{"=.id=" + id}

	if config.URL != nil {
		args = append(args, "=url="+*config.URL)
	}
	if config.File != nil {
		args = append(args, "=file="+*config.File)
	}
	if config.SSLVerify != nil {
		if *config.SSLVerify {
			args = append(args, "=ssl-verify=yes")
		} else {
			args = append(args, "=ssl-verify=no")
		}
	}
	if config.Disabled != nil {
		if *config.Disabled {
			args = append(args, "=disabled=yes")
		} else {
			args = append(args, "=disabled=no")
		}
	}
	if config.Comment != nil {
		args = append(args, "=comment="+*config.Comment)
	}

	if len(args) == 1 {
		return fmt.Errorf("no configuration parameters provided")
	}

	_, err := c.Set("/ip/dns/adlist", args...)
	if err != nil {
		return fmt.Errorf("failed to update DNS adlist entry %s: %w", id, err)
	}

	return nil
}

// RemoveDNSAdList deletes the /ip/dns/adlist entry identified by id (its
// RouterOS .id).
func (c *Client) RemoveDNSAdList(id string) error {
	if id == "" {
		return fmt.Errorf("DNS adlist ID is required")
	}

	_, err := c.Remove("/ip/dns/adlist", "=.id="+id)
	if err != nil {
		return fmt.Errorf("failed to remove DNS adlist entry %s: %w", id, err)
	}

	return nil
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
