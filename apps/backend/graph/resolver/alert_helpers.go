package resolver

import (
	"backend/generated/ent"
	"backend/generated/ent/alertrule"
	"backend/graph/model"
	"backend/internal/alerts"
	"backend/internal/services"
)

// convertCreateAlertRuleInput converts GraphQL model input to service layer input.
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

// convertAlertRuleToModel converts ent AlertRule to GraphQL model.
// Returns nil if the input is nil.
func convertAlertRuleToModel(rule *ent.AlertRule) *model.AlertRule {
	if rule == nil {
		return nil
	}

	// Build GraphQL model from ent model
	return &model.AlertRule{
		ID:        rule.ID,
		Name:      rule.Name,
		EventType: rule.EventType,
		Enabled:   rule.Enabled,
		Severity:  model.AlertSeverity(rule.Severity),
		Channels:  rule.Channels,
		CreatedAt: rule.CreatedAt,
		UpdatedAt: rule.UpdatedAt,
	}
}

// convertAlertRuleTemplateToModel converts internal AlertRuleTemplate to GraphQL model.
// Handles both *alerts.AlertRuleTemplate and returns GraphQL representation.
func convertAlertRuleTemplateToModel(template *alerts.AlertRuleTemplate) *model.AlertRuleTemplate {
	if template == nil {
		return nil
	}

	// Convert template conditions (AlertCondition, not AlertConditionInput)
	conditions := make([]*model.AlertCondition, len(template.Conditions))
	for i, cond := range template.Conditions {
		conditions[i] = &model.AlertCondition{
			Field:    cond.Field,
			Operator: model.ConditionOperator(cond.Operator),
			Value:    cond.Value,
		}
	}

	// Convert template variables
	variables := make([]*model.AlertRuleTemplateVariable, len(template.Variables))
	for i, varDef := range template.Variables {
		variables[i] = &model.AlertRuleTemplateVariable{
			Name:         varDef.Name,
			Label:        varDef.Label,
			Type:         model.AlertRuleTemplateVariableType(varDef.Type),
			Required:     varDef.Required,
			DefaultValue: varDef.DefaultValue, // already *string
		}
	}

	return &model.AlertRuleTemplate{
		ID:          template.ID,
		Name:        template.Name,
		Description: template.Description,
		Category:    model.AlertRuleTemplateCategory(template.Category),
		EventType:   template.EventType,
		Severity:    model.AlertSeverity(template.Severity),
		Conditions:  conditions,
		Channels:    template.Channels,
		Variables:   variables,
		IsBuiltIn:   template.IsBuiltIn,
		Version:     template.Version,
	}
}

// convertAlertToModel converts ent Alert to GraphQL model.
// Returns nil if the input is nil.
func convertAlertToModel(a *ent.Alert) *model.Alert {
	if a == nil {
		return nil
	}

	// Extract rule ID if available in data
	var ruleID string
	if a.Data != nil {
		if rid, ok := a.Data["ruleId"].(string); ok {
			ruleID = rid
		}
	}

	return &model.Alert{
		ID:          a.ID,
		Title:       a.Title,
		Message:     a.Message,
		EventType:   a.EventType,
		Severity:    model.AlertSeverity(a.Severity),
		Data:        a.Data,
		DeviceID:    &a.DeviceID,
		TriggeredAt: a.TriggeredAt,
		Rule: &model.AlertRule{
			ID: ruleID,
		},
	}
}
