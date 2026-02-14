package resolver

// This file contains alert mutation resolvers.
// Alert query and subscription resolvers are in alerts_queries.resolvers.go.

import (
	"backend/generated/graphql"
	
	"backend/internal/alerts"
	"backend/internal/services"
	"context"
	"fmt"
	"time"
)

// ApplyAlertRuleTemplate is the resolver for the applyAlertRuleTemplate field.
func (r *mutationResolver) ApplyAlertRuleTemplate(ctx context.Context, templateID string, variables map[string]any, customizations *model.CreateAlertRuleInput) (*model.AlertRulePayload, error) {
	if r.AlertRuleTemplateService == nil {
		return &model.AlertRulePayload{
			Errors: []*model.MutationError{
				{Code: "SERVICE_UNAVAILABLE", Message: "alert rule template service not available"},
			},
		}, nil
	}

	// Build customizations input
	var input services.CreateAlertRuleInput
	if customizations != nil {
		input = convertCreateAlertRuleInput(customizations)
	}

	// Apply template via service (delegates to AlertService.CreateRule)
	rule, err := r.AlertRuleTemplateService.ApplyTemplate(ctx, templateID, variables, input)
	if err != nil {
		r.log.Errorw("failed to apply alert rule template", "templateId", templateID, "error", err)
		return &model.AlertRulePayload{
			Errors: []*model.MutationError{
				{Code: "TEMPLATE_APPLICATION_FAILED", Message: err.Error()},
			},
		}, nil
	}

	r.log.Infow("applied alert rule template", "templateId", templateID, "ruleId", rule.ID)

	return &model.AlertRulePayload{
		AlertRule: convertAlertRuleToModel(rule),
	}, nil
}

// SaveCustomAlertRuleTemplate is the resolver for the saveCustomAlertRuleTemplate field.
func (r *mutationResolver) SaveCustomAlertRuleTemplate(ctx context.Context, input model.SaveAlertRuleTemplateInput) (*model.AlertRuleTemplatePayload, error) {
	if r.AlertRuleTemplateService == nil {
		return &model.AlertRuleTemplatePayload{
			Errors: []*model.MutationError{
				{Code: "SERVICE_UNAVAILABLE", Message: "alert rule template service not available"},
			},
		}, nil
	}

	// Generate a unique ID for the template
	tmplID := fmt.Sprintf("custom-%d", time.Now().Unix())

	// Convert input to service template
	tmpl := &alerts.AlertRuleTemplate{
		ID:          tmplID,
		Name:        input.Name,
		Description: input.Description,
		Category:    alerts.CategoryCustom, // Always CUSTOM for user-created templates
		EventType:   input.EventType,
		Severity:    string(input.Severity),
		Channels:    input.Channels,
		Version:     "1.0.0",
	}

	// Convert variables from Omittable
	if input.Variables.IsSet() {
		vars := input.Variables.Value()
		tmpl.Variables = make([]alerts.AlertRuleTemplateVariable, len(vars))
		for i, v := range vars {
			variable := alerts.AlertRuleTemplateVariable{
				Name:     v.Name,
				Label:    v.Label,
				Type:     alerts.AlertRuleTemplateVariableType(v.Type),
				Required: v.Required,
			}

			// Handle optional Omittable fields
			if v.DefaultValue.IsSet() {
				variable.DefaultValue = v.DefaultValue.Value()
			}
			if v.Min.IsSet() {
				variable.Min = v.Min.Value()
			}
			if v.Max.IsSet() {
				variable.Max = v.Max.Value()
			}
			if v.Unit.IsSet() {
				variable.Unit = v.Unit.Value()
			}
			if v.Description.IsSet() {
				variable.Description = v.Description.Value()
			}

			tmpl.Variables[i] = variable
		}
	}

	// Convert conditions
	tmpl.Conditions = make([]alerts.TemplateCondition, len(input.Conditions))
	for i, cond := range input.Conditions {
		tmpl.Conditions[i] = alerts.TemplateCondition{
			Field:    cond.Field,
			Operator: string(cond.Operator),
			Value:    cond.Value,
		}
	}

	// Convert throttle if present
	if input.Throttle.IsSet() {
		throttle := input.Throttle.Value()
		if throttle != nil {
			tmpl.Throttle = &alerts.TemplateThrottle{
				MaxAlerts:     throttle.MaxAlerts,
				PeriodSeconds: throttle.PeriodSeconds,
			}
			if throttle.GroupByField.IsSet() {
				tmpl.Throttle.GroupByField = throttle.GroupByField.Value()
			}
		}
	}

	// Save template
	saved, err := r.AlertRuleTemplateService.SaveCustomTemplate(ctx, tmpl)
	if err != nil {
		r.log.Errorw("failed to save custom alert rule template", "name", input.Name, "error", err)
		return &model.AlertRuleTemplatePayload{
			Errors: []*model.MutationError{
				{Code: "SAVE_FAILED", Message: err.Error()},
			},
		}, nil
	}

	r.log.Infow("saved custom alert rule template", "id", saved.ID, "name", saved.Name)

	return &model.AlertRuleTemplatePayload{
		Template: convertAlertRuleTemplateToModel(saved),
	}, nil
}

