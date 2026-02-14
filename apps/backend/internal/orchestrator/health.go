package orchestrator

import (
	"backend/pkg/health"
)

// ProbeResult is an alias for pkg/health.ProbeResult for backward compatibility.
type ProbeResult = health.ProbeResult

// CheckWithResult wraps a HealthProbe.Check() call and measures latency.
// Delegates to pkg/health.CheckWithResult.
var CheckWithResult = health.CheckWithResult

// TCPHealthProbe is an alias for pkg/health.TCPProbe.
type TCPHealthProbe = health.TCPProbe

// NewTCPHealthProbe creates a new TCP health probe.
// Delegates to pkg/health.NewTCPProbe.
var NewTCPHealthProbe = health.NewTCPProbe

// HTTPHealthProbe is an alias for pkg/health.HTTPProbe.
type HTTPHealthProbe = health.HTTPProbe

// NewHTTPHealthProbe creates a new HTTP health probe.
// Delegates to pkg/health.NewHTTPProbe.
var NewHTTPHealthProbe = health.NewHTTPProbe

// CompositeHealthProbe is an alias for pkg/health.CompositeProbe.
type CompositeHealthProbe = health.CompositeProbe

// NewCompositeHealthProbe creates a health probe that checks multiple probes.
// Note: This accepts HealthProbe (orchestrator interface) not health.Probe (pkg interface).
// Since HealthProbe and health.Probe have the same signature, they are compatible.
func NewCompositeHealthProbe(name string, probes ...HealthProbe) *CompositeHealthProbe {
	pkgProbes := make([]health.Probe, len(probes))
	for i, p := range probes {
		pkgProbes[i] = p
	}
	return health.NewCompositeProbe(name, pkgProbes...)
}
