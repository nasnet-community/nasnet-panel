package dns

import (
	"testing"
)

func TestParseRouterOSCacheStats(t *testing.T) {
	tests := []struct {
		name            string
		input           string
		expectedMax     int64
		expectedUsed    int64
		expectedPercent float64
		expectEntries   bool
	}{
		{
			name: "Normal cache stats",
			input: `cache-size: 2048KiB
cache-used: 1024KiB
servers: 8.8.8.8`,
			expectedMax:     2048 * 1024,
			expectedUsed:    1024 * 1024,
			expectedPercent: 50.0,
			expectEntries:   true,
		},
		{
			name: "Full cache",
			input: `cache-size: 2048KiB
cache-used: 2048KiB`,
			expectedMax:     2048 * 1024,
			expectedUsed:    2048 * 1024,
			expectedPercent: 100.0,
			expectEntries:   true,
		},
		{
			name: "Empty cache",
			input: `cache-size: 2048KiB
cache-used: 0KiB`,
			expectedMax:     2048 * 1024,
			expectedUsed:    0,
			expectedPercent: 0.0,
			expectEntries:   false,
		},
		{
			name: "Large cache",
			input: `cache-size: 10240KiB
cache-used: 5120KiB`,
			expectedMax:     10240 * 1024,
			expectedUsed:    5120 * 1024,
			expectedPercent: 50.0,
			expectEntries:   true,
		},
		{
			name: "Minimal cache",
			input: `cache-size: 512KiB
cache-used: 128KiB`,
			expectedMax:     512 * 1024,
			expectedUsed:    128 * 1024,
			expectedPercent: 25.0,
			expectEntries:   true,
		},
		{
			name:            "Missing cache-used field",
			input:           `cache-size: 2048KiB`,
			expectedMax:     2048 * 1024,
			expectedUsed:    0,
			expectedPercent: 0.0,
			expectEntries:   false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			stats := parseRouterOSCacheStats(tt.input)

			if stats.CacheMaxBytes != tt.expectedMax {
				t.Errorf("CacheMaxBytes: expected %d, got %d", tt.expectedMax, stats.CacheMaxBytes)
			}

			if stats.CacheUsedBytes != tt.expectedUsed {
				t.Errorf("CacheUsedBytes: expected %d, got %d", tt.expectedUsed, stats.CacheUsedBytes)
			}

			if stats.CacheUsagePercent != tt.expectedPercent {
				t.Errorf("CacheUsagePercent: expected %.2f, got %.2f", tt.expectedPercent, stats.CacheUsagePercent)
			}

			// Verify total entries estimation
			if tt.expectEntries && stats.TotalEntries == 0 {
				t.Error("Expected TotalEntries > 0 when cache is used")
			}

			if !tt.expectEntries && stats.TotalEntries != 0 {
				t.Errorf("Expected TotalEntries == 0, got %d", stats.TotalEntries)
			}
		})
	}
}

func TestSortBenchmarkResults(t *testing.T) {
	tests := []struct {
		name            string
		input           []BenchmarkServerResult
		expected        []string // Expected server order
		expectReachable int      // Expected count of reachable servers before unreachable
	}{
		{
			name: "All reachable, sorted by response time",
			input: []BenchmarkServerResult{
				{Server: "8.8.8.8", ResponseTimeMs: 50, Success: true},
				{Server: "1.1.1.1", ResponseTimeMs: 20, Success: true},
				{Server: "9.9.9.9", ResponseTimeMs: 100, Success: true},
			},
			expected:        []string{"1.1.1.1", "8.8.8.8", "9.9.9.9"},
			expectReachable: 3,
		},
		{
			name: "Mix of reachable and unreachable",
			input: []BenchmarkServerResult{
				{Server: "8.8.8.8", ResponseTimeMs: 50, Success: true},
				{Server: "1.2.3.4", ResponseTimeMs: -1, Success: false},
				{Server: "1.1.1.1", ResponseTimeMs: 20, Success: true},
			},
			expected:        []string{"1.1.1.1", "8.8.8.8", "1.2.3.4"},
			expectReachable: 2,
		},
		{
			name: "All unreachable",
			input: []BenchmarkServerResult{
				{Server: "1.2.3.4", ResponseTimeMs: -1, Success: false},
				{Server: "5.6.7.8", ResponseTimeMs: -1, Success: false},
			},
			expected:        []string{"1.2.3.4", "5.6.7.8"},
			expectReachable: 0,
		},
		{
			name: "Single fast, single slow, one unreachable",
			input: []BenchmarkServerResult{
				{Server: "slow.server", ResponseTimeMs: 200, Success: true},
				{Server: "unreachable.server", ResponseTimeMs: -1, Success: false},
				{Server: "fast.server", ResponseTimeMs: 10, Success: true},
			},
			expected:        []string{"fast.server", "slow.server", "unreachable.server"},
			expectReachable: 2,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			results := make([]BenchmarkServerResult, len(tt.input))
			copy(results, tt.input)

			sortBenchmarkResults(results)

			for i, expectedServer := range tt.expected {
				if results[i].Server != expectedServer {
					t.Errorf("Position %d: expected server %s, got %s", i, expectedServer, results[i].Server)
				}
			}

			// Verify reachable servers come before unreachable
			for i := 0; i < tt.expectReachable; i++ {
				if results[i].ResponseTimeMs < 0 {
					t.Errorf("Position %d: expected reachable server, got unreachable", i)
				}
			}
			for i := tt.expectReachable; i < len(results); i++ {
				if results[i].ResponseTimeMs >= 0 {
					t.Errorf("Position %d: expected unreachable server, got reachable with time %d", i, results[i].ResponseTimeMs)
				}
			}
		})
	}
}

