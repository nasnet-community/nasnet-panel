package services

import (
	"strings"
	"testing"
)

func TestSingboxGenerator_Generate(t *testing.T) {
	gen := NewSingboxGenerator()
	bindIP := "192.168.1.100"
	instanceID := "test-singbox-123"

	tests := []struct {
		name    string
		config  map[string]interface{}
		wantErr bool
	}{
		{
			name: "valid config",
			config: map[string]interface{}{
				"socks_port":    10808,
				"http_port":     10809,
				"log_level":     "info",
				"dns_server":    "1.1.1.1",
				"sniff_enabled": true,
			},
			wantErr: false,
		},
		{
			name: "valid config with listen_address",
			config: map[string]interface{}{
				"socks_port":     10808,
				"http_port":      10809,
				"log_level":      "debug",
				"dns_server":     "8.8.8.8",
				"sniff_enabled":  false,
				"listen_address": "192.168.2.1",
			},
			wantErr: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			output, err := gen.Generate(instanceID, tt.config, bindIP)
			if (err != nil) != tt.wantErr {
				t.Errorf("Generate() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !tt.wantErr && len(output) == 0 {
				t.Errorf("Generate() produced empty output")
			}
		})
	}
}

func TestSingboxGenerator_Validate(t *testing.T) {
	gen := NewSingboxGenerator()
	bindIP := "192.168.1.100"

	tests := []struct {
		name    string
		config  map[string]interface{}
		bindIP  string
		wantErr bool
		errMsg  string
	}{
		{
			name: "valid config",
			config: map[string]interface{}{
				"socks_port":    10808,
				"http_port":     10809,
				"log_level":     "info",
				"dns_server":    "1.1.1.1",
				"sniff_enabled": true,
			},
			bindIP:  bindIP,
			wantErr: false,
		},
		{
			name: "empty DNS server",
			config: map[string]interface{}{
				"socks_port":    10808,
				"http_port":     10809,
				"log_level":     "info",
				"dns_server":    "",
				"sniff_enabled": true,
			},
			bindIP:  bindIP,
			wantErr: true,
			errMsg:  "dns_server",
		},
		{
			name: "invalid listen_address (wildcard)",
			config: map[string]interface{}{
				"socks_port":     10808,
				"http_port":      10809,
				"log_level":      "info",
				"dns_server":     "1.1.1.1",
				"sniff_enabled":  true,
				"listen_address": "0.0.0.0",
			},
			bindIP:  bindIP,
			wantErr: true,
			errMsg:  "listen_address validation failed",
		},
		{
			name: "wildcard bind IP rejected",
			config: map[string]interface{}{
				"socks_port":    10808,
				"http_port":     10809,
				"log_level":     "info",
				"dns_server":    "1.1.1.1",
				"sniff_enabled": true,
			},
			bindIP:  "::",
			wantErr: true,
			errMsg:  "wildcard IP",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := gen.Validate(tt.config, tt.bindIP)
			if (err != nil) != tt.wantErr {
				t.Errorf("Validate() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if tt.wantErr && tt.errMsg != "" && err != nil {
				if !strings.Contains(err.Error(), tt.errMsg) {
					t.Errorf("Validate() error = %v, want to contain %v", err.Error(), tt.errMsg)
				}
			}
		})
	}
}

func TestSingboxGenerator_GetSchema(t *testing.T) {
	gen := NewSingboxGenerator()
	schema := gen.GetSchema()

	if schema == nil {
		t.Fatal("GetSchema() returned nil")
	}
	if schema.ServiceType != "singbox" {
		t.Errorf("ServiceType = %v, want %v", schema.ServiceType, "singbox")
	}
}

func TestSingboxGenerator_GetConfigFileName(t *testing.T) {
	gen := NewSingboxGenerator()
	if gen.GetConfigFileName() != "config.json" {
		t.Errorf("Expected config.json")
	}
}

func TestSingboxGenerator_GetConfigFormat(t *testing.T) {
	gen := NewSingboxGenerator()
	if gen.GetConfigFormat() != "json" {
		t.Errorf("Expected json format")
	}
}
