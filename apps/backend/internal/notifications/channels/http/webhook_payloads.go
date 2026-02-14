package http

import (
	"bytes"
	"encoding/json"
	"fmt"
	"strconv"
	"strings"
	"text/template"
	"time"

	"backend/internal/notifications"
)

// WebhookPayloadFormat defines the format for webhook payloads.
type WebhookPayloadFormat string

const (
	PayloadFormatGeneric WebhookPayloadFormat = "generic"
	PayloadFormatSlack   WebhookPayloadFormat = "slack"
	PayloadFormatDiscord WebhookPayloadFormat = "discord"
	PayloadFormatTeams   WebhookPayloadFormat = "teams"
	PayloadFormatCustom  WebhookPayloadFormat = "custom"
)

// BuildWebhookPayload builds the webhook payload based on the specified format.
func BuildWebhookPayload(notification notifications.Notification, format WebhookPayloadFormat, customTemplate string) ([]byte, error) {
	switch format {
	case PayloadFormatGeneric:
		return buildGenericPayload(notification)
	case PayloadFormatSlack:
		return buildSlackPayload(notification)
	case PayloadFormatDiscord:
		return buildDiscordPayload(notification)
	case PayloadFormatTeams:
		return buildTeamsPayload(notification)
	case PayloadFormatCustom:
		return buildCustomPayload(notification, customTemplate)
	default:
		return buildGenericPayload(notification)
	}
}

func buildGenericPayload(notification notifications.Notification) ([]byte, error) {
	payload := map[string]interface{}{
		"title":     notification.Title,
		"message":   notification.Message,
		"severity":  notification.Severity,
		"data":      notification.Data,
		"timestamp": time.Now().UTC().Format(time.RFC3339),
	}
	if notification.DeviceID != nil {
		payload["device_id"] = *notification.DeviceID
	}
	return json.Marshal(payload)
}

func buildSlackPayload(notification notifications.Notification) ([]byte, error) {
	attachment := map[string]interface{}{
		"color":       severityToColor(notification.Severity),
		"title":       notification.Title,
		"text":        notification.Message,
		"footer":      "NasNetConnect",
		"footer_icon": "https://nasnetconnect.com/favicon.ico",
		"ts":          time.Now().Unix(),
	}
	if fields := buildSlackFields(notification); len(fields) > 0 {
		attachment["fields"] = fields
	}
	payload := map[string]interface{}{
		"text":        fmt.Sprintf("%s %s", severityToEmoji(notification.Severity), notification.Title),
		"attachments": []map[string]interface{}{attachment},
	}
	return json.Marshal(payload)
}

func buildDiscordPayload(notification notifications.Notification) ([]byte, error) {
	embed := map[string]interface{}{
		"title":       notification.Title,
		"description": notification.Message,
		"color":       hexToInt(severityToColor(notification.Severity)),
		"timestamp":   time.Now().UTC().Format(time.RFC3339),
		"footer":      map[string]interface{}{"text": "NasNetConnect"},
	}
	if fields := buildDiscordFields(notification); len(fields) > 0 {
		embed["fields"] = fields
	}
	payload := map[string]interface{}{
		"content": fmt.Sprintf("%s **%s**", severityToEmoji(notification.Severity), strings.ToUpper(notification.Severity)),
		"embeds":  []map[string]interface{}{embed},
	}
	return json.Marshal(payload)
}

func buildTeamsPayload(notification notifications.Notification) ([]byte, error) {
	card := map[string]interface{}{
		"@type":      "MessageCard",
		"@context":   "https://schema.org/extensions",
		"summary":    notification.Title,
		"themeColor": strings.TrimPrefix(severityToColor(notification.Severity), "#"),
		"title":      fmt.Sprintf("%s %s", severityToEmoji(notification.Severity), notification.Title),
		"text":       notification.Message,
	}
	if facts := buildTeamsFacts(notification); len(facts) > 0 {
		card["sections"] = []map[string]interface{}{{"facts": facts}}
	}
	return json.Marshal(card)
}

func buildCustomPayload(notification notifications.Notification, templateStr string) ([]byte, error) {
	if templateStr == "" {
		return nil, fmt.Errorf("custom template is required")
	}
	tmpl, err := template.New("webhook").Funcs(template.FuncMap{
		"upper":   strings.ToUpper,
		"lower":   strings.ToLower,
		"title":   strings.Title,
		"trim":    strings.TrimSpace,
		"join":    strings.Join,
		"replace": strings.ReplaceAll,
		"now":     time.Now,
	}).Parse(templateStr)
	if err != nil {
		return nil, fmt.Errorf("failed to parse custom template: %w", err)
	}
	data := map[string]interface{}{
		"Title":     notification.Title,
		"Message":   notification.Message,
		"Severity":  notification.Severity,
		"Data":      notification.Data,
		"Timestamp": time.Now().UTC().Format(time.RFC3339),
	}
	if notification.DeviceID != nil {
		data["DeviceID"] = *notification.DeviceID
	}
	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, data); err != nil {
		return nil, fmt.Errorf("failed to execute custom template: %w", err)
	}
	return buf.Bytes(), nil
}

func severityToColor(severity string) string {
	switch strings.ToUpper(severity) {
	case "CRITICAL":
		return "#ef4444"
	case "WARNING":
		return "#f59e0b"
	case "INFO":
		return "#3b82f6"
	default:
		return "#6b7280"
	}
}

