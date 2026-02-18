package dns

import (
	"context"
	"testing"

	"backend/internal/router"
)

// mockRouterPort implements RouterPort for testing
type mockRouterPort struct {
	responses map[string]string
	errors    map[string]error
}

func newMockRouterPort() *mockRouterPort {
	return &mockRouterPort{
		responses: make(map[string]string),
		errors:    make(map[string]error),
	}
}

func (m *mockRouterPort) setResponse(path string, output string) {
	m.responses[path] = output
}

func (m *mockRouterPort) setError(path string, err error) {
	m.errors[path] = err
}

// Implement RouterPort interface methods
func (m *mockRouterPort) Connect(_ context.Context) error {
	return nil
}

func (m *mockRouterPort) Disconnect() error {
	return nil
}

func (m *mockRouterPort) IsConnected() bool {
	return true
}

func (m *mockRouterPort) Health(_ context.Context) router.HealthStatus {
	return router.HealthStatus{}
}

func (m *mockRouterPort) Capabilities() router.PlatformCapabilities {
	return router.PlatformCapabilities{}
}

func (m *mockRouterPort) Info() (*router.RouterInfo, error) {
	return nil, nil
}

func (m *mockRouterPort) ExecuteCommand(_ context.Context, cmd router.Command) (*router.CommandResult, error) {
	if err, ok := m.errors[cmd.Path]; ok {
		return nil, err
	}
	if output, ok := m.responses[cmd.Path]; ok {
		return &router.CommandResult{
			Success:   true,
			RawOutput: output,
		}, nil
	}
	return &router.CommandResult{Success: true}, nil
}

func (m *mockRouterPort) QueryState(_ context.Context, query router.StateQuery) (*router.StateResult, error) {
	return nil, nil
}

func (m *mockRouterPort) Protocol() router.Protocol {
	return router.ProtocolREST
}

// TestService_PerformLookup_ARecord tests A record lookup
func TestService_PerformLookup_ARecord(t *testing.T) {
	port := newMockRouterPort()
	port.setResponse("/tool/dns-lookup", "name: google.com address: 142.250.185.46")
	port.setResponse("/ip/dns", "servers: 8.8.8.8")

	svc := NewService(port)

	input := &LookupInput{
		DeviceId:   "test-device",
		Hostname:   "google.com",
		RecordType: "A",
	}

	result, err := svc.PerformLookup(context.Background(), input)

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if result.Status != "SUCCESS" {
		t.Errorf("expected SUCCESS, got %s", result.Status)
	}

	if len(result.Records) == 0 {
		t.Error("expected at least one record")
	}

	if len(result.Records) > 0 && result.Records[0].Data != "142.250.185.46" {
		t.Errorf("expected address 142.250.185.46, got %s", result.Records[0].Data)
	}
}

// TestService_GetConfiguredServers tests DNS server retrieval
func TestService_GetConfiguredServers(t *testing.T) {
	port := newMockRouterPort()
	port.setResponse("/ip/dns", "servers: 8.8.8.8,1.1.1.1")

	svc := NewService(port)

	servers, err := svc.GetConfiguredServers(context.Background(), "test-device")

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if servers.Primary != "8.8.8.8" {
		t.Errorf("expected primary 8.8.8.8, got %s", servers.Primary)
	}

	if servers.Secondary == nil || *servers.Secondary != "1.1.1.1" {
		t.Error("expected secondary 1.1.1.1")
	}

	if len(servers.Servers) != 2 {
		t.Errorf("expected 2 servers, got %d", len(servers.Servers))
	}
}

// TestMapErrorToStatus tests error status mapping
func TestMapErrorToStatus(t *testing.T) {
	tests := []struct {
		name     string
		errMsg   string
		expected string
	}{
		{"NXDOMAIN", "no such host", "NXDOMAIN"},
		{"SERVFAIL", "server misbehaving", "SERVFAIL"},
		{"TIMEOUT", "deadline exceeded", "TIMEOUT"},
		{"REFUSED", "connection refused", "REFUSED"},
		{"NETWORK_ERROR", "some other error", "NETWORK_ERROR"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := &testError{msg: tt.errMsg}
			status := mapErrorToStatus(err)
			if status != tt.expected {
				t.Errorf("expected %s, got %s", tt.expected, status)
			}
		})
	}
}

// testError is a simple error type for testing
type testError struct {
	msg string
}

func (e *testError) Error() string {
	return e.msg
}

// TestParseRouterOSDnsResponse tests RouterOS DNS response parsing
func TestParseRouterOSDnsResponse(t *testing.T) {
	tests := []struct {
		name       string
		response   string
		recordType string
		wantCount  int
		wantError  bool
	}{
		{
			name:       "Single A record",
			response:   "name: google.com address: 142.250.185.46",
			recordType: "A",
			wantCount:  1,
			wantError:  false,
		},
		{
			name:       "Multiple A records",
			response:   "name: google.com address: 142.250.185.46\nname: google.com address: 142.250.185.78",
			recordType: "A",
			wantCount:  2,
			wantError:  false,
		},
		{
			name:       "No records found",
			response:   "",
			recordType: "A",
			wantCount:  0,
			wantError:  true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			records, err := parseRouterOSResponse(tt.response, tt.recordType)

			if tt.wantError {
				if err == nil {
					t.Error("expected error, got nil")
				}
				return
			}

			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}

			if len(records) != tt.wantCount {
				t.Errorf("expected %d records, got %d", tt.wantCount, len(records))
			}
		})
	}
}

// TestParseRouterOSServers tests DNS server parsing
func TestParseRouterOSServers(t *testing.T) {
	tests := []struct {
		name          string
		response      string
		wantPrimary   string
		wantSecondary *string
		wantCount     int
	}{
		{
			name:          "Two servers",
			response:      "servers: 8.8.8.8,1.1.1.1",
			wantPrimary:   "8.8.8.8",
			wantSecondary: stringPtr("1.1.1.1"),
			wantCount:     2,
		},
		{
			name:          "One server",
			response:      "servers: 8.8.8.8",
			wantPrimary:   "8.8.8.8",
			wantSecondary: nil,
			wantCount:     1,
		},
		{
			name:          "No servers",
			response:      "",
			wantPrimary:   "",
			wantSecondary: nil,
			wantCount:     0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := parseRouterOSServers(tt.response)

			if result.Primary != tt.wantPrimary {
				t.Errorf("expected primary %s, got %s", tt.wantPrimary, result.Primary)
			}

			if tt.wantSecondary == nil && result.Secondary != nil {
				t.Error("expected nil secondary, got non-nil")
			} else if tt.wantSecondary != nil {
				if result.Secondary == nil {
					t.Error("expected non-nil secondary, got nil")
				} else if *result.Secondary != *tt.wantSecondary {
					t.Errorf("expected secondary %s, got %s", *tt.wantSecondary, *result.Secondary)
				}
			}

			if len(result.Servers) != tt.wantCount {
				t.Errorf("expected %d servers, got %d", tt.wantCount, len(result.Servers))
			}
		})
	}
}

// Helper function to create string pointer
func stringPtr(s string) *string {
	return &s
}
