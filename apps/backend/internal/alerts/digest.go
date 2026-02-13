// Package alerts implements digest mode for alert notifications.
package alerts

import (
	"bytes"
	"context"
	"fmt"
	"html/template"
	"time"

	"github.com/google/uuid"
	"go.uber.org/zap"

	"backend/ent"
	"backend/ent/alertdigestentry"
	"backend/internal/events"
	"backend/internal/notifications"
	"backend/templates/alerts"
)

// DigestService manages queuing and delivery of digest notifications.
// Per NAS-18.11 Task 2: Implement DigestService for alert digest queuing and delivery.
type DigestService struct {
	db         *ent.Client
	eventBus   events.EventBus
	dispatcher *notifications.Dispatcher
	log        *zap.SugaredLogger

	// Templates for digest emails
	htmlTemplate *template.Template
	textTemplate *template.Template
}

// DigestServiceConfig holds configuration for DigestService.
type DigestServiceConfig struct {
	DB         *ent.Client
	EventBus   events.EventBus
	Dispatcher *notifications.Dispatcher
	Logger     *zap.SugaredLogger
}

// DigestConfig defines digest delivery configuration.
type DigestConfig struct {
	Mode           string   `json:"mode"`           // "immediate", "hourly", "daily"
	Schedule       string   `json:"schedule"`       // For hourly: "00" (minute), for daily: "09:00" (HH:MM)
	Timezone       string   `json:"timezone"`       // IANA timezone (e.g., "America/New_York")
	BypassCritical bool     `json:"bypassCritical"` // Whether CRITICAL alerts bypass digest
	SendEmpty      bool     `json:"sendEmpty"`      // Whether to send digest when no alerts queued
	QuietHours     *string  `json:"quietHours"`     // Optional quiet hours config reference
	Severities     []string `json:"severities"`     // Severities to include in digest (empty = all)
}

// DigestPayload represents a compiled digest ready for delivery.
type DigestPayload struct {
	DigestID       string
	ChannelID      string
	ChannelType    string
	Entries        []*ent.AlertDigestEntry
	SeverityCounts map[string]int
	OldestAlert    time.Time
	NewestAlert    time.Time
	TotalCount     int
}

// Alert represents a normalized alert structure for queuing.
type Alert struct {
	ID        string
	RuleID    string
	Severity  string
	EventType string
	Title     string
	Message   string
	Data      map[string]interface{}
}

// NewDigestService creates a new DigestService.
func NewDigestService(cfg DigestServiceConfig) (*DigestService, error) {
	// Load HTML template
	htmlContent, err := alerts.GetTemplate("digest", "digest-email.html.tmpl")
	if err != nil {
		return nil, fmt.Errorf("failed to load HTML digest template: %w", err)
	}

	htmlTmpl, err := template.New("digest-html").Funcs(alerts.TemplateFuncMap()).Parse(htmlContent)
	if err != nil {
		return nil, fmt.Errorf("failed to parse HTML digest template: %w", err)
	}

	// Load text template
	textContent, err := alerts.GetTemplate("digest", "digest-email.txt.tmpl")
	if err != nil {
		return nil, fmt.Errorf("failed to load text digest template: %w", err)
	}

	textTmpl, err := template.New("digest-text").Funcs(alerts.TemplateFuncMap()).Parse(textContent)
	if err != nil {
		return nil, fmt.Errorf("failed to parse text digest template: %w", err)
	}

	return &DigestService{
		db:           cfg.DB,
		eventBus:     cfg.EventBus,
		dispatcher:   cfg.Dispatcher,
		log:          cfg.Logger,
		htmlTemplate: htmlTmpl,
		textTemplate: textTmpl,
	}, nil
}

