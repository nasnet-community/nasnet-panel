// Package routing provides business logic layer for route management.
package routing

import (
	"context"
	"fmt"

	"backend/graph/model"

	"backend/internal/router"
)

const yesValue = "yes"

// CheckGatewayReachability checks if a gateway is reachable.
// Maps to: /tool/ping (simplified check)
func (s *Service) CheckGatewayReachability(ctx context.Context, gateway model.IPv4) (*model.GatewayReachabilityResult, error) {
	// Use /tool/ping to check reachability
	cmd := router.Command{
		Path:   "/tool/ping",
		Action: "execute",
		Args: map[string]string{
			"address": string(gateway),
			"count":   "3",
		},
	}

	result, err := s.Port().ExecuteCommand(ctx, cmd)
	if err != nil {
		return &model.GatewayReachabilityResult{
			Reachable: false,
			Message:   fmt.Sprintf("Failed to check reachability: %v", err),
		}, nil
	}

	// Parse ping result
	reachable := result.Success
	var latency *int
	var iface *string

	// Try to parse average latency from result if available
	if len(result.Data) > 0 {
		if avgTime, ok := result.Data[0]["avg-rtt"]; ok {
			// Convert milliseconds string to int
			ms, _ := parseIntRoute(avgTime) //nolint:errcheck // avg-rtt parsing is best-effort
			if ms > 0 {
				latency = &ms
			}
		}
	}

	message := fmt.Sprintf("Gateway %s is reachable", string(gateway))

	if !reachable {
		message = fmt.Sprintf("Gateway %s may not be reachable from any interface", string(gateway))
	}

	return &model.GatewayReachabilityResult{
		Reachable: reachable,
		Latency:   latency,
		Interface: iface,
		Message:   message,
	}, nil
}

// AnalyzeRouteImpact analyzes the impact of deleting a route.
func (s *Service) AnalyzeRouteImpact(ctx context.Context, route *model.Route) *model.RouteImpactAnalysis {
	const defaultRoute = "0.0.0.0/0"

	isDefaultRoute := route.Destination == defaultRoute

	if isDefaultRoute {
		return &model.RouteImpactAnalysis{
			IsDefaultRoute:  true,
			AffectedTraffic: "All internet-bound traffic",
			Severity:        model.ConfirmationSeverityCritical,
			Message:         "Deleting this route will disconnect the router from the internet.",
			Consequences: []string{
				"All internet-bound traffic will be affected",
				"Remote management connections will be lost",
				"You may lose access to the router",
			},
		}
	}

	return &model.RouteImpactAnalysis{
		IsDefaultRoute:  false,
		AffectedTraffic: fmt.Sprintf("Traffic to %s", route.Destination),
		Severity:        model.ConfirmationSeverityStandard,
		Message:         fmt.Sprintf("Traffic to %s will no longer be routed via this path.", route.Destination),
		Consequences: []string{
			fmt.Sprintf("Traffic to %s will be affected", route.Destination),
			"Connections to this network will fail",
		},
	}
}

// findMatchingRoutes finds all routes that match the destination IP.
func (s *Service) findMatchingRoutes(
	destination string,
	routes []*model.Route,
) []*model.RouteLookupCandidate {

	destIP := parseIP(destination)
	var candidates []*model.RouteLookupCandidate

	for _, route := range routes {
		// Skip inactive or disabled routes
		if !route.Active {
			continue
		}
		if route.Disabled != nil && *route.Disabled {
			continue
		}

		// Check if destination falls within this route's network
		routeNet := parseCIDRRoute(string(route.Destination))
		if routeNet != nil && routeNet.Contains(destIP) {
			prefixLen := getPrefixLength(string(route.Destination))
			candidates = append(candidates, &model.RouteLookupCandidate{
				Route:        route,
				PrefixLength: prefixLen,
				Distance:     route.Distance,
				Selected:     false, // Will be set later
			})
		}
	}

	return candidates
}