// DeleteCustomAlertRuleTemplate is the resolver for the deleteCustomAlertRuleTemplate field.
func (r *mutationResolver) DeleteCustomAlertRuleTemplate(ctx context.Context, id string) (*model.DeletePayload, error) {
	if r.AlertRuleTemplateService == nil {
		return nil, fmt.Errorf("alert rule template service not available")
	}

	err := r.AlertRuleTemplateService.DeleteCustomTemplate(ctx, id)
	if err != nil {
		r.log.Errorw("failed to delete custom alert rule template", "id", id, "error", err)
		return nil, fmt.Errorf("failed to delete template: %w", err)
	}

	r.log.Infow("deleted custom alert rule template", "id", id)

	return &model.DeletePayload{
		Success: true,
	}, nil
}

// ImportAlertRuleTemplate is the resolver for the importAlertRuleTemplate field.
func (r *mutationResolver) ImportAlertRuleTemplate(ctx context.Context, json string) (*model.AlertRuleTemplatePayload, error) {
	if r.AlertRuleTemplateService == nil {
		return &model.AlertRuleTemplatePayload{
			Errors: []*model.MutationError{
				{Code: "SERVICE_UNAVAILABLE", Message: "alert rule template service not available"},
			},
		}, nil
	}

	template, err := r.AlertRuleTemplateService.ImportTemplate(ctx, json)
	if err != nil {
		r.log.Errorw("failed to import alert rule template", "error", err)
		return &model.AlertRuleTemplatePayload{
			Errors: []*model.MutationError{
				{Code: "IMPORT_FAILED", Message: err.Error()},
			},
		}, nil
	}

	r.log.Infow("imported alert rule template", "id", template.ID, "name", template.Name)

	return &model.AlertRuleTemplatePayload{
		Template: convertAlertRuleTemplateToModel(template),
	}, nil
}

// ExportAlertRuleTemplate is the resolver for the exportAlertRuleTemplate field.
func (r *mutationResolver) ExportAlertRuleTemplate(ctx context.Context, id string) (string, error) {
	if r.AlertRuleTemplateService == nil {
		return "", fmt.Errorf("alert rule template service not available")
	}

	jsonStr, err := r.AlertRuleTemplateService.ExportTemplate(ctx, id)
	if err != nil {
		r.log.Errorw("failed to export alert rule template", "id", id, "error", err)
		return "", fmt.Errorf("export failed: %w", err)
	}

	r.log.Infow("exported alert rule template", "id", id)

	return jsonStr, nil
}

// ApplyAlertTemplate is the resolver for the applyAlertTemplate field.
func (r *mutationResolver) ApplyAlertTemplate(ctx context.Context, input model.ApplyAlertTemplateInput) (*model.AlertRulePayload, error) {
	panic(fmt.Errorf("not implemented: ApplyAlertTemplate - applyAlertTemplate"))
}

// SaveAlertTemplate is the resolver for the saveAlertTemplate field.
func (r *mutationResolver) SaveAlertTemplate(ctx context.Context, input model.SaveAlertTemplateInput) (*model.AlertTemplatePayload, error) {
	panic(fmt.Errorf("not implemented: SaveAlertTemplate - saveAlertTemplate"))
}

// DeleteAlertTemplate is the resolver for the deleteAlertTemplate field.
func (r *mutationResolver) DeleteAlertTemplate(ctx context.Context, id string) (*model.DeletePayload, error) {
	panic(fmt.Errorf("not implemented: DeleteAlertTemplate - deleteAlertTemplate"))
}

// ResetAlertTemplate is the resolver for the resetAlertTemplate field.
func (r *mutationResolver) ResetAlertTemplate(ctx context.Context, eventType string, channel model.NotificationChannel) (*model.DeletePayload, error) {
	panic(fmt.Errorf("not implemented: ResetAlertTemplate - resetAlertTemplate"))
}

// PreviewNotificationTemplate is the resolver for the previewNotificationTemplate field.
func (r *mutationResolver) PreviewNotificationTemplate(ctx context.Context, input model.PreviewNotificationTemplateInput) (*model.NotificationTemplatePreview, error) {
	panic(fmt.Errorf("not implemented: PreviewNotificationTemplate - previewNotificationTemplate"))
}

