package resolver

// This file contains helper/conversion functions for logs and diagnostics resolvers.
// Query, mutation, and subscription resolvers are in logs_diagnostics.resolvers.go.

import (
	"backend/graph/model"
	"backend/internal/orchestrator/resources"
)

func convertLogLevel(level resources.LogLevel) model.LogLevel {
	//nolint:exhaustive // default handles remaining cases
	switch level {
	case resources.LogLevelDebug:
		return model.LogLevelDebug
	case resources.LogLevelInfo:
		return model.LogLevelInfo
	case resources.LogLevelWarn:
		return model.LogLevelWarn
	case resources.LogLevelError:
		return model.LogLevelError
	default:
		return model.LogLevelUnknown
	}
}
