package vif

import (
	"os"
	"path/filepath"
	"testing"

	"backend/generated/ent"
	"backend/internal/features"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gopkg.in/yaml.v3"
)

func TestGenerateGatewayConfig_Tor(t *testing.T) {
	instance := &ent.ServiceInstance{
		ID: "usa-01",
		Config: map[string]interface{}{
			"vlan_ip":    "10.99.101.1",
			"socks_port": 9050,
		},
	}

	manifest := &features.Manifest{
		Service: "tor",
	}

	config, tunName, err := GenerateGatewayConfig(instance, manifest)
	require.NoError(t, err)

	assert.Equal(t, "tun-tor-usa-01", tunName)
	assert.Equal(t, tunName, config.Tunnel.Name)
	assert.Equal(t, 8500, config.Tunnel.MTU)
	assert.Equal(t, "10.99.101.1", config.Socks5.Address)
	assert.Equal(t, 9050, config.Socks5.Port)
	assert.Nil(t, config.Socks5.UDP, "Tor should not have UDP enabled")
	assert.Equal(t, "warn", config.Misc.LogLevel)
}

func TestGenerateGatewayConfig_SingBox(t *testing.T) {
	instance := &ent.ServiceInstance{
		ID: "sg-proxy",
		Config: map[string]interface{}{
			"socks_address": "10.99.102.1",
			"socks_port":    1080,
		},
	}

	manifest := &features.Manifest{
		Service: "singbox",
	}

	config, tunName, err := GenerateGatewayConfig(instance, manifest)
	require.NoError(t, err)

	assert.Equal(t, "tun-sb-sg-proxy", tunName)
	assert.Equal(t, "10.99.102.1", config.Socks5.Address)
	assert.Equal(t, 1080, config.Socks5.Port)
	assert.NotNil(t, config.Socks5.UDP, "sing-box should have UDP enabled")
	assert.Equal(t, "udp", *config.Socks5.UDP)
}

func TestGenerateGatewayConfig_Xray(t *testing.T) {
	instance := &ent.ServiceInstance{
		ID: "hk-01",
		Config: map[string]interface{}{
			"vlan_ip":    "10.99.103.1",
			"socks_port": float64(10808), // JSON numbers are float64
		},
	}

	manifest := &features.Manifest{
		Service: "xray",
	}

	config, _, err := GenerateGatewayConfig(instance, manifest)
	require.NoError(t, err)

	assert.NotNil(t, config.Socks5.UDP, "xray should have UDP enabled")
	assert.Equal(t, "udp", *config.Socks5.UDP)
}

func TestGenerateGatewayConfig_Psiphon(t *testing.T) {
	instance := &ent.ServiceInstance{
		ID: "psiphon-1",
		Config: map[string]interface{}{
			"vlan_ip":    "10.99.104.1",
			"socks_port": 1080,
		},
	}

	manifest := &features.Manifest{
		Service: "psiphon",
	}

	config, tunName, err := GenerateGatewayConfig(instance, manifest)
	require.NoError(t, err)

	assert.Equal(t, "tun-psi-psiphon", tunName) // "psiphon-1" truncated
	assert.NotNil(t, config.Socks5.UDP, "psiphon should have UDP enabled")
}

func TestWriteGatewayYAML(t *testing.T) {
	tmpDir := t.TempDir()
	configPath := filepath.Join(tmpDir, "gateways", "test.yaml")

	udpValue := "udp"
	config := &GatewayConfig{
		Tunnel: TunnelConfig{
			Name: "tun-test",
			MTU:  8500,
		},
		Socks5: Socks5Config{
			Address: "10.99.1.1",
			Port:    9050,
			UDP:     &udpValue,
		},
		Misc: MiscConfig{
			LogLevel: "warn",
		},
	}

	err := WriteGatewayYAML(config, configPath)
	require.NoError(t, err)

	// Verify file exists
	_, err = os.Stat(configPath)
	require.NoError(t, err)

	// Read and parse YAML
	data, err := os.ReadFile(configPath)
	require.NoError(t, err)

	var parsed GatewayConfig
	err = yaml.Unmarshal(data, &parsed)
	require.NoError(t, err)

	assert.Equal(t, "tun-test", parsed.Tunnel.Name)
	assert.Equal(t, 9050, parsed.Socks5.Port)
	assert.NotNil(t, parsed.Socks5.UDP)
	assert.Equal(t, "udp", *parsed.Socks5.UDP)
}

