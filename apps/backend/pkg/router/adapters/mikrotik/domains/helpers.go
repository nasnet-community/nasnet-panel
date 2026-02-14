package domains

import (
	"backend/internal/router"
)

// flattenResult extracts the first data record from a command result,
// or returns a map with just the created ID.
func flattenResult(result *router.CommandResult) map[string]string {
	if result == nil {
		return map[string]string{}
	}
	if len(result.Data) > 0 {
		return result.Data[0]
	}
	if result.ID != "" {
		return map[string]string{".id": result.ID}
	}
	return map[string]string{}
}

// resultID extracts the ID from a command result.
func resultID(result *router.CommandResult) string {
	if result == nil {
		return ""
	}
	return result.ID
}
