// Package services provides business logic layer for route management.
package services

import (
	"context"
	"fmt"

	"backend/generated/graphql"
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
