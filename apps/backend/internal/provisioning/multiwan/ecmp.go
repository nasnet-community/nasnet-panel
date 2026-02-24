package multiwan

import (
	"context"
	"fmt"

	"backend/internal/provisioning/types"
	"backend/internal/router"
)

// provisionECMP configures Equal-Cost Multi-Path routing.
// Multiple routes with the same distance enable kernel-level load balancing.
// The kernel automatically distributes traffic across all equal-cost paths,
// providing hardware-accelerated load distribution without explicit packet marking.
func (s *Service) provisionECMP(
	ctx context.Context,
	links []WANLink,
	comment string,
) (*Result, error) {

	result := &Result{
		RouterResourceIDs: make(map[string][]string),
		Strategy:          types.StrategyLoadBalance,
	}

	s.logger.Infow("provisioning ECMP load balancing strategy",
		"linkCount", len(links),
	)

	// Step 1: Create a routing table for ECMP load balancing
	ecmpTableCmd := router.Command{
		Path:   "/routing/table",
		Action: "add",
		Args: map[string]string{
			"name":    "ecmp-balance",
			"fib":     "yes",
			"comment": comment,
		},
	}

	tableResult, err := s.routerPort.ExecuteCommand(ctx, ecmpTableCmd)
	if err != nil {
		s.logger.Errorw("failed to create ECMP routing table", "error", err)
		return nil, fmt.Errorf("ECMP routing table creation failed: %w", err)
	}

	if tableResult.Success && tableResult.ID != "" {
		s.appendResourceID(result, "/routing/table", tableResult.ID)
		s.logger.Debugw("created ECMP routing table", "resourceID", tableResult.ID)
	}

	// Step 2: For each link, add a route with the SAME distance (distance=1)
	// Same distance = ECMP — kernel distributes traffic across all equal routes
	// check-gateway=ping enables automatic removal of failed gateways
	for _, link := range links {
		routeCmd := router.Command{
			Path:   "/ip/route",
			Action: "add",
			Args: map[string]string{
				"dst-address":   "0.0.0.0/0",
				"gateway":       link.Gateway,
				"distance":      "1", // All links have equal distance for ECMP
				"routing-table": "ecmp-balance",
				"check-gateway": "ping", // Remove route if gateway is unreachable
				"comment":       comment,
			},
		}

		routeResult, routeErr := s.routerPort.ExecuteCommand(ctx, routeCmd)
		if routeErr != nil {
			s.logger.Errorw("failed to add ECMP route",
				"link", link.Name,
				"error", routeErr,
			)
			return nil, fmt.Errorf("ECMP route creation failed for link %s: %w", link.Name, routeErr)
		}

		if routeResult.Success && routeResult.ID != "" {
			s.appendResourceID(result, "/ip/route", routeResult.ID)
			s.logger.Debugw("added ECMP route",
				"link", link.Name,
				"gateway", link.Gateway,
				"distance", 1,
				"resourceID", routeResult.ID,
			)
		}
	}

	// Step 3: Create a routing rule to use the ECMP table
	// This rule directs all traffic to the ECMP routing table where load balancing occurs
	ruleCmd := router.Command{
		Path:   "/routing/rule",
		Action: "add",
		Args: map[string]string{
			"src-address": "0.0.0.0/0",
			"table":       "ecmp-balance",
			"action":      "lookup",
			"comment":     comment,
		},
	}

	ruleResult, err := s.routerPort.ExecuteCommand(ctx, ruleCmd)
	if err != nil {
		s.logger.Errorw("failed to create ECMP routing rule", "error", err)
		return nil, fmt.Errorf("ECMP routing rule creation failed: %w", err)
	}

	if ruleResult.Success && ruleResult.ID != "" {
		s.appendResourceID(result, "/routing/rule", ruleResult.ID)
		s.logger.Debugw("created ECMP routing rule", "resourceID", ruleResult.ID)
	}

	s.logger.Infow("ECMP load balancing strategy provisioned successfully",
		"linkCount", len(links),
		"routeCount", len(links),
	)

	return result, nil
}
