package health

import (
	"context"
	"time"
)

// Probe defines the interface for a health check probe.
type Probe interface {
	// Check performs the health check. Returns nil if healthy, error if unhealthy.
	Check(ctx context.Context) error
	// Name returns the probe's identifier.
	Name() string
}

// Checker defines the interface for a composite health checker that
// manages multiple probes and aggregates their results.
type Checker interface {
	// Check runs all registered probes and returns the aggregate status.
	Check(ctx context.Context) AggregatedStatus
	// RegisterProbe adds a probe to the checker.
	RegisterProbe(probe Probe)
}

// CheckWithResult wraps a Probe.Check() call and measures latency.
func CheckWithResult(ctx context.Context, probe Probe) ProbeResult {
	start := time.Now()
	err := probe.Check(ctx)
	latency := time.Since(start)

	return ProbeResult{
		Name:    probe.Name(),
		Healthy: err == nil,
		Latency: latency,
		Error:   err,
	}
}
