package verification

import (
	"context"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"backend/internal/events"
)

// Test 1: ParseChecksumsFile - Valid checksums.txt
func TestParseChecksumsFile_Valid(t *testing.T) {
	verifier := NewVerifier(nil)

	checksums := `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855  empty.txt
a1b2c3d4e5f6071829aaabbbcccdddeeefff0001112223334445556667778889  binary
0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef  data.json`

	reader := strings.NewReader(checksums)
	entries, err := verifier.ParseChecksumsFile(reader)

	if err != nil {
		t.Fatalf("Expected no error, got: %v", err)
	}

	if len(entries) != 3 {
		t.Fatalf("Expected 3 entries, got %d", len(entries))
	}

	// Verify first entry
	if entries[0].Hash != "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" {
		t.Errorf("Expected hash to match, got: %s", entries[0].Hash)
	}
	if entries[0].Filename != "empty.txt" {
		t.Errorf("Expected filename 'empty.txt', got: %s", entries[0].Filename)
	}

	// Verify second entry
	if entries[1].Filename != "binary" {
		t.Errorf("Expected filename 'binary', got: %s", entries[1].Filename)
	}

	// Verify third entry
	if entries[2].Filename != "data.json" {
		t.Errorf("Expected filename 'data.json', got: %s", entries[2].Filename)
	}
}

// Test 2: ParseChecksumsFile - Empty lines and comments
func TestParseChecksumsFile_EmptyLinesAndComments(t *testing.T) {
	verifier := NewVerifier(nil)

	checksums := `# This is a comment
# Another comment

e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855  file1.txt

# More comments
a1b2c3d4e5f6071829aaabbbcccdddeeefff0001112223334445556667778889  file2.bin

`

	reader := strings.NewReader(checksums)
	entries, err := verifier.ParseChecksumsFile(reader)

	if err != nil {
		t.Fatalf("Expected no error, got: %v", err)
	}

	if len(entries) != 2 {
		t.Fatalf("Expected 2 entries (comments and empty lines skipped), got %d", len(entries))
	}

	if entries[0].Filename != "file1.txt" {
		t.Errorf("Expected filename 'file1.txt', got: %s", entries[0].Filename)
	}
	if entries[1].Filename != "file2.bin" {
		t.Errorf("Expected filename 'file2.bin', got: %s", entries[1].Filename)
	}
}

// Test 3: ParseChecksumsFile - Invalid hex
func TestParseChecksumsFile_InvalidHex(t *testing.T) {
	verifier := NewVerifier(nil)

	checksums := `ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ  file.txt`

	reader := strings.NewReader(checksums)
	_, err := verifier.ParseChecksumsFile(reader)

	if err == nil {
		t.Fatal("Expected error for invalid hex, got nil")
	}

	if !strings.Contains(err.Error(), "invalid SHA256 hash") {
		t.Errorf("Expected error message about invalid hash, got: %v", err)
	}
}

// Test 4: ParseChecksumsFile - Invalid hash length
func TestParseChecksumsFile_InvalidHashLength(t *testing.T) {
	verifier := NewVerifier(nil)

	checksums := `abc123  file.txt`

	reader := strings.NewReader(checksums)
	_, err := verifier.ParseChecksumsFile(reader)

	if err == nil {
		t.Fatal("Expected error for invalid hash length, got nil")
	}

	if !strings.Contains(err.Error(), "invalid SHA256 hash length") {
		t.Errorf("Expected error message about hash length, got: %v", err)
	}
}

// Test 5: ParseChecksumsFile - Missing filename
func TestParseChecksumsFile_MissingFilename(t *testing.T) {
	verifier := NewVerifier(nil)

	// Hash with only one space - should fail format check
	checksums := `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`

	reader := strings.NewReader(checksums)
	_, err := verifier.ParseChecksumsFile(reader)

	if err == nil {
		t.Fatal("Expected error for missing filename, got nil")
	}

	// Should fail either with "invalid format" or "missing filename"
	if !strings.Contains(err.Error(), "invalid checksums.txt format") && !strings.Contains(err.Error(), "missing filename") {
		t.Errorf("Expected error message about invalid format or missing filename, got: %v", err)
	}
}

