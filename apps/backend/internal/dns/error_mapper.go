package dns

import (
	"strings"
)

// mapErrorToStatus maps Go DNS error messages to DnsLookupStatus enum values
func mapErrorToStatus(err error) string {
	errStr := strings.ToLower(err.Error())

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

	return "NETWORK_ERROR"
}
