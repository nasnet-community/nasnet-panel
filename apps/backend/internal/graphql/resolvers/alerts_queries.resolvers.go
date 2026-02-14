package resolver

import (
	"backend/generated/graphql"
	
	"backend/internal/alerts"
	"context"
	"fmt"

	"backend/generated/ent"
	"backend/generated/ent/alert"
)

// AlertRuleTemplates is the resolver for the alertRuleTemplates field.
func (r *queryResolver) AlertRuleTemplates(ctx context.Context, category *model.AlertRuleTemplateCategory) ([]*model.AlertRuleTemplate, error) {
	if r.AlertRuleTemplateService == nil {
		return nil, fmt.Errorf("alert rule template service not available")
	}

	// Convert GraphQL category to service category
	var serviceCategory *alerts.AlertRuleTemplateCategory
	if category != nil {
		c := alerts.AlertRuleTemplateCategory(*category)
		serviceCategory = &c
	}

	// Get templates from service
	templates, err := r.AlertRuleTemplateService.GetTemplates(ctx, serviceCategory)
	if err != nil {
		r.log.Errorw("failed to get alert rule templates", "error", err)
		return nil, fmt.Errorf("failed to get templates: %w", err)
	}

	// Convert service templates to GraphQL model
	result := make([]*model.AlertRuleTemplate, len(templates))
	for i, tmpl := range templates {
		result[i] = convertAlertRuleTemplateToModel(tmpl)
	}

	return result, nil
}

// AlertRuleTemplate is the resolver for the alertRuleTemplate field.
func (r *queryResolver) AlertRuleTemplate(ctx context.Context, id string) (*model.AlertRuleTemplate, error) {
	if r.AlertRuleTemplateService == nil {
		return nil, fmt.Errorf("alert rule template service not available")
	}

	template, err := r.AlertRuleTemplateService.GetTemplateByID(ctx, id)
	if err != nil {
		r.log.Errorw("failed to get alert rule template", "id", id, "error", err)
		return nil, fmt.Errorf("template not found: %w", err)
	}

	return convertAlertRuleTemplateToModel(template), nil
}

// PreviewAlertRuleTemplate is the resolver for the previewAlertRuleTemplate field.
func (r *queryResolver) PreviewAlertRuleTemplate(ctx context.Context, templateID string, variables map[string]any) (*model.AlertRuleTemplatePreview, error) {
	if r.AlertRuleTemplateService == nil {
		return nil, fmt.Errorf("alert rule template service not available")
	}

	preview, err := r.AlertRuleTemplateService.PreviewTemplate(ctx, templateID, variables)
	if err != nil {
		r.log.Errorw("failed to preview alert rule template", "templateId", templateID, "error", err)
		return nil, fmt.Errorf("preview failed: %w", err)
	}

	// Convert to GraphQL model
	result := &model.AlertRuleTemplatePreview{
		Template:           convertAlertRuleTemplateToModel(preview.Template),
		ResolvedConditions: make([]*model.AlertCondition, len(preview.ResolvedConditions)),
		ValidationInfo: &model.TemplateValidationInfo{
			IsValid:          preview.ValidationInfo.IsValid,
			MissingVariables: preview.ValidationInfo.MissingVariables,
			Warnings:         preview.ValidationInfo.Warnings,
		},
	}

	// Convert resolved conditions
	for i, cond := range preview.ResolvedConditions {
		result.ResolvedConditions[i] = &model.AlertCondition{
			Field:    cond.Field,
			Operator: model.ConditionOperator(cond.Operator),
			Value:    fmt.Sprintf("%v", cond.Value),
		}
	}

	return result, nil
}

// AlertTemplates is the resolver for the alertTemplates field.
func (r *queryResolver) AlertTemplates(ctx context.Context, eventType *string, channel *model.NotificationChannel) ([]*model.AlertTemplate, error) {
	panic(fmt.Errorf("not implemented: AlertTemplates - alertTemplates"))
}

