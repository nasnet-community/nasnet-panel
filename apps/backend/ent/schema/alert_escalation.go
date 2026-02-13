package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
)

// AlertEscalation holds the schema definition for the AlertEscalation entity.
// Tracks escalation state for unacknowledged alerts that require progressive notification.
// Stored in system.db for centralized escalation management across all routers.
type AlertEscalation struct {
	ent.Schema
}

// Fields of the AlertEscalation entity.
func (AlertEscalation) Fields() []ent.Field {
	return []ent.Field{
		// ULID primary key
		field.String("id").
			MaxLen(26).
			NotEmpty().
			Unique().
			Immutable().
			Comment("ULID primary key"),

		// Foreign keys
		field.String("alert_id").
			NotEmpty().
			MaxLen(26).
			Comment("Alert ID being tracked for escalation"),

		field.String("rule_id").
			NotEmpty().
			MaxLen(26).
			Comment("Alert rule ID with escalation configuration"),

		// Escalation state
		field.Int("current_level").
			Default(0).
			NonNegative().
			Comment("Current escalation level (0 = initial, 1+ = escalated)"),

		field.Int("max_level").
			Positive().
			Comment("Maximum escalation level before stopping"),

		field.Enum("status").
			Values("PENDING", "RESOLVED", "MAX_REACHED").
			Default("PENDING").
			Comment("Escalation status"),

		// Timing configuration
		field.Time("next_escalation_at").
			Optional().
			Nillable().
			Comment("When next escalation level should trigger"),

		field.Int("escalation_delay_seconds").
			Positive().
			Comment("Delay in seconds before first escalation"),

		// Escalation intervals for each level (JSON array of integers)
		field.JSON("repeat_interval_seconds", []int{}).
			Comment("Delay in seconds for each escalation level"),

		// Additional channels to add at each escalation level (JSON array of strings)
		field.JSON("additional_channels", []string{}).
			Comment("Additional notification channels to add during escalation"),

		// Resolution tracking
		field.Time("resolved_at").
			Optional().
			Nillable().
			Comment("When escalation was resolved (alert acknowledged or max reached)"),

		field.String("resolved_by").
			Optional().
			MaxLen(255).
			Comment("Reason for resolution (e.g., 'alert acknowledged', 'max level reached')"),

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

// Edges of the AlertEscalation entity.
func (AlertEscalation) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("alert", Alert.Type).
			Ref("escalations").
			Field("alert_id").
			Unique().
			Required().
			Comment("Alert being tracked for escalation"),

		edge.From("rule", AlertRule.Type).
			Ref("escalations").
			Field("rule_id").
			Unique().
			Required().
			Comment("Alert rule with escalation configuration"),
	}
}

// Indexes of the AlertEscalation entity.
func (AlertEscalation) Indexes() []ent.Index {
	return []ent.Index{
		// Alert ID lookup for finding escalation by alert
		index.Fields("alert_id"),
		// Status filtering for active escalations
		index.Fields("status"),
		// Next escalation time for timer scheduling
		index.Fields("next_escalation_at"),
		// Combined index for recovery queries (find pending escalations due for trigger)
		index.Fields("status", "next_escalation_at"),
		// Rule ID lookup for finding escalations by rule
		index.Fields("rule_id"),
	}
}
