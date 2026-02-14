// Package schema contains ent schema definitions for NasNetConnect.
// RoutingSchedule represents a time-based schedule for activating/deactivating
// device routing assignments (Policy-Based Routing via VIF services).
package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
	"github.com/oklog/ulid/v2"
)

// RoutingSchedule holds the schema definition for the RoutingSchedule entity.
// Schedules define time windows when device routing rules should be active,
// enabling features like parental controls, time-based VPN routing, etc.
type RoutingSchedule struct {
	ent.Schema
}

// Fields of the RoutingSchedule entity.
func (RoutingSchedule) Fields() []ent.Field {
	return []ent.Field{
		// ULID primary key (26 characters, base32 encoded)
		field.String("id").
			MaxLen(26).
			NotEmpty().
			Unique().
			Immutable().
			DefaultFunc(func() string {
				return ulid.Make().String()
			}).
			Comment("ULID primary key"),

		// DeviceRouting association (foreign key)
		field.String("routing_id").
			MaxLen(26).
			NotEmpty().
			Comment("DeviceRouting ID this schedule applies to"),

		// Schedule configuration
		field.JSON("days", []int{}).
			Comment("Array of day numbers (0=Sunday, 6=Saturday) when schedule is active"),

		field.String("start_time").
			NotEmpty().
			MaxLen(5).
			Comment("Start time in HH:MM format (24-hour, validated at service layer)"),

		field.String("end_time").
			NotEmpty().
			MaxLen(5).
			Comment("End time in HH:MM format (24-hour, validated at service layer)"),

		field.String("timezone").
			NotEmpty().
			MaxLen(64).
			Default("UTC").
			Comment("IANA timezone identifier (e.g., 'America/New_York', 'Europe/London')"),

		// Enable/disable toggle
		field.Bool("enabled").
			Default(true).
			Comment("Whether this schedule is enabled"),

		// State tracking
		field.Time("last_activated").
			Optional().
			Nillable().
			Comment("Timestamp when routing was last activated by this schedule"),

		field.Time("last_deactivated").
			Optional().
			Nillable().
			Comment("Timestamp when routing was last deactivated by this schedule"),

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

// Edges of the RoutingSchedule entity.
func (RoutingSchedule) Edges() []ent.Edge {
	return []ent.Edge{
		// Belongs to DeviceRouting (many-to-one relationship)
		edge.From("device_routing", DeviceRouting.Type).
			Ref("schedules").
			Field("routing_id").
			Unique().
			Required().
			Comment("The device routing rule this schedule controls"),
	}
}

// Indexes of the RoutingSchedule entity.
func (RoutingSchedule) Indexes() []ent.Index {
	return []ent.Index{
		// Index for looking up schedules by routing ID
		index.Fields("routing_id"),

		// Index for filtering by enabled status
		index.Fields("enabled"),

		// Composite index for enabled schedule queries
		index.Fields("enabled", "routing_id"),

		// Index for time-based queries
		index.Fields("start_time"),
		index.Fields("end_time"),
	}
}