// AlertTemplate is the resolver for the alertTemplate field.
func (r *queryResolver) AlertTemplate(ctx context.Context, id string) (*model.AlertTemplate, error) {
	panic(fmt.Errorf("not implemented: AlertTemplate - alertTemplate"))
}

// CommonEventTypes is the resolver for the commonEventTypes field.
func (r *queryResolver) CommonEventTypes(ctx context.Context) ([]string, error) {
	panic(fmt.Errorf("not implemented: CommonEventTypes - commonEventTypes"))
}

// SearchAlertTemplates is the resolver for the searchAlertTemplates field.
func (r *queryResolver) SearchAlertTemplates(ctx context.Context, query string) ([]*model.AlertTemplate, error) {
	panic(fmt.Errorf("not implemented: SearchAlertTemplates - searchAlertTemplates"))
}

// PreviewAlertTemplate is the resolver for the previewAlertTemplate field.
func (r *queryResolver) PreviewAlertTemplate(ctx context.Context, templateID string, variables map[string]any) (*model.TemplatePreviewPayload, error) {
	panic(fmt.Errorf("not implemented: PreviewAlertTemplate - previewAlertTemplate"))
}

// AlertRules is the resolver for the alertRules field.
func (r *queryResolver) AlertRules(ctx context.Context, deviceID *string) ([]*model.AlertRule, error) {
	panic(fmt.Errorf("not implemented: AlertRules - alertRules"))
}

// AlertRule is the resolver for the alertRule field.
func (r *queryResolver) AlertRule(ctx context.Context, id string) (*model.AlertRule, error) {
	panic(fmt.Errorf("not implemented: AlertRule - alertRule"))
}

// Alerts is the resolver for the alerts field.
func (r *queryResolver) Alerts(ctx context.Context, deviceID *string, severity *model.AlertSeverity, acknowledged *bool, limit *int, offset *int) (*model.AlertConnection, error) {
	panic(fmt.Errorf("not implemented: Alerts - alerts"))
}

// ServiceAlerts is the resolver for the serviceAlerts field.
func (r *queryResolver) ServiceAlerts(ctx context.Context, instanceID string, severity *model.AlertSeverity, acknowledged *bool, limit *int, offset *int) (*model.AlertConnection, error) {
	// Set default pagination values
	pageLimit := 50
	if limit != nil {
		pageLimit = *limit
	}
	pageOffset := 0
	if offset != nil {
		pageOffset = *offset
	}

	// Build query with source_type and source_id filters
	query := r.db.Alert.Query().
		Where(
			alert.SourceType("service"),
			alert.SourceID(instanceID),
		)

	// Apply optional filters
	if severity != nil {
		query = query.Where(alert.SeverityEQ(alert.Severity(string(*severity))))
	}

	if acknowledged != nil {
		if *acknowledged {
			query = query.Where(alert.AcknowledgedAtNotNil())
		} else {
			query = query.Where(alert.AcknowledgedAtIsNil())
		}
	}

	// Get total count for pagination
	totalCount, err := query.Clone().Count(ctx)
	if err != nil {
		r.log.Errorw("failed to count service alerts", "instanceId", instanceID, "error", err)
		return nil, fmt.Errorf("failed to count alerts: %w", err)
	}

	// Query with pagination, order by most recent first
	alerts, err := query.
		Order(ent.Desc(alert.FieldTriggeredAt)).
		Limit(pageLimit).
		Offset(pageOffset).
		All(ctx)

	if err != nil {
		r.log.Errorw("failed to query service alerts", "instanceId", instanceID, "error", err)
		return nil, fmt.Errorf("failed to query alerts: %w", err)
	}

	// Convert to GraphQL model
	edges := make([]*model.AlertEdge, len(alerts))
	for i, alert := range alerts {
		edges[i] = &model.AlertEdge{
			Node:   convertAlertToModel(alert),
			Cursor: alert.ID, // Use alert ID as cursor
		}
	}

	return &model.AlertConnection{
		Edges: edges,
		PageInfo: &model.PageInfo{
			HasNextPage:     (pageOffset + pageLimit) < totalCount,
			HasPreviousPage: pageOffset > 0,
		},
		TotalCount: totalCount,
	}, nil
}

