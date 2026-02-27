package dhcp

import (
	"bufio"
	"fmt"
	"os"
	"sort"
	"strconv"
	"strings"
	"time"
)

// ParseLeaseFile parses a udhcpd lease file.
// Format: expiry_timestamp mac_address ip_address hostname
func ParseLeaseFile(path string) ([]LeaseEntry, error) {
	f, err := os.Open(path)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, nil
		}
		return nil, fmt.Errorf("open lease file: %w", err)
	}
	defer f.Close()

	now := time.Now()
	var leases []LeaseEntry

	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}

		fields := strings.Fields(line)
		if len(fields) < 3 {
			continue
		}

		expiry, err := strconv.ParseInt(fields[0], 10, 64)
		if err != nil {
			continue
		}

		expiresAt := time.Unix(expiry, 0)
		if expiresAt.Before(now) {
			continue // Skip expired
		}

		hostname := ""
		if len(fields) >= 4 {
			hostname = fields[3]
		}

		leases = append(leases, LeaseEntry{
			MACAddress: fields[1],
			IPAddress:  fields[2],
			Hostname:   hostname,
			ExpiresAt:  expiresAt,
		})
	}

	if err := scanner.Err(); err != nil {
		return nil, fmt.Errorf("scan lease file: %w", err)
	}

	sort.Slice(leases, func(i, j int) bool {
		return leases[i].ExpiresAt.Before(leases[j].ExpiresAt)
	})

	return leases, nil
}
