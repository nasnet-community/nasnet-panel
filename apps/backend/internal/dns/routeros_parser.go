package dns

import (
	"fmt"
	"strings"
)

// parseRouterOSDnsResponse parses RouterOS DNS lookup response format
// Expected format: "name: google.com address: 142.250.185.46"
func parseRouterOSDnsResponse(resp string, recordType string) ([]DnsRecord, error) {
	records := []DnsRecord{}

	lines := strings.Split(resp, "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}

		// Check for address field (A/AAAA records)
		if strings.Contains(line, "address:") {
			parts := strings.Split(line, "address:")
			if len(parts) == 2 {
				// Extract name if present
				name := ""
				if strings.Contains(parts[0], "name:") {
					nameParts := strings.Split(parts[0], "name:")
					if len(nameParts) == 2 {
						name = strings.TrimSpace(nameParts[1])
					}
				}

				address := strings.TrimSpace(parts[1])
				records = append(records, DnsRecord{
					Name: name,
					Type: recordType,
					TTL:  3600, // Default TTL since RouterOS doesn't always provide it
					Data: address,
				})
			}
		}
	}

	if len(records) == 0 {
		return nil, fmt.Errorf("NXDOMAIN: no records found")
	}

	return records, nil
}

// parseRouterOSDnsServers parses /ip/dns/print response to extract DNS servers
// Expected format includes: "servers: 8.8.8.8,1.1.1.1"
func parseRouterOSDnsServers(resp string) *DnsServers {
	result := &DnsServers{
		Servers: []DnsServer{},
	}

	lines := strings.Split(resp, "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if strings.Contains(line, "servers:") {
			// Extract server addresses
			parts := strings.Split(line, "servers:")
			if len(parts) == 2 {
				serversStr := strings.TrimSpace(parts[1])
				servers := strings.Split(serversStr, ",")

				for i, addr := range servers {
					addr = strings.TrimSpace(addr)
					if addr == "" {
						continue
					}

					result.Servers = append(result.Servers, DnsServer{
						Address:     addr,
						IsPrimary:   i == 0,
						IsSecondary: i == 1,
					})

					if i == 0 {
						result.Primary = addr
					} else if i == 1 {
						result.Secondary = &addr
					}
				}
			}
			break
		}
	}

	return result
}
