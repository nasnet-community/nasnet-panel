package multiwan

import (
	"context"
	"fmt"
	"strconv"

	"backend/internal/provisioning/types"
	"backend/internal/router"
)

// provisionPCC configures Per-Connection Classifier load balancing.
// Each new connection is classified by source and destination address hash and assigned to a specific WAN link.
// This ensures that all traffic for a given connection flows through the same gateway,
// preventing out-of-order packets and connection state confusion.
func (s *Service) provisionPCC(
	ctx context.Context,
	links []WANLink,
	comment string,
) (*Result, error) {

	result := &Result{
		RouterResourceIDs: make(map[string][]string),
		Strategy:          types.StrategyLoadBalance,
	}

	s.logger.Infow("provisioning PCC load balancing strategy",
		"linkCount", len(links),
	)

	if err := s.createPCCRoutingTable(ctx, comment, result); err != nil {
		return nil, err
	}

	if err := s.createPCCRoutes(ctx, links, comment, result); err != nil {
		return nil, err
	}

	if err := s.createPCCConnectionMarks(ctx, links, comment, result); err != nil {
		return nil, err
	}

	if err := s.createPCCRoutingMarks(ctx, links, comment, result); err != nil {
		return nil, err
	}

	s.logger.Infow("PCC load balancing strategy provisioned successfully",
		"linkCount", len(links),
		"mangleRuleCount", len(links)*2, // Connection marks + routing marks
	)

	return result, nil
}

// createPCCRoutingTable creates the shared PCC routing table.
func (s *Service) createPCCRoutingTable(ctx context.Context, comment string, result *Result) error {
	pccTableCmd := router.Command{
		Path:   "/routing/table",
		Action: "add",
		Args: map[string]string{
			"name":    "pcc-balance",
			"fib":     "yes",
			"comment": comment,
		},
	}

	tableResult, err := s.routerPort.ExecuteCommand(ctx, pccTableCmd)
	if err != nil {
		s.logger.Errorw("failed to create PCC routing table", "error", err)
		return fmt.Errorf("PCC routing table creation failed: %w", err)
	}

	if tableResult.Success && tableResult.ID != "" {
		s.appendResourceID(result, "/routing/table", tableResult.ID)
		s.logger.Debugw("created PCC routing table", "resourceID", tableResult.ID)
	}

	return nil
}

// createPCCRoutes adds one route per WAN link in the PCC routing table.
func (s *Service) createPCCRoutes(ctx context.Context, links []WANLink, comment string, result *Result) error {
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
			s.logger.Errorw("failed to add PCC route", "link", link.Name, "error", err)
			return fmt.Errorf("PCC route creation failed for link %s: %w", link.Name, err)
		}

		if routeResult.Success && routeResult.ID != "" {
			s.appendResourceID(result, "/ip/route", routeResult.ID)
			s.logger.Debugw("added PCC route",
				"link", link.Name,
				"gateway", link.Gateway,
				"routingTable", link.RoutingTable,
				"resourceID", routeResult.ID,
			)
		}
	}

	return nil
}

// createPCCConnectionMarks adds connection-mark mangle rules (one per link).
func (s *Service) createPCCConnectionMarks(ctx context.Context, links []WANLink, comment string, result *Result) error {
	for i, link := range links {
		pccClassifier := fmt.Sprintf("both-addresses:%d/%d", len(links), i)

		connectionMarkCmd := router.Command{
			Path:   "/ip/firewall/mangle",
			Action: "add",
			Args: map[string]string{
				"chain":                     "prerouting",
				"in-interface":              "bridge-local",
				"connection-state":          "new",
				"per-connection-classifier": pccClassifier,
				"action":                    "mark-connection",
				"new-connection-mark":       fmt.Sprintf("pcc-%s", link.Name),
				"passthrough":               "yes",
				"comment":                   comment,
			},
		}

		markResult, err := s.routerPort.ExecuteCommand(ctx, connectionMarkCmd)
		if err != nil {
			s.logger.Errorw("failed to add PCC connection mark rule",
				"link", link.Name,
				"classifier", pccClassifier,
				"error", err,
			)
			return fmt.Errorf("PCC connection mark creation failed for link %s: %w", link.Name, err)
		}

		if markResult.Success && markResult.ID != "" {
			s.appendResourceID(result, "/ip/firewall/mangle", markResult.ID)
			s.logger.Debugw("added PCC connection mark rule",
				"link", link.Name,
				"classifier", pccClassifier,
				"resourceID", markResult.ID,
			)
		}
	}

	return nil
}

