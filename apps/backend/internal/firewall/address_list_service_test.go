package firewall

import (
	"context"
	"fmt"
	"testing"
	"time"

	"backend/internal/router"
)

// MockRouterPort implements router.RouterPort for testing
type MockRouterPort struct {
	executeFunc func(ctx context.Context, cmd router.Command) (*router.CommandResult, error)
	connected   bool
}

func (m *MockRouterPort) Connect(ctx context.Context) error {
	m.connected = true
	return nil
}

func (m *MockRouterPort) Disconnect() error {
	m.connected = false
	return nil
}

func (m *MockRouterPort) IsConnected() bool {
	return m.connected
}

func (m *MockRouterPort) Health(ctx context.Context) router.HealthStatus {
	status := router.StatusDisconnected
	if m.connected {
		status = router.StatusConnected
	}
	return router.HealthStatus{Status: status}
}

func (m *MockRouterPort) Capabilities() router.PlatformCapabilities {
	return router.PlatformCapabilities{}
}

func (m *MockRouterPort) Info() (*router.RouterInfo, error) {
	return &router.RouterInfo{}, nil
}

func (m *MockRouterPort) ExecuteCommand(ctx context.Context, cmd router.Command) (*router.CommandResult, error) {
	if m.executeFunc != nil {
		return m.executeFunc(ctx, cmd)
	}
	return &router.CommandResult{}, nil
}

func (m *MockRouterPort) QueryState(ctx context.Context, query router.StateQuery) (*router.StateResult, error) {
	return &router.StateResult{}, nil
}

func (m *MockRouterPort) Protocol() router.Protocol {
	return router.ProtocolREST
}

// Test GetAddressLists
func TestGetAddressLists(t *testing.T) {
	service := NewAddressListService()

	tests := []struct {
		name          string
		mockOutput    string
		expectedCount int
		expectError   bool
	}{
		{
			name: "multiple lists with entries",
			mockOutput: `.id=*1 list=whitelist address=192.168.1.1 dynamic=false disabled=false
.id=*2 list=whitelist address=192.168.1.2 dynamic=false disabled=false
.id=*3 list=blacklist address=10.0.0.1 dynamic=true disabled=false
.id=*4 list=blacklist address=10.0.0.2 dynamic=false disabled=false`,
			expectedCount: 2, // 2 distinct lists
			expectError:   false,
		},
		{
			name:          "empty list",
			mockOutput:    "",
			expectedCount: 0,
			expectError:   false,
		},
		{
			name: "single list",
			mockOutput: `.id=*1 list=test address=192.168.1.1 dynamic=false disabled=false
.id=*2 list=test address=192.168.1.2 dynamic=false disabled=false`,
			expectedCount: 1,
			expectError:   false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockPort := &MockRouterPort{
				executeFunc: func(ctx context.Context, cmd router.Command) (*router.CommandResult, error) {
					return &router.CommandResult{RawOutput: tt.mockOutput}, nil
				},
			}

			result, err := service.GetAddressLists(context.Background(), mockPort)

			if tt.expectError && err == nil {
				t.Errorf("expected error but got none")
			}

			if !tt.expectError && err != nil {
				t.Errorf("unexpected error: %v", err)
			}

			if len(result) != tt.expectedCount {
				t.Errorf("expected %d lists, got %d", tt.expectedCount, len(result))
			}

			// Verify aggregation logic
			if !tt.expectError && tt.expectedCount > 0 {
				// Check that whitelist has 2 entries
				for _, list := range result {
					if list.Name == "whitelist" && list.EntryCount != 2 {
						t.Errorf("expected whitelist to have 2 entries, got %d", list.EntryCount)
					}
					if list.Name == "blacklist" && list.EntryCount != 2 {
						t.Errorf("expected blacklist to have 2 entries, got %d", list.EntryCount)
					}
					if list.Name == "blacklist" && list.DynamicCount != 1 {
						t.Errorf("expected blacklist to have 1 dynamic entry, got %d", list.DynamicCount)
					}
				}
			}
		})
	}
}

