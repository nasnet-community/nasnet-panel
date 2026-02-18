package auth

import (
	"context"
	"log"
	"sync"
	"time"
)

// Audit event types for authentication
const (
	AuditLoginSuccess     = "auth.login.success"
	AuditLoginFailure     = "auth.login.failure"
	AuditLogout           = "auth.logout"
	AuditPasswordChange   = "auth.password.change"
	AuditPasswordFailure  = "auth.password.change.failure"
	AuditSessionRevoked   = "auth.session.revoked"
	AuditPermissionDenied = "auth.permission.denied"
	AuditRateLimited      = "auth.rate.limited"
	AuditAPIKeyCreated    = "apikey.created"
	AuditAPIKeyRevoked    = "apikey.revoked"
	AuditAPIKeyUsed       = "apikey.used"
)

// LoggerAuditLogger implements AuditLogger using standard logging
// This is a simple implementation that logs to stdout/stderr
// For production, consider using a persistent audit store
type LoggerAuditLogger struct {
	prefix string
}

// NewLoggerAuditLogger creates a new logger-based audit logger
func NewLoggerAuditLogger(prefix string) *LoggerAuditLogger {
	return &LoggerAuditLogger{prefix: prefix}
}

// Log logs an audit event
func (l *LoggerAuditLogger) Log(ctx context.Context, event AuditEvent) error {
	// Format: [AUDIT] timestamp type user_id ip details
	userID := "anonymous"
	if event.UserID != nil {
		userID = *event.UserID
	}

	log.Printf("[%s] %s type=%s user=%s ip=%s correlation=%s details=%v",
		l.prefix,
		event.Timestamp.Format(time.RFC3339),
		event.Type,
		userID,
		event.IP,
		event.CorrelationID,
		sanitizeDetails(event.Details),
	)
	return nil
}

// sanitizeDetails removes sensitive data from audit details
func sanitizeDetails(details map[string]interface{}) map[string]interface{} {
	if details == nil {
		return nil
	}

	sanitized := make(map[string]interface{})
	for k, v := range details {
		// Never log passwords or tokens
		switch k {
		case "password", "current_password", "new_password", "token", "secret", "api_key":
			sanitized[k] = "[REDACTED]"
		default:
			sanitized[k] = v
		}
	}
	return sanitized
}

// InMemoryAuditLogger stores audit events in memory (for testing)
type InMemoryAuditLogger struct {
	mu     sync.RWMutex
	events []AuditEvent
	maxLen int
}

// NewInMemoryAuditLogger creates a new in-memory audit logger
func NewInMemoryAuditLogger(maxEvents int) *InMemoryAuditLogger {
	return &InMemoryAuditLogger{
		events: make([]AuditEvent, 0, maxEvents),
		maxLen: maxEvents,
	}
}

// Log logs an audit event to memory
func (l *InMemoryAuditLogger) Log(ctx context.Context, event AuditEvent) error {
	l.mu.Lock()
	defer l.mu.Unlock()

	// Append event
	l.events = append(l.events, event)

	// Trim if exceeds max
	if len(l.events) > l.maxLen {
		l.events = l.events[len(l.events)-l.maxLen:]
	}

	return nil
}

// GetEvents returns all stored events (for testing)
func (l *InMemoryAuditLogger) GetEvents() []AuditEvent {
	l.mu.RLock()
	defer l.mu.RUnlock()

	// Return a copy
	result := make([]AuditEvent, len(l.events))
	copy(result, l.events)
	return result
}

// GetEventsByType returns events of a specific type
func (l *InMemoryAuditLogger) GetEventsByType(eventType string) []AuditEvent {
	l.mu.RLock()
	defer l.mu.RUnlock()

	var result []AuditEvent
	for _, e := range l.events {
		if e.Type == eventType {
			result = append(result, e)
		}
	}
	return result
}

// GetEventsByUser returns events for a specific user
func (l *InMemoryAuditLogger) GetEventsByUser(userID string) []AuditEvent {
	l.mu.RLock()
	defer l.mu.RUnlock()

	var result []AuditEvent
	for _, e := range l.events {
		if e.UserID != nil && *e.UserID == userID {
			result = append(result, e)
		}
	}
	return result
}

// Clear clears all stored events
func (l *InMemoryAuditLogger) Clear() {
	l.mu.Lock()
	defer l.mu.Unlock()
	l.events = l.events[:0]
}

// Count returns the number of stored events
func (l *InMemoryAuditLogger) Count() int {
	l.mu.RLock()
	defer l.mu.RUnlock()
	return len(l.events)
}

// MultiAuditLogger sends events to multiple loggers
type MultiAuditLogger struct {
	loggers []AuditLogger
}

// NewMultiAuditLogger creates a new multi audit logger
func NewMultiAuditLogger(loggers ...AuditLogger) *MultiAuditLogger {
	return &MultiAuditLogger{loggers: loggers}
}

// Log logs an event to all configured loggers
func (m *MultiAuditLogger) Log(ctx context.Context, event AuditEvent) error {
	var lastErr error
	for _, logger := range m.loggers {
		if err := logger.Log(ctx, event); err != nil {
			lastErr = err
		}
	}
	return lastErr
}

// NullAuditLogger discards all events (for when audit is disabled)
type NullAuditLogger struct{}

// NewNullAuditLogger creates a new null audit logger
func NewNullAuditLogger() *NullAuditLogger {
	return &NullAuditLogger{}
}

// Log discards the event
func (n *NullAuditLogger) Log(ctx context.Context, event AuditEvent) error {
	return nil
}
