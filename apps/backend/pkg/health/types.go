// Package health provides a composable health checking framework.
// It defines probe interfaces, probe types (TCP, HTTP, Process, Composite),
// and an aggregator for combining probe results into an overall health status.
package health

import "time"

// Status represents the overall health status.
type Status string

const (
	StatusHealthy   Status = "HEALTHY"
	StatusDegraded  Status = "DEGRADED"
	StatusUnhealthy Status = "UNHEALTHY"
	StatusUnknown   Status = "UNKNOWN"
	StatusChecking  Status = "CHECKING"
)

// ConnectionStatus represents the connection state from a probe.
type ConnectionStatus string

const (
	ConnectionConnected  ConnectionStatus = "CONNECTED"
	ConnectionConnecting ConnectionStatus = "CONNECTING"
	ConnectionFailed     ConnectionStatus = "FAILED"
)

// ProbeResult contains the result of a single health probe check.
type ProbeResult struct {
	Name    string        // Probe name
	Healthy bool          // Whether the probe succeeded
	Latency time.Duration // Time taken to perform the check
	Error   error         // Error if probe failed
}

// HealthStatus contains the aggregated health status from all probes.
type HealthStatus struct {
	Status    Status        // Overall status
	Probes    []ProbeResult // Individual probe results
	CheckedAt time.Time    // When the check was performed
}

// ProbeConfig holds common configuration for health probes.
type ProbeConfig struct {
	// CheckInterval is the time between health checks.
	CheckInterval time.Duration

	// FailureThreshold is the number of consecutive failures before marking unhealthy.
	FailureThreshold int

	// ProbeTimeout is the maximum time to wait for a probe to complete.
	ProbeTimeout time.Duration

	// AutoRestart enables automatic restart on health check failure.
	AutoRestart bool
}

// DefaultProbeConfig returns default probe configuration values.
func DefaultProbeConfig() ProbeConfig {
	return ProbeConfig{
		CheckInterval:    30 * time.Second,
		FailureThreshold: 3,
		ProbeTimeout:     5 * time.Second,
		AutoRestart:      true,
	}
}

// Bounds for configurable settings.
const (
	MinCheckInterval    = 10 * time.Second
	MaxCheckInterval    = 5 * time.Minute
	MinFailureThreshold = 1
	MaxFailureThreshold = 10
)

// ValidateProbeConfig validates that a probe configuration is within acceptable bounds.
func ValidateProbeConfig(cfg ProbeConfig) error {
	if cfg.CheckInterval < MinCheckInterval || cfg.CheckInterval > MaxCheckInterval {
		return &ConfigError{Field: "CheckInterval", Min: MinCheckInterval.String(), Max: MaxCheckInterval.String()}
	}
	if cfg.FailureThreshold < MinFailureThreshold || cfg.FailureThreshold > MaxFailureThreshold {
		return &ConfigError{Field: "FailureThreshold", Min: "1", Max: "10"}
	}
	return nil
}

// ConfigError represents an invalid probe configuration.
type ConfigError struct {
	Field string
	Min   string
	Max   string
}

func (e *ConfigError) Error() string {
	return e.Field + " must be between " + e.Min + " and " + e.Max
}
