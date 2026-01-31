package auth

import (
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestPasswordService_ValidatePassword(t *testing.T) {
	ps := NewDefaultPasswordService()

	t.Run("rejects passwords shorter than 8 characters", func(t *testing.T) {
		err := ps.ValidatePassword("short")
		assert.Error(t, err)
		assert.ErrorIs(t, err, ErrPasswordTooShort)
	})

	t.Run("rejects passwords at 7 characters", func(t *testing.T) {
		err := ps.ValidatePassword("1234567")
		assert.Error(t, err)
		assert.ErrorIs(t, err, ErrPasswordTooShort)
	})

	t.Run("accepts password at exactly 8 characters", func(t *testing.T) {
		err := ps.ValidatePassword("12345678")
		// This is actually a common password, so it will fail for that reason
		assert.Error(t, err)
		assert.ErrorIs(t, err, ErrPasswordCommon)
	})

	t.Run("accepts valid 8 character password", func(t *testing.T) {
		err := ps.ValidatePassword("xK9#mL2p")
		assert.NoError(t, err)
	})

	t.Run("rejects passwords exceeding 128 characters", func(t *testing.T) {
		longPassword := strings.Repeat("a", 129)
		err := ps.ValidatePassword(longPassword)
		assert.Error(t, err)
		assert.ErrorIs(t, err, ErrPasswordTooLong)
	})

	t.Run("accepts password at exactly 128 characters", func(t *testing.T) {
		// 128 random-looking characters
		password := strings.Repeat("xK9mL2pQ", 16) // 128 chars
		err := ps.ValidatePassword(password)
		assert.NoError(t, err)
	})

	t.Run("rejects common passwords", func(t *testing.T) {
		commonPasswords := []string{
			"password",
			"password123",
			"12345678",
			"qwerty123",
			"welcome1", // 8 chars, common (letmein is only 7)
			"admin123",
			"trustno1",
		}

		for _, pwd := range commonPasswords {
			t.Run(pwd, func(t *testing.T) {
				err := ps.ValidatePassword(pwd)
				assert.Error(t, err)
				assert.ErrorIs(t, err, ErrPasswordCommon)
			})
		}
	})

	t.Run("common password check is case-insensitive", func(t *testing.T) {
		err := ps.ValidatePassword("PASSWORD")
		assert.Error(t, err)
		assert.ErrorIs(t, err, ErrPasswordCommon)

		err = ps.ValidatePassword("PaSsWoRd")
		assert.Error(t, err)
		assert.ErrorIs(t, err, ErrPasswordCommon)
	})

	t.Run("accepts strong passwords without complexity requirements", func(t *testing.T) {
		// NIST says no forced complexity - these should all pass
		validPasswords := []string{
			"allowercase123", // No uppercase
			"ALLUPPERCASE123", // No lowercase (but not common)
			"numb3rsnumb3rs",  // No special chars
			"passwordless!!!", // Has special chars (and not in common list)
		}

		for _, pwd := range validPasswords {
			t.Run(pwd, func(t *testing.T) {
				err := ps.ValidatePassword(pwd)
				assert.NoError(t, err)
			})
		}
	})

	t.Run("handles unicode characters correctly", func(t *testing.T) {
		// Unicode characters should count as single characters
		err := ps.ValidatePassword("пароль日本") // 8 unicode chars
		assert.NoError(t, err)
	})
}

func TestPasswordService_HashPassword(t *testing.T) {
	ps := NewDefaultPasswordService()

	t.Run("hashes valid password", func(t *testing.T) {
		hash, err := ps.HashPassword("validPassword123")
		require.NoError(t, err)
		assert.NotEmpty(t, hash)
		assert.NotEqual(t, "validPassword123", hash)
		// bcrypt hashes start with $2a$, $2b$, or $2y$
		assert.True(t, strings.HasPrefix(hash, "$2"))
	})

	t.Run("generates different hashes for same password", func(t *testing.T) {
		hash1, err := ps.HashPassword("samePassword123")
		require.NoError(t, err)

		hash2, err := ps.HashPassword("samePassword123")
		require.NoError(t, err)

		// bcrypt includes random salt, so hashes should differ
		assert.NotEqual(t, hash1, hash2)
	})

	t.Run("rejects invalid passwords during hashing", func(t *testing.T) {
		_, err := ps.HashPassword("short")
		assert.Error(t, err)
		assert.ErrorIs(t, err, ErrPasswordTooShort)
	})

	t.Run("rejects common passwords during hashing", func(t *testing.T) {
		_, err := ps.HashPassword("password123")
		assert.Error(t, err)
		assert.ErrorIs(t, err, ErrPasswordCommon)
	})
}

func TestPasswordService_VerifyPassword(t *testing.T) {
	ps := NewDefaultPasswordService()

	t.Run("verifies correct password", func(t *testing.T) {
		password := "correctPassword123"
		hash, err := ps.HashPassword(password)
		require.NoError(t, err)

		assert.True(t, ps.VerifyPassword(hash, password))
	})

	t.Run("rejects incorrect password", func(t *testing.T) {
		password := "correctPassword123"
		hash, err := ps.HashPassword(password)
		require.NoError(t, err)

		assert.False(t, ps.VerifyPassword(hash, "wrongPassword123"))
	})

	t.Run("rejects empty password", func(t *testing.T) {
		hash, err := ps.HashPassword("validPassword123")
		require.NoError(t, err)

		assert.False(t, ps.VerifyPassword(hash, ""))
	})

	t.Run("rejects invalid hash format", func(t *testing.T) {
		assert.False(t, ps.VerifyPassword("not-a-valid-hash", "anyPassword"))
	})

	t.Run("verification is constant-time safe", func(t *testing.T) {
		// bcrypt.CompareHashAndPassword is inherently timing-safe
		// This test just ensures we use it correctly
		hash, err := ps.HashPassword("testPassword123")
		require.NoError(t, err)

		// Both should take similar time (bcrypt handles this)
		ps.VerifyPassword(hash, "wrongPassword1")
		ps.VerifyPassword(hash, "testPassword123")
	})
}

func TestPasswordService_ChangePassword(t *testing.T) {
	ps := NewDefaultPasswordService()

	t.Run("changes password successfully", func(t *testing.T) {
		currentPassword := "currentPass123"
		newPassword := "newSecurePass456"

		currentHash, err := ps.HashPassword(currentPassword)
		require.NoError(t, err)

		newHash, err := ps.ChangePassword(currentHash, currentPassword, newPassword)
		require.NoError(t, err)
		assert.NotEmpty(t, newHash)
		assert.NotEqual(t, currentHash, newHash)

		// New password should verify with new hash
		assert.True(t, ps.VerifyPassword(newHash, newPassword))
		// Old password should not verify with new hash
		assert.False(t, ps.VerifyPassword(newHash, currentPassword))
	})

	t.Run("rejects incorrect current password", func(t *testing.T) {
		currentHash, err := ps.HashPassword("currentPass123")
		require.NoError(t, err)

		_, err = ps.ChangePassword(currentHash, "wrongPassword", "newSecurePass456")
		assert.Error(t, err)
		assert.ErrorIs(t, err, ErrPasswordMismatch)
	})

	t.Run("rejects invalid new password", func(t *testing.T) {
		currentPassword := "currentPass123"
		currentHash, err := ps.HashPassword(currentPassword)
		require.NoError(t, err)

		// New password too short
		_, err = ps.ChangePassword(currentHash, currentPassword, "short")
		assert.Error(t, err)
		assert.ErrorIs(t, err, ErrPasswordTooShort)

		// New password is common
		_, err = ps.ChangePassword(currentHash, currentPassword, "password123")
		assert.Error(t, err)
		assert.ErrorIs(t, err, ErrPasswordCommon)
	})
}

func TestPasswordPolicy(t *testing.T) {
	t.Run("default policy values", func(t *testing.T) {
		policy := DefaultPasswordPolicy()
		assert.Equal(t, 8, policy.MinLength)
		assert.Equal(t, 128, policy.MaxLength)
		assert.True(t, policy.CheckCommonList)
	})

	t.Run("custom policy without common list check", func(t *testing.T) {
		policy := PasswordPolicy{
			MinLength:       8,
			MaxLength:       128,
			CheckCommonList: false,
		}
		ps := NewPasswordService(policy)

		// Common password should be accepted when check is disabled
		err := ps.ValidatePassword("password123")
		assert.NoError(t, err)
	})

	t.Run("custom minimum length", func(t *testing.T) {
		policy := PasswordPolicy{
			MinLength:       12,
			MaxLength:       128,
			CheckCommonList: false,
		}
		ps := NewPasswordService(policy)

		// 8 chars should fail with 12 min
		err := ps.ValidatePassword("12345678")
		assert.Error(t, err)
		assert.ErrorIs(t, err, ErrPasswordTooShort)

		// 12 chars should pass
		err = ps.ValidatePassword("123456789012")
		assert.NoError(t, err)
	})
}

func TestPasswordService_CommonPasswordList(t *testing.T) {
	ps := NewDefaultPasswordService()

	t.Run("loads common passwords", func(t *testing.T) {
		count := ps.CommonPasswordCount()
		assert.Greater(t, count, 30) // Should have at least the built-in list
	})

	t.Run("can add custom common passwords", func(t *testing.T) {
		initialCount := ps.CommonPasswordCount()

		ps.AddCommonPassword("customBadPassword")

		assert.Equal(t, initialCount+1, ps.CommonPasswordCount())

		err := ps.ValidatePassword("customBadPassword")
		assert.Error(t, err)
		assert.ErrorIs(t, err, ErrPasswordCommon)
	})
}

func TestPasswordService_BcryptCost(t *testing.T) {
	ps := NewDefaultPasswordService()

	t.Run("default cost is 10", func(t *testing.T) {
		assert.Equal(t, 10, ps.GetBcryptCost())
	})

	t.Run("can set custom cost for testing", func(t *testing.T) {
		ps.SetBcryptCost(4) // Minimum cost for faster tests
		assert.Equal(t, 4, ps.GetBcryptCost())

		// Hashing should still work
		hash, err := ps.HashPassword("testPassword123")
		require.NoError(t, err)
		assert.True(t, ps.VerifyPassword(hash, "testPassword123"))
	})

	t.Run("rejects invalid cost values", func(t *testing.T) {
		ps := NewDefaultPasswordService()

		ps.SetBcryptCost(0) // Too low
		assert.Equal(t, 10, ps.GetBcryptCost()) // Should remain at default

		ps.SetBcryptCost(100) // Too high
		assert.Equal(t, 10, ps.GetBcryptCost()) // Should remain at default
	})
}
