// Package services contains business logic services for NasNetConnect.
package services

import (
	"context"
	"fmt"
	"time"

	"backend/ent"
	"backend/ent/alert"
	"backend/ent/alertdigestentry"
	"backend/ent/alertrule"
	"backend/internal/events"

	"go.uber.org/zap"
)

// EscalationCanceller defines the interface for cancelling alert escalations.
// This avoids circular dependency between alerts and services packages.
type EscalationCanceller interface {
	CancelEscalation(ctx context.Context, alertID string, reason string) error
}

// DigestService defines methods for digest operations (NAS-18.11 Task 8).
type DigestService interface {
	CompileDigest(ctx context.Context, channelID string, since time.Time) (*DigestPayload, error)
	DeliverDigest(ctx context.Context, channelID string) error
}

// DigestPayload represents a compiled digest ready for delivery.
type DigestPayload struct {
	DigestID       string
	ChannelID      string
	TotalCount     int
	SeverityCounts map[string]int
	OldestAlert    time.Time
	NewestAlert    time.Time
}

// DigestSummary represents a delivered digest summary.
type DigestSummary struct {
	ID          string
	ChannelID   string
	DeliveredAt time.Time
	AlertCount  int
	Period      string
}

// EngineInterface defines the interface for accessing throttle and storm status.
// This avoids circular dependency between services and alerts packages.
type EngineInterface interface {
	GetThrottleManager() ThrottleManagerInterface
	GetStormDetector() StormDetectorInterface
}

// ThrottleManagerInterface provides methods for querying throttle status.
type ThrottleManagerInterface interface {
	GetStatus(ruleID *string) []ThrottleStatusData
}

// StormDetectorInterface provides methods for querying storm status.
type StormDetectorInterface interface {
	GetStatus() StormStatusData
}

// ThrottleStatusData is imported from alerts package.
type ThrottleStatusData struct {
	RuleID          string
	IsThrottled     bool
	SuppressedCount int
	WindowStart     time.Time
	WindowEnd       time.Time
	Groups          []ThrottleGroupStatusData
}

// ThrottleGroupStatusData is imported from alerts package.
type ThrottleGroupStatusData struct {
	GroupKey        string
	IsThrottled     bool
	SuppressedCount int
	WindowStart     time.Time
	WindowEnd       time.Time
}

// StormStatusData is imported from alerts package.
type StormStatusData struct {
	InStorm            bool
	StormStartTime     time.Time
	SuppressedCount    int
	CurrentRate        float64
	CooldownRemaining  time.Duration
}

// AlertService provides alert rule and alert management operations.
// It coordinates between GraphQL resolvers, the alert engine, and the event bus
// to implement the alert and notification system per NAS-5.12.
type AlertService struct {
	db                  *ent.Client
	eventBus            events.EventBus
	eventPublisher      *events.Publisher
	engine              EngineInterface
	escalationCanceller EscalationCanceller
	digestService       DigestService // Optional digest service for NAS-18.11
	log                 *zap.SugaredLogger
}

