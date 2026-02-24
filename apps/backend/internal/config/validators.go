package config

import (
	"fmt"
	"net"
	"strings"
)

// ValidateBindIP validates that a bind IP is not a wildcard (0.0.0.0 or ::).
// This enforces VLAN isolation by ensuring all services bind to specific IPs.
func ValidateBindIP(ip string) error {
	if ip == "" {
		return fmt.Errorf("bind IP is required")
	}

	parsedIP := net.ParseIP(ip)
	if parsedIP == nil {
		return fmt.Errorf("invalid IP address: %s", ip)
	}

	// Reject wildcard addresses (0.0.0.0 and ::)
	if parsedIP.IsUnspecified() {
		return fmt.Errorf("wildcard IP addresses (0.0.0.0, ::) are not allowed - must bind to a specific VLAN IP")
	}

	// Reject loopback addresses (127.0.0.1 and ::1)
	if parsedIP.IsLoopback() {
		return fmt.Errorf("loopback IP addresses (127.0.0.1, ::1) are not allowed - must bind to a VLAN IP")
	}

	return nil
}

// ValidatePort validates that a port number is in the valid range.
func ValidatePort(port int) error {
	if port < 1 || port > 65535 {
		return fmt.Errorf("port must be between 1 and 65535, got %d", port)
	}
	return nil
}

// ValidatePortString validates a port number from a string.
func ValidatePortString(portStr string) error {
	var port int
	if _, err := fmt.Sscanf(portStr, "%d", &port); err != nil {
		return fmt.Errorf("invalid port number: %s", portStr)
	}
	return ValidatePort(port)
}

// ValidateNonEmpty validates that a string is not empty.
func ValidateNonEmpty(fieldName, value string) error {
	if strings.TrimSpace(value) == "" {
		return fmt.Errorf("%s cannot be empty", fieldName)
	}
	return nil
}

// ValidateEnum validates that a value is in the allowed enum values.
func ValidateEnum(fieldName, value string, allowedValues []string) error {
	for _, allowed := range allowedValues {
		if value == allowed {
			return nil
		}
	}
	return fmt.Errorf("%s must be one of %v, got %s", fieldName, allowedValues, value)
}

// ValidateRange validates that an integer is within a specified range.
func ValidateRange(fieldName string, value, minVal, maxVal int) error {
	if value < minVal || value > maxVal {
		return fmt.Errorf("%s must be between %d and %d, got %d", fieldName, minVal, maxVal, value)
	}
	return nil
}

// ValidatePositive validates that an integer is positive.
func ValidatePositive(fieldName string, value int) error {
	if value <= 0 {
		return fmt.Errorf("%s must be positive, got %d", fieldName, value)
	}
	return nil
}

// ValidateDNSName validates a DNS hostname.
func ValidateDNSName(hostname string) error {
	if hostname == "" {
		return fmt.Errorf("hostname cannot be empty")
	}
	if len(hostname) > 253 {
		return fmt.Errorf("hostname too long (max 253 characters)")
	}
	// Basic DNS validation - alphanumeric, hyphens, dots
	for _, char := range hostname {
		if !((char >= 'a' && char <= 'z') ||
			(char >= 'A' && char <= 'Z') ||
			(char >= '0' && char <= '9') ||
			char == '-' || char == '.') {

			return fmt.Errorf("invalid character in hostname: %c", char)
		}
	}

	return nil
}

// ValidateURL validates a basic URL format.
func ValidateURL(url string) error {
	if url == "" {
		return fmt.Errorf("URL cannot be empty")
	}
	if !strings.HasPrefix(url, "http://") && !strings.HasPrefix(url, "https://") {
		return fmt.Errorf("URL must start with http:// or https://")
	}
	return nil
}

// ValidateEmail validates a basic email format.
func ValidateEmail(email string) error {
	if email == "" {
		return fmt.Errorf("email cannot be empty")
	}
	if !strings.Contains(email, "@") {
		return fmt.Errorf("invalid email format")
	}
	parts := strings.Split(email, "@")
	if len(parts) != 2 || parts[0] == "" || parts[1] == "" {
		return fmt.Errorf("invalid email format")
	}
	return nil
}

// ValidateStringLength validates that a string is within specified length bounds.
func ValidateStringLength(fieldName, value string, minLen, maxLen int) error {
	if len(value) < minLen {
		return fmt.Errorf("%s minimum length is %d characters, got %d", fieldName, minLen, len(value))
	}
	if len(value) > maxLen {
		return fmt.Errorf("%s maximum length is %d characters, got %d", fieldName, maxLen, len(value))
	}
	return nil
}

// ValidateIPCIDR validates a CIDR notation IP address.
func ValidateIPCIDR(cidr string) error {
	if cidr == "" {
		return fmt.Errorf("CIDR notation cannot be empty")
	}
	_, _, err := net.ParseCIDR(cidr)
	if err != nil {
		return fmt.Errorf("invalid CIDR notation: %s, error: %w", cidr, err)
	}
	return nil
}

// ValidateIPRange validates that startIP is before endIP.
func ValidateIPRange(startIP, endIP string) error {
	if startIP == "" || endIP == "" {
		return fmt.Errorf("IP range cannot have empty addresses")
	}
	start := net.ParseIP(startIP)
	if start == nil {
		return fmt.Errorf("invalid start IP: %s", startIP)
	}
	end := net.ParseIP(endIP)
	if end == nil {
		return fmt.Errorf("invalid end IP: %s", endIP)
	}
	if start.String() > end.String() {
		return fmt.Errorf("start IP %s must be before end IP %s", startIP, endIP)
	}
	return nil
}
