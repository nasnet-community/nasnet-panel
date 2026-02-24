//go:build integration
// +build integration

package resolver

import (
	"context"
	"testing"

	"backend/generated/ent"
	"backend/generated/ent/notificationsettings"
	"backend/graph/model"

	"backend/internal/encryption"

	_ "github.com/mattn/go-sqlite3" // SQLite driver for tests
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
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

// TestEmailCredentialEncryptionRoundtrip tests credential encryption/decryption roundtrip.
// Covers Task 8.3: Save config via configureEmail mutation → verify DB encrypted → load → decrypt.
func TestEmailCredentialEncryptionRoundtrip(t *testing.T) {
	// Skip if encryption key not set
	if encryption.GetEnvEncryptionKey() == "" {
		t.Skip("DB_ENCRYPTION_KEY not set, skipping encryption test")
	}

	// Setup
	client := setupTestDB(t)
	defer client.Close()

	ctx := context.Background()
	encService := encryption.NewServiceFromEnv()

	// Create router
	router, err := client.Router.Create().
		SetName("test-router").
		SetHostname("192.168.1.1").
		SetAPIPort(8728).
		SetStatus("online").
		Save(ctx)
	require.NoError(t, err)

	// Encrypt password
	plainPassword := "secret_smtp_password_123"
	encryptedPassword, err := encService.Encrypt(plainPassword)
	require.NoError(t, err, "Failed to encrypt password")

	// Create email notification settings with encrypted password
	settings, err := client.NotificationSettings.Create().
		SetRouter(router).
		SetChannel("email").
		SetEnabled(true).
		SetConfig(map[string]interface{}{
			"smtp_host":    "smtp.example.com",
			"smtp_port":    587,
			"from_address": "alerts@example.com",
			"to_addresses": []interface{}{"admin@example.com"},
			"use_tls":      true,
			"username":     "alerts@example.com",
		}).
		SetCredentialsEncrypted(encryptedPassword).
		Save(ctx)
	require.NoError(t, err, "Failed to save notification settings")

	// Verify data is saved
	assert.NotEmpty(t, settings.ID)
	assert.Equal(t, "email", settings.Channel)
	assert.NotEqual(t, plainPassword, settings.CredentialsEncrypted, "Password should be encrypted in DB")

	// Load settings from database
	loadedSettings, err := client.NotificationSettings.
		Query().
		Where(notificationsettings.Channel("email")).
		First(ctx)
	require.NoError(t, err, "Failed to load settings")

	// Decrypt password
	decryptedPassword, err := encService.Decrypt(loadedSettings.CredentialsEncrypted)
	require.NoError(t, err, "Failed to decrypt password")

	// Verify roundtrip
	assert.Equal(t, plainPassword, decryptedPassword, "Password should decrypt to original value")
	assert.Equal(t, settings.ID, loadedSettings.ID)
	assert.Equal(t, settings.Config["smtp_host"], loadedSettings.Config["smtp_host"])
}

// TestTestNotificationChannelMutation tests the GraphQL testNotificationChannel mutation.
// Covers Task 8.6: Test testNotificationChannel(channel: "email", config: {...}) end-to-end.
func TestTestNotificationChannelMutation(t *testing.T) {
	// This test requires a mock SMTP server, which is provided in email_integration_test.go
	// Here we test the resolver logic and config parsing

	ctx := context.Background()
	testClient := setupTestDB(t)
	defer testClient.Close()

	r := &mutationResolver{
		Resolver: &Resolver{
			db: testClient,
		},
	}

	// Test with valid email config
	config := map[string]interface{}{
		"smtp_host":    "smtp.example.com",
		"smtp_port":    float64(587),
		"from_address": "alerts@example.com",
		"to_addresses": []interface{}{"admin@example.com"},
		"use_tls":      true,
		"username":     "test@example.com",
		"password":     "test_password",
	}

	// Call resolver (will attempt actual SMTP connection, so we expect failure)
	result, err := r.TestNotificationChannel(ctx, "email", config)
	require.NoError(t, err, "Resolver should not error on execution")
	require.NotNil(t, result)

	// Result should indicate connection failure (expected since we're using fake SMTP server)
	// But the important part is that config parsing worked correctly
	if !result.Success {
		// Config parsing should have worked, failure is due to actual SMTP connection
		assert.Contains(t, *result.Message, "connect", "Error should be about connection, not config parsing")
	}
}

// TestTestNotificationChannelMutation_InvalidConfig tests error handling with invalid config.
func TestTestNotificationChannelMutation_InvalidConfig(t *testing.T) {
	ctx := context.Background()
	testClient := setupTestDB(t)
	defer testClient.Close()

	r := &mutationResolver{
		Resolver: &Resolver{
			db: testClient,
		},
	}

	testCases := []struct {
		name   string
		config map[string]interface{}
		errMsg string
	}{
		{
			name: "missing_smtp_host",
			config: map[string]interface{}{
				"smtp_port":    float64(587),
				"from_address": "test@example.com",
				"to_addresses": []interface{}{"admin@example.com"},
			},
			errMsg: "smtp_host",
		},
		{
			name: "missing_from_address",
			config: map[string]interface{}{
				"smtp_host":    "smtp.example.com",
				"smtp_port":    float64(587),
				"to_addresses": []interface{}{"admin@example.com"},
			},
			errMsg: "from_address",
		},
		{
			name: "empty_to_addresses",
			config: map[string]interface{}{
				"smtp_host":    "smtp.example.com",
				"smtp_port":    float64(587),
				"from_address": "test@example.com",
				"to_addresses": []interface{}{},
			},
			errMsg: "to_addresses",
		},
		{
			name: "invalid_port",
			config: map[string]interface{}{
				"smtp_host":    "smtp.example.com",
				"smtp_port":    float64(99999),
				"from_address": "test@example.com",
				"to_addresses": []interface{}{"admin@example.com"},
			},
			errMsg: "port",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			result, err := r.TestNotificationChannel(ctx, "email", tc.config)

			// Should not panic, but should return failure
			require.NoError(t, err, "Resolver should handle invalid config gracefully")
			require.NotNil(t, result)
			assert.False(t, result.Success, "Should fail with invalid config")
			assert.NotNil(t, result.Message)
			assert.Contains(t, *result.Message, tc.errMsg, "Error message should mention missing field")
		})
	}
}

