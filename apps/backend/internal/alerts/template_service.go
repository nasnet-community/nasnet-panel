package alerts

import (
	"context"
	"embed"
	"encoding/json"
	"fmt"
	"regexp"
	"strconv"
	"strings"
	"time"

	"backend/ent"
	"backend/ent/alertrule"
	"backend/internal/services"
)

//go:embed templates/*.json
var templatesFS embed.FS

// AlertRuleTemplateService handles alert rule template operations
type AlertRuleTemplateService struct {
	builtInTemplates map[string]*AlertRuleTemplate
	alertService     *services.AlertService
	entClient        *ent.Client
}

// NewAlertRuleTemplateService creates a new alert rule template service
func NewAlertRuleTemplateService(alertService *services.AlertService, entClient *ent.Client) (*AlertRuleTemplateService, error) {
	service := &AlertRuleTemplateService{
		builtInTemplates: make(map[string]*AlertRuleTemplate),
		alertService:     alertService,
		entClient:        entClient,
	}

	// Load built-in templates
	if err := service.loadBuiltInTemplates(); err != nil {
		return nil, fmt.Errorf("failed to load built-in templates: %w", err)
	}

	return service, nil
}

// loadBuiltInTemplates loads all built-in templates from embedded JSON files
func (s *AlertRuleTemplateService) loadBuiltInTemplates() error {
	templateFiles := []string{
		"templates/network-device-offline.json",
		"templates/network-high-cpu.json",
		"templates/network-high-memory.json",
		"templates/network-disk-full.json",
		"templates/security-firewall-attack.json",
		"templates/security-high-bandwidth.json",
		"templates/resources-cpu-sustained-high.json",
		"templates/resources-memory-leak.json",
		"templates/resources-disk-growth.json",
		"templates/vpn-tunnel-down.json",
		"templates/vpn-connection-failed.json",
		"templates/dhcp-pool-exhausted.json",
		"templates/system-backup-failed.json",
		"templates/system-update-available.json",
		"templates/system-config-change.json",
	}

	for _, file := range templateFiles {
		data, err := templatesFS.ReadFile(file)
		if err != nil {
			return fmt.Errorf("failed to read template %s: %w", file, err)
		}

		var template AlertRuleTemplate
		if err := json.Unmarshal(data, &template); err != nil {
			return fmt.Errorf("failed to parse template %s: %w", file, err)
		}

		s.builtInTemplates[template.ID] = &template
	}

	return nil
}

// GetTemplates returns all templates, optionally filtered by category
func (s *AlertRuleTemplateService) GetTemplates(ctx context.Context, category *AlertRuleTemplateCategory) ([]*AlertRuleTemplate, error) {
	templates := make([]*AlertRuleTemplate, 0, len(s.builtInTemplates))

	for _, template := range s.builtInTemplates {
		// Filter by category if specified
		if category != nil && template.Category != *category {
			continue
		}
		templates = append(templates, template)
	}

	// TODO: Add custom templates from database

	return templates, nil
}

// GetTemplateByID retrieves a template by its ID
func (s *AlertRuleTemplateService) GetTemplateByID(ctx context.Context, id string) (*AlertRuleTemplate, error) {
	// Check built-in templates first
	template, exists := s.builtInTemplates[id]
	if exists {
		return template, nil
	}

	// TODO: Check custom templates in database

	return nil, fmt.Errorf("template not found: %s", id)
}

// PreviewTemplate previews a template with variable substitution
func (s *AlertRuleTemplateService) PreviewTemplate(ctx context.Context, templateID string, variables map[string]interface{}) (*PreviewResult, error) {
	// Get the template
	template, err := s.GetTemplateByID(ctx, templateID)
	if err != nil {
		return nil, err
	}

	// Validate variables against template requirements
	validationInfo := s.validateVariables(template, variables)

	// Resolve conditions with variable substitution
	resolvedConditions, err := s.resolveConditions(template.Conditions, variables)
	if err != nil {
		validationInfo.IsValid = false
		validationInfo.Warnings = append(validationInfo.Warnings, err.Error())
	}

	return &PreviewResult{
		Template:           template,
		ResolvedEventType:  template.EventType,
		ResolvedConditions: resolvedConditions,
		ResolvedThrottle:   template.Throttle,
		ValidationInfo:     validationInfo,
	}, nil
}

