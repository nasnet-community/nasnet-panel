package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
	"github.com/oklog/ulid/v2"
)

// RoutingChain represents a multi-hop routing chain that routes device traffic
// through multiple services sequentially (e.g., Device → VPN → Tor → Internet).
type RoutingChain struct {
	ent.Schema
}

// Fields of the RoutingChain.
func (RoutingChain) Fields() []ent.Field {
	return []ent.Field{
		field.String("id").
			DefaultFunc(func() string {
				return ulid.Make().String()
			}).
			Immutable().
			Unique().
			Comment("ULID primary key"),

		field.String("router_id").
			NotEmpty().
			Comment("Foreign key to Router"),

		field.String("device_id").
			NotEmpty().
			Comment("Target device identifier (e.g., device MAC or IP)"),

		field.String("device_mac").
			Optional().
			Comment("Device MAC address (when routing_mode=MAC)"),

		field.String("device_ip").
			Optional().
			Comment("Device IP address (when routing_mode=IP)"),

		field.String("device_name").
			Optional().
			Comment("Human-readable device name"),

		field.Enum("routing_mode").
			Values("MAC", "IP").
			Default("MAC").
			Comment("Whether to match traffic by MAC address or IP address"),

		field.Bool("active").
			Default(true).
			Comment("Whether this chain is currently active"),

		field.Bool("kill_switch_enabled").
			Default(false).
			Comment("Whether kill switch is enabled for this chain"),

		field.Enum("kill_switch_mode").
			Values("BLOCK_ALL", "FALLBACK_SERVICE", "ALLOW_DIRECT").
			Default("BLOCK_ALL").
			Comment("Kill switch behavior when any hop fails"),

		field.Bool("kill_switch_active").
			Default(false).
			Comment("Whether kill switch is currently blocking traffic"),

		field.Time("kill_switch_activated_at").
			Optional().
			Nillable().
			Comment("Timestamp when kill switch was last activated"),

		field.Time("created_at").
			Default(time.Now).
			Immutable().
			Comment("Chain creation timestamp"),

		field.Time("updated_at").
			Default(time.Now).
			UpdateDefault(time.Now).
			Comment("Last update timestamp"),
	}
}

// Edges of the RoutingChain.
func (RoutingChain) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("router", Router.Type).
			Ref("routing_chains").
			Field("router_id").
			Required().
			Unique(),

		edge.To("hops", ChainHop.Type).
			Comment("Ordered list of service hops in this chain"),
	}
}

// Indexes of the RoutingChain.
func (RoutingChain) Indexes() []ent.Index {
	return []ent.Index{
		// Unique constraint: one chain per device per router
		index.Fields("router_id", "device_id").
			Unique(),

		// Query optimization: find chains by router
		index.Fields("router_id"),

		// Query optimization: find active chains
		index.Fields("active"),
	}
}
