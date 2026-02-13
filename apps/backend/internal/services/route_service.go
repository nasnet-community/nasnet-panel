// Package services provides business logic layer for route management.
package services

import (
	"context"
	"fmt"
	"net"
	"strconv"
	"strings"

	"backend/graph/model"
	"backend/internal/router"
)

// RouteService handles route management operations.
type RouteService struct {
	// RouterPort is the interface for executing commands on routers.
	// In production, this would be obtained through the RouterService.
	port router.RouterPort
}

// NewRouteService creates a new route service.
func NewRouteService(port router.RouterPort) *RouteService {
	return &RouteService{
		port: port,
	}
}

// ListRoutes fetches all routes from the router with optional filtering.
// Maps to: /ip/route/print
func (s *RouteService) ListRoutes(ctx context.Context, table *string, routeType *model.RouteType) ([]*model.Route, error) {
	cmd := router.Command{
		Path:   "/ip/route",
		Action: "print",
		Args:   make(map[string]string),
	}

	// Add filter for routing table if specified
	if table != nil && *table != "" {
		cmd.Args["routing-table"] = *table
	}

	// Add filter for route type if specified
	if routeType != nil {
		switch *routeType {
		case model.RouteTypeStatic:
			cmd.Args["static"] = "yes"
		case model.RouteTypeConnected:
			cmd.Args["connect"] = "yes"
		case model.RouteTypeDynamic:
			cmd.Args["dynamic"] = "yes"
		case model.RouteTypeBgp:
			cmd.Args["bgp"] = "yes"
		case model.RouteTypeOspf:
			cmd.Args["ospf"] = "yes"
		}
	}

	result, err := s.port.ExecuteCommand(ctx, cmd)
	if err != nil {
		return nil, fmt.Errorf("failed to list routes: %w", err)
	}

	if !result.Success {
		return nil, fmt.Errorf("command failed: %v", result.Error)
	}

	// Convert RouterOS response to GraphQL model
	routes := make([]*model.Route, 0, len(result.Data))
	for _, data := range result.Data {
		route := s.mapRouteData(data)
		routes = append(routes, route)
	}

	return routes, nil
}

// GetRoute fetches a single route by ID.
func (s *RouteService) GetRoute(ctx context.Context, id string) (*model.Route, error) {
	cmd := router.Command{
		Path:   "/ip/route",
		Action: "print",
		Args: map[string]string{
			".id": id,
		},
	}

	result, err := s.port.ExecuteCommand(ctx, cmd)
	if err != nil {
		return nil, fmt.Errorf("failed to get route: %w", err)
	}

	if !result.Success || len(result.Data) == 0 {
		return nil, fmt.Errorf("route not found")
	}

	return s.mapRouteData(result.Data[0]), nil
}

// CreateRoute creates a new route.
// Maps to: /ip/route/add
func (s *RouteService) CreateRoute(ctx context.Context, input model.RouteInput) (*model.Route, error) {
	args := make(map[string]string)

	// Required field: destination
	args["dst-address"] = string(input.Destination)

	// Optional fields
	if input.Gateway.IsSet() && input.Gateway.Value() != nil {
		args["gateway"] = string(*input.Gateway.Value())
	}

	if input.Interface.IsSet() && input.Interface.Value() != nil {
		args["interface"] = *input.Interface.Value()
	}

	if input.Distance.IsSet() && input.Distance.Value() != nil {
		args["distance"] = fmt.Sprintf("%d", *input.Distance.Value())
	}

	if input.RoutingMark.IsSet() && input.RoutingMark.Value() != nil {
		args["routing-mark"] = *input.RoutingMark.Value()
	}

	if input.RoutingTable.IsSet() && input.RoutingTable.Value() != nil {
		args["routing-table"] = *input.RoutingTable.Value()
	}

	if input.Comment.IsSet() && input.Comment.Value() != nil {
		args["comment"] = *input.Comment.Value()
	}

	cmd := router.Command{
		Path:   "/ip/route",
		Action: "add",
		Args:   args,
	}

	result, err := s.port.ExecuteCommand(ctx, cmd)
	if err != nil {
		return nil, fmt.Errorf("failed to create route: %w", err)
	}

	if !result.Success {
		return nil, fmt.Errorf("command failed: %v", result.Error)
	}

	// Fetch the created route to return complete data
	return s.GetRoute(ctx, result.ID)
}

