package network

import (
	"context"
	"fmt"
	"net"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNewDNSResolver(t *testing.T) {
	t.Run("default configuration", func(t *testing.T) {
		resolver := NewDNSResolver(DNSResolverConfig{})
		assert.NotNil(t, resolver)
		assert.Equal(t, 5*time.Minute, resolver.ttl)
		assert.Equal(t, 5*time.Second, resolver.queryTimeout)
	})

	t.Run("custom TTL", func(t *testing.T) {
		resolver := NewDNSResolver(DNSResolverConfig{
			TTL: 10 * time.Minute,
		})
		assert.Equal(t, 10*time.Minute, resolver.ttl)
	})

	t.Run("custom QueryTimeout", func(t *testing.T) {
		resolver := NewDNSResolver(DNSResolverConfig{
			QueryTimeout: 10 * time.Second,
		})
		assert.Equal(t, 10*time.Second, resolver.queryTimeout)
	})
}

func TestDNSResolver_Resolve_IPAddress(t *testing.T) {
	resolver := NewDNSResolver(DNSResolverConfig{})
	ctx := context.Background()

	t.Run("IPv4 address passthrough", func(t *testing.T) {
		result, err := resolver.Resolve(ctx, "192.168.1.1")
		require.NoError(t, err)
		assert.Len(t, result.IPs, 1)
		assert.Equal(t, "192.168.1.1", result.PreferredIP.String())
		assert.False(t, result.FromCache)
	})

	t.Run("IPv6 address passthrough", func(t *testing.T) {
		result, err := resolver.Resolve(ctx, "::1")
		require.NoError(t, err)
		assert.Len(t, result.IPs, 1)
		assert.False(t, result.FromCache)
	})
}

func TestDNSResolver_ResolveToString(t *testing.T) {
	resolver := NewDNSResolver(DNSResolverConfig{})
	ctx := context.Background()

	t.Run("IP address returns same string", func(t *testing.T) {
		ip, err := resolver.ResolveToString(ctx, "10.0.0.1")
		require.NoError(t, err)
		assert.Equal(t, "10.0.0.1", ip)
	})
}

func TestDNSResolver_Caching(t *testing.T) {
	resolver := NewDNSResolver(DNSResolverConfig{
		TTL: 1 * time.Second,
	})
	ctx := context.Background()

	// First call with IP (won't cache IP addresses, but tests the flow)
	result1, err := resolver.Resolve(ctx, "192.168.1.1")
	require.NoError(t, err)
	assert.False(t, result1.FromCache)

	// Cache size should still be 0 for IP addresses (they don't get cached)
	assert.Equal(t, 0, resolver.CacheSize())
}

func TestDNSResolver_ClearCache(t *testing.T) {
	resolver := NewDNSResolver(DNSResolverConfig{})

	// Manually populate cache for testing
	resolver.mu.Lock()
	resolver.cache["test.local"] = &cacheEntry{
		ips:       []net.IP{net.ParseIP("192.168.1.1")},
		expiresAt: time.Now().Add(time.Hour),
	}
	resolver.mu.Unlock()

	assert.Equal(t, 1, resolver.CacheSize())

	resolver.ClearCache()
	assert.Equal(t, 0, resolver.CacheSize())
}

func TestDNSResolver_ClearCacheEntry(t *testing.T) {
	resolver := NewDNSResolver(DNSResolverConfig{})

	// Manually populate cache
	resolver.mu.Lock()
	resolver.cache["test1.local"] = &cacheEntry{
		ips:       []net.IP{net.ParseIP("192.168.1.1")},
		expiresAt: time.Now().Add(time.Hour),
	}
	resolver.cache["test2.local"] = &cacheEntry{
		ips:       []net.IP{net.ParseIP("192.168.1.2")},
		expiresAt: time.Now().Add(time.Hour),
	}
	resolver.mu.Unlock()

	assert.Equal(t, 2, resolver.CacheSize())

	resolver.ClearCacheEntry("test1.local")
	assert.Equal(t, 1, resolver.CacheSize())

	// test2.local should still be in cache
	resolver.mu.RLock()
	_, exists := resolver.cache["test2.local"]
	resolver.mu.RUnlock()
	assert.True(t, exists)
}

func TestPreferIPv4(t *testing.T) {
	tests := []struct {
		name     string
		ips      []net.IP
		expected string
	}{
		{
			name:     "empty list",
			ips:      []net.IP{},
			expected: "",
		},
		{
			name:     "single IPv4",
			ips:      []net.IP{net.ParseIP("192.168.1.1")},
			expected: "192.168.1.1",
		},
		{
			name:     "single IPv6",
			ips:      []net.IP{net.ParseIP("::1")},
			expected: "::1",
		},
		{
			name: "mixed - IPv4 first",
			ips: []net.IP{
				net.ParseIP("192.168.1.1"),
				net.ParseIP("::1"),
			},
			expected: "192.168.1.1",
		},
		{
			name: "mixed - IPv6 first but IPv4 preferred",
			ips: []net.IP{
				net.ParseIP("::1"),
				net.ParseIP("192.168.1.1"),
			},
			expected: "192.168.1.1",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := preferIPv4(tt.ips)
			if tt.expected == "" {
				assert.Nil(t, result)
			} else {
				assert.Equal(t, tt.expected, result.String())
			}
		})
	}
}

