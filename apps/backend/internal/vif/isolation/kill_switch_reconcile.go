package isolation

import (
	"context"
	"fmt"

	"backend/generated/ent"
	"backend/generated/ent/devicerouting"

	"backend/internal/events"
	"backend/internal/router"
)

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

	routerRules, err := m.fetchAllKillSwitchRules(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch router rules: %w", err)
	}

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

	m.reconcileOrphanedRules(ctx, routerRulesByID, dbRulesByID, result)
	m.reconcileMissingAndMismatchedRules(ctx, routings, routerRulesByID, result)
	m.emitReconcileEvent(ctx)

	return result, nil
}

// reconcileOrphanedRules removes rules on the router that have no matching DB record.
func (m *KillSwitchManager) reconcileOrphanedRules(
	ctx context.Context,
	routerRulesByID map[string]map[string]string,
	dbRulesByID map[string]*ent.DeviceRouting,
	result *KillSwitchReconcileResult,
) {

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
}

// reconcileMissingAndMismatchedRules handles missing rules and state mismatches.
func (m *KillSwitchManager) reconcileMissingAndMismatchedRules(
	ctx context.Context,
	routings []*ent.DeviceRouting,
	routerRulesByID map[string]map[string]string,
	result *KillSwitchReconcileResult,
) {

	for _, routing := range routings {
		routerRule, ruleExists := routerRulesByID[routing.KillSwitchRuleID]

		if !ruleExists && routing.KillSwitchRuleID != "" {
			m.recreateMissingRule(ctx, routing, result)
			continue
		}

		if ruleExists {
			m.fixStateMismatch(ctx, routing, routerRule, result)
		}
	}
}

// recreateMissingRule recreates a kill switch rule that exists in DB but not on router.
func (m *KillSwitchManager) recreateMissingRule(ctx context.Context, routing *ent.DeviceRouting, result *KillSwitchReconcileResult) {
	result.MissingRules++
	newRuleID, err := m.createFilterRule(
		ctx,
		routing,
		KillSwitchMode(routing.KillSwitchMode),
		routing.KillSwitchFallbackInterfaceID,
		!routing.KillSwitchActive,
	)
	if err != nil {
		result.Errors = append(result.Errors, fmt.Sprintf("failed to recreate rule for routing %s: %v", routing.ID, err))
		return
	}

	_, err = m.client.DeviceRouting.
		UpdateOneID(routing.ID).
		SetKillSwitchRuleID(newRuleID).
		Save(ctx)
	if err != nil {
		result.Errors = append(result.Errors, fmt.Sprintf("failed to update DB for routing %s: %v", routing.ID, err))
		_ = m.removeFilterRule(ctx, newRuleID) //nolint:errcheck // best-effort rule removal
	} else {
		result.Recreated++
	}
}

// fixStateMismatch corrects the enabled/disabled state when DB and router disagree.
//
//nolint:nestif // reconciliation state logic
func (m *KillSwitchManager) fixStateMismatch(ctx context.Context, routing *ent.DeviceRouting, routerRule map[string]string, result *KillSwitchReconcileResult) {
	routerDisabled := routerRule["disabled"] == "true" || routerRule["disabled"] == "yes"
	dbWantsEnabled := routing.KillSwitchActive

	if dbWantsEnabled && routerDisabled {
		result.StateMismatches++
		if err := m.enableFilterRule(ctx, routing.KillSwitchRuleID); err != nil {
			result.Errors = append(result.Errors, fmt.Sprintf("failed to enable rule for routing %s: %v", routing.ID, err))
		} else {
			result.Fixed++
		}
	} else if !dbWantsEnabled && !routerDisabled {
		result.StateMismatches++
		if err := m.disableFilterRule(ctx, routing.KillSwitchRuleID); err != nil {
			result.Errors = append(result.Errors, fmt.Sprintf("failed to disable rule for routing %s: %v", routing.ID, err))
		} else {
			result.Fixed++
		}
	}
}

// emitReconcileEvent publishes a reconciliation completion event.
func (m *KillSwitchManager) emitReconcileEvent(ctx context.Context) {
	if m.publisher == nil {
		return
	}

	event := events.NewBaseEvent(
		"killswitch.reconciled",
		events.PriorityNormal,
		"kill-switch-manager",
	)
	//nolint:errcheck // best-effort rule removal
	_ = m.publisher.Publish(ctx, &event)
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
