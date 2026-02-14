// Package schema contains ent schema definitions for NasNetConnect.
// ServiceDependency represents a dependency relationship between service instances.
package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
)

// ServiceDependency holds the schema definition for the ServiceDependency entity.
// ServiceDependencies represent dependency relationships between service instances,
// enabling features like auto-start dependencies and dependency-aware lifecycle management.
// Example: A VPN-over-Tor instance depends on a Tor instance being running.
type ServiceDependency struct {
	ent.Schema
}

// Fields of the ServiceDependency entity.
func (ServiceDependency) Fields() []ent.Field {
	return []ent.Field{
		// ULID primary key (26 characters, base32 encoded)
		field.String("id").
			MaxLen(26).
			NotEmpty().
			Unique().
			Immutable().
			Comment("ULID primary key"),

		// Foreign key to the dependent service instance (e.g., VPN)
		field.String("from_instance_id").
			MaxLen(26).
			NotEmpty().
			Comment("Service instance ID that depends on another service (dependent)"),

		// Foreign key to the dependency service instance (e.g., Tor)
		field.String("to_instance_id").
			MaxLen(26).
			NotEmpty().
			Comment("Service instance ID that is required (dependency)"),

		// Dependency type
		field.Enum("dependency_type").
			Values("REQUIRES", "OPTIONAL").
			Default("REQUIRES").
			Comment("Type of dependency: REQUIRES (hard dependency) or OPTIONAL (soft dependency)"),

		// Auto-start behavior when dependent starts
		field.Bool("auto_start").
			Default(true).
			Comment("Whether to automatically start the dependency when the dependent service starts"),

		// Health check timeout for auto-started dependencies
		field.Int("health_timeout_seconds").
			Default(30).
			Min(5).
			Max(300).
			Comment("Maximum seconds to wait for dependency health check during auto-start (5-300s)"),

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

// Edges of the ServiceDependency entity.
func (ServiceDependency) Edges() []ent.Edge {
	return []ent.Edge{
		// From instance (dependent) - the service that depends on another
		edge.From("from_instance", ServiceInstance.Type).
			Ref("dependencies").
			Field("from_instance_id").
			Unique().
			Required().
			Comment("The service instance that depends on another service"),

		// To instance (dependency) - the service that is required
		edge.From("to_instance", ServiceInstance.Type).
			Ref("dependents").
			Field("to_instance_id").
			Unique().
			Required().
			Comment("The service instance that is required as a dependency"),
	}
}

// Indexes of the ServiceDependency entity.
func (ServiceDependency) Indexes() []ent.Index {
	return []ent.Index{
		// Index for looking up all dependencies of a service instance
		index.Fields("from_instance_id"),
		// Index for looking up all dependents of a service instance
		index.Fields("to_instance_id"),
		// Composite unique constraint - no duplicate dependency relationships
		index.Fields("from_instance_id", "to_instance_id").Unique(),
		// Index for filtering by dependency type
		index.Fields("dependency_type"),
	}
}