// ShouldQueue determines if an alert should be queued for digest delivery.
// Returns true if the alert should be queued based on digest configuration.
func (ds *DigestService) ShouldQueue(digestConfig DigestConfig, severity string) bool {
	// Immediate mode never queues
	if digestConfig.Mode == "immediate" {
		return false
	}

	// Critical alerts bypass digest if configured
	if digestConfig.BypassCritical && severity == "critical" {
		return false
	}

	// Check if severity is included in digest
	if len(digestConfig.Severities) > 0 {
		severityIncluded := false
		for _, s := range digestConfig.Severities {
			if s == severity {
				severityIncluded = true
				break
			}
		}
		if !severityIncluded {
			return false // Severity not in digest list, send immediately
		}
	}

	return true
}

// QueueAlert adds an alert to the digest queue for later delivery.
// If bypassSent is true, the alert was already sent immediately but should
// still appear in the digest for historical context.
func (ds *DigestService) QueueAlert(ctx context.Context, alert Alert, channelID, channelType string, bypassSent bool) error {
	// Create digest entry
	entry := ds.db.AlertDigestEntry.Create().
		SetAlertID(alert.ID).
		SetRuleID(alert.RuleID).
		SetChannelID(channelID).
		SetChannelType(channelType).
		SetSeverity(alertdigestentry.Severity(alert.Severity)).
		SetEventType(alert.EventType).
		SetTitle(alert.Title).
		SetMessage(alert.Message).
		SetBypassSent(bypassSent).
		SetQueuedAt(time.Now())

	if alert.Data != nil {
		entry.SetData(alert.Data)
	}

	savedEntry, err := entry.Save(ctx)
	if err != nil {
		return fmt.Errorf("failed to queue alert for digest: %w", err)
	}

	ds.log.Debugw("alert queued for digest",
		"entry_id", savedEntry.ID,
		"alert_id", alert.ID,
		"channel_id", channelID,
		"severity", alert.Severity,
		"bypass_sent", bypassSent)

	// Publish event
	if ds.eventBus != nil {
		event := events.NewGenericEvent("alert.digest.queued", events.PriorityNormal, "alert-digest-service", map[string]interface{}{
			"entry_id":    savedEntry.ID.String(),
			"alert_id":    alert.ID,
			"rule_id":     alert.RuleID,
			"channel_id":  channelID,
			"severity":    alert.Severity,
			"bypass_sent": bypassSent,
		})

		if err := ds.eventBus.Publish(ctx, event); err != nil {
			ds.log.Warnw("failed to publish digest queued event", "error", err)
		}
	}

	return nil
}

// CompileDigest retrieves and groups pending alerts for a channel since a given time.
// Returns nil if no alerts are pending.
func (ds *DigestService) CompileDigest(ctx context.Context, channelID string, since time.Time) (*DigestPayload, error) {
	// Query pending digest entries for this channel
	entries, err := ds.db.AlertDigestEntry.Query().
		Where(
			alertdigestentry.ChannelID(channelID),
			alertdigestentry.DeliveredAtIsNil(),
			alertdigestentry.QueuedAtGTE(since),
		).
		Order(ent.Asc(alertdigestentry.FieldQueuedAt)).
		All(ctx)

	if err != nil {
		return nil, fmt.Errorf("failed to query digest entries: %w", err)
	}

	if len(entries) == 0 {
		return nil, nil // No pending alerts
	}

	// Build payload
	payload := &DigestPayload{
		DigestID:       uuid.New().String(),
		ChannelID:      channelID,
		ChannelType:    entries[0].ChannelType, // All entries have same channel type
		Entries:        entries,
		SeverityCounts: make(map[string]int),
		OldestAlert:    entries[0].QueuedAt,
		NewestAlert:    entries[len(entries)-1].QueuedAt,
		TotalCount:     len(entries),
	}

	// Count by severity
	for _, entry := range entries {
		payload.SeverityCounts[string(entry.Severity)]++
	}

	ds.log.Infow("digest compiled",
		"digest_id", payload.DigestID,
		"channel_id", channelID,
		"total_alerts", payload.TotalCount,
		"severities", payload.SeverityCounts)

	return payload, nil
}