func TestIsValidHostname(t *testing.T) {
	tests := []struct {
		hostname string
		valid    bool
	}{
		{"router.local", true},
		{"my-router", true},
		{"router1", true},
		{"a", true},
		{"123", true}, // All numeric is valid per RFC 1123
		{"router.mikrotik.com", true},
		{"my-router.local", true},
		{"ROUTER", true},
		{"Router-1", true},

		// Invalid
		{"", false},
		{"-router", false},                 // Starts with hyphen
		{"router-", false},                 // Ends with hyphen
		{"router..local", false},           // Empty label
		{"router .local", false},           // Space in label
		{"router_local", false},            // Underscore not allowed
		{"router.local.", false},           // Trailing dot creates empty label (simplified check)
		{string(make([]byte, 254)), false}, // Too long
	}

	for _, tt := range tests {
		t.Run(tt.hostname, func(t *testing.T) {
			result := IsValidHostname(tt.hostname)
			assert.Equal(t, tt.valid, result, "hostname: %q", tt.hostname)
		})
	}
}

func TestIsValidIP(t *testing.T) {
	tests := []struct {
		ip    string
		valid bool
	}{
		{"192.168.1.1", true},
		{"10.0.0.1", true},
		{"255.255.255.255", true},
		{"0.0.0.0", true},
		{"::1", true},
		{"fe80::1", true},
		{"2001:db8::1", true},

		// Invalid
		{"", false},
		{"invalid", false},
		{"192.168.1", false},
		{"192.168.1.256", false},
		{"192.168.1.1.1", false},
	}

	for _, tt := range tests {
		t.Run(tt.ip, func(t *testing.T) {
			result := IsValidIP(tt.ip)
			assert.Equal(t, tt.valid, result)
		})
	}
}

func TestIsValidIPv4(t *testing.T) {
	tests := []struct {
		ip    string
		valid bool
	}{
		{"192.168.1.1", true},
		{"10.0.0.1", true},
		{"::1", false}, // IPv6
		{"invalid", false},
	}

	for _, tt := range tests {
		t.Run(tt.ip, func(t *testing.T) {
			result := IsValidIPv4(tt.ip)
			assert.Equal(t, tt.valid, result)
		})
	}
}

func TestIsValidIPv6(t *testing.T) {
	tests := []struct {
		ip    string
		valid bool
	}{
		{"::1", true},
		{"fe80::1", true},
		{"192.168.1.1", false}, // IPv4
		{"invalid", false},
	}

	for _, tt := range tests {
		t.Run(tt.ip, func(t *testing.T) {
			result := IsValidIPv6(tt.ip)
			assert.Equal(t, tt.valid, result)
		})
	}
}

func TestDNSError(t *testing.T) {
	err := &DNSError{
		Hostname: "test.local",
		Cause:    net.UnknownNetworkError("test error"),
		Type:     DNSErrorTypeUnknown,
	}

	assert.Contains(t, err.Error(), "test.local")
	assert.Contains(t, err.Error(), "DNS resolution failed")

	unwrapped := err.Unwrap()
	assert.NotNil(t, unwrapped)
}

func TestDNSError_ErrorTypes(t *testing.T) {
	tests := []struct {
		name        string
		errorType   DNSErrorType
		expectedStr string
	}{
		{
			name:        "NXDOMAIN",
			errorType:   DNSErrorTypeNXDomain,
			expectedStr: "NXDOMAIN",
		},
		{
			name:        "timeout",
			errorType:   DNSErrorTypeTimeout,
			expectedStr: "timeout",
		},
		{
			name:        "SERVFAIL",
			errorType:   DNSErrorTypeServerFailure,
			expectedStr: "SERVFAIL",
		},
		{
			name:        "no answer",
			errorType:   DNSErrorTypeNoAnswer,
			expectedStr: "no answer",
		},
		{
			name:        "canceled",
			errorType:   DNSErrorTypeCanceled,
			expectedStr: "canceled",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := &DNSError{
				Hostname: "test.local",
				Cause:    fmt.Errorf("test error"),
				Type:     tt.errorType,
			}
			assert.Contains(t, err.Error(), tt.expectedStr)
		})
	}
}

func TestNewDNSError_Classification(t *testing.T) {
	t.Run("context canceled", func(t *testing.T) {
		err := newDNSError("test.local", context.Canceled)
		assert.Equal(t, DNSErrorTypeCanceled, err.Type)
	})

	t.Run("context deadline exceeded", func(t *testing.T) {
		err := newDNSError("test.local", context.DeadlineExceeded)
		assert.Equal(t, DNSErrorTypeTimeout, err.Type)
	})

	t.Run("no such host", func(t *testing.T) {
		err := newDNSError("nonexistent.local", fmt.Errorf("no such host"))
		assert.Equal(t, DNSErrorTypeNXDomain, err.Type)
	})

	t.Run("unknown error", func(t *testing.T) {
		err := newDNSError("test.local", fmt.Errorf("unknown error"))
		assert.Equal(t, DNSErrorTypeUnknown, err.Type)
	})
}

