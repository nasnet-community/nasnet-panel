// Package ent provides the generated ORM client and schema definitions
// for the NasNetConnect hybrid database architecture.
//
// The ent ORM provides type-safe Go code for CRUD operations with
// compile-time query validation and graph-based relationships.
//
// To regenerate code after schema changes:
//
//	go generate ./ent
//
// Schema definitions are in the schema/ subdirectory.
// Generated code includes:
//   - Client and transaction types
//   - Entity types with builders
//   - Query predicates and filters
//   - Migration support
package ent

//go:generate go run -mod=mod entc.go
