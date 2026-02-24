package storage

import (
	"context"
	"sync"
	"time"

	"go.uber.org/zap"

	"backend/internal/events"
)

// publisherPort is a local interface for publishing events,
// enabling dependency injection and testability.
type publisherPort interface {
	Publish(ctx context.Context, event events.Event) error
}

// MountPoint represents a storage device mount point.
type MountPoint struct {
	Path      string  // Mount path (e.g., "/usb1", "/disk1")
	IsMounted bool    // Whether the device is currently mounted
	TotalMB   uint64  // Total storage capacity in MB
	FreeMB    uint64  // Free storage space in MB
	UsedMB    uint64  // Used storage space in MB
	UsedPct   float64 // Percentage of space used (0-100)
	FSType    string  // Filesystem type (e.g., "ext4", "vfat", "ntfs")
}

// SpaceThreshold represents storage space threshold levels.
type SpaceThreshold struct {
	Warning  float64 // Warning threshold (e.g., 80%)
	Critical float64 // Critical threshold (e.g., 90%)
	Full     float64 // Nearly full threshold (e.g., 95%)
}

// DefaultSpaceThreshold returns the default space threshold configuration.
func DefaultSpaceThreshold() SpaceThreshold {
	return SpaceThreshold{
		Warning:  80.0,
		Critical: 90.0,
		Full:     95.0,
	}
}

// StorageState tracks the current state of all mount points.
type StorageState struct { //nolint:revive // used across packages
	MountPoints map[string]*MountPoint // Key: mount path
	LastUpdate  time.Time              // When this state was last updated
}

// StorageDetector monitors external storage devices and emits events on state changes.
type StorageDetector struct { //nolint:revive // used across packages
	// Configuration
	pollInterval time.Duration
	thresholds   SpaceThreshold
	mountPaths   []string // Paths to monitor (e.g., ["/usb1", "/disk1", "/disk2"])

	// Event bus for publishing storage events
	publisher publisherPort

	// State tracking
	mu            sync.RWMutex
	currentState  *StorageState
	previousState *StorageState

	// Control
	ctx    context.Context
	cancel context.CancelFunc
	wg     sync.WaitGroup
	logger *zap.Logger
}

// StorageDetectorConfig holds configuration for the StorageDetector.
type StorageDetectorConfig struct { //nolint:revive // used across packages
	PollInterval time.Duration
	Thresholds   SpaceThreshold
	MountPaths   []string
	Publisher    publisherPort
	Logger       *zap.Logger
}

// DefaultStorageDetectorConfig returns sensible defaults for storage detection.
func DefaultStorageDetectorConfig(publisher *events.Publisher, logger *zap.Logger) StorageDetectorConfig {
	return StorageDetectorConfig{
		PollInterval: 60 * time.Second, // Poll every 60 seconds
		Thresholds:   DefaultSpaceThreshold(),
		MountPaths: []string{
			"/data",  // Primary internal storage
			"/usb1",  // USB port 1
			"/disk1", // Disk slot 1
			"/disk2", // Disk slot 2
		},
		Publisher: publisher,
		Logger:    logger,
	}
}

// NewStorageDetector creates a new StorageDetector with the given configuration.
func NewStorageDetector(cfg StorageDetectorConfig) *StorageDetector {
	ctx, cancel := context.WithCancel(context.Background())

	logger := cfg.Logger
	if logger == nil {
		logger = zap.NewNop()
	}

	return &StorageDetector{
		pollInterval: cfg.PollInterval,
		thresholds:   cfg.Thresholds,
		mountPaths:   cfg.MountPaths,
		publisher:    cfg.Publisher,
		ctx:          ctx,
		cancel:       cancel,
		logger:       logger.With(zap.String("component", "storage-detector")),
		currentState: &StorageState{
			MountPoints: make(map[string]*MountPoint),
		},
		previousState: &StorageState{
			MountPoints: make(map[string]*MountPoint),
		},
	}
}

