// Package isolation implements Kill Switch protection for device routing.
// The Kill Switch ensures client device privacy by blocking or redirecting traffic
// when the primary service instance becomes unhealthy.
package isolation

import (
	"context"
	"fmt"
	"time"

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
		_ = m.removeFilterRule(ctx, ruleID)
		return fmt.Errorf("failed to update database: %w", err)
	}

	// Step 6: Emit event
	if m.publisher != nil {
		event := events.NewBaseEvent(
			"killswitch.enabled",
			events.PriorityNormal,
			"kill-switch-manager",
		)
		_ = m.publisher.Publish(ctx, &event)
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
		if err := m.removeFilterRule(ctx, routing.KillSwitchRuleID); err != nil {
			return fmt.Errorf("failed to remove filter rule: %w", err)
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
		_ = m.publisher.Publish(ctx, &event)
	}

	return nil
}

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
	if err := m.enableFilterRule(ctx, routing.KillSwitchRuleID); err != nil {
		return fmt.Errorf("failed to enable filter rule: %w", err)
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
		_ = m.disableFilterRule(ctx, routing.KillSwitchRuleID)
		return fmt.Errorf("failed to update database: %w", err)
	}

	// Step 6: Emit event
	if m.publisher != nil {
		event := events.NewBaseEvent(
			events.EventTypeServiceKillSwitch,
			events.PriorityImmediate,
			"kill-switch-manager",
		)
		_ = m.publisher.Publish(ctx, &event)
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
	if err := m.disableFilterRule(ctx, routing.KillSwitchRuleID); err != nil {
		return fmt.Errorf("failed to disable filter rule: %w", err)
	}

	// Step 5: Update database active status
	_, err = m.client.DeviceRouting.
		UpdateOneID(routingID).
		SetKillSwitchActive(false).
		Save(ctx)
	if err != nil {
		// Rollback: Enable the rule we just disabled
		_ = m.enableFilterRule(ctx, routing.KillSwitchRuleID)
		return fmt.Errorf("failed to update database: %w", err)
	}

	// Step 6: Emit event
	if m.publisher != nil {
		event := events.NewBaseEvent(
			"killswitch.deactivated",
			events.PriorityNormal,
			"kill-switch-manager",
		)
		_ = m.publisher.Publish(ctx, &event)
	}

	return nil
}

// createFilterRule creates a firewall filter rule based on the kill switch mode.
// The rule is created in disabled state and can be atomically enabled later.
func (m *KillSwitchManager) createFilterRule(
	ctx context.Context,
	routing *ent.DeviceRouting,
	mode KillSwitchMode,
	fallbackInterfaceID string,
	disabled bool,
) (string, error) {
	// Base rule arguments
	args := map[string]string{
		"chain":           "forward",
		"src-mac-address": routing.MACAddress,
		"comment":         fmt.Sprintf("nnc-killswitch-%s", routing.ID),
		"place-before":    "0", // Top priority - must be first rule
	}

	// Set disabled state
	if disabled {
		args["disabled"] = "yes"
	} else {
		args["disabled"] = "no"
	}

	// Configure action based on mode
	switch mode {
	case KillSwitchModeBlockAll:
		// Drop all traffic (most secure)
		args["action"] = "drop"

	case KillSwitchModeFallbackService:
		// TODO: Implement fallback service routing
		// This requires looking up the fallback interface's routing mark
		// and applying a mark-routing action instead of drop
		return "", fmt.Errorf("fallback_service mode not yet implemented")

	case KillSwitchModeAllowDirect:
		// Allow direct internet access (accept + passthrough)
		args["action"] = "accept"

	default:
		return "", fmt.Errorf("invalid kill switch mode: %s", mode)
	}

	// Execute command
	cmd := router.Command{
		Path:   "/ip/firewall/filter",
		Action: "add",
		Args:   args,
	}

	result, err := m.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return "", fmt.Errorf("failed to execute filter add command: %w", err)
	}

	if !result.Success {
		return "", fmt.Errorf("filter rule creation failed: %v", result.Error)
	}

	if result.ID == "" {
		return "", fmt.Errorf("router did not return .id for created filter rule")
	}

	return result.ID, nil
}

