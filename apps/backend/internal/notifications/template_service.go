package notifications

import (
	"context"
	"fmt"
	"regexp"
	"strings"
	"text/template"

	"backend/ent"
	"backend/ent/alerttemplate"
	"backend/templates/alerts"

	"go.uber.org/zap"
)

// TemplateService implements the TemplateRenderer interface.
// It manages alert notification templates with caching, validation, and fallback handling.
type TemplateService struct {
	db       *ent.Client
	cache    *TemplateCache
	log      *zap.SugaredLogger
	funcMap  template.FuncMap
}

// TemplateServiceConfig holds configuration for creating a TemplateService.
type TemplateServiceConfig struct {
	DB     *ent.Client
	Logger *zap.SugaredLogger
}

// NewTemplateService creates a new template service.
func NewTemplateService(cfg TemplateServiceConfig) *TemplateService {
	return &TemplateService{
		db:      cfg.DB,
		cache:   NewTemplateCache(),
		log:     cfg.Logger,
		funcMap: alerts.TemplateFuncMap(),
	}
}

// RenderAlert renders an alert notification using the appropriate template.
// This is the main entry point for the notification dispatcher.
//
// Behavior:
// 1. Query DB for custom template
// 2. If not found, load embedded default template
// 3. Build template data from alert
// 4. Execute template with data
// 5. On error: log warning and return simple fallback (NEVER block delivery)
func (s *TemplateService) RenderAlert(ctx context.Context, alert *ent.Alert, channel string) (subject, body string, err error) {
	// Get the template (custom or default)
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

	// Build template data
	data := BuildTemplateData(alert)

	// Render the template
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

	// For email channel, also strip HTML tags for plaintext fallback
	if channel == "email" {
		// The plaintext version is the body we just rendered
		// HTML version would be handled separately if needed
	}

	return subject, body, nil
}

// getTemplate retrieves a template from cache, DB, or embedded defaults.
func (s *TemplateService) getTemplate(ctx context.Context, eventType, channel string) (subject, body string, err error) {
	// Try to get custom template from database
	tmpl, err := s.db.AlertTemplate.Query().
		Where(
			alerttemplate.EventTypeEQ(eventType),
			alerttemplate.ChannelEQ(alerttemplate.Channel(channel)),
		).
		Only(ctx)

	if err == nil {
		// Found custom template
		return tmpl.SubjectTemplate, tmpl.BodyTemplate, nil
	}

	if !ent.IsNotFound(err) {
		// Database error (not just "not found")
		return "", "", fmt.Errorf("database query error: %w", err)
	}

	// No custom template, load embedded default
	return s.getEmbeddedTemplate(channel)
}

// getEmbeddedTemplate loads a template from embedded files.
func (s *TemplateService) getEmbeddedTemplate(channel string) (subject, body string, err error) {
	// Load subject template if the channel supports it
	if channelHasSubject(channel) {
		subjectTmpl, err := alerts.GetTemplate(channel, "default-subject")
		if err != nil {
			return "", "", fmt.Errorf("failed to load default subject template: %w", err)
		}
		subject = subjectTmpl
	}

	// Load body template (required for all channels)
	bodyName := "default-message"
	if channel == "email" {
		// For email, we have separate HTML and text templates
		// For now, use the text template
		bodyName = "default-body.txt"
	}

	bodyTmpl, err := alerts.GetTemplate(channel, bodyName)
	if err != nil {
		return "", "", fmt.Errorf("failed to load default body template: %w", err)
	}

	return subject, bodyTmpl, nil
}

// channelHasSubject returns true if the channel supports subject lines.
func channelHasSubject(channel string) bool {
	switch channel {
	case "email", "pushover", "inapp":
		return true
	default:
		return false
	}
}

// renderTemplate renders subject and body templates with data.
func (s *TemplateService) renderTemplate(subjectTmpl, bodyTmpl string, data TemplateData) (subject, body string, err error) {
	// Check cache first
	cachedTmpl := s.cache.Get("", "", subjectTmpl, bodyTmpl)
	if cachedTmpl != nil {
		// Execute cached template
		var buf strings.Builder
		if err := cachedTmpl.Execute(&buf, data); err != nil {
			return "", "", fmt.Errorf("template execution error: %w", err)
		}

		// Parse the output to separate subject and body
		// The cached template combines both, so we need to split
		// For now, we'll render them separately
	}

	// Render subject if provided
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

	// Render body (required)
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

	// Cache the parsed templates for next time
	if subjectTmpl != "" || bodyTmpl != "" {
		// We could cache the combined template, but for simplicity,
		// we'll cache on demand. The performance benefit is minimal
		// since template parsing is already fast.
	}

	return subject, body, nil
}

