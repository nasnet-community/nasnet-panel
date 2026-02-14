// Package schema contains ent schema definitions for NasNetConnect.
// ServiceTrafficHourly stores aggregated traffic statistics per hour for service instances.
package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
)

// ServiceTrafficHourly holds the schema definition for the ServiceTrafficHourly entity.
// ServiceTrafficHourly aggregates traffic statistics per hour for service instances,
// enabling historical traffic analysis and charting (NAS-8.8: Traffic Statistics).
type ServiceTrafficHourly struct {
	ent.Schema
}

// Fields of the ServiceTrafficHourly entity.
func (ServiceTrafficHourly) Fields() []ent.Field {
	return []ent.Field{
		// ULID primary key (26 characters, base32 encoded)
		field.String("id").
			MaxLen(26).
			NotEmpty().
			Unique().
			Immutable().
			Comment("ULID primary key"),

		// Service instance reference
		field.String("instance_id").
			MaxLen(26).
			NotEmpty().
			Comment("Service instance ID this traffic record belongs to"),

		// Time boundary for this hour
		field.Time("hour_start").
			Immutable().
			Comment("Start of the hour bucket (truncated to hour boundary)"),

		// Traffic counters (bytes)
		field.Int64("tx_bytes").
			Default(0).
			Min(0).
			Comment("Total bytes transmitted (uploaded) during this hour"),

		field.Int64("rx_bytes").
			Default(0).
			Min(0).
			Comment("Total bytes received (downloaded) during this hour"),

		// Traffic counters (packets) - useful for packet/byte ratio analysis
		field.Int64("tx_packets").
			Default(0).
			Min(0).
			Comment("Total packets transmitted during this hour"),

		field.Int64("rx_packets").
			Default(0).
			Min(0).
			Comment("Total packets received during this hour"),

		// Timestamp
		field.Time("created_at").
			Default(time.Now).
			Immutable().
			Comment("Record creation timestamp"),
	}
}

// Edges of the ServiceTrafficHourly entity.
func (ServiceTrafficHourly) Edges() []ent.Edge {
	return []ent.Edge{
		// Belongs to ServiceInstance (many-to-one relationship)
		edge.From("service_instance", ServiceInstance.Type).
			Ref("traffic_hourly").
			Field("instance_id").
			Unique().
			Required().
			Comment("The service instance this traffic record belongs to"),
	}
}

// Indexes of the ServiceTrafficHourly entity.
func (ServiceTrafficHourly) Indexes() []ent.Index {
	return []ent.Index{
		// Primary query pattern: Get hourly traffic for a specific instance
		index.Fields("instance_id", "hour_start").
			Unique(),

		// Retention cleanup: DELETE WHERE hour_start < cutoff
		index.Fields("hour_start"),
	}
}
