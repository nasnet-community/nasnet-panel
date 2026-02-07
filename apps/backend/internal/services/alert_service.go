// Package services contains business logic services for NasNetConnect.
package services

import (
	"context"
	"fmt"
	"time"

	"backend/ent"
	"backend/ent/alert"
	"backend/ent/alertrule"
	"backend/internal/events"

	"go.uber.org/zap"
)

// AlertService provides alert rule and alert management operations.
// It coordinates between GraphQL resolvers, the alert engine, and the event bus
// to implement the alert and notification system per NAS-5.12.
type AlertService struct {
	db             *ent.Client
	eventBus       events.EventBus
	eventPublisher *events.Publisher
	log            *zap.SugaredLogger
}

// AlertServiceConfig holds configuration for AlertService.
type AlertServiceConfig struct {
	DB       *ent.Client
	EventBus events.EventBus
	Logger   *zap.SugaredLogger
}

// CreateAlertRuleInput contains parameters for creating an alert rule.
type CreateAlertRuleInput struct {
	Name        string
	Description *string
	EventType   string
	Conditions  []map[string]interface{} // JSON conditions
	Severity    alertrule.Severity
	Channels    []string
	Throttle    map[string]interface{} // JSON throttle config
	QuietHours  map[string]interface{} // JSON quiet hours config
	DeviceID    *string
	Enabled     bool
}

// UpdateAlertRuleInput contains parameters for updating an alert rule.
type UpdateAlertRuleInput struct {
	Name        *string
	Description *string
	EventType   *string
	Conditions  []map[string]interface{} // JSON conditions
	Severity    *alertrule.Severity
	Channels    []string
	Throttle    map[string]interface{} // JSON throttle config
	QuietHours  map[string]interface{} // JSON quiet hours config
	DeviceID    *string
	Enabled     *bool
}

// AcknowledgeAlertInput contains parameters for acknowledging an alert.
type AcknowledgeAlertInput struct {
	AlertID         string
	AcknowledgedBy  string
	AcknowledgedAt  time.Time
}

// NewAlertService creates a new AlertService with the given configuration.
func NewAlertService(cfg AlertServiceConfig) *AlertService {
	s := &AlertService{
		db:  cfg.DB,
		eventBus: cfg.EventBus,
		log: cfg.Logger,
	}

	// Create publisher if event bus is provided
	if cfg.EventBus != nil {
		s.eventPublisher = events.NewPublisher(cfg.EventBus, "alert-service")
	}

	return s
}

// CreateRule creates a new alert rule.
// Per AC1: User can create alert rules with name, trigger condition, severity,
// notification channels, and optional quiet hours.
func (s *AlertService) CreateRule(ctx context.Context, input CreateAlertRuleInput) (*ent.AlertRule, error) {
	// Create the alert rule entity
	ruleBuilder := s.db.AlertRule.Create().
		SetName(input.Name).
		SetEventType(input.EventType).
		SetSeverity(input.Severity).
		SetChannels(input.Channels).
		SetEnabled(input.Enabled)

	// Set optional fields
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
	if input.DeviceID != nil {
		ruleBuilder.SetDeviceID(*input.DeviceID)
	}

	// Save to database
	rule, err := ruleBuilder.Save(ctx)
	if err != nil {
		s.log.Error("failed to create alert rule", "error", err, "name", input.Name)
		return nil, fmt.Errorf("failed to create alert rule: %w", err)
	}

	// Publish event for alert engine to reload rules
	if s.eventBus != nil {
		event := events.NewBaseEvent("alert.rule.created", events.PriorityNormal, "alert-service")
		_ = s.eventBus.Publish(ctx, &event)
	}

	s.log.Info("alert rule created", "rule_id", rule.ID, "name", rule.Name)
	return rule, nil
}

// UpdateRule updates an existing alert rule.
func (s *AlertService) UpdateRule(ctx context.Context, ruleID string, input UpdateAlertRuleInput) (*ent.AlertRule, error) {
	// Find existing rule
	rule, err := s.db.AlertRule.Get(ctx, ruleID)
	if err != nil {
		if ent.IsNotFound(err) {
			return nil, fmt.Errorf("alert rule not found: %s", ruleID)
		}
		return nil, fmt.Errorf("failed to fetch alert rule: %w", err)
	}

	// Build update query
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
	if input.DeviceID != nil {
		updateBuilder.SetDeviceID(*input.DeviceID)
	}
	if input.Enabled != nil {
		updateBuilder.SetEnabled(*input.Enabled)
	}

	// Save updates
	updatedRule, err := updateBuilder.Save(ctx)
	if err != nil {
		s.log.Error("failed to update alert rule", "error", err, "rule_id", ruleID)
		return nil, fmt.Errorf("failed to update alert rule: %w", err)
	}

	// Publish event for alert engine to reload rules
	if s.eventBus != nil {
		event := events.NewBaseEvent("alert.rule.updated", events.PriorityNormal, "alert-service")
		_ = s.eventBus.Publish(ctx, &event)
	}

	s.log.Info("alert rule updated", "rule_id", ruleID)
	return updatedRule, nil
}

