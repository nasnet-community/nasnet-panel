// Package isolation implements Kill Switch protection for device routing.
// The Kill Switch ensures client device privacy by blocking or redirecting traffic
// when the primary service instance becomes unhealthy.
package isolation

import (
	"context"
	"fmt"

	"backend/generated/ent"
	"backend/generated/ent/devicerouting"

	"backend/internal/events"
	"backend/internal/router"
)

// KillSwitchManager manages Kill Switch firewall rules for device routing protection.
// It pre-creates disabled firewall filter rules that can be atomically enabled when
// a service instance fails health checks.
type KillSwitchManager struct {
	routerPort router.RouterPort
	client     *ent.Client
	eventBus   events.EventBus
	publisher  *events.Publisher
}

// NewKillSwitchManager creates a new Kill Switch manager instance.
func NewKillSwitchManager(
	routerPort router.RouterPort,
	client *ent.Client,
	eventBus events.EventBus,
	publisher *events.Publisher,
) *KillSwitchManager {

	return &KillSwitchManager{
		routerPort: routerPort,
		client:     client,
		eventBus:   eventBus,
		publisher:  publisher,
	}
}

// KillSwitchMode defines the behavior when kill switch is activated.
type KillSwitchMode string

const (
	// KillSwitchModeBlockAll drops all traffic from the device (default, most secure)
	KillSwitchModeBlockAll KillSwitchMode = "block_all"

	// KillSwitchModeFallbackService routes traffic to a fallback service instance
	KillSwitchModeFallbackService KillSwitchMode = "fallback_service"

	// KillSwitchModeAllowDirect allows direct internet access (least secure)
	KillSwitchModeAllowDirect KillSwitchMode = "allow_direct"
)

// Enable creates a DISABLED firewall filter rule for the kill switch.
// The rule is pre-created but disabled, ready for atomic activation.
//
// Flow:
// 1. Validate parameters (mode, fallback interface if needed)
// 2. Create disabled firewall filter rule on router
// 3. Update DeviceRouting record with rule ID and configuration
// 4. Emit event
//
// Returns error if the routing record doesn't exist or rule creation fails.
func (m *KillSwitchManager) Enable(
	ctx context.Context,
	routingID string,
	mode KillSwitchMode,
	fallbackInterfaceID string,
) error {

	// Step 1: Fetch DeviceRouting record
	routing, err := m.client.DeviceRouting.Get(ctx, routingID)
	if err != nil {
		return fmt.Errorf("failed to fetch routing record: %w", err)
	}

	// Step 2: Validate parameters
	if mode == KillSwitchModeFallbackService && fallbackInterfaceID == "" {
		return fmt.Errorf("fallback_service mode requires fallback_interface_id")
	}

	// Step 3: Check if kill switch is already enabled
	if routing.KillSwitchEnabled {
		return fmt.Errorf("kill switch already enabled for routing %s", routingID)
	}

	// Step 4: Create disabled firewall filter rule
	ruleID, err := m.createFilterRule(ctx, routing, mode, fallbackInterfaceID, true)
	if err != nil {
		return fmt.Errorf("failed to create filter rule: %w", err)
	}

	// Step 5: Update database with kill switch configuration
	_, err = m.client.DeviceRouting.
		UpdateOneID(routingID).
		SetKillSwitchEnabled(true).
		SetKillSwitchMode(devicerouting.KillSwitchMode(mode)).
		SetKillSwitchRuleID(ruleID).
		SetNillableKillSwitchFallbackInterfaceID(
			func() *string {
				if fallbackInterfaceID == "" {
					return nil
				}
				return &fallbackInterfaceID
			}(),
		).
		Save(ctx)
	if err != nil {
		// Rollback: Remove the rule we just created
		_ = m.removeFilterRule(ctx, ruleID) //nolint:errcheck // best-effort cleanup
		return fmt.Errorf("failed to update database: %w", err)
	}

	// Step 6: Emit event
	if m.publisher != nil {
		event := events.NewBaseEvent(
			"killswitch.enabled",
			events.PriorityNormal,
			"kill-switch-manager",
		)
		if err := m.publisher.Publish(ctx, &event); err != nil { //nolint:revive,staticcheck // intentional no-op
		}
	}

	return nil
}

// Disable removes the kill switch protection and deletes the firewall rule.
//
// Flow:
// 1. Fetch DeviceRouting record
// 2. Remove firewall filter rule from router
// 3. Clear kill switch fields in database
// 4. Emit event
//
// Returns error if the routing record doesn't exist or rule removal fails.
func (m *KillSwitchManager) Disable(ctx context.Context, routingID string) error {
	// Step 1: Fetch DeviceRouting record
	routing, err := m.client.DeviceRouting.Get(ctx, routingID)
	if err != nil {
		return fmt.Errorf("failed to fetch routing record: %w", err)
	}

	// Step 2: Check if kill switch is enabled
	if !routing.KillSwitchEnabled {
		return fmt.Errorf("kill switch not enabled for routing %s", routingID)
	}

	// Step 3: Remove firewall filter rule if it exists
	if routing.KillSwitchRuleID != "" {
		if rmErr := m.removeFilterRule(ctx, routing.KillSwitchRuleID); rmErr != nil {
			return fmt.Errorf("failed to remove filter rule: %w", rmErr)
		}
	}

	// Step 4: Clear kill switch fields in database
	_, err = m.client.DeviceRouting.
		UpdateOneID(routingID).
		SetKillSwitchEnabled(false).
		ClearKillSwitchMode().
		SetKillSwitchRuleID("").
		SetKillSwitchActive(false).
		ClearKillSwitchActivatedAt().
		ClearKillSwitchFallbackInterfaceID().
		Save(ctx)
	if err != nil {
		return fmt.Errorf("failed to update database: %w", err)
	}

	// Step 5: Emit event
	if m.publisher != nil {
		event := events.NewBaseEvent(
			"killswitch.disabled",
			events.PriorityNormal,
			"kill-switch-manager",
		)
		if err := m.publisher.Publish(ctx, &event); err != nil { //nolint:revive,staticcheck // intentional no-op
		}
	}

	return nil
}
