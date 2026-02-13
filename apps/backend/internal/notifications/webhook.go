// Package notifications implements webhook notification delivery.
package notifications

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net"
	"net/http"
	"net/url"
	"strings"
	"time"
)

// WebhookChannel delivers notifications via HTTP webhooks.
// Per Task 3.5: Implement WebhookChannel with custom HTTP POST delivery.
type WebhookChannel struct {
	config WebhookConfig
	client *http.Client
}

// WebhookConfig holds webhook configuration.
type WebhookConfig struct {
	URL     string            `json:"url"`     // Target webhook URL
	Method  string            `json:"method"`  // HTTP method (POST, PUT)
	Headers map[string]string `json:"headers"` // Custom headers
	Secret  string            `json:"secret"`  // Optional secret for HMAC signing
}

// NewWebhookChannel creates a new webhook notification channel.
func NewWebhookChannel(config WebhookConfig) *WebhookChannel {
	if config.Method == "" {
		config.Method = "POST"
	}

	return &WebhookChannel{
		config: config,
		client: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

// Name returns the channel identifier.
func (w *WebhookChannel) Name() string {
	return "webhook"
}

// Send delivers a notification via webhook.
func (w *WebhookChannel) Send(ctx context.Context, notification Notification) error {
	// Validate URL to prevent SSRF
	if err := w.validateURL(w.config.URL); err != nil {
		return fmt.Errorf("invalid webhook URL: %w", err)
	}

	// Build payload
	payload := map[string]interface{}{
		"title":    notification.Title,
		"message":  notification.Message,
		"severity": notification.Severity,
		"data":     notification.Data,
	}

	if notification.DeviceID != nil {
		payload["device_id"] = *notification.DeviceID
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal payload: %w", err)
	}

	// Create HTTP request
	req, err := http.NewRequestWithContext(ctx, w.config.Method, w.config.URL, bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", "NasNetConnect-Webhook/1.0")

	// Add custom headers
	for key, value := range w.config.Headers {
		req.Header.Set(key, value)
	}

	// Add HMAC signature if secret is configured
	if w.config.Secret != "" {
		signature := w.generateHMACSignature(jsonData)
		req.Header.Set("X-NasNet-Signature", signature)
	}

	// Send request
	resp, err := w.client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send webhook: %w", err)
	}
	defer resp.Body.Close()

	// Check response (2xx is success)
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("webhook returned non-2xx status: %d", resp.StatusCode)
	}

	return nil
}

// ValidateWebhookURL validates a webhook URL and prevents SSRF attacks.
// Per NAS-18.4 Task 4: Enhanced DNS rebinding defense with DNS resolution checking.
// Blocks all resolved IPs in private ranges and enforces HTTPS-only.
// Exported for use by webhook service.
func ValidateWebhookURL(urlStr string) error {
	return validateURL(urlStr)
}

// validateURL validates the webhook URL and prevents SSRF attacks.
// Per NAS-18.4 Task 4: Enhanced DNS rebinding defense with DNS resolution checking.
// Blocks all resolved IPs in private ranges and enforces HTTPS-only.
func (w *WebhookChannel) validateURL(urlStr string) error {
	return validateURL(urlStr)
}

// validateURL is the internal implementation of webhook URL validation.
func validateURL(urlStr string) error {
	parsedURL, err := url.Parse(urlStr)
	if err != nil {
		return fmt.Errorf("invalid URL format: %w", err)
	}

	// Only allow HTTPS (reject HTTP for security)
	if parsedURL.Scheme != "https" {
		return fmt.Errorf("only HTTPS protocol is allowed")
	}

	// Get hostname
	hostname := parsedURL.Hostname()
	if hostname == "" {
		return fmt.Errorf("URL must have a hostname")
	}

	// Block localhost variants (basic check)
	if hostname == "localhost" || hostname == "127.0.0.1" || hostname == "::1" {
		return fmt.Errorf("localhost URLs are not allowed")
	}

	// DNS resolution check to prevent DNS rebinding attacks
	// Resolve hostname to all IPs
	ips, err := net.LookupHost(hostname)
	if err != nil {
		return fmt.Errorf("failed to resolve hostname: %w", err)
	}

	if len(ips) == 0 {
		return fmt.Errorf("hostname does not resolve to any IP addresses")
	}

	// Check all resolved IPs against private ranges
	for _, ipStr := range ips {
		ip := net.ParseIP(ipStr)
		if ip == nil {
			return fmt.Errorf("invalid IP address resolved: %s", ipStr)
		}

		if isPrivateIP(ip) {
			return fmt.Errorf("resolved IP %s is in a private/internal range", ipStr)
		}
	}

	return nil
}

// isPrivateIP checks if an IP address falls within private/internal ranges.
// Blocked ranges: 127.0.0.0/8, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16,
// 169.254.0.0/16 (link-local), ::1/128 (IPv6 loopback), fe80::/10 (IPv6 link-local).
func isPrivateIP(ip net.IP) bool {
	// Define private CIDR ranges
	privateCIDRs := []string{
		"127.0.0.0/8",    // IPv4 loopback
		"10.0.0.0/8",     // IPv4 private
		"172.16.0.0/12",  // IPv4 private
		"192.168.0.0/16", // IPv4 private
		"169.254.0.0/16", // IPv4 link-local
		"::1/128",        // IPv6 loopback
		"fe80::/10",      // IPv6 link-local
	}

	for _, cidr := range privateCIDRs {
		_, ipNet, err := net.ParseCIDR(cidr)
		if err != nil {
			// Should never happen with hardcoded valid CIDRs
			continue
		}

		if ipNet.Contains(ip) {
			return true
		}
	}

	return false
}

// generateHMACSignature generates HMAC-SHA256 signature for the payload.
func (w *WebhookChannel) generateHMACSignature(payload []byte) string {
	h := hmac.New(sha256.New, []byte(w.config.Secret))
	h.Write(payload)
	return hex.EncodeToString(h.Sum(nil))
}

// Test verifies the webhook configuration by sending a test notification.
func (w *WebhookChannel) Test(ctx context.Context, config map[string]interface{}) error {
	// Parse config
	webhookConfig, err := parseWebhookConfig(config)
	if err != nil {
		return fmt.Errorf("invalid webhook configuration: %w", err)
	}

	// Temporarily use test config
	originalConfig := w.config
	w.config = webhookConfig
	defer func() { w.config = originalConfig }()

	// Send test notification
	testNotification := Notification{
		Title:    "NasNetConnect Test",
		Message:  "Webhook notifications are configured correctly!",
		Severity: "INFO",
		Data: map[string]interface{}{
			"test": true,
		},
	}

	return w.Send(ctx, testNotification)
}

// DigestPayload represents the payload structure for digest webhooks.
type DigestPayload struct {
	Period     string          `json:"period"`     // e.g., "past 24 hours"
	TotalCount int             `json:"alertCount"` // Total number of alerts
	Groups     []SeverityGroup `json:"groupedBySeverity"`
}

// SeverityGroup groups alerts by severity level.
type SeverityGroup struct {
	Severity string         `json:"severity"` // CRITICAL, WARNING, INFO
	Count    int            `json:"count"`
	Alerts   []AlertSummary `json:"alerts"`
}

// AlertSummary contains summary information for a digest alert.
type AlertSummary struct {
	Title      string    `json:"title"`
	Time       time.Time `json:"time"`
	EventType  string    `json:"eventType"`
	BypassSent bool      `json:"bypassSent"` // Indicates if alert was sent immediately
}

// SendDigest delivers a digest notification via webhook.
// Special handling for Slack webhooks (hooks.slack.com) with blocks/attachments format.
func (w *WebhookChannel) SendDigest(ctx context.Context, payload DigestPayload) error {
	// Validate URL to prevent SSRF
	if err := w.validateURL(w.config.URL); err != nil {
		return fmt.Errorf("invalid webhook URL: %w", err)
	}

	// Check if this is a Slack webhook
	isSlack := strings.Contains(w.config.URL, "hooks.slack.com")

	var jsonData []byte
	var err error

	if isSlack {
		// Build Slack-specific payload with blocks
		slackPayload := w.buildSlackDigestPayload(payload)
		jsonData, err = json.Marshal(slackPayload)
	} else {
		// Build standard digest payload
		standardPayload := map[string]interface{}{
			"digest":            true,
			"period":            payload.Period,
			"alertCount":        payload.TotalCount,
			"groupedBySeverity": payload.Groups,
		}
		jsonData, err = json.Marshal(standardPayload)
	}

	if err != nil {
		return fmt.Errorf("failed to marshal digest payload: %w", err)
	}

	// Create HTTP request
	req, err := http.NewRequestWithContext(ctx, w.config.Method, w.config.URL, bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", "NasNetConnect-Webhook/1.0")

	// Add custom headers
	for key, value := range w.config.Headers {
		req.Header.Set(key, value)
	}

	// Add HMAC signature if secret is configured (not for Slack)
	if !isSlack && w.config.Secret != "" {
		signature := w.generateHMACSignature(jsonData)
		req.Header.Set("X-NasNet-Signature", signature)
	}

	// Send request
	resp, err := w.client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send digest webhook: %w", err)
	}
	defer resp.Body.Close()

	// Check response (2xx is success)
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("digest webhook returned non-2xx status: %d", resp.StatusCode)
	}

	return nil
}

