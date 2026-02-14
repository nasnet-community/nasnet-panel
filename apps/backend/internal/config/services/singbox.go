package services

import (
	"fmt"

	cfglib "backend/internal/config"
)

// SingboxGenerator generates sing-box JSON configuration files.
type SingboxGenerator struct {
	*cfglib.BaseGenerator
}

// NewSingboxGenerator creates a new sing-box config generator.
func NewSingboxGenerator() *SingboxGenerator {
	schema := &cfglib.ConfigSchema{
		ServiceType: "singbox",
		Version:     "1.0.0",
		Fields: []cfglib.ConfigField{
			{
				Name:        "listen_address",
				Type:        "ip",
				Required:    false,
				Description: "Listen address (defaults to bind_ip)",
			},
			{
				Name:        "socks_port",
				Type:        "port",
				Required:    true,
				Default:     10808,
				Min:         intPtr(1024),
				Max:         intPtr(65535),
				Description: "SOCKS5 proxy port",
			},
			{
				Name:        "http_port",
				Type:        "port",
				Required:    true,
				Default:     10809,
				Min:         intPtr(1024),
				Max:         intPtr(65535),
				Description: "HTTP proxy port",
			},
			{
				Name:        "mixed_port",
				Type:        "port",
				Required:    false,
				Min:         intPtr(1024),
				Max:         intPtr(65535),
				Description: "Mixed SOCKS/HTTP port (optional)",
			},
			{
				Name:        "log_level",
				Type:        "enum",
				Required:    true,
				Default:     "info",
				EnumValues:  []string{"trace", "debug", "info", "warn", "error", "fatal", "panic"},
				Description: "Log verbosity level",
			},
			{
				Name:        "dns_server",
				Type:        "string",
				Required:    true,
				Default:     "1.1.1.1",
				Description: "DNS server address",
			},
			{
				Name:        "sniff_enabled",
				Type:        "bool",
				Required:    true,
				Default:     true,
				Description: "Enable traffic sniffing",
			},
		},
	}

	return &SingboxGenerator{
		BaseGenerator: cfglib.NewBaseGenerator("singbox", schema, nil),
	}
}

// Generate generates a sing-box JSON configuration file.
func (g *SingboxGenerator) Generate(instanceID string, config map[string]interface{}, bindIP string) ([]byte, error) {
	// Merge with defaults FIRST
	config = g.Schema.MergeWithDefaults(config)

	// Then validate (after defaults are applied)
	if err := g.Validate(config, bindIP); err != nil {
		return nil, fmt.Errorf("validation failed: %w", err)
	}

	// Use bind_ip as listen_address if not specified
	listenAddr := bindIP
	if addr, ok := config["listen_address"].(string); ok && addr != "" {
		listenAddr = addr
	}

	// Build JSON configuration
	socksPort := getIntValue(config, "socks_port", 10808)
	httpPort := getIntValue(config, "http_port", 10809)
	logLevel, _ := config["log_level"].(string)
	dnsServer, _ := config["dns_server"].(string)
	sniffEnabled, _ := config["sniff_enabled"].(bool)

	singboxConfig := map[string]interface{}{
		"log": map[string]interface{}{
			"level": logLevel,
		},
		"dns": map[string]interface{}{
			"servers": []string{dnsServer},
		},
		"inbounds": []interface{}{
			map[string]interface{}{
				"type":   "socks",
				"tag":    "socks-in",
				"listen": listenAddr,
				"port":   socksPort,
				"sniff":  sniffEnabled,
			},
			map[string]interface{}{
				"type":   "http",
				"tag":    "http-in",
				"listen": listenAddr,
				"port":   httpPort,
				"sniff":  sniffEnabled,
			},
		},
		"outbounds": []interface{}{
			map[string]interface{}{
				"type": "direct",
				"tag":  "direct",
			},
		},
	}

	// Add mixed port if specified
	if mixedPort, ok := config["mixed_port"].(int); ok && mixedPort > 0 {
		singboxConfig["inbounds"] = append(singboxConfig["inbounds"].([]interface{}), map[string]interface{}{
			"type":   "mixed",
			"tag":    "mixed-in",
			"listen": listenAddr,
			"port":   mixedPort,
			"sniff":  sniffEnabled,
		})
	}

	// Render as JSON
	return g.RenderJSON(singboxConfig)
}

// Validate performs sing-box-specific validation.
func (g *SingboxGenerator) Validate(config map[string]interface{}, bindIP string) error {
	// Base validation (schema + bind IP)
	if err := g.ValidateConfig(config, bindIP); err != nil {
		return err
	}

	// Validate DNS server is a valid IP or hostname
	dnsServer, _ := config["dns_server"].(string)
	if err := cfglib.ValidateNonEmpty("dns_server", dnsServer); err != nil {
		return err
	}

	// Validate listen_address if provided
	if listenAddr, ok := config["listen_address"].(string); ok && listenAddr != "" {
		if err := cfglib.ValidateBindIP(listenAddr); err != nil {
			return fmt.Errorf("listen_address validation failed: %w", err)
		}
	}

	return nil
}

// GetConfigFileName returns the filename for the generated config.
func (g *SingboxGenerator) GetConfigFileName() string {
	return "config.json"
}

// GetConfigFormat returns the config file format.
func (g *SingboxGenerator) GetConfigFormat() string {
	return "json"
}

// getIntValue safely extracts an int value from config
func getIntValue(config map[string]interface{}, key string, defaultVal int) int {
	switch v := config[key].(type) {
	case int:
		return v
	case float64:
		return int(v)
	default:
		return defaultVal
	}
}
