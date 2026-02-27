package resolver

// This file contains helper/conversion functions for dependency resolvers.
// Query and mutation resolvers are in dependencies.resolvers.go.
//
// TODO: Add helper functions for:
// - Converting dependency objects to GraphQL models
// - Validating dependency configurations
// - Checking circular dependencies
// - Building dependency graphs
// when dependencies.resolvers.go is implemented.
//
// Reference: NAS-8.19 (orchestrator/dependencies package)

import (
	"backend/generated/ent"
	"backend/generated/ent/servicedependency"
	"backend/graph/model"
)

// entDependencyToModel converts an ent ServiceDependency to a GraphQL model.ServiceDependency.
func entDependencyToModel(dep *ent.ServiceDependency) *model.ServiceDependency {
	if dep == nil {
		return nil
	}

	var depType model.DependencyType
	switch dep.DependencyType {
	case servicedependency.DependencyTypeREQUIRES:
		depType = model.DependencyTypeRequires
	case servicedependency.DependencyTypeOPTIONAL:
		depType = model.DependencyTypeOptional
	default:
		depType = model.DependencyTypeRequires
	}

	result := &model.ServiceDependency{
		ID:                   dep.ID,
		DependencyType:       depType,
		AutoStart:            dep.AutoStart,
		HealthTimeoutSeconds: dep.HealthTimeoutSeconds,
		CreatedAt:            dep.CreatedAt,
		UpdatedAt:            dep.UpdatedAt,
	}

	// Add edges if loaded
	if dep.Edges.FromInstance != nil {
		result.FromInstance = convertEntInstanceToModel(dep.Edges.FromInstance)
	}
	if dep.Edges.ToInstance != nil {
		result.ToInstance = convertEntInstanceToModel(dep.Edges.ToInstance)
	}

	return result
}
