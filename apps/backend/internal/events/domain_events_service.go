package events

import (
	"encoding/json"
	"time"
)

// AlertSeverity represents the severity level for service alerts
type AlertSeverity string

const (
	SeverityCritical AlertSeverity = "CRITICAL"
	SeverityWarning  AlertSeverity = "WARNING"
	SeverityInfo     AlertSeverity = "INFO"
)

// =============================================================================
// Service State Events
// =============================================================================

// ServiceStateChangedEvent is emitted when a service instance transitions between states.
type ServiceStateChangedEvent struct {
	BaseEvent
	InstanceID   string `json:"instanceId"`
	ServiceType  string `json:"serviceType"`
	ServiceName  string `json:"serviceName"`
	FromStatus   string `json:"fromStatus"`
	ToStatus     string `json:"toStatus"`
	Reason       string `json:"reason,omitempty"`
	ErrorMessage string `json:"errorMessage,omitempty"`
}

func (e *ServiceStateChangedEvent) Payload() ([]byte, error) { return json.Marshal(e) }

func NewServiceStateChangedEvent(instanceID, serviceType, serviceName, fromStatus, toStatus, reason, errorMessage, source string) *ServiceStateChangedEvent {
	priority := PriorityNormal
	if toStatus == "failed" || toStatus == "crashed" {
		priority = PriorityImmediate
	} else if toStatus == "running" || toStatus == "stopped" {
		priority = PriorityCritical
	}
	return &ServiceStateChangedEvent{
		BaseEvent: NewBaseEvent(EventTypeServiceStateChanged, priority, source), InstanceID: instanceID,
		ServiceType: serviceType, ServiceName: serviceName, FromStatus: fromStatus,
		ToStatus: toStatus, Reason: reason, ErrorMessage: errorMessage,
	}
}

// ServiceRestartedEvent is emitted when a service instance is restarted.
type ServiceRestartedEvent struct {
	BaseEvent
	InstanceID   string `json:"instanceId"`
	ServiceType  string `json:"serviceType"`
	ServiceName  string `json:"serviceName"`
	RestartCount int    `json:"restartCount"`
	Reason       string `json:"reason,omitempty"`
}

func (e *ServiceRestartedEvent) Payload() ([]byte, error) { return json.Marshal(e) }

func NewServiceRestartedEvent(instanceID, serviceType, serviceName, reason string, restartCount int, source string) *ServiceRestartedEvent {
	priority := PriorityNormal
	if restartCount >= 3 {
		priority = PriorityCritical
	}
	return &ServiceRestartedEvent{
		BaseEvent: NewBaseEvent(EventTypeServiceRestarted, priority, source), InstanceID: instanceID,
		ServiceType: serviceType, ServiceName: serviceName, RestartCount: restartCount, Reason: reason,
	}
}

// ServiceHealthEvent is emitted when a service health check succeeds.
type ServiceHealthEvent struct {
	BaseEvent
	InstanceID  string  `json:"instanceId"`
	ServiceType string  `json:"serviceType"`
	ServiceName string  `json:"serviceName"`
	Healthy     bool    `json:"healthy"`
	Uptime      int64   `json:"uptime"`
	CPUPercent  float64 `json:"cpuPercent,omitempty"`
	MemoryMB    int64   `json:"memoryMb,omitempty"`
}

func (e *ServiceHealthEvent) Payload() ([]byte, error) { return json.Marshal(e) }

func NewServiceHealthEvent(instanceID, serviceType, serviceName string, healthy bool, uptime int64, cpuPercent float64, memoryMB int64, source string) *ServiceHealthEvent {
	return &ServiceHealthEvent{
		BaseEvent: NewBaseEvent(EventTypeServiceHealth, PriorityBackground, source), InstanceID: instanceID,
		ServiceType: serviceType, ServiceName: serviceName, Healthy: healthy,
		Uptime: uptime, CPUPercent: cpuPercent, MemoryMB: memoryMB,
	}
}

// ServiceUpdateAvailableEvent is emitted when a newer version of a service is available.
type ServiceUpdateAvailableEvent struct {
	BaseEvent
	ServiceType    string `json:"serviceType"`
	ServiceName    string `json:"serviceName"`
	CurrentVersion string `json:"currentVersion"`
	LatestVersion  string `json:"latestVersion"`
	ReleaseNotes   string `json:"releaseNotes,omitempty"`
	UpdateURL      string `json:"updateUrl,omitempty"`
}

func (e *ServiceUpdateAvailableEvent) Payload() ([]byte, error) { return json.Marshal(e) }

