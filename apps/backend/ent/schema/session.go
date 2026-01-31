package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
)

// Session holds the schema definition for user sessions.
// Sessions track JWT tokens and allow for token revocation.
type Session struct {
	ent.Schema
}

// Fields of the Session entity.
func (Session) Fields() []ent.Field {
	return []ent.Field{
		// ULID primary key
		field.String("id").
			MaxLen(26).
			NotEmpty().
			Unique().
			Immutable().
			Comment("ULID primary key"),

		// User ID (foreign key)
		field.String("user_id").
			MaxLen(26).
			NotEmpty().
			Comment("Associated user ULID"),

		// Token identifier (JTI claim in JWT)
		field.String("token_id").
			NotEmpty().
			MaxLen(64).
			Unique().
			Comment("JWT token identifier (jti claim)"),

		// Token family for refresh token rotation
		field.String("token_family").
			Optional().
			MaxLen(64).
			Comment("Token family ID for refresh token rotation"),

		// Client information
		field.String("user_agent").
			Optional().
			MaxLen(512).
			Comment("User agent string from request"),

		field.String("ip_address").
			Optional().
			MaxLen(45).
			Comment("Client IP address (supports IPv6)"),

		// Session lifecycle
		field.Time("expires_at").
			Comment("When the session expires"),

		field.Time("last_activity").
			Default(time.Now).
			Comment("Last activity timestamp"),

		// Revocation
		field.Bool("revoked").
			Default(false).
			Comment("Whether session has been revoked"),

		field.Time("revoked_at").
			Optional().
			Nillable().
			Comment("When the session was revoked"),

		field.String("revoked_reason").
			Optional().
			MaxLen(255).
			Comment("Reason for revocation"),

		// Timestamps
		field.Time("created_at").
			Default(time.Now).
			Immutable().
			Comment("Session creation timestamp"),
	}
}

// Edges of the Session entity.
func (Session) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("user", User.Type).
			Ref("sessions").
			Unique().
			Field("user_id").
			Required(),
	}
}

// Indexes of the Session entity.
func (Session) Indexes() []ent.Index {
	return []ent.Index{
		// Token ID is unique (already enforced by field)
		index.Fields("token_id"),
		// User's sessions
		index.Fields("user_id"),
		// Token family for refresh rotation
		index.Fields("token_family"),
		// Active sessions (not revoked, not expired)
		index.Fields("revoked", "expires_at"),
	}
}
