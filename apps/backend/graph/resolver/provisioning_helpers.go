package resolver

import (
	"backend/graph/model"
	"backend/internal/provisioning/types"
	provsvc "backend/internal/services/provisioning"
)

// toGQLSession converts an internal provisioning.Session to a GraphQL ProvisioningSession.
func toGQLSession(session *provsvc.Session) *model.ProvisioningSession {
	if session == nil {
		return nil
	}

	applyStatus := sessionStatusToGQL(session.Status)

	resourceIDs := make([]string, 0, len(session.Resources))
	for _, r := range session.Resources {
		resourceIDs = append(resourceIDs, r.ID)
	}

	wizardSteps := []model.WizardStep{
		model.WizardStepChoose,
		model.WizardStepWan,
		model.WizardStepLan,
		model.WizardStepExtra,
		model.WizardStepReview,
		model.WizardStepApply,
	}
	currentStep := model.WizardStepChoose
	if session.CurrentStep >= 0 && session.CurrentStep < len(wizardSteps) {
		currentStep = wizardSteps[session.CurrentStep]
	}

	mode := model.ProvisioningModeEasy
	if session.Mode == types.ModeAdvance {
		mode = model.ProvisioningModeAdvance
	}

	return &model.ProvisioningSession{
		ID:             session.ID,
		RouterID:       session.RouterID,
		Mode:           mode,
		Firmware:       model.ProvisioningFirmwareMikrotik,
		RouterMode:     model.ProvisioningRouterModeApMode,
		WanLinkType:    model.ProvisioningWANLinkTypeDomestic,
		ResourceIds:    resourceIDs,
		NetworksConfig: session.NetworksConfig,
		CurrentStep:    currentStep,
		ApplyStatus:    applyStatus,
		ErrorMessage:   errorMessagePtr(session.ErrorMessage),
		CreatedBy:      "system",
		CreatedAt:      session.CreatedAt,
		UpdatedAt:      session.CreatedAt,
		ExpiresAt:      session.ExpiresAt,
	}
}

// sessionStatusToGQL converts internal provisioning.SessionStatus to GraphQL ProvisioningApplyStatus.
func sessionStatusToGQL(status provsvc.SessionStatus) model.ProvisioningApplyStatus {
	switch status {
	case provsvc.SessionStatusValidated:
		return model.ProvisioningApplyStatusValidated
	case provsvc.SessionStatusApplying:
		return model.ProvisioningApplyStatusApplying
	case provsvc.SessionStatusApplied:
		return model.ProvisioningApplyStatusApplied
	case provsvc.SessionStatusFailed:
		return model.ProvisioningApplyStatusFailed
	case provsvc.SessionStatusDraft, provsvc.SessionStatusDiscarded:
		// draft and discarded both map to DRAFT
		return model.ProvisioningApplyStatusDraft
	default:
		return model.ProvisioningApplyStatusDraft
	}
}

// errorMessagePtr returns nil if the string is empty, otherwise returns a pointer to the string.
func errorMessagePtr(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}
