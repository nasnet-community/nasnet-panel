package orchestrator

import "backend/pkg/health"

// ProcessHealthProbe is an alias for pkg/health.ProcessProbe.
type ProcessHealthProbe = health.ProcessProbe

// NewProcessHealthProbe creates a new process health probe.
// Delegates to pkg/health.NewProcessProbe.
var NewProcessHealthProbe = health.NewProcessProbe
