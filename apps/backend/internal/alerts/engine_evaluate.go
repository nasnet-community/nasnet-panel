package alerts

import (
	"context"
	"fmt"
	"strings"
	"time"

	"backend/generated/ent"
	"backend/generated/ent/alert"

	"backend/internal/events"
)

// Severity level constants used in alert evaluation and digest formatting.
const (
	severityCritical = "CRITICAL"
	severityError    = "ERROR"
	severityWarning  = "WARNING"
	severityInfo     = "INFO"
)

// evaluateRule evaluates a single rule against event data.
func (e *Engine) evaluateRule(ctx context.Context, rule *ent.AlertRule, eventType string, eventData map[string]interface{}, startTime time.Time) {
	if rule == nil || !rule.Enabled {
		return
	}

	// Check context before proceeding with potentially expensive operations
	if ctx.Err() != nil {
		e.log.Debugw("context canceled, skipping rule evaluation",
			"rule_id", rule.ID,
			"error", ctx.Err())
		return
	}

	// Evaluate conditions
	conditions, err := ParseConditions(rule.Conditions)
	if err != nil {
		e.log.Warnw("failed to parse rule conditions",
			"rule_id", rule.ID,
			"error", err)
		return
	}

	if !EvaluateConditions(conditions, eventData) {
		return // Conditions not met
	}

	// Conditions met - check throttle
	var throttleConfig ThrottleConfig
	if rule.Throttle != nil {
		throttleConfig, err = ParseThrottleConfig(rule.Throttle)
		if err != nil {
			e.log.Warnw("failed to parse throttle config",
				"rule_id", rule.ID,
				"error", err)
		}
	}

	allowed, throttleReason := e.throttleManager.ShouldAllow(rule.ID, eventData, throttleConfig)
	if !allowed {
		e.log.Debugw("alert throttled",
			"rule_id", rule.ID,
			"reason", throttleReason)

		// Track suppression for this rule
		e.trackSuppression(rule.ID, fmt.Sprintf("throttled: %s", throttleReason))
		return
	}

	// Check quiet hours
	e.handleQuietHoursCheck(ctx, rule, eventType, eventData, startTime)
}

// handleQuietHoursCheck checks quiet hours and creates alert if not suppressed.
func (e *Engine) handleQuietHoursCheck(ctx context.Context, rule *ent.AlertRule, eventType string, eventData map[string]interface{}, startTime time.Time) {
	var quietHoursConfig QuietHoursConfig
	var err error
	if rule.QuietHours != nil {
		quietHoursConfig, err = ParseQuietHoursConfig(rule.QuietHours)
		if err != nil {
			e.log.Warnw("failed to parse quiet hours config",
				"rule_id", rule.ID,
				"error", err)
		}
	}

	suppress, suppressReason := e.quietHours.ShouldSuppress(quietHoursConfig, string(rule.Severity), time.Now())
	if suppress {
		e.log.Debugw("alert suppressed by quiet hours",
			"rule_id", rule.ID,
			"reason", suppressReason)

		// Per NAS-18.11 Task 7: Queue alert for digest delivery if digestService is available
		if e.digestService != nil {
			e.queueForDigest(ctx, rule, eventType, eventData)
		}

		return
	}

	// All checks passed - create alert
	suppressedCount, suppressRsn := e.getAndResetSuppression(rule.ID)

	err = e.createAlert(ctx, rule, eventType, eventData, suppressedCount, suppressRsn)
	if err != nil {
		e.log.Errorw("failed to create alert",
			"rule_id", rule.ID,
			"error", err)
		return
	}

	// Log performance metric (AC2 requires <100ms)
	elapsed := time.Since(startTime)
	e.log.Infow("alert triggered",
		"rule_id", rule.ID,
		"rule_name", rule.Name,
		"severity", rule.Severity,
		"elapsed_ms", elapsed.Milliseconds())
}

// queueForDigest queues an alert for digest delivery during quiet hours.
func (e *Engine) queueForDigest(ctx context.Context, rule *ent.AlertRule, eventType string, eventData map[string]interface{}) {
	if rule == nil || e.digestService == nil {
		return
	}

	alertID := fmt.Sprintf("%s-%d", rule.ID, time.Now().UnixNano())
	a := Alert{
		ID:        alertID,
		RuleID:    rule.ID,
		Severity:  string(rule.Severity),
		EventType: eventType,
		Title:     fmt.Sprintf("Alert: %s", rule.Name),
		Message:   fmt.Sprintf("Event %s matched rule conditions during quiet hours", eventType),
		Data:      eventData,
	}

	for _, channelID := range rule.Channels {
		if err := e.digestService.QueueAlert(ctx, a, channelID, "email", false); err != nil {
			e.log.Warnw("failed to queue alert for digest during quiet hours",
				"rule_id", rule.ID,
				"channel_id", channelID,
				"error", err)
		}
	}
}

