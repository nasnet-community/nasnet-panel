package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
)

// ResourceEvent captures resource change events for audit and rollback.
// Events form an append-only log that can be used to:
// - Track configuration changes over time
// - Support undo/rollback operations
// - Audit who changed what and when
// - Replay changes for debugging
type ResourceEvent struct {
	ent.Schema
}

// Fields of the ResourceEvent entity.
func (ResourceEvent) Fields() []ent.Field {
	return []ent.Field{
		// ULID primary key (time-sortable for event ordering)
		field.String("id").
			MaxLen(26).
			NotEmpty().
			Unique().
			Immutable().
			Comment("ULID primary key (time-sortable)"),

		// Resource ID (foreign key)
		field.String("resource_id").
			MaxLen(26).
			NotEmpty().
			Comment("Associated resource ULID"),

		// Event type
		field.Enum("event_type").
			Values(
				"created",     // Resource created
				"updated",     // Resource modified
				"deleted",     // Resource deleted
				"synced",      // Synced from router
				"deployed",    // Deployed to router
				"rolled_back", // Rolled back to previous state
				"validated",   // Validation completed
				"error",       // Error occurred
			).
			Comment("Type of event"),

		// User or system that triggered the event
		field.String("actor").
			MaxLen(64).
			Default("system").
			Comment("Who triggered the event (user ID or 'system')"),

		// Previous state (for updates and rollbacks)
		field.JSON("previous_state", map[string]interface{}{}).
			Optional().
			Comment("State before the change (for rollback)"),

		// New state (for creates and updates)
		field.JSON("new_state", map[string]interface{}{}).
			Optional().
			Comment("State after the change"),

		// Change diff (computed field-level changes)
		field.JSON("diff", map[string]interface{}{}).
			Optional().
			Comment("Field-level changes (for UI display)"),

		// Event metadata
		field.JSON("metadata", map[string]interface{}{}).
			Optional().
			Comment("Additional event metadata"),

		// Error details (for error events)
		field.String("error_message").
			Optional().
			MaxLen(1000).
			Comment("Error message if event_type is 'error'"),

		// Source of the event
		field.Enum("source").
			Values("user", "system", "sync", "schedule", "rollback").
			Default("user").
			Comment("Source that triggered the event"),

		// Whether this event can be rolled back
		field.Bool("reversible").
			Default(true).
			Comment("Whether this event can be rolled back"),

		// Timestamp (immutable, part of ULID)
		field.Time("created_at").
			Default(time.Now).
			Immutable().
			Comment("Event timestamp"),
	}
}

// Edges of the ResourceEvent entity.
func (ResourceEvent) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("resource", Resource.Type).
			Ref("events").
			Unique().
			Field("resource_id").
			Required(),
	}
}

// Indexes of the ResourceEvent entity.
func (ResourceEvent) Indexes() []ent.Index {
	return []ent.Index{
		// Resource's events
		index.Fields("resource_id"),
		// Events by type
		index.Fields("event_type"),
		// Events by actor
		index.Fields("actor"),
		// Events by source
		index.Fields("source"),
		// Time range queries
		index.Fields("created_at"),
		// Resource + time for getting history
		index.Fields("resource_id", "created_at"),
	}
}
