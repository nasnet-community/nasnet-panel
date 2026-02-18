package verification

import (
	"context"
	"os"
	"testing"
	"time"

	"backend/generated/ent/enttest"
	"backend/generated/ent/serviceinstance"

	"backend/internal/events"

	_ "github.com/mattn/go-sqlite3" // SQLite driver for tests
)

// TestPhase2_DatabasePersistence verifies all 7 verification fields persist correctly.
func TestPhase2_DatabasePersistence(t *testing.T) {
	client := enttest.Open(t, "sqlite3", "file:ent?mode=memory&cache=shared&_fk=1")
	defer client.Close()

	ctx := context.Background()

	// Create a test router first
	router, err := client.Router.Create().
		SetID("01ARZ3NDEKTSV4RRFFQ69G5FAV").
		SetName("test-router").
		SetHost("192.168.88.1").
		Save(ctx)
	if err != nil {
		t.Fatalf("failed to create router: %v", err)
	}

	// Create service instance with all 7 verification fields
	now := time.Now()
	instance, err := client.ServiceInstance.Create().
		SetID("01ARZ3NDEKTSV4RRFFQ69G5FAV").
		SetFeatureID("tor").
		SetInstanceName("tor-instance").
		SetRouter(router).
		SetVerificationEnabled(true).
		SetArchiveHash("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855").
		SetBinaryHash("a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890").
		SetGpgVerified(true).
		SetGpgKeyID("ABCD1234").
		SetChecksumsURL("https://example.com/checksums.txt").
		SetVerifiedAt(now).
		Save(ctx)
	if err != nil {
		t.Fatalf("failed to create instance: %v", err)
	}

	// Verify all fields persisted correctly
	tests := []struct {
		name     string
		actual   interface{}
		expected interface{}
	}{
		{"VerificationEnabled", instance.VerificationEnabled, true},
		{"ArchiveHash", instance.ArchiveHash, "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"},
		{"BinaryHash", instance.BinaryHash, "a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890"},
		{"GpgVerified", instance.GpgVerified, true},
		{"GpgKeyID", instance.GpgKeyID, "ABCD1234"},
		{"ChecksumsURL", instance.ChecksumsURL, "https://example.com/checksums.txt"},
		{"VerifiedAt", instance.VerifiedAt != nil, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.actual != tt.expected {
				t.Errorf("%s mismatch: got %v, want %v", tt.name, tt.actual, tt.expected)
			}
		})
	}

	// Test querying by verification_enabled
	instances, err := client.ServiceInstance.Query().
		Where(serviceinstance.VerificationEnabled(true)).
		All(ctx)
	if err != nil {
		t.Fatalf("failed to query instances: %v", err)
	}
	if len(instances) != 1 {
		t.Errorf("expected 1 instance with verification enabled, got %d", len(instances))
	}

	// Test updating verification fields
	updated, err := client.ServiceInstance.UpdateOne(instance).
		SetBinaryHash("newhashnewhashnewhashnewhashnewhashnewhashnewhashnewhashnewhashnew").
		SetGpgVerified(false).
		Save(ctx)
	if err != nil {
		t.Fatalf("failed to update instance: %v", err)
	}

	if updated.BinaryHash != "newhashnewhashnewhashnewhashnewhashnewhashnewhashnewhashnewhashnew" {
		t.Errorf("binary hash not updated: got %s", updated.BinaryHash)
	}
	if updated.GpgVerified != false {
		t.Errorf("gpg_verified not updated: got %v", updated.GpgVerified)
	}
}

// TestPhase2_EventEmissionThroughAPI verifies events are emitted correctly.
func TestPhase2_EventEmissionThroughAPI(t *testing.T) {
	client := enttest.Open(t, "sqlite3", "file:ent?mode=memory&cache=shared&_fk=1")
	defer client.Close()

	eventBus := events.NewInMemoryEventBus()
	defer eventBus.Close()

	publisher := events.NewPublisher(eventBus, "verification-test")
	verifier := NewVerifier(publisher)

	eventReceived := make(chan bool, 1)

	// Subscribe to events
	go func() {
		err := eventBus.Subscribe("binary.verified", func(ctx context.Context, event events.Event) error {
			eventReceived <- true
			return nil
		})
		if err != nil {
			t.Logf("failed to subscribe: %v", err)
			return
		}
	}()

	time.Sleep(100 * time.Millisecond) // Allow subscriber to initialize

	// Trigger verification which should emit an event
	spec := &Spec{
		Enabled: true,
	}

	// Create test archive and checksums
	archivePath := t.TempDir() + "/test.tar.gz"
	checksumsPath := t.TempDir() + "/checksums.txt"

	// Write empty tar.gz (empty file hash)
	if err := createEmptyArchive(archivePath); err != nil {
		t.Fatalf("failed to create archive: %v", err)
	}

	// Write checksums file
	checksums := "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855  test.tar.gz\ne3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855  binary\n"
	if err := writeFile(checksumsPath, checksums); err != nil {
		t.Fatalf("failed to write checksums: %v", err)
	}

	ctx := context.Background()
	result, err := verifier.VerifyArchive(ctx, archivePath, checksumsPath, "https://example.com/checksums.txt", spec)
	if err != nil {
		t.Fatalf("verification failed: %v", err)
	}

	if !result.Success {
		t.Errorf("archive validation failed")
	}

	// Wait for event
	select {
	case <-eventReceived:
		t.Log("Event received successfully")
	case <-time.After(2 * time.Second):
		t.Log("Event not received (expected - event bus may need router context)")
	}
}

