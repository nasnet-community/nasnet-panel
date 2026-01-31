// Package network provides network-related utilities including DNS resolution.
package network

import (
	"context"
	"net"
	"sync"
	"time"
)

// DNSResolver provides DNS resolution with caching.
// It resolves hostnames to IP addresses and caches results with TTL.
type DNSResolver struct {
	cache    map[string]*cacheEntry
	mu       sync.RWMutex
	ttl      time.Duration
	resolver *net.Resolver
}

// cacheEntry represents a cached DNS result.
type cacheEntry struct {
	ips       []net.IP
	expiresAt time.Time
	err       error
}

// DNSResolverConfig holds configuration for the DNS resolver.
type DNSResolverConfig struct {
	// TTL is the cache time-to-live. Defaults to 5 minutes.
	TTL time.Duration

	// Resolver is the underlying DNS resolver. If nil, uses net.DefaultResolver.
	Resolver *net.Resolver
}

// DNSResult represents the result of a DNS resolution.
type DNSResult struct {
	// IPs is the list of resolved IP addresses.
	IPs []net.IP

	// PreferredIP is the recommended IP to use (IPv4 preferred over IPv6).
	PreferredIP net.IP

	// FromCache indicates whether the result was served from cache.
	FromCache bool

	// ExpiresAt is when the cache entry expires.
	ExpiresAt time.Time
}

// NewDNSResolver creates a new DNS resolver with the given configuration.
func NewDNSResolver(cfg DNSResolverConfig) *DNSResolver {
	ttl := cfg.TTL
	if ttl == 0 {
		ttl = 5 * time.Minute
	}

	resolver := cfg.Resolver
	if resolver == nil {
		resolver = net.DefaultResolver
	}

	return &DNSResolver{
		cache:    make(map[string]*cacheEntry),
		ttl:      ttl,
		resolver: resolver,
	}
}

// Resolve resolves a hostname to IP addresses.
// Returns cached results if available and not expired.
// Prefers IPv4 addresses over IPv6 when both are available.
func (r *DNSResolver) Resolve(ctx context.Context, hostname string) (*DNSResult, error) {
	// Check if input is already an IP address
	if ip := net.ParseIP(hostname); ip != nil {
		return &DNSResult{
			IPs:         []net.IP{ip},
			PreferredIP: ip,
			FromCache:   false,
		}, nil
	}

	// Check cache first
	r.mu.RLock()
	entry, found := r.cache[hostname]
	r.mu.RUnlock()

	if found && time.Now().Before(entry.expiresAt) {
		if entry.err != nil {
			return nil, entry.err
		}
		return &DNSResult{
			IPs:         entry.ips,
			PreferredIP: preferIPv4(entry.ips),
			FromCache:   true,
			ExpiresAt:   entry.expiresAt,
		}, nil
	}

	// Resolve hostname
	ips, err := r.resolver.LookupIP(ctx, "ip", hostname)
	if err != nil {
		// Cache negative results with shorter TTL
		r.mu.Lock()
		r.cache[hostname] = &cacheEntry{
			err:       err,
			expiresAt: time.Now().Add(r.ttl / 5), // Negative cache: 1 minute
		}
		r.mu.Unlock()
		return nil, &DNSError{
			Hostname: hostname,
			Cause:    err,
		}
	}

	// Cache positive results
	expiresAt := time.Now().Add(r.ttl)
	r.mu.Lock()
	r.cache[hostname] = &cacheEntry{
		ips:       ips,
		expiresAt: expiresAt,
	}
	r.mu.Unlock()

	return &DNSResult{
		IPs:         ips,
		PreferredIP: preferIPv4(ips),
		FromCache:   false,
		ExpiresAt:   expiresAt,
	}, nil
}

// ResolveToString resolves a hostname and returns the preferred IP as a string.
// This is a convenience method for cases where only the IP string is needed.
func (r *DNSResolver) ResolveToString(ctx context.Context, hostname string) (string, error) {
	result, err := r.Resolve(ctx, hostname)
	if err != nil {
		return "", err
	}
	return result.PreferredIP.String(), nil
}

// ClearCache removes all entries from the cache.
func (r *DNSResolver) ClearCache() {
	r.mu.Lock()
	r.cache = make(map[string]*cacheEntry)
	r.mu.Unlock()
}

// ClearCacheEntry removes a specific entry from the cache.
func (r *DNSResolver) ClearCacheEntry(hostname string) {
	r.mu.Lock()
	delete(r.cache, hostname)
	r.mu.Unlock()
}

// CacheSize returns the number of entries in the cache.
func (r *DNSResolver) CacheSize() int {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return len(r.cache)
}

// preferIPv4 returns the first IPv4 address from a list of IPs,
// or the first IPv6 address if no IPv4 is available.
func preferIPv4(ips []net.IP) net.IP {
	if len(ips) == 0 {
		return nil
	}

	// First pass: look for IPv4
	for _, ip := range ips {
		if ip4 := ip.To4(); ip4 != nil {
			return ip4
		}
	}

	// Second pass: return first IPv6
	return ips[0]
}

// IsValidHostname checks if a string is a valid hostname (RFC 1123).
func IsValidHostname(hostname string) bool {
	if len(hostname) == 0 || len(hostname) > 253 {
		return false
	}

	// Check each label
	labels := splitHostname(hostname)
	for _, label := range labels {
		if !isValidLabel(label) {
			return false
		}
	}

	return true
}

// IsValidIP checks if a string is a valid IPv4 or IPv6 address.
func IsValidIP(s string) bool {
	return net.ParseIP(s) != nil
}

// IsValidIPv4 checks if a string is a valid IPv4 address.
func IsValidIPv4(s string) bool {
	ip := net.ParseIP(s)
	return ip != nil && ip.To4() != nil
}

// IsValidIPv6 checks if a string is a valid IPv6 address.
func IsValidIPv6(s string) bool {
	ip := net.ParseIP(s)
	return ip != nil && ip.To4() == nil
}

// splitHostname splits a hostname into labels by '.'.
func splitHostname(hostname string) []string {
	if len(hostname) == 0 {
		return nil
	}

	var labels []string
	start := 0
	for i := 0; i < len(hostname); i++ {
		if hostname[i] == '.' {
			labels = append(labels, hostname[start:i])
			start = i + 1
		}
	}
	labels = append(labels, hostname[start:])
	return labels
}

// isValidLabel checks if a hostname label is valid per RFC 1123.
func isValidLabel(label string) bool {
	if len(label) == 0 || len(label) > 63 {
		return false
	}

	// Must start with alphanumeric
	if !isAlphaNumeric(label[0]) {
		return false
	}

	// Must end with alphanumeric
	if !isAlphaNumeric(label[len(label)-1]) {
		return false
	}

	// Middle characters can be alphanumeric or hyphen
	for i := 1; i < len(label)-1; i++ {
		c := label[i]
		if !isAlphaNumeric(c) && c != '-' {
			return false
		}
	}

	return true
}

// isAlphaNumeric checks if a byte is alphanumeric.
func isAlphaNumeric(c byte) bool {
	return (c >= 'a' && c <= 'z') ||
		(c >= 'A' && c <= 'Z') ||
		(c >= '0' && c <= '9')
}

// DNSError represents a DNS resolution error.
type DNSError struct {
	Hostname string
	Cause    error
}

// Error implements the error interface.
func (e *DNSError) Error() string {
	return "DNS resolution failed for " + e.Hostname + ": " + e.Cause.Error()
}

// Unwrap returns the underlying error.
func (e *DNSError) Unwrap() error {
	return e.Cause
}
