// Package scanner provides network scanning functionality for discovering MikroTik routers.
// It implements the service layer for NAS-3.4: Router Auto Scanner.
package scanner

import (
	"context"
	"sync"
	"time"
)

// ScanStatus represents the current state of a scan task.
type ScanStatus string

const (
	ScanStatusPending   ScanStatus = "PENDING"
	ScanStatusRunning   ScanStatus = "RUNNING"
	ScanStatusScanning  ScanStatus = "SCANNING" // Alias for RUNNING, used by ARP scanner
	ScanStatusCompleted ScanStatus = "COMPLETED"
	ScanStatusCanceled  ScanStatus = "CANCELED"
	ScanStatusFailed    ScanStatus = "FAILED"
)

// RouterOSInfo contains information extracted from a RouterOS device.
type RouterOSInfo struct {
	Version      string `json:"version,omitempty"`
	BoardName    string `json:"boardName,omitempty"`
	Architecture string `json:"architecture,omitempty"`
	Platform     string `json:"platform,omitempty"`
	Confidence   int    `json:"confidence"`
	IsValid      bool   `json:"isValid"`
}

// DiscoveredDevice represents a device found during network scanning.
type DiscoveredDevice struct {
	IP           string        `json:"ip"`
	Hostname     string        `json:"hostname,omitempty"`
	Ports        []int         `json:"ports"`
	DeviceType   string        `json:"deviceType"`
	Vendor       string        `json:"vendor,omitempty"`
	Services     []string      `json:"services"`
	RouterOSInfo *RouterOSInfo `json:"routerOSInfo,omitempty"`
	Confidence   int           `json:"confidence"`
}

// ScanTask represents an ongoing or completed network scan operation.
type ScanTask struct {
	ID         string             `json:"id"`
	Subnet     string             `json:"subnet"`
	Status     ScanStatus         `json:"status"`
	Progress   int                `json:"progress"`
	Results    []DiscoveredDevice `json:"results"`
	StartTime  time.Time          `json:"startTime"`
	EndTime    *time.Time         `json:"endTime,omitempty"`
	Error      string             `json:"error,omitempty"`
	TotalIPs   int                `json:"totalIPs"`
	ScannedIPs int                `json:"scannedIPs"`

	// Internal fields for cancellation support
	cancel context.CancelFunc
	mu     sync.RWMutex
}

// Cancel cancels the scan task.
func (t *ScanTask) Cancel() {
	t.mu.Lock()
	defer t.mu.Unlock()
	if t.cancel != nil {
		t.cancel()
	}
	t.Status = ScanStatusCanceled
	now := time.Now()
	t.EndTime = &now
}

// SetStatus safely updates the task status.
func (t *ScanTask) SetStatus(status ScanStatus) {
	t.mu.Lock()
	defer t.mu.Unlock()
	t.Status = status
	if status == ScanStatusCompleted || status == ScanStatusFailed || status == ScanStatusCanceled {
		now := time.Now()
		t.EndTime = &now
	}
}

// SetProgress safely updates the task progress.
func (t *ScanTask) SetProgress(progress, scannedIPs int) {
	t.mu.Lock()
	defer t.mu.Unlock()
	t.Progress = progress
	t.ScannedIPs = scannedIPs
}

// AddResult safely adds a discovered device to the results.
func (t *ScanTask) AddResult(device DiscoveredDevice) {
	t.mu.Lock()
	defer t.mu.Unlock()
	t.Results = append(t.Results, device)
}

// GetResults returns a copy of the current results.
func (t *ScanTask) GetResults() []DiscoveredDevice {
	t.mu.RLock()
	defer t.mu.RUnlock()
	results := make([]DiscoveredDevice, len(t.Results))
	copy(results, t.Results)
	return results
}

// GetStatus returns the current status.
func (t *ScanTask) GetStatus() ScanStatus {
	t.mu.RLock()
	defer t.mu.RUnlock()
	return t.Status
}

// GetProgress returns the current progress and scanned IPs.
func (t *ScanTask) GetProgress() (progress, scannedIPs int) {
	t.mu.RLock()
	defer t.mu.RUnlock()
	return t.Progress, t.ScannedIPs
}

// ScanProgressEvent is emitted during scan execution for real-time updates.
type ScanProgressEvent struct {
	TaskID       string     `json:"taskId"`
	Progress     int        `json:"progress"`
	DevicesFound int        `json:"devicesFound"`
	CurrentIP    string     `json:"currentIP,omitempty"`
	Status       ScanStatus `json:"status"`
	Timestamp    time.Time  `json:"timestamp"`
}

// ScannerConfig holds configuration options for the scanner service.
//
//nolint:revive // used across packages
type ScannerConfig struct {
	// MaxWorkersPerSubnet24 is the number of concurrent workers for /24 scans.
	MaxWorkersPerSubnet24 int
	// MaxWorkersPerSubnet16 is the number of concurrent workers for /16 scans.
	MaxWorkersPerSubnet16 int
	// HTTPTimeout is the timeout for HTTP requests to devices.
	HTTPTimeout time.Duration
	// TaskRetentionDuration is how long completed tasks are kept in memory.
	TaskRetentionDuration time.Duration
	// MaxConcurrentScans is the maximum number of concurrent scans allowed.
	MaxConcurrentScans int
}

// DefaultConfig returns the default scanner configuration.
func DefaultConfig() ScannerConfig {
	return ScannerConfig{
		MaxWorkersPerSubnet24: 20,
		MaxWorkersPerSubnet16: 50,
		HTTPTimeout:           2 * time.Second,
		TaskRetentionDuration: 1 * time.Hour,
		MaxConcurrentScans:    5,
	}
}
