package multiwan

import (
	"context"
	"fmt"

	"go.uber.org/zap"

	"backend/internal/events"
	"backend/internal/provisioning/types"
	"backend/internal/router"
)

// WANLink represents a WAN link for multi-WAN strategy.
type WANLink struct {
	Name          string // Friendly name (e.g., "ISP1", "ISP2")
	InterfaceName string // Physical interface (e.g., "ether1")
	Gateway       string // Gateway IP address
	RoutingTable  string // Routing table name (e.g., "to-ISP1")
	Priority      int    // Lower = higher priority for failover
	Weight        int    // For load balancing weight
}

// Result holds the result of multi-WAN strategy provisioning.
type Result struct {
	RouterResourceIDs map[string][]string     // path -> list of .ids (multiple mangle rules, routes, etc.)
	Strategy          types.MultiLinkStrategy // Applied strategy
}

// Service handles multi-WAN strategy provisioning.
type Service struct {
	routerPort router.RouterPort
	eventBus   events.EventBus
	publisher  *events.Publisher
	logger     *zap.SugaredLogger
}

// ServiceConfig is the configuration for Service.
type ServiceConfig struct {
	RouterPort router.RouterPort
	EventBus   events.EventBus
	Logger     *zap.SugaredLogger
}

// NewService creates a new Service instance.
func NewService(cfg ServiceConfig) *Service {
	return &Service{
		routerPort: cfg.RouterPort,
		eventBus:   cfg.EventBus,
		logger:     cfg.Logger,
		publisher:  events.NewPublisher(cfg.EventBus, "multiwan-provisioner"),
	}
}

// ProvisionMultiWAN applies the appropriate multi-WAN strategy based on configuration.
// It validates that at least 2 WAN links are provided and dispatches to the appropriate
// strategy implementation (Failover, LoadBalance, RoundRobin, or Both).
func (s *Service) ProvisionMultiWAN(
	ctx context.Context,
	links []WANLink,
	config types.MultiLinkConfig,
	comment string,
) (*Result, error) {

	if len(links) < 2 {
		return nil, fmt.Errorf("multi-WAN requires at least 2 WAN links, got %d", len(links))
	}

	s.logger.Infow("provisioning multi-WAN strategy",
		"strategy", config.Strategy,
		"linkCount", len(links),
	)

	switch config.Strategy {
	case types.StrategyFailover:
		return s.provisionFailover(ctx, links, config, comment)

	case types.StrategyLoadBalance:
		if config.LoadBalanceMethod == nil {
			return nil, fmt.Errorf("load balance method required for LoadBalance strategy")
		}
		switch *config.LoadBalanceMethod {
		case types.LoadBalancePCC:
			return s.provisionPCC(ctx, links, comment)
		case types.LoadBalanceNTH:
			return s.provisionNTH(ctx, links, comment)
		case types.LoadBalanceECMP:
			return s.provisionECMP(ctx, links, comment)
		case types.LoadBalanceBonding:
			return nil, fmt.Errorf("bonding load balance method is not yet implemented")
		default:
			return nil, fmt.Errorf("unsupported load balance method: %s", *config.LoadBalanceMethod)
		}

	case types.StrategyRoundRobin:
		return s.provisionNTH(ctx, links, comment) // RoundRobin uses NTH

	case types.StrategyBoth:
		return s.provisionPCCWithFailover(ctx, links, config, comment)

	default:
		return nil, fmt.Errorf("unsupported strategy: %s", config.Strategy)
	}
}

// RemoveMultiWAN removes all multi-WAN strategy resources previously created.
// It removes resources in reverse order of creation (netwatch, mangle rules, routes, etc.).
func (s *Service) RemoveMultiWAN(ctx context.Context, result *Result) error {
	if result == nil {
		return nil
	}

	// Remove in reverse order: netwatch, mangle rules, routes, routing rules, routing tables
	removalPaths := []string{
		"/tool/netwatch",
		"/ip/firewall/mangle",
		"/ip/route",
		"/routing/rule",
		"/routing/table",
	}

	for _, path := range removalPaths {
		ids, ok := result.RouterResourceIDs[path]
		if !ok {
			continue
		}

		for _, id := range ids {
			if id == "" {
				continue
			}

			cmd := router.Command{
				Path:   path,
				Action: "remove",
				Args: map[string]string{
					".id": id,
				},
			}

			if _, err := s.routerPort.ExecuteCommand(ctx, cmd); err != nil {
				s.logger.Warnw("failed to remove multi-WAN resource",
					"path", path,
					"id", id,
					"error", err,
				)
			}
		}
	}

	return nil
}

// appendResourceID appends a resource ID to the tracking map for a given path.
// This is used to track all created resources for later cleanup.
func (s *Service) appendResourceID(result *Result, path, id string) {
	if result.RouterResourceIDs == nil {
		result.RouterResourceIDs = make(map[string][]string)
	}
	result.RouterResourceIDs[path] = append(result.RouterResourceIDs[path], id)
}
