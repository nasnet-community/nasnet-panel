package auth

import (
	"crypto/rsa"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// generateTestKeys generates an RSA key pair for testing
func generateTestKeys(t *testing.T) (*rsa.PrivateKey, *rsa.PublicKey) {
	t.Helper()
	privateKey, publicKey, err := GenerateKeyPair()
	require.NoError(t, err)
	return privateKey, publicKey
}

func TestJWTService_GenerateAndValidateToken(t *testing.T) {
	privateKey, publicKey := generateTestKeys(t)

	config := JWTConfig{
		PrivateKey:      privateKey,
		PublicKey:       publicKey,
		TokenDuration:   1 * time.Hour,
		SessionDuration: 7 * 24 * time.Hour,
		SlideThreshold:  30 * time.Minute,
		Issuer:          "test-issuer",
	}

	jwtService, err := NewJWTService(config)
	require.NoError(t, err)

	t.Run("generates valid token", func(t *testing.T) {
		input := TokenInput{
			UserID:    "user-123",
			Username:  "testuser",
			Role:      RoleAdmin,
			SessionID: "session-456",
		}

		token, expiresAt, err := jwtService.GenerateToken(input)
		require.NoError(t, err)
		assert.NotEmpty(t, token)
		assert.True(t, expiresAt.After(time.Now()))
		assert.True(t, expiresAt.Before(time.Now().Add(2*time.Hour)))
	})

	t.Run("validates valid token", func(t *testing.T) {
		input := TokenInput{
			UserID:    "user-123",
			Username:  "testuser",
			Role:      RoleAdmin,
			SessionID: "session-456",
		}

		token, _, err := jwtService.GenerateToken(input)
		require.NoError(t, err)

		claims, err := jwtService.ValidateToken(token)
		require.NoError(t, err)
		assert.Equal(t, "user-123", claims.UserID)
		assert.Equal(t, "testuser", claims.Username)
		assert.Equal(t, "admin", claims.Role)
		assert.Equal(t, "session-456", claims.SessionID)
		assert.Equal(t, "test-issuer", claims.Issuer)
	})

	t.Run("rejects invalid token", func(t *testing.T) {
		_, err := jwtService.ValidateToken("invalid-token")
		assert.Error(t, err)
		assert.ErrorIs(t, err, ErrTokenInvalid)
	})

	t.Run("rejects expired token", func(t *testing.T) {
		// Create service with very short token duration
		shortConfig := JWTConfig{
			PrivateKey:    privateKey,
			PublicKey:     publicKey,
			TokenDuration: 1 * time.Millisecond,
			Issuer:        "test",
		}
		shortService, err := NewJWTService(shortConfig)
		require.NoError(t, err)

		token, _, err := shortService.GenerateToken(TokenInput{
			UserID:   "user-123",
			Username: "test",
			Role:     RoleViewer,
		})
		require.NoError(t, err)

		// Wait for token to expire
		time.Sleep(10 * time.Millisecond)

		_, err = shortService.ValidateToken(token)
		assert.Error(t, err)
		assert.ErrorIs(t, err, ErrTokenExpired)
	})

	t.Run("rejects token signed with different key", func(t *testing.T) {
		// Generate different keys
		otherPrivate, _ := generateTestKeys(t)

		otherConfig := JWTConfig{
			PrivateKey:    otherPrivate,
			PublicKey:     publicKey, // Using original public key
			TokenDuration: 1 * time.Hour,
		}
		otherService, err := NewJWTService(otherConfig)
		require.NoError(t, err)

		token, _, err := otherService.GenerateToken(TokenInput{
			UserID:   "user-123",
			Username: "test",
			Role:     RoleViewer,
		})
		require.NoError(t, err)

		// Validate with original service (different public key expectation)
		_, err = jwtService.ValidateToken(token)
		assert.Error(t, err)
	})
}

func TestJWTService_SlidingSession(t *testing.T) {
	privateKey, publicKey := generateTestKeys(t)

	config := JWTConfig{
		PrivateKey:      privateKey,
		PublicKey:       publicKey,
		TokenDuration:   1 * time.Hour,
		SessionDuration: 7 * 24 * time.Hour,
		SlideThreshold:  30 * time.Minute,
		Issuer:          "test",
	}

	jwtService, err := NewJWTService(config)
	require.NoError(t, err)

	t.Run("should not refresh fresh token", func(t *testing.T) {
		token, _, err := jwtService.GenerateToken(TokenInput{
			UserID:   "user-123",
			Username: "test",
			Role:     RoleViewer,
		})
		require.NoError(t, err)

		claims, err := jwtService.ValidateToken(token)
		require.NoError(t, err)

		// Fresh token should not need refresh
		assert.False(t, jwtService.ShouldRefresh(claims))
	})

	t.Run("should refresh token near expiry", func(t *testing.T) {
		// Create service with longer token duration to avoid race conditions
		shortConfig := JWTConfig{
			PrivateKey:      privateKey,
			PublicKey:       publicKey,
			TokenDuration:   500 * time.Millisecond,
			SessionDuration: 7 * 24 * time.Hour,
			SlideThreshold:  400 * time.Millisecond, // Refresh when < 400ms remaining
		}
		shortService, err := NewJWTService(shortConfig)
		require.NoError(t, err)

		token, _, err := shortService.GenerateToken(TokenInput{
			UserID:    "user-123",
			Username:  "test",
			Role:      RoleViewer,
			SessionID: "session-123",
		})
		require.NoError(t, err)

		// Wait until within slide threshold (token has ~350ms left, threshold is 400ms)
		time.Sleep(150 * time.Millisecond)

		claims, err := shortService.ValidateToken(token)
		require.NoError(t, err)

		// Should now want to refresh (< 400ms remaining)
		assert.True(t, shortService.ShouldRefresh(claims))

		// Refresh should succeed
		sessionCreatedAt := time.Now().Add(-1 * time.Hour)
		newToken, newExpiry, err := shortService.RefreshToken(claims, sessionCreatedAt)
		require.NoError(t, err)
		assert.NotEmpty(t, newToken)
		assert.NotEqual(t, token, newToken)
		assert.True(t, newExpiry.After(time.Now()))
	})

	t.Run("respects maximum session duration", func(t *testing.T) {
		shortConfig := JWTConfig{
			PrivateKey:      privateKey,
			PublicKey:       publicKey,
			TokenDuration:   1 * time.Hour,
			SessionDuration: 1 * time.Millisecond, // Very short session
			SlideThreshold:  30 * time.Minute,
		}
		shortService, err := NewJWTService(shortConfig)
		require.NoError(t, err)

		// Session created "long ago" (past max session duration)
		sessionCreatedAt := time.Now().Add(-1 * time.Hour)

		// Create claims that would trigger refresh (expired at is close)
		now := time.Now()
		claims := &Claims{
			UserID:    "user-123",
			SessionID: "session-123",
		}
		// Set ExpiresAt to 10 minutes from now (within slide threshold of 30min)
		claims.ExpiresAt = jwt.NewNumericDate(now.Add(10 * time.Minute))

		// ShouldRefresh returns true (within threshold)
		assert.True(t, shortService.ShouldRefresh(claims))

		// But RefreshToken should fail because session max exceeded
		_, _, err = shortService.RefreshToken(claims, sessionCreatedAt)
		assert.ErrorIs(t, err, ErrSessionExpired)
	})
}

func TestRole_HasPermission(t *testing.T) {
	tests := []struct {
		role     Role
		required Role
		expected bool
	}{
		{RoleAdmin, RoleAdmin, true},
		{RoleAdmin, RoleOperator, true},
		{RoleAdmin, RoleViewer, true},
		{RoleOperator, RoleAdmin, false},
		{RoleOperator, RoleOperator, true},
		{RoleOperator, RoleViewer, true},
		{RoleViewer, RoleAdmin, false},
		{RoleViewer, RoleOperator, false},
		{RoleViewer, RoleViewer, true},
	}

	for _, tc := range tests {
		t.Run(string(tc.role)+"_has_"+string(tc.required), func(t *testing.T) {
			assert.Equal(t, tc.expected, tc.role.HasPermission(tc.required))
		})
	}
}

func TestRole_IsValid(t *testing.T) {
	assert.True(t, RoleAdmin.IsValid())
	assert.True(t, RoleOperator.IsValid())
	assert.True(t, RoleViewer.IsValid())
	assert.False(t, Role("invalid").IsValid())
}

func TestNewJWTService_RequiresKeys(t *testing.T) {
	privateKey, publicKey := generateTestKeys(t)

	t.Run("requires private key", func(t *testing.T) {
		_, err := NewJWTService(JWTConfig{
			PublicKey: publicKey,
		})
		assert.ErrorIs(t, err, ErrMissingPrivateKey)
	})

	t.Run("requires public key", func(t *testing.T) {
		_, err := NewJWTService(JWTConfig{
			PrivateKey: privateKey,
		})
		assert.ErrorIs(t, err, ErrMissingPublicKey)
	})

	t.Run("succeeds with both keys", func(t *testing.T) {
		service, err := NewJWTService(JWTConfig{
			PrivateKey: privateKey,
			PublicKey:  publicKey,
		})
		assert.NoError(t, err)
		assert.NotNil(t, service)
	})
}
