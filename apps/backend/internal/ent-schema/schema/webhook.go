package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
)

// Webhook holds the schema definition for the Webhook entity.
// Webhooks are custom HTTP notification endpoints that receive alert payloads.
// Stored in system.db for centralized webhook configuration across all routers.
type Webhook struct {
	ent.Schema
}

// Fields of the Webhook entity.
func (Webhook) Fields() []ent.Field {
	return []ent.Field{
		// ULID primary key
		field.String("id").
			MaxLen(26).
			NotEmpty().
			Unique().
			Immutable().
			Comment("ULID primary key"),

		// Webhook identification
		field.String("name").
			NotEmpty().
			MaxLen(255).
			Comment("Human-readable webhook name"),

		// Target URL
		field.String("url").
			NotEmpty().
			MaxLen(2048).
			Comment("Webhook target URL (validated for SSRF protection)"),

		// Authentication
		field.Enum("auth_type").
			Values("none", "bearer", "basic", "api_key").
			Default("none").
			Comment("Authentication type for webhook requests"),

		// Encrypted authentication value
		// Bearer: {token: string}
		// Basic: {username: string, password: string}
		// API Key: {header: string, value: string}
		field.Bytes("auth_value_encrypted").
			Optional().
			Comment("Encrypted authentication credentials (AES-256-GCM encrypted JSON)"),

		// Nonce for auth value encryption (12 bytes)
		field.Bytes("auth_nonce").
			Optional().
			Comment("Encryption nonce for auth_value_encrypted"),

		// Request signing secret (for HMAC-SHA256 signatures)
		field.Bytes("signing_secret_encrypted").
			Optional().
			Comment("Encrypted signing secret for request verification (AES-256-GCM)"),

		// Nonce for signing secret encryption (12 bytes)
		field.Bytes("signing_nonce").
			Optional().
			Comment("Encryption nonce for signing_secret_encrypted"),

		// Custom headers (JSON map)
		// {header_name: header_value}
		field.JSON("headers", map[string]string{}).
			Optional().
			Comment("Custom HTTP headers to include in webhook requests"),

		// Payload template type
		field.Enum("template").
			Values("slack", "discord", "mattermost", "teams", "generic_json", "custom").
			Default("generic_json").
			Comment("Payload template type for webhook body"),

		// Custom template (Handlebars template)
		field.Text("custom_template").
			Optional().
			Comment("Custom Handlebars template for webhook payload (required if template=custom)"),

		// Enable/disable toggle
		field.Bool("enabled").
			Default(true).
			Comment("Whether this webhook is enabled"),

		// Delivery tracking
		field.Int("success_count").
			Default(0).
			NonNegative().
			Comment("Total successful webhook deliveries"),

		field.Int("failure_count").
			Default(0).
			NonNegative().
			Comment("Total failed webhook deliveries"),

		field.Time("last_success_at").
			Optional().
			Nillable().
			Comment("Last successful delivery timestamp"),

		field.Time("last_failure_at").
			Optional().
			Nillable().
			Comment("Last failed delivery timestamp"),

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

// Edges of the Webhook entity.
func (Webhook) Edges() []ent.Edge {
	return []ent.Edge{
		edge.To("logs", NotificationLog.Type).
			Comment("Delivery logs for this webhook"),
	}
}

// Indexes of the Webhook entity.
func (Webhook) Indexes() []ent.Index {
	return []ent.Index{
		// Enabled webhooks for fast filtering
		index.Fields("enabled"),
		// Name lookup
		index.Fields("name"),
		// Template type filtering
		index.Fields("template"),
		// Last success/failure for monitoring
		index.Fields("last_success_at"),
		index.Fields("last_failure_at"),
	}
}