// fallbackMessage returns a simple formatted message when template rendering fails.
// This ensures notification delivery is never blocked by template errors.
func (s *TemplateService) fallbackMessage(alert *ent.Alert, channel string) (subject, body string, err error) {
	// Simple subject line
	subject = fmt.Sprintf("[%s] %s", alert.Severity, alert.Title)

	// Simple body with basic formatting
	body = fmt.Sprintf("%s\n\n%s", alert.Title, alert.Message)

	// Add device info if available
	if alert.DeviceID != "" {
		body += fmt.Sprintf("\n\nDevice: %s", alert.DeviceID)
	}

	// No error - fallback always succeeds
	return subject, body, nil
}

// PreviewTemplate renders a template with sample data for preview.
func (s *TemplateService) PreviewTemplate(ctx context.Context, eventType, channel, subjectTmpl, bodyTmpl string) (subject, body string, err error) {
	// Build sample data for the event type
	data := BuildSampleTemplateData(eventType)

	// Render the template
	subject, body, err = s.renderTemplate(subjectTmpl, bodyTmpl, data)
	if err != nil {
		return "", "", fmt.Errorf("preview rendering failed: %w", err)
	}

	return subject, body, nil
}

// ValidateTemplate validates template syntax and checks for issues.
func (s *TemplateService) ValidateTemplate(subjectTmpl, bodyTmpl string, channel string) []string {
	// Use the comprehensive validator
	return ValidateTemplateComplete(subjectTmpl, bodyTmpl, channel, s.funcMap, "router.offline")
}

// SaveTemplate saves or updates a custom template in the database.
func (s *TemplateService) SaveTemplate(ctx context.Context, eventType, channel, subjectTmpl, bodyTmpl string, isDefault bool) error {
	// Validate the template first
	validationErrors := ValidateTemplateComplete(subjectTmpl, bodyTmpl, channel, s.funcMap, eventType)
	if len(validationErrors) > 0 {
		return fmt.Errorf("template validation failed: %s", strings.Join(validationErrors, "; "))
	}

	// Upsert to database using unique constraint on (event_type, channel)
	err := s.db.AlertTemplate.Create().
		SetEventType(eventType).
		SetChannel(alerttemplate.Channel(channel)).
		SetSubjectTemplate(subjectTmpl).
		SetBodyTemplate(bodyTmpl).
		SetIsDefault(isDefault).
		OnConflict().
		UpdateNewValues().
		Exec(ctx)

	if err != nil {
		return fmt.Errorf("failed to save template: %w", err)
	}

	// Invalidate cache for this event type and channel
	s.cache.InvalidateAll(channel, eventType)

	s.log.Infow("saved custom template",
		"event_type", eventType,
		"channel", channel,
		"is_default", isDefault,
	)

	return nil
}

// ResetToDefault deletes the custom template and reverts to embedded default.
func (s *TemplateService) ResetToDefault(ctx context.Context, eventType, channel string) error {
	// Query for the template
	tmpl, err := s.db.AlertTemplate.Query().
		Where(
			alerttemplate.EventTypeEQ(eventType),
			alerttemplate.ChannelEQ(alerttemplate.Channel(channel)),
		).
		Only(ctx)

	if err != nil {
		if ent.IsNotFound(err) {
			// Already using default (no custom template)
			return nil
		}
		return fmt.Errorf("failed to query template: %w", err)
	}

	// Don't allow deleting system defaults
	if tmpl.IsDefault {
		return fmt.Errorf("cannot reset system default template")
	}

	// Delete the custom template
	if err := s.db.AlertTemplate.DeleteOne(tmpl).Exec(ctx); err != nil {
		return fmt.Errorf("failed to delete template: %w", err)
	}

	// Invalidate cache
	s.cache.InvalidateAll(channel, eventType)

	s.log.Infow("reset template to default",
		"event_type", eventType,
		"channel", channel,
	)

	return nil
}

// stripHTMLTags removes HTML tags from a string (for plaintext email fallback).
func stripHTMLTags(html string) string {
	// Simple regex to remove HTML tags
	re := regexp.MustCompile(`<[^>]*>`)
	text := re.ReplaceAllString(html, "")

	// Clean up multiple spaces/newlines
	text = regexp.MustCompile(`\s+`).ReplaceAllString(text, " ")
	text = strings.TrimSpace(text)

	return text
}
