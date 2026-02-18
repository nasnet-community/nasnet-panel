package repository_test

import (
	"errors"
	"testing"

	"backend/internal/repository"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestSentinelErrors verifies that sentinel errors are properly defined.
func TestSentinelErrors(t *testing.T) {
	t.Run("ErrNotFound is defined", func(t *testing.T) {
		assert.NotNil(t, repository.ErrNotFound)
		assert.Equal(t, "entity not found", repository.ErrNotFound.Error())
	})

	t.Run("ErrDuplicate is defined", func(t *testing.T) {
		assert.NotNil(t, repository.ErrDuplicate)
		assert.Equal(t, "duplicate entity", repository.ErrDuplicate.Error())
	})

	t.Run("ErrConcurrentModification is defined", func(t *testing.T) {
		assert.NotNil(t, repository.ErrConcurrentModification)
		assert.Equal(t, "concurrent modification detected", repository.ErrConcurrentModification.Error())
	})

	t.Run("ErrResourceLocked is defined", func(t *testing.T) {
		assert.NotNil(t, repository.ErrResourceLocked)
		assert.Equal(t, "resource is locked", repository.ErrResourceLocked.Error())
	})

	t.Run("ErrInvalidInput is defined", func(t *testing.T) {
		assert.NotNil(t, repository.ErrInvalidInput)
		assert.Equal(t, "invalid input", repository.ErrInvalidInput.Error())
	})

	t.Run("ErrInvalidCredentials is defined", func(t *testing.T) {
		assert.NotNil(t, repository.ErrInvalidCredentials)
		assert.Equal(t, "invalid credentials", repository.ErrInvalidCredentials.Error())
	})

	t.Run("ErrTransactionFailed is defined", func(t *testing.T) {
		assert.NotNil(t, repository.ErrTransactionFailed)
		assert.Equal(t, "transaction failed", repository.ErrTransactionFailed.Error())
	})
}

// TestErrorConstructors verifies error constructors create proper errors.
func TestErrorConstructors(t *testing.T) {
	t.Run("NotFound creates ErrNotFound with context", func(t *testing.T) {
		err := repository.NotFound("Router", "123")

		// Should be ErrNotFound
		assert.True(t, errors.Is(err, repository.ErrNotFound))

		// Should contain context in message
		assert.Contains(t, err.Error(), "Router")
		assert.Contains(t, err.Error(), "123")
	})

	t.Run("NotFoundWithField creates ErrNotFound with field context", func(t *testing.T) {
		err := repository.NotFoundWithField("User", "username", "testuser")

		assert.True(t, errors.Is(err, repository.ErrNotFound))
		assert.Contains(t, err.Error(), "User")
		assert.Contains(t, err.Error(), "username")
		assert.Contains(t, err.Error(), "testuser")
	})

	t.Run("Duplicate creates ErrDuplicate with context", func(t *testing.T) {
		err := repository.Duplicate("Router", "host:port", "192.168.1.1:8728")

		assert.True(t, errors.Is(err, repository.ErrDuplicate))
		assert.Contains(t, err.Error(), "Router")
		assert.Contains(t, err.Error(), "host:port")
		assert.Contains(t, err.Error(), "192.168.1.1:8728")
	})

	t.Run("ConcurrentModification creates error with version info", func(t *testing.T) {
		err := repository.ConcurrentModification("Router", "123", 3, 2)

		assert.True(t, errors.Is(err, repository.ErrConcurrentModification))
		assert.Contains(t, err.Error(), "Router")
		assert.Contains(t, err.Error(), "123")
		assert.Contains(t, err.Error(), "version")
	})

	t.Run("ResourceLocked creates error with holder info", func(t *testing.T) {
		err := repository.ResourceLocked("Router", "123", "backup operation")

		assert.True(t, errors.Is(err, repository.ErrResourceLocked))
		assert.Contains(t, err.Error(), "Router")
		assert.Contains(t, err.Error(), "123")
		assert.Contains(t, err.Error(), "backup operation")
	})

	t.Run("InvalidInput creates error with field info", func(t *testing.T) {
		err := repository.InvalidInput("CreateRouterInput", "host", "cannot be empty")

		assert.True(t, errors.Is(err, repository.ErrInvalidInput))
		assert.Contains(t, err.Error(), "CreateRouterInput")
		assert.Contains(t, err.Error(), "host")
		assert.Contains(t, err.Error(), "cannot be empty")
	})

	t.Run("InvalidInputWithValue creates error with value", func(t *testing.T) {
		err := repository.InvalidInputWithValue("CreateRouterInput", "port", 0, "must be between 1 and 65535")

		assert.True(t, errors.Is(err, repository.ErrInvalidInput))
		assert.Contains(t, err.Error(), "CreateRouterInput")
		assert.Contains(t, err.Error(), "port")
		assert.Contains(t, err.Error(), "0")
	})

	t.Run("TransactionFailed wraps underlying error", func(t *testing.T) {
		cause := errors.New("connection lost")
		err := repository.TransactionFailed("CreateRouterWithSecrets", cause)

		assert.True(t, errors.Is(err, repository.ErrTransactionFailed))
		assert.Contains(t, err.Error(), "CreateRouterWithSecrets")
		assert.Contains(t, err.Error(), "connection lost")
	})
}

// TestErrorUnwrap verifies errors can be unwrapped properly.
func TestErrorUnwrap(t *testing.T) {
	t.Run("errors.Is works with wrapped errors", func(t *testing.T) {
		err := repository.NotFound("Router", "123")

		// Should work with errors.Is
		assert.True(t, errors.Is(err, repository.ErrNotFound))
		assert.False(t, errors.Is(err, repository.ErrDuplicate))
	})

	t.Run("errors.As extracts RepositoryError", func(t *testing.T) {
		err := repository.Duplicate("User", "username", "testuser")

		var repoErr *repository.Error
		require.True(t, errors.As(err, &repoErr))

		assert.Equal(t, "User", repoErr.Entity)
		assert.Equal(t, "username", repoErr.Field)
		assert.Equal(t, "testuser", repoErr.Value)
	})
}

// TestErrorTypeChecks verifies type check helper functions.
func TestErrorTypeChecks(t *testing.T) {
	testCases := []struct {
		name     string
		err      error
		checkFn  func(error) bool
		expected bool
	}{
		{
			name:     "IsNotFound returns true for ErrNotFound",
			err:      repository.NotFound("Router", "123"),
			checkFn:  repository.IsNotFound,
			expected: true,
		},
		{
			name:     "IsNotFound returns false for ErrDuplicate",
			err:      repository.Duplicate("Router", "host", "x"),
			checkFn:  repository.IsNotFound,
			expected: false,
		},
		{
			name:     "IsDuplicate returns true for ErrDuplicate",
			err:      repository.Duplicate("User", "username", "test"),
			checkFn:  repository.IsDuplicate,
			expected: true,
		},
		{
			name:     "IsConcurrentModification returns true for concurrent mod error",
			err:      repository.ConcurrentModification("Router", "123", 2, 1),
			checkFn:  repository.IsConcurrentModification,
			expected: true,
		},
		{
			name:     "IsResourceLocked returns true for locked error",
			err:      repository.ResourceLocked("Router", "123", "backup"),
			checkFn:  repository.IsResourceLocked,
			expected: true,
		},
		{
			name:     "IsInvalidInput returns true for invalid input error",
			err:      repository.InvalidInput("Input", "field", "reason"),
			checkFn:  repository.IsInvalidInput,
			expected: true,
		},
		{
			name:     "IsTransactionFailed returns true for transaction error",
			err:      repository.TransactionFailed("op", errors.New("cause")),
			checkFn:  repository.IsTransactionFailed,
			expected: true,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			result := tc.checkFn(tc.err)
			assert.Equal(t, tc.expected, result)
		})
	}
}

// TestGetErrorDetails verifies error details extraction.
func TestGetErrorDetails(t *testing.T) {
	t.Run("returns details for RepositoryError", func(t *testing.T) {
		err := repository.Duplicate("Router", "host:port", "192.168.1.1:8728")

		details := repository.GetErrorDetails(err)
		require.NotNil(t, details)

		assert.Equal(t, "Router", details.Entity)
		assert.Equal(t, "host:port", details.Field)
		assert.Equal(t, "192.168.1.1:8728", details.Value)
	})

	t.Run("returns nil for non-RepositoryError", func(t *testing.T) {
		err := errors.New("plain error")

		details := repository.GetErrorDetails(err)
		assert.Nil(t, details)
	})
}