// AlertServiceConfig holds configuration for AlertService.
type AlertServiceConfig struct {
	DB                  *ent.Client
	EventBus            events.EventBus
	Engine              EngineInterface
	EscalationCanceller EscalationCanceller
	DigestService       DigestService // Optional digest service for NAS-18.11
	Logger              *zap.SugaredLogger
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
	Escalation  map[string]interface{} // JSON escalation config (NAS-18.9)
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
	Escalation  map[string]interface{} // JSON escalation config (NAS-18.9)
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
		db:                  cfg.DB,
		eventBus:            cfg.EventBus,
		engine:              cfg.Engine,
		escalationCanceller: cfg.EscalationCanceller,
		digestService:       cfg.DigestService,
		log:                 cfg.Logger,
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
	if input.Escalation != nil {
		ruleBuilder.SetEscalation(input.Escalation)
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
	if input.Escalation != nil {
		updateBuilder.SetEscalation(input.Escalation)
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

// ToggleRule enables or disables an alert rule.
// Per AC6: User can enable/disable alert rules via GraphQL mutation.
func (s *AlertService) ToggleRule(ctx context.Context, ruleID string, enabled bool) (*ent.AlertRule, error) {
	// Find existing rule
	rule, err := s.db.AlertRule.Get(ctx, ruleID)
	if err != nil {
		if ent.IsNotFound(err) {
			return nil, fmt.Errorf("alert rule not found: %s", ruleID)
		}
		return nil, fmt.Errorf("failed to fetch alert rule: %w", err)
	}

	// Check if already in desired state
	if rule.Enabled == enabled {
		s.log.Debug("alert rule already in desired state", "rule_id", ruleID, "enabled", enabled)
		return rule, nil // No change needed
	}

	// Update enabled state
	updatedRule, err := rule.Update().
		SetEnabled(enabled).
		Save(ctx)
	if err != nil {
		s.log.Error("failed to toggle alert rule", "error", err, "rule_id", ruleID, "enabled", enabled)
		return nil, fmt.Errorf("failed to toggle alert rule: %w", err)
	}

	// Publish event for alert engine to reload rules
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

	// Cancel any pending escalations (NAS-18.9)
	if s.escalationCanceller != nil {
		if err := s.escalationCanceller.CancelEscalation(ctx, input.AlertID, "alert acknowledged"); err != nil {
			s.log.Warnw("failed to cancel escalation after acknowledgment",
				"alert_id", input.AlertID,
				"error", err)
			// Don't fail acknowledgment on escalation cancellation failure
		}
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

// GetDigestQueueCount returns the number of alerts in the digest queue for a channel.
// Per NAS-18.11 Task 8: Count where delivered_at IS NULL.
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
// Per NAS-18.11 Task 8: Group by digest_id.
func (s *AlertService) GetDigestHistory(ctx context.Context, channelID string, limit int) ([]DigestSummary, error) {
	if limit <= 0 {
		limit = 10 // Default limit
	}

	// Query delivered digest entries, grouped by digest_id
	entries, err := s.db.AlertDigestEntry.Query().
		Where(
			alertdigestentry.ChannelID(channelID),
			alertdigestentry.DeliveredAtNotNil(),
			alertdigestentry.DigestIDNotNil(),
		).
		Order(ent.Desc("delivered_at")).
		Limit(limit * 10). // Fetch more to ensure we get enough unique digests
		All(ctx)

	if err != nil {
		s.log.Error("failed to query digest history", "error", err, "channel_id", channelID)
		return nil, fmt.Errorf("failed to query digest history: %w", err)
	}

	// Group by digest_id
	digestMap := make(map[string]*DigestSummary)
	digestOrder := []string{} // Track order of first appearance

	for _, entry := range entries {
		if entry.DigestID == "" || entry.DeliveredAt == nil {
			continue
		}

		digestID := entry.DigestID
		if _, exists := digestMap[digestID]; !exists {
			// Calculate period based on oldest and newest alerts in this digest
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

	// Build result list in order, limited to requested count
	result := make([]DigestSummary, 0, limit)
	for i := 0; i < len(digestOrder) && i < limit; i++ {
		result = append(result, *digestMap[digestOrder[i]])
	}

	return result, nil
}

// TriggerDigestNow forces immediate digest delivery for a channel.
// Per NAS-18.11 Task 8: Force delivery.
func (s *AlertService) TriggerDigestNow(ctx context.Context, channelID string) (*DigestSummary, error) {
	if s.digestService == nil {
		return nil, fmt.Errorf("digest service not available")
	}

	// Deliver digest
	if err := s.digestService.DeliverDigest(ctx, channelID); err != nil {
		s.log.Error("failed to trigger digest delivery", "error", err, "channel_id", channelID)
		return nil, fmt.Errorf("failed to trigger digest delivery: %w", err)
	}

	// Get the most recent digest summary
	history, err := s.GetDigestHistory(ctx, channelID, 1)
	if err != nil {
		s.log.Warn("failed to get digest history after trigger", "error", err, "channel_id", channelID)
		// Return a basic summary
		return &DigestSummary{
			ID:          fmt.Sprintf("digest-%d", time.Now().Unix()),
			ChannelID:   channelID,
			DeliveredAt: time.Now(),
			AlertCount:  0,
			Period:      "Immediate",
		}, nil
	}

	if len(history) == 0 {
		// No digest was delivered (likely no pending alerts)
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

// ThrottleStatus represents the throttle status for an alert rule.
type ThrottleStatus struct {
	RuleID          string
	IsThrottled     bool
	SuppressedCount int
	WindowStart     time.Time
	WindowEnd       time.Time
	Groups          []ThrottleGroupStatus
}

// ThrottleGroupStatus represents the throttle status for a specific group.
type ThrottleGroupStatus struct {
	GroupKey        string
	IsThrottled     bool
	SuppressedCount int
	WindowStart     time.Time
	WindowEnd       time.Time
}

// StormStatus represents the current storm detection status.
type StormStatus struct {
	IsStormDetected bool
	AlertCount      int
	Threshold       int
	WindowSeconds   int
	StormStartedAt  *time.Time
	WindowStart     time.Time
	WindowEnd       time.Time
	TopRules        []StormRuleContribution
}

// StormRuleContribution represents a rule's contribution to the alert storm.
type StormRuleContribution struct {
	RuleID     string
	RuleName   string
	AlertCount int
	Percentage float64
}

// GetThrottleStatus returns the throttle status for alert rules.
// If ruleID is provided, returns status for that rule only.
// Otherwise returns status for all rules.
func (s *AlertService) GetThrottleStatus(ctx context.Context, ruleID *string) ([]ThrottleStatus, error) {
	if s.engine == nil {
		return nil, fmt.Errorf("engine not configured")
	}

	throttleManager := s.engine.GetThrottleManager()
	if throttleManager == nil {
		return nil, fmt.Errorf("throttle manager not available")
	}

	// Get status from throttle manager
	statusData := throttleManager.GetStatus(ruleID)

	// Convert to service type
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

	// Get status from storm detector
	statusData := stormDetector.GetStatus()

	// Convert to service type
	now := time.Now()
	windowSeconds := 60 // Default 1 minute window

	result := &StormStatus{
		IsStormDetected: statusData.InStorm,
		AlertCount:      statusData.SuppressedCount,
		Threshold:       100, // From DefaultStormConfig
		WindowSeconds:   windowSeconds,
		WindowStart:     now.Add(-time.Duration(windowSeconds) * time.Second),
		WindowEnd:       now,
		TopRules:        []StormRuleContribution{},
	}

	if statusData.StormStartTime != (time.Time{}) {
		result.StormStartedAt = &statusData.StormStartTime
	}

	// TODO: Query database for top contributing rules during storm period
	// This would require tracking rule IDs when alerts are suppressed

	return result, nil
}
