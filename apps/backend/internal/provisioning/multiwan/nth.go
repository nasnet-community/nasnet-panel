package multiwan

import (
	"context"
	"fmt"

	"backend/internal/provisioning/types"
	"backend/internal/router"
)

// provisionNTH configures NTH-based round-robin load balancing.
// Every Nth new connection is sent to a specific WAN link in sequence.
// This provides simple round-robin distribution suitable for connections with similar characteristics.
// Note: Connections are not sticky (unlike PCC), so different packets in a connection may use different WAN links.
func (s *Service) provisionNTH(
	ctx context.Context,
	links []WANLink,
	comment string,
) (*Result, error) {

	result := &Result{
		RouterResourceIDs: make(map[string][]string),
		Strategy:          types.StrategyRoundRobin,
	}

	s.logger.Infow("provisioning NTH round-robin load balancing strategy",
		"linkCount", len(links),
	)

	// Step 1: For each link, create a connection mark mangle rule using NTH classifier
	// NTH distributes packets in round-robin fashion: every {N}th packet is matched
	for i, link := range links {
		connectionMarkCmd := router.Command{
			Path:   "/ip/firewall/mangle",
			Action: "add",
			Args: map[string]string{
				"chain":               "prerouting",
				"in-interface":        "bridge-local",
				"connection-state":    "new",
				"nth":                 fmt.Sprintf("%d,%d", len(links), i),
				"action":              "mark-connection",
				"new-connection-mark": fmt.Sprintf("nth-%s", link.Name),
				"passthrough":         "yes",
				"comment":             comment,
			},
		}

		markResult, err := s.routerPort.ExecuteCommand(ctx, connectionMarkCmd)
		if err != nil {
			s.logger.Errorw("failed to add NTH connection mark rule",
				"link", link.Name,
				"nthValue", fmt.Sprintf("%d,%d", len(links), i),
				"error", err,
			)
			return nil, fmt.Errorf("NTH connection mark creation failed for link %s: %w", link.Name, err)
		}

		if markResult.Success && markResult.ID != "" {
			s.appendResourceID(result, "/ip/firewall/mangle", markResult.ID)
			s.logger.Debugw("added NTH connection mark rule",
				"link", link.Name,
				"nthValue", fmt.Sprintf("%d,%d", len(links), i),
				"resourceID", markResult.ID,
			)
		}
	}

	// Step 2: For each link, create a routing mark mangle rule
	// These rules apply routing marks based on the connection mark
	for _, link := range links {
		routingMarkCmd := router.Command{
			Path:   "/ip/firewall/mangle",
			Action: "add",
			Args: map[string]string{
				"chain":            "prerouting",
				"connection-mark":  fmt.Sprintf("nth-%s", link.Name),
				"action":           "mark-routing",
				"new-routing-mark": link.RoutingTable,
				"passthrough":      "yes",
				"comment":          comment,
			},
		}

		routingMarkResult, err := s.routerPort.ExecuteCommand(ctx, routingMarkCmd)
		if err != nil {
			s.logger.Errorw("failed to add NTH routing mark rule",
				"link", link.Name,
				"error", err,
			)
			return nil, fmt.Errorf("NTH routing mark creation failed for link %s: %w", link.Name, err)
		}

		if routingMarkResult.Success && routingMarkResult.ID != "" {
			s.appendResourceID(result, "/ip/firewall/mangle", routingMarkResult.ID)
			s.logger.Debugw("added NTH routing mark rule",
				"link", link.Name,
				"routingTable", link.RoutingTable,
				"resourceID", routingMarkResult.ID,
			)
		}
	}

	// Step 3: For each link, create a route in the link's routing table
	// Routes direct traffic marked for a specific routing mark to the appropriate gateway
	for _, link := range links {
		routeCmd := router.Command{
			Path:   "/ip/route",
			Action: "add",
			Args: map[string]string{
				"dst-address":   "0.0.0.0/0",
				"gateway":       link.Gateway,
				"routing-table": link.RoutingTable,
				"comment":       comment,
			},
		}

		routeResult, err := s.routerPort.ExecuteCommand(ctx, routeCmd)
		if err != nil {
			s.logger.Errorw("failed to add NTH route",
				"link", link.Name,
				"error", err,
			)
			return nil, fmt.Errorf("NTH route creation failed for link %s: %w", link.Name, err)
		}

		if routeResult.Success && routeResult.ID != "" {
			s.appendResourceID(result, "/ip/route", routeResult.ID)
			s.logger.Debugw("added NTH route",
				"link", link.Name,
				"gateway", link.Gateway,
				"routingTable", link.RoutingTable,
				"resourceID", routeResult.ID,
			)
		}
	}

	s.logger.Infow("NTH round-robin load balancing strategy provisioned successfully",
		"linkCount", len(links),
		"mangleRuleCount", len(links)*2, // Connection marks + routing marks
		"routeCount", len(links),
	)

	return result, nil
}
