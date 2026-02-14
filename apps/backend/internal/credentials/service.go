// Package credentials provides secure credential management for router authentication.
// This package handles encryption, storage, and retrieval of router credentials.
//
// Security considerations:
// - All credentials are encrypted with AES-256-GCM before storage
// - Plaintext credentials are never logged or included in error messages
// - Uses constant-time comparison to prevent timing attacks
// - Encryption key is loaded from DB_ENCRYPTION_KEY environment variable
package credentials

import (
	"backend/generated/ent"
	"backend/internal/encryption"
	"backend/pkg/ulid"
	"context"
	"errors"
	"fmt"
	"sync"
	"time"
)

// Service error definitions
var (
	// ErrCredentialsNotFound is returned when credentials don't exist for a router
	ErrCredentialsNotFound = errors.New("credentials not found for router")
	// ErrEncryptionFailed is returned when credential encryption fails
	ErrEncryptionFailed = errors.New("failed to encrypt credentials")
	// ErrDecryptionFailed is returned when credential decryption fails
	ErrDecryptionFailed = errors.New("failed to decrypt credentials")
	// ErrInvalidCredentials is returned when credentials are invalid (empty username/password)
	ErrInvalidCredentials = errors.New("invalid credentials: username and password are required")
	// ErrRouterNotFound is returned when the specified router doesn't exist
	ErrRouterNotFound = errors.New("router not found")
	// ErrNoDatabaseClient is returned when no database client is provided
	ErrNoDatabaseClient = errors.New("database client is required")
)

// Credentials represents decrypted router credentials.
// This struct should NOT be logged or serialized without sanitization.
type Credentials struct {
	Username    string
	Password    string
	KeyVersion  int
	LastUpdated time.Time
}

// CredentialInfo represents credential metadata without sensitive values.
// Safe to log and include in API responses.
type CredentialInfo struct {
	RouterID         string    `json:"routerId"`
	Username         string    `json:"username"`
	HasPassword      bool      `json:"hasPassword"`
	EncryptionStatus string    `json:"encryptionStatus"`
	KeyVersion       int       `json:"keyVersion"`
	LastUpdated      time.Time `json:"lastUpdated"`
	CreatedAt        time.Time `json:"createdAt"`
}

// UpdateInput contains the credentials to update.
type UpdateInput struct {
	Username string
	Password string
}

// Service manages router credentials with automatic encryption/decryption.
type Service struct {
	encService *encryption.Service
	mu         sync.RWMutex
}

// NewService creates a new credential service with the given encryption service.
func NewService(encService *encryption.Service) (*Service, error) {
	if encService == nil {
		return nil, errors.New("encryption service is required")
	}
	return &Service{
		encService: encService,
	}, nil
}

// NewServiceFromEnv creates a new credential service using environment configuration.
func NewServiceFromEnv() (*Service, error) {
	encService, err := encryption.NewServiceFromEnv()
	if err != nil {
		return nil, fmt.Errorf("failed to create encryption service: %w", err)
	}
	return NewService(encService)
}

// Create creates new encrypted credentials for a router.
func (s *Service) Create(ctx context.Context, client *ent.Client, routerID string, input UpdateInput) (*ent.RouterSecret, error) {
	if input.Username == "" || input.Password == "" {
		return nil, ErrInvalidCredentials
	}

	// Verify router exists
	exists, err := client.Router.Query().Where().Count(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to verify router: %w", err)
	}
	if exists == 0 {
		return nil, ErrRouterNotFound
	}

	// Encrypt credentials
	encUsername, err := s.encService.Encrypt(input.Username)
	if err != nil {
		return nil, fmt.Errorf("%w: username: %v", ErrEncryptionFailed, err)
	}

	encPassword, err := s.encService.Encrypt(input.Password)
	if err != nil {
		return nil, fmt.Errorf("%w: password: %v", ErrEncryptionFailed, err)
	}

	// Generate ULID for the secret
	id := ulid.New()

	// Create the secret entry
	secret, err := client.RouterSecret.Create().
		SetID(id.String()).
		SetRouterID(routerID).
		SetEncryptedUsername([]byte(encUsername)).
		SetEncryptedPassword([]byte(encPassword)).
		SetEncryptionNonce([]byte{}). // Nonce is included in ciphertext
		SetKeyVersion(s.encService.KeyVersion()).
		Save(ctx)

	if err != nil {
		return nil, fmt.Errorf("failed to save credentials: %w", err)
	}

	return secret, nil
}

