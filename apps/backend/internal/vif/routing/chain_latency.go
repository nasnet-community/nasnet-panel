package routing

import (
	"context"
	"fmt"
	"net"
	"strconv"
	"time"

	"backend/generated/ent"
	"backend/generated/ent/chainhop"
	"backend/generated/ent/routingchain"

	"backend/internal/events"
	"backend/internal/features"

	"github.com/rs/zerolog/log"
)

// HopLatency represents the latency measurement for a single hop.
type HopLatency struct {
	HopOrder  int
	Interface string
	LatencyMs float64 // -1 if unreachable
	Healthy   bool
}

// ChainLatencyResult represents the result of measuring all hops in a chain.
type ChainLatencyResult struct {
	ChainID      string
	Hops         []HopLatency
	TotalLatency float64 // Sum of all hop latencies
	AllHealthy   bool
}

// ChainLatencyMeasurer measures latency for routing chains by probing each hop.
type ChainLatencyMeasurer struct {
	store           *ent.Client
	eventBus        events.EventBus
	publisher       *events.Publisher
	featureRegistry *features.FeatureRegistry
}

// NewChainLatencyMeasurer creates a new latency measurer.
func NewChainLatencyMeasurer(store *ent.Client, eventBus events.EventBus, registry *features.FeatureRegistry) *ChainLatencyMeasurer {
	m := &ChainLatencyMeasurer{
		store:           store,
		eventBus:        eventBus,
		featureRegistry: registry,
	}

	if eventBus != nil {
		m.publisher = events.NewPublisher(eventBus, "chain-latency")
	}

	return m
}

// resolveServicePorts resolves the actual service ports from the manifest.
// Falls back to common proxy ports if the manifest is unavailable.
func (m *ChainLatencyMeasurer) resolveServicePorts(ctx context.Context, iface *ent.VirtualInterface) []int {
	fallbackPorts := []int{1080, 9050, 8080, 3128}

	if m.featureRegistry == nil {
		return fallbackPorts
	}

	// Get service instance via VirtualInterface.InstanceID
	instanceID := iface.InstanceID
	if instanceID == "" {
		return fallbackPorts
	}

	// Get the service instance to find the feature ID
	instance, err := m.store.ServiceInstance.Get(ctx, instanceID)
	if err != nil {
		log.Debug().Err(err).Str("instance_id", instanceID).Msg("Failed to lookup service instance for port resolution")
		return fallbackPorts
	}

	// Lookup manifest for the feature
	manifest, err := m.featureRegistry.GetManifest(instance.FeatureID)
	if err != nil {
		log.Debug().Err(err).Str("feature_id", instance.FeatureID).Msg("Failed to lookup manifest for port resolution")
		return fallbackPorts
	}

	// Extract ports from manifest
	if len(manifest.Ports) > 0 {
		ports := make([]int, 0, len(manifest.Ports))
		for _, pm := range manifest.Ports {
			if pm.ContainerPort > 0 {
				ports = append(ports, pm.ContainerPort)
			}
		}
		if len(ports) > 0 {
			return ports
		}
	}

	return fallbackPorts
}

// MeasureChainLatencies measures the latency of all hops in a chain.
func (m *ChainLatencyMeasurer) MeasureChainLatencies(ctx context.Context, chainID string) (*ChainLatencyResult, error) {
	log.Debug().Str("chain_id", chainID).Msg("Measuring chain latencies")

	// Load chain with hops and interfaces
	chain, err := m.store.RoutingChain.
		Query().
		Where(routingchain.ID(chainID)).
		WithHops(func(q *ent.ChainHopQuery) {
			q.WithInterface()
			q.Order(ent.Asc(chainhop.FieldHopOrder))
		}).
		Only(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to load chain: %w", err)
	}

	hops := chain.Edges.Hops
	if len(hops) == 0 {
		return nil, fmt.Errorf("chain has no hops")
	}

	result := &ChainLatencyResult{
		ChainID:    chainID,
		Hops:       make([]HopLatency, 0, len(hops)),
		AllHealthy: true,
	}

	// Measure latency for each hop
	for _, hop := range hops {
		iface := hop.Edges.Interface
		if iface == nil {
			log.Warn().
				Int("hop_order", hop.HopOrder).
				Msg("Interface not loaded for hop, skipping")
			continue
		}

		hopLatency := m.measureHopLatency(ctx, hop, iface)
		result.Hops = append(result.Hops, hopLatency)

		if hopLatency.Healthy {
			result.TotalLatency += hopLatency.LatencyMs
		} else {
			result.AllHealthy = false
		}
	}

	// Emit latency update event (optional - can be deferred to follow-up PR)
	if m.publisher != nil && result.AllHealthy {
		event := events.NewGenericEvent(
			events.EventTypeChainLatencyUpdated,
			events.PriorityBackground,
			chain.RouterID,
			map[string]interface{}{
				"chain_id":      chainID,
				"total_latency": result.TotalLatency,
				"hop_count":     len(result.Hops),
			},
		)
		if err := m.publisher.Publish(ctx, event); err != nil {
			log.Debug().Err(err).Msg("Failed to publish latency event")
		}
	}

	log.Debug().
		Str("chain_id", chainID).
		Float64("total_latency_ms", result.TotalLatency).
		Bool("all_healthy", result.AllHealthy).
		Msg("Chain latency measurement complete")

	return result, nil
}