// removeFilterRule removes a firewall filter rule from the router.
func (m *KillSwitchManager) removeFilterRule(ctx context.Context, ruleID string) error {
	if ruleID == "" {
		return fmt.Errorf("filter rule ID is empty")
	}

	cmd := router.Command{
		Path:   "/ip/firewall/filter",
		Action: "remove",
		ID:     ruleID,
	}

	result, err := m.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return fmt.Errorf("failed to execute filter remove command: %w", err)
	}

	if !result.Success {
		return fmt.Errorf("filter rule removal failed: %v", result.Error)
	}

	return nil
}

// enableFilterRule atomically enables a filter rule by setting disabled=no.
func (m *KillSwitchManager) enableFilterRule(ctx context.Context, ruleID string) error {
	if ruleID == "" {
		return fmt.Errorf("filter rule ID is empty")
	}

	cmd := router.Command{
		Path:   "/ip/firewall/filter",
		Action: "set",
		ID:     ruleID,
		Args: map[string]string{
			"disabled": "no",
		},
	}

	result, err := m.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return fmt.Errorf("failed to execute filter set command: %w", err)
	}

	if !result.Success {
		return fmt.Errorf("filter rule enable failed: %v", result.Error)
	}

	return nil
}

// disableFilterRule atomically disables a filter rule by setting disabled=yes.
func (m *KillSwitchManager) disableFilterRule(ctx context.Context, ruleID string) error {
	if ruleID == "" {
		return fmt.Errorf("filter rule ID is empty")
	}

	cmd := router.Command{
		Path:   "/ip/firewall/filter",
		Action: "set",
		ID:     ruleID,
		Args: map[string]string{
			"disabled": "yes",
		},
	}

	result, err := m.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return fmt.Errorf("failed to execute filter set command: %w", err)
	}

	if !result.Success {
		return fmt.Errorf("filter rule disable failed: %v", result.Error)
	}

	return nil
}

// KillSwitchReconcileResult contains statistics from a kill switch reconciliation operation.
type KillSwitchReconcileResult struct {
	OrphanedRules    int      // Rules on router but not in DB
	MissingRules     int      // Rules in DB but not on router
	StateMismatches  int      // DB says active but rule disabled (or vice versa)
	StaleActivations int      // Active kill switch but service is healthy
	Recreated        int      // Rules successfully recreated
	Removed          int      // Rules successfully removed
	Fixed            int      // State mismatches fixed
	Deactivated      int      // Stale activations deactivated
	Errors           []string // Errors encountered during reconciliation
}