func severityToEmoji(severity string) string {
	switch strings.ToUpper(severity) {
	case "CRITICAL":
		return "\xf0\x9f\x94\xb4"
	case "WARNING":
		return "\xf0\x9f\x9f\xa1"
	case "INFO":
		return "\xf0\x9f\x94\xb5"
	default:
		return "\xe2\x9a\xaa"
	}
}

func hexToInt(hexColor string) int {
	hexColor = strings.TrimPrefix(hexColor, "#")
	num, err := strconv.ParseInt(hexColor, 16, 64)
	if err != nil {
		return 0
	}
	return int(num)
}

func buildSlackFields(notification notifications.Notification) []map[string]interface{} {
	fields := []map[string]interface{}{}
	if notification.DeviceID != nil && *notification.DeviceID != "" {
		fields = append(fields, map[string]interface{}{"title": "Device", "value": *notification.DeviceID, "short": true})
	}
	fields = append(fields, map[string]interface{}{"title": "Severity", "value": notification.Severity, "short": true})
	count := 0
	for key, value := range notification.Data {
		if count >= 5 {
			break
		}
		if strings.HasPrefix(key, "_") || key == "ruleId" {
			continue
		}
		fields = append(fields, map[string]interface{}{"title": key, "value": fmt.Sprintf("%v", value), "short": true})
		count++
	}
	return fields
}

func buildDiscordFields(notification notifications.Notification) []map[string]interface{} {
	fields := []map[string]interface{}{}
	if notification.DeviceID != nil && *notification.DeviceID != "" {
		fields = append(fields, map[string]interface{}{"name": "Device", "value": *notification.DeviceID, "inline": true})
	}
	fields = append(fields, map[string]interface{}{"name": "Severity", "value": notification.Severity, "inline": true})
	count := 0
	for key, value := range notification.Data {
		if count >= 5 {
			break
		}
		if strings.HasPrefix(key, "_") || key == "ruleId" {
			continue
		}
		fields = append(fields, map[string]interface{}{"name": key, "value": fmt.Sprintf("%v", value), "inline": true})
		count++
	}
	return fields
}

func buildTeamsFacts(notification notifications.Notification) []map[string]interface{} {
	facts := []map[string]interface{}{}
	if notification.DeviceID != nil && *notification.DeviceID != "" {
		facts = append(facts, map[string]interface{}{"name": "Device:", "value": *notification.DeviceID})
	}
	facts = append(facts, map[string]interface{}{"name": "Severity:", "value": notification.Severity})
	count := 0
	for key, value := range notification.Data {
		if count >= 5 {
			break
		}
		if strings.HasPrefix(key, "_") || key == "ruleId" {
			continue
		}
		facts = append(facts, map[string]interface{}{"name": fmt.Sprintf("%s:", key), "value": fmt.Sprintf("%v", value)})
		count++
	}
	return facts
}

// buildSlackDigestPayload builds a Slack-specific payload with blocks format.
func (w *WebhookChannel) buildSlackDigestPayload(payload DigestPayload) map[string]interface{} {
	blocks := []map[string]interface{}{
		{"type": "header", "text": map[string]interface{}{"type": "plain_text", "text": "\xf0\x9f\x94\x94 Alert Digest"}},
		{"type": "context", "elements": []map[string]interface{}{{"type": "mrkdwn", "text": fmt.Sprintf("*Summary for the %s*", payload.Period)}}},
		{"type": "divider"},
		{"type": "section", "text": map[string]interface{}{"type": "mrkdwn", "text": fmt.Sprintf("*Total Alerts:* %d", payload.TotalCount)}},
	}

	for _, group := range payload.Groups {
		var emoji string
		switch group.Severity {
		case "CRITICAL":
			emoji = "\xf0\x9f\x94\xb4"
		case "WARNING":
			emoji = "\xf0\x9f\x9f\xa1"
		case "INFO":
			emoji = "\xf0\x9f\x94\xb5"
		default:
			emoji = "\xe2\x9a\xaa"
		}

		blocks = append(blocks, map[string]interface{}{
			"type": "section",
			"text": map[string]interface{}{"type": "mrkdwn", "text": fmt.Sprintf("*%s %s Alerts (%d)*", emoji, group.Severity, group.Count)},
		})

		maxAlerts := 5
		if len(group.Alerts) < maxAlerts {
			maxAlerts = len(group.Alerts)
		}
		for i := 0; i < maxAlerts; i++ {
			alert := group.Alerts[i]
			timeStr := alert.Time.Format("15:04:05")
			bypassIndicator := ""
			if alert.BypassSent {
				bypassIndicator = " \xe2\x9a\xa1"
			}
			blocks = append(blocks, map[string]interface{}{
				"type":     "context",
				"elements": []map[string]interface{}{{"type": "mrkdwn", "text": fmt.Sprintf("`%s` %s%s", timeStr, alert.Title, bypassIndicator)}},
			})
		}
		if len(group.Alerts) > maxAlerts {
			blocks = append(blocks, map[string]interface{}{
				"type":     "context",
				"elements": []map[string]interface{}{{"type": "mrkdwn", "text": fmt.Sprintf("_... and %d more_", len(group.Alerts)-maxAlerts)}},
			})
		}
		blocks = append(blocks, map[string]interface{}{"type": "divider"})
	}

	return map[string]interface{}{
		"blocks": blocks,
		"text":   fmt.Sprintf("Alert Digest: %d alerts from the %s", payload.TotalCount, payload.Period),
	}
}
