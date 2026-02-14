package svcalert

import (
	"context"
	"fmt"
	"time"

	"backend/internal/events"
	"backend/generated/ent"
	"backend/generated/ent/alert"
	"backend/generated/ent/alertdigestentry"
	"backend/generated/ent/alertrule"

	"go.uber.org/zap"
)

// AlertService provides alert rule and alert management operations.
type AlertService struct {
	db                  *ent.Client
	eventBus            events.EventBus
	eventPublisher      *events.Publisher
	engine              EngineInterface
	escalationCanceller EscalationCanceller
	digestService       DigestService
	log                 *zap.SugaredLogger
}

// AlertServiceConfig holds configuration for AlertService.
type AlertServiceConfig struct {
	DB                  *ent.Client
	EventBus            events.EventBus
	Engine              EngineInterface
	EscalationCanceller EscalationCanceller
	DigestService       DigestService
	Logger              *zap.SugaredLogger
}

// NewAlertService creates a new AlertService with the given configuration.
func NewAlertService(cfg AlertServiceConfig) *AlertService {
	s := &AlertService{
		db:                  cfg.DB,
		eventBus:            cfg.EventBus,
		engine:              cfg.Engine,
		escalationCanceller: cfg.EscalationCanceller,
		digestService:       cfg.DigestService,
		log:                 cfg.Logger,
	}
	if cfg.EventBus != nil {
		s.eventPublisher = events.NewPublisher(cfg.EventBus, "alert-service")
	}
	return s
}

// CreateRule creates a new alert rule.
func (s *AlertService) CreateRule(ctx context.Context, input CreateAlertRuleInput) (*ent.AlertRule, error) {
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
		_ = s.eventBus.Publish(ctx, &event)
	}

	s.log.Info("alert rule created", "rule_id", rule.ID, "name", rule.Name)
	return rule, nil
}

// UpdateRule updates an existing alert rule.
func (s *AlertService) UpdateRule(ctx context.Context, ruleID string, input UpdateAlertRuleInput) (*ent.AlertRule, error) {
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
		_ = s.eventBus.Publish(ctx, &event)
	}

	s.log.Info("alert rule updated", "rule_id", ruleID)
	return updatedRule, nil
}

// DeleteRule deletes an alert rule by ID.
func (s *AlertService) DeleteRule(ctx context.Context, ruleID string) error {
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
		_ = s.eventBus.Publish(ctx, &event)
	}

	s.log.Info("alert rule deleted", "rule_id", ruleID)
	return nil
}

// ToggleRule enables or disables an alert rule.
func (s *AlertService) ToggleRule(ctx context.Context, ruleID string, enabled bool) (*ent.AlertRule, error) {
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
		_ = s.eventBus.Publish(ctx, &event)
	}

	action := "enabled"
	if !enabled {
		action = "disabled"
	}
	s.log.Info("alert rule toggled", "rule_id", ruleID, "action", action)
	return updatedRule, nil
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

// AcknowledgeAlert marks an alert as acknowledged.
func (s *AlertService) AcknowledgeAlert(ctx context.Context, input AcknowledgeAlertInput) (*ent.Alert, error) {
	alertEntity, err := s.db.Alert.Get(ctx, input.AlertID)
	if err != nil {
		if ent.IsNotFound(err) {
			return nil, fmt.Errorf("alert not found: %s", input.AlertID)
		}
		return nil, fmt.Errorf("failed to fetch alert: %w", err)
	}

	if alertEntity.AcknowledgedAt != nil {
		return alertEntity, nil
	}

	updatedAlert, err := alertEntity.Update().
		SetAcknowledgedAt(input.AcknowledgedAt).
		SetAcknowledgedBy(input.AcknowledgedBy).
		Save(ctx)
	if err != nil {
		s.log.Error("failed to acknowledge alert", "error", err, "alert_id", input.AlertID)
		return nil, fmt.Errorf("failed to acknowledge alert: %w", err)
	}

	if s.escalationCanceller != nil {
		if err := s.escalationCanceller.CancelEscalation(ctx, input.AlertID, "alert acknowledged"); err != nil {
			s.log.Warnw("failed to cancel escalation after acknowledgment",
				"alert_id", input.AlertID,
				"error", err)
		}
	}

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
			continue
		}
		count++
	}
	return count, nil
}

