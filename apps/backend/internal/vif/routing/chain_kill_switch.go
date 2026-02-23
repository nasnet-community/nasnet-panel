package routing

import (
	"context"
	"fmt"
	"time"

	"backend/generated/ent"
	"backend/generated/ent/chainhop"
	"backend/generated/ent/routingchain"
	"backend/generated/ent/virtualinterface"

	"backend/internal/events"
	"backend/internal/router"

	"github.com/rs/zerolog/log"
)

// ChainKillSwitchListener subscribes to health events and activates kill switches
// when any hop in a chain becomes unhealthy.
type ChainKillSwitchListener struct {
	router      router.RouterPort
	store       *ent.Client
	eventBus    events.EventBus
	publisher   *events.Publisher
	chainRouter *ChainRouter
}

// NewChainKillSwitchListener creates a new kill switch listener.
func NewChainKillSwitchListener(
	routerPort router.RouterPort,
	store *ent.Client,
	eventBus events.EventBus,
	chainRouter *ChainRouter,
) *ChainKillSwitchListener {

	listener := &ChainKillSwitchListener{
		router:      routerPort,
		store:       store,
		eventBus:    eventBus,
		chainRouter: chainRouter,
	}

	if eventBus != nil {
		listener.publisher = events.NewPublisher(eventBus, "chain-kill-switch")
	}

	return listener
}

// Start subscribes to health events and processes them.
func (l *ChainKillSwitchListener) Start(ctx context.Context) error {
	if l.eventBus == nil {
		return fmt.Errorf("event bus is nil")
	}

	if err := l.eventBus.Subscribe(events.EventTypeHealthChanged, func(ctx context.Context, event events.Event) error {
		healthEvt, ok := event.(*events.FeatureHealthChangedEvent)
		if !ok {
			return nil
		}
		return l.handleHealthChanged(ctx, healthEvt)
	}); err != nil {
		return fmt.Errorf("failed to subscribe to health events: %w", err)
	}

	log.Info().Msg("Chain kill switch listener started - subscribed to health.changed events")
	return nil
}

// handleHealthChanged processes a health changed event and activates/deactivates
// kill switches for any chains whose hops use the affected service instance.
func (l *ChainKillSwitchListener) handleHealthChanged(ctx context.Context, event *events.FeatureHealthChangedEvent) error {
	if l.chainRouter == nil {
		return nil
	}

	// Find the VirtualInterface associated with this instance
	iface, err := l.store.VirtualInterface.
		Query().
		Where(virtualinterface.InstanceID(event.InstanceID)).
		Only(ctx)
	if err != nil {
		// No virtual interface for this instance - not chain-related, skip
		return nil //nolint:nilerr // intentional: no VIF means not chain-related, skip gracefully
	}

	// Find all chain hops using this interface
	hops, err := l.store.ChainHop.
		Query().
		Where(chainhop.InterfaceID(iface.ID)).
		WithChain().
		All(ctx)
	if err != nil {
		return nil //nolint:nilerr // intentional: skip on error
	}
	if len(hops) == 0 {
		return nil
	}

	isHealthy := event.CurrentState == "healthy"

	// Deduplicate chain IDs
	seen := make(map[string]bool)
	for _, hop := range hops {
		if hop.Edges.Chain == nil {
			continue
		}
		chain := hop.Edges.Chain
		if seen[chain.ID] {
			continue
		}
		seen[chain.ID] = true

		if !isHealthy {
			log.Warn().
				Str("instance_id", event.InstanceID).
				Str("chain_id", chain.ID).
				Str("current_state", event.CurrentState).
				Msg("Health event: hop unhealthy, activating chain kill switch")
			if err := l.chainRouter.ActivateChainKillSwitch(ctx, chain.ID, hop.HopOrder); err != nil {
				log.Error().Err(err).Str("chain_id", chain.ID).Msg("Failed to activate chain kill switch")
			}
		} else {
			log.Info().
				Str("instance_id", event.InstanceID).
				Str("chain_id", chain.ID).
				Msg("Health event: hop healthy, attempting kill switch deactivation")
			if err := l.chainRouter.DeactivateChainKillSwitch(ctx, chain.ID); err != nil {
				log.Debug().Err(err).Str("chain_id", chain.ID).Msg("Kill switch deactivation skipped (other hops may still be unhealthy)")
			}
		}
	}

	return nil
}

