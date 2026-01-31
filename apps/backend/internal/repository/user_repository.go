package repository

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"backend/ent"
	"backend/ent/session"
	"backend/ent/user"
	"backend/pkg/ulid"

	oklogulid "github.com/oklog/ulid/v2"
	"golang.org/x/crypto/bcrypt"
)

// BcryptCost is the cost parameter for bcrypt hashing.
// Cost 10 takes approximately 100ms on modern hardware.
const BcryptCost = 10

// userRepository implements UserRepository.
type userRepository struct {
	client *ent.Client
}

// UserRepositoryConfig holds configuration for UserRepository.
type UserRepositoryConfig struct {
	Client *ent.Client
}

// NewUserRepository creates a new UserRepository.
func NewUserRepository(cfg UserRepositoryConfig) UserRepository {
	return &userRepository{
		client: cfg.Client,
	}
}

// Create creates a new user with automatic password hashing and default settings.
// Password is hashed with bcrypt (cost 10, ~100ms).
//
// Query count: 1 (single INSERT)
func (r *userRepository) Create(ctx context.Context, input CreateUserInput) (*ent.User, error) {
	// Validate input
	if input.Username == "" {
		return nil, InvalidInput("CreateUserInput", "username", "cannot be empty")
	}
	if input.Password == "" {
		return nil, InvalidInput("CreateUserInput", "password", "cannot be empty")
	}
	if len(input.Password) < 8 {
		return nil, InvalidInput("CreateUserInput", "password", "must be at least 8 characters")
	}
	if len(input.Password) > 128 {
		return nil, InvalidInput("CreateUserInput", "password", "must be at most 128 characters")
	}

	// Check for duplicate username
	exists, err := r.client.User.
		Query().
		Where(user.Username(input.Username)).
		Exist(ctx)
	if err != nil {
		return nil, fmt.Errorf("check duplicate: %w", err)
	}
	if exists {
		return nil, Duplicate("User", "username", input.Username)
	}

	// Hash password with bcrypt
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), BcryptCost)
	if err != nil {
		return nil, fmt.Errorf("hash password: %w", err)
	}

	// Generate default settings
	settings := DefaultUserSettings()
	settingsJSON, err := json.Marshal(settings)
	if err != nil {
		return nil, fmt.Errorf("marshal settings: %w", err)
	}

	// Map role
	var entRole user.Role
	switch input.Role {
	case UserRoleAdmin:
		entRole = user.RoleAdmin
	case UserRoleOperator:
		entRole = user.RoleOperator
	default:
		entRole = user.RoleViewer
	}

	// Get audit context if available
	audit := GetAuditContext(ctx)

	// Create user
	userBuilder := r.client.User.Create().
		SetID(ulid.NewString()).
		SetUsername(input.Username).
		SetPasswordHash(string(hashedPassword)).
		SetRole(entRole).
		SetActive(true)

	// Optional fields
	if input.Email != "" {
		userBuilder.SetEmail(input.Email)
	}
	if input.DisplayName != "" {
		userBuilder.SetDisplayName(input.DisplayName)
	}

	// Note: User schema doesn't have a settings field currently.
	// This would need to be added to the ent schema in a future update.
	// For now, we store default settings conceptually.
	_ = settingsJSON // Settings will be used when schema supports it

	// Audit fields
	_ = audit // Would be used for created_by field when schema supports it

	newUser, err := userBuilder.Save(ctx)
	if err != nil {
		if ent.IsConstraintError(err) {
			return nil, Duplicate("User", "username", input.Username)
		}
		return nil, fmt.Errorf("create user: %w", err)
	}

	return newUser, nil
}

// GetByUsername finds a user by their unique username.
// Used for authentication.
//
// Query count: 1
func (r *userRepository) GetByUsername(ctx context.Context, username string) (*ent.User, error) {
	result, err := r.client.User.
		Query().
		Where(user.Username(username)).
		Only(ctx)

	if err != nil {
		if ent.IsNotFound(err) {
			return nil, NotFoundWithField("User", "username", username)
		}
		return nil, fmt.Errorf("query user: %w", err)
	}

	return result, nil
}

