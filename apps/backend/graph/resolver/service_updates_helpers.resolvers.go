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

// severityMeetsThreshold checks if an update's severity meets or exceeds the minimum threshold.
// Severity order: CRITICAL > MAJOR > MINOR > PATCH
func severityMeetsThreshold(updateSeverity, minSeverity model.UpdateSeverity) bool {
	severityRank := map[model.UpdateSeverity]int{
		model.UpdateSeverityCritical: 4,
		model.UpdateSeverityMajor:    3,
		model.UpdateSeverityMinor:    2,
		model.UpdateSeverityPatch:    1,
	}

	updateRank, updateExists := severityRank[updateSeverity]
	minRank, minExists := severityRank[minSeverity]

	if !updateExists || !minExists {
		return false
	}

	return updateRank >= minRank
}
