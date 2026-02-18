//go:build integration

package integration_test

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"sync"
	"testing"
	"time"

	"backend/generated/ent"
	"backend/generated/ent/webhook"
	"backend/internal/common/ulid"
	"backend/internal/encryption"
	"backend/internal/notifications"
	"backend/internal/services"

	"backend/internal/events"

	_ "github.com/mattn/go-sqlite3" // SQLite driver for tests
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/zap"
)

// setupTestDB creates an in-memory SQLite database for testing.
func setupTestDB(t *testing.T) *ent.Client {
	client, err := ent.Open("sqlite3", "file:ent?mode=memory&cache=shared&_fk=1")
	require.NoError(t, err, "Failed to open test database")

	// Run migrations
	err = client.Schema.Create(context.Background())
	require.NoError(t, err, "Failed to create schema")

	return client
}

// setupTestEncryption creates a test encryption service with a fixed key.
func setupTestEncryption(t *testing.T) *encryption.Service {
	testKey := make([]byte, 32)
	for i := range testKey {
		testKey[i] = byte(i)
	}

	encService, err := encryption.NewService(encryption.Config{Key: testKey})
	require.NoError(t, err)
	return encService
}

// setupTestWebhookService creates a configured WebhookService for testing.
func setupTestWebhookService(t *testing.T) (*services.WebhookService, *ent.Client, *encryption.Service) {
	db := setupTestDB(t)
	enc := setupTestEncryption(t)
	eventBus := events.NewEventBus(events.DefaultEventBusOptions())

	logger := zap.NewNop().Sugar()

	// Create minimal dispatcher (not used in these tests)
	dispatcher := notifications.NewDispatcher(notifications.DispatcherConfig{
		Channels: map[string]notifications.Channel{},
		Logger:   logger,
	})

	svc := services.NewWebhookService(services.WebhookServiceConfig{
		DB:         db,
		Encryption: enc,
		Dispatcher: dispatcher,
		EventBus:   eventBus,
		Logger:     logger,
	})

	return svc, db, enc
}

