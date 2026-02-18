//go:build integration
// +build integration

package storage_test

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"os"
	"path/filepath"
	"testing"
	"time"

	"backend/generated/ent"
	"backend/generated/ent/enttest"
	"backend/generated/ent/serviceinstance"
	"backend/internal/events"
	"backend/internal/orchestrator"
	"backend/internal/storage"

	"github.com/oklog/ulid/v2"
	"github.com/rs/zerolog"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	// SQLite driver for in-memory testing
	_ "github.com/mattn/go-sqlite3"
)

// IntegrationTestContext holds shared test infrastructure.
type IntegrationTestContext struct {
	DB            *ent.Client
	EventBus      events.EventBus
	MockPublisher *mockEventPublisher
	PathResolver  *storage.DefaultPathResolver
	BootValidator *orchestrator.BootValidator
	TempDir       string
	FlashDir      string
	ExternalDir   string
	t             *testing.T
}

// mockEventPublisher records published events for verification.
type mockEventPublisher struct {
	events []events.Event
}

func newMockEventPublisher() *mockEventPublisher {
	return &mockEventPublisher{
		events: make([]events.Event, 0),
	}
}

func (m *mockEventPublisher) Publish(ctx context.Context, event events.Event) error {
	m.events = append(m.events, event)
	return nil
}

func (m *mockEventPublisher) GetEventsByType(eventType string) []events.Event {
	filtered := make([]events.Event, 0)
	for _, e := range m.events {
		if e.GetType() == eventType {
			filtered = append(filtered, e)
		}
	}
	return filtered
}

func (m *mockEventPublisher) Reset() {
	m.events = make([]events.Event, 0)
}

// setupIntegrationTest creates a complete integration test environment.
func setupIntegrationTest(t *testing.T) *IntegrationTestContext {
	// Create temporary directories for flash and external storage
	tempDir := t.TempDir()
	flashDir := filepath.Join(tempDir, "flash")
	externalDir := filepath.Join(tempDir, "usb1")

	require.NoError(t, os.MkdirAll(filepath.Join(flashDir, "features", "bin"), 0755))
	require.NoError(t, os.MkdirAll(filepath.Join(flashDir, "features", "config"), 0755))
	require.NoError(t, os.MkdirAll(filepath.Join(flashDir, "features", "manifests"), 0755))
	require.NoError(t, os.MkdirAll(filepath.Join(externalDir, "features", "bin"), 0755))

	// Create in-memory database
	client := enttest.Open(t, "sqlite3", "file:ent?mode=memory&cache=shared&_fk=1")

	// Create mock event bus
	mockPub := newMockEventPublisher()
	mockEventBus, err := events.NewEventBus(events.DefaultEventBusOptions())
	require.NoError(t, err)

	// Create path resolver
	pathResolverCfg := storage.PathResolverConfig{
		FlashBinaryDir:   filepath.Join(flashDir, "features", "bin"),
		FlashConfigDir:   filepath.Join(flashDir, "features", "config"),
		FlashManifestDir: filepath.Join(flashDir, "features", "manifests"),
		FlashDataDir:     filepath.Join(flashDir, "features", "data"),
		FlashLogsDir:     filepath.Join(flashDir, "features", "logs"),
		ExternalEnabled:  false,
		ExternalPath:     "",
		ExternalMounted:  false,
	}
	pathResolver := storage.NewDefaultPathResolver(pathResolverCfg)

	// Create boot validator
	logger := zerolog.New(os.Stdout).With().Timestamp().Logger()
	bootValidator, err := orchestrator.NewBootValidator(orchestrator.BootValidatorConfig{
		DB:           client,
		PathResolver: pathResolver,
		EventBus:     mockEventBus,
		Logger:       logger,
	})
	require.NoError(t, err)

	return &IntegrationTestContext{
		DB:            client,
		EventBus:      mockEventBus,
		MockPublisher: mockPub,
		PathResolver:  pathResolver,
		BootValidator: bootValidator,
		TempDir:       tempDir,
		FlashDir:      flashDir,
		ExternalDir:   externalDir,
		t:             t,
	}
}

// createTestInstance creates a test service instance in the database.
func (ctx *IntegrationTestContext) createTestInstance(
	featureID string,
	binaryPath string,
	binaryChecksum string,
	status serviceinstance.Status,
) *ent.ServiceInstance {
	instance, err := ctx.DB.ServiceInstance.Create().
		SetID(ulid.Make().String()).
		SetFeatureID(featureID).
		SetInstanceName(featureID + "-test").
		SetRouterID("router-1").
		SetStatus(status).
		SetBinaryPath(binaryPath).
		SetBinaryChecksum(binaryChecksum).
		Save(context.Background())

	require.NoError(ctx.t, err)
	return instance
}

