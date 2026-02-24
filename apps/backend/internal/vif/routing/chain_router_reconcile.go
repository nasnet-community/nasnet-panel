package routing

import (
	"context"
	"fmt"

	"backend/generated/ent"
	"backend/generated/ent/chainhop"
	"backend/generated/ent/routingchain"

	"backend/internal/router"

	"go.uber.org/zap"
)

// MikroTik boolean string constants for reconciliation checks.
const (
	reconcileBoolYes  = "yes"
	reconcileBoolTrue = "true"
	reconcileBoolNo   = "no"
)

// ReconcileChainRules reconciles routing chains after restart by comparing
// database state with actual router configuration.
func (cr *ChainRouter) ReconcileChainRules(ctx context.Context, routerID string) error {
	cr.mu.Lock()
	defer cr.mu.Unlock()

	cr.logger.Info("Reconciling routing chain rules", zap.String("router_id", routerID))

	chains, err := cr.store.RoutingChain.
		Query().
		Where(routingchain.RouterID(routerID)).
		WithHops(func(q *ent.ChainHopQuery) {
			q.WithInterface()
			q.Order(ent.Asc(chainhop.FieldHopOrder))
		}).
		All(ctx)
	if err != nil {
		return fmt.Errorf("failed to load chains: %w", err)
	}

	if len(chains) == 0 {
		cr.logger.Info("No routing chains to reconcile")
		return nil
	}

	existingMangleRules, existingFilterRules, err := cr.fetchExistingRules(ctx)
	if err != nil {
		return err
	}

	stats := struct {
		recreated      int
		removed        int
		verified       int
		cascadeCleaned int
	}{}

	for _, chain := range chains {
		hops := chain.Edges.Hops
		if hops == nil {
			continue
		}

		// Verify all interfaces still exist (cascade cleanup)
		allInterfacesExist := true
		for _, hop := range hops {
			if hop.Edges.Interface == nil {
				allInterfacesExist = false
				break
			}
		}

		if !allInterfacesExist {
			cr.logger.Warn("Chain references deleted interface - removing chain", zap.String("chain_id", chain.ID))
			if err := cr.removeRoutingChainInternal(ctx, chain); err != nil {
				cr.logger.Error("Failed to cascade clean chain", zap.Error(err))
			} else {
				stats.cascadeCleaned++
			}
			continue
		}

		// Check each hop's rules
		for _, hop := range hops {
			mangleComment := fmt.Sprintf("nnc-chain-%s-hop%d", chain.ID, hop.HopOrder)

			if _, exists := existingMangleRules[mangleComment]; !exists {
				cr.logger.Warn("Mangle rule missing - recreating chain", zap.String("chain_id", chain.ID), zap.Int("hop_order", hop.HopOrder))
				input := cr.convertChainToInput(chain, hops)
				if _, err := cr.CreateRoutingChain(ctx, routerID, input); err != nil {
					cr.logger.Error("Failed to recreate chain", zap.Error(err))
				} else {
					stats.recreated++
				}
				break
			}

			// Check kill switch state
			if chain.KillSwitchEnabled && hop.KillSwitchRuleID != "" {
				filterComment := fmt.Sprintf("nnc-chainks-%s-hop%d", chain.ID, hop.HopOrder)
				cr.reconcileKillSwitchState(ctx, chain, hop, existingFilterRules, filterComment)
			}

			stats.verified++
		}
	}

	// Remove orphaned rules
	cr.removeOrphanedRules(ctx, chains, existingMangleRules, existingFilterRules, &stats.removed)

	cr.logger.Info("Routing chain reconciliation complete",
		zap.Int("recreated", stats.recreated),
		zap.Int("removed", stats.removed),
		zap.Int("verified", stats.verified),
		zap.Int("cascade_cleaned", stats.cascadeCleaned))

	return nil
}

// fetchExistingRules queries the router for existing mangle and filter rules.
func (cr *ChainRouter) fetchExistingRules(ctx context.Context) (mangleRules, filterRules map[string]map[string]string, err error) {
	mangleResult, err := cr.router.ExecuteCommand(ctx, router.Command{
		Path: "/ip/firewall/mangle", Action: "print",
	})
	if err != nil {
		return nil, nil, fmt.Errorf("failed to query mangle rules: %w", err)
	}

	filterResult, err := cr.router.ExecuteCommand(ctx, router.Command{
		Path: "/ip/firewall/filter", Action: "print",
	})
	if err != nil {
		return nil, nil, fmt.Errorf("failed to query filter rules: %w", err)
	}

	existingMangleRules := make(map[string]map[string]string)
	for _, rule := range mangleResult.Data {
		if comment, ok := rule["comment"]; ok {
			existingMangleRules[comment] = rule
		}
	}

	existingFilterRules := make(map[string]map[string]string)
	for _, rule := range filterResult.Data {
		if comment, ok := rule["comment"]; ok {
			existingFilterRules[comment] = rule
		}
	}

	return existingMangleRules, existingFilterRules, nil
}