// DeliverDigest compiles and delivers a digest for the specified channel.
// Marks all included entries as delivered.
func (ds *DigestService) DeliverDigest(ctx context.Context, channelID string) error {
	// Compile digest from last 24 hours
	since := time.Now().Add(-24 * time.Hour)
	payload, err := ds.CompileDigest(ctx, channelID, since)
	if err != nil {
		return fmt.Errorf("failed to compile digest: %w", err)
	}

	if payload == nil {
		ds.log.Debugw("no pending alerts for digest", "channel_id", channelID)
		return nil
	}

	// Render digest content based on channel type
	var notification notifications.Notification
	switch payload.ChannelType {
	case "email":
		notification, err = ds.renderEmailDigest(payload)
	case "webhook":
		notification, err = ds.renderWebhookDigest(payload)
	default:
		notification, err = ds.renderGenericDigest(payload)
	}

	if err != nil {
		return fmt.Errorf("failed to render digest: %w", err)
	}

	// Dispatch notification
	results := ds.dispatcher.Dispatch(ctx, notification, []string{channelID})

	// Check delivery result
	success := false
	for _, result := range results {
		if result.Success {
			success = true
		} else {
			ds.log.Warnw("digest delivery failed",
				"channel_id", channelID,
				"error", result.Error)
		}
	}

	if !success {
		return fmt.Errorf("digest delivery failed for channel %s", channelID)
	}

	// Mark entries as delivered
	deliveredAt := time.Now()
	_, err = ds.db.AlertDigestEntry.Update().
		Where(
			alertdigestentry.IDIn(extractEntryIDs(payload.Entries)...),
		).
		SetDeliveredAt(deliveredAt).
		SetDigestID(payload.DigestID).
		Save(ctx)

	if err != nil {
		return fmt.Errorf("failed to mark digest entries as delivered: %w", err)
	}

	ds.log.Infow("digest delivered",
		"digest_id", payload.DigestID,
		"channel_id", channelID,
		"alerts_delivered", payload.TotalCount)

	// Publish event
	if ds.eventBus != nil {
		event := events.NewGenericEvent("alert.digest.delivered", events.PriorityNormal, "alert-digest-service", map[string]interface{}{
			"digest_id":  payload.DigestID,
			"channel_id": channelID,
			"alert_count": payload.TotalCount,
			"severities": payload.SeverityCounts,
		})

		if err := ds.eventBus.Publish(ctx, event); err != nil {
			ds.log.Warnw("failed to publish digest delivered event", "error", err)
		}
	}

	return nil
}

// HandleEmptyDigest handles digest delivery when no alerts are queued.
// If sendEmpty is true, sends an "all clear" notification.
func (ds *DigestService) HandleEmptyDigest(ctx context.Context, channelID string, sendEmpty bool) error {
	if !sendEmpty {
		ds.log.Debugw("skipping empty digest", "channel_id", channelID)
		return nil
	}

	// Send "all clear" notification
	notification := notifications.Notification{
		Title:    "NasNet Digest: All Clear",
		Message:  fmt.Sprintf("No alerts have been queued since the last digest for channel %s. All systems operating normally.", channelID),
		Severity: "info",
		Data: map[string]interface{}{
			"digest_type": "empty",
			"channel_id":  channelID,
			"timestamp":   time.Now().Format(time.RFC3339),
		},
	}

	results := ds.dispatcher.Dispatch(ctx, notification, []string{channelID})

	// Check delivery result
	for _, result := range results {
		if !result.Success {
			ds.log.Warnw("empty digest delivery failed",
				"channel_id", channelID,
				"error", result.Error)
			return fmt.Errorf("empty digest delivery failed: %s", result.Error)
		}
	}

	ds.log.Infow("empty digest delivered", "channel_id", channelID)
	return nil
}

