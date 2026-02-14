package mikrotik

import (
	"context"
	"fmt"
	"strconv"

	"backend/internal/router"
)

// MikroTikAdapter wraps a RouterPort to provide MikroTik-specific operations.
// It converts between the generic RouterPort interface and MikroTik-specific
// data formats used by feature implementations.
type MikroTikAdapter struct {
	port router.RouterPort
}

// NewMikroTikAdapter creates a new MikroTik adapter wrapping the given RouterPort.
func NewMikroTikAdapter(port router.RouterPort) *MikroTikAdapter {
	return &MikroTikAdapter{port: port}
}

// Execute executes a router command and returns results as maps with interface{} values.
// This wraps the RouterPort.ExecuteCommand method, converting the Command struct
// to match the RouterPort interface and converting string results to interface{} maps.
func (a *MikroTikAdapter) Execute(ctx context.Context, cmd router.Command) ([]map[string]interface{}, error) {
	result, err := a.port.ExecuteCommand(ctx, cmd)
	if err != nil {
		return nil, err
	}

	if !result.Success {
		return nil, fmt.Errorf("command failed: %v", result.Error)
	}

	// Convert []map[string]string to []map[string]interface{}
	converted := make([]map[string]interface{}, len(result.Data))
	for i, item := range result.Data {
		m := make(map[string]interface{}, len(item))
		for k, v := range item {
			// Try to convert numeric strings to their numeric types
			if intVal, err := strconv.Atoi(v); err == nil {
				m[k] = intVal
			} else {
				m[k] = v
			}
		}
		converted[i] = m
	}

	return converted, nil
}
