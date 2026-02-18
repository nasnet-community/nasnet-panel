package dns

import (
	"fmt"
	"sort"
	"strconv"
	"strings"
)

// parseRouterOSResponse parses RouterOS DNS lookup response format
// Expected format: "name: google.com address: 142.250.185.46"
func parseRouterOSResponse(resp, recordType string) ([]Record, error) {
	records := []Record{}

	lines := strings.Split(resp, "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}

		// Check for address field (A/AAAA records)
		if !strings.Contains(line, "address:") {
			continue
		}
		parts := strings.Split(line, "address:")
		if len(parts) != 2 {
			continue
		}

		// Extract name if present
		name := ""
		if strings.Contains(parts[0], "name:") {
			nameParts := strings.Split(parts[0], "name:")
			if len(nameParts) == 2 {
				name = strings.TrimSpace(nameParts[1])
			}
		}

		address := strings.TrimSpace(parts[1])
		records = append(records, Record{
			Name: name,
			Type: recordType,
			TTL:  3600, // Default TTL since RouterOS doesn't always provide it
			Data: address,
		})
	}

	if len(records) == 0 {
		return nil, fmt.Errorf("NXDOMAIN: no records found")
	}

	return records, nil
}

// parseRouterOSServers parses /ip/dns/print response to extract DNS servers
// Expected format includes: "servers: 8.8.8.8,1.1.1.1"
func parseRouterOSServers(resp string) *Servers {
	result := &Servers{
		Servers: []Server{},
	}

	lines := strings.Split(resp, "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if !strings.Contains(line, "servers:") {
			continue
		}
		// Extract server addresses
		parts := strings.Split(line, "servers:")
		if len(parts) != 2 {
			break
		}
		serversStr := strings.TrimSpace(parts[1])
		servers := strings.Split(serversStr, ",")

		for i, addr := range servers {
			addr = strings.TrimSpace(addr)
			if addr == "" {
				continue
			}

			result.Servers = append(result.Servers, Server{
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
		break
	}

	return result
}

// parseRouterOSCacheStats parses DNS cache statistics from /ip/dns/print response
// Expected fields: cache-size, cache-used, cache-max-ttl
func parseRouterOSCacheStats(resp string) *CacheStats {
	stats := &CacheStats{
		TotalEntries:      0,
		CacheUsedBytes:    0,
		CacheMaxBytes:     0,
		CacheUsagePercent: 0.0,
		TopDomains:        []TopDomain{},
	}

	lines := strings.Split(resp, "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)

		// Parse cache-size (max size in KiB)
		if strings.Contains(line, "cache-size:") {
			parts := strings.Split(line, "cache-size:")
			if len(parts) == 2 {
				sizeStr := strings.TrimSpace(parts[1])
				sizeStr = strings.TrimSuffix(sizeStr, "KiB")
				sizeStr = strings.TrimSpace(sizeStr)
				if size, err := strconv.ParseInt(sizeStr, 10, 64); err == nil {
					stats.CacheMaxBytes = size * 1024 // Convert KiB to bytes
				}
			}
		}

		// Parse cache-used (current usage in KiB)
		if strings.Contains(line, "cache-used:") {
			parts := strings.Split(line, "cache-used:")
			if len(parts) == 2 {
				usedStr := strings.TrimSpace(parts[1])
				usedStr = strings.TrimSuffix(usedStr, "KiB")
				usedStr = strings.TrimSpace(usedStr)
				if used, err := strconv.ParseInt(usedStr, 10, 64); err == nil {
					stats.CacheUsedBytes = used * 1024 // Convert KiB to bytes
				}
			}
		}
	}

	// Calculate usage percentage
	if stats.CacheMaxBytes > 0 {
		stats.CacheUsagePercent = (float64(stats.CacheUsedBytes) / float64(stats.CacheMaxBytes)) * 100.0
	}

	// Estimate total entries based on cache usage
	// Rough estimate: ~100 bytes per entry average
	if stats.CacheUsedBytes > 0 {
		stats.TotalEntries = int(stats.CacheUsedBytes / 100)
	}

	return stats
}

// sortBenchmarkResults sorts benchmark results by response time (ascending)
func sortBenchmarkResults(results []BenchmarkServerResult) {
	sort.Slice(results, func(i, j int) bool {
		// Unreachable servers go to the end
		if results[i].ResponseTimeMs < 0 && results[j].ResponseTimeMs >= 0 {
			return false
		}
		if results[i].ResponseTimeMs >= 0 && results[j].ResponseTimeMs < 0 {
			return true
		}
		// Both unreachable or both reachable, sort by response time
		return results[i].ResponseTimeMs < results[j].ResponseTimeMs
	})
}
