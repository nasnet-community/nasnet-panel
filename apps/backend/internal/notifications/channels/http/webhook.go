package http

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net"
	nethttp "net/http"
	"net/url"
	"strings"
	"time"

	"backend/internal/notifications"
)

// WebhookChannel delivers notifications via HTTP webhooks.
type WebhookChannel struct {
	config WebhookConfig
	client *nethttp.Client
}

// WebhookConfig holds webhook configuration.
type WebhookConfig struct {
	URL     string            `json:"url"`
	Method  string            `json:"method"`
	Headers map[string]string `json:"headers"`
	Secret  string            `json:"secret"` //nolint:gosec // G101: credential field required for webhook HMAC signature
}

// NewWebhookChannel creates a new webhook notification channel.
func NewWebhookChannel(config WebhookConfig) *WebhookChannel {
	if config.Method == "" {
		config.Method = nethttp.MethodPost
	}
	return &WebhookChannel{
		config: config,
		client: &nethttp.Client{Timeout: 10 * time.Second},
	}
}

// Name returns the channel identifier.
func (w *WebhookChannel) Name() string { return "webhook" }

// Send delivers a notification via webhook.
func (w *WebhookChannel) Send(ctx context.Context, notification notifications.Notification) error {
	if err := ValidateWebhookURL(w.config.URL); err != nil { //nolint:contextcheck // validation does not require context
		return fmt.Errorf("invalid webhook URL: %w", err)
	}

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

	req, err := nethttp.NewRequestWithContext(ctx, w.config.Method, w.config.URL, bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", "NasNetConnect-Webhook/1.0")
	for key, value := range w.config.Headers {
		req.Header.Set(key, value)
	}
	if w.config.Secret != "" {
		signature := w.generateHMACSignature(jsonData)
		req.Header.Set("X-NasNet-Signature", signature)
	}

	resp, err := w.client.Do(req) //nolint:gosec // G704: URL is constructed from trusted configuration
	if err != nil {
		return fmt.Errorf("failed to send webhook: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("webhook returned non-2xx status: %d", resp.StatusCode)
	}
	return nil
}

func (w *WebhookChannel) generateHMACSignature(payload []byte) string {
	h := hmac.New(sha256.New, []byte(w.config.Secret))
	h.Write(payload)
	return hex.EncodeToString(h.Sum(nil))
}

// Test verifies the webhook configuration by sending a test notification.
func (w *WebhookChannel) Test(ctx context.Context, config map[string]interface{}) error {
	webhookConfig, err := ParseWebhookConfig(config)
	if err != nil {
		return fmt.Errorf("invalid webhook configuration: %w", err)
	}

	originalConfig := w.config
	w.config = webhookConfig
	defer func() { w.config = originalConfig }()

	testNotification := notifications.Notification{
		Title:    "NasNetConnect Test",
		Message:  "Webhook notifications are configured correctly!",
		Severity: "INFO",
		Data:     map[string]interface{}{"test": true},
	}
	return w.Send(ctx, testNotification)
}

// DigestPayload represents the payload structure for digest webhooks.
type DigestPayload struct {
	Period     string          `json:"period"`
	TotalCount int             `json:"alertCount"`
	Groups     []SeverityGroup `json:"groupedBySeverity"`
}

// SeverityGroup groups alerts by severity level.
type SeverityGroup struct {
	Severity string         `json:"severity"`
	Count    int            `json:"count"`
	Alerts   []AlertSummary `json:"alerts"`
}

// AlertSummary contains summary information for a digest alert.
type AlertSummary struct {
	Title      string    `json:"title"`
	Time       time.Time `json:"time"`
	EventType  string    `json:"eventType"`
	BypassSent bool      `json:"bypassSent"`
}

// SendDigest delivers a digest notification via webhook.
func (w *WebhookChannel) SendDigest(ctx context.Context, payload DigestPayload) error {
	if err := ValidateWebhookURL(w.config.URL); err != nil { //nolint:contextcheck // validation does not require context
		return fmt.Errorf("invalid webhook URL: %w", err)
	}

	isSlack := strings.Contains(w.config.URL, "hooks.slack.com")

	var jsonData []byte
	var err error

	if isSlack {
		slackPayload := w.buildSlackDigestPayload(payload)
		jsonData, err = json.Marshal(slackPayload)
	} else {
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

	req, err := nethttp.NewRequestWithContext(ctx, w.config.Method, w.config.URL, bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", "NasNetConnect-Webhook/1.0")
	for key, value := range w.config.Headers {
		req.Header.Set(key, value)
	}
	if !isSlack && w.config.Secret != "" {
		signature := w.generateHMACSignature(jsonData)
		req.Header.Set("X-NasNet-Signature", signature)
	}

	resp, err := w.client.Do(req) //nolint:gosec // G704: URL is constructed from trusted configuration
	if err != nil {
		return fmt.Errorf("failed to send digest webhook: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("digest webhook returned non-2xx status: %d", resp.StatusCode)
	}
	return nil
}

// ValidateWebhookURL validates a webhook URL and prevents SSRF attacks.
func ValidateWebhookURL(urlStr string) error {
	parsedURL, err := url.Parse(urlStr)
	if err != nil {
		return fmt.Errorf("invalid URL format: %w", err)
	}
	if parsedURL.Scheme != "https" {
		return fmt.Errorf("only HTTPS protocol is allowed")
	}
	hostname := parsedURL.Hostname()
	if hostname == "" {
		return fmt.Errorf("URL must have a hostname")
	}
	if hostname == "localhost" || hostname == "127.0.0.1" || hostname == "::1" {
		return fmt.Errorf("localhost URLs are not allowed")
	}
	resolver := &net.Resolver{}
	ips, err := resolver.LookupHost(context.Background(), hostname)
	if err != nil {
		return fmt.Errorf("failed to resolve hostname: %w", err)
	}
	if len(ips) == 0 {
		return fmt.Errorf("hostname does not resolve to any IP addresses")
	}
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

func isPrivateIP(ip net.IP) bool {
	privateCIDRs := []string{
		"127.0.0.0/8",
		"10.0.0.0/8",
		"172.16.0.0/12",
		"192.168.0.0/16",
		"169.254.0.0/16",
		"::1/128",
		"fe80::/10",
	}
	for _, cidr := range privateCIDRs {
		_, ipNet, err := net.ParseCIDR(cidr)
		if err != nil {
			continue
		}
		if ipNet.Contains(ip) {
			return true
		}
	}
	return false
}

// ParseWebhookConfig converts a map to WebhookConfig.
func ParseWebhookConfig(config map[string]interface{}) (WebhookConfig, error) {
	cfg := WebhookConfig{Method: nethttp.MethodPost}

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
