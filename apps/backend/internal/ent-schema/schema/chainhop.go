package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
	"github.com/oklog/ulid/v2"
)

// ChainHop represents a single hop in a multi-hop routing chain.
// Each hop references one VirtualInterface and contains router-specific IDs for cleanup.
type ChainHop struct {
	ent.Schema
}

// Fields of the ChainHop.
func (ChainHop) Fields() []ent.Field {
	return []ent.Field{
		field.String("id").
			DefaultFunc(func() string {
				return ulid.Make().String()
			}).
			Immutable().
			Unique().
			Comment("ULID primary key"),

		field.String("chain_id").
			NotEmpty().
			Comment("Foreign key to RoutingChain"),

		field.Int("hop_order").
			Positive().
			Comment("1-based position in the chain (1 = first hop, 2 = second, etc.)"),

		field.String("interface_id").
			NotEmpty().
			Comment("Foreign key to VirtualInterface for this hop"),

		field.String("routing_mark").
			NotEmpty().
			Comment("MikroTik routing mark (e.g., chain-abc123-hop1)"),

		field.String("mangle_rule_id").
			Optional().
			Comment("MikroTik .id of the mangle rule for Apply-Confirm-Merge"),

		field.String("route_table_name").
			NotEmpty().
			Comment("MikroTik routing table name (e.g., chain-abc123-hop1)"),

		field.String("route_id").
			Optional().
			Comment("MikroTik .id of the route for cleanup"),

		field.String("kill_switch_rule_id").
			Optional().
			Comment("MikroTik .id of the filter rule for kill switch"),

		field.Bool("kill_switch_active").
			Default(false).
			Comment("Whether kill switch is currently active for this hop"),

		field.Time("created_at").
			Default(time.Now).
			Immutable().
			Comment("Hop creation timestamp"),
	}
}

// Edges of the ChainHop.
func (ChainHop) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("chain", RoutingChain.Type).
			Ref("hops").
			Field("chain_id").
			Required().
			Unique(),

		edge.To("interface", VirtualInterface.Type).
			Field("interface_id").
			Required().
			Unique(),
	}
}

// Indexes of the ChainHop.
func (ChainHop) Indexes() []ent.Index {
	return []ent.Index{
		// Unique constraint: one hop order per chain
		index.Fields("chain_id", "hop_order").
			Unique(),

		// Query optimization: find hops by interface (for cascade cleanup)
		index.Fields("interface_id"),
	}
}
