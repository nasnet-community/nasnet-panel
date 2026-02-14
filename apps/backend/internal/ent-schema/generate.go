// Package schema contains the ent schema definitions for NasNetConnect.
//
// The ent ORM provides type-safe Go code for CRUD operations with
// compile-time query validation and graph-based relationships.
//
// To regenerate code after schema changes:
//
//	cd apps/backend/internal/ent-schema && go generate ./...
//
// Schema definitions are in the schema/ subdirectory.
// Generated code is output to apps/backend/generated/ent/ and includes:
//   - Client and transaction types
//   - Entity types with builders
//   - Query predicates and filters
//   - Migration support
package schema

//go:generate go run -mod=mod entc.go