// PushoverUsage is the resolver for the pushoverUsage field.
func (r *queryResolver) PushoverUsage(ctx context.Context) (*model.PushoverUsage, error) {
	panic(fmt.Errorf("not implemented: PushoverUsage - pushoverUsage"))
}

// Webhooks is the resolver for the webhooks field.
func (r *queryResolver) Webhooks(ctx context.Context) ([]*model.Webhook, error) {
	panic(fmt.Errorf("not implemented: Webhooks - webhooks"))
}

// Webhook is the resolver for the webhook field.
func (r *queryResolver) Webhook(ctx context.Context, id string) (*model.Webhook, error) {
	panic(fmt.Errorf("not implemented: Webhook - webhook"))
}

// NotificationLogs is the resolver for the notificationLogs field.
func (r *queryResolver) NotificationLogs(ctx context.Context, alertID *string, channel *string, webhookID *string, limit *int, offset *int) ([]*model.NotificationLog, error) {
	panic(fmt.Errorf("not implemented: NotificationLogs - notificationLogs"))
}

// AlertEscalations is the resolver for the alertEscalations field.
func (r *queryResolver) AlertEscalations(ctx context.Context, status *model.EscalationStatus, limit *int, offset *int) ([]*model.AlertEscalation, error) {
	panic(fmt.Errorf("not implemented: AlertEscalations - alertEscalations"))
}

// DigestQueueCount is the resolver for the digestQueueCount field.
func (r *queryResolver) DigestQueueCount(ctx context.Context, channelID string) (int, error) {
	panic(fmt.Errorf("not implemented: DigestQueueCount - digestQueueCount"))
}

// DigestHistory is the resolver for the digestHistory field.
func (r *queryResolver) DigestHistory(ctx context.Context, channelID string, limit *int) ([]*model.DigestSummary, error) {
	panic(fmt.Errorf("not implemented: DigestHistory - digestHistory"))
}

// AlertRuleThrottleStatus is the resolver for the alertRuleThrottleStatus field.
func (r *queryResolver) AlertRuleThrottleStatus(ctx context.Context, ruleID *string) ([]*model.ThrottleStatus, error) {
	panic(fmt.Errorf("not implemented: AlertRuleThrottleStatus - alertRuleThrottleStatus"))
}

// AlertStormStatus is the resolver for the alertStormStatus field.
func (r *queryResolver) AlertStormStatus(ctx context.Context) (*model.StormStatus, error) {
	panic(fmt.Errorf("not implemented: AlertStormStatus - alertStormStatus"))
}

// NotificationChannelConfigs is the resolver for the notificationChannelConfigs field.
func (r *queryResolver) NotificationChannelConfigs(ctx context.Context, channelType *model.ChannelType) ([]*model.NotificationChannelConfig, error) {
	panic(fmt.Errorf("not implemented: NotificationChannelConfigs - notificationChannelConfigs"))
}

// NotificationChannelConfig is the resolver for the notificationChannelConfig field.
func (r *queryResolver) NotificationChannelConfig(ctx context.Context, id string) (*model.NotificationChannelConfig, error) {
	panic(fmt.Errorf("not implemented: NotificationChannelConfig - notificationChannelConfig"))
}

// DefaultNotificationChannelConfig is the resolver for the defaultNotificationChannelConfig field.
func (r *queryResolver) DefaultNotificationChannelConfig(ctx context.Context, channelType model.ChannelType) (*model.NotificationChannelConfig, error) {
	panic(fmt.Errorf("not implemented: DefaultNotificationChannelConfig - defaultNotificationChannelConfig"))
}

// AlertEvents is the resolver for the alertEvents field.
func (r *subscriptionResolver) AlertEvents(ctx context.Context, deviceID *string) (<-chan *model.AlertEvent, error) {
	panic(fmt.Errorf("not implemented: AlertEvents - alertEvents"))
}
