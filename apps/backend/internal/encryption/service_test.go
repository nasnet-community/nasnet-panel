package encryption

import (
	"encoding/base64"
	"errors"
	"os"
	"strings"
	"sync"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestKey is a valid 32-byte test key
var testKey = []byte("0123456789ABCDEF0123456789ABCDEF")

func TestNewService(t *testing.T) {
	tests := []struct {
		name    string
		config  Config
		wantErr error
		wantVer int
	}{
		{
			name: "valid 32-byte key",
			config: Config{
				Key:        testKey,
				KeyVersion: 1,
			},
			wantErr: nil,
			wantVer: 1,
		},
		{
			name: "default key version",
			config: Config{
				Key:        testKey,
				KeyVersion: 0, // Should default to 1
			},
			wantErr: nil,
			wantVer: 1,
		},
		{
			name: "custom key version",
			config: Config{
				Key:        testKey,
				KeyVersion: 5,
			},
			wantErr: nil,
			wantVer: 5,
		},
		{
			name: "key too short",
			config: Config{
				Key: []byte("tooshort"),
			},
			wantErr: ErrInvalidKeySize,
		},
		{
			name: "key too long",
			config: Config{
				Key: []byte("0123456789ABCDEF0123456789ABCDEF_EXTRA"),
			},
			wantErr: ErrInvalidKeySize,
		},
		{
			name: "empty key",
			config: Config{
				Key: []byte{},
			},
			wantErr: ErrInvalidKeySize,
		},
		{
			name: "nil key",
			config: Config{
				Key: nil,
			},
			wantErr: ErrInvalidKeySize,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			svc, err := NewService(tt.config)
			if tt.wantErr != nil {
				assert.ErrorIs(t, err, tt.wantErr)
				assert.Nil(t, svc)
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, svc)
				assert.Equal(t, tt.wantVer, svc.KeyVersion())
			}
		})
	}
}

func TestNewServiceFromEnv(t *testing.T) {
	// Save original env value
	original := os.Getenv("DB_ENCRYPTION_KEY")
	defer os.Setenv("DB_ENCRYPTION_KEY", original)

	tests := []struct {
		name    string
		envVal  string
		wantErr error
	}{
		{
			name:    "base64 encoded key",
			envVal:  base64.StdEncoding.EncodeToString(testKey),
			wantErr: nil,
		},
		{
			name:    "raw 32-byte string key",
			envVal:  string(testKey),
			wantErr: nil,
		},
		{
			name:    "empty env",
			envVal:  "",
			wantErr: ErrKeyNotSet,
		},
		{
			name:    "invalid base64 wrong size",
			envVal:  base64.StdEncoding.EncodeToString([]byte("short")),
			wantErr: ErrInvalidKeySize,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.envVal == "" {
				os.Unsetenv("DB_ENCRYPTION_KEY")
			} else {
				os.Setenv("DB_ENCRYPTION_KEY", tt.envVal)
			}

			svc, err := NewServiceFromEnv()
			if tt.wantErr != nil {
				assert.ErrorIs(t, err, tt.wantErr)
				assert.Nil(t, svc)
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, svc)
			}
		})
	}
}

func TestEncryptDecrypt(t *testing.T) {
	svc, err := NewService(Config{Key: testKey})
	require.NoError(t, err)

	tests := []struct {
		name      string
		plaintext string
		wantErr   error
	}{
		{
			name:      "simple string",
			plaintext: "hello world",
		},
		{
			name:      "password",
			plaintext: "MySecretP@ssw0rd!",
		},
		{
			name:      "unicode characters",
			plaintext: "こんにちは世界 🔐",
		},
		{
			name:      "long string",
			plaintext: strings.Repeat("a", 10000),
		},
		{
			name:      "special characters",
			plaintext: "!@#$%^&*()_+-=[]{}|;':\",./<>?`~",
		},
		{
			name:      "newlines and tabs",
			plaintext: "line1\nline2\ttab",
		},
		{
			name:      "single character",
			plaintext: "x",
		},
		{
			name:      "empty string",
			plaintext: "",
			wantErr:   ErrEmptyPlaintext,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Encrypt
			ciphertext, err := svc.Encrypt(tt.plaintext)
			if tt.wantErr != nil {
				assert.ErrorIs(t, err, tt.wantErr)
				return
			}
			require.NoError(t, err)
			assert.NotEmpty(t, ciphertext)

			// Ciphertext should be base64
			_, err = base64.StdEncoding.DecodeString(ciphertext)
			assert.NoError(t, err, "ciphertext should be valid base64")

			// Ciphertext should be different from plaintext
			assert.NotEqual(t, tt.plaintext, ciphertext)

			// Decrypt
			decrypted, err := svc.Decrypt(ciphertext)
			require.NoError(t, err)
			assert.Equal(t, tt.plaintext, decrypted)
		})
	}
}

