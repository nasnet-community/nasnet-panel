package events

import (
	"encoding/json"
	"time"
)

// =============================================================================
// Verification Events
// =============================================================================

// BinaryVerifiedEvent is emitted when a marketplace feature binary passes verification.
type BinaryVerifiedEvent struct {
	BaseEvent
	FeatureID    string `json:"featureId"`
	InstanceID   string `json:"instanceId"`
	RouterID     string `json:"routerId,omitempty"`
	Version      string `json:"version"`
	ArchiveHash  string `json:"archiveHash"`
	BinaryHash   string `json:"binaryHash"`
	GPGVerified  bool   `json:"gpgVerified"`
	GPGKeyID     string `json:"gpgKeyId,omitempty"`
	ChecksumsURL string `json:"checksumsUrl"`
	VerifiedAt   string `json:"verifiedAt"`
}

func (e *BinaryVerifiedEvent) Payload() ([]byte, error) { return json.Marshal(e) }

func NewBinaryVerifiedEvent(featureID, instanceID, routerID, version, archiveHash, binaryHash, gpgKeyID, checksumsURL, verifiedAt, source string, gpgVerified bool) *BinaryVerifiedEvent {
	return &BinaryVerifiedEvent{
		BaseEvent: NewBaseEvent(EventTypeBinaryVerified, PriorityNormal, source),
		FeatureID: featureID, InstanceID: instanceID, RouterID: routerID, Version: version,
		ArchiveHash: archiveHash, BinaryHash: binaryHash, GPGVerified: gpgVerified,
		GPGKeyID: gpgKeyID, ChecksumsURL: checksumsURL, VerifiedAt: verifiedAt,
	}
}

// BinaryVerificationFailedEvent is emitted when a marketplace feature binary fails verification.
type BinaryVerificationFailedEvent struct {
	BaseEvent
	FeatureID       string `json:"featureId"`
	InstanceID      string `json:"instanceId"`
	RouterID        string `json:"routerId,omitempty"`
	Version         string `json:"version"`
	ExpectedHash    string `json:"expectedHash"`
	ActualHash      string `json:"actualHash"`
	ChecksumsURL    string `json:"checksumsUrl"`
	FailureReason   string `json:"failureReason"`
	SuggestedAction string `json:"suggestedAction"`
	VerifiedAt      string `json:"verifiedAt"`
}

func (e *BinaryVerificationFailedEvent) Payload() ([]byte, error) { return json.Marshal(e) }

func NewBinaryVerificationFailedEvent(featureID, instanceID, routerID, version, expectedHash, actualHash, checksumsURL, failureReason, suggestedAction, verifiedAt, source string) *BinaryVerificationFailedEvent {
	return &BinaryVerificationFailedEvent{
		BaseEvent: NewBaseEvent(EventTypeBinaryVerificationFailed, PriorityCritical, source),
		FeatureID: featureID, InstanceID: instanceID, RouterID: routerID, Version: version,
		ExpectedHash: expectedHash, ActualHash: actualHash, ChecksumsURL: checksumsURL,
		FailureReason: failureReason, SuggestedAction: suggestedAction, VerifiedAt: verifiedAt,
	}
}

// BinaryIntegrityFailedEvent is emitted when a runtime integrity check detects binary tampering.
type BinaryIntegrityFailedEvent struct {
	BaseEvent
	FeatureID        string `json:"featureId"`
	InstanceID       string `json:"instanceId"`
	RouterID         string `json:"routerId,omitempty"`
	Version          string `json:"version"`
	ExpectedHash     string `json:"expectedHash"`
	ActualHash       string `json:"actualHash"`
	InstallHash      string `json:"installHash"`
	ChecksumsURL     string `json:"checksumsUrl"`
	DetectedAt       string `json:"detectedAt"`
	WillTerminate    bool   `json:"willTerminate"`
	SecurityIncident bool   `json:"securityIncident"`
}

func (e *BinaryIntegrityFailedEvent) Payload() ([]byte, error) { return json.Marshal(e) }

