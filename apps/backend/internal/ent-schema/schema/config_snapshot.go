package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
)

// ConfigSnapshot captures complete router configuration at a point in time.
// Snapshots are used for:
// - Named backup points (e.g., "Before VPN setup", "Working config")
// - Auto-snapshots before major changes
// - Full configuration restore
// - Compliance auditing
type ConfigSnapshot struct {
	ent.Schema
}

// Fields of the ConfigSnapshot entity.
func (ConfigSnapshot) Fields() []ent.Field {
	return []ent.Field{
		// ULID primary key
		field.String("id").
			MaxLen(26).
			NotEmpty().
			Unique().
			Immutable().
			Comment("ULID primary key"),

		// Snapshot name (user-provided or auto-generated)
		field.String("name").
			NotEmpty().
			MaxLen(255).
			Comment("Human-readable snapshot name"),

		// Description/notes
		field.String("description").
			Optional().
			MaxLen(1000).
			Comment("Detailed description of the snapshot"),

		// Snapshot type
		field.Enum("snapshot_type").
			Values(
				"manual",      // User-created snapshot
				"auto",        // Auto-created before changes
				"scheduled",   // Scheduled backup
				"pre_update",  // Before firmware update
				"pre_restore", // Before restoring another snapshot
			).
			Default("manual").
			Comment("How the snapshot was created"),

		// Complete configuration data (all resources)
		field.JSON("configuration", map[string]interface{}{}).
			Comment("Complete configuration snapshot"),

		// Resource counts for quick display
		field.JSON("resource_counts", map[string]int{}).
			Optional().
			Comment("Count of resources by type"),

		// RouterOS version at snapshot time
		field.String("ros_version").
			Optional().
			MaxLen(32).
			Comment("RouterOS version at snapshot time"),

		// Router model at snapshot time
		field.String("router_model").
			Optional().
			MaxLen(100).
			Comment("Router model at snapshot time"),

		// Checksum for integrity verification
		field.String("checksum").
			Optional().
			MaxLen(64).
			Comment("SHA-256 checksum of configuration"),

		// Size in bytes (for display)
		field.Int64("size_bytes").
			Optional().
			Comment("Size of configuration data in bytes"),

		// Tags for organization
		field.JSON("tags", []string{}).
			Optional().
			Comment("User-defined tags for organization"),

		// Whether this snapshot is pinned (protected from auto-cleanup)
		field.Bool("pinned").
			Default(false).
			Comment("Whether snapshot is protected from cleanup"),

		// Who created the snapshot
		field.String("created_by").
			MaxLen(64).
			Default("system").
			Comment("User or system that created the snapshot"),

		// Timestamps
		field.Time("created_at").
			Default(time.Now).
			Immutable().
			Comment("Snapshot creation timestamp"),

		// Expiration (for auto-cleanup of old snapshots)
		field.Time("expires_at").
			Optional().
			Nillable().
			Comment("When snapshot can be auto-deleted (null = never)"),
	}
}

// Edges of the ConfigSnapshot entity.
func (ConfigSnapshot) Edges() []ent.Edge {
	return nil
}

// Indexes of the ConfigSnapshot entity.
func (ConfigSnapshot) Indexes() []ent.Index {
	return []ent.Index{
		// Snapshots by type
		index.Fields("snapshot_type"),
		// Pinned snapshots
		index.Fields("pinned"),
		// Creator
		index.Fields("created_by"),
		// Time range queries
		index.Fields("created_at"),
		// Expiring snapshots for cleanup
		index.Fields("expires_at"),
		// Name search (not unique - can have same name at different times)
		index.Fields("name"),
	}
}
