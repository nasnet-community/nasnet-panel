package services

import (
	"strings"
	"testing"
)

func TestAdguardGenerator_Generate(t *testing.T) {
	gen := NewAdguardGenerator()
	bindIP := "192.168.1.100"
	instanceID := "test-adguard-123"

	tests := []struct {
		name    string
		config  map[string]interface{}
		wantErr bool
	}{
		{
			name: "valid config",
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

func TestAdguardGenerator_Validate(t *testing.T) {
	gen := NewAdguardGenerator()
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
			bindIP:  bindIP,
			wantErr: false,
		},
		{
			name: "empty admin_user",
			config: map[string]interface{}{
				"web_port":            3000,
				"dns_port":            53,
				"admin_user":          "",
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
			bindIP:  bindIP,
			wantErr: true,
			errMsg:  "admin_user",
		},
		{
			name: "empty admin_password",
			config: map[string]interface{}{
				"web_port":            3000,
				"dns_port":            53,
				"admin_user":          "admin",
				"admin_password":      "",
				"upstream_dns":        "1.1.1.1,8.8.8.8",
				"bootstrap_dns":       "1.1.1.1,8.8.8.8",
				"blocking_mode":       "default",
				"protection_enabled":  true,
				"querylog_enabled":    true,
				"querylog_interval":   24,
				"statistics_enabled":  true,
				"statistics_interval": 24,
			},
			bindIP:  bindIP,
			wantErr: true,
			errMsg:  "admin_password",
		},
		{
			name: "wildcard IP rejected",
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

func TestAdguardGenerator_GetSchema(t *testing.T) {
	gen := NewAdguardGenerator()
	schema := gen.GetSchema()

	if schema == nil {
		t.Fatal("GetSchema() returned nil")
	}
	if schema.ServiceType != "adguard" {
		t.Errorf("ServiceType = %v, want %v", schema.ServiceType, "adguard")
	}
}

func TestAdguardGenerator_GetConfigFileName(t *testing.T) {
	gen := NewAdguardGenerator()
	if gen.GetConfigFileName() != "AdGuardHome.yaml" {
		t.Errorf("Expected AdGuardHome.yaml")
	}
}

func TestAdguardGenerator_GetConfigFormat(t *testing.T) {
	gen := NewAdguardGenerator()
	if gen.GetConfigFormat() != "yaml" {
		t.Errorf("Expected yaml format")
	}
}
