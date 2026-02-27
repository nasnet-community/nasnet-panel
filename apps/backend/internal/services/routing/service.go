// Package routing provides business logic layer for route management.
package routing

import (
	"context"
	"fmt"

	"backend/graph/model"
	"backend/internal/services/base"

	"backend/internal/router"
)

// Service handles route management operations.
type Service struct {
	base.Service
}

// NewService creates a new route service.
func NewService(port router.RouterPort) *Service {
	return &Service{
		Service: base.NewService(port),
	}
}

// CreateRoute creates a new route.
// Maps to: /ip/route/add
func (s *Service) CreateRoute(ctx context.Context, input model.RouteInput) (*model.Route, error) {
	builder := base.NewCommandArgsBuilder().
		AddString("dst-address", string(input.Destination))

	// Optional fields
	if input.Gateway.IsSet() && input.Gateway.Value() != nil {
		builder.AddString("gateway", string(*input.Gateway.Value()))
	}
	if input.Interface.IsSet() && input.Interface.Value() != nil {
		builder.AddString("interface", *input.Interface.Value())
	}
	if input.Distance.IsSet() && input.Distance.Value() != nil {
		builder.AddOptionalInt("distance", input.Distance.Value())
	}
	if input.RoutingMark.IsSet() && input.RoutingMark.Value() != nil {
		builder.AddOptionalString("routing-mark", input.RoutingMark.Value())
	}
	if input.RoutingTable.IsSet() && input.RoutingTable.Value() != nil {
		builder.AddOptionalString("routing-table", input.RoutingTable.Value())
	}
	if input.Comment.IsSet() && input.Comment.Value() != nil {
		builder.AddOptionalString("comment", input.Comment.Value())
	}

	cmd := router.Command{
		Path:   "/ip/route",
		Action: "add",
		Args:   builder.Build(),
	}

	result, err := s.ExecuteCommand(ctx, cmd, "create route")
	if err != nil {
		return nil, fmt.Errorf("failed to create route: %w", err)
	}

	// Fetch the created route to return complete data
	return s.GetRoute(ctx, result.ID)
}

// UpdateRoute updates an existing route.
// Maps to: /ip/route/set
func (s *Service) UpdateRoute(ctx context.Context, id string, input model.RouteInput) (*model.Route, error) {
	builder := base.NewCommandArgsBuilder().AddID(id)

	// Update fields that are provided
	if input.Gateway.IsSet() && input.Gateway.Value() != nil {
		builder.AddString("gateway", string(*input.Gateway.Value()))
	}
	if input.Interface.IsSet() && input.Interface.Value() != nil {
		builder.AddString("interface", *input.Interface.Value())
	}
	if input.Distance.IsSet() && input.Distance.Value() != nil {
		builder.AddOptionalInt("distance", input.Distance.Value())
	}
	if input.RoutingMark.IsSet() && input.RoutingMark.Value() != nil {
		builder.AddOptionalString("routing-mark", input.RoutingMark.Value())
	}
	if input.RoutingTable.IsSet() && input.RoutingTable.Value() != nil {
		builder.AddOptionalString("routing-table", input.RoutingTable.Value())
	}
	if input.Comment.IsSet() && input.Comment.Value() != nil {
		builder.AddOptionalString("comment", input.Comment.Value())
	}

	cmd := router.Command{
		Path:   "/ip/route",
		Action: "set",
		Args:   builder.Build(),
	}

	result, err := s.ExecuteCommand(ctx, cmd, "update route")
	if err != nil {
		return nil, fmt.Errorf("failed to update route: %w", err)
	}

	// Fetch the updated route
	return s.GetRoute(ctx, result.ID)
}

// DeleteRoute deletes a route.
// Maps to: /ip/route/remove
func (s *Service) DeleteRoute(ctx context.Context, id string) error {
	cmd := router.Command{
		Path:   "/ip/route",
		Action: "remove",
		Args:   base.NewCommandArgsBuilder().AddID(id).Build(),
	}

	_, err := s.ExecuteCommand(ctx, cmd, "delete route")
	if err != nil {
		return fmt.Errorf("failed to delete route: %w", err)
	}
	return nil
}