func NewBinaryIntegrityFailedEvent(featureID, instanceID, routerID, version, expectedHash, actualHash, installHash, checksumsURL, detectedAt, source string, willTerminate, securityIncident bool) *BinaryIntegrityFailedEvent {
	return &BinaryIntegrityFailedEvent{
		BaseEvent: NewBaseEvent(EventTypeBinaryIntegrityFailed, PriorityImmediate, source),
		FeatureID: featureID, InstanceID: instanceID, RouterID: routerID, Version: version,
		ExpectedHash: expectedHash, ActualHash: actualHash, InstallHash: installHash,
		ChecksumsURL: checksumsURL, DetectedAt: detectedAt, WillTerminate: willTerminate, SecurityIncident: securityIncident,
	}
}

// BinaryIntegrityCheckStartedEvent is emitted when a batch integrity check begins.
type BinaryIntegrityCheckStartedEvent struct {
	BaseEvent
	RouterID      string   `json:"routerId,omitempty"`
	InstanceCount int      `json:"instanceCount"`
	FeatureIDs    []string `json:"featureIds"`
	StartedAt     string   `json:"startedAt"`
	Reason        string   `json:"reason"`
}

func (e *BinaryIntegrityCheckStartedEvent) Payload() ([]byte, error) { return json.Marshal(e) }

func NewBinaryIntegrityCheckStartedEvent(routerID string, instanceCount int, featureIDs []string, startedAt, reason, source string) *BinaryIntegrityCheckStartedEvent {
	return &BinaryIntegrityCheckStartedEvent{
		BaseEvent:     NewBaseEvent(EventTypeBinaryIntegrityCheckStarted, PriorityLow, source),
		RouterID:      routerID,
		InstanceCount: instanceCount,
		FeatureIDs:    featureIDs,
		StartedAt:     startedAt,
		Reason:        reason,
	}
}

// =============================================================================
// Template Events (NAS-8.9)
// =============================================================================

type TemplateInstallStartedEvent struct {
	BaseEvent
	TemplateID     string                 `json:"templateId"`
	TemplateName   string                 `json:"templateName"`
	RouterID       string                 `json:"routerId"`
	TotalServices  int                    `json:"totalServices"`
	Variables      map[string]interface{} `json:"variables"`
	RequestedByUID string                 `json:"requestedByUid,omitempty"`
}

func (e *TemplateInstallStartedEvent) Payload() ([]byte, error) { return json.Marshal(e) }

func NewTemplateInstallStartedEvent(templateID, templateName, routerID string, totalServices int, variables map[string]interface{}, requestedByUID, source string) *TemplateInstallStartedEvent {
	return &TemplateInstallStartedEvent{
		BaseEvent:  NewBaseEvent(EventTypeTemplateInstallStarted, PriorityCritical, source),
		TemplateID: templateID, TemplateName: templateName, RouterID: routerID,
		TotalServices: totalServices, Variables: variables, RequestedByUID: requestedByUID,
	}
}

type TemplateInstallProgressEvent struct {
	BaseEvent
	TemplateID       string    `json:"templateId"`
	TemplateName     string    `json:"templateName"`
	RouterID         string    `json:"routerId"`
	TotalServices    int       `json:"totalServices"`
	InstalledCount   int       `json:"installedCount"`
	CurrentService   string    `json:"currentService"`
	CurrentServiceID string    `json:"currentServiceId,omitempty"`
	Phase            string    `json:"phase"`
	Message          string    `json:"message"`
	StartedAt        time.Time `json:"startedAt"`
}

func (e *TemplateInstallProgressEvent) Payload() ([]byte, error) { return json.Marshal(e) }

func NewTemplateInstallProgressEvent(templateID, templateName, routerID string, totalServices, installedCount int, currentService, currentServiceID, phase, message, source string, startedAt time.Time) *TemplateInstallProgressEvent {
	return &TemplateInstallProgressEvent{
		BaseEvent:  NewBaseEvent(EventTypeTemplateInstallProgress, PriorityNormal, source),
		TemplateID: templateID, TemplateName: templateName, RouterID: routerID,
		TotalServices: totalServices, InstalledCount: installedCount, CurrentService: currentService,
		CurrentServiceID: currentServiceID, Phase: phase, Message: message, StartedAt: startedAt,
	}
}

