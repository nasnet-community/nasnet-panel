package routeros

import (
	"fmt"
)

type FirewallRule struct {
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

func (c *Client) ListFirewallRules() ([]FirewallRule, error) {
	results, err := c.GetAll("/ip/firewall/filter")
	if err != nil {
		return nil, fmt.Errorf("failed to list firewall rules: %w", err)
	}

	rules := make([]FirewallRule, 0)
	for _, result := range results {
		rules = append(rules, FirewallRule{
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

func (c *Client) GetFirewallRulesByChain(chain string) ([]FirewallRule, error) {
	results, err := c.GetAll("/ip/firewall/filter", "chain="+chain)
	if err != nil {
		return nil, fmt.Errorf("failed to get firewall rules for chain %s: %w", chain, err)
	}

	rules := make([]FirewallRule, 0)
	for _, result := range results {
		rules = append(rules, FirewallRule{
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
		"chain=" + config.Chain,
		"action=" + config.Action,
	}

	if config.Protocol != "" {
		args = append(args, "protocol="+config.Protocol)
	}
	if config.SrcAddr != "" {
		args = append(args, "src-address="+config.SrcAddr)
	}
	if config.DstAddr != "" {
		args = append(args, "dst-address="+config.DstAddr)
	}
	if config.SrcPort != "" {
		args = append(args, "src-port="+config.SrcPort)
	}
	if config.DstPort != "" {
		args = append(args, "dst-port="+config.DstPort)
	}
	if config.InIface != "" {
		args = append(args, "in-interface="+config.InIface)
	}
	if config.OutIface != "" {
		args = append(args, "out-interface="+config.OutIface)
	}
	if config.Disabled {
		args = append(args, "disabled=yes")
	}
	if config.Log {
		args = append(args, "log=yes")
	}
	if config.LogPrefix != "" {
		args = append(args, "log-prefix="+config.LogPrefix)
	}
	if config.Comment != "" {
		args = append(args, "comment="+config.Comment)
	}

	reply, err := c.Add("/ip/firewall/filter", args...)
	if err != nil {
		return "", fmt.Errorf("failed to add firewall rule: %w", err)
	}

	if id := extractRetID(reply); id != "" {
		return id, nil
	}
	return "", fmt.Errorf("no ID returned")
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
		"chain=" + config.Chain,
		"action=" + config.Action,
	}

	if config.Protocol != "" {
		args = append(args, "protocol="+config.Protocol)
	}
	if config.SrcAddr != "" {
		args = append(args, "src-address="+config.SrcAddr)
	}
	if config.DstAddr != "" {
		args = append(args, "dst-address="+config.DstAddr)
	}
	if config.SrcPort != "" {
		args = append(args, "src-port="+config.SrcPort)
	}
	if config.DstPort != "" {
		args = append(args, "dst-port="+config.DstPort)
	}
	if config.ToAddresses != "" {
		args = append(args, "to-addresses="+config.ToAddresses)
	}
	if config.ToPorts != "" {
		args = append(args, "to-ports="+config.ToPorts)
	}
	if config.InIface != "" {
		args = append(args, "in-interface="+config.InIface)
	}
	if config.OutIface != "" {
		args = append(args, "out-interface="+config.OutIface)
	}
	if config.Disabled {
		args = append(args, "disabled=yes")
	}
	if config.Log {
		args = append(args, "log=yes")
	}
	if config.Comment != "" {
		args = append(args, "comment="+config.Comment)
	}

	reply, err := c.Add("/ip/firewall/nat", args...)
	if err != nil {
		return "", fmt.Errorf("failed to add NAT rule: %w", err)
	}

	if id := extractRetID(reply); id != "" {
		return id, nil
	}
	return "", fmt.Errorf("no ID returned")
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
		"chain=" + config.Chain,
		"action=" + config.Action,
	}

	if config.Protocol != "" {
		args = append(args, "protocol="+config.Protocol)
	}
	if config.SrcAddr != "" {
		args = append(args, "src-address="+config.SrcAddr)
	}
	if config.DstAddr != "" {
		args = append(args, "dst-address="+config.DstAddr)
	}
	if config.SrcPort != "" {
		args = append(args, "src-port="+config.SrcPort)
	}
	if config.DstPort != "" {
		args = append(args, "dst-port="+config.DstPort)
	}
	if config.InIface != "" {
		args = append(args, "in-interface="+config.InIface)
	}
	if config.OutIface != "" {
		args = append(args, "out-interface="+config.OutIface)
	}
	if config.Disabled {
		args = append(args, "disabled=yes")
	}
	if config.Log {
		args = append(args, "log=yes")
	}
	if config.Comment != "" {
		args = append(args, "comment="+config.Comment)
	}

	reply, err := c.Add("/ip/firewall/mangle", args...)
	if err != nil {
		return "", fmt.Errorf("failed to add mangle rule: %w", err)
	}

	if id := extractRetID(reply); id != "" {
		return id, nil
	}
	return "", fmt.Errorf("no ID returned")
}

func (c *Client) RemoveMangleRule(id string) error {
	_, err := c.Remove("/ip/firewall/mangle", "=.id="+id)
	if err != nil {
		return fmt.Errorf("failed to remove mangle rule: %w", err)
	}

	return nil
}
