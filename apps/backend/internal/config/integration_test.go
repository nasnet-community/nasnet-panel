package config_test

import (
	"testing"

	"backend/internal/config"
	"backend/internal/config/services"
)

// TestAllGenerators_Registration tests that all six generators can be registered.
func TestAllGenerators_Registration(t *testing.T) {
	registry := config.NewRegistry()

	// Create all generators
	generators := []config.Generator{
		services.NewTorGenerator(),
		services.NewSingboxGenerator(),
		services.NewXrayGenerator(),
		services.NewMTProxyGenerator(),
		services.NewAdguardGenerator(),
		services.NewPsiphonGenerator(),
	}

	// Register all generators
	for _, gen := range generators {
		if err := registry.Register(gen); err != nil {
			t.Errorf("Failed to register %s generator: %v", gen.GetServiceType(), err)
		}
	}

	// Verify count
	if registry.Count() != 6 {
		t.Errorf("Expected 6 registered generators, got %d", registry.Count())
	}

	// Verify all service types are present
	expectedTypes := []string{"tor", "singbox", "xray", "mtproxy", "adguard", "psiphon"}
	for _, serviceType := range expectedTypes {
		if !registry.Has(serviceType) {
			t.Errorf("Registry missing generator for service type: %s", serviceType)
		}
	}
}

// TestAllGenerators_Generate tests basic config generation for all generators.
func TestAllGenerators_Generate(t *testing.T) {
	bindIP := "192.168.1.100"
	instanceID := "test-instance-123"

	tests := []struct {
		name      string
		generator config.Generator
		config    map[string]interface{}
	}{
		{
			name:      "tor",
			generator: services.NewTorGenerator(),
			config: map[string]interface{}{
				"nickname":        "TestRelay",
				"contact_info":    "test@example.com",
				"relay_type":      "relay",
				"socks_port":      9050,
				"control_port":    9051,
				"or_port":         9001,
				"bandwidth_rate":  1000,
				"bandwidth_burst": 2000,
			},
		},
		{
			name:      "singbox",
			generator: services.NewSingboxGenerator(),
			config: map[string]interface{}{
				"socks_port":    10808,
				"http_port":     10809,
				"log_level":     "info",
				"dns_server":    "1.1.1.1",
				"sniff_enabled": true,
			},
		},
		{
			name:      "xray",
			generator: services.NewXrayGenerator(),
			config: map[string]interface{}{
				"protocol":    "vless",
				"port":        10443,
				"uuid":        "12345678-1234-1234-1234-123456789012",
				"tls_enabled": false,
				"log_level":   "warning",
			},
		},
		{
			name:      "mtproxy",
			generator: services.NewMTProxyGenerator(),
			config: map[string]interface{}{
				"port":            8443,
				"secret":          "0123456789abcdef0123456789abcdef",
				"workers":         2,
				"max_connections": 60000,
			},
		},
		{
			name:      "adguard",
			generator: services.NewAdguardGenerator(),
			config: map[string]interface{}{
				"web_port":            3000,
				"dns_port":            53,
				"admin_user":          "admin",
				"admin_password":      "hashedpassword",
				"upstream_dns":        "1.1.1.1,8.8.8.8",
				"bootstrap_dns":       "1.1.1.1,8.8.8.8",
				"blocking_mode":       "default",
				"protection_enabled":  true,
				"querylog_enabled":    true,
				"querylog_interval":   24,
				"statistics_enabled":  true,
				"statistics_interval": 24,
			},
		},
		{
			name:      "psiphon",
			generator: services.NewPsiphonGenerator(),
			config: map[string]interface{}{
				"socks_port":          1080,
				"http_port":           8080,
				"log_level":           "info",
				"enable_split_tunnel": false,
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Test generation
			output, err := tt.generator.Generate(instanceID, tt.config, bindIP)
			if err != nil {
				t.Errorf("%s: Generate() error = %v", tt.name, err)
				return
			}

			if len(output) == 0 {
				t.Errorf("%s: Generate() produced empty output", tt.name)
			}

			// Test validation
			err = tt.generator.Validate(tt.config, bindIP)
			if err != nil {
				t.Errorf("%s: Validate() error = %v", tt.name, err)
			}

			// Test schema
			schema := tt.generator.GetSchema()
			if schema.ServiceType != tt.name {
				t.Errorf("%s: GetSchema() ServiceType = %v, want %v", tt.name, schema.ServiceType, tt.name)
			}
		})
	}
}

// TestAllGenerators_IPBinding tests that all generators reject wildcard IPs.
func TestAllGenerators_IPBinding(t *testing.T) {
	generators := []config.Generator{
		services.NewTorGenerator(),
		services.NewSingboxGenerator(),
		services.NewXrayGenerator(),
		services.NewMTProxyGenerator(),
		services.NewAdguardGenerator(),
		services.NewPsiphonGenerator(),
	}

	wildcardIPs := []string{"0.0.0.0", "::"}

	for _, gen := range generators {
		for _, wildcardIP := range wildcardIPs {
			t.Run(gen.GetServiceType()+"_reject_"+wildcardIP, func(t *testing.T) {
				// Use minimal valid config
				config := map[string]interface{}{}

				// Validate should reject wildcard IP
				err := gen.Validate(config, wildcardIP)
				if err == nil {
					t.Errorf("%s: Validate() should reject wildcard IP %s", gen.GetServiceType(), wildcardIP)
				}

				// Generate should also reject wildcard IP
				_, err = gen.Generate("test-id", config, wildcardIP)
				if err == nil {
					t.Errorf("%s: Generate() should reject wildcard IP %s", gen.GetServiceType(), wildcardIP)
				}
			})
		}
	}
}

// TestAllGenerators_ConfigFormat tests that all generators report correct formats.
func TestAllGenerators_ConfigFormat(t *testing.T) {
	tests := []struct {
		name           string
		generator      config.Generator
		expectedFormat string
		expectedFile   string
	}{
		{name: "tor", generator: services.NewTorGenerator(), expectedFormat: "text", expectedFile: "torrc"},
		{name: "singbox", generator: services.NewSingboxGenerator(), expectedFormat: "json", expectedFile: "config.json"},
		{name: "xray", generator: services.NewXrayGenerator(), expectedFormat: "json", expectedFile: "config.json"},
		{name: "mtproxy", generator: services.NewMTProxyGenerator(), expectedFormat: "json", expectedFile: "config.json"},
		{name: "adguard", generator: services.NewAdguardGenerator(), expectedFormat: "yaml", expectedFile: "AdGuardHome.yaml"},
		{name: "psiphon", generator: services.NewPsiphonGenerator(), expectedFormat: "json", expectedFile: "config.json"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			format := tt.generator.GetConfigFormat()
			if format != tt.expectedFormat {
				t.Errorf("%s: GetConfigFormat() = %v, want %v", tt.name, format, tt.expectedFormat)
			}

			fileName := tt.generator.GetConfigFileName()
			if fileName != tt.expectedFile {
				t.Errorf("%s: GetConfigFileName() = %v, want %v", tt.name, fileName, tt.expectedFile)
			}
		})
	}
}