type TemplateInstallCompletedEvent struct {
	BaseEvent
	TemplateID      string            `json:"templateId"`
	TemplateName    string            `json:"templateName"`
	RouterID        string            `json:"routerId"`
	TotalServices   int               `json:"totalServices"`
	InstalledCount  int               `json:"installedCount"`
	InstanceIDs     []string          `json:"instanceIds"`
	ServiceMapping  map[string]string `json:"serviceMapping"`
	StartedAt       time.Time         `json:"startedAt"`
	CompletedAt     time.Time         `json:"completedAt"`
	DurationSeconds int               `json:"durationSeconds"`
}

func (e *TemplateInstallCompletedEvent) Payload() ([]byte, error) { return json.Marshal(e) }

func NewTemplateInstallCompletedEvent(templateID, templateName, routerID string, totalServices, installedCount int, instanceIDs []string, serviceMapping map[string]string, startedAt, completedAt time.Time, source string) *TemplateInstallCompletedEvent {
	duration := int(completedAt.Sub(startedAt).Seconds())
	return &TemplateInstallCompletedEvent{
		BaseEvent:  NewBaseEvent(EventTypeTemplateInstallCompleted, PriorityCritical, source),
		TemplateID: templateID, TemplateName: templateName, RouterID: routerID,
		TotalServices: totalServices, InstalledCount: installedCount, InstanceIDs: instanceIDs,
		ServiceMapping: serviceMapping, StartedAt: startedAt, CompletedAt: completedAt, DurationSeconds: duration,
	}
}

type TemplateInstallFailedEvent struct {
	BaseEvent
	TemplateID      string            `json:"templateId"`
	TemplateName    string            `json:"templateName"`
	RouterID        string            `json:"routerId"`
	TotalServices   int               `json:"totalServices"`
	InstalledCount  int               `json:"installedCount"`
	FailedService   string            `json:"failedService"`
	ErrorMessage    string            `json:"errorMessage"`
	ErrorPhase      string            `json:"errorPhase"`
	InstanceIDs     []string          `json:"instanceIds,omitempty"`
	ServiceMapping  map[string]string `json:"serviceMapping,omitempty"`
	StartedAt       time.Time         `json:"startedAt"`
	FailedAt        time.Time         `json:"failedAt"`
	DurationSeconds int               `json:"durationSeconds"`
	RollbackNeeded  bool              `json:"rollbackNeeded"`
}

func (e *TemplateInstallFailedEvent) Payload() ([]byte, error) { return json.Marshal(e) }

func NewTemplateInstallFailedEvent(templateID, templateName, routerID string, totalServices, installedCount int, failedService, errorMessage, errorPhase string, instanceIDs []string, serviceMapping map[string]string, startedAt, failedAt time.Time, rollbackNeeded bool, source string) *TemplateInstallFailedEvent {
	duration := int(failedAt.Sub(startedAt).Seconds())
	return &TemplateInstallFailedEvent{
		BaseEvent:  NewBaseEvent(EventTypeTemplateInstallFailed, PriorityImmediate, source),
		TemplateID: templateID, TemplateName: templateName, RouterID: routerID,
		TotalServices: totalServices, InstalledCount: installedCount, FailedService: failedService,
		ErrorMessage: errorMessage, ErrorPhase: errorPhase, InstanceIDs: instanceIDs,
		ServiceMapping: serviceMapping, StartedAt: startedAt, FailedAt: failedAt,
		DurationSeconds: duration, RollbackNeeded: rollbackNeeded,
	}
}

// =============================================================================
// Schedule Events (NAS-8.11)
// =============================================================================

type ScheduleCreatedEvent struct {
	BaseEvent
	ScheduleID string `json:"scheduleId"`
	RoutingID  string `json:"routingId"`
	StartTime  string `json:"startTime"`
	EndTime    string `json:"endTime"`
	Timezone   string `json:"timezone"`
	Days       []int  `json:"days"`
	Enabled    bool   `json:"enabled"`
}

func (e *ScheduleCreatedEvent) Payload() ([]byte, error) { return json.Marshal(e) }

