// Package schema contains ent schema definitions for NasNetConnect.
// ServiceInstance represents a running instance of a downloadable network service (Feature Marketplace).
package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
)

// ServiceInstance holds the schema definition for the ServiceInstance entity.
// ServiceInstances represent running instances of downloadable network services
// (Tor, sing-box, Xray-core, MTProxy, Psiphon, AdGuard Home, etc.) managed by NasNetConnect.
type ServiceInstance struct {
	ent.Schema
}

// Fields of the ServiceInstance entity.
func (ServiceInstance) Fields() []ent.Field {
	return []ent.Field{
		// ULID primary key (26 characters, base32 encoded)
		field.String("id").
			MaxLen(26).
			NotEmpty().
			Unique().
			Immutable().
			Comment("ULID primary key"),

		// Feature identification
		field.String("feature_id").
			NotEmpty().
			MaxLen(100).
			Comment("Feature identifier (e.g., 'tor', 'sing-box', 'xray-core')"),

		field.String("instance_name").
			NotEmpty().
			MaxLen(255).
			Comment("Human-readable instance name"),

		// Router association
		field.String("router_id").
			MaxLen(26).
			NotEmpty().
			Comment("Router ID this instance belongs to"),

		// Status tracking
		field.Enum("status").
			Values(
				"installing",
				"installed",
				"starting",
				"running",
				"stopping",
				"stopped",
				"failed",
				"deleting",
			).
			Default("installing").
			Comment("Current instance lifecycle status"),

		// Network configuration
		field.Int("vlan_id").
			Optional().
			Nillable().
			Min(1).
			Max(4094).
			Comment("VLAN ID for network isolation (optional)"),

		field.String("bind_ip").
			Optional().
			MaxLen(45). // IPv6 max length
			Comment("IP address to bind the service to (optional)"),

		field.JSON("ports", []int{}).
			Optional().
			Comment("List of ports used by this service instance"),

		// Service configuration and binary info
		field.JSON("config", map[string]interface{}{}).
			Optional().
			Comment("Service-specific configuration (JSON)"),

		field.String("binary_path").
			Optional().
			MaxLen(512).
			Comment("Path to the service binary on the router filesystem"),

		field.String("binary_version").
			Optional().
			MaxLen(50).
			Comment("Version of the service binary"),

		field.String("binary_checksum").
			Optional().
			MaxLen(128).
			Comment("SHA256 checksum of the service binary for integrity verification"),

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

// Edges of the ServiceInstance entity.
func (ServiceInstance) Edges() []ent.Edge {
	return []ent.Edge{
		// Belongs to Router (many-to-one relationship)
		edge.From("router", Router.Type).
			Ref("service_instances").
			Field("router_id").
			Unique().
			Required().
			Comment("The router this service instance belongs to"),
	}
}

// Indexes of the ServiceInstance entity.
func (ServiceInstance) Indexes() []ent.Index {
	return []ent.Index{
		// Index for looking up instances by router
		index.Fields("router_id"),
		// Index for filtering by status
		index.Fields("status"),
		// Index for filtering by feature type
		index.Fields("feature_id"),
		// Composite index for router + feature queries
		index.Fields("router_id", "feature_id"),
		// Composite index for router + status queries
		index.Fields("router_id", "status"),
	}
}
