package features

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"os"
)

// VerifyError represents a checksum verification failure
type VerifyError struct {
	FilePath string
	Expected string
	Actual   string
}

func (e *VerifyError) Error() string {
	return fmt.Sprintf("checksum verification failed for %s: expected %s, got %s", e.FilePath, e.Expected, e.Actual)
}

// VerifySHA256 verifies that a file matches the expected SHA256 checksum
func VerifySHA256(filePath string, expectedChecksum string) error {
	// Open the file
	file, err := os.Open(filePath)
	if err != nil {
		return fmt.Errorf("failed to open file for verification: %w", err)
	}
	defer file.Close()

	// Calculate SHA256 hash
	hash := sha256.New()
	if _, err := io.Copy(hash, file); err != nil {
		return fmt.Errorf("failed to calculate hash: %w", err)
	}

	// Get the hash sum as hex string
	actualChecksum := hex.EncodeToString(hash.Sum(nil))

	// Compare checksums (case-insensitive)
	if !equalChecksums(expectedChecksum, actualChecksum) {
		return &VerifyError{
			FilePath: filePath,
			Expected: expectedChecksum,
			Actual:   actualChecksum,
		}
	}

	return nil
}

// CalculateSHA256 calculates the SHA256 checksum of a file
func CalculateSHA256(filePath string) (string, error) {
	file, err := os.Open(filePath)
	if err != nil {
		return "", fmt.Errorf("failed to open file: %w", err)
	}
	defer file.Close()

	hash := sha256.New()
	if _, err := io.Copy(hash, file); err != nil {
		return "", fmt.Errorf("failed to calculate hash: %w", err)
	}

	return hex.EncodeToString(hash.Sum(nil)), nil
}

// equalChecksums compares two checksums in a case-insensitive manner
func equalChecksums(a, b string) bool {
	// Convert both to lowercase for comparison
	return len(a) == len(b) && hexEqual(a, b)
}

// hexEqual compares two hex strings case-insensitively
func hexEqual(a, b string) bool {
	if len(a) != len(b) {
		return false
	}

	for i := 0; i < len(a); i++ {
		charA := a[i]
		charB := b[i]

		// Normalize to lowercase
		if charA >= 'A' && charA <= 'F' {
			charA = charA - 'A' + 'a'
		}
		if charB >= 'A' && charB <= 'F' {
			charB = charB - 'A' + 'a'
		}

		if charA != charB {
			return false
		}
	}

	return true
}
