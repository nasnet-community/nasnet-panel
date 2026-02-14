package routing

import (
	"context"
	"fmt"

	"backend/generated/ent"
	"backend/generated/ent/chainhop"
	"backend/generated/ent/routingchain"
	"backend/internal/events"
	"backend/internal/router"

	"github.com/rs/zerolog/log"
)

// RemoveRoutingChain removes a routing chain and all its router rules.
func (cr *ChainRouter) RemoveRoutingChain(ctx context.Context, chainID string) error {
	cr.mu.Lock()
	defer cr.mu.Unlock()

	log.Info().Str("chain_id", chainID).Msg("Removing routing chain")

	chain, err := cr.store.RoutingChain.
		Query().
		Where(routingchain.ID(chainID)).
		WithHops(func(q *ent.ChainHopQuery) {
			q.Order(ent.Asc(chainhop.FieldHopOrder))
		}).
		Only(ctx)
	if err != nil {
		return fmt.Errorf("failed to load chain: %w", err)
	}

	return cr.removeRoutingChainInternal(ctx, chain)
}

// removeRoutingChainInternal removes a chain (internal implementation without lock).
func (cr *ChainRouter) removeRoutingChainInternal(ctx context.Context, chain *ent.RoutingChain) error {
	hops := chain.Edges.Hops
	if hops == nil {
		var err error
		hops, err = chain.QueryHops().
			Order(ent.Asc(chainhop.FieldHopOrder)).
			All(ctx)
		if err != nil {
			return fmt.Errorf("failed to load hops: %w", err)
		}
	}

	// Remove hops in reverse order (hop-N to hop-1)
	for i := len(hops) - 1; i >= 0; i-- {
		hop := hops[i]

		log.Info().
			Int("hop_order", hop.HopOrder).
			Str("routing_mark", hop.RoutingMark).
			Msg("Removing hop rules")

		cr.removeHopRules(ctx, hop)
	}

	// Delete RoutingChain record
	if err := cr.store.RoutingChain.DeleteOneID(chain.ID).Exec(ctx); err != nil {
		log.Warn().Err(err).Msg("Failed to delete chain record")
	}

	// Emit event
	if cr.publisher != nil {
		event := events.NewGenericEvent(
			events.EventTypeRoutingChainRemoved,
			events.PriorityNormal,
			"chain-router",
			map[string]interface{}{
				"chain_id":  chain.ID,
				"device_id": chain.DeviceID,
				"router_id": chain.RouterID,
			},
		)
		if err := cr.publisher.Publish(ctx, event); err != nil {
			log.Warn().Err(err).Msg("Failed to publish chain removed event")
		}
	}

	log.Info().Str("chain_id", chain.ID).Msg("Routing chain removed successfully")
	return nil
}

// removeHopRules removes all router rules for a single hop.
func (cr *ChainRouter) removeHopRules(ctx context.Context, hop *ent.ChainHop) {
	// Remove kill switch filter rule (if exists)
	if hop.KillSwitchRuleID != "" {
		removeKSCmd := router.Command{
			Path:   "/ip/firewall/filter",
			Action: "remove",
			Args:   map[string]string{".id": hop.KillSwitchRuleID},
		}
		if _, err := cr.router.ExecuteCommand(ctx, removeKSCmd); err != nil {
			log.Warn().Err(err).Int("hop_order", hop.HopOrder).Msg("Failed to remove kill switch rule")
		}
	}

	// Remove route
	if hop.RouteID != "" {
		removeRouteCmd := router.Command{
			Path:   "/ip/route",
			Action: "remove",
			Args:   map[string]string{".id": hop.RouteID},
		}
		if _, err := cr.router.ExecuteCommand(ctx, removeRouteCmd); err != nil {
			log.Warn().Err(err).Int("hop_order", hop.HopOrder).Msg("Failed to remove route")
		}
	}

	// Remove routing table
	removeTableCmd := router.Command{
		Path:   "/routing/table",
		Action: "remove",
		Args:   map[string]string{"name": hop.RouteTableName},
	}
	if _, err := cr.router.ExecuteCommand(ctx, removeTableCmd); err != nil {
		log.Warn().Err(err).Int("hop_order", hop.HopOrder).Msg("Failed to remove routing table")
	}

	// Remove mangle rule
	if hop.MangleRuleID != "" {
		removeMangleCmd := router.Command{
			Path:   "/ip/firewall/mangle",
			Action: "remove",
			Args:   map[string]string{".id": hop.MangleRuleID},
		}
		if _, err := cr.router.ExecuteCommand(ctx, removeMangleCmd); err != nil {
			log.Warn().Err(err).Int("hop_order", hop.HopOrder).Msg("Failed to remove mangle rule")
		}
	}

	// Delete ChainHop record
	if err := cr.store.ChainHop.DeleteOneID(hop.ID).Exec(ctx); err != nil {
		log.Warn().Err(err).Int("hop_order", hop.HopOrder).Msg("Failed to delete hop record")
	}
}

// UpdateRoutingChain updates an existing routing chain by removing the old one
// and creating a new one with the updated configuration.
func (cr *ChainRouter) UpdateRoutingChain(
	ctx context.Context,
	chainID string,
	input CreateRoutingChainInput,
) (*ent.RoutingChain, error) {
	log.Info().Str("chain_id", chainID).Msg("Updating routing chain")

	existingChain, err := cr.store.RoutingChain.Get(ctx, chainID)
	if err != nil {
		return nil, fmt.Errorf("failed to load existing chain: %w", err)
	}

	routerID := existingChain.RouterID

	if err := cr.RemoveRoutingChain(ctx, chainID); err != nil {
		return nil, fmt.Errorf("failed to remove existing chain: %w", err)
	}

	newChain, err := cr.CreateRoutingChain(ctx, routerID, input)
	if err != nil {
		return nil, fmt.Errorf("failed to create updated chain: %w", err)
	}

	// Emit event
	if cr.publisher != nil {
		event := events.NewGenericEvent(
			events.EventTypeRoutingChainUpdated,
			events.PriorityNormal,
			"chain-router",
			map[string]interface{}{
				"chain_id":  newChain.ID,
				"device_id": input.DeviceID,
				"hop_count": len(input.Hops),
				"router_id": routerID,
			},
		)
		if err := cr.publisher.Publish(ctx, event); err != nil {
			log.Warn().Err(err).Msg("Failed to publish chain updated event")
		}
	}

	return newChain, nil
}