// renderEmailDigest renders an email digest notification.
func (ds *DigestService) renderEmailDigest(payload *DigestPayload) (notifications.Notification, error) {
	// Prepare template data
	data := map[string]interface{}{
		"DigestID":       payload.DigestID,
		"TotalCount":     payload.TotalCount,
		"SeverityCounts": payload.SeverityCounts,
		"OldestAlert":    payload.OldestAlert.Format("2006-01-02 15:04:05 MST"),
		"NewestAlert":    payload.NewestAlert.Format("2006-01-02 15:04:05 MST"),
		"Entries":        payload.Entries,
	}

	// Render HTML body
	var htmlBuf bytes.Buffer
	if err := ds.htmlTemplate.Execute(&htmlBuf, data); err != nil {
		return notifications.Notification{}, fmt.Errorf("failed to render HTML digest: %w", err)
	}

	// Render text body
	var textBuf bytes.Buffer
	if err := ds.textTemplate.Execute(&textBuf, data); err != nil {
		return notifications.Notification{}, fmt.Errorf("failed to render text digest: %w", err)
	}

	return notifications.Notification{
		Title:    fmt.Sprintf("NasNet Alert Digest (%d alerts)", payload.TotalCount),
		Message:  textBuf.String(),
		Severity: "info",
		Data: map[string]interface{}{
			"digest_id":       payload.DigestID,
			"total_count":     payload.TotalCount,
			"severity_counts": payload.SeverityCounts,
			"html_body":       htmlBuf.String(),
		},
	}, nil
}

// renderWebhookDigest renders a webhook digest payload.
func (ds *DigestService) renderWebhookDigest(payload *DigestPayload) (notifications.Notification, error) {
	// Build alert summaries
	summaries := make([]map[string]interface{}, len(payload.Entries))
	for i, entry := range payload.Entries {
		summaries[i] = map[string]interface{}{
			"id":         entry.ID.String(),
			"alert_id":   entry.AlertID,
			"rule_id":    entry.RuleID,
			"severity":   string(entry.Severity),
			"event_type": entry.EventType,
			"title":      entry.Title,
			"message":    entry.Message,
			"queued_at":  entry.QueuedAt.Format(time.RFC3339),
		}
	}

	return notifications.Notification{
		Title:    fmt.Sprintf("NasNet Alert Digest (%d alerts)", payload.TotalCount),
		Message:  fmt.Sprintf("Digest containing %d alerts", payload.TotalCount),
		Severity: "info",
		Data: map[string]interface{}{
			"digest_id":       payload.DigestID,
			"total_count":     payload.TotalCount,
			"severity_counts": payload.SeverityCounts,
			"oldest_alert":    payload.OldestAlert.Format(time.RFC3339),
			"newest_alert":    payload.NewestAlert.Format(time.RFC3339),
			"alerts":          summaries,
		},
	}, nil
}

// renderGenericDigest renders a generic digest notification.
func (ds *DigestService) renderGenericDigest(payload *DigestPayload) (notifications.Notification, error) {
	// Build simple text summary
	message := fmt.Sprintf("Alert Digest Summary (%s)\n\n", time.Now().Format("2006-01-02 15:04:05"))
	message += fmt.Sprintf("Total Alerts: %d\n", payload.TotalCount)
	message += "Severity Breakdown:\n"
	for severity, count := range payload.SeverityCounts {
		message += fmt.Sprintf("  - %s: %d\n", severity, count)
	}
	message += fmt.Sprintf("\nTime Range: %s to %s\n",
		payload.OldestAlert.Format("15:04:05"),
		payload.NewestAlert.Format("15:04:05"))

	return notifications.Notification{
		Title:    fmt.Sprintf("NasNet Alert Digest (%d alerts)", payload.TotalCount),
		Message:  message,
		Severity: "info",
		Data: map[string]interface{}{
			"digest_id":       payload.DigestID,
			"total_count":     payload.TotalCount,
			"severity_counts": payload.SeverityCounts,
		},
	}, nil
}

// extractEntryIDs extracts entry IDs from a slice of entries.
func extractEntryIDs(entries []*ent.AlertDigestEntry) []uuid.UUID {
	ids := make([]uuid.UUID, len(entries))
	for i, entry := range entries {
		ids[i] = entry.ID
	}
	return ids
}
