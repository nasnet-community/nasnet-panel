package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
	"github.com/oklog/ulid/v2"
)

// VirtualInterface represents a virtual network interface created for a service instance.
// It tracks VLAN interfaces, IP addresses, routing tables, and gateway processes.
type VirtualInterface struct {
	ent.Schema
}

// Fields of the VirtualInterface.
func (VirtualInterface) Fields() []ent.Field {
	return []ent.Field{
		field.String("id").
			MaxLen(26).
			NotEmpty().
			Unique().
			Immutable().
			DefaultFunc(func() string {
				return ulid.Make().String()
			}).
			Comment("ULID primary key"),

		field.String("instance_id").
			NotEmpty().
			Comment("Service instance ID (foreign key)"),

		field.String("interface_name").
			MaxLen(255).
			NotEmpty().
			Comment("Router VLAN interface name (e.g., nnc-tor-usa)"),

		field.Int("vlan_id").
			Positive().
			Range(1, 4094).
			Comment("VLAN ID (1-4094)"),

		field.String("ip_address").
			MaxLen(45).
			NotEmpty().
			Comment("IP address assigned to interface (e.g., 10.99.101.1/24)"),

		field.Enum("gateway_type").
			Values("none", "hev_socks5_tunnel").
			Default("none").
			Comment("Gateway type"),

		field.Enum("gateway_status").
			Values("stopped", "starting", "running", "failed").
			Default("stopped").
			Comment("Gateway process status"),

		field.String("tun_name").
			MaxLen(15). // Linux IFNAMSIZ limit
			Optional().
			Comment("TUN interface name (e.g., tun-tor-usa)"),

		field.String("routing_mark").
			MaxLen(255).
			NotEmpty().
			Comment("Routing mark for PBR (e.g., tor-usa)"),

		field.Enum("status").
			NamedValues(
				"Creating", "creating",
				"Active", "active",
				"Error", "error",
				"Removing", "removing",
			).
			Default("creating").
			Comment("Virtual interface lifecycle status"),

		field.Enum("routing_mode").
			Values("bridge", "advanced", "legacy").
			Default("legacy").
			Comment("Routing mode: bridge (DHCP), advanced (PBR mangle), legacy (single VLAN)"),

		field.Int("ingress_vlan_id").
			Optional().
			Positive().
			Comment("Ingress VLAN ID (100-149 range, for DHCP bridge mode)"),

		field.JSON("egress_vlan_ids", []int{}).
			Optional().
			Comment("Egress VLAN IDs for outbound traffic (150-199 range)"),

		field.String("container_ip").
			MaxLen(45).
			Optional().
			Comment("Container IP for DHCP bridge mode (e.g., 10.99.101.1)"),

		field.Time("created_at").
			Default(time.Now).
			Immutable().
			Comment("Timestamp when the virtual interface was created"),

		field.Time("updated_at").
			Default(time.Now).
			UpdateDefault(time.Now).
			Comment("Timestamp when the virtual interface was last updated"),
	}
}

// Edges of the VirtualInterface.
func (VirtualInterface) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("instance", ServiceInstance.Type).
			Ref("virtual_interface").
			Field("instance_id").
			Unique().
			Required().
			Comment("Service instance owning this virtual interface"),

		// Has many device routings (devices routed through this VIF)
		edge.To("device_routings", DeviceRouting.Type).
			Comment("Device routing assignments using this virtual interface"),
	}
}

// Indexes of the VirtualInterface.
func (VirtualInterface) Indexes() []ent.Index {
	return []ent.Index{
		index.Fields("instance_id").Unique(),
		index.Fields("vlan_id"),
		index.Fields("status"),
		index.Fields("routing_mode"),
	}
}
