package services

import (
	"encoding/json"
	"fmt"

	cfglib "backend/internal/config"
)

// MTProxyGenerator generates MTProxy configuration (JSON format for CLI args).
type MTProxyGenerator struct {
	*cfglib.BaseGenerator
}

// NewMTProxyGenerator creates a new MTProxy config generator.
func NewMTProxyGenerator() *MTProxyGenerator {
	schema := &cfglib.Schema{
		ServiceType: "mtproxy",
		Version:     "1.0.0",
		Fields: []cfglib.Field{
			{
				Name:        "port",
				Type:        "port",
				Required:    true,
				Default:     8443,
				Min:         intPtr(1024),
				Max:         intPtr(65535),
				Description: "Proxy listening port",
			},
			{
				Name:        "secret",
				Type:        "string",
				Required:    true,
				Description: "Proxy secret (32-character hex string)",
				Sensitive:   true,
				Placeholder: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
			},
			{
				Name:        "tag",
				Type:        "string",
				Required:    false,
				Description: "Optional tag for sponsored channels",
				Placeholder: "your-tag-here",
			},
			{
				Name:        "workers",
				Type:        "int",
				Required:    true,
				Default:     2,
				Min:         intPtr(1),
				Max:         intPtr(16),
				Description: "Number of worker threads",
			},
			{
				Name:        "max_connections",
				Type:        "int",
				Required:    true,
				Default:     60000,
				Min:         intPtr(100),
				Max:         intPtr(100000),
				Description: "Maximum concurrent connections",
			},
			{
				Name:        "stats_port",
				Type:        "port",
				Required:    false,
				Min:         intPtr(1024),
				Max:         intPtr(65535),
				Description: "Statistics HTTP server port (optional)",
			},
		},
	}

	return &MTProxyGenerator{
		BaseGenerator: cfglib.NewBaseGenerator("mtproxy", schema, nil),
	}
}

// Generate generates MTProxy configuration as JSON (for CLI arguments).
func (g *MTProxyGenerator) Generate(instanceID string, config map[string]interface{}, bindIP string) ([]byte, error) {
	// Merge with defaults FIRST
	config = g.Schema.MergeWithDefaults(config)

	// Then validate (after defaults are applied)
	if validateErr := g.Validate(config, bindIP); validateErr != nil {
		return nil, fmt.Errorf("validation failed: %w", validateErr)
	}

	port := getIntValue(config, "port", 8443)
	secret, _ := config["secret"].(string) //nolint:errcheck // type assertion uses zero value default
	tag, _ := config["tag"].(string)       //nolint:errcheck // type assertion uses zero value default
	workers := getIntValue(config, "workers", 2)
	maxConnections := getIntValue(config, "max_connections", 60000)
	statsPort := getIntValue(config, "stats_port", 0)

	// Build CLI arguments as JSON
	// MTProxy typically runs with: mtproxy -u nobody -p 8888 -H 443 -S <secret> ...
	mtproxyConfig := map[string]interface{}{
		"bind_ip":         bindIP,
		"port":            port,
		"secret":          secret,
		"workers":         workers,
		"max_connections": maxConnections,
	}

	if tag != "" {
		mtproxyConfig["tag"] = tag
	}

	if statsPort > 0 {
		mtproxyConfig["stats_port"] = statsPort
		mtproxyConfig["stats_bind_ip"] = bindIP
	}

	// Return JSON representation
	data, err := json.MarshalIndent(mtproxyConfig, "", "  ")
	if err != nil {
		return nil, fmt.Errorf("JSON marshaling failed: %w", err)
	}

	return data, nil
}

// Validate performs MTProxy-specific validation.
func (g *MTProxyGenerator) Validate(config map[string]interface{}, bindIP string) error {
	// Base validation (schema + bind IP)
	if configErr := g.ValidateConfig(config, bindIP); configErr != nil {
		return configErr
	}

	// Validate secret format (32-character hex string)
	secret, _ := config["secret"].(string) //nolint:errcheck // type assertion uses zero value default
	if len(secret) != 32 {
		return fmt.Errorf("secret must be exactly 32 characters (hex), got %d", len(secret))
	}

	// Validate hex characters
	for _, char := range secret {
		if !((char >= '0' && char <= '9') || (char >= 'a' && char <= 'f') || (char >= 'A' && char <= 'F')) {
			return fmt.Errorf("secret must contain only hexadecimal characters (0-9, a-f)")
		}
	}

	return nil
}

// Config file constants for MTProxy.
const (
	mtproxyConfigFileName = "config.json"
	mtproxyConfigFormat   = "json"
)

// GetConfigFileName returns the filename for the generated config.
func (g *MTProxyGenerator) GetConfigFileName() string {
	return mtproxyConfigFileName
}

// GetConfigFormat returns the config file format.
func (g *MTProxyGenerator) GetConfigFormat() string {
	return mtproxyConfigFormat
}