func NewServiceUpdateAvailableEvent(serviceType, serviceName, currentVersion, latestVersion, releaseNotes, updateURL, source string) *ServiceUpdateAvailableEvent {
	return &ServiceUpdateAvailableEvent{
		BaseEvent: NewBaseEvent(EventTypeServiceUpdateAvailable, PriorityLow, source), ServiceType: serviceType,
		ServiceName: serviceName, CurrentVersion: currentVersion, LatestVersion: latestVersion,
		ReleaseNotes: releaseNotes, UpdateURL: updateURL,
	}
}

// ServiceKillSwitchEvent is emitted when a service is emergency-stopped.
type ServiceKillSwitchEvent struct {
	BaseEvent
	InstanceID  string `json:"instanceId"`
	ServiceType string `json:"serviceType"`
	ServiceName string `json:"serviceName"`
	Reason      string `json:"reason"`
	TriggerType string `json:"triggerType"`
}

func (e *ServiceKillSwitchEvent) Payload() ([]byte, error) { return json.Marshal(e) }

func NewServiceKillSwitchEvent(instanceID, serviceType, serviceName, reason, triggerType, source string) *ServiceKillSwitchEvent {
	return &ServiceKillSwitchEvent{
		BaseEvent: NewBaseEvent(EventTypeServiceKillSwitch, PriorityImmediate, source), InstanceID: instanceID,
		ServiceType: serviceType, ServiceName: serviceName, Reason: reason, TriggerType: triggerType,
	}
}

// =============================================================================
// Service Lifecycle Events
// =============================================================================

// ServiceCrashedEvent is emitted when a service instance crashes unexpectedly.
type ServiceCrashedEvent struct {
	BaseEvent
	InstanceID   string `json:"instanceId"`
	ServiceType  string `json:"serviceType"`
	ServiceName  string `json:"serviceName"`
	ExitCode     int    `json:"exitCode"`
	CrashCount   int    `json:"crashCount"`
	LastError    string `json:"lastError"`
	WillRestart  bool   `json:"willRestart"`
	BackoffDelay int    `json:"backoffDelay"`
}

func (e *ServiceCrashedEvent) Payload() ([]byte, error) { return json.Marshal(e) }

func NewServiceCrashedEvent(instanceID, serviceType, serviceName, lastError string, exitCode, crashCount, backoffDelay int, willRestart bool, source string) *ServiceCrashedEvent {
	return &ServiceCrashedEvent{
		BaseEvent: NewBaseEvent(EventTypeServiceCrashed, PriorityImmediate, source), InstanceID: instanceID,
		ServiceType: serviceType, ServiceName: serviceName, ExitCode: exitCode, CrashCount: crashCount,
		LastError: lastError, WillRestart: willRestart, BackoffDelay: backoffDelay,
	}
}

// ServiceInstalledEvent is emitted when a new service instance is successfully installed.
type ServiceInstalledEvent struct {
	BaseEvent
	InstanceID  string `json:"instanceId"`
	ServiceType string `json:"serviceType"`
	ServiceName string `json:"serviceName"`
	Version     string `json:"version"`
	BinaryPath  string `json:"binaryPath"`
	Verified    bool   `json:"verified"`
}

func (e *ServiceInstalledEvent) Payload() ([]byte, error) { return json.Marshal(e) }

func NewServiceInstalledEvent(instanceID, serviceType, serviceName, version, binaryPath string, verified bool, source string) *ServiceInstalledEvent {
	return &ServiceInstalledEvent{
		BaseEvent: NewBaseEvent(EventTypeServiceInstalled, PriorityCritical, source), InstanceID: instanceID,
		ServiceType: serviceType, ServiceName: serviceName, Version: version, BinaryPath: binaryPath, Verified: verified,
	}
}

// ServiceRemovedEvent is emitted when a service instance is uninstalled/removed.
type ServiceRemovedEvent struct {
	BaseEvent
	InstanceID  string `json:"instanceId"`
	ServiceType string `json:"serviceType"`
	ServiceName string `json:"serviceName"`
	Reason      string `json:"reason,omitempty"`
}

func (e *ServiceRemovedEvent) Payload() ([]byte, error) { return json.Marshal(e) }

func NewServiceRemovedEvent(instanceID, serviceType, serviceName, reason, source string) *ServiceRemovedEvent {
	return &ServiceRemovedEvent{
		BaseEvent: NewBaseEvent(EventTypeServiceRemoved, PriorityCritical, source), InstanceID: instanceID,
		ServiceType: serviceType, ServiceName: serviceName, Reason: reason,
	}
}

