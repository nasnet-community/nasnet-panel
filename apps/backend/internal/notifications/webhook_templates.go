package notifications

import (
	"bytes"
	"encoding/json"
	"fmt"
	"strconv"
	"strings"
	"text/template"
	"time"
)

// WebhookPayloadFormat defines the format for webhook payloads.
type WebhookPayloadFormat string

const (
	// PayloadFormatGeneric is a flat JSON format with title, message, severity, data.
	PayloadFormatGeneric WebhookPayloadFormat = "generic"

	// PayloadFormatSlack is Slack incoming webhook format with attachments.
	PayloadFormatSlack WebhookPayloadFormat = "slack"

	// PayloadFormatDiscord is Discord embed format.
	PayloadFormatDiscord WebhookPayloadFormat = "discord"

	// PayloadFormatTeams is Microsoft Teams MessageCard format.
	PayloadFormatTeams WebhookPayloadFormat = "teams"

	// PayloadFormatCustom allows custom Go template rendering.
	PayloadFormatCustom WebhookPayloadFormat = "custom"
)

// BuildWebhookPayload builds the webhook payload based on the specified format.
// Exported for use by webhook service.
func BuildWebhookPayload(notification Notification, format WebhookPayloadFormat, customTemplate string) ([]byte, error) {
	return buildWebhookPayload(notification, format, customTemplate)
}

