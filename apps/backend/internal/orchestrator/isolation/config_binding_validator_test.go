package isolation

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestConfigBindingValidator_Tor_ValidIP(t *testing.T) {
	validator := NewConfigBindingValidator()

	config := `# Tor configuration
SOCKSPort 192.168.1.10:9050
ControlPort 127.0.0.1:9051
# Another comment
`

	ips, err := validator.ExtractBindIPs("tor", config)
	require.NoError(t, err)
	assert.Len(t, ips, 2)
	assert.Contains(t, ips, "192.168.1.10")
	assert.Contains(t, ips, "127.0.0.1")
}

func TestConfigBindingValidator_Tor_WildcardRejection(t *testing.T) {
	validator := NewConfigBindingValidator()

	testCases := []struct {
		name   string
		config string
	}{
		{
			name: "0.0.0.0 wildcard",
			config: `SOCKSPort 0.0.0.0:9050
ControlPort 127.0.0.1:9051`,
		},
		{
			name: ":: wildcard (IPv6)",
			config: `SOCKSPort [::]:9050
ControlPort 127.0.0.1:9051`,
		},
		{
			name:   "* wildcard",
			config: `SOCKSPort *:9050`,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			_, err := validator.ExtractBindIPs("tor", tc.config)
			assert.Error(t, err)
			assert.Contains(t, err.Error(), "wildcard binding detected")
		})
	}
}

func TestConfigBindingValidator_SingBox_ValidIP(t *testing.T) {
	validator := NewConfigBindingValidator()

	config := `{
  "inbounds": [
    {
      "type": "socks",
      "listen": "192.168.1.10",
      "listen_port": 1080
    },
    {
      "type": "http",
      "listen": "192.168.1.11",
      "listen_port": 8080
    }
  ]
}`

	ips, err := validator.ExtractBindIPs("sing-box", config)
	require.NoError(t, err)
	assert.Len(t, ips, 2)
	assert.Contains(t, ips, "192.168.1.10")
	assert.Contains(t, ips, "192.168.1.11")
}

func TestConfigBindingValidator_SingBox_WildcardRejection(t *testing.T) {
	validator := NewConfigBindingValidator()

	testCases := []struct {
		name   string
		config string
	}{
		{
			name: "0.0.0.0 wildcard",
			config: `{
  "inbounds": [
    {
      "type": "socks",
      "listen": "0.0.0.0",
      "listen_port": 1080
    }
  ]
}`,
		},
		{
			name: ":: wildcard (IPv6)",
			config: `{
  "inbounds": [
    {
      "type": "socks",
      "listen": "::",
      "listen_port": 1080
    }
  ]
}`,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			_, err := validator.ExtractBindIPs("sing-box", tc.config)
			assert.Error(t, err)
			assert.Contains(t, err.Error(), "wildcard binding detected")
		})
	}
}

func TestConfigBindingValidator_XrayCore_ValidIP(t *testing.T) {
	validator := NewConfigBindingValidator()

	config := `{
  "inbounds": [
    {
      "protocol": "vless",
      "listen": "192.168.1.20",
      "port": 443
    },
    {
      "protocol": "vmess",
      "listen": "192.168.1.21",
      "port": 8443
    }
  ]
}`

	ips, err := validator.ExtractBindIPs("xray-core", config)
	require.NoError(t, err)
	assert.Len(t, ips, 2)
	assert.Contains(t, ips, "192.168.1.20")
	assert.Contains(t, ips, "192.168.1.21")
}

func TestConfigBindingValidator_XrayCore_WildcardRejection(t *testing.T) {
	validator := NewConfigBindingValidator()

	testCases := []struct {
		name   string
		config string
	}{
		{
			name: "0.0.0.0 wildcard",
			config: `{
  "inbounds": [
    {
      "protocol": "vless",
      "listen": "0.0.0.0",
      "port": 443
    }
  ]
}`,
		},
		{
			name: "* wildcard",
			config: `{
  "inbounds": [
    {
      "protocol": "vless",
      "listen": "*",
      "port": 443
    }
  ]
}`,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			_, err := validator.ExtractBindIPs("xray-core", tc.config)
			assert.Error(t, err)
			assert.Contains(t, err.Error(), "wildcard binding detected")
		})
	}
}

func TestConfigBindingValidator_MTProxy_ValidIP(t *testing.T) {
	validator := NewConfigBindingValidator()

	config := `-bind-to 192.168.1.30:8888 -secret abcdef1234567890 -workers 4`

	ips, err := validator.ExtractBindIPs("mtproxy", config)
	require.NoError(t, err)
	assert.Len(t, ips, 1)
	assert.Contains(t, ips, "192.168.1.30")
}

func TestConfigBindingValidator_MTProxy_WildcardRejection(t *testing.T) {
	validator := NewConfigBindingValidator()

	testCases := []struct {
		name   string
		config string
	}{
		{
			name:   "0.0.0.0 wildcard",
			config: `-bind-to 0.0.0.0:8888 -secret abcdef`,
		},
		{
			name:   ":: wildcard (IPv6)",
			config: `-bind-to [::]:8888 -secret abcdef`,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			_, err := validator.ExtractBindIPs("mtproxy", tc.config)
			assert.Error(t, err)
			assert.Contains(t, err.Error(), "wildcard binding detected")
		})
	}
}

func TestConfigBindingValidator_AdGuardHome_ValidIP(t *testing.T) {
	validator := NewConfigBindingValidator()

	config := `bind_host: 192.168.1.40
dns:
  bind_hosts:
    - 192.168.1.40
    - 192.168.1.41
  port: 53
`

	ips, err := validator.ExtractBindIPs("adguard-home", config)
	require.NoError(t, err)
	assert.Len(t, ips, 3)
	assert.Contains(t, ips, "192.168.1.40")
	assert.Contains(t, ips, "192.168.1.41")
}

