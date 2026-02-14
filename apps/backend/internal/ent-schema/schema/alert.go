package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
)

// Alert holds the schema definition for the Alert entity.
// Alerts are individual instances triggered when alert rule conditions are met.
// Stored in system.db for centralized alert management across all routers.
type Alert struct {
	ent.Schema
}

// Fields of the Alert entity.
func (Alert) Fields() []ent.Field {
	return []ent.Field{
		// ULID primary key
		field.String("id").
			MaxLen(26).
			NotEmpty().
			Unique().
			Immutable().
			Comment("ULID primary key"),

		// Reference to the alert rule that triggered this alert
		field.String("rule_id").
			NotEmpty().
			MaxLen(26).
			Comment("Alert rule ID that triggered this alert"),

		// Event information
		field.String("event_type").
			NotEmpty().
			MaxLen(128).
			Comment("Event type that triggered this alert"),

		// Source information (for filtering service-specific alerts)
		field.String("source_type").
			Optional().
			MaxLen(64).
			Comment("Source type (e.g., 'service', 'system', 'device')"),

		field.String("source_id").
			Optional().
			MaxLen(128).
			Comment("Source ID (e.g., service instance ULID)"),

		// Severity level (copied from rule at trigger time)
		field.Enum("severity").
			Values("CRITICAL", "WARNING", "INFO").
			Comment("Alert severity level"),

		// Alert content
		field.String("title").
			NotEmpty().
			MaxLen(255).
			Comment("Alert title/summary"),

		field.String("message").
			NotEmpty().
			MaxLen(2000).
			Comment("Detailed alert message"),

		// Event data (JSON) - contextual information from the event
		field.JSON("data", map[string]interface{}{}).
			Optional().
			Comment("Event data and context information"),

		// Device association (optional - which device triggered this)
		field.String("device_id").
			Optional().
			MaxLen(26).
			Comment("Device ID that triggered this alert"),

		// Acknowledgment tracking
		field.Time("acknowledged_at").
			Optional().
			Nillable().
			Comment("When alert was acknowledged"),

		field.String("acknowledged_by").
			Optional().
			MaxLen(255).
			Comment("User who acknowledged the alert"),

		// Suppression tracking
		field.Int("suppressed_count").
			Default(0).
			NonNegative().
			Comment("Number of times this alert was suppressed due to rate limiting"),

		field.String("suppress_reason").
			Optional().
			MaxLen(500).
			Comment("Reason for suppression (e.g., 'rate_limit', 'duplicate')"),

		// Delivery tracking - which channels successfully delivered
		field.JSON("delivery_status", map[string]interface{}{}).
			Optional().
			Comment("Delivery status per channel (e.g., {email: 'sent', telegram: 'failed'})"),

		// Timestamps
		field.Time("triggered_at").
			Default(time.Now).
			Immutable().
			Comment("When alert was triggered"),

		field.Time("updated_at").
			Default(time.Now).
			UpdateDefault(time.Now).
			Comment("Last update timestamp"),
	}
}

// Edges of the Alert entity.
func (Alert) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("rule", AlertRule.Type).
			Ref("alerts").
			Field("rule_id").
			Unique().
			Required().
			Comment("Alert rule that triggered this alert"),

		edge.To("escalations", AlertEscalation.Type).
			Comment("Escalation tracking for this alert"),

		edge.To("notification_logs", NotificationLog.Type).
			Comment("Notification delivery logs for this alert"),
	}
}

// Indexes of the Alert entity.
func (Alert) Indexes() []ent.Index {
	return []ent.Index{
		// Rule ID lookup for finding alerts by rule
		index.Fields("rule_id"),
		// Severity filtering
		index.Fields("severity"),
		// Device filtering
		index.Fields("device_id"),
		// Unacknowledged alerts (active alerts)
		index.Fields("acknowledged_at"),
		// Combined index for active alerts by device
		index.Fields("device_id", "acknowledged_at"),
		// Time-based queries (recent alerts)
		index.Fields("triggered_at"),
		// Event type lookup
		index.Fields("event_type"),
		// Suppression reason filtering (for analyzing suppressed alerts)
		index.Fields("suppress_reason"),
		// Source filtering (for service-specific alerts)
		index.Fields("source_type"),
		index.Fields("source_type", "source_id"),
	}
}
