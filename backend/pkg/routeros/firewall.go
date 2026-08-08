package routeros

import (
	"fmt"
	"net"
)

// FirewallFilterRule represents a firewall filter rule configuration.
type FirewallFilterRule struct {
	ID       string
	Action   string
	Chain    string
	Protocol string
	SrcAddr  string
	DstAddr  string
	SrcPort  string
	DstPort  string
	InIface  string
	OutIface string
	Disabled bool
	Log      bool
	Comment  string
	Bytes    string
	Packets  string
}

type NATRule struct {
	ID          string
	Action      string
	Chain       string
	Protocol    string
	SrcAddr     string
	DstAddr     string
	SrcPort     string
	DstPort     string
	ToAddresses string
	ToPorts     string
	InIface     string
	OutIface    string
	Disabled    bool
	Log         bool
	Comment     string
}

type MangleRule struct {
	ID          string
	Action      string
	Chain       string
	Protocol    string
	SrcAddr     string
	DstAddr     string
	SrcPort     string
	DstPort     string
	PassThrough bool
	InIface     string
	OutIface    string
	Disabled    bool
	Log         bool
	Comment     string
}

type FirewallRuleConfig struct {
	Chain     string
	Action    string
	Protocol  string
	SrcAddr   string
	DstAddr   string
	SrcPort   string
	DstPort   string
	InIface   string
	OutIface  string
	Disabled  bool
	Log       bool
	LogPrefix string
	Comment   string
}

type NATRuleConfig struct {
	Chain       string
	Action      string
	Protocol    string
	SrcAddr     string
	DstAddr     string
	SrcPort     string
	DstPort     string
	ToAddresses string
	ToPorts     string
	InIface     string
	OutIface    string
	Disabled    bool
	Log         bool
	Comment     string
}

type MangleRuleConfig struct {
	Chain       string
	Action      string
	Protocol    string
	SrcAddr     string
	DstAddr     string
	SrcPort     string
	DstPort     string
	PassThrough bool
	InIface     string
	OutIface    string
	Disabled    bool
	Log         bool
	Comment     string
}

// FirewallAddressListItem represents an entry in a firewall address list.
type FirewallAddressListItem struct {
	ID           string
	List         string
	Address      string
	Disabled     bool
	Comment      string
	CreationTime string // raw RouterOS creation-time value; format varies by version
}

// FirewallAddressListFilter represents filter criteria for querying firewall address list items.
type FirewallAddressListFilter struct {
	ID       string // Filter by item ID (RouterOS internal ID)
	ListName string // Filter by address list name (e.g., "blacklist")
	Address  string // Filter by specific address (e.g., "192.168.1.0/24")
	Comment  string // Filter by comment text
	Disabled *bool  // Filter by disabled status (true/false, nil for any)
}

// ListFirewallFilterRules retrieves all firewall filter rules.
func (c *Client) ListFirewallFilterRules() ([]FirewallFilterRule, error) {
	results, err := c.GetAll("/ip/firewall/filter")
	if err != nil {
		return nil, fmt.Errorf("failed to list firewall rules: %w", err)
	}

	rules := make([]FirewallFilterRule, 0)
	for _, result := range results {
		rules = append(rules, FirewallFilterRule{
			ID:       result[".id"],
			Action:   result["action"],
			Chain:    result["chain"],
			Protocol: result["protocol"],
			SrcAddr:  result["src-address"],
			DstAddr:  result["dst-address"],
			SrcPort:  result["src-port"],
			DstPort:  result["dst-port"],
			InIface:  result["in-interface"],
			OutIface: result["out-interface"],
			Disabled: result["disabled"] == "true",
			Log:      result["log"] == "true",
			Comment:  result["comment"],
			Bytes:    result["bytes"],
			Packets:  result["packets"],
		})
	}

	return rules, nil
}

// GetFirewallRulesByChain retrieves firewall filter rules for a specific chain.
func (c *Client) GetFirewallRulesByChain(chain string) ([]FirewallFilterRule, error) {
	results, err := c.GetAll("/ip/firewall/filter", "chain="+chain)
	if err != nil {
		return nil, fmt.Errorf("failed to get firewall rules for chain %s: %w", chain, err)
	}

	rules := make([]FirewallFilterRule, 0)
	for _, result := range results {
		rules = append(rules, FirewallFilterRule{
			ID:       result[".id"],
			Action:   result["action"],
			Chain:    result["chain"],
			Protocol: result["protocol"],
			SrcAddr:  result["src-address"],
			DstAddr:  result["dst-address"],
			SrcPort:  result["src-port"],
			DstPort:  result["dst-port"],
			InIface:  result["in-interface"],
			OutIface: result["out-interface"],
			Disabled: result["disabled"] == "true",
			Log:      result["log"] == "true",
			Comment:  result["comment"],
			Bytes:    result["bytes"],
			Packets:  result["packets"],
		})
	}

	return rules, nil
}