// selectBestRoute selects the best route using longest prefix match, then lowest distance.
func (s *Service) selectBestRoute(
	candidates []*model.RouteLookupCandidate,
) *model.RouteLookupCandidate {

	if len(candidates) == 0 {
		return nil
	}

	// Sort by prefix length DESC, then distance ASC
	best := candidates[0]
	for _, candidate := range candidates[1:] {
		if candidate.PrefixLength > best.PrefixLength {
			best = candidate
		} else if candidate.PrefixLength == best.PrefixLength && candidate.Distance < best.Distance {
			best = candidate
		}
	}

	best.Selected = true
	reason := s.getSelectionReason(best, candidates)
	best.SelectionReason = &reason

	return best
}

// getSelectionReason generates a reason why this route was selected.
func (s *Service) getSelectionReason(
	selected *model.RouteLookupCandidate,
	candidates []*model.RouteLookupCandidate,
) string {

	if len(candidates) == 1 {
		return "Only matching route"
	}

	// Check if there are other routes with same prefix
	samePrefixCount := 0
	for _, c := range candidates {
		if c.PrefixLength == selected.PrefixLength && c != selected {
			samePrefixCount++
		}
	}

	if samePrefixCount > 0 {
		return fmt.Sprintf("Longest prefix match /%d, lowest distance (%d)", selected.PrefixLength, selected.Distance)
	}

	return fmt.Sprintf("Longest prefix match /%d", selected.PrefixLength)
}

// generateExplanation generates a human-readable explanation of route selection.
func (s *Service) generateExplanation(
	destination string,
	selected *model.RouteLookupCandidate,
	candidates []*model.RouteLookupCandidate,
) string {

	if selected == nil {
		return fmt.Sprintf("No route found to %s. Check routing table or add a default route.", destination)
	}

	routeDest := string(selected.Route.Destination)
	const defaultRoute = "0.0.0.0/0"
	if routeDest == defaultRoute {
		gwStr := "unknown gateway"
		if selected.Route.Gateway != nil {
			gwStr = fmt.Sprintf("gateway %s", string(*selected.Route.Gateway))
		}
		return fmt.Sprintf("Using default route via %s", gwStr)
	}

	if len(candidates) == 1 {
		return fmt.Sprintf("Route %s selected (only matching route)", routeDest)
	}

	return fmt.Sprintf("Route %s selected (longest prefix match, distance %d)", routeDest, selected.Distance)
}

// detectVPNTunnel detects if an interface is a VPN tunnel.
func (s *Service) detectVPNTunnel(
	ctx context.Context,
	iface string,
) *model.VPNTunnelInfo {

	tunnelTypes := []string{"wireguard", "ovpn", "l2tp", "pptp", "sstp", "ipsec-peer", "gre", "eoip"}

	for _, tunnelType := range tunnelTypes {
		path := fmt.Sprintf("/interface/%s", tunnelType)
		cmd := router.Command{
			Path:   path,
			Action: "print",
			Args:   map[string]string{},
		}

		result, err := s.Port().ExecuteCommand(ctx, cmd)
		if err != nil {
			continue
		}

		if !result.Success || len(result.Data) == 0 {
			continue
		}

		// Search for matching interface name
		for _, data := range result.Data {
			name, ok := data["name"]
			if !ok || name != iface {
				continue
			}
			status := s.parseTunnelStatus(data["running"])
			remoteAddr := data["remote-address"]
			if remoteAddr == "" {
				remoteAddr = data["connect-to"]
			}
			var remoteAddrPtr *string
			if remoteAddr != "" {
				remoteAddrPtr = &remoteAddr
			}

			return &model.VPNTunnelInfo{
				Name:          name,
				Type:          tunnelType,
				Status:        status,
				RemoteAddress: remoteAddrPtr,
			}
		}
	}

	return nil
}

// parseTunnelStatus converts RouterOS running status to TunnelStatus enum.
func (s *Service) parseTunnelStatus(running string) model.TunnelStatus {
	const trueValue = "true"
	if running == trueValue || running == yesValue {
		return model.TunnelStatusConnected
	}
	return model.TunnelStatusDisconnected
}
