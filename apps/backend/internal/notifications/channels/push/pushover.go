package push

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"sync"
	"time"

	"backend/internal/notifications"
)

// Pushover API endpoints (package-level variables for testing)
var (
	pushoverMessagesURL = "https://api.pushover.net/1/messages.json"
	pushoverValidateURL = "https://api.pushover.net/1/users/validate.json"
	pushoverReceiptURL  = "https://api.pushover.net/1/receipts"
)

// PushoverUsage tracks API usage limits.
type PushoverUsage struct {
	Remaining int
	Limit     int
	ResetAt   time.Time
	mu        sync.RWMutex
}

// PushoverChannel delivers notifications via Pushover API.
type PushoverChannel struct {
	config PushoverConfig
	client *http.Client
	usage  *PushoverUsage
}

// PushoverConfig holds Pushover API configuration.
type PushoverConfig struct {
	UserKey  string `json:"user_key"`
	AppToken string `json:"app_token"`
	BaseURL  string `json:"base_url"`
}

// NewPushoverChannel creates a new Pushover notification channel.
func NewPushoverChannel(config PushoverConfig) *PushoverChannel {
	return &PushoverChannel{
		config: config,
		client: &http.Client{Timeout: 10 * time.Second},
		usage:  &PushoverUsage{Limit: 10000},
	}
}

// Name returns the channel identifier.
func (p *PushoverChannel) Name() string { return "pushover" }

// Send delivers a notification via Pushover.
func (p *PushoverChannel) Send(ctx context.Context, notification notifications.Notification) error {
	priority := p.getPriority(notification.Severity)
	values := p.buildFormValues(notification, priority)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, pushoverMessagesURL, strings.NewReader(values.Encode()))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := p.client.Do(req)
	if err != nil {
		if ctx.Err() != nil {
			return fmt.Errorf("connection timeout: %w", err)
		}
		return fmt.Errorf("network error: %w", err)
	}
	defer resp.Body.Close()

	p.trackUsage(resp)

	if resp.StatusCode != http.StatusOK {
		return p.handleErrorResponse(resp)
	}

	p.extractReceipt(resp, priority, notification)
	return nil
}

// buildFormValues constructs the Pushover form payload.
func (p *PushoverChannel) buildFormValues(notification notifications.Notification, priority int) url.Values {
	values := url.Values{}
	values.Set("token", p.config.AppToken)
	values.Set("user", p.config.UserKey)
	values.Set("title", notification.Title)
	values.Set("message", notification.Message)
	values.Set("priority", strconv.Itoa(priority))

	if notification.DeviceID != nil && *notification.DeviceID != "" {
		values.Set("device", *notification.DeviceID)
	}

	switch priority {
	case 2:
		values.Set("sound", "siren")
		values.Set("retry", "300")
		values.Set("expire", "3600")
	case 1:
		values.Set("sound", "spacealarm")
	default:
		values.Set("sound", "pushover")
	}

	if notification.Data != nil {
		if alertID, ok := notification.Data["alert_id"].(string); ok && alertID != "" && p.config.BaseURL != "" {
			values.Set("url", fmt.Sprintf("%s/alerts/%s", p.config.BaseURL, alertID))
			values.Set("url_title", "View in NasNet")
		}
		if triggeredAt, ok := notification.Data["triggered_at"].(time.Time); ok {
			values.Set("timestamp", strconv.FormatInt(triggeredAt.Unix(), 10))
		}
	}

	return values
}

// trackUsage updates API usage stats from response headers.
func (p *PushoverChannel) trackUsage(resp *http.Response) {
	if p.usage == nil {
		return
	}
	remaining := resp.Header.Get("X-Limit-App-Remaining")
	reset := resp.Header.Get("X-Limit-App-Reset")
	if remaining != "" && reset != "" {
		p.updateUsageFromHeaders(remaining, reset)
	}
}

// handleErrorResponse parses and returns an error from a non-200 Pushover response.
func (p *PushoverChannel) handleErrorResponse(resp *http.Response) error {
	var errorResp struct {
		Status int      `json:"status"`
		Errors []string `json:"errors"`
	}
	_ = json.NewDecoder(resp.Body).Decode(&errorResp) //nolint:errcheck // best-effort decode

	switch resp.StatusCode {
	case http.StatusBadRequest, http.StatusForbidden:
		if len(errorResp.Errors) > 0 {
			return fmt.Errorf("invalid credentials: %s", errorResp.Errors[0])
		}
		return errors.New("invalid request: bad request")
	case http.StatusUnauthorized:
		return errors.New("unauthorized: invalid API token")
	case http.StatusTooManyRequests:
		return errors.New("quota_exceeded: monthly message limit reached")
	case http.StatusInternalServerError, http.StatusBadGateway, http.StatusServiceUnavailable, http.StatusGatewayTimeout:
		return fmt.Errorf("temporary server error: HTTP %d", resp.StatusCode)
	default:
		if len(errorResp.Errors) > 0 {
			return fmt.Errorf("pushover API error: %s", errorResp.Errors[0])
		}
		return fmt.Errorf("pushover API returned status %d", resp.StatusCode)
	}
}

