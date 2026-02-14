package templates

import (
	"context"
	"fmt"
	"regexp"
	"strings"
	"text/template"

	"backend/generated/ent"
	"backend/generated/ent/alerttemplate"
	"backend/templates/alerts"

	"go.uber.org/zap"
)

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
	subjectTmpl, bodyTmpl, err := s.getTemplate(ctx, alert.EventType, channel)
	if err != nil {
		s.log.Warnw("failed to get template, using fallback",
			"alert_id", alert.ID,
			"event_type", alert.EventType,
			"channel", channel,
			"error", err,
		)
		return s.fallbackMessage(alert, channel)
	}

	data := BuildTemplateData(alert)

	subject, body, err = s.renderTemplate(subjectTmpl, bodyTmpl, data)
	if err != nil {
		s.log.Warnw("template rendering failed, using fallback",
			"alert_id", alert.ID,
			"event_type", alert.EventType,
			"channel", channel,
			"error", err,
		)
		return s.fallbackMessage(alert, channel)
	}

	return subject, body, nil
}

// PreviewTemplate renders a template with sample data for preview.
func (s *Service) PreviewTemplate(ctx context.Context, eventType, channel, subjectTmpl, bodyTmpl string) (subject, body string, err error) {
	data := BuildSampleTemplateData(eventType)

	subject, body, err = s.renderTemplate(subjectTmpl, bodyTmpl, data)
	if err != nil {
		return "", "", fmt.Errorf("preview rendering failed: %w", err)
	}

	return subject, body, nil
}

// ValidateTemplate validates template syntax and checks for issues.
func (s *Service) ValidateTemplate(subjectTmpl, bodyTmpl string, channel string) []string {
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
		subjectTmpl, err := alerts.GetTemplate(channel, "default-subject")
		if err != nil {
			return "", "", fmt.Errorf("failed to load default subject template: %w", err)
		}
		subject = subjectTmpl
	}

	bodyName := "default-message"
	if channel == "email" {
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
	case "email", "pushover", "inapp":
		return true
	default:
		return false
	}
}

func (s *Service) renderTemplate(subjectTmpl, bodyTmpl string, data TemplateData) (subject, body string, err error) {
	cachedTmpl := s.cache.Get("", "", subjectTmpl, bodyTmpl)
	if cachedTmpl != nil {
		var buf strings.Builder
		if err := cachedTmpl.Execute(&buf, data); err != nil {
			return "", "", fmt.Errorf("template execution error: %w", err)
		}
	}

	if subjectTmpl != "" {
		tmpl, err := template.New("subject").
			Funcs(s.funcMap).
			Option("missingkey=zero").
			Parse(subjectTmpl)
		if err != nil {
			return "", "", fmt.Errorf("subject template parse error: %w", err)
		}

		var subjectBuf strings.Builder
		if err := tmpl.Execute(&subjectBuf, data); err != nil {
			return "", "", fmt.Errorf("subject template execution error: %w", err)
		}
		subject = strings.TrimSpace(subjectBuf.String())
	}

	tmpl, err := template.New("body").
		Funcs(s.funcMap).
		Option("missingkey=zero").
		Parse(bodyTmpl)
	if err != nil {
		return "", "", fmt.Errorf("body template parse error: %w", err)
	}

	var bodyBuf strings.Builder
	if err := tmpl.Execute(&bodyBuf, data); err != nil {
		return "", "", fmt.Errorf("body template execution error: %w", err)
	}
	body = bodyBuf.String()

	return subject, body, nil
}

func (s *Service) fallbackMessage(alert *ent.Alert, channel string) (subject, body string, err error) {
	subject = fmt.Sprintf("[%s] %s", alert.Severity, alert.Title)
	body = fmt.Sprintf("%s\n\n%s", alert.Title, alert.Message)

	if alert.DeviceID != "" {
		body += fmt.Sprintf("\n\nDevice: %s", alert.DeviceID)
	}

	return subject, body, nil
}

// StripHTMLTags removes HTML tags from a string (for plaintext email fallback).
func StripHTMLTags(html string) string {
	re := regexp.MustCompile(`<[^>]*>`)
	text := re.ReplaceAllString(html, "")
	text = regexp.MustCompile(`\s+`).ReplaceAllString(text, " ")
	text = strings.TrimSpace(text)
	return text
}
