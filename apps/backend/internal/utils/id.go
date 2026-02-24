package utils

import (
	"crypto/rand"
	"fmt"
)

// GenerateID generates a cryptographically secure unique ID.
// Uses 12 random bytes (96 bits) encoded as hex for 24-character IDs.
func GenerateID() string {
	b := make([]byte, 12)
	if _, err := rand.Read(b); err != nil {
		panic(err) // Should never happen in normal conditions
	}
	return fmt.Sprintf("id-%x", b)
}

// GenerateKnownID generates a cryptographically secure unique ID with "known-" prefix.
// Uses 12 random bytes (96 bits) encoded as hex for 24-character IDs.
func GenerateKnownID() string {
	b := make([]byte, 12)
	if _, err := rand.Read(b); err != nil {
		panic(err) // Should never happen in normal conditions
	}
	return fmt.Sprintf("known-%x", b)
}
