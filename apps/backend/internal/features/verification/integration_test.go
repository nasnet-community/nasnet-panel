package verification

import (
	"context"
	"os"
	"path/filepath"
	"testing"
	"time"

	"backend/internal/events"
)

// Integration test: Full verification workflow from archive download to storage
func TestIntegration_FullVerificationWorkflow(t *testing.T) {
	// Setup
	tmpDir := t.TempDir()
	ctx := context.Background()

	// Create mock event bus
	mockBus, err := events.NewEventBus(events.DefaultEventBusOptions())
	if err != nil {
		t.Fatalf("Failed to create event bus: %v", err)
	}
	defer mockBus.Close()

	publisher := events.NewPublisher(mockBus, "integration-test")
	verifier := NewVerifier(publisher)

	// Step 1: Create archive and checksums.txt
	archivePath := filepath.Join(tmpDir, "feature.tar.gz")
	archiveContent := []byte("mock binary archive content")
	if err := os.WriteFile(archivePath, archiveContent, 0644); err != nil {
		t.Fatalf("Failed to create archive: %v", err)
	}

	// Calculate expected hash
	expectedHash, err := CalculateSHA256(archivePath)
	if err != nil {
		t.Fatalf("Failed to calculate hash: %v", err)
	}

	// Create checksums.txt
	checksumsPath := filepath.Join(tmpDir, "checksums.txt")
	checksumsContent := expectedHash + "  feature.tar.gz\n"
	if err := os.WriteFile(checksumsPath, []byte(checksumsContent), 0644); err != nil {
		t.Fatalf("Failed to create checksums: %v", err)
	}

	checksumsURL := "https://example.com/checksums.txt"

	// Step 2: Verify archive (install-time verification)
	result, err := verifier.VerifyArchive(ctx, archivePath, checksumsPath, checksumsURL, nil)
	if err != nil {
		t.Fatalf("Archive verification failed: %v", err)
	}

	if !result.Success {
		t.Errorf("Expected verification success, got failure")
	}

	if result.ArchiveHash != expectedHash {
		t.Errorf("Expected archive hash %s, got %s", expectedHash, result.ArchiveHash)
	}

	// Step 3: Extract binary (simulate extraction)
	binaryPath := filepath.Join(tmpDir, "extracted-binary")
	binaryContent := []byte("extracted binary content")
	if err := os.WriteFile(binaryPath, binaryContent, 0755); err != nil {
		t.Fatalf("Failed to create binary: %v", err)
	}

	// Step 4: Compute binary hash (post-extraction)
	binaryHash, err := verifier.ComputeBinaryHash(binaryPath)
	if err != nil {
		t.Fatalf("Failed to compute binary hash: %v", err)
	}

	if len(binaryHash) != 64 {
		t.Errorf("Expected 64-char hash, got %d chars", len(binaryHash))
	}

	// Step 5: Simulate storage (in real scenario, this would go to database)
	storedArchiveHash := result.ArchiveHash
	storedBinaryHash := binaryHash
	verifiedAt := time.Now()

	t.Logf("Stored verification data:")
	t.Logf("  Archive Hash: %s", storedArchiveHash)
	t.Logf("  Binary Hash: %s", storedBinaryHash)
	t.Logf("  Verified At: %s", verifiedAt.Format(time.RFC3339))

	// Step 6: Runtime reverification (simulate startup check)
	ok, err := verifier.Reverify(
		ctx,
		binaryPath,
		storedBinaryHash,
		"test-feature",
		"test-instance",
		"test-router",
		"1.0.0",
		storedArchiveHash,
		checksumsURL,
	)

	if err != nil {
		t.Fatalf("Reverification failed: %v", err)
	}

	if !ok {
		t.Errorf("Expected reverification success, got failure")
	}

	// Step 7: Simulate tampering and verify detection
	tamperedContent := append(binaryContent, []byte("\nTAMPERED")...)
	if err := os.WriteFile(binaryPath, tamperedContent, 0755); err != nil {
		t.Fatalf("Failed to tamper binary: %v", err)
	}

	ok, err = verifier.Reverify(
		ctx,
		binaryPath,
		storedBinaryHash,
		"test-feature",
		"test-instance",
		"test-router",
		"1.0.0",
		storedArchiveHash,
		checksumsURL,
	)

	if err != nil {
		t.Fatalf("Reverification after tampering failed: %v", err)
	}

	if ok {
		t.Errorf("Expected reverification failure (tampering), got success")
	}

	t.Log("✅ Full verification workflow test passed!")
}

