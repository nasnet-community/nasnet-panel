// Package schema contains ent schema definitions for NasNetConnect.
// These schemas define the database entities for the hybrid database architecture:
// - System database (system.db): Router, RouterSecret, User, Session, APIKey, GlobalSettings
// - Router database (router-{id}.db): Resource, ResourceEvent, ConfigSnapshot
package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
)

// Router holds the schema definition for the Router entity.
// Routers are stored in the system.db and represent managed MikroTik/OpenWrt/VyOS devices.
type Router struct {
	ent.Schema
}

// Fields of the Router entity.
func (Router) Fields() []ent.Field {
	return []ent.Field{
		// ULID primary key (26 characters, base32 encoded)
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
			Comment("Human-readable router name"),

		field.String("host").
			NotEmpty().
			MaxLen(255).
			Comment("Router hostname or IP address"),

		field.Int("port").
			Default(8728).
			Min(1).
			Max(65535).
			Comment("RouterOS API port"),

		// Platform and version info
		field.Enum("platform").
			Values("mikrotik", "openwrt", "vyos").
			Default("mikrotik").
			Comment("Router platform type"),

		field.String("model").
			Optional().
			MaxLen(100).
			Comment("Router hardware model"),

		field.String("version").
			Optional().
			MaxLen(50).
			Comment("RouterOS/firmware version"),

		// Status tracking
		field.Enum("status").
			Values("online", "offline", "degraded", "unknown").
			Default("unknown").
			Comment("Current connection status"),

		field.Time("last_seen").
			Optional().
			Nillable().
			Comment("Last successful communication timestamp"),

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

// Edges of the Router entity.
func (Router) Edges() []ent.Edge {
	return []ent.Edge{
		edge.To("secrets", RouterSecret.Type).
			Unique().
			Comment("Router credentials (encrypted)"),
		edge.To("port_knock_sequences", PortKnockSequence.Type).
			Comment("Port knock sequences configured for this router"),
		edge.To("service_instances", ServiceInstance.Type).
			Comment("Service instances running on this router"),
		edge.To("port_allocations", PortAllocation.Type).
			Comment("Port allocations for service instances on this router"),
		edge.To("vlan_allocations", VLANAllocation.Type).
			Comment("VLAN allocations managed on this router"),
		edge.To("device_routings", DeviceRouting.Type).
			Comment("Device routing assignments on this router"),
		edge.To("routing_chains", RoutingChain.Type).
			Comment("Multi-hop routing chains configured on this router"),
		edge.To("service_templates", ServiceTemplate.Type).
			Comment("User-created service templates on this router"),
		edge.To("provisioning_sessions", ProvisioningSession.Type).
			Comment("Provisioning sessions for this router"),
		edge.To("subnet_allocations", SubnetAllocation.Type).
			Comment("Subnet allocations managed on this router"),
	}
}

// Indexes of the Router entity.
func (Router) Indexes() []ent.Index {
	return []ent.Index{
		// Index for looking up routers by status
		index.Fields("status"),
		// Index for looking up routers by platform
		index.Fields("platform"),
		// Index for sorting by last_seen
		index.Fields("last_seen"),
		// Composite index for host:port uniqueness
		index.Fields("host", "port").Unique(),
	}
}