// CreateAlertRule is the resolver for the createAlertRule field.
func (r *mutationResolver) CreateAlertRule(ctx context.Context, input model.CreateAlertRuleInput) (*model.AlertRulePayload, error) {
	panic(fmt.Errorf("not implemented: CreateAlertRule - createAlertRule"))
}

// UpdateAlertRule is the resolver for the updateAlertRule field.
func (r *mutationResolver) UpdateAlertRule(ctx context.Context, id string, input model.UpdateAlertRuleInput) (*model.AlertRulePayload, error) {
	panic(fmt.Errorf("not implemented: UpdateAlertRule - updateAlertRule"))
}

// ToggleAlertRule is the resolver for the toggleAlertRule field.
func (r *mutationResolver) ToggleAlertRule(ctx context.Context, id string) (*model.AlertRulePayload, error) {
	panic(fmt.Errorf("not implemented: ToggleAlertRule - toggleAlertRule"))
}

// DeleteAlertRule is the resolver for the deleteAlertRule field.
func (r *mutationResolver) DeleteAlertRule(ctx context.Context, id string) (*model.DeletePayload, error) {
	panic(fmt.Errorf("not implemented: DeleteAlertRule - deleteAlertRule"))
}

// AcknowledgeAlert is the resolver for the acknowledgeAlert field.
func (r *mutationResolver) AcknowledgeAlert(ctx context.Context, alertID string) (*model.AlertPayload, error) {
	panic(fmt.Errorf("not implemented: AcknowledgeAlert - acknowledgeAlert"))
}

// AcknowledgeAlerts is the resolver for the acknowledgeAlerts field.
func (r *mutationResolver) AcknowledgeAlerts(ctx context.Context, alertIds []string) (*model.BulkAlertPayload, error) {
	panic(fmt.Errorf("not implemented: AcknowledgeAlerts - acknowledgeAlerts"))
}

// TestNotificationChannel is the resolver for the testNotificationChannel field.
func (r *mutationResolver) TestNotificationChannel(ctx context.Context, channel string, config map[string]any) (*model.TestNotificationPayload, error) {
	panic(fmt.Errorf("not implemented: TestNotificationChannel - testNotificationChannel"))
}

// CreateWebhook is the resolver for the createWebhook field.
func (r *mutationResolver) CreateWebhook(ctx context.Context, input model.CreateWebhookInput) (*model.WebhookPayload, error) {
	panic(fmt.Errorf("not implemented: CreateWebhook - createWebhook"))
}

// UpdateWebhook is the resolver for the updateWebhook field.
func (r *mutationResolver) UpdateWebhook(ctx context.Context, id string, input model.UpdateWebhookInput) (*model.WebhookPayload, error) {
	panic(fmt.Errorf("not implemented: UpdateWebhook - updateWebhook"))
}

// DeleteWebhook is the resolver for the deleteWebhook field.
func (r *mutationResolver) DeleteWebhook(ctx context.Context, id string) (*model.DeletePayload, error) {
	panic(fmt.Errorf("not implemented: DeleteWebhook - deleteWebhook"))
}

// TestWebhook is the resolver for the testWebhook field.
func (r *mutationResolver) TestWebhook(ctx context.Context, id string) (*model.WebhookTestPayload, error) {
	panic(fmt.Errorf("not implemented: TestWebhook - testWebhook"))
}

// TriggerDigestNow is the resolver for the triggerDigestNow field.
func (r *mutationResolver) TriggerDigestNow(ctx context.Context, channelID string) (*model.DigestSummary, error) {
	panic(fmt.Errorf("not implemented: TriggerDigestNow - triggerDigestNow"))
}

// CreateNotificationChannelConfig is the resolver for the createNotificationChannelConfig field.
func (r *mutationResolver) CreateNotificationChannelConfig(ctx context.Context, input model.CreateNotificationChannelConfigInput) (*model.ChannelConfigPayload, error) {
	panic(fmt.Errorf("not implemented: CreateNotificationChannelConfig - createNotificationChannelConfig"))
}

// UpdateNotificationChannelConfig is the resolver for the updateNotificationChannelConfig field.
func (r *mutationResolver) UpdateNotificationChannelConfig(ctx context.Context, id string, input model.UpdateNotificationChannelConfigInput) (*model.ChannelConfigPayload, error) {
	panic(fmt.Errorf("not implemented: UpdateNotificationChannelConfig - updateNotificationChannelConfig"))
}

// DeleteNotificationChannelConfig is the resolver for the deleteNotificationChannelConfig field.
func (r *mutationResolver) DeleteNotificationChannelConfig(ctx context.Context, id string) (*model.DeletePayload, error) {
	panic(fmt.Errorf("not implemented: DeleteNotificationChannelConfig - deleteNotificationChannelConfig"))
}
