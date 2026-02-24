// Package routing provides business logic layer for route management.
package routing

import (
	"context"
	"fmt"
	"net"
	"strconv"
	"strings"

	"backend/graph/model"

	"backend/internal/router"
)

const trueValue = "true"

// ListRoutes fetches all routes from the router with optional filtering.
// Maps to: /ip/route/print
func (s *Service) ListRoutes(ctx context.Context, table *string, routeType *model.RouteType) ([]*model.Route, error) {
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
			cmd.Args["static"] = yesValue
		case model.RouteTypeConnected:
			cmd.Args["connect"] = yesValue
		case model.RouteTypeDynamic:
			cmd.Args["dynamic"] = yesValue
		case model.RouteTypeBgp:
			cmd.Args["bgp"] = yesValue
		case model.RouteTypeOspf:
			cmd.Args["ospf"] = yesValue
		}
	}

	result, err := s.Port().ExecuteCommand(ctx, cmd)
	if err != nil {
		return nil, fmt.Errorf("failed to list routes: %w", err)
	}

	if !result.Success {
		return nil, fmt.Errorf("command failed: %w", result.Error)
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
func (s *Service) GetRoute(ctx context.Context, id string) (*model.Route, error) {
	cmd := router.Command{
		Path:   "/ip/route",
		Action: "print",
		Args: map[string]string{
			".id": id,
		},
	}

	result, err := s.Port().ExecuteCommand(ctx, cmd)
	if err != nil {
		return nil, fmt.Errorf("failed to get route: %w", err)
	}

	if !result.Success || len(result.Data) == 0 {
		return nil, fmt.Errorf("route not found")
	}

	return s.mapRouteData(result.Data[0]), nil
}

// LookupRoute finds which route will be used for a destination IP.
// It performs longest prefix match and considers administrative distance for tiebreakers.
func (s *Service) LookupRoute(
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
	result, err := s.Port().ExecuteCommand(ctx, cmd)
	if err != nil {
		return nil, fmt.Errorf("failed to list routes: %w", err)
	}

	if !result.Success {
		return nil, fmt.Errorf("command failed: %w", result.Error)
	}

	// 3. Parse routes from result
	routes := make([]*model.Route, 0, len(result.Data))
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

// mapRouteData converts RouterOS data to GraphQL model.
func (s *Service) mapRouteData(data map[string]string) *model.Route {
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
		distance, _ := parseIntRoute(dist) //nolint:errcheck // distance parsing is best-effort
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
func (s *Service) determineRouteType(data map[string]string) model.RouteType {
	if data["bgp"] == trueValue {
		return model.RouteTypeBgp
	}
	if data["ospf"] == trueValue {
		return model.RouteTypeOspf
	}
	if data["dynamic"] == trueValue {
		return model.RouteTypeDynamic
	}
	if data["connect"] == trueValue {
		return model.RouteTypeConnected
	}
	return model.RouteTypeStatic
}

// Helper functions

func parseBool(s string) bool {
	return strings.EqualFold(s, "true") || strings.EqualFold(s, "yes")
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
