package scanner

import (
	"context"
	"sync"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestDefaultConfig(t *testing.T) {
	cfg := DefaultConfig()
	assert.Equal(t, 20, cfg.MaxWorkersPerSubnet24)
	assert.Equal(t, 50, cfg.MaxWorkersPerSubnet16)
	assert.Equal(t, 2*time.Second, cfg.HTTPTimeout)
	assert.Equal(t, 1*time.Hour, cfg.TaskRetentionDuration)
	assert.Equal(t, 5, cfg.MaxConcurrentScans)
}

func TestScanTask_Cancel(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	task := &ScanTask{
		ID:     "test-cancel",
		Status: ScanStatusRunning,
		cancel: cancel,
	}

	task.Cancel()

	assert.Equal(t, ScanStatusCancelled, task.GetStatus())
	assert.NotNil(t, task.EndTime)

	// Context should be cancelled
	select {
	case <-ctx.Done():
		// expected
	default:
		t.Fatal("context should be cancelled")
	}
}

func TestScanTask_Cancel_NilCancelFunc(t *testing.T) {
	task := &ScanTask{
		ID:     "test-no-cancel",
		Status: ScanStatusRunning,
	}

	// Should not panic
	task.Cancel()
	assert.Equal(t, ScanStatusCancelled, task.GetStatus())
}

func TestScanTask_SetStatus(t *testing.T) {
	tests := []struct {
		name         string
		status       ScanStatus
		expectEndSet bool
	}{
		{"pending", ScanStatusPending, false},
		{"running", ScanStatusRunning, false},
		{"completed", ScanStatusCompleted, true},
		{"cancelled", ScanStatusCancelled, true},
		{"failed", ScanStatusFailed, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			task := &ScanTask{ID: "test-status"}
			task.SetStatus(tt.status)
			assert.Equal(t, tt.status, task.GetStatus())
			if tt.expectEndSet {
				assert.NotNil(t, task.EndTime)
			} else {
				assert.Nil(t, task.EndTime)
			}
		})
	}
}

func TestScanTask_SetProgress(t *testing.T) {
	task := &ScanTask{ID: "test-progress"}
	task.SetProgress(50, 128)

	progress, scanned := task.GetProgress()
	assert.Equal(t, 50, progress)
	assert.Equal(t, 128, scanned)
}

func TestScanTask_AddResult(t *testing.T) {
	task := &ScanTask{
		ID:      "test-results",
		Results: make([]DiscoveredDevice, 0),
	}

	device := DiscoveredDevice{
		IP:         "192.168.88.1",
		DeviceType: "router",
		Vendor:     "MikroTik",
		Confidence: 90,
	}

	task.AddResult(device)
	results := task.GetResults()
	require.Len(t, results, 1)
	assert.Equal(t, "192.168.88.1", results[0].IP)
	assert.Equal(t, 90, results[0].Confidence)
}

func TestScanTask_GetResults_ReturnsCopy(t *testing.T) {
	task := &ScanTask{
		ID: "test-copy",
		Results: []DiscoveredDevice{
			{IP: "192.168.1.1"},
		},
	}

	results := task.GetResults()
	results[0].IP = "modified"

	// Original should be unchanged
	original := task.GetResults()
	assert.Equal(t, "192.168.1.1", original[0].IP)
}

func TestScanTask_ConcurrentAccess(t *testing.T) {
	task := &ScanTask{
		ID:      "test-concurrent",
		Status:  ScanStatusRunning,
		Results: make([]DiscoveredDevice, 0),
	}

	var wg sync.WaitGroup
	const goroutines = 100

	// Concurrent writes
	for i := 0; i < goroutines; i++ {
		wg.Add(1)
		go func(n int) {
			defer wg.Done()
			task.AddResult(DiscoveredDevice{IP: "192.168.1.1"})
			task.SetProgress(n, n)
		}(i)
	}

	// Concurrent reads
	for i := 0; i < goroutines; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			_ = task.GetResults()
			_, _ = task.GetProgress()
			_ = task.GetStatus()
		}()
	}

	wg.Wait()

	results := task.GetResults()
	assert.Len(t, results, goroutines)
}
