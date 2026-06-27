// Package routeros provides RouterOS API client functionality.
package routeros

import (
	"fmt"
)

// ARPEntry represents an ARP table entry.
type ARPEntry struct {
	ID         string
	Address    string
	MacAddress string
	Interface  string
	Disabled   bool
	Dynamic    bool
	Comment    string
}

// ListARPEntries returns all ARP entries.
func (c *Client) ListARPEntries() ([]ARPEntry, error) {
	results, err := c.GetAll("/ip/arp")
	if err != nil {
		return nil, fmt.Errorf("failed to list ARP entries: %w", err)
	}

	entries := make([]ARPEntry, 0)
	for _, result := range results {
		entries = append(entries, ARPEntry{
			ID:         result[".id"],
			Address:    result["address"],
			MacAddress: result["mac-address"],
			Interface:  result["interface"],
			Disabled:   result["disabled"] == "true",
			Dynamic:    result["dynamic"] == "true",
			Comment:    result["comment"],
		})
	}

	return entries, nil
}

// FindARPEntryByMAC finds an ARP entry by its MAC address.
func (c *Client) FindARPEntryByMAC(macAddress string) (*ARPEntry, error) {
	results, err := c.GetAll("/ip/arp", "?=mac-address="+macAddress)
	if err != nil {
		return nil, fmt.Errorf("failed to find ARP entry: %w", err)
	}

	if len(results) == 0 {
		return nil, nil
	}

	result := results[0]
	return &ARPEntry{
		ID:         result[".id"],
		Address:    result["address"],
		MacAddress: result["mac-address"],
		Interface:  result["interface"],
		Disabled:   result["disabled"] == "true",
		Dynamic:    result["dynamic"] == "true",
		Comment:    result["comment"],
	}, nil
}