func (c *Client) AddFirewallRule(config FirewallRuleConfig) (string, error) {
	args := []string{
		"=chain=" + config.Chain,
		"=action=" + config.Action,
	}

	if config.Protocol != "" {
		args = append(args, "=protocol="+config.Protocol)
	}
	if config.SrcAddr != "" {
		args = append(args, "=src-address="+config.SrcAddr)
	}
	if config.DstAddr != "" {
		args = append(args, "=dst-address="+config.DstAddr)
	}
	if config.SrcPort != "" {
		args = append(args, "=src-port="+config.SrcPort)
	}
	if config.DstPort != "" {
		args = append(args, "=dst-port="+config.DstPort)
	}
	if config.InIface != "" {
		args = append(args, "=in-interface="+config.InIface)
	}
	if config.OutIface != "" {
		args = append(args, "=out-interface="+config.OutIface)
	}
	if config.Disabled {
		args = append(args, "=disabled=yes")
	}
	if config.Log {
		args = append(args, "=log=yes")
	}
	if config.LogPrefix != "" {
		args = append(args, "=log-prefix="+config.LogPrefix)
	}
	if config.Comment != "" {
		args = append(args, "=comment="+config.Comment)
	}

	id, err := c.Add("/ip/firewall/filter", args...)
	if err != nil {
		return "", fmt.Errorf("failed to add firewall rule: %w", err)
	}

	return id, nil
}

func (c *Client) RemoveFirewallRule(id string) error {
	_, err := c.Remove("/ip/firewall/filter", "=.id="+id)
	if err != nil {
		return fmt.Errorf("failed to remove firewall rule: %w", err)
	}

	return nil
}

func (c *Client) ListNATRules() ([]NATRule, error) {
	results, err := c.GetAll("/ip/firewall/nat")
	if err != nil {
		return nil, fmt.Errorf("failed to list NAT rules: %w", err)
	}

	rules := make([]NATRule, 0)
	for _, result := range results {
		rules = append(rules, NATRule{
			ID:          result[".id"],
			Action:      result["action"],
			Chain:       result["chain"],
			Protocol:    result["protocol"],
			SrcAddr:     result["src-address"],
			DstAddr:     result["dst-address"],
			SrcPort:     result["src-port"],
			DstPort:     result["dst-port"],
			ToAddresses: result["to-addresses"],
			ToPorts:     result["to-ports"],
			InIface:     result["in-interface"],
			OutIface:    result["out-interface"],
			Disabled:    result["disabled"] == "true",
			Log:         result["log"] == "true",
			Comment:     result["comment"],
		})
	}

	return rules, nil
}

func (c *Client) AddNATRule(config NATRuleConfig) (string, error) {
	args := []string{
		"=chain=" + config.Chain,
		"=action=" + config.Action,
	}

	if config.Protocol != "" {
		args = append(args, "=protocol="+config.Protocol)
	}
	if config.SrcAddr != "" {
		args = append(args, "=src-address="+config.SrcAddr)
	}
	if config.DstAddr != "" {
		args = append(args, "=dst-address="+config.DstAddr)
	}
	if config.SrcPort != "" {
		args = append(args, "=src-port="+config.SrcPort)
	}
	if config.DstPort != "" {
		args = append(args, "=dst-port="+config.DstPort)
	}
	if config.ToAddresses != "" {
		args = append(args, "=to-addresses="+config.ToAddresses)
	}
	if config.ToPorts != "" {
		args = append(args, "=to-ports="+config.ToPorts)
	}
	if config.InIface != "" {
		args = append(args, "=in-interface="+config.InIface)
	}
	if config.OutIface != "" {
		args = append(args, "=out-interface="+config.OutIface)
	}
	if config.Disabled {
		args = append(args, "=disabled=yes")
	}
	if config.Log {
		args = append(args, "=log=yes")
	}
	if config.Comment != "" {
		args = append(args, "=comment="+config.Comment)
	}

	id, err := c.Add("/ip/firewall/nat", args...)
	if err != nil {
		return "", fmt.Errorf("failed to add NAT rule: %w", err)
	}

	return id, nil
}

