package svcalert

import (
	"context"
	"embed"
	"encoding/json"
	"fmt"
	"regexp"
	"strings"
	"text/template"

	"backend/generated/ent"
	"backend/generated/ent/alerttemplate"

	"go.uber.org/zap"
)

//go:embed templates/alerts/*.json
var templatesFS embed.FS

// AlertTemplateService handles alert template operations.
type AlertTemplateService struct {
	db               *ent.Client
	builtInTemplates map[string]*AlertTemplate
	log              *zap.SugaredLogger
	alertService     *AlertService
}

// AlertTemplateServiceConfig holds configuration for AlertTemplateService.
type AlertTemplateServiceConfig struct {
	DB           *ent.Client
	Logger       *zap.SugaredLogger
	AlertService *AlertService
}

// NewAlertTemplateService creates a new alert template service.
func NewAlertTemplateService(cfg AlertTemplateServiceConfig) (*AlertTemplateService, error) {
	service := &AlertTemplateService{
		db:               cfg.DB,
		log:              cfg.Logger,
		alertService:     cfg.AlertService,
		builtInTemplates: make(map[string]*AlertTemplate),
	}

	if err := service.loadBuiltInTemplates(); err != nil {
		return nil, fmt.Errorf("failed to load built-in templates: %w", err)
	}

	return service, nil
}

func (s *AlertTemplateService) loadBuiltInTemplates() error {
	templateFiles := []string{
		"templates/alerts/router-offline-email.json",
		"templates/alerts/router-offline-inapp.json",
		"templates/alerts/interface-down-email.json",
		"templates/alerts/cpu-high-inapp.json",
		"templates/alerts/vpn-disconnected-telegram.json",
		"templates/alerts/backup-completed-webhook.json",
	}

	for _, file := range templateFiles {
		data, err := templatesFS.ReadFile(file)
		if err != nil {
			return fmt.Errorf("failed to read template %s: %w", file, err)
		}

		var tmpl AlertTemplate
		if err := json.Unmarshal(data, &tmpl); err != nil {
			return fmt.Errorf("failed to parse template %s: %w", file, err)
		}

		if !s.isValidEventType(tmpl.EventType) {
			s.log.Warn("template has invalid event type",
				"template_id", tmpl.ID,
				"event_type", tmpl.EventType)
		}

		s.builtInTemplates[tmpl.ID] = &tmpl
	}

	s.log.Info("loaded built-in alert templates", "count", len(s.builtInTemplates))
	return nil
}

func (s *AlertTemplateService) isValidEventType(eventType string) bool {
	commonTypes := CommonEventTypes()
	for _, t := range commonTypes {
		if t == eventType {
			return true
		}
	}
	return false
}

// GetTemplates returns all templates, optionally filtered by event type or channel.
func (s *AlertTemplateService) GetTemplates(ctx context.Context, eventType *string, channel *ChannelType) ([]*AlertTemplate, error) {
	templates := make([]*AlertTemplate, 0)
	for _, tmpl := range s.builtInTemplates {
		if eventType != nil && tmpl.EventType != *eventType {
			continue
		}
		if channel != nil && tmpl.Channel != *channel {
			continue
		}
		templates = append(templates, tmpl)
	}
	return templates, nil
}

// GetTemplateByID retrieves a template by its ID.
func (s *AlertTemplateService) GetTemplateByID(ctx context.Context, id string) (*AlertTemplate, error) {
	if tmpl, exists := s.builtInTemplates[id]; exists {
		return tmpl, nil
	}
	return nil, fmt.Errorf("template not found: %s", id)
}

// GetTemplatesByEventType returns all templates for a specific event type.
func (s *AlertTemplateService) GetTemplatesByEventType(ctx context.Context, eventType string) ([]*AlertTemplate, error) {
	return s.GetTemplates(ctx, &eventType, nil)
}

// GetTemplatesByChannel returns all templates for a specific channel.
func (s *AlertTemplateService) GetTemplatesByChannel(ctx context.Context, channel ChannelType) ([]*AlertTemplate, error) {
	return s.GetTemplates(ctx, nil, &channel)
}

// PreviewTemplate renders a template with variable substitution for preview.
func (s *AlertTemplateService) PreviewTemplate(ctx context.Context, templateID string, variables map[string]interface{}) (*PreviewResult, error) {
	tmpl, err := s.GetTemplateByID(ctx, templateID)
	if err != nil {
		return nil, err
	}

	validationInfo := s.validateVariables(tmpl, variables)

	renderedSubject, err := s.renderTemplate(tmpl.SubjectTemplate, variables)
	if err != nil {
		return nil, fmt.Errorf("failed to render subject: %w", err)
	}

	renderedBody, err := s.renderTemplate(tmpl.BodyTemplate, variables)
	if err != nil {
		return nil, fmt.Errorf("failed to render body: %w", err)
	}

	return &PreviewResult{
		Template:        tmpl,
		RenderedSubject: renderedSubject,
		RenderedBody:    renderedBody,
		Variables:       variables,
		ValidationInfo:  validationInfo,
	}, nil
}

func (s *AlertTemplateService) validateVariables(tmpl *AlertTemplate, variables map[string]interface{}) ValidationInfo {
	missingVars := make([]string, 0)
	warnings := make([]string, 0)

	for _, varDef := range tmpl.Variables {
		if !varDef.Required {
			continue
		}
		value, exists := variables[varDef.Name]
		if !exists || value == nil || value == "" {
			missingVars = append(missingVars, varDef.Name)
		}
	}

	if len(missingVars) > 0 {
		warnings = append(warnings, fmt.Sprintf("Missing required variables: %s", strings.Join(missingVars, ", ")))
	}

	return ValidationInfo{
		IsValid:          len(missingVars) == 0,
		MissingVariables: missingVars,
		Warnings:         warnings,
	}
}