// TestParseRouterOSServers_EdgeCases tests edge cases in DNS server parsing
func TestParseRouterOSServers_EdgeCases(t *testing.T) {
	tests := []struct {
		name              string
		input             string
		expectedPrimary   string
		expectedSecondary *string
		expectedCount     int
	}{
		{
			name:            "Two servers",
			input:           `servers: 8.8.8.8,1.1.1.1`,
			expectedPrimary: "8.8.8.8",
			expectedSecondary: func() *string {
				s := "1.1.1.1"
				return &s
			}(),
			expectedCount: 2,
		},
		{
			name:              "Single server",
			input:             `servers: 8.8.8.8`,
			expectedPrimary:   "8.8.8.8",
			expectedSecondary: nil,
			expectedCount:     1,
		},
		{
			name:            "Three servers",
			input:           `servers: 8.8.8.8,1.1.1.1,9.9.9.9`,
			expectedPrimary: "8.8.8.8",
			expectedSecondary: func() *string {
				s := "1.1.1.1"
				return &s
			}(),
			expectedCount: 3,
		},
		{
			name:            "IPv6 servers",
			input:           `servers: 2001:4860:4860::8888,2606:4700:4700::1111`,
			expectedPrimary: "2001:4860:4860::8888",
			expectedSecondary: func() *string {
				s := "2606:4700:4700::1111"
				return &s
			}(),
			expectedCount: 2,
		},
		{
			name:            "Mixed IPv4 and IPv6",
			input:           `servers: 8.8.8.8,2001:4860:4860::8888`,
			expectedPrimary: "8.8.8.8",
			expectedSecondary: func() *string {
				s := "2001:4860:4860::8888"
				return &s
			}(),
			expectedCount: 2,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			servers := parseRouterOSServers(tt.input)

			if servers.Primary != tt.expectedPrimary {
				t.Errorf("Primary: expected %s, got %s", tt.expectedPrimary, servers.Primary)
			}

			if tt.expectedSecondary == nil && servers.Secondary != nil {
				t.Errorf("Secondary: expected nil, got %s", *servers.Secondary)
			} else if tt.expectedSecondary != nil && servers.Secondary == nil {
				t.Error("Secondary: expected value, got nil")
			} else if tt.expectedSecondary != nil && servers.Secondary != nil && *servers.Secondary != *tt.expectedSecondary {
				t.Errorf("Secondary: expected %s, got %s", *tt.expectedSecondary, *servers.Secondary)
			}

			if len(servers.Servers) != tt.expectedCount {
				t.Errorf("Server count: expected %d, got %d", tt.expectedCount, len(servers.Servers))
			}

			// Verify primary/secondary flags
			if tt.expectedCount > 0 && !servers.Servers[0].IsPrimary {
				t.Error("First server should be marked as primary")
			}

			if tt.expectedCount > 1 && !servers.Servers[1].IsSecondary {
				t.Error("Second server should be marked as secondary")
			}

			// Verify tertiary and beyond servers are not marked special
			for i := 2; i < tt.expectedCount; i++ {
				if servers.Servers[i].IsPrimary || servers.Servers[i].IsSecondary {
					t.Errorf("Server %d should not be marked as primary or secondary", i)
				}
			}
		})
	}
}
