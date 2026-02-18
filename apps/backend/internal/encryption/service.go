// Package encryption provides AES-256-GCM encryption services for sensitive data.
// This package is used to encrypt router credentials at rest in the database.
//
// Security considerations:
// - Uses AES-256-GCM (authenticated encryption with associated data)
// - Nonce is randomly generated for each encryption operation
// - Key must be 32 bytes (256 bits) from DB_ENCRYPTION_KEY environment variable
// - Ciphertext includes authentication tag for integrity verification
package encryption

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/subtle"
	"encoding/base64"
	"errors"
	"fmt"
	"io"
	"os"
	"sync"
)

// Key size constants
const (
	// KeySize is the required key size for AES-256 (32 bytes = 256 bits)
	KeySize = 32
	// NonceSize is the nonce size for AES-GCM (12 bytes standard)
	NonceSize = 12
)

// Error definitions
var (
	// ErrKeyNotSet is returned when DB_ENCRYPTION_KEY environment variable is not set
	ErrKeyNotSet = errors.New("DB_ENCRYPTION_KEY environment variable is not set")
	// ErrInvalidKeySize is returned when the encryption key is not 32 bytes
	ErrInvalidKeySize = errors.New("encryption key must be exactly 32 bytes")
	// ErrDecryptionFailed is returned when decryption fails (wrong key or corrupted data)
	ErrDecryptionFailed = errors.New("decryption failed: data may be corrupted or wrong key")
	// ErrInvalidCiphertext is returned when ciphertext is too short or malformed
	ErrInvalidCiphertext = errors.New("invalid ciphertext: too short or malformed")
	// ErrEmptyPlaintext is returned when trying to encrypt empty data
	ErrEmptyPlaintext = errors.New("cannot encrypt empty plaintext")
)

// Service provides AES-256-GCM encryption and decryption for sensitive data.
// It is thread-safe and can be used concurrently.
type Service struct {
	key        []byte
	keyVersion int
	mu         sync.RWMutex
}

// Config holds configuration for the encryption service
type Config struct {
	// Key is the 32-byte encryption key (required)
	Key []byte
	// KeyVersion is the version of the key for rotation support (default: 1)
	KeyVersion int
}

// NewService creates a new encryption service with the given configuration.
// Returns an error if the key is invalid.
func NewService(config Config) (*Service, error) {
	if len(config.Key) != KeySize {
		return nil, fmt.Errorf("%w: got %d bytes, want %d bytes", ErrInvalidKeySize, len(config.Key), KeySize)
	}

	keyVersion := config.KeyVersion
	if keyVersion == 0 {
		keyVersion = 1
	}

	// Make a copy of the key to prevent external modification
	keyCopy := make([]byte, KeySize)
	copy(keyCopy, config.Key)

	return &Service{
		key:        keyCopy,
		keyVersion: keyVersion,
	}, nil
}

// NewServiceFromEnv creates a new encryption service using the DB_ENCRYPTION_KEY
// environment variable. The key should be base64-encoded and decode to 32 bytes.
func NewServiceFromEnv() (*Service, error) {
	keyStr := os.Getenv("DB_ENCRYPTION_KEY")
	if keyStr == "" {
		return nil, ErrKeyNotSet
	}

	// Try to decode as base64 first
	key, err := base64.StdEncoding.DecodeString(keyStr)
	if err != nil {
		// If not base64, try using the raw string (must be exactly 32 bytes)
		key = []byte(keyStr)
	}

	if len(key) != KeySize {
		return nil, fmt.Errorf("%w: decoded key is %d bytes, want %d bytes", ErrInvalidKeySize, len(key), KeySize)
	}

	return NewService(Config{Key: key})
}

// Encrypt encrypts plaintext using AES-256-GCM.
// Returns base64-encoded ciphertext with prepended nonce.
// The format is: base64(nonce || ciphertext || tag)
func (s *Service) Encrypt(plaintext string) (string, error) {
	if plaintext == "" {
		return "", ErrEmptyPlaintext
	}

	return s.EncryptBytes([]byte(plaintext))
}

