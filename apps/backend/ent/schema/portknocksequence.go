package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
)

// PortKnockSequence holds the schema definition for the PortKnockSequence entity.
// Port knock sequences define ordered port knock patterns that protect access to specific services.
// Stored in router-{id}.db as they are router-specific configurations.
type PortKnockSequence struct {
	ent.Schema
}

// Fields of the PortKnockSequence entity.
func (PortKnockSequence) Fields() []ent.Field {
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
			MaxLen(32).
			Comment("Sequence name (alphanumeric, underscores, hyphens only)"),

		// Knock ports configuration (JSON array of objects)
		// Each object: {port: int, protocol: string, order: int}
		// Example: [{"port": 1234, "protocol": "tcp", "order": 1}, {"port": 5678, "protocol": "udp", "order": 2}]
		field.JSON("knock_ports", []map[string]interface{}{}).
			Comment("Array of knock port objects with port, protocol, and order"),

		// Protected service configuration
		field.Int("protected_port").
			Min(1).
			Max(65535).
			Comment("Port number of the protected service"),

		field.Enum("protected_protocol").
			Values("tcp", "udp").
			Default("tcp").
			Comment("Protocol of the protected service"),

		// Timeout configuration
		field.String("access_timeout").
			NotEmpty().
			MaxLen(10).
			Comment("Duration allowed access after successful knock (e.g., '5m', '1h')"),

		field.String("knock_timeout").
			NotEmpty().
			MaxLen(10).
			Comment("Maximum time between knock stages (e.g., '15s', '30s')"),

		// Enable/disable toggle
		field.Bool("enabled").
			Default(true).
			Comment("Whether this knock sequence is active"),

		// Router association
		field.String("router_id").
			MaxLen(26).
			NotEmpty().
			Comment("Router ID this sequence belongs to"),

		// Optional: Generated rule IDs for tracking (JSON array)
		field.JSON("generated_rule_ids", []string{}).
			Optional().
			Comment("MikroTik firewall rule IDs generated for this sequence"),

		// Optional: Recent access statistics
		field.Int("recent_access_count").
			Default(0).
			Optional().
			Comment("Count of successful knocks in last 24 hours"),

		field.Time("last_accessed_at").
			Optional().
			Nillable().
			Comment("Last successful knock timestamp"),

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

// Edges of the PortKnockSequence entity.
func (PortKnockSequence) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("router", Router.Type).
			Ref("port_knock_sequences").
			Field("router_id").
			Unique().
			Required().
			Comment("Router this sequence belongs to"),
	}
}

// Indexes of the PortKnockSequence entity.
func (PortKnockSequence) Indexes() []ent.Index {
	return []ent.Index{
		// Lookup sequences by router
		index.Fields("router_id"),
		// Enabled sequences for active rule queries
		index.Fields("enabled"),
		// Unique constraint on (router_id, name)
		index.Fields("router_id", "name").Unique(),
		// Sort by last accessed
		index.Fields("last_accessed_at"),
		// Combined index for active sequence queries
		index.Fields("router_id", "enabled"),
	}
}
