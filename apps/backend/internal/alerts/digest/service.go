package digest

import (
	"context"
	"fmt"
	"html/template"
	"time"

	"github.com/google/uuid"
	"go.uber.org/zap"

	"backend/generated/ent"
	"backend/generated/ent/alertdigestentry"
	alerts "backend/templates/alerts"

	"backend/internal/events"
)

// Service manages queuing and delivery of digest notifications.
type Service struct {
	db       *ent.Client
	eventBus events.EventBus
	dispatch DispatchFunc
	log      *zap.SugaredLogger

	htmlTemplate *template.Template
	textTemplate *template.Template
}

// NewService creates a new digest Service.
func NewService(cfg ServiceConfig) (*Service, error) {
	htmlContent, err := alerts.GetTemplate("digest", "digest-email.html.tmpl")
	if err != nil {
		return nil, fmt.Errorf("failed to load HTML digest template: %w", err)
	}

	htmlTmpl, err := template.New("digest-html").Funcs(alerts.TemplateFuncMap()).Parse(htmlContent)
	if err != nil {
		return nil, fmt.Errorf("failed to parse HTML digest template: %w", err)
	}

	textContent, err := alerts.GetTemplate("digest", "digest-email.txt.tmpl")
	if err != nil {
		return nil, fmt.Errorf("failed to load text digest template: %w", err)
	}

	textTmpl, err := template.New("digest-text").Funcs(alerts.TemplateFuncMap()).Parse(textContent)
	if err != nil {
		return nil, fmt.Errorf("failed to parse text digest template: %w", err)
	}

	return &Service{
		db:           cfg.DB,
		eventBus:     cfg.EventBus,
		dispatch:     cfg.Dispatch,
		log:          cfg.Logger,
		htmlTemplate: htmlTmpl,
		textTemplate: textTmpl,
	}, nil
}

// ShouldQueue determines if an alert should be queued for digest delivery.
func (ds *Service) ShouldQueue(digestConfig Config, severity string) bool {
	if digestConfig.Mode == "immediate" {
		return false
	}

	if digestConfig.BypassCritical && severity == "critical" {
		return false
	}

	if len(digestConfig.Severities) > 0 {
		severityIncluded := false
		for _, s := range digestConfig.Severities {
			if s == severity {
				severityIncluded = true
				break
			}
		}
		if !severityIncluded {
			return false
		}
	}

	return true
}

// QueueAlert adds an alert to the digest queue for later delivery.
func (ds *Service) QueueAlert(ctx context.Context, alert Alert, channelID, channelType string, bypassSent bool) error {
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
			ds.log.Warnw("failed to publish digest queued event",
				"error", err,
				"entry_id", savedEntry.ID.String())
		}
	}

	return nil
}

// CompileDigest retrieves and groups pending alerts for a channel since a given time.
func (ds *Service) CompileDigest(ctx context.Context, channelID string, since time.Time) (*Payload, error) {
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
		return nil, fmt.Errorf("no pending alerts")
	}

	payload := &Payload{
		DigestID:       uuid.New().String(),
		ChannelID:      channelID,
		ChannelType:    entries[0].ChannelType,
		Entries:        entries,
		SeverityCounts: make(map[string]int),
		OldestAlert:    entries[0].QueuedAt,
		NewestAlert:    entries[len(entries)-1].QueuedAt,
		TotalCount:     len(entries),
	}

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
func (ds *Service) DeliverDigest(ctx context.Context, channelID string) error {
	since := time.Now().Add(-24 * time.Hour)
	payload, err := ds.CompileDigest(ctx, channelID, since)
	if err != nil {
		return fmt.Errorf("failed to compile digest: %w", err)
	}

	if payload == nil {
		ds.log.Debugw("no pending alerts for digest", "channel_id", channelID)
		return nil
	}

	var title, message, severity string
	var data map[string]interface{}

	switch payload.ChannelType {
	case "email":
		title, message, data, err = ds.renderEmailDigest(payload)
	case "webhook":
		title, message, data, err = ds.renderWebhookDigest(payload)
	default:
		title, message, data, err = ds.renderGenericDigest(payload)
	}
	severity = "info"

	if err != nil {
		return fmt.Errorf("failed to render digest: %w", err)
	}

	results := ds.dispatch(ctx, title, message, severity, data, nil, []string{channelID})

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

	if ds.eventBus != nil {
		event := events.NewGenericEvent("alert.digest.delivered", events.PriorityNormal, "alert-digest-service", map[string]interface{}{
			"digest_id":   payload.DigestID,
			"channel_id":  channelID,
			"alert_count": payload.TotalCount,
			"severities":  payload.SeverityCounts,
		})

		if err := ds.eventBus.Publish(ctx, event); err != nil {
			ds.log.Warnw("failed to publish digest delivered event",
				"error", err,
				"digest_id", payload.DigestID)
		}
	}

	return nil
}

// HandleEmptyDigest handles digest delivery when no alerts are queued.
func (ds *Service) HandleEmptyDigest(ctx context.Context, channelID string, sendEmpty bool) error {
	if !sendEmpty {
		ds.log.Debugw("skipping empty digest", "channel_id", channelID)
		return nil
	}

	title := "NasNet Digest: All Clear"
	message := fmt.Sprintf("No alerts have been queued since the last digest for channel %s. All systems operating normally.", channelID)
	data := map[string]interface{}{
		"digest_type": "empty",
		"channel_id":  channelID,
		"timestamp":   time.Now().Format(time.RFC3339),
	}

	results := ds.dispatch(ctx, title, message, "info", data, nil, []string{channelID})

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

// extractEntryIDs extracts entry IDs from a slice of entries.
func extractEntryIDs(entries []*ent.AlertDigestEntry) []uuid.UUID {
	ids := make([]uuid.UUID, len(entries))
	for i, entry := range entries {
		ids[i] = entry.ID
	}
	return ids
}
