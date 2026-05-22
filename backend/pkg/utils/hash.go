package utils

import (
	"crypto/sha256"
	"encoding/hex"
)

// HashSHA256 hashes the input string using SHA256 algorithm and returns hex-encoded string.
func HashSHA256(input string) string {
	hash := sha256.Sum256([]byte(input))
	return hex.EncodeToString(hash[:])
}
