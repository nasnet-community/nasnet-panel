package dns

import (
	"strings"
)

// mapErrorToStatus maps Go DNS error messages to LookupStatus enum values
func mapErrorToStatus(err error) string {
	if err == nil {
		return "UNKNOWN"
	}

	errStr := strings.ToLower(err.Error())

	// Check for specific DNS error types
	if strings.Contains(errStr, "nxdomain") || strings.Contains(errStr, "no such host") {
		return "NXDOMAIN"
	}
	if strings.Contains(errStr, "servfail") || strings.Contains(errStr, "server misbehaving") {
		return "SERVFAIL"
	}
	if strings.Contains(errStr, "timeout") || strings.Contains(errStr, "deadline exceeded") {
		return "TIMEOUT"
	}
	if strings.Contains(errStr, "refused") {
		return "REFUSED"
	}
	if strings.Contains(errStr, "connection refused") || strings.Contains(errStr, "connection reset") {
		return "CONNECTION_ERROR"
	}

	return "NETWORK_ERROR"
}