// ApplyTemplate creates an alert rule from a template
func (s *AlertRuleTemplateService) ApplyTemplate(
	ctx context.Context,
	templateID string,
	variables map[string]interface{},
	customizations services.CreateAlertRuleInput,
) (*ent.AlertRule, error) {
	// Get the template
	template, err := s.GetTemplateByID(ctx, templateID)
	if err != nil {
		return nil, err
	}

	// Validate variables
	validationInfo := s.validateVariables(template, variables)
	if !validationInfo.IsValid {
		return nil, fmt.Errorf("validation failed: missing variables: %v", validationInfo.MissingVariables)
	}

	// Resolve conditions with variable substitution
	resolvedConditions, err := s.resolveConditions(template.Conditions, variables)
	if err != nil {
		return nil, fmt.Errorf("failed to resolve conditions: %w", err)
	}

	// Convert resolved conditions to JSON-serializable format
	conditionsJSON := make([]map[string]interface{}, len(resolvedConditions))
	for i, cond := range resolvedConditions {
		conditionsJSON[i] = map[string]interface{}{
			"field":    cond.Field,
			"operator": cond.Operator,
			"value":    cond.Value,
		}
	}

	// Build alert rule input from template + customizations
	ruleInput := services.CreateAlertRuleInput{
		Name:        customizations.Name,
		Description: customizations.Description,
		EventType:   template.EventType,
		Severity:    alertrule.Severity(template.Severity),
		Conditions:  conditionsJSON,
		Channels:    template.Channels,
		Enabled:     customizations.Enabled,
		DeviceID:    customizations.DeviceID,
	}

	// Apply throttle if present
	if template.Throttle != nil {
		ruleInput.Throttle = map[string]interface{}{
			"maxAlerts":     template.Throttle.MaxAlerts,
			"periodSeconds": template.Throttle.PeriodSeconds,
		}
		if template.Throttle.GroupByField != nil {
			ruleInput.Throttle["groupByField"] = *template.Throttle.GroupByField
		}
	}

	// Apply custom throttle if provided
	if customizations.Throttle != nil {
		ruleInput.Throttle = customizations.Throttle
	}

	// Apply quiet hours if provided
	if customizations.QuietHours != nil {
		ruleInput.QuietHours = customizations.QuietHours
	}

	// CRITICAL: Call existing AlertService.CreateRule() - NO logic duplication
	rule, err := s.alertService.CreateRule(ctx, ruleInput)
	if err != nil {
		return nil, fmt.Errorf("failed to create alert rule from template: %w", err)
	}

	return rule, nil
}

// SaveCustomTemplate saves a custom template (from existing alert rule)
func (s *AlertRuleTemplateService) SaveCustomTemplate(ctx context.Context, template *AlertRuleTemplate) (*AlertRuleTemplate, error) {
	// Set metadata
	now := time.Now()
	template.CreatedAt = &now
	template.UpdatedAt = &now
	template.IsBuiltIn = false
	template.Category = CategoryCustom

	// TODO: Persist to database via ent

	return template, nil
}

// DeleteCustomTemplate deletes a custom template
func (s *AlertRuleTemplateService) DeleteCustomTemplate(ctx context.Context, id string) error {
	// Check if it's a built-in template
	if _, exists := s.builtInTemplates[id]; exists {
		return fmt.Errorf("cannot delete built-in template: %s", id)
	}

	// TODO: Delete from database via ent

	return nil
}

// ImportTemplate imports a template from JSON
func (s *AlertRuleTemplateService) ImportTemplate(ctx context.Context, templateJSON string) (*AlertRuleTemplate, error) {
	var template AlertRuleTemplate
	if err := json.Unmarshal([]byte(templateJSON), &template); err != nil {
		return nil, fmt.Errorf("invalid template JSON: %w", err)
	}

	// Validate template structure
	if template.Name == "" {
		return nil, fmt.Errorf("template name is required")
	}
	if template.EventType == "" {
		return nil, fmt.Errorf("template event type is required")
	}

	// Save as custom template
	return s.SaveCustomTemplate(ctx, &template)
}

