package sharing

import (
	"context"
	"encoding/json"
	"strings"
	"testing"
	"time"

	"github.com/skip2/go-qrcode"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// TestGenerateQR_MTProxy tests QR generation for MTProxy config
func TestGenerateQR_MTProxy(t *testing.T) {
	mockRouter := new(MockRouterPort)
	mockEventBus := new(MockEventBus)
	mockAudit := new(MockAuditService)
	registry, _ := NewFeatureRegistry()
	service := NewService(nil, mockRouter, mockEventBus, registry, mockAudit)

	// Mock event publishing
	mockEventBus.On("Publish", mock.Anything, mock.Anything).Return(nil)

	// Create MTProxy export package (typical size ~500 bytes)
	pkg := &ServiceExportPackage{
		SchemaVersion: "1.0",
		ExportedAt:    time.Now(),
		ServiceType:   "mtproxy",
		ServiceName:   "MTProxy Server",
		BinaryVersion: "2.0.0",
		Config: map[string]interface{}{
			"port":   443,
			"secret": "ee1234567890abcdef1234567890abcd",
			"tag":    "mytag",
		},
		IncludesSecrets: true,
	}

	// Generate QR code
	ctx := context.Background()
	pngData, err := service.GenerateQR(ctx, pkg, QRCodeOptions{
		Size:            256,
		ErrorCorrection: qrcode.Medium,
		UserID:          "test-user",
	})

	assert.NoError(t, err, "QR generation should succeed for MTProxy config")
	assert.NotEmpty(t, pngData, "PNG data should not be empty")
	assert.True(t, len(pngData) > 100, "PNG should be larger than header size")

	// Verify PNG signature (first 8 bytes)
	pngSignature := []byte{0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A}
	assert.Equal(t, pngSignature, pngData[:8], "Should be valid PNG format")

	mockEventBus.AssertExpectations(t)
}

// TestGenerateQR_SizeLimit tests V403 error for configs exceeding 2KB
func TestGenerateQR_SizeLimit(t *testing.T) {
	mockRouter := new(MockRouterPort)
	mockEventBus := new(MockEventBus)
	mockAudit := new(MockAuditService)
	registry, _ := NewFeatureRegistry()
	service := NewService(nil, mockRouter, mockEventBus, registry, mockAudit)

	// Create oversized config (> 2KB)
	largeConfig := make(map[string]interface{})
	for i := 0; i < 200; i++ {
		largeConfig[string(rune(i))] = strings.Repeat("x", 50)
	}

	pkg := &ServiceExportPackage{
		SchemaVersion: "1.0",
		ExportedAt:    time.Now(),
		ServiceType:   "tor",
		ServiceName:   "Tor Node",
		BinaryVersion: "1.0.0",
		Config:        largeConfig,
	}

	// Verify package size exceeds limit
	data, _ := json.Marshal(pkg)
	assert.True(t, len(data) > QRCodeMaxSize, "Test package should exceed 2KB limit")

	// Try to generate QR code
	ctx := context.Background()
	pngData, err := service.GenerateQR(ctx, pkg, QRCodeOptions{})

	assert.Error(t, err, "Should return error for oversized config")
	assert.Nil(t, pngData, "PNG data should be nil on error")

	// Verify error details
	qrErr, ok := err.(*QRCodeError)
	assert.True(t, ok, "Error should be QRCodeError type")
	assert.Equal(t, "V403", qrErr.Code, "Error code should be V403")
	assert.Greater(t, qrErr.Size, QRCodeMaxSize, "Error should report actual size")
	assert.Contains(t, qrErr.Message, "too large", "Error message should mention size")
}

// TestGenerateQR_PNGValidation tests PNG format validation
func TestGenerateQR_PNGValidation(t *testing.T) {
	mockRouter := new(MockRouterPort)
	mockEventBus := new(MockEventBus)
	mockAudit := new(MockAuditService)
	registry, _ := NewFeatureRegistry()
	service := NewService(nil, mockRouter, mockEventBus, registry, mockAudit)

	// Mock event publishing
	mockEventBus.On("Publish", mock.Anything, mock.Anything).Return(nil)

	// Create small config
	pkg := &ServiceExportPackage{
		SchemaVersion: "1.0",
		ExportedAt:    time.Now(),
		ServiceType:   "tor",
		ServiceName:   "Tor",
		BinaryVersion: "1.0.0",
		Config: map[string]interface{}{
			"port": 9050,
		},
	}

	testCases := []struct {
		name            string
		size            int
		errorCorrection qrcode.RecoveryLevel
	}{
		{"256px Medium", 256, qrcode.Medium},
		{"512px High", 512, qrcode.High},
		{"128px Low", 128, qrcode.Low},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			ctx := context.Background()
			pngData, err := service.GenerateQR(ctx, pkg, QRCodeOptions{
				Size:            tc.size,
				ErrorCorrection: tc.errorCorrection,
				UserID:          "test-user",
			})

			assert.NoError(t, err, "QR generation should succeed")
			assert.NotEmpty(t, pngData, "PNG data should not be empty")

			// Verify PNG signature
			pngSignature := []byte{0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A}
			assert.Equal(t, pngSignature, pngData[:8], "Should have valid PNG signature")

			// Verify reasonable size (PNG compression)
			assert.True(t, len(pngData) > 100, "PNG should be larger than header")
			assert.True(t, len(pngData) < 50000, "PNG should be reasonably compressed")
		})
	}
}

