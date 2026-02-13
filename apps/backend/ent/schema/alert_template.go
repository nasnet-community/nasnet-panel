package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
)

// AlertTemplate holds the schema definition for the AlertTemplate entity.
// Alert templates define the message format for different event types and notification channels.
// Stored in system.db for centralized template management across all alert rules.
type AlertTemplate struct {
	ent.Schema
}

// Fields of the AlertTemplate entity.
func (AlertTemplate) Fields() []ent.Field {
	return []ent.Field{
		// ULID primary key
		field.String("id").
			MaxLen(26).
			NotEmpty().
			Unique().
			Immutable().
			Comment("ULID primary key"),

		// Event type this template applies to
		field.String("event_type").
			NotEmpty().
			MaxLen(128).
			Comment("Event type this template applies to (e.g., 'router.offline', 'interface.down')"),

		// Notification channel
		field.Enum("channel").
			Values("email", "telegram", "pushover", "webhook", "inapp").
			Comment("Notification channel this template is for"),

		// Template content - subject (optional for channels that support it)
		field.String("subject_template").
			Optional().
			MaxLen(500).
			Comment("Subject/title template (for email, pushover, inapp notifications)"),

		// Template content - body (required)
		field.Text("body_template").
			NotEmpty().
			Comment("Body template with Go template syntax (e.g., {{.RouterName}} {{.Status}})"),

		// System default flag (prevents deletion)
		field.Bool("is_default").
			Default(false).
			Comment("Whether this is a system default template (cannot be deleted)"),

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

// Indexes of the AlertTemplate entity.
func (AlertTemplate) Indexes() []ent.Index {
	return []ent.Index{
		// Fast lookups by event type
		index.Fields("event_type"),
		// Fast lookups by channel
		index.Fields("channel"),
		// Unique constraint: only one template per event type per channel
		index.Fields("event_type", "channel").Unique(),
		// Find system default templates
		index.Fields("is_default"),
	}
}