// Test GetAddressListEntries with pagination
func TestGetAddressListEntriesPagination(t *testing.T) {
	service := NewAddressListService()

	mockOutput := `.id=*1 list=test address=192.168.1.1 dynamic=false disabled=false
.id=*2 list=test address=192.168.1.2 dynamic=false disabled=false
.id=*3 list=test address=192.168.1.3 dynamic=false disabled=false
.id=*4 list=test address=192.168.1.4 dynamic=false disabled=false
.id=*5 list=test address=192.168.1.5 dynamic=false disabled=false`

	mockPort := &MockRouterPort{
		executeFunc: func(ctx context.Context, cmd router.Command) (*router.CommandResult, error) {
			return &router.CommandResult{RawOutput: mockOutput}, nil
		},
	}

	// Test first page
	first := 2
	result, err := service.GetAddressListEntries(context.Background(), mockPort, "test", &first, nil)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if len(result.Edges) != 2 {
		t.Errorf("expected 2 edges on first page, got %d", len(result.Edges))
	}

	if !result.PageInfo.HasNextPage {
		t.Errorf("expected hasNextPage to be true")
	}

	if result.TotalCount != 5 {
		t.Errorf("expected total count of 5, got %d", result.TotalCount)
	}

	// Test second page using cursor
	cursor := result.PageInfo.EndCursor
	result2, err := service.GetAddressListEntries(context.Background(), mockPort, "test", &first, cursor)
	if err != nil {
		t.Fatalf("unexpected error on second page: %v", err)
	}

	if len(result2.Edges) != 2 {
		t.Errorf("expected 2 edges on second page, got %d", len(result2.Edges))
	}

	if !result2.PageInfo.HasNextPage {
		t.Errorf("expected hasNextPage to be true on second page")
	}

	// Test third page
	cursor2 := result2.PageInfo.EndCursor
	result3, err := service.GetAddressListEntries(context.Background(), mockPort, "test", &first, cursor2)
	if err != nil {
		t.Fatalf("unexpected error on third page: %v", err)
	}

	if len(result3.Edges) != 1 {
		t.Errorf("expected 1 edge on third page, got %d", len(result3.Edges))
	}

	if result3.PageInfo.HasNextPage {
		t.Errorf("expected hasNextPage to be false on last page")
	}
}

// Test CreateAddressListEntry
func TestCreateAddressListEntry(t *testing.T) {
	service := NewAddressListService()

	tests := []struct {
		name        string
		input       CreateAddressListEntryInput
		expectError bool
	}{
		{
			name: "valid entry",
			input: CreateAddressListEntryInput{
				List:    "test-list",
				Address: "192.168.1.1",
			},
			expectError: false,
		},
		{
			name: "valid entry with comment",
			input: CreateAddressListEntryInput{
				List:    "test-list",
				Address: "192.168.1.0/24",
				Comment: stringPtr("Test network"),
			},
			expectError: false,
		},
		{
			name: "invalid - empty list name",
			input: CreateAddressListEntryInput{
				List:    "",
				Address: "192.168.1.1",
			},
			expectError: true,
		},
		{
			name: "invalid - empty address",
			input: CreateAddressListEntryInput{
				List:    "test-list",
				Address: "",
			},
			expectError: true,
		},
		{
			name: "invalid - invalid list name",
			input: CreateAddressListEntryInput{
				List:    "test list!",
				Address: "192.168.1.1",
			},
			expectError: true,
		},
		{
			name: "invalid - address too short",
			input: CreateAddressListEntryInput{
				List:    "test-list",
				Address: "1.1.1",
			},
			expectError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockPort := &MockRouterPort{
				executeFunc: func(ctx context.Context, cmd router.Command) (*router.CommandResult, error) {
					if cmd.Action == "add" {
						return &router.CommandResult{
							ID:        "*100",
							RawOutput: ".id=*100 list=test-list address=192.168.1.1 dynamic=false disabled=false",
						}, nil
					}
					return &router.CommandResult{
						RawOutput: ".id=*100 list=test-list address=192.168.1.1 dynamic=false disabled=false",
					}, nil
				},
			}

			_, err := service.CreateAddressListEntry(context.Background(), mockPort, tt.input)

			if tt.expectError && err == nil {
				t.Errorf("expected error but got none")
			}

			if !tt.expectError && err != nil {
				t.Errorf("unexpected error: %v", err)
			}
		})
	}
}