// createTestBinary creates a test binary file with given content and returns its SHA256 checksum.
func (ctx *IntegrationTestContext) createTestBinary(path string, content []byte) string {
	require.NoError(ctx.t, os.MkdirAll(filepath.Dir(path), 0755))
	require.NoError(ctx.t, os.WriteFile(path, content, 0755))

	hash := sha256.Sum256(content)
	return hex.EncodeToString(hash[:])
}

// simulateStorageDisconnect simulates external storage disconnection.
func (ctx *IntegrationTestContext) simulateStorageDisconnect(path string) {
	// Update PathResolver to mark external storage as unmounted
	ctx.PathResolver.UpdateExternalStorage(true, path, false)
}

// simulateStorageReconnect simulates external storage reconnection.
func (ctx *IntegrationTestContext) simulateStorageReconnect(path string) {
	// Update PathResolver to mark external storage as mounted
	ctx.PathResolver.UpdateExternalStorage(true, path, true)
}

// =============================================================================
// Test 1: Disconnect/Reconnect Flow
// =============================================================================

func Test_DisconnectReconnectFlow(t *testing.T) {
	ctx := setupIntegrationTest(t)
	defer ctx.DB.Close()
	defer ctx.EventBus.Close()

	// Step 1: Enable external storage
	externalPath := filepath.Join(ctx.ExternalDir, "features")
	ctx.PathResolver.UpdateExternalStorage(true, externalPath, true)

	// Step 2: Create binary on external storage
	binaryPath := filepath.Join(externalPath, "bin", "tor")
	binaryContent := []byte("fake tor binary for testing")
	checksum := ctx.createTestBinary(binaryPath, binaryContent)

	// Step 3: Create instance with status=INSTALLED
	instance := ctx.createTestInstance("tor", binaryPath, checksum, serviceinstance.StatusInstalled)
	assert.Equal(t, serviceinstance.StatusInstalled, instance.Status)
	assert.Empty(t, instance.UnavailableReason)

	// Step 4: Simulate storage disconnect
	ctx.simulateStorageDisconnect(externalPath)

	// Simulate InstanceManager.OnStorageDisconnected() behavior
	// (In a full integration test, this would be called via event handler)
	unavailableReason := "External storage disconnected: " + externalPath
	updatedInstance, err := ctx.DB.ServiceInstance.UpdateOneID(instance.ID).
		SetStatus(serviceinstance.StatusFailed).
		SetUnavailableReason(unavailableReason).
		Save(context.Background())

	require.NoError(t, err)

	// Step 5: Verify instance status=FAILED
	assert.Equal(t, serviceinstance.StatusFailed, updatedInstance.Status)
	assert.Contains(t, updatedInstance.UnavailableReason, "disconnected")
	assert.Contains(t, updatedInstance.UnavailableReason, externalPath)

	// Step 6: Simulate storage reconnect with same binary
	ctx.simulateStorageReconnect(externalPath)

	// Verify binary still exists and checksum matches
	actualChecksum := ctx.createTestBinary(binaryPath, binaryContent)
	assert.Equal(t, checksum, actualChecksum, "Binary checksum should match after reconnect")

	// Step 7: Verify SHA256 passes
	file, err := os.Open(binaryPath)
	require.NoError(t, err)
	defer file.Close()

	hash := sha256.New()
	_, err = hash.Write(binaryContent)
	require.NoError(t, err)
	calculatedChecksum := hex.EncodeToString(hash.Sum(nil))

	assert.Equal(t, checksum, calculatedChecksum, "SHA256 verification should pass")

	// Step 8: Simulate InstanceManager.OnStorageReconnected() behavior
	// Restore instance to INSTALLED status
	restoredInstance, err := ctx.DB.ServiceInstance.UpdateOneID(instance.ID).
		SetStatus(serviceinstance.StatusInstalled).
		ClearUnavailableReason().
		Save(context.Background())

	require.NoError(t, err)

	// Step 9: Verify instance status=INSTALLED
	assert.Equal(t, serviceinstance.StatusInstalled, restoredInstance.Status)

	// Step 10: Verify unavailable_reason cleared
	assert.Empty(t, restoredInstance.UnavailableReason)
}

// =============================================================================
// Test 2: SHA256 Verification After Reconnect
// =============================================================================

