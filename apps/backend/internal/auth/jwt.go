// Package auth provides authentication services for NasNetConnect.
// Implements JWT-based authentication with RS256 signing, sliding sessions,
// and NIST-compliant password policies.
package auth

import (
	"crypto/rsa"
	"crypto/x509"
	"encoding/pem"
	"errors"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/oklog/ulid/v2"
)

// Error codes for authentication errors
const (
	ErrCodeInvalidCredentials = "AUTH.INVALID_CREDENTIALS"
	ErrCodeSessionExpired     = "AUTH.SESSION_EXPIRED"
	ErrCodeTokenInvalid       = "AUTH.TOKEN_INVALID"
	ErrCodeTokenExpired       = "AUTH.TOKEN_EXPIRED"
	ErrCodeInsufficientRole   = "AUTH.INSUFFICIENT_ROLE"
	ErrCodeRateLimited        = "AUTH.RATE_LIMITED"
)

// Common authentication errors
var (
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrSessionExpired     = errors.New("session expired")
	ErrTokenInvalid       = errors.New("token is invalid")
	ErrTokenExpired       = errors.New("token has expired")
	ErrInsufficientRole   = errors.New("insufficient role for this operation")
	ErrMissingPrivateKey  = errors.New("JWT private key not configured")
	ErrMissingPublicKey   = errors.New("JWT public key not configured")
	ErrInvalidKeyFormat   = errors.New("invalid key format")
)

// Role represents a user role for authorization
type Role string

const (
	RoleAdmin    Role = "admin"
	RoleOperator Role = "operator"
	RoleViewer   Role = "viewer"
)

// IsValid checks if the role is a valid role
func (r Role) IsValid() bool {
	switch r {
	case RoleAdmin, RoleOperator, RoleViewer:
		return true
	default:
		return false
	}
}

// HasPermission checks if this role has at least the required permission level
func (r Role) HasPermission(required Role) bool {
	// Admin has all permissions
	if r == RoleAdmin {
		return true
	}
	// Operator can do everything except admin tasks
	if r == RoleOperator && required != RoleAdmin {
		return true
	}
	// Viewer can only do viewer tasks
	if r == RoleViewer && required == RoleViewer {
		return true
	}
	return false
}

// Claims represents the JWT claims for NasNetConnect
type Claims struct {
	jwt.RegisteredClaims
	UserID    string `json:"uid"`      // User ULID
	Username  string `json:"username"` // Username
	Role      string `json:"role"`     // User role (admin, operator, viewer)
	SessionID string `json:"sid"`      // Session ULID
}

// JWTConfig holds JWT configuration options
type JWTConfig struct {
	// RS256 signing keys
	PrivateKey *rsa.PrivateKey
	PublicKey  *rsa.PublicKey

	// Token timing
	TokenDuration   time.Duration // How long tokens are valid (default: 1 hour)
	SessionDuration time.Duration // Maximum session duration (default: 7 days)
	SlideThreshold  time.Duration // Time before expiry to refresh (default: 30 minutes)

	// Issuer for token identification
	Issuer string
}

// DefaultJWTConfig returns a JWTConfig with default values
func DefaultJWTConfig() JWTConfig {
	return JWTConfig{
		TokenDuration:   1 * time.Hour,
		SessionDuration: 7 * 24 * time.Hour,
		SlideThreshold:  30 * time.Minute,
		Issuer:          "nasnetconnect",
	}
}

// JWTService handles JWT token generation and validation
type JWTService struct {
	config JWTConfig
}

// NewJWTService creates a new JWT service with the given configuration
func NewJWTService(config JWTConfig) (*JWTService, error) {
	if config.PrivateKey == nil {
		return nil, ErrMissingPrivateKey
	}
	if config.PublicKey == nil {
		return nil, ErrMissingPublicKey
	}

	// Apply defaults for missing values
	if config.TokenDuration == 0 {
		config.TokenDuration = DefaultJWTConfig().TokenDuration
	}
	if config.SessionDuration == 0 {
		config.SessionDuration = DefaultJWTConfig().SessionDuration
	}
	if config.SlideThreshold == 0 {
		config.SlideThreshold = DefaultJWTConfig().SlideThreshold
	}
	if config.Issuer == "" {
		config.Issuer = DefaultJWTConfig().Issuer
	}

	return &JWTService{config: config}, nil
}

