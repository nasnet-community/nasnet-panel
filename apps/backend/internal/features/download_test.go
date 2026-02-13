package features

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
	"time"

	"backend/internal/events"
)

func TestDownloadManager_Download(t *testing.T) {
	tmpDir := t.TempDir()

	// Create mock HTTP server
	testContent := []byte("This is test binary content for download manager")
	expectedChecksum := calculateTestChecksum(testContent)

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Length", fmt.Sprintf("%d", len(testContent)))
		w.WriteHeader(http.StatusOK)
		w.Write(testContent)
	}))
	defer server.Close()

	// Create event bus
	eventBus, err := events.NewEventBus(events.EventBusOptions{
		BufferSize: 100,
	})
	if err != nil {
		t.Fatalf("Failed to create event bus: %v", err)
	}
	defer eventBus.Close()

	// Create download manager
	dm := NewDownloadManager(eventBus, tmpDir)

	// Test successful download
	t.Run("Successful download", func(t *testing.T) {
		ctx := context.Background()
		err := dm.Download(ctx, "test-feature", server.URL, expectedChecksum)
		if err != nil {
			t.Fatalf("Download failed: %v", err)
		}

		// Verify file exists
		finalFile := filepath.Join(tmpDir, "test-feature", "bin", "test-feature")
		if _, err := os.Stat(finalFile); os.IsNotExist(err) {
			t.Error("Downloaded file does not exist")
		}

		// Verify content
		content, err := os.ReadFile(finalFile)
		if err != nil {
			t.Fatalf("Failed to read downloaded file: %v", err)
		}

		if string(content) != string(testContent) {
			t.Errorf("Downloaded content doesn't match. Expected %q, got %q", string(testContent), string(content))
		}

		// Verify no temp file left
		tmpFile := filepath.Join(tmpDir, "test-feature", "bin", "test-feature.tmp")
		if _, err := os.Stat(tmpFile); !os.IsNotExist(err) {
			t.Error("Temp file was not cleaned up")
		}
	})
}

func TestDownloadManager_InvalidChecksum(t *testing.T) {
	tmpDir := t.TempDir()

	// Create mock HTTP server
	testContent := []byte("Test content")

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Length", fmt.Sprintf("%d", len(testContent)))
		w.WriteHeader(http.StatusOK)
		w.Write(testContent)
	}))
	defer server.Close()

	eventBus, _ := events.NewEventBus(events.EventBusOptions{
		BufferSize: 100,
	})
	defer eventBus.Close()

	dm := NewDownloadManager(eventBus, tmpDir)

	// Use wrong checksum
	invalidChecksum := "0000000000000000000000000000000000000000000000000000000000000000"

	ctx := context.Background()
	err := dm.Download(ctx, "test-feature-bad", server.URL, invalidChecksum)

	if err == nil {
		t.Fatal("Expected error for invalid checksum, got nil")
	}

	// Verify temp file was cleaned up
	tmpFile := filepath.Join(tmpDir, "test-feature-bad", "bin", "test-feature-bad.tmp")
	if _, err := os.Stat(tmpFile); !os.IsNotExist(err) {
		t.Error("Temp file was not cleaned up after verification failure")
	}

	// Verify final file doesn't exist
	finalFile := filepath.Join(tmpDir, "test-feature-bad", "bin", "test-feature-bad")
	if _, err := os.Stat(finalFile); !os.IsNotExist(err) {
		t.Error("Final file should not exist after verification failure")
	}
}

func TestDownloadManager_ConcurrentDownloads(t *testing.T) {
	tmpDir := t.TempDir()

	testContent := []byte("Test content")
	expectedChecksum := calculateTestChecksum(testContent)

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Simulate slow download
		time.Sleep(100 * time.Millisecond)
		w.Header().Set("Content-Length", fmt.Sprintf("%d", len(testContent)))
		w.WriteHeader(http.StatusOK)
		w.Write(testContent)
	}))
	defer server.Close()

	eventBus, _ := events.NewEventBus(events.EventBusOptions{
		BufferSize: 100,
	})
	defer eventBus.Close()

	dm := NewDownloadManager(eventBus, tmpDir)

	// Start first download
	ctx := context.Background()
	errChan := make(chan error, 1)

	go func() {
		err := dm.Download(ctx, "concurrent-test", server.URL, expectedChecksum)
		errChan <- err
	}()

	// Wait a bit to ensure first download starts
	time.Sleep(50 * time.Millisecond)

	// Try to start second download for same feature
	err := dm.Download(ctx, "concurrent-test", server.URL, expectedChecksum)
	if err == nil {
		t.Error("Expected error for concurrent download of same feature, got nil")
	}

	// Wait for first download to complete
	firstErr := <-errChan
	if firstErr != nil {
		t.Errorf("First download failed: %v", firstErr)
	}
}

func TestDownloadManager_HTTPError(t *testing.T) {
	tmpDir := t.TempDir()

	// Create mock server that returns error
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNotFound)
	}))
	defer server.Close()

	eventBus, _ := events.NewEventBus(events.EventBusOptions{
		BufferSize: 100,
	})
	defer eventBus.Close()

	dm := NewDownloadManager(eventBus, tmpDir)

	ctx := context.Background()
	err := dm.Download(ctx, "http-error-test", server.URL, "dummy")

	if err == nil {
		t.Fatal("Expected error for HTTP 404, got nil")
	}

	// Verify temp file was cleaned up
	tmpFile := filepath.Join(tmpDir, "http-error-test", "bin", "http-error-test.tmp")
	if _, err := os.Stat(tmpFile); !os.IsNotExist(err) {
		t.Error("Temp file was not cleaned up after HTTP error")
	}
}

