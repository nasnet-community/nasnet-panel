package routeros

import "fmt"

// RoutingRule represents an entry of /routing/rule.
type RoutingRule struct {
	ID          string
	SrcAddress  string
	DstAddress  string
	RoutingMark string
	Action      string
	Table       string
	Disabled    bool
	Comment     string
}

// ListRoutingRules returns every routing rule in evaluation order.
func (c *Client) ListRoutingRules() ([]RoutingRule, error) {
	results, err := c.GetAll("/routing/rule")
	if err != nil {
		return nil, fmt.Errorf("failed to list routing rules: %w", err)
	}

	rules := make([]RoutingRule, 0, len(results))
	for _, result := range results {
		rules = append(rules, RoutingRule{
			ID:          result[".id"],
			SrcAddress:  result["src-address"],
			DstAddress:  result["dst-address"],
			RoutingMark: result["routing-mark"],
			Action:      result["action"],
			Table:       result["table"],
			Disabled:    result["disabled"] == "true",
			Comment:     result["comment"],
		})
	}

	return rules, nil
}

// RemoveRoutingRule deletes the routing rule with the given ID.
func (c *Client) RemoveRoutingRule(id string) error {
	if _, err := c.Remove("/routing/rule", "=.id="+id); err != nil {
		return fmt.Errorf("failed to remove routing rule %s: %w", id, err)
	}

	return nil
}