func (s *AlertTemplateService) renderTemplate(tmplStr string, variables map[string]interface{}) (string, error) {
	tmpl, err := template.New("alert").Parse(tmplStr)
	if err != nil {
		return "", fmt.Errorf("failed to parse template: %w", err)
	}

	var buf strings.Builder
	if err := tmpl.Execute(&buf, variables); err != nil {
		return "", fmt.Errorf("failed to execute template: %w", err)
	}

	return buf.String(), nil
}

// ApplyTemplate applies a template to create an alert rule.
func (s *AlertTemplateService) ApplyTemplate(ctx context.Context, templateID string, variables map[string]interface{}, ruleConfig CreateAlertRuleInput) (*ent.AlertRule, error) {
	tmpl, err := s.GetTemplateByID(ctx, templateID)
	if err != nil {
		return nil, err
	}

	preview, err := s.PreviewTemplate(ctx, templateID, variables)
	if err != nil {
		return nil, fmt.Errorf("preview failed: %w", err)
	}

	if !preview.ValidationInfo.IsValid {
		return nil, fmt.Errorf("variable validation failed: %v", preview.ValidationInfo.MissingVariables)
	}

	ruleConfig.EventType = tmpl.EventType
	if ruleConfig.Name == "" {
		ruleConfig.Name = fmt.Sprintf("%s Alert", tmpl.Name)
	}

	rule, err := s.alertService.CreateRule(ctx, ruleConfig)
	if err != nil {
		return nil, fmt.Errorf("failed to create rule from template: %w", err)
	}

	s.log.Info("applied alert template",
		"template_id", templateID,
		"rule_id", rule.ID,
		"event_type", tmpl.EventType)

	return rule, nil
}

// SaveTemplate saves a custom template to the database.
func (s *AlertTemplateService) SaveTemplate(ctx context.Context, tmpl *AlertTemplate) (*AlertTemplate, error) {
	if !s.isValidEventType(tmpl.EventType) {
		return nil, fmt.Errorf("invalid event type: %s. Must be one of the common event types", tmpl.EventType)
	}

	validChannels := map[ChannelType]bool{
		ChannelEmail:    true,
		ChannelTelegram: true,
		ChannelPushover: true,
		ChannelWebhook:  true,
		ChannelInApp:    true,
	}
	if !validChannels[tmpl.Channel] {
		return nil, fmt.Errorf("invalid channel: %s", tmpl.Channel)
	}

	variablesJSON, err := json.Marshal(tmpl.Variables)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal variables: %w", err)
	}

	metadataJSON, err := json.Marshal(tmpl.Metadata)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal metadata: %w", err)
	}

	entTemplate, err := s.db.AlertTemplate.Create().
		SetEventType(tmpl.EventType).
		SetChannel(alerttemplate.Channel(tmpl.Channel)).
		SetSubjectTemplate(tmpl.SubjectTemplate).
		SetBodyTemplate(tmpl.BodyTemplate).
		SetIsDefault(tmpl.IsDefault).
		Save(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to save template: %w", err)
	}

	s.log.Info("saved custom alert template",
		"template_id", entTemplate.ID,
		"event_type", tmpl.EventType,
		"channel", tmpl.Channel)

	savedTemplate := &AlertTemplate{
		ID:              entTemplate.ID,
		EventType:       entTemplate.EventType,
		Channel:         ChannelType(entTemplate.Channel),
		SubjectTemplate: entTemplate.SubjectTemplate,
		BodyTemplate:    entTemplate.BodyTemplate,
		IsBuiltIn:       false,
		IsDefault:       entTemplate.IsDefault,
		CreatedAt:       &entTemplate.CreatedAt,
		UpdatedAt:       &entTemplate.UpdatedAt,
	}

	var variables []TemplateVariable
	if err := json.Unmarshal(variablesJSON, &variables); err == nil {
		savedTemplate.Variables = variables
	}

	var metadata map[string]interface{}
	if err := json.Unmarshal(metadataJSON, &metadata); err == nil {
		savedTemplate.Metadata = metadata
	}

	return savedTemplate, nil
}

// DeleteTemplate deletes a custom template (built-in templates cannot be deleted).
func (s *AlertTemplateService) DeleteTemplate(ctx context.Context, templateID string) error {
	if _, exists := s.builtInTemplates[templateID]; exists {
		return fmt.Errorf("cannot delete built-in template: %s", templateID)
	}

	err := s.db.AlertTemplate.DeleteOneID(templateID).Exec(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return fmt.Errorf("template not found: %s", templateID)
		}
		return fmt.Errorf("failed to delete template: %w", err)
	}

	s.log.Info("deleted custom alert template", "template_id", templateID)
	return nil
}

// SearchTemplates searches templates by name, description, or tags.
func (s *AlertTemplateService) SearchTemplates(ctx context.Context, query string) ([]*AlertTemplate, error) {
	results := make([]*AlertTemplate, 0)
	searchPattern := regexp.MustCompile(`(?i)` + regexp.QuoteMeta(query))

	for _, tmpl := range s.builtInTemplates {
		if searchPattern.MatchString(tmpl.Name) ||
			searchPattern.MatchString(tmpl.Description) ||
			searchPattern.MatchString(tmpl.EventType) {
			results = append(results, tmpl)
			continue
		}

		for _, tag := range tmpl.Tags {
			if searchPattern.MatchString(tag) {
				results = append(results, tmpl)
				break
			}
		}
	}

	return results, nil
}

// GetCommonEventTypes returns the list of all supported event types.
func (s *AlertTemplateService) GetCommonEventTypes() []string {
	return CommonEventTypes()
}