// ExportTemplate exports a template as JSON
func (s *AlertRuleTemplateService) ExportTemplate(ctx context.Context, id string) (string, error) {
	template, err := s.GetTemplateByID(ctx, id)
	if err != nil {
		return "", err
	}

	data, err := json.MarshalIndent(template, "", "  ")
	if err != nil {
		return "", fmt.Errorf("failed to marshal template: %w", err)
	}

	return string(data), nil
}

// validateVariables checks that all required variables are provided and valid
func (s *AlertRuleTemplateService) validateVariables(template *AlertRuleTemplate, variables map[string]interface{}) ValidationInfo {
	info := ValidationInfo{
		IsValid:          true,
		MissingVariables: []string{},
		InvalidVariables: []string{},
		Warnings:         []string{},
	}

	for _, varDef := range template.Variables {
		value, exists := variables[varDef.Name]

		// Check required variables
		if varDef.Required && (!exists || value == nil || value == "") {
			info.IsValid = false
			info.MissingVariables = append(info.MissingVariables, varDef.Name)
			continue
		}

		if !exists || value == nil {
			continue
		}

		// Validate variable type and range
		switch varDef.Type {
		case VarTypeInteger, VarTypeDuration, VarTypePercentage:
			var intValue int
			switch v := value.(type) {
			case int:
				intValue = v
			case float64:
				intValue = int(v)
			case string:
				parsed, err := strconv.Atoi(v)
				if err != nil {
					info.InvalidVariables = append(info.InvalidVariables, varDef.Name)
					info.Warnings = append(info.Warnings, fmt.Sprintf("Variable %s must be an integer", varDef.Name))
					continue
				}
				intValue = parsed
			default:
				info.InvalidVariables = append(info.InvalidVariables, varDef.Name)
				info.Warnings = append(info.Warnings, fmt.Sprintf("Variable %s has invalid type", varDef.Name))
				continue
			}

			// Check min/max bounds
			if varDef.Min != nil && intValue < *varDef.Min {
				info.InvalidVariables = append(info.InvalidVariables, varDef.Name)
				info.Warnings = append(info.Warnings, fmt.Sprintf("Variable %s value %d is below minimum %d", varDef.Name, intValue, *varDef.Min))
			}
			if varDef.Max != nil && intValue > *varDef.Max {
				info.InvalidVariables = append(info.InvalidVariables, varDef.Name)
				info.Warnings = append(info.Warnings, fmt.Sprintf("Variable %s value %d is above maximum %d", varDef.Name, intValue, *varDef.Max))
			}
		}
	}

	if len(info.InvalidVariables) > 0 {
		info.IsValid = false
	}

	return info
}

// resolveConditions substitutes variables in condition values
func (s *AlertRuleTemplateService) resolveConditions(conditions []TemplateCondition, variables map[string]interface{}) ([]ResolvedCondition, error) {
	resolved := make([]ResolvedCondition, len(conditions))
	varPattern := regexp.MustCompile(`\{\{([A-Z_]+)\}\}`)

	for i, cond := range conditions {
		resolvedValue := cond.Value

		// Check if value contains variable reference
		matches := varPattern.FindStringSubmatch(cond.Value)
		if len(matches) > 1 {
			varName := matches[1]
			value, exists := variables[varName]
			if !exists {
				return nil, fmt.Errorf("variable %s not provided", varName)
			}
			resolvedValue = fmt.Sprintf("%v", value)
		}

		// Convert resolvedValue to appropriate type
		var finalValue interface{} = resolvedValue

		// Try to parse as number if it looks like one
		if intVal, err := strconv.Atoi(resolvedValue); err == nil {
			finalValue = intVal
		} else if floatVal, err := strconv.ParseFloat(resolvedValue, 64); err == nil {
			finalValue = floatVal
		} else if strings.ToLower(resolvedValue) == "true" {
			finalValue = true
		} else if strings.ToLower(resolvedValue) == "false" {
			finalValue = false
		}

		resolved[i] = ResolvedCondition{
			Field:    cond.Field,
			Operator: cond.Operator,
			Value:    finalValue,
		}
	}

	return resolved, nil
}
