package auth

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/oklog/ulid/v2"
	"go.uber.org/zap"
)

// Service errors
var (
	ErrUserNotFound    = errors.New("user not found")
	ErrUserExists      = errors.New("username already exists")
	ErrSessionNotFound = errors.New("session not found")
	ErrSessionRevoked  = errors.New("session has been revoked")
)

// User represents a user in the system
type User struct {
	ID              string
	Username        string
	Email           string
	DisplayName     string
	PasswordHash    string
	Role            Role
	Active          bool
	MFAEnabled      bool
	LastLogin       *time.Time
	PasswordChanged time.Time
	CreatedAt       time.Time
	UpdatedAt       time.Time
}

// Session represents an active user session
type Session struct {
	ID            string
	UserID        string
	TokenID       string
	TokenFamily   string
	UserAgent     string
	IPAddress     string
	ExpiresAt     time.Time
	LastActivity  time.Time
	Revoked       bool
	RevokedAt     *time.Time
	RevokedReason string
	CreatedAt     time.Time
}

// UserRepository defines the interface for user data access
type UserRepository interface {
	// GetByID retrieves a user by ID
	GetByID(ctx context.Context, id string) (*User, error)
	// GetByUsername retrieves a user by username
	GetByUsername(ctx context.Context, username string) (*User, error)
	// Create creates a new user
	Create(ctx context.Context, user *User) error
	// Update updates an existing user
	Update(ctx context.Context, user *User) error
	// UpdateLastLogin updates the user's last login timestamp
	UpdateLastLogin(ctx context.Context, userID string, loginTime time.Time) error
	// UpdatePassword updates the user's password hash
	UpdatePassword(ctx context.Context, userID string, passwordHash string) error
}

// SessionRepository defines the interface for session data access
type SessionRepository interface {
	// GetByID retrieves a session by ID
	GetByID(ctx context.Context, id string) (*Session, error)
	// GetByTokenID retrieves a session by token ID (jti)
	GetByTokenID(ctx context.Context, tokenID string) (*Session, error)
	// Create creates a new session
	Create(ctx context.Context, session *Session) error
	// UpdateLastActivity updates the session's last activity time
	UpdateLastActivity(ctx context.Context, sessionID string, activityTime time.Time) error
	// Revoke revokes a session
	Revoke(ctx context.Context, sessionID string, reason string) error
	// RevokeAllForUser revokes all sessions for a user
	RevokeAllForUser(ctx context.Context, userID string, reason string) error
	// RevokeAllForUserExcept revokes all sessions for a user except the specified one
	RevokeAllForUserExcept(ctx context.Context, userID string, exceptSessionID string, reason string) error
	// GetActiveForUser retrieves all active sessions for a user
	GetActiveForUser(ctx context.Context, userID string) ([]*Session, error)
	// CleanExpired removes expired sessions
	CleanExpired(ctx context.Context) (int, error)
}

// AuditEvent represents an audit event
type AuditEvent struct {
	Type          string
	UserID        *string
	Username      *string
	IP            string
	UserAgent     string
	CorrelationID string
	Details       map[string]interface{}
	Timestamp     time.Time
}

// AuditLogger defines the interface for audit logging
type AuditLogger interface {
	// Log logs an audit event
	Log(ctx context.Context, event AuditEvent) error
}

// Config configures the auth service
type Config struct {
	JWTService        *JWTService
	PasswordService   *PasswordService
	UserRepository    UserRepository
	SessionRepository SessionRepository
	AuditLogger       AuditLogger
	Logger            *zap.Logger // Optional structured logger
}

// Service orchestrates authentication operations
type Service struct {
	jwt      *JWTService
	password *PasswordService
	users    UserRepository
	sessions SessionRepository
	audit    AuditLogger
	logger   *zap.Logger
}

// NewService creates a new authentication service
func NewService(config Config) (*Service, error) {
	if config.JWTService == nil {
		return nil, errors.New("JWT service is required")
	}
	if config.PasswordService == nil {
		config.PasswordService = NewDefaultPasswordService()
	}
	if config.UserRepository == nil {
		return nil, errors.New("user repository is required")
	}
	if config.SessionRepository == nil {
		return nil, errors.New("session repository is required")
	}

	// Use provided logger or no-op logger if not provided
	logger := config.Logger
	if logger == nil {
		logger = zap.NewNop()
	}

	return &Service{
		jwt:      config.JWTService,
		password: config.PasswordService,
		users:    config.UserRepository,
		sessions: config.SessionRepository,
		audit:    config.AuditLogger,
		logger:   logger,
	}, nil
}

// LoginInput contains the information needed to login
type LoginInput struct {
	Username  string
	Password  string //nolint:gosec // G101: credential field required for authentication
	IP        string
	UserAgent string
}