// ServiceResourceWarningEvent is emitted when a service approaches resource limits.
type ServiceResourceWarningEvent struct {
	BaseEvent
	InstanceID       string  `json:"instanceId"`
	ServiceType      string  `json:"serviceType"`
	ServiceName      string  `json:"serviceName"`
	ResourceType     string  `json:"resourceType"`
	CurrentValue     int64   `json:"currentValue"`
	LimitValue       int64   `json:"limitValue"`
	PercentUsed      float64 `json:"percentUsed"`
	ThresholdCrossed string  `json:"thresholdCrossed"`
}

func (e *ServiceResourceWarningEvent) Payload() ([]byte, error) { return json.Marshal(e) }

func NewServiceResourceWarningEvent(instanceID, serviceType, serviceName, resourceType, thresholdCrossed string, currentValue, limitValue int64, percentUsed float64, source string) *ServiceResourceWarningEvent {
	priority := PriorityNormal
	if percentUsed >= 95.0 {
		priority = PriorityCritical
	} else if percentUsed < 90.0 {
		priority = PriorityLow
	}
	return &ServiceResourceWarningEvent{
		BaseEvent: NewBaseEvent(EventTypeServiceResourceWarning, priority, source), InstanceID: instanceID,
		ServiceType: serviceType, ServiceName: serviceName, ResourceType: resourceType,
		CurrentValue: currentValue, LimitValue: limitValue, PercentUsed: percentUsed, ThresholdCrossed: thresholdCrossed,
	}
}

// ServiceHealthFailingEvent is emitted when health checks repeatedly fail.
type ServiceHealthFailingEvent struct {
	BaseEvent
	InstanceID           string        `json:"instanceId"`
	ServiceType          string        `json:"serviceType"`
	ServiceName          string        `json:"serviceName"`
	ConsecutiveFailures  int           `json:"consecutiveFailures"`
	LastHealthCheckError string        `json:"lastHealthCheckError"`
	FailureDuration      time.Duration `json:"failureDuration"`
}

func (e *ServiceHealthFailingEvent) Payload() ([]byte, error) { return json.Marshal(e) }

func NewServiceHealthFailingEvent(instanceID, serviceType, serviceName, lastHealthCheckError string, consecutiveFailures int, failureDuration time.Duration, source string) *ServiceHealthFailingEvent {
	priority := PriorityNormal
	if consecutiveFailures >= 5 {
		priority = PriorityCritical
	}
	return &ServiceHealthFailingEvent{
		BaseEvent: NewBaseEvent(EventTypeServiceHealthFailing, priority, source), InstanceID: instanceID,
		ServiceType: serviceType, ServiceName: serviceName, ConsecutiveFailures: consecutiveFailures,
		LastHealthCheckError: lastHealthCheckError, FailureDuration: failureDuration,
	}
}

// =============================================================================
// Service Severity Helpers
// =============================================================================

// GetServiceEventSeverity returns the alert severity for a given service event type.
func GetServiceEventSeverity(eventType string) AlertSeverity {
	switch eventType {
	case EventTypeServiceCrashed, EventTypeServiceKillSwitch, EventTypeServiceStateChanged:
		return SeverityCritical
	case EventTypeServiceHealthFailing, EventTypeServiceResourceWarning, EventTypeServiceRestarted:
		return SeverityWarning
	default:
		return SeverityInfo
	}
}

// GetServiceEventSeverityDynamic returns alert severity with dynamic context evaluation.
func GetServiceEventSeverityDynamic(event Event) AlertSeverity {
	eventType := event.GetType()
	switch eventType {
	case EventTypeServiceStateChanged:
		if sce, ok := event.(*ServiceStateChangedEvent); ok {
			if sce.ToStatus == "failed" || sce.ToStatus == "crashed" {
				return SeverityCritical
			}
			return SeverityInfo
		}
	case EventTypeServiceRestarted:
		if sre, ok := event.(*ServiceRestartedEvent); ok {
			if sre.RestartCount >= 3 {
				return SeverityCritical
			}
			return SeverityWarning
		}
	case EventTypeServiceResourceWarning:
		if srw, ok := event.(*ServiceResourceWarningEvent); ok {
			if srw.PercentUsed >= 95.0 {
				return SeverityCritical
			}
			return SeverityWarning
		}
	case EventTypeServiceHealthFailing:
		if shf, ok := event.(*ServiceHealthFailingEvent); ok {
			if shf.ConsecutiveFailures >= 5 {
				return SeverityCritical
			}
			return SeverityWarning
		}
	}
	return GetServiceEventSeverity(eventType)
}

