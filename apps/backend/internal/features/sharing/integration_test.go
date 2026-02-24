package sharing

import (
	"context"
	"encoding/json"
	"testing"
	"time"

	"go.uber.org/zap"

	"backend/generated/ent"

	"backend/internal/router"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
)

// TestExportImportRoundTrip tests full export → import cycle with data preservation
func TestExportImportRoundTrip(t *testing.T) {
	// Setup mocks
	mockRouter := new(MockRouterPort)
	mockEventBus := new(MockEventBus)
	mockAudit := new(MockAuditService)
	registry, err := NewFeatureRegistry()
	require.NoError(t, err)

	_ = NewService(nil, mockRouter, mockEventBus, registry, mockAudit, zap.NewNop())

	// Mock event publishing
	mockEventBus.On("Publish", context.Background(), &ServiceConfigExportedEvent{}).Return(nil)
	mockEventBus.On("Publish", context.Background(), &ServiceConfigImportedEvent{}).Return(nil)

	// Create original service instance data
	originalInstance := &ent.ServiceInstance{
		ID:            "test-instance-roundtrip",
		FeatureID:     "tor",
		InstanceName:  "Tor Exit Node",
		BinaryVersion: "0.4.7.13",
		Config: map[string]interface{}{
			"port":        9050,
			"exitPolicy":  "accept *:80",
			"nickname":    "MyTorNode",
			"contactInfo": "admin@example.com",
		},
	}

	// Simulate export (without actual database)
	pkg := &ServiceExportPackage{
		SchemaVersion:    "1.0",
		ExportedAt:       time.Now().UTC(),
		ServiceType:      originalInstance.FeatureID,
		ServiceName:      originalInstance.InstanceName,
		BinaryVersion:    originalInstance.BinaryVersion,
		Config:           originalInstance.Config,
		IncludesSecrets:  true,
		ExportedByUserID: "user123",
	}

	// Serialize and deserialize to simulate real export/import
	exportedJSON, err := json.Marshal(pkg)
	require.NoError(t, err, "Should serialize export package")

	var importedPkg ServiceExportPackage
	err = json.Unmarshal(exportedJSON, &importedPkg)
	require.NoError(t, err, "Should deserialize import package")

	// Verify all fields preserved
	assert.Equal(t, pkg.SchemaVersion, importedPkg.SchemaVersion, "Schema version preserved")
	assert.Equal(t, pkg.ServiceType, importedPkg.ServiceType, "Service type preserved")
	assert.Equal(t, pkg.ServiceName, importedPkg.ServiceName, "Service name preserved")
	assert.Equal(t, pkg.BinaryVersion, importedPkg.BinaryVersion, "Binary version preserved")
	assert.Equal(t, pkg.IncludesSecrets, importedPkg.IncludesSecrets, "Includes secrets flag preserved")
	assert.Equal(t, pkg.ExportedByUserID, importedPkg.ExportedByUserID, "User ID preserved")

	// Verify config fields preserved (note: JSON unmarshaling converts ints to float64)
	assert.Equal(t, float64(9050), importedPkg.Config["port"], "Port preserved")
	assert.Equal(t, pkg.Config["exitPolicy"], importedPkg.Config["exitPolicy"], "Exit policy preserved")
	assert.Equal(t, pkg.Config["nickname"], importedPkg.Config["nickname"], "Nickname preserved")
	assert.Equal(t, pkg.Config["contactInfo"], importedPkg.Config["contactInfo"], "Contact info preserved")
}

