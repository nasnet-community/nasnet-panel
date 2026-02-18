package features

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"sync"
	"time"

	"github.com/oklog/ulid/v2"

	"backend/internal/events"
)

// DownloadManager handles binary downloads with progress tracking and verification
type DownloadManager struct {
	mu              sync.Mutex
	eventBus        events.EventBus
	httpClient      *http.Client
	baseDir         string
	activeDownloads map[string]*DownloadProgress
}

// DownloadProgress tracks the progress of a download
type DownloadProgress struct {
	FeatureID       string
	BytesDownloaded int64
	TotalBytes      int64
	Percent         float64
	Status          string
	Error           error
}

// NewDownloadManager creates a new download manager
func NewDownloadManager(eventBus events.EventBus, baseDir string) *DownloadManager {
	return &DownloadManager{
		eventBus:        eventBus,
		httpClient:      &http.Client{Timeout: 30 * time.Minute},
		baseDir:         baseDir,
		activeDownloads: make(map[string]*DownloadProgress),
	}
}

// Download downloads a binary from a URL with progress tracking and SHA256 verification
func (dm *DownloadManager) Download(ctx context.Context, featureID, url, expectedChecksum string) error {
	dm.mu.Lock()
	if _, exists := dm.activeDownloads[featureID]; exists {
		dm.mu.Unlock()
		return fmt.Errorf("download already in progress for feature %s", featureID)
	}

	progress := &DownloadProgress{
		FeatureID: featureID,
		Status:    "starting",
	}
	dm.activeDownloads[featureID] = progress
	dm.mu.Unlock()

	defer func() {
		dm.mu.Lock()
		delete(dm.activeDownloads, featureID)
		dm.mu.Unlock()
	}()

	// Emit starting event
	dm.emitProgressEvent(ctx, featureID, 0, 0, 0, "starting", nil)

	// Create feature directory
	featureDir := filepath.Join(dm.baseDir, featureID, "bin")
	if err := os.MkdirAll(featureDir, 0o755); err != nil {
		dm.emitProgressEvent(ctx, featureID, 0, 0, 0, "failed", err)
		return fmt.Errorf("failed to create feature directory: %w", err)
	}

	// Temporary file path
	tmpFile := filepath.Join(featureDir, featureID+".tmp")
	finalFile := filepath.Join(featureDir, featureID)

	// Clean up any existing temp file
	os.Remove(tmpFile)

	// Download to temporary file
	if err := dm.downloadToFile(ctx, url, tmpFile, featureID, progress); err != nil {
		os.Remove(tmpFile) // Cleanup on error
		dm.emitProgressEvent(ctx, featureID, 0, 0, 0, "failed", err)
		return fmt.Errorf("download failed: %w", err)
	}

	// Verify SHA256 checksum
	dm.emitProgressEvent(ctx, featureID, progress.TotalBytes, progress.TotalBytes, 100, "verifying", nil)

	if err := VerifySHA256(tmpFile, expectedChecksum); err != nil {
		os.Remove(tmpFile) // Cleanup on verification failure
		dm.emitProgressEvent(ctx, featureID, 0, 0, 0, "verification_failed", err)
		return fmt.Errorf("checksum verification failed: %w", err)
	}

	// Atomic rename: move .tmp to final location
	if err := os.Rename(tmpFile, finalFile); err != nil {
		os.Remove(tmpFile) // Cleanup on rename failure
		dm.emitProgressEvent(ctx, featureID, 0, 0, 0, "failed", err)
		return fmt.Errorf("failed to finalize download: %w", err)
	}

	// Make executable (on Unix systems)
	if err := os.Chmod(finalFile, 0o755); err != nil {
		dm.emitProgressEvent(ctx, featureID, 0, 0, 0, "failed", err)
		return fmt.Errorf("failed to set executable permission: %w", err)
	}

	// Emit completion event
	dm.emitProgressEvent(ctx, featureID, progress.TotalBytes, progress.TotalBytes, 100, "completed", nil)

	return nil
}