func TestEncryptBytes(t *testing.T) {
	svc, err := NewService(Config{Key: testKey})
	require.NoError(t, err)

	// Test with binary data
	binaryData := []byte{0x00, 0x01, 0x02, 0xFF, 0xFE, 0xFD}
	ciphertext, err := svc.EncryptBytes(binaryData)
	require.NoError(t, err)

	decrypted, err := svc.DecryptBytes(ciphertext)
	require.NoError(t, err)
	assert.Equal(t, binaryData, decrypted)

	// Test empty bytes
	_, err = svc.EncryptBytes([]byte{})
	assert.ErrorIs(t, err, ErrEmptyPlaintext)

	_, err = svc.EncryptBytes(nil)
	assert.ErrorIs(t, err, ErrEmptyPlaintext)
}

func TestDecryptErrors(t *testing.T) {
	svc, err := NewService(Config{Key: testKey})
	require.NoError(t, err)

	tests := []struct {
		name       string
		ciphertext string
		wantErr    error
	}{
		{
			name:       "empty ciphertext",
			ciphertext: "",
			wantErr:    ErrInvalidCiphertext,
		},
		{
			name:       "invalid base64",
			ciphertext: "not-valid-base64!!!",
			wantErr:    ErrInvalidCiphertext,
		},
		{
			name:       "too short ciphertext",
			ciphertext: base64.StdEncoding.EncodeToString([]byte("short")),
			wantErr:    ErrInvalidCiphertext,
		},
		{
			name:       "corrupted ciphertext",
			ciphertext: base64.StdEncoding.EncodeToString(make([]byte, 100)),
			wantErr:    ErrDecryptionFailed,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := svc.Decrypt(tt.ciphertext)
			assert.ErrorIs(t, err, tt.wantErr)
		})
	}
}

func TestDecryptWithWrongKey(t *testing.T) {
	// Encrypt with one key
	svc1, err := NewService(Config{Key: testKey})
	require.NoError(t, err)

	ciphertext, err := svc1.Encrypt("secret data")
	require.NoError(t, err)

	// Try to decrypt with different key
	differentKey := []byte("DIFFERENT_KEY_12DIFFERENT_KEY_12")
	svc2, err := NewService(Config{Key: differentKey})
	require.NoError(t, err)

	_, err = svc2.Decrypt(ciphertext)
	assert.ErrorIs(t, err, ErrDecryptionFailed)
}

func TestEncryptProducesUniqueCiphertext(t *testing.T) {
	svc, err := NewService(Config{Key: testKey})
	require.NoError(t, err)

	plaintext := "same plaintext"
	ciphertexts := make(map[string]bool)

	// Encrypt the same plaintext multiple times
	for i := 0; i < 100; i++ {
		ciphertext, err := svc.Encrypt(plaintext)
		require.NoError(t, err)

		// Each ciphertext should be unique due to random nonce
		assert.False(t, ciphertexts[ciphertext], "ciphertext should be unique")
		ciphertexts[ciphertext] = true
	}
}

func TestConcurrentEncryptDecrypt(t *testing.T) {
	svc, err := NewService(Config{Key: testKey})
	require.NoError(t, err)

	var wg sync.WaitGroup
	errors := make(chan error, 100)

	// Concurrent encryptions and decryptions
	for i := 0; i < 100; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()

			plaintext := strings.Repeat("x", id+1)
			ciphertext, err := svc.Encrypt(plaintext)
			if err != nil {
				errors <- err
				return
			}

			decrypted, err := svc.Decrypt(ciphertext)
			if err != nil {
				errors <- err
				return
			}

			if decrypted != plaintext {
				errors <- assert.AnError
			}
		}(i)
	}

	wg.Wait()
	close(errors)

	for err := range errors {
		t.Errorf("concurrent operation failed: %v", err)
	}
}

func TestKeyRotation(t *testing.T) {
	svc, err := NewService(Config{Key: testKey, KeyVersion: 1})
	require.NoError(t, err)

	// Encrypt with original key
	ciphertext, err := svc.Encrypt("secret")
	require.NoError(t, err)

	// Verify original key version
	assert.Equal(t, 1, svc.KeyVersion())

	// Rotate key
	newKey := []byte("NEW_KEY_FOR_ROTATION_32_BYTES__!")
	err = svc.RotateKey(newKey, 2)
	require.NoError(t, err)

	// Verify new key version
	assert.Equal(t, 2, svc.KeyVersion())

	// Old ciphertext should fail with new key
	_, err = svc.Decrypt(ciphertext)
	assert.ErrorIs(t, err, ErrDecryptionFailed)

	// New encryption should work
	newCiphertext, err := svc.Encrypt("new secret")
	require.NoError(t, err)

	decrypted, err := svc.Decrypt(newCiphertext)
	require.NoError(t, err)
	assert.Equal(t, "new secret", decrypted)

	// Test invalid key rotation
	err = svc.RotateKey([]byte("short"), 3)
	assert.ErrorIs(t, err, ErrInvalidKeySize)
}