// Test BulkCreateAddressListEntries
func TestBulkCreateAddressListEntries(t *testing.T) {
	service := NewAddressListService()

	entries := []BulkAddressInput{
		{Address: "192.168.1.1", Comment: stringPtr("Valid 1")},
		{Address: "192.168.1.2", Comment: stringPtr("Valid 2")},
		{Address: "invalid", Comment: stringPtr("Invalid")}, // This will fail
		{Address: "192.168.1.3", Comment: stringPtr("Valid 3")},
	}

	mockPort := &MockRouterPort{
		executeFunc: func(ctx context.Context, cmd router.Command) (*router.CommandResult, error) {
			// Simulate failure for "invalid" address
			if args, ok := cmd.Args["address"]; ok && args == "invalid" {
				return nil, fmt.Errorf("invalid address")
			}

			return &router.CommandResult{
				ID:        "*100",
				RawOutput: ".id=*100 list=test address=192.168.1.1 dynamic=false disabled=false",
			}, nil
		},
	}

	result, err := service.BulkCreateAddressListEntries(context.Background(), mockPort, "test", entries)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if result.SuccessCount != 3 {
		t.Errorf("expected 3 successes, got %d", result.SuccessCount)
	}

	if result.FailedCount != 1 {
		t.Errorf("expected 1 failure, got %d", result.FailedCount)
	}

	if len(result.Errors) != 1 {
		t.Errorf("expected 1 error detail, got %d", len(result.Errors))
	}

	if len(result.Errors) > 0 {
		if result.Errors[0].Index != 2 {
			t.Errorf("expected error at index 2, got %d", result.Errors[0].Index)
		}
		if result.Errors[0].Address != "invalid" {
			t.Errorf("expected error for address 'invalid', got %s", result.Errors[0].Address)
		}
	}
}

// Test DeleteAddressListEntry
func TestDeleteAddressListEntry(t *testing.T) {
	service := NewAddressListService()

	mockPort := &MockRouterPort{
		executeFunc: func(ctx context.Context, cmd router.Command) (*router.CommandResult, error) {
			if cmd.Action == "remove" {
				return &router.CommandResult{}, nil
			}
			return &router.CommandResult{}, nil
		},
	}

	success, err := service.DeleteAddressListEntry(context.Background(), mockPort, "*100")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if !success {
		t.Errorf("expected deletion to succeed")
	}
}

// Test validation functions
func TestIsValidListName(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected bool
	}{
		{"valid alphanumeric", "test123", true},
		{"valid with underscore", "test_list", true},
		{"valid with hyphen", "test-list", true},
		{"invalid with space", "test list", false},
		{"invalid with special char", "test!", false},
		{"empty string", "", false},
		{"too long", string(make([]byte, 65)), false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := isValidListName(tt.input)
			if result != tt.expected {
				t.Errorf("expected %v for %s, got %v", tt.expected, tt.input, result)
			}
		})
	}
}

func TestIsValidAddress(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected bool
	}{
		{"valid IP", "192.168.1.1", true},
		{"valid CIDR", "192.168.1.0/24", true},
		{"valid range", "192.168.1.1-192.168.1.100", true},
		{"too short", "1.1.1", false},
		{"no dots", "invalid", false},
		{"empty string", "", false},
		{"too long", string(make([]byte, 101)), false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := isValidAddress(tt.input)
			if result != tt.expected {
				t.Errorf("expected %v for %s, got %v", tt.expected, tt.input, result)
			}
		})
	}
}

// Test parseAddressListEntry
func TestParseAddressListEntry(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected *AddressListEntry
	}{
		{
			name:  "basic entry",
			input: `.id=*1 list=test address=192.168.1.1 dynamic=false disabled=false`,
			expected: &AddressListEntry{
				ID:       "*1",
				List:     "test",
				Address:  "192.168.1.1",
				Dynamic:  false,
				Disabled: false,
			},
		},
		{
			name:  "entry with comment",
			input: `.id=*2 list=whitelist address=10.0.0.1 comment="Test comment" dynamic=false disabled=false`,
			expected: &AddressListEntry{
				ID:       "*2",
				List:     "whitelist",
				Address:  "10.0.0.1",
				Comment:  stringPtr("Test comment"),
				Dynamic:  false,
				Disabled: false,
			},
		},
		{
			name:     "invalid entry - no ID",
			input:    `list=test address=192.168.1.1`,
			expected: nil,
		},
		{
			name:     "invalid entry - no list",
			input:    `.id=*1 address=192.168.1.1`,
			expected: nil,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := parseAddressListEntry(tt.input)

			if tt.expected == nil {
				if result != nil {
					t.Errorf("expected nil, got %+v", result)
				}
				return
			}

			if result == nil {
				t.Fatalf("expected result, got nil")
			}

			if result.ID != tt.expected.ID {
				t.Errorf("expected ID %s, got %s", tt.expected.ID, result.ID)
			}

			if result.List != tt.expected.List {
				t.Errorf("expected List %s, got %s", tt.expected.List, result.List)
			}

			if result.Address != tt.expected.Address {
				t.Errorf("expected Address %s, got %s", tt.expected.Address, result.Address)
			}
		})
	}
}

// Helper functions

func stringPtr(s string) *string {
	return &s
}

func timePtr(t time.Time) *time.Time {
	return &t
}