func NewScheduleCreatedEvent(scheduleID, routingID, startTime, endTime, timezone string, days []int, enabled bool, source string) *ScheduleCreatedEvent {
	return &ScheduleCreatedEvent{
		BaseEvent:  NewBaseEvent(EventTypeScheduleCreated, PriorityNormal, source),
		ScheduleID: scheduleID, RoutingID: routingID, StartTime: startTime, EndTime: endTime,
		Timezone: timezone, Days: days, Enabled: enabled,
	}
}

type ScheduleUpdatedEvent struct {
	BaseEvent
	ScheduleID string `json:"scheduleId"`
	RoutingID  string `json:"routingId"`
	StartTime  string `json:"startTime"`
	EndTime    string `json:"endTime"`
	Timezone   string `json:"timezone"`
	Days       []int  `json:"days"`
	Enabled    bool   `json:"enabled"`
}

func (e *ScheduleUpdatedEvent) Payload() ([]byte, error) { return json.Marshal(e) }

func NewScheduleUpdatedEvent(scheduleID, routingID, startTime, endTime, timezone string, days []int, enabled bool, source string) *ScheduleUpdatedEvent {
	return &ScheduleUpdatedEvent{
		BaseEvent:  NewBaseEvent(EventTypeScheduleUpdated, PriorityNormal, source),
		ScheduleID: scheduleID, RoutingID: routingID, StartTime: startTime, EndTime: endTime,
		Timezone: timezone, Days: days, Enabled: enabled,
	}
}

type ScheduleDeletedEvent struct {
	BaseEvent
	ScheduleID string `json:"scheduleId"`
	RoutingID  string `json:"routingId"`
}

func (e *ScheduleDeletedEvent) Payload() ([]byte, error) { return json.Marshal(e) }

func NewScheduleDeletedEvent(scheduleID, routingID, source string) *ScheduleDeletedEvent {
	return &ScheduleDeletedEvent{
		BaseEvent:  NewBaseEvent(EventTypeScheduleDeleted, PriorityNormal, source),
		ScheduleID: scheduleID, RoutingID: routingID,
	}
}

type ScheduleActivatedEvent struct {
	BaseEvent
	ScheduleID string `json:"scheduleId"`
	RoutingID  string `json:"routingId"`
	DeviceMAC  string `json:"deviceMac"`
	InstanceID string `json:"instanceId"`
}

func (e *ScheduleActivatedEvent) Payload() ([]byte, error) { return json.Marshal(e) }

func NewScheduleActivatedEvent(scheduleID, routingID, deviceMAC, instanceID, source string) *ScheduleActivatedEvent {
	return &ScheduleActivatedEvent{
		BaseEvent:  NewBaseEvent(EventTypeScheduleActivated, PriorityCritical, source),
		ScheduleID: scheduleID, RoutingID: routingID, DeviceMAC: deviceMAC, InstanceID: instanceID,
	}
}

type ScheduleDeactivatedEvent struct {
	BaseEvent
	ScheduleID string `json:"scheduleId"`
	RoutingID  string `json:"routingId"`
	DeviceMAC  string `json:"deviceMac"`
	InstanceID string `json:"instanceId"`
}

func (e *ScheduleDeactivatedEvent) Payload() ([]byte, error) { return json.Marshal(e) }

func NewScheduleDeactivatedEvent(scheduleID, routingID, deviceMAC, instanceID, source string) *ScheduleDeactivatedEvent {
	return &ScheduleDeactivatedEvent{
		BaseEvent:  NewBaseEvent(EventTypeScheduleDeactivated, PriorityCritical, source),
		ScheduleID: scheduleID, RoutingID: routingID, DeviceMAC: deviceMAC, InstanceID: instanceID,
	}
}

// =============================================================================
// Quota Events (NAS-8.8)
// =============================================================================

type QuotaWarning80Event struct {
	BaseEvent
	InstanceID     string  `json:"instanceId"`
	RouterID       string  `json:"routerId"`
	QuotaBytes     int64   `json:"quotaBytes"`
	UsedBytes      int64   `json:"usedBytes"`
	RemainingBytes int64   `json:"remainingBytes"`
	PercentUsed    float64 `json:"percentUsed"`
	Period         string  `json:"period"`
	ResetAt        string  `json:"resetAt"`
}

func (e *QuotaWarning80Event) Payload() ([]byte, error) { return json.Marshal(e) }

