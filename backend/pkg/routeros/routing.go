package routeros

import (
	"fmt"
)

// RoutingTableInfo represents a routing table.
type RoutingTableInfo struct {
	ID       string
	Name     string
	FIB      *bool
	Dynamic  *bool
	Disabled *bool
	Invalid  *bool
	Used     *bool
	Comment  *string
}

// RoutingTableConfig represents configuration for creating or updating a routing table.
type RoutingTableConfig struct {
	Name    string
	FIB     bool
	Comment string
}

// ListRoutingTables returns all routing tables.
func (c *Client) ListRoutingTables() ([]RoutingTableInfo, error) {
	results, err := c.GetAll("/routing/table")
	if err != nil {
		return nil, fmt.Errorf("failed to list routing tables: %w", err)
	}

	tables := make([]RoutingTableInfo, 0, len(results))
	for _, result := range results {
		tables = append(tables, parseRoutingTableInfo(result))
	}

	return tables, nil
}

// GetRoutingTable retrieves a specific routing table by name.
func (c *Client) GetRoutingTable(name string) (*RoutingTableInfo, error) {
	result, err := c.GetFirst("/routing/table", "?=name="+name)
	if err != nil {
		return nil, fmt.Errorf("failed to get routing table %s: %w", name, err)
	}

	parsed := parseRoutingTableInfo(result)
	return &parsed, nil
}

// AddRoutingTable creates a new routing table.
func (c *Client) AddRoutingTable(config RoutingTableConfig) (string, error) {
	args := []string{
		"=name=" + config.Name,
	}

	if config.FIB {
		args = append(args, "=fib=yes")
	}
	if config.Comment != "" {
		args = append(args, "=comment="+config.Comment)
	}

	id, err := c.Add("/routing/table", args...)
	if err != nil {
		return "", fmt.Errorf("failed to add routing table: %w", err)
	}

	return id, nil
}

// UpdateRoutingTable updates an existing routing table.
func (c *Client) UpdateRoutingTable(id string, config RoutingTableConfig) error {
	args := []string{
		"=.id=" + id,
	}

	if config.Name != "" {
		args = append(args, "=name="+config.Name)
	}
	args = append(args, "=fib="+func() string {
		if config.FIB {
			return "yes"
		}
		return "no"
	}())
	if config.Comment != "" {
		args = append(args, "=comment="+config.Comment)
	}

	_, err := c.Set("/routing/table", args...)
	if err != nil {
		return fmt.Errorf("failed to update routing table: %w", err)
	}

	return nil
}

// RemoveRoutingTable deletes a routing table.
func (c *Client) RemoveRoutingTable(id string) error {
	_, err := c.Remove("/routing/table", "=.id="+id)
	if err != nil {
		return fmt.Errorf("failed to remove routing table: %w", err)
	}

	return nil
}

func parseRoutingTableInfo(result map[string]string) RoutingTableInfo {
	return RoutingTableInfo{
		ID:       result[".id"],
		Name:     result["name"],
		FIB:      getBoolPtr(result, "fib"),
		Dynamic:  getBoolPtr(result, "dynamic"),
		Disabled: getBoolPtr(result, "disabled"),
		Invalid:  getBoolPtr(result, "invalid"),
		Used:     getBoolPtr(result, "used"),
		Comment:  getStringPtr(result, "comment"),
	}
}
