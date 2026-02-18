package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
)

// Version tracks database schema migrations.
// Each applied migration is recorded here for version tracking and auditing.
// This enables:
// - Knowing which migrations have been applied
// - Detecting schema drift
// - Supporting rollback operations
type Version struct {
	ent.Schema
}

// Fields of the Version entity.
func (Version) Fields() []ent.Field {
	return []ent.Field{
		// ULID primary key
		field.String("id").
			MaxLen(26).
			NotEmpty().
			Unique().
			Immutable().
			Comment("ULID primary key"),

		// Version number (format: YYYYMMDDHHMMSS)
		field.Int64("version").
			Unique().
			Comment("Migration version timestamp (YYYYMMDDHHMMSS)"),

		// Migration name/description
		field.String("name").
			MaxLen(255).
			Comment("Human-readable migration name"),

		// Checksum of migration SQL for drift detection
		field.String("checksum").
			MaxLen(64).
			Comment("SHA-256 checksum of migration SQL"),

		// Whether migration was applied successfully
		field.Bool("applied").
			Default(true).
			Comment("Whether migration completed successfully"),

		// Error message if migration failed
		field.String("error_message").
			Optional().
			MaxLen(1000).
			Comment("Error message if migration failed"),

		// Execution time in milliseconds
		field.Int64("execution_time_ms").
			Optional().
			Comment("How long the migration took to apply"),

		// When migration was applied
		field.Time("applied_at").
			Default(time.Now).
			Comment("When the migration was applied"),
	}
}

// Edges of the Version entity.
func (Version) Edges() []ent.Edge {
	return nil
}

// Indexes of the Version entity.
func (Version) Indexes() []ent.Index {
	return []ent.Index{
		// Version is unique (already enforced by field)
		index.Fields("version"),
		// Applied migrations
		index.Fields("applied"),
		// Applied time for sorting
		index.Fields("applied_at"),
	}
}
