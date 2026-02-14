package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
	"entgo.io/ent/schema/mixin"
	"github.com/google/uuid"
)

// NotificationChannelConfig holds configuration for a notification channel.
// Per NAS-18.X: Persistent storage for Pushover, Email, Slack, Webhook configs.
type NotificationChannelConfig struct {
	ent.Schema
}

// Mixin adds common timestamp fields (CreatedAt, UpdatedAt).
func (NotificationChannelConfig) Mixin() []ent.Mixin {
	return []ent.Mixin{
		mixin.Time{},
	}
}

// Fields defines the schema fields.
func (NotificationChannelConfig) Fields() []ent.Field {
	return []ent.Field{
		// Primary Key (UUID)
		field.String("id").
			Unique().
			Immutable().
			DefaultFunc(func() string { return uuid.New().String() }),

		// Channel Type (pushover, email, slack, webhook, telegram)
		field.Enum("channel_type").
			Values("pushover", "email", "slack", "webhook", "telegram").
			Immutable().
			Comment("Type of notification channel (cannot be changed after creation)"),

		// Human-readable name (unique per channel type)
		field.String("name").
			NotEmpty().
			MaxLen(100).
			Comment("Display name for this configuration (e.g., 'Team Pushover', 'Admin Email')"),

		// Description (optional)
		field.String("description").
			Optional().
			MaxLen(500).
			Comment("Optional description of this configuration's purpose"),

		// Enabled flag (soft disable without deleting)
		field.Bool("enabled").
			Default(true).
			Comment("Whether this configuration is active (soft disable toggle)"),

		// Is this the default config for this channel type?
		field.Bool("is_default").
			Default(false).
			Comment("Whether this is the default configuration for this channel type"),

		// Encrypted configuration (JSON blob)
		// Contains channel-specific fields:
		// - Pushover: {"userKey": "...", "apiToken": "...", "device": "...", "baseURL": "..."}
		// - Email: {"host": "...", "port": 587, "from": "...", "username": "...", "password": "...", "tlsMode": "..."}
		// - Slack: {"webhookURL": "...", "channel": "..."}
		field.Bytes("config_encrypted").
			Sensitive().
			Comment("AES-256-GCM encrypted JSON configuration (NEVER logged or exposed in plaintext)"),

		// Encryption metadata (for key rotation)
		field.String("encryption_key_id").
			Default("default").
			Comment("ID of encryption key used (enables zero-downtime key rotation)"),

		// Audit fields
		field.String("created_by").
			Optional().
			Comment("User ID who created this configuration"),

		field.String("updated_by").
			Optional().
			Comment("User ID who last updated this configuration"),

		// Soft delete timestamp
		field.Time("deleted_at").
			Optional().
			Nillable().
			Comment("Timestamp when configuration was deleted (NULL = active)"),
	}
}

// Indexes defines the schema indexes for efficient queries.
func (NotificationChannelConfig) Indexes() []ent.Index {
	return []ent.Index{
		// Find all configs for a specific channel type
		index.Fields("channel_type"),

		// Find default config for a channel type (single row expected)
		index.Fields("channel_type", "is_default"),

		// Efficiently filter out soft-deleted configs
		index.Fields("deleted_at"),

		// Ensure unique names per channel type (e.g., can't have two "Default" Pushover configs)
		// Note: Enforces uniqueness globally, including soft-deleted records
		index.Fields("channel_type", "name").
			Unique(),
	}
}
