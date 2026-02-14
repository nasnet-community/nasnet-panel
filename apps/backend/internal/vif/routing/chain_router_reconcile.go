package routing

import (
	"context"
	"fmt"

	"backend/generated/ent"
	"backend/generated/ent/chainhop"
	"backend/generated/ent/routingchain"
	"backend/internal/router"

	"github.com/rs/zerolog/log"
)

// ReconcileChainRules reconciles routing chains after restart by comparing
// database state with actual router configuration.
func (cr *ChainRouter) ReconcileChainRules(ctx context.Context, routerID string) error {
	cr.mu.Lock()
	defer cr.mu.Unlock()

	log.Info().Str("router_id", routerID).Msg("Reconciling routing chain rules")

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
		log.Info().Msg("No routing chains to reconcile")
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
			log.Warn().Str("chain_id", chain.ID).Msg("Chain references deleted interface - removing chain")
			if err := cr.removeRoutingChainInternal(ctx, chain); err != nil {
				log.Error().Err(err).Msg("Failed to cascade clean chain")
			} else {
				stats.cascadeCleaned++
			}
			continue
		}

		// Check each hop's rules
		for _, hop := range hops {
			mangleComment := fmt.Sprintf("nnc-chain-%s-hop%d", chain.ID, hop.HopOrder)

			if _, exists := existingMangleRules[mangleComment]; !exists {
				log.Warn().Str("chain_id", chain.ID).Int("hop_order", hop.HopOrder).Msg("Mangle rule missing - recreating chain")
				input := cr.convertChainToInput(chain, hops)
				if _, err := cr.CreateRoutingChain(ctx, routerID, input); err != nil {
					log.Error().Err(err).Msg("Failed to recreate chain")
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

	log.Info().
		Int("recreated", stats.recreated).
		Int("removed", stats.removed).
		Int("verified", stats.verified).
		Int("cascade_cleaned", stats.cascadeCleaned).
		Msg("Routing chain reconciliation complete")

	return nil
}

// fetchExistingRules queries the router for existing mangle and filter rules.
func (cr *ChainRouter) fetchExistingRules(ctx context.Context) (map[string]map[string]string, map[string]map[string]string, error) {
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
	isDisabled := (disabled == "yes" || disabled == "true")
	shouldBeDisabled := !chain.KillSwitchActive

	if isDisabled != shouldBeDisabled {
		log.Info().
			Str("chain_id", chain.ID).
			Int("hop_order", hop.HopOrder).
			Bool("should_be_disabled", shouldBeDisabled).
			Msg("Kill switch state mismatch - correcting")

		setCmd := router.Command{
			Path:   "/ip/firewall/filter",
			Action: "set",
			Args: map[string]string{
				".id":      filterRule[".id"],
				"disabled": map[bool]string{true: "yes", false: "no"}[shouldBeDisabled],
			},
		}
		if _, err := cr.router.ExecuteCommand(ctx, setCmd); err != nil {
			log.Error().Err(err).Msg("Failed to correct kill switch state")
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
	for comment := range existingMangleRules {
		if len(comment) > 9 && comment[:9] == "nnc-chain" {
			found := false
			for _, chain := range chains {
				if len(comment) > len(chain.ID)+10 && comment[10:10+len(chain.ID)] == chain.ID {
					found = true
					break
				}
			}

			if !found {
				log.Info().Str("comment", comment).Msg("Removing orphaned mangle rule")
				ruleID := existingMangleRules[comment][".id"]
				cmd := router.Command{
					Path: "/ip/firewall/mangle", Action: "remove",
					Args: map[string]string{".id": ruleID},
				}
				if _, err := cr.router.ExecuteCommand(ctx, cmd); err != nil {
					log.Warn().Err(err).Msg("Failed to remove orphaned mangle rule")
				} else {
					*removedCount++
				}
			}
		}
	}

	for comment := range existingFilterRules {
		if len(comment) > 11 && comment[:11] == "nnc-chainks" {
			found := false
			for _, chain := range chains {
				if len(comment) > len(chain.ID)+12 && comment[12:12+len(chain.ID)] == chain.ID {
					found = true
					break
				}
			}

			if !found {
				log.Info().Str("comment", comment).Msg("Removing orphaned kill switch rule")
				ruleID := existingFilterRules[comment][".id"]
				cmd := router.Command{
					Path: "/ip/firewall/filter", Action: "remove",
					Args: map[string]string{".id": ruleID},
				}
				if _, err := cr.router.ExecuteCommand(ctx, cmd); err != nil {
					log.Warn().Err(err).Msg("Failed to remove orphaned filter rule")
				} else {
					*removedCount++
				}
			}
		}
	}
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
