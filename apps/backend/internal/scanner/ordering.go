package scanner

import (
	"fmt"
	"net"
	"sort"
	"strings"
)

// OrderIPsForScan reorders IPs to prioritize likely router locations.
// Priority order:
// 1. Gateway IPs (.1, .254)
// 2. Common memorable addresses (.10, .100, .200)
// 3. Round numbers (.50)
// 4. Remaining IPs
func OrderIPsForScan(ips []string) []string {
	if len(ips) == 0 {
		return ips
	}

	// Parse and categorize IPs
	type ipEntry struct {
		ip       string
		priority int // Lower is higher priority
	}

	entries := make([]ipEntry, len(ips))
	for i, ip := range ips {
		entries[i] = ipEntry{
			ip:       ip,
			priority: calculateIPPriority(ip),
		}
	}

	// Sort by priority (lower = scanned first)
	sort.Slice(entries, func(i, j int) bool {
		return entries[i].priority < entries[j].priority
	})

	// Extract sorted IPs
	result := make([]string, len(entries))
	for i, e := range entries {
		result[i] = e.ip
	}

	return result
}

// calculateIPPriority returns a priority score for an IP (lower = higher priority).
func calculateIPPriority(ip string) int {
	parsedIP := net.ParseIP(ip)
	if parsedIP == nil {
		return 1000 // Invalid IPs have lowest priority
	}

	ipv4 := parsedIP.To4()
	if ipv4 == nil {
		return 1000 // Non-IPv4 have lowest priority
	}

	lastOctet := int(ipv4[3])

	// Priority 1: Gateway addresses
	if lastOctet == 1 {
		return 1
	}
	if lastOctet == 254 {
		return 2
	}

	// Priority 2: Common memorable addresses
	if lastOctet == 10 {
		return 10
	}
	if lastOctet == 100 {
		return 11
	}
	if lastOctet == 200 {
		return 12
	}
	if lastOctet == 50 {
		return 13
	}

	// Priority 3: Round numbers
	if lastOctet%10 == 0 {
		return 20 + lastOctet/10
	}

	// Priority 4: All others
	return 100 + lastOctet
}

// ParseIPRange parses CIDR notation, IP range, or single IP into individual IPs.
// Supports:
// - CIDR: "192.168.88.0/24"
// - Range: "192.168.1.1-192.168.1.100"
// - Single IP: "192.168.88.1"
//
//nolint:gocyclo // IP range parsing
func ParseIPRange(subnet string) ([]string, error) {
	var ips []string
	switch {
	case strings.Contains(subnet, "/"):
		// CIDR notation
		_, ipNet, err := net.ParseCIDR(subnet)
		if err != nil {
			return nil, fmt.Errorf("invalid CIDR notation: %w", err)
		}

		// Generate all usable IPs in CIDR range (skip network and broadcast)
		ip := make(net.IP, len(ipNet.IP))
		copy(ip, ipNet.IP.Mask(ipNet.Mask))
		incrementIP(ip)

		for ipNet.Contains(ip) {
			// Don't include broadcast address
			if isBroadcast(ip, ipNet) {
				break
			}
			ips = append(ips, ip.String())
			// Limit to prevent memory issues on large ranges (max /16 = 65536)
			if len(ips) > 65534 {
				break
			}
			incrementIP(ip)
		}
	case strings.Contains(subnet, "-"):
		// Range notation (e.g., 192.168.1.1-192.168.1.100)
		parts := strings.Split(subnet, "-")
		if len(parts) != 2 {
			return nil, fmt.Errorf("invalid IP range format: expected 'start-end'")
		}

		startIP := net.ParseIP(strings.TrimSpace(parts[0]))
		endIP := net.ParseIP(strings.TrimSpace(parts[1]))
		if startIP == nil || endIP == nil {
			return nil, fmt.Errorf("invalid IP addresses in range")
		}

		// Convert to 4-byte representation
		start := startIP.To4()
		end := endIP.To4()
		if start == nil || end == nil {
			return nil, fmt.Errorf("only IPv4 ranges supported")
		}

		// Generate IPs in range
		current := make(net.IP, 4)
		copy(current, start)

		for {
			ips = append(ips, current.String())
			if current.Equal(end) || len(ips) > 65534 {
				break
			}
			incrementIP(current)
		}
	default:
		// Single IP
		if net.ParseIP(subnet) == nil {
			return nil, fmt.Errorf("invalid IP format: %s", subnet)
		}
		ips = append(ips, subnet)
	}

	return ips, nil
}

// GenerateGatewayIPs generates common gateway IPs (192.168.0-255.1).
func GenerateGatewayIPs() []string {
	ips := make([]string, 256)
	for i := 0; i <= 255; i++ {
		ips[i] = fmt.Sprintf("192.168.%d.1", i)
	}
	return ips
}

// IsPrivateIP checks if an IP is in a private range (RFC 1918).
func IsPrivateIP(ip string) bool {
	parsedIP := net.ParseIP(ip)
	if parsedIP == nil {
		return false
	}

	ipv4 := parsedIP.To4()
	if ipv4 == nil {
		return false
	}

	// Check private ranges
	// 10.0.0.0/8
	if ipv4[0] == 10 {
		return true
	}
	// 172.16.0.0/12
	if ipv4[0] == 172 && ipv4[1] >= 16 && ipv4[1] <= 31 {
		return true
	}
	// 192.168.0.0/16
	if ipv4[0] == 192 && ipv4[1] == 168 {
		return true
	}

	return false
}

