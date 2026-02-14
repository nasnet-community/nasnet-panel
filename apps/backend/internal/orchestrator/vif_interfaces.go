package orchestrator

import (
	"context"

	"backend/generated/ent"
)

// DeviceRoutingQuerier provides read-only access to DeviceRouting data.
// This interface enables service scheduling to query device routing assignments
// without directly importing Story 8.3 implementation.
//
// Story 8.3 Integration: When Story 8.3 (Device Routing) is implemented,
// the real DeviceRoutingService will implement this interface to provide
// actual device routing data for schedule evaluation.
type DeviceRoutingQuerier interface {
	// GetRoutingsByInstance returns all DeviceRouting records for a service instance.
	// Used by scheduler to determine which devices are affected by service state changes.
	GetRoutingsByInstance(ctx context.Context, instanceID string) ([]*ent.DeviceRouting, error)

	// GetRoutingsByDevice returns all DeviceRouting records for a device (MAC address).
	// Used to check if a device has any active routing assignments.
	GetRoutingsByDevice(ctx context.Context, deviceMAC string) ([]*ent.DeviceRouting, error)

	// IsDeviceRouted checks if a specific device is routed through any service instance.
	// Fast check for routing status without fetching full records.
	IsDeviceRouted(ctx context.Context, deviceMAC string) (bool, error)
}

// KillSwitchCoordinator provides operations for kill switch suspend/resume.
// This interface enables service scheduling to coordinate with the kill switch system
// when services are started/stopped by schedules.
//
// Story 8.13 Integration: When Story 8.13 (Kill Switch) is implemented,
// the real KillSwitchService will implement this interface to provide
// actual traffic blocking/unblocking during service transitions.
type KillSwitchCoordinator interface {
	// SuspendRouting temporarily blocks traffic for devices routed through a service.
	// Called by scheduler before stopping a service to prevent traffic leaks.
	// Returns the number of devices affected.
	SuspendRouting(ctx context.Context, instanceID string) (int, error)

	// ResumeRouting restores traffic for devices routed through a service.
	// Called by scheduler after starting a service to resume normal routing.
	// Returns the number of devices affected.
	ResumeRouting(ctx context.Context, instanceID string) (int, error)

	// GetSuspendedDevices returns the list of device MAC addresses currently suspended
	// for a given service instance. Used for status queries and verification.
	GetSuspendedDevices(ctx context.Context, instanceID string) ([]string, error)

	// IsSuspended checks if routing is currently suspended for a service instance.
	// Fast status check for kill switch state.
	IsSuspended(ctx context.Context, instanceID string) (bool, error)
}

// PBRCascadeHook provides hooks for Policy-Based Routing (PBR) cascade deletion.
// This interface enables service scheduling to trigger cascade cleanup when
// scheduled service deletions occur.
//
// Story 8.3 Integration: When Story 8.3 is implemented with cascade deletion,
// this interface will be implemented to handle automatic cleanup of dependent
// DeviceRouting records when a service instance is deleted via schedule.
type PBRCascadeHook interface {
	// OnServiceDeleted handles cascade deletion of DeviceRouting records
	// when a service instance is deleted. Returns the number of records cleaned up.
	OnServiceDeleted(ctx context.Context, instanceID string) (int, error)

	// OnServiceSuspended handles temporary state changes when a service is suspended
	// by schedule. May update DeviceRouting status without deletion.
	OnServiceSuspended(ctx context.Context, instanceID string) error

	// OnServiceResumed handles state restoration when a service is resumed by schedule.
	OnServiceResumed(ctx context.Context, instanceID string) error
}

// NoOpDeviceRoutingQuerier is a stub implementation that returns empty results.
// Used during development before Story 8.3 is implemented.
type NoOpDeviceRoutingQuerier struct{}

func (n *NoOpDeviceRoutingQuerier) GetRoutingsByInstance(ctx context.Context, instanceID string) ([]*ent.DeviceRouting, error) {
	return []*ent.DeviceRouting{}, nil
}

func (n *NoOpDeviceRoutingQuerier) GetRoutingsByDevice(ctx context.Context, deviceMAC string) ([]*ent.DeviceRouting, error) {
	return []*ent.DeviceRouting{}, nil
}

func (n *NoOpDeviceRoutingQuerier) IsDeviceRouted(ctx context.Context, deviceMAC string) (bool, error) {
	return false, nil
}

// NoOpKillSwitchCoordinator is a stub implementation that succeeds without side effects.
// Used during development before Story 8.13 is implemented.
type NoOpKillSwitchCoordinator struct{}

func (n *NoOpKillSwitchCoordinator) SuspendRouting(ctx context.Context, instanceID string) (int, error) {
	return 0, nil // No devices affected
}

func (n *NoOpKillSwitchCoordinator) ResumeRouting(ctx context.Context, instanceID string) (int, error) {
	return 0, nil // No devices affected
}

func (n *NoOpKillSwitchCoordinator) GetSuspendedDevices(ctx context.Context, instanceID string) ([]string, error) {
	return []string{}, nil
}

func (n *NoOpKillSwitchCoordinator) IsSuspended(ctx context.Context, instanceID string) (bool, error) {
	return false, nil
}

// NoOpPBRCascadeHook is a stub implementation that succeeds without side effects.
// Used during development before Story 8.3 cascade deletion is implemented.
type NoOpPBRCascadeHook struct{}

func (n *NoOpPBRCascadeHook) OnServiceDeleted(ctx context.Context, instanceID string) (int, error) {
	return 0, nil // No records cleaned up
}

func (n *NoOpPBRCascadeHook) OnServiceSuspended(ctx context.Context, instanceID string) error {
	return nil
}

func (n *NoOpPBRCascadeHook) OnServiceResumed(ctx context.Context, instanceID string) error {
	return nil
}
