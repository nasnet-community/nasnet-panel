package auth

import (
	"context"
	"time"

	"backend/generated/ent"
	"backend/generated/ent/session"
	"backend/generated/ent/user"
)

// EntUserRepository implements UserRepository using ent
type EntUserRepository struct {
	client *ent.Client
}

// NewEntUserRepository creates a new ent-based user repository
func NewEntUserRepository(client *ent.Client) *EntUserRepository {
	return &EntUserRepository{client: client}
}

// GetByID retrieves a user by ID
func (r *EntUserRepository) GetByID(ctx context.Context, id string) (*User, error) {
	u, err := r.client.User.Get(ctx, id)
	if err != nil {
		if ent.IsNotFound(err) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}
	return entUserToUser(u), nil
}

// GetByUsername retrieves a user by username
func (r *EntUserRepository) GetByUsername(ctx context.Context, username string) (*User, error) {
	u, err := r.client.User.Query().
		Where(user.UsernameEQ(username)).
		Only(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}
	return entUserToUser(u), nil
}

// Create creates a new user
func (r *EntUserRepository) Create(ctx context.Context, u *User) error {
	_, err := r.client.User.Create().
		SetID(u.ID).
		SetUsername(u.Username).
		SetNillableEmail(&u.Email).
		SetNillableDisplayName(&u.DisplayName).
		SetPasswordHash(u.PasswordHash).
		SetRole(user.Role(u.Role)).
		SetActive(u.Active).
		SetMfaEnabled(u.MFAEnabled).
		SetPasswordChangedAt(u.PasswordChanged).
		Save(ctx)
	return err
}

// Update updates an existing user
func (r *EntUserRepository) Update(ctx context.Context, u *User) error {
	update := r.client.User.UpdateOneID(u.ID).
		SetNillableEmail(&u.Email).
		SetNillableDisplayName(&u.DisplayName).
		SetRole(user.Role(u.Role)).
		SetActive(u.Active).
		SetMfaEnabled(u.MFAEnabled)

	_, err := update.Save(ctx)
	return err
}

// UpdateLastLogin updates the user's last login timestamp
func (r *EntUserRepository) UpdateLastLogin(ctx context.Context, userID string, loginTime time.Time) error {
	_, err := r.client.User.UpdateOneID(userID).
		SetLastLogin(loginTime).
		Save(ctx)
	return err
}

// UpdatePassword updates the user's password hash
func (r *EntUserRepository) UpdatePassword(ctx context.Context, userID, passwordHash string) error {
	_, err := r.client.User.UpdateOneID(userID).
		SetPasswordHash(passwordHash).
		SetPasswordChangedAt(time.Now()).
		Save(ctx)
	return err
}

// entUserToUser converts an ent User to the domain User
func entUserToUser(u *ent.User) *User {
	return &User{
		ID:              u.ID,
		Username:        u.Username,
		Email:           u.Email,
		DisplayName:     u.DisplayName,
		PasswordHash:    u.PasswordHash,
		Role:            Role(u.Role),
		Active:          u.Active,
		MFAEnabled:      u.MfaEnabled,
		LastLogin:       u.LastLogin,
		PasswordChanged: u.PasswordChangedAt,
		CreatedAt:       u.CreatedAt,
		UpdatedAt:       u.UpdatedAt,
	}
}

// EntSessionRepository implements SessionRepository using ent
type EntSessionRepository struct {
	client *ent.Client
}

// NewEntSessionRepository creates a new ent-based session repository
func NewEntSessionRepository(client *ent.Client) *EntSessionRepository {
	return &EntSessionRepository{client: client}
}

// GetByID retrieves a session by ID
func (r *EntSessionRepository) GetByID(ctx context.Context, id string) (*Session, error) {
	s, err := r.client.Session.Get(ctx, id)
	if err != nil {
		if ent.IsNotFound(err) {
			return nil, ErrSessionNotFound
		}
		return nil, err
	}
	return entSessionToSession(s), nil
}

