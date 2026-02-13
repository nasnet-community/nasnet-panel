// Package services contains business logic services for NasNetConnect.
package services

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"backend/ent"
	"backend/ent/notificationlog"
	"backend/ent/webhook"
	"backend/internal/encryption"
	"backend/internal/events"
	"backend/internal/notifications"
	"backend/pkg/ulid"

	"go.uber.org/zap"
)

// WebhookService provides webhook CRUD operations and testing.
// Per NAS-18.4: Implements webhook management with encryption, SSRF protection, and template builders.
type WebhookService struct {
	db         *ent.Client
	encryption *encryption.Service
	dispatcher *notifications.Dispatcher
	eventBus   events.EventBus
	log        *zap.SugaredLogger
}

// WebhookServiceConfig holds configuration for WebhookService.
type WebhookServiceConfig struct {
	DB         *ent.Client
	Encryption *encryption.Service
	Dispatcher *notifications.Dispatcher
	EventBus   events.EventBus
	Logger     *zap.SugaredLogger
}

// WebhookCreateResult contains the result of creating a webhook.
// The PlaintextSigningSecret is only returned once and never stored in plaintext.
type WebhookCreateResult struct {
	Webhook                *ent.Webhook
	PlaintextSigningSecret string // ONE TIME ONLY - client must save this
}

// CreateWebhookInput contains parameters for creating a webhook.
type CreateWebhookInput struct {
	Name           string
	URL            string
	AuthType       webhook.AuthType
	AuthValue      map[string]string // Plaintext auth credentials (will be encrypted)
	Headers        map[string]string
	Template       webhook.Template
	CustomTemplate *string
	Enabled        bool
}

// UpdateWebhookInput contains parameters for updating a webhook.
type UpdateWebhookInput struct {
	Name           *string
	URL            *string
	AuthType       *webhook.AuthType
	AuthValue      map[string]string // Plaintext auth credentials (will be re-encrypted if provided)
	Headers        map[string]string
	Template       *webhook.Template
	CustomTemplate *string
	Enabled        *bool
}

// TestWebhookResult contains the result of testing a webhook.
type TestWebhookResult struct {
	Success      bool
	StatusCode   int
	ResponseTime time.Duration
	ResponseBody string // Truncated to 500 chars
	ErrorMessage string
}

// NewWebhookService creates a new WebhookService with the given configuration.
func NewWebhookService(cfg WebhookServiceConfig) *WebhookService {
	return &WebhookService{
		db:         cfg.DB,
		encryption: cfg.Encryption,
		dispatcher: cfg.Dispatcher,
		eventBus:   cfg.EventBus,
		log:        cfg.Logger,
	}
}

// CreateWebhook creates a new webhook with encrypted credentials.
// Per AC: Encrypt credentials with AES-256-GCM, generate signing secret (32 bytes, base64),
// validate URL with SSRF protection, save to database, publish event.
// Returns WebhookCreateResult with webhook + plaintext signing secret (ONE TIME ONLY).
func (s *WebhookService) CreateWebhook(ctx context.Context, input CreateWebhookInput) (*WebhookCreateResult, error) {
	// Validate URL with SSRF protection
	if err := validateWebhookURL(input.URL); err != nil {
		s.log.Errorw("webhook URL validation failed", "url", input.URL, "error", err)
		return nil, fmt.Errorf("invalid webhook URL: %w", err)
	}

	// Generate signing secret (32 bytes)
	signingSecret := make([]byte, 32)
	if _, err := io.ReadFull(rand.Reader, signingSecret); err != nil {
		return nil, fmt.Errorf("failed to generate signing secret: %w", err)
	}
	plaintextSecret := base64.StdEncoding.EncodeToString(signingSecret)

	// Encrypt signing secret
	encryptedSecret, err := s.encryption.Encrypt(plaintextSecret)
	if err != nil {
		return nil, fmt.Errorf("failed to encrypt signing secret: %w", err)
	}
	signingSecretBytes := []byte(encryptedSecret)

	// Extract nonce from encrypted signing secret (first 12 bytes after base64 decode)
	signingNonce, err := extractNonce(encryptedSecret)
	if err != nil {
		return nil, fmt.Errorf("failed to extract signing nonce: %w", err)
	}

	// Encrypt auth credentials if provided
	var authValueEncrypted []byte
	var authNonce []byte
	if input.AuthValue != nil && len(input.AuthValue) > 0 {
		authJSON, err := json.Marshal(input.AuthValue)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal auth value: %w", err)
		}

		encryptedAuth, err := s.encryption.EncryptBytes(authJSON)
		if err != nil {
			return nil, fmt.Errorf("failed to encrypt auth value: %w", err)
		}
		authValueEncrypted = []byte(encryptedAuth)

		authNonce, err = extractNonce(encryptedAuth)
		if err != nil {
			return nil, fmt.Errorf("failed to extract auth nonce: %w", err)
		}
	}

	// Create webhook entity
	webhookBuilder := s.db.Webhook.Create().
		SetID(ulid.NewString()).
		SetName(input.Name).
		SetURL(input.URL).
		SetAuthType(input.AuthType).
		SetSigningSecretEncrypted(signingSecretBytes).
		SetSigningNonce(signingNonce).
		SetTemplate(input.Template).
		SetEnabled(input.Enabled)

	if authValueEncrypted != nil {
		webhookBuilder.SetAuthValueEncrypted(authValueEncrypted).SetAuthNonce(authNonce)
	}

	if input.Headers != nil {
		webhookBuilder.SetHeaders(input.Headers)
	}

	if input.CustomTemplate != nil {
		webhookBuilder.SetCustomTemplate(*input.CustomTemplate)
	}

	// Save to database
	wh, err := webhookBuilder.Save(ctx)
	if err != nil {
		s.log.Errorw("failed to create webhook", "error", err, "name", input.Name)
		return nil, fmt.Errorf("failed to create webhook: %w", err)
	}

	// Publish event
	if s.eventBus != nil {
		event := events.NewBaseEvent("webhook.created", events.PriorityNormal, "webhook-service")
		_ = s.eventBus.Publish(ctx, &event)
	}

	s.log.Infow("webhook created", "webhook_id", wh.ID, "name", wh.Name)

	return &WebhookCreateResult{
		Webhook:                wh,
		PlaintextSigningSecret: plaintextSecret,
	}, nil
}