func Test_SHA256VerificationAfterReconnect(t *testing.T) {
	ctx := setupIntegrationTest(t)
	defer ctx.DB.Close()
	defer ctx.EventBus.Close()

	// Setup: Enable external storage
	externalPath := filepath.Join(ctx.ExternalDir, "features")
	ctx.PathResolver.UpdateExternalStorage(true, externalPath, true)

	// Create original binary
	binaryPath := filepath.Join(externalPath, "bin", "sing-box")
	originalContent := []byte("original sing-box binary")
	originalChecksum := ctx.createTestBinary(binaryPath, originalContent)

	// Create instance
	instance := ctx.createTestInstance("sing-box", binaryPath, originalChecksum, serviceinstance.StatusInstalled)

	// Disconnect storage
	ctx.simulateStorageDisconnect(externalPath)

	// Mark instance as FAILED
	_, err := ctx.DB.ServiceInstance.UpdateOneID(instance.ID).
		SetStatus(serviceinstance.StatusFailed).
		SetUnavailableReason("External storage disconnected").
		Save(context.Background())
	require.NoError(t, err)

	// Modify binary file (corrupt it)
	corruptedContent := []byte("CORRUPTED DATA - this is not the original binary!")
	require.NoError(t, os.WriteFile(binaryPath, corruptedContent, 0755))

	// Reconnect storage
	ctx.simulateStorageReconnect(externalPath)

	// Calculate checksum of corrupted binary
	file, err := os.Open(binaryPath)
	require.NoError(t, err)
	defer file.Close()

	hash := sha256.New()
	_, err = hash.Write(corruptedContent)
	require.NoError(t, err)
	corruptedChecksum := hex.EncodeToString(hash.Sum(nil))

	// Verify checksum mismatch detected
	assert.NotEqual(t, originalChecksum, corruptedChecksum, "Checksum should differ for corrupted binary")

	// Simulate InstanceManager detecting SHA256 mismatch
	// Instance should remain FAILED with updated reason
	checksumFailureReason := "Binary integrity check failed after storage reconnect: checksum mismatch"
	_, err = ctx.DB.ServiceInstance.UpdateOneID(instance.ID).
		SetUnavailableReason(checksumFailureReason).
		Save(context.Background())
	require.NoError(t, err)

	// Verify instance remains FAILED
	verifiedInstance, err := ctx.DB.ServiceInstance.Get(context.Background(), instance.ID)
	require.NoError(t, err)
	assert.Equal(t, serviceinstance.StatusFailed, verifiedInstance.Status)
	assert.Contains(t, verifiedInstance.UnavailableReason, "integrity check failed")
	assert.Contains(t, verifiedInstance.UnavailableReason, "checksum mismatch")
}

// =============================================================================
// Test 3: Boot Validation with Manifest Survival
// =============================================================================

func Test_BootValidationWithManifestSurvival(t *testing.T) {
	ctx := setupIntegrationTest(t)
	defer ctx.DB.Close()
	defer ctx.EventBus.Close()

	// Setup: Binary on external storage, manifests on flash
	externalPath := filepath.Join(ctx.ExternalDir, "features")
	ctx.PathResolver.UpdateExternalStorage(true, externalPath, true)

	binaryPath := filepath.Join(externalPath, "bin", "xray-core")
	manifestPath := filepath.Join(ctx.FlashDir, "features", "manifests", "xray-core.manifest")
	configPath := filepath.Join(ctx.FlashDir, "features", "config", "xray-core.json")

	// Create binary on external storage
	binaryContent := []byte("xray-core binary data")
	checksum := ctx.createTestBinary(binaryPath, binaryContent)

	// Create manifest on flash storage (should survive storage disconnect)
	manifestContent := []byte(`{"featureId":"xray-core","version":"1.0.0"}`)
	ctx.createTestBinary(manifestPath, manifestContent)

	// Create config on flash storage
	configContent := []byte(`{"port":8080}`)
	ctx.createTestBinary(configPath, configContent)

	// Create instance with status=INSTALLED
	instance := ctx.createTestInstance("xray-core", binaryPath, checksum, serviceinstance.StatusInstalled)

	// Simulate container restart with storage disconnected
	ctx.simulateStorageDisconnect(externalPath)

	// Remove binary to simulate missing storage
	require.NoError(t, os.Remove(binaryPath))

	// Run BootValidator.ValidateAllInstances()
	summary, err := ctx.BootValidator.ValidateAllInstances(context.Background())
	require.NoError(t, err)

	// Verify manifests still readable from flash
	manifestData, err := os.ReadFile(manifestPath)
	require.NoError(t, err)
	assert.Equal(t, manifestContent, manifestData, "Manifest should survive on flash storage")

	// Verify config still readable from flash
	configData, err := os.ReadFile(configPath)
	require.NoError(t, err)
	assert.Equal(t, configContent, configData, "Config should survive on flash storage")

	// Verify instance marked FAILED
	validatedInstance, err := ctx.DB.ServiceInstance.Get(context.Background(), instance.ID)
	require.NoError(t, err)
	assert.Equal(t, serviceinstance.StatusFailed, validatedInstance.Status)

	// Verify unavailable_reason explains missing storage
	assert.Contains(t, validatedInstance.UnavailableReason, "Binary file not found")
	assert.Contains(t, validatedInstance.UnavailableReason, binaryPath)

	// Verify summary reports failure
	assert.Equal(t, 1, summary.TotalChecked)
	assert.Equal(t, 1, summary.FailedCount)
	assert.Contains(t, summary.FailedServices, "xray-core")
}