// Test 6: ParseChecksumsFile - Invalid format
func TestParseChecksumsFile_InvalidFormat(t *testing.T) {
	verifier := NewVerifier(nil)

	checksums := `invalid-line-without-space`

	reader := strings.NewReader(checksums)
	_, err := verifier.ParseChecksumsFile(reader)

	if err == nil {
		t.Fatal("Expected error for invalid format, got nil")
	}

	if !strings.Contains(err.Error(), "invalid checksums.txt format") {
		t.Errorf("Expected error message about invalid format, got: %v", err)
	}
}

// Test 7: VerifyArchive - Success
func TestVerifyArchive_Success(t *testing.T) {
	// Create temp directory
	tmpDir := t.TempDir()

	// Create test archive
	archivePath := filepath.Join(tmpDir, "test.tar.gz")
	archiveContent := []byte("test archive content")
	if err := os.WriteFile(archivePath, archiveContent, 0644); err != nil {
		t.Fatalf("Failed to create test archive: %v", err)
	}

	// Calculate expected hash
	expectedHash, err := CalculateSHA256(archivePath)
	if err != nil {
		t.Fatalf("Failed to calculate hash: %v", err)
	}

	// Create checksums.txt
	checksumsPath := filepath.Join(tmpDir, "checksums.txt")
	checksumsContent := expectedHash + "  test.tar.gz\n"
	if err := os.WriteFile(checksumsPath, []byte(checksumsContent), 0644); err != nil {
		t.Fatalf("Failed to create checksums file: %v", err)
	}

	// Verify
	verifier := NewVerifier(nil)
	result, err := verifier.VerifyArchive(context.Background(), archivePath, checksumsPath, "https://example.com/checksums.txt", nil)

	if err != nil {
		t.Fatalf("Expected no error, got: %v", err)
	}

	if !result.Success {
		t.Errorf("Expected verification success, got failure")
	}

	if result.ArchiveHash != expectedHash {
		t.Errorf("Expected archive hash %s, got %s", expectedHash, result.ArchiveHash)
	}

	if result.ChecksumsURL != "https://example.com/checksums.txt" {
		t.Errorf("Expected ChecksumsURL to be set")
	}
}

// Test 8: VerifyArchive - Hash mismatch
func TestVerifyArchive_HashMismatch(t *testing.T) {
	// Create temp directory
	tmpDir := t.TempDir()

	// Create test archive
	archivePath := filepath.Join(tmpDir, "test.tar.gz")
	archiveContent := []byte("test archive content")
	if err := os.WriteFile(archivePath, archiveContent, 0644); err != nil {
		t.Fatalf("Failed to create test archive: %v", err)
	}

	// Create checksums.txt with WRONG hash
	checksumsPath := filepath.Join(tmpDir, "checksums.txt")
	wrongHash := "0000000000000000000000000000000000000000000000000000000000000000"
	checksumsContent := wrongHash + "  test.tar.gz\n"
	if err := os.WriteFile(checksumsPath, []byte(checksumsContent), 0644); err != nil {
		t.Fatalf("Failed to create checksums file: %v", err)
	}

	// Verify
	verifier := NewVerifier(nil)
	result, err := verifier.VerifyArchive(context.Background(), archivePath, checksumsPath, "https://example.com/checksums.txt", nil)

	if err != nil {
		t.Fatalf("Expected no error, got: %v", err)
	}

	if result.Success {
		t.Errorf("Expected verification failure, got success")
	}

	if result.Error == nil {
		t.Errorf("Expected Error to be set on failure")
	}

	if result.Error.Expected != wrongHash {
		t.Errorf("Expected Error.Expected to be %s, got %s", wrongHash, result.Error.Expected)
	}

	if result.Error.SuggestedAction == "" {
		t.Errorf("Expected SuggestedAction to be set")
	}
}