// createPCCRoutingMarks adds routing-mark mangle rules (one per link).
func (s *Service) createPCCRoutingMarks(ctx context.Context, links []WANLink, comment string, result *Result) error {
	for _, link := range links {
		routingMarkCmd := router.Command{
			Path:   "/ip/firewall/mangle",
			Action: "add",
			Args: map[string]string{
				"chain":            "prerouting",
				"connection-mark":  fmt.Sprintf("pcc-%s", link.Name),
				"action":           "mark-routing",
				"new-routing-mark": link.RoutingTable,
				"passthrough":      "yes",
				"comment":          comment,
			},
		}

		routingMarkResult, err := s.routerPort.ExecuteCommand(ctx, routingMarkCmd)
		if err != nil {
			s.logger.Errorw("failed to add PCC routing mark rule", "link", link.Name, "error", err)
			return fmt.Errorf("PCC routing mark creation failed for link %s: %w", link.Name, err)
		}

		if routingMarkResult.Success && routingMarkResult.ID != "" {
			s.appendResourceID(result, "/ip/firewall/mangle", routingMarkResult.ID)
			s.logger.Debugw("added PCC routing mark rule",
				"link", link.Name,
				"routingTable", link.RoutingTable,
				"resourceID", routingMarkResult.ID,
			)
		}
	}

	return nil
}

// provisionPCCWithFailover combines PCC load balancing with failover.
// Uses PCC for normal operation, automatically falls back to remaining links on failure.
// This provides both load distribution and redundancy.
func (s *Service) provisionPCCWithFailover(
	ctx context.Context,
	links []WANLink,
	_ types.MultiLinkConfig,
	comment string,
) (*Result, error) {

	// First apply PCC load balancing
	result, err := s.provisionPCC(ctx, links, comment)
	if err != nil {
		return nil, fmt.Errorf("PCC provisioning failed: %w", err)
	}

	s.logger.Infow("adding failover routes for PCC with failover strategy",
		"linkCount", len(links),
	)

	// Then add failover routes with health check for each link
	// These routes provide automatic failover if a primary gateway becomes unavailable
	for i, link := range links {
		distance := i + 1

		failoverCmd := router.Command{
			Path:   "/ip/route",
			Action: "add",
			Args: map[string]string{
				"dst-address":   "0.0.0.0/0",
				"gateway":       link.Gateway,
				"distance":      strconv.Itoa(distance),
				"check-gateway": "ping",
				"comment":       comment,
			},
		}

		failoverResult, failoverErr := s.routerPort.ExecuteCommand(ctx, failoverCmd)
		if failoverErr != nil {
			s.logger.Warnw("failed to add failover route in PCC+Failover strategy",
				"link", link.Name,
				"error", failoverErr,
			)
			// Don't fail entirely; continue with other links
			continue
		}

		if failoverResult.Success && failoverResult.ID != "" {
			s.appendResourceID(result, "/ip/route", failoverResult.ID)
			s.logger.Debugw("added failover route in PCC+Failover strategy",
				"link", link.Name,
				"distance", distance,
				"resourceID", failoverResult.ID,
			)
		}
	}

	s.logger.Infow("PCC with failover strategy provisioned successfully",
		"linkCount", len(links),
	)

	return result, nil
}
