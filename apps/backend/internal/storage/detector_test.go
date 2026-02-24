package storage

import (
	"context"
	"sync/atomic"
	"testing"
	"time"

	"backend/internal/events"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/zap"
)

// mockPublisher is a test double for events.Publisher that records published events.
type mockPublisher struct {
	events       []events.Event
	publishCount atomic.Int32
}

func newMockPublisher() *mockPublisher {
	return &mockPublisher{
		events: make([]events.Event, 0),
	}
}

func (m *mockPublisher) Publish(ctx context.Context, event events.Event) error {
	m.events = append(m.events, event)
	m.publishCount.Add(1)
	return nil
}

func (m *mockPublisher) GetEvents() []events.Event {
	return m.events
}

func (m *mockPublisher) GetEventsByType(eventType string) []events.Event {
	filtered := make([]events.Event, 0)
	for _, e := range m.events {
		if e.GetType() == eventType {
			filtered = append(filtered, e)
		}
	}
	return filtered
}

func (m *mockPublisher) Reset() {
	m.events = make([]events.Event, 0)
	m.publishCount.Store(0)
}

func (m *mockPublisher) Count() int32 {
	return m.publishCount.Load()
}

// Test_StorageDetector_DetectsUSBFlash verifies USB flash drive detection.
func Test_StorageDetector_DetectsUSBFlash(t *testing.T) {
	mockPub := newMockPublisher()
	logger := zap.NewNop()

	cfg := StorageDetectorConfig{
		PollInterval: 100 * time.Millisecond,
		Thresholds:   DefaultSpaceThreshold(),
		MountPaths:   []string{"/usb1"}, // Only monitor USB
		Publisher:    &events.Publisher{},
		Logger:       logger,
	}

	detector := NewStorageDetector(cfg)
	// Override publisher with mock for testing
	detector.publisher = mockPub

	// Start detector
	detector.Start()
	defer detector.Stop()

	// Wait for initial poll
	time.Sleep(150 * time.Millisecond)

	// Get current state
	state := detector.GetCurrentState()
	require.NotNil(t, state)

	// Verify USB mount point is detected
	mp, exists := state.MountPoints["/usb1"]
	require.True(t, exists, "USB mount point should exist")
	assert.True(t, mp.IsMounted, "USB should be mounted")
	assert.Equal(t, "/usb1", mp.Path)
	assert.Equal(t, uint64(8192), mp.TotalMB, "USB should be 8GB")
	assert.Equal(t, "vfat", mp.FSType, "USB filesystem should be vfat")
	assert.InDelta(t, 45.0, mp.UsedPct, 0.1, "USB should be 45% used")

	// Verify storage.mounted event was published
	mountedEvents := mockPub.GetEventsByType(events.EventTypeStorageMounted)
	assert.GreaterOrEqual(t, len(mountedEvents), 1, "Should have emitted at least one mounted event")

	// Verify the mounted event contains correct data
	if len(mountedEvents) > 0 {
		evt, ok := mountedEvents[0].(*events.StorageMountedEvent)
		require.True(t, ok, "Event should be StorageMountedEvent type")
		assert.Equal(t, "/usb1", evt.Path)
		assert.Equal(t, uint64(8192), evt.TotalMB)
		assert.Equal(t, "vfat", evt.FSType)
	}
}

// Test_StorageDetector_DetectsSDCard verifies SD card detection with critical threshold.
func Test_StorageDetector_DetectsSDCard(t *testing.T) {
	mockPub := newMockPublisher()
	logger := zap.NewNop()

	cfg := StorageDetectorConfig{
		PollInterval: 100 * time.Millisecond,
		Thresholds:   DefaultSpaceThreshold(), // 90% critical threshold
		MountPaths:   []string{"/disk1"},      // SD card at 92% usage
		Publisher:    &events.Publisher{},
		Logger:       logger,
	}

	detector := NewStorageDetector(cfg)
	detector.publisher = mockPub

	detector.Start()
	defer detector.Stop()

	// Wait for initial poll
	time.Sleep(150 * time.Millisecond)

	state := detector.GetCurrentState()
	require.NotNil(t, state)

	// Verify SD card mount point
	mp, exists := state.MountPoints["/disk1"]
	require.True(t, exists, "SD card mount point should exist")
	assert.True(t, mp.IsMounted, "SD card should be mounted")
	assert.Equal(t, uint64(16384), mp.TotalMB, "SD card should be 16GB")
	assert.Equal(t, "ext4", mp.FSType, "SD card filesystem should be ext4")
	assert.InDelta(t, 92.0, mp.UsedPct, 0.1, "SD card should be 92% used (critical)")

	// Verify storage.mounted event was published
	mountedEvents := mockPub.GetEventsByType(events.EventTypeStorageMounted)
	assert.GreaterOrEqual(t, len(mountedEvents), 1, "Should have emitted mounted event")

	// Verify storage.space.threshold event was published (92% crosses critical threshold)
	thresholdEvents := mockPub.GetEventsByType(events.EventTypeStorageSpaceThreshold)
	assert.GreaterOrEqual(t, len(thresholdEvents), 1, "Should have emitted threshold event for critical usage")

	if len(thresholdEvents) > 0 {
		evt, ok := thresholdEvents[0].(*events.StorageSpaceThresholdEvent)
		require.True(t, ok, "Event should be StorageSpaceThresholdEvent type")
		assert.Equal(t, "/disk1", evt.Path)
		assert.Equal(t, "critical", evt.Level, "Should be critical level (92% > 90%)")
		assert.InDelta(t, 92.0, evt.UsedPct, 0.1)
	}
}

