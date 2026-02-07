// Package notifications implements Telegram Bot notification delivery.
package notifications

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

// TelegramChannel delivers notifications via Telegram Bot API.
// Per Task 3.3: Implement TelegramChannel with Bot API integration.
type TelegramChannel struct {
	config TelegramConfig
	client *http.Client
}

// TelegramConfig holds Telegram Bot configuration.
type TelegramConfig struct {
	BotToken string `json:"bot_token"` // Bot API token from @BotFather
	ChatID   string `json:"chat_id"`   // Target chat/channel ID
}

// NewTelegramChannel creates a new Telegram notification channel.
func NewTelegramChannel(config TelegramConfig) *TelegramChannel {
	return &TelegramChannel{
		config: config,
		client: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

// Name returns the channel identifier.
func (t *TelegramChannel) Name() string {
	return "telegram"
}

// Send delivers a notification via Telegram.
func (t *TelegramChannel) Send(ctx context.Context, notification Notification) error {
	// Build message text with Markdown formatting
	message := t.formatMessage(notification)

	// Send via Telegram Bot API
	return t.sendMessage(ctx, message)
}

// formatMessage formats a notification for Telegram with Markdown.
func (t *TelegramChannel) formatMessage(notification Notification) string {
	// Use severity emoji
	emoji := t.getSeverityEmoji(notification.Severity)

	// Format message with Markdown
	message := fmt.Sprintf("%s *%s*\n\n%s", emoji, notification.Title, notification.Message)

	// Add device info if available
	if notification.DeviceID != nil && *notification.DeviceID != "" {
		message += fmt.Sprintf("\n\n_Device: %s_", *notification.DeviceID)
	}

	return message
}

// getSeverityEmoji returns an appropriate emoji for the severity level.
func (t *TelegramChannel) getSeverityEmoji(severity string) string {
	switch severity {
	case "CRITICAL":
		return "\U0001F6A8" // 🚨 Police car light
	case "WARNING":
		return "\u26A0\uFE0F" // ⚠️ Warning sign
	case "INFO":
		return "\u2139\uFE0F" // ℹ️ Information
	default:
		return "\U0001F514" // 🔔 Bell
	}
}

// sendMessage sends a message via Telegram Bot API.
func (t *TelegramChannel) sendMessage(ctx context.Context, text string) error {
	url := fmt.Sprintf("https://api.telegram.org/bot%s/sendMessage", t.config.BotToken)

	// Build request payload
	payload := map[string]interface{}{
		"chat_id":    t.config.ChatID,
		"text":       text,
		"parse_mode": "Markdown",
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal payload: %w", err)
	}

	// Create HTTP request
	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")

	// Send request
	resp, err := t.client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send message: %w", err)
	}
	defer resp.Body.Close()

	// Check response
	if resp.StatusCode != http.StatusOK {
		var errorResp map[string]interface{}
		if err := json.NewDecoder(resp.Body).Decode(&errorResp); err == nil {
			if description, ok := errorResp["description"].(string); ok {
				return fmt.Errorf("Telegram API error: %s", description)
			}
		}
		return fmt.Errorf("Telegram API returned status %d", resp.StatusCode)
	}

	return nil
}

// Test verifies the Telegram configuration by sending a test message.
func (t *TelegramChannel) Test(ctx context.Context, config map[string]interface{}) error {
	// Parse config
	telegramConfig, err := parseTelegramConfig(config)
	if err != nil {
		return fmt.Errorf("invalid Telegram configuration: %w", err)
	}

	// Temporarily use test config
	originalConfig := t.config
	t.config = telegramConfig
	defer func() { t.config = originalConfig }()

	// Send test notification
	testNotification := Notification{
		Title:    "NasNetConnect Test",
		Message:  "✅ Telegram notifications are configured correctly!",
		Severity: "INFO",
	}

	return t.Send(ctx, testNotification)
}

// parseTelegramConfig converts a map to TelegramConfig.
func parseTelegramConfig(config map[string]interface{}) (TelegramConfig, error) {
	cfg := TelegramConfig{}

	botToken, ok := config["bot_token"].(string)
	if !ok || botToken == "" {
		return cfg, fmt.Errorf("bot_token is required")
	}
	cfg.BotToken = botToken

	chatID, ok := config["chat_id"].(string)
	if !ok || chatID == "" {
		return cfg, fmt.Errorf("chat_id is required")
	}
	cfg.ChatID = chatID

	return cfg, nil
}