func TestDownloadManager_ContextCancellation(t *testing.T) {
	tmpDir := t.TempDir()

	testContent := []byte("Test content")

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Simulate slow download
		w.Header().Set("Content-Length", fmt.Sprintf("%d", len(testContent)))
		w.WriteHeader(http.StatusOK)

		// Write slowly to allow cancellation
		for i := 0; i < len(testContent); i++ {
			w.Write(testContent[i : i+1])
			time.Sleep(50 * time.Millisecond)
		}
	}))
	defer server.Close()

	eventBus, _ := events.NewEventBus(events.EventBusOptions{
		BufferSize: 100,
	})
	defer eventBus.Close()

	dm := NewDownloadManager(eventBus, tmpDir)

	// Create cancellable context
	ctx, cancel := context.WithCancel(context.Background())

	errChan := make(chan error, 1)
	go func() {
		err := dm.Download(ctx, "cancel-test", server.URL, "dummy")
		errChan <- err
	}()

	// Cancel after a short delay
	time.Sleep(100 * time.Millisecond)
	cancel()

	// Wait for download to fail
	err := <-errChan
	if err == nil {
		t.Error("Expected error after context cancellation, got nil")
	}

	// Verify temp file was cleaned up
	tmpFile := filepath.Join(tmpDir, "cancel-test", "bin", "cancel-test.tmp")
	if _, err := os.Stat(tmpFile); !os.IsNotExist(err) {
		t.Error("Temp file was not cleaned up after cancellation")
	}
}

func TestDownloadManager_GetProgress(t *testing.T) {
	tmpDir := t.TempDir()

	testContent := make([]byte, 10000) // 10KB
	for i := range testContent {
		testContent[i] = byte(i % 256)
	}
	expectedChecksum := calculateTestChecksum(testContent)

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Length", fmt.Sprintf("%d", len(testContent)))
		w.WriteHeader(http.StatusOK)

		// Write in chunks to simulate progress
		chunkSize := 1000
		for i := 0; i < len(testContent); i += chunkSize {
			end := i + chunkSize
			if end > len(testContent) {
				end = len(testContent)
			}
			w.Write(testContent[i:end])
			time.Sleep(10 * time.Millisecond)
		}
	}))
	defer server.Close()

	eventBus, _ := events.NewEventBus(events.EventBusOptions{
		BufferSize: 100,
	})
	defer eventBus.Close()

	dm := NewDownloadManager(eventBus, tmpDir)

	// Start download in background
	ctx := context.Background()
	go dm.Download(ctx, "progress-test", server.URL, expectedChecksum)

	// Check progress
	time.Sleep(50 * time.Millisecond)

	progress, exists := dm.GetProgress("progress-test")
	if !exists {
		t.Error("Expected progress to exist")
	}

	if progress.FeatureID != "progress-test" {
		t.Errorf("Expected feature ID 'progress-test', got %q", progress.FeatureID)
	}

	// Wait for completion
	time.Sleep(500 * time.Millisecond)

	// Progress should be removed after completion
	_, exists = dm.GetProgress("progress-test")
	if exists {
		t.Error("Expected progress to be removed after completion")
	}
}

func TestNewServiceInstallProgressEvent(t *testing.T) {
	event := NewServiceInstallProgressEvent("test-feature", 100, 1000, 10.0, "downloading", nil)

	if event.FeatureID != "test-feature" {
		t.Errorf("Expected feature ID 'test-feature', got %q", event.FeatureID)
	}

	if event.BytesDownloaded != 100 {
		t.Errorf("Expected bytes downloaded 100, got %d", event.BytesDownloaded)
	}

	if event.TotalBytes != 1000 {
		t.Errorf("Expected total bytes 1000, got %d", event.TotalBytes)
	}

	if event.Percent != 10.0 {
		t.Errorf("Expected percent 10.0, got %f", event.Percent)
	}

	if event.Status != "downloading" {
		t.Errorf("Expected status 'downloading', got %q", event.Status)
	}

	if event.GetType() != "service.install.progress" {
		t.Errorf("Expected type 'service.install.progress', got %q", event.GetType())
	}

	if event.GetSource() != "download-manager" {
		t.Errorf("Expected source 'download-manager', got %q", event.GetSource())
	}

	// Test with error
	testErr := fmt.Errorf("test error")
	eventWithError := NewServiceInstallProgressEvent("test-feature", 0, 0, 0, "failed", testErr)

	if eventWithError.ErrorMessage != "test error" {
		t.Errorf("Expected error message 'test error', got %q", eventWithError.ErrorMessage)
	}
}

func TestServiceInstallProgressEvent_Payload(t *testing.T) {
	event := NewServiceInstallProgressEvent("test-feature", 100, 1000, 10.0, "downloading", nil)

	payload, err := event.Payload()
	if err != nil {
		t.Fatalf("Failed to serialize payload: %v", err)
	}

	if len(payload) == 0 {
		t.Error("Expected non-empty payload")
	}

	// Verify it's valid JSON
	var decoded map[string]interface{}
	if err := json.Unmarshal(payload, &decoded); err != nil {
		t.Errorf("Payload is not valid JSON: %v", err)
	}
}

// Helper function to calculate SHA256 checksum for test content
func calculateTestChecksum(content []byte) string {
	hash := sha256.Sum256(content)
	return hex.EncodeToString(hash[:])
}
