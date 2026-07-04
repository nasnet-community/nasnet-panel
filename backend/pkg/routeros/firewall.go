package routeros

import (
	"fmt"
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
	ID       string
	List     string
	Address  string
	Disabled bool
	Comment  string
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
			ID:       result[".id"],
			List:     result["list"],
			Address:  result["address"],
			Disabled: result["disabled"] == "true",
			Comment:  result["comment"],
		})
	}

	return items, nil
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
