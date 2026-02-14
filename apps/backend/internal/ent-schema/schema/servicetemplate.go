// Package schema contains ent schema definitions for NasNetConnect.
// ServiceTemplate represents a pre-configured service deployment template.
package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
)

// ServiceTemplate holds the schema definition for the ServiceTemplate entity.
// ServiceTemplates are pre-configured bundles of one or more services
// (e.g., privacy-bundle = Tor + Xray, anti-censorship-kit = Psiphon + MTProxy + Tor).
type ServiceTemplate struct {
	ent.Schema
}

// Fields of the ServiceTemplate entity.
func (ServiceTemplate) Fields() []ent.Field {
	return []ent.Field{
		// ULID primary key (26 characters, base32 encoded)
		field.String("id").
			MaxLen(26).
			NotEmpty().
			Unique().
			Immutable().
			Comment("ULID primary key"),

		// Template metadata
		field.String("name").
			NotEmpty().
			MaxLen(255).
			Comment("Human-readable template name"),

		field.Text("description").
			NotEmpty().
			Comment("Detailed description of what this template does"),

		field.Enum("category").
			Values(
				"privacy",
				"anti-censorship",
				"messaging",
				"gaming",
				"security",
				"networking",
			).
			Comment("Template category"),

		field.Enum("scope").
			Values(
				"single",   // Single service instance
				"multiple", // Multiple independent services
				"chain",    // Chained services (e.g., Tor → Xray)
			).
			Comment("Deployment scope"),

		field.String("version").
			NotEmpty().
			MaxLen(50).
			Comment("Template version (semantic versioning)"),

		field.Bool("is_built_in").
			Default(false).
			Comment("Whether this is a built-in template (shipped with NasNetConnect)"),

		field.String("author").
			Optional().
			MaxLen(255).
			Comment("Template author or organization"),

		// Router association (null for built-in templates)
		field.String("router_id").
			Optional().
			MaxLen(26).
			Comment("Router ID for user-created templates (null for built-in)"),

		// Template configuration (stored as JSON)
		field.JSON("services", []map[string]interface{}{}).
			Comment("Array of ServiceSpec objects defining services to deploy"),

		field.JSON("config_variables", []map[string]interface{}{}).
			Comment("Array of TemplateVariable objects for user configuration"),

		field.JSON("suggested_routing", []map[string]interface{}{}).
			Optional().
			Comment("Array of SuggestedRoutingRule objects for routing recommendations"),

		field.JSON("estimated_resources", map[string]interface{}{}).
			Optional().
			Comment("ResourceEstimate object with memory, CPU, disk estimates"),

		// Documentation
		field.JSON("tags", []string{}).
			Optional().
			Comment("Search tags"),

		field.JSON("prerequisites", []string{}).
			Optional().
			Comment("List of prerequisites or requirements"),

		field.Text("documentation").
			Optional().
			Comment("Detailed documentation and usage instructions"),

		field.JSON("examples", []string{}).
			Optional().
			Comment("Usage examples"),

		// Timestamps
		field.Time("created_at").
			Default(time.Now).
			Immutable().
			Comment("Timestamp when template was created"),

		field.Time("updated_at").
			Default(time.Now).
			UpdateDefault(time.Now).
			Comment("Timestamp when template was last updated"),
	}
}

// Edges of the ServiceTemplate entity.
func (ServiceTemplate) Edges() []ent.Edge {
	return []ent.Edge{
		// Router edge (optional - only for user-created templates)
		edge.From("router", Router.Type).
			Ref("service_templates").
			Field("router_id").
			Unique(),
	}
}

// Indexes of the ServiceTemplate entity.
func (ServiceTemplate) Indexes() []ent.Index {
	return []ent.Index{
		// Index for querying by router
		index.Fields("router_id"),

		// Index for querying by category
		index.Fields("category"),

		// Index for querying by scope
		index.Fields("scope"),

		// Index for built-in templates
		index.Fields("is_built_in"),

		// Composite index for filtering
		index.Fields("router_id", "category"),
		index.Fields("router_id", "scope"),
	}
}
