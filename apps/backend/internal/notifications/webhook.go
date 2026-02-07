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

// validateURL validates the webhook URL and prevents SSRF attacks.
// Per security requirements: Block internal IPs (10.x, 172.16.x, 192.168.x, 127.x, localhost).
func (w *WebhookChannel) validateURL(urlStr string) error {
	parsedURL, err := url.Parse(urlStr)
	if err != nil {
		return fmt.Errorf("invalid URL format: %w", err)
	}

	// Must be HTTP or HTTPS
	if parsedURL.Scheme != "http" && parsedURL.Scheme != "https" {
		return fmt.Errorf("only HTTP/HTTPS protocols are allowed")
	}

	// Get hostname
	hostname := parsedURL.Hostname()
	if hostname == "" {
		return fmt.Errorf("URL must have a hostname")
	}

	// Block localhost variants
	if hostname == "localhost" || hostname == "127.0.0.1" || hostname == "::1" {
		return fmt.Errorf("localhost URLs are not allowed")
	}

	// Block private IP ranges (simplified check)
	if strings.HasPrefix(hostname, "10.") ||
		strings.HasPrefix(hostname, "192.168.") ||
		strings.HasPrefix(hostname, "172.16.") ||
		strings.HasPrefix(hostname, "172.17.") ||
		strings.HasPrefix(hostname, "172.18.") ||
		strings.HasPrefix(hostname, "172.19.") ||
		strings.HasPrefix(hostname, "172.2") || // 172.20-29
		strings.HasPrefix(hostname, "172.30.") ||
		strings.HasPrefix(hostname, "172.31.") {
		return fmt.Errorf("private IP addresses are not allowed")
	}

	return nil
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