func NewQuotaWarning80Event(instanceID, routerID string, quotaBytes, usedBytes, remainingBytes int64, percentUsed float64, period, resetAt, source string) *QuotaWarning80Event {
	return &QuotaWarning80Event{
		BaseEvent:  NewBaseEvent(EventTypeQuotaWarning80, PriorityNormal, source),
		InstanceID: instanceID, RouterID: routerID, QuotaBytes: quotaBytes, UsedBytes: usedBytes,
		RemainingBytes: remainingBytes, PercentUsed: percentUsed, Period: period, ResetAt: resetAt,
	}
}

type QuotaWarning90Event struct {
	BaseEvent
	InstanceID     string  `json:"instanceId"`
	RouterID       string  `json:"routerId"`
	QuotaBytes     int64   `json:"quotaBytes"`
	UsedBytes      int64   `json:"usedBytes"`
	RemainingBytes int64   `json:"remainingBytes"`
	PercentUsed    float64 `json:"percentUsed"`
	Period         string  `json:"period"`
	ResetAt        string  `json:"resetAt"`
}

func (e *QuotaWarning90Event) Payload() ([]byte, error) { return json.Marshal(e) }

func NewQuotaWarning90Event(instanceID, routerID string, quotaBytes, usedBytes, remainingBytes int64, percentUsed float64, period, resetAt, source string) *QuotaWarning90Event {
	return &QuotaWarning90Event{
		BaseEvent:  NewBaseEvent(EventTypeQuotaWarning90, PriorityCritical, source),
		InstanceID: instanceID, RouterID: routerID, QuotaBytes: quotaBytes, UsedBytes: usedBytes,
		RemainingBytes: remainingBytes, PercentUsed: percentUsed, Period: period, ResetAt: resetAt,
	}
}

type QuotaExceededEvent struct {
	BaseEvent
	InstanceID   string `json:"instanceId"`
	RouterID     string `json:"routerId"`
	QuotaBytes   int64  `json:"quotaBytes"`
	UsedBytes    int64  `json:"usedBytes"`
	OverageBytes int64  `json:"overageBytes"`
	Period       string `json:"period"`
	Action       string `json:"action"`
	ResetAt      string `json:"resetAt"`
}

func (e *QuotaExceededEvent) Payload() ([]byte, error) { return json.Marshal(e) }

func NewQuotaExceededEvent(instanceID, routerID string, quotaBytes, usedBytes, overageBytes int64, period, action, resetAt, source string) *QuotaExceededEvent {
	return &QuotaExceededEvent{
		BaseEvent:  NewBaseEvent(EventTypeQuotaExceeded, PriorityImmediate, source),
		InstanceID: instanceID, RouterID: routerID, QuotaBytes: quotaBytes, UsedBytes: usedBytes,
		OverageBytes: overageBytes, Period: period, Action: action, ResetAt: resetAt,
	}
}

type QuotaResetEvent struct {
	BaseEvent
	InstanceID  string `json:"instanceId"`
	RouterID    string `json:"routerId"`
	Period      string `json:"period"`
	NextResetAt string `json:"nextResetAt"`
}

func (e *QuotaResetEvent) Payload() ([]byte, error) { return json.Marshal(e) }

func NewQuotaResetEvent(instanceID, routerID, period, nextResetAt, source string) *QuotaResetEvent {
	return &QuotaResetEvent{
		BaseEvent:  NewBaseEvent(EventTypeQuotaReset, PriorityNormal, source),
		InstanceID: instanceID, RouterID: routerID, Period: period, NextResetAt: nextResetAt,
	}
}

// =============================================================================
// Boot Sequence Events (NAS-8.19)
// =============================================================================

type BootSequenceStartedEvent struct {
	BaseEvent
	InstanceCount int      `json:"instanceCount"`
	InstanceIDs   []string `json:"instanceIds"`
}

func (e *BootSequenceStartedEvent) Payload() ([]byte, error) { return json.Marshal(e) }

func NewBootSequenceStartedEvent(source string, instanceCount int, instanceIDs []string) *BootSequenceStartedEvent {
	return &BootSequenceStartedEvent{
		BaseEvent:     NewBaseEvent(EventTypeBootSequenceStarted, PriorityCritical, source),
		InstanceCount: instanceCount, InstanceIDs: instanceIDs,
	}
}