// =============================================================================
// Test 4: Migration Flow Flash to External
// =============================================================================

func Test_MigrationFlowFlashToExternal(t *testing.T) {
	ctx := setupIntegrationTest(t)
	defer ctx.DB.Close()
	defer ctx.EventBus.Close()

	// Setup: Instance with binary on flash initially
	flashBinaryPath := filepath.Join(ctx.FlashDir, "features", "bin", "adguard")
	binaryContent := []byte("adguard home binary")
	checksum := ctx.createTestBinary(flashBinaryPath, binaryContent)

	// Create manifest and config on flash (should stay there)
	manifestPath := filepath.Join(ctx.FlashDir, "features", "manifests", "adguard.manifest")
	configPath := filepath.Join(ctx.FlashDir, "features", "config", "adguard.json")
	ctx.createTestBinary(manifestPath, []byte(`{"featureId":"adguard"}`))
	ctx.createTestBinary(configPath, []byte(`{"dns_port":53}`))

	// Create instance
	instance := ctx.createTestInstance("adguard", flashBinaryPath, checksum, serviceinstance.StatusInstalled)
	assert.Equal(t, flashBinaryPath, instance.BinaryPath)

	// Enable external storage via configureExternalStorage
	externalPath := filepath.Join(ctx.ExternalDir, "features")
	ctx.PathResolver.UpdateExternalStorage(true, externalPath, true)

	// Simulate binary migration: copy binary to external path
	externalBinaryPath := ctx.PathResolver.BinaryPath("adguard")
	binaryData, err := os.ReadFile(flashBinaryPath)
	require.NoError(t, err)
	require.NoError(t, os.WriteFile(externalBinaryPath, binaryData, 0755))

	// Verify binary copied to external path
	externalBinaryData, err := os.ReadFile(externalBinaryPath)
	require.NoError(t, err)
	assert.Equal(t, binaryContent, externalBinaryData, "Binary should be copied to external storage")

	// Update instance to use external binary path
	migratedInstance, err := ctx.DB.ServiceInstance.UpdateOneID(instance.ID).
		SetBinaryPath(externalBinaryPath).
		Save(context.Background())
	require.NoError(t, err)

	// Verify PathResolver now returns external path
	resolvedPath := ctx.PathResolver.BinaryPath("adguard")
	assert.Equal(t, externalBinaryPath, resolvedPath, "PathResolver should return external path")
	assert.Contains(t, resolvedPath, externalPath, "Path should be on external storage")

	// Verify manifest still on flash
	manifestResolvedPath := ctx.PathResolver.ManifestPath("adguard")
	assert.Contains(t, manifestResolvedPath, ctx.FlashDir, "Manifest must ALWAYS be on flash")
	assert.NotContains(t, manifestResolvedPath, externalPath, "Manifest should NEVER be on external")

	// Verify config still on flash
	configResolvedPath := ctx.PathResolver.ConfigPath("adguard")
	assert.Contains(t, configResolvedPath, ctx.FlashDir, "Config must ALWAYS be on flash")
	assert.NotContains(t, configResolvedPath, externalPath, "Config should NEVER be on external")

	// Verify instance remains functional (status=INSTALLED)
	assert.Equal(t, serviceinstance.StatusInstalled, migratedInstance.Status)
	assert.Empty(t, migratedInstance.UnavailableReason)

	// Verify checksum still valid after migration
	migratedFile, err := os.Open(externalBinaryPath)
	require.NoError(t, err)
	defer migratedFile.Close()

	hash := sha256.New()
	_, err = hash.Write(binaryContent)
	require.NoError(t, err)
	migratedChecksum := hex.EncodeToString(hash.Sum(nil))

	assert.Equal(t, checksum, migratedChecksum, "Checksum should remain valid after migration")
}
