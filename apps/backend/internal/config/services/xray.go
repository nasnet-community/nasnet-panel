package services

import (
	"fmt"

	cfglib "backend/internal/config"
)

// XrayGenerator generates Xray JSON configuration files.
type XrayGenerator struct {
	*cfglib.BaseGenerator
}

// NewXrayGenerator creates a new Xray config generator.
func NewXrayGenerator() *XrayGenerator {
	schema := &cfglib.Schema{
		ServiceType: "xray",
		Version:     "1.0.0",
		Fields: []cfglib.Field{
			{
				Name:        "protocol",
				Type:        "enum",
				Required:    true,
				Default:     "vless",
				EnumValues:  []string{"vless", "vmess", "trojan", "shadowsocks"},
				Description: "Inbound protocol type",
			},
			{
				Name:        "port",
				Type:        "port",
				Required:    true,
				Default:     10443,
				Min:         intPtr(1024),
				Max:         intPtr(65535),
				Description: "Inbound port",
			},
			{
				Name:        "uuid",
				Type:        "string",
				Required:    true,
				Description: "UUID for VLESS/VMess authentication",
				Placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
			},
			{
				Name:        "tls_enabled",
				Type:        "bool",
				Required:    true,
				Default:     false,
				Description: "Enable TLS encryption",
			},
			{
				Name:        "tls_cert_path",
				Type:        "string",
				Required:    false,
				Description: "Path to TLS certificate file",
				Placeholder: "/etc/xray/cert.pem",
			},
			{
				Name:        "tls_key_path",
				Type:        "string",
				Required:    false,
				Description: "Path to TLS private key file",
				Placeholder: "/etc/xray/key.pem",
			},
			{
				Name:        "fallback_port",
				Type:        "port",
				Required:    false,
				Min:         intPtr(1),
				Max:         intPtr(65535),
				Description: "Fallback port for disguise (e.g., nginx)",
			},
			{
				Name:        "log_level",
				Type:        "enum",
				Required:    true,
				Default:     "warning",
				EnumValues:  []string{"debug", "info", "warning", "error", "none"},
				Description: "Log verbosity level",
			},
		},
	}

	return &XrayGenerator{
		BaseGenerator: cfglib.NewBaseGenerator("xray", schema, nil),
	}
}

// Generate generates an Xray JSON configuration file.
func (g *XrayGenerator) Generate(instanceID string, config map[string]interface{}, bindIP string) ([]byte, error) {
	// Merge with defaults FIRST
	config = g.Schema.MergeWithDefaults(config)

	// Then validate (after defaults are applied)
	if validateErr := g.Validate(config, bindIP); validateErr != nil {
		return nil, fmt.Errorf("validation failed: %w", validateErr)
	}

	//nolint:errcheck // type assertion uses zero value default
	protocol, _ := config["protocol"].(string)
	port := getIntValue(config, "port", 10443)
	//nolint:errcheck // type assertion uses zero value default
	uuid, _ := config["uuid"].(string)
	//nolint:errcheck // type assertion uses zero value default
	tlsEnabled, _ := config["tls_enabled"].(bool)
	//nolint:errcheck // type assertion uses zero value default
	logLevel, _ := config["log_level"].(string)

	// Build inbound settings based on protocol
	inboundSettings := map[string]interface{}{
		"clients": []map[string]interface{}{
			{
				"id": uuid,
			},
		},
	}

	// Build TLS configuration if enabled
	var streamSettings map[string]interface{}
	if tlsEnabled {
		tlsCertPath, _ := config["tls_cert_path"].(string) //nolint:errcheck // type assertion uses zero value default
		tlsKeyPath, _ := config["tls_key_path"].(string)   //nolint:errcheck // type assertion uses zero value default

		streamSettings = map[string]interface{}{
			"security": "tls",
			"tlsSettings": map[string]interface{}{
				"certificates": []map[string]interface{}{
					{
						"certificateFile": tlsCertPath,
						"keyFile":         tlsKeyPath,
					},
				},
			},
		}
	}

	inbound := map[string]interface{}{
		"port":     port,
		"protocol": protocol,
		"listen":   bindIP,
		"settings": inboundSettings,
	}

	if streamSettings != nil {
		inbound["streamSettings"] = streamSettings
	}

	// Add fallback if specified
	if fallbackPort, ok := config["fallback_port"].(int); ok && fallbackPort > 0 {
		inboundSettings["fallbacks"] = []map[string]interface{}{
			{
				"dest": fallbackPort,
			},
		}
	}

	xrayConfig := map[string]interface{}{
		"log": map[string]interface{}{
			"loglevel": logLevel,
		},
		"inbounds": []interface{}{inbound},
		"outbounds": []interface{}{
			map[string]interface{}{
				"protocol": "freedom",
				"tag":      "direct",
			},
			map[string]interface{}{
				"protocol": "blackhole",
				"tag":      "block",
			},
		},
	}

	// Render as JSON
	result, err := g.RenderJSON(xrayConfig)
	if err != nil {
		return nil, fmt.Errorf("render xray configuration: %w", err)
	}
	return result, nil
}

// Validate performs Xray-specific validation.
func (g *XrayGenerator) Validate(config map[string]interface{}, bindIP string) error {
	// Base validation (schema + bind IP)
	if configErr := g.ValidateConfig(config, bindIP); configErr != nil {
		return fmt.Errorf("validate xray config: %w", configErr)
	}

	// Validate UUID format (basic check)
	uuid, _ := config["uuid"].(string) //nolint:errcheck // type assertion uses zero value default
	if len(uuid) != 36 {
		return fmt.Errorf("uuid must be in UUID format (36 characters), got %d", len(uuid))
	}

	// If TLS is enabled, cert and key paths are required
	tlsEnabled, _ := config["tls_enabled"].(bool) //nolint:errcheck // type assertion uses zero value default
	if tlsEnabled {
		certPath, hasCert := config["tls_cert_path"].(string)
		keyPath, hasKey := config["tls_key_path"].(string)

		if !hasCert || certPath == "" {
			return fmt.Errorf("tls_cert_path is required when TLS is enabled")
		}
		if !hasKey || keyPath == "" {
			return fmt.Errorf("tls_key_path is required when TLS is enabled")
		}
	}

	return nil
}

// GetConfigFileName returns the filename for the generated config.
func (g *XrayGenerator) GetConfigFileName() string {
	return "config.json"
}

// GetConfigFormat returns the config file format.
func (g *XrayGenerator) GetConfigFormat() string {
	return "json"
}