func TestConfigBindingValidator_AdGuardHome_WildcardRejection(t *testing.T) {
	validator := NewConfigBindingValidator()

	testCases := []struct {
		name   string
		config string
	}{
		{
			name: "0.0.0.0 in bind_host",
			config: `bind_host: 0.0.0.0
dns:
  bind_hosts:
    - 192.168.1.40
`,
		},
		{
			name: "0.0.0.0 in bind_hosts array",
			config: `bind_host: 192.168.1.40
dns:
  bind_hosts:
    - 0.0.0.0
    - 192.168.1.41
`,
		},
		{
			name: ":: wildcard (IPv6)",
			config: `bind_host: ::
dns:
  port: 53
`,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			_, err := validator.ExtractBindIPs("adguard-home", tc.config)
			assert.Error(t, err)
			assert.Contains(t, err.Error(), "wildcard binding detected")
		})
	}
}

func TestConfigBindingValidator_Psiphon_ValidIP(t *testing.T) {
	validator := NewConfigBindingValidator()

	config := `{
  "ListenInterface": "192.168.1.50",
  "TunnelProtocol": "SSH",
  "LocalHttpProxyPort": 8080
}`

	ips, err := validator.ExtractBindIPs("psiphon", config)
	require.NoError(t, err)
	assert.Len(t, ips, 1)
	assert.Contains(t, ips, "192.168.1.50")
}

func TestConfigBindingValidator_Psiphon_WildcardRejection(t *testing.T) {
	validator := NewConfigBindingValidator()

	testCases := []struct {
		name   string
		config string
	}{
		{
			name: "0.0.0.0 wildcard",
			config: `{
  "ListenInterface": "0.0.0.0",
  "TunnelProtocol": "SSH"
}`,
		},
		{
			name: "* wildcard",
			config: `{
  "ListenInterface": "*",
  "TunnelProtocol": "SSH"
}`,
		},
		{
			name: "empty string wildcard",
			config: `{
  "ListenInterface": "",
  "TunnelProtocol": "SSH"
}`,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			_, err := validator.ExtractBindIPs("psiphon", tc.config)
			assert.Error(t, err)
			assert.Contains(t, err.Error(), "wildcard binding detected")
		})
	}
}

func TestConfigBindingValidator_UnsupportedServiceType(t *testing.T) {
	validator := NewConfigBindingValidator()

	_, err := validator.ExtractBindIPs("unknown-service", "some config")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "unsupported service type")
}

func TestConfigBindingValidator_InvalidJSON(t *testing.T) {
	validator := NewConfigBindingValidator()

	_, err := validator.ExtractBindIPs("sing-box", "not valid json")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "failed to parse")
}

func TestConfigBindingValidator_InvalidYAML(t *testing.T) {
	validator := NewConfigBindingValidator()

	config := `bind_host: 192.168.1.1
dns:
  bind_hosts:
    - 192.168.1.2
    invalid yaml structure here
`

	_, err := validator.ExtractBindIPs("adguard-home", config)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "failed to parse")
}

func TestConfigBindingValidator_EmptyConfig(t *testing.T) {
	validator := NewConfigBindingValidator()

	// Test empty Tor config
	ips, err := validator.ExtractBindIPs("tor", "")
	require.NoError(t, err)
	assert.Len(t, ips, 0)

	// Test empty sing-box config
	ips, err = validator.ExtractBindIPs("sing-box", `{"inbounds": []}`)
	require.NoError(t, err)
	assert.Len(t, ips, 0)
}

func TestConfigBindingValidator_IPv6Support(t *testing.T) {
	validator := NewConfigBindingValidator()

	// Test Tor with IPv6
	torConfig := `SOCKSPort [2001:db8::1]:9050
ControlPort [fe80::1]:9051`

	ips, err := validator.ExtractBindIPs("tor", torConfig)
	require.NoError(t, err)
	assert.Len(t, ips, 2)
	assert.Contains(t, ips, "2001:db8::1")
	assert.Contains(t, ips, "fe80::1")

	// Test sing-box with IPv6
	singBoxConfig := `{
  "inbounds": [
    {
      "type": "socks",
      "listen": "2001:db8::2",
      "listen_port": 1080
    }
  ]
}`

	ips, err = validator.ExtractBindIPs("sing-box", singBoxConfig)
	require.NoError(t, err)
	assert.Len(t, ips, 1)
	assert.Contains(t, ips, "2001:db8::2")
}

func TestConfigBindingValidator_MultipleBindings(t *testing.T) {
	validator := NewConfigBindingValidator()

	// Test multiple MTProxy bind-to flags
	config := `-bind-to 192.168.1.1:8888 -secret abc -bind-to 192.168.1.2:8889 -workers 4`

	ips, err := validator.ExtractBindIPs("mtproxy", config)
	require.NoError(t, err)
	assert.Len(t, ips, 2)
	assert.Contains(t, ips, "192.168.1.1")
	assert.Contains(t, ips, "192.168.1.2")
}

func TestConfigBindingValidator_CommentsInTorConfig(t *testing.T) {
	validator := NewConfigBindingValidator()

	config := `# Main SOCKS port
SOCKSPort 192.168.1.10:9050
# Control port for management
ControlPort 127.0.0.1:9051

# Disabled port
# SOCKSPort 0.0.0.0:9052
`

	ips, err := validator.ExtractBindIPs("tor", config)
	require.NoError(t, err)
	assert.Len(t, ips, 2)
	assert.Contains(t, ips, "192.168.1.10")
	assert.Contains(t, ips, "127.0.0.1")
	// Should not include the commented out wildcard
	assert.NotContains(t, ips, "0.0.0.0")
}
