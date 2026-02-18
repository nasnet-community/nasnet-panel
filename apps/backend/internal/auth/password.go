package auth

import (
	"embed"
	"errors"
	"strings"
	"unicode/utf8"

	"golang.org/x/crypto/bcrypt"
)

// Password policy errors
var (
	ErrPasswordTooShort = errors.New("password must be at least 8 characters")
	ErrPasswordTooLong  = errors.New("password must not exceed 128 characters")
	ErrPasswordCommon   = errors.New("password is too common, please choose a stronger one")
	ErrPasswordMismatch = errors.New("current password is incorrect")
)

// Password error codes for API responses
const (
	ErrCodePasswordTooShort = "AUTH.PASSWORD_TOO_SHORT"
	ErrCodePasswordTooLong  = "AUTH.PASSWORD_TOO_LONG"
	ErrCodePasswordCommon   = "AUTH.PASSWORD_COMMON"
	ErrCodePasswordMismatch = "AUTH.PASSWORD_MISMATCH"
)

// PasswordPolicy defines the NIST-compliant password policy
type PasswordPolicy struct {
	MinLength       int  // Minimum password length (default: 8)
	MaxLength       int  // Maximum password length (default: 128)
	CheckCommonList bool // Whether to check against common passwords
}

// DefaultPasswordPolicy returns the default NIST-compliant password policy
// Following NIST SP 800-63B guidelines:
// - Minimum 8 characters
// - Maximum 128 characters
// - No forced complexity (no mandatory uppercase, symbols, numbers)
// - Check against common/breached password lists
func DefaultPasswordPolicy() PasswordPolicy {
	return PasswordPolicy{
		MinLength:       8,
		MaxLength:       128,
		CheckCommonList: true,
	}
}

// PasswordService handles password hashing and validation
type PasswordService struct {
	policy          PasswordPolicy
	bcryptCost      int
	commonPasswords map[string]struct{}
}

// NewPasswordService creates a new password service with the given policy
func NewPasswordService(policy PasswordPolicy) *PasswordService {
	ps := &PasswordService{
		policy:          policy,
		bcryptCost:      10, // ~100ms per hash, acceptable for login
		commonPasswords: make(map[string]struct{}),
	}

	// Load common passwords
	ps.loadCommonPasswords()

	return ps
}

// NewDefaultPasswordService creates a password service with default policy
func NewDefaultPasswordService() *PasswordService {
	return NewPasswordService(DefaultPasswordPolicy())
}

//go:embed common_passwords.txt
var commonPasswordsFS embed.FS

// loadCommonPasswords loads the common password list
func (ps *PasswordService) loadCommonPasswords() {
	// Try to load from embedded file
	data, err := commonPasswordsFS.ReadFile("common_passwords.txt")
	if err != nil {
		// If no embedded file, use a built-in list
		ps.loadBuiltinCommonPasswords()
		return
	}

	lines := strings.Split(string(data), "\n")
	for _, line := range lines {
		line = strings.TrimSpace(strings.ToLower(line))
		if line != "" && !strings.HasPrefix(line, "#") {
			ps.commonPasswords[line] = struct{}{}
		}
	}
}

// loadBuiltinCommonPasswords loads a minimal built-in list of common passwords
func (ps *PasswordService) loadBuiltinCommonPasswords() {
	// Top common passwords that should always be rejected
	common := []string{
		"password", "password1", "password123", "password1234",
		"123456", "12345678", "123456789", "1234567890",
		"qwerty", "qwerty123", "qwertyuiop",
		"letmein", "welcome", "welcome1",
		"admin", "admin123", "administrator",
		"root", "root123", "toor",
		"login", "master", "hello",
		"monkey", "dragon", "baseball",
		"iloveyou", "trustno1", "sunshine",
		"princess", "football", "shadow",
		"superman", "michael", "jennifer",
		"abc123", "111111", "123123",
		"passw0rd", "p@ssword", "p@ssw0rd",
		"nasnet", "nasnetconnect", "mikrotik",
		"router", "router123", "routers",
	}

	for _, p := range common {
		ps.commonPasswords[p] = struct{}{}
	}
}

// ValidatePassword validates a password against the policy
// Returns nil if the password is valid, or an error describing the issue
func (ps *PasswordService) ValidatePassword(password string) error {
	// Check minimum length
	length := utf8.RuneCountInString(password)
	if length < ps.policy.MinLength {
		return ErrPasswordTooShort
	}

	// Check maximum length
	if length > ps.policy.MaxLength {
		return ErrPasswordTooLong
	}

	// Check against common password list
	if ps.policy.CheckCommonList && ps.isCommonPassword(password) {
		return ErrPasswordCommon
	}

	return nil
}

// isCommonPassword checks if the password is in the common password list
func (ps *PasswordService) isCommonPassword(password string) bool {
	// Normalize to lowercase for comparison
	normalized := strings.ToLower(password)
	_, exists := ps.commonPasswords[normalized]
	return exists
}

// HashPassword hashes a password using bcrypt with the configured cost
// The plaintext password should never be stored or logged
func (ps *PasswordService) HashPassword(password string) (string, error) {
	// Validate password first
	if err := ps.ValidatePassword(password); err != nil {
		return "", err
	}

	// Hash with bcrypt (includes salt automatically)
	hash, err := bcrypt.GenerateFromPassword([]byte(password), ps.bcryptCost)
	if err != nil {
		return "", err
	}

	return string(hash), nil
}

// VerifyPassword verifies a password against a bcrypt hash
// Uses constant-time comparison to prevent timing attacks
func (ps *PasswordService) VerifyPassword(hash, password string) bool {
	// bcrypt.CompareHashAndPassword is inherently timing-safe
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

// ChangePassword validates the current password and returns a hash of the new password
// Returns the new hash if successful, or an error if validation fails
func (ps *PasswordService) ChangePassword(currentHash, currentPassword, newPassword string) (string, error) {
	// Verify current password
	if !ps.VerifyPassword(currentHash, currentPassword) {
		return "", ErrPasswordMismatch
	}

	// Validate and hash new password
	return ps.HashPassword(newPassword)
}

// GetBcryptCost returns the current bcrypt cost factor
func (ps *PasswordService) GetBcryptCost() int {
	return ps.bcryptCost
}

// SetBcryptCost sets the bcrypt cost factor (for testing purposes)
// In production, this should remain at 10 (~100ms per hash)
func (ps *PasswordService) SetBcryptCost(cost int) {
	if cost >= bcrypt.MinCost && cost <= bcrypt.MaxCost {
		ps.bcryptCost = cost
	}
}

// AddCommonPassword adds a password to the common password list
// Useful for adding site-specific common passwords
func (ps *PasswordService) AddCommonPassword(password string) {
	normalized := strings.ToLower(password)
	ps.commonPasswords[normalized] = struct{}{}
}

// CommonPasswordCount returns the number of passwords in the common list
func (ps *PasswordService) CommonPasswordCount() int {
	return len(ps.commonPasswords)
}
