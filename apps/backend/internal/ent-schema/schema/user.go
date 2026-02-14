package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
)

// User holds the schema definition for the User entity.
// Users can log into NasNetConnect and manage routers.
// Password is stored as bcrypt hash (implementation in Story 2.5).
type User struct {
	ent.Schema
}

// Fields of the User entity.
func (User) Fields() []ent.Field {
	return []ent.Field{
		// ULID primary key
		field.String("id").
			MaxLen(26).
			NotEmpty().
			Unique().
			Immutable().
			Comment("ULID primary key"),

		// Username (unique identifier for login)
		field.String("username").
			NotEmpty().
			MaxLen(64).
			Unique().
			Comment("Unique username for login"),

		// Email (optional, for notifications)
		field.String("email").
			Optional().
			MaxLen(255).
			Comment("Email address for notifications"),

		// Display name
		field.String("display_name").
			Optional().
			MaxLen(100).
			Comment("Human-readable display name"),

		// Password hash (bcrypt)
		field.String("password_hash").
			Sensitive().
			MaxLen(255).
			Comment("Bcrypt password hash - never logged"),

		// Role for authorization
		field.Enum("role").
			Values("admin", "operator", "viewer").
			Default("viewer").
			Comment("User role for authorization"),

		// Account status
		field.Bool("active").
			Default(true).
			Comment("Whether the account is active"),

		// MFA settings
		field.Bool("mfa_enabled").
			Default(false).
			Comment("Whether MFA is enabled"),

		field.String("mfa_secret").
			Optional().
			Sensitive().
			MaxLen(64).
			Comment("TOTP secret for MFA - never logged"),

		// Last login tracking
		field.Time("last_login").
			Optional().
			Nillable().
			Comment("Last successful login timestamp"),

		// Password change tracking
		field.Time("password_changed_at").
			Default(time.Now).
			Comment("When password was last changed"),

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

// Edges of the User entity.
func (User) Edges() []ent.Edge {
	return []ent.Edge{
		edge.To("sessions", Session.Type).
			Comment("Active user sessions"),
		edge.To("api_keys", APIKey.Type).
			Comment("API keys created by this user"),
	}
}

// Indexes of the User entity.
func (User) Indexes() []ent.Index {
	return []ent.Index{
		// Username is unique (already enforced by field)
		index.Fields("username"),
		// Index for email lookups
		index.Fields("email"),
		// Index for active users by role
		index.Fields("active", "role"),
	}
}
