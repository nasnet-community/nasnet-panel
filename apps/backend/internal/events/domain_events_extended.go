package events

import (
	"encoding/json"
	"time"

	"github.com/oklog/ulid/v2"
)

// =============================================================================
// Device Scan Events
// =============================================================================

// ScanStatus represents the current state of a device scan.
type ScanStatus string

const (
	ScanStatusPending   ScanStatus = "PENDING"
	ScanStatusScanning  ScanStatus = "SCANNING"
	ScanStatusCompleted ScanStatus = "COMPLETED"
	ScanStatusCanceled  ScanStatus = "CANCELED"
	ScanStatusFailed    ScanStatus = "FAILED"
)

// DiscoveredDevice represents a device found during the scan.
type DiscoveredDevice struct {
	IP           string    `json:"ip"`
	MAC          string    `json:"mac"`
	Hostname     string    `json:"hostname,omitempty"`
	Interface    string    `json:"interface"`
	ResponseTime int       `json:"responseTime"`
	FirstSeen    time.Time `json:"firstSeen"`
}

// DHCPLeaseInfo contains DHCP lease information for discovered devices.
type DHCPLeaseInfo struct {
	Expires string `json:"expires"`
	Server  string `json:"server"`
	Status  string `json:"status"`
}

// DeviceScanStartedEvent is emitted when a device scan begins.
type DeviceScanStartedEvent struct {
	BaseEvent
	ScanID   string `json:"scanId"`
	RouterID string `json:"routerId"`
	Subnet   string `json:"subnet"`
}

func (e *DeviceScanStartedEvent) Payload() ([]byte, error) { return json.Marshal(e) }

func NewDeviceScanStartedEvent(scanID, routerID, subnet, source string) *DeviceScanStartedEvent {
	return &DeviceScanStartedEvent{
		BaseEvent: NewBaseEvent(EventTypeDeviceScanStarted, PriorityNormal, source),
		ScanID:    scanID,
		RouterID:  routerID,
		Subnet:    subnet,
	}
}

// DeviceScanProgressEvent is emitted periodically during scan execution.
type DeviceScanProgressEvent struct {
	BaseEvent
	ScanID       string             `json:"scanId"`
	RouterID     string             `json:"routerId"`
	Status       ScanStatus         `json:"status"`
	Progress     int                `json:"progress"`
	ScannedCount int                `json:"scannedCount"`
	TotalCount   int                `json:"totalCount"`
	Devices      []DiscoveredDevice `json:"devices"`
	ElapsedTime  int                `json:"elapsedTime"`
}

func (e *DeviceScanProgressEvent) Payload() ([]byte, error) { return json.Marshal(e) }