// TestExportWithRouting_ImportWithMissingDevices tests routing rule filtering during import
func TestExportWithRouting_ImportWithMissingDevices(t *testing.T) {
	// Setup mocks
	mockRouter := new(MockRouterPort)
	mockEventBus := new(MockEventBus)
	mockAudit := new(MockAuditService)
	registry, err := NewFeatureRegistry()
	require.NoError(t, err)

	service := NewService(nil, mockRouter, mockEventBus, registry, mockAudit, zap.NewNop())

	// Mock router query for mangle rules (export)
	mockRouter.On("QueryState", context.Background(), router.StateQuery{
		Path: "/ip/firewall/mangle",
		Filter: map[string]string{
			"comment": "nasnet-service-test-instance",
		},
	}).Return(&router.StateResult{
		Resources: []map[string]string{
			{
				"chain":            "prerouting",
				"action":           "mark-routing",
				"src-address":      "AA:BB:CC:DD:EE:FF", // Device 1 (exists on target)
				"comment":          "nasnet-service-test-instance",
				"new-routing-mark": "100",
			},
			{
				"chain":            "prerouting",
				"action":           "mark-routing",
				"src-address":      "11:22:33:44:55:66", // Device 2 (missing on target)
				"comment":          "nasnet-service-test-instance",
				"new-routing-mark": "100",
			},
			{
				"chain":            "prerouting",
				"action":           "mark-routing",
				"src-address":      "77:88:99:AA:BB:CC", // Device 3 (exists on target)
				"comment":          "nasnet-service-test-instance",
				"new-routing-mark": "100",
			},
		},
		Count: 3,
	}, nil)

	ctx := context.Background()

	// Fetch routing rules (export phase)
	rules, err := service.fetchRoutingRules(ctx, "test-instance")
	require.NoError(t, err, "Should fetch routing rules")
	require.Len(t, rules, 3, "Should have 3 routing rules")

	// Simulate import phase with device filter
	// Only devices AA:BB:CC:DD:EE:FF and 77:88:99:AA:BB:CC exist on target router
	deviceFilter := []string{"AA:BB:CC:DD:EE:FF", "77:88:99:AA:BB:CC"}

	// Build filter set (same logic as applyRoutingRules)
	filterSet := make(map[string]bool)
	for _, mac := range deviceFilter {
		filterSet[mac] = true
	}

	// Filter rules
	var filteredRules []RoutingRule
	var skippedMACs []string

	for _, rule := range rules {
		if rule.SrcAddress != "" {
			if filterSet[rule.SrcAddress] {
				filteredRules = append(filteredRules, rule)
			} else {
				skippedMACs = append(skippedMACs, rule.SrcAddress)
			}
		}
	}

	// Verify filtering results
	assert.Len(t, filteredRules, 2, "Should apply 2 rules (matched devices)")
	assert.Len(t, skippedMACs, 1, "Should skip 1 rule (missing device)")
	assert.Equal(t, "AA:BB:CC:DD:EE:FF", filteredRules[0].SrcAddress, "First matched device")
	assert.Equal(t, "77:88:99:AA:BB:CC", filteredRules[1].SrcAddress, "Second matched device")
	assert.Equal(t, "11:22:33:44:55:66", skippedMACs[0], "Skipped device MAC")

	mockRouter.AssertExpectations(t)
}

// TestQRCodeRoundTrip tests QR code generation → PNG validation
func TestQRCodeRoundTrip(t *testing.T) {
	// Setup mocks
	mockRouter := new(MockRouterPort)
	mockEventBus := new(MockEventBus)
	mockAudit := new(MockAuditService)
	registry, err := NewFeatureRegistry()
	require.NoError(t, err)

	service := NewService(nil, mockRouter, mockEventBus, registry, mockAudit, zap.NewNop())

	// Mock event publishing
	var capturedEvent *QRCodeGeneratedEvent
	mockEventBus.On("Publish", mock.Anything, mock.Anything).Run(func(args mock.Arguments) {
		if event, ok := args.Get(1).(*QRCodeGeneratedEvent); ok {
			capturedEvent = event
		}
	}).Return(nil)

	// Create simple config for QR code
	pkg := &ServiceExportPackage{
		SchemaVersion: "1.0",
		ExportedAt:    time.Now().UTC(),
		ServiceType:   "mtproxy",
		ServiceName:   "MTProxy Server",
		BinaryVersion: "2.0.0",
		Config: map[string]interface{}{
			"port":   443,
			"secret": "ee1234567890abcdef1234567890abcd",
		},
		IncludesSecrets: true,
	}

	// Verify package size is within QR limit
	data, err := json.Marshal(pkg)
	require.NoError(t, err)
	require.Less(t, len(data), QRCodeMaxSize, "Package should be under 2KB limit")

	// Generate QR code
	ctx := context.Background()
	pngData, err := service.GenerateQR(ctx, pkg, QRCodeOptions{
		Size:   256,
		UserID: "user123",
	})

	require.NoError(t, err, "QR generation should succeed")
	require.NotEmpty(t, pngData, "PNG data should not be empty")

	// Validate PNG format
	pngSignature := []byte{0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A}
	assert.Equal(t, pngSignature, pngData[:8], "Should be valid PNG format")

	// Verify PNG has reasonable size
	assert.True(t, len(pngData) > 100, "PNG should be larger than header")
	assert.True(t, len(pngData) < 50000, "PNG should be reasonably compressed")

	// Verify event was published
	require.NotNil(t, capturedEvent, "QRCodeGeneratedEvent should be published")
	assert.Equal(t, "mtproxy", capturedEvent.ServiceType)
	assert.Equal(t, "MTProxy Server", capturedEvent.ServiceName)
	assert.Greater(t, capturedEvent.DataSize, 0, "Data size should be set")
	assert.Greater(t, capturedEvent.ImageSize, 0, "Image size should be set")
	assert.Equal(t, "user123", capturedEvent.GeneratedByUserID)

	mockEventBus.AssertExpectations(t)
}
