package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
	"github.com/google/uuid"
)

// AlertDigestEntry holds the schema definition for queued alerts awaiting digest delivery.
type AlertDigestEntry struct {
	ent.Schema
}

// Fields of the AlertDigestEntry.
func (AlertDigestEntry) Fields() []ent.Field {
	return []ent.Field{
		field.UUID("id", uuid.UUID{}).
			Default(uuid.New).
			Immutable(),
		field.String("alert_id").
			Optional().
			Nillable().
			Comment("Reference to the original alert"),
		field.String("rule_id").
			Comment("Alert rule that triggered this alert"),
		field.String("channel_id").
			Comment("Notification channel ID for delivery"),
		field.String("channel_type").
			Comment("Channel type: email, webhook, etc."),
		field.Enum("severity").
			Values("critical", "warning", "info").
			Comment("Alert severity level"),
		field.String("event_type").
			Comment("Type of event that triggered the alert"),
		field.String("title").
			Comment("Alert title/summary"),
		field.Text("message").
			Comment("Full alert message"),
		field.JSON("data", map[string]interface{}{}).
			Optional().
			Comment("Additional alert metadata"),
		field.Time("queued_at").
			Default(time.Now).
			Immutable().
			Comment("When the alert was queued for digest"),
		field.Time("delivered_at").
			Optional().
			Nillable().
			Comment("When the digest containing this alert was delivered (NULL = pending)"),
		field.String("digest_id").
			Optional().
			Comment("Groups delivered entries by digest batch ID"),
		field.Bool("bypass_sent").
			Default(false).
			Comment("True if critical alert was sent immediately (appears in digest as history)"),
	}
}

// Edges of the AlertDigestEntry.
func (AlertDigestEntry) Edges() []ent.Edge {
	// No edges - alert_id is a simple string reference since Alert may be
	// deleted by retention policy before digest is delivered
	return nil
}

// Indexes of the AlertDigestEntry.
func (AlertDigestEntry) Indexes() []ent.Index {
	return []ent.Index{
		// Query pending entries for a specific channel
		index.Fields("channel_id", "delivered_at"),
		// Time-range queries for digest compilation
		index.Fields("queued_at"),
		// Group delivered entries by digest batch
		index.Fields("digest_id"),
	}
}