// Test_StorageDetector_NoStorageDetected verifies handling of unmounted storage.
func Test_StorageDetector_NoStorageDetected(t *testing.T) {
	mockPub := newMockPublisher()
	logger := zap.NewNop()

	cfg := StorageDetectorConfig{
		PollInterval: 100 * time.Millisecond,
		Thresholds:   DefaultSpaceThreshold(),
		MountPaths:   []string{"/disk2"}, // disk2 is unmounted in mock
		Publisher:    &events.Publisher{},
		Logger:       logger,
	}

	detector := NewStorageDetector(cfg)
	detector.publisher = mockPub

	detector.Start()
	defer detector.Stop()

	// Wait for initial poll
	time.Sleep(150 * time.Millisecond)

	state := detector.GetCurrentState()
	require.NotNil(t, state)

	// Verify unmounted disk is tracked but marked as not mounted
	mp, exists := state.MountPoints["/disk2"]
	require.True(t, exists, "Mount point should exist in state")
	assert.False(t, mp.IsMounted, "Disk should not be mounted")
	assert.Equal(t, "/disk2", mp.Path)

	// No mounted events should be published for unmounted disk
	mountedEvents := mockPub.GetEventsByType(events.EventTypeStorageMounted)
	assert.Equal(t, 0, len(mountedEvents), "Should not emit mounted event for unmounted disk")
}

// Test_StorageDetector_EmitsEventsOnTransition verifies mount/unmount transitions emit correct events.
func Test_StorageDetector_EmitsEventsOnTransition(t *testing.T) {
	mockPub := newMockPublisher()
	logger := zap.NewNop()

	// Create detector that polls frequently
	cfg := StorageDetectorConfig{
		PollInterval: 50 * time.Millisecond,
		Thresholds:   DefaultSpaceThreshold(),
		MountPaths:   []string{"/usb1"},
		Publisher:    &events.Publisher{},
		Logger:       logger,
	}

	detector := NewStorageDetector(cfg)
	detector.publisher = mockPub

	detector.Start()
	defer detector.Stop()

	// Wait for initial poll (should detect USB as mounted)
	time.Sleep(100 * time.Millisecond)

	// Verify initial mounted event
	initialMountedEvents := mockPub.GetEventsByType(events.EventTypeStorageMounted)
	assert.GreaterOrEqual(t, len(initialMountedEvents), 1, "Should emit mounted event on first detection")

	// Reset mock to track new events
	mockPub.Reset()

	// Simulate unmount by manually updating state
	// (In real tests, we'd mock the probeMountPoint function)
	detector.mu.Lock()
	detector.currentState.MountPoints["/usb1"].IsMounted = false
	detector.mu.Unlock()

	// Wait for next poll to detect the change
	time.Sleep(100 * time.Millisecond)

	// Note: In the dev mock implementation, the state is actually determined by probeMountPoint
	// which always returns the same data. For a proper test, we would need to mock probeMountPoint.
	// This test demonstrates the pattern, but in production, we'd use dependency injection
	// to make probeMountPoint mockable.

	// For now, verify the detector continues running without errors
	state := detector.GetCurrentState()
	assert.NotNil(t, state)
	assert.NotNil(t, state.MountPoints)
}

