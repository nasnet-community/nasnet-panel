package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
)

// RouterCapability holds the schema definition for cached router capabilities.
// Capabilities are stored in the router-{id}.db per router, with a 24-hour TTL.
type RouterCapability struct {
	ent.Schema
}

// Fields of the RouterCapability entity.
func (RouterCapability) Fields() []ent.Field {
	return []ent.Field{
		// ULID primary key
		field.String("id").
			MaxLen(26).
			NotEmpty().
			Unique().
			Immutable().
			Comment("ULID primary key"),

		// Hardware information
		field.String("architecture").
			NotEmpty().
			MaxLen(32).
			Comment("CPU architecture (arm, arm64, x86_64, etc.)"),

		field.String("model").
			Optional().
			MaxLen(128).
			Comment("Router model name"),

		field.String("board_name").
			Optional().
			MaxLen(128).
			Comment("Board name"),

		field.Int64("total_memory").
			Default(0).
			Comment("Total RAM in bytes"),

		field.Int64("available_storage").
			Default(0).
			Comment("Available storage in bytes"),

		field.Int("cpu_count").
			Default(1).
			Comment("Number of CPU cores"),

		field.Bool("has_wireless_chip").
			Default(false).
			Comment("Whether wireless hardware is present"),

		field.Bool("has_lte_module").
			Default(false).
			Comment("Whether LTE/cellular hardware is present"),

		// Software information
		field.String("version_raw").
			NotEmpty().
			MaxLen(50).
			Comment("Raw RouterOS version string"),

		field.Int("version_major").
			Default(0).
			Comment("Parsed major version number"),

		field.Int("version_minor").
			Default(0).
			Comment("Parsed minor version number"),

		field.Int("version_patch").
			Default(0).
			Comment("Parsed patch version number"),

		field.JSON("installed_packages", []string{}).
			Comment("List of installed packages"),

		field.Int("license_level").
			Default(0).
			Min(0).
			Max(6).
			Comment("RouterOS license level (0-6)"),

		field.String("update_channel").
			Optional().
			MaxLen(32).
			Comment("Update channel (stable, testing, development)"),

		// Container capabilities
		field.Bool("container_package_installed").
			Default(false).
			Comment("Whether container package is installed"),

		field.Bool("container_enabled").
			Default(false).
			Comment("Whether container feature is enabled"),

		field.Bool("container_registry_configured").
			Default(false).
			Comment("Whether a container registry is configured"),

		field.Int64("container_storage_available").
			Default(0).
			Comment("Available storage for container images in bytes"),

		field.Bool("supports_network_namespace").
			Default(false).
			Comment("Whether network namespace is supported"),

		field.Int("max_containers").
			Default(0).
			Comment("Maximum number of containers supported"),

		// Capability entries stored as JSON map
		// Key: capability name (e.g., "CONTAINER", "VIF")
		// Value: { level: int, description: string, guidance: string }
		field.JSON("capability_entries", map[string]interface{}{}).
			Comment("Capability entries map with levels and guidance"),

		// Cache management
		field.Time("detected_at").
			Default(time.Now).
			Comment("When capabilities were detected"),

		field.Time("expires_at").
			Comment("When the cached capabilities expire (24h TTL)"),

		field.Bool("is_refreshing").
			Default(false).
			Comment("Whether a background refresh is in progress"),

		// Standard timestamps
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

// Edges of the RouterCapability entity.
func (RouterCapability) Edges() []ent.Edge {
	// RouterCapability is stored in router-{id}.db, so no cross-db edges
	return nil
}

// Indexes of the RouterCapability entity.
func (RouterCapability) Indexes() []ent.Index {
	return []ent.Index{
		// Index for finding expired capabilities
		index.Fields("expires_at"),
		// Index for finding stale capabilities (for lazy refresh)
		index.Fields("detected_at"),
	}
}
