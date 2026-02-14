// Package services contains business logic services for NasNetConnect.
package services

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"time"

	"backend/generated/ent"
	"backend/generated/ent/notificationlog"
	"backend/generated/ent/webhook"
	"backend/internal/notifications"
	channelshttp "backend/internal/notifications/channels/http"
)

// TestWebhook sends a test notification to a webhook.
// Per AC: Send test notification, return response details (status code, response time, body preview truncated to 500 chars).
func (s *WebhookService) TestWebhook(ctx context.Context, webhookID string) (*TestWebhookResult, error) {
	// Get webhook with decrypted credentials
	wh, authValue, err := s.GetWebhookDecrypted(ctx, webhookID)
	if err != nil {
		return nil, err
	}

	// Build test notification
	testNotification := notifications.Notification{
		Title:    "Test Notification",
		Message:  "This is a test notification from NasNetConnect to verify your webhook configuration.",
		Severity: "INFO",
		Data: map[string]interface{}{
			"test":      true,
			"timestamp": time.Now().UTC().Format(time.RFC3339),
		},
	}

	// Build webhook payload using template
	payload, err := channelshttp.BuildWebhookPayload(testNotification, convertTemplate(wh.Template), wh.CustomTemplate)
	if err != nil {
		return &TestWebhookResult{
			Success:      false,
			ErrorMessage: fmt.Sprintf("Failed to build payload: %v", err),
		}, nil
	}

	// Send HTTP request
	startTime := time.Now()
	statusCode, responseBody, err := s.sendWebhookRequest(ctx, wh, authValue, payload)
	responseTime := time.Since(startTime)

	// Truncate response body to 500 chars
	truncatedBody := responseBody
	if len(truncatedBody) > 500 {
		truncatedBody = truncatedBody[:500] + "..."
	}

	if err != nil {
		return &TestWebhookResult{
			Success:      false,
			StatusCode:   statusCode,
			ResponseTime: responseTime,
			ResponseBody: truncatedBody,
			ErrorMessage: err.Error(),
		}, nil
	}

	return &TestWebhookResult{
		Success:      true,
		StatusCode:   statusCode,
		ResponseTime: responseTime,
		ResponseBody: truncatedBody,
	}, nil
}

// sendWebhookRequest sends an HTTP request to the webhook URL.
func (s *WebhookService) sendWebhookRequest(ctx context.Context, wh *ent.Webhook, authValue map[string]string, payload []byte) (int, string, error) {
	// Create HTTP client with timeout
	client := &http.Client{
		Timeout: 10 * time.Second,
	}

	// Create request
	req, err := http.NewRequestWithContext(ctx, "POST", wh.URL, nil)
	if err != nil {
		return 0, "", fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", "NasNetConnect-Webhook/1.0")

	// Add custom headers
	for key, value := range wh.Headers {
		req.Header.Set(key, value)
	}

	// Add authentication
	if err := s.addAuthentication(req, wh.AuthType, authValue); err != nil {
		return 0, "", fmt.Errorf("failed to add authentication: %w", err)
	}

	// Send request
	resp, err := client.Do(req)
	if err != nil {
		return 0, "", fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	// Read response body
	body, _ := io.ReadAll(resp.Body)

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return resp.StatusCode, string(body), fmt.Errorf("webhook returned status %d", resp.StatusCode)
	}

	return resp.StatusCode, string(body), nil
}

// addAuthentication adds authentication headers to the request.
func (s *WebhookService) addAuthentication(req *http.Request, authType webhook.AuthType, authValue map[string]string) error {
	switch authType {
	case webhook.AuthTypeNone:
		return nil

	case webhook.AuthTypeBearer:
		token, ok := authValue["token"]
		if !ok {
			return fmt.Errorf("bearer token not found in auth value")
		}
		req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", token))

	case webhook.AuthTypeBasic:
		username, ok := authValue["username"]
		if !ok {
			return fmt.Errorf("username not found in auth value")
		}
		password, ok := authValue["password"]
		if !ok {
			return fmt.Errorf("password not found in auth value")
		}
		req.SetBasicAuth(username, password)

	case webhook.AuthTypeAPIKey:
		header, ok := authValue["header"]
		if !ok {
			return fmt.Errorf("header not found in auth value")
		}
		value, ok := authValue["value"]
		if !ok {
			return fmt.Errorf("value not found in auth value")
		}
		req.Header.Set(header, value)

	default:
		return fmt.Errorf("unknown auth type: %s", authType)
	}

	return nil
}

// GetDeliveryLogs retrieves notification logs for a webhook.
func (s *WebhookService) GetDeliveryLogs(ctx context.Context, webhookID string, limit int) ([]*ent.NotificationLog, error) {
	if limit == 0 {
		limit = 50
	}

	logs, err := s.db.NotificationLog.Query().
		Where(notificationlog.WebhookIDEQ(webhookID)).
		Order(ent.Desc(notificationlog.FieldCreatedAt)).
		Limit(limit).
		All(ctx)

	if err != nil {
		s.log.Errorw("failed to get delivery logs", "error", err, "webhook_id", webhookID)
		return nil, fmt.Errorf("failed to get delivery logs: %w", err)
	}

	return logs, nil
}

// MaskSigningSecret masks a signing secret for display (****...last4 format).
func MaskSigningSecret(secret string) string {
	if len(secret) <= 4 {
		return "****"
	}
	return "****..." + secret[len(secret)-4:]
}

// convertTemplate converts ent webhook template to notifications payload format.
func convertTemplate(t webhook.Template) channelshttp.WebhookPayloadFormat {
	switch t {
	case webhook.TemplateSlack:
		return channelshttp.PayloadFormatSlack
	case webhook.TemplateDiscord:
		return channelshttp.PayloadFormatDiscord
	case webhook.TemplateTeams:
		return channelshttp.PayloadFormatTeams
	case webhook.TemplateMattermost:
		return channelshttp.PayloadFormatSlack // Mattermost uses Slack format
	case webhook.TemplateCustom:
		return channelshttp.PayloadFormatCustom
	case webhook.TemplateGenericJSON:
		return channelshttp.PayloadFormatGeneric
	default:
		return channelshttp.PayloadFormatGeneric
	}
}
