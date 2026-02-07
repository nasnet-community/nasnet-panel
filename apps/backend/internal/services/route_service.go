// Package services provides business logic layer for route management.
package services

import (
	"context"
	"fmt"
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
			if ms, _ := parseInt(avgTime); ms > 0 {
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
		distance, _ := parseInt(dist)
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

// Helper functions

func parseBool(s string) bool {
	return strings.ToLower(s) == "true" || s == "yes"
}
