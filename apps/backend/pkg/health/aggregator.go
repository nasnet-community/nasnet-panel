package health

import (
	"context"
	"sync"
	"time"
)

// Aggregator runs multiple probes and aggregates their results into a HealthStatus.
type Aggregator struct {
	probes []Probe
	mu     sync.RWMutex
}

// NewAggregator creates a new health aggregator.
func NewAggregator(probes ...Probe) *Aggregator {
	return &Aggregator{probes: probes}
}

// RegisterProbe adds a probe to the aggregator.
func (a *Aggregator) RegisterProbe(probe Probe) {
	a.mu.Lock()
	defer a.mu.Unlock()
	a.probes = append(a.probes, probe)
}

// Check runs all registered probes and returns the aggregate health status.
// If all probes pass, status is Healthy.
// If some probes fail, status is Degraded.
// If all probes fail, status is Unhealthy.
func (a *Aggregator) Check(ctx context.Context) HealthStatus {
	a.mu.RLock()
	probes := make([]Probe, len(a.probes))
	copy(probes, a.probes)
	a.mu.RUnlock()

	if len(probes) == 0 {
		return HealthStatus{
			Status:    StatusUnknown,
			Probes:    nil,
			CheckedAt: time.Now(),
		}
	}

	results := make([]ProbeResult, 0, len(probes))
	failCount := 0

	for _, probe := range probes {
		result := CheckWithResult(ctx, probe)
		results = append(results, result)
		if !result.Healthy {
			failCount++
		}
	}

	status := StatusHealthy
	if failCount == len(probes) {
		status = StatusUnhealthy
	} else if failCount > 0 {
		status = StatusDegraded
	}

	return HealthStatus{
		Status:    status,
		Probes:    results,
		CheckedAt: time.Now(),
	}
}
