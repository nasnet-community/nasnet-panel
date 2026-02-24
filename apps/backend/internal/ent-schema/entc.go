//go:build ignore

// Package main generates ent ORM code from schema definitions.
// Run with: go generate ./...
package main

import (
	"log"

	"entgo.io/ent/entc"
	"entgo.io/ent/entc/gen"
)

func main() {
	err := entc.Generate("./schema", &gen.Config{
		// Package path for generated code (import path)
		Package: "backend/generated/ent",

		// Target directory for generated code (relative to location of entc.go)
		Target: "../../generated/ent",

		// Generate features
		Features: []gen.Feature{
			// Enable fluent API for queries
			gen.FeatureExecQuery,
			// Enable upsert operations
			gen.FeatureUpsert,
			// Enable schema migrations
			gen.FeatureSchemaConfig,
			// Enable intercept middleware
			gen.FeatureIntercept,
		},
	})
	if err != nil {
		log.Fatalf("running ent codegen: %v", err)
	}
}
