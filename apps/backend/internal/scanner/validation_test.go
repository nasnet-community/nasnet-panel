package scanner

import (
	"encoding/json"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestValidateRouterOSResponse_ValidRouterOS7(t *testing.T) {
	data := map[string]interface{}{
		"architecture-name": "arm",
		"board-name":        "hAP ac³",
		"cpu":               "IPQ-4019",
		"cpu-count":         "4",
		"cpu-frequency":     "716",
		"free-memory":       "105553920",
		"platform":          "MikroTik",
		"total-memory":      "268435456",
		"uptime":            "1d12h30m",
		"version":           "7.12",
	}

	body, _ := json.Marshal(data)
	result := ValidateRouterOSResponse(body)

	assert.True(t, result.IsValid)
	assert.Equal(t, "7.12", result.Version)
	assert.Equal(t, "arm", result.Architecture)
	assert.Equal(t, "hAP ac³", result.BoardName)
	assert.Equal(t, "MikroTik", result.Platform)
	assert.True(t, result.Confidence >= 40)
}

func TestValidateRouterOSResponse_ValidRouterOS6(t *testing.T) {
	data := map[string]interface{}{
		"architecture": "mipsbe",
		"board-name":   "RB750Gr3",
		"cpu":          "MIPS 24Kc V7.4",
		"cpu-count":    "1",
		"version":      "6.49.8",
		"total-memory": "67108864",
		"free-memory":  "33554432",
		"platform":     "MikroTik",
	}

	body, _ := json.Marshal(data)
	result := ValidateRouterOSResponse(body)

	assert.True(t, result.IsValid)
	assert.Equal(t, "6.49.8", result.Version)
	assert.Equal(t, "mipsbe", result.Architecture)
}

func TestValidateRouterOSResponse_InvalidJSON(t *testing.T) {
	result := ValidateRouterOSResponse([]byte("not json"))
	assert.False(t, result.IsValid)
	assert.Equal(t, 0, result.Confidence)
}

func TestValidateRouterOSResponse_EmptyJSON(t *testing.T) {
	result := ValidateRouterOSResponse([]byte("{}"))
	assert.False(t, result.IsValid)
	assert.Equal(t, 0, result.Confidence)
}

func TestValidateRouterOSResponse_NonRouterOSDevice(t *testing.T) {
	// Generic web server response
	data := map[string]interface{}{
		"status":  "ok",
		"message": "welcome",
	}

	body, _ := json.Marshal(data)
	result := ValidateRouterOSResponse(body)

	assert.False(t, result.IsValid)
	assert.True(t, result.Confidence < 40)
}

func TestValidateRouterOSResponse_PartialFields(t *testing.T) {
	// Only 2 RouterOS fields (below the 3-field minimum)
	data := map[string]interface{}{
		"version":    "7.12",
		"board-name": "hAP",
	}

	body, _ := json.Marshal(data)
	result := ValidateRouterOSResponse(body)

	// Should not be valid with only 2 fields
	assert.False(t, result.IsValid)
}

func TestValidateRouterOSResponse_VersionWithRouterOSString(t *testing.T) {
	data := map[string]interface{}{
		"version":    "RouterOS 7.12",
		"board-name": "hAP ac³",
		"cpu":        "ARM",
		"platform":   "MikroTik",
	}

	body, _ := json.Marshal(data)
	result := ValidateRouterOSResponse(body)

	// Should have extra confidence from "routers" in version string
	assert.True(t, result.IsValid)
	assert.True(t, result.Confidence >= 40)
}

func TestGetServiceName(t *testing.T) {
	tests := []struct {
		port     int
		expected string
	}{
		{80, "http"},
		{443, "https"},
		{8728, "mikrotik-api"},
		{8729, "mikrotik-api-ssl"},
		{8291, "mikrotik-winbox"},
		{22, "ssh"},
		{9999, "tcp/9999"},
	}

	for _, tt := range tests {
		t.Run(tt.expected, func(t *testing.T) {
			assert.Equal(t, tt.expected, GetServiceName(tt.port))
		})
	}
}

func TestGetMikroTikServiceName(t *testing.T) {
	assert.Equal(t, "mikrotik-rest", GetMikroTikServiceName(80))
	assert.Equal(t, "mikrotik-rest-ssl", GetMikroTikServiceName(443))
	assert.Equal(t, "mikrotik-api", GetMikroTikServiceName(8728))
}

func TestContainsPort(t *testing.T) {
	ports := []int{80, 443, 8728}
	assert.True(t, containsPort(ports, 80))
	assert.True(t, containsPort(ports, 8728))
	assert.False(t, containsPort(ports, 22))
	assert.False(t, containsPort(nil, 80))
}

func TestContainsAnyIgnoreCase(t *testing.T) {
	assert.True(t, containsAnyIgnoreCase("ARM Cortex", "arm", "x86"))
	assert.True(t, containsAnyIgnoreCase("x86_64", "arm", "x86"))
	assert.True(t, containsAnyIgnoreCase("MIPS 24Kc", "mips"))
	assert.False(t, containsAnyIgnoreCase("PowerPC", "arm", "x86", "mips"))
	assert.False(t, containsAnyIgnoreCase("", "arm"))
}

func TestTargetPorts(t *testing.T) {
	assert.Contains(t, TargetPorts, 80)
	assert.Contains(t, TargetPorts, 443)
	assert.Contains(t, TargetPorts, 8728)
	assert.Contains(t, TargetPorts, 8729)
	assert.Contains(t, TargetPorts, 8291)
}

func TestHTTPAPIPorts(t *testing.T) {
	assert.Contains(t, HTTPAPIPorts, 80)
	assert.Contains(t, HTTPAPIPorts, 443)
	assert.Len(t, HTTPAPIPorts, 2)
}

// ===== Validation Tests =====

func TestValidateSubnet_ValidPrivateCIDRs(t *testing.T) {
	tests := []struct {
		name   string
		subnet string
		valid  bool
	}{
		{"192.168 /24", "192.168.1.0/24", true},
		{"192.168 /16", "192.168.0.0/16", true},
		{"10.0 /24", "10.0.0.0/24", true},
		{"10.0 /16", "10.0.0.0/16", true},
		{"172.16 /24", "172.16.0.0/24", true},
		{"172.31 /24", "172.31.0.0/24", true},
		{"Single private IP", "192.168.1.1", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateSubnet(tt.subnet)
			if tt.valid {
				assert.NoError(t, err, "expected %s to be valid", tt.subnet)
			} else {
				assert.Error(t, err, "expected %s to be invalid", tt.subnet)
			}
		})
	}
}

