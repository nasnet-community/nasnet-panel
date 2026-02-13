package firewall

import (
	"context"
	"encoding/base64"
	"fmt"
	"strings"
	"time"

	"backend/internal/router"
)

// MikroTik API endpoint for address lists
const addressListEndpoint = "/ip/firewall/address-list"

// fetchAddressListEntries fetches all address list entries from the router
func fetchAddressListEntries(ctx context.Context, port router.RouterPort) ([]AddressListEntry, error) {
	cmd := router.Command{
		Path:   addressListEndpoint,
		Action: "print",
	}

	result, err := port.ExecuteCommand(ctx, cmd)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch address list entries: %w", err)
	}

	return parseAddressListEntries(result.RawOutput), nil
}

// fetchAddressListEntriesByName fetches entries for a specific list name
func fetchAddressListEntriesByName(ctx context.Context, port router.RouterPort, listName string) ([]AddressListEntry, error) {
	cmd := router.Command{
		Path:   addressListEndpoint,
		Action: "print",
		Query:  fmt.Sprintf("list=%s", listName),
	}

	result, err := port.ExecuteCommand(ctx, cmd)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch entries for list %s: %w", listName, err)
	}

	return parseAddressListEntries(result.RawOutput), nil
}

// createAddressListEntry creates a new address list entry
func createAddressListEntry(ctx context.Context, port router.RouterPort, input CreateAddressListEntryInput) (*AddressListEntry, error) {
	args := map[string]string{
		"list":    input.List,
		"address": input.Address,
	}

	if input.Comment != nil && *input.Comment != "" {
		args["comment"] = *input.Comment
	}

	if input.Timeout != nil && *input.Timeout != "" {
		args["timeout"] = *input.Timeout
	}

	cmd := router.Command{
		Path:   addressListEndpoint,
		Action: "add",
		Args:   args,
	}

	result, err := port.ExecuteCommand(ctx, cmd)
	if err != nil {
		return nil, fmt.Errorf("failed to create address list entry: %w", err)
	}

	// Fetch the created entry by ID
	if result.ID != "" {
		entry, err := fetchAddressListEntryByID(ctx, port, result.ID)
		if err != nil {
			return nil, err
		}
		return entry, nil
	}

	return nil, fmt.Errorf("failed to get ID of created entry")
}

// fetchAddressListEntryByID fetches a single entry by ID
func fetchAddressListEntryByID(ctx context.Context, port router.RouterPort, id string) (*AddressListEntry, error) {
	cmd := router.Command{
		Path:   addressListEndpoint,
		Action: "print",
		Query:  fmt.Sprintf(".id=%s", id),
	}

	result, err := port.ExecuteCommand(ctx, cmd)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch entry by ID: %w", err)
	}

	entries := parseAddressListEntries(result.RawOutput)
	if len(entries) == 0 {
		return nil, fmt.Errorf("entry with ID %s not found", id)
	}

	return &entries[0], nil
}

// deleteAddressListEntry deletes an address list entry by ID
func deleteAddressListEntry(ctx context.Context, port router.RouterPort, id string) error {
	cmd := router.Command{
		Path:   addressListEndpoint,
		Action: "remove",
		ID:     id,
	}

	_, err := port.ExecuteCommand(ctx, cmd)
	if err != nil {
		return fmt.Errorf("failed to delete address list entry: %w", err)
	}

	return nil
}

// fetchFirewallRules fetches firewall rules that reference an address list
func fetchFirewallRules(ctx context.Context, port router.RouterPort, listName string) ([]FirewallRule, error) {
	// Query filter rules
	filterRules, err := fetchFilterRulesReferencingList(ctx, port, listName)
	if err != nil {
		return nil, err
	}

	// Query NAT rules
	natRules, err := fetchNATRulesReferencingList(ctx, port, listName)
	if err != nil {
		return nil, err
	}

	// Query mangle rules
	mangleRules, err := fetchMangleRulesReferencingList(ctx, port, listName)
	if err != nil {
		return nil, err
	}

	// Combine all rules
	allRules := append(filterRules, natRules...)
	allRules = append(allRules, mangleRules...)

	return allRules, nil
}

// fetchFilterRulesReferencingList fetches filter rules that reference a list
func fetchFilterRulesReferencingList(ctx context.Context, port router.RouterPort, listName string) ([]FirewallRule, error) {
	cmd := router.Command{
		Path:   "/ip/firewall/filter",
		Action: "print",
	}

	result, err := port.ExecuteCommand(ctx, cmd)
	if err != nil {
		return []FirewallRule{}, nil // Return empty slice on error, don't fail
	}

	return parseFirewallRulesForList(result.RawOutput, "filter", listName), nil
}

