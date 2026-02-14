package services

import (
	"strings"
	"testing"
)

func TestMTProxyGenerator_Generate(t *testing.T) {
	gen := NewMTProxyGenerator()
	bindIP := "192.168.1.100"
	instanceID := "test-mtproxy-123"

	tests := []struct {
		name    string
		config  map[string]interface{}
		wantErr bool
	}{
		{
			name: "valid config",
			config: map[string]interface{}{
				"port":            8443,
				"secret":          "0123456789abcdef0123456789abcdef",
				"workers":         2,
				"max_connections": 60000,
			},
			wantErr: false,
		},
		{
			name: "valid config with uppercase hex",
			config: map[string]interface{}{
				"port":            8444,
				"secret":          "ABCDEF0123456789ABCDEF0123456789",
				"workers":         4,
				"max_connections": 80000,
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

func TestMTProxyGenerator_Validate(t *testing.T) {
	gen := NewMTProxyGenerator()
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
				"port":            8443,
				"secret":          "0123456789abcdef0123456789abcdef",
				"workers":         2,
				"max_connections": 60000,
			},
			bindIP:  bindIP,
			wantErr: false,
		},
		{
			name: "secret too short",
			config: map[string]interface{}{
				"port":            8443,
				"secret":          "short",
				"workers":         2,
				"max_connections": 60000,
			},
			bindIP:  bindIP,
			wantErr: true,
			errMsg:  "secret must be exactly 32 characters",
		},
		{
			name: "secret too long",
			config: map[string]interface{}{
				"port":            8443,
				"secret":          "0123456789abcdef0123456789abcdef00",
				"workers":         2,
				"max_connections": 60000,
			},
			bindIP:  bindIP,
			wantErr: true,
			errMsg:  "secret must be exactly 32 characters",
		},
		{
			name: "secret with invalid characters",
			config: map[string]interface{}{
				"port":            8443,
				"secret":          "0123456789abcdef0123456789GHIJKL",
				"workers":         2,
				"max_connections": 60000,
			},
			bindIP:  bindIP,
			wantErr: true,
			errMsg:  "secret must contain only hexadecimal characters",
		},
		{
			name: "wildcard IP rejected",
			config: map[string]interface{}{
				"port":            8443,
				"secret":          "0123456789abcdef0123456789abcdef",
				"workers":         2,
				"max_connections": 60000,
			},
			bindIP:  "0.0.0.0",
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

func TestMTProxyGenerator_GetSchema(t *testing.T) {
	gen := NewMTProxyGenerator()
	schema := gen.GetSchema()

	if schema == nil {
		t.Fatal("GetSchema() returned nil")
	}
	if schema.ServiceType != "mtproxy" {
		t.Errorf("ServiceType = %v, want %v", schema.ServiceType, "mtproxy")
	}
}

func TestMTProxyGenerator_GetConfigFileName(t *testing.T) {
	gen := NewMTProxyGenerator()
	if gen.GetConfigFileName() != "config.json" {
		t.Errorf("Expected config.json")
	}
}

func TestMTProxyGenerator_GetConfigFormat(t *testing.T) {
	gen := NewMTProxyGenerator()
	if gen.GetConfigFormat() != "json" {
		t.Errorf("Expected json format")
	}
}