// NewJWTServiceFromEnv creates a JWT service from environment variables
// Reads from:
// - JWT_PRIVATE_KEY or JWT_PRIVATE_KEY_PATH
// - JWT_PUBLIC_KEY or JWT_PUBLIC_KEY_PATH
// - JWT_TOKEN_DURATION (optional, default: 1h)
// - JWT_SESSION_DURATION (optional, default: 168h)
// - JWT_SLIDE_THRESHOLD (optional, default: 30m)
func NewJWTServiceFromEnv() (*JWTService, error) {
	config := DefaultJWTConfig()

	// Load private key
	privateKey, err := loadPrivateKeyFromEnv()
	if err != nil {
		return nil, fmt.Errorf("failed to load private key: %w", err)
	}
	config.PrivateKey = privateKey

	// Load public key
	publicKey, err := loadPublicKeyFromEnv()
	if err != nil {
		return nil, fmt.Errorf("failed to load public key: %w", err)
	}
	config.PublicKey = publicKey

	// Parse optional durations
	if d := os.Getenv("JWT_TOKEN_DURATION"); d != "" {
		dur, err := time.ParseDuration(d)
		if err == nil {
			config.TokenDuration = dur
		}
	}
	if d := os.Getenv("JWT_SESSION_DURATION"); d != "" {
		dur, err := time.ParseDuration(d)
		if err == nil {
			config.SessionDuration = dur
		}
	}
	if d := os.Getenv("JWT_SLIDE_THRESHOLD"); d != "" {
		dur, err := time.ParseDuration(d)
		if err == nil {
			config.SlideThreshold = dur
		}
	}

	return NewJWTService(config)
}

// TokenInput contains the information needed to generate a token
type TokenInput struct {
	UserID    string
	Username  string
	Role      Role
	SessionID string
}

// GenerateToken creates a new JWT token for the given user
func (s *JWTService) GenerateToken(input TokenInput) (string, time.Time, error) {
	now := time.Now()
	expiresAt := now.Add(s.config.TokenDuration)

	// Generate a unique token ID (jti)
	tokenID := ulid.Make().String()

	claims := Claims{
		RegisteredClaims: jwt.RegisteredClaims{
			ID:        tokenID,
			Issuer:    s.config.Issuer,
			Subject:   input.UserID,
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(expiresAt),
			NotBefore: jwt.NewNumericDate(now),
		},
		UserID:    input.UserID,
		Username:  input.Username,
		Role:      string(input.Role),
		SessionID: input.SessionID,
	}

	token := jwt.NewWithClaims(jwt.SigningMethodRS256, claims)
	tokenString, err := token.SignedString(s.config.PrivateKey)
	if err != nil {
		return "", time.Time{}, fmt.Errorf("failed to sign token: %w", err)
	}

	return tokenString, expiresAt, nil
}

// ValidateToken validates a JWT token and returns the claims
func (s *JWTService) ValidateToken(tokenString string) (*Claims, error) {
	// Parse and validate the token
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		// Verify the signing method is RS256
		if _, ok := token.Method.(*jwt.SigningMethodRSA); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return s.config.PublicKey, nil
	})

	if err != nil {
		// Check for specific error types
		if errors.Is(err, jwt.ErrTokenExpired) {
			return nil, ErrTokenExpired
		}
		if errors.Is(err, jwt.ErrTokenMalformed) || errors.Is(err, jwt.ErrTokenNotValidYet) {
			return nil, ErrTokenInvalid
		}
		return nil, fmt.Errorf("token validation failed: %w", err)
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, ErrTokenInvalid
	}

	return claims, nil
}

// ShouldRefresh checks if a token should be refreshed based on the sliding session logic.
// Returns true if the token is valid and within the slide threshold of expiration.
func (s *JWTService) ShouldRefresh(claims *Claims) bool {
	if claims == nil || claims.ExpiresAt == nil {
		return false
	}

	// Calculate time until expiration
	timeUntilExpiry := time.Until(claims.ExpiresAt.Time)

	// Should refresh if less than threshold remaining
	return timeUntilExpiry > 0 && timeUntilExpiry < s.config.SlideThreshold
}

// RefreshToken creates a new token if the current one should be refreshed.
// This implements sliding session extension.
// Returns the new token and expiry, or empty string if no refresh needed.
func (s *JWTService) RefreshToken(claims *Claims, sessionCreatedAt time.Time) (string, time.Time, error) {
	if !s.ShouldRefresh(claims) {
		return "", time.Time{}, nil
	}

	// Check if session maximum would be exceeded
	sessionMaxExpiry := sessionCreatedAt.Add(s.config.SessionDuration)
	if time.Now().Add(s.config.TokenDuration).After(sessionMaxExpiry) {
		// Session maximum reached, calculate remaining time
		remaining := time.Until(sessionMaxExpiry)
		if remaining <= 0 {
			return "", time.Time{}, ErrSessionExpired
		}
		// Issue token that expires at session max
		// We'll adjust the token duration temporarily
		originalDuration := s.config.TokenDuration
		s.config.TokenDuration = remaining
		defer func() { s.config.TokenDuration = originalDuration }()
	}

	// Generate new token with same user info
	return s.GenerateToken(TokenInput{
		UserID:    claims.UserID,
		Username:  claims.Username,
		Role:      Role(claims.Role),
		SessionID: claims.SessionID,
	})
}

// GetConfig returns the current JWT configuration (for testing/debugging)
func (s *JWTService) GetConfig() JWTConfig {
	return s.config
}

