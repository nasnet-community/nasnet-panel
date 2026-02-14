package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
)

// GlobalSettings holds application-wide configuration.
// Uses a key-value pattern with typed JSON values for flexibility.
type GlobalSettings struct {
	ent.Schema
}

// Fields of the GlobalSettings entity.
func (GlobalSettings) Fields() []ent.Field {
	return []ent.Field{
		// ULID primary key
		field.String("id").
			MaxLen(26).
			NotEmpty().
			Unique().
			Immutable().
			Comment("ULID primary key"),

		// Setting namespace/category
		field.String("namespace").
			NotEmpty().
			MaxLen(64).
			Comment("Setting category (e.g., 'auth', 'network', 'ui')"),

		// Setting key
		field.String("key").
			NotEmpty().
			MaxLen(128).
			Comment("Setting key within namespace"),

		// Setting value (JSON for flexibility)
		field.JSON("value", map[string]interface{}{}).
			Comment("Setting value as JSON object"),

		// Value type hint for client
		field.Enum("value_type").
			Values("string", "number", "boolean", "object", "array").
			Default("string").
			Comment("Type hint for the value"),

		// Description for documentation
		field.String("description").
			Optional().
			MaxLen(500).
			Comment("Human-readable description of the setting"),

		// Whether this setting can be modified via UI
		field.Bool("editable").
			Default(true).
			Comment("Whether setting can be modified via UI"),

		// Whether this setting requires restart to take effect
		field.Bool("requires_restart").
			Default(false).
			Comment("Whether changes require application restart"),

		// Sensitive settings (like API keys) should not be returned in full
		field.Bool("sensitive").
			Default(false).
			Comment("Whether value should be masked in responses"),

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

// Edges of the GlobalSettings entity.
func (GlobalSettings) Edges() []ent.Edge {
	return nil
}

// Indexes of the GlobalSettings entity.
func (GlobalSettings) Indexes() []ent.Index {
	return []ent.Index{
		// Namespace + key is unique
		index.Fields("namespace", "key").Unique(),
		// Index for listing settings by namespace
		index.Fields("namespace"),
	}
}