func NewDeviceScanProgressEvent(scanID, routerID string, status ScanStatus, progress, scannedCount, totalCount int, devices []DiscoveredDevice, elapsedTime int, source string) *DeviceScanProgressEvent {
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

// DeviceScanCompletedEvent is emitted when a scan finishes successfully.
type DeviceScanCompletedEvent struct {
	BaseEvent
	ScanID       string             `json:"scanId"`
	RouterID     string             `json:"routerId"`
	DevicesFound int                `json:"devicesFound"`
	Duration     int                `json:"duration"`
	Devices      []DiscoveredDevice `json:"devices"`
}

func (e *DeviceScanCompletedEvent) Payload() ([]byte, error) { return json.Marshal(e) }

func NewDeviceScanCompletedEvent(scanID, routerID string, devicesFound, duration int, devices []DiscoveredDevice, source string) *DeviceScanCompletedEvent {
	return &DeviceScanCompletedEvent{
		BaseEvent:    NewBaseEvent(EventTypeDeviceScanCompleted, PriorityNormal, source),
		ScanID:       scanID,
		RouterID:     routerID,
		DevicesFound: devicesFound,
		Duration:     duration,
		Devices:      devices,
	}
}

// DeviceScanFailedEvent is emitted when a scan fails due to an error.
type DeviceScanFailedEvent struct {
	BaseEvent
	ScanID   string `json:"scanId"`
	RouterID string `json:"routerId"`
	Error    string `json:"error"`
}

func (e *DeviceScanFailedEvent) Payload() ([]byte, error) { return json.Marshal(e) }

func NewDeviceScanFailedEvent(scanID, routerID, errorMsg, source string) *DeviceScanFailedEvent {
	return &DeviceScanFailedEvent{
		BaseEvent: NewBaseEvent(EventTypeDeviceScanFailed, PriorityNormal, source),
		ScanID:    scanID,
		RouterID:  routerID,
		Error:     errorMsg,
	}
}

// DeviceScanCancelledEvent is emitted when a user cancels an ongoing scan.
type DeviceScanCancelledEvent struct {
	BaseEvent
	ScanID   string `json:"scanId"`
	RouterID string `json:"routerId"`
}

func (e *DeviceScanCancelledEvent) Payload() ([]byte, error) { return json.Marshal(e) }

func NewDeviceScanCancelledEvent(scanID, routerID, source string) *DeviceScanCancelledEvent {
	return &DeviceScanCancelledEvent{
		BaseEvent: NewBaseEvent(EventTypeDeviceScanCancelled, PriorityNormal, source),
		ScanID:    scanID, RouterID: routerID,
	}
}

// =============================================================================
// WAN Events
// =============================================================================

// WAN event type constants
const (
	EventTypeWANStatusChanged    = "wan.status.changed"
	EventTypeWANHealthChanged    = "wan.health.changed"
	EventTypeWANIPChanged        = "wan.ip.changed"
	EventTypeWANConfigured       = "wan.configured"
	EventTypeWANDeleted          = "wan.deleted"
	EventTypeWANConnectionFailed = "wan.connection.failed"
	EventTypeWANAuthFailed       = "wan.auth.failed"
)

type WANStatusChangedEvent struct {
	BaseEvent
	RouterID       string    `json:"router_id"`
	WANInterfaceID string    `json:"wan_interface_id"`
	InterfaceName  string    `json:"interface_name"`
	Status         string    `json:"status"`
	PreviousStatus string    `json:"previous_status"`
	ConnectionType string    `json:"connection_type"`
	PublicIP       string    `json:"public_ip,omitempty"`
	Gateway        string    `json:"gateway,omitempty"`
	Reason         string    `json:"reason,omitempty"`
	ChangedAt      time.Time `json:"changed_at"`
}

func NewWANStatusChangedEvent(routerID, wanInterfaceID, interfaceName, status, previousStatus, connectionType string) *WANStatusChangedEvent {
	return &WANStatusChangedEvent{
		BaseEvent: BaseEvent{ID: ulid.Make(), Type: EventTypeWANStatusChanged, Priority: PriorityNormal, Timestamp: time.Now(), Source: "wan-service", Metadata: EventMetadata{CorrelationID: ulid.Make().String()}},
		RouterID:  routerID, WANInterfaceID: wanInterfaceID, InterfaceName: interfaceName,
		Status: status, PreviousStatus: previousStatus, ConnectionType: connectionType, ChangedAt: time.Now(),
	}
}

func (e *WANStatusChangedEvent) GetType() string { return EventTypeWANStatusChanged }

type WANHealthChangedEvent struct {
	BaseEvent
	RouterID             string    `json:"router_id"`
	WANInterfaceID       string    `json:"wan_interface_id"`
	InterfaceName        string    `json:"interface_name"`
	HealthStatus         string    `json:"health_status"`
	PreviousHealthStatus string    `json:"previous_health_status"`
	Target               string    `json:"target"`
	Latency              int       `json:"latency,omitempty"`
	PacketLoss           int       `json:"packet_loss"`
	ConsecutiveFailures  int       `json:"consecutive_failures"`
	ConsecutiveSuccesses int       `json:"consecutive_successes"`
	LastCheckTime        time.Time `json:"last_check_time"`
}

func NewWANHealthChangedEvent(routerID, wanInterfaceID, interfaceName, healthStatus, previousHealthStatus, target string) *WANHealthChangedEvent {
	return &WANHealthChangedEvent{
		BaseEvent: BaseEvent{ID: ulid.Make(), Type: EventTypeWANHealthChanged, Priority: PriorityNormal, Timestamp: time.Now(), Source: "wan-health-monitor", Metadata: EventMetadata{CorrelationID: ulid.Make().String()}},
		RouterID:  routerID, WANInterfaceID: wanInterfaceID, InterfaceName: interfaceName,
		HealthStatus: healthStatus, PreviousHealthStatus: previousHealthStatus, Target: target, LastCheckTime: time.Now(),
	}
}

func (e *WANHealthChangedEvent) GetType() string { return EventTypeWANHealthChanged }

type WANIPChangedEvent struct {
	BaseEvent
	RouterID       string    `json:"router_id"`
	WANInterfaceID string    `json:"wan_interface_id"`
	InterfaceName  string    `json:"interface_name"`
	ConnectionType string    `json:"connection_type"`
	OldIP          string    `json:"old_ip"`
	NewIP          string    `json:"new_ip"`
	Gateway        string    `json:"gateway,omitempty"`
	Reason         string    `json:"reason,omitempty"`
	ChangedAt      time.Time `json:"changed_at"`
}

func NewWANIPChangedEvent(routerID, wanInterfaceID, interfaceName, connectionType, oldIP, newIP string) *WANIPChangedEvent {
	return &WANIPChangedEvent{
		BaseEvent: BaseEvent{ID: ulid.Make(), Type: EventTypeWANIPChanged, Priority: PriorityNormal, Timestamp: time.Now(), Source: "wan-service", Metadata: EventMetadata{CorrelationID: ulid.Make().String()}},
		RouterID:  routerID, WANInterfaceID: wanInterfaceID, InterfaceName: interfaceName,
		ConnectionType: connectionType, OldIP: oldIP, NewIP: newIP, ChangedAt: time.Now(),
	}
}

func (e *WANIPChangedEvent) GetType() string { return EventTypeWANIPChanged }

type WANConfiguredEvent struct {
	BaseEvent
	RouterID       string    `json:"router_id"`
	WANInterfaceID string    `json:"wan_interface_id"`
	InterfaceName  string    `json:"interface_name"`
	ConnectionType string    `json:"connection_type"`
	IsDefaultRoute bool      `json:"is_default_route"`
	ConfiguredBy   string    `json:"configured_by,omitempty"`
	ConfiguredAt   time.Time `json:"configured_at"`
}

func NewWANConfiguredEvent(routerID, wanInterfaceID, interfaceName, connectionType string, isDefaultRoute bool) *WANConfiguredEvent {
	return &WANConfiguredEvent{
		BaseEvent: BaseEvent{ID: ulid.Make(), Type: EventTypeWANConfigured, Priority: PriorityNormal, Timestamp: time.Now(), Source: "wan-service", Metadata: EventMetadata{CorrelationID: ulid.Make().String()}},
		RouterID:  routerID, WANInterfaceID: wanInterfaceID, InterfaceName: interfaceName,
		ConnectionType: connectionType, IsDefaultRoute: isDefaultRoute, ConfiguredAt: time.Now(),
	}
}

func (e *WANConfiguredEvent) GetType() string { return EventTypeWANConfigured }

type WANDeletedEvent struct {
	BaseEvent
	RouterID       string    `json:"router_id"`
	WANInterfaceID string    `json:"wan_interface_id"`
	InterfaceName  string    `json:"interface_name"`
	ConnectionType string    `json:"connection_type"`
	DeletedBy      string    `json:"deleted_by,omitempty"`
	DeletedAt      time.Time `json:"deleted_at"`
}

func NewWANDeletedEvent(routerID, wanInterfaceID, interfaceName, connectionType string) *WANDeletedEvent {
	return &WANDeletedEvent{
		BaseEvent: BaseEvent{ID: ulid.Make(), Type: EventTypeWANDeleted, Priority: PriorityNormal, Timestamp: time.Now(), Source: "wan-service", Metadata: EventMetadata{CorrelationID: ulid.Make().String()}},
		RouterID:  routerID, WANInterfaceID: wanInterfaceID, InterfaceName: interfaceName,
		ConnectionType: connectionType, DeletedAt: time.Now(),
	}
}

func (e *WANDeletedEvent) GetType() string { return EventTypeWANDeleted }

type WANConnectionFailedEvent struct {
	BaseEvent
	RouterID       string    `json:"router_id"`
	WANInterfaceID string    `json:"wan_interface_id"`
	InterfaceName  string    `json:"interface_name"`
	ConnectionType string    `json:"connection_type"`
	FailureReason  string    `json:"failure_reason"`
	ErrorDetails   string    `json:"error_details,omitempty"`
	AttemptNumber  int       `json:"attempt_number"`
	FailedAt       time.Time `json:"failed_at"`
}

func NewWANConnectionFailedEvent(routerID, wanInterfaceID, interfaceName, connectionType, failureReason string) *WANConnectionFailedEvent {
	return &WANConnectionFailedEvent{
		BaseEvent: BaseEvent{ID: ulid.Make(), Type: EventTypeWANConnectionFailed, Priority: PriorityCritical, Timestamp: time.Now(), Source: "wan-service", Metadata: EventMetadata{CorrelationID: ulid.Make().String()}},
		RouterID:  routerID, WANInterfaceID: wanInterfaceID, InterfaceName: interfaceName,
		ConnectionType: connectionType, FailureReason: failureReason, FailedAt: time.Now(),
	}
}

func (e *WANConnectionFailedEvent) GetType() string { return EventTypeWANConnectionFailed }

type WANAuthFailedEvent struct {
	BaseEvent
	RouterID       string    `json:"router_id"`
	WANInterfaceID string    `json:"wan_interface_id"`
	InterfaceName  string    `json:"interface_name"`
	ConnectionType string    `json:"connection_type"`
	Username       string    `json:"username"`
	FailureReason  string    `json:"failure_reason"`
	AttemptNumber  int       `json:"attempt_number"`
	FailedAt       time.Time `json:"failed_at"`
}

func NewWANAuthFailedEvent(routerID, wanInterfaceID, interfaceName, connectionType, username, failureReason string) *WANAuthFailedEvent {
	return &WANAuthFailedEvent{
		BaseEvent: BaseEvent{ID: ulid.Make(), Type: EventTypeWANAuthFailed, Priority: PriorityCritical, Timestamp: time.Now(), Source: "wan-service", Metadata: EventMetadata{CorrelationID: ulid.Make().String()}},
		RouterID:  routerID, WANInterfaceID: wanInterfaceID, InterfaceName: interfaceName,
		ConnectionType: connectionType, Username: username, FailureReason: failureReason, FailedAt: time.Now(),
	}
}

func (e *WANAuthFailedEvent) GetType() string { return EventTypeWANAuthFailed }

// =============================================================================
// Network Events (NAS-8.14: VLAN Registry)
// =============================================================================

type VLANPoolWarningEvent struct {
	BaseEvent
	RouterID          string  `json:"routerId"`
	TotalVLANs        int     `json:"totalVlans"`
	AllocatedVLANs    int     `json:"allocatedVlans"`
	AvailableVLANs    int     `json:"availableVlans"`
	Utilization       float64 `json:"utilization"`
	WarningLevel      string  `json:"warningLevel"`
	RecommendedAction string  `json:"recommendedAction"`
}

func (e *VLANPoolWarningEvent) Payload() ([]byte, error) { return json.Marshal(e) }

func NewVLANPoolWarningEvent(routerID string, totalVLANs, allocatedVLANs, availableVLANs int, utilization float64, warningLevel, recommendedAction, source string) *VLANPoolWarningEvent {
	priority := PriorityCritical
	const warningLevelCritical = "critical"
	if warningLevel == warningLevelCritical {
		priority = PriorityImmediate
	}
	return &VLANPoolWarningEvent{
		BaseEvent: NewBaseEvent(EventTypeVLANPoolWarning, priority, source),
		RouterID:  routerID, TotalVLANs: totalVLANs, AllocatedVLANs: allocatedVLANs,
		AvailableVLANs: availableVLANs, Utilization: utilization, WarningLevel: warningLevel, RecommendedAction: recommendedAction,
	}
}

// =============================================================================
// Isolation Events (NAS-8.4)
// =============================================================================

type IsolationViolationEvent struct {
	BaseEvent
	InstanceID    string   `json:"instanceId"`
	FeatureID     string   `json:"featureId"`
	RouterID      string   `json:"routerId,omitempty"`
	ViolationType string   `json:"violationType"`
	CurrentValue  string   `json:"currentValue"`
	LimitValue    string   `json:"limitValue"`
	Severity      string   `json:"severity"`
	DetectedAt    string   `json:"detectedAt"`
	WillTerminate bool     `json:"willTerminate"`
	ActionTaken   string   `json:"actionTaken"`
	AffectedPorts []string `json:"affectedPorts,omitempty"`
	AffectedVLANs []string `json:"affectedVlans,omitempty"`
	CgroupPath    string   `json:"cgroupPath,omitempty"`
	ErrorMessage  string   `json:"errorMessage,omitempty"`
}

func (e *IsolationViolationEvent) Payload() ([]byte, error) { return json.Marshal(e) }

func NewIsolationViolationEvent(instanceID, featureID, routerID, violationType, currentValue, limitValue, severity, detectedAt, actionTaken, cgroupPath, errorMessage, source string, willTerminate bool, affectedPorts, affectedVLANs []string) *IsolationViolationEvent {
	return &IsolationViolationEvent{
		BaseEvent:  NewBaseEvent(EventTypeIsolationViolation, PriorityImmediate, source),
		InstanceID: instanceID, FeatureID: featureID, RouterID: routerID, ViolationType: violationType,
		CurrentValue: currentValue, LimitValue: limitValue, Severity: severity, DetectedAt: detectedAt,
		WillTerminate: willTerminate, ActionTaken: actionTaken, AffectedPorts: affectedPorts,
		AffectedVLANs: affectedVLANs, CgroupPath: cgroupPath, ErrorMessage: errorMessage,
	}
}

type ResourceWarningEvent struct {
	BaseEvent
	InstanceID        string  `json:"instanceId"`
	FeatureID         string  `json:"featureId"`
	RouterID          string  `json:"routerId,omitempty"`
	ResourceType      string  `json:"resourceType"`
	CurrentUsage      string  `json:"currentUsage"`
	LimitValue        string  `json:"limitValue"`
	ThresholdPercent  int     `json:"thresholdPercent"`
	UsagePercent      float64 `json:"usagePercent"`
	DetectedAt        string  `json:"detectedAt"`
	RecommendedAction string  `json:"recommendedAction,omitempty"`
	CgroupPath        string  `json:"cgroupPath,omitempty"`
	TrendDirection    string  `json:"trendDirection,omitempty"`
}

func (e *ResourceWarningEvent) Payload() ([]byte, error) { return json.Marshal(e) }

func NewResourceWarningEvent(instanceID, featureID, routerID, resourceType, currentUsage, limitValue, detectedAt, recommendedAction, cgroupPath, trendDirection, source string, thresholdPercent int, usagePercent float64) *ResourceWarningEvent {
	return &ResourceWarningEvent{
		BaseEvent:  NewBaseEvent(EventTypeResourceWarning, PriorityNormal, source),
		InstanceID: instanceID, FeatureID: featureID, RouterID: routerID, ResourceType: resourceType,
		CurrentUsage: currentUsage, LimitValue: limitValue, ThresholdPercent: thresholdPercent,
		UsagePercent: usagePercent, DetectedAt: detectedAt, RecommendedAction: recommendedAction,
		CgroupPath: cgroupPath, TrendDirection: trendDirection,
	}
}

type ResourceOOMEvent struct {
	BaseEvent
	InstanceID   string  `json:"instanceId"`
	FeatureID    string  `json:"featureId"`
	RouterID     string  `json:"routerId,omitempty"`
	CurrentMB    float64 `json:"currentMb"`
	LimitMB      int     `json:"limitMb"`
	UsagePercent float64 `json:"usagePercent"`
	KilledPID    int     `json:"killedPid,omitempty"`
	CgroupPath   string  `json:"cgroupPath,omitempty"`
	DetectedAt   string  `json:"detectedAt"`
	WillRestart  bool    `json:"willRestart"`
}

func (e *ResourceOOMEvent) Payload() ([]byte, error) { return json.Marshal(e) }

func NewResourceOOMEvent(instanceID, featureID, routerID string, currentMB float64, limitMB int, usagePercent float64, killedPID int, cgroupPath, detectedAt string, willRestart bool, source string) *ResourceOOMEvent {
	return &ResourceOOMEvent{
		BaseEvent:  NewBaseEvent(EventTypeResourceOOM, PriorityImmediate, source),
		InstanceID: instanceID, FeatureID: featureID, RouterID: routerID,
		CurrentMB: currentMB, LimitMB: limitMB, UsagePercent: usagePercent,
		KilledPID: killedPID, CgroupPath: cgroupPath, DetectedAt: detectedAt, WillRestart: willRestart,
	}
}

type ResourceLimitsChangedEvent struct {
	BaseEvent
	InstanceID    string `json:"instanceId"`
	FeatureID     string `json:"featureId"`
	RouterID      string `json:"routerId,omitempty"`
	ResourceType  string `json:"resourceType"`
	PreviousLimit string `json:"previousLimit"`
	NewLimit      string `json:"newLimit"`
	ChangedBy     string `json:"changedBy,omitempty"`
	Reason        string `json:"reason,omitempty"`
}

func (e *ResourceLimitsChangedEvent) Payload() ([]byte, error) { return json.Marshal(e) }

func NewResourceLimitsChangedEvent(instanceID, featureID, routerID, resourceType, previousLimit, newLimit, changedBy, reason, source string) *ResourceLimitsChangedEvent {
	return &ResourceLimitsChangedEvent{
		BaseEvent:  NewBaseEvent(EventTypeResourceLimitsChanged, PriorityNormal, source),
		InstanceID: instanceID, FeatureID: featureID, RouterID: routerID, ResourceType: resourceType,
		PreviousLimit: previousLimit, NewLimit: newLimit, ChangedBy: changedBy, Reason: reason,
	}
}
