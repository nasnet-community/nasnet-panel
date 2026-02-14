// Package push implements push-style notification channels (Telegram, Pushover, ntfy, in-app).
package push

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"sync"
	"time"

	"backend/internal/notifications"

	"golang.org/x/sync/errgroup"
)

// TelegramChannel delivers notifications via Telegram Bot API.
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
func (t *TelegramChannel) Send(ctx context.Context, notification notifications.Notification) error {
	message := t.formatMessage(notification)
	inlineKeyboard := t.buildInlineKeyboard(notification)

	g, ctx := errgroup.WithContext(ctx)
	errorsMu := &sync.Mutex{}
	errors := make([]error, 0)
	successCount := 0

	for _, chatID := range t.config.ChatIDs {
		chatID := chatID
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

	firstErr := g.Wait()
	totalChats := len(t.config.ChatIDs)

	if successCount > 0 && successCount < totalChats {
		return fmt.Errorf("partial delivery: %d/%d succeeded, errors: %v",
			successCount, totalChats, errors)
	}

	if firstErr != nil {
		return firstErr
	}

	return nil
}

// sendMessageToChat sends a message to a specific chat via Telegram Bot API.
func (t *TelegramChannel) sendMessageToChat(ctx context.Context, chatID string, text string, keyboard *InlineKeyboardMarkup) error {
	url := fmt.Sprintf("%s%s/sendMessage", t.apiBaseURL, t.config.BotToken)

	payload := map[string]interface{}{
		"chat_id":    chatID,
		"text":       text,
		"parse_mode": "MarkdownV2",
	}

	if keyboard != nil {
		payload["reply_markup"] = keyboard
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal payload: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := t.client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send message: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusOK {
		return nil
	}

	var errorResp TelegramErrorResponse
	if err := json.NewDecoder(resp.Body).Decode(&errorResp); err != nil {
		return fmt.Errorf("Telegram API returned status %d", resp.StatusCode)
	}

	if resp.StatusCode == http.StatusTooManyRequests {
		retryAfter := errorResp.Parameters.RetryAfter
		if retryAfter == 0 {
			retryAfter = 30
		}
		return fmt.Errorf("temporary: rate limited by Telegram API, retry after %d seconds", retryAfter)
	}

	return fmt.Errorf("Telegram API error: %s", errorResp.Description)
}

// Test verifies the Telegram configuration by sending a test message.
func (t *TelegramChannel) Test(ctx context.Context, config map[string]interface{}) error {
	telegramConfig, err := ParseTelegramConfig(config)
	if err != nil {
		return fmt.Errorf("invalid Telegram configuration: %w", err)
	}

	originalConfig := t.config
	t.config = telegramConfig
	defer func() { t.config = originalConfig }()

	testNotification := notifications.Notification{
		Title:    "NasNetConnect Test",
		Message:  "Telegram notifications are configured correctly!",
		Severity: "INFO",
		Data:     map[string]interface{}{},
	}

	return t.Send(ctx, testNotification)
}

// MarkdownV2 special characters that need escaping.
var markdownV2Replacer = strings.NewReplacer(
	`\`, `\\`,
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

func escapeMarkdownV2(text string) string {
	return markdownV2Replacer.Replace(text)
}

func (t *TelegramChannel) formatMessage(notification notifications.Notification) string {
	emoji := t.getSeverityEmoji(notification.Severity)
	title := escapeMarkdownV2(notification.Title)
	message := escapeMarkdownV2(notification.Message)

	formattedMsg := fmt.Sprintf("%s *%s*\n\n%s", emoji, title, message)

	if routerName, ok := notification.Data["router_name"].(string); ok && routerName != "" {
		formattedMsg += fmt.Sprintf("\n\n*Router:* %s", escapeMarkdownV2(routerName))
	}
	if eventType, ok := notification.Data["event_type"].(string); ok && eventType != "" {
		formattedMsg += fmt.Sprintf("\n*Event:* %s", escapeMarkdownV2(eventType))
	}
	if triggeredAt, ok := notification.Data["triggered_at"].(string); ok && triggeredAt != "" {
		formattedMsg += fmt.Sprintf("\n*Time:* %s", escapeMarkdownV2(triggeredAt))
	}

	return formattedMsg
}

func (t *TelegramChannel) getSeverityEmoji(severity string) string {
	switch severity {
	case "CRITICAL":
		return "\xf0\x9f\x94\xb4" // Red circle
	case "WARNING":
		return "\xf0\x9f\x9f\xa0" // Orange circle
	case "INFO":
		return "\xf0\x9f\x9f\xa2" // Green circle
	default:
		return "\xf0\x9f\x94\x94" // Bell
	}
}

func (t *TelegramChannel) buildInlineKeyboard(notification notifications.Notification) *InlineKeyboardMarkup {
	baseURL, _ := notification.Data["base_url"].(string)
	alertID, _ := notification.Data["alert_id"].(string)

	if baseURL == "" || alertID == "" {
		return nil
	}

	baseURL = strings.TrimRight(baseURL, "/")
	deepLinkURL := fmt.Sprintf("%s/alerts/%s", baseURL, alertID)

	return &InlineKeyboardMarkup{
		InlineKeyboard: [][]InlineKeyboardButton{
			{{Text: "\xf0\x9f\x94\x8d View in NasNet", URL: deepLinkURL}},
		},
	}
}

// ParseTelegramConfig converts a map to TelegramConfig.
func ParseTelegramConfig(config map[string]interface{}) (TelegramConfig, error) {
	cfg := TelegramConfig{}

	botToken, ok := config["bot_token"].(string)
	if !ok || botToken == "" {
		return cfg, fmt.Errorf("bot_token is required")
	}
	cfg.BotToken = botToken

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

	if chatID, ok := config["chat_id"].(string); ok && chatID != "" {
		cfg.ChatIDs = []string{chatID}
		cfg.ChatID = chatID
		return cfg, nil
	}

	return cfg, fmt.Errorf("at least one chat ID is required")
}
