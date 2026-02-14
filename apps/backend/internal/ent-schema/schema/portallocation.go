// Package schema contains ent schema definitions for NasNetConnect.
// PortAllocation represents a port allocation for service instances running on routers.
package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
)

// PortAllocation holds the schema definition for the PortAllocation entity.
// PortAllocations track which ports are in use by which service instances on each router,
// enabling conflict detection and centralized port management across the Feature Marketplace.
type PortAllocation struct {
	ent.Schema
}

// Fields of the PortAllocation entity.
func (PortAllocation) Fields() []ent.Field {
	return []ent.Field{
		// ULID primary key (26 characters, base32 encoded)
		field.String("id").
			MaxLen(26).
			NotEmpty().
			Unique().
			Immutable().
			Comment("ULID primary key"),

		// Router association
		field.String("router_id").
			MaxLen(26).
			NotEmpty().
			Comment("Router ID where this port is allocated"),

		// Port details
		field.Int("port").
			Min(1).
			Max(65535).
			Comment("Port number (1-65535)"),

		field.Enum("protocol").
			Values("TCP", "UDP").
			Comment("Transport protocol (TCP or UDP)"),

		// Service instance association
		field.String("instance_id").
			MaxLen(26).
			NotEmpty().
			Comment("Service instance ID that owns this allocation"),

		field.String("service_type").
			NotEmpty().
			MaxLen(100).
			Comment("Service type (e.g., 'tor', 'xray-core', 'adguard-home')"),

		// Metadata
		field.String("notes").
			Optional().
			MaxLen(500).
			Comment("Optional notes about this port allocation"),

		// Timestamps
		field.Time("allocated_at").
			Default(time.Now).
			Immutable().
			Comment("Allocation timestamp"),
	}
}

// Edges of the PortAllocation entity.
func (PortAllocation) Edges() []ent.Edge {
	return []ent.Edge{
		// Belongs to Router (many-to-one relationship)
		edge.From("router", Router.Type).
			Ref("port_allocations").
			Field("router_id").
			Unique().
			Required().
			Comment("The router where this port is allocated"),

		// Belongs to ServiceInstance (many-to-one relationship)
		edge.From("service_instance", ServiceInstance.Type).
			Ref("port_allocations").
			Field("instance_id").
			Unique().
			Required().
			Comment("The service instance that owns this port allocation"),
	}
}

// Indexes of the PortAllocation entity.
func (PortAllocation) Indexes() []ent.Index {
	return []ent.Index{
		// CRITICAL: Unique constraint on (router_id, port, protocol)
		// This enforces conflict prevention at the database level
		index.Fields("router_id", "port", "protocol").Unique(),

		// Index for looking up allocations by router
		index.Fields("router_id"),

		// Index for looking up allocations by instance
		index.Fields("instance_id"),

		// Composite index for router + protocol queries
		index.Fields("router_id", "protocol"),

		// Index for filtering by service type
		index.Fields("service_type"),
	}
}
