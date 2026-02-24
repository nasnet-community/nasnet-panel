package resolver

// This file handles kill switch mutation resolvers.

import (
	"backend/generated/ent"
	"backend/generated/ent/devicerouting"
	"backend/graph/model"
	"backend/internal/errors"
	"backend/internal/vif/isolation"
	"context"
)

// validateKillSwitchInput validates the SetKillSwitch input fields.
func validateKillSwitchInput(input model.SetKillSwitchInput) error {
	if input.RouterID == "" {
		return errors.NewValidationError("routerID", "", "required")
	}
	if input.DeviceID == "" {
		return errors.NewValidationError("deviceID", "", "required")
	}
	if input.Enabled {
		if input.Mode == model.KillSwitchModeFallbackService {
			if !input.FallbackInterfaceID.IsSet() || input.FallbackInterfaceID.Value() == nil {
				return errors.NewValidationError(
					"fallbackInterfaceID",
					nil,
					"required for fallback service mode",
				)
			}
		}
	}
	return nil
}

// mapKillSwitchMode converts GraphQL mode to isolation mode and extracts fallback ID.
func mapKillSwitchMode(
	input model.SetKillSwitchInput,
) (mode isolation.KillSwitchMode, fallbackID string) {

	killSwitchMode := isolation.KillSwitchModeBlockAll
	switch input.Mode {
	case model.KillSwitchModeBlockAll:
		killSwitchMode = isolation.KillSwitchModeBlockAll
	case model.KillSwitchModeFallbackService:
		killSwitchMode = isolation.KillSwitchModeFallbackService
	case model.KillSwitchModeAllowDirect:
		killSwitchMode = isolation.KillSwitchModeAllowDirect
	}

	fallbackInterfaceID := ""
	if input.FallbackInterfaceID.IsSet() && input.FallbackInterfaceID.Value() != nil {
		fallbackInterfaceID = *input.FallbackInterfaceID.Value()
	}
	return killSwitchMode, fallbackInterfaceID
}

// SetKillSwitch resolves the setKillSwitch mutation.
func (r *mutationResolver) SetKillSwitch(ctx context.Context, input model.SetKillSwitchInput) (*model.DeviceRouting, error) {
	// Validate inputs
	if validationErr := validateKillSwitchInput(input); validationErr != nil {
		return nil, validationErr
	}

	// Verify kill switch manager is configured
	if r.Resolver.KillSwitchManager == nil {
		return nil, errors.NewResourceError(
			errors.CodeDependencyNotReady,
			"kill switch manager not configured",
			"KillSwitchManager",
			"",
		)
	}

	// Query the existing device routing
	dr, err := r.db.DeviceRouting.
		Query().
		Where(devicerouting.DeviceIDEQ(input.DeviceID)).
		Only(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return nil, errors.NewResourceError(
				errors.CodeResourceNotFound,
				"device routing not found",
				"DeviceRouting",
				input.DeviceID,
			)
		}
		return nil, errors.Wrap(
			err,
			errors.CodeResourceNotFound,
			errors.CategoryResource,
			"failed to query device routing",
		)
	}

	// Verify device routing is not nil
	if dr == nil {
		return nil, errors.NewResourceError(
			errors.CodeResourceNotFound,
			"device routing is nil after query",
			"DeviceRouting",
			input.DeviceID,
		)
	}

	// Apply kill switch configuration
	if input.Enabled {
		killSwitchMode, fallbackInterfaceID := mapKillSwitchMode(input)
		enableErr := r.Resolver.KillSwitchManager.Enable(ctx, dr.ID, killSwitchMode, fallbackInterfaceID)
		if enableErr != nil {
			return nil, errors.Wrap(
				enableErr,
				errors.CodeCommandFailed,
				errors.CategoryProtocol,
				"failed to enable kill switch",
			)
		}
	} else {
		disableErr := r.Resolver.KillSwitchManager.Disable(ctx, dr.ID)
		if disableErr != nil {
			return nil, errors.Wrap(
				disableErr,
				errors.CodeCommandFailed,
				errors.CategoryProtocol,
				"failed to disable kill switch",
			)
		}
	}

	// Query the updated routing from DB
	updatedRouting, queryErr := r.db.DeviceRouting.Get(ctx, dr.ID)
	if queryErr != nil {
		return nil, errors.Wrap(
			queryErr,
			errors.CodeResourceNotFound,
			errors.CategoryResource,
			"failed to query updated routing",
		)
	}

	return convertDeviceRouting(updatedRouting), nil
}