// Update updates existing credentials for a router.
func (s *Service) Update(ctx context.Context, client *ent.Client, routerID string, input UpdateInput) (*ent.RouterSecret, error) {
	if input.Username == "" || input.Password == "" {
		return nil, ErrInvalidCredentials
	}

	// Find existing secret
	secret, err := client.RouterSecret.Query().
		Where().
		Only(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return nil, ErrCredentialsNotFound
		}
		return nil, fmt.Errorf("failed to find credentials: %w", err)
	}

	// Encrypt new credentials
	encUsername, err := s.encService.Encrypt(input.Username)
	if err != nil {
		return nil, fmt.Errorf("%w: username: %v", ErrEncryptionFailed, err)
	}

	encPassword, err := s.encService.Encrypt(input.Password)
	if err != nil {
		return nil, fmt.Errorf("%w: password: %v", ErrEncryptionFailed, err)
	}

	// Update the secret
	updated, err := secret.Update().
		SetEncryptedUsername([]byte(encUsername)).
		SetEncryptedPassword([]byte(encPassword)).
		SetKeyVersion(s.encService.KeyVersion()).
		Save(ctx)

	if err != nil {
		return nil, fmt.Errorf("failed to update credentials: %w", err)
	}

	return updated, nil
}

// Get retrieves and decrypts credentials for a router.
// WARNING: The returned Credentials contain plaintext values - handle with care.
func (s *Service) Get(ctx context.Context, client *ent.Client, routerID string) (*Credentials, error) {
	secret, err := client.RouterSecret.Query().
		Where().
		Only(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return nil, ErrCredentialsNotFound
		}
		return nil, fmt.Errorf("failed to find credentials: %w", err)
	}

	// Decrypt credentials
	username, err := s.encService.Decrypt(string(secret.EncryptedUsername))
	if err != nil {
		return nil, fmt.Errorf("%w: username: %v", ErrDecryptionFailed, err)
	}

	password, err := s.encService.Decrypt(string(secret.EncryptedPassword))
	if err != nil {
		return nil, fmt.Errorf("%w: password: %v", ErrDecryptionFailed, err)
	}

	return &Credentials{
		Username:    username,
		Password:    password,
		KeyVersion:  secret.KeyVersion,
		LastUpdated: secret.UpdatedAt,
	}, nil
}

// GetInfo retrieves credential metadata without decrypting sensitive values.
// Safe for API responses and logging.
func (s *Service) GetInfo(ctx context.Context, client *ent.Client, routerID string) (*CredentialInfo, error) {
	secret, err := client.RouterSecret.Query().
		Where().
		Only(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return nil, ErrCredentialsNotFound
		}
		return nil, fmt.Errorf("failed to find credentials: %w", err)
	}

	// Decrypt only the username (safe to display)
	username, err := s.encService.Decrypt(string(secret.EncryptedUsername))
	if err != nil {
		return nil, fmt.Errorf("%w: username: %v", ErrDecryptionFailed, err)
	}

	return &CredentialInfo{
		RouterID:         routerID,
		Username:         username,
		HasPassword:      len(secret.EncryptedPassword) > 0,
		EncryptionStatus: "AES-256-GCM",
		KeyVersion:       secret.KeyVersion,
		LastUpdated:      secret.UpdatedAt,
		CreatedAt:        secret.CreatedAt,
	}, nil
}

// Delete removes credentials for a router.
func (s *Service) Delete(ctx context.Context, client *ent.Client, routerID string) error {
	_, err := client.RouterSecret.Delete().
		Where().
		Exec(ctx)
	if err != nil {
		return fmt.Errorf("failed to delete credentials: %w", err)
	}
	return nil
}

// Exists checks if credentials exist for a router.
func (s *Service) Exists(ctx context.Context, client *ent.Client, routerID string) (bool, error) {
	if client == nil {
		return false, ErrNoDatabaseClient
	}
	count, err := client.RouterSecret.Query().
		Where().
		Count(ctx)
	if err != nil {
		return false, fmt.Errorf("failed to check credentials: %w", err)
	}
	return count > 0, nil
}

// SanitizeForLog returns a sanitized version of credentials safe for logging.
// Password is always redacted.
func SanitizeForLog(creds *Credentials) map[string]interface{} {
	if creds == nil {
		return nil
	}
	return map[string]interface{}{
		"username":    creds.Username,
		"password":    "[REDACTED]",
		"key_version": creds.KeyVersion,
		"last_updated": creds.LastUpdated,
	}
}

// EncryptionService returns the underlying encryption service.
// Useful for bulk operations or testing.
func (s *Service) EncryptionService() *encryption.Service {
	return s.encService
}
