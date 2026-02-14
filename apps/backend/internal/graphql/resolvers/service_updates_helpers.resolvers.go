package resolver

// This file contains helper functions for service update resolvers.
// Query, mutation, and subscription resolvers are in service_updates.resolvers.go.

import (
	"time"

	"backend/generated/graphql"
	
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

// parseTimeOrNow parses a time string (RFC3339) or returns current time if parsing fails.
func parseTimeOrNow(timeStr string) time.Time {
	if timeStr == "" {
		return time.Now()
	}
	t, err := time.Parse(time.RFC3339, timeStr)
	if err != nil {
		return time.Now()
	}
	return t
}
