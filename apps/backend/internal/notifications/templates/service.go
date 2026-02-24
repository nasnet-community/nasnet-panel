package templates

import (
	"context"
	"fmt"
	"html"
	"regexp"
	"strings"
	"text/template"

	"backend/generated/ent"
	"backend/generated/ent/alerttemplate"
	"backend/templates/alerts"

	"go.uber.org/zap"
)

// Channel name constant for email-specific template handling.
const channelEmail = "email"

// Service implements the TemplateRenderer interface from the root notifications package.
// It manages alert notification templates with caching, validation, and fallback handling.
type Service struct {
	db      *ent.Client
	cache   *TemplateCache
	log     *zap.SugaredLogger
	funcMap template.FuncMap
}

// ServiceConfig holds configuration for creating a Service.
type ServiceConfig struct {
	DB     *ent.Client
	Logger *zap.SugaredLogger
}

// NewService creates a new template service.
func NewService(cfg ServiceConfig) *Service {
	return &Service{
		db:      cfg.DB,
		cache:   NewTemplateCache(),
		log:     cfg.Logger,
		funcMap: alerts.TemplateFuncMap(),
	}
}

// RenderAlert renders an alert notification using the appropriate template.
func (s *Service) RenderAlert(ctx context.Context, alert *ent.Alert, channel string) (subject, body string, err error) {
	if alert == nil {
		return "", "", fmt.Errorf("alert cannot be nil")
	}

	subjectTmpl, bodyTmpl, err := s.getTemplate(ctx, alert.EventType, channel)
	if err != nil {
		s.log.Warnw("failed to get template, using fallback",
			"alert_id", alert.ID,
			"event_type", alert.EventType,
			"channel", channel,
			"error", err,
		)
		return s.fallbackMessage(alert)
	}

	data := BuildTemplateData(alert)

	// For email channel, escape HTML in template variables to prevent injection
	if channel == channelEmail {
		s.escapeHTMLInData(&data)
	}

	subject, body, err = s.renderTemplate(subjectTmpl, bodyTmpl, data, channel)
	if err != nil {
		s.log.Warnw("template rendering failed, using fallback",
			"alert_id", alert.ID,
			"event_type", alert.EventType,
			"channel", channel,
			"error", err,
		)
		return s.fallbackMessage(alert)
	}

	return subject, body, nil
}

// PreviewTemplate renders a template with sample data for preview.
func (s *Service) PreviewTemplate(ctx context.Context, eventType, channel, subjectTmpl, bodyTmpl string) (subject, body string, err error) {
	data := BuildSampleTemplateData(eventType)

	// For email channel, escape HTML in template variables to prevent injection
	if channel == channelEmail {
		s.escapeHTMLInData(&data)
	}

	subject, body, err = s.renderTemplate(subjectTmpl, bodyTmpl, data, channel)
	if err != nil {
		return "", "", fmt.Errorf("preview rendering failed: %w", err)
	}

	return subject, body, nil
}

// ValidateTemplate validates template syntax and checks for issues.
func (s *Service) ValidateTemplate(subjectTmpl, bodyTmpl, channel string) []string {
	return ValidateComplete(subjectTmpl, bodyTmpl, channel, s.funcMap, "router.offline")
}

// SaveTemplate saves or updates a custom template in the database.
func (s *Service) SaveTemplate(ctx context.Context, eventType, channel, subjectTmpl, bodyTmpl string, isDefault bool) error {
	validationErrors := ValidateComplete(subjectTmpl, bodyTmpl, channel, s.funcMap, eventType)
	if len(validationErrors) > 0 {
		return fmt.Errorf("template validation failed: %s", strings.Join(validationErrors, "; "))
	}

	_, err := s.db.AlertTemplate.Create().
		SetEventType(eventType).
		SetChannel(alerttemplate.Channel(channel)).
		SetSubjectTemplate(subjectTmpl).
		SetBodyTemplate(bodyTmpl).
		SetIsDefault(isDefault).
		Save(ctx)

	if err != nil {
		return fmt.Errorf("failed to save template: %w", err)
	}

	s.cache.InvalidateAll(channel, eventType)

	s.log.Infow("saved custom template",
		"event_type", eventType,
		"channel", channel,
		"is_default", isDefault,
	)

	return nil
}

// ResetToDefault deletes the custom template and reverts to embedded default.
func (s *Service) ResetToDefault(ctx context.Context, eventType, channel string) error {
	tmpl, err := s.db.AlertTemplate.Query().
		Where(
			alerttemplate.EventTypeEQ(eventType),
			alerttemplate.ChannelEQ(alerttemplate.Channel(channel)),
		).
		Only(ctx)

	if err != nil {
		if ent.IsNotFound(err) {
			return nil
		}
		return fmt.Errorf("failed to query template: %w", err)
	}

	if tmpl.IsDefault {
		return fmt.Errorf("cannot reset system default template")
	}

	if err := s.db.AlertTemplate.DeleteOne(tmpl).Exec(ctx); err != nil {
		return fmt.Errorf("failed to delete template: %w", err)
	}

	s.cache.InvalidateAll(channel, eventType)

	s.log.Infow("reset template to default",
		"event_type", eventType,
		"channel", channel,
	)

	return nil
}