// Test 9: VerifyArchive - Archive not in checksums.txt
func TestVerifyArchive_ArchiveNotFound(t *testing.T) {
	// Create temp directory
	tmpDir := t.TempDir()

	// Create test archive
	archivePath := filepath.Join(tmpDir, "test.tar.gz")
	archiveContent := []byte("test archive content")
	if err := os.WriteFile(archivePath, archiveContent, 0644); err != nil {
		t.Fatalf("Failed to create test archive: %v", err)
	}

	// Create checksums.txt with DIFFERENT filename
	checksumsPath := filepath.Join(tmpDir, "checksums.txt")
	checksumsContent := "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855  other-file.tar.gz\n"
	if err := os.WriteFile(checksumsPath, []byte(checksumsContent), 0644); err != nil {
		t.Fatalf("Failed to create checksums file: %v", err)
	}

	// Verify
	verifier := NewVerifier(nil)
	_, err := verifier.VerifyArchive(context.Background(), archivePath, checksumsPath, "https://example.com/checksums.txt", nil)

	if err == nil {
		t.Fatal("Expected error for archive not found, got nil")
	}

	if !strings.Contains(err.Error(), "not found in checksums.txt") {
		t.Errorf("Expected error about archive not found, got: %v", err)
	}
}

// Test 10: ComputeBinaryHash - Success
func TestComputeBinaryHash_Success(t *testing.T) {
	// Create temp file
	tmpDir := t.TempDir()
	binaryPath := filepath.Join(tmpDir, "binary")
	binaryContent := []byte("binary content for testing")
	if err := os.WriteFile(binaryPath, binaryContent, 0644); err != nil {
		t.Fatalf("Failed to create test binary: %v", err)
	}

	// Compute hash
	verifier := NewVerifier(nil)
	hash, err := verifier.ComputeBinaryHash(binaryPath)

	if err != nil {
		t.Fatalf("Expected no error, got: %v", err)
	}

	// Verify hash length (64 hex chars for SHA256)
	if len(hash) != 64 {
		t.Errorf("Expected hash length 64, got %d", len(hash))
	}

	// Verify hash is consistent
	hash2, err := verifier.ComputeBinaryHash(binaryPath)
	if err != nil {
		t.Fatalf("Failed to compute hash second time: %v", err)
	}

	if hash != hash2 {
		t.Errorf("Expected consistent hash, got different values: %s vs %s", hash, hash2)
	}
}

// Test 11: Reverify - Success (no tampering)
func TestReverify_Success(t *testing.T) {
	// Create temp binary
	tmpDir := t.TempDir()
	binaryPath := filepath.Join(tmpDir, "binary")
	binaryContent := []byte("binary content")
	if err := os.WriteFile(binaryPath, binaryContent, 0644); err != nil {
		t.Fatalf("Failed to create test binary: %v", err)
	}

	// Calculate stored hash
	storedHash, err := CalculateSHA256(binaryPath)
	if err != nil {
		t.Fatalf("Failed to calculate hash: %v", err)
	}

	// Create verifier with mock publisher
	mockBus, err := events.NewEventBus(events.DefaultEventBusOptions())
	if err != nil {
		t.Fatalf("Failed to create event bus: %v", err)
	}
	defer mockBus.Close()

	publisher := events.NewPublisher(mockBus, "test")
	verifier := NewVerifier(publisher)

	// Reverify
	ok, err := verifier.Reverify(
		context.Background(),
		binaryPath,
		storedHash,
		"test-feature",
		"test-instance",
		"test-router",
		"1.0.0",
		"archive-hash",
		"https://example.com/checksums.txt",
	)

	if err != nil {
		t.Fatalf("Expected no error, got: %v", err)
	}

	if !ok {
		t.Errorf("Expected verification success, got failure")
	}
}

