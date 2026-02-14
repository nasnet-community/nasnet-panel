package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
)

// VLANAllocation holds the schema definition for the VLANAllocation entity.
// VLAN allocations track automatic VLAN assignment for service instances in the
// Virtual Interface Factory (VIF) architecture. Each allocation represents a VLAN
// reserved for a specific service instance on a router.
//
// The system auto-allocates VLANs from a configurable pool (default 100-199) and
// generates corresponding subnets (e.g., 10.8.100.0/24). This provides Layer 1
// IP binding isolation for services like Tor, Xray-core, etc.
//
// Key features:
// - Automatic conflict detection with existing router VLANs
// - Unique constraint on (router_id, vlan_id) prevents double allocation
// - Orphan cleanup reconciliation on system startup
// - Thread-safe allocation via VLANAllocator service
//
// Stored in system.db as allocations span multiple routers.
type VLANAllocation struct {
	ent.Schema
}

// Fields of the VLANAllocation entity.
func (VLANAllocation) Fields() []ent.Field {
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
			Comment("Router ID this VLAN allocation belongs to"),

		// VLAN configuration
		field.Int("vlan_id").
			Min(1).
			Max(4094).
			Comment("VLAN ID (IEEE 802.1Q range: 1-4094)"),

		// Service instance association
		field.String("instance_id").
			MaxLen(26).
			NotEmpty().
			Comment("Service instance ID that owns this VLAN"),

		field.String("service_type").
			MaxLen(100).
			NotEmpty().
			Comment("Service type (e.g., 'tor', 'xray', 'singbox')"),

		// Generated subnet for this VLAN
		field.String("subnet").
			Optional().
			MaxLen(18). // Max length for CIDR notation (e.g., "255.255.255.255/32")
			Comment("Auto-generated subnet for this VLAN (e.g., '10.8.100.0/24')"),

		// Lifecycle status tracking
		field.Enum("status").
			Values("allocated", "releasing", "released").
			Default("allocated").
			Comment("Allocation lifecycle status"),

		// Timestamps
		field.Time("allocated_at").
			Default(time.Now).
			Immutable().
			Comment("Timestamp when VLAN was allocated"),

		field.Time("released_at").
			Optional().
			Nillable().
			Comment("Timestamp when VLAN was released (nil if still allocated)"),
	}
}

// Edges of the VLANAllocation entity.
func (VLANAllocation) Edges() []ent.Edge {
	return []ent.Edge{
		// Belongs to a Router
		edge.From("router", Router.Type).
			Ref("vlan_allocations").
			Field("router_id").
			Unique().
			Required().
			Comment("Router this VLAN allocation belongs to"),

		// Belongs to a ServiceInstance
		edge.From("service_instance", ServiceInstance.Type).
			Ref("vlan_allocations").
			Field("instance_id").
			Unique().
			Required().
			Comment("Service instance that owns this VLAN allocation"),
	}
}

// Indexes of the VLANAllocation entity.
func (VLANAllocation) Indexes() []ent.Index {
	return []ent.Index{
		// CRITICAL: Unique constraint on (router_id, vlan_id) prevents conflicts at DB level
		// This ensures no two allocations can have the same VLAN ID on the same router,
		// even under high concurrency. Database enforces atomicity.
		index.Fields("router_id", "vlan_id").Unique(),

		// Query allocations by router (for pool status, orphan detection)
		index.Fields("router_id"),

		// Query allocations by instance (for release on instance deletion)
		index.Fields("instance_id"),

		// Filter by status for active allocation queries
		index.Fields("status"),

		// Composite index for active allocations by router
		index.Fields("router_id", "status"),

		// Sort by allocation time for analytics
		index.Fields("allocated_at"),
	}
}
