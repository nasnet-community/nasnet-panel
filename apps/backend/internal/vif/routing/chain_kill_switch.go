package routing

import (
	"context"
	"fmt"
	"time"

	"backend/generated/ent"
	"backend/generated/ent/chainhop"
	"backend/generated/ent/routingchain"
	"backend/internal/events"
	"backend/internal/router"

	"github.com/rs/zerolog/log"
)

// ChainKillSwitchListener subscribes to health events and activates kill switches
// when any hop in a chain becomes unhealthy.
type ChainKillSwitchListener struct {
	router    router.RouterPort
	store     *ent.Client
	eventBus  events.EventBus
	publisher *events.Publisher
}

// NewChainKillSwitchListener creates a new kill switch listener.
func NewChainKillSwitchListener(
	routerPort router.RouterPort,
	store *ent.Client,
	eventBus events.EventBus,
) *ChainKillSwitchListener {
	listener := &ChainKillSwitchListener{
		router:   routerPort,
		store:    store,
		eventBus: eventBus,
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

	log.Info().Msg("Chain kill switch listener started (health events pending Story 8.6)")
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

	log.Info().Msg("Health status verification not yet implemented (Story 8.6)")
	allHealthy := true

	if !allHealthy {
		log.Warn().Msg("Not all hops are healthy - kill switch remains active")
		return fmt.Errorf("cannot deactivate kill switch: not all hops are healthy")
	}

	hops := chain.Edges.Hops
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
			return fmt.Errorf("failed to disable kill switch for hop %d: %w", hop.HopOrder, err)
		}

		if err := cr.store.ChainHop.
			UpdateOneID(hop.ID).
			SetKillSwitchActive(false).
			Exec(ctx); err != nil {
			log.Warn().Err(err).Int("hop_order", hop.HopOrder).Msg("Failed to update hop kill switch status")
		}

		disabledCount++
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
				"router_id":              chain.RouterID,
				"chain_id":               chain.ID,
				"device_id":              chain.DeviceID,
				"rules_disabled":         disabledCount,
				"kill_switch_recovered":  true,
			},
		)
		if err := cr.publisher.Publish(ctx, event); err != nil {
			log.Warn().Err(err).Msg("Failed to publish chain updated event")
		}
	}

	log.Info().Str("chain_id", chain.ID).Int("rules_disabled", disabledCount).Msg("Chain kill switch deactivated - traffic restored")
	return nil
}