func (c *Client) RemoveNATRule(id string) error {
	_, err := c.Remove("/ip/firewall/nat", "=.id="+id)
	if err != nil {
		return fmt.Errorf("failed to remove NAT rule: %w", err)
	}

	return nil
}

func (c *Client) ListMangleRules() ([]MangleRule, error) {
	results, err := c.GetAll("/ip/firewall/mangle")
	if err != nil {
		return nil, fmt.Errorf("failed to list mangle rules: %w", err)
	}

	rules := make([]MangleRule, 0)
	for _, result := range results {
		rules = append(rules, MangleRule{
			ID:       result[".id"],
			Action:   result["action"],
			Chain:    result["chain"],
			Protocol: result["protocol"],
			SrcAddr:  result["src-address"],
			DstAddr:  result["dst-address"],
			SrcPort:  result["src-port"],
			DstPort:  result["dst-port"],
			InIface:  result["in-interface"],
			OutIface: result["out-interface"],
			Disabled: result["disabled"] == "true",
			Log:      result["log"] == "true",
			Comment:  result["comment"],
		})
	}

	return rules, nil
}

func (c *Client) AddMangleRule(config MangleRuleConfig) (string, error) {
	args := []string{
		"=chain=" + config.Chain,
		"=action=" + config.Action,
	}

	if config.Protocol != "" {
		args = append(args, "=protocol="+config.Protocol)
	}
	if config.SrcAddr != "" {
		args = append(args, "=src-address="+config.SrcAddr)
	}
	if config.DstAddr != "" {
		args = append(args, "=dst-address="+config.DstAddr)
	}
	if config.SrcPort != "" {
		args = append(args, "=src-port="+config.SrcPort)
	}
	if config.DstPort != "" {
		args = append(args, "=dst-port="+config.DstPort)
	}
	if config.InIface != "" {
		args = append(args, "=in-interface="+config.InIface)
	}
	if config.OutIface != "" {
		args = append(args, "=out-interface="+config.OutIface)
	}
	if config.Disabled {
		args = append(args, "=disabled=yes")
	}
	if config.Log {
		args = append(args, "=log=yes")
	}
	if config.Comment != "" {
		args = append(args, "=comment="+config.Comment)
	}

	id, err := c.Add("/ip/firewall/mangle", args...)
	if err != nil {
		return "", fmt.Errorf("failed to add mangle rule: %w", err)
	}

	return id, nil
}

func (c *Client) RemoveMangleRule(id string) error {
	_, err := c.Remove("/ip/firewall/mangle", "=.id="+id)
	if err != nil {
		return fmt.Errorf("failed to remove mangle rule: %w", err)
	}

	return nil
}

// ListFirewallAddressListItems retrieves firewall address list items matching the given filter criteria.
// If all filter fields are empty/nil, returns all items. Assigned fields are used as search criteria.
func (c *Client) ListFirewallAddressListItems(filter FirewallAddressListFilter) ([]FirewallAddressListItem, error) {
	args := make([]string, 0)

	if filter.ID != "" {
		args = append(args, "?=.id="+filter.ID)
	}
	if filter.ListName != "" {
		args = append(args, "?=list="+filter.ListName)
	}
	if filter.Address != "" {
		args = append(args, "?=address="+filter.Address)
	}
	if filter.Comment != "" {
		args = append(args, "?=comment="+filter.Comment)
	}
	if filter.Disabled != nil {
		disabledStr := "false"
		if *filter.Disabled {
			disabledStr = "true"
		}
		args = append(args, "?=disabled="+disabledStr)
	}

	results, err := c.GetAll("/ip/firewall/address-list", args...)
	if err != nil {
		return nil, fmt.Errorf("failed to list firewall address list items: %w", err)
	}

	items := make([]FirewallAddressListItem, 0, len(results))
	for _, result := range results {
		items = append(items, FirewallAddressListItem{
			ID:           result[".id"],
			List:         result["list"],
			Address:      result["address"],
			Disabled:     result["disabled"] == "true",
			Comment:      result["comment"],
			CreationTime: result["creation-time"],
		})
	}

	return items, nil
}

