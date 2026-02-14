package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
)

// Resource holds the schema definition for router resources.
// This implements the Universal State v2 8-layer resource model:
// 1. Configuration - User intent
// 2. Validation - Pre-flight checks
// 3. Deployment - Applied to router
// 4. Runtime - Live operational state
// 5. Telemetry - Time-series metrics
// 6. Metadata - Lifecycle, tags
// 7. Relationships - Dependencies
// 8. Platform - Capabilities, mappings
//
// Resources are stored in router-{id}.db files.
type Resource struct {
	ent.Schema
}

// Fields of the Resource entity.
func (Resource) Fields() []ent.Field {
	return []ent.Field{
		// ULID primary key
		field.String("id").
			MaxLen(26).
			NotEmpty().
			Unique().
			Immutable().
			Comment("ULID primary key"),

		// Resource type (e.g., "ip/address", "interface/ethernet", "firewall/filter")
		field.String("type").
			NotEmpty().
			MaxLen(128).
			Comment("Resource type path (e.g., 'ip/address', 'firewall/filter')"),

		// Category for grouping (e.g., "networking", "firewall", "system")
		field.String("category").
			NotEmpty().
			MaxLen(64).
			Comment("Resource category for UI grouping"),

		// RouterOS internal ID (the .id field from RouterOS)
		field.String("ros_id").
			Optional().
			MaxLen(32).
			Comment("RouterOS internal ID (e.g., '*1', '*A')"),

		// =========================================================================
		// UNIVERSAL STATE V2 - 8 LAYER MODEL
		// =========================================================================

		// Layer 1: Configuration - User intent (what user wants)
		field.JSON("configuration", map[string]interface{}{}).
			Comment("Layer 1: User configuration intent"),

		// Layer 2: Validation - Pre-flight check results
		field.JSON("validation", map[string]interface{}{}).
			Optional().
			Comment("Layer 2: Validation results and warnings"),

		// Layer 3: Deployment - What was actually applied to router
		field.JSON("deployment", map[string]interface{}{}).
			Optional().
			Comment("Layer 3: Deployed configuration (may differ from intent)"),

		// Layer 4: Runtime - Live operational state from router
		field.JSON("runtime", map[string]interface{}{}).
			Optional().
			Comment("Layer 4: Runtime state (e.g., link status, counters)"),

		// Layer 5: Telemetry - Time-series metrics (latest values)
		field.JSON("telemetry", map[string]interface{}{}).
			Optional().
			Comment("Layer 5: Latest telemetry metrics"),

		// Layer 6: Metadata - Lifecycle, tags, notes
		field.JSON("metadata", map[string]interface{}{}).
			Comment("Layer 6: Metadata (tags, notes, last_modified_by)"),

		// Layer 7: Relationships - Dependencies on other resources
		field.JSON("relationships", map[string]interface{}{}).
			Optional().
			Comment("Layer 7: Resource relationships and dependencies"),

		// Layer 8: Platform - Platform-specific capabilities and mappings
		field.JSON("platform", map[string]interface{}{}).
			Optional().
			Comment("Layer 8: Platform capabilities and field mappings"),

		// =========================================================================
		// STATE TRACKING
		// =========================================================================

		// Sync status with router
		field.Enum("sync_status").
			Values("synced", "pending", "conflict", "error", "unknown").
			Default("unknown").
			Comment("Synchronization status with router"),

		// Whether resource is enabled on router
		field.Bool("enabled").
			Default(true).
			Comment("Whether resource is enabled (RouterOS disabled flag)"),

		// Whether resource is managed by NasNet (vs manually created)
		field.Bool("managed").
			Default(true).
			Comment("Whether resource is managed by NasNet"),

		// Version for optimistic locking
		field.Int64("version").
			Default(1).
			Comment("Version number for optimistic locking"),

		// =========================================================================
		// TIMESTAMPS
		// =========================================================================

		// When resource was first discovered/created
		field.Time("created_at").
			Default(time.Now).
			Immutable().
			Comment("Record creation timestamp"),

		// When local record was last updated
		field.Time("updated_at").
			Default(time.Now).
			UpdateDefault(time.Now).
			Comment("Last local update timestamp"),

		// When resource was last synced from router
		field.Time("synced_at").
			Optional().
			Nillable().
			Comment("Last successful sync from router"),

		// When resource was last modified on router
		field.Time("router_modified_at").
			Optional().
			Nillable().
			Comment("Last modification time on router"),
	}
}

// Edges of the Resource entity.
func (Resource) Edges() []ent.Edge {
	return []ent.Edge{
		edge.To("events", ResourceEvent.Type).
			Comment("Resource change events"),
	}
}

// Indexes of the Resource entity.
func (Resource) Indexes() []ent.Index {
	return []ent.Index{
		// Type lookup
		index.Fields("type"),
		// Category lookup
		index.Fields("category"),
		// Type + category combined
		index.Fields("type", "category"),
		// RouterOS ID lookup (unique per type)
		index.Fields("type", "ros_id"),
		// Sync status for finding resources needing sync
		index.Fields("sync_status"),
		// Managed resources
		index.Fields("managed"),
		// Timestamp indexes for sorting
		index.Fields("updated_at"),
		index.Fields("synced_at"),
	}
}
