// Package notifications implements Pushover mobile push notification delivery.
package notifications

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

// PushoverChannel delivers notifications via Pushover API.
// Per Task 3.4: Implement PushoverChannel for mobile push notifications.
type PushoverChannel struct {
	config PushoverConfig
	client *http.Client
}

// PushoverConfig holds Pushover API configuration.
type PushoverConfig struct {
	UserKey  string `json:"user_key"`  // User/Group key
	AppToken string `json:"app_token"` // Application API token
}

// NewPushoverChannel creates a new Pushover notification channel.
func NewPushoverChannel(config PushoverConfig) *PushoverChannel {
	return &PushoverChannel{
		config: config,
		client: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

// Name returns the channel identifier.
func (p *PushoverChannel) Name() string {
	return "pushover"
}

// Send delivers a notification via Pushover.
func (p *PushoverChannel) Send(ctx context.Context, notification Notification) error {
	// Map severity to Pushover priority
	priority := p.getPriority(notification.Severity)

	// Build request payload
	payload := map[string]interface{}{
		"token":    p.config.AppToken,
		"user":     p.config.UserKey,
		"title":    notification.Title,
		"message":  notification.Message,
		"priority": priority,
	}

	// Add device info if available
	if notification.DeviceID != nil && *notification.DeviceID != "" {
		payload["device"] = *notification.DeviceID
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal payload: %w", err)
	}

	// Create HTTP request
	req, err := http.NewRequestWithContext(ctx, "POST", "https://api.pushover.net/1/messages.json", bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")

	// Send request
	resp, err := p.client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send notification: %w", err)
	}
	defer resp.Body.Close()

	// Check response
	if resp.StatusCode != http.StatusOK {
		var errorResp map[string]interface{}
		if err := json.NewDecoder(resp.Body).Decode(&errorResp); err == nil {
			if errors, ok := errorResp["errors"].([]interface{}); ok && len(errors) > 0 {
				return fmt.Errorf("Pushover API error: %v", errors[0])
			}
		}
		return fmt.Errorf("Pushover API returned status %d", resp.StatusCode)
	}

	return nil
}

// getPriority maps alert severity to Pushover priority levels.
// -2 = no notification, -1 = quiet, 0 = normal, 1 = high, 2 = emergency (requires confirmation)
func (p *PushoverChannel) getPriority(severity string) int {
	switch severity {
	case "CRITICAL":
		return 2 // Emergency - requires acknowledgment
	case "WARNING":
		return 1 // High priority
	case "INFO":
		return 0 // Normal
	default:
		return 0
	}
}

// Test verifies the Pushover configuration by sending a test notification.
func (p *PushoverChannel) Test(ctx context.Context, config map[string]interface{}) error {
	// Parse config
	pushoverConfig, err := parsePushoverConfig(config)
	if err != nil {
		return fmt.Errorf("invalid Pushover configuration: %w", err)
	}

	// Temporarily use test config
	originalConfig := p.config
	p.config = pushoverConfig
	defer func() { p.config = originalConfig }()

	// Send test notification
	testNotification := Notification{
		Title:    "NasNetConnect Test",
		Message:  "Pushover notifications are configured correctly!",
		Severity: "INFO",
	}

	return p.Send(ctx, testNotification)
}

// parsePushoverConfig converts a map to PushoverConfig.
func parsePushoverConfig(config map[string]interface{}) (PushoverConfig, error) {
	cfg := PushoverConfig{}

	userKey, ok := config["user_key"].(string)
	if !ok || userKey == "" {
		return cfg, fmt.Errorf("user_key is required")
	}
	cfg.UserKey = userKey

	appToken, ok := config["app_token"].(string)
	if !ok || appToken == "" {
		return cfg, fmt.Errorf("app_token is required")
	}
	cfg.AppToken = appToken

	return cfg, nil
}