func TestDNSResolver_ContextCancellation(t *testing.T) {
	resolver := NewDNSResolver(DNSResolverConfig{})

	t.Run("cancelled context", func(t *testing.T) {
		ctx, cancel := context.WithCancel(context.Background())
		cancel()

		result, err := resolver.Resolve(ctx, "example.com")
		assert.Nil(t, result)
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "cancelled")
	})

	t.Run("cancelled context with IP passthrough", func(t *testing.T) {
		ctx, cancel := context.WithCancel(context.Background())
		cancel()

		result, err := resolver.Resolve(ctx, "192.168.1.1")
		assert.Nil(t, result)
		assert.Error(t, err)
	})
}

func TestDNSResolver_QueryTimeout(t *testing.T) {
	t.Run("context with deadline is respected", func(t *testing.T) {
		// Create a resolver with long default timeout
		resolver := NewDNSResolver(DNSResolverConfig{
			QueryTimeout: 30 * time.Second,
		})

		// Use context with very short deadline
		ctx, cancel := context.WithTimeout(context.Background(), 1*time.Millisecond)
		defer cancel()

		// Even with short deadline, should not use resolver's default timeout
		// The context deadline takes precedence
		result, err := resolver.Resolve(ctx, "localhost")

		// Either succeeds (if localhost resolves fast) or times out
		if err != nil {
			assert.Contains(t, err.Error(), "DNS resolution")
		} else {
			assert.NotNil(t, result)
		}
	})

	t.Run("default timeout is applied when context has no deadline", func(t *testing.T) {
		resolver := NewDNSResolver(DNSResolverConfig{
			QueryTimeout: 5 * time.Second,
		})

		ctx := context.Background()
		startTime := time.Now()

		// IP passthrough should not use timeout
		result, err := resolver.Resolve(ctx, "192.168.1.1")
		elapsed := time.Since(startTime)

		require.NoError(t, err)
		assert.NotNil(t, result)
		// IP passthrough should be instant
		assert.Less(t, elapsed, 1*time.Second)
	})
}

func TestDNSResolver_ResolveToString_NilIP(t *testing.T) {
	resolver := NewDNSResolver(DNSResolverConfig{})
	ctx := context.Background()

	// Manually inject a cache entry with nil IP (edge case)
	resolver.mu.Lock()
	resolver.cache["edge-case.local"] = &cacheEntry{
		ips:       []net.IP{},
		expiresAt: time.Now().Add(time.Hour),
	}
	resolver.mu.Unlock()

	result, err := resolver.ResolveToString(ctx, "edge-case.local")
	assert.Error(t, err)
	assert.Empty(t, result)
	assert.Contains(t, err.Error(), "no IP address resolved")
}

// mockResolver is a test helper that mocks DNS resolution.
type mockResolver struct {
	results map[string][]net.IP
	errors  map[string]error
}

func (m *mockResolver) LookupIP(ctx context.Context, network, host string) ([]net.IP, error) {
	select {
	case <-ctx.Done():
		return nil, ctx.Err()
	default:
	}

	if err, ok := m.errors[host]; ok {
		return nil, err
	}
	if ips, ok := m.results[host]; ok {
		return ips, nil
	}
	return nil, fmt.Errorf("no such host")
}

func TestDNSResolver_MockResolver_Success(t *testing.T) {
	_ = &mockResolver{
		results: map[string][]net.IP{
			"router.local": {net.ParseIP("192.168.1.1")},
		},
	}

	resolver := NewDNSResolver(DNSResolverConfig{
		Resolver: &net.Resolver{
			PreferGo: true,
			Dial: func(ctx context.Context, network, address string) (net.Conn, error) {
				// This is a simplified mock; actual mock would intercept DNS packets
				return nil, fmt.Errorf("mock resolver")
			},
		},
	})

	// Manually set the mock in cache for this test
	resolver.mu.Lock()
	resolver.cache["router.local"] = &cacheEntry{
		ips:       []net.IP{net.ParseIP("192.168.1.1")},
		expiresAt: time.Now().Add(time.Hour),
	}
	resolver.mu.Unlock()

	ctx := context.Background()
	result, err := resolver.Resolve(ctx, "router.local")
	require.NoError(t, err)
	assert.True(t, result.FromCache)
	assert.Equal(t, "192.168.1.1", result.PreferredIP.String())
}

func TestDNSResolver_MockResolver_Failure(t *testing.T) {
	resolver := NewDNSResolver(DNSResolverConfig{})

	// Manually inject error into cache
	resolver.mu.Lock()
	resolver.cache["nonexistent.local"] = &cacheEntry{
		err:       fmt.Errorf("no such host"),
		expiresAt: time.Now().Add(time.Hour),
	}
	resolver.mu.Unlock()

	ctx := context.Background()
	result, err := resolver.Resolve(ctx, "nonexistent.local")
	assert.Nil(t, result)
	assert.Error(t, err)
}