// createAlert creates and persists an alert, then publishes notification.
// If suppressedCount > 0, includes suppression info in the alert.
func (e *Engine) createAlert(ctx context.Context, rule *ent.AlertRule, eventType string, eventData map[string]interface{}, suppressedCount int, suppressReason string) error {
	if rule == nil || e.db == nil {
		return fmt.Errorf("rule and db must be non-nil")
	}

	// Extract device ID if present
	var deviceID *string
	if id, ok := eventData["device_id"].(string); ok {
		deviceID = &id
	} else if id, ok := eventData["router_id"].(string); ok {
		deviceID = &id
	}

	// Generate title and message
	title := fmt.Sprintf("%s: %s", rule.Severity, rule.Name)
	message := e.formatAlertMessage(rule, eventData)

	// Create alert entity
	alertBuilder := e.db.Alert.Create().
		SetRuleID(rule.ID).
		SetEventType(eventType).
		SetSeverity(alert.Severity(rule.Severity)).
		SetTitle(title).
		SetMessage(message).
		SetData(eventData).
		SetTriggeredAt(time.Now())

	if deviceID != nil {
		alertBuilder.SetDeviceID(*deviceID)
	}

	if suppressedCount > 0 {
		alertBuilder.
			SetSuppressedCount(suppressedCount).
			SetSuppressReason(suppressReason)
	}

	createdAlert, err := alertBuilder.Save(ctx)
	if err != nil {
		return fmt.Errorf("failed to save alert: %w", err)
	}

	// Track for escalation if configured (NAS-18.9)
	if e.escalationEngine != nil {
		if err := e.escalationEngine.TrackAlert(ctx, createdAlert, rule); err != nil {
			e.log.Warnw("failed to track alert for escalation",
				"alert_id", createdAlert.ID,
				"error", err)
		}
	}

	// Publish alert event for subscriptions and notifications (AC3, AC7)
	e.publishAlertEvent(ctx, createdAlert, rule, eventType, title, message, deviceID, eventData)

	return nil
}

// publishAlertEvent publishes an alert created event to the event bus.
func (e *Engine) publishAlertEvent(ctx context.Context, createdAlert *ent.Alert, rule *ent.AlertRule, eventType, title, message string, deviceID *string, eventData map[string]interface{}) {
	if e.eventBus == nil {
		return
	}

	deviceIDStr := ""
	if deviceID != nil {
		deviceIDStr = *deviceID
	}

	alertEvent := events.NewAlertCreatedEvent(
		createdAlert.ID,
		rule.ID,
		eventType,
		string(rule.Severity),
		title,
		message,
		deviceIDStr,
		rule.Channels,
		eventData,
		"alert-engine",
	)

	if err := e.eventBus.Publish(ctx, alertEvent); err != nil {
		e.log.Warnw("failed to publish alert created event",
			"alert_id", createdAlert.ID,
			"error", err)
	}
}

// runDigestDelivery runs a background worker that delivers queued alerts when quiet hours end.
func (e *Engine) runDigestDelivery(ctx context.Context) {
	defer e.log.Info("digest delivery worker stopped")

	for {
		select {
		case <-e.digestTicker.C:
			// Check context before attempting delivery
			if ctx.Err() != nil {
				return
			}
			if err := e.deliverQueuedAlerts(ctx); err != nil {
				e.log.Errorw("failed to deliver queued alerts", "error", err)
			}
		case <-ctx.Done():
			return
		}
	}
}

// deliverQueuedAlerts checks if quiet hours have ended and delivers queued alerts as digest.
func (e *Engine) deliverQueuedAlerts(ctx context.Context) error { //nolint:unparam // ctx used in nested calls
	if e.alertQueue == nil {
		return nil
	}

	queuedCount := e.alertQueue.Count()
	if queuedCount == 0 {
		return nil
	}

	alertsByDevice := e.alertQueue.DequeueAll()

	e.log.Infow("delivering queued alerts digest",
		"total_alerts", queuedCount,
		"devices", len(alertsByDevice))

	for deviceID, alerts := range alertsByDevice {
		if len(alerts) == 0 {
			continue
		}

		shouldDeliver := e.checkQuietHoursForDigest(ctx, alerts)

		if !shouldDeliver {
			for _, alert := range alerts {
				e.alertQueue.Enqueue(&alert)
			}
			e.log.Debugw("quiet hours still active, re-queued alerts",
				"device_id", deviceID,
				"alert_count", len(alerts))
			continue
		}

		digest := FormatDigest(alerts, deviceID)

		err := e.createDigestAlert(ctx, deviceID, alerts, digest)
		if err != nil {
			e.log.Errorw("failed to create digest alert",
				"device_id", deviceID,
				"error", err)
			continue
		}

		e.log.Infow("digest delivered",
			"device_id", deviceID,
			"alert_count", len(alerts))
	}

	return nil
}