// Test 12: Reverify - Failure (tampering detected)
func TestReverify_TamperingDetected(t *testing.T) {
	// Create temp binary
	tmpDir := t.TempDir()
	binaryPath := filepath.Join(tmpDir, "binary")
	originalContent := []byte("original binary content")
	if err := os.WriteFile(binaryPath, originalContent, 0644); err != nil {
		t.Fatalf("Failed to create test binary: %v", err)
	}

	// Calculate stored hash (from original)
	storedHash, err := CalculateSHA256(binaryPath)
	if err != nil {
		t.Fatalf("Failed to calculate hash: %v", err)
	}

	// Modify the binary (simulate tampering)
	tamperedContent := []byte("TAMPERED binary content")
	if err := os.WriteFile(binaryPath, tamperedContent, 0644); err != nil {
		t.Fatalf("Failed to tamper binary: %v", err)
	}

	// Create verifier with mock publisher
	mockBus, err := events.NewEventBus(events.DefaultEventBusOptions())
	if err != nil {
		t.Fatalf("Failed to create event bus: %v", err)
	}
	defer mockBus.Close()

	publisher := events.NewPublisher(mockBus, "test")
	verifier := NewVerifier(publisher)

	// Reverify (should detect tampering)
	ok, err := verifier.Reverify(
		context.Background(),
		binaryPath,
		storedHash,
		"test-feature",
		"test-instance",
		"test-router",
		"1.0.0",
		"archive-hash",
		"https://example.com/checksums.txt",
	)

	if err != nil {
		t.Fatalf("Expected no error, got: %v", err)
	}

	if ok {
		t.Errorf("Expected verification failure (tampering detected), got success")
	}
}

// Test 13: StartupIntegrityCheck - All pass
func TestStartupIntegrityCheck_AllPass(t *testing.T) {
	// Create temp binaries
	tmpDir := t.TempDir()

	instances := []InstanceVerificationInfo{}
	for i := 0; i < 3; i++ {
		binaryPath := filepath.Join(tmpDir, "binary"+string(rune('A'+i)))
		binaryContent := []byte("binary content " + string(rune('A'+i)))
		if err := os.WriteFile(binaryPath, binaryContent, 0644); err != nil {
			t.Fatalf("Failed to create test binary: %v", err)
		}

		hash, err := CalculateSHA256(binaryPath)
		if err != nil {
			t.Fatalf("Failed to calculate hash: %v", err)
		}

		instances = append(instances, InstanceVerificationInfo{
			FeatureID:        "feature-" + string(rune('A'+i)),
			InstanceID:       "instance-" + string(rune('A'+i)),
			RouterID:         "router-1",
			Version:          "1.0.0",
			BinaryPath:       binaryPath,
			StoredBinaryHash: hash,
			ArchiveHash:      "archive-hash-" + string(rune('A'+i)),
			ChecksumsURL:     "https://example.com/checksums.txt",
		})
	}

	// Create verifier with mock publisher
	mockBus, err := events.NewEventBus(events.DefaultEventBusOptions())
	if err != nil {
		t.Fatalf("Failed to create event bus: %v", err)
	}
	defer mockBus.Close()

	publisher := events.NewPublisher(mockBus, "test")
	verifier := NewVerifier(publisher)

	// Run startup integrity check
	verified, failed, err := verifier.StartupIntegrityCheck(context.Background(), instances)

	if err != nil {
		t.Fatalf("Expected no error, got: %v", err)
	}

	if verified != 3 {
		t.Errorf("Expected 3 verified, got %d", verified)
	}

	if failed != 0 {
		t.Errorf("Expected 0 failed, got %d", failed)
	}
}