// ReconcileRouter reconciles kill switch state between database and RouterOS on startup.
// This handles four scenarios:
// 1. Orphaned rules: Rule exists on router but no DB entry -> Delete rule
// 2. Missing rules: DB says enabled but no rule exists -> Recreate rule
// 3. State mismatch: DB active=true but rule disabled -> Enable rule
// 4. Stale activations: Active kill switch but service healthy -> Deactivate
//
// This method is idempotent and safe to run multiple times.
func (m *KillSwitchManager) ReconcileRouter(ctx context.Context, routerID string) (*KillSwitchReconcileResult, error) {
	result := &KillSwitchReconcileResult{}

	// Step 1: Fetch all kill switch enabled device routings from DB
	routings, err := m.client.DeviceRouting.
		Query().
		Where(
			devicerouting.RouterIDEQ(routerID),
			devicerouting.KillSwitchEnabledEQ(true),
		).
		All(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch DB records: %w", err)
	}

	// Step 2: Fetch all nnc-killswitch-* rules from router
	routerRules, err := m.fetchAllKillSwitchRules(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch router rules: %w", err)
	}

	// Create lookup maps
	dbRulesByID := make(map[string]*ent.DeviceRouting)
	for _, routing := range routings {
		if routing.KillSwitchRuleID != "" {
			dbRulesByID[routing.KillSwitchRuleID] = routing
		}
	}

	routerRulesByID := make(map[string]map[string]string)
	for _, rule := range routerRules {
		routerRulesByID[rule[".id"]] = rule
	}

	// Step 3: Handle orphaned rules (on router but not in DB)
	for ruleID := range routerRulesByID {
		if _, exists := dbRulesByID[ruleID]; !exists {
			result.OrphanedRules++
			if err := m.removeFilterRule(ctx, ruleID); err != nil {
				result.Errors = append(result.Errors, fmt.Sprintf("failed to remove orphaned rule %s: %v", ruleID, err))
			} else {
				result.Removed++
			}
		}
	}

	// Step 4: Handle missing rules and state mismatches
	for _, routing := range routings {
		routerRule, ruleExists := routerRulesByID[routing.KillSwitchRuleID]

		// Scenario 2: Missing rules (in DB but not on router)
		if !ruleExists && routing.KillSwitchRuleID != "" {
			result.MissingRules++
			// Recreate the rule
			newRuleID, err := m.createFilterRule(
				ctx,
				routing,
				KillSwitchMode(routing.KillSwitchMode),
				routing.KillSwitchFallbackInterfaceID,
				!routing.KillSwitchActive, // disabled = not active
			)
			if err != nil {
				result.Errors = append(result.Errors, fmt.Sprintf("failed to recreate rule for routing %s: %v", routing.ID, err))
				continue
			}

			// Update DB with new rule ID
			_, err = m.client.DeviceRouting.
				UpdateOneID(routing.ID).
				SetKillSwitchRuleID(newRuleID).
				Save(ctx)
			if err != nil {
				result.Errors = append(result.Errors, fmt.Sprintf("failed to update DB for routing %s: %v", routing.ID, err))
				// Try to remove the rule we just created
				_ = m.removeFilterRule(ctx, newRuleID)
			} else {
				result.Recreated++
			}
			continue
		}

		// Scenario 3: State mismatch (DB vs router disabled state)
		if ruleExists {
			routerDisabled := routerRule["disabled"] == "true" || routerRule["disabled"] == "yes"
			dbWantsEnabled := routing.KillSwitchActive

			if dbWantsEnabled && routerDisabled {
				// DB says active but rule is disabled -> enable it
				result.StateMismatches++
				if err := m.enableFilterRule(ctx, routing.KillSwitchRuleID); err != nil {
					result.Errors = append(result.Errors, fmt.Sprintf("failed to enable rule for routing %s: %v", routing.ID, err))
				} else {
					result.Fixed++
				}
			} else if !dbWantsEnabled && !routerDisabled {
				// DB says inactive but rule is enabled -> disable it
				result.StateMismatches++
				if err := m.disableFilterRule(ctx, routing.KillSwitchRuleID); err != nil {
					result.Errors = append(result.Errors, fmt.Sprintf("failed to disable rule for routing %s: %v", routing.ID, err))
				} else {
					result.Fixed++
				}
			}
		}
	}

	// Step 5: Handle stale activations (active kill switch but service is healthy)
	// Note: This requires querying service health, which we'll implement when health service is available
	// For now, we'll skip this scenario in MVP
	// TODO: Implement stale activation detection when health service API is available

	// Step 6: Emit reconciliation event
	if m.publisher != nil {
		event := events.NewBaseEvent(
			"killswitch.reconciled",
			events.PriorityNormal,
			"kill-switch-manager",
		)
		_ = m.publisher.Publish(ctx, &event)
	}

	return result, nil
}

// fetchAllKillSwitchRules fetches all firewall filter rules with nnc-killswitch-* comment pattern.
func (m *KillSwitchManager) fetchAllKillSwitchRules(ctx context.Context) ([]map[string]string, error) {
	query := router.StateQuery{
		Path:   "/ip/firewall/filter",
		Fields: []string{".id", "comment", "disabled", "src-mac-address", "action"},
		Filter: map[string]string{
			// Router adapter should support wildcard filtering
			// For now, we'll fetch all and filter in code
		},
	}

	result, err := m.routerPort.QueryState(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to query filter rules: %w", err)
	}

	// Filter for nnc-killswitch-* comments
	var filtered []map[string]string
	for _, rule := range result.Resources {
		comment, ok := rule["comment"]
		if !ok {
			continue
		}
		// Check if comment starts with "nnc-killswitch-"
		if len(comment) > 15 && comment[:15] == "nnc-killswitch-" {
			filtered = append(filtered, rule)
		}
	}

	return filtered, nil
}
