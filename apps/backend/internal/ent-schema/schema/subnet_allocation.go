package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
)

// SubnetAllocation tracks subnet assignments to prevent conflicts across
// routers and resources. Mirrors the VLANAllocation pattern.
//
// Stored in system.db as allocations span multiple routers.
type SubnetAllocation struct {
	ent.Schema
}

func (SubnetAllocation) Fields() []ent.Field {
	return []ent.Field{
		field.String("id").
			MaxLen(26).NotEmpty().Unique().Immutable().
			Comment("ULID primary key"),

		field.String("router_id").
			MaxLen(26).NotEmpty().
			Comment("Router ID this subnet allocation belongs to"),

		field.String("resource_id").
			MaxLen(26).NotEmpty().
			Comment("Resource ID that owns this subnet"),

		field.String("resource_type").
			MaxLen(128).NotEmpty().
			Comment("Resource type (e.g., 'vpn.wireguard.client', 'lan.network.base')"),

		field.String("network_name").
			MaxLen(128).NotEmpty().
			Comment("Network name for this allocation (e.g., 'Domestic', 'WG-USA')"),

		field.String("cidr").
			MaxLen(18).NotEmpty().
			Comment("CIDR notation subnet (e.g., '10.8.100.0/24')"),

		field.Enum("status").
			Values("reserved", "active", "released").
			Default("reserved").
			Comment("Allocation lifecycle status"),

		field.Time("created_at").
			Default(time.Now).Immutable().
			Comment("Allocation creation timestamp"),

		field.Time("updated_at").
			Default(time.Now).UpdateDefault(time.Now).
			Comment("Last update timestamp"),
	}
}

func (SubnetAllocation) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("router", Router.Type).
			Ref("subnet_allocations").
			Field("router_id").
			Unique().Required().
			Comment("Router this subnet allocation belongs to"),
	}
}

func (SubnetAllocation) Indexes() []ent.Index {
	return []ent.Index{
		index.Fields("router_id", "cidr").Unique(),
		index.Fields("router_id"),
		index.Fields("resource_id"),
		index.Fields("status"),
		index.Fields("router_id", "status"),
		index.Fields("resource_type"),
	}
}
