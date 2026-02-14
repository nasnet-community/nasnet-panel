package resolver

import (
	"backend/generated/ent"
	"backend/generated/ent/alertrule"
	"backend/generated/graphql"
	
	"backend/internal/services"
)

// convertCreateAlertRuleInput converts GraphQL model input to service layer input
func convertCreateAlertRuleInput(input *model.CreateAlertRuleInput) services.CreateAlertRuleInput {
	result := services.CreateAlertRuleInput{
		Name:      input.Name,
		EventType: input.EventType,
		Channels:  input.Channels,
		Enabled:   true,
	}

	// Convert severity
	result.Severity = alertrule.Severity(input.Severity)

	return result
}

// convertAlertRuleToModel converts ent AlertRule to GraphQL model
func convertAlertRuleToModel(rule *ent.AlertRule) *model.AlertRule {
	// Stub implementation - return nil for now
	// TODO: Implement proper conversion when GraphQL types are finalized
	return nil
}

// convertAlertRuleTemplateToModel converts AlertRuleTemplate to GraphQL model
func convertAlertRuleTemplateToModel(template interface{}) *model.AlertRuleTemplate {
	// Stub implementation - return nil for now
	// TODO: Implement proper conversion when GraphQL types are finalized
	return nil
}

// convertAlertToModel converts ent Alert to GraphQL model
func convertAlertToModel(a *ent.Alert) *model.Alert {
	// Stub implementation - return nil for now
	// TODO: Implement proper conversion when GraphQL types are finalized
	return nil
}
