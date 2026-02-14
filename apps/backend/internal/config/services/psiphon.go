package services

import (
	"fmt"

	cfglib "backend/internal/config"
)

// PsiphonGenerator generates Psiphon JSON configuration files.
type PsiphonGenerator struct {
	*cfglib.BaseGenerator
}

// NewPsiphonGenerator creates a new Psiphon config generator.
func NewPsiphonGenerator() *PsiphonGenerator {
	schema := &cfglib.ConfigSchema{
		ServiceType: "psiphon",
		Version:     "1.0.0",
		Fields: []cfglib.ConfigField{
			{
				Name:        "socks_port",
				Type:        "port",
				Required:    true,
				Default:     1080,
				Min:         intPtr(1024),
				Max:         intPtr(65535),
				Description: "SOCKS proxy port",
			},
			{
				Name:        "http_port",
				Type:        "port",
				Required:    true,
				Default:     8080,
				Min:         intPtr(1024),
				Max:         intPtr(65535),
				Description: "HTTP proxy port",
			},
			{
				Name:        "server_entry_signature_public_key",
				Type:        "string",
				Required:    false,
				Description: "Psiphon server entry signature public key",
				Sensitive:   true,
			},
			{
				Name:        "server_entry_tags",
				Type:        "string",
				Required:    false,
				Description: "Server entry tags (comma-separated)",
				Default:     "",
			},
			{
				Name:        "sponsor_id",
				Type:        "string",
				Required:    false,
				Description: "Sponsor ID for Psiphon network",
				Default:     "00000000000000000000000000000000",
			},
			{
				Name:        "propagation_channel_id",
				Type:        "string",
				Required:    false,
				Description: "Propagation channel ID",
				Default:     "00000000000000000000000000000000",
			},
			{
				Name:        "enable_split_tunnel",
				Type:        "bool",
				Required:    true,
				Default:     false,
				Description: "Enable split tunneling",
			},
			{
				Name:        "upstream_proxy_url",
				Type:        "string",
				Required:    false,
				Description: "Upstream proxy URL (optional)",
				Placeholder: "http://proxy:8080",
			},
			{
				Name:        "log_level",
				Type:        "enum",
				Required:    true,
				Default:     "info",
				EnumValues:  []string{"debug", "info", "warning", "error"},
				Description: "Log verbosity level",
			},
		},
	}

	return &PsiphonGenerator{
		BaseGenerator: cfglib.NewBaseGenerator("psiphon", schema, nil),
	}
}

// Generate generates a Psiphon JSON configuration file.
func (g *PsiphonGenerator) Generate(instanceID string, config map[string]interface{}, bindIP string) ([]byte, error) {
	// Merge with defaults FIRST
	config = g.Schema.MergeWithDefaults(config)

	// Then validate (after defaults are applied)
	if err := g.Validate(config, bindIP); err != nil {
		return nil, fmt.Errorf("validation failed: %w", err)
	}

	socksPort := getIntValue(config, "socks_port", 1080)
	httpPort := getIntValue(config, "http_port", 8080)
	sponsorID, _ := config["sponsor_id"].(string)
	propagationChannelID, _ := config["propagation_channel_id"].(string)
	enableSplitTunnel, _ := config["enable_split_tunnel"].(bool)
	logLevel, _ := config["log_level"].(string)

	// Build Psiphon configuration
	psiphonConfig := map[string]interface{}{
		"DataRootDirectory":      "/var/lib/psiphon",
		"SponsorId":              sponsorID,
		"PropagationChannelId":   propagationChannelID,
		"LocalSocksProxyPort":    socksPort,
		"LocalHttpProxyPort":     httpPort,
		"ListenInterface":        bindIP,
		"EnableSplitTunnel":      enableSplitTunnel,
		"EmitDiagnosticNotices":  logLevel == "debug",
		"EmitBytesTransferred":   true,
		"EstablishTunnelTimeout": 300,
	}

	// Add optional fields if provided
	if pubKey, ok := config["server_entry_signature_public_key"].(string); ok && pubKey != "" {
		psiphonConfig["ServerEntrySignaturePublicKey"] = pubKey
	}

	if tags, ok := config["server_entry_tags"].(string); ok && tags != "" {
		psiphonConfig["ServerEntryTags"] = splitCommaSeparated(tags)
	}

	if upstreamProxy, ok := config["upstream_proxy_url"].(string); ok && upstreamProxy != "" {
		psiphonConfig["UpstreamProxyUrl"] = upstreamProxy
	}

	// Render as JSON
	return g.RenderJSON(psiphonConfig)
}

// Validate performs Psiphon-specific validation.
func (g *PsiphonGenerator) Validate(config map[string]interface{}, bindIP string) error {
	// Base validation (schema + bind IP)
	if err := g.ValidateConfig(config, bindIP); err != nil {
		return err
	}

	// Validate sponsor_id format (32-character hex string if provided)
	if sponsorID, ok := config["sponsor_id"].(string); ok && sponsorID != "" && sponsorID != "00000000000000000000000000000000" {
		if len(sponsorID) != 32 {
			return fmt.Errorf("sponsor_id must be exactly 32 characters, got %d", len(sponsorID))
		}
	}

	// Validate propagation_channel_id format (32-character hex string if provided)
	if channelID, ok := config["propagation_channel_id"].(string); ok && channelID != "" && channelID != "00000000000000000000000000000000" {
		if len(channelID) != 32 {
			return fmt.Errorf("propagation_channel_id must be exactly 32 characters, got %d", len(channelID))
		}
	}

	// Validate upstream_proxy_url format if provided
	if upstreamProxy, ok := config["upstream_proxy_url"].(string); ok && upstreamProxy != "" {
		if err := cfglib.ValidateURL(upstreamProxy); err != nil {
			return fmt.Errorf("upstream_proxy_url validation failed: %w", err)
		}
	}

	return nil
}

// GetConfigFileName returns the filename for the generated config.
func (g *PsiphonGenerator) GetConfigFileName() string {
	return "config.json"
}

// GetConfigFormat returns the config file format.
func (g *PsiphonGenerator) GetConfigFormat() string {
	return "json"
}
