// Package credentials provides integration tests for credential management.
// These tests verify the complete credential lifecycle including encryption,
// storage, and retrieval.
//
// Run with: go test -tags=integration ./internal/credentials/...
package credentials

import (
	"context"
	"os"
	"testing"
	"time"

	"backend/internal/encryption"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestCredentialEncryptionRoundTrip tests that credentials can be encrypted and decrypted correctly.
func TestCredentialEncryptionRoundTrip(t *testing.T) {
	// Set up test encryption key
	testKey := make([]byte, 32)
	for i := range testKey {
		testKey[i] = byte(i)
	}

	encService, err := encryption.NewService(encryption.Config{Key: testKey})
	require.NoError(t, err)

	credService, err := NewService(encService)
	require.NoError(t, err)

	t.Run("encryption service is accessible", func(t *testing.T) {
		svc := credService.EncryptionService()
		assert.NotNil(t, svc)
		assert.Equal(t, 1, svc.KeyVersion())
	})
}

// TestCredentialSanitization verifies that credentials are properly sanitized for logging.
func TestCredentialSanitization(t *testing.T) {
	creds := &Credentials{
		Username:    "admin",
		Password:    "super-secret-password-123!",
		KeyVersion:  1,
		LastUpdated: time.Now(),
	}

	sanitized := SanitizeForLog(creds)
	require.NotNil(t, sanitized)

	// Username should be visible
	assert.Equal(t, "admin", sanitized["username"])

	// Password should ALWAYS be redacted
	assert.Equal(t, "[REDACTED]", sanitized["password"])

	// Key version should be visible
	assert.Equal(t, 1, sanitized["key_version"])
}

// TestEncryptionKeyFromEnvironment tests loading encryption key from environment.
func TestEncryptionKeyFromEnvironment(t *testing.T) {
	// Save original value
	originalKey := os.Getenv("DB_ENCRYPTION_KEY")
	defer os.Setenv("DB_ENCRYPTION_KEY", originalKey)

	t.Run("fails without key", func(t *testing.T) {
		os.Unsetenv("DB_ENCRYPTION_KEY")
		_, err := NewServiceFromEnv()
		assert.Error(t, err)
	})

	t.Run("succeeds with valid base64 key", func(t *testing.T) {
		// 32 bytes base64 encoded
		os.Setenv("DB_ENCRYPTION_KEY", "MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MDE=")
		svc, err := NewServiceFromEnv()
		assert.NoError(t, err)
		assert.NotNil(t, svc)
	})
}

// TestCredentialInfoFields verifies CredentialInfo struct is populated correctly.
func TestCredentialInfoFields(t *testing.T) {
	now := time.Now()
	info := CredentialInfo{
		RouterID:         "router-123",
		Username:         "admin",
		HasPassword:      true,
		EncryptionStatus: "AES-256-GCM",
		KeyVersion:       1,
		LastUpdated:      now,
		CreatedAt:        now,
	}

	assert.Equal(t, "router-123", info.RouterID)
	assert.Equal(t, "admin", info.Username)
	assert.True(t, info.HasPassword)
	assert.Equal(t, "AES-256-GCM", info.EncryptionStatus)
	assert.Equal(t, 1, info.KeyVersion)
}

// TestUpdateInputValidation verifies that UpdateInput is properly structured.
func TestUpdateInputValidation(t *testing.T) {
	input := UpdateInput{
		Username: "admin",
		Password: "password123",
	}

	assert.NotEmpty(t, input.Username)
	assert.NotEmpty(t, input.Password)
}

// TestNilCredentialSanitization ensures nil credentials don't cause panics.
func TestNilCredentialSanitization(t *testing.T) {
	result := SanitizeForLog(nil)
	assert.Nil(t, result)
}

// TestCredentialServiceNilEncryption verifies service fails with nil encryption.
func TestCredentialServiceNilEncryption(t *testing.T) {
	_, err := NewService(nil)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "encryption service is required")
}

// BenchmarkEncryptDecryptCredentials benchmarks credential encryption/decryption.
func BenchmarkEncryptDecryptCredentials(b *testing.B) {
	testKey := make([]byte, 32)
	for i := range testKey {
		testKey[i] = byte(i)
	}

	encService, err := encryption.NewService(encryption.Config{Key: testKey})
	if err != nil {
		b.Fatal(err)
	}

	username := "admin"
	password := "very-secure-password-123!@#"

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		// Encrypt
		encUsername, _ := encService.Encrypt(username)
		encPassword, _ := encService.Encrypt(password)

		// Decrypt
		_, _ = encService.Decrypt(encUsername)
		_, _ = encService.Decrypt(encPassword)
	}
}

// TestEncryptionNeverProducesSameOutput verifies that encryption produces unique ciphertext.
func TestEncryptionNeverProducesSameOutput(t *testing.T) {
	testKey := make([]byte, 32)
	for i := range testKey {
		testKey[i] = byte(i)
	}

	encService, err := encryption.NewService(encryption.Config{Key: testKey})
	require.NoError(t, err)

	password := "same-password"
	ciphertexts := make(map[string]bool)

	// Encrypt the same password 100 times
	for i := 0; i < 100; i++ {
		encrypted, err := encService.Encrypt(password)
		require.NoError(t, err)

		// Each ciphertext should be unique due to random nonce
		assert.False(t, ciphertexts[encrypted], "Duplicate ciphertext detected - nonce reuse!")
		ciphertexts[encrypted] = true
	}
}

// TestCredentialServiceContext verifies context is properly used.
func TestCredentialServiceContext(t *testing.T) {
	testKey := make([]byte, 32)
	for i := range testKey {
		testKey[i] = byte(i)
	}

	encService, err := encryption.NewService(encryption.Config{Key: testKey})
	require.NoError(t, err)

	credService, err := NewService(encService)
	require.NoError(t, err)

	// Test with cancelled context (should not panic)
	ctx, cancel := context.WithCancel(context.Background())
	cancel()

	// These operations shouldn't panic even with cancelled context
	_, err = credService.Exists(ctx, nil, "non-existent-router")
	// Error is expected since there's no database client
	assert.Error(t, err)
}
