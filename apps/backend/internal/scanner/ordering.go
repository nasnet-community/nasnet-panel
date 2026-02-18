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
		for ip := incrementIP(ipNet.IP.Mask(ipNet.Mask)); ipNet.Contains(ip); incrementIP(ip) {
			// Don't include broadcast address
			if isBroadcast(ip, ipNet) {
				break
			}
			ips = append(ips, ip.String())
			// Limit to prevent memory issues on large ranges
			if len(ips) > 65534 { // Max for /16
				break
			}
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
func ValidateSubnet(subnet string) error {
	ips, err := ParseIPRange(subnet)
	if err != nil {
		return err
	}

	if len(ips) == 0 {
		return fmt.Errorf("subnet produces no valid IPs")
	}

	// Check that all IPs are in private ranges
	for _, ip := range ips {
		if !IsPrivateIP(ip) {
			return fmt.Errorf("subnet contains non-private IP: %s (only 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16 allowed)", ip)
		}
	}

	return nil
}

// incrementIP increments an IP address by 1.
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