// GetByTokenID retrieves a session by token ID (jti)
func (r *EntSessionRepository) GetByTokenID(ctx context.Context, tokenID string) (*Session, error) {
	s, err := r.client.Session.Query().
		Where(session.TokenIDEQ(tokenID)).
		Only(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return nil, ErrSessionNotFound
		}
		return nil, err
	}
	return entSessionToSession(s), nil
}

// Create creates a new session
func (r *EntSessionRepository) Create(ctx context.Context, s *Session) error {
	create := r.client.Session.Create().
		SetID(s.ID).
		SetUserID(s.UserID).
		SetTokenID(s.TokenID).
		SetExpiresAt(s.ExpiresAt).
		SetLastActivity(s.LastActivity).
		SetRevoked(false)

	if s.TokenFamily != "" {
		create.SetTokenFamily(s.TokenFamily)
	}
	if s.UserAgent != "" {
		create.SetUserAgent(s.UserAgent)
	}
	if s.IPAddress != "" {
		create.SetIPAddress(s.IPAddress)
	}

	_, err := create.Save(ctx)
	return err
}

// UpdateLastActivity updates the session's last activity time
func (r *EntSessionRepository) UpdateLastActivity(ctx context.Context, sessionID string, activityTime time.Time) error {
	_, err := r.client.Session.UpdateOneID(sessionID).
		SetLastActivity(activityTime).
		Save(ctx)
	return err
}

// Revoke revokes a session
func (r *EntSessionRepository) Revoke(ctx context.Context, sessionID, reason string) error {
	now := time.Now()
	_, err := r.client.Session.UpdateOneID(sessionID).
		SetRevoked(true).
		SetRevokedAt(now).
		SetRevokedReason(reason).
		Save(ctx)
	return err
}

// RevokeAllForUser revokes all sessions for a user
func (r *EntSessionRepository) RevokeAllForUser(ctx context.Context, userID, reason string) error {
	now := time.Now()
	_, err := r.client.Session.Update().
		Where(
			session.UserIDEQ(userID),
			session.RevokedEQ(false),
		).
		SetRevoked(true).
		SetRevokedAt(now).
		SetRevokedReason(reason).
		Save(ctx)
	return err
}

// RevokeAllForUserExcept revokes all sessions for a user except the specified one
func (r *EntSessionRepository) RevokeAllForUserExcept(ctx context.Context, userID, exceptSessionID, reason string) error {
	now := time.Now()
	_, err := r.client.Session.Update().
		Where(
			session.UserIDEQ(userID),
			session.RevokedEQ(false),
			session.IDNEQ(exceptSessionID),
		).
		SetRevoked(true).
		SetRevokedAt(now).
		SetRevokedReason(reason).
		Save(ctx)
	return err
}

// GetActiveForUser retrieves all active sessions for a user
func (r *EntSessionRepository) GetActiveForUser(ctx context.Context, userID string) ([]*Session, error) {
	now := time.Now()
	sessions, err := r.client.Session.Query().
		Where(
			session.UserIDEQ(userID),
			session.RevokedEQ(false),
			session.ExpiresAtGT(now),
		).
		Order(ent.Desc(session.FieldLastActivity)).
		All(ctx)
	if err != nil {
		return nil, err
	}

	result := make([]*Session, len(sessions))
	for i, s := range sessions {
		result[i] = entSessionToSession(s)
	}
	return result, nil
}

// CleanExpired removes expired sessions
func (r *EntSessionRepository) CleanExpired(ctx context.Context) (int, error) {
	now := time.Now()
	count, err := r.client.Session.Delete().
		Where(session.ExpiresAtLT(now)).
		Exec(ctx)
	return count, err
}

// entSessionToSession converts an ent Session to the domain Session
func entSessionToSession(s *ent.Session) *Session {
	return &Session{
		ID:            s.ID,
		UserID:        s.UserID,
		TokenID:       s.TokenID,
		TokenFamily:   s.TokenFamily,
		UserAgent:     s.UserAgent,
		IPAddress:     s.IPAddress,
		ExpiresAt:     s.ExpiresAt,
		LastActivity:  s.LastActivity,
		Revoked:       s.Revoked,
		RevokedAt:     s.RevokedAt,
		RevokedReason: s.RevokedReason,
		CreatedAt:     s.CreatedAt,
	}
}
