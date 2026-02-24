package routing

import (
	"context"
	"fmt"
	"sync"

	"backend/generated/ent"
	"backend/generated/ent/chainhop"
	"backend/generated/ent/devicerouting"
	"backend/generated/ent/routingchain"
	"backend/generated/ent/virtualinterface"

	"backend/internal/events"
	"backend/internal/router"

	"github.com/rs/zerolog/log"
	"go.uber.org/zap"
)

// ChainRouter manages multi-hop routing chains that route device traffic
// through multiple services sequentially (e.g., Device → VPN → Tor → Internet).
type ChainRouter struct {
	router    router.RouterPort
	store     *ent.Client
	eventBus  events.EventBus
	publisher *events.Publisher
	logger    *zap.Logger
	mu        sync.RWMutex
}

// ChainRouterConfig holds configuration for ChainRouter.
type ChainRouterConfig struct {
	RouterPort router.RouterPort
	Store      *ent.Client
	EventBus   events.EventBus
}

// CreateRoutingChainInput holds the input for creating a routing chain.
type CreateRoutingChainInput struct {
	DeviceID          string
	DeviceMAC         string
	DeviceIP          string
	DeviceName        string
	RoutingMode       routingchain.RoutingMode
	KillSwitchEnabled bool
	KillSwitchMode    routingchain.KillSwitchMode
	Hops              []ChainHopInput
}

// ChainHopInput holds the input for a single hop in the chain.
type ChainHopInput struct {
	InterfaceID string
	Order       int
}

// NewChainRouter creates a new ChainRouter instance.
func NewChainRouter(cfg ChainRouterConfig) (*ChainRouter, error) {
	if cfg.RouterPort == nil {
		return nil, fmt.Errorf("RouterPort is required")
	}
	if cfg.Store == nil {
		return nil, fmt.Errorf("store is required")
	}

	cr := &ChainRouter{
		router:   cfg.RouterPort,
		store:    cfg.Store,
		eventBus: cfg.EventBus,
		logger:   zap.L().Named("chain-router"),
	}

	if cfg.EventBus != nil {
		cr.publisher = events.NewPublisher(cfg.EventBus, "chain-router")
	}

	return cr, nil
}

// CreateRoutingChain creates a new multi-hop routing chain for a device.
// It removes any existing single-hop routing or chain for the device first.
func (cr *ChainRouter) CreateRoutingChain(
	ctx context.Context,
	routerID string,
	input CreateRoutingChainInput,
) (*ent.RoutingChain, error) {

	cr.mu.Lock()
	defer cr.mu.Unlock()

	log.Info().
		Str("device_id", input.DeviceID).
		Int("hop_count", len(input.Hops)).
		Msg("Creating routing chain")

	interfaceMap, err := cr.validateChainInput(ctx, input)
	if err != nil {
		return nil, err
	}

	cr.removeExistingChain(ctx, routerID, input.DeviceID)

	chain, err := cr.createChainRecord(ctx, routerID, input)
	if err != nil {
		return nil, err
	}

	chain, err = cr.createChainHops(ctx, chain, input, interfaceMap)
	if err != nil {
		return nil, err
	}

	cr.publishChainCreatedEvent(ctx, chain.ID, input.DeviceID, len(input.Hops), routerID)

	chain = cr.reloadChainWithHops(ctx, chain.ID)

	log.Info().Str("chain_id", chain.ID).Msg("Routing chain created successfully")
	return chain, nil
}

// validateChainInput validates hops and interfaces, returning an interface lookup map.
func (cr *ChainRouter) validateChainInput(ctx context.Context, input CreateRoutingChainInput) (map[string]*ent.VirtualInterface, error) {
	if len(input.Hops) < 2 {
		return nil, fmt.Errorf("routing chain must have at least 2 hops, got %d", len(input.Hops))
	}
	if len(input.Hops) > 5 {
		return nil, fmt.Errorf("routing chain cannot exceed 5 hops, got %d", len(input.Hops))
	}
	if len(input.Hops) >= 4 {
		log.Warn().Int("hop_count", len(input.Hops)).Msg("Chain has 4+ hops - latency may be significant")
	}

	seen := make(map[string]bool)
	interfaceIDs := make([]string, len(input.Hops))
	for i, hop := range input.Hops {
		if seen[hop.InterfaceID] {
			return nil, fmt.Errorf("circular chain detected: interface %s appears multiple times", hop.InterfaceID)
		}
		seen[hop.InterfaceID] = true
		interfaceIDs[i] = hop.InterfaceID
	}

	interfaces, err := cr.store.VirtualInterface.
		Query().
		Where(virtualinterface.IDIn(interfaceIDs...)).
		All(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to query interfaces: %w", err)
	}
	if len(interfaces) != len(input.Hops) {
		return nil, fmt.Errorf("not all interfaces exist: expected %d, found %d", len(input.Hops), len(interfaces))
	}

	interfaceMap := make(map[string]*ent.VirtualInterface)
	for _, iface := range interfaces {
		interfaceMap[iface.ID] = iface
	}
	return interfaceMap, nil
}

