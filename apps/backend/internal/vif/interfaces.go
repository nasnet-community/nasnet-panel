package vif

import (
	"context"

	"backend/internal/orchestrator/supervisor"
)

// ProcessSupervisor interface allows GatewayManager to use Supervisor
// without importing orchestrator package (breaks circular dependency).
// This interface defines the minimal contract needed for gateway lifecycle management.
type ProcessSupervisor interface {
	Add(mp *supervisor.ManagedProcess) error
	Start(ctx context.Context, id string) error
	Stop(ctx context.Context, id string) error
	Get(id string) (*supervisor.ManagedProcess, bool)
	Remove(id string) error
}
