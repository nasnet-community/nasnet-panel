package isolation

import (
	"fmt"
	"net"
)

// ValidateIP performs IP address format validation.
// It accepts both IPv4 and IPv6 addresses and returns an error if the format is invalid.
func ValidateIP(ip string) error {
	if ip == "" {
		return fmt.Errorf("IP address is empty")
	}

	parsed := net.ParseIP(ip)
	if parsed == nil {
		return fmt.Errorf("invalid IP format: %s", ip)
	}

	return nil
}

// IsLoopback returns true if the IP address is a loopback address.
func IsLoopback(ip string) bool {
	parsed := net.ParseIP(ip)
	if parsed == nil {
		return false
	}
	return parsed.IsLoopback()
}

// IsPrivate returns true if the IP address is a private/RFC1918 address.
func IsPrivate(ip string) bool {
	parsed := net.ParseIP(ip)
	if parsed == nil {
		return false
	}
	return parsed.IsPrivate()
}
