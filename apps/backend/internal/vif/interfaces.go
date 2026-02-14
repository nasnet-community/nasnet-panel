package vif

import (
	"context"

	"backend/internal/orchestrator"
)

// ProcessSupervisor interface allows GatewayManager to use Supervisor
// without importing orchestrator package (breaks circular dependency).
// This interface defines the minimal contract needed for gateway lifecycle management.
type ProcessSupervisor interface {
	Add(mp *orchestrator.ManagedProcess) error
	Start(ctx context.Context, id string) error
	Stop(ctx context.Context, id string) error
	Get(id string) (*orchestrator.ManagedProcess, bool)
	Remove(id string) error
}
