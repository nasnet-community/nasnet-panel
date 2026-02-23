// Package monitoring contains business logic services for monitoring and telemetry.
package monitoring

import (
	"context"
	"fmt"

	"backend/graph/model"
	"backend/internal/services/base"

	"backend/internal/events"
)

// PortMirrorService provides port mirroring operations for MikroTik routers.
// Port mirroring allows traffic monitoring and analysis by copying packets
// from source interfaces to a destination interface.
//
// Follows hexagonal architecture pattern using RouterPort for router communication.
type PortMirrorService struct {
	base.Service
	eventBus events.EventBus
}

// NewPortMirrorService creates a new port mirror service.
func NewPortMirrorService(config base.ServiceConfig) *PortMirrorService {
	return &PortMirrorService{
		Service:  base.NewService(config.RouterPort),
		eventBus: config.EventBus,
	}
}

// GetPortMirrors retrieves all port mirror configurations from a router.
// Port mirrors are grouped by destination interface, showing all source interfaces
// that mirror traffic to the same destination.
func (s *PortMirrorService) GetPortMirrors(ctx context.Context, routerID string) ([]*model.PortMirror, error) {
	// Check connection
	if err := s.EnsureConnected(ctx); err != nil {
		return nil, err
	}

	// Execute RouterOS command via adapter
	// The adapter will handle querying /interface/bridge/port and grouping by mirror target
	adapter, ok := s.Port().(interface {
		GetPortMirrors(ctx context.Context, routerID string) ([]*model.PortMirror, error)
	})
	if !ok {
		return nil, fmt.Errorf("router adapter does not support port mirroring")
	}

	mirrors, err := adapter.GetPortMirrors(ctx, routerID)
	if err != nil {
		return nil, fmt.Errorf("failed to get port mirrors: %w", err)
	}

	// Enrich with statistics
	for _, mirror := range mirrors {
		stats, err := s.getPortMirrorStats(ctx, mirror.DestinationInterface.ID)
		if err == nil {
			mirror.Statistics = stats
		}
	}

	return mirrors, nil
}

// GetPortMirror retrieves a single port mirror configuration by ID.
// The ID corresponds to the destination interface name.
func (s *PortMirrorService) GetPortMirror(ctx context.Context, routerID, mirrorID string) (*model.PortMirror, error) {
	if err := s.EnsureConnected(ctx); err != nil {
		return nil, err
	}

	adapter, ok := s.Port().(interface {
		GetPortMirror(ctx context.Context, routerID, mirrorID string) (*model.PortMirror, error)
	})
	if !ok {
		return nil, fmt.Errorf("router adapter does not support port mirroring")
	}

	mirror, err := adapter.GetPortMirror(ctx, routerID, mirrorID)
	if err != nil {
		return nil, fmt.Errorf("failed to get port mirror: %w", err)
	}

	// Enrich with statistics
	stats, err := s.getPortMirrorStats(ctx, mirror.DestinationInterface.ID)
	if err == nil {
		mirror.Statistics = stats
	}

	return mirror, nil
}

// CreatePortMirror creates a new port mirror configuration.
// Source interfaces must be bridge members. The destination interface can be any interface.
func (s *PortMirrorService) CreatePortMirror(
	ctx context.Context,
	routerID string,
	input *model.CreatePortMirrorInput,
) (*model.PortMirror, error) {
	// Validate input
	if err := s.validateCreateInput(input); err != nil {
		return nil, fmt.Errorf("invalid input: %w", err)
	}

	if err := s.EnsureConnected(ctx); err != nil {
		return nil, err
	}

	adapter, ok := s.Port().(interface {
		CreatePortMirror(ctx context.Context, routerID string, input *model.CreatePortMirrorInput) (*model.PortMirror, error)
	})
	if !ok {
		return nil, fmt.Errorf("router adapter does not support port mirroring")
	}

	mirror, err := adapter.CreatePortMirror(ctx, routerID, input)
	if err != nil {
		return nil, fmt.Errorf("failed to create port mirror: %w", err)
	}

	// Publish port mirror created event
	if s.eventBus != nil {
		event := events.NewGenericEvent("port_mirror.created", events.PriorityNormal, "port-mirror-service", map[string]interface{}{
			"mirror_id":             mirror.ID,
			"destination_interface": mirror.DestinationInterface.ID,
		})
		_ = s.eventBus.Publish(ctx, event) //nolint:errcheck // non-critical event
	}

	// Enrich with statistics
	stats, err := s.getPortMirrorStats(ctx, mirror.DestinationInterface.ID)
	if err == nil {
		mirror.Statistics = stats
	}

	return mirror, nil
}

// UpdatePortMirror updates an existing port mirror configuration.
// Can update source interfaces, destination interface, direction, or comment.
func (s *PortMirrorService) UpdatePortMirror(
	ctx context.Context,
	routerID string,
	mirrorID string,
	input *model.UpdatePortMirrorInput,
) (*model.PortMirror, error) {
	// Validate input
	if err := s.validateUpdateInput(input); err != nil {
		return nil, fmt.Errorf("invalid input: %w", err)
	}

	if err := s.EnsureConnected(ctx); err != nil {
		return nil, err
	}

	adapter, ok := s.Port().(interface {
		UpdatePortMirror(ctx context.Context, routerID, mirrorID string, input *model.UpdatePortMirrorInput) (*model.PortMirror, error)
	})
	if !ok {
		return nil, fmt.Errorf("router adapter does not support port mirroring")
	}

	mirror, err := adapter.UpdatePortMirror(ctx, routerID, mirrorID, input)
	if err != nil {
		return nil, fmt.Errorf("failed to update port mirror: %w", err)
	}

	// Publish port mirror updated event
	if s.eventBus != nil {
		event := events.NewGenericEvent("port_mirror.updated", events.PriorityNormal, "port-mirror-service", map[string]interface{}{
			"mirror_id":             mirror.ID,
			"destination_interface": mirror.DestinationInterface.ID,
		})
		_ = s.eventBus.Publish(ctx, event) //nolint:errcheck // non-critical event
	}

	// Enrich with statistics
	stats, err := s.getPortMirrorStats(ctx, mirror.DestinationInterface.ID)
	if err == nil {
		mirror.Statistics = stats
	}

	return mirror, nil
}

// DeletePortMirror removes a port mirror configuration.
// This clears the mirror-ingress and mirror-egress properties on all source ports.
func (s *PortMirrorService) DeletePortMirror(ctx context.Context, routerID, mirrorID string) error {
	if err := s.EnsureConnected(ctx); err != nil {
		return err
	}

	adapter, ok := s.Port().(interface {
		DeletePortMirror(ctx context.Context, routerID, mirrorID string) error
	})
	if !ok {
		return fmt.Errorf("router adapter does not support port mirroring")
	}

	if err := adapter.DeletePortMirror(ctx, routerID, mirrorID); err != nil {
		return fmt.Errorf("failed to delete port mirror: %w", err)
	}

	// Publish port mirror deleted event
	if s.eventBus != nil {
		event := events.NewGenericEvent("port_mirror.deleted", events.PriorityNormal, "port-mirror-service", map[string]interface{}{
			"mirror_id": mirrorID,
		})
		_ = s.eventBus.Publish(ctx, event) //nolint:errcheck // non-critical event
	}

	return nil
}
