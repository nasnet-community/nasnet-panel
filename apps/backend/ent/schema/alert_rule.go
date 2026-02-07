package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
)

// AlertRule holds the schema definition for the AlertRule entity.
// Alert rules define conditions that trigger notifications when met.
// Stored in system.db as they apply across all routers.
type AlertRule struct {
	ent.Schema
}

// Fields of the AlertRule entity.
func (AlertRule) Fields() []ent.Field {
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
			Comment("Human-readable alert rule name"),

		field.String("description").
			Optional().
			MaxLen(1000).
			Comment("Optional description of what this rule monitors"),

		// Event matching
		field.String("event_type").
			NotEmpty().
			MaxLen(128).
			Comment("Event type to match (e.g., 'router.offline', 'interface.down', 'cpu.high')"),

		// Conditions are stored as JSON array of condition objects
		// Each condition: {field: string, operator: string, value: string}
		field.JSON("conditions", []map[string]interface{}{}).
			Optional().
			Comment("Array of condition objects for event matching"),

		// Severity level
		field.Enum("severity").
			Values("CRITICAL", "WARNING", "INFO").
			Default("WARNING").
			Comment("Alert severity level"),

		// Notification channels (stored as JSON array of strings)
		field.JSON("channels", []string{}).
			Comment("Notification channels to use (e.g., ['email', 'telegram', 'pushover', 'webhook', 'inapp'])"),

		// Throttle configuration (JSON object)
		// {maxAlerts: int, periodSeconds: int, groupByField: string}
		field.JSON("throttle", map[string]interface{}{}).
			Optional().
			Comment("Throttle configuration to prevent alert spam"),

		// Quiet hours configuration (JSON object)
		// {startTime: string, endTime: string, timezone: string, bypassCritical: bool}
		field.JSON("quiet_hours", map[string]interface{}{}).
			Optional().
			Comment("Quiet hours configuration for non-critical alerts"),

		// Device filter (optional - if set, rule only applies to specific device)
		field.String("device_id").
			Optional().
			MaxLen(26).
			Comment("Optional device ID filter - rule only applies to this device"),

		// Enable/disable toggle
		field.Bool("enabled").
			Default(true).
			Comment("Whether this alert rule is enabled"),

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

// Edges of the AlertRule entity.
func (AlertRule) Edges() []ent.Edge {
	return []ent.Edge{
		edge.To("alerts", Alert.Type).
			Comment("Alerts triggered by this rule"),
	}
}

// Indexes of the AlertRule entity.
func (AlertRule) Indexes() []ent.Index {
	return []ent.Index{
		// Event type lookup for fast rule matching
		index.Fields("event_type"),
		// Enabled rules
		index.Fields("enabled"),
		// Severity filtering
		index.Fields("severity"),
		// Device-specific rules
		index.Fields("device_id"),
		// Combined index for active rule queries
		index.Fields("enabled", "event_type"),
	}
}