// checkQuietHoursForDigest checks if quiet hours allow delivering digest.
func (e *Engine) checkQuietHoursForDigest(ctx context.Context, alerts []QueuedAlert) bool {
	if len(alerts) == 0 {
		return true
	}

	if e.quietHours == nil {
		return true
	}

	rule, err := e.getRuleByID(ctx, alerts[0].RuleID)
	if err != nil || rule == nil || rule.QuietHours == nil {
		return true
	}

	firstRuleConfig, err := ParseQuietHoursConfig(rule.QuietHours)
	if err != nil {
		return true
	}

	suppress, _ := e.quietHours.ShouldSuppress(firstRuleConfig, severityInfo, time.Now())
	return !suppress
}

// determineSeverity determines the highest severity from a list of alerts.
func (e *Engine) determineSeverity(alerts []QueuedAlert) string {
	if len(alerts) == 0 {
		return severityInfo
	}

	severity := alerts[0].Severity

	for _, a := range alerts {
		switch a.Severity {
		case severityCritical:
			return severityCritical
		case severityError:
			if severity != severityCritical {
				severity = severityError
			}
		case severityWarning:
			if severity != severityCritical && severity != severityError {
				severity = severityWarning
			}
		}
	}

	return severity
}

// createDigestAlert creates a single digest alert for multiple queued alerts.
func (e *Engine) createDigestAlert(ctx context.Context, deviceID string, alerts []QueuedAlert, digest string) error {
	if len(alerts) == 0 || e.db == nil {
		return nil
	}

	severity := e.determineSeverity(alerts)

	title := fmt.Sprintf("%s: Quiet Hours Digest (%d alerts)", severity, len(alerts))

	alertBuilder := e.db.Alert.Create().
		SetRuleID(alerts[0].RuleID).
		SetEventType("quiet_hours.digest").
		SetSeverity(alert.Severity(severity)).
		SetTitle(title).
		SetMessage(digest).
		SetData(map[string]interface{}{
			"digest":        true,
			"alert_count":   len(alerts),
			"device_id":     deviceID,
			"queued_alerts": alerts,
		}).
		SetTriggeredAt(time.Now())

	if deviceID != "" {
		alertBuilder.SetDeviceID(deviceID)
	}

	createdAlert, err := alertBuilder.Save(ctx)
	if err != nil {
		return fmt.Errorf("failed to save digest alert: %w", err)
	}

	notificationEvent := events.NewGenericEvent("alert.triggered", events.PriorityCritical, "alert-engine", map[string]interface{}{
		"alert_id":    createdAlert.ID,
		"rule_id":     alerts[0].RuleID,
		"device_id":   deviceID,
		"severity":    severity,
		"title":       title,
		"message":     digest,
		"digest":      true,
		"alert_count": len(alerts),
	})

	if e.eventBus != nil {
		if err := e.eventBus.Publish(ctx, notificationEvent); err != nil {
			e.log.Warnw("failed to publish digest notification event",
				"alert_id", createdAlert.ID,
				"error", err)
		}
	}

	return nil
}

// FormatDigest formats queued alerts into a digest message grouped by severity.
// Returns a formatted string suitable for email/telegram/pushover notifications.
func FormatDigest(alerts []QueuedAlert, deviceID string) string {
	if len(alerts) == 0 {
		return ""
	}

	// Group alerts by severity
	severityGroups := make(map[string][]QueuedAlert)
	for _, a := range alerts {
		severity := a.Severity
		if severity == "" {
			severity = severityInfo
		}
		severityGroups[severity] = append(severityGroups[severity], a)
	}

	// Build digest message
	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("Quiet Hours Digest for %s\n", deviceID))
	sb.WriteString(fmt.Sprintf("Total Alerts: %d\n\n", len(alerts)))

	// Order: CRITICAL, ERROR, WARNING, INFO
	severityOrder := []string{severityCritical, severityError, severityWarning, severityInfo}
	for _, severity := range severityOrder {
		group, exists := severityGroups[severity]
		if !exists || len(group) == 0 {
			continue
		}

		sb.WriteString(fmt.Sprintf("%s (%d):\n", severity, len(group)))

		eventTypeGroups := make(map[string]int)
		for _, a := range group {
			eventTypeGroups[a.EventType]++
		}

		for eventType, count := range eventTypeGroups {
			sb.WriteString(fmt.Sprintf("  • %s: %d\n", eventType, count))
		}
		sb.WriteString("\n")
	}

	// Add timestamp range
	if len(alerts) > 0 {
		oldest := alerts[0].Timestamp
		newest := alerts[0].Timestamp
		for _, a := range alerts[1:] {
			if a.Timestamp.Before(oldest) {
				oldest = a.Timestamp
			}
			if a.Timestamp.After(newest) {
				newest = a.Timestamp
			}
		}
		sb.WriteString(fmt.Sprintf("Period: %s to %s\n",
			oldest.Format("15:04:05"),
			newest.Format("15:04:05")))
	}

	return sb.String()
}