// extractReceipt stores the emergency notification receipt if applicable.
func (p *PushoverChannel) extractReceipt(resp *http.Response, priority int, notification notifications.Notification) {
	if priority != 2 {
		return
	}
	var receiptResp struct {
		Status  int    `json:"status"`
		Receipt string `json:"receipt"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&receiptResp); err == nil && receiptResp.Receipt != "" {
		if notification.Data == nil {
			notification.Data = make(map[string]interface{})
		}
		notification.Data["pushover_receipt"] = receiptResp.Receipt
	}
}

func (p *PushoverChannel) getPriority(severity string) int {
	switch severity {
	case "CRITICAL":
		return 2
	case "WARNING":
		return 1
	default:
		return 0
	}
}

// updateUsageFromHeaders updates usage stats from API response headers.
func (p *PushoverChannel) updateUsageFromHeaders(remainingStr, resetStr string) {
	remaining, err := strconv.Atoi(remainingStr)
	if err != nil {
		return
	}
	resetUnix, err := strconv.ParseInt(resetStr, 10, 64)
	if err != nil {
		return
	}
	p.usage.mu.Lock()
	defer p.usage.mu.Unlock()
	p.usage.Remaining = remaining
	p.usage.ResetAt = time.Unix(resetUnix, 0)
}

// GetUsage returns current API usage statistics.
func (p *PushoverChannel) GetUsage(ctx context.Context) (*PushoverUsage, error) {
	p.usage.mu.RLock()
	defer p.usage.mu.RUnlock()
	return &PushoverUsage{
		Remaining: p.usage.Remaining,
		Limit:     p.usage.Limit,
		ResetAt:   p.usage.ResetAt,
	}, nil
}

// ValidateCredentials verifies Pushover credentials by calling the validation API.
func (p *PushoverChannel) ValidateCredentials(ctx context.Context, userKey, appToken string) error {
	values := url.Values{}
	values.Set("token", appToken)
	values.Set("user", userKey)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, pushoverValidateURL, strings.NewReader(values.Encode()))
	if err != nil {
		return fmt.Errorf("failed to create validation request: %w", err)
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := p.client.Do(req)
	if err != nil {
		return fmt.Errorf("network error during validation: %w", err)
	}
	defer resp.Body.Close()

	var result struct {
		Status int      `json:"status"`
		Errors []string `json:"errors"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return fmt.Errorf("failed to parse validation response: %w", err)
	}

	if result.Status == 1 {
		return nil
	}

	if len(result.Errors) == 0 {
		return errors.New("invalid credentials")
	}

	errMsg := result.Errors[0]
	switch {
	case strings.Contains(strings.ToLower(errMsg), "user"):
		return errors.New("invalid_user_key")
	case strings.Contains(strings.ToLower(errMsg), "token"):
		return errors.New("invalid_api_token")
	default:
		return fmt.Errorf("validation failed: %s", errMsg)
	}
}

// CancelReceipt cancels an emergency notification receipt.
func (p *PushoverChannel) CancelReceipt(ctx context.Context, receipt string) error {
	cancelURL := fmt.Sprintf("%s/%s/cancel.json", pushoverReceiptURL, receipt)
	values := url.Values{}
	values.Set("token", p.config.AppToken)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, cancelURL, strings.NewReader(values.Encode()))
	if err != nil {
		return fmt.Errorf("failed to create cancel request: %w", err)
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := p.client.Do(req)
	if err != nil {
		return fmt.Errorf("network error during cancel: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("failed to cancel receipt: HTTP %d", resp.StatusCode)
	}
	return nil
}

// Test verifies the Pushover configuration by sending a test notification.
func (p *PushoverChannel) Test(ctx context.Context, config map[string]interface{}) error {
	pushoverConfig, err := ParsePushoverConfig(config)
	if err != nil {
		return fmt.Errorf("invalid Pushover configuration: %w", err)
	}
	if err := p.ValidateCredentials(ctx, pushoverConfig.UserKey, pushoverConfig.AppToken); err != nil {
		return fmt.Errorf("credential validation failed: %w", err)
	}

	originalConfig := p.config
	p.config = pushoverConfig
	defer func() { p.config = originalConfig }()

	testNotification := notifications.Notification{
		Title:    "NasNetConnect Test",
		Message:  "Pushover notifications are configured correctly!",
		Severity: "INFO",
	}
	return p.Send(ctx, testNotification)
}

// ParsePushoverConfig converts a map to PushoverConfig.
func ParsePushoverConfig(config map[string]interface{}) (PushoverConfig, error) {
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