// reconcileKillSwitchState corrects kill switch rule disabled/enabled state.
func (cr *ChainRouter) reconcileKillSwitchState(
	ctx context.Context,
	chain *ent.RoutingChain,
	hop *ent.ChainHop,
	existingFilterRules map[string]map[string]string,
	filterComment string,
) {

	filterRule, exists := existingFilterRules[filterComment]
	if !exists {
		return
	}

	disabled := filterRule["disabled"]
	isDisabled := (disabled == reconcileBoolYes || disabled == reconcileBoolTrue)
	shouldBeDisabled := !chain.KillSwitchActive

	if isDisabled != shouldBeDisabled {
		cr.logger.Info("Kill switch state mismatch - correcting",
			zap.String("chain_id", chain.ID),
			zap.Int("hop_order", hop.HopOrder),
			zap.Bool("should_be_disabled", shouldBeDisabled))

		setCmd := router.Command{
			Path:   "/ip/firewall/filter",
			Action: "set",
			Args: map[string]string{
				".id":      filterRule[".id"],
				"disabled": map[bool]string{true: reconcileBoolYes, false: reconcileBoolNo}[shouldBeDisabled],
			},
		}
		if _, err := cr.router.ExecuteCommand(ctx, setCmd); err != nil {
			cr.logger.Error("Failed to correct kill switch state", zap.Error(err))
		}
	}
}

// removeOrphanedRules removes rules on the router that have no matching chain in DB.
func (cr *ChainRouter) removeOrphanedRules(
	ctx context.Context,
	chains []*ent.RoutingChain,
	existingMangleRules, existingFilterRules map[string]map[string]string,
	removedCount *int,
) {

	cr.removeOrphanedRulesByType(ctx, chains, existingMangleRules, "nnc-chain", 9, 10,
		"/ip/firewall/mangle", "orphaned mangle rule", removedCount)
	cr.removeOrphanedRulesByType(ctx, chains, existingFilterRules, "nnc-chainks", 11, 12,
		"/ip/firewall/filter", "orphaned kill switch rule", removedCount)
}

// removeOrphanedRulesByType removes orphaned rules of a specific type (mangle or filter).
func (cr *ChainRouter) removeOrphanedRulesByType(
	ctx context.Context,
	chains []*ent.RoutingChain,
	rules map[string]map[string]string,
	prefix string,
	prefixLen int,
	idOffset int,
	firewallPath string,
	ruleKind string,
	removedCount *int,
) {

	for comment, rule := range rules {
		if len(comment) <= prefixLen || comment[:prefixLen] != prefix {
			continue
		}

		if cr.commentMatchesAnyChain(comment, chains, idOffset) {
			continue
		}

		cr.logger.Info("Removing rule", zap.String("comment", comment), zap.String("type", ruleKind))

		cmd := router.Command{
			Path: firewallPath, Action: "remove",
			Args: map[string]string{".id": rule[".id"]},
		}
		if _, err := cr.router.ExecuteCommand(ctx, cmd); err != nil {
			cr.logger.Warn("Failed to remove rule", zap.Error(err), zap.String("type", ruleKind))
		} else {
			*removedCount++
		}
	}
}

// commentMatchesAnyChain checks if a rule comment matches any existing chain ID.
func (cr *ChainRouter) commentMatchesAnyChain(comment string, chains []*ent.RoutingChain, idOffset int) bool {
	for _, chain := range chains {
		if len(comment) > len(chain.ID)+idOffset && comment[idOffset:idOffset+len(chain.ID)] == chain.ID {
			return true
		}
	}
	return false
}

// convertChainToInput converts a chain entity to CreateRoutingChainInput for recreation.
func (cr *ChainRouter) convertChainToInput(chain *ent.RoutingChain, hops []*ent.ChainHop) CreateRoutingChainInput {
	input := CreateRoutingChainInput{
		DeviceID:          chain.DeviceID,
		DeviceMAC:         chain.DeviceMAC,
		DeviceIP:          chain.DeviceIP,
		DeviceName:        chain.DeviceName,
		RoutingMode:       chain.RoutingMode,
		KillSwitchEnabled: chain.KillSwitchEnabled,
		KillSwitchMode:    chain.KillSwitchMode,
		Hops:              make([]ChainHopInput, len(hops)),
	}

	for i, hop := range hops {
		input.Hops[i] = ChainHopInput{
			InterfaceID: hop.InterfaceID,
			Order:       hop.HopOrder,
		}
	}

	return input
}
