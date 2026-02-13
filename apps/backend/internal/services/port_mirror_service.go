// Package services contains business logic services for NasNetConnect.
package services

import (
	"context"
	"fmt"

	"backend/graph/model"
	"backend/internal/events"
	"backend/internal/router"
)

// PortMirrorService provides port mirroring operations for MikroTik routers.
// Port mirroring allows traffic monitoring and analysis by copying packets
// from source interfaces to a destination interface.
//
// Follows hexagonal architecture pattern using RouterPort for router communication.
type PortMirrorService struct {
	routerPort router.RouterPort
	eventBus   events.EventBus
}

// PortMirrorServiceConfig holds configuration for PortMirrorService.
type PortMirrorServiceConfig struct {
	RouterPort router.RouterPort
	EventBus   events.EventBus
}

// NewPortMirrorService creates a new port mirror service.
func NewPortMirrorService(config PortMirrorServiceConfig) *PortMirrorService {
	return &PortMirrorService{
		routerPort: config.RouterPort,
		eventBus:   config.EventBus,
	}
}

// GetPortMirrors retrieves all port mirror configurations from a router.
// Port mirrors are grouped by destination interface, showing all source interfaces
// that mirror traffic to the same destination.
func (s *PortMirrorService) GetPortMirrors(ctx context.Context, routerID string) ([]*model.PortMirror, error) {
	// Check connection
	if !s.routerPort.IsConnected() {
		if err := s.routerPort.Connect(ctx); err != nil {
			return nil, fmt.Errorf("failed to connect to router: %w", err)
		}
	}

	// Execute RouterOS command via adapter
	// The adapter will handle querying /interface/bridge/port and grouping by mirror target
	adapter, ok := s.routerPort.(interface {
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
	if !s.routerPort.IsConnected() {
		if err := s.routerPort.Connect(ctx); err != nil {
			return nil, fmt.Errorf("failed to connect to router: %w", err)
		}
	}

	adapter, ok := s.routerPort.(interface {
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

	if !s.routerPort.IsConnected() {
		if err := s.routerPort.Connect(ctx); err != nil {
			return nil, fmt.Errorf("failed to connect to router: %w", err)
		}
	}

	adapter, ok := s.routerPort.(interface {
		CreatePortMirror(ctx context.Context, routerID string, input *model.CreatePortMirrorInput) (*model.PortMirror, error)
	})
	if !ok {
		return nil, fmt.Errorf("router adapter does not support port mirroring")
	}

	mirror, err := adapter.CreatePortMirror(ctx, routerID, input)
	if err != nil {
		return nil, fmt.Errorf("failed to create port mirror: %w", err)
	}

	// Publish event
	if s.eventBus != nil {
		// TODO: Publish port mirror created event
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

	if !s.routerPort.IsConnected() {
		if err := s.routerPort.Connect(ctx); err != nil {
			return nil, fmt.Errorf("failed to connect to router: %w", err)
		}
	}

	adapter, ok := s.routerPort.(interface {
		UpdatePortMirror(ctx context.Context, routerID, mirrorID string, input *model.UpdatePortMirrorInput) (*model.PortMirror, error)
	})
	if !ok {
		return nil, fmt.Errorf("router adapter does not support port mirroring")
	}

	mirror, err := adapter.UpdatePortMirror(ctx, routerID, mirrorID, input)
	if err != nil {
		return nil, fmt.Errorf("failed to update port mirror: %w", err)
	}

	// Publish event
	if s.eventBus != nil {
		// TODO: Publish port mirror updated event
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
	if !s.routerPort.IsConnected() {
		if err := s.routerPort.Connect(ctx); err != nil {
			return fmt.Errorf("failed to connect to router: %w", err)
		}
	}

	adapter, ok := s.routerPort.(interface {
		DeletePortMirror(ctx context.Context, routerID, mirrorID string) error
	})
	if !ok {
		return fmt.Errorf("router adapter does not support port mirroring")
	}

	if err := adapter.DeletePortMirror(ctx, routerID, mirrorID); err != nil {
		return fmt.Errorf("failed to delete port mirror: %w", err)
	}

	// Publish event
	if s.eventBus != nil {
		// TODO: Publish port mirror deleted event
	}

	return nil
}

// EnablePortMirror enables a disabled port mirror configuration.
// This re-applies the mirror-ingress and/or mirror-egress settings.
func (s *PortMirrorService) EnablePortMirror(
	ctx context.Context,
	routerID string,
	mirrorID string,
) (*model.PortMirror, error) {
	if !s.routerPort.IsConnected() {
		if err := s.routerPort.Connect(ctx); err != nil {
			return nil, fmt.Errorf("failed to connect to router: %w", err)
		}
	}

	adapter, ok := s.routerPort.(interface {
		EnablePortMirror(ctx context.Context, routerID, mirrorID string) (*model.PortMirror, error)
	})
	if !ok {
		return nil, fmt.Errorf("router adapter does not support port mirroring")
	}

	mirror, err := adapter.EnablePortMirror(ctx, routerID, mirrorID)
	if err != nil {
		return nil, fmt.Errorf("failed to enable port mirror: %w", err)
	}

	// Publish event
	if s.eventBus != nil {
		// TODO: Publish port mirror enabled event
	}

	// Enrich with statistics
	stats, err := s.getPortMirrorStats(ctx, mirror.DestinationInterface.ID)
	if err == nil {
		mirror.Statistics = stats
	}

	return mirror, nil
}

// DisablePortMirror disables a port mirror configuration without deleting it.
// This clears the mirror properties but preserves the configuration for re-enabling.
func (s *PortMirrorService) DisablePortMirror(
	ctx context.Context,
	routerID string,
	mirrorID string,
) (*model.PortMirror, error) {
	if !s.routerPort.IsConnected() {
		if err := s.routerPort.Connect(ctx); err != nil {
			return nil, fmt.Errorf("failed to connect to router: %w", err)
		}
	}

	adapter, ok := s.routerPort.(interface {
		DisablePortMirror(ctx context.Context, routerID, mirrorID string) (*model.PortMirror, error)
	})
	if !ok {
		return nil, fmt.Errorf("router adapter does not support port mirroring")
	}

	mirror, err := adapter.DisablePortMirror(ctx, routerID, mirrorID)
	if err != nil {
		return nil, fmt.Errorf("failed to disable port mirror: %w", err)
	}

	// Publish event
	if s.eventBus != nil {
		// TODO: Publish port mirror disabled event
	}

	// Enrich with statistics
	stats, err := s.getPortMirrorStats(ctx, mirror.DestinationInterface.ID)
	if err == nil {
		mirror.Statistics = stats
	}

	return mirror, nil
}

// Helper methods

// getPortMirrorStats retrieves statistics for the mirror destination interface.
func (s *PortMirrorService) getPortMirrorStats(
	ctx context.Context,
	destinationInterfaceID string,
) (*model.PortMirrorStats, error) {
	adapter, ok := s.routerPort.(interface {
		GetPortMirrorStats(ctx context.Context, destinationInterfaceID string) (*model.PortMirrorStats, error)
	})
	if !ok {
		return nil, fmt.Errorf("router adapter does not support port mirror statistics")
	}

	return adapter.GetPortMirrorStats(ctx, destinationInterfaceID)
}

// validateCreateInput validates the create port mirror input.
func (s *PortMirrorService) validateCreateInput(input *model.CreatePortMirrorInput) error {
	if input == nil {
		return fmt.Errorf("input is nil")
	}

	if input.Name == "" {
		return fmt.Errorf("name is required")
	}

	if len(input.SourceInterfaceIds) == 0 {
		return fmt.Errorf("at least one source interface is required")
	}

	if input.DestinationInterfaceID == "" {
		return fmt.Errorf("destination interface is required")
	}

	// Check that destination is not in sources
	for _, sourceID := range input.SourceInterfaceIds {
		if sourceID == input.DestinationInterfaceID {
			return fmt.Errorf("destination interface cannot be a source interface")
		}
	}

	return nil
}

// validateUpdateInput validates the update port mirror input.
func (s *PortMirrorService) validateUpdateInput(input *model.UpdatePortMirrorInput) error {
	if input == nil {
		return fmt.Errorf("input is nil")
	}

	// At least one field must be provided
	// Use IsSet() to check if omittable fields were provided
	if !input.Name.IsSet() && !input.SourceInterfaceIds.IsSet() &&
		!input.DestinationInterfaceID.IsSet() && !input.Direction.IsSet() && !input.Comment.IsSet() {
		return fmt.Errorf("at least one field must be provided for update")
	}

	// If source interfaces are provided, validate
	if input.SourceInterfaceIds.IsSet() {
		sourceIDs := input.SourceInterfaceIds.Value()
		if len(sourceIDs) == 0 {
			return fmt.Errorf("at least one source interface is required")
		}

		// Check that destination is not in sources (if both provided)
		if input.DestinationInterfaceID.IsSet() {
			destID := input.DestinationInterfaceID.Value()
			if destID != nil {
				for _, sourceID := range sourceIDs {
					if sourceID == *destID {
						return fmt.Errorf("destination interface cannot be a source interface")
					}
				}
			}
		}
	}

	return nil
}