// buildWebhookPayload builds the webhook payload based on the specified format.
func buildWebhookPayload(notification Notification, format WebhookPayloadFormat, customTemplate string) ([]byte, error) {
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

// buildGenericPayload builds a flat JSON payload.
// Format: { "title": "...", "message": "...", "severity": "...", "data": {...}, "device_id": "..." }
func buildGenericPayload(notification Notification) ([]byte, error) {
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

// buildSlackPayload builds a Slack incoming webhook format with attachments.
// Reference: https://api.slack.com/messaging/webhooks
func buildSlackPayload(notification Notification) ([]byte, error) {
	attachment := map[string]interface{}{
		"color":       severityToColor(notification.Severity),
		"title":       notification.Title,
		"text":        notification.Message,
		"footer":      "NasNetConnect",
		"footer_icon": "https://nasnetconnect.com/favicon.ico",
		"ts":          time.Now().Unix(),
	}

	// Add fields from notification data
	if fields := buildSlackFields(notification); len(fields) > 0 {
		attachment["fields"] = fields
	}

	payload := map[string]interface{}{
		"text":        fmt.Sprintf("%s %s", severityToEmoji(notification.Severity), notification.Title),
		"attachments": []map[string]interface{}{attachment},
	}

	return json.Marshal(payload)
}

// buildDiscordPayload builds a Discord embed format.
// Reference: https://discord.com/developers/docs/resources/webhook#execute-webhook
func buildDiscordPayload(notification Notification) ([]byte, error) {
	embed := map[string]interface{}{
		"title":       notification.Title,
		"description": notification.Message,
		"color":       hexToInt(severityToColor(notification.Severity)),
		"timestamp":   time.Now().UTC().Format(time.RFC3339),
		"footer": map[string]interface{}{
			"text": "NasNetConnect",
		},
	}

	// Add fields from notification data
	if fields := buildDiscordFields(notification); len(fields) > 0 {
		embed["fields"] = fields
	}

	payload := map[string]interface{}{
		"content": fmt.Sprintf("%s **%s**", severityToEmoji(notification.Severity), strings.ToUpper(notification.Severity)),
		"embeds":  []map[string]interface{}{embed},
	}

	return json.Marshal(payload)
}

// buildTeamsPayload builds a Microsoft Teams MessageCard format.
// Reference: https://docs.microsoft.com/en-us/outlook/actionable-messages/message-card-reference
func buildTeamsPayload(notification Notification) ([]byte, error) {
	card := map[string]interface{}{
		"@type":      "MessageCard",
		"@context":   "https://schema.org/extensions",
		"summary":    notification.Title,
		"themeColor": strings.TrimPrefix(severityToColor(notification.Severity), "#"),
		"title":      fmt.Sprintf("%s %s", severityToEmoji(notification.Severity), notification.Title),
		"text":       notification.Message,
	}

	// Add sections with facts from notification data
	if facts := buildTeamsFacts(notification); len(facts) > 0 {
		card["sections"] = []map[string]interface{}{
			{
				"facts": facts,
			},
		}
	}

	return json.Marshal(card)
}

// buildCustomPayload renders a custom Go template with notification data.
// The template has access to: .Title, .Message, .Severity, .Data, .DeviceID, .Timestamp
func buildCustomPayload(notification Notification, templateStr string) ([]byte, error) {
	if templateStr == "" {
		return nil, fmt.Errorf("custom template is required")
	}

	// Create template with restricted mode (no shell execution, file access, etc.)
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

	// Prepare template data
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

	// Render template
	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, data); err != nil {
		return nil, fmt.Errorf("failed to execute custom template: %w", err)
	}

	return buf.Bytes(), nil
}

// severityToColor maps alert severity to color hex codes.
// Critical = Red (#ef4444), Warning = Amber (#f59e0b), Info = Blue (#3b82f6)
func severityToColor(severity string) string {
	switch strings.ToUpper(severity) {
	case "CRITICAL":
		return "#ef4444" // Red (from design tokens)
	case "WARNING":
		return "#f59e0b" // Amber (from design tokens)
	case "INFO":
		return "#3b82f6" // Blue (from design tokens)
	default:
		return "#6b7280" // Gray for unknown severity
	}
}

// severityToEmoji maps alert severity to emoji.
func severityToEmoji(severity string) string {
	switch strings.ToUpper(severity) {
	case "CRITICAL":
		return "🔴"
	case "WARNING":
		return "🟡"
	case "INFO":
		return "🔵"
	default:
		return "⚪"
	}
}

// hexToInt converts a hex color string (#rrggbb) to a decimal integer for Discord.
func hexToInt(hexColor string) int {
	// Remove # prefix
	hexColor = strings.TrimPrefix(hexColor, "#")

	// Parse hex string to int64
	num, err := strconv.ParseInt(hexColor, 16, 64)
	if err != nil {
		return 0 // Default to black on error
	}

	return int(num)
}

// buildSlackFields builds Slack attachment fields from notification data.
func buildSlackFields(notification Notification) []map[string]interface{} {
	fields := []map[string]interface{}{}

	// Add device ID if present
	if notification.DeviceID != nil && *notification.DeviceID != "" {
		fields = append(fields, map[string]interface{}{
			"title": "Device",
			"value": *notification.DeviceID,
			"short": true,
		})
	}

	// Add severity
	fields = append(fields, map[string]interface{}{
		"title": "Severity",
		"value": notification.Severity,
		"short": true,
	})

	// Add custom data fields (limit to 5 additional fields)
	count := 0
	for key, value := range notification.Data {
		if count >= 5 {
			break
		}

		// Skip internal fields
		if strings.HasPrefix(key, "_") || key == "ruleId" {
			continue
		}

		fields = append(fields, map[string]interface{}{
			"title": key,
			"value": fmt.Sprintf("%v", value),
			"short": true,
		})
		count++
	}

	return fields
}

// buildDiscordFields builds Discord embed fields from notification data.
func buildDiscordFields(notification Notification) []map[string]interface{} {
	fields := []map[string]interface{}{}

	// Add device ID if present
	if notification.DeviceID != nil && *notification.DeviceID != "" {
		fields = append(fields, map[string]interface{}{
			"name":   "Device",
			"value":  *notification.DeviceID,
			"inline": true,
		})
	}

	// Add severity
	fields = append(fields, map[string]interface{}{
		"name":   "Severity",
		"value":  notification.Severity,
		"inline": true,
	})

	// Add custom data fields (limit to 5 additional fields)
	count := 0
	for key, value := range notification.Data {
		if count >= 5 {
			break
		}

		// Skip internal fields
		if strings.HasPrefix(key, "_") || key == "ruleId" {
			continue
		}

		fields = append(fields, map[string]interface{}{
			"name":   key,
			"value":  fmt.Sprintf("%v", value),
			"inline": true,
		})
		count++
	}

	return fields
}

// buildTeamsFacts builds Microsoft Teams facts from notification data.
func buildTeamsFacts(notification Notification) []map[string]interface{} {
	facts := []map[string]interface{}{}

	// Add device ID if present
	if notification.DeviceID != nil && *notification.DeviceID != "" {
		facts = append(facts, map[string]interface{}{
			"name":  "Device:",
			"value": *notification.DeviceID,
		})
	}

	// Add severity
	facts = append(facts, map[string]interface{}{
		"name":  "Severity:",
		"value": notification.Severity,
	})

	// Add custom data fields (limit to 5 additional fields)
	count := 0
	for key, value := range notification.Data {
		if count >= 5 {
			break
		}

		// Skip internal fields
		if strings.HasPrefix(key, "_") || key == "ruleId" {
			continue
		}

		facts = append(facts, map[string]interface{}{
			"name":  fmt.Sprintf("%s:", key),
			"value": fmt.Sprintf("%v", value),
		})
		count++
	}

	return facts
}