// LoginResult contains the result of a successful login
type LoginResult struct {
	Token     string
	User      *User
	Session   *Session
	ExpiresAt time.Time
}

// Login authenticates a user and creates a new session
func (s *Service) Login(ctx context.Context, input LoginInput) (*LoginResult, error) {
	// Validate input
	if input.Username == "" || input.Password == "" {
		return nil, ErrInvalidCredentials
	}

	// Get user by username
	user, err := s.users.GetByUsername(ctx, input.Username)
	if err != nil {
		// Log failure (but don't reveal if user exists)
		s.logAuditEvent(ctx, "auth.login.failure", nil, &input.Username, input.IP, input.UserAgent, map[string]interface{}{
			"reason": "user_not_found",
		})
		return nil, ErrInvalidCredentials
	}

	// Check if user is active
	if !user.Active {
		s.logAuditEvent(ctx, "auth.login.failure", &user.ID, &user.Username, input.IP, input.UserAgent, map[string]interface{}{
			"reason": "user_inactive",
		})
		return nil, ErrInvalidCredentials
	}

	// Verify password
	if !s.password.VerifyPassword(user.PasswordHash, input.Password) {
		s.logAuditEvent(ctx, "auth.login.failure", &user.ID, &user.Username, input.IP, input.UserAgent, map[string]interface{}{
			"reason": "invalid_password",
		})
		return nil, ErrInvalidCredentials
	}

	// Create session
	sessionID := ulid.Make().String()
	now := time.Now()
	expiresAt := now.Add(s.jwt.config.SessionDuration)

	session := &Session{
		ID:           sessionID,
		UserID:       user.ID,
		TokenID:      ulid.Make().String(),
		UserAgent:    input.UserAgent,
		IPAddress:    input.IP,
		ExpiresAt:    expiresAt,
		LastActivity: now,
		Revoked:      false,
		CreatedAt:    now,
	}

	if authErr := s.sessions.Create(ctx, session); authErr != nil {
		return nil, fmt.Errorf("create session: %w", authErr)
	}

	// Generate JWT token
	token, tokenExpiresAt, err := s.jwt.GenerateToken(TokenInput{
		UserID:    user.ID,
		Username:  user.Username,
		Role:      user.Role,
		SessionID: sessionID,
	})
	if err != nil {
		return nil, fmt.Errorf("generate JWT token: %w", err)
	}

	// Update last login (ignore errors, this is best-effort)
	if err := s.users.UpdateLastLogin(ctx, user.ID, now); err != nil {
		_ = err
	}

	// Log success
	s.logAuditEvent(ctx, "auth.login.success", &user.ID, &user.Username, input.IP, input.UserAgent, map[string]interface{}{
		"session_id": sessionID,
	})

	return &LoginResult{
		Token:     token,
		User:      user,
		Session:   session,
		ExpiresAt: tokenExpiresAt,
	}, nil
}

// Logout invalidates a session
func (s *Service) Logout(ctx context.Context, sessionID, ip, userAgent string) error {
	session, err := s.sessions.GetByID(ctx, sessionID)
	if err != nil {
		return ErrSessionNotFound
	}

	if err := s.sessions.Revoke(ctx, sessionID, "logout"); err != nil {
		return fmt.Errorf("revoke session: %w", err)
	}

	// Log logout
	s.logAuditEvent(ctx, "auth.logout", &session.UserID, nil, ip, userAgent, map[string]interface{}{
		"session_id": sessionID,
	})

	return nil
}

// ValidateSession validates a session and returns session info
func (s *Service) ValidateSession(ctx context.Context, sessionID string) (*Session, error) {
	session, err := s.sessions.GetByID(ctx, sessionID)
	if err != nil {
		return nil, ErrSessionNotFound
	}

	// Check if revoked
	if session.Revoked {
		return nil, ErrSessionRevoked
	}

	// Check if expired
	if time.Now().After(session.ExpiresAt) {
		return nil, ErrSessionExpired
	}

	// Update last activity (ignore errors, this is best-effort)
	if err := s.sessions.UpdateLastActivity(ctx, sessionID, time.Now()); err != nil {
		_ = err
	}

	return session, nil
}

// ChangePasswordInput contains the information needed to change a password
type ChangePasswordInput struct {
	UserID          string
	CurrentPassword string
	NewPassword     string
	CurrentSession  string
	IP              string
	UserAgent       string
}

