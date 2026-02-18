package config

import (
	"bytes"
	"encoding/json"
	"fmt"
	"text/template"
)

// Generator is the strategy interface for generating service configurations.
// Each service type (Tor, sing-box, Xray, etc.) implements this interface.
type Generator interface {
	// GetServiceType returns the service type identifier (e.g., "tor", "sing-box").
	GetServiceType() string

	// GetSchema returns the configuration schema for this service type.
	GetSchema() *Schema

	// Generate generates the service configuration file content from user config.
	// Parameters:
	//   - instanceID: Unique instance identifier
	//   - config: User-provided configuration (validated against schema)
	//   - bindIP: IP address the service must bind to (VLAN IP, NOT 0.0.0.0)
	// Returns: Configuration file content as bytes
	Generate(instanceID string, config map[string]interface{}, bindIP string) ([]byte, error)

	// Validate performs service-specific validation beyond schema validation.
	// This can enforce business rules, cross-field validation, etc.
	Validate(config map[string]interface{}, bindIP string) error

	// GetConfigFileName returns the filename for the generated config file.
	// Example: "torrc", "config.json", "config.yaml"
	GetConfigFileName() string

	// GetConfigFormat returns the config file format: "text", "json", "yaml"
	GetConfigFormat() string
}

// BaseGenerator provides common functionality for all config generators.
type BaseGenerator struct {
	ServiceType string
	Schema      *Schema
	Template    *template.Template
}

// NewBaseGenerator creates a new BaseGenerator.
func NewBaseGenerator(serviceType string, schema *Schema, tmpl *template.Template) *BaseGenerator {
	return &BaseGenerator{
		ServiceType: serviceType,
		Schema:      schema,
		Template:    tmpl,
	}
}

// GetServiceType returns the service type identifier.
func (g *BaseGenerator) GetServiceType() string {
	return g.ServiceType
}

// GetSchema returns the configuration schema.
func (g *BaseGenerator) GetSchema() *Schema {
	return g.Schema
}

// ValidateConfig validates user config against the schema and bind IP requirements.
func (g *BaseGenerator) ValidateConfig(config map[string]interface{}, bindIP string) error {
	// Validate against schema
	if err := g.Schema.ValidateConfig(config); err != nil {
		return fmt.Errorf("schema validation failed: %w", err)
	}

	// Validate bind IP (CRITICAL: reject wildcard IPs)
	if err := ValidateBindIP(bindIP); err != nil {
		return fmt.Errorf("bind IP validation failed: %w", err)
	}

	return nil
}

// RenderTemplate renders a configuration template with the provided data.
func (g *BaseGenerator) RenderTemplate(data interface{}) ([]byte, error) {
	if g.Template == nil {
		return nil, fmt.Errorf("no template configured for service type %s", g.ServiceType)
	}

	var buf bytes.Buffer
	if err := g.Template.Execute(&buf, data); err != nil {
		return nil, fmt.Errorf("template execution failed: %w", err)
	}

	return buf.Bytes(), nil
}

// RenderJSON renders configuration as JSON.
func (g *BaseGenerator) RenderJSON(config map[string]interface{}) ([]byte, error) {
	data, err := json.MarshalIndent(config, "", "  ")
	if err != nil {
		return nil, fmt.Errorf("JSON marshaling failed: %w", err)
	}
	return data, nil
}

// TemplateData represents data passed to configuration templates.
type TemplateData struct {
	InstanceID string
	BindIP     string
	Config     map[string]interface{}
}

// NewTemplateData creates a TemplateData instance.
func NewTemplateData(instanceID, bindIP string, config map[string]interface{}) *TemplateData {
	return &TemplateData{
		InstanceID: instanceID,
		BindIP:     bindIP,
		Config:     config,
	}
}

// Get retrieves a config value by key with type assertion.
func (d *TemplateData) Get(key string) interface{} {
	return d.Config[key]
}

// GetString retrieves a string config value.
func (d *TemplateData) GetString(key string) string {
	if val, ok := d.Config[key].(string); ok {
		return val
	}
	return ""
}

// GetInt retrieves an int config value.
func (d *TemplateData) GetInt(key string) int {
	switch v := d.Config[key].(type) {
	case int:
		return v
	case float64:
		return int(v)
	default:
		return 0
	}
}

// GetBool retrieves a bool config value.
func (d *TemplateData) GetBool(key string) bool {
	if val, ok := d.Config[key].(bool); ok {
		return val
	}
	return false
}

// GetStringSlice retrieves a string slice config value.
func (d *TemplateData) GetStringSlice(key string) []string {
	if val, ok := d.Config[key].([]interface{}); ok {
		result := make([]string, 0, len(val))
		for _, v := range val {
			if str, ok := v.(string); ok {
				result = append(result, str)
			}
		}
		return result
	}
	return nil
}
