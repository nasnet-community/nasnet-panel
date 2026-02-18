package resolver

// This file handles kill switch mutation resolvers.

import (
	"backend/generated/ent"
	"backend/generated/ent/devicerouting"
	"backend/graph/model"
	"backend/internal/vif/isolation"
	"context"
	"fmt"
)

// SetKillSwitch resolves the setKillSwitch mutation.
func (r *mutationResolver) SetKillSwitch(ctx context.Context, input model.SetKillSwitchInput) (*model.DeviceRouting, error) {
	// Get router port for this router
	routerPort, err := r.getRouterPortTyped(ctx, input.RouterID)
	if err != nil {
		return nil, fmt.Errorf("failed to get router port: %w", err)
	}

	// Query the existing device routing
	dr, err := r.db.DeviceRouting.
		Query().
		Where(devicerouting.DeviceIDEQ(input.DeviceID)).
		Only(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return nil, fmt.Errorf("device routing not found for device %s", input.DeviceID)
		}
		return nil, fmt.Errorf("failed to query device routing: %w", err)
	}

	// Create KillSwitchManager
	killSwitchManager := isolation.NewKillSwitchManager(routerPort, r.db, r.EventBus, r.EventPublisher)

	//nolint:nestif // nested structure needed for enable/disable logic
	if input.Enabled {
		// Map kill switch mode from GraphQL to isolation mode
		killSwitchModeInner := isolation.KillSwitchModeBlockAll
		switch input.Mode {
		case model.KillSwitchModeBlockAll:
			killSwitchModeInner = isolation.KillSwitchModeBlockAll
		case model.KillSwitchModeFallbackService:
			killSwitchModeInner = isolation.KillSwitchModeFallbackService
		case model.KillSwitchModeAllowDirect:
			killSwitchModeInner = isolation.KillSwitchModeAllowDirect
		}

		fallbackInterfaceID := ""
		if input.FallbackInterfaceID.IsSet() && input.FallbackInterfaceID.Value() != nil {
			fallbackInterfaceID = *input.FallbackInterfaceID.Value()
		}

		enableErr := killSwitchManager.Enable(ctx, dr.ID, killSwitchModeInner, fallbackInterfaceID)
		if enableErr != nil {
			return nil, fmt.Errorf("failed to enable kill switch: %w", enableErr)
		}
	} else {
		disableErr := killSwitchManager.Disable(ctx, dr.ID)
		if disableErr != nil {
			return nil, fmt.Errorf("failed to disable kill switch: %w", disableErr)
		}
	}

	// Query the updated routing from DB
	updatedRouting, queryErr := r.db.DeviceRouting.Get(ctx, dr.ID)
	if queryErr != nil {
		return nil, fmt.Errorf("failed to query updated routing: %w", queryErr)
	}

	return convertDeviceRouting(updatedRouting), nil
}
