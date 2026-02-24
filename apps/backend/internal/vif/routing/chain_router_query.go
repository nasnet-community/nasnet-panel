package routing

import (
	"context"
	"fmt"

	"backend/generated/ent"
	"backend/generated/ent/chainhop"
	"backend/generated/ent/routingchain"

	"go.uber.org/zap"
)

// GetRoutingChain retrieves a routing chain by device ID.
func (cr *ChainRouter) GetRoutingChain(ctx context.Context, routerID, deviceID string) (*ent.RoutingChain, error) {
	chain, err := cr.store.RoutingChain.
		Query().
		Where(
			routingchain.RouterID(routerID),
			routingchain.DeviceID(deviceID),
		).
		WithHops(func(q *ent.ChainHopQuery) {
			q.WithInterface()
			q.Order(ent.Asc(chainhop.FieldHopOrder))
		}).
		Only(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to load chain: %w", err)
	}

	return chain, nil
}

// ListRoutingChains lists all routing chains for a router.
func (cr *ChainRouter) ListRoutingChains(ctx context.Context, routerID string) ([]*ent.RoutingChain, error) {
	chains, err := cr.store.RoutingChain.
		Query().
		Where(routingchain.RouterID(routerID)).
		WithHops(func(q *ent.ChainHopQuery) {
			q.WithInterface()
			q.Order(ent.Asc(chainhop.FieldHopOrder))
		}).
		All(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to list chains: %w", err)
	}

	return chains, nil
}

// RemoveChainsByInterface removes all routing chains that reference a given interface.
// This implements cascade cleanup when a VirtualInterface is deleted (Story 8.2 teardown).
func (cr *ChainRouter) RemoveChainsByInterface(ctx context.Context, interfaceID string) error {
	cr.mu.Lock()
	defer cr.mu.Unlock()

	cr.logger.Info("Removing chains referencing interface", zap.String("interface_id", interfaceID))

	hops, err := cr.store.ChainHop.
		Query().
		Where(chainhop.InterfaceID(interfaceID)).
		All(ctx)
	if err != nil {
		return fmt.Errorf("failed to query hops: %w", err)
	}

	if len(hops) == 0 {
		cr.logger.Info("No chains reference this interface")
		return nil
	}

	chainIDs := make(map[string]bool)
	for _, hop := range hops {
		chainIDs[hop.ChainID] = true
	}

	for chainID := range chainIDs {
		chain, err := cr.store.RoutingChain.
			Query().
			Where(routingchain.ID(chainID)).
			WithHops(func(q *ent.ChainHopQuery) {
				q.Order(ent.Asc(chainhop.FieldHopOrder))
			}).
			Only(ctx)
		if err != nil {
			cr.logger.Warn("Failed to load chain for removal", zap.Error(err), zap.String("chain_id", chainID))
			continue
		}

		if err := cr.removeRoutingChainInternal(ctx, chain); err != nil {
			cr.logger.Warn("Failed to remove chain", zap.Error(err), zap.String("chain_id", chainID))
		}
	}

	cr.logger.Info("Removed chains referencing interface", zap.Int("chain_count", len(chainIDs)))

	return nil
}
