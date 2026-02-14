package digest

import (
	"bytes"
	"fmt"
	"time"
)

// renderEmailDigest renders an email digest notification.
func (ds *Service) renderEmailDigest(payload *DigestPayload) (title, message string, data map[string]interface{}, err error) {
	tmplData := map[string]interface{}{
		"DigestID":       payload.DigestID,
		"TotalCount":     payload.TotalCount,
		"SeverityCounts": payload.SeverityCounts,
		"OldestAlert":    payload.OldestAlert.Format("2006-01-02 15:04:05 MST"),
		"NewestAlert":    payload.NewestAlert.Format("2006-01-02 15:04:05 MST"),
		"Entries":        payload.Entries,
	}

	var htmlBuf bytes.Buffer
	if err := ds.htmlTemplate.Execute(&htmlBuf, tmplData); err != nil {
		return "", "", nil, fmt.Errorf("failed to render HTML digest: %w", err)
	}

	var textBuf bytes.Buffer
	if err := ds.textTemplate.Execute(&textBuf, tmplData); err != nil {
		return "", "", nil, fmt.Errorf("failed to render text digest: %w", err)
	}

	return fmt.Sprintf("NasNet Alert Digest (%d alerts)", payload.TotalCount),
		textBuf.String(),
		map[string]interface{}{
			"digest_id":       payload.DigestID,
			"total_count":     payload.TotalCount,
			"severity_counts": payload.SeverityCounts,
			"html_body":       htmlBuf.String(),
		},
		nil
}

// renderWebhookDigest renders a webhook digest payload.
func (ds *Service) renderWebhookDigest(payload *DigestPayload) (title, message string, data map[string]interface{}, err error) {
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

	return fmt.Sprintf("NasNet Alert Digest (%d alerts)", payload.TotalCount),
		fmt.Sprintf("Digest containing %d alerts", payload.TotalCount),
		map[string]interface{}{
			"digest_id":       payload.DigestID,
			"total_count":     payload.TotalCount,
			"severity_counts": payload.SeverityCounts,
			"oldest_alert":    payload.OldestAlert.Format(time.RFC3339),
			"newest_alert":    payload.NewestAlert.Format(time.RFC3339),
			"alerts":          summaries,
		},
		nil
}

// renderGenericDigest renders a generic digest notification.
func (ds *Service) renderGenericDigest(payload *DigestPayload) (title, message string, data map[string]interface{}, err error) {
	msg := fmt.Sprintf("Alert Digest Summary (%s)\n\n", time.Now().Format("2006-01-02 15:04:05"))
	msg += fmt.Sprintf("Total Alerts: %d\n", payload.TotalCount)
	msg += "Severity Breakdown:\n"
	for severity, count := range payload.SeverityCounts {
		msg += fmt.Sprintf("  - %s: %d\n", severity, count)
	}
	msg += fmt.Sprintf("\nTime Range: %s to %s\n",
		payload.OldestAlert.Format("15:04:05"),
		payload.NewestAlert.Format("15:04:05"))

	return fmt.Sprintf("NasNet Alert Digest (%d alerts)", payload.TotalCount),
		msg,
		map[string]interface{}{
			"digest_id":       payload.DigestID,
			"total_count":     payload.TotalCount,
			"severity_counts": payload.SeverityCounts,
		},
		nil
}
