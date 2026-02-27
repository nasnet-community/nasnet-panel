package vif

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"backend/generated/ent"
	"backend/internal/features"

	"gopkg.in/yaml.v3"
)

// GatewayConfig represents the configuration for hev-socks5-tunnel
type GatewayConfig struct {
	Tunnel          TunnelConfig `yaml:"tunnel"`
	Socks5          Socks5Config `yaml:"socks5"`
	Misc            MiscConfig   `yaml:"misc"`
	EgressInterface string       `yaml:"-"` // not serialized to YAML config, used internally
}

// TunnelConfig represents the tunnel interface configuration
type TunnelConfig struct {
	Name string `yaml:"name"`
	MTU  int    `yaml:"mtu"`
}

// Socks5Config represents the SOCKS5 proxy configuration
type Socks5Config struct {
	Address string  `yaml:"address"`
	Port    int     `yaml:"port"`
	UDP     *string `yaml:"udp,omitempty"` // Pointer to handle omitempty correctly
}

// MiscConfig represents miscellaneous configuration
type MiscConfig struct {
	LogLevel string `yaml:"log-level"`
}

// GenerateGatewayConfig creates a gateway configuration from instance and manifest
func GenerateGatewayConfig(instance *ent.ServiceInstance, manifest *features.Manifest) (*GatewayConfig, string, error) {
	// Extract SOCKS5 address and port from instance
	socksAddr, socksPort, err := extractSocksEndpoint(instance)
	if err != nil {
		return nil, "", fmt.Errorf("failed to extract SOCKS endpoint: %w", err)
	}

	// Generate TUN interface name
	tunName := generateTunName(manifest.ID, instance.ID)

	// Determine UDP support
	udpEnabled := supportsUDP(manifest)

	// Build config
	config := &GatewayConfig{
		Tunnel: TunnelConfig{
			Name: tunName,
			MTU:  8500,
		},
		Socks5: Socks5Config{
			Address: socksAddr,
			Port:    socksPort,
		},
		Misc: MiscConfig{
			LogLevel: "warn",
		},
	}

	// Only include UDP field if enabled (string 'udp', not boolean)
	if udpEnabled {
		udpValue := "udp"
		config.Socks5.UDP = &udpValue
	}

	// Extract egress interface from instance config (bridge mode)
	if egressIface, ok := instance.Config["egress_interface"].(string); ok && egressIface != "" {
		config.EgressInterface = egressIface
	}

	return config, tunName, nil
}

// WriteGatewayYAML writes the gateway configuration to a YAML file
func WriteGatewayYAML(config *GatewayConfig, configPath string) error {
	// Ensure directory exists
	dir := filepath.Dir(configPath)
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return fmt.Errorf("failed to create config directory: %w", err)
	}

	// Marshal to YAML
	data, err := yaml.Marshal(config)
	if err != nil {
		return fmt.Errorf("failed to marshal config: %w", err)
	}

	// Write to file
	if err := os.WriteFile(configPath, data, 0o644); err != nil {
		return fmt.Errorf("failed to write config file: %w", err)
	}

	return nil
}

// generateTunName creates a TUN interface name following Linux IFNAMSIZ limit (15 chars)
// Pattern: tun-{svc}-{inst} with service abbreviations
func generateTunName(serviceName, instanceID string) string {
	// Service abbreviations
	abbrev := map[string]string{
		"tor":     "tor",
		"singbox": "sb",
		"xray":    "xr",
		"psiphon": "psi",
	}

	// Get abbreviated service name
	svcAbbr := abbrev[strings.ToLower(serviceName)]
	if svcAbbr == "" {
		svcAbbr = serviceName
		if len(svcAbbr) > 4 {
			svcAbbr = svcAbbr[:4]
		}
	}

	// Build name: tun-{svc}-{inst}
	name := fmt.Sprintf("tun-%s-%s", svcAbbr, instanceID)

	// Truncate to 15 chars if needed (Linux IFNAMSIZ limit)
	if len(name) > 15 {
		name = name[:15]
	}

	return name
}

// extractSocksEndpoint extracts SOCKS5 address and port from instance config
func extractSocksEndpoint(instance *ent.ServiceInstance) (addr string, port int, err error) {
	config := instance.Config

	// Extract address (VLAN IP or host IP)
	addr, ok := config["socks_address"].(string)
	if !ok || addr == "" {
		addr, ok = config["vlan_ip"].(string)
		if !ok || addr == "" {
			return "", 0, fmt.Errorf("no socks_address or vlan_ip in config")
		}
	}

	// Extract port
	switch p := config["socks_port"].(type) {
	case int:
		port = p
	case float64:
		port = int(p)
	case string:
		_, _ = fmt.Sscanf(p, "%d", &port) //nolint:errcheck // port parsing with validation on next line
	default:
		return "", 0, fmt.Errorf("invalid socks_port type: %T", p)
	}

	if port <= 0 || port > 65535 {
		return "", 0, fmt.Errorf("invalid port: %d", port)
	}

	return addr, port, nil
}

// supportsUDP checks if the service supports UDP through SOCKS5
func supportsUDP(manifest *features.Manifest) bool {
	// Services that support UDP
	udpServices := map[string]bool{
		"singbox": true,
		"xray":    true,
		"psiphon": true,
	}

	return udpServices[strings.ToLower(manifest.ID)]
}