// ListAlerts retrieves alerts with optional filtering.
func (s *AlertService) ListAlerts(ctx context.Context, deviceID *string, severity *alert.Severity, acknowledged *bool, limit, offset int) ([]*ent.Alert, int, error) {
	query := s.db.Alert.Query()
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

	total, err := query.Clone().Count(ctx)
	if err != nil {
		s.log.Error("failed to count alerts", "error", err)
		return nil, 0, fmt.Errorf("failed to count alerts: %w", err)
	}

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

// GetDigestQueueCount returns the number of alerts in the digest queue for a channel.
func (s *AlertService) GetDigestQueueCount(ctx context.Context, channelID string) (int, error) {
	count, err := s.db.AlertDigestEntry.Query().
		Where(
			alertdigestentry.ChannelID(channelID),
			alertdigestentry.DeliveredAtIsNil(),
		).
		Count(ctx)
	if err != nil {
		s.log.Error("failed to count digest queue", "error", err, "channel_id", channelID)
		return 0, fmt.Errorf("failed to count digest queue: %w", err)
	}
	return count, nil
}

// GetDigestHistory retrieves digest delivery history for a channel.
func (s *AlertService) GetDigestHistory(ctx context.Context, channelID string, limit int) ([]DigestSummary, error) {
	if limit <= 0 {
		limit = 10
	}

	entries, err := s.db.AlertDigestEntry.Query().
		Where(
			alertdigestentry.ChannelID(channelID),
			alertdigestentry.DeliveredAtNotNil(),
			alertdigestentry.DigestIDNotNil(),
		).
		Order(ent.Desc("delivered_at")).
		Limit(limit * 10).
		All(ctx)
	if err != nil {
		s.log.Error("failed to query digest history", "error", err, "channel_id", channelID)
		return nil, fmt.Errorf("failed to query digest history: %w", err)
	}

	digestMap := make(map[string]*DigestSummary)
	digestOrder := []string{}

	for _, entry := range entries {
		if entry.DigestID == "" || entry.DeliveredAt == nil {
			continue
		}
		digestID := entry.DigestID
		if _, exists := digestMap[digestID]; !exists {
			period := "Unknown"
			if !entry.QueuedAt.IsZero() && !entry.DeliveredAt.IsZero() {
				duration := entry.DeliveredAt.Sub(entry.QueuedAt)
				if duration < time.Hour {
					period = fmt.Sprintf("Last %d minutes", int(duration.Minutes()))
				} else if duration < 24*time.Hour {
					period = fmt.Sprintf("Last %d hours", int(duration.Hours()))
				} else {
					period = fmt.Sprintf("Last %d days", int(duration.Hours()/24))
				}
			}
			digestMap[digestID] = &DigestSummary{
				ID:          digestID,
				ChannelID:   channelID,
				DeliveredAt: *entry.DeliveredAt,
				AlertCount:  1,
				Period:      period,
			}
			digestOrder = append(digestOrder, digestID)
		} else {
			digestMap[digestID].AlertCount++
		}
	}

	result := make([]DigestSummary, 0, limit)
	for i := 0; i < len(digestOrder) && i < limit; i++ {
		result = append(result, *digestMap[digestOrder[i]])
	}
	return result, nil
}

// TriggerDigestNow forces immediate digest delivery for a channel.
func (s *AlertService) TriggerDigestNow(ctx context.Context, channelID string) (*DigestSummary, error) {
	if s.digestService == nil {
		return nil, fmt.Errorf("digest service not available")
	}

	if err := s.digestService.DeliverDigest(ctx, channelID); err != nil {
		s.log.Error("failed to trigger digest delivery", "error", err, "channel_id", channelID)
		return nil, fmt.Errorf("failed to trigger digest delivery: %w", err)
	}

	history, err := s.GetDigestHistory(ctx, channelID, 1)
	if err != nil {
		s.log.Warn("failed to get digest history after trigger", "error", err, "channel_id", channelID)
		return &DigestSummary{
			ID:          fmt.Sprintf("digest-%d", time.Now().Unix()),
			ChannelID:   channelID,
			DeliveredAt: time.Now(),
			AlertCount:  0,
			Period:      "Immediate",
		}, nil
	}

	if len(history) == 0 {
		return &DigestSummary{
			ID:          fmt.Sprintf("digest-%d", time.Now().Unix()),
			ChannelID:   channelID,
			DeliveredAt: time.Now(),
			AlertCount:  0,
			Period:      "Immediate",
		}, nil
	}

	return &history[0], nil
}

// GetThrottleStatus returns the throttle status for alert rules.
func (s *AlertService) GetThrottleStatus(ctx context.Context, ruleID *string) ([]ThrottleStatus, error) {
	if s.engine == nil {
		return nil, fmt.Errorf("engine not configured")
	}

	throttleManager := s.engine.GetThrottleManager()
	if throttleManager == nil {
		return nil, fmt.Errorf("throttle manager not available")
	}

	statusData := throttleManager.GetStatus(ruleID)
	results := make([]ThrottleStatus, len(statusData))
	for i, data := range statusData {
		groups := make([]ThrottleGroupStatus, len(data.Groups))
		for j, g := range data.Groups {
			groups[j] = ThrottleGroupStatus{
				GroupKey:        g.GroupKey,
				IsThrottled:     g.IsThrottled,
				SuppressedCount: g.SuppressedCount,
				WindowStart:     g.WindowStart,
				WindowEnd:       g.WindowEnd,
			}
		}
		results[i] = ThrottleStatus{
			RuleID:          data.RuleID,
			IsThrottled:     data.IsThrottled,
			SuppressedCount: data.SuppressedCount,
			WindowStart:     data.WindowStart,
			WindowEnd:       data.WindowEnd,
			Groups:          groups,
		}
	}
	return results, nil
}

// GetStormStatus returns the current storm detection status.
func (s *AlertService) GetStormStatus(ctx context.Context) (*StormStatus, error) {
	if s.engine == nil {
		return nil, fmt.Errorf("engine not configured")
	}

	stormDetector := s.engine.GetStormDetector()
	if stormDetector == nil {
		return nil, fmt.Errorf("storm detector not available")
	}

	statusData := stormDetector.GetStatus()
	now := time.Now()
	windowSeconds := 60

	result := &StormStatus{
		IsStormDetected: statusData.InStorm,
		AlertCount:      statusData.SuppressedCount,
		Threshold:       100,
		WindowSeconds:   windowSeconds,
		WindowStart:     now.Add(-time.Duration(windowSeconds) * time.Second),
		WindowEnd:       now,
		TopRules:        []StormRuleContribution{},
	}

	if statusData.StormStartTime != (time.Time{}) {
		result.StormStartedAt = &statusData.StormStartTime
	}

	return result, nil
}