// downloadToFile downloads content from URL to a file with progress tracking
func (dm *DownloadManager) downloadToFile(ctx context.Context, url, filePath, featureID string, progress *DownloadProgress) error {
	// Create HTTP request
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, http.NoBody)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	// Execute request
	resp, err := dm.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to execute request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("download failed with status: %d %s", resp.StatusCode, resp.Status)
	}

	// Create output file
	out, err := os.Create(filePath)
	if err != nil {
		return fmt.Errorf("failed to create output file: %w", err)
	}
	defer out.Close()

	// Get total size
	totalBytes := resp.ContentLength
	progress.TotalBytes = totalBytes

	// Create progress reader
	reader := &progressReader{
		reader: resp.Body,
		total:  totalBytes,
		onProgress: func(bytesRead int64) {
			dm.mu.Lock()
			progress.BytesDownloaded = bytesRead
			if totalBytes > 0 {
				progress.Percent = float64(bytesRead) / float64(totalBytes) * 100
			}
			dm.mu.Unlock()

			// Emit progress event (throttled to avoid flooding)
			dm.emitProgressEvent(ctx, featureID, bytesRead, totalBytes, progress.Percent, "downloading", nil)
		},
		lastUpdate: time.Now(),
	}

	// Copy with progress tracking
	if _, err := io.Copy(out, reader); err != nil {
		return fmt.Errorf("failed to write file: %w", err)
	}

	return nil
}

// emitProgressEvent emits a progress event to the event bus
func (dm *DownloadManager) emitProgressEvent(ctx context.Context, featureID string, bytesDownloaded, totalBytes int64, percent float64, status string, err error) {
	if dm.eventBus == nil {
		return
	}

	event := NewServiceInstallProgressEvent(featureID, bytesDownloaded, totalBytes, percent, status, err)

	// Publish event (best-effort - errors are not critical)
	_ = dm.eventBus.Publish(ctx, event) //nolint:errcheck // event publication is best-effort, failure is non-critical
}

// GetProgress returns the current progress for a feature download
func (dm *DownloadManager) GetProgress(featureID string) (*DownloadProgress, bool) {
	dm.mu.Lock()
	defer dm.mu.Unlock()

	progress, exists := dm.activeDownloads[featureID]
	if !exists {
		return nil, false
	}

	// Return a copy to avoid race conditions
	return &DownloadProgress{
		FeatureID:       progress.FeatureID,
		BytesDownloaded: progress.BytesDownloaded,
		TotalBytes:      progress.TotalBytes,
		Percent:         progress.Percent,
		Status:          progress.Status,
		Error:           progress.Error,
	}, true
}

// progressReader wraps an io.Reader to track progress
type progressReader struct {
	reader     io.Reader
	total      int64
	read       int64
	onProgress func(int64)
	lastUpdate time.Time
}

func (pr *progressReader) Read(p []byte) (int, error) {
	n, err := pr.reader.Read(p)
	pr.read += int64(n)

	// Throttle progress updates to max once per 100ms
	now := time.Now()
	if now.Sub(pr.lastUpdate) >= 100*time.Millisecond {
		pr.onProgress(pr.read)
		pr.lastUpdate = now
	}

	return n, err
}

// ServiceInstallProgressEvent represents a service installation progress event
type ServiceInstallProgressEvent struct {
	events.BaseEvent
	FeatureID       string  `json:"featureId"`
	BytesDownloaded int64   `json:"bytesDownloaded"`
	TotalBytes      int64   `json:"totalBytes"`
	Percent         float64 `json:"percent"`
	Status          string  `json:"status"`
	ErrorMessage    string  `json:"errorMessage,omitempty"`
}

// NewServiceInstallProgressEvent creates a new service install progress event
func NewServiceInstallProgressEvent(featureID string, bytesDownloaded, totalBytes int64, percent float64, status string, err error) *ServiceInstallProgressEvent {
	event := &ServiceInstallProgressEvent{
		BaseEvent: events.BaseEvent{
			ID:        ulid.Make(),
			Type:      "service.install.progress",
			Priority:  events.PriorityNormal,
			Timestamp: time.Now(),
			Source:    "download-manager",
		},
		FeatureID:       featureID,
		BytesDownloaded: bytesDownloaded,
		TotalBytes:      totalBytes,
		Percent:         percent,
		Status:          status,
	}

	if err != nil {
		event.ErrorMessage = err.Error()
	}

	return event
}

// GetID returns the event ID
func (e *ServiceInstallProgressEvent) GetID() ulid.ULID {
	return e.ID
}

// GetType returns the event type
func (e *ServiceInstallProgressEvent) GetType() string {
	return e.Type
}

// GetPriority returns the event priority
func (e *ServiceInstallProgressEvent) GetPriority() events.Priority {
	return e.Priority
}

// GetTimestamp returns the event timestamp
func (e *ServiceInstallProgressEvent) GetTimestamp() time.Time {
	return e.Timestamp
}

// GetSource returns the event source
func (e *ServiceInstallProgressEvent) GetSource() string {
	return e.Source
}

// Payload returns the JSON payload
func (e *ServiceInstallProgressEvent) Payload() ([]byte, error) {
	return json.Marshal(e)
}