type BootSequenceLayerCompleteEvent struct {
	BaseEvent
	Layer        int      `json:"layer"`
	InstanceIDs  []string `json:"instanceIds"`
	SuccessCount int      `json:"successCount"`
	FailureCount int      `json:"failureCount"`
}

func (e *BootSequenceLayerCompleteEvent) Payload() ([]byte, error) { return json.Marshal(e) }

func NewBootSequenceLayerCompleteEvent(source string, layer int, instanceIDs []string, successCount, failureCount int) *BootSequenceLayerCompleteEvent {
	return &BootSequenceLayerCompleteEvent{
		BaseEvent: NewBaseEvent(EventTypeBootSequenceLayerComplete, PriorityNormal, source),
		Layer:     layer, InstanceIDs: instanceIDs, SuccessCount: successCount, FailureCount: failureCount,
	}
}

type BootSequenceCompleteEvent struct {
	BaseEvent
	TotalInstances   int      `json:"totalInstances"`
	StartedInstances int      `json:"startedInstances"`
	FailedInstances  int      `json:"failedInstances"`
	DurationMs       int64    `json:"durationMs"`
	FailedIDs        []string `json:"failedIds,omitempty"`
}

func (e *BootSequenceCompleteEvent) Payload() ([]byte, error) { return json.Marshal(e) }

func NewBootSequenceCompleteEvent(source string, totalInstances, startedInstances, failedInstances int, durationMs int64, failedIDs []string) *BootSequenceCompleteEvent {
	return &BootSequenceCompleteEvent{
		BaseEvent:      NewBaseEvent(EventTypeBootSequenceComplete, PriorityCritical, source),
		TotalInstances: totalInstances, StartedInstances: startedInstances,
		FailedInstances: failedInstances, DurationMs: durationMs, FailedIDs: failedIDs,
	}
}

type BootSequenceFailedEvent struct {
	BaseEvent
	Layer            int      `json:"layer"`
	FailedInstanceID string   `json:"failedInstanceId"`
	ErrorMessage     string   `json:"errorMessage"`
	StartedIDs       []string `json:"startedIds,omitempty"`
}

func (e *BootSequenceFailedEvent) Payload() ([]byte, error) { return json.Marshal(e) }

func NewBootSequenceFailedEvent(source string, layer int, failedInstanceID, errorMessage string, startedIDs []string) *BootSequenceFailedEvent {
	return &BootSequenceFailedEvent{
		BaseEvent: NewBaseEvent(EventTypeBootSequenceFailed, PriorityImmediate, source),
		Layer:     layer, FailedInstanceID: failedInstanceID, ErrorMessage: errorMessage, StartedIDs: startedIDs,
	}
}

// =============================================================================
// Dependency Events (NAS-8.19)
// =============================================================================

type DependencyAddedEvent struct {
	BaseEvent
	FromInstanceID string `json:"fromInstanceId"`
	ToInstanceID   string `json:"toInstanceId"`
	DependencyType string `json:"dependencyType"`
}

func (e *DependencyAddedEvent) Payload() ([]byte, error) { return json.Marshal(e) }

func NewDependencyAddedEvent(source, fromInstanceID, toInstanceID, dependencyType string) *DependencyAddedEvent {
	return &DependencyAddedEvent{
		BaseEvent:      NewBaseEvent(EventTypeDependencyAdded, PriorityNormal, source),
		FromInstanceID: fromInstanceID, ToInstanceID: toInstanceID, DependencyType: dependencyType,
	}
}

type DependencyRemovedEvent struct {
	BaseEvent
	FromInstanceID string `json:"fromInstanceId"`
	ToInstanceID   string `json:"toInstanceId"`
}

func (e *DependencyRemovedEvent) Payload() ([]byte, error) { return json.Marshal(e) }

func NewDependencyRemovedEvent(source, fromInstanceID, toInstanceID string) *DependencyRemovedEvent {
	return &DependencyRemovedEvent{
		BaseEvent:      NewBaseEvent(EventTypeDependencyRemoved, PriorityNormal, source),
		FromInstanceID: fromInstanceID, ToInstanceID: toInstanceID,
	}
}
