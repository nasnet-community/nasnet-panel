package registry

import (
	"bufio"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"os"
	"strings"
	// Note: Ed25519 and ECDSA are not currently used for binary verification.
	// This package uses SHA256 checksums. GPG verification is not implemented.
	// Public key pinning is not implemented. These are noted for future enhancement.
)

// ChecksumEntry represents a single entry from checksums.txt in GNU sha256sum format.
type ChecksumEntry struct {
	Hash     string
	Filename string
}

// VerifyError represents a checksum verification failure.
type VerifyError struct {
	FilePath        string
	Expected        string
	Actual          string
	ChecksumsURL    string
	SuggestedAction string
}

func (e *VerifyError) Error() string {
	return fmt.Sprintf("checksum verification failed for %s: expected %s, got %s", e.FilePath, e.Expected, e.Actual)
}

// VerificationResult contains the outcome of a binary verification check.
// Note: GPGVerified and GPGKeyID are reserved for future use and not currently implemented.
type VerificationResult struct {
	Success      bool
	ArchiveHash  string
	BinaryHash   string
	GPGVerified  bool   // Reserved for future use
	GPGKeyID     string // Reserved for future use
	Error        *VerifyError
	VerifiedAt   string
	ChecksumsURL string
}

// ParseChecksumsFile parses a checksums.txt file in GNU sha256sum format.
// Format: <sha256hex>  <filename>
// Empty lines and lines starting with # are skipped.
// MaxFileSize is the maximum file size to verify (1GB). Larger files will be rejected.
const MaxFileSizeToVerify = 1024 * 1024 * 1024 // 1GB

// ParseChecksumsFile parses a checksums.txt file in GNU sha256sum format.
// Format: <sha256hex>  <filename>
// Empty lines and lines starting with # are skipped.
func ParseChecksumsFile(r io.Reader) ([]ChecksumEntry, error) {
	var entries []ChecksumEntry
	scanner := bufio.NewScanner(r)

	lineNum := 0
	for scanner.Scan() {
		lineNum++
		line := strings.TrimSpace(scanner.Text())

		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}

		parts := strings.SplitN(line, " ", 2)
		if len(parts) != 2 {
			return nil, fmt.Errorf("invalid checksums.txt format at line %d: expected '<hash>  <filename>'", lineNum)
		}

		hash := strings.TrimSpace(parts[0])
		filename := strings.TrimSpace(parts[1])

		if len(hash) != 64 {
			return nil, fmt.Errorf("invalid SHA256 hash length at line %d: expected 64 characters, got %d", lineNum, len(hash))
		}

		if _, err := hex.DecodeString(hash); err != nil {
			return nil, fmt.Errorf("invalid SHA256 hash at line %d: %w", lineNum, err)
		}

		if filename == "" {
			return nil, fmt.Errorf("missing filename at line %d", lineNum)
		}

		entries = append(entries, ChecksumEntry{
			Hash:     strings.ToLower(hash),
			Filename: filename,
		})
	}

	if err := scanner.Err(); err != nil {
		return nil, fmt.Errorf("error reading checksums file: %w", err)
	}

	return entries, nil
}

// CalculateSHA256 calculates the SHA256 checksum of a file.
// Returns an error if the file exceeds MaxFileSizeToVerify.
func CalculateSHA256(filePath string) (string, error) {
	file, err := os.Open(filePath)
	if err != nil {
		return "", fmt.Errorf("failed to open file: %w", err)
	}
	defer file.Close()

	// Check file size before hashing
	fileInfo, err := file.Stat()
	if err != nil {
		return "", fmt.Errorf("failed to stat file: %w", err)
	}
	if fileInfo.Size() > MaxFileSizeToVerify {
		return "", fmt.Errorf("file size %d exceeds maximum allowed %d", fileInfo.Size(), MaxFileSizeToVerify)
	}

	hash := sha256.New()
	// Limit read to MaxFileSizeToVerify to prevent reading oversized files
	limitedFile := io.LimitReader(file, MaxFileSizeToVerify)
	if _, err := io.Copy(hash, limitedFile); err != nil {
		return "", fmt.Errorf("failed to calculate hash: %w", err)
	}

	return hex.EncodeToString(hash.Sum(nil)), nil
}

// VerifySHA256 verifies that a file matches the expected SHA256 checksum.
// Returns an error if the file exceeds MaxFileSizeToVerify.
func VerifySHA256(filePath, expectedChecksum string) error {
	file, err := os.Open(filePath)
	if err != nil {
		return fmt.Errorf("failed to open file for verification: %w", err)
	}
	defer file.Close()

	// Check file size before hashing
	fileInfo, err := file.Stat()
	if err != nil {
		return fmt.Errorf("failed to stat file: %w", err)
	}
	if fileInfo.Size() > MaxFileSizeToVerify {
		return fmt.Errorf("file size %d exceeds maximum allowed %d", fileInfo.Size(), MaxFileSizeToVerify)
	}

	hash := sha256.New()
	// Limit read to MaxFileSizeToVerify to prevent reading oversized files
	limitedFile := io.LimitReader(file, MaxFileSizeToVerify)
	if _, err := io.Copy(hash, limitedFile); err != nil {
		return fmt.Errorf("failed to calculate hash: %w", err)
	}

	actualChecksum := hex.EncodeToString(hash.Sum(nil))

	if !EqualChecksums(expectedChecksum, actualChecksum) {
		return &VerifyError{
			FilePath: filePath,
			Expected: expectedChecksum,
			Actual:   actualChecksum,
		}
	}

	return nil
}

// EqualChecksums compares two hex checksums in a case-insensitive manner.
func EqualChecksums(a, b string) bool {
	if len(a) != len(b) {
		return false
	}
	for i := 0; i < len(a); i++ {
		ca, cb := a[i], b[i]
		if ca >= 'A' && ca <= 'F' {
			ca = ca - 'A' + 'a'
		}
		if cb >= 'A' && cb <= 'F' {
			cb = cb - 'A' + 'a'
		}
		if ca != cb {
			return false
		}
	}
	return true
}

// GetFilename extracts the filename from a full path (platform-agnostic).
func GetFilename(path string) string {
	idx := strings.LastIndexAny(path, "/\\")
	if idx == -1 {
		return path
	}
	return path[idx+1:]
}