// GetWebhook retrieves a webhook by ID.
// Per AC: Decrypt credentials for internal use, mask signing secret (****...last4 format) for GraphQL responses.
func (s *WebhookService) GetWebhook(ctx context.Context, webhookID string) (*ent.Webhook, error) {
	wh, err := s.db.Webhook.Get(ctx, webhookID)
	if err != nil {
		if ent.IsNotFound(err) {
			return nil, fmt.Errorf("webhook not found: %s", webhookID)
		}
		return nil, fmt.Errorf("failed to fetch webhook: %w", err)
	}

	return wh, nil
}

// GetWebhookDecrypted retrieves a webhook with decrypted credentials (for internal use only).
// This should NEVER be exposed directly to GraphQL resolvers.
func (s *WebhookService) GetWebhookDecrypted(ctx context.Context, webhookID string) (*ent.Webhook, map[string]string, error) {
	wh, err := s.GetWebhook(ctx, webhookID)
	if err != nil {
		return nil, nil, err
	}

	// Decrypt auth value if present
	var authValue map[string]string
	if wh.AuthValueEncrypted != nil {
		decrypted, err := s.encryption.Decrypt(string(wh.AuthValueEncrypted))
		if err != nil {
			return nil, nil, fmt.Errorf("failed to decrypt auth value: %w", err)
		}

		if err := json.Unmarshal([]byte(decrypted), &authValue); err != nil {
			return nil, nil, fmt.Errorf("failed to unmarshal auth value: %w", err)
		}
	}

	return wh, authValue, nil
}

// UpdateWebhook updates an existing webhook.
// Per AC: Re-encrypt if credentials changed, validate URL, update database, publish event.
// NEVER return signing secret on update.
func (s *WebhookService) UpdateWebhook(ctx context.Context, webhookID string, input UpdateWebhookInput) (*ent.Webhook, error) {
	// Find existing webhook
	wh, err := s.db.Webhook.Get(ctx, webhookID)
	if err != nil {
		if ent.IsNotFound(err) {
			return nil, fmt.Errorf("webhook not found: %s", webhookID)
		}
		return nil, fmt.Errorf("failed to fetch webhook: %w", err)
	}

	// Build update query
	updateBuilder := wh.Update()

	if input.Name != nil {
		updateBuilder.SetName(*input.Name)
	}

	if input.URL != nil {
		// Validate new URL with SSRF protection
		if err := validateWebhookURL(*input.URL); err != nil {
			return nil, fmt.Errorf("invalid webhook URL: %w", err)
		}
		updateBuilder.SetURL(*input.URL)
	}

	if input.AuthType != nil {
		updateBuilder.SetAuthType(*input.AuthType)
	}

	// Re-encrypt auth credentials if provided
	if input.AuthValue != nil {
		if len(input.AuthValue) > 0 {
			authJSON, err := json.Marshal(input.AuthValue)
			if err != nil {
				return nil, fmt.Errorf("failed to marshal auth value: %w", err)
			}

			encryptedAuth, err := s.encryption.EncryptBytes(authJSON)
			if err != nil {
				return nil, fmt.Errorf("failed to encrypt auth value: %w", err)
			}

			authNonce, err := extractNonce(encryptedAuth)
			if err != nil {
				return nil, fmt.Errorf("failed to extract auth nonce: %w", err)
			}

			updateBuilder.SetAuthValueEncrypted([]byte(encryptedAuth)).SetAuthNonce(authNonce)
		} else {
			// Clear auth value if empty map provided
			updateBuilder.ClearAuthValueEncrypted().ClearAuthNonce()
		}
	}

	if input.Headers != nil {
		updateBuilder.SetHeaders(input.Headers)
	}

	if input.Template != nil {
		updateBuilder.SetTemplate(*input.Template)
	}

	if input.CustomTemplate != nil {
		updateBuilder.SetCustomTemplate(*input.CustomTemplate)
	}

	if input.Enabled != nil {
		updateBuilder.SetEnabled(*input.Enabled)
	}

	// Save update
	updated, err := updateBuilder.Save(ctx)
	if err != nil {
		s.log.Errorw("failed to update webhook", "error", err, "webhook_id", webhookID)
		return nil, fmt.Errorf("failed to update webhook: %w", err)
	}

	// Publish event
	if s.eventBus != nil {
		event := events.NewBaseEvent("webhook.updated", events.PriorityNormal, "webhook-service")
		_ = s.eventBus.Publish(ctx, &event)
	}

	s.log.Infow("webhook updated", "webhook_id", webhookID, "name", updated.Name)
	return updated, nil
}

