// Package scanner provides network scanning functionality for discovering MikroTik routers.
// It implements the service layer for NAS-3.4: Router Auto Scanner.
package scanner

import (
	"context"
	"fmt"
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
	Version      string `json:"version,omitempty"      validate:"omitempty,max=50"`
	BoardName    string `json:"boardName,omitempty"    validate:"omitempty,max=100"`
	Architecture string `json:"architecture,omitempty" validate:"omitempty,max=50"`
	Platform     string `json:"platform,omitempty"     validate:"omitempty,max=50"`
	Confidence   int    `json:"confidence"             validate:"min=0,max=100"`
	IsValid      bool   `json:"isValid"`
}

// DiscoveredDevice represents a device found during network scanning.
type DiscoveredDevice struct {
	IP           string        `json:"ip"                     validate:"required,ip"`
	Hostname     string        `json:"hostname,omitempty"     validate:"omitempty,max=255"`
	Ports        []int         `json:"ports"                  validate:"required,dive,min=1,max=65535"`
	DeviceType   string        `json:"deviceType"             validate:"required,max=50"`
	Vendor       string        `json:"vendor,omitempty"       validate:"omitempty,max=100"`
	Services     []string      `json:"services"               validate:"required,dive,max=50"`
	RouterOSInfo *RouterOSInfo `json:"routerOSInfo,omitempty"`
	Confidence   int           `json:"confidence"             validate:"min=0,max=100"`
}

// ScanTask represents an ongoing or completed network scan operation.
type ScanTask struct {
	ID         string             `json:"id"                validate:"required,ulid"`
	Subnet     string             `json:"subnet"            validate:"required,cidrv4"`
	Status     ScanStatus         `json:"status"            validate:"required,oneof=PENDING RUNNING SCANNING COMPLETED CANCELED FAILED"`
	Progress   int                `json:"progress"          validate:"min=0,max=100"`
	Results    []DiscoveredDevice `json:"results"           validate:"required"`
	StartTime  time.Time          `json:"startTime"         validate:"required"`
	EndTime    *time.Time         `json:"endTime,omitempty"`
	Error      string             `json:"error,omitempty"   validate:"omitempty,max=500"`
	TotalIPs   int                `json:"totalIPs"          validate:"required,min=1"`
	ScannedIPs int                `json:"scannedIPs"        validate:"min=0"`

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
	TaskID       string     `json:"taskId"              validate:"required,ulid"`
	Progress     int        `json:"progress"            validate:"min=0,max=100"`
	DevicesFound int        `json:"devicesFound"        validate:"min=0"`
	CurrentIP    string     `json:"currentIP,omitempty" validate:"omitempty,ip"`
	Status       ScanStatus `json:"status"              validate:"required,oneof=PENDING RUNNING SCANNING COMPLETED CANCELED FAILED"`
	Timestamp    time.Time  `json:"timestamp"           validate:"required"`
}

// ScannerConfig holds configuration options for the scanner service.
//
//nolint:revive // used across packages
type ScannerConfig struct {
	// MaxWorkersPerSubnet24 is the number of concurrent workers for /24 scans.
	MaxWorkersPerSubnet24 int `validate:"min=1,max=256"`
	// MaxWorkersPerSubnet16 is the number of concurrent workers for /16 scans.
	MaxWorkersPerSubnet16 int `validate:"min=1,max=512"`
	// HTTPTimeout is the timeout for HTTP requests to devices.
	HTTPTimeout time.Duration `validate:"required,min=1s,max=30s"`
	// TaskRetentionDuration is how long completed tasks are kept in memory.
	TaskRetentionDuration time.Duration `validate:"required,min=5m,max=24h"`
	// MaxConcurrentScans is the maximum number of concurrent scans allowed.
	MaxConcurrentScans int `validate:"min=1,max=100"`
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

// Validate checks if the scanner configuration is valid.
func (c ScannerConfig) Validate() error {
	if c.MaxWorkersPerSubnet24 <= 0 {
		return fmt.Errorf("MaxWorkersPerSubnet24 must be > 0")
	}
	if c.MaxWorkersPerSubnet16 <= 0 {
		return fmt.Errorf("MaxWorkersPerSubnet16 must be > 0")
	}
	if c.HTTPTimeout <= 0 {
		return fmt.Errorf("HTTPTimeout must be > 0")
	}
	if c.TaskRetentionDuration <= 0 {
		return fmt.Errorf("TaskRetentionDuration must be > 0")
	}
	if c.MaxConcurrentScans <= 0 {
		return fmt.Errorf("MaxConcurrentScans must be > 0")
	}
	if c.MaxWorkersPerSubnet24 > 100 {
		return fmt.Errorf("MaxWorkersPerSubnet24 exceeds safe limit (100)")
	}
	if c.MaxWorkersPerSubnet16 > 200 {
		return fmt.Errorf("MaxWorkersPerSubnet16 exceeds safe limit (200)")
	}
	if c.MaxConcurrentScans > 20 {
		return fmt.Errorf("MaxConcurrentScans exceeds safe limit (20)")
	}
	return nil
}
