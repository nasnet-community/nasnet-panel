package routing

import (
	"context"
	"fmt"
	"sync"

	"backend/generated/ent"
	"backend/generated/ent/chainhop"
	"backend/generated/ent/routingchain"
	"backend/generated/ent/virtualinterface"
	"backend/internal/events"
	"backend/internal/router"

	"github.com/rs/zerolog/log"
)

// ChainRouter manages multi-hop routing chains that route device traffic
// through multiple services sequentially (e.g., Device → VPN → Tor → Internet).
type ChainRouter struct {
	router    router.RouterPort
	store     *ent.Client
	eventBus  events.EventBus
	publisher *events.Publisher
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
		return nil, fmt.Errorf("Store is required")
	}

	cr := &ChainRouter{
		router:   cfg.RouterPort,
		store:    cfg.Store,
		eventBus: cfg.EventBus,
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

	// Validate hop count
	if len(input.Hops) < 2 {
		return nil, fmt.Errorf("routing chain must have at least 2 hops, got %d", len(input.Hops))
	}
	if len(input.Hops) > 5 {
		return nil, fmt.Errorf("routing chain cannot exceed 5 hops, got %d", len(input.Hops))
	}
	if len(input.Hops) >= 4 {
		log.Warn().Int("hop_count", len(input.Hops)).Msg("Chain has 4+ hops - latency may be significant")
	}

	// Validate all VirtualInterfaces exist
	interfaceIDs := make([]string, len(input.Hops))
	for i, hop := range input.Hops {
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

	// Check for circular chains (same interface appearing twice)
	seen := make(map[string]bool)
	for _, hop := range input.Hops {
		if seen[hop.InterfaceID] {
			return nil, fmt.Errorf("circular chain detected: interface %s appears multiple times", hop.InterfaceID)
		}
		seen[hop.InterfaceID] = true
	}

	// Create interface lookup map
	interfaceMap := make(map[string]*ent.VirtualInterface)
	for _, iface := range interfaces {
		interfaceMap[iface.ID] = iface
	}

	// Remove any existing chain for this device
	existingChain, err := cr.store.RoutingChain.
		Query().
		Where(
			routingchain.RouterID(routerID),
			routingchain.DeviceID(input.DeviceID),
		).
		Only(ctx)
	if err == nil {
		// Chain exists, remove it first
		if err := cr.removeRoutingChainInternal(ctx, existingChain); err != nil {
			log.Warn().Err(err).Msg("Failed to remove existing chain, continuing anyway")
		}
	}

	// TODO: Query and remove existing single-hop routing rules (when Story 8.3 is implemented)
	log.Info().Msg("Single-hop routing removal not yet implemented (Story 8.3)")

	chain, err := cr.createChainRecord(ctx, routerID, input)
	if err != nil {
		return nil, err
	}

	// Create hops with router rules
	chain, err = cr.createChainHops(ctx, chain, input, interfaceMap)
	if err != nil {
		return nil, err
	}

	// Emit event
	if cr.publisher != nil {
		event := events.NewGenericEvent(
			events.EventTypeRoutingChainCreated,
			events.PriorityNormal,
			"chain-router",
			map[string]interface{}{
				"chain_id":  chain.ID,
				"device_id": input.DeviceID,
				"hop_count": len(input.Hops),
				"router_id": routerID,
			},
		)
		if err := cr.publisher.Publish(ctx, event); err != nil {
			log.Warn().Err(err).Msg("Failed to publish chain created event")
		}
	}

	// Reload chain with hops
	chain, err = cr.store.RoutingChain.
		Query().
		Where(routingchain.ID(chain.ID)).
		WithHops(func(q *ent.ChainHopQuery) {
			q.WithInterface()
			q.Order(ent.Asc(chainhop.FieldHopOrder))
		}).
		Only(ctx)
	if err != nil {
		log.Warn().Err(err).Msg("Failed to reload chain with hops")
	}

	log.Info().Str("chain_id", chain.ID).Msg("Routing chain created successfully")

	return chain, nil
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
