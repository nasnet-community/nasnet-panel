package resolver

import (
	"backend/graph/model"
	"backend/internal/apperrors"
	"backend/internal/vif/isolation"
)

// validateKillSwitchInput validates the SetKillSwitchInput.
func validateKillSwitchInput(input model.SetKillSwitchInput) error {
	if input.DeviceID == "" {
		return apperrors.NewValidationError("deviceID", "", "device ID is required")
	}
	if input.Mode == model.KillSwitchModeFallbackService {
		isSet := input.FallbackInterfaceID.IsSet()
		value := input.FallbackInterfaceID.Value()
		if !isSet || value == nil || *value == "" {
			msg := "fallback interface ID is required when mode is FALLBACK_SERVICE"
			return apperrors.NewValidationError("fallbackInterfaceID", "", msg)
		}
	}
	return nil
}

// mapKillSwitchMode converts GraphQL input to internal kill switch mode + fallback ID.
func mapKillSwitchMode(input model.SetKillSwitchInput) (mode isolation.KillSwitchMode, description string) {
	fallbackID := ""
	if input.FallbackInterfaceID.IsSet() && input.FallbackInterfaceID.Value() != nil {
		fallbackID = *input.FallbackInterfaceID.Value()
	}

	switch input.Mode {
	case model.KillSwitchModeFallbackService:
		return isolation.KillSwitchModeFallbackService, fallbackID
	case model.KillSwitchModeAllowDirect:
		return isolation.KillSwitchModeAllowDirect, fallbackID
	case model.KillSwitchModeBlockAll:
		return isolation.KillSwitchModeBlockAll, fallbackID
	default:
		return isolation.KillSwitchModeBlockAll, fallbackID
	}
}