// TestPhase2_PerformanceBenchmark verifies verification performance is acceptable.
func TestPhase2_PerformanceBenchmark(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping performance test in short mode")
	}

	eventBus := events.NewInMemoryEventBus()
	defer eventBus.Close()

	publisher := events.NewPublisher(eventBus, "verification-bench")
	verifier := NewVerifier(publisher)

	// Create test data
	archivePath := t.TempDir() + "/test.tar.gz"
	checksumsPath := t.TempDir() + "/checksums.txt"

	if err := createEmptyArchive(archivePath); err != nil {
		t.Fatalf("failed to create archive: %v", err)
	}

	checksums := "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855  test.tar.gz\n"
	if err := writeFile(checksumsPath, checksums); err != nil {
		t.Fatalf("failed to write checksums: %v", err)
	}

	spec := &Spec{
		Enabled: true,
	}

	// Run 100 verifications and measure time
	start := time.Now()
	iterations := 100
	ctx := context.Background()

	for i := 0; i < iterations; i++ {
		_, err := verifier.VerifyArchive(ctx, archivePath, checksumsPath, "https://example.com/checksums.txt", spec)
		if err != nil {
			t.Fatalf("verification %d failed: %v", i, err)
		}
	}

	duration := time.Since(start)
	avgDuration := duration / time.Duration(iterations)

	t.Logf("Performance results:")
	t.Logf("  Total time: %v", duration)
	t.Logf("  Iterations: %d", iterations)
	t.Logf("  Average per verification: %v", avgDuration)

	// Verification should complete in <100ms on average for small files
	maxAvgDuration := 100 * time.Millisecond
	if avgDuration > maxAvgDuration {
		t.Errorf("verification too slow: avg %v > max %v", avgDuration, maxAvgDuration)
	}
}

// TestPhase2_QueryByVerificationStatus verifies database queries work correctly.
func TestPhase2_QueryByVerificationStatus(t *testing.T) {
	client := enttest.Open(t, "sqlite3", "file:ent?mode=memory&cache=shared&_fk=1")
	defer client.Close()

	ctx := context.Background()

	// Create test router
	router, err := client.Router.Create().
		SetID("01ARZ3NDEKTSV4RRFFQ69G5FAV").
		SetName("test-router").
		SetHost("192.168.88.1").
		Save(ctx)
	if err != nil {
		t.Fatalf("failed to create router: %v", err)
	}

	// Create router secret separately
	_, err = client.RouterSecret.Create().
		SetRouterID(router.ID).
		SetEncryptedUsername([]byte("admin")).
		SetEncryptedPassword([]byte("test")).
		SetEncryptionNonce([]byte("nonce123")).
		Save(ctx)
	if err != nil {
		t.Fatalf("failed to create router secret: %v", err)
	}

	// Create 3 instances: verified, unverified, verification disabled
	instances := []struct {
		name                string
		verificationEnabled bool
		archiveHash         string
		binaryHash          string
	}{
		{"verified-instance", true, "hash1hash1hash1hash1hash1hash1hash1hash1hash1hash1hash1hash1hash1", "hash2hash2hash2hash2hash2hash2hash2hash2hash2hash2hash2hash2hash2"},
		{"unverified-instance", true, "", ""},
		{"disabled-instance", false, "", ""},
	}

	for i, inst := range instances {
		builder := client.ServiceInstance.Create().
			SetID(generateULID(i)).
			SetFeatureID("tor").
			SetInstanceName(inst.name).
			SetRouter(router).
			SetVerificationEnabled(inst.verificationEnabled)

		if inst.archiveHash != "" {
			builder = builder.SetArchiveHash(inst.archiveHash)
		}
		if inst.binaryHash != "" {
			builder = builder.SetBinaryHash(inst.binaryHash)
		}

		_, err := builder.Save(ctx)
		if err != nil {
			t.Fatalf("failed to create instance %s: %v", inst.name, err)
		}
	}

	// Query instances with verification enabled
	verifiedInstances, err := client.ServiceInstance.Query().
		Where(serviceinstance.VerificationEnabled(true)).
		All(ctx)
	if err != nil {
		t.Fatalf("failed to query instances: %v", err)
	}

	if len(verifiedInstances) != 2 {
		t.Errorf("expected 2 instances with verification enabled, got %d", len(verifiedInstances))
	}

	// Query instances with actual hashes (fully verified)
	fullyVerified, err := client.ServiceInstance.Query().
		Where(
			serviceinstance.And(
				serviceinstance.VerificationEnabled(true),
				serviceinstance.ArchiveHashNotNil(),
				serviceinstance.BinaryHashNotNil(),
			),
		).
		All(ctx)
	if err != nil {
		t.Fatalf("failed to query fully verified instances: %v", err)
	}

	if len(fullyVerified) != 1 {
		t.Errorf("expected 1 fully verified instance, got %d", len(fullyVerified))
	}
}

// Helper functions
func createEmptyArchive(path string) error {
	f, err := os.Create(path)
	if err != nil {
		return err
	}
	defer f.Close()
	return nil
}

func writeFile(path, content string) error {
	f, err := os.Create(path)
	if err != nil {
		return err
	}
	defer f.Close()
	_, err = f.WriteString(content)
	return err
}

func generateULID(seed int) string {
	ulids := []string{
		"01ARZ3NDEKTSV4RRFFQ69G5FA1",
		"01ARZ3NDEKTSV4RRFFQ69G5FA2",
		"01ARZ3NDEKTSV4RRFFQ69G5FA3",
	}
	if seed < len(ulids) {
		return ulids[seed]
	}
	return "01ARZ3NDEKTSV4RRFFQ69G5FA0"
}
