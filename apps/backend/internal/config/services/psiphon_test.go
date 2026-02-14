package services

import (
	"strings"
	"testing"
)

func TestPsiphonGenerator_Generate(t *testing.T) {
	gen := NewPsiphonGenerator()
	bindIP := "192.168.1.100"
	instanceID := "test-psiphon-123"

	tests := []struct {
		name    string
		config  map[string]interface{}
		wantErr bool
	}{
		{
			name: "valid basic config",
			config: map[string]interface{}{
				"socks_port":          1080,
				"http_port":           8080,
				"log_level":           "info",
				"enable_split_tunnel": false,
			},
			wantErr: false,
		},
		{
			name: "valid config with sponsor_id",
			config: map[string]interface{}{
				"socks_port":          1080,
				"http_port":           8080,
				"log_level":           "info",
				"enable_split_tunnel": false,
				"sponsor_id":          "01234567890123456789012345678901",
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

func TestPsiphonGenerator_Validate(t *testing.T) {
	gen := NewPsiphonGenerator()
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
				"socks_port":          1080,
				"http_port":           8080,
				"log_level":           "info",
				"enable_split_tunnel": false,
			},
			bindIP:  bindIP,
			wantErr: false,
		},
		{
			name: "invalid sponsor_id length",
			config: map[string]interface{}{
				"socks_port":          1080,
				"http_port":           8080,
				"log_level":           "info",
				"enable_split_tunnel": false,
				"sponsor_id":          "short",
			},
			bindIP:  bindIP,
			wantErr: true,
			errMsg:  "sponsor_id must be exactly 32 characters",
		},
		{
			name: "invalid propagation_channel_id length",
			config: map[string]interface{}{
				"socks_port":            1080,
				"http_port":             8080,
				"log_level":             "info",
				"enable_split_tunnel":   false,
				"propagation_channel_id": "toolong0123456789012345678901234567890",
			},
			bindIP:  bindIP,
			wantErr: true,
			errMsg:  "propagation_channel_id must be exactly 32 characters",
		},
		{
			name: "invalid upstream_proxy_url",
			config: map[string]interface{}{
				"socks_port":          1080,
				"http_port":           8080,
				"log_level":           "info",
				"enable_split_tunnel": false,
				"upstream_proxy_url":  "not-a-url",
			},
			bindIP:  bindIP,
			wantErr: true,
			errMsg:  "upstream_proxy_url validation failed",
		},
		{
			name: "valid upstream_proxy_url",
			config: map[string]interface{}{
				"socks_port":          1080,
				"http_port":           8080,
				"log_level":           "info",
				"enable_split_tunnel": false,
				"upstream_proxy_url":  "https://proxy.example.com:8080",
			},
			bindIP:  bindIP,
			wantErr: false,
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

func TestPsiphonGenerator_GetSchema(t *testing.T) {
	gen := NewPsiphonGenerator()
	schema := gen.GetSchema()

	if schema == nil {
		t.Fatal("GetSchema() returned nil")
	}
	if schema.ServiceType != "psiphon" {
		t.Errorf("ServiceType = %v, want %v", schema.ServiceType, "psiphon")
	}
}

func TestPsiphonGenerator_GetConfigFileName(t *testing.T) {
	gen := NewPsiphonGenerator()
	if gen.GetConfigFileName() != "config.json" {
		t.Errorf("Expected config.json")
	}
}

func TestPsiphonGenerator_GetConfigFormat(t *testing.T) {
	gen := NewPsiphonGenerator()
	if gen.GetConfigFormat() != "json" {
		t.Errorf("Expected json format")
	}
}