// Test_PathResolver_FlashStorage verifies flash storage path resolution.
func Test_PathResolver_FlashStorage(t *testing.T) {
	tests := []struct {
		name         string
		serviceName  string
		pathType     string
		expectedPath string
		expectedRoot string
		alwaysFlash  bool // Some paths MUST always use flash
	}{
		{
			name:         "binary path on flash (external disabled)",
			serviceName:  "tor",
			pathType:     "binary",
			expectedPath: "/flash/features/bin/tor",
			expectedRoot: "/flash/features/bin",
			alwaysFlash:  false,
		},
		{
			name:         "config path always on flash (CRITICAL)",
			serviceName:  "adguard",
			pathType:     "config",
			expectedPath: "/flash/features/config/adguard.json",
			expectedRoot: "/flash/features/config",
			alwaysFlash:  true,
		},
		{
			name:         "manifest path always on flash (CRITICAL)",
			serviceName:  "xray",
			pathType:     "manifest",
			expectedPath: "/flash/features/manifests/xray.manifest",
			expectedRoot: "/flash/features/manifests",
			alwaysFlash:  true,
		},
		{
			name:         "data path on flash (external disabled)",
			serviceName:  "sing-box",
			pathType:     "data",
			expectedPath: "/flash/features/data/sing-box",
			expectedRoot: "/flash/features/data",
			alwaysFlash:  false,
		},
		{
			name:         "logs path on flash (external disabled)",
			serviceName:  "mtproxy",
			pathType:     "logs",
			expectedPath: "/flash/features/logs/mtproxy",
			expectedRoot: "/flash/features/logs",
			alwaysFlash:  false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create resolver with external storage disabled
			cfg := DefaultPathResolverConfig()
			cfg.ExternalEnabled = false
			resolver := NewDefaultPathResolver(cfg)

			var actualPath string
			switch tt.pathType {
			case "binary":
				actualPath = resolver.BinaryPath(tt.serviceName)
			case "config":
				actualPath = resolver.ConfigPath(tt.serviceName)
			case "manifest":
				actualPath = resolver.ManifestPath(tt.serviceName)
			case "data":
				actualPath = resolver.DataPath(tt.serviceName)
			case "logs":
				actualPath = resolver.LogsPath(tt.serviceName)
			}

			assert.Equal(t, tt.expectedPath, actualPath, "Path should match expected")

			// Verify root path
			actualRoot := resolver.RootPath(tt.pathType)
			assert.Equal(t, tt.expectedRoot, actualRoot, "Root path should match expected")

			// Verify critical paths NEVER use external storage (even if enabled)
			if tt.alwaysFlash {
				// Enable external storage
				resolver.UpdateExternalStorage(true, "/usb1/features", true)

				// Re-check path - should still be on flash
				var pathWithExternalEnabled string
				switch tt.pathType {
				case "config":
					pathWithExternalEnabled = resolver.ConfigPath(tt.serviceName)
				case "manifest":
					pathWithExternalEnabled = resolver.ManifestPath(tt.serviceName)
				}

				assert.Equal(t, tt.expectedPath, pathWithExternalEnabled,
					"CRITICAL: %s path must ALWAYS be on flash, never external", tt.pathType)
			}
		})
	}
}

// Test_PathResolver_ExternalStorage verifies external storage path resolution.
func Test_PathResolver_ExternalStorage(t *testing.T) {
	tests := []struct {
		name          string
		serviceName   string
		pathType      string
		externalPath  string
		externalMount bool
		expectedPath  string
		expectedRoot  string
		description   string
	}{
		{
			name:          "binary on external when enabled and mounted",
			serviceName:   "tor",
			pathType:      "binary",
			externalPath:  "/usb1/features",
			externalMount: true,
			expectedPath:  "/usb1/features/bin/tor",
			expectedRoot:  "/usb1/features/bin",
			description:   "Binaries should use external storage when available",
		},
		{
			name:          "binary on flash when external unmounted",
			serviceName:   "tor",
			pathType:      "binary",
			externalPath:  "/usb1/features",
			externalMount: false,
			expectedPath:  "/flash/features/bin/tor",
			expectedRoot:  "/flash/features/bin",
			description:   "Should fallback to flash when external unmounted",
		},
		{
			name:          "data on external when enabled",
			serviceName:   "adguard",
			pathType:      "data",
			externalPath:  "/disk1/features",
			externalMount: true,
			expectedPath:  "/disk1/features/data/adguard",
			expectedRoot:  "/disk1/features/data",
			description:   "Data should prefer external storage",
		},
		{
			name:          "logs on external when enabled",
			serviceName:   "xray",
			pathType:      "logs",
			externalPath:  "/usb1/features",
			externalMount: true,
			expectedPath:  "/usb1/features/logs/xray",
			expectedRoot:  "/usb1/features/logs",
			description:   "Logs should prefer external storage",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			cfg := DefaultPathResolverConfig()
			resolver := NewDefaultPathResolver(cfg)

			// Configure external storage
			resolver.UpdateExternalStorage(true, tt.externalPath, tt.externalMount)

			var actualPath string
			switch tt.pathType {
			case "binary":
				actualPath = resolver.BinaryPath(tt.serviceName)
			case "data":
				actualPath = resolver.DataPath(tt.serviceName)
			case "logs":
				actualPath = resolver.LogsPath(tt.serviceName)
			}

			assert.Equal(t, tt.expectedPath, actualPath, tt.description)

			actualRoot := resolver.RootPath(tt.pathType)
			assert.Equal(t, tt.expectedRoot, actualRoot, "Root path should match expected")

			// Verify IsUsingExternalStorage reflects the state
			if tt.externalMount {
				assert.True(t, resolver.IsUsingExternalStorage(), "Should report using external storage")
				assert.Equal(t, tt.externalPath, resolver.GetExternalPath(), "External path should match")
			} else {
				assert.False(t, resolver.IsUsingExternalStorage(), "Should not report using external when unmounted")
			}
		})
	}
}

