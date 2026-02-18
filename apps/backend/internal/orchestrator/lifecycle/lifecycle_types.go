package lifecycle

import (
	"context"
	"fmt"

	"backend/generated/ent"
	"backend/internal/features"
)

// InstanceStatus represents the lifecycle status of a service instance
type InstanceStatus string

const (
	StatusInstalling InstanceStatus = "installing"
	StatusInstalled  InstanceStatus = "installed"
	StatusStarting   InstanceStatus = "starting"
	StatusRunning    InstanceStatus = "running"
	StatusStopping   InstanceStatus = "stopping"
	StatusStopped    InstanceStatus = "stopped"
	StatusFailed     InstanceStatus = "failed"
	StatusDeleting   InstanceStatus = "deleting"
)

// ValidTransitions defines the allowed state transitions
var ValidTransitions = map[InstanceStatus][]InstanceStatus{
	StatusInstalling: {StatusInstalled, StatusFailed},
	StatusInstalled:  {StatusStarting, StatusDeleting},
	StatusStarting:   {StatusRunning, StatusFailed},
	StatusRunning:    {StatusStopping, StatusFailed},
	StatusStopping:   {StatusStopped, StatusFailed},
	StatusStopped:    {StatusStarting, StatusDeleting, StatusFailed},
	StatusFailed:     {StatusStarting, StatusDeleting},
	StatusDeleting:   {}, // Terminal state
}

// DependentsActiveError is returned when attempting to stop/delete an instance with active dependents
type DependentsActiveError struct {
	InstanceID string
	Dependents []string // Instance IDs
}

func (e *DependentsActiveError) Error() string {
	return fmt.Sprintf("instance %s has %d active dependents: %v", e.InstanceID, len(e.Dependents), e.Dependents)
}

// BridgeOrchestrator interface for Virtual Interface Factory (NAS-8.2)
type BridgeOrchestrator interface {
	SetupBridge(ctx context.Context, instance *ent.ServiceInstance, manifest *features.Manifest) (*ent.VirtualInterface, error)
	TeardownBridge(ctx context.Context, instanceID string) error
	ReconcileOnStartup(ctx context.Context) error
}

// CreateInstanceRequest contains parameters for creating a new instance
type CreateInstanceRequest struct {
	FeatureID         string
	InstanceName      string
	RouterID          string
	RouterOSVersion   string
	Architecture      string
	AvailableMemoryMB int
	AvailableDiskMB   int
	Config            map[string]interface{}
}
