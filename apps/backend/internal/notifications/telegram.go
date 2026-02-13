// Package notifications implements Telegram Bot notification delivery.
package notifications

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"sync"
	"time"

	"golang.org/x/sync/errgroup"
)

// TelegramChannel delivers notifications via Telegram Bot API.
// Per Task 3.3: Implement TelegramChannel with Bot API integration.
// NAS-18.6: Enhanced with multi-chat support, MarkdownV2, inline keyboards, and rate limiting.
type TelegramChannel struct {
	config     TelegramConfig
	client     *http.Client
	apiBaseURL string // For testing: allows overriding API URL
}

// TelegramConfig holds Telegram Bot configuration.
type TelegramConfig struct {
	BotToken string   `json:"bot_token"` // Bot API token from @BotFather
	ChatID   string   `json:"chat_id"`   // DEPRECATED: Backward compat - use ChatIDs
	ChatIDs  []string `json:"chat_ids"`  // Target chat/channel IDs (supports multiple)
}

// InlineKeyboardMarkup represents a Telegram inline keyboard.
type InlineKeyboardMarkup struct {
	InlineKeyboard [][]InlineKeyboardButton `json:"inline_keyboard"`
}

// InlineKeyboardButton represents a button in an inline keyboard.
type InlineKeyboardButton struct {
	Text string `json:"text"`
	URL  string `json:"url,omitempty"`
}

// TelegramErrorResponse represents a Telegram API error response.
type TelegramErrorResponse struct {
	OK          bool   `json:"ok"`
	ErrorCode   int    `json:"error_code"`
	Description string `json:"description"`
	Parameters  struct {
		RetryAfter int `json:"retry_after"`
	} `json:"parameters"`
}

// MarkdownV2 special characters that need escaping.
// Per Telegram Bot API docs: _ * [ ] ( ) ~ ` > # + - = | { } . ! \
var markdownV2Replacer = strings.NewReplacer(
	`\`, `\\`, // Backslash FIRST to avoid double-escaping
	`_`, `\_`,
	`*`, `\*`,
	`[`, `\[`,
	`]`, `\]`,
	`(`, `\(`,
	`)`, `\)`,
	`~`, `\~`,
	"`", "\\`",
	`>`, `\>`,
	`#`, `\#`,
	`+`, `\+`,
	`-`, `\-`,
	`=`, `\=`,
	`|`, `\|`,
	`{`, `\{`,
	`}`, `\}`,
	`.`, `\.`,
	`!`, `\!`,
)

