package svcalert

import (
	"context"
	"fmt"

	"backend/generated/ent"
	"backend/generated/ent/alertrule"

	"backend/internal/events"
)

// CreateRule creates a new alert rule.
func (s *Service) CreateRule(ctx context.Context, input CreateAlertRuleInput) (*ent.AlertRule, error) {
	ruleBuilder := s.db.AlertRule.Create().
		SetName(input.Name).
		SetEventType(input.EventType).
		SetSeverity(input.Severity).
		SetChannels(input.Channels).
		SetEnabled(input.Enabled)

	if input.Description != nil {
		ruleBuilder.SetDescription(*input.Description)
	}
	if input.Conditions != nil {
		ruleBuilder.SetConditions(input.Conditions)
	}
	if input.Throttle != nil {
		ruleBuilder.SetThrottle(input.Throttle)
	}
	if input.QuietHours != nil {
		ruleBuilder.SetQuietHours(input.QuietHours)
	}
	if input.Escalation != nil {
		ruleBuilder.SetEscalation(input.Escalation)
	}
	if input.DeviceID != nil {
		ruleBuilder.SetDeviceID(*input.DeviceID)
	}

	rule, err := ruleBuilder.Save(ctx)
	if err != nil {
		s.log.Error("failed to create alert rule", "error", err, "name", input.Name)
		return nil, fmt.Errorf("failed to create alert rule: %w", err)
	}

	if s.eventBus != nil {
		event := events.NewBaseEvent("alert.rule.created", events.PriorityNormal, "alert-service")
		if err := s.eventBus.Publish(ctx, &event); err != nil {
			s.log.Warnw("failed to publish event", "error", err)
		}
	}

	s.log.Info("alert rule created", "rule_id", rule.ID, "name", rule.Name)
	return rule, nil
}

// UpdateRule updates an existing alert rule.
//
//nolint:gocyclo // rule update requires checking multiple conditions
func (s *Service) UpdateRule(ctx context.Context, ruleID string, input UpdateAlertRuleInput) (*ent.AlertRule, error) {
	rule, err := s.db.AlertRule.Get(ctx, ruleID)
	if err != nil {
		if ent.IsNotFound(err) {
			return nil, fmt.Errorf("alert rule not found: %s", ruleID)
		}
		return nil, fmt.Errorf("failed to fetch alert rule: %w", err)
	}

	updateBuilder := rule.Update()

	if input.Name != nil {
		updateBuilder.SetName(*input.Name)
	}
	if input.Description != nil {
		updateBuilder.SetDescription(*input.Description)
	}
	if input.EventType != nil {
		updateBuilder.SetEventType(*input.EventType)
	}
	if input.Conditions != nil {
		updateBuilder.SetConditions(input.Conditions)
	}
	if input.Severity != nil {
		updateBuilder.SetSeverity(*input.Severity)
	}
	if input.Channels != nil {
		updateBuilder.SetChannels(input.Channels)
	}
	if input.Throttle != nil {
		updateBuilder.SetThrottle(input.Throttle)
	}
	if input.QuietHours != nil {
		updateBuilder.SetQuietHours(input.QuietHours)
	}
	if input.Escalation != nil {
		updateBuilder.SetEscalation(input.Escalation)
	}
	if input.DeviceID != nil {
		updateBuilder.SetDeviceID(*input.DeviceID)
	}
	if input.Enabled != nil {
		updateBuilder.SetEnabled(*input.Enabled)
	}

	updatedRule, err := updateBuilder.Save(ctx)
	if err != nil {
		s.log.Error("failed to update alert rule", "error", err, "rule_id", ruleID)
		return nil, fmt.Errorf("failed to update alert rule: %w", err)
	}

	if s.eventBus != nil {
		event := events.NewBaseEvent("alert.rule.updated", events.PriorityNormal, "alert-service")
		if err := s.eventBus.Publish(ctx, &event); err != nil {
			s.log.Warnw("failed to publish event", "error", err)
		}
	}

	s.log.Info("alert rule updated", "rule_id", ruleID)
	return updatedRule, nil
}