// DeleteWebhook deletes a webhook by ID.
// Per AC: Delete from database, publish event.
func (s *WebhookService) DeleteWebhook(ctx context.Context, webhookID string) error {
	// Check if webhook exists
	_, err := s.db.Webhook.Get(ctx, webhookID)
	if err != nil {
		if ent.IsNotFound(err) {
			return fmt.Errorf("webhook not found: %s", webhookID)
		}
		return fmt.Errorf("failed to fetch webhook: %w", err)
	}

	// Delete webhook
	if err := s.db.Webhook.DeleteOneID(webhookID).Exec(ctx); err != nil {
		s.log.Errorw("failed to delete webhook", "error", err, "webhook_id", webhookID)
		return fmt.Errorf("failed to delete webhook: %w", err)
	}

	// Publish event
	if s.eventBus != nil {
		event := events.NewBaseEvent("webhook.deleted", events.PriorityNormal, "webhook-service")
		_ = s.eventBus.Publish(ctx, &event)
	}

	s.log.Infow("webhook deleted", "webhook_id", webhookID)
	return nil
}

// ListWebhooks queries all webhooks with optional filters.
func (s *WebhookService) ListWebhooks(ctx context.Context, enabled *bool) ([]*ent.Webhook, error) {
	query := s.db.Webhook.Query()

	// Apply filters
	if enabled != nil {
		query = query.Where(webhook.EnabledEQ(*enabled))
	}

	webhooks, err := query.All(ctx)
	if err != nil {
		s.log.Errorw("failed to list webhooks", "error", err)
		return nil, fmt.Errorf("failed to list webhooks: %w", err)
	}

	return webhooks, nil
}

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
	payload, err := notifications.BuildWebhookPayload(testNotification, convertTemplate(wh.Template), wh.CustomTemplate)
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

// extractNonce extracts the nonce (first 12 bytes) from base64-encoded ciphertext.
// The encryption service prepends the nonce to the ciphertext before base64 encoding.
func extractNonce(encryptedBase64 string) ([]byte, error) {
	// Decode base64
	data, err := base64.StdEncoding.DecodeString(encryptedBase64)
	if err != nil {
		return nil, fmt.Errorf("failed to decode base64: %w", err)
	}

	// Extract first 12 bytes (nonce size for AES-GCM)
	if len(data) < 12 {
		return nil, fmt.Errorf("encrypted data too short to contain nonce")
	}

	nonce := make([]byte, 12)
	copy(nonce, data[:12])

	return nonce, nil
}

// validateWebhookURL validates a webhook URL for SSRF protection.
// Uses the SSRF protection from internal/notifications/webhook.go.
func validateWebhookURL(urlStr string) error {
	return notifications.ValidateWebhookURL(urlStr)
}

// convertTemplate converts ent webhook template to notifications payload format.
func convertTemplate(t webhook.Template) notifications.WebhookPayloadFormat {
	switch t {
	case webhook.TemplateSlack:
		return notifications.PayloadFormatSlack
	case webhook.TemplateDiscord:
		return notifications.PayloadFormatDiscord
	case webhook.TemplateTeams:
		return notifications.PayloadFormatTeams
	case webhook.TemplateMattermost:
		return notifications.PayloadFormatSlack // Mattermost uses Slack format
	case webhook.TemplateCustom:
		return notifications.PayloadFormatCustom
	case webhook.TemplateGenericJSON:
		return notifications.PayloadFormatGeneric
	default:
		return notifications.PayloadFormatGeneric
	}
}
