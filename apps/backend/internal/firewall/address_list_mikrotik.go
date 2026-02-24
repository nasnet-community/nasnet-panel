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
	if port == nil {
		return nil, fmt.Errorf("router port cannot be nil")
	}

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
	if port == nil {
		return nil, fmt.Errorf("router port cannot be nil")
	}
	if listName == "" {
		return nil, fmt.Errorf("list name cannot be empty")
	}

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
	if port == nil {
		return nil, fmt.Errorf("router port cannot be nil")
	}

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
	if port == nil {
		return nil, fmt.Errorf("router port cannot be nil")
	}
	if id == "" {
		return nil, fmt.Errorf("entry ID cannot be empty")
	}

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
	if port == nil {
		return fmt.Errorf("router port cannot be nil")
	}
	if id == "" {
		return fmt.Errorf("entry ID cannot be empty")
	}

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

// fetchRules fetches firewall rules that reference an address list
//
//nolint:unparam // error kept for interface compatibility
func fetchRules(ctx context.Context, port router.RouterPort, listName string) ([]Rule, error) {
	// Query filter rules
	filterRules := fetchFilterRulesReferencingList(ctx, port, listName)

	// Query NAT rules
	natRules := fetchNATRulesReferencingList(ctx, port, listName)

	// Query mangle rules
	mangleRules := fetchMangleRulesReferencingList(ctx, port, listName)

	// Combine all rules
	allRules := filterRules
	allRules = append(allRules, natRules...)
	allRules = append(allRules, mangleRules...)

	return allRules, nil
}

// fetchFilterRulesReferencingList fetches filter rules that reference a list
func fetchFilterRulesReferencingList(ctx context.Context, port router.RouterPort, listName string) []Rule {
	cmd := router.Command{
		Path:   "/ip/firewall/filter",
		Action: "print",
	}

	result, err := port.ExecuteCommand(ctx, cmd)
	if err != nil {
		return []Rule{} // Return empty slice on error, don't fail
	}

	return parseRulesForList(result.RawOutput, "filter", listName)
}

// fetchNATRulesReferencingList fetches NAT rules that reference a list
func fetchNATRulesReferencingList(ctx context.Context, port router.RouterPort, listName string) []Rule {
	cmd := router.Command{
		Path:   "/ip/firewall/nat",
		Action: "print",
	}

	result, err := port.ExecuteCommand(ctx, cmd)
	if err != nil {
		return []Rule{}
	}

	return parseRulesForList(result.RawOutput, "nat", listName)
}

// fetchMangleRulesReferencingList fetches mangle rules that reference a list
func fetchMangleRulesReferencingList(ctx context.Context, port router.RouterPort, listName string) []Rule {
	cmd := router.Command{
		Path:   "/ip/firewall/mangle",
		Action: "print",
	}

	result, err := port.ExecuteCommand(ctx, cmd)
	if err != nil {
		return []Rule{}
	}

	return parseRulesForList(result.RawOutput, "mangle", listName)
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
		ID:       id,
		List:     list,
		Address:  address,
		Dynamic:  fields["dynamic"] == "true",
		Disabled: fields["disabled"] == "true",
	}

	if comment, ok := fields["comment"]; ok && comment != "" {
		entry.Comment = &comment
	}

	if timeout, ok := fields["timeout"]; ok && timeout != "" {
		entry.Timeout = &timeout
	}

	if creationTime, ok := fields["creation-time"]; ok && creationTime != "" {
		parseCreationTime(creationTime, entry)
	}

	return entry
}

// parseCreationTime parses creation time in various formats and sets it on the entry.
// Tries RFC3339 format first, then alternative MikroTik timestamp formats.
// If parsing fails, silently continues (creation time is not critical).
func parseCreationTime(creationTime string, entry *AddressListEntry) {
	// Try RFC3339 format first
	t, err := time.Parse(time.RFC3339, creationTime)
	if err == nil {
		entry.CreationTime = &t
		return
	}

	// Try alternative MikroTik timestamp formats
	alternativeFormats := []string{
		"2006-01-02T15:04:05Z07:00",
		"2006-01-02 15:04:05",
		time.RFC3339Nano,
	}
	for _, format := range alternativeFormats {
		if t, err = time.Parse(format, creationTime); err == nil {
			entry.CreationTime = &t
			return
		}
	}
	// If parsing fails, skip creation time (not critical)
}

// parseRulesForList parses firewall rules that reference a specific list
func parseRulesForList(rawOutput, table, listName string) []Rule {
	rules := []Rule{}
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
			rule := Rule{
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
// Handles quoted values like comment="Test comment"
func parseRouterOSFields(line string) map[string]string {
	fields := make(map[string]string)
	var current strings.Builder
	inQuote := false

	for i := 0; i < len(line); i++ {
		ch := line[i]

		switch ch {
		case '"':
			inQuote = !inQuote
		case ' ':
			switch {
			case !inQuote && current.Len() > 0:
				// Process the completed key=value pair
				pair := current.String()
				current.Reset()

				kv := strings.SplitN(pair, "=", 2)
				if len(kv) == 2 {
					fields[kv[0]] = kv[1]
				}
			case !inQuote:
				// Skip whitespace outside of values
				continue
			default:
				// Space inside quoted value
				current.WriteByte(ch)
			}
		default:
			current.WriteByte(ch)
		}
	}

	// Process any remaining content
	if current.Len() > 0 {
		pair := current.String()
		kv := strings.SplitN(pair, "=", 2)
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