// DeleteRule deletes an alert rule by ID.
func (s *Service) DeleteRule(ctx context.Context, ruleID string) error {
	exists, err := s.db.AlertRule.Query().Where(alertrule.ID(ruleID)).Exist(ctx)
	if err != nil {
		return fmt.Errorf("failed to check rule existence: %w", err)
	}
	if !exists {
		return fmt.Errorf("alert rule not found: %s", ruleID)
	}

	err = s.db.AlertRule.DeleteOneID(ruleID).Exec(ctx)
	if err != nil {
		s.log.Error("failed to delete alert rule", "error", err, "rule_id", ruleID)
		return fmt.Errorf("failed to delete alert rule: %w", err)
	}

	if s.eventBus != nil {
		event := events.NewBaseEvent("alert.rule.deleted", events.PriorityNormal, "alert-service")
		if err := s.eventBus.Publish(ctx, &event); err != nil {
			s.log.Warnw("failed to publish event", "error", err)
		}
	}

	s.log.Info("alert rule deleted", "rule_id", ruleID)
	return nil
}

// ToggleRule enables or disables an alert rule.
func (s *Service) ToggleRule(ctx context.Context, ruleID string, enabled bool) (*ent.AlertRule, error) {
	rule, err := s.db.AlertRule.Get(ctx, ruleID)
	if err != nil {
		if ent.IsNotFound(err) {
			return nil, fmt.Errorf("alert rule not found: %s", ruleID)
		}
		return nil, fmt.Errorf("failed to fetch alert rule: %w", err)
	}

	if rule.Enabled == enabled {
		s.log.Debug("alert rule already in desired state", "rule_id", ruleID, "enabled", enabled)
		return rule, nil
	}

	updatedRule, err := rule.Update().
		SetEnabled(enabled).
		Save(ctx)
	if err != nil {
		s.log.Error("failed to toggle alert rule", "error", err, "rule_id", ruleID, "enabled", enabled)
		return nil, fmt.Errorf("failed to toggle alert rule: %w", err)
	}

	if s.eventBus != nil {
		eventType := "alert.rule.enabled"
		if !enabled {
			eventType = "alert.rule.disabled"
		}
		event := events.NewBaseEvent(eventType, events.PriorityNormal, "alert-service")
		if err := s.eventBus.Publish(ctx, &event); err != nil {
			s.log.Warnw("failed to publish event", "error", err)
		}
	}

	action := "enabled"
	if !enabled {
		action = "disabled"
	}
	s.log.Info("alert rule toggled", "rule_id", ruleID, "action", action)
	return updatedRule, nil
}

// GetRule retrieves a single alert rule by ID.
func (s *Service) GetRule(ctx context.Context, ruleID string) (*ent.AlertRule, error) {
	rule, err := s.db.AlertRule.Get(ctx, ruleID)
	if err != nil {
		if ent.IsNotFound(err) {
			return nil, fmt.Errorf("alert rule not found: %s", ruleID)
		}
		return nil, fmt.Errorf("failed to fetch alert rule: %w", err)
	}
	return rule, nil
}

// ListRules retrieves all alert rules, optionally filtered by device ID.
func (s *Service) ListRules(ctx context.Context, deviceID *string) ([]*ent.AlertRule, error) {
	query := s.db.AlertRule.Query()
	if deviceID != nil {
		query.Where(alertrule.DeviceID(*deviceID))
	}
	rules, err := query.Order(ent.Desc(alertrule.FieldCreatedAt)).All(ctx)
	if err != nil {
		s.log.Error("failed to list alert rules", "error", err)
		return nil, fmt.Errorf("failed to list alert rules: %w", err)
	}
	return rules, nil
}
