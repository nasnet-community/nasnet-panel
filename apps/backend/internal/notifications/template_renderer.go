package notifications

import (
	"context"

	"backend/generated/ent"
)

// TemplateRenderer defines the interface for rendering alert notification templates.
// It handles template retrieval, caching, validation, and rendering for all notification channels.
//
// This is the port (in hexagonal architecture terms) that defines the contract
// for template rendering operations. The TemplateService implements this interface.
type TemplateRenderer interface {
	// RenderAlert renders an alert notification using the appropriate template for the channel.
	// It loads custom templates from DB if available, otherwise falls back to embedded defaults.
	// On any error, it returns a simple fallback message to never block notification delivery.
	//
	// Returns:
	//   - subject: Rendered subject line (empty for channels that don't use subjects)
	//   - body: Rendered message body
	//   - err: Error (logged but delivery continues with fallback)
	RenderAlert(ctx context.Context, alert *ent.Alert, channel string) (subject, body string, err error)

	// PreviewTemplate renders a template with sample data for preview purposes.
	// Used by the frontend to show users what their custom templates will look like.
	//
	// Parameters:
	//   - eventType: The event type for loading sample data
	//   - channel: The notification channel
	//   - subjectTmpl: Subject template string (can be empty for channels without subjects)
	//   - bodyTmpl: Body template string
	//
	// Returns:
	//   - subject: Rendered subject
	//   - body: Rendered body
	//   - err: Validation or rendering error
	PreviewTemplate(ctx context.Context, eventType, channel, subjectTmpl, bodyTmpl string) (subject, body string, err error)

	// ValidateTemplate validates template syntax and checks for issues.
	// Returns an array of validation error messages (empty if valid).
	//
	// Checks:
	//   - Template syntax can be parsed
	//   - No restricted functions are used
	//   - Rendered length is within channel limits
	ValidateTemplate(subjectTmpl, bodyTmpl string, channel string) []string

	// SaveTemplate saves or updates a custom template in the database.
	// Validates the template before saving and invalidates the cache.
	//
	// Parameters:
	//   - eventType: Event type this template is for
	//   - channel: Notification channel
	//   - subjectTmpl: Subject template (can be empty for channels without subjects)
	//   - bodyTmpl: Body template
	//   - isDefault: Whether this is a system default template
	SaveTemplate(ctx context.Context, eventType, channel, subjectTmpl, bodyTmpl string, isDefault bool) error

	// ResetToDefault deletes the custom template and reverts to the embedded default.
	// Only works for non-default templates (cannot delete system defaults).
	ResetToDefault(ctx context.Context, eventType, channel string) error
}
