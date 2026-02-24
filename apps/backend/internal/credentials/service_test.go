package credentials

import (
	"testing"

	"backend/internal/encryption"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNewService(t *testing.T) {
	t.Run("creates service with valid encryption service", func(t *testing.T) {
		key := make([]byte, 32)
		for i := range key {
			key[i] = byte(i)
		}
		encService, err := encryption.NewService(encryption.Config{Key: key})
		require.NoError(t, err)

		service, err := NewService(encService)
		require.NoError(t, err)
		assert.NotNil(t, service)
		assert.NotNil(t, service.EncryptionService())
	})

	t.Run("fails with nil encryption service", func(t *testing.T) {
		service, err := NewService(nil)
		assert.Error(t, err)
		assert.Nil(t, service)
		assert.Contains(t, err.Error(), "encryption service is required")
	})
}

func TestCredentialInfo(t *testing.T) {
	t.Run("struct fields are correct", func(t *testing.T) {
		info := CredentialInfo{
			RouterID:         "test-router-id",
			Username:         "admin",
			HasPassword:      true,
			EncryptionStatus: "AES-256-GCM",
			KeyVersion:       1,
		}

		assert.Equal(t, "test-router-id", info.RouterID)
		assert.Equal(t, "admin", info.Username)
		assert.True(t, info.HasPassword)
		assert.Equal(t, "AES-256-GCM", info.EncryptionStatus)
		assert.Equal(t, 1, info.KeyVersion)
	})
}

func TestSanitizeForLog(t *testing.T) {
	t.Run("sanitizes credentials correctly", func(t *testing.T) {
		creds := &Credentials{
			Username:   "admin",
			Password:   "supersecret123",
			KeyVersion: 1,
		}

		sanitized := SanitizeForLog(creds)
		require.NotNil(t, sanitized)
		assert.Equal(t, "admin", sanitized["username"])
		assert.Equal(t, "[REDACTED]", sanitized["password"])
		assert.Equal(t, 1, sanitized["key_version"])
	})

	t.Run("returns nil for nil credentials", func(t *testing.T) {
		sanitized := SanitizeForLog(nil)
		assert.Nil(t, sanitized)
	})
}

func TestUpdateInput(t *testing.T) {
	t.Run("struct fields are correct", func(t *testing.T) {
		input := UpdateInput{
			Username: "admin",
			Password: "password123",
		}

		assert.Equal(t, "admin", input.Username)
		assert.Equal(t, "password123", input.Password)
	})
}

func TestErrors(t *testing.T) {
	t.Run("error messages are descriptive", func(t *testing.T) {
		assert.Equal(t, "credentials not found for router", ErrCredentialsNotFound.Error())
		assert.Equal(t, "failed to encrypt credentials", ErrEncryptionFailed.Error())
		assert.Equal(t, "failed to decrypt credentials", ErrDecryptionFailed.Error())
		assert.Equal(t, "invalid credentials: username and password are required", ErrInvalidCredentials.Error())
		assert.Equal(t, "router not found", ErrRouterNotFound.Error())
	})
}

func TestZeroCredentials(t *testing.T) {
	t.Run("clears credentials from memory", func(t *testing.T) {
		creds := &Credentials{
			Username:   "admin",
			Password:   "supersecret123",
			KeyVersion: 1,
		}

		// Before zeroing
		assert.NotEmpty(t, creds.Username)
		assert.NotEmpty(t, creds.Password)

		// Zero the credentials
		ZeroCredentials(creds)

		// After zeroing
		assert.Empty(t, creds.Username)
		assert.Empty(t, creds.Password)
		// KeyVersion remains unchanged
		assert.Equal(t, 1, creds.KeyVersion)
	})

	t.Run("handles nil credentials gracefully", func(t *testing.T) {
		// Should not panic with nil credentials
		assert.NotPanics(t, func() {
			ZeroCredentials(nil)
		})
	})
}