// Start begins monitoring storage devices.
func (d *StorageDetector) Start() {
	d.logger.Info("starting storage detector")
	d.wg.Add(1)
	go d.watchMounts()
}

// Stop gracefully stops the storage detector.
func (d *StorageDetector) Stop() {
	d.logger.Info("stopping storage detector")
	d.cancel()
	d.wg.Wait()
	d.logger.Info("storage detector stopped")
}

// GetCurrentState returns a snapshot of the current storage state.
func (d *StorageDetector) GetCurrentState() *StorageState {
	d.mu.RLock()
	defer d.mu.RUnlock()

	// Deep copy to prevent external modification
	stateCopy := &StorageState{
		MountPoints: make(map[string]*MountPoint, len(d.currentState.MountPoints)),
		LastUpdate:  d.currentState.LastUpdate,
	}
	for path, mp := range d.currentState.MountPoints {
		mpCopy := *mp
		stateCopy.MountPoints[path] = &mpCopy
	}

	return stateCopy
}

// watchMounts is the main goroutine that polls mount points periodically.
func (d *StorageDetector) watchMounts() {
	defer d.wg.Done()

	ticker := time.NewTicker(d.pollInterval)
	defer ticker.Stop()

	// Initial poll
	d.pollMountPoints()

	for {
		select {
		case <-d.ctx.Done():
			return
		case <-ticker.C:
			d.pollMountPoints()
		}
	}
}

// pollMountPoints scans all configured mount points and emits events on state changes.
func (d *StorageDetector) pollMountPoints() {
	d.mu.Lock()
	defer d.mu.Unlock()

	// Save previous state for comparison
	d.previousState = &StorageState{
		MountPoints: make(map[string]*MountPoint, len(d.currentState.MountPoints)),
		LastUpdate:  d.currentState.LastUpdate,
	}
	for path, mp := range d.currentState.MountPoints {
		mpCopy := *mp
		d.previousState.MountPoints[path] = &mpCopy
	}

	// Update current state
	d.currentState.MountPoints = make(map[string]*MountPoint)
	d.currentState.LastUpdate = time.Now()

	for _, path := range d.mountPaths {
		mp, err := d.probeMountPoint(path)
		if err != nil {
			d.logger.Debug("failed to probe mount point", zap.Error(err), zap.String("path", path))
			// Still add to state, but mark as unmounted
			mp = &MountPoint{
				Path:      path,
				IsMounted: false,
			}
		}

		d.currentState.MountPoints[path] = mp

		// Detect state changes and emit events
		d.detectChanges(path, mp, d.previousState.MountPoints[path])
	}
}

// detectChanges compares previous and current mount point state and emits events.
//
//nolint:unparam // path reserved for future use
func (d *StorageDetector) detectChanges(path string, current, previous *MountPoint) {
	// Handle mount/unmount transitions
	if previous == nil {
		// First time seeing this mount point
		if current.IsMounted {
			d.emitMountedEvent(current)
		}
		return
	}

	// Mount transition
	if !previous.IsMounted && current.IsMounted {
		d.emitMountedEvent(current)
		return
	}

	// Unmount transition
	if previous.IsMounted && !current.IsMounted {
		d.emitUnmountedEvent(current)
		return
	}

	// If mounted, check for space threshold crossings
	if current.IsMounted {
		d.checkSpaceThresholds(current, previous)
	}
}

// checkSpaceThresholds detects when usage crosses threshold boundaries.
func (d *StorageDetector) checkSpaceThresholds(current, previous *MountPoint) {
	// Only emit events when crossing threshold boundaries (not on every poll)
	prevLevel := d.getThresholdLevel(previous.UsedPct)
	currLevel := d.getThresholdLevel(current.UsedPct)

	if prevLevel != currLevel && currLevel != "normal" {
		d.emitSpaceThresholdEvent(current, currLevel)
	}
}

