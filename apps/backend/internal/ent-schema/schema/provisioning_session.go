package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
)

// ProvisioningSession holds the schema definition for the ProvisioningSession entity.
// A provisioning session aggregates multiple Resource IDs being created together
// during a wizard flow, enabling atomic preview/validate/apply and rollback.
//
// Stored in system.db as sessions span the provisioning lifecycle.
type ProvisioningSession struct {
	ent.Schema
}

func (ProvisioningSession) Fields() []ent.Field {
	return []ent.Field{
		field.String("id").
			MaxLen(26).NotEmpty().Unique().Immutable().
			Comment("ULID primary key"),

		field.String("router_id").
			MaxLen(26).NotEmpty().
			Comment("Router ID this session provisions"),

		field.Enum("mode").
			Values("easy", "advance").
			Default("easy").
			Comment("Wizard complexity mode"),

		field.Enum("firmware").
			Values("mikrotik", "openwrt").
			Default("mikrotik").
			Comment("Target firmware platform"),

		field.Enum("router_mode").
			Values("ap-mode", "trunk-mode").
			Default("ap-mode").
			Comment("Router operating mode"),

		field.Enum("wan_link_type").
			Values("domestic", "foreign", "both").
			Default("both").
			Comment("WAN link classification"),

		field.JSON("resource_ids", []string{}).
			Optional().
			Comment("Resource IDs aggregated in this session"),

		field.JSON("networks_config", map[string]interface{}{}).
			Optional().
			Comment("Four-network architecture configuration"),

		field.String("current_step").
			Optional().MaxLen(64).
			Comment("Current wizard step identifier"),

		field.Enum("apply_status").
			Values("pending", "validating", "applying", "applied", "failed", "rolled-back").
			Default("pending").
			Comment("Session apply lifecycle status"),

		field.String("changeset_id").
			Optional().MaxLen(26).
			Comment("Associated changeset ID if using changeset flow"),

		field.String("error_message").
			Optional().MaxLen(2048).
			Comment("Error message if apply failed"),

		field.String("created_by").
			Optional().MaxLen(128).
			Comment("User or system that created this session"),

		field.Time("created_at").
			Default(time.Now).Immutable().
			Comment("Session creation timestamp"),

		field.Time("updated_at").
			Default(time.Now).UpdateDefault(time.Now).
			Comment("Last update timestamp"),

		field.Time("expires_at").
			Optional().Nillable().
			Comment("Session expiration time (auto-cleanup)"),
	}
}

func (ProvisioningSession) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("router", Router.Type).
			Ref("provisioning_sessions").
			Field("router_id").
			Unique().Required().
			Comment("Router this session provisions"),
	}
}

func (ProvisioningSession) Indexes() []ent.Index {
	return []ent.Index{
		index.Fields("router_id"),
		index.Fields("apply_status"),
		index.Fields("created_by"),
		index.Fields("router_id", "apply_status"),
		index.Fields("expires_at"),
	}
}