// ActivateChainKillSwitch enables ALL kill switch filter rules for a chain
// when ANY hop fails. This blocks all traffic from the device.
func (cr *ChainRouter) ActivateChainKillSwitch(ctx context.Context, chainID string, failedHopOrder int) error {
	log.Warn().
		Str("chain_id", chainID).
		Int("failed_hop", failedHopOrder).
		Msg("Activating chain kill switch")

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

	if !chain.KillSwitchEnabled {
		log.Info().Msg("Kill switch not enabled for this chain")
		return nil
	}

	hops := chain.Edges.Hops
	enabledCount := 0

	for _, hop := range hops {
		if hop.KillSwitchRuleID == "" {
			continue
		}

		enableCmd := router.Command{
			Path:   "/ip/firewall/filter",
			Action: "set",
			Args: map[string]string{
				".id":      hop.KillSwitchRuleID,
				"disabled": "no",
			},
		}

		if _, err := cr.router.ExecuteCommand(ctx, enableCmd); err != nil {
			log.Error().Err(err).Int("hop_order", hop.HopOrder).Msg("Failed to enable kill switch rule")
			return fmt.Errorf("failed to enable kill switch for hop %d: %w", hop.HopOrder, err)
		}

		if err := cr.store.ChainHop.
			UpdateOneID(hop.ID).
			SetKillSwitchActive(true).
			Exec(ctx); err != nil {
			log.Warn().Err(err).Int("hop_order", hop.HopOrder).Msg("Failed to update hop kill switch status")
		}

		enabledCount++
	}

	now := time.Now()
	if err := cr.store.RoutingChain.
		UpdateOneID(chain.ID).
		SetKillSwitchActive(true).
		SetKillSwitchActivatedAt(now).
		Exec(ctx); err != nil {
		log.Warn().Err(err).Msg("Failed to update chain kill switch status")
	}

	if cr.publisher != nil {
		event := events.NewGenericEvent(
			events.EventTypeChainHopFailed,
			events.PriorityImmediate,
			"chain-kill-switch",
			map[string]interface{}{
				"router_id":        chain.RouterID,
				"chain_id":         chain.ID,
				"device_id":        chain.DeviceID,
				"failed_hop":       failedHopOrder,
				"rules_enabled":    enabledCount,
				"kill_switch_mode": string(chain.KillSwitchMode),
			},
		)
		if err := cr.publisher.Publish(ctx, event); err != nil {
			log.Warn().Err(err).Msg("Failed to publish chain hop failed event")
		}
	}

	log.Warn().Str("chain_id", chain.ID).Int("rules_enabled", enabledCount).Msg("Chain kill switch activated - all traffic blocked")
	return nil
}