func (s *Service) getTemplate(ctx context.Context, eventType, channel string) (subject, body string, err error) {
	tmpl, err := s.db.AlertTemplate.Query().
		Where(
			alerttemplate.EventTypeEQ(eventType),
			alerttemplate.ChannelEQ(alerttemplate.Channel(channel)),
		).
		Only(ctx)

	if err == nil {
		return tmpl.SubjectTemplate, tmpl.BodyTemplate, nil
	}

	if !ent.IsNotFound(err) {
		return "", "", fmt.Errorf("database query error: %w", err)
	}

	return s.getEmbeddedTemplate(channel)
}

func (s *Service) getEmbeddedTemplate(channel string) (subject, body string, err error) {
	if channelHasSubject(channel) {
		subjectTmpl, loadErr := alerts.GetTemplate(channel, "default-subject")
		if loadErr != nil {
			return "", "", fmt.Errorf("failed to load default subject template: %w", loadErr)
		}
		subject = subjectTmpl
	}

	bodyName := "default-message"
	if channel == channelEmail {
		bodyName = "default-body.txt"
	}

	bodyTmpl, err := alerts.GetTemplate(channel, bodyName)
	if err != nil {
		return "", "", fmt.Errorf("failed to load default body template: %w", err)
	}

	return subject, bodyTmpl, nil
}

func channelHasSubject(channel string) bool {
	switch channel {
	case channelEmail, "pushover", "inapp":
		return true
	default:
		return false
	}
}

func (s *Service) renderTemplate(subjectTmpl, bodyTmpl string, data TemplateData, channel string) (subject, body string, err error) { //nolint:unparam // channel reserved for channel-specific template rendering
	if subjectTmpl != "" {
		subjectTmplObj, parseErr := template.New("subject").
			Funcs(s.funcMap).
			Option("missingkey=zero").
			Parse(subjectTmpl)
		if parseErr != nil {
			return "", "", fmt.Errorf("subject template parse error: %w", parseErr)
		}

		var subjectBuf strings.Builder
		execErr := subjectTmplObj.Execute(&subjectBuf, data)
		if execErr != nil {
			return "", "", fmt.Errorf("subject template execution error: %w", execErr)
		}
		subject = strings.TrimSpace(subjectBuf.String())
	}

	if bodyTmpl == "" {
		return "", "", fmt.Errorf("body template cannot be empty")
	}

	bodyTmplObj, parseErr := template.New("body").
		Funcs(s.funcMap).
		Option("missingkey=zero").
		Parse(bodyTmpl)
	if parseErr != nil {
		return "", "", fmt.Errorf("body template parse error: %w", parseErr)
	}

	var bodyBuf strings.Builder
	execErr := bodyTmplObj.Execute(&bodyBuf, data)
	if execErr != nil {
		return "", "", fmt.Errorf("body template execution error: %w", execErr)
	}
	body = bodyBuf.String()

	return subject, body, nil
}

func (s *Service) fallbackMessage(alert *ent.Alert) (subject, body string, err error) {
	if alert == nil {
		return "", "", fmt.Errorf("alert cannot be nil for fallback")
	}

	subject = fmt.Sprintf("[%s] %s", alert.Severity, alert.Title)
	body = fmt.Sprintf("%s\n\n%s", alert.Title, alert.Message)

	if alert.DeviceID != "" {
		body += fmt.Sprintf("\n\nDevice: %s", alert.DeviceID)
	}

	return subject, body, nil
}

// escapeHTMLInData recursively escapes HTML characters in string fields of TemplateData.
// This prevents template injection attacks when rendering email templates.
func (s *Service) escapeHTMLInData(data *TemplateData) {
	if data == nil {
		return
	}

	// Escape top-level string fields
	data.Title = html.EscapeString(data.Title)
	data.Message = html.EscapeString(data.Message)
	data.DeviceName = html.EscapeString(data.DeviceName)
	data.DeviceIP = html.EscapeString(data.DeviceIP)
	data.RuleName = html.EscapeString(data.RuleName)
	data.RuleID = html.EscapeString(data.RuleID)

	// Escape suggested actions
	for i := range data.SuggestedActions {
		data.SuggestedActions[i] = html.EscapeString(data.SuggestedActions[i])
	}

	// Escape string values in EventData map
	if data.EventData != nil {
		for key, value := range data.EventData {
			if strValue, ok := value.(string); ok {
				data.EventData[key] = html.EscapeString(strValue)
			}
		}
	}
}

// StripHTMLTags removes HTML tags from a string (for plaintext email fallback).
func StripHTMLTags(htmlStr string) string {
	re := regexp.MustCompile(`<[^>]*>`)
	text := re.ReplaceAllString(htmlStr, "")
	text = regexp.MustCompile(`\s+`).ReplaceAllString(text, " ")
	text = strings.TrimSpace(text)
	return text
}
