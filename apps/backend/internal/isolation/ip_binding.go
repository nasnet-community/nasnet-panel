package isolation

import (
	"context"
	"os/exec"
)

// IPBindingStrategy is a fallback strategy that isolates processes using IP binding
// and process groups. This works on all platforms but provides weaker isolation than
// kernel namespaces.
type IPBindingStrategy struct{}

// Name returns the strategy name.
func (s *IPBindingStrategy) Name() string {
	return "ip-binding"
}

// PrepareProcess sets up the process to use process group isolation.
func (s *IPBindingStrategy) PrepareProcess(ctx context.Context, cmd *exec.Cmd, config *ProcessIsolationConfig) error {
	// IP binding isolation relies on supervisor setup and network configuration.
	// Actual Setpgid/process group setup is handled in supervisor_unix.go.
	// This strategy is just a marker/fallback indicating IP-based isolation.
	return nil
}

// PostStart performs no setup for IP binding strategy.
func (s *IPBindingStrategy) PostStart(ctx context.Context, pid int, config *ProcessIsolationConfig) error {
	// IP binding isolation happens via supervisor setup and network configuration
	// No runtime setup needed here
	return nil
}

// Cleanup performs no cleanup for IP binding strategy.
func (s *IPBindingStrategy) Cleanup(ctx context.Context, config *ProcessIsolationConfig) error {
	// IP binding doesn't create persistent resources
	return nil
}
