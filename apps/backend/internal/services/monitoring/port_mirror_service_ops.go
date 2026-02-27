// Package monitoring contains business logic services for monitoring and telemetry.
package monitoring

import (
	"context"
	"fmt"

	"backend/graph/model"
)

// EnablePortMirror enables a disabled port mirror configuration.
// This re-applies the mirror-ingress and/or mirror-egress settings.
func (s *PortMirrorService) EnablePortMirror(
	ctx context.Context,
	routerID string,
	mirrorID string,
) (*model.PortMirror, error) {

	if err := s.EnsureConnected(ctx); err != nil {
		return nil, fmt.Errorf("ensure connected: %w", err)
	}

	adapter, ok := s.Port().(interface {
		EnablePortMirror(ctx context.Context, routerID, mirrorID string) (*model.PortMirror, error)
	})
	if !ok {
		return nil, fmt.Errorf("router adapter does not support port mirroring")
	}

	mirror, err := adapter.EnablePortMirror(ctx, routerID, mirrorID)
	if err != nil {
		return nil, fmt.Errorf("enable port mirror: %w", err)
	}

	// Publish event
	if s.eventBus != nil { //nolint:revive,staticcheck // intentional no-op
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

	if err := s.EnsureConnected(ctx); err != nil {
		return nil, fmt.Errorf("ensure connected: %w", err)
	}

	adapter, ok := s.Port().(interface {
		DisablePortMirror(ctx context.Context, routerID, mirrorID string) (*model.PortMirror, error)
	})
	if !ok {
		return nil, fmt.Errorf("router adapter does not support port mirroring")
	}

	mirror, err := adapter.DisablePortMirror(ctx, routerID, mirrorID)
	if err != nil {
		return nil, fmt.Errorf("disable port mirror: %w", err)
	}

	// Publish event
	if s.eventBus != nil { //nolint:revive,staticcheck // intentional no-op
	}

	// Enrich with statistics
	stats, err := s.getPortMirrorStats(ctx, mirror.DestinationInterface.ID)
	if err == nil {
		mirror.Statistics = stats
	}

	return mirror, nil
}

// getPortMirrorStats retrieves statistics for the mirror destination interface.
func (s *PortMirrorService) getPortMirrorStats(
	ctx context.Context,
	destinationInterfaceID string,
) (*model.PortMirrorStats, error) {

	adapter, ok := s.Port().(interface {
		GetPortMirrorStats(ctx context.Context, destinationInterfaceID string) (*model.PortMirrorStats, error)
	})
	if !ok {
		return nil, fmt.Errorf("router adapter does not support port mirror statistics")
	}

	stats, err := adapter.GetPortMirrorStats(ctx, destinationInterfaceID)
	if err != nil {
		return nil, fmt.Errorf("get port mirror stats: %w", err)
	}
	return stats, nil
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
	//nolint:nestif // nested conditionals required for validation
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
