// Package schema contains ent schema definitions for NasNetConnect.
// DeviceRouting represents a Policy-Based Routing (PBR) assignment that routes
// a specific client device's traffic through a designated service instance.
package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
	"github.com/oklog/ulid/v2"
)

// DeviceRouting holds the schema definition for the DeviceRouting entity.
// It tracks MAC-based routing rules that direct specific client devices
// to service instances via MikroTik mangle rules.
type DeviceRouting struct {
	ent.Schema
}

// Fields of the DeviceRouting entity.
func (DeviceRouting) Fields() []ent.Field {
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

		// Router association
		field.String("router_id").
			MaxLen(26).
			NotEmpty().
			Comment("Router ID this routing rule belongs to"),

		// Device identification (business key)
		field.String("device_id").
			MaxLen(100).
			NotEmpty().
			Comment("Device identifier (typically generated from MAC address)"),

		// Device information (denormalized for display)
		field.String("mac_address").
			MaxLen(17).
			NotEmpty().
			Comment("Device MAC address (e.g., AA:BB:CC:DD:EE:FF)"),

		field.String("device_ip").
			MaxLen(45). // IPv6 max length
			Optional().
			Comment("Device IP address (optional, may change)"),

		field.String("device_name").
			MaxLen(255).
			Optional().
			Comment("Device hostname from DHCP (optional)"),

		// Service instance association
		field.String("instance_id").
			MaxLen(26).
			NotEmpty().
			Comment("Service instance ID (foreign key)"),

		// Virtual interface association (with CASCADE delete)
		field.String("interface_id").
			MaxLen(26).
			NotEmpty().
			Comment("Virtual interface ID (foreign key with CASCADE)"),

		// Routing configuration
		field.String("routing_mark").
			MaxLen(255).
			NotEmpty().
			Comment("Routing mark from virtual interface (denormalized for performance)"),

		field.Enum("routing_mode").
			Values("mac", "ip").
			Default("mac").
			Comment("Routing mode: 'mac' for MAC-based rules, 'ip' for IP-based rules"),

		// MikroTik mangle rule tracking
		field.String("mangle_rule_id").
			MaxLen(100).
			NotEmpty().
			Comment("RouterOS .id of the mangle rule for O(1) removal"),

		// Status tracking
		field.Bool("active").
			Default(true).
			Comment("Whether this routing assignment is active"),

		// Kill Switch Configuration (Story 8.13)
		field.Bool("kill_switch_enabled").
			Default(false).
			Comment("Whether kill switch is enabled for this device routing"),

		field.Enum("kill_switch_mode").
			Values("block_all", "fallback_service", "allow_direct").
			Optional().
			Comment("Kill switch behavior mode: block_all (drop all traffic), fallback_service (route to fallback), allow_direct (allow direct internet)"),

		field.String("kill_switch_rule_id").
			MaxLen(100).
			Optional().
			Comment("RouterOS .id of the firewall filter rule for O(1) enable/disable"),

		field.Bool("kill_switch_active").
			Default(false).
			Comment("Current activation state of the kill switch"),

		field.Time("kill_switch_activated_at").
			Optional().
			Nillable().
			Comment("When the kill switch was last activated"),

		field.String("kill_switch_fallback_interface_id").
			MaxLen(26).
			Optional().
			Comment("Fallback virtual interface ID for fallback_service mode"),

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

// Edges of the DeviceRouting entity.
func (DeviceRouting) Edges() []ent.Edge {
	return []ent.Edge{
		// Belongs to Router (many-to-one relationship)
		edge.From("router", Router.Type).
			Ref("device_routings").
			Field("router_id").
			Unique().
			Required().
			Comment("The router this routing rule belongs to"),

		// Belongs to ServiceInstance (many-to-one relationship)
		edge.From("instance", ServiceInstance.Type).
			Ref("device_routings").
			Field("instance_id").
			Unique().
			Required().
			Comment("The service instance this device routes through"),

		// Belongs to VirtualInterface (many-to-one relationship with CASCADE delete)
		edge.From("virtual_interface", VirtualInterface.Type).
			Ref("device_routings").
			Field("interface_id").
			Unique().
			Required().
			Comment("The virtual interface this device routes through (CASCADE on delete)"),

		// Has many RoutingSchedules (one-to-many relationship)
		edge.To("schedules", RoutingSchedule.Type).
			Comment("Time-based schedules for this device routing"),
	}
}

// Indexes of the DeviceRouting entity.
func (DeviceRouting) Indexes() []ent.Index {
	return []ent.Index{
		// Index for looking up routings by router
		index.Fields("router_id"),

		// Index for looking up routings by device
		index.Fields("device_id"),

		// Index for looking up routings by interface
		index.Fields("interface_id"),

		// Index for looking up routings by instance
		index.Fields("instance_id"),

		// Unique constraint: one device can only route to one service at a time
		index.Fields("device_id", "router_id").Unique(),

		// Index for filtering by active status
		index.Fields("active"),

		// Composite index for router + active queries
		index.Fields("router_id", "active"),
	}
}
