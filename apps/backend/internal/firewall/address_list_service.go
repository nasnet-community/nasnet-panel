package firewall

import (
	"context"
	"fmt"
	"sync"

	"backend/internal/router"
)

// AddressListService handles address list operations
type AddressListService struct {
	// Service is stateless - RouterPort is passed per-operation
}

// NewAddressListService creates a new address list service
func NewAddressListService() *AddressListService {
	return &AddressListService{}
}

// GetAddressLists fetches all address lists with aggregated statistics
func (s *AddressListService) GetAddressLists(ctx context.Context, port router.RouterPort) ([]AddressListAggregate, error) {
	// Fetch all entries
	entries, err := fetchAddressListEntries(ctx, port)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch address list entries: %w", err)
	}

	// Group by list name and compute statistics
	listMap := make(map[string]*AddressListAggregate)

	for _, entry := range entries {
		if _, exists := listMap[entry.List]; !exists {
			listMap[entry.List] = &AddressListAggregate{
				Name:         entry.List,
				EntryCount:   0,
				DynamicCount: 0,
			}
		}

		listMap[entry.List].EntryCount++
		if entry.Dynamic {
			listMap[entry.List].DynamicCount++
		}
	}

	// Fetch referencing rules count for each list
	// Use goroutines for parallel fetching
	var wg sync.WaitGroup
	var mu sync.Mutex

	for listName := range listMap {
		wg.Add(1)
		go func(name string) {
			defer wg.Done()

			rules, err := fetchFirewallRules(ctx, port, name)
			if err != nil {
				// Log error but continue
				return
			}

			mu.Lock()
			listMap[name].ReferencingRulesCount = len(rules)
			mu.Unlock()
		}(listName)
	}

	wg.Wait()

	// Convert map to slice
	result := make([]AddressListAggregate, 0, len(listMap))
	for _, aggregate := range listMap {
		result = append(result, *aggregate)
	}

	return result, nil
}

// GetAddressListEntries fetches entries for a specific list with pagination
func (s *AddressListService) GetAddressListEntries(
	ctx context.Context,
	port router.RouterPort,
	listName string,
	first *int,
	after *string,
) (*AddressListEntryConnection, error) {
	// Fetch all entries for the list
	entries, err := fetchAddressListEntriesByName(ctx, port, listName)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch entries for list %s: %w", listName, err)
	}

	totalCount := len(entries)

	// Apply cursor-based pagination
	startIndex := 0
	if after != nil && *after != "" {
		afterID, err := decodeCursor(*after)
		if err != nil {
			return nil, fmt.Errorf("invalid cursor: %w", err)
		}

		// Find the index after the cursor
		for i, entry := range entries {
			if entry.ID == afterID {
				startIndex = i + 1
				break
			}
		}
	}

	// Apply limit
	pageSize := 50 // Default page size
	if first != nil && *first > 0 {
		pageSize = *first
	}

	endIndex := startIndex + pageSize
	if endIndex > len(entries) {
		endIndex = len(entries)
	}

	// Slice the entries
	pageEntries := entries[startIndex:endIndex]

	// Build edges
	edges := make([]AddressListEntryEdge, len(pageEntries))
	for i, entry := range pageEntries {
		edges[i] = AddressListEntryEdge{
			Cursor: encodeCursor(entry.ID),
			Node:   entry,
		}
	}

	// Build page info
	hasNextPage := endIndex < len(entries)
	var endCursor *string
	if len(edges) > 0 {
		cursor := edges[len(edges)-1].Cursor
		endCursor = &cursor
	}

	pageInfo := PageInfo{
		HasNextPage: hasNextPage,
		EndCursor:   endCursor,
	}

	return &AddressListEntryConnection{
		Edges:      edges,
		PageInfo:   pageInfo,
		TotalCount: totalCount,
	}, nil
}

// GetReferencingRules fetches firewall rules that reference a list
func (s *AddressListService) GetReferencingRules(
	ctx context.Context,
	port router.RouterPort,
	listName string,
) ([]FirewallRule, error) {
	rules, err := fetchFirewallRules(ctx, port, listName)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch referencing rules: %w", err)
	}

	return rules, nil
}

// CreateAddressListEntry creates a new address list entry
func (s *AddressListService) CreateAddressListEntry(
	ctx context.Context,
	port router.RouterPort,
	input CreateAddressListEntryInput,
) (*AddressListEntry, error) {
	// Validate input
	if err := s.validateCreateInput(input); err != nil {
		return nil, err
	}

	entry, err := createAddressListEntry(ctx, port, input)
	if err != nil {
		return nil, fmt.Errorf("failed to create address list entry: %w", err)
	}

	return entry, nil
}

// DeleteAddressListEntry deletes an address list entry by ID
func (s *AddressListService) DeleteAddressListEntry(
	ctx context.Context,
	port router.RouterPort,
	id string,
) (bool, error) {
	err := deleteAddressListEntry(ctx, port, id)
	if err != nil {
		return false, fmt.Errorf("failed to delete address list entry: %w", err)
	}

	return true, nil
}

// BulkCreateAddressListEntries creates multiple entries with continue-on-error
func (s *AddressListService) BulkCreateAddressListEntries(
	ctx context.Context,
	port router.RouterPort,
	listName string,
	entries []BulkAddressInput,
) (*BulkCreateResult, error) {
	result := &BulkCreateResult{
		SuccessCount: 0,
		FailedCount:  0,
		Errors:       []BulkCreateError{},
	}

	// Process each entry, continue on error
	for i, bulkInput := range entries {
		input := CreateAddressListEntryInput{
			List:    listName,
			Address: bulkInput.Address,
			Comment: bulkInput.Comment,
			Timeout: bulkInput.Timeout,
		}

		_, err := s.CreateAddressListEntry(ctx, port, input)
		if err != nil {
			result.FailedCount++
			result.Errors = append(result.Errors, BulkCreateError{
				Index:   i,
				Address: bulkInput.Address,
				Message: err.Error(),
			})
		} else {
			result.SuccessCount++
		}
	}

	return result, nil
}

// validateCreateInput validates the create input
func (s *AddressListService) validateCreateInput(input CreateAddressListEntryInput) error {
	if input.List == "" {
		return fmt.Errorf("list name is required")
	}

	if input.Address == "" {
		return fmt.Errorf("address is required")
	}

	// Validate list name pattern (alphanumeric, underscore, hyphen)
	if !isValidListName(input.List) {
		return fmt.Errorf("invalid list name: must be alphanumeric with underscores or hyphens")
	}

	// Validate address format (basic check)
	if !isValidAddress(input.Address) {
		return fmt.Errorf("invalid address format")
	}

	return nil
}

// isValidListName checks if a list name is valid
func isValidListName(name string) bool {
	if len(name) == 0 || len(name) > 64 {
		return false
	}

	for _, ch := range name {
		if !((ch >= 'a' && ch <= 'z') ||
			(ch >= 'A' && ch <= 'Z') ||
			(ch >= '0' && ch <= '9') ||
			ch == '_' || ch == '-') {
			return false
		}
	}

	return true
}

// isValidAddress checks if an address is valid (IP, CIDR, or range)
func isValidAddress(address string) bool {
	// Basic validation - accepts IP, CIDR, or range
	if len(address) < 7 || len(address) > 100 {
		return false
	}

	// Must contain at least one dot (for IP addresses)
	if !containsChar(address, '.') {
		return false
	}

	return true
}

// containsChar checks if a string contains a character
func containsChar(s string, ch rune) bool {
	for _, c := range s {
		if c == ch {
			return true
		}
	}
	return false
}
