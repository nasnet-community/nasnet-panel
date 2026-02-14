package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
)

// APIKey holds the schema definition for API keys.
// API keys allow programmatic access with scoped permissions.
type APIKey struct {
	ent.Schema
}

// Fields of the APIKey entity.
func (APIKey) Fields() []ent.Field {
	return []ent.Field{
		// ULID primary key
		field.String("id").
			MaxLen(26).
			NotEmpty().
			Unique().
			Immutable().
			Comment("ULID primary key"),

		// User ID (foreign key) - who created this key
		field.String("user_id").
			MaxLen(26).
			NotEmpty().
			Comment("User who created this API key"),

		// Key name/description
		field.String("name").
			NotEmpty().
			MaxLen(100).
			Comment("Human-readable name for the API key"),

		// Key prefix (shown to user, not secret)
		field.String("prefix").
			NotEmpty().
			MaxLen(8).
			Comment("Key prefix for identification (not secret)"),

		// Key hash (SHA-256 of the full key)
		field.String("key_hash").
			NotEmpty().
			Sensitive().
			MaxLen(64).
			Comment("SHA-256 hash of the API key - never logged"),

		// Scoped permissions (JSON array of allowed operations)
		field.JSON("scopes", []string{}).
			Comment("Allowed permission scopes (e.g., ['routers:read', 'config:write'])"),

		// Router restrictions (optional - limit to specific routers)
		field.JSON("allowed_routers", []string{}).
			Optional().
			Comment("List of router IDs this key can access (empty = all)"),

		// Expiration
		field.Time("expires_at").
			Optional().
			Nillable().
			Comment("When the API key expires (null = never)"),

		// Usage tracking
		field.Time("last_used_at").
			Optional().
			Nillable().
			Comment("Last time this key was used"),

		field.Int("usage_count").
			Default(0).
			Comment("Number of times this key has been used"),

		// Status
		field.Bool("active").
			Default(true).
			Comment("Whether the API key is active"),

		field.Time("revoked_at").
			Optional().
			Nillable().
			Comment("When the key was revoked"),

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

// Edges of the APIKey entity.
func (APIKey) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("user", User.Type).
			Ref("api_keys").
			Unique().
			Field("user_id").
			Required(),
	}
}

// Indexes of the APIKey entity.
func (APIKey) Indexes() []ent.Index {
	return []ent.Index{
		// User's API keys
		index.Fields("user_id"),
		// Prefix for key lookup
		index.Fields("prefix"),
		// Key hash for authentication
		index.Fields("key_hash"),
		// Active keys
		index.Fields("active"),
	}
}
