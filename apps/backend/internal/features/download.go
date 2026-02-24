package features

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
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

// downloadToFile downloads content from URL to a file with progress tracking and resumable support
func (dm *DownloadManager) downloadToFile(ctx context.Context, url, filePath, featureID string, progress *DownloadProgress) error {
	// Check if file already exists and is resumable
	var startByte int64
	fileInfo, err := os.Stat(filePath)
	if err == nil && fileInfo.Size() > 0 {
		// Try to resume download
		startByte = fileInfo.Size()
	}

	// Create HTTP request with resume support
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, http.NoBody)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	// Set Range header if resuming
	if startByte > 0 {
		req.Header.Set("Range", fmt.Sprintf("bytes=%d-", startByte))
	}

	// Execute request
	resp, err := dm.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to execute request: %w", err)
	}
	defer resp.Body.Close()

	// Check status code - 206 for partial content (resume), 200 for full download
	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusPartialContent {
		return fmt.Errorf("download failed with status: %d %s", resp.StatusCode, resp.Status)
	}

	// Open file for appending if resuming, creating if new
	var fileFlags int
	if startByte > 0 {
		fileFlags = os.O_WRONLY | os.O_APPEND
	} else {
		fileFlags = os.O_WRONLY | os.O_CREATE | os.O_TRUNC
	}

	out, err := os.OpenFile(filePath, fileFlags, 0o644)
	if err != nil {
		return fmt.Errorf("failed to open output file: %w", err)
	}
	defer out.Close()

	// Get total size from Content-Length or Content-Range header
	totalBytes := resp.ContentLength
	if totalBytes == -1 {
		// If Content-Length is not set, try to parse from Content-Range header
		if resp.StatusCode == http.StatusPartialContent && resp.Header.Get("Content-Range") != "" {
			// Content-Range format: "bytes start-end/total"
			rangeParts := strings.Split(resp.Header.Get("Content-Range"), "/")
			if len(rangeParts) == 2 {
				//nolint:errcheck // Parse total size (error is non-critical)
				_, _ = fmt.Sscanf(rangeParts[1], "%d", &totalBytes)
			}
		}
	}

	// Update progress with total size
	dm.mu.Lock()
	progress.TotalBytes = totalBytes
	dm.mu.Unlock()

	// Create progress reader with timeout per chunk
	reader := &progressReader{
		reader: resp.Body,
		total:  totalBytes,
		read:   startByte, // Start from where we resumed
		//nolint:contextcheck // callback intentionally uses own context
		onProgress:   createProgressCallback(dm, featureID, totalBytes),
		lastUpdate:   time.Now(),
		chunkTimeout: 10 * time.Second, // Timeout for individual read operations
	}

	// Copy with progress tracking
	if _, err := io.Copy(out, reader); err != nil {
		return fmt.Errorf("failed to write file: %w", err)
	}

	return nil
}

// createProgressCallback creates a progress callback function that's safe to use with the download context.
func createProgressCallback(dm *DownloadManager, featureID string, totalBytes int64) func(int64) {
	return func(bytesRead int64) {
		dm.mu.Lock()
		defer dm.mu.Unlock()

		if totalBytes > 0 {
			percent := float64(bytesRead) / float64(totalBytes) * 100
			dm.emitProgressEvent(context.Background(), featureID, bytesRead, totalBytes, percent, "downloading", nil)
		}
	}
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

// progressReader wraps an io.Reader to track progress with timeout support
type progressReader struct {
	reader        io.Reader
	total         int64
	read          int64
	onProgress    func(int64)
	lastUpdate    time.Time
	chunkTimeout  time.Duration
	lastChunkTime time.Time
}

func (pr *progressReader) Read(p []byte) (int, error) {
	// Check for chunk timeout on subsequent reads
	if pr.chunkTimeout > 0 && !pr.lastChunkTime.IsZero() {
		if time.Since(pr.lastChunkTime) > pr.chunkTimeout {
			return 0, fmt.Errorf("chunk read timeout: no data received for %v", pr.chunkTimeout)
		}
	}

	n, err := pr.reader.Read(p)
	pr.read += int64(n)

	// Update chunk timestamp on successful read
	if n > 0 {
		pr.lastChunkTime = time.Now()
	}

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