// EncryptBytes encrypts plaintext bytes using AES-256-GCM.
// Returns base64-encoded ciphertext with prepended nonce.
func (s *Service) EncryptBytes(plaintext []byte) (string, error) {
	if len(plaintext) == 0 {
		return "", ErrEmptyPlaintext
	}

	s.mu.RLock()
	key := s.key
	s.mu.RUnlock()

	// Create AES cipher
	block, err := aes.NewCipher(key)
	if err != nil {
		return "", fmt.Errorf("failed to create AES cipher: %w", err)
	}

	// Create GCM mode
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", fmt.Errorf("failed to create GCM: %w", err)
	}

	// Generate random nonce
	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", fmt.Errorf("failed to generate nonce: %w", err)
	}

	// Encrypt and append authentication tag
	// Seal appends the ciphertext to the nonce slice
	ciphertext := gcm.Seal(nonce, nonce, plaintext, nil)

	// Encode as base64
	return base64.StdEncoding.EncodeToString(ciphertext), nil
}

// Decrypt decrypts base64-encoded ciphertext using AES-256-GCM.
// The ciphertext must be in the format: base64(nonce || ciphertext || tag)
func (s *Service) Decrypt(ciphertext string) (string, error) {
	plaintext, err := s.DecryptBytes(ciphertext)
	if err != nil {
		return "", err
	}
	return string(plaintext), nil
}

// DecryptBytes decrypts base64-encoded ciphertext and returns plaintext bytes.
func (s *Service) DecryptBytes(ciphertext string) ([]byte, error) {
	if ciphertext == "" {
		return nil, ErrInvalidCiphertext
	}

	// Decode from base64
	data, err := base64.StdEncoding.DecodeString(ciphertext)
	if err != nil {
		return nil, fmt.Errorf("%w: base64 decode failed: %w", ErrInvalidCiphertext, err)
	}

	s.mu.RLock()
	key := s.key
	s.mu.RUnlock()

	// Create AES cipher
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, fmt.Errorf("failed to create AES cipher: %w", err)
	}

	// Create GCM mode
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, fmt.Errorf("failed to create GCM: %w", err)
	}

	// Check minimum size (nonce + at least some ciphertext + tag)
	nonceSize := gcm.NonceSize()
	if len(data) < nonceSize+gcm.Overhead() {
		return nil, ErrInvalidCiphertext
	}

	// Extract nonce and ciphertext
	nonce, ciphertextBytes := data[:nonceSize], data[nonceSize:]

	// Decrypt and verify authentication tag
	plaintext, err := gcm.Open(nil, nonce, ciphertextBytes, nil)
	if err != nil {
		return nil, ErrDecryptionFailed
	}

	return plaintext, nil
}

// KeyVersion returns the current key version for rotation tracking.
func (s *Service) KeyVersion() int {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.keyVersion
}

// RotateKey rotates the encryption key to a new key.
// This should be called when re-encrypting data with a new key.
// Note: This does NOT re-encrypt existing data; that must be done separately.
func (s *Service) RotateKey(newKey []byte, newVersion int) error {
	if len(newKey) != KeySize {
		return fmt.Errorf("%w: got %d bytes, want %d bytes", ErrInvalidKeySize, len(newKey), KeySize)
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	// Make a copy
	keyCopy := make([]byte, KeySize)
	copy(keyCopy, newKey)

	s.key = keyCopy
	s.keyVersion = newVersion

	return nil
}

// SecureCompare performs constant-time comparison of two strings.
// This prevents timing attacks when comparing sensitive data.
func SecureCompare(a, b string) bool {
	return subtle.ConstantTimeCompare([]byte(a), []byte(b)) == 1
}

// SecureCompareBytes performs constant-time comparison of two byte slices.
func SecureCompareBytes(a, b []byte) bool {
	return subtle.ConstantTimeCompare(a, b) == 1
}

// ZeroBytes securely zeroes out a byte slice.
// This should be called to clear sensitive data from memory when no longer needed.
func ZeroBytes(b []byte) {
	for i := range b {
		b[i] = 0
	}
}

// GenerateKey generates a cryptographically secure random 32-byte key.
// This is useful for generating new encryption keys.
func GenerateKey() ([]byte, error) {
	key := make([]byte, KeySize)
	if _, err := io.ReadFull(rand.Reader, key); err != nil {
		return nil, fmt.Errorf("failed to generate key: %w", err)
	}
	return key, nil
}

// GenerateKeyBase64 generates a new encryption key and returns it base64-encoded.
// The returned string can be used directly as DB_ENCRYPTION_KEY.
func GenerateKeyBase64() (string, error) {
	key, err := GenerateKey()
	if err != nil {
		return "", err
	}
	return base64.StdEncoding.EncodeToString(key), nil
}