// UpdateRoute updates an existing route.
// Maps to: /ip/route/set
func (s *RouteService) UpdateRoute(ctx context.Context, id string, input model.RouteInput) (*model.Route, error) {
	args := make(map[string]string)
	args[".id"] = id

	// Update fields that are provided
	if input.Gateway.IsSet() && input.Gateway.Value() != nil {
		args["gateway"] = string(*input.Gateway.Value())
	}

	if input.Interface.IsSet() && input.Interface.Value() != nil {
		args["interface"] = *input.Interface.Value()
	}

	if input.Distance.IsSet() && input.Distance.Value() != nil {
		args["distance"] = fmt.Sprintf("%d", *input.Distance.Value())
	}

	if input.RoutingMark.IsSet() && input.RoutingMark.Value() != nil {
		args["routing-mark"] = *input.RoutingMark.Value()
	}

	if input.RoutingTable.IsSet() && input.RoutingTable.Value() != nil {
		args["routing-table"] = *input.RoutingTable.Value()
	}

	if input.Comment.IsSet() && input.Comment.Value() != nil {
		args["comment"] = *input.Comment.Value()
	}

	cmd := router.Command{
		Path:   "/ip/route",
		Action: "set",
		Args:   args,
	}

	result, err := s.port.ExecuteCommand(ctx, cmd)
	if err != nil {
		return nil, fmt.Errorf("failed to update route: %w", err)
	}

	if !result.Success {
		return nil, fmt.Errorf("command failed: %v", result.Error)
	}

	// Fetch the updated route
	return s.GetRoute(ctx, id)
}

// DeleteRoute deletes a route.
// Maps to: /ip/route/remove
func (s *RouteService) DeleteRoute(ctx context.Context, id string) error {
	cmd := router.Command{
		Path:   "/ip/route",
		Action: "remove",
		Args: map[string]string{
			".id": id,
		},
	}

	result, err := s.port.ExecuteCommand(ctx, cmd)
	if err != nil {
		return fmt.Errorf("failed to delete route: %w", err)
	}

	if !result.Success {
		return fmt.Errorf("command failed: %v", result.Error)
	}

	return nil
}