// FindFirewallAddressListEntries returns every /ip/firewall/address-list entry
// whose address contains target, matching the semantics of the RouterOS CLI's
// "(target in address)" query, e.g. "print where list=DOMAddList (<ip> in
// address)". ListName scopes the search to one list; an empty listName
// searches all lists, matching print with no list= filter. Target may be a
// single address or a CIDR range; in the latter case an entry matches only if
// it fully contains that range, not merely overlaps it, mirroring the CLI's
// "in" operator.
//
// The RouterOS binary API has no "in" query word (only =, >, < and the #
// logical operators, per MikroTik's API documentation), so this fetches
// candidate entries via the ordinary list= filter and evaluates containment
// in Go. Callers that already have the list's items from another call (e.g. to
// check its size or freshness) should use FilterAddressListByContainment
// directly instead, to avoid fetching the same list twice.
func (c *Client) FindFirewallAddressListEntries(listName, target string) ([]FirewallAddressListItem, error) {
	if target == "" {
		return nil, fmt.Errorf("target address is required")
	}

	items, err := c.ListFirewallAddressListItems(FirewallAddressListFilter{ListName: listName})
	if err != nil {
		return nil, fmt.Errorf("failed to list firewall address list items: %w", err)
	}

	return FilterAddressListByContainment(items, target)
}

// FilterAddressListByContainment returns every item in items whose Address
// contains target, using the same containment semantics as
// FindFirewallAddressListEntries. It performs no RouterOS calls of its own,
// so callers that also need other information about the same list (e.g. its
// size or the newest entry's creation time) can fetch once via
// ListFirewallAddressListItems and reuse that result here.
func FilterAddressListByContainment(items []FirewallAddressListItem, target string) ([]FirewallAddressListItem, error) {
	if target == "" {
		return nil, fmt.Errorf("target address is required")
	}

	targetNet, err := parseAddressOrCIDR(target)
	if err != nil {
		return nil, fmt.Errorf("invalid target address %s: %w", target, err)
	}

	matches := make([]FirewallAddressListItem, 0)
	for i := range items {
		entryNet, err := parseAddressOrCIDR(items[i].Address)
		if err != nil {
			continue
		}

		if !cidrContains(entryNet, targetNet) {
			continue
		}

		matches = append(matches, items[i])
	}

	return matches, nil
}

// parseAddressOrCIDR parses value as a CIDR range, or as a single address
// widened to its narrowest CIDR (/32 for IPv4, /128 for IPv6) if it has no
// "/" of its own.
func parseAddressOrCIDR(value string) (*net.IPNet, error) {
	if _, ipNet, err := net.ParseCIDR(value); err == nil {
		return ipNet, nil
	}

	ip := net.ParseIP(value)
	if ip == nil {
		return nil, fmt.Errorf("not a valid address or CIDR")
	}

	if ip4 := ip.To4(); ip4 != nil {
		return &net.IPNet{IP: ip4, Mask: net.CIDRMask(32, 32)}, nil
	}
	return &net.IPNet{IP: ip, Mask: net.CIDRMask(128, 128)}, nil
}

// cidrContains reports whether contained is fully inside container: container
// must be the same address family, have a prefix at least as broad, and
// contain contained's network address.
func cidrContains(container, contained *net.IPNet) bool {
	containerOnes, containerBits := container.Mask.Size()
	containedOnes, containedBits := contained.Mask.Size()

	if containerBits != containedBits {
		return false // different address families (IPv4 vs IPv6)
	}
	if containedOnes < containerOnes {
		return false // contained is a broader range than container, can't fit inside it
	}

	return container.Contains(contained.IP)
}

// AddFirewallAddressListItem adds a new item to a firewall address list.
func (c *Client) AddFirewallAddressListItem(listName, address string, disabled bool, comment string) (string, error) {
	args := []string{
		"=list=" + listName,
		"=address=" + address,
	}

	if disabled {
		args = append(args, "=disabled=yes")
	}
	if comment != "" {
		args = append(args, "=comment="+comment)
	}

	id, err := c.Add("/ip/firewall/address-list", args...)
	if err != nil {
		return "", fmt.Errorf("failed to add firewall address list item: %w", err)
	}

	return id, nil
}

// RemoveFirewallAddressListItem removes an item from a firewall address list by ID.
func (c *Client) RemoveFirewallAddressListItem(id string) error {
	_, err := c.Remove("/ip/firewall/address-list", "=.id="+id)
	if err != nil {
		return fmt.Errorf("failed to remove firewall address list item: %w", err)
	}

	return nil
}

// UpdateFirewallAddressListItem updates an existing firewall address list item by ID.
func (c *Client) UpdateFirewallAddressListItem(id, address string) error {
	_, err := c.Set("/ip/firewall/address-list", "=.id="+id, "=address="+address)
	if err != nil {
		return fmt.Errorf("failed to update firewall address list item: %w", err)
	}

	return nil
}
