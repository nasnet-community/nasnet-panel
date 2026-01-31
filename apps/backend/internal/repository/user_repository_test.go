package repository_test

import (
	"context"
	"testing"

	"backend/internal/repository"
	"backend/pkg/ulid"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"golang.org/x/crypto/bcrypt"
)

// TestUserRepository_Create tests user creation with password hashing.
func TestUserRepository_Create(t *testing.T) {
	client := setupTestDB(t)
	ctx := context.Background()

	repo := repository.NewUserRepository(repository.UserRepositoryConfig{
		Client: client,
	})

	t.Run("creates user with hashed password", func(t *testing.T) {
		input := repository.CreateUserInput{
			Username:    "testuser",
			Email:       "test@example.com",
			DisplayName: "Test User",
			Password:    "securepassword123",
			Role:        repository.UserRoleViewer,
		}

		user, err := repo.Create(ctx, input)
		require.NoError(t, err)
		require.NotNil(t, user)

		// Verify username
		assert.Equal(t, "testuser", user.Username)

		// Verify password is hashed (not plaintext)
		assert.NotEqual(t, "securepassword123", user.PasswordHash)
		assert.NotEmpty(t, user.PasswordHash)

		// Verify hash can be verified with bcrypt
		err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte("securepassword123"))
		assert.NoError(t, err, "bcrypt should verify the password")
	})

	t.Run("applies default settings", func(t *testing.T) {
		input := repository.CreateUserInput{
			Username: "defaultsettings",
			Password: "securepassword123",
			Role:     repository.UserRoleViewer,
		}

		user, err := repo.Create(ctx, input)
		require.NoError(t, err)
		require.NotNil(t, user)

		// Verify role is applied (viewer is default)
		assert.Equal(t, "viewer", string(user.Role))
	})

	t.Run("returns ErrDuplicate for duplicate username", func(t *testing.T) {
		input := repository.CreateUserInput{
			Username: "duplicatetest",
			Password: "securepassword123",
			Role:     repository.UserRoleViewer,
		}

		// First creation should succeed
		_, err := repo.Create(ctx, input)
		require.NoError(t, err)

		// Second creation should fail with ErrDuplicate
		_, err = repo.Create(ctx, input)
		require.Error(t, err)
		assert.True(t, repository.IsDuplicate(err), "should be duplicate error")
	})

	t.Run("validates password length", func(t *testing.T) {
		// Too short
		input := repository.CreateUserInput{
			Username: "shortpw",
			Password: "short",
			Role:     repository.UserRoleViewer,
		}

		_, err := repo.Create(ctx, input)
		require.Error(t, err)
		assert.True(t, repository.IsInvalidInput(err), "should be invalid input error")
		assert.Contains(t, err.Error(), "8 characters")
	})

	t.Run("validates empty username", func(t *testing.T) {
		input := repository.CreateUserInput{
			Username: "",
			Password: "securepassword123",
			Role:     repository.UserRoleViewer,
		}

		_, err := repo.Create(ctx, input)
		require.Error(t, err)
		assert.True(t, repository.IsInvalidInput(err))
	})
}

// TestUserRepository_GetByUsername tests user lookup by username.
func TestUserRepository_GetByUsername(t *testing.T) {
	client := setupTestDB(t)
	ctx := context.Background()

	repo := repository.NewUserRepository(repository.UserRepositoryConfig{
		Client: client,
	})

	t.Run("returns user by username", func(t *testing.T) {
		// Create test user
		input := repository.CreateUserInput{
			Username: "findme",
			Password: "securepassword123",
			Role:     repository.UserRoleOperator,
		}
		created, err := repo.Create(ctx, input)
		require.NoError(t, err)

		// Find by username
		found, err := repo.GetByUsername(ctx, "findme")
		require.NoError(t, err)
		require.NotNil(t, found)

		assert.Equal(t, created.ID, found.ID)
		assert.Equal(t, "findme", found.Username)
	})

	t.Run("returns ErrNotFound for non-existent user", func(t *testing.T) {
		_, err := repo.GetByUsername(ctx, "nonexistent")
		require.Error(t, err)
		assert.True(t, repository.IsNotFound(err), "should be not found error")
	})
}

// TestUserRepository_VerifyPassword tests password verification.
func TestUserRepository_VerifyPassword(t *testing.T) {
	client := setupTestDB(t)
	ctx := context.Background()

	repo := repository.NewUserRepository(repository.UserRepositoryConfig{
		Client: client,
	})

	// Create test user
	input := repository.CreateUserInput{
		Username: "pwverify",
		Password: "correctpassword",
		Role:     repository.UserRoleViewer,
	}
	user, err := repo.Create(ctx, input)
	require.NoError(t, err)

	userID, err := ulid.Parse(user.ID)
	require.NoError(t, err)

	t.Run("returns nil for correct password", func(t *testing.T) {
		err := repo.VerifyPassword(ctx, userID, "correctpassword")
		assert.NoError(t, err)
	})

	t.Run("returns ErrInvalidCredentials for wrong password", func(t *testing.T) {
		err := repo.VerifyPassword(ctx, userID, "wrongpassword")
		require.Error(t, err)
		assert.True(t, repository.IsInvalidCredentials(err), "should be invalid credentials error")
	})
}

// TestUserRepository_UpdatePassword tests password update.
func TestUserRepository_UpdatePassword(t *testing.T) {
	client := setupTestDB(t)
	ctx := context.Background()

	repo := repository.NewUserRepository(repository.UserRepositoryConfig{
		Client: client,
	})

	// Create test user
	input := repository.CreateUserInput{
		Username: "pwupdate",
		Password: "oldpassword123",
		Role:     repository.UserRoleViewer,
	}
	user, err := repo.Create(ctx, input)
	require.NoError(t, err)

	userID, err := ulid.Parse(user.ID)
	require.NoError(t, err)

	t.Run("updates password with new hash", func(t *testing.T) {
		err := repo.UpdatePassword(ctx, userID, "newpassword456")
		require.NoError(t, err)

		// Old password should fail
		err = repo.VerifyPassword(ctx, userID, "oldpassword123")
		assert.Error(t, err)

		// New password should work
		err = repo.VerifyPassword(ctx, userID, "newpassword456")
		assert.NoError(t, err)
	})
}

// TestUserRepository_GetWithSessions tests eager loading of sessions.
func TestUserRepository_GetWithSessions(t *testing.T) {
	client := setupTestDB(t)
	ctx := context.Background()

	repo := repository.NewUserRepository(repository.UserRepositoryConfig{
		Client: client,
	})

	// Create test user
	input := repository.CreateUserInput{
		Username: "withsessions",
		Password: "securepassword123",
		Role:     repository.UserRoleViewer,
	}
	user, err := repo.Create(ctx, input)
	require.NoError(t, err)

	userID, err := ulid.Parse(user.ID)
	require.NoError(t, err)

	t.Run("returns user with sessions eager loaded", func(t *testing.T) {
		result, err := repo.GetWithSessions(ctx, userID)
		require.NoError(t, err)
		require.NotNil(t, result)

		// Sessions edge should be loaded (even if empty)
		sessions := result.Edges.Sessions
		assert.NotNil(t, sessions) // Will be empty slice, but not nil after eager load
	})

	t.Run("returns ErrNotFound for non-existent user", func(t *testing.T) {
		nonExistentID := ulid.New()
		_, err := repo.GetWithSessions(ctx, nonExistentID)
		require.Error(t, err)
		assert.True(t, repository.IsNotFound(err))
	})
}
