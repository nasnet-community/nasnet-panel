package credentials

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestIsEncrypted(t *testing.T) {
	tests := []struct {
		name     string
		data     []byte
		expected bool
	}{
		{
			name:     "empty data is not encrypted",
			data:     []byte{},
			expected: false,
		},
		{
			name:     "nil data is not encrypted",
			data:     nil,
			expected: false,
		},
		{
			name:     "short plaintext is not encrypted",
			data:     []byte("admin"),
			expected: false,
		},
		{
			name:     "short password is not encrypted",
			data:     []byte("password123"),
			expected: false,
		},
		{
			name:     "data with non-base64 chars is not encrypted",
			data:     []byte("this has spaces and !special@ chars"),
			expected: false,
		},
		{
			name:     "valid base64 but too short",
			data:     []byte("SGVsbG9Xb3JsZA=="),
			expected: false,
		},
		{
			name:     "long base64 string is considered encrypted",
			data:     []byte("SGVsbG9Xb3JsZFRoaXNJc0FMb25nU3RyaW5nRm9yVGVzdGluZw=="),
			expected: true,
		},
		{
			name:     "realistic encrypted data",
			data:     []byte("dGhpc2lzYXJlYWxpc3RpY2VuY3J5cHRlZGRhdGFzdHJpbmdmb3J0ZXN0aW5n"),
			expected: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := isEncrypted(tt.data)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestIsBase64Char(t *testing.T) {
	tests := []struct {
		char     byte
		expected bool
	}{
		{'A', true},
		{'Z', true},
		{'a', true},
		{'z', true},
		{'0', true},
		{'9', true},
		{'+', true},
		{'/', true},
		{'=', true},
		{' ', false},
		{'!', false},
		{'@', false},
		{'\n', false},
		{'\t', false},
	}

	for _, tt := range tests {
		t.Run(string(tt.char), func(t *testing.T) {
			result := isBase64Char(tt.char)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestDoubleEncryptionPrevention(t *testing.T) {
	t.Run("detects already encrypted data", func(t *testing.T) {
		// Realistic encrypted data from our encryption service
		// This is base64(nonce + ciphertext + tag)
		encryptedData := []byte("dGhpc2lzYXJlYWxpc3RpY2VuY3J5cHRlZGRhdGFzdHJpbmdmb3J0ZXN0aW5ndG9wcmV2ZW50ZG91YmxlZW5j")

		// Should be detected as encrypted (length > 40 chars, all valid base64)
		result := isEncrypted(encryptedData)
		assert.True(t, result, "Should detect encrypted data to prevent double-encryption")
	})

	t.Run("detects plaintext password", func(t *testing.T) {
		plaintextPassword := []byte("MySecretPassword123")

		// Short plaintext should not be detected as encrypted
		result := isEncrypted(plaintextPassword)
		assert.False(t, result, "Should detect plaintext to allow encryption")
	})
}
