package dns

import (
	"fmt"
	"sort"
	"strconv"
	"strings"
)

// parseRouterOSResponse parses RouterOS DNS lookup response format
// Expected formats:
//
//	"name: google.com address: 142.250.185.46"
//	"name=google.com address=142.250.185.46"
//	Multi-line format with separate fields
func parseRouterOSResponse(resp, recordType string) ([]Record, error) {
	if resp == "" {
		return nil, fmt.Errorf("NXDOMAIN: empty response")
	}

	records := []Record{}
	lines := strings.Split(resp, "\n")

	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}

		record, ok := parseLookupRecord(line, recordType)
		if !ok {
			continue
		}

		records = append(records, record)
	}

	if len(records) == 0 {
		return nil, fmt.Errorf("NXDOMAIN: no records found")
	}

	return records, nil
}

// parseLookupRecord extracts a DNS record from a single line of RouterOS output.
// Returns the record and true if the line contains a valid address field.
func parseLookupRecord(line, recordType string) (Record, bool) {
	// Check for address field (A/AAAA records)
	// Handle both colon and equals formats
	if !strings.Contains(line, "address:") && !strings.Contains(line, "address=") {
		return Record{}, false
	}

	addressParts := splitField(line, "address")
	if len(addressParts) != 2 {
		return Record{}, false
	}

	address := strings.TrimSpace(addressParts[1])
	if address == "" {
		return Record{}, false
	}

	name := extractName(line)

	return Record{
		Name: name,
		Type: recordType,
		TTL:  3600, // Default TTL since RouterOS doesn't always provide it
		Data: address,
	}, true
}

// extractName pulls the name field out of a RouterOS DNS response line.
// It handles both "name:" and "name=" delimiters and strips any trailing fields.
func extractName(line string) string {
	var raw string

	switch {
	case strings.Contains(line, "name:"):
		parts := strings.Split(line, "name:")
		if len(parts) >= 2 {
			raw = strings.TrimSpace(parts[1])
		}
	case strings.Contains(line, "name="):
		parts := strings.Split(line, "name=")
		if len(parts) >= 2 {
			raw = strings.TrimSpace(parts[1])
		}
	}

	if raw == "" {
		return ""
	}

	// If the name fragment still contains "address", strip that suffix
	if strings.Contains(raw, "address") {
		raw = strings.TrimSpace(strings.Split(raw, "address")[0])
	}

	return raw
}

// splitField splits a line on either "key:" or "key=" and returns the parts.
func splitField(line, key string) []string {
	if strings.Contains(line, key+":") {
		return strings.Split(line, key+":")
	}

	return strings.Split(line, key+"=")
}

// parseRouterOSServers parses /ip/dns/print response to extract DNS servers
// Expected format includes: "servers: 8.8.8.8,1.1.1.1" or "servers=8.8.8.8,1.1.1.1"
func parseRouterOSServers(resp string) *Servers {
	result := &Servers{
		Servers: []Server{},
	}

	if resp == "" {
		return result
	}

	lines := strings.Split(resp, "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)

		serversStr, ok := parseServerRecord(line)
		if !ok {
			continue
		}

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
				// Store secondary safely (make a copy to avoid dangling pointer)
				secAddr := addr
				result.Secondary = &secAddr
			}
		}
		break
	}

	return result
}

// parseServerRecord extracts the servers value from a single RouterOS line.
// Returns the comma-separated server list and true when a servers field is found.
func parseServerRecord(line string) (string, bool) {
	switch {
	case strings.Contains(line, "servers:"):
		parts := strings.Split(line, "servers:")
		if len(parts) != 2 {
			return "", false
		}

		return strings.TrimSpace(parts[1]), true
	case strings.Contains(line, "servers="):
		parts := strings.Split(line, "servers=")
		if len(parts) != 2 {
			return "", false
		}

		return strings.TrimSpace(parts[1]), true
	default:
		return "", false
	}
}

// parseRouterOSCacheStats parses DNS cache statistics from /ip/dns/print response
// Expected fields: cache-size, cache-used, cache-max-ttl
// Handles both colon and equals format (e.g., "cache-size: 5000KiB" or "cache-size=5000KiB")
func parseRouterOSCacheStats(resp string) *CacheStats {
	stats := &CacheStats{
		TotalEntries:      0,
		CacheUsedBytes:    0,
		CacheMaxBytes:     0,
		CacheUsagePercent: 0.0,
		TopDomains:        []TopDomain{},
	}

	if resp == "" {
		return stats
	}

	lines := strings.Split(resp, "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)
		parseCacheSizeLine(line, stats)
		parseCacheUsedLine(line, stats)
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

// parseCacheSizeLine reads the cache-size field from one line and updates stats.
func parseCacheSizeLine(line string, stats *CacheStats) {
	if !strings.Contains(line, "cache-size:") && !strings.Contains(line, "cache-size=") {
		return
	}

	sizeStr := extractKiBField(line, "cache-size")
	if sizeStr == "" {
		return
	}

	if size, err := strconv.ParseInt(sizeStr, 10, 64); err == nil && size > 0 {
		stats.CacheMaxBytes = size * 1024 // Convert KiB to bytes
	}
}

// parseCacheUsedLine reads the cache-used field from one line and updates stats.
func parseCacheUsedLine(line string, stats *CacheStats) {
	if !strings.Contains(line, "cache-used:") && !strings.Contains(line, "cache-used=") {
		return
	}

	usedStr := extractKiBField(line, "cache-used")
	if usedStr == "" {
		return
	}

	if used, err := strconv.ParseInt(usedStr, 10, 64); err == nil && used >= 0 {
		stats.CacheUsedBytes = used * 1024 // Convert KiB to bytes
	}
}

// extractKiBField splits a line on "key:" or "key=", strips KiB/KB suffix, and
// returns the trimmed numeric string. Returns "" when the field is absent.
func extractKiBField(line, key string) string {
	parts := splitField(line, key)
	if len(parts) != 2 {
		return ""
	}

	s := strings.TrimSpace(parts[1])
	s = strings.TrimSuffix(strings.TrimSuffix(s, "KiB"), "KB")

	return strings.TrimSpace(s)
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