// loadPrivateKeyFromEnv loads the RSA private key from environment
func loadPrivateKeyFromEnv() (*rsa.PrivateKey, error) {
	// Try inline key first
	if keyPEM := os.Getenv("JWT_PRIVATE_KEY"); keyPEM != "" {
		return parsePrivateKey([]byte(keyPEM))
	}

	// Try key file path
	if keyPath := os.Getenv("JWT_PRIVATE_KEY_PATH"); keyPath != "" {
		keyPEM, err := os.ReadFile(keyPath)
		if err != nil {
			return nil, fmt.Errorf("failed to read private key file: %w", err)
		}
		return parsePrivateKey(keyPEM)
	}

	return nil, ErrMissingPrivateKey
}

// loadPublicKeyFromEnv loads the RSA public key from environment
func loadPublicKeyFromEnv() (*rsa.PublicKey, error) {
	// Try inline key first
	if keyPEM := os.Getenv("JWT_PUBLIC_KEY"); keyPEM != "" {
		return parsePublicKey([]byte(keyPEM))
	}

	// Try key file path
	if keyPath := os.Getenv("JWT_PUBLIC_KEY_PATH"); keyPath != "" {
		keyPEM, err := os.ReadFile(keyPath)
		if err != nil {
			return nil, fmt.Errorf("failed to read public key file: %w", err)
		}
		return parsePublicKey(keyPEM)
	}

	return nil, ErrMissingPublicKey
}

// parsePrivateKey parses a PEM-encoded RSA private key
func parsePrivateKey(keyPEM []byte) (*rsa.PrivateKey, error) {
	// Handle escaped newlines (from env vars)
	keyStr := strings.ReplaceAll(string(keyPEM), "\\n", "\n")
	keyPEM = []byte(keyStr)

	block, _ := pem.Decode(keyPEM)
	if block == nil {
		return nil, fmt.Errorf("failed to decode PEM block: %w", ErrInvalidKeyFormat)
	}

	// Try PKCS#8 first (more modern format)
	key, err := x509.ParsePKCS8PrivateKey(block.Bytes)
	if err == nil {
		rsaKey, ok := key.(*rsa.PrivateKey)
		if !ok {
			return nil, fmt.Errorf("key is not RSA: %w", ErrInvalidKeyFormat)
		}
		return rsaKey, nil
	}

	// Fall back to PKCS#1 (traditional RSA format)
	rsaKey, err := x509.ParsePKCS1PrivateKey(block.Bytes)
	if err != nil {
		return nil, fmt.Errorf("failed to parse private key: %w", err)
	}

	return rsaKey, nil
}

// parsePublicKey parses a PEM-encoded RSA public key
func parsePublicKey(keyPEM []byte) (*rsa.PublicKey, error) {
	// Handle escaped newlines (from env vars)
	keyStr := strings.ReplaceAll(string(keyPEM), "\\n", "\n")
	keyPEM = []byte(keyStr)

	block, _ := pem.Decode(keyPEM)
	if block == nil {
		return nil, fmt.Errorf("failed to decode PEM block: %w", ErrInvalidKeyFormat)
	}

	// Try PKIX format first (most common for public keys)
	key, err := x509.ParsePKIXPublicKey(block.Bytes)
	if err == nil {
		rsaKey, ok := key.(*rsa.PublicKey)
		if !ok {
			return nil, fmt.Errorf("key is not RSA: %w", ErrInvalidKeyFormat)
		}
		return rsaKey, nil
	}

	// Try PKCS#1 format
	rsaKey, err := x509.ParsePKCS1PublicKey(block.Bytes)
	if err != nil {
		return nil, fmt.Errorf("failed to parse public key: %w", err)
	}

	return rsaKey, nil
}

// GenerateKeyPair generates a new RSA key pair for development/testing
// This should NOT be used in production - keys should be managed externally
func GenerateKeyPair() (*rsa.PrivateKey, *rsa.PublicKey, error) {
	// Use crypto/rand for key generation
	privateKey, err := rsa.GenerateKey(cryptoRandReader, 2048)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to generate key pair: %w", err)
	}
	return privateKey, &privateKey.PublicKey, nil
}

// cryptoRandReader is the crypto/rand reader for key generation
var cryptoRandReader = cryptoRand{}

type cryptoRand struct{}

func (cryptoRand) Read(b []byte) (int, error) {
	return readCryptoRand(b)
}

// readCryptoRand is a variable to allow testing
var readCryptoRand = func(b []byte) (int, error) {
	return len(b), fillRandom(b)
}

func fillRandom(b []byte) error {
	_, err := cryptoRandFill(b)
	return err
}

// cryptoRandFill fills the byte slice with random data
// Import crypto/rand for actual randomness
var cryptoRandFill = func(b []byte) (int, error) {
	// This will be filled by the init function in a separate file
	// or by importing crypto/rand
	return len(b), nil
}