// DeactivateChainKillSwitch disables all kill switch filter rules for a chain
// ONLY if ALL hops are healthy again.
func (cr *ChainRouter) DeactivateChainKillSwitch(ctx context.Context, chainID string) error {
	log.Info().Str("chain_id", chainID).Msg("Attempting to deactivate chain kill switch")

	chain, err := cr.store.RoutingChain.
		Query().
		Where(routingchain.ID(chainID)).
		WithHops(func(q *ent.ChainHopQuery) {
			q.WithInterface()
			q.Order(ent.Asc(chainhop.FieldHopOrder))
		}).
		Only(ctx)
	if err != nil {
		return fmt.Errorf("failed to load chain: %w", err)
	}

	if !chain.KillSwitchActive {
		log.Info().Msg("Kill switch not active for this chain")
		return nil
	}

	// Check each hop's VirtualInterface status to determine if all hops are healthy.
	allHealthy := cr.checkHopsHealth(ctx, chain)

	if !allHealthy {
		log.Warn().Msg("Not all hops are healthy - kill switch remains active")
		return fmt.Errorf("cannot deactivate kill switch: not all hops are healthy")
	}

	hops := chain.Edges.Hops
	disabledCount, err := cr.disableHopRules(ctx, hops)
	if err != nil {
		return err
	}

	if err := cr.store.RoutingChain.
		UpdateOneID(chain.ID).
		SetKillSwitchActive(false).
		ClearKillSwitchActivatedAt().
		Exec(ctx); err != nil {
		log.Warn().Err(err).Msg("Failed to update chain kill switch status")
	}

	if cr.publisher != nil {
		event := events.NewGenericEvent(
			events.EventTypeRoutingChainUpdated,
			events.PriorityNormal,
			"chain-kill-switch",
			map[string]interface{}{
				"router_id":             chain.RouterID,
				"chain_id":              chain.ID,
				"device_id":             chain.DeviceID,
				"rules_disabled":        disabledCount,
				"kill_switch_recovered": true,
			},
		)
		if err := cr.publisher.Publish(ctx, event); err != nil {
			log.Warn().Err(err).Msg("Failed to publish chain updated event")
		}
	}

	log.Info().Str("chain_id", chain.ID).Int("rules_disabled", disabledCount).Msg("Chain kill switch deactivated - traffic restored")
	return nil
}

// checkHopsHealth checks if all hops in the chain are healthy.
// A hop is considered healthy when its interface Status is "active" and
// GatewayStatus is "running". The hops are loaded with WithInterface() in DeactivateChainKillSwitch.
func (cr *ChainRouter) checkHopsHealth(ctx context.Context, chain *ent.RoutingChain) bool {
	for _, hop := range chain.Edges.Hops {
		iface := hop.Edges.Interface
		if iface == nil {
			// Eager load failed; fall back to a direct query
			var queryErr error
			iface, queryErr = cr.store.VirtualInterface.
				Query().
				Where(virtualinterface.ID(hop.InterfaceID)).
				Only(ctx)
			if queryErr != nil {
				log.Warn().Err(queryErr).Str("interface_id", hop.InterfaceID).Msg("Failed to query hop interface status")
				return false
			}
		}
		if iface.Status != virtualinterface.StatusActive || iface.GatewayStatus != virtualinterface.GatewayStatusRunning {
			log.Debug().
				Str("interface_id", hop.InterfaceID).
				Str("status", string(iface.Status)).
				Str("gateway_status", string(iface.GatewayStatus)).
				Msg("Hop interface not fully healthy")
			return false
		}
	}
	return true
}

// disableHopRules disables all kill switch filter rules for a list of hops.
func (cr *ChainRouter) disableHopRules(ctx context.Context, hops []*ent.ChainHop) (int, error) {
	disabledCount := 0
	for _, hop := range hops {
		if hop.KillSwitchRuleID == "" {
			continue
		}

		disableCmd := router.Command{
			Path:   "/ip/firewall/filter",
			Action: "set",
			Args: map[string]string{
				".id":      hop.KillSwitchRuleID,
				"disabled": "yes",
			},
		}

		if _, err := cr.router.ExecuteCommand(ctx, disableCmd); err != nil {
			log.Error().Err(err).Int("hop_order", hop.HopOrder).Msg("Failed to disable kill switch rule")
			return 0, fmt.Errorf("failed to disable kill switch for hop %d: %w", hop.HopOrder, err)
		}

		if err := cr.store.ChainHop.
			UpdateOneID(hop.ID).
			SetKillSwitchActive(false).
			Exec(ctx); err != nil {
			log.Warn().Err(err).Int("hop_order", hop.HopOrder).Msg("Failed to update hop kill switch status")
		}

		disabledCount++
	}
	return disabledCount, nil
}