// NewTelegramChannel creates a new Telegram notification channel.
func NewTelegramChannel(config TelegramConfig) *TelegramChannel {
	return &TelegramChannel{
		config:     config,
		apiBaseURL: "https://api.telegram.org/bot",
		client: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

// Name returns the channel identifier.
func (t *TelegramChannel) Name() string {
	return "telegram"
}

// Send delivers a notification via Telegram to all configured chats.
// Uses parallel delivery with errgroup for multiple chats.
func (t *TelegramChannel) Send(ctx context.Context, notification Notification) error {
	// Build message text with MarkdownV2 formatting
	message := t.formatMessage(notification)

	// Build inline keyboard if base_url and alert_id are available
	inlineKeyboard := t.buildInlineKeyboard(notification)

	// Use errgroup for parallel delivery
	g, ctx := errgroup.WithContext(ctx)

	// Track errors and success count
	errorsMu := &sync.Mutex{}
	errors := make([]error, 0)
	successCount := 0

	// Launch goroutine per chat
	for _, chatID := range t.config.ChatIDs {
		chatID := chatID // Capture for goroutine
		g.Go(func() error {
			err := t.sendMessageToChat(ctx, chatID, message, inlineKeyboard)

			errorsMu.Lock()
			defer errorsMu.Unlock()

			if err != nil {
				errors = append(errors, fmt.Errorf("chat %s: %w", chatID, err))
			} else {
				successCount++
			}

			return err
		})
	}

	// Wait for all goroutines
	firstErr := g.Wait()

	totalChats := len(t.config.ChatIDs)

	// Partial success - some chats succeeded, others failed
	if successCount > 0 && successCount < totalChats {
		return fmt.Errorf("partial delivery: %d/%d succeeded, errors: %v",
			successCount, totalChats, errors)
	}

	// All failed
	if firstErr != nil {
		return firstErr
	}

	// All succeeded
	return nil
}

// escapeMarkdownV2 escapes special characters for Telegram MarkdownV2.
func escapeMarkdownV2(text string) string {
	return markdownV2Replacer.Replace(text)
}

// formatMessage formats a notification for Telegram with MarkdownV2.
func (t *TelegramChannel) formatMessage(notification Notification) string {
	// Use severity emoji (colored circles)
	emoji := t.getSeverityEmoji(notification.Severity)

	// Escape user-provided text
	title := escapeMarkdownV2(notification.Title)
	message := escapeMarkdownV2(notification.Message)

	// Format message with MarkdownV2 (bold title)
	formattedMsg := fmt.Sprintf("%s *%s*\n\n%s", emoji, title, message)

	// Add router info if available
	if routerName, ok := notification.Data["router_name"].(string); ok && routerName != "" {
		escapedRouterName := escapeMarkdownV2(routerName)
		formattedMsg += fmt.Sprintf("\n\n*Router:* %s", escapedRouterName)
	}

	// Add event type if available
	if eventType, ok := notification.Data["event_type"].(string); ok && eventType != "" {
		escapedEventType := escapeMarkdownV2(eventType)
		formattedMsg += fmt.Sprintf("\n*Event:* %s", escapedEventType)
	}

	// Add timestamp if available
	if triggeredAt, ok := notification.Data["triggered_at"].(string); ok && triggeredAt != "" {
		escapedTime := escapeMarkdownV2(triggeredAt)
		formattedMsg += fmt.Sprintf("\n*Time:* %s", escapedTime)
	}

	return formattedMsg
}

// getSeverityEmoji returns an appropriate emoji for the severity level.
// NAS-18.6: Updated to use colored circles instead of icons.
func (t *TelegramChannel) getSeverityEmoji(severity string) string {
	switch severity {
	case "CRITICAL":
		return "🔴" // Red circle
	case "WARNING":
		return "🟠" // Orange circle
	case "INFO":
		return "🟢" // Green circle
	default:
		return "🔔" // Bell (fallback)
	}
}

// buildInlineKeyboard builds an inline keyboard with deep link button.
// Returns nil if base_url or alert_id is missing (graceful degradation).
func (t *TelegramChannel) buildInlineKeyboard(notification Notification) *InlineKeyboardMarkup {
	baseURL, _ := notification.Data["base_url"].(string)
	alertID, _ := notification.Data["alert_id"].(string)

	if baseURL == "" || alertID == "" {
		return nil
	}

	// Remove trailing slash from base URL
	baseURL = strings.TrimRight(baseURL, "/")

	// Build deep link URL
	deepLinkURL := fmt.Sprintf("%s/alerts/%s", baseURL, alertID)

	return &InlineKeyboardMarkup{
		InlineKeyboard: [][]InlineKeyboardButton{
			{{Text: "🔍 View in NasNet", URL: deepLinkURL}},
		},
	}
}

// sendMessageToChat sends a message to a specific chat via Telegram Bot API.
// Handles HTTP 429 rate limiting with "temporary" keyword for dispatcher retry.
func (t *TelegramChannel) sendMessageToChat(ctx context.Context, chatID string, text string, keyboard *InlineKeyboardMarkup) error {
	url := fmt.Sprintf("%s%s/sendMessage", t.apiBaseURL, t.config.BotToken)

	// Build request payload
	payload := map[string]interface{}{
		"chat_id":    chatID,
		"text":       text,
		"parse_mode": "MarkdownV2", // Changed from "Markdown"
	}

	// Add inline keyboard if provided
	if keyboard != nil {
		payload["reply_markup"] = keyboard
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

	// Success
	if resp.StatusCode == http.StatusOK {
		return nil
	}

	// Parse error response
	var errorResp TelegramErrorResponse
	if err := json.NewDecoder(resp.Body).Decode(&errorResp); err != nil {
		return fmt.Errorf("Telegram API returned status %d", resp.StatusCode)
	}

	// Handle HTTP 429 with retry_after
	// CRITICAL: Must include "temporary" keyword for dispatcher.isRetryable()
	if resp.StatusCode == http.StatusTooManyRequests {
		retryAfter := errorResp.Parameters.RetryAfter
		if retryAfter == 0 {
			retryAfter = 30 // Default retry time
		}
		return fmt.Errorf("temporary: rate limited by Telegram API, retry after %d seconds", retryAfter)
	}

	// Other errors
	return fmt.Errorf("Telegram API error: %s", errorResp.Description)
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
		Data:     map[string]interface{}{}, // Initialize empty data map
	}

	return t.Send(ctx, testNotification)
}

// parseTelegramConfig converts a map to TelegramConfig.
// Supports both chat_ids (array) and chat_id (string) for backward compatibility.
func parseTelegramConfig(config map[string]interface{}) (TelegramConfig, error) {
	cfg := TelegramConfig{}

	// Parse bot_token
	botToken, ok := config["bot_token"].(string)
	if !ok || botToken == "" {
		return cfg, fmt.Errorf("bot_token is required")
	}
	cfg.BotToken = botToken

	// Try chat_ids array first (new multi-chat support)
	if chatIDsRaw, ok := config["chat_ids"].([]interface{}); ok {
		chatIDs := make([]string, 0, len(chatIDsRaw))
		for _, id := range chatIDsRaw {
			if idStr, ok := id.(string); ok && strings.TrimSpace(idStr) != "" {
				chatIDs = append(chatIDs, strings.TrimSpace(idStr))
			}
		}
		if len(chatIDs) > 0 {
			cfg.ChatIDs = chatIDs
			return cfg, nil
		}
	}

	// Fallback to single chat_id (legacy/backward compat)
	if chatID, ok := config["chat_id"].(string); ok && chatID != "" {
		cfg.ChatIDs = []string{chatID}
		cfg.ChatID = chatID // Keep for backward compat
		return cfg, nil
	}

	return cfg, fmt.Errorf("at least one chat ID is required")
}
