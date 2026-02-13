package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
)

// AlertRuleTemplate holds the schema definition for the AlertRuleTemplate entity.
// Alert rule templates provide pre-configured alert rules that can be customized and applied.
// Supports both built-in templates (loaded from JSON files) and custom templates created by users.
// Stored in system.db for centralized template management.
type AlertRuleTemplate struct {
	ent.Schema
}

// Fields of the AlertRuleTemplate entity.
func (AlertRuleTemplate) Fields() []ent.Field {
	return []ent.Field{
		// ULID primary key
		field.String("id").
			MaxLen(26).
			NotEmpty().
			Unique().
			Immutable().
			Comment("ULID primary key"),

		// Basic identification
		field.String("name").
			NotEmpty().
			MaxLen(255).
			Comment("Template name (e.g., 'Device Offline', 'High CPU')"),

		field.String("description").
			NotEmpty().
			MaxLen(1000).
			Comment("Description of what this template monitors and when to use it"),

		// Category for organization
		field.Enum("category").
			Values("NETWORK", "SECURITY", "RESOURCES", "VPN", "DHCP", "SYSTEM", "CUSTOM").
			Default("CUSTOM").
			Comment("Template category for filtering and organization"),

		// Event type this template monitors
		field.String("event_type").
			NotEmpty().
			MaxLen(128).
			Comment("Event type to monitor (e.g., 'device.offline', 'interface.down')"),

		// Default severity
		field.Enum("severity").
			Values("CRITICAL", "WARNING", "INFO").
			Default("WARNING").
			Comment("Default alert severity level"),

		// Variables that can be customized when applying template
		// Array of objects: {name: string, label: string, type: string, required: bool, defaultValue: string, min: number, max: number, unit: string}
		field.JSON("variables", []map[string]interface{}{}).
			Optional().
			Comment("Customizable variables for this template (e.g., threshold percentages, durations)"),

		// Conditions template (with variable placeholders like {{DURATION_SECONDS}})
		// Array of condition objects: {field: string, operator: string, value: string}
		field.JSON("conditions", []map[string]interface{}{}).
			Optional().
			Comment("Condition templates with variable placeholders"),

		// Throttle configuration template
		// {maxAlerts: int, periodSeconds: int, groupByField: string}
		field.JSON("throttle", map[string]interface{}{}).
			Optional().
			Comment("Default throttle configuration"),

		// Default notification channels
		field.JSON("channels", []string{}).
			Comment("Default notification channels (e.g., ['email', 'inapp'])"),

		// Built-in vs custom templates
		field.Bool("is_built_in").
			Default(false).
			Immutable().
			Comment("Whether this is a built-in template (cannot be deleted)"),

		// Template version for future upgrades
		field.String("version").
			Default("1.0.0").
			MaxLen(20).
			Comment("Template version (e.g., '1.0.0')"),

		// Usage tracking for cleanup
		field.Int("usage_count").
			Default(0).
			Comment("Number of times this template has been used to create rules"),

		// Timestamps
		field.Time("created_at").
			Default(time.Now).
			Immutable().
			Comment("Record creation timestamp"),

		field.Time("updated_at").
			Default(time.Now).
			UpdateDefault(time.Now).
			Comment("Last update timestamp"),
	}
}

// Indexes of the AlertRuleTemplate entity.
func (AlertRuleTemplate) Indexes() []ent.Index {
	return []ent.Index{
		// Fast lookups by category
		index.Fields("category"),
		// Fast lookups by event type
		index.Fields("event_type"),
		// Find built-in templates
		index.Fields("is_built_in"),
		// Sort by usage for recommendations
		index.Fields("usage_count"),
		// Combined index for category filtering
		index.Fields("category", "is_built_in"),
	}
}
