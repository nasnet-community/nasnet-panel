package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
)

// RouterSecret holds encrypted credentials for router authentication.
// Credentials are stored separately from Router for security isolation.
// Encryption uses AES-256-GCM (implementation in Story 2.5).
type RouterSecret struct {
	ent.Schema
}

// Fields of the RouterSecret entity.
func (RouterSecret) Fields() []ent.Field {
	return []ent.Field{
		// ULID primary key
		field.String("id").
			MaxLen(26).
			NotEmpty().
			Unique().
			Immutable().
			Comment("ULID primary key"),

		// Router ID (foreign key)
		field.String("router_id").
			MaxLen(26).
			NotEmpty().
			Comment("Associated router ULID"),

		// Encrypted username (AES-256-GCM encrypted)
		field.Bytes("encrypted_username").
			Comment("AES-256-GCM encrypted username"),

		// Encrypted password (AES-256-GCM encrypted)
		field.Bytes("encrypted_password").
			Sensitive().
			Comment("AES-256-GCM encrypted password - never logged"),

		// Encryption nonce (required for AES-GCM)
		field.Bytes("encryption_nonce").
			MaxLen(24).
			Comment("GCM nonce for encryption"),

		// Key version for key rotation support
		field.Int("key_version").
			Default(1).
			Comment("Encryption key version for rotation"),

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

// Edges of the RouterSecret entity.
func (RouterSecret) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("router", Router.Type).
			Ref("secrets").
			Unique().
			Field("router_id").
			Required(),
	}
}

// Indexes of the RouterSecret entity.
func (RouterSecret) Indexes() []ent.Index {
	return []ent.Index{
		// Each router has exactly one secret entry
		index.Fields("router_id").Unique(),
	}
}
