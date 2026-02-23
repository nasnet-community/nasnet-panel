package isolation

import (
	"context"
	"fmt"

	"backend/generated/ent/devicerouting"
)

// SuspendRouting activates kill switches for all device routings of an instance.
// It queries all DeviceRoutings where InstanceID=instanceID, KillSwitchEnabled=true,
// and KillSwitchActive=false, then calls Activate for each one.
//
// Returns the number of successfully activated routings. If any activation fails,
// the error is returned alongside the partial count of successes so far.
func (m *KillSwitchManager) SuspendRouting(ctx context.Context, instanceID string) (int, error) {
	routings, err := m.client.DeviceRouting.
		Query().
		Where(
			devicerouting.InstanceIDEQ(instanceID),
			devicerouting.KillSwitchEnabledEQ(true),
			devicerouting.KillSwitchActiveEQ(false),
		).
		All(ctx)
	if err != nil {
		return 0, fmt.Errorf("failed to query device routings for instance %s: %w", instanceID, err)
	}

	count := 0
	for _, routing := range routings {
		if activateErr := m.Activate(ctx, routing.ID); activateErr != nil {
			return count, fmt.Errorf("failed to activate kill switch for routing %s: %w", routing.ID, activateErr)
		}
		count++
	}

	return count, nil
}

// ResumeRouting deactivates kill switches for all device routings of an instance.
// It queries all DeviceRoutings where InstanceID=instanceID and KillSwitchActive=true,
// then calls Deactivate for each one.
//
// Returns the number of successfully deactivated routings. If any deactivation fails,
// the error is returned alongside the partial count of successes so far.
func (m *KillSwitchManager) ResumeRouting(ctx context.Context, instanceID string) (int, error) {
	routings, err := m.client.DeviceRouting.
		Query().
		Where(
			devicerouting.InstanceIDEQ(instanceID),
			devicerouting.KillSwitchActiveEQ(true),
		).
		All(ctx)
	if err != nil {
		return 0, fmt.Errorf("failed to query device routings for instance %s: %w", instanceID, err)
	}

	count := 0
	for _, routing := range routings {
		if deactivateErr := m.Deactivate(ctx, routing.ID); deactivateErr != nil {
			return count, fmt.Errorf("failed to deactivate kill switch for routing %s: %w", routing.ID, deactivateErr)
		}
		count++
	}

	return count, nil
}

// GetSuspendedDevices returns the MAC addresses of all devices currently suspended
// for a given service instance. A device is considered suspended when its
// KillSwitchActive field is true.
func (m *KillSwitchManager) GetSuspendedDevices(ctx context.Context, instanceID string) ([]string, error) {
	routings, err := m.client.DeviceRouting.
		Query().
		Where(
			devicerouting.InstanceIDEQ(instanceID),
			devicerouting.KillSwitchActiveEQ(true),
		).
		All(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to query suspended devices for instance %s: %w", instanceID, err)
	}

	macs := make([]string, 0, len(routings))
	for _, routing := range routings {
		macs = append(macs, routing.MACAddress)
	}

	return macs, nil
}

// IsSuspended checks if any routing is currently suspended for a given service instance.
// Returns true if at least one DeviceRouting has KillSwitchActive=true for the instance.
func (m *KillSwitchManager) IsSuspended(ctx context.Context, instanceID string) (bool, error) {
	count, err := m.client.DeviceRouting.
		Query().
		Where(
			devicerouting.InstanceIDEQ(instanceID),
			devicerouting.KillSwitchActiveEQ(true),
		).
		Count(ctx)
	if err != nil {
		return false, fmt.Errorf("failed to count suspended routings for instance %s: %w", instanceID, err)
	}

	return count > 0, nil
}