// ChangePassword changes a user's password and revokes other sessions
func (s *Service) ChangePassword(ctx context.Context, input ChangePasswordInput) error {
	// Validate input
	if input.UserID == "" || input.CurrentPassword == "" || input.NewPassword == "" {
		return ErrInvalidCredentials
	}

	// Get user
	user, err := s.users.GetByID(ctx, input.UserID)
	if err != nil {
		return ErrUserNotFound
	}

	// Verify current password
	if !s.password.VerifyPassword(user.PasswordHash, input.CurrentPassword) {
		s.logAuditEvent(ctx, "auth.password.change.failure", &user.ID, &user.Username, input.IP, input.UserAgent, map[string]interface{}{
			"reason": "invalid_current_password",
		})
		return ErrPasswordMismatch
	}

	// Validate and hash new password
	newHash, err := s.password.HashPassword(input.NewPassword)
	if err != nil {
		return fmt.Errorf("hash password: %w", err)
	}

	// Update password
	if err := s.users.UpdatePassword(ctx, user.ID, newHash); err != nil {
		return fmt.Errorf("update password: %w", err)
	}

	// Revoke all other sessions (security measure)
	if input.CurrentSession != "" {
		if err := s.sessions.RevokeAllForUserExcept(ctx, user.ID, input.CurrentSession, "password_changed"); err != nil {
			_ = err
		}
	} else {
		if err := s.sessions.RevokeAllForUser(ctx, user.ID, "password_changed"); err != nil {
			_ = err
		}
	}

	// Log password change
	s.logAuditEvent(ctx, "auth.password.change", &user.ID, &user.Username, input.IP, input.UserAgent, nil)

	return nil
}

// RevokeAllSessions revokes all sessions for a user (admin operation)
func (s *Service) RevokeAllSessions(ctx context.Context, targetUserID, adminID, ip, userAgent string) error {
	// Get target user
	targetUser, err := s.users.GetByID(ctx, targetUserID)
	if err != nil {
		return ErrUserNotFound
	}

	// Revoke all sessions
	if err := s.sessions.RevokeAllForUser(ctx, targetUserID, "admin_revocation"); err != nil {
		return fmt.Errorf("revoke all sessions: %w", err)
	}

	// Log the revocation with admin context
	s.logAuditEvent(ctx, "auth.session.revoked", &targetUserID, &targetUser.Username, ip, userAgent, map[string]interface{}{
		"admin_id": adminID,
		"reason":   "admin_revocation",
	})

	return nil
}

// GetCurrentUser retrieves the current user by ID
func (s *Service) GetCurrentUser(ctx context.Context, userID string) (*User, error) {
	user, err := s.users.GetByID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("get current user: %w", err)
	}
	return user, nil
}

// GetUserSessions retrieves all active sessions for a user
func (s *Service) GetUserSessions(ctx context.Context, userID string) ([]*Session, error) {
	sessions, err := s.sessions.GetActiveForUser(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("get user sessions: %w", err)
	}
	return sessions, nil
}

// ValidatePassword validates a password against the policy
func (s *Service) ValidatePassword(password string) error {
	return s.password.ValidatePassword(password)
}

// JWTService returns the JWT service for token operations
func (s *Service) JWTService() *JWTService {
	return s.jwt
}

// PasswordService returns the password service
func (s *Service) PasswordService() *PasswordService {
	return s.password
}

// logAuditEvent logs an audit event if audit logger is configured
// Sensitive fields are automatically redacted before logging
func (s *Service) logAuditEvent(ctx context.Context, eventType string, userID, username *string, ip, userAgent string, details map[string]interface{}) {
	// Create redacted copy of details to ensure sensitive data is never logged
	redactedDetails := redactSensitiveFields(details)

	event := AuditEvent{
		Type:      eventType,
		UserID:    userID,
		Username:  username,
		IP:        ip,
		UserAgent: userAgent,
		Details:   redactedDetails,
		Timestamp: time.Now(),
	}

	// Get correlation ID from context if available
	if reqID, ok := ctx.Value("request_id").(string); ok {
		event.CorrelationID = reqID
	}

	// Log to audit logger if configured
	if s.audit != nil {
		if err := s.audit.Log(ctx, event); err != nil {
			s.logger.Error("failed to log audit event", zap.Error(err))
		}
	}
}

// redactSensitiveFields removes sensitive data from details map
func redactSensitiveFields(details map[string]interface{}) map[string]interface{} {
	if details == nil {
		return nil
	}

	redacted := make(map[string]interface{})
	sensitiveKeys := map[string]bool{
		"password":         true,
		"current_password": true,
		"new_password":     true,
		"token":            true,
		"secret":           true,
		"api_key":          true,
		"credential":       true,
		"bearer":           true,
		"key":              true,
	}

	for k, v := range details {
		if sensitiveKeys[k] {
			redacted[k] = "[REDACTED]"
		} else {
			redacted[k] = v
		}
	}
	return redacted
}