// ValidateSubnet checks if a subnet string is valid and within allowed ranges.
// It prevents dangerous scans like /8 that could contain millions of IPs.
func ValidateSubnet(subnet string) error {
	switch {
	case strings.Contains(subnet, "/"):
		return validateCIDRSubnet(subnet)
	case strings.Contains(subnet, "-"):
		return validateIPRange(subnet)
	default:
		return validateSingleIP(subnet)
	}
}

// validateCIDRSubnet validates a CIDR notation subnet.
func validateCIDRSubnet(subnet string) error {
	_, ipNet, err := net.ParseCIDR(subnet)
	if err != nil {
		return fmt.Errorf("invalid CIDR notation: %w", err)
	}

	// Calculate network size (number of host bits)
	ones, bits := ipNet.Mask.Size()
	if bits == 0 {
		return fmt.Errorf("invalid network mask")
	}
	hostBits := bits - ones

	// Prevent scanning of excessively large networks
	// /16 = 65536 IPs (max allowed)
	// /8  = 16.7M IPs (not allowed)
	if hostBits > 16 {
		return fmt.Errorf("subnet too large: /%d would require scanning %d IPs (max /16 with 65536 IPs)", ones, 1<<uint(hostBits))
	}

	// Reject IPv6 CIDR blocks (not supported)
	ipv4 := ipNet.IP.To4()
	if ipv4 == nil {
		return fmt.Errorf("IPv6 CIDR blocks not supported, only IPv4 (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)")
	}

	// Validate first IP is in private range
	if !IsPrivateIP(ipNet.IP.String()) {
		return fmt.Errorf("subnet %s not in private ranges (only 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16 allowed)", subnet)
	}

	return nil
}

// validateIPRange validates an IP range in the format "start-end".
func validateIPRange(subnet string) error {
	parts := strings.Split(subnet, "-")
	if len(parts) != 2 {
		return fmt.Errorf("invalid IP range format: expected 'start-end'")
	}

	startIP := net.ParseIP(strings.TrimSpace(parts[0]))
	endIP := net.ParseIP(strings.TrimSpace(parts[1]))
	if startIP == nil || endIP == nil {
		return fmt.Errorf("invalid IP addresses in range")
	}

	// Only IPv4 ranges supported
	start := startIP.To4()
	end := endIP.To4()
	if start == nil || end == nil {
		return fmt.Errorf("only IPv4 ranges supported")
	}

	// Validate both are private
	if !IsPrivateIP(startIP.String()) {
		return fmt.Errorf("start IP %s not in private range", startIP.String())
	}
	if !IsPrivateIP(endIP.String()) {
		return fmt.Errorf("end IP %s not in private range", endIP.String())
	}

	// Calculate size and validate it's not too large
	// Convert to uint32 for comparison
	startVal := uint32(start[0])<<24 | uint32(start[1])<<16 | uint32(start[2])<<8 | uint32(start[3])
	endVal := uint32(end[0])<<24 | uint32(end[1])<<16 | uint32(end[2])<<8 | uint32(end[3])

	if startVal > endVal {
		return fmt.Errorf("start IP must be <= end IP")
	}

	rangeSize := endVal - startVal + 1
	if rangeSize > 65536 {
		return fmt.Errorf("IP range too large: %d IPs (max 65536)", rangeSize)
	}

	return nil
}

// validateSingleIP validates a single IP address.
func validateSingleIP(subnet string) error {
	parsedIP := net.ParseIP(subnet)
	if parsedIP == nil {
		return fmt.Errorf("invalid IP format: %s", subnet)
	}

	// Must be IPv4
	if parsedIP.To4() == nil {
		return fmt.Errorf("only IPv4 addresses supported")
	}

	// Check for loopback (127.0.0.0/8) and link-local (169.254.0.0/16)
	if parsedIP.IsLoopback() {
		return fmt.Errorf("loopback addresses (127.0.0.0/8) not allowed")
	}
	if parsedIP.IsLinkLocalUnicast() {
		return fmt.Errorf("link-local addresses (169.254.0.0/16) not allowed")
	}

	// Must be private
	if !IsPrivateIP(subnet) {
		return fmt.Errorf("IP %s not in private range (only 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16 allowed)", subnet)
	}

	return nil
}

// incrementIP increments an IP address by 1.
//
//nolint:unparam // return value kept for potential future use
func incrementIP(ip net.IP) net.IP {
	for j := len(ip) - 1; j >= 0; j-- {
		ip[j]++
		if ip[j] > 0 {
			break
		}
	}
	return ip
}

// isBroadcast checks if an IP is the broadcast address of a network.
func isBroadcast(ip net.IP, network *net.IPNet) bool {
	// Calculate broadcast address
	broadcast := make(net.IP, len(network.IP))
	for i := range network.IP {
		broadcast[i] = network.IP[i] | ^network.Mask[i]
	}
	return ip.Equal(broadcast)
}
