package resolver

// This file contains helper/conversion functions for logs and diagnostics resolvers.
// Query, mutation, and subscription resolvers are in logs_diagnostics.resolvers.go.

import (
	"backend/generated/graphql"
	
	"backend/internal/orchestrator"
)

func convertDiagnosticStatus(status string) model.DiagnosticStatus {
	switch status {
	case "pass":
		return model.DiagnosticStatusPass
	case "fail":
		return model.DiagnosticStatusFail
	case "warning":
		return model.DiagnosticStatusWarning
	case "skipped":
		return model.DiagnosticStatusSkipped
	default:
		return model.DiagnosticStatusFail
	}
}

func convertLogEntry(entry *orchestrator.LogEntry) *model.LogEntry {
	level := convertLogLevel(entry.Level)
	return &model.LogEntry{
		Timestamp: entry.Timestamp,
		Level:     level,
		Message:   entry.Message,
		Source:    entry.Source,
		RawLine:   entry.RawLine,
		Metadata:  convertStringMapToAnyMap(entry.Metadata),
	}
}

func convertLogLevel(level orchestrator.LogLevel) model.LogLevel {
	switch level {
	case orchestrator.LogLevelDebug:
		return model.LogLevelDebug
	case orchestrator.LogLevelInfo:
		return model.LogLevelInfo
	case orchestrator.LogLevelWarn:
		return model.LogLevelWarn
	case orchestrator.LogLevelError:
		return model.LogLevelError
	default:
		return model.LogLevelUnknown
	}
}

func createLogFilter(levelFilter *model.LogLevel) orchestrator.LogFilterFunc {
	if levelFilter == nil {
		return nil
	}

	targetLevel := convertModelLogLevelToOrchestrator(*levelFilter)

	return func(entry orchestrator.LogEntry) bool {
		return entry.Level == targetLevel
	}
}

func convertModelLogLevelToOrchestrator(level model.LogLevel) orchestrator.LogLevel {
	switch level {
	case model.LogLevelDebug:
		return orchestrator.LogLevelDebug
	case model.LogLevelInfo:
		return orchestrator.LogLevelInfo
	case model.LogLevelWarn:
		return orchestrator.LogLevelWarn
	case model.LogLevelError:
		return orchestrator.LogLevelError
	default:
		return orchestrator.LogLevelUnknown
	}
}

// convertStringMapToAnyMap converts map[string]string to map[string]any.
func convertStringMapToAnyMap(m map[string]string) map[string]any {
	if m == nil {
		return nil
	}
	result := make(map[string]any, len(m))
	for k, v := range m {
		result[k] = v
	}
	return result
}
