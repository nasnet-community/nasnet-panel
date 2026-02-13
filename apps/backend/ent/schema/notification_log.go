package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
)

// NotificationLog holds the schema definition for the NotificationLog entity.
// NotificationLog tracks all notification delivery attempts for audit and debugging.
// Stored in system.db for centralized notification audit trail.
type NotificationLog struct {
	ent.Schema
}

// Fields of the NotificationLog entity.
func (NotificationLog) Fields() []ent.Field {
	return []ent.Field{
		// ULID primary key
		field.String("id").
			MaxLen(26).
			NotEmpty().
			Unique().
			Immutable().
			Comment("ULID primary key"),

		// Notification channel
		field.Enum("channel").
			Values("email", "telegram", "pushover", "webhook", "inapp").
			Comment("Notification channel type"),

		// Alert reference
		field.String("alert_id").
			NotEmpty().
			MaxLen(26).
			Comment("Alert ID that triggered this notification"),

		// Webhook reference (optional - only for webhook channel)
		field.String("webhook_id").
			Optional().
			MaxLen(26).
			Comment("Webhook ID (for webhook channel only)"),

		// Delivery status
		field.Enum("status").
			Values("pending", "success", "failed", "retrying").
			Default("pending").
			Comment("Delivery status"),

		// Attempt tracking
		field.Int("attempt_number").
			Default(1).
			Positive().
			Comment("Delivery attempt number (1-based)"),

		// Response tracking
		field.Int("response_code").
			Optional().
			Comment("HTTP response code (for webhook/API-based channels)"),

		field.String("response_body").
			Optional().
			MaxLen(2000).
			Comment("Response body (truncated to 2000 chars for debugging)"),

		// Error tracking
		field.String("error_message").
			Optional().
			MaxLen(1000).
			Comment("Error message if delivery failed"),

		// Request metadata (JSON)
		// For webhooks: {url: string, method: string, headers: {}, body: string}
		// For email: {to: string, subject: string}
		// For telegram: {chat_id: string}
		field.JSON("request_metadata", map[string]interface{}{}).
			Optional().
			Comment("Request metadata for debugging"),

		// Timestamps
		field.Time("created_at").
			Default(time.Now).
			Immutable().
			Comment("Log entry creation timestamp"),

		field.Time("completed_at").
			Optional().
			Nillable().
			Comment("When delivery attempt completed (success or failure)"),
	}
}

// Edges of the NotificationLog entity.
func (NotificationLog) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("alert", Alert.Type).
			Ref("notification_logs").
			Field("alert_id").
			Unique().
			Required().
			Comment("Alert that triggered this notification"),

		edge.From("webhook", Webhook.Type).
			Ref("logs").
			Field("webhook_id").
			Unique().
			Comment("Webhook configuration (for webhook channel)"),
	}
}

// Indexes of the NotificationLog entity.
func (NotificationLog) Indexes() []ent.Index {
	return []ent.Index{
		// Alert ID lookup for finding all delivery attempts for an alert
		index.Fields("alert_id"),
		// Webhook ID lookup for webhook-specific logs
		index.Fields("webhook_id"),
		// Channel filtering
		index.Fields("channel"),
		// Status filtering (find failed deliveries)
		index.Fields("status"),
		// Combined index for alert delivery status
		index.Fields("alert_id", "status"),
		// Combined index for webhook delivery tracking
		index.Fields("webhook_id", "status"),
		// Time-based queries (recent logs)
		index.Fields("created_at"),
		// Failed delivery analysis
		index.Fields("status", "created_at"),
	}
}
