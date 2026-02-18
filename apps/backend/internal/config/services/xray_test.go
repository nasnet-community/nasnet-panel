package services

import (
	"strings"
	"testing"
)

func TestXrayGenerator_Generate(t *testing.T) {
	gen := NewXrayGenerator()
	bindIP := "192.168.1.100"
	instanceID := "test-xray-123"

	tests := []struct {
		name    string
		config  map[string]interface{}
		wantErr bool
		errMsg  string
	}{
		{
			name: "valid VLESS config",
			config: map[string]interface{}{
				"protocol":    "vless",
				"port":        10443,
				"uuid":        "12345678-1234-1234-1234-123456789012",
				"tls_enabled": false,
				"log_level":   "warning",
			},
			wantErr: false,
		},
		{
			name: "valid VMess config",
			config: map[string]interface{}{
				"protocol":    "vmess",
				"port":        10444,
				"uuid":        "abcdefab-cdef-abcd-efab-cdefabcdefab",
				"tls_enabled": false,
				"log_level":   "info",
			},
			wantErr: false,
		},
		{
			name: "valid config with TLS",
			config: map[string]interface{}{
				"protocol":      "vless",
				"port":          10443,
				"uuid":          "12345678-1234-1234-1234-123456789012",
				"tls_enabled":   true,
				"tls_cert_path": "/etc/xray/cert.pem",
				"tls_key_path":  "/etc/xray/key.pem",
				"log_level":     "warning",
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

func TestXrayGenerator_Validate(t *testing.T) {
	gen := NewXrayGenerator()
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
				"protocol":    "vless",
				"port":        10443,
				"uuid":        "12345678-1234-1234-1234-123456789012",
				"tls_enabled": false,
				"log_level":   "warning",
			},
			bindIP:  bindIP,
			wantErr: false,
		},
		{
			name: "invalid UUID length",
			config: map[string]interface{}{
				"protocol":    "vless",
				"port":        10443,
				"uuid":        "short-uuid",
				"tls_enabled": false,
				"log_level":   "warning",
			},
			bindIP:  bindIP,
			wantErr: true,
			errMsg:  "uuid must be in UUID format",
		},
		{
			name: "TLS enabled without cert path",
			config: map[string]interface{}{
				"protocol":     "vless",
				"port":         10443,
				"uuid":         "12345678-1234-1234-1234-123456789012",
				"tls_enabled":  true,
				"tls_key_path": "/etc/xray/key.pem",
				"log_level":    "warning",
			},
			bindIP:  bindIP,
			wantErr: true,
			errMsg:  "tls_cert_path is required",
		},
		{
			name: "TLS enabled without key path",
			config: map[string]interface{}{
				"protocol":      "vless",
				"port":          10443,
				"uuid":          "12345678-1234-1234-1234-123456789012",
				"tls_enabled":   true,
				"tls_cert_path": "/etc/xray/cert.pem",
				"log_level":     "warning",
			},
			bindIP:  bindIP,
			wantErr: true,
			errMsg:  "tls_key_path is required",
		},
		{
			name: "wildcard IP rejected",
			config: map[string]interface{}{
				"protocol":    "vless",
				"port":        10443,
				"uuid":        "12345678-1234-1234-1234-123456789012",
				"tls_enabled": false,
				"log_level":   "warning",
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

func TestXrayGenerator_GetSchema(t *testing.T) {
	gen := NewXrayGenerator()
	schema := gen.GetSchema()

	if schema == nil {
		t.Fatal("GetSchema() returned nil")
	}
	if schema.ServiceType != "xray" {
		t.Errorf("ServiceType = %v, want %v", schema.ServiceType, "xray")
	}
	if len(schema.Fields) == 0 {
		t.Error("Schema has no fields")
	}
}

func TestXrayGenerator_GetConfigFileName(t *testing.T) {
	gen := NewXrayGenerator()
	filename := gen.GetConfigFileName()

	if filename != "config.json" {
		t.Errorf("GetConfigFileName() = %v, want %v", filename, "config.json")
	}
}

func TestXrayGenerator_GetConfigFormat(t *testing.T) {
	gen := NewXrayGenerator()
	format := gen.GetConfigFormat()

	if format != "json" {
		t.Errorf("GetConfigFormat() = %v, want %v", format, "json")
	}
}