// removeExistingChain removes any existing routing chain for the given device.
func (cr *ChainRouter) removeExistingChain(ctx context.Context, routerID, deviceID string) {
	existingChain, err := cr.store.RoutingChain.
		Query().
		Where(
			routingchain.RouterID(routerID),
			routingchain.DeviceID(deviceID),
		).
		Only(ctx)
	if err == nil {
		if rmErr := cr.removeRoutingChainInternal(ctx, existingChain); rmErr != nil {
			log.Warn().Err(rmErr).Msg("Failed to remove existing chain, continuing anyway")
		}
	}
	// Remove existing single-hop DeviceRouting records for this device.
	existing, err := cr.store.DeviceRouting.
		Query().
		Where(
			devicerouting.RouterID(routerID),
			devicerouting.DeviceID(deviceID),
		).
		All(ctx)
	if err != nil {
		log.Warn().Err(err).Msg("Failed to query single-hop routing records, continuing anyway")
		return
	}
	for _, dr := range existing {
		cr.removeSingleHopRules(ctx, dr)
	}
}

// removeSingleHopRules removes the router mangle/kill-switch rules and DB record
// for a single-hop DeviceRouting entry, logging warnings on failure but not blocking.
func (cr *ChainRouter) removeSingleHopRules(ctx context.Context, dr *ent.DeviceRouting) {
	log.Info().
		Str("device_routing_id", dr.ID).
		Str("device_id", dr.DeviceID).
		Str("mangle_rule_id", dr.MangleRuleID).
		Msg("Removing single-hop routing rules")

	// Remove the mangle rule from the router.
	if dr.MangleRuleID != "" {
		removeMangleCmd := router.Command{
			Path:   "/ip/firewall/mangle",
			Action: "remove",
			Args:   map[string]string{".id": dr.MangleRuleID},
		}
		if _, err := cr.router.ExecuteCommand(ctx, removeMangleCmd); err != nil {
			log.Warn().Err(err).Str("device_routing_id", dr.ID).Msg("Failed to remove single-hop mangle rule")
		}
	}

	// Remove the kill switch filter rule from the router (if one was created).
	if dr.KillSwitchRuleID != "" {
		removeKSCmd := router.Command{
			Path:   "/ip/firewall/filter",
			Action: "remove",
			Args:   map[string]string{".id": dr.KillSwitchRuleID},
		}
		if _, err := cr.router.ExecuteCommand(ctx, removeKSCmd); err != nil {
			log.Warn().Err(err).Str("device_routing_id", dr.ID).Msg("Failed to remove single-hop kill switch rule")
		}
	}

	// Delete the DeviceRouting DB record.
	if err := cr.store.DeviceRouting.DeleteOneID(dr.ID).Exec(ctx); err != nil {
		log.Warn().Err(err).Str("device_routing_id", dr.ID).Msg("Failed to delete single-hop DeviceRouting record")
	}
}

// publishChainCreatedEvent emits a routing chain created event.
func (cr *ChainRouter) publishChainCreatedEvent(ctx context.Context, chainID, deviceID string, hopCount int, routerID string) {
	if cr.publisher == nil {
		return
	}
	event := events.NewGenericEvent(
		events.EventTypeRoutingChainCreated,
		events.PriorityNormal,
		"chain-router",
		map[string]interface{}{
			"chain_id":  chainID,
			"device_id": deviceID,
			"hop_count": hopCount,
			"router_id": routerID,
		},
	)
	if pubErr := cr.publisher.Publish(ctx, event); pubErr != nil {
		log.Warn().Err(pubErr).Msg("Failed to publish chain created event")
	}
}

// reloadChainWithHops reloads the chain entity with its hops and interfaces.
func (cr *ChainRouter) reloadChainWithHops(ctx context.Context, chainID string) *ent.RoutingChain {
	chain, err := cr.store.RoutingChain.
		Query().
		Where(routingchain.ID(chainID)).
		WithHops(func(q *ent.ChainHopQuery) {
			q.WithInterface()
			q.Order(ent.Asc(chainhop.FieldHopOrder))
		}).
		Only(ctx)
	if err != nil {
		log.Warn().Err(err).Msg("Failed to reload chain with hops")
	}
	return chain
}

// createChainRecord creates the RoutingChain database record.
func (cr *ChainRouter) createChainRecord(
	ctx context.Context,
	routerID string,
	input CreateRoutingChainInput,
) (*ent.RoutingChain, error) {

	chainBuilder := cr.store.RoutingChain.
		Create().
		SetRouterID(routerID).
		SetDeviceID(input.DeviceID).
		SetRoutingMode(input.RoutingMode).
		SetActive(true).
		SetKillSwitchEnabled(input.KillSwitchEnabled).
		SetKillSwitchMode(input.KillSwitchMode)

	if input.DeviceMAC != "" {
		chainBuilder.SetDeviceMAC(input.DeviceMAC)
	}
	if input.DeviceIP != "" {
		chainBuilder.SetDeviceIP(input.DeviceIP)
	}
	if input.DeviceName != "" {
		chainBuilder.SetDeviceName(input.DeviceName)
	}

	chain, err := chainBuilder.Save(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to create RoutingChain record: %w", err)
	}
	return chain, nil
}
