package features

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestVerifySHA256(t *testing.T) {
	// Create a temporary directory
	tmpDir := t.TempDir()

	// Create a test file with known content
	testFile := filepath.Join(tmpDir, "test.txt")
	testContent := []byte("Hello, World!")
	if err := os.WriteFile(testFile, testContent, 0644); err != nil {
		t.Fatalf("Failed to create test file: %v", err)
	}

	// Known SHA256 for "Hello, World!"
	expectedChecksum := "dffd6021bb2bd5b0af676290809ec3a53191dd81c7f70a4b28688a362182986f"

	tests := []struct {
		name        string
		filePath    string
		checksum    string
		shouldError bool
		errorType   string
	}{
		{
			name:        "Valid checksum",
			filePath:    testFile,
			checksum:    expectedChecksum,
			shouldError: false,
		},
		{
			name:        "Valid checksum (uppercase)",
			filePath:    testFile,
			checksum:    "DFFD6021BB2BD5B0AF676290809EC3A53191DD81C7F70A4B28688A362182986F",
			shouldError: false,
		},
		{
			name:        "Valid checksum (mixed case)",
			filePath:    testFile,
			checksum:    "DFFd6021bb2BD5B0af676290809EC3a53191dd81C7F70a4b28688A362182986F",
			shouldError: false,
		},
		{
			name:        "Invalid checksum",
			filePath:    testFile,
			checksum:    "0000000000000000000000000000000000000000000000000000000000000000",
			shouldError: true,
			errorType:   "*features.VerifyError",
		},
		{
			name:        "File not found",
			filePath:    filepath.Join(tmpDir, "nonexistent.txt"),
			checksum:    expectedChecksum,
			shouldError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := VerifySHA256(tt.filePath, tt.checksum)

			if tt.shouldError {
				if err == nil {
					t.Errorf("Expected error but got none")
				}
				if tt.errorType != "" {
					if _, ok := err.(*VerifyError); !ok && tt.errorType == "*features.VerifyError" {
						t.Errorf("Expected error type %s, got %T", tt.errorType, err)
					}
				}
			} else {
				if err != nil {
					t.Errorf("Unexpected error: %v", err)
				}
			}
		})
	}
}

func TestCalculateSHA256(t *testing.T) {
	tmpDir := t.TempDir()

	tests := []struct {
		name             string
		content          string
		expectedChecksum string
	}{
		{
			name:             "Empty file",
			content:          "",
			expectedChecksum: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
		},
		{
			name:             "Hello World",
			content:          "Hello, World!",
			expectedChecksum: "dffd6021bb2bd5b0af676290809ec3a53191dd81c7f70a4b28688a362182986f",
		},
		{
			name:             "Sample text",
			content:          "The quick brown fox jumps over the lazy dog",
			expectedChecksum: "d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			testFile := filepath.Join(tmpDir, tt.name+".txt")
			if err := os.WriteFile(testFile, []byte(tt.content), 0644); err != nil {
				t.Fatalf("Failed to create test file: %v", err)
			}

			checksum, err := CalculateSHA256(testFile)
			if err != nil {
				t.Fatalf("Failed to calculate checksum: %v", err)
			}

			if checksum != tt.expectedChecksum {
				t.Errorf("Expected checksum %s, got %s", tt.expectedChecksum, checksum)
			}
		})
	}
}

func TestCalculateSHA256_FileNotFound(t *testing.T) {
	tmpDir := t.TempDir()
	nonExistent := filepath.Join(tmpDir, "does-not-exist.txt")

	_, err := CalculateSHA256(nonExistent)
	if err == nil {
		t.Error("Expected error for non-existent file, got nil")
	}
}

func TestVerifyError(t *testing.T) {
	err := &VerifyError{
		FilePath: "/tmp/test.bin",
		Expected: "abc123",
		Actual:   "def456",
	}

	expectedMsg := "checksum verification failed for /tmp/test.bin: expected abc123, got def456"
	if err.Error() != expectedMsg {
		t.Errorf("Expected error message %q, got %q", expectedMsg, err.Error())
	}
}

func TestEqualChecksums(t *testing.T) {
	tests := []struct {
		name     string
		a        string
		b        string
		expected bool
	}{
		{
			name:     "Identical lowercase",
			a:        "abc123def456",
			b:        "abc123def456",
			expected: true,
		},
		{
			name:     "Identical uppercase",
			a:        "ABC123DEF456",
			b:        "ABC123DEF456",
			expected: true,
		},
		{
			name:     "Case insensitive match",
			a:        "abc123DEF456",
			b:        "ABC123def456",
			expected: true,
		},
		{
			name:     "Different checksums",
			a:        "abc123",
			b:        "def456",
			expected: false,
		},
		{
			name:     "Different lengths",
			a:        "abc123",
			b:        "abc123def",
			expected: false,
		},
		{
			name:     "Empty strings",
			a:        "",
			b:        "",
			expected: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := equalChecksums(tt.a, tt.b)
			if result != tt.expected {
				t.Errorf("equalChecksums(%q, %q) = %v, expected %v", tt.a, tt.b, result, tt.expected)
			}
		})
	}
}

func equalChecksums(a, b string) bool { return strings.EqualFold(a, b) }