// fetchNATRulesReferencingList fetches NAT rules that reference a list
func fetchNATRulesReferencingList(ctx context.Context, port router.RouterPort, listName string) ([]FirewallRule, error) {
	cmd := router.Command{
		Path:   "/ip/firewall/nat",
		Action: "print",
	}

	result, err := port.ExecuteCommand(ctx, cmd)
	if err != nil {
		return []FirewallRule{}, nil
	}

	return parseFirewallRulesForList(result.RawOutput, "nat", listName), nil
}

// fetchMangleRulesReferencingList fetches mangle rules that reference a list
func fetchMangleRulesReferencingList(ctx context.Context, port router.RouterPort, listName string) ([]FirewallRule, error) {
	cmd := router.Command{
		Path:   "/ip/firewall/mangle",
		Action: "print",
	}

	result, err := port.ExecuteCommand(ctx, cmd)
	if err != nil {
		return []FirewallRule{}, nil
	}

	return parseFirewallRulesForList(result.RawOutput, "mangle", listName), nil
}

// parseAddressListEntries parses RouterOS response into AddressListEntry structs
func parseAddressListEntries(rawOutput string) []AddressListEntry {
	entries := []AddressListEntry{}
	lines := strings.Split(rawOutput, "\n")

	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}

		entry := parseAddressListEntry(line)
		if entry != nil {
			entries = append(entries, *entry)
		}
	}

	return entries
}

// parseAddressListEntry parses a single RouterOS line into AddressListEntry
func parseAddressListEntry(line string) *AddressListEntry {
	// This is a simplified parser - actual implementation would need to handle
	// RouterOS format more robustly
	fields := parseRouterOSFields(line)

	id, ok := fields[".id"]
	if !ok {
		return nil
	}

	list, ok := fields["list"]
	if !ok {
		return nil
	}

	address, ok := fields["address"]
	if !ok {
		return nil
	}

	entry := &AddressListEntry{
		ID:      id,
		List:    list,
		Address: address,
		Dynamic: fields["dynamic"] == "true",
		Disabled: fields["disabled"] == "true",
	}

	if comment, ok := fields["comment"]; ok && comment != "" {
		entry.Comment = &comment
	}

	if timeout, ok := fields["timeout"]; ok && timeout != "" {
		entry.Timeout = &timeout
	}

	if creationTime, ok := fields["creation-time"]; ok && creationTime != "" {
		t, err := time.Parse(time.RFC3339, creationTime)
		if err == nil {
			entry.CreationTime = &t
		}
	}

	return entry
}

// parseFirewallRulesForList parses firewall rules that reference a specific list
func parseFirewallRulesForList(rawOutput string, table string, listName string) []FirewallRule {
	rules := []FirewallRule{}
	lines := strings.Split(rawOutput, "\n")

	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}

		fields := parseRouterOSFields(line)

		// Check if rule references the list in src-address-list or dst-address-list
		srcList, hasSrcList := fields["src-address-list"]
		dstList, hasDstList := fields["dst-address-list"]

		if (hasSrcList && srcList == listName) || (hasDstList && dstList == listName) {
			rule := FirewallRule{
				ID:     fields[".id"],
				Table:  table,
				Chain:  fields["chain"],
				Action: fields["action"],
				Properties: map[string]interface{}{
					"src-address-list": srcList,
					"dst-address-list": dstList,
				},
			}

			if comment, ok := fields["comment"]; ok {
				rule.Comment = comment
			}

			rules = append(rules, rule)
		}
	}

	return rules
}

// parseRouterOSFields parses RouterOS key=value format into a map
func parseRouterOSFields(line string) map[string]string {
	fields := make(map[string]string)
	parts := strings.Fields(line)

	for _, part := range parts {
		kv := strings.SplitN(part, "=", 2)
		if len(kv) == 2 {
			fields[kv[0]] = kv[1]
		}
	}

	return fields
}

// encodeCursor encodes an entry ID as a base64 cursor
func encodeCursor(id string) string {
	return base64.StdEncoding.EncodeToString([]byte(id))
}

// decodeCursor decodes a base64 cursor to an entry ID
func decodeCursor(cursor string) (string, error) {
	decoded, err := base64.StdEncoding.DecodeString(cursor)
	if err != nil {
		return "", fmt.Errorf("invalid cursor: %w", err)
	}
	return string(decoded), nil
}
