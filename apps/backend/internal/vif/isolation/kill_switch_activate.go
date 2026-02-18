package isolation

import (
	"context"
	"fmt"
	"time"

	"backend/internal/events"
)

// Activate atomically enables the pre-created firewall rule.
// This is called when the service instance fails health checks.
//
// Flow:
// 1. Fetch DeviceRouting record
// 2. Verify kill switch is enabled but not active
// 3. Enable the firewall filter rule (set disabled=no)
// 4. Update database active status
// 5. Emit event
//
// Returns error if kill switch is not enabled or activation fails.
func (m *KillSwitchManager) Activate(ctx context.Context, routingID string) error {
	// Step 1: Fetch DeviceRouting record
	routing, err := m.client.DeviceRouting.Get(ctx, routingID)
	if err != nil {
		return fmt.Errorf("failed to fetch routing record: %w", err)
	}

	// Step 2: Verify kill switch is enabled
	if !routing.KillSwitchEnabled {
		return fmt.Errorf("kill switch not enabled for routing %s", routingID)
	}

	// Step 3: Check if already active
	if routing.KillSwitchActive {
		// Already active, this is idempotent
		return nil
	}

	// Step 4: Enable the firewall filter rule (set disabled=no)
	if enableErr := m.enableFilterRule(ctx, routing.KillSwitchRuleID); enableErr != nil {
		return fmt.Errorf("failed to enable filter rule: %w", enableErr)
	}

	// Step 5: Update database active status
	now := time.Now()
	_, err = m.client.DeviceRouting.
		UpdateOneID(routingID).
		SetKillSwitchActive(true).
		SetKillSwitchActivatedAt(now).
		Save(ctx)
	if err != nil {
		// Rollback: Disable the rule we just enabled
		_ = m.disableFilterRule(ctx, routing.KillSwitchRuleID) //nolint:errcheck // best-effort rollback after DB update failure
		return fmt.Errorf("failed to update database: %w", err)
	}

	// Step 6: Emit event
	if m.publisher != nil {
		event := events.NewBaseEvent(
			events.EventTypeServiceKillSwitch,
			events.PriorityImmediate,
			"kill-switch-manager",
		)
		if err := m.publisher.Publish(ctx, &event); err != nil { //nolint:revive,staticcheck // intentional no-op
		}
	}

	return nil
}

// Deactivate atomically disables the firewall rule when service recovers.
// This is called when the service instance passes health checks again.
//
// Flow:
// 1. Fetch DeviceRouting record
// 2. Verify kill switch is active
// 3. Disable the firewall filter rule (set disabled=yes)
// 4. Update database active status
// 5. Emit event
//
// Returns error if kill switch is not active or deactivation fails.
func (m *KillSwitchManager) Deactivate(ctx context.Context, routingID string) error {
	// Step 1: Fetch DeviceRouting record
	routing, err := m.client.DeviceRouting.Get(ctx, routingID)
	if err != nil {
		return fmt.Errorf("failed to fetch routing record: %w", err)
	}

	// Step 2: Verify kill switch is enabled
	if !routing.KillSwitchEnabled {
		return fmt.Errorf("kill switch not enabled for routing %s", routingID)
	}

	// Step 3: Check if already inactive
	if !routing.KillSwitchActive {
		// Already inactive, this is idempotent
		return nil
	}

	// Step 4: Disable the firewall filter rule (set disabled=yes)
	if disErr := m.disableFilterRule(ctx, routing.KillSwitchRuleID); disErr != nil {
		return fmt.Errorf("failed to disable filter rule: %w", disErr)
	}

	// Step 5: Update database active status
	_, err = m.client.DeviceRouting.
		UpdateOneID(routingID).
		SetKillSwitchActive(false).
		Save(ctx)
	if err != nil {
		// Rollback: Enable the rule we just disabled
		_ = m.enableFilterRule(ctx, routing.KillSwitchRuleID) //nolint:errcheck // best-effort enable
		return fmt.Errorf("failed to update database: %w", err)
	}

	// Step 6: Emit event
	if m.publisher != nil {
		event := events.NewBaseEvent(
			"killswitch.deactivated",
			events.PriorityNormal,
			"kill-switch-manager",
		)
		if err := m.publisher.Publish(ctx, &event); err != nil { //nolint:revive,staticcheck // intentional no-op
		}
	}

	return nil
}