// CheckGatewayReachability checks if a gateway is reachable.
// Maps to: /tool/ping (simplified check)
func (s *RouteService) CheckGatewayReachability(ctx context.Context, gateway model.IPv4) (*model.GatewayReachabilityResult, error) {
	// Use /tool/ping to check reachability
	cmd := router.Command{
		Path:   "/tool/ping",
		Action: "execute",
		Args: map[string]string{
			"address": string(gateway),
			"count":   "3",
		},
	}

	result, err := s.port.ExecuteCommand(ctx, cmd)
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
			if ms, _ := parseIntRoute(avgTime); ms > 0 {
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
func (s *RouteService) AnalyzeRouteImpact(ctx context.Context, route *model.Route) *model.RouteImpactAnalysis {
	isDefaultRoute := route.Destination == "0.0.0.0/0"

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

// mapRouteData converts RouterOS data to GraphQL model.
func (s *RouteService) mapRouteData(data map[string]string) *model.Route {
	route := &model.Route{
		ID:          data[".id"],
		Destination: model.CIDR(data["dst-address"]),
		Active:      parseBool(data["active"]),
	}

	// Optional fields
	if gw, ok := data["gateway"]; ok {
		gateway := model.IPv4(gw)
		route.Gateway = &gateway
	}

	if iface, ok := data["interface"]; ok {
		route.Interface = &iface
	}

	if dist, ok := data["distance"]; ok {
		distance, _ := parseIntRoute(dist)
		route.Distance = distance
	}

	if mark, ok := data["routing-mark"]; ok {
		route.RoutingMark = &mark
	}

	if table, ok := data["routing-table"]; ok {
		route.RoutingTable = &table
	}

	if comment, ok := data["comment"]; ok {
		route.Comment = &comment
	}

	if disabled, ok := data["disabled"]; ok {
		dis := parseBool(disabled)
		route.Disabled = &dis
	}

	// Determine route type
	route.Type = s.determineRouteType(data)

	// Determine route scope (simplified)
	route.Scope = model.RouteScopeGlobal

	return route
}

// determineRouteType determines the route type from RouterOS flags.
func (s *RouteService) determineRouteType(data map[string]string) model.RouteType {
	if data["bgp"] == "true" {
		return model.RouteTypeBgp
	}
	if data["ospf"] == "true" {
		return model.RouteTypeOspf
	}
	if data["dynamic"] == "true" {
		return model.RouteTypeDynamic
	}
	if data["connect"] == "true" {
		return model.RouteTypeConnected
	}
	return model.RouteTypeStatic
}

// LookupRoute finds which route will be used for a destination IP.
// It performs longest prefix match and considers administrative distance for tiebreakers.
func (s *RouteService) LookupRoute(
	ctx context.Context,
	destination string,
	source *string,
) (*model.RouteLookupResult, error) {
	// 1. Build RouterOS command to fetch all routes
	cmd := router.Command{
		Path:   "/ip/route",
		Action: "print",
		Args:   map[string]string{},
	}

	// 2. Execute command
	result, err := s.port.ExecuteCommand(ctx, cmd)
	if err != nil {
		return nil, fmt.Errorf("failed to list routes: %w", err)
	}

	if !result.Success {
		return nil, fmt.Errorf("command failed: %v", result.Error)
	}

	// 3. Parse routes from result
	var routes []*model.Route
	for _, routeData := range result.Data {
		route := s.mapRouteData(routeData)
		routes = append(routes, route)
	}

	// 4. Find matching routes using longest prefix match
	candidates := s.findMatchingRoutes(destination, routes)

	// 5. Select best route (longest prefix, then lowest distance)
	selected := s.selectBestRoute(candidates)

	// 6. Generate explanation
	explanation := s.generateExplanation(destination, selected, candidates)

	// 7. Detect VPN tunnel if applicable
	var vpnInfo *model.VPNTunnelInfo
	if selected != nil && selected.Route.Interface != nil {
		vpnInfo = s.detectVPNTunnel(ctx, *selected.Route.Interface)
	}

	// 8. Build result
	routeType := model.RouteTypeStatic
	isDefaultRoute := false
	var gateway, iface *string
	var distance *int

	if selected != nil {
		routeType = selected.Route.Type
		isDefaultRoute = string(selected.Route.Destination) == "0.0.0.0/0"
		if selected.Route.Gateway != nil {
			gwStr := string(*selected.Route.Gateway)
			gateway = &gwStr
		}
		iface = selected.Route.Interface
		dist := selected.Route.Distance
		distance = &dist
	}

	var matchedRoute *model.Route
	if selected != nil {
		matchedRoute = selected.Route
	}

	return &model.RouteLookupResult{
		Destination:     destination,
		MatchedRoute:    matchedRoute,
		Gateway:         gateway,
		Interface:       iface,
		Distance:        distance,
		RouteType:       routeType,
		IsDefaultRoute:  isDefaultRoute,
		CandidateRoutes: candidates,
		Explanation:     explanation,
		VpnTunnel:       vpnInfo,
	}, nil
}

// findMatchingRoutes finds all routes that match the destination IP.
func (s *RouteService) findMatchingRoutes(
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
func (s *RouteService) selectBestRoute(
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
func (s *RouteService) getSelectionReason(
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
func (s *RouteService) generateExplanation(
	destination string,
	selected *model.RouteLookupCandidate,
	candidates []*model.RouteLookupCandidate,
) string {
	if selected == nil {
		return fmt.Sprintf("No route found to %s. Check routing table or add a default route.", destination)
	}

	routeDest := string(selected.Route.Destination)
	if routeDest == "0.0.0.0/0" {
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
func (s *RouteService) detectVPNTunnel(
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

		result, err := s.port.ExecuteCommand(ctx, cmd)
		if err != nil {
			continue
		}

		if !result.Success || len(result.Data) == 0 {
			continue
		}

		// Search for matching interface name
		for _, data := range result.Data {
			if name, ok := data["name"]; ok && name == iface {
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
	}

	return nil
}

// parseTunnelStatus converts RouterOS running status to TunnelStatus enum.
func (s *RouteService) parseTunnelStatus(running string) model.TunnelStatus {
	if running == "true" || running == "yes" {
		return model.TunnelStatusConnected
	}
	return model.TunnelStatusDisconnected
}

// Helper functions

func parseBool(s string) bool {
	return strings.ToLower(s) == "true" || s == "yes"
}

func parseIntRoute(s string) (int, error) {
	if s == "" {
		return 0, fmt.Errorf("empty string")
	}
	i, err := strconv.Atoi(s)
	if err != nil {
		return 0, fmt.Errorf("invalid integer: %w", err)
	}
	return i, nil
}

// parseIP parses an IP address string and returns a net.IP.
func parseIP(ipStr string) net.IP {
	ip := net.ParseIP(ipStr)
	if ip == nil {
		// Return empty IP if parsing fails
		return net.IP{}
	}
	return ip
}

// parseCIDRRoute parses a CIDR string and returns the network.
func parseCIDRRoute(cidr string) *net.IPNet {
	_, network, err := net.ParseCIDR(cidr)
	if err != nil {
		// Return nil network if parsing fails
		return nil
	}
	return network
}

// getPrefixLength extracts the prefix length from a CIDR string.
func getPrefixLength(cidr string) int {
	parts := strings.Split(cidr, "/")
	if len(parts) != 2 {
		return 0
	}
	length, err := strconv.Atoi(parts[1])
	if err != nil {
		return 0
	}
	return length
}
