package scanner

import (
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func newTestService() *ScannerService {
	config := ScannerConfig{
		MaxWorkersPerSubnet24: 2,
		MaxWorkersPerSubnet16: 4,
		HTTPTimeout:           100 * time.Millisecond,
		TaskRetentionDuration: 5 * time.Second,
		MaxConcurrentScans:    2,
	}
	return NewService(config, nil)
}

func TestNewService(t *testing.T) {
	svc := newTestService()
	require.NotNil(t, svc)
	assert.Equal(t, 2, svc.config.MaxWorkersPerSubnet24)
}

func TestNewServiceWithDefaults(t *testing.T) {
	svc := NewServiceWithDefaults(nil)
	require.NotNil(t, svc)
	assert.Equal(t, 20, svc.config.MaxWorkersPerSubnet24)
	assert.Equal(t, 50, svc.config.MaxWorkersPerSubnet16)
}

func TestStartScan_InvalidSubnet(t *testing.T) {
	svc := newTestService()
	_, err := svc.StartScan(context.Background(), "not-a-subnet")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "invalid subnet")
}

func TestStartScan_PublicSubnet(t *testing.T) {
	svc := newTestService()
	_, err := svc.StartScan(context.Background(), "8.8.8.0/24")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "non-private IP")
}

func TestStartScan_ValidSubnet(t *testing.T) {
	svc := newTestService()
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	task, err := svc.StartScan(ctx, "192.168.88.0/30")
	require.NoError(t, err)
	require.NotNil(t, task)

	assert.NotEmpty(t, task.ID)
	assert.Equal(t, "192.168.88.0/30", task.Subnet)
	assert.Equal(t, 2, task.TotalIPs) // /30 = 2 usable IPs
	assert.NotZero(t, task.StartTime)

	// Wait for scan to complete (scanning non-routable IPs should fail quickly)
	time.Sleep(2 * time.Second)

	status := task.GetStatus()
	assert.True(t, status == ScanStatusCompleted || status == ScanStatusCancelled,
		"expected completed or cancelled, got %s", status)
}

func TestStartScan_ConcurrentLimit(t *testing.T) {
	config := ScannerConfig{
		MaxWorkersPerSubnet24: 1,
		MaxWorkersPerSubnet16: 1,
		HTTPTimeout:           100 * time.Millisecond,
		TaskRetentionDuration: 5 * time.Second,
		MaxConcurrentScans:    1, // Only allow 1 concurrent scan
	}
	svc := NewService(config, nil)

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Start first scan
	task1, err := svc.StartScan(ctx, "192.168.1.0/30")
	require.NoError(t, err)
	require.NotNil(t, task1)

	// Second scan should fail because of concurrent limit
	// (but only if the first scan is still running)
	// Give first scan a moment to start
	time.Sleep(50 * time.Millisecond)

	// Check if first is still running
	if task1.GetStatus() == ScanStatusRunning {
		_, err = svc.StartScan(ctx, "192.168.2.0/30")
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "maximum concurrent scans")
	}
}

func TestStartAutoScan(t *testing.T) {
	svc := newTestService()
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	task, err := svc.StartAutoScan(ctx)
	require.NoError(t, err)
	require.NotNil(t, task)

	assert.Contains(t, task.ID, "auto_scan_")
	assert.Equal(t, "192.168.0-255.1", task.Subnet)
	assert.Equal(t, 256, task.TotalIPs)

	// Cancel immediately to avoid long running scan
	task.Cancel()
}

func TestGetStatus_Found(t *testing.T) {
	svc := newTestService()
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	task, err := svc.StartScan(ctx, "192.168.88.0/30")
	require.NoError(t, err)
	defer task.Cancel()

	found, err := svc.GetStatus(task.ID)
	require.NoError(t, err)
	assert.Equal(t, task.ID, found.ID)
}

func TestGetStatus_NotFound(t *testing.T) {
	svc := newTestService()
	_, err := svc.GetStatus("nonexistent-task")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "task not found")
}

func TestCancelScan(t *testing.T) {
	svc := newTestService()
	ctx := context.Background()

	// Start a scan with a large range so it takes time
	task, err := svc.StartScan(ctx, "192.168.1.0/24")
	require.NoError(t, err)

	// Give it a moment to start
	time.Sleep(100 * time.Millisecond)

	// Cancel the scan
	cancelled, err := svc.CancelScan(task.ID)
	require.NoError(t, err)
	assert.NotNil(t, cancelled)

	// Wait a moment for cancellation to propagate
	time.Sleep(200 * time.Millisecond)

	status := cancelled.GetStatus()
	assert.Equal(t, ScanStatusCancelled, status)
}

func TestCancelScan_NotFound(t *testing.T) {
	svc := newTestService()
	_, err := svc.CancelScan("nonexistent")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "task not found")
}

func TestCancelScan_AlreadyCompleted(t *testing.T) {
	svc := newTestService()
	ctx := context.Background()

	// Scan a single IP (completes quickly)
	task, err := svc.StartScan(ctx, "192.168.88.1")
	require.NoError(t, err)

	// Wait for completion
	time.Sleep(2 * time.Second)

	// Cancel should return the task without error
	result, err := svc.CancelScan(task.ID)
	require.NoError(t, err)
	assert.NotNil(t, result)
}

func TestGetHistory(t *testing.T) {
	svc := newTestService()
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Start a scan with single IP (completes fast, won't block concurrency)
	task1, err := svc.StartScan(ctx, "192.168.1.1")
	require.NoError(t, err)

	// Wait for first to finish before starting second to avoid concurrent limit
	time.Sleep(500 * time.Millisecond)

	task2, err := svc.StartScan(ctx, "192.168.2.1")
	require.NoError(t, err)

	// Ensure both are done
	defer task1.Cancel()
	defer task2.Cancel()
	time.Sleep(500 * time.Millisecond)

	history := svc.GetHistory(10)
	assert.GreaterOrEqual(t, len(history), 2)
}

func TestGetHistory_WithLimit(t *testing.T) {
	svc := newTestService()
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Start scans sequentially so they don't hit the concurrent limit
	var tasks []*ScanTask
	for _, ip := range []string{"192.168.1.1", "192.168.2.1"} {
		task, err := svc.StartScan(ctx, ip)
		require.NoError(t, err)
		tasks = append(tasks, task)
		time.Sleep(500 * time.Millisecond) // Wait for completion
	}
	for _, task := range tasks {
		defer task.Cancel()
	}

	// Request only 1
	history := svc.GetHistory(1)
	assert.LessOrEqual(t, len(history), 1)
	assert.GreaterOrEqual(t, len(history), 1)
}

func TestGetHistory_Empty(t *testing.T) {
	svc := newTestService()
	history := svc.GetHistory(10)
	assert.Empty(t, history)
}