// Integration test: Event emission during verification
func TestIntegration_EventEmissionDuringVerification(t *testing.T) {
	// Setup
	tmpDir := t.TempDir()
	ctx := context.Background()

	// Create mock event bus with event capture
	mockBus, err := events.NewEventBus(events.DefaultEventBusOptions())
	if err != nil {
		t.Fatalf("Failed to create event bus: %v", err)
	}
	defer mockBus.Close()

	// Track emitted events
	var capturedEvents []events.Event
	eventHandler := func(ctx context.Context, event events.Event) error {
		capturedEvents = append(capturedEvents, event)
		t.Logf("Event captured: %s (priority: %s)", event.GetType(), event.GetPriority().String())
		return nil
	}

	// Subscribe to all events
	if err := mockBus.SubscribeAll(eventHandler); err != nil {
		t.Fatalf("Failed to subscribe to events: %v", err)
	}

	publisher := events.NewPublisher(mockBus, "integration-test")
	verifier := NewVerifier(publisher)

	// Create binary
	binaryPath := filepath.Join(tmpDir, "test-binary")
	binaryContent := []byte("test binary")
	if err := os.WriteFile(binaryPath, binaryContent, 0755); err != nil {
		t.Fatalf("Failed to create binary: %v", err)
	}

	originalHash, _ := CalculateSHA256(binaryPath)

	// Trigger reverification (should emit event on failure)
	wrongHash := "0000000000000000000000000000000000000000000000000000000000000000"
	ok, err := verifier.Reverify(
		ctx,
		binaryPath,
		wrongHash,
		"test-feature",
		"test-instance",
		"test-router",
		"1.0.0",
		originalHash,
		"https://example.com/checksums.txt",
	)

	if err != nil {
		t.Fatalf("Reverification failed: %v", err)
	}

	if ok {
		t.Errorf("Expected reverification failure, got success")
	}

	// Wait for event processing
	time.Sleep(200 * time.Millisecond)

	// Verify event was emitted
	if len(capturedEvents) == 0 {
		t.Errorf("Expected at least one event to be emitted, got none")
	}

	// Find BinaryIntegrityFailed event
	foundIntegrityEvent := false
	for _, event := range capturedEvents {
		if event.GetType() == events.EventTypeBinaryIntegrityFailed {
			foundIntegrityEvent = true
			if event.GetPriority() != events.PriorityImmediate {
				t.Errorf("Expected Immediate priority for integrity failure, got %s", event.GetPriority().String())
			}
			t.Logf("✅ BinaryIntegrityFailed event emitted with correct priority")
			break
		}
	}

	if !foundIntegrityEvent {
		t.Errorf("Expected BinaryIntegrityFailed event, but it was not emitted")
	}

	t.Log("✅ Event emission test passed!")
}

// Integration test: Startup integrity check with multiple instances
func TestIntegration_StartupIntegrityCheckMultipleInstances(t *testing.T) {
	// Setup
	tmpDir := t.TempDir()
	ctx := context.Background()

	mockBus, err := events.NewEventBus(events.DefaultEventBusOptions())
	if err != nil {
		t.Fatalf("Failed to create event bus: %v", err)
	}
	defer mockBus.Close()

	publisher := events.NewPublisher(mockBus, "integration-test")
	verifier := NewVerifier(publisher)

	// Create 5 test instances
	instances := []InstanceVerificationInfo{}
	for i := 0; i < 5; i++ {
		binaryPath := filepath.Join(tmpDir, "binary"+string(rune('A'+i)))
		binaryContent := []byte("binary content " + string(rune('A'+i)))
		if err := os.WriteFile(binaryPath, binaryContent, 0755); err != nil {
			t.Fatalf("Failed to create binary: %v", err)
		}

		hash, _ := CalculateSHA256(binaryPath)

		instances = append(instances, InstanceVerificationInfo{
			FeatureID:        "feature-" + string(rune('A'+i)),
			InstanceID:       "instance-" + string(rune('A'+i)),
			RouterID:         "router-1",
			Version:          "1.0.0",
			BinaryPath:       binaryPath,
			StoredBinaryHash: hash,
			ArchiveHash:      "archive-" + string(rune('A'+i)),
			ChecksumsURL:     "https://example.com/checksums.txt",
		})
	}

	// Tamper with 2 binaries
	tamperIndices := []int{1, 3}
	for _, idx := range tamperIndices {
		binaryPath := instances[idx].BinaryPath
		if err := os.WriteFile(binaryPath, []byte("TAMPERED"), 0755); err != nil {
			t.Fatalf("Failed to tamper binary: %v", err)
		}
	}

	// Run startup integrity check
	verified, failed, err := verifier.StartupIntegrityCheck(ctx, instances)
	if err != nil {
		t.Fatalf("Startup integrity check failed: %v", err)
	}

	expectedVerified := 3
	expectedFailed := 2

	if verified != expectedVerified {
		t.Errorf("Expected %d verified, got %d", expectedVerified, verified)
	}

	if failed != expectedFailed {
		t.Errorf("Expected %d failed, got %d", expectedFailed, failed)
	}

	t.Logf("✅ Startup integrity check: %d verified, %d failed (expected)", verified, failed)
	t.Log("✅ Startup integrity check test passed!")
}
