package arp

import (
	"fmt"
	"net"
)

// =============================================================================
// IP/MAC Validation and Filtering
// =============================================================================
// Address validation, subnet checking, and filtering logic.

const (
	// MaxSubnetSize is the maximum subnet size (/16 = 65,536 IPs)
	MaxSubnetSize = 16

	// MaxDevices is the maximum number of devices to return
	MaxDevices = 2000
)

// validateSubnet validates the subnet size.
func validateSubnet(subnet string) error {
	_, ipNet, err := net.ParseCIDR(subnet)
	if err != nil {
		return fmt.Errorf("invalid subnet format: %w", err)
	}

	ones, _ := ipNet.Mask.Size()
	if ones < MaxSubnetSize {
		return fmt.Errorf("subnet too large (/%d), maximum /%d", ones, MaxSubnetSize)
	}

	return nil
}

// generateIPList generates a list of IP addresses from a CIDR subnet.
func generateIPList(subnet string) ([]string, error) {
	_, ipNet, err := net.ParseCIDR(subnet)
	if err != nil {
		return nil, err
	}

	ips := make([]string, 0)
	for ip := ipNet.IP.Mask(ipNet.Mask); ipNet.Contains(ip); incIP(ip) {
		ips = append(ips, ip.String())
		if len(ips) >= MaxDevices {
			break
		}
	}

	return ips, nil
}

// incIP increments an IP address.
func incIP(ip net.IP) {
	for j := len(ip) - 1; j >= 0; j-- {
		ip[j]++
		if ip[j] > 0 {
			break
		}
	}
}
