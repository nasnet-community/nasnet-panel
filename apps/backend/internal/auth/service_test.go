package auth

import (
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// mockUserRepository implements UserRepository for testing
type mockUserRepository struct {
	users         map[string]*User
	byUsername    map[string]*User
	lastLoginTime map[string]time.Time
}

func newMockUserRepository() *mockUserRepository {
	return &mockUserRepository{
		users:         make(map[string]*User),
		byUsername:    make(map[string]*User),
		lastLoginTime: make(map[string]time.Time),
	}
}

func (r *mockUserRepository) GetByID(ctx context.Context, id string) (*User, error) {
	if u, ok := r.users[id]; ok {
		return u, nil
	}
	return nil, ErrUserNotFound
}

func (r *mockUserRepository) GetByUsername(ctx context.Context, username string) (*User, error) {
	if u, ok := r.byUsername[username]; ok {
		return u, nil
	}
	return nil, ErrUserNotFound
}

func (r *mockUserRepository) Create(ctx context.Context, user *User) error {
	r.users[user.ID] = user
	r.byUsername[user.Username] = user
	return nil
}

func (r *mockUserRepository) Update(ctx context.Context, user *User) error {
	r.users[user.ID] = user
	r.byUsername[user.Username] = user
	return nil
}

func (r *mockUserRepository) UpdateLastLogin(ctx context.Context, userID string, loginTime time.Time) error {
	r.lastLoginTime[userID] = loginTime
	if u, ok := r.users[userID]; ok {
		u.LastLogin = &loginTime
	}
	return nil
}

func (r *mockUserRepository) UpdatePassword(ctx context.Context, userID string, passwordHash string) error {
	if u, ok := r.users[userID]; ok {
		u.PasswordHash = passwordHash
		u.PasswordChanged = time.Now()
	}
	return nil
}

// mockSessionRepository implements SessionRepository for testing
type mockSessionRepository struct {
	sessions map[string]*Session
	byToken  map[string]*Session
}

func newMockSessionRepository() *mockSessionRepository {
	return &mockSessionRepository{
		sessions: make(map[string]*Session),
		byToken:  make(map[string]*Session),
	}
}

func (r *mockSessionRepository) GetByID(ctx context.Context, id string) (*Session, error) {
	if s, ok := r.sessions[id]; ok {
		return s, nil
	}
	return nil, ErrSessionNotFound
}

func (r *mockSessionRepository) GetByTokenID(ctx context.Context, tokenID string) (*Session, error) {
	if s, ok := r.byToken[tokenID]; ok {
		return s, nil
	}
	return nil, ErrSessionNotFound
}

func (r *mockSessionRepository) Create(ctx context.Context, session *Session) error {
	r.sessions[session.ID] = session
	r.byToken[session.TokenID] = session
	return nil
}

func (r *mockSessionRepository) UpdateLastActivity(ctx context.Context, sessionID string, activityTime time.Time) error {
	if s, ok := r.sessions[sessionID]; ok {
		s.LastActivity = activityTime
	}
	return nil
}

func (r *mockSessionRepository) Revoke(ctx context.Context, sessionID string, reason string) error {
	if s, ok := r.sessions[sessionID]; ok {
		s.Revoked = true
		now := time.Now()
		s.RevokedAt = &now
		s.RevokedReason = reason
	}
	return nil
}

func (r *mockSessionRepository) RevokeAllForUser(ctx context.Context, userID string, reason string) error {
	now := time.Now()
	for _, s := range r.sessions {
		if s.UserID == userID && !s.Revoked {
			s.Revoked = true
			s.RevokedAt = &now
			s.RevokedReason = reason
		}
	}
	return nil
}

func (r *mockSessionRepository) RevokeAllForUserExcept(ctx context.Context, userID string, exceptSessionID string, reason string) error {
	now := time.Now()
	for _, s := range r.sessions {
		if s.UserID == userID && s.ID != exceptSessionID && !s.Revoked {
			s.Revoked = true
			s.RevokedAt = &now
			s.RevokedReason = reason
		}
	}
	return nil
}

func (r *mockSessionRepository) GetActiveForUser(ctx context.Context, userID string) ([]*Session, error) {
	var result []*Session
	now := time.Now()
	for _, s := range r.sessions {
		if s.UserID == userID && !s.Revoked && s.ExpiresAt.After(now) {
			result = append(result, s)
		}
	}
	return result, nil
}

func (r *mockSessionRepository) CleanExpired(ctx context.Context) (int, error) {
	count := 0
	now := time.Now()
	for id, s := range r.sessions {
		if s.ExpiresAt.Before(now) {
			delete(r.sessions, id)
			delete(r.byToken, s.TokenID)
			count++
		}
	}
	return count, nil
}

// setupTestAuthService creates an AuthService with mocks for testing
func setupTestAuthService(t *testing.T) (*AuthService, *mockUserRepository, *mockSessionRepository, *InMemoryAuditLogger) {
	t.Helper()

	privateKey, publicKey, err := GenerateKeyPair()
	require.NoError(t, err)

	jwtService, err := NewJWTService(JWTConfig{
		PrivateKey:      privateKey,
		PublicKey:       publicKey,
		TokenDuration:   1 * time.Hour,
		SessionDuration: 7 * 24 * time.Hour,
		SlideThreshold:  30 * time.Minute,
		Issuer:          "test",
	})
	require.NoError(t, err)

	userRepo := newMockUserRepository()
	sessionRepo := newMockSessionRepository()
	auditLogger := NewInMemoryAuditLogger(100)

	// Lower bcrypt cost for faster tests
	passwordService := NewDefaultPasswordService()
	passwordService.SetBcryptCost(4)

	authService, err := NewAuthService(AuthServiceConfig{
		JWTService:        jwtService,
		PasswordService:   passwordService,
		UserRepository:    userRepo,
		SessionRepository: sessionRepo,
		AuditLogger:       auditLogger,
	})
	require.NoError(t, err)

	return authService, userRepo, sessionRepo, auditLogger
}

// createTestUser creates a test user with hashed password
func createTestUser(t *testing.T, userRepo *mockUserRepository, ps *PasswordService, id, username, password string, role Role) *User {
	t.Helper()

	hash, err := ps.HashPassword(password)
	require.NoError(t, err)

	user := &User{
		ID:              id,
		Username:        username,
		PasswordHash:    hash,
		Role:            role,
		Active:          true,
		PasswordChanged: time.Now(),
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}

	err = userRepo.Create(context.Background(), user)
	require.NoError(t, err)

	return user
}

func TestAuthService_Login(t *testing.T) {
	authService, userRepo, _, auditLogger := setupTestAuthService(t)

	// Create test user
	createTestUser(t, userRepo, authService.PasswordService(), "user-1", "testuser", "securePass123", RoleAdmin)

	t.Run("successful login", func(t *testing.T) {
		auditLogger.Clear()

		result, err := authService.Login(context.Background(), LoginInput{
			Username:  "testuser",
			Password:  "securePass123",
			IP:        "192.168.1.1",
			UserAgent: "TestBrowser/1.0",
		})

		require.NoError(t, err)
		assert.NotEmpty(t, result.Token)
		assert.NotNil(t, result.User)
		assert.Equal(t, "testuser", result.User.Username)
		assert.NotNil(t, result.Session)
		assert.True(t, result.ExpiresAt.After(time.Now()))

		// Check audit log
		events := auditLogger.GetEventsByType(AuditLoginSuccess)
		assert.Len(t, events, 1)
		assert.Equal(t, "192.168.1.1", events[0].IP)
	})

	t.Run("invalid username", func(t *testing.T) {
		auditLogger.Clear()

		_, err := authService.Login(context.Background(), LoginInput{
			Username:  "nonexistent",
			Password:  "anyPassword",
			IP:        "192.168.1.1",
			UserAgent: "TestBrowser/1.0",
		})

		assert.Error(t, err)
		assert.ErrorIs(t, err, ErrInvalidCredentials)

		// Check audit log - should log failure without revealing user doesn't exist
		events := auditLogger.GetEventsByType(AuditLoginFailure)
		assert.Len(t, events, 1)
	})

	t.Run("invalid password", func(t *testing.T) {
		auditLogger.Clear()

		_, err := authService.Login(context.Background(), LoginInput{
			Username:  "testuser",
			Password:  "wrongPassword",
			IP:        "192.168.1.1",
			UserAgent: "TestBrowser/1.0",
		})

		assert.Error(t, err)
		assert.ErrorIs(t, err, ErrInvalidCredentials)

		// Check audit log
		events := auditLogger.GetEventsByType(AuditLoginFailure)
		assert.Len(t, events, 1)
	})

	t.Run("inactive user cannot login", func(t *testing.T) {
		// Create inactive user
		inactiveUser := createTestUser(t, userRepo, authService.PasswordService(), "user-inactive", "inactive", "securePass123", RoleViewer)
		inactiveUser.Active = false
		_ = userRepo.Update(context.Background(), inactiveUser)

		auditLogger.Clear()

		_, err := authService.Login(context.Background(), LoginInput{
			Username:  "inactive",
			Password:  "securePass123",
			IP:        "192.168.1.1",
			UserAgent: "TestBrowser/1.0",
		})

		assert.Error(t, err)
		assert.ErrorIs(t, err, ErrInvalidCredentials)

		// Check audit log
		events := auditLogger.GetEventsByType(AuditLoginFailure)
		assert.Len(t, events, 1)
	})
}

func TestAuthService_Logout(t *testing.T) {
	authService, userRepo, sessionRepo, auditLogger := setupTestAuthService(t)

	// Create test user and login
	createTestUser(t, userRepo, authService.PasswordService(), "user-1", "testuser", "securePass123", RoleAdmin)

	result, err := authService.Login(context.Background(), LoginInput{
		Username:  "testuser",
		Password:  "securePass123",
		IP:        "192.168.1.1",
		UserAgent: "TestBrowser/1.0",
	})
	require.NoError(t, err)

	t.Run("successful logout", func(t *testing.T) {
		auditLogger.Clear()

		err := authService.Logout(context.Background(), result.Session.ID, "192.168.1.1", "TestBrowser/1.0")
		require.NoError(t, err)

		// Session should be revoked
		session, err := sessionRepo.GetByID(context.Background(), result.Session.ID)
		require.NoError(t, err)
		assert.True(t, session.Revoked)
		assert.Equal(t, "logout", session.RevokedReason)

		// Check audit log
		events := auditLogger.GetEventsByType(AuditLogout)
		assert.Len(t, events, 1)
	})

	t.Run("logout with invalid session", func(t *testing.T) {
		err := authService.Logout(context.Background(), "nonexistent-session", "192.168.1.1", "TestBrowser/1.0")
		assert.Error(t, err)
		assert.ErrorIs(t, err, ErrSessionNotFound)
	})
}

func TestAuthService_ValidateSession(t *testing.T) {
	authService, userRepo, sessionRepo, _ := setupTestAuthService(t)

	// Create test user and login
	createTestUser(t, userRepo, authService.PasswordService(), "user-1", "testuser", "securePass123", RoleAdmin)

	result, err := authService.Login(context.Background(), LoginInput{
		Username:  "testuser",
		Password:  "securePass123",
		IP:        "192.168.1.1",
		UserAgent: "TestBrowser/1.0",
	})
	require.NoError(t, err)

	t.Run("valid session", func(t *testing.T) {
		session, err := authService.ValidateSession(context.Background(), result.Session.ID)
		require.NoError(t, err)
		assert.Equal(t, result.Session.ID, session.ID)
	})

	t.Run("revoked session", func(t *testing.T) {
		// Revoke the session
		err := sessionRepo.Revoke(context.Background(), result.Session.ID, "test revocation")
		require.NoError(t, err)

		_, err = authService.ValidateSession(context.Background(), result.Session.ID)
		assert.Error(t, err)
		assert.ErrorIs(t, err, ErrSessionRevoked)
	})

	t.Run("nonexistent session", func(t *testing.T) {
		_, err := authService.ValidateSession(context.Background(), "nonexistent")
		assert.Error(t, err)
		assert.ErrorIs(t, err, ErrSessionNotFound)
	})
}

func TestAuthService_ChangePassword(t *testing.T) {
	authService, userRepo, sessionRepo, auditLogger := setupTestAuthService(t)

	// Create test user
	createTestUser(t, userRepo, authService.PasswordService(), "user-1", "testuser", "oldPassword123", RoleAdmin)

	// Login to get a session
	result, err := authService.Login(context.Background(), LoginInput{
		Username:  "testuser",
		Password:  "oldPassword123",
		IP:        "192.168.1.1",
		UserAgent: "TestBrowser/1.0",
	})
	require.NoError(t, err)

	// Create another session for the same user
	result2, err := authService.Login(context.Background(), LoginInput{
		Username:  "testuser",
		Password:  "oldPassword123",
		IP:        "192.168.1.2",
		UserAgent: "OtherBrowser/1.0",
	})
	require.NoError(t, err)

	t.Run("successful password change", func(t *testing.T) {
		auditLogger.Clear()

		err := authService.ChangePassword(context.Background(), ChangePasswordInput{
			UserID:          "user-1",
			CurrentPassword: "oldPassword123",
			NewPassword:     "newSecurePass456",
			CurrentSession:  result.Session.ID,
			IP:              "192.168.1.1",
			UserAgent:       "TestBrowser/1.0",
		})
		require.NoError(t, err)

		// Old password should no longer work
		_, err = authService.Login(context.Background(), LoginInput{
			Username: "testuser",
			Password: "oldPassword123",
		})
		assert.Error(t, err)

		// New password should work
		_, err = authService.Login(context.Background(), LoginInput{
			Username: "testuser",
			Password: "newSecurePass456",
		})
		assert.NoError(t, err)

		// Other sessions should be revoked
		session2, err := sessionRepo.GetByID(context.Background(), result2.Session.ID)
		require.NoError(t, err)
		assert.True(t, session2.Revoked)
		assert.Equal(t, "password_changed", session2.RevokedReason)

		// Current session should remain active
		session1, err := sessionRepo.GetByID(context.Background(), result.Session.ID)
		require.NoError(t, err)
		assert.False(t, session1.Revoked)

		// Check audit log
		events := auditLogger.GetEventsByType(AuditPasswordChange)
		assert.Len(t, events, 1)
	})

	t.Run("wrong current password", func(t *testing.T) {
		auditLogger.Clear()

		err := authService.ChangePassword(context.Background(), ChangePasswordInput{
			UserID:          "user-1",
			CurrentPassword: "wrongPassword",
			NewPassword:     "anotherNewPass789",
			IP:              "192.168.1.1",
			UserAgent:       "TestBrowser/1.0",
		})
		assert.Error(t, err)
		assert.ErrorIs(t, err, ErrPasswordMismatch)

		// Check audit log
		events := auditLogger.GetEventsByType(AuditPasswordFailure)
		assert.Len(t, events, 1)
	})
}

func TestAuthService_RevokeAllSessions(t *testing.T) {
	authService, userRepo, sessionRepo, auditLogger := setupTestAuthService(t)

	// Create test user
	createTestUser(t, userRepo, authService.PasswordService(), "user-1", "testuser", "securePass123", RoleAdmin)

	// Create multiple sessions
	for i := 0; i < 3; i++ {
		_, err := authService.Login(context.Background(), LoginInput{
			Username:  "testuser",
			Password:  "securePass123",
			IP:        "192.168.1.1",
			UserAgent: "TestBrowser/1.0",
		})
		require.NoError(t, err)
	}

	t.Run("revoke all sessions for user", func(t *testing.T) {
		auditLogger.Clear()

		err := authService.RevokeAllSessions(context.Background(), "user-1", "admin-1", "192.168.1.100", "AdminBrowser/1.0")
		require.NoError(t, err)

		// All sessions should be revoked
		sessions, err := sessionRepo.GetActiveForUser(context.Background(), "user-1")
		require.NoError(t, err)
		assert.Empty(t, sessions)

		// Check audit log
		events := auditLogger.GetEventsByType(AuditSessionRevoked)
		assert.Len(t, events, 1)
		assert.Equal(t, "admin-1", events[0].Details["admin_id"])
	})

	t.Run("revoke sessions for nonexistent user", func(t *testing.T) {
		err := authService.RevokeAllSessions(context.Background(), "nonexistent", "admin-1", "192.168.1.100", "AdminBrowser/1.0")
		assert.Error(t, err)
		assert.ErrorIs(t, err, ErrUserNotFound)
	})
}

func TestAuthService_GetUserSessions(t *testing.T) {
	authService, userRepo, _, _ := setupTestAuthService(t)

	// Create test user
	createTestUser(t, userRepo, authService.PasswordService(), "user-1", "testuser", "securePass123", RoleAdmin)

	// Create multiple sessions
	for i := 0; i < 3; i++ {
		_, err := authService.Login(context.Background(), LoginInput{
			Username:  "testuser",
			Password:  "securePass123",
			IP:        "192.168.1.1",
			UserAgent: "TestBrowser/1.0",
		})
		require.NoError(t, err)
	}

	t.Run("get user sessions", func(t *testing.T) {
		sessions, err := authService.GetUserSessions(context.Background(), "user-1")
		require.NoError(t, err)
		assert.Len(t, sessions, 3)
	})
}

func TestNewAuthService_Validation(t *testing.T) {
	privateKey, publicKey, _ := GenerateKeyPair()
	jwtService, _ := NewJWTService(JWTConfig{
		PrivateKey: privateKey,
		PublicKey:  publicKey,
	})

	t.Run("requires JWT service", func(t *testing.T) {
		_, err := NewAuthService(AuthServiceConfig{
			UserRepository:    newMockUserRepository(),
			SessionRepository: newMockSessionRepository(),
		})
		assert.Error(t, err)
	})

	t.Run("requires user repository", func(t *testing.T) {
		_, err := NewAuthService(AuthServiceConfig{
			JWTService:        jwtService,
			SessionRepository: newMockSessionRepository(),
		})
		assert.Error(t, err)
	})

	t.Run("requires session repository", func(t *testing.T) {
		_, err := NewAuthService(AuthServiceConfig{
			JWTService:     jwtService,
			UserRepository: newMockUserRepository(),
		})
		assert.Error(t, err)
	})

	t.Run("creates default password service if not provided", func(t *testing.T) {
		service, err := NewAuthService(AuthServiceConfig{
			JWTService:        jwtService,
			UserRepository:    newMockUserRepository(),
			SessionRepository: newMockSessionRepository(),
		})
		require.NoError(t, err)
		assert.NotNil(t, service.PasswordService())
	})
}