func TestValidateSubnet_InvalidCIDRNotations(t *testing.T) {
	tests := []struct {
		name   string
		subnet string
	}{
		{"Malformed CIDR", "192.168.1.0/33"},
		{"Missing prefix length", "192.168.1.0/"},
		{"Invalid IP in CIDR", "999.999.999.999/24"},
		{"Not a number in prefix", "192.168.1.0/aa"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateSubnet(tt.subnet)
			assert.Error(t, err)
		})
	}
}

func TestValidateSubnet_CIDRSizeLimits(t *testing.T) {
	tests := []struct {
		name   string
		subnet string
		valid  bool
	}{
		{"/24 (254 IPs)", "192.168.1.0/24", true},
		{"/16 (65534 IPs)", "192.168.0.0/16", true},
		{"/15 (131070 IPs - too large)", "192.168.0.0/15", false},
		{"/8 (16M IPs - way too large)", "10.0.0.0/8", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateSubnet(tt.subnet)
			if tt.valid {
				assert.NoError(t, err)
			} else {
				assert.Error(t, err)
				assert.Contains(t, err.Error(), "too large")
			}
		})
	}
}

func TestValidateSubnet_PublicAddresses(t *testing.T) {
	publicIPs := []string{
		"8.8.8.8",           // Google DNS
		"1.1.1.1",           // Cloudflare DNS
		"200.1.0.0/16",      // Public range
		"1.0.0.0/8",         // Public range
		"192.0.2.0/24",      // Public documentation range
	}

	for _, ip := range publicIPs {
		t.Run(ip, func(t *testing.T) {
			err := ValidateSubnet(ip)
			assert.Error(t, err, "expected %s to be rejected (public IP)", ip)
		})
	}
}

func TestValidateSubnet_LoopbackAddresses(t *testing.T) {
	loopbackIPs := []string{
		"127.0.0.1",
		"127.0.0.254",
		"127.255.255.255",
	}

	for _, ip := range loopbackIPs {
		t.Run(ip, func(t *testing.T) {
			err := ValidateSubnet(ip)
			assert.Error(t, err, "expected %s to be rejected (loopback)", ip)
			assert.Contains(t, err.Error(), "loopback")
		})
	}
}

func TestValidateSubnet_LinkLocalAddresses(t *testing.T) {
	linkLocalIPs := []string{
		"169.254.0.0/16",
		"169.254.1.1",
		"169.254.169.254",
	}

	for _, ip := range linkLocalIPs {
		t.Run(ip, func(t *testing.T) {
			err := ValidateSubnet(ip)
			assert.Error(t, err, "expected %s to be rejected (link-local)", ip)
		})
	}
}

func TestValidateSubnet_IPv6NotSupported(t *testing.T) {
	ipv6Addresses := []string{
		"2001:db8::/32",
		"fe80::1/64",
		"::1",
	}

	for _, addr := range ipv6Addresses {
		t.Run(addr, func(t *testing.T) {
			err := ValidateSubnet(addr)
			assert.Error(t, err, "expected %s to be rejected (IPv6)", addr)
		})
	}
}

func TestValidateSubnet_IPRanges(t *testing.T) {
	tests := []struct {
		name   string
		subnet string
		valid  bool
	}{
		{"Valid range /24 subnet", "192.168.1.1-192.168.1.254", true},
		{"Valid range small", "192.168.1.1-192.168.1.10", true},
		{"Range with start > end", "192.168.1.100-192.168.1.10", false},
		{"Range with public IPs", "8.8.8.8-8.8.8.100", false},
		{"Range too large", "192.168.0.1-192.168.5.254", false},
		{"Invalid start IP", "999.999.999.999-192.168.1.100", false},
		{"Invalid end IP", "192.168.1.1-999.999.999.999", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateSubnet(tt.subnet)
			if tt.valid {
				assert.NoError(t, err)
			} else {
				assert.Error(t, err)
			}
		})
	}
}

func TestIsValidVersionFormat(t *testing.T) {
	tests := []struct {
		version string
		valid   bool
	}{
		{"7.8", true},
		{"6.49.8", true},
		{"7.12", true},
		{"1.0", true},
		{"7.12rc1", true},
		{"RouterOS 7.8", false},
		{"7", false},
		{".7.8", false},
		{"7.", false},
		{"", false},
		{"7..8", false},
		{"7.a", false},
	}

	for _, tt := range tests {
		t.Run(tt.version, func(t *testing.T) {
			result := isValidVersionFormat(tt.version)
			assert.Equal(t, tt.valid, result)
		})
	}
}