// buildSlackDigestPayload builds a Slack-specific payload with blocks format.
func (w *WebhookChannel) buildSlackDigestPayload(payload DigestPayload) map[string]interface{} {
	blocks := []map[string]interface{}{
		// Header block
		{
			"type": "header",
			"text": map[string]interface{}{
				"type": "plain_text",
				"text": "🔔 Alert Digest",
			},
		},
		// Context block with period
		{
			"type": "context",
			"elements": []map[string]interface{}{
				{
					"type": "mrkdwn",
					"text": fmt.Sprintf("*Summary for the %s*", payload.Period),
				},
			},
		},
		// Divider
		{
			"type": "divider",
		},
		// Total count
		{
			"type": "section",
			"text": map[string]interface{}{
				"type": "mrkdwn",
				"text": fmt.Sprintf("*Total Alerts:* %d", payload.TotalCount),
			},
		},
	}

	// Add severity groups
	for _, group := range payload.Groups {
		// Color emoji based on severity
		var emoji string
		switch group.Severity {
		case "CRITICAL":
			emoji = "🔴"
		case "WARNING":
			emoji = "🟡"
		case "INFO":
			emoji = "🔵"
		default:
			emoji = "⚪"
		}

		// Severity group header
		blocks = append(blocks, map[string]interface{}{
			"type": "section",
			"text": map[string]interface{}{
				"type": "mrkdwn",
				"text": fmt.Sprintf("*%s %s Alerts (%d)*", emoji, group.Severity, group.Count),
			},
		})

		// Add alerts (limit to first 5 per group to avoid message size limits)
		maxAlerts := 5
		if len(group.Alerts) < maxAlerts {
			maxAlerts = len(group.Alerts)
		}

		for i := 0; i < maxAlerts; i++ {
			alert := group.Alerts[i]
			timeStr := alert.Time.Format("15:04:05")
			bypassIndicator := ""
			if alert.BypassSent {
				bypassIndicator = " ⚡"
			}

			blocks = append(blocks, map[string]interface{}{
				"type": "context",
				"elements": []map[string]interface{}{
					{
						"type": "mrkdwn",
						"text": fmt.Sprintf("`%s` %s%s", timeStr, alert.Title, bypassIndicator),
					},
				},
			})
		}

		if len(group.Alerts) > maxAlerts {
			blocks = append(blocks, map[string]interface{}{
				"type": "context",
				"elements": []map[string]interface{}{
					{
						"type": "mrkdwn",
						"text": fmt.Sprintf("_... and %d more_", len(group.Alerts)-maxAlerts),
					},
				},
			})
		}

		// Add divider after each group
		blocks = append(blocks, map[string]interface{}{
			"type": "divider",
		})
	}

	return map[string]interface{}{
		"blocks": blocks,
		"text":   fmt.Sprintf("Alert Digest: %d alerts from the %s", payload.TotalCount, payload.Period),
	}
}

// parseWebhookConfig converts a map to WebhookConfig.
func parseWebhookConfig(config map[string]interface{}) (WebhookConfig, error) {
	cfg := WebhookConfig{
		Method: "POST",
	}

	urlStr, ok := config["url"].(string)
	if !ok || urlStr == "" {
		return cfg, fmt.Errorf("url is required")
	}
	cfg.URL = urlStr

	if method, ok := config["method"].(string); ok && method != "" {
		cfg.Method = method
	}

	if headers, ok := config["headers"].(map[string]interface{}); ok {
		cfg.Headers = make(map[string]string, len(headers))
		for key, value := range headers {
			if strValue, ok := value.(string); ok {
				cfg.Headers[key] = strValue
			}
		}
	}

	if secret, ok := config["secret"].(string); ok {
		cfg.Secret = secret
	}

	return cfg, nil
}
