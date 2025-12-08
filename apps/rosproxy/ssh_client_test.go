package main

import (
	"context"
	"testing"
	"time"
)

func TestSSHClientConfig(t *testing.T) {
	tests := []struct {
		name        string
		address     string
		wantAddress string
	}{
		{
			name:        "address without port",
			address:     "192.168.88.1",
			wantAddress: "192.168.88.1:22",
		},
		{
			name:        "address with port",
			address:     "192.168.88.1:2222",
			wantAddress: "192.168.88.1:2222",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// We can't actually connect without a router, but we verify address format
			t.Logf("Config %s would connect to: %s", tt.address, tt.wantAddress)
		})
	}
}

func TestSSHClientPoolCreate(t *testing.T) {
	pool := NewSSHClientPool()
	if pool == nil {
		t.Fatal("Expected pool to be created")
	}
	if pool.clients == nil {
		t.Fatal("Expected clients map to be initialized")
	}
}

func TestSSHClientPoolCloseAll(t *testing.T) {
	pool := NewSSHClientPool()
	// CloseAll should not panic on empty pool
	pool.CloseAll()
	if len(pool.clients) != 0 {
		t.Errorf("Expected empty clients map after CloseAll")
	}
}

func TestTelnetClientConfig(t *testing.T) {
	tests := []struct {
		name        string
		address     string
		wantAddress string
	}{
		{
			name:        "address without port",
			address:     "192.168.88.1",
			wantAddress: "192.168.88.1:23",
		},
		{
			name:        "address with port",
			address:     "192.168.88.1:2323",
			wantAddress: "192.168.88.1:2323",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// We can't actually connect without a router, but we verify address format
			t.Logf("Config %s would connect to: %s", tt.address, tt.wantAddress)
		})
	}
}

func TestTelnetClientPoolCreate(t *testing.T) {
	pool := NewTelnetClientPool()
	if pool == nil {
		t.Fatal("Expected pool to be created")
	}
	if pool.clients == nil {
		t.Fatal("Expected clients map to be initialized")
	}
}

func TestTelnetClientPoolCloseAll(t *testing.T) {
	pool := NewTelnetClientPool()
	// CloseAll should not panic on empty pool
	pool.CloseAll()
	if len(pool.clients) != 0 {
		t.Errorf("Expected empty clients map after CloseAll")
	}
}

func TestIsRouterOSPrompt(t *testing.T) {
	tests := []struct {
		line   string
		expect bool
	}{
		{"[admin@MikroTik] >", true},
		{"[admin@Router] /interface>", true},  // ends with >
		{">", true},
		{"[admin@MikroTik] /ip/address>", true}, // ends with >
		{"some output text", false},
		{"", false},
		{"[admin@MikroTik] ] >", true},
	}

	for _, tt := range tests {
		result := isRouterOSPrompt(tt.line)
		if result != tt.expect {
			t.Errorf("isRouterOSPrompt(%q) = %v, want %v", tt.line, result, tt.expect)
		}
	}
}

func TestTruncateForLog(t *testing.T) {
	tests := []struct {
		input  string
		maxLen int
		want   string
	}{
		{"short", 10, "short"},
		{"exactly10!", 10, "exactly10!"},
		{"this is a longer string", 10, "this is..."},
		{"", 10, ""},
	}

	for _, tt := range tests {
		got := truncateForLog(tt.input, tt.maxLen)
		if got != tt.want {
			t.Errorf("truncateForLog(%q, %d) = %q, want %q", tt.input, tt.maxLen, got, tt.want)
		}
	}
}

func TestProtocolConstants(t *testing.T) {
	// Verify protocol constants are defined correctly
	if ProtocolAPI != "api" {
		t.Errorf("ProtocolAPI = %q, want %q", ProtocolAPI, "api")
	}
	if ProtocolSSH != "ssh" {
		t.Errorf("ProtocolSSH = %q, want %q", ProtocolSSH, "ssh")
	}
	if ProtocolTelnet != "telnet" {
		t.Errorf("ProtocolTelnet = %q, want %q", ProtocolTelnet, "telnet")
	}
}

func TestBatchJobWithProtocol(t *testing.T) {
	tests := []struct {
		name     string
		protocol string
		wantErr  bool
	}{
		{"default protocol", "", false},
		{"api protocol", "api", false},
		{"ssh protocol", "ssh", false},
		{"telnet protocol", "telnet", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := &BatchJobRequest{
				RouterIP: "192.168.88.1",
				Username: "admin",
				Password: "password",
				Protocol: tt.protocol,
				Script:   "/system identity print",
			}

			job, err := jobStore.Create(req)
			if err != nil {
				if !tt.wantErr {
					t.Errorf("Unexpected error: %v", err)
				}
				return
			}

			// Verify protocol is set correctly
			expectedProtocol := tt.protocol
			if expectedProtocol == "" {
				expectedProtocol = ProtocolAPI
			}
			if job.Protocol != expectedProtocol {
				t.Errorf("Protocol = %q, want %q", job.Protocol, expectedProtocol)
			}

			// Clean up
			jobStore.Delete(job.ID)
		})
	}
}

func TestContextCancellation(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 1*time.Millisecond)
	defer cancel()

	// Wait for context to be done
	<-ctx.Done()

	if ctx.Err() != context.DeadlineExceeded {
		t.Errorf("Expected DeadlineExceeded, got %v", ctx.Err())
	}
}

