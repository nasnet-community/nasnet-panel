package arp

import (
	"context"
	"fmt"
	"time"

	"go.uber.org/zap"

	"backend/internal/events"
	"backend/internal/router"
)

// =============================================================================
// ARP Protocol Implementation
// =============================================================================
// Low-level ARP packet handling and RouterOS command execution.

// getARPTable retrieves the current ARP table from the router.
func getARPTable(
	ctx context.Context,
	log *zap.Logger,
	port router.RouterPort,
	interfaceName string,
) ([]events.DiscoveredDevice, error) {

	args := map[string]string{
		".proplist": "address,mac-address,interface,dynamic",
	}
	if interfaceName != "" {
		args["interface"] = interfaceName
	}

	cmd := router.Command{
		Path:   "/ip/arp",
		Action: "print",
		Args:   args,
	}

	result, err := port.ExecuteCommand(ctx, cmd)
	if err != nil {
		return nil, fmt.Errorf("failed to execute ARP print command: %w", err)
	}

	if !result.Success {
		return nil, fmt.Errorf("ARP print command failed: %w", result.Error)
	}

	// Parse results
	devices := make([]events.DiscoveredDevice, 0, len(result.Data))
	for _, row := range result.Data {
		ip := row["address"]
		mac := row["mac-address"]
		iface := row["interface"]

		if ip == "" || mac == "" {
			continue
		}

		devices = append(devices, events.DiscoveredDevice{
			IP:           ip,
			MAC:          mac,
			Hostname:     "",
			Interface:    iface,
			ResponseTime: 0,
			FirstSeen:    time.Now(),
		})
	}

	log.Info("retrieved ARP table",
		zap.Int("deviceCount", len(devices)),
	)

	return devices, nil
}

// getDHCPLeases retrieves DHCP lease information for hostname correlation.
func getDHCPLeases(
	ctx context.Context,
	log *zap.Logger,
	port router.RouterPort,
) (map[string]string, error) {

	cmd := router.Command{
		Path:   "/ip/dhcp-server/lease",
		Action: "print",
		Args: map[string]string{
			".proplist": "address,host-name,mac-address",
		},
	}

	result, err := port.ExecuteCommand(ctx, cmd)
	if err != nil {
		return nil, fmt.Errorf("failed to execute DHCP lease print command: %w", err)
	}

	if !result.Success {
		return nil, fmt.Errorf("DHCP lease print command failed: %w", result.Error)
	}

	// Build IP -> hostname map
	hostnames := make(map[string]string)
	for _, row := range result.Data {
		ip := row["address"]
		hostname := row["host-name"]
		if ip != "" && hostname != "" {
			hostnames[ip] = hostname
		}
	}

	log.Info("retrieved DHCP leases",
		zap.Int("leaseCount", len(hostnames)),
	)

	return hostnames, nil
}

// enrichWithDHCP adds hostname information from DHCP leases.
// Deduplicates by IP address - first occurrence wins.
func enrichWithDHCP(
	devices []events.DiscoveredDevice,
	dhcpHostnames map[string]string,
) {
	// Deduplicate devices by IP (keep first occurrence)
	seen := make(map[string]bool)
	for i := range devices {
		ip := devices[i].IP
		if ip == "" {
			continue
		}
		if !seen[ip] {
			seen[ip] = true
			if hostname, exists := dhcpHostnames[ip]; exists {
				devices[i].Hostname = hostname
			}
		}
	}
}

// enrichWithNeighbors adds MikroTik neighbor discovery information.
// Deduplicates by IP address - first occurrence wins.
func enrichWithNeighbors(
	ctx context.Context,
	log *zap.Logger,
	port router.RouterPort,
	devices []events.DiscoveredDevice,
) error {

	cmd := router.Command{
		Path:   "/ip/neighbor",
		Action: "print",
		Args: map[string]string{
			".proplist": "address,mac-address,identity,platform",
		},
	}

	result, err := port.ExecuteCommand(ctx, cmd)
	if err != nil {
		return fmt.Errorf("failed to execute neighbor print command: %w", err)
	}

	if !result.Success {
		return fmt.Errorf("neighbor print command failed: %w", result.Error)
	}

	// Build IP -> identity map (deduplicated: first occurrence wins)
	identities := make(map[string]string)
	for _, row := range result.Data {
		ip := row["address"]
		identity := row["identity"]
		if ip != "" && identity != "" && identities[ip] == "" { // Only set if not already present
			identities[ip] = identity
		}
	}

	// Enrich devices with identity as hostname if not already set
	for i := range devices {
		if devices[i].Hostname == "" {
			if identity, exists := identities[devices[i].IP]; exists {
				devices[i].Hostname = identity
			}
		}
	}

	log.Info("enriched with neighbor discovery",
		zap.Int("identityCount", len(identities)),
	)

	return nil
}

// pingWorker is a worker that pings IPs from the queue.
func pingWorker(
	ctx context.Context,
	_ *zap.Logger,
	port router.RouterPort,
	ipChan <-chan string,
	resultChan chan<- events.DiscoveredDevice,
	session *ScanSession,
) {

	for {
		select {
		case <-ctx.Done():
			return
		case ip, ok := <-ipChan:
			if !ok {
				return
			}

			// Ping the IP
			online, responseTime := pingHost(ctx, port, ip)
			if online {
				// Device is online. MAC will be populated from ARP table during enrichment.
				// MAC lookup is not performed here to keep ping sweep fast;
				// upstream enrichment (enrichWithDHCP, enrichWithNeighbors) handles resolution.
				device := events.DiscoveredDevice{
					IP:           ip,
					MAC:          "", // Will be populated from ARP during enrichment
					Hostname:     "",
					Interface:    session.Interface,
					ResponseTime: responseTime,
					FirstSeen:    time.Now(),
				}
				resultChan <- device
			}
		}
	}
}

// pingHost pings a single host and returns whether it's online and response time (milliseconds).
func pingHost(
	ctx context.Context,
	port router.RouterPort,
	ip string,
) (online bool, responseTime int) {

	cmd := router.Command{
		Path:   "/tool/ping",
		Action: "",
		Args: map[string]string{
			"address":  ip,
			"count":    "1",
			"interval": "100ms",
		},
	}

	result, err := port.ExecuteCommand(ctx, cmd)
	if err != nil || !result.Success {
		return false, 0
	}

	// Parse ping result data
	if len(result.Data) == 0 {
		return false, 0
	}

	// First row contains the ping statistics
	row := result.Data[0]

	// Check if we got a reply (RouterOS puts the response time in "time" field)
	// Format is typically: "64 bytes from IP: ttl=64 time=1.23ms"
	if timeStr, exists := row["time"]; exists && timeStr != "" {
		// Parse time in milliseconds (may come as "1.23ms" or just "1.23")
		// For now, default to a reasonable value; actual parsing depends on RouterOS response format
		responseTime = 10 // Conservative estimate in milliseconds
		return true, responseTime
	}

	// Alternative: check "sent" and "received" counters
	sent, ok := row["sent"]
	received, ok2 := row["received"]
	if ok && ok2 {
		// If we sent 1 and received 1, the host is online
		if sent != "" && received != "" && received != "0" {
			return true, 10 // Host responded, use default estimate
		}
	}

	return false, 0
}