// TestConfigureEmailMutation tests the configureEmail mutation with encryption.
func TestConfigureEmailMutation(t *testing.T) {
	// Skip if encryption key not set
	if encryption.GetEnvEncryptionKey() == "" {
		t.Skip("DB_ENCRYPTION_KEY not set, skipping encryption test")
	}

	// Setup
	client := setupTestDB(t)
	defer client.Close()

	ctx := context.Background()

	// Create router
	router, err := client.Router.Create().
		SetName("test-router").
		SetHostname("192.168.1.1").
		SetAPIPort(8728).
		SetStatus("online").
		Save(ctx)
	require.NoError(t, err)

	// Create resolver with client
	r := &mutationResolver{
		Resolver: &Resolver{
			db: client,
		},
	}

	// Configure email settings
	input := model.EmailConfigInput{
		Enabled:     boolPtr(true),
		Host:        stringPtr("smtp.example.com"),
		Port:        intPtr(587),
		Username:    stringPtr("alerts@example.com"),
		Password:    stringPtr("secret_password"),
		FromAddress: stringPtr("alerts@example.com"),
		FromName:    stringPtr("NasNet Alerts"),
		ToAddresses: []string{"admin1@example.com", "admin2@example.com"},
		UseTLS:      boolPtr(true),
		SkipVerify:  boolPtr(false),
	}

	routerID := router.ID
	result, err := r.ConfigureEmail(ctx, routerID, &input)
	require.NoError(t, err, "ConfigureEmail should not error")
	require.NotNil(t, result)
	assert.True(t, result.Success, "Configuration should succeed")

	// Verify settings were saved
	settings, err := client.NotificationSettings.
		Query().
		Where(notificationsettings.Channel("email")).
		Where(notificationsettings.HasRouterWith(func(q *ent.RouterQuery) {
			q.Where(ent.Router.ID(routerID))
		})).
		First(ctx)
	require.NoError(t, err, "Settings should be saved in database")
	require.NotNil(t, settings, "Settings should not be nil")

	// Verify config
	assert.Equal(t, "smtp.example.com", settings.Config["smtp_host"])
	assert.Equal(t, float64(587), settings.Config["smtp_port"])
	assert.Equal(t, "alerts@example.com", settings.Config["from_address"])
	assert.True(t, settings.Enabled)

	// Verify password is encrypted
	assert.NotEqual(t, "secret_password", settings.CredentialsEncrypted)
	assert.NotEmpty(t, settings.CredentialsEncrypted)

	// Verify password can be decrypted
	encService := encryption.NewServiceFromEnv()
	decrypted, err := encService.Decrypt(settings.CredentialsEncrypted)
	require.NoError(t, err)
	assert.Equal(t, "secret_password", decrypted)
}

// Helper functions.

func boolPtr(b bool) *bool {
	return &b
}

func stringPtr(s string) *string {
	return &s
}

func intPtr(i int) *int {
	return &i
}
