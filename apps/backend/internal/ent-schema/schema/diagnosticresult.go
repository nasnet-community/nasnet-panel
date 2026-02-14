// Package schema contains ent schema definitions for NasNetConnect.
// DiagnosticResult represents the result of a diagnostic test run on a service instance.
package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
)

// DiagnosticResult holds the schema definition for the DiagnosticResult entity.
// DiagnosticResults store the outcomes of diagnostic tests (health checks, connectivity tests, etc.)
// run against service instances.
type DiagnosticResult struct {
	ent.Schema
}

// Fields of the DiagnosticResult entity.
func (DiagnosticResult) Fields() []ent.Field {
	return []ent.Field{
		// ULID primary key (26 characters, base32 encoded)
		field.String("id").
			MaxLen(26).
			NotEmpty().
			Unique().
			Immutable().
			Comment("ULID primary key"),

		// Service instance association
		field.String("instance_id").
			MaxLen(26).
			NotEmpty().
			Comment("Service instance ID this diagnostic belongs to"),

		// Test identification
		field.String("test_name").
			NotEmpty().
			MaxLen(255).
			Comment("Name of the diagnostic test (e.g., 'tor_socks5', 'process_health')"),

		// Test result
		field.Enum("status").
			Values("pass", "fail", "warning", "skipped").
			Comment("Test result status"),

		field.String("message").
			NotEmpty().
			MaxLen(500).
			Comment("Short message describing the result"),

		field.Text("details").
			Optional().
			Comment("Detailed information about the test result"),

		field.Int64("duration_ms").
			Min(0).
			Comment("Test execution duration in milliseconds"),

		// Grouping for batch test runs
		field.String("run_group_id").
			MaxLen(26).
			Optional().
			Comment("ULID for grouping tests run together (optional)"),

		// Additional metadata
		field.JSON("metadata", map[string]string{}).
			Optional().
			Comment("Additional test-specific metadata (JSON)"),

		// Error tracking
		field.String("error_message").
			Optional().
			MaxLen(1000).
			Comment("Error message if test failed"),

		// Timestamps
		field.Time("created_at").
			Default(time.Now).
			Immutable().
			Comment("Timestamp when test was executed"),
	}
}

// Edges of the DiagnosticResult entity.
func (DiagnosticResult) Edges() []ent.Edge {
	return []ent.Edge{
		// Belongs to ServiceInstance (many-to-one relationship)
		edge.From("service_instance", ServiceInstance.Type).
			Ref("diagnostic_results").
			Field("instance_id").
			Unique().
			Required().
			Comment("The service instance this diagnostic result belongs to"),
	}
}

// Indexes of the DiagnosticResult entity.
func (DiagnosticResult) Indexes() []ent.Index {
	return []ent.Index{
		// Index for looking up results by instance
		index.Fields("instance_id"),
		// Index for filtering by status
		index.Fields("status"),
		// Index for filtering by test name
		index.Fields("test_name"),
		// Index for grouping by run_group_id
		index.Fields("run_group_id"),
		// Composite index for instance + status queries
		index.Fields("instance_id", "status"),
		// Composite index for instance + test name queries
		index.Fields("instance_id", "test_name"),
		// Index for sorting by creation time
		index.Fields("created_at"),
	}
}
