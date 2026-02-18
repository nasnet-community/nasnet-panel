// Package pollers provides real-time polling services for router data.
package pollers

import (
	"fmt"
	"time"
)

// Polling interval constants for interface stats
const (
	// MinPollingInterval is the minimum allowed polling interval (1 second)
	MinPollingInterval = 1 * time.Second
	// DefaultPollingInterval is the default polling interval (5 seconds)
	DefaultPollingInterval = 5 * time.Second
	// MaxPollingInterval is the maximum reasonable polling interval (30 seconds)
	MaxPollingInterval = 30 * time.Second
)

// Traffic polling interval constants
const (
	// TrafficPollingInterval is the interval for collecting traffic statistics (10 seconds)
	TrafficPollingInterval = 10 * time.Second
	// MinTrafficPollingInterval is the minimum allowed polling interval (5 seconds)
	MinTrafficPollingInterval = 5 * time.Second
	// MaxTrafficPollingInterval is the maximum reasonable polling interval (60 seconds)
	MaxTrafficPollingInterval = 60 * time.Second
)

// Helper functions for extracting data from RouterOS responses

func getStringOrEmpty(data map[string]string, key string) string {
	if val, ok := data[key]; ok {
		return val
	}
	return ""
}

func getIntOrZero(data map[string]string, key string) int {
	if val, ok := data[key]; ok {
		if i, err := parseInt(val); err == nil {
			return i
		}
	}
	return 0
}

// parseInt parses a string to int. Shared helper for poller implementations.
func parseInt(s string) (int, error) {
	if s == "" {
		return 0, nil
	}
	var val int
	_, err := fmt.Sscanf(s, "%d", &val)
	return val, err
}

// parseBytes parses a byte count string from RouterOS.
func parseBytes(s string) int {
	var bytes int
	_, _ = fmt.Sscanf(s, "%d", &bytes) //nolint:errcheck // bytes parsing is best-effort
	return bytes
}
