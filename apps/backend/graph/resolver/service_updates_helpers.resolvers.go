package resolver

// This file contains helper functions for service update resolvers.
// Query, mutation, and subscription resolvers are in service_updates.resolvers.go.

import (
	"backend/graph/model"
)

// mapSeverityToModel maps internal Severity to GraphQL UpdateSeverity.
func mapSeverityToModel(severity string) model.UpdateSeverity {
	switch severity {
	case "CRITICAL":
		return model.UpdateSeverityCritical
	case "MAJOR":
		return model.UpdateSeverityMajor
	case "MINOR":
		return model.UpdateSeverityMinor
	case "PATCH":
		return model.UpdateSeverityPatch
	default:
		return model.UpdateSeverityMinor
	}
}