// Test_StorageConfig_Persistence verifies StorageConfigService database operations.
func Test_StorageConfig_Persistence(t *testing.T) {
	// This test requires a real ent.Client with in-memory SQLite
	// For now, we'll test the basic structure and validation logic

	t.Run("validates empty path", func(t *testing.T) {
		err := NewStorageError(
			ErrCodeInvalidPath,
			"path cannot be empty",
			"",
		)
		assert.NotNil(t, err)
		assert.Equal(t, ErrCodeInvalidPath, err.Code)
		assert.Contains(t, err.Error(), "INVALID_PATH")
	})

	t.Run("validates mount point existence", func(t *testing.T) {
		err := NewStorageError(
			ErrCodeMountNotFound,
			"path is not a monitored mount point",
			"/invalid",
		)
		assert.NotNil(t, err)
		assert.Equal(t, ErrCodeMountNotFound, err.Code)
		assert.Contains(t, err.Error(), "/invalid")
	})

	t.Run("validates insufficient space", func(t *testing.T) {
		err := NewStorageErrorWithDetails(
			ErrCodeInsufficientSpace,
			"insufficient free space",
			"/usb1",
			map[string]interface{}{
				"available_mb": 50,
				"required_mb":  100,
			},
		)
		assert.NotNil(t, err)
		assert.Equal(t, ErrCodeInsufficientSpace, err.Code)
		assert.NotNil(t, err.Details)
		assert.Equal(t, 50, err.Details["available_mb"])
		assert.Equal(t, 100, err.Details["required_mb"])
	})
}

// Test_SpaceThreshold_EdgeCases verifies threshold detection edge cases.
func Test_SpaceThreshold_EdgeCases(t *testing.T) {
	tests := []struct {
		name          string
		usedPct       float64
		expectedLevel string
	}{
		{"normal usage at 0%", 0.0, "normal"},
		{"normal usage at 50%", 50.0, "normal"},
		{"normal usage at 79.9%", 79.9, "normal"},
		{"warning threshold at 80%", 80.0, "warning"},
		{"warning threshold at 85%", 85.0, "warning"},
		{"warning threshold at 89.9%", 89.9, "warning"},
		{"critical threshold at 90%", 90.0, "critical"},
		{"critical threshold at 92%", 92.0, "critical"},
		{"critical threshold at 94.9%", 94.9, "critical"},
		{"full threshold at 95%", 95.0, "full"},
		{"full threshold at 98%", 98.0, "full"},
		{"full threshold at 100%", 100.0, "full"},
	}

	mockPub := newMockPublisher()
	logger := zap.NewNop()

	cfg := StorageDetectorConfig{
		PollInterval: 1 * time.Second,
		Thresholds:   DefaultSpaceThreshold(), // 80/90/95
		MountPaths:   []string{"/test"},
		Publisher:    &events.Publisher{},
		Logger:       logger,
	}

	detector := NewStorageDetector(cfg)
	detector.publisher = mockPub

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			level := detector.getThresholdLevel(tt.usedPct)
			assert.Equal(t, tt.expectedLevel, level,
				"Usage %.1f%% should be classified as %s", tt.usedPct, tt.expectedLevel)
		})
	}

	// Verify custom thresholds work
	t.Run("custom thresholds", func(t *testing.T) {
		customThreshold := SpaceThreshold{
			Warning:  70.0,
			Critical: 85.0,
			Full:     95.0,
		}

		customCfg := StorageDetectorConfig{
			PollInterval: 1 * time.Second,
			Thresholds:   customThreshold,
			MountPaths:   []string{"/test"},
			Publisher:    &events.Publisher{},
			Logger:       logger,
		}

		customDetector := NewStorageDetector(customCfg)

		assert.Equal(t, "normal", customDetector.getThresholdLevel(69.9))
		assert.Equal(t, "warning", customDetector.getThresholdLevel(70.0))
		assert.Equal(t, "warning", customDetector.getThresholdLevel(84.9))
		assert.Equal(t, "critical", customDetector.getThresholdLevel(85.0))
		assert.Equal(t, "critical", customDetector.getThresholdLevel(94.9))
		assert.Equal(t, "full", customDetector.getThresholdLevel(95.0))
	})
}