func TestSecureCompare(t *testing.T) {
	tests := []struct {
		name string
		a    string
		b    string
		want bool
	}{
		{
			name: "equal strings",
			a:    "password123",
			b:    "password123",
			want: true,
		},
		{
			name: "different strings",
			a:    "password123",
			b:    "password124",
			want: false,
		},
		{
			name: "different lengths",
			a:    "short",
			b:    "longer string",
			want: false,
		},
		{
			name: "empty strings",
			a:    "",
			b:    "",
			want: true,
		},
		{
			name: "one empty",
			a:    "notempty",
			b:    "",
			want: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := SecureCompare(tt.a, tt.b)
			assert.Equal(t, tt.want, result)
		})
	}
}

func TestSecureCompareBytes(t *testing.T) {
	tests := []struct {
		name string
		a    []byte
		b    []byte
		want bool
	}{
		{
			name: "equal bytes",
			a:    []byte{0x01, 0x02, 0x03},
			b:    []byte{0x01, 0x02, 0x03},
			want: true,
		},
		{
			name: "different bytes",
			a:    []byte{0x01, 0x02, 0x03},
			b:    []byte{0x01, 0x02, 0x04},
			want: false,
		},
		{
			name: "nil slices",
			a:    nil,
			b:    nil,
			want: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := SecureCompareBytes(tt.a, tt.b)
			assert.Equal(t, tt.want, result)
		})
	}
}

func TestZeroBytes(t *testing.T) {
	data := []byte("sensitive data")
	original := make([]byte, len(data))
	copy(original, data)

	ZeroBytes(data)

	// All bytes should be zero
	for i, b := range data {
		assert.Equal(t, byte(0), b, "byte at index %d should be zero", i)
	}

	// Original should be unchanged
	assert.Equal(t, "sensitive data", string(original))
}

func TestGenerateKey(t *testing.T) {
	keys := make(map[string]bool)

	// Generate multiple keys
	for i := 0; i < 100; i++ {
		key, err := GenerateKey()
		require.NoError(t, err)

		// Key should be exactly 32 bytes
		assert.Len(t, key, KeySize)

		// Key should be unique
		keyStr := string(key)
		assert.False(t, keys[keyStr], "generated key should be unique")
		keys[keyStr] = true
	}
}

func TestGenerateKeyBase64(t *testing.T) {
	keyStr, err := GenerateKeyBase64()
	require.NoError(t, err)

	// Should be valid base64
	key, err := base64.StdEncoding.DecodeString(keyStr)
	require.NoError(t, err)

	// Decoded key should be 32 bytes
	assert.Len(t, key, KeySize)

	// Should be usable for creating a service
	svc, err := NewService(Config{Key: key})
	require.NoError(t, err)
	assert.NotNil(t, svc)
}

// Benchmark tests
func BenchmarkEncrypt(b *testing.B) {
	svc, _ := NewService(Config{Key: testKey})
	plaintext := "benchmark test data for encryption"

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = svc.Encrypt(plaintext)
	}
}

func BenchmarkDecrypt(b *testing.B) {
	svc, _ := NewService(Config{Key: testKey})
	ciphertext, _ := svc.Encrypt("benchmark test data for decryption")

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = svc.Decrypt(ciphertext)
	}
}

func BenchmarkEncryptDecrypt(b *testing.B) {
	svc, _ := NewService(Config{Key: testKey})
	plaintext := "benchmark round-trip encryption and decryption"

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		ciphertext, _ := svc.Encrypt(plaintext)
		_, _ = svc.Decrypt(ciphertext)
	}
}

