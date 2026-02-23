package traffic

import (
	"context"
	"fmt"
	"strconv"
	"strings"

	"backend/graph/model"

	"backend/internal/router"
)

// DeviceTrafficTracker queries per-device traffic statistics using mangle counters.
// It correlates mangle rule counters with device information to provide granular breakdowns.
// Pattern: Uses RouterPort abstraction for all router communication (NAS-8.8 Task 4).
type DeviceTrafficTracker struct {
	routerPort router.RouterPort
}

// NewDeviceTrafficTracker creates a new device traffic tracker
func NewDeviceTrafficTracker(routerPort router.RouterPort) *DeviceTrafficTracker {
	return &DeviceTrafficTracker{
		routerPort: routerPort,
	}
}

// GetDeviceBreakdown retrieves per-device traffic breakdown for a service instance.
// It queries mangle counters and correlates with device info from DHCP/ARP tables.
// Returns a list of DeviceTrafficBreakdown sorted by total bytes (highest first).
func (t *DeviceTrafficTracker) GetDeviceBreakdown(
	ctx context.Context,
	instanceID string,
) ([]*model.DeviceTrafficBreakdown, error) {
	// Query mangle rules with stats for this instance
	// Comment format: nnc-routing-{instanceID}-{deviceID}
	// Example: nnc-routing-01J5K3VQRM-aa:bb:cc:dd:ee:ff
	commentPrefix := fmt.Sprintf("nnc-routing-%s-", instanceID)

	result, err := t.routerPort.QueryState(ctx, router.StateQuery{
		Path: "/ip/firewall/mangle",
		Filter: map[string]string{
			"comment": commentPrefix,
		},
	})

	if err != nil {
		return nil, fmt.Errorf("failed to query mangle rules: %w", err)
	}

	// Parse mangle rules and extract device traffic
	devices := make(map[string]*model.DeviceTrafficBreakdown)

	for _, rule := range result.Resources {
		comment, ok := rule["comment"]
		if !ok || !strings.HasPrefix(comment, commentPrefix) {
			continue
		}

		// Extract device ID from comment
		deviceID := strings.TrimPrefix(comment, commentPrefix)
		if deviceID == "" {
			continue
		}

		// Get traffic counters from rule statistics
		txBytes := parseCounter(rule, "bytes")
		rxBytes := parseCounter(rule, "bytes") // MikroTik counts bidirectional in one counter
		// Note: For accurate TX/RX split, we'd need separate prerouting/postrouting rules

		// Get device info (MAC, IP, hostname)
		macAddress := getOptionalField(rule, "src-mac-address")
		ipAddress := getOptionalField(rule, "src-address")

		// Calculate totals
		totalBytes := txBytes + rxBytes

		// Create or update device entry
		if existing, exists := devices[deviceID]; exists {
			// Accumulate if multiple rules per device
			existing.UploadBytes += txBytes
			existing.DownloadBytes += rxBytes
			existing.TotalBytes += totalBytes
		} else {
			// Query device name from DHCP leases or ARP table (if available)
			deviceName := t.queryDeviceName(ctx, macAddress, ipAddress)

			devices[deviceID] = &model.DeviceTrafficBreakdown{
				DeviceID:       deviceID,
				MacAddress:     stringToPtr(macAddress),
				IPAddress:      stringToPtr(ipAddress),
				DeviceName:     stringToPtr(deviceName),
				UploadBytes:    txBytes,
				DownloadBytes:  rxBytes,
				TotalBytes:     totalBytes,
				PercentOfTotal: 0.0, // Will be calculated after totals are known
			}
		}
	}

	// Convert map to slice
	breakdown := make([]*model.DeviceTrafficBreakdown, 0, len(devices))
	var grandTotal int64
	for _, device := range devices {
		breakdown = append(breakdown, device)
		grandTotal += int64(device.TotalBytes)
	}

	// Calculate percentages
	if grandTotal > 0 {
		for _, device := range breakdown {
			device.PercentOfTotal = float64(device.TotalBytes) / float64(grandTotal) * 100.0
		}
	}

	// Sort by total bytes (descending)
	// Note: GraphQL resolver should handle sorting, but we do it here for convenience
	sortByTotalBytes(breakdown)

	return breakdown, nil
}

// queryDeviceName attempts to resolve device name from DHCP leases or ARP table
func (t *DeviceTrafficTracker) queryDeviceName(ctx context.Context, macAddress, ipAddress string) string {
	// Try DHCP leases first (has hostname info)
	if macAddress != "" {
		if name := t.queryDHCPHostname(ctx, macAddress); name != "" {
			return name
		}
	}

	// Try ARP table (less likely to have hostname)
	if ipAddress != "" {
		if name := t.queryARPHostname(ctx, ipAddress); name != "" {
			return name
		}
	}

	// No hostname found
	return ""
}

// queryDHCPHostname queries DHCP leases for hostname by MAC address
func (t *DeviceTrafficTracker) queryDHCPHostname(ctx context.Context, macAddress string) string {
	result, err := t.routerPort.QueryState(ctx, router.StateQuery{
		Path: "/ip/dhcp-server/lease",
		Filter: map[string]string{
			"mac-address": macAddress,
		},
	})

	if err != nil || len(result.Resources) == 0 {
		return ""
	}

	// Return first matching lease's hostname
	if hostname, ok := result.Resources[0]["host-name"]; ok && hostname != "" {
		return hostname
	}

	return ""
}

// queryARPHostname queries ARP table for hostname by IP address
func (t *DeviceTrafficTracker) queryARPHostname(ctx context.Context, ipAddress string) string {
	result, err := t.routerPort.QueryState(ctx, router.StateQuery{
		Path: "/ip/arp",
		Filter: map[string]string{
			"address": ipAddress,
		},
	})

	if err != nil || len(result.Resources) == 0 {
		return ""
	}

	// ARP table doesn't typically have hostnames in MikroTik
	// This is here for completeness
	return ""
}

// Helper functions

func parseCounter(data map[string]string, field string) int {
	if val, ok := data[field]; ok {
		if i, err := strconv.Atoi(val); err == nil {
			return i
		}
	}
	return 0
}

func getOptionalField(data map[string]string, field string) string {
	if val, ok := data[field]; ok {
		return val
	}
	return ""
}

func stringToPtr(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

// sortByTotalBytes sorts device breakdown by total bytes (descending)
func sortByTotalBytes(devices []*model.DeviceTrafficBreakdown) {
	// Simple bubble sort (sufficient for small datasets, typically <100 devices)
	n := len(devices)
	for i := 0; i < n-1; i++ {
		for j := 0; j < n-i-1; j++ {
			if devices[j].TotalBytes < devices[j+1].TotalBytes {
				devices[j], devices[j+1] = devices[j+1], devices[j]
			}
		}
	}
}