// TestGenerateQR_DefaultOptions tests default option values
func TestGenerateQR_DefaultOptions(t *testing.T) {
	mockRouter := new(MockRouterPort)
	mockEventBus := new(MockEventBus)
	mockAudit := new(MockAuditService)
	registry, _ := NewFeatureRegistry()
	service := NewService(nil, mockRouter, mockEventBus, registry, mockAudit)

	// Mock event publishing
	mockEventBus.On("Publish", mock.Anything, mock.Anything).Return(nil)

	pkg := &ServiceExportPackage{
		SchemaVersion: "1.0",
		ExportedAt:    time.Now(),
		ServiceType:   "tor",
		ServiceName:   "Tor",
		BinaryVersion: "1.0.0",
		Config:        map[string]interface{}{"port": 9050},
	}

	// Generate with empty options (should use defaults)
	ctx := context.Background()
	pngData, err := service.GenerateQR(ctx, pkg, QRCodeOptions{})

	assert.NoError(t, err, "Should succeed with default options")
	assert.NotEmpty(t, pngData, "Should generate PNG with defaults")

	// Defaults: 256px, Medium error correction
	// Verify it's a valid PNG
	pngSignature := []byte{0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A}
	assert.Equal(t, pngSignature, pngData[:8], "Should use default settings")
}

// TestGenerateQR_EventPublishing tests QRCodeGeneratedEvent
func TestGenerateQR_EventPublishing(t *testing.T) {
	mockRouter := new(MockRouterPort)
	mockEventBus := new(MockEventBus)
	mockAudit := new(MockAuditService)
	registry, _ := NewFeatureRegistry()
	service := NewService(nil, mockRouter, mockEventBus, registry, mockAudit)

	// Capture event
	var capturedEvent *QRCodeGeneratedEvent
	mockEventBus.On("Publish", mock.Anything, mock.Anything).Run(func(args mock.Arguments) {
		if event, ok := args.Get(1).(*QRCodeGeneratedEvent); ok {
			capturedEvent = event
		}
	}).Return(nil)

	pkg := &ServiceExportPackage{
		SchemaVersion: "1.0",
		ExportedAt:    time.Now(),
		ServiceType:   "mtproxy",
		ServiceName:   "MTProxy",
		BinaryVersion: "2.0.0",
		Config:        map[string]interface{}{"port": 443},
	}

	ctx := context.Background()
	_, err := service.GenerateQR(ctx, pkg, QRCodeOptions{UserID: "user123"})

	assert.NoError(t, err)
	assert.NotNil(t, capturedEvent, "Event should be published")
	assert.Equal(t, "mtproxy", capturedEvent.ServiceType)
	assert.Equal(t, "MTProxy", capturedEvent.ServiceName)
	assert.Greater(t, capturedEvent.DataSize, 0, "Data size should be set")
	assert.Greater(t, capturedEvent.ImageSize, 0, "Image size should be set")
	assert.Equal(t, "user123", capturedEvent.GeneratedByUserID)

	mockEventBus.AssertExpectations(t)
}