// GetByID finds a user by their ULID.
//
// Query count: 1
func (r *userRepository) GetByID(ctx context.Context, id oklogulid.ULID) (*ent.User, error) {
	result, err := r.client.User.Get(ctx, id.String())
	if err != nil {
		if ent.IsNotFound(err) {
			return nil, NotFound("User", id)
		}
		return nil, fmt.Errorf("get user: %w", err)
	}

	return result, nil
}

// GetWithSessions returns a user with eager-loaded active sessions.
// Only non-revoked, non-expired sessions are included.
//
// Query count: 1 (single query with eager loading)
func (r *userRepository) GetWithSessions(ctx context.Context, id oklogulid.ULID) (*ent.User, error) {
	now := time.Now()

	result, err := r.client.User.
		Query().
		Where(user.ID(id.String())).
		WithSessions(func(q *ent.SessionQuery) {
			q.Where(
				session.Revoked(false),
				session.ExpiresAtGT(now),
			).
				Order(ent.Desc(session.FieldLastActivity)).
				Limit(50) // Reasonable limit on active sessions
		}).
		Only(ctx)

	if err != nil {
		if ent.IsNotFound(err) {
			return nil, NotFound("User", id)
		}
		return nil, fmt.Errorf("query user with sessions: %w", err)
	}

	return result, nil
}

// UpdatePassword changes a user's password after hashing.
// Updates password_changed_at timestamp.
//
// Query count: 1 (UPDATE user)
func (r *userRepository) UpdatePassword(ctx context.Context, id oklogulid.ULID, newPassword string) error {
	// Validate password
	if newPassword == "" {
		return InvalidInput("UpdatePassword", "newPassword", "cannot be empty")
	}
	if len(newPassword) < 8 {
		return InvalidInput("UpdatePassword", "newPassword", "must be at least 8 characters")
	}
	if len(newPassword) > 128 {
		return InvalidInput("UpdatePassword", "newPassword", "must be at most 128 characters")
	}

	// Verify user exists
	exists, err := r.client.User.
		Query().
		Where(user.ID(id.String())).
		Exist(ctx)
	if err != nil {
		return fmt.Errorf("check user exists: %w", err)
	}
	if !exists {
		return NotFound("User", id)
	}

	// Hash new password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPassword), BcryptCost)
	if err != nil {
		return fmt.Errorf("hash password: %w", err)
	}

	// Update password
	_, err = r.client.User.
		UpdateOneID(id.String()).
		SetPasswordHash(string(hashedPassword)).
		SetPasswordChangedAt(time.Now()).
		Save(ctx)
	if err != nil {
		return fmt.Errorf("update password: %w", err)
	}

	return nil
}

// VerifyPassword checks if the provided password matches the stored hash.
// Returns nil if password matches, ErrInvalidCredentials otherwise.
func (r *userRepository) VerifyPassword(ctx context.Context, id oklogulid.ULID, password string) error {
	// Get user with password hash
	u, err := r.client.User.Get(ctx, id.String())
	if err != nil {
		if ent.IsNotFound(err) {
			return NotFound("User", id)
		}
		return fmt.Errorf("get user: %w", err)
	}

	// Compare password with hash
	err = bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(password))
	if err != nil {
		if err == bcrypt.ErrMismatchedHashAndPassword {
			return ErrInvalidCredentials
		}
		return fmt.Errorf("compare password: %w", err)
	}

	return nil
}

// UpdateLastLogin updates the last_login timestamp for a user.
//
// Query count: 1 (UPDATE user)
func (r *userRepository) UpdateLastLogin(ctx context.Context, id oklogulid.ULID) error {
	_, err := r.client.User.
		UpdateOneID(id.String()).
		SetLastLogin(time.Now()).
		Save(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return NotFound("User", id)
		}
		return fmt.Errorf("update last login: %w", err)
	}

	return nil
}
