package mikrotik

import (
	"context"
	"fmt"
	"strconv"

	"backend/graph/model"
	"backend/internal/router"
)

// GetInterfaceStats retrieves current interface statistics from RouterOS.
// This method queries the /interface endpoint for traffic counters.
func (a *MikroTikAdapter) GetInterfaceStats(
	ctx context.Context,
	interfaceID string,
) (*model.InterfaceStats, error) {
	cmd := router.Command{
		Path:   "/interface",
		Action: "print",
		Query:  map[string]string{".id": interfaceID},
		Props: []string{
			"tx-byte", "rx-byte",
			"tx-packet", "rx-packet",
			"tx-error", "rx-error",
			"tx-drop", "rx-drop",
		},
	}

	result, err := a.Execute(ctx, cmd)
	if err != nil {
		return nil, fmt.Errorf("failed to execute RouterOS command: %w", err)
	}

	if len(result) == 0 {
		return nil, fmt.Errorf("interface with ID %s not found", interfaceID)
	}

	return mapToInterfaceStats(result[0]), nil
}

// GetAllInterfaceStats retrieves statistics for all interfaces.
// This is used for bulk queries and comparison views.
func (a *MikroTikAdapter) GetAllInterfaceStats(
	ctx context.Context,
) (map[string]*model.InterfaceStats, error) {
	cmd := router.Command{
		Path:   "/interface",
		Action: "print",
		Props: []string{
			".id",
			"tx-byte", "rx-byte",
			"tx-packet", "rx-packet",
			"tx-error", "rx-error",
			"tx-drop", "rx-drop",
		},
	}

	result, err := a.Execute(ctx, cmd)
	if err != nil {
		return nil, fmt.Errorf("failed to execute RouterOS command: %w", err)
	}

	stats := make(map[string]*model.InterfaceStats, len(result))
	for _, item := range result {
		if id, ok := item[".id"].(string); ok {
			stats[id] = mapToInterfaceStats(item)
		}
	}

	return stats, nil
}

// mapToInterfaceStats converts RouterOS response to InterfaceStats model.
// Handles type conversion for large counters (stored as strings in GraphQL to avoid JS integer overflow).
func mapToInterfaceStats(data map[string]interface{}) *model.InterfaceStats {
	stats := &model.InterfaceStats{
		TxBytes:   "0",
		RxBytes:   "0",
		TxPackets: "0",
		RxPackets: "0",
		TxErrors:  0,
		RxErrors:  0,
		TxDrops:   0,
		RxDrops:   0,
	}

	// Convert bytes (large numbers, returned as strings)
	if val, ok := data["tx-byte"]; ok {
		stats.TxBytes = formatSize(val)
	}
	if val, ok := data["rx-byte"]; ok {
		stats.RxBytes = formatSize(val)
	}

	// Convert packets (large numbers, returned as strings)
	if val, ok := data["tx-packet"]; ok {
		stats.TxPackets = formatSize(val)
	}
	if val, ok := data["rx-packet"]; ok {
		stats.RxPackets = formatSize(val)
	}

	// Convert errors (integers)
	if val, ok := data["tx-error"]; ok {
		stats.TxErrors = parseInt(val)
	}
	if val, ok := data["rx-error"]; ok {
		stats.RxErrors = parseInt(val)
	}

	// Convert drops (integers)
	if val, ok := data["tx-drop"]; ok {
		stats.TxDrops = parseInt(val)
	}
	if val, ok := data["rx-drop"]; ok {
		stats.RxDrops = parseInt(val)
	}

	return stats
}

// formatSize converts a value to a string representation for Size scalar type.
// Handles both string and integer types from RouterOS.
func formatSize(val interface{}) string {
	switch v := val.(type) {
	case string:
		return v
	case int:
		return strconv.FormatInt(int64(v), 10)
	case int64:
		return strconv.FormatInt(v, 10)
	case float64:
		return strconv.FormatInt(int64(v), 10)
	default:
		return "0"
	}
}

// parseInt safely converts a value to an integer.
// Returns 0 if conversion fails.
func parseInt(val interface{}) int {
	switch v := val.(type) {
	case int:
		return v
	case int64:
		return int(v)
	case float64:
		return int(v)
	case string:
		if i, err := strconv.Atoi(v); err == nil {
			return i
		}
		return 0
	default:
		return 0
	}
}
