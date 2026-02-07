package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
)

// NotificationSettings holds the schema definition for notification channel credentials.
// Credentials are encrypted at rest using AES-256-GCM.
// Stored in system.db as these are global notification configurations.
type NotificationSettings struct {
	ent.Schema
}

// Fields of the NotificationSettings entity.
func (NotificationSettings) Fields() []ent.Field {
	return []ent.Field{
		// ULID primary key
		field.String("id").
			MaxLen(26).
			NotEmpty().
			Unique().
			Immutable().
			Comment("ULID primary key"),

		// Channel type (must be unique - enforced by index)
		field.Enum("channel").
			Values("email", "telegram", "pushover", "webhook").
			Comment("Notification channel type"),

		// Encrypted credentials (JSON)
		// Email: {smtp_host, smtp_port, username, password, from_address, from_name, use_tls}
		// Telegram: {bot_token, chat_id}
		// Pushover: {user_key, app_token}
		// Webhook: {url, method, headers, secret}
		field.Bytes("credentials_encrypted").
			Comment("Encrypted credentials (AES-256-GCM encrypted JSON)"),

		// Nonce for AES-GCM encryption (12 bytes)
		field.Bytes("nonce").
			Comment("Encryption nonce for AES-GCM"),

		// Whether this channel is enabled
		field.Bool("enabled").
			Default(false).
			Comment("Whether this notification channel is enabled"),

		// Last test status
		field.Enum("test_status").
			Values("untested", "success", "failed").
			Default("untested").
			Comment("Last test notification result"),

		field.String("test_message").
			Optional().
			MaxLen(500).
			Comment("Last test result message or error"),

		field.Time("tested_at").
			Optional().
			Nillable().
			Comment("When channel was last tested"),

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

// Indexes of the NotificationSettings entity.
func (NotificationSettings) Indexes() []ent.Index {
	return []ent.Index{
		// Channel type uniqueness (only one config per channel type)
		index.Fields("channel").Unique(),
		// Enabled channels for fast filtering
		index.Fields("enabled"),
		// Test status filtering
		index.Fields("test_status"),
	}
}
