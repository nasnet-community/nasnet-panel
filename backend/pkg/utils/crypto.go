// Package utils provides utility functions for the NasNet panel.
package utils

import (
	"crypto/rand"
	"encoding/base64"
	"fmt"

	"golang.org/x/crypto/curve25519"
)

// GenerateWireGuardPrivateKey generates a random WireGuard private key.
func GenerateWireGuardPrivateKey() (string, error) {
	privateKeyBytes := make([]byte, 32)
	_, err := rand.Read(privateKeyBytes)
	if err != nil {
		return "", fmt.Errorf("error generating random bytes: %w", err)
	}
	privateKeyBytes[0] &= 248
	privateKeyBytes[31] &= 127
	privateKeyBytes[31] |= 64
	return base64.StdEncoding.EncodeToString(privateKeyBytes), nil
}

// GenerateWireGuardPublicKey derives the public key from a WireGuard private key using Curve25519.
func GenerateWireGuardPublicKey(privateKeyB64 string) (string, error) {
	// Decode the base64 encoded private key
	privateKeyBytes, err := base64.StdEncoding.DecodeString(privateKeyB64)
	if err != nil {
		return "", fmt.Errorf("failed to decode private key: %w", err)
	}

	if len(privateKeyBytes) != 32 {
		return "", fmt.Errorf("invalid private key length: expected 32 bytes, got %d", len(privateKeyBytes))
	}

	// Derive the public key using Curve25519
	var privKey [32]byte
	copy(privKey[:], privateKeyBytes)

	publicKeyBytes, err := curve25519.X25519(privKey[:], curve25519.Basepoint)
	if err != nil {
		return "", fmt.Errorf("failed to derive public key: %w", err)
	}

	return base64.StdEncoding.EncodeToString(publicKeyBytes), nil
}

// RandString generates a random string of the specified length using crypto/rand.
func RandString(length int) string {
	return rand.Text()[:length]
}

// GenerateRandomString generates a random string with length between minLen and maxLen (inclusive).
// The string uses alphanumeric characters (a-z, A-Z, 0-9) plus _ and - but not at start or end.
func GenerateRandomString(minLen, maxLen int) (string, error) {
	if minLen < 0 || maxLen < 0 || minLen > maxLen {
		minLen = 8
		maxLen = 16
	}

	// Determine the actual length using crypto/rand
	length := minLen
	if maxLen > minLen {
		randByte := make([]byte, 1)
		if _, err := rand.Read(randByte); err != nil {
			return "", fmt.Errorf("failed to generate random bytes: %w", err)
		}
		length = minLen + int(randByte[0])%(maxLen-minLen+1)
	}

	// Character set: alphanumeric + _ and -
	charset := "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-"
	// Character set for start and end: alphanumeric only
	alphanumericCharset := "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	charsetLen := len(charset)
	alphanumericLen := len(alphanumericCharset)

	result := make([]byte, length)
	randomBytes := make([]byte, length)
	_, err := rand.Read(randomBytes)
	if err != nil {
		return "", fmt.Errorf("failed to generate random bytes: %w", err)
	}

	for i, b := range randomBytes {
		// Use alphanumeric charset for first and last character
		if i == 0 || i == length-1 {
			result[i] = alphanumericCharset[int(b)%alphanumericLen]
		} else {
			result[i] = charset[int(b)%charsetLen]
		}
	}

	return string(result), nil
}