// =============================================================================
// Storage Events
// =============================================================================

// StorageMountedEvent is emitted when an external storage device is mounted.
type StorageMountedEvent struct {
	BaseEvent
	Path    string  `json:"path"`
	TotalMB uint64  `json:"totalMb"`
	FreeMB  uint64  `json:"freeMb"`
	UsedMB  uint64  `json:"usedMb"`
	UsedPct float64 `json:"usedPct"`
	FSType  string  `json:"fsType"`
}

func (e *StorageMountedEvent) Payload() ([]byte, error) { return json.Marshal(e) }

func NewStorageMountedEvent(path string, totalMB, freeMB, usedMB uint64, usedPct float64, fsType, source string) *StorageMountedEvent {
	return &StorageMountedEvent{
		BaseEvent: NewBaseEvent(EventTypeStorageMounted, PriorityNormal, source),
		Path: path, TotalMB: totalMB, FreeMB: freeMB, UsedMB: usedMB, UsedPct: usedPct, FSType: fsType,
	}
}

// StorageUnmountedEvent is emitted when an external storage device is unmounted.
type StorageUnmountedEvent struct {
	BaseEvent
	Path string `json:"path"`
}

func (e *StorageUnmountedEvent) Payload() ([]byte, error) { return json.Marshal(e) }

func NewStorageUnmountedEvent(path, source string) *StorageUnmountedEvent {
	return &StorageUnmountedEvent{BaseEvent: NewBaseEvent(EventTypeStorageUnmounted, PriorityCritical, source), Path: path}
}

// StorageSpaceThresholdEvent is emitted when storage usage crosses a threshold.
type StorageSpaceThresholdEvent struct {
	BaseEvent
	Path    string  `json:"path"`
	TotalMB uint64  `json:"totalMb"`
	FreeMB  uint64  `json:"freeMb"`
	UsedMB  uint64  `json:"usedMb"`
	UsedPct float64 `json:"usedPct"`
	Level   string  `json:"level"`
}

func (e *StorageSpaceThresholdEvent) Payload() ([]byte, error) { return json.Marshal(e) }

func NewStorageSpaceThresholdEvent(path string, totalMB, freeMB, usedMB uint64, usedPct float64, level, source string) *StorageSpaceThresholdEvent {
	priority := PriorityNormal
	if level == "critical" || level == "full" {
		priority = PriorityCritical
	}
	return &StorageSpaceThresholdEvent{
		BaseEvent: NewBaseEvent(EventTypeStorageSpaceThreshold, priority, source),
		Path: path, TotalMB: totalMB, FreeMB: freeMB, UsedMB: usedMB, UsedPct: usedPct, Level: level,
	}
}

// StorageConfigChangedEvent is emitted when storage configuration is updated.
type StorageConfigChangedEvent struct {
	BaseEvent
	FeatureID     string `json:"featureId"`
	InstanceID    string `json:"instanceId"`
	PreviousPath  string `json:"previousPath,omitempty"`
	NewPath       string `json:"newPath"`
	ConfigVersion int    `json:"configVersion"`
}

func (e *StorageConfigChangedEvent) Payload() ([]byte, error) { return json.Marshal(e) }

func NewStorageConfigChangedEvent(featureID, instanceID, previousPath, newPath string, configVersion int, source string) *StorageConfigChangedEvent {
	return &StorageConfigChangedEvent{
		BaseEvent: NewBaseEvent(EventTypeStorageConfigChanged, PriorityNormal, source),
		FeatureID: featureID, InstanceID: instanceID, PreviousPath: previousPath, NewPath: newPath, ConfigVersion: configVersion,
	}
}

// StorageUnavailableEvent is emitted when a feature's storage becomes unavailable.
type StorageUnavailableEvent struct {
	BaseEvent
	FeatureID  string `json:"featureId"`
	InstanceID string `json:"instanceId"`
	Path       string `json:"path"`
	Reason     string `json:"reason"`
}

func (e *StorageUnavailableEvent) Payload() ([]byte, error) { return json.Marshal(e) }

func NewStorageUnavailableEvent(featureID, instanceID, path, reason, source string) *StorageUnavailableEvent {
	return &StorageUnavailableEvent{
		BaseEvent: NewBaseEvent(EventTypeStorageUnavailable, PriorityImmediate, source),
		FeatureID: featureID, InstanceID: instanceID, Path: path, Reason: reason,
	}
}
