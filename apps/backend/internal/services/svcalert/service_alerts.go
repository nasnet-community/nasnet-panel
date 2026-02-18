package svcalert

import (
	"context"
	"fmt"
	"time"

	"backend/generated/ent"
	"backend/generated/ent/alert"

	"backend/internal/events"
)

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
		if err := s.eventBus.Publish(ctx, &event); err != nil {
			s.log.Warnw("failed to publish event", "error", err)
		}
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
