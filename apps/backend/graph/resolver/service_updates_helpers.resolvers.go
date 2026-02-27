package resolver

// This file contains helper functions for service update resolvers.
// Query, mutation, and subscription resolvers are in service_updates.resolvers.go.

import (
	"backend/graph/model"
	"backend/internal/events"
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

// updateEventTypes lists all event types for service update subscriptions.
var updateEventTypes = []string{
	events.EventTypeServiceUpdateStarted,
	events.EventTypeServiceUpdateDownloading,
	events.EventTypeServiceUpdateVerifying,
	events.EventTypeServiceUpdateSwapping,
	events.EventTypeServiceUpdateMigrating,
	events.EventTypeServiceUpdateValidating,
	events.EventTypeServiceUpdateCompleted,
	events.EventTypeServiceUpdateFailed,
	events.EventTypeServiceUpdateRolledBack,
}

// mapEventTypeToStage maps an event type string to the corresponding UpdateStage.
func mapEventTypeToStage(eventType string) model.UpdateStage {
	switch eventType {
	case events.EventTypeServiceUpdateStarted, events.EventTypeServiceUpdateDownloading, events.EventTypeServiceUpdateVerifying:
		return model.UpdateStageStaging
	case events.EventTypeServiceUpdateSwapping:
		return model.UpdateStageSwap
	case events.EventTypeServiceUpdateMigrating:
		return model.UpdateStageMigration
	case events.EventTypeServiceUpdateValidating:
		return model.UpdateStageValidation
	case events.EventTypeServiceUpdateCompleted:
		return model.UpdateStageCommit
	case events.EventTypeServiceUpdateFailed, events.EventTypeServiceUpdateRolledBack:
		return model.UpdateStageRollback
	default:
		return model.UpdateStageStaging
	}
}

// mapEventTypeToProgress maps an event type to a progress percentage (0-100).
func mapEventTypeToProgress(eventType string) int {
	switch eventType {
	case events.EventTypeServiceUpdateStarted:
		return 5
	case events.EventTypeServiceUpdateDownloading:
		return 15
	case events.EventTypeServiceUpdateVerifying:
		return 30
	case events.EventTypeServiceUpdateSwapping:
		return 50
	case events.EventTypeServiceUpdateMigrating:
		return 65
	case events.EventTypeServiceUpdateValidating:
		return 80
	case events.EventTypeServiceUpdateCompleted:
		return 100
	case events.EventTypeServiceUpdateFailed:
		return 0
	case events.EventTypeServiceUpdateRolledBack:
		return 50
	default:
		return 0
	}
}

// mapEventTypeToMessage maps an event type to a human-readable status message.
func mapEventTypeToMessage(eventType string) string {
	switch eventType {
	case events.EventTypeServiceUpdateStarted:
		return "Starting update..."
	case events.EventTypeServiceUpdateDownloading:
		return "Downloading binary..."
	case events.EventTypeServiceUpdateVerifying:
		return "Verifying checksums..."
	case events.EventTypeServiceUpdateSwapping:
		return "Swapping binaries..."
	case events.EventTypeServiceUpdateMigrating:
		return "Running config migrations..."
	case events.EventTypeServiceUpdateValidating:
		return "Validating new version..."
	case events.EventTypeServiceUpdateCompleted:
		return "Update completed successfully"
	case events.EventTypeServiceUpdateFailed:
		return "Update failed"
	case events.EventTypeServiceUpdateRolledBack:
		return "Rolling back to previous version..."
	default:
		return "Processing update..."
	}
}