// getThresholdLevel returns the threshold level for a given usage percentage.
func (d *StorageDetector) getThresholdLevel(usedPct float64) string {
	if usedPct >= d.thresholds.Full {
		return "full"
	}
	if usedPct >= d.thresholds.Critical {
		return "critical"
	}
	if usedPct >= d.thresholds.Warning {
		return "warning"
	}
	return "normal"
}

// emitMountedEvent emits a storage.mounted event.
func (d *StorageDetector) emitMountedEvent(mp *MountPoint) {
	d.logger.Info("storage device mounted",
		zap.String("path", mp.Path),
		zap.Uint64("total_mb", mp.TotalMB),
		zap.Uint64("free_mb", mp.FreeMB),
		zap.Float64("used_pct", mp.UsedPct),
		zap.String("fs_type", mp.FSType),
	)

	event := events.NewStorageMountedEvent(
		mp.Path,
		mp.TotalMB,
		mp.FreeMB,
		mp.UsedMB,
		mp.UsedPct,
		mp.FSType,
		"storage-detector",
	)

	if err := d.publisher.Publish(d.ctx, event); err != nil {
		d.logger.Error("failed to publish storage mounted event", zap.Error(err), zap.String("path", mp.Path))
	}
}

// emitUnmountedEvent emits a storage.unmounted event.
func (d *StorageDetector) emitUnmountedEvent(mp *MountPoint) {
	d.logger.Info("storage device unmounted",
		zap.String("path", mp.Path),
	)

	event := events.NewStorageUnmountedEvent(
		mp.Path,
		"storage-detector",
	)

	if err := d.publisher.Publish(d.ctx, event); err != nil {
		d.logger.Error("failed to publish storage unmounted event", zap.Error(err), zap.String("path", mp.Path))
	}
}

// emitSpaceThresholdEvent emits a storage.space.threshold event.
func (d *StorageDetector) emitSpaceThresholdEvent(mp *MountPoint, level string) {
	d.logger.Warn("storage space threshold crossed",
		zap.String("path", mp.Path),
		zap.Float64("used_pct", mp.UsedPct),
		zap.String("level", level),
	)

	event := events.NewStorageSpaceThresholdEvent(
		mp.Path,
		mp.TotalMB,
		mp.FreeMB,
		mp.UsedMB,
		mp.UsedPct,
		level,
		"storage-detector",
	)

	if err := d.publisher.Publish(d.ctx, event); err != nil {
		d.logger.Error("failed to publish storage space threshold event", zap.Error(err), zap.String("path", mp.Path))
	}
}

// ValidateMountPoint checks if a mount path is available and has sufficient space.
// This is used by StorageConfigService to validate storage settings.
func (d *StorageDetector) ValidateMountPoint(path string, requiredSpaceMB uint64) error {
	state := d.GetCurrentState()

	mp, exists := state.MountPoints[path]
	if !exists {
		return &StorageError{
			Code:    ErrCodeMountNotFound,
			Message: "mount point not found",
			Path:    path,
		}
	}

	if !mp.IsMounted {
		return &StorageError{
			Code:    ErrCodeNotMounted,
			Message: "storage device not mounted",
			Path:    path,
		}
	}

	if mp.FreeMB < requiredSpaceMB {
		return &StorageError{
			Code:    ErrCodeInsufficientSpace,
			Message: "insufficient storage space",
			Path:    path,
			Details: map[string]interface{}{
				"available_mb": mp.FreeMB,
				"required_mb":  requiredSpaceMB,
			},
		}
	}

	return nil
}

// probeMountPoint probes a mount point and returns filesystem statistics.
// It is platform-specific and implemented in detector_linux.go (production) and detector_dev.go (testing).
//
// Platform-specific implementations:
// - detector_linux.go (linux build tag): Uses unix.Statfs to get filesystem statistics on RouterOS
// - detector_dev.go (non-linux build tag): Returns mock data for development/testing
//
// Returns:
// - *MountPoint with filesystem statistics if the path is mounted
// - error if the path doesn't exist or filesystem stats cannot be retrieved
// Implementation provided by build-tagged files: detector_linux.go or detector_dev.go
