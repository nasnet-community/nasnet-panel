package config

import (
	"strings"
	"testing"
)

func TestSchema_Validate(t *testing.T) {
	tests := []struct {
		name    string
		schema  *Schema
		wantErr bool
		errMsg  string
	}{
		{
			name: "valid schema",
			schema: &Schema{
				ServiceType: "test-service",
				Version:     "1.0.0",
				Fields: []Field{
					{Name: "port", Type: "int", Required: true},
					{Name: "enabled", Type: "bool", Default: true},
				},
			},
			wantErr: false,
		},
		{
			name: "missing service type",
			schema: &Schema{
				Version: "1.0.0",
				Fields:  []Field{{Name: "port", Type: "int"}},
			},
			wantErr: true,
			errMsg:  "service_type is required",
		},
		{
			name: "missing version",
			schema: &Schema{
				ServiceType: "test-service",
				Fields:      []Field{{Name: "port", Type: "int"}},
			},
			wantErr: true,
			errMsg:  "version is required",
		},
		{
			name: "no fields",
			schema: &Schema{
				ServiceType: "test-service",
				Version:     "1.0.0",
				Fields:      []Field{},
			},
			wantErr: true,
			errMsg:  "at least one field is required",
		},
		{
			name: "duplicate field names",
			schema: &Schema{
				ServiceType: "test-service",
				Version:     "1.0.0",
				Fields: []Field{
					{Name: "port", Type: "int"},
					{Name: "port", Type: "int"},
				},
			},
			wantErr: true,
			errMsg:  "duplicate field name: port",
		},
		{
			name: "invalid field type",
			schema: &Schema{
				ServiceType: "test-service",
				Version:     "1.0.0",
				Fields: []Field{
					{Name: "test", Type: "invalid"},
				},
			},
			wantErr: true,
			errMsg:  "invalid type invalid",
		},
		{
			name: "enum without enum_values",
			schema: &Schema{
				ServiceType: "test-service",
				Version:     "1.0.0",
				Fields: []Field{
					{Name: "mode", Type: "enum"},
				},
			},
			wantErr: true,
			errMsg:  "enum type requires enum_values",
		},
		{
			name: "valid enum",
			schema: &Schema{
				ServiceType: "test-service",
				Version:     "1.0.0",
				Fields: []Field{
					{Name: "mode", Type: "enum", EnumValues: []string{"a", "b"}},
				},
			},
			wantErr: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.schema.Validate()
			if (err != nil) != tt.wantErr {
				t.Errorf("Validate() error = %v, wantErr %v", err, tt.wantErr)
			}
			if tt.wantErr && tt.errMsg != "" && err != nil {
				if !stringContains(err.Error(), tt.errMsg) {
					t.Errorf("Validate() error message = %v, want to contain %v", err.Error(), tt.errMsg)
				}
			}
		})
	}
}

func TestSchema_ValidateConfig(t *testing.T) {
	schema := &Schema{
		ServiceType: "test-service",
		Version:     "1.0.0",
		Fields: []Field{
			{Name: "port", Type: "port", Required: true, Min: testIntPtr(1), Max: testIntPtr(65535)},
			{Name: "enabled", Type: "bool", Required: false, Default: true},
			{Name: "bind_ip", Type: "ip", Required: true},
			{Name: "mode", Type: "enum", EnumValues: []string{"relay", "bridge"}, Default: "relay"},
			{Name: "nickname", Type: "string", Required: true},
		},
	}

	tests := []struct {
		name    string
		config  map[string]interface{}
		wantErr bool
		errMsg  string
	}{
		{
			name: "valid config",
			config: map[string]interface{}{
				"port":     9050,
				"enabled":  true,
				"bind_ip":  "192.168.1.1",
				"mode":     "relay",
				"nickname": "MyRelay",
			},
			wantErr: false,
		},
		{
			name: "missing required field",
			config: map[string]interface{}{
				"enabled": true,
			},
			wantErr: true,
			errMsg:  "required field port is missing",
		},
		{
			name: "invalid IP",
			config: map[string]interface{}{
				"port":     9050,
				"bind_ip":  "invalid-ip",
				"nickname": "test",
			},
			wantErr: true,
			errMsg:  "invalid IP address",
		},
		{
			name: "port out of range",
			config: map[string]interface{}{
				"port":     99999,
				"bind_ip":  "192.168.1.1",
				"nickname": "test",
			},
			wantErr: true,
			errMsg:  "port must be between",
		},
		{
			name: "invalid enum value",
			config: map[string]interface{}{
				"port":     9050,
				"bind_ip":  "192.168.1.1",
				"mode":     "invalid",
				"nickname": "test",
			},
			wantErr: true,
			errMsg:  "invalid enum value",
		},
		{
			name: "unknown field",
			config: map[string]interface{}{
				"port":          9050,
				"bind_ip":       "192.168.1.1",
				"nickname":      "test",
				"unknown_field": "value",
			},
			wantErr: true,
			errMsg:  "unknown field: unknown_field",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := schema.ValidateConfig(tt.config)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateConfig() error = %v, wantErr %v", err, tt.wantErr)
			}
			if tt.wantErr && tt.errMsg != "" && err != nil {
				if !stringContains(err.Error(), tt.errMsg) {
					t.Errorf("ValidateConfig() error message = %v, want to contain %v", err.Error(), tt.errMsg)
				}
			}
		})
	}
}

func TestSchema_MergeWithDefaults(t *testing.T) {
	schema := &Schema{
		ServiceType: "test-service",
		Version:     "1.0.0",
		Fields: []Field{
			{Name: "port", Type: "int", Default: 9050},
			{Name: "enabled", Type: "bool", Default: true},
			{Name: "nickname", Type: "string"}, // No default
		},
	}

	userConfig := map[string]interface{}{
		"port":     8080,
		"nickname": "CustomName",
	}

	result := schema.MergeWithDefaults(userConfig)

	// Check that user values override defaults
	if result["port"] != 8080 {
		t.Errorf("Expected port=8080, got %v", result["port"])
	}

	// Check that default is used when user doesn't provide value
	if result["enabled"] != true {
		t.Errorf("Expected enabled=true (default), got %v", result["enabled"])
	}

	// Check that user-provided value is preserved
	if result["nickname"] != "CustomName" {
		t.Errorf("Expected nickname=CustomName, got %v", result["nickname"])
	}
}

func TestSchema_ToJSON_FromJSON(t *testing.T) {
	original := &Schema{
		ServiceType: "test-service",
		Version:     "1.0.0",
		Fields: []Field{
			{Name: "port", Type: "int", Required: true, Default: 9050},
			{Name: "enabled", Type: "bool", Default: true},
		},
	}

	// Serialize to JSON
	data, err := original.ToJSON()
	if err != nil {
		t.Fatalf("ToJSON() error = %v", err)
	}

	// Deserialize from JSON
	restored, err := FromJSON(data)
	if err != nil {
		t.Fatalf("FromJSON() error = %v", err)
	}

	// Verify fields match
	if restored.ServiceType != original.ServiceType {
		t.Errorf("ServiceType mismatch: got %v, want %v", restored.ServiceType, original.ServiceType)
	}
	if restored.Version != original.Version {
		t.Errorf("Version mismatch: got %v, want %v", restored.Version, original.Version)
	}
	if len(restored.Fields) != len(original.Fields) {
		t.Errorf("Fields count mismatch: got %v, want %v", len(restored.Fields), len(original.Fields))
	}
}

// Helper function to create int pointer (for tests only)
func testIntPtr(i int) *int {
	return &i
}

func stringContains(s, substr string) bool { return strings.Contains(s, substr) }
