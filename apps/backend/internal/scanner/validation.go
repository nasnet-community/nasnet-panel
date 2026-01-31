package scanner

import (
	"context"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io"
	"net"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"
)

// TargetPorts contains the ports to scan for MikroTik devices.
var TargetPorts = []int{80, 443, 8728, 8729, 8291}

// HTTPAPIPorts contains ports that support RouterOS REST API.
var HTTPAPIPorts = []int{80, 443}

// ValidateRouterOSResponse validates if a response body is from a RouterOS device.
// Returns detailed RouterOSInfo with confidence score.
// A confidence score >= 40 with at least 3 RouterOS fields indicates a valid device.
func ValidateRouterOSResponse(body []byte) RouterOSInfo {
	var result RouterOSInfo

	// Try to parse JSON response
	var data map[string]interface{}
	if err := json.Unmarshal(body, &data); err != nil {
		return result // Invalid JSON - not RouterOS
	}

	confidence := 0

	// Check for RouterOS-specific fields (RouterOS v6 and v7+)
	routerOSFields := []string{
		"version", "version-string", "architecture", "architecture-name", "board-name",
		"cpu", "cpu-count", "cpu-frequency", "total-memory", "free-memory",
		"platform", "factory-software", "uptime", // RouterOS v7+ specific fields
	}

	presentFields := 0
	for _, field := range routerOSFields {
		if _, exists := data[field]; exists {
			presentFields++
			confidence += 10 // 10 points per RouterOS field
		}
	}

	// Extract version information
	if version, ok := data["version"].(string); ok {
		result.Version = version
		// Check version format (like "7.8" or "6.49.8")
		if matched, _ := regexp.MatchString(`^\d+\.\d+`, version); matched {
			confidence += 20
		}
		if strings.Contains(strings.ToLower(version), "routeros") {
			confidence += 30
		}
	} else if versionString, ok := data["version-string"].(string); ok {
		result.Version = versionString
		confidence += 15
	}

	// Extract architecture (check both v6 and v7+ field names)
	if arch, ok := data["architecture"].(string); ok {
		result.Architecture = arch
		if containsAnyIgnoreCase(arch, "arm", "x86", "mips", "tile") {
			confidence += 15
		}
	} else if archName, ok := data["architecture-name"].(string); ok {
		result.Architecture = archName
		if containsAnyIgnoreCase(archName, "arm", "x86", "mips", "tile") {
			confidence += 15
		}
	}

	// Extract board name
	if boardName, ok := data["board-name"].(string); ok {
		result.BoardName = boardName
		confidence += 15
	}

	// Extra confidence for RouterOS-specific values
	if platform, ok := data["platform"].(string); ok {
		result.Platform = platform
		if strings.Contains(strings.ToLower(platform), "mikrotik") {
			confidence += 25 // High confidence for MikroTik platform
		}
	}

	result.Confidence = confidence
	// Must have at least 3 RouterOS fields and confidence > 40 to be valid
	result.IsValid = presentFields >= 3 && confidence >= 40

	return result
}

// CheckRouterOSAPI attempts to verify if a device is running RouterOS by querying the REST API.
func CheckRouterOSAPI(ctx context.Context, ip string, port int, timeout time.Duration) *RouterOSInfo {
	protocol := "http"
	if port == 443 {
		protocol = "https"
	}

	url := fmt.Sprintf("%s://%s:%d/rest/system/resource", protocol, ip, port)

	// Create HTTP client with timeout
	client := &http.Client{
		Timeout: timeout,
		Transport: &http.Transport{
			TLSClientConfig: &tls.Config{InsecureSkipVerify: true}, // Skip cert verification
		},
	}

	// Create request with Basic Auth (default admin with no password)
	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil
	}
	req.SetBasicAuth("admin", "")

	// Make the request
	resp, err := client.Do(req)
	if err != nil {
		return nil
	}
	defer resp.Body.Close()

	// Read response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil
	}

	// For 200 responses, validate the content
	if resp.StatusCode == 200 {
		validation := ValidateRouterOSResponse(body)
		if validation.IsValid {
			return &validation
		}
		return nil // Response was 200 but not RouterOS
	}

	// For 401 responses, this likely indicates RouterOS with authentication required
	if resp.StatusCode == 401 {
		// Check for RouterOS-specific headers or content
		contentType := resp.Header.Get("Content-Type")

		// RouterOS typically returns JSON error messages for 401 on REST API
		if strings.Contains(strings.ToLower(contentType), "application/json") {
			// Additional validation: check if response body looks like RouterOS error
			bodyLower := strings.ToLower(string(body))
			if strings.Contains(bodyLower, "unauthorized") || strings.Contains(bodyLower, "error") {
				return &RouterOSInfo{
					IsValid:    true,
					Confidence: 35, // Moderate confidence for auth-required detection
				}
			}
		}

		// Fallback: if WWW-Authenticate header is present and contains "basic"
		wwwAuth := resp.Header.Get("WWW-Authenticate")
		if strings.Contains(strings.ToLower(wwwAuth), "basic") {
			return &RouterOSInfo{
				IsValid:    true,
				Confidence: 30, // Lower confidence for auth-only detection
			}
		}

		// Even without WWW-Authenticate, 401 on /rest/system/resource is strong indication of RouterOS
		// Very few other devices use this specific REST API path
		return &RouterOSInfo{
			IsValid:    true,
			Confidence: 25, // Lower confidence but still valid
		}
	}

	return nil // Any other status means not RouterOS
}

// IsPortOpen checks if a specific port is open on an IP address.
func IsPortOpen(ctx context.Context, ip string, port int, timeout time.Duration) bool {
	address := net.JoinHostPort(ip, strconv.Itoa(port))

	dialer := &net.Dialer{Timeout: timeout}
	conn, err := dialer.DialContext(ctx, "tcp", address)
	if err != nil {
		return false
	}
	defer conn.Close()

	return true
}

// GetServiceName returns the service name for a known port.
func GetServiceName(port int) string {
	services := map[int]string{
		80:   "http",
		443:  "https",
		8728: "mikrotik-api",
		8729: "mikrotik-api-ssl",
		8291: "mikrotik-winbox",
		22:   "ssh",
	}

	if name, exists := services[port]; exists {
		return name
	}
	return fmt.Sprintf("tcp/%d", port)
}

// GetMikroTikServiceName returns MikroTik-specific service names for REST API ports.
func GetMikroTikServiceName(port int) string {
	switch port {
	case 80:
		return "mikrotik-rest"
	case 443:
		return "mikrotik-rest-ssl"
	default:
		return GetServiceName(port)
	}
}

// containsPort checks if a port exists in the slice.
func containsPort(ports []int, port int) bool {
	for _, p := range ports {
		if p == port {
			return true
		}
	}
	return false
}

// containsAnyIgnoreCase checks if s contains any of the substrings (case insensitive).
func containsAnyIgnoreCase(s string, substrs ...string) bool {
	lower := strings.ToLower(s)
	for _, sub := range substrs {
		if strings.Contains(lower, strings.ToLower(sub)) {
			return true
		}
	}
	return false
}