// Test 14: StartupIntegrityCheck - Some fail
func TestStartupIntegrityCheck_SomeFail(t *testing.T) {
	// Create temp binaries
	tmpDir := t.TempDir()

	instances := []InstanceVerificationInfo{}

	// Instance 1: Pass (hash matches)
	binaryPath1 := filepath.Join(tmpDir, "binary1")
	binaryContent1 := []byte("binary content 1")
	if err := os.WriteFile(binaryPath1, binaryContent1, 0644); err != nil {
		t.Fatalf("Failed to create test binary: %v", err)
	}
	hash1, _ := CalculateSHA256(binaryPath1)

	instances = append(instances, InstanceVerificationInfo{
		FeatureID:        "feature-1",
		InstanceID:       "instance-1",
		BinaryPath:       binaryPath1,
		StoredBinaryHash: hash1,
		Version:          "1.0.0",
		ArchiveHash:      "archive-hash-1",
		ChecksumsURL:     "https://example.com/checksums.txt",
	})

	// Instance 2: Fail (hash mismatch - tampered)
	binaryPath2 := filepath.Join(tmpDir, "binary2")
	binaryContent2 := []byte("original content")
	if err := os.WriteFile(binaryPath2, binaryContent2, 0644); err != nil {
		t.Fatalf("Failed to create test binary: %v", err)
	}
	hash2, _ := CalculateSHA256(binaryPath2)
	// Tamper the file
	if err := os.WriteFile(binaryPath2, []byte("TAMPERED content"), 0644); err != nil {
		t.Fatalf("Failed to tamper binary: %v", err)
	}

	instances = append(instances, InstanceVerificationInfo{
		FeatureID:        "feature-2",
		InstanceID:       "instance-2",
		BinaryPath:       binaryPath2,
		StoredBinaryHash: hash2, // Original hash
		Version:          "1.0.0",
		ArchiveHash:      "archive-hash-2",
		ChecksumsURL:     "https://example.com/checksums.txt",
	})

	// Create verifier with mock publisher
	mockBus, err := events.NewEventBus(events.DefaultEventBusOptions())
	if err != nil {
		t.Fatalf("Failed to create event bus: %v", err)
	}
	defer mockBus.Close()

	publisher := events.NewPublisher(mockBus, "test")
	verifier := NewVerifier(publisher)

	// Run startup integrity check
	verified, failed, err := verifier.StartupIntegrityCheck(context.Background(), instances)

	if err != nil {
		t.Fatalf("Expected no error, got: %v", err)
	}

	if verified != 1 {
		t.Errorf("Expected 1 verified, got %d", verified)
	}

	if failed != 1 {
		t.Errorf("Expected 1 failed, got %d", failed)
	}
}

// Test 15: VerifyArchive - GPG RequireGPG without TrustOnFirstUse
func TestVerifyArchive_GPGRequiredNotImplemented(t *testing.T) {
	// Create temp directory
	tmpDir := t.TempDir()

	// Create test archive
	archivePath := filepath.Join(tmpDir, "test.tar.gz")
	archiveContent := []byte("test archive content")
	if err := os.WriteFile(archivePath, archiveContent, 0644); err != nil {
		t.Fatalf("Failed to create test archive: %v", err)
	}

	// Calculate expected hash
	expectedHash, err := CalculateSHA256(archivePath)
	if err != nil {
		t.Fatalf("Failed to calculate hash: %v", err)
	}

	// Create checksums.txt
	checksumsPath := filepath.Join(tmpDir, "checksums.txt")
	checksumsContent := expectedHash + "  test.tar.gz\n"
	if err := os.WriteFile(checksumsPath, []byte(checksumsContent), 0644); err != nil {
		t.Fatalf("Failed to create checksums file: %v", err)
	}

	// Create VerificationSpec with GPG required but TrustOnFirstUse=false
	spec := &VerificationSpec{
		Enabled:         true,
		ChecksumsURL:    "https://example.com/checksums.txt",
		RequireGPG:      true,
		TrustOnFirstUse: false,
		GPG: &GPGSpec{
			KeyID: "ABCD1234",
		},
	}

	// Verify (should fail with ErrGPGNotImplemented)
	verifier := NewVerifier(nil)
	_, err = verifier.VerifyArchive(context.Background(), archivePath, checksumsPath, "https://example.com/checksums.txt", spec)

	if err != ErrGPGNotImplemented {
		t.Errorf("Expected ErrGPGNotImplemented, got: %v", err)
	}
}
