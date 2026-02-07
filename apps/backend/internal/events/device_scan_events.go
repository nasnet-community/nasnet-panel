package events

import (
	"encoding/json"
	"time"
)

// =============================================================================
// Device Scan Events
// =============================================================================
// Events for ARP device scanning with real-time progress streaming.
// Supports GraphQL subscriptions for live updates during scan execution.

// ScanStatus represents the current state of a device scan.
type ScanStatus string

const (
	ScanStatusPending   ScanStatus = "PENDING"
	ScanStatusScanning  ScanStatus = "SCANNING"
	ScanStatusCompleted ScanStatus = "COMPLETED"
	ScanStatusCancelled ScanStatus = "CANCELLED"
	ScanStatusFailed    ScanStatus = "FAILED"
)

// DiscoveredDevice represents a device found during the scan.
type DiscoveredDevice struct {
	IP           string    `json:"ip"`
	MAC          string    `json:"mac"`
	Hostname     string    `json:"hostname,omitempty"`
	Interface    string    `json:"interface"`
	ResponseTime int       `json:"responseTime"` // milliseconds
	FirstSeen    time.Time `json:"firstSeen"`
}

// DHCPLeaseInfo contains DHCP lease information for discovered devices.
type DHCPLeaseInfo struct {
	Expires string `json:"expires"`
	Server  string `json:"server"`
	Status  string `json:"status"`
}

// -----------------------------------------------------------------------------
// DeviceScanStartedEvent
// -----------------------------------------------------------------------------

// DeviceScanStartedEvent is emitted when a device scan begins.
type DeviceScanStartedEvent struct {
	BaseEvent
	ScanID   string `json:"scanId"`
	RouterID string `json:"routerId"`
	Subnet   string `json:"subnet"`
}

// Payload returns the JSON-serialized event payload.
func (e *DeviceScanStartedEvent) Payload() ([]byte, error) {
	return json.Marshal(e)
}

// NewDeviceScanStartedEvent creates a new DeviceScanStartedEvent.
func NewDeviceScanStartedEvent(scanID, routerID, subnet, source string) *DeviceScanStartedEvent {
	return &DeviceScanStartedEvent{
		BaseEvent: NewBaseEvent(EventTypeDeviceScanStarted, PriorityNormal, source),
		ScanID:    scanID,
		RouterID:  routerID,
		Subnet:    subnet,
	}
}

// -----------------------------------------------------------------------------
// DeviceScanProgressEvent
// -----------------------------------------------------------------------------

// DeviceScanProgressEvent is emitted periodically during scan execution.
// This is a high-volume event used for real-time subscription updates.
type DeviceScanProgressEvent struct {
	BaseEvent
	ScanID       string             `json:"scanId"`
	RouterID     string             `json:"routerId"`
	Status       ScanStatus         `json:"status"`
	Progress     int                `json:"progress"` // 0-100
	ScannedCount int                `json:"scannedCount"`
	TotalCount   int                `json:"totalCount"`
	Devices      []DiscoveredDevice `json:"devices"`
	ElapsedTime  int                `json:"elapsedTime"` // milliseconds
}

// Payload returns the JSON-serialized event payload.
func (e *DeviceScanProgressEvent) Payload() ([]byte, error) {
	return json.Marshal(e)
}

// NewDeviceScanProgressEvent creates a new DeviceScanProgressEvent.
func NewDeviceScanProgressEvent(
	scanID string,
	routerID string,
	status ScanStatus,
	progress int,
	scannedCount int,
	totalCount int,
	devices []DiscoveredDevice,
	elapsedTime int,
	source string,
) *DeviceScanProgressEvent {
	return &DeviceScanProgressEvent{
		BaseEvent:    NewBaseEvent(EventTypeDeviceScanProgress, PriorityBackground, source),
		ScanID:       scanID,
		RouterID:     routerID,
		Status:       status,
		Progress:     progress,
		ScannedCount: scannedCount,
		TotalCount:   totalCount,
		Devices:      devices,
		ElapsedTime:  elapsedTime,
	}
}

// -----------------------------------------------------------------------------
// DeviceScanCompletedEvent
// -----------------------------------------------------------------------------

// DeviceScanCompletedEvent is emitted when a scan finishes successfully.
type DeviceScanCompletedEvent struct {
	BaseEvent
	ScanID       string             `json:"scanId"`
	RouterID     string             `json:"routerId"`
	DevicesFound int                `json:"devicesFound"`
	Duration     int                `json:"duration"` // milliseconds
	Devices      []DiscoveredDevice `json:"devices"`
}

// Payload returns the JSON-serialized event payload.
func (e *DeviceScanCompletedEvent) Payload() ([]byte, error) {
	return json.Marshal(e)
}

// NewDeviceScanCompletedEvent creates a new DeviceScanCompletedEvent.
func NewDeviceScanCompletedEvent(
	scanID string,
	routerID string,
	devicesFound int,
	duration int,
	devices []DiscoveredDevice,
	source string,
) *DeviceScanCompletedEvent {
	return &DeviceScanCompletedEvent{
		BaseEvent:    NewBaseEvent(EventTypeDeviceScanCompleted, PriorityNormal, source),
		ScanID:       scanID,
		RouterID:     routerID,
		DevicesFound: devicesFound,
		Duration:     duration,
		Devices:      devices,
	}
}

// -----------------------------------------------------------------------------
// DeviceScanFailedEvent
// -----------------------------------------------------------------------------

// DeviceScanFailedEvent is emitted when a scan fails due to an error.
type DeviceScanFailedEvent struct {
	BaseEvent
	ScanID   string `json:"scanId"`
	RouterID string `json:"routerId"`
	Error    string `json:"error"`
}

// Payload returns the JSON-serialized event payload.
func (e *DeviceScanFailedEvent) Payload() ([]byte, error) {
	return json.Marshal(e)
}

// NewDeviceScanFailedEvent creates a new DeviceScanFailedEvent.
func NewDeviceScanFailedEvent(scanID, routerID, errorMsg, source string) *DeviceScanFailedEvent {
	return &DeviceScanFailedEvent{
		BaseEvent: NewBaseEvent(EventTypeDeviceScanFailed, PriorityNormal, source),
		ScanID:    scanID,
		RouterID:  routerID,
		Error:     errorMsg,
	}
}

// -----------------------------------------------------------------------------
// DeviceScanCancelledEvent
// -----------------------------------------------------------------------------

// DeviceScanCancelledEvent is emitted when a user cancels an ongoing scan.
type DeviceScanCancelledEvent struct {
	BaseEvent
	ScanID   string `json:"scanId"`
	RouterID string `json:"routerId"`
}

// Payload returns the JSON-serialized event payload.
func (e *DeviceScanCancelledEvent) Payload() ([]byte, error) {
	return json.Marshal(e)
}

// NewDeviceScanCancelledEvent creates a new DeviceScanCancelledEvent.
func NewDeviceScanCancelledEvent(scanID, routerID, source string) *DeviceScanCancelledEvent {
	return &DeviceScanCancelledEvent{
		BaseEvent: NewBaseEvent(EventTypeDeviceScanCancelled, PriorityNormal, source),
		ScanID:    scanID,
		RouterID:  routerID,
	}
}