// DeleteRule deletes an alert rule by ID.
func (s *AlertService) DeleteRule(ctx context.Context, ruleID string) error {
	// Verify rule exists
	exists, err := s.db.AlertRule.Query().Where(alertrule.ID(ruleID)).Exist(ctx)
	if err != nil {
		return fmt.Errorf("failed to check rule existence: %w", err)
	}
	if !exists {
		return fmt.Errorf("alert rule not found: %s", ruleID)
	}

	// Delete the rule
	err = s.db.AlertRule.DeleteOneID(ruleID).Exec(ctx)
	if err != nil {
		s.log.Error("failed to delete alert rule", "error", err, "rule_id", ruleID)
		return fmt.Errorf("failed to delete alert rule: %w", err)
	}

	// Publish event for alert engine to reload rules
	if s.eventBus != nil {
		event := events.NewBaseEvent("alert.rule.deleted", events.PriorityNormal, "alert-service")
		_ = s.eventBus.Publish(ctx, &event)
	}

	s.log.Info("alert rule deleted", "rule_id", ruleID)
	return nil
}

// GetRule retrieves a single alert rule by ID.
func (s *AlertService) GetRule(ctx context.Context, ruleID string) (*ent.AlertRule, error) {
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
func (s *AlertService) ListRules(ctx context.Context, deviceID *string) ([]*ent.AlertRule, error) {
	query := s.db.AlertRule.Query()

	// Apply device filter if provided
	if deviceID != nil {
		query.Where(alertrule.DeviceID(*deviceID))
	}

	// Order by creation time descending
	rules, err := query.Order(ent.Desc(alertrule.FieldCreatedAt)).All(ctx)
	if err != nil {
		s.log.Error("failed to list alert rules", "error", err)
		return nil, fmt.Errorf("failed to list alert rules: %w", err)
	}

	return rules, nil
}

// AcknowledgeAlert marks an alert as acknowledged.
// Per AC3: User can acknowledge alerts to clear them from active list.
func (s *AlertService) AcknowledgeAlert(ctx context.Context, input AcknowledgeAlertInput) (*ent.Alert, error) {
	// Find the alert
	alertEntity, err := s.db.Alert.Get(ctx, input.AlertID)
	if err != nil {
		if ent.IsNotFound(err) {
			return nil, fmt.Errorf("alert not found: %s", input.AlertID)
		}
		return nil, fmt.Errorf("failed to fetch alert: %w", err)
	}

	// Check if already acknowledged
	if alertEntity.AcknowledgedAt != nil {
		return alertEntity, nil // Already acknowledged
	}

	// Update alert with acknowledgment
	updatedAlert, err := alertEntity.Update().
		SetAcknowledgedAt(input.AcknowledgedAt).
		SetAcknowledgedBy(input.AcknowledgedBy).
		Save(ctx)
	if err != nil {
		s.log.Error("failed to acknowledge alert", "error", err, "alert_id", input.AlertID)
		return nil, fmt.Errorf("failed to acknowledge alert: %w", err)
	}

	// Publish event for real-time subscription
	if s.eventBus != nil {
		event := events.NewBaseEvent("alert.acknowledged", events.PriorityNormal, "alert-service")
		_ = s.eventBus.Publish(ctx, &event)
	}

	s.log.Info("alert acknowledged", "alert_id", input.AlertID, "by", input.AcknowledgedBy)
	return updatedAlert, nil
}

// AcknowledgeAlerts marks multiple alerts as acknowledged (bulk operation).
func (s *AlertService) AcknowledgeAlerts(ctx context.Context, alertIDs []string, acknowledgedBy string) (int, error) {
	acknowledgedAt := time.Now()
	count := 0

	for _, alertID := range alertIDs {
		_, err := s.AcknowledgeAlert(ctx, AcknowledgeAlertInput{
			AlertID:        alertID,
			AcknowledgedBy: acknowledgedBy,
			AcknowledgedAt: acknowledgedAt,
		})
		if err != nil {
			s.log.Warn("failed to acknowledge alert in bulk operation", "error", err, "alert_id", alertID)
			continue // Continue with next alert
		}
		count++
	}

	return count, nil
}

// ListAlerts retrieves alerts with optional filtering.
// Per AC3: User can view active alerts with count badge, see alert list with
// timestamp/severity/message.
func (s *AlertService) ListAlerts(ctx context.Context, deviceID *string, severity *alert.Severity, acknowledged *bool, limit, offset int) ([]*ent.Alert, int, error) {
	query := s.db.Alert.Query()

	// Apply filters
	if deviceID != nil {
		query.Where(alert.DeviceID(*deviceID))
	}
	if severity != nil {
		query.Where(alert.SeverityEQ(*severity))
	}
	if acknowledged != nil {
		if *acknowledged {
			query.Where(alert.AcknowledgedAtNotNil())
		} else {
			query.Where(alert.AcknowledgedAtIsNil())
		}
	}

	// Count total (before pagination)
	total, err := query.Clone().Count(ctx)
	if err != nil {
		s.log.Error("failed to count alerts", "error", err)
		return nil, 0, fmt.Errorf("failed to count alerts: %w", err)
	}

	// Apply pagination and ordering
	alerts, err := query.
		Order(ent.Desc(alert.FieldTriggeredAt)).
		Limit(limit).
		Offset(offset).
		All(ctx)
	if err != nil {
		s.log.Error("failed to list alerts", "error", err)
		return nil, 0, fmt.Errorf("failed to list alerts: %w", err)
	}

	return alerts, total, nil
}

// GetAlert retrieves a single alert by ID.
func (s *AlertService) GetAlert(ctx context.Context, alertID string) (*ent.Alert, error) {
	alertEntity, err := s.db.Alert.Get(ctx, alertID)
	if err != nil {
		if ent.IsNotFound(err) {
			return nil, fmt.Errorf("alert not found: %s", alertID)
		}
		return nil, fmt.Errorf("failed to fetch alert: %w", err)
	}
	return alertEntity, nil
}