// TestWebhookServiceFullFlow tests the complete webhook flow end-to-end.
// Scenario: Create webhook → Test webhook → Verify HTTP POST received
func TestWebhookServiceFullFlow(t *testing.T) {
	// Setup
	svc, db, _ := setupTestWebhookService(t)
	defer db.Close()
	ctx := context.Background()

	// Create mock HTTP server to receive webhook POST
	var receivedPayload map[string]interface{}
	var receivedHeaders http.Header
	mu := sync.Mutex{}

	server := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		mu.Lock()
		defer mu.Unlock()

		// Capture headers
		receivedHeaders = r.Header.Clone()

		// Read body
		body, _ := io.ReadAll(r.Body)
		json.Unmarshal(body, &receivedPayload)

		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"success": true}`))
	}))
	defer server.Close()

	// Create webhook
	result, err := svc.CreateWebhook(ctx, services.CreateWebhookInput{
		Name:     "Test Webhook",
		URL:      server.URL,
		AuthType: webhook.AuthTypeBearer,
		AuthValue: map[string]string{
			"token": "test-bearer-token-123",
		},
		Headers: map[string]string{
			"X-Custom-Header": "custom-value",
		},
		Template: webhook.TemplateGenericJSON,
		Enabled:  true,
	})
	require.NoError(t, err)
	require.NotNil(t, result)
	require.NotEmpty(t, result.PlaintextSigningSecret, "Signing secret should be returned on creation")

	// Verify webhook was created
	assert.NotEmpty(t, result.Webhook.ID)
	assert.Equal(t, "Test Webhook", result.Webhook.Name)
	assert.Equal(t, server.URL, result.Webhook.URL)
	assert.True(t, result.Webhook.Enabled)

	// Test webhook
	testResult, err := svc.TestWebhook(ctx, result.Webhook.ID)
	require.NoError(t, err)
	require.True(t, testResult.Success, "Webhook test should succeed")
	assert.Equal(t, http.StatusOK, testResult.StatusCode)
	assert.Greater(t, testResult.ResponseTime, time.Duration(0))
	assert.NotEmpty(t, testResult.ResponseBody)

	// Verify HTTP request was received
	mu.Lock()
	defer mu.Unlock()

	require.NotNil(t, receivedPayload, "Server should have received webhook POST")
	assert.Equal(t, "Test Notification", receivedPayload["title"])
	assert.Equal(t, "INFO", receivedPayload["severity"])

	// Verify custom headers
	assert.Equal(t, "custom-value", receivedHeaders.Get("X-Custom-Header"))
	assert.Equal(t, "application/json", receivedHeaders.Get("Content-Type"))
	assert.Contains(t, receivedHeaders.Get("User-Agent"), "NasNetConnect")

	// Verify authentication header
	assert.Contains(t, receivedHeaders.Get("Authorization"), "Bearer test-bearer-token-123")
}

// TestWebhookServiceParallelDispatch tests multiple webhooks receiving notifications in parallel.
// Scenario: Create 3 webhooks → Simulate 1 failure → Verify delivery results
func TestWebhookServiceParallelDispatch(t *testing.T) {
	// Setup
	svc, db, _ := setupTestWebhookService(t)
	defer db.Close()
	ctx := context.Background()

	// Create 3 mock servers (2 success, 1 failure)
	successCount := 0
	mu := sync.Mutex{}

	server1 := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		mu.Lock()
		successCount++
		mu.Unlock()
		w.WriteHeader(http.StatusOK)
	}))
	defer server1.Close()

	server2 := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		mu.Lock()
		successCount++
		mu.Unlock()
		w.WriteHeader(http.StatusOK)
	}))
	defer server2.Close()

	server3 := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// This server returns 500 (failure)
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(`{"error": "Internal server error"}`))
	}))
	defer server3.Close()

	// Create 3 webhooks
	webhook1, err := svc.CreateWebhook(ctx, services.CreateWebhookInput{
		Name:     "Webhook 1",
		URL:      server1.URL,
		AuthType: webhook.AuthTypeNone,
		Template: webhook.TemplateGenericJSON,
		Enabled:  true,
	})
	require.NoError(t, err)

	webhook2, err := svc.CreateWebhook(ctx, services.CreateWebhookInput{
		Name:     "Webhook 2",
		URL:      server2.URL,
		AuthType: webhook.AuthTypeNone,
		Template: webhook.TemplateSlack,
		Enabled:  true,
	})
	require.NoError(t, err)

	webhook3, err := svc.CreateWebhook(ctx, services.CreateWebhookInput{
		Name:     "Webhook 3 (Failure)",
		URL:      server3.URL,
		AuthType: webhook.AuthTypeNone,
		Template: webhook.TemplateDiscord,
		Enabled:  true,
	})
	require.NoError(t, err)

	// Test all webhooks in parallel
	var wg sync.WaitGroup
	results := make([]*services.TestWebhookResult, 3)

	webhooks := []*services.WebhookCreateResult{webhook1, webhook2, webhook3}
	for i, wh := range webhooks {
		wg.Add(1)
		go func(idx int, webhookID string) {
			defer wg.Done()
			result, err := svc.TestWebhook(ctx, webhookID)
			require.NoError(t, err)
			results[idx] = result
		}(i, wh.Webhook.ID)
	}

	wg.Wait()

	// Verify results
	assert.True(t, results[0].Success, "Webhook 1 should succeed")
	assert.Equal(t, http.StatusOK, results[0].StatusCode)

	assert.True(t, results[1].Success, "Webhook 2 should succeed")
	assert.Equal(t, http.StatusOK, results[1].StatusCode)

	assert.False(t, results[2].Success, "Webhook 3 should fail")
	assert.Equal(t, http.StatusInternalServerError, results[2].StatusCode)
	assert.Contains(t, results[2].ErrorMessage, "webhook returned status 500")

	// Verify 2 webhooks succeeded
	mu.Lock()
	defer mu.Unlock()
	assert.Equal(t, 2, successCount, "2 webhooks should have succeeded")
}

// TestWebhookServiceAuthenticationHeaders tests different authentication types.
// Scenario: Test Bearer, Basic auth → Verify headers present in HTTP requests
func TestWebhookServiceAuthenticationHeaders(t *testing.T) {
	// Setup
	svc, db, _ := setupTestWebhookService(t)
	defer db.Close()
	ctx := context.Background()

	t.Run("Bearer Token Authentication", func(t *testing.T) {
		var receivedAuth string
		server := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			receivedAuth = r.Header.Get("Authorization")
			w.WriteHeader(http.StatusOK)
		}))
		defer server.Close()

		// Create webhook with Bearer auth
		result, err := svc.CreateWebhook(ctx, services.CreateWebhookInput{
			Name:     "Bearer Auth Webhook",
			URL:      server.URL,
			AuthType: webhook.AuthTypeBearer,
			AuthValue: map[string]string{
				"token": "my-secret-bearer-token",
			},
			Template: webhook.TemplateGenericJSON,
			Enabled:  true,
		})
		require.NoError(t, err)

		// Test webhook
		testResult, err := svc.TestWebhook(ctx, result.Webhook.ID)
		require.NoError(t, err)
		require.True(t, testResult.Success)

		// Verify Bearer token header
		assert.Equal(t, "Bearer my-secret-bearer-token", receivedAuth)
	})

	t.Run("Basic Authentication", func(t *testing.T) {
		var receivedAuth string
		server := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			receivedAuth = r.Header.Get("Authorization")
			w.WriteHeader(http.StatusOK)
		}))
		defer server.Close()

		// Create webhook with Basic auth
		result, err := svc.CreateWebhook(ctx, services.CreateWebhookInput{
			Name:     "Basic Auth Webhook",
			URL:      server.URL,
			AuthType: webhook.AuthTypeBasic,
			AuthValue: map[string]string{
				"username": "admin",
				"password": "secret123",
			},
			Template: webhook.TemplateGenericJSON,
			Enabled:  true,
		})
		require.NoError(t, err)

		// Test webhook
		testResult, err := svc.TestWebhook(ctx, result.Webhook.ID)
		require.NoError(t, err)
		require.True(t, testResult.Success)

		// Verify Basic auth header (should be "Basic <base64(username:password)>")
		assert.Contains(t, receivedAuth, "Basic ")
		assert.NotEmpty(t, receivedAuth)
	})

	t.Run("API Key Authentication", func(t *testing.T) {
		var receivedAPIKey string
		server := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			receivedAPIKey = r.Header.Get("X-API-Key")
			w.WriteHeader(http.StatusOK)
		}))
		defer server.Close()

		// Create webhook with API Key auth
		result, err := svc.CreateWebhook(ctx, services.CreateWebhookInput{
			Name:     "API Key Webhook",
			URL:      server.URL,
			AuthType: webhook.AuthTypeAPIKey,
			AuthValue: map[string]string{
				"header": "X-API-Key",
				"value":  "my-api-key-12345",
			},
			Template: webhook.TemplateGenericJSON,
			Enabled:  true,
		})
		require.NoError(t, err)

		// Test webhook
		testResult, err := svc.TestWebhook(ctx, result.Webhook.ID)
		require.NoError(t, err)
		require.True(t, testResult.Success)

		// Verify API key header
		assert.Equal(t, "my-api-key-12345", receivedAPIKey)
	})
}

// TestWebhookServiceCustomHeaders tests custom header forwarding.
// Scenario: Create webhook with custom headers → Verify headers present in request
func TestWebhookServiceCustomHeaders(t *testing.T) {
	// Setup
	svc, db, _ := setupTestWebhookService(t)
	defer db.Close()
	ctx := context.Background()

	// Capture headers
	var receivedHeaders http.Header
	server := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		receivedHeaders = r.Header.Clone()
		w.WriteHeader(http.StatusOK)
	}))
	defer server.Close()

	// Create webhook with multiple custom headers
	result, err := svc.CreateWebhook(ctx, services.CreateWebhookInput{
		Name:     "Custom Headers Webhook",
		URL:      server.URL,
		AuthType: webhook.AuthTypeNone,
		Headers: map[string]string{
			"X-Custom-Header-1": "value1",
			"X-Custom-Header-2": "value2",
			"X-App-Version":     "1.0.0",
		},
		Template: webhook.TemplateGenericJSON,
		Enabled:  true,
	})
	require.NoError(t, err)

	// Test webhook
	testResult, err := svc.TestWebhook(ctx, result.Webhook.ID)
	require.NoError(t, err)
	require.True(t, testResult.Success)

	// Verify all custom headers are present
	assert.Equal(t, "value1", receivedHeaders.Get("X-Custom-Header-1"))
	assert.Equal(t, "value2", receivedHeaders.Get("X-Custom-Header-2"))
	assert.Equal(t, "1.0.0", receivedHeaders.Get("X-App-Version"))
}

// TestWebhookServiceCRUDOperations tests complete CRUD lifecycle.
// Scenario: Create → Read → Update → Delete → Verify database state
func TestWebhookServiceCRUDOperations(t *testing.T) {
	// Setup
	svc, db, _ := setupTestWebhookService(t)
	defer db.Close()
	ctx := context.Background()

	// Create a mock server for testing
	server := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	defer server.Close()

	// CREATE
	t.Run("Create Webhook", func(t *testing.T) {
		result, err := svc.CreateWebhook(ctx, services.CreateWebhookInput{
			Name:     "CRUD Test Webhook",
			URL:      server.URL,
			AuthType: webhook.AuthTypeBearer,
			AuthValue: map[string]string{
				"token": "initial-token",
			},
			Headers: map[string]string{
				"X-Initial": "value",
			},
			Template: webhook.TemplateSlack,
			Enabled:  true,
		})
		require.NoError(t, err)
		require.NotNil(t, result)

		// Store webhook ID for subsequent tests
		webhookID := result.Webhook.ID

		// Verify signing secret returned (ONE TIME ONLY)
		assert.NotEmpty(t, result.PlaintextSigningSecret)
		assert.Len(t, result.PlaintextSigningSecret, 44) // 32 bytes base64 = 44 chars

		// READ
		t.Run("Get Webhook", func(t *testing.T) {
			retrieved, err := svc.GetWebhook(ctx, webhookID)
			require.NoError(t, err)
			assert.Equal(t, webhookID, retrieved.ID)
			assert.Equal(t, "CRUD Test Webhook", retrieved.Name)
			assert.Equal(t, server.URL, retrieved.URL)
			assert.Equal(t, webhook.AuthTypeBearer, retrieved.AuthType)
			assert.Equal(t, webhook.TemplateSlack, retrieved.Template)
			assert.True(t, retrieved.Enabled)

			// Verify credentials are encrypted (not plaintext)
			assert.NotNil(t, retrieved.AuthValueEncrypted)
			assert.NotContains(t, string(retrieved.AuthValueEncrypted), "initial-token")

			// Verify signing secret is encrypted
			assert.NotNil(t, retrieved.SigningSecretEncrypted)
			assert.NotContains(t, string(retrieved.SigningSecretEncrypted), result.PlaintextSigningSecret)
		})

		// UPDATE
		t.Run("Update Webhook", func(t *testing.T) {
			newName := "Updated Webhook Name"
			newTemplate := webhook.TemplateDiscord
			enabled := false

			updated, err := svc.UpdateWebhook(ctx, webhookID, services.UpdateWebhookInput{
				Name:     &newName,
				Template: &newTemplate,
				Enabled:  &enabled,
				AuthValue: map[string]string{
					"token": "updated-token",
				},
				Headers: map[string]string{
					"X-Updated": "new-value",
				},
			})
			require.NoError(t, err)
			assert.Equal(t, "Updated Webhook Name", updated.Name)
			assert.Equal(t, webhook.TemplateDiscord, updated.Template)
			assert.False(t, updated.Enabled)

			// Verify credentials were re-encrypted
			assert.NotNil(t, updated.AuthValueEncrypted)
			assert.NotEqual(t, result.Webhook.AuthValueEncrypted, updated.AuthValueEncrypted)
		})

		// LIST
		t.Run("List Webhooks", func(t *testing.T) {
			webhooks, err := svc.ListWebhooks(ctx, nil)
			require.NoError(t, err)
			assert.GreaterOrEqual(t, len(webhooks), 1)

			// Find our webhook
			found := false
			for _, wh := range webhooks {
				if wh.ID == webhookID {
					found = true
					assert.Equal(t, "Updated Webhook Name", wh.Name)
					break
				}
			}
			assert.True(t, found, "Webhook should be in list")
		})

		// DELETE
		t.Run("Delete Webhook", func(t *testing.T) {
			err := svc.DeleteWebhook(ctx, webhookID)
			require.NoError(t, err)

			// Verify webhook is deleted
			_, err = svc.GetWebhook(ctx, webhookID)
			assert.Error(t, err)
			assert.Contains(t, err.Error(), "not found")
		})

		// Verify database state after deletion
		t.Run("Verify Database State", func(t *testing.T) {
			count, err := db.Webhook.Query().Count(ctx)
			require.NoError(t, err)
			assert.Equal(t, 0, count, "All webhooks should be deleted")
		})
	})
}

// TestWebhookServiceCredentialEncryption verifies credential encryption.
// Scenario: Create webhook → Read from database → Verify encryption
func TestWebhookServiceCredentialEncryption(t *testing.T) {
	// Setup
	svc, db, enc := setupTestWebhookService(t)
	defer db.Close()
	ctx := context.Background()

	server := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	defer server.Close()

	// Create webhook with sensitive credentials
	plainAuthValue := map[string]string{
		"username": "admin",
		"password": "super-secret-password-123!",
	}

	result, err := svc.CreateWebhook(ctx, services.CreateWebhookInput{
		Name:      "Encryption Test Webhook",
		URL:       server.URL,
		AuthType:  webhook.AuthTypeBasic,
		AuthValue: plainAuthValue,
		Template:  webhook.TemplateGenericJSON,
		Enabled:   true,
	})
	require.NoError(t, err)

	// Read webhook directly from database
	dbWebhook, err := db.Webhook.Get(ctx, result.Webhook.ID)
	require.NoError(t, err)

	// Verify auth_value_encrypted is NOT plaintext
	t.Run("Auth Value Encrypted", func(t *testing.T) {
		assert.NotNil(t, dbWebhook.AuthValueEncrypted)
		authEncrypted := string(dbWebhook.AuthValueEncrypted)

		// Should not contain plaintext credentials
		assert.NotContains(t, authEncrypted, "admin")
		assert.NotContains(t, authEncrypted, "super-secret-password-123!")

		// Should be base64-encoded ciphertext
		assert.NotEmpty(t, authEncrypted)

		// Verify decryption works
		decrypted, err := enc.Decrypt(authEncrypted)
		require.NoError(t, err)

		var decryptedAuth map[string]string
		err = json.Unmarshal([]byte(decrypted), &decryptedAuth)
		require.NoError(t, err)

		assert.Equal(t, "admin", decryptedAuth["username"])
		assert.Equal(t, "super-secret-password-123!", decryptedAuth["password"])
	})

	// Verify signing_secret_encrypted is NOT plaintext
	t.Run("Signing Secret Encrypted", func(t *testing.T) {
		assert.NotNil(t, dbWebhook.SigningSecretEncrypted)
		secretEncrypted := string(dbWebhook.SigningSecretEncrypted)

		// Should not contain plaintext signing secret
		assert.NotContains(t, secretEncrypted, result.PlaintextSigningSecret)

		// Should be base64-encoded ciphertext
		assert.NotEmpty(t, secretEncrypted)

		// Verify decryption works
		decrypted, err := enc.Decrypt(secretEncrypted)
		require.NoError(t, err)
		assert.Equal(t, result.PlaintextSigningSecret, decrypted)
	})

	// Verify nonces are stored correctly
	t.Run("Nonces Stored", func(t *testing.T) {
		assert.NotNil(t, dbWebhook.AuthNonce)
		assert.Len(t, dbWebhook.AuthNonce, 12, "Auth nonce should be 12 bytes")

		assert.NotNil(t, dbWebhook.SigningNonce)
		assert.Len(t, dbWebhook.SigningNonce, 12, "Signing nonce should be 12 bytes")

		// Nonces should be different
		assert.NotEqual(t, dbWebhook.AuthNonce, dbWebhook.SigningNonce)
	})
}

// TestWebhookServiceSigningSecretMasking verifies signing secret is only returned once.
// Scenario: Create webhook → Get webhook → Update webhook → Verify secret never returned again
func TestWebhookServiceSigningSecretMasking(t *testing.T) {
	// Setup
	svc, db, _ := setupTestWebhookService(t)
	defer db.Close()
	ctx := context.Background()

	server := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	defer server.Close()

	// Create webhook
	result, err := svc.CreateWebhook(ctx, services.CreateWebhookInput{
		Name:     "Secret Test Webhook",
		URL:      server.URL,
		AuthType: webhook.AuthTypeNone,
		Template: webhook.TemplateGenericJSON,
		Enabled:  true,
	})
	require.NoError(t, err)

	// Verify signing secret returned on creation (ONE TIME ONLY)
	assert.NotEmpty(t, result.PlaintextSigningSecret)
	originalSecret := result.PlaintextSigningSecret

	// Get webhook - secret should NOT be returned
	retrieved, err := svc.GetWebhook(ctx, result.Webhook.ID)
	require.NoError(t, err)

	// Signing secret should be encrypted in database
	assert.NotNil(t, retrieved.SigningSecretEncrypted)
	assert.NotContains(t, string(retrieved.SigningSecretEncrypted), originalSecret)

	// Update webhook - secret should NOT be returned
	newName := "Updated Name"
	updated, err := svc.UpdateWebhook(ctx, result.Webhook.ID, services.UpdateWebhookInput{
		Name: &newName,
	})
	require.NoError(t, err)

	// Signing secret should still be encrypted, not plaintext
	assert.NotNil(t, updated.SigningSecretEncrypted)
	assert.NotContains(t, string(updated.SigningSecretEncrypted), originalSecret)

	// Test MaskSigningSecret utility
	masked := services.MaskSigningSecret(originalSecret)
	assert.Contains(t, masked, "****")
	assert.NotEqual(t, originalSecret, masked)
}

// TestWebhookServiceDeliveryLogs tests delivery log retrieval.
// Scenario: Create webhook → Test webhook → Verify logs can be retrieved
func TestWebhookServiceDeliveryLogs(t *testing.T) {
	// Setup
	svc, db, _ := setupTestWebhookService(t)
	defer db.Close()
	ctx := context.Background()

	server := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	defer server.Close()

	// Create webhook
	result, err := svc.CreateWebhook(ctx, services.CreateWebhookInput{
		Name:     "Logs Test Webhook",
		URL:      server.URL,
		AuthType: webhook.AuthTypeNone,
		Template: webhook.TemplateGenericJSON,
		Enabled:  true,
	})
	require.NoError(t, err)

	// Create test alert for logging
	alertID := ulid.NewString()

	// Manually create a notification log entry
	_, err = db.NotificationLog.Create().
		SetID(ulid.NewString()).
		SetChannel("webhook").
		SetAlertID(alertID).
		SetWebhookID(result.Webhook.ID).
		SetStatus("success").
		SetAttemptNumber(1).
		SetResponseCode(200).
		Save(ctx)
	require.NoError(t, err)

	// Retrieve delivery logs
	logs, err := svc.GetDeliveryLogs(ctx, result.Webhook.ID, 10)
	require.NoError(t, err)
	assert.Len(t, logs, 1)

	log := logs[0]
	assert.Equal(t, "webhook", string(log.Channel))
	assert.Equal(t, alertID, log.AlertID)
	assert.Equal(t, result.Webhook.ID, log.WebhookID)
	assert.Equal(t, "success", string(log.Status))
	assert.Equal(t, 200, log.ResponseCode)
}