// measureHopLatency measures the latency for a single hop by TCP connect probe.
func (m *ChainLatencyMeasurer) measureHopLatency(
	ctx context.Context,
	hop *ent.ChainHop,
	iface *ent.VirtualInterface,
) HopLatency {

	result := HopLatency{
		HopOrder:  hop.HopOrder,
		Interface: iface.InterfaceName,
		LatencyMs: -1, // Default to unreachable
		Healthy:   false,
	}

	// Extract IP address from interface (e.g., "10.99.100.1/24" -> "10.99.100.1")
	vlanIP := iface.IPAddress
	if idx := len(vlanIP); idx > 0 {
		for j := 0; j < len(vlanIP); j++ {
			if vlanIP[j] == '/' {
				vlanIP = vlanIP[:j]
				break
			}
		}
	}

	// Resolve service ports from the feature manifest, falling back to common proxy ports
	ports := m.resolveServicePorts(ctx, iface)

	// Try TCP connect to each port with timeout
	timeout := 3 * time.Second
	var successPort int
	var latency time.Duration

	for _, port := range ports {
		address := net.JoinHostPort(vlanIP, strconv.Itoa(port))

		start := time.Now()
		dialer := &net.Dialer{Timeout: timeout}
		conn, err := dialer.DialContext(ctx, "tcp", address)
		elapsed := time.Since(start)

		if err == nil {
			conn.Close()
			latency = elapsed
			successPort = port
			break
		}

		// If context is canceled, stop trying
		if ctx.Err() != nil {
			break
		}
	}

	if successPort > 0 {
		result.LatencyMs = float64(latency.Milliseconds())
		result.Healthy = true
		log.Debug().
			Int("hop_order", hop.HopOrder).
			Str("address", fmt.Sprintf("%s:%d", vlanIP, successPort)).
			Float64("latency_ms", result.LatencyMs).
			Msg("Hop latency measured")
	} else {
		log.Debug().
			Int("hop_order", hop.HopOrder).
			Str("vlan_ip", vlanIP).
			Msg("Hop unreachable")
	}

	return result
}

// MeasureAllChains measures latencies for all active chains on a router.
func (m *ChainLatencyMeasurer) MeasureAllChains(ctx context.Context, routerID string) ([]*ChainLatencyResult, error) {
	// Load all active chains for the router
	chains, err := m.store.RoutingChain.
		Query().
		Where(
			routingchain.RouterID(routerID),
			routingchain.Active(true),
		).
		All(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to load chains: %w", err)
	}

	results := make([]*ChainLatencyResult, 0, len(chains))

	for _, chain := range chains {
		result, err := m.MeasureChainLatencies(ctx, chain.ID)
		if err != nil {
			log.Warn().
				Err(err).
				Str("chain_id", chain.ID).
				Msg("Failed to measure chain latency")
			continue
		}
		results = append(results, result)
	}

	return results, nil
}

// StartPeriodicMeasurement starts a goroutine that measures chain latencies periodically.
// This is OPTIONAL and can be deferred to a follow-up PR.
func (m *ChainLatencyMeasurer) StartPeriodicMeasurement(
	ctx context.Context,
	routerID string,
	interval time.Duration,
) {

	if interval <= 0 {
		interval = 30 * time.Second // Default to 30 seconds
	}

	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	log.Info().
		Str("router_id", routerID).
		Dur("interval", interval).
		Msg("Starting periodic chain latency measurement")

	for {
		select {
		case <-ctx.Done():
			log.Info().Msg("Stopping periodic chain latency measurement")
			return
		case <-ticker.C:
			_, err := m.MeasureAllChains(ctx, routerID)
			if err != nil {
				log.Warn().Err(err).Msg("Periodic latency measurement failed")
			}
		}
	}
}
