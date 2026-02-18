package auth

import (
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestInMemoryAuditLogger(t *testing.T) {
	t.Run("logs events", func(t *testing.T) {
		logger := NewInMemoryAuditLogger(100)

		userID := "user-123"
		username := "testuser"
		err := logger.Log(context.Background(), AuditEvent{
			Type:      AuditLoginSuccess,
			UserID:    &userID,
			Username:  &username,
			IP:        "192.168.1.1",
			UserAgent: "TestBrowser/1.0",
			Timestamp: time.Now(),
		})

		assert.NoError(t, err)
		assert.Equal(t, 1, logger.Count())
	})

	t.Run("retrieves all events", func(t *testing.T) {
		logger := NewInMemoryAuditLogger(100)

		for i := 0; i < 5; i++ {
			_ = logger.Log(context.Background(), AuditEvent{
				Type:      AuditLoginSuccess,
				Timestamp: time.Now(),
			})
		}

		events := logger.GetEvents()
		assert.Len(t, events, 5)
	})

	t.Run("filters events by type", func(t *testing.T) {
		logger := NewInMemoryAuditLogger(100)

		_ = logger.Log(context.Background(), AuditEvent{Type: AuditLoginSuccess})
		_ = logger.Log(context.Background(), AuditEvent{Type: AuditLoginFailure})
		_ = logger.Log(context.Background(), AuditEvent{Type: AuditLoginSuccess})
		_ = logger.Log(context.Background(), AuditEvent{Type: AuditLogout})

		successEvents := logger.GetEventsByType(AuditLoginSuccess)
		assert.Len(t, successEvents, 2)

		failureEvents := logger.GetEventsByType(AuditLoginFailure)
		assert.Len(t, failureEvents, 1)

		logoutEvents := logger.GetEventsByType(AuditLogout)
		assert.Len(t, logoutEvents, 1)
	})

	t.Run("filters events by user", func(t *testing.T) {
		logger := NewInMemoryAuditLogger(100)

		user1 := "user-1"
		user2 := "user-2"

		_ = logger.Log(context.Background(), AuditEvent{Type: AuditLoginSuccess, UserID: &user1})
		_ = logger.Log(context.Background(), AuditEvent{Type: AuditLoginSuccess, UserID: &user2})
		_ = logger.Log(context.Background(), AuditEvent{Type: AuditLogout, UserID: &user1})

		user1Events := logger.GetEventsByUser("user-1")
		assert.Len(t, user1Events, 2)

		user2Events := logger.GetEventsByUser("user-2")
		assert.Len(t, user2Events, 1)
	})

	t.Run("respects max length", func(t *testing.T) {
		logger := NewInMemoryAuditLogger(5)

		// Log more events than max
		for i := 0; i < 10; i++ {
			_ = logger.Log(context.Background(), AuditEvent{
				Type:      AuditLoginSuccess,
				Timestamp: time.Now(),
			})
		}

		// Should only keep the last 5
		assert.Equal(t, 5, logger.Count())
	})

	t.Run("clears events", func(t *testing.T) {
		logger := NewInMemoryAuditLogger(100)

		_ = logger.Log(context.Background(), AuditEvent{Type: AuditLoginSuccess})
		_ = logger.Log(context.Background(), AuditEvent{Type: AuditLoginSuccess})

		assert.Equal(t, 2, logger.Count())

		logger.Clear()

		assert.Equal(t, 0, logger.Count())
	})

	t.Run("returns copy of events", func(t *testing.T) {
		logger := NewInMemoryAuditLogger(100)

		_ = logger.Log(context.Background(), AuditEvent{Type: AuditLoginSuccess})

		events := logger.GetEvents()
		events[0].Type = "modified"

		// Original should be unchanged
		originalEvents := logger.GetEvents()
		assert.Equal(t, AuditLoginSuccess, originalEvents[0].Type)
	})
}

func TestMultiAuditLogger(t *testing.T) {
	t.Run("logs to multiple loggers", func(t *testing.T) {
		logger1 := NewInMemoryAuditLogger(100)
		logger2 := NewInMemoryAuditLogger(100)

		multi := NewMultiAuditLogger(logger1, logger2)

		err := multi.Log(context.Background(), AuditEvent{
			Type: AuditLoginSuccess,
		})

		assert.NoError(t, err)
		assert.Equal(t, 1, logger1.Count())
		assert.Equal(t, 1, logger2.Count())
	})

	t.Run("handles empty loggers", func(t *testing.T) {
		multi := NewMultiAuditLogger()

		err := multi.Log(context.Background(), AuditEvent{
			Type: AuditLoginSuccess,
		})

		assert.NoError(t, err)
	})
}

func TestNullAuditLogger(t *testing.T) {
	t.Run("discards events silently", func(t *testing.T) {
		logger := NewNullAuditLogger()

		err := logger.Log(context.Background(), AuditEvent{
			Type: AuditLoginSuccess,
		})

		assert.NoError(t, err)
	})
}

func TestSanitizeDetails(t *testing.T) {
	t.Run("redacts sensitive fields", func(t *testing.T) {
		details := map[string]interface{}{
			"username":   "testuser",
			"password":   "secret123",
			"token":      "eyJhbGc...",
			"api_key":    "nas_abc123",
			"secret":     "confidential",
			"safe_field": "visible",
		}

		sanitized := sanitizeDetails(details)

		assert.Equal(t, "testuser", sanitized["username"])
		assert.Equal(t, "[REDACTED]", sanitized["password"])
		assert.Equal(t, "[REDACTED]", sanitized["token"])
		assert.Equal(t, "[REDACTED]", sanitized["api_key"])
		assert.Equal(t, "[REDACTED]", sanitized["secret"])
		assert.Equal(t, "visible", sanitized["safe_field"])
	})

	t.Run("handles nil details", func(t *testing.T) {
		sanitized := sanitizeDetails(nil)
		assert.Nil(t, sanitized)
	})

	t.Run("handles empty details", func(t *testing.T) {
		sanitized := sanitizeDetails(map[string]interface{}{})
		assert.NotNil(t, sanitized)
		assert.Empty(t, sanitized)
	})
}

func TestLoggerAuditLogger(t *testing.T) {
	t.Run("creates logger with prefix", func(t *testing.T) {
		logger := NewLoggerAuditLogger("AUDIT")
		assert.NotNil(t, logger)
		assert.Equal(t, "AUDIT", logger.prefix)
	})

	t.Run("logs without error", func(t *testing.T) {
		logger := NewLoggerAuditLogger("TEST")

		userID := "user-123"
		err := logger.Log(context.Background(), AuditEvent{
			Type:          AuditLoginSuccess,
			UserID:        &userID,
			IP:            "192.168.1.1",
			CorrelationID: "req-123",
			Details:       map[string]interface{}{"key": "value"},
			Timestamp:     time.Now(),
		})

		assert.NoError(t, err)
	})

	t.Run("handles anonymous user", func(t *testing.T) {
		logger := NewLoggerAuditLogger("TEST")

		err := logger.Log(context.Background(), AuditEvent{
			Type:      AuditLoginFailure,
			IP:        "192.168.1.1",
			Timestamp: time.Now(),
		})

		assert.NoError(t, err)
	})
}

func TestAuditEventTypes(t *testing.T) {
	t.Run("audit event type constants are defined", func(t *testing.T) {
		assert.Equal(t, "auth.login.success", AuditLoginSuccess)
		assert.Equal(t, "auth.login.failure", AuditLoginFailure)
		assert.Equal(t, "auth.logout", AuditLogout)
		assert.Equal(t, "auth.password.change", AuditPasswordChange)
		assert.Equal(t, "auth.password.change.failure", AuditPasswordFailure)
		assert.Equal(t, "auth.session.revoked", AuditSessionRevoked)
		assert.Equal(t, "auth.permission.denied", AuditPermissionDenied)
		assert.Equal(t, "auth.rate.limited", AuditRateLimited)
		assert.Equal(t, "apikey.created", AuditAPIKeyCreated)
		assert.Equal(t, "apikey.revoked", AuditAPIKeyRevoked)
		assert.Equal(t, "apikey.used", AuditAPIKeyUsed)
	})
}
