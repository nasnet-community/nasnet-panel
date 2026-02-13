package utils

import (
	"fmt"
	"time"
)

// GenerateID generates a unique ID using timestamp-based approach.
// For production use, consider using UUID or ULID libraries.
func GenerateID() string {
	return fmt.Sprintf("id-%d", time.Now().UnixNano())
}

// GenerateKnownID generates a unique ID with "known-" prefix.
func GenerateKnownID() string {
	return fmt.Sprintf("known-%d", time.Now().UnixNano())
}
