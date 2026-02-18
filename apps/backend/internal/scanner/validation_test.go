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