// NIST test vectors validation
// AES-256-GCM doesn't have official NIST test vectors in the same format,
// but we can validate the implementation produces expected behavior
func TestNISTCompliance(t *testing.T) {
	svc, err := NewService(Config{Key: testKey})
	require.NoError(t, err)

	// Test that encryption produces authenticated ciphertext
	// (GCM tag is included and verified)
	plaintext := "test plaintext"
	ciphertext, err := svc.Encrypt(plaintext)
	require.NoError(t, err)

	// Decode ciphertext
	data, err := base64.StdEncoding.DecodeString(ciphertext)
	require.NoError(t, err)

	// GCM ciphertext should include:
	// - 12-byte nonce
	// - ciphertext (same length as plaintext)
	// - 16-byte authentication tag
	expectedMinLen := NonceSize + len(plaintext) + 16 // 16 is GCM tag size
	assert.GreaterOrEqual(t, len(data), expectedMinLen,
		"ciphertext should include nonce, ciphertext, and auth tag")

	// Tamper with ciphertext (flip a bit in the middle)
	tamperedData := make([]byte, len(data))
	copy(tamperedData, data)
	tamperedData[len(tamperedData)/2] ^= 0x01

	tamperedCiphertext := base64.StdEncoding.EncodeToString(tamperedData)
	_, err = svc.Decrypt(tamperedCiphertext)
	assert.ErrorIs(t, err, ErrDecryptionFailed, "tampered ciphertext should fail authentication")

	// Tamper with authentication tag (last 16 bytes)
	tamperedTag := make([]byte, len(data))
	copy(tamperedTag, data)
	tamperedTag[len(tamperedTag)-1] ^= 0x01

	tamperedTagCiphertext := base64.StdEncoding.EncodeToString(tamperedTag)
	_, err = svc.Decrypt(tamperedTagCiphertext)
	assert.ErrorIs(t, err, ErrDecryptionFailed, "tampering with auth tag should fail verification")
}

func TestDeriveKeyFromPassword(t *testing.T) {
	tests := []struct {
		name       string
		password   string
		salt       []byte
		iterations int
		wantErr    error
	}{
		{
			name:       "valid password derivation",
			password:   "mypassword123",
			salt:       make([]byte, 16), // 16-byte salt
			iterations: 100000,
			wantErr:    nil,
		},
		{
			name:       "empty password",
			password:   "",
			salt:       make([]byte, 16),
			iterations: 100000,
			wantErr:    errors.New("password cannot be empty"),
		},
		{
			name:       "invalid salt length",
			password:   "password",
			salt:       make([]byte, 8), // Wrong size
			iterations: 100000,
			wantErr:    errors.New("salt must be 16 bytes"),
		},
		{
			name:       "insufficient iterations",
			password:   "password",
			salt:       make([]byte, 16),
			iterations: 50000, // Too low
			wantErr:    errors.New("iterations must be at least 100000"),
		},
		{
			name:       "high iteration count",
			password:   "strong-password",
			salt:       make([]byte, 16),
			iterations: 250000,
			wantErr:    nil,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			key, err := DeriveKeyFromPassword(tt.password, tt.salt, tt.iterations)

			if tt.wantErr != nil {
				assert.ErrorContains(t, err, tt.wantErr.Error())
				assert.Nil(t, key)
			} else {
				require.NoError(t, err)
				require.NotNil(t, key)
				assert.Len(t, key, KeySize)

				// Derived key should be usable
				svc, err := NewService(Config{Key: key})
				require.NoError(t, err)
				assert.NotNil(t, svc)
			}
		})
	}

	// Test that different passwords produce different keys
	password1 := "password1"
	password2 := "password2"
	salt := make([]byte, 16)

	key1, err := DeriveKeyFromPassword(password1, salt, 100000)
	require.NoError(t, err)

	key2, err := DeriveKeyFromPassword(password2, salt, 100000)
	require.NoError(t, err)

	assert.NotEqual(t, key1, key2, "different passwords should produce different keys")

	// Test that same password with different salts produce different keys
	salt1 := make([]byte, 16)
	salt2 := make([]byte, 16)
	salt2[0] = 0xFF

	key3, err := DeriveKeyFromPassword(password1, salt1, 100000)
	require.NoError(t, err)

	key4, err := DeriveKeyFromPassword(password1, salt2, 100000)
	require.NoError(t, err)

	assert.NotEqual(t, key3, key4, "different salts should produce different keys")
}

func TestGenerateSalt(t *testing.T) {
	salts := make(map[string]bool)

	// Generate multiple salts
	for i := 0; i < 50; i++ {
		salt, err := GenerateSalt()
		require.NoError(t, err)

		// Salt should be exactly 16 bytes
		assert.Len(t, salt, 16)

		// Salt should be unique (extremely high probability)
		saltStr := string(salt)
		assert.False(t, salts[saltStr], "generated salt should be unique")
		salts[saltStr] = true
	}
}

func TestDeriveKeyFromPasswordRoundTrip(t *testing.T) {
	// Test that a key derived from a password can be used for encryption
	password := "my-secret-password"
	salt := make([]byte, 16)

	// Derive key
	key, err := DeriveKeyFromPassword(password, salt, 100000)
	require.NoError(t, err)

	// Create service with derived key
	svc, err := NewService(Config{Key: key})
	require.NoError(t, err)

	// Encrypt and decrypt
	plaintext := "sensitive data"
	ciphertext, err := svc.Encrypt(plaintext)
	require.NoError(t, err)

	decrypted, err := svc.Decrypt(ciphertext)
	require.NoError(t, err)

	assert.Equal(t, plaintext, decrypted)
}