func TestWriteGatewayYAML_NoUDP(t *testing.T) {
	tmpDir := t.TempDir()
	configPath := filepath.Join(tmpDir, "test-no-udp.yaml")

	config := &GatewayConfig{
		Tunnel: TunnelConfig{
			Name: "tun-tor",
			MTU:  8500,
		},
		Socks5: Socks5Config{
			Address: "10.99.1.1",
			Port:    9050,
			UDP:     nil, // No UDP
		},
		Misc: MiscConfig{
			LogLevel: "warn",
		},
	}

	err := WriteGatewayYAML(config, configPath)
	require.NoError(t, err)

	// Read YAML as string to verify UDP key is omitted
	data, err := os.ReadFile(configPath)
	require.NoError(t, err)

	yamlStr := string(data)
	assert.NotContains(t, yamlStr, "udp:", "UDP key should be omitted when nil")
}

func TestGenerateTunName(t *testing.T) {
	tests := []struct {
		name       string
		service    string
		instanceID string
		expected   string
	}{
		{
			name:       "tor short id",
			service:    "tor",
			instanceID: "usa",
			expected:   "tun-tor-usa",
		},
		{
			name:       "singbox abbreviation",
			service:    "singbox",
			instanceID: "sg-01",
			expected:   "tun-sb-sg-01",
		},
		{
			name:       "xray abbreviation",
			service:    "xray",
			instanceID: "hk",
			expected:   "tun-xr-hk",
		},
		{
			name:       "psiphon abbreviation",
			service:    "psiphon",
			instanceID: "ca",
			expected:   "tun-psi-ca",
		},
		{
			name:       "truncate long name",
			service:    "tor",
			instanceID: "very-long-instance-id",
			expected:   "tun-tor-very-lo", // 15 chars max
		},
		{
			name:       "unknown service truncated",
			service:    "unknownservice",
			instanceID: "test",
			expected:   "tun-unkn-test",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := generateTunName(tt.service, tt.instanceID)
			assert.Equal(t, tt.expected, result)
			assert.LessOrEqual(t, len(result), 15, "TUN name must not exceed 15 chars")
		})
	}
}

func TestExtractSocksEndpoint(t *testing.T) {
	tests := []struct {
		name        string
		config      map[string]interface{}
		expectAddr  string
		expectPort  int
		expectError bool
	}{
		{
			name: "socks_address and socks_port",
			config: map[string]interface{}{
				"socks_address": "10.99.1.1",
				"socks_port":    9050,
			},
			expectAddr: "10.99.1.1",
			expectPort: 9050,
		},
		{
			name: "vlan_ip fallback",
			config: map[string]interface{}{
				"vlan_ip":    "10.99.2.1",
				"socks_port": 1080,
			},
			expectAddr: "10.99.2.1",
			expectPort: 1080,
		},
		{
			name: "port as float64",
			config: map[string]interface{}{
				"vlan_ip":    "10.99.3.1",
				"socks_port": float64(8080),
			},
			expectAddr: "10.99.3.1",
			expectPort: 8080,
		},
		{
			name: "missing address",
			config: map[string]interface{}{
				"socks_port": 9050,
			},
			expectError: true,
		},
		{
			name: "invalid port",
			config: map[string]interface{}{
				"vlan_ip":    "10.99.1.1",
				"socks_port": 70000,
			},
			expectError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			instance := &ent.ServiceInstance{
				Config: tt.config,
			}

			addr, port, err := extractSocksEndpoint(instance)
			if tt.expectError {
				assert.Error(t, err)
			} else {
				require.NoError(t, err)
				assert.Equal(t, tt.expectAddr, addr)
				assert.Equal(t, tt.expectPort, port)
			}
		})
	}
}

func TestSupportsUDP(t *testing.T) {
	tests := []struct {
		service string
		expect  bool
	}{
		{"tor", false},
		{"singbox", true},
		{"xray", true},
		{"psiphon", true},
		{"unknown", false},
	}

	for _, tt := range tests {
		t.Run(tt.service, func(t *testing.T) {
			manifest := &features.Manifest{
				Service: tt.service,
			}
			result := supportsUDP(manifest)
			assert.Equal(t, tt.expect, result)
		})
	}
}
