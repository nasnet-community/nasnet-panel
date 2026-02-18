package events

import (
	"encoding/json"
	"time"

	"github.com/oklog/ulid/v2"
)

// =============================================================================
// Router Events
// =============================================================================

// RouterStatusChangedEvent is emitted when a router's connection status changes.
type RouterStatusChangedEvent struct {
	BaseEvent
	RouterID       string       `json:"routerId"`
	Status         RouterStatus `json:"status"`
	PreviousStatus RouterStatus `json:"previousStatus"`
	Protocol       string       `json:"protocol,omitempty"`
	ErrorMessage   string       `json:"errorMessage,omitempty"`
}

func (e *RouterStatusChangedEvent) Payload() ([]byte, error) { return json.Marshal(e) }

func NewRouterStatusChangedEvent(routerID string, status, previousStatus RouterStatus, source string) *RouterStatusChangedEvent {
	return &RouterStatusChangedEvent{
		BaseEvent:      NewBaseEvent(EventTypeRouterStatusChanged, PriorityImmediate, source),
		RouterID:       routerID,
		Status:         status,
		PreviousStatus: previousStatus,
	}
}

// RouterConnectedEvent is emitted when a router connection is established.
type RouterConnectedEvent struct {
	BaseEvent
	RouterID string `json:"routerId"`
	Protocol string `json:"protocol"`
	Version  string `json:"version,omitempty"`
}

func (e *RouterConnectedEvent) Payload() ([]byte, error) { return json.Marshal(e) }

func NewRouterConnectedEvent(routerID, protocol, version, source string) *RouterConnectedEvent {
	return &RouterConnectedEvent{
		BaseEvent: NewBaseEvent(EventTypeRouterConnected, PriorityNormal, source),
		RouterID:  routerID,
		Protocol:  protocol,
		Version:   version,
	}
}

// RouterDisconnectedEvent is emitted when a router connection is lost.
type RouterDisconnectedEvent struct {
	BaseEvent
	RouterID string `json:"routerId"`
	Reason   string `json:"reason,omitempty"`
}

func (e *RouterDisconnectedEvent) Payload() ([]byte, error) { return json.Marshal(e) }

func NewRouterDisconnectedEvent(routerID, reason, source string) *RouterDisconnectedEvent {
	return &RouterDisconnectedEvent{
		BaseEvent: NewBaseEvent(EventTypeRouterDisconnected, PriorityNormal, source),
		RouterID:  routerID,
		Reason:    reason,
	}
}

// CapabilitiesUpdatedEvent is emitted when router capabilities are detected or updated.
type CapabilitiesUpdatedEvent struct {
	BaseEvent
	RouterID          string   `json:"routerId"`
	Version           string   `json:"version"`
	MajorVersion      int      `json:"majorVersion"`
	MinorVersion      int      `json:"minorVersion"`
	IsCHR             bool     `json:"isChr"`
	SupportedFeatures []string `json:"supportedFeatures"`
	InstalledPackages []string `json:"installedPackages"`
	Architecture      string   `json:"architecture,omitempty"`
}

func (e *CapabilitiesUpdatedEvent) Payload() ([]byte, error) { return json.Marshal(e) }

func NewCapabilitiesUpdatedEvent(
	routerID string, version string, majorVersion, minorVersion int, isCHR bool,
	supportedFeatures, installedPackages []string, architecture string, source string,
) *CapabilitiesUpdatedEvent {

	return &CapabilitiesUpdatedEvent{
		BaseEvent:         NewBaseEvent(EventTypeCapabilitiesUpdated, PriorityNormal, source),
		RouterID:          routerID,
		Version:           version,
		MajorVersion:      majorVersion,
		MinorVersion:      minorVersion,
		IsCHR:             isCHR,
		SupportedFeatures: supportedFeatures,
		InstalledPackages: installedPackages,
		Architecture:      architecture,
	}
}

// CredentialChangedEvent is emitted when router credentials are updated.
// IMPORTANT: This event NEVER includes credential values (username/password).
type CredentialChangedEvent struct {
	BaseEvent
	RouterID  string `json:"routerId"`
	UserID    string `json:"userId,omitempty"`
	IPAddress string `json:"ipAddress"`
}

func (e *CredentialChangedEvent) Payload() ([]byte, error) { return json.Marshal(e) }

func NewCredentialChangedEvent(routerID, userID, ipAddress, source string) *CredentialChangedEvent {
	return &CredentialChangedEvent{
		BaseEvent: NewBaseEvent(EventTypeCredentialChanged, PriorityImmediate, source),
		RouterID:  routerID,
		UserID:    userID,
		IPAddress: ipAddress,
	}
}

// =============================================================================
// Resource Events
// =============================================================================

// ResourceUpdatedEvent is emitted when a resource is created, updated, or deleted.
type ResourceUpdatedEvent struct {
	BaseEvent
	ResourceUUID  ulid.ULID  `json:"resourceUuid"`
	ResourceType  string     `json:"resourceType"`
	RouterID      string     `json:"routerId"`
	NewVersion    int        `json:"newVersion"`
	ChangedFields []string   `json:"changedFields"`
	ChangeType    ChangeType `json:"changeType"`
}

func (e *ResourceUpdatedEvent) Payload() ([]byte, error) { return json.Marshal(e) }

func NewResourceUpdatedEvent(resourceUUID ulid.ULID, resourceType, routerID string, version int, changeType ChangeType, source string) *ResourceUpdatedEvent {
	priority := PriorityNormal
	if changeType == ChangeTypeCreate || changeType == ChangeTypeDelete {
		priority = PriorityCritical
	}
	return &ResourceUpdatedEvent{
		BaseEvent:    NewBaseEvent(EventTypeResourceUpdated, priority, source),
		ResourceUUID: resourceUUID,
		ResourceType: resourceType,
		RouterID:     routerID,
		NewVersion:   version,
		ChangeType:   changeType,
	}
}

// =============================================================================
// Config Events
// =============================================================================

// ConfigApplyProgressEvent is emitted during configuration apply operations.
type ConfigApplyProgressEvent struct {
	BaseEvent
	OperationID      string `json:"operationId"`
	RouterID         string `json:"routerId"`
	Stage            string `json:"stage"`
	Progress         int    `json:"progress"`
	Message          string `json:"message"`
	ResourcesApplied int    `json:"resourcesApplied"`
	ResourcesTotal   int    `json:"resourcesTotal"`
}

func (e *ConfigApplyProgressEvent) Payload() ([]byte, error) { return json.Marshal(e) }

func NewConfigApplyProgressEvent(operationID, routerID, stage string, progress, applied, total int, message, source string) *ConfigApplyProgressEvent {
	return &ConfigApplyProgressEvent{
		BaseEvent:        NewBaseEvent(EventTypeConfigApplyProgress, PriorityCritical, source),
		OperationID:      operationID,
		RouterID:         routerID,
		Stage:            stage,
		Progress:         progress,
		Message:          message,
		ResourcesApplied: applied,
		ResourcesTotal:   total,
	}
}

// ConfigAppliedEvent is emitted when configuration is successfully applied.
type ConfigAppliedEvent struct {
	BaseEvent
	OperationID    string   `json:"operationId"`
	RouterID       string   `json:"routerId"`
	ResourcesCount int      `json:"resourcesCount"`
	Resources      []string `json:"resources,omitempty"`
}

func (e *ConfigAppliedEvent) Payload() ([]byte, error) { return json.Marshal(e) }

func NewConfigAppliedEvent(operationID, routerID string, resourcesCount int, resources []string, source string) *ConfigAppliedEvent {
	return &ConfigAppliedEvent{
		BaseEvent:      NewBaseEvent(EventTypeConfigApplied, PriorityCritical, source),
		OperationID:    operationID,
		RouterID:       routerID,
		ResourcesCount: resourcesCount,
		Resources:      resources,
	}
}

// =============================================================================
// Auth Events
// =============================================================================

// AuthEvent is emitted for authentication-related actions (for security audit).
type AuthEvent struct {
	BaseEvent
	UserID     string `json:"userId,omitempty"`
	Action     string `json:"action"`
	IPAddress  string `json:"ipAddress"`
	UserAgent  string `json:"userAgent"`
	Success    bool   `json:"success"`
	FailReason string `json:"failReason,omitempty"`
}

func (e *AuthEvent) Payload() ([]byte, error) { return json.Marshal(e) }

func NewAuthEvent(userID, action, ipAddress, userAgent string, success bool, failReason, source string) *AuthEvent {
	priority := PriorityCritical
	if !success || action == "session_revoked" || action == "password_changed" {
		priority = PriorityImmediate
	}
	return &AuthEvent{
		BaseEvent:  NewBaseEvent(EventTypeAuth, priority, source),
		UserID:     userID,
		Action:     action,
		IPAddress:  ipAddress,
		UserAgent:  userAgent,
		Success:    success,
		FailReason: failReason,
	}
}

// =============================================================================
// Alert Events
// =============================================================================

// AlertCreatedEvent is emitted when an alert is created and saved to the database.
type AlertCreatedEvent struct {
	BaseEvent
	AlertID   string                 `json:"alertId"`
	RuleID    string                 `json:"ruleId"`
	EventType string                 `json:"eventType"`
	Severity  string                 `json:"severity"`
	Title     string                 `json:"title"`
	Message   string                 `json:"message"`
	DeviceID  string                 `json:"deviceId,omitempty"`
	Channels  []string               `json:"channels"`
	Data      map[string]interface{} `json:"data,omitempty"`
}

func (e *AlertCreatedEvent) Payload() ([]byte, error) { return json.Marshal(e) }

func NewAlertCreatedEvent(
	alertID, ruleID, eventType, severity, title, message, deviceID string,
	channels []string, data map[string]interface{}, source string,
) *AlertCreatedEvent {

	return &AlertCreatedEvent{
		BaseEvent: NewBaseEvent(EventTypeAlertCreated, PriorityCritical, source),
		AlertID:   alertID,
		RuleID:    ruleID,
		EventType: eventType,
		Severity:  severity,
		Title:     title,
		Message:   message,
		DeviceID:  deviceID,
		Channels:  channels,
		Data:      data,
	}
}

// =============================================================================
// Feature Events
// =============================================================================

// FeatureCrashedEvent is emitted when a marketplace feature crashes.
type FeatureCrashedEvent struct {
	BaseEvent
	FeatureID   string `json:"featureId"`
	InstanceID  string `json:"instanceId"`
	RouterID    string `json:"routerId"`
	ExitCode    int    `json:"exitCode"`
	CrashCount  int    `json:"crashCount"`
	LastError   string `json:"lastError"`
	WillRestart bool   `json:"willRestart"`
}

func (e *FeatureCrashedEvent) Payload() ([]byte, error) { return json.Marshal(e) }

func NewFeatureCrashedEvent(featureID, instanceID, routerID string, exitCode, crashCount int, lastError string, willRestart bool, source string) *FeatureCrashedEvent {
	return &FeatureCrashedEvent{
		BaseEvent:   NewBaseEvent(EventTypeFeatureCrashed, PriorityImmediate, source),
		FeatureID:   featureID,
		InstanceID:  instanceID,
		RouterID:    routerID,
		ExitCode:    exitCode,
		CrashCount:  crashCount,
		LastError:   lastError,
		WillRestart: willRestart,
	}
}

// FeatureInstalledEvent is emitted when a feature is installed.
type FeatureInstalledEvent struct {
	BaseEvent
	FeatureID   string `json:"featureId"`
	FeatureName string `json:"featureName"`
	Version     string `json:"version"`
	RouterID    string `json:"routerId"`
}

func (e *FeatureInstalledEvent) Payload() ([]byte, error) { return json.Marshal(e) }

func NewFeatureInstalledEvent(featureID, featureName, version, routerID, source string) *FeatureInstalledEvent {
	return &FeatureInstalledEvent{
		BaseEvent:   NewBaseEvent(EventTypeFeatureInstalled, PriorityCritical, source),
		FeatureID:   featureID,
		FeatureName: featureName,
		Version:     version,
		RouterID:    routerID,
	}
}

// FeatureHealthChangedEvent is emitted when a service instance health state changes.
type FeatureHealthChangedEvent struct {
	BaseEvent
	FeatureID        string    `json:"featureId"`
	InstanceID       string    `json:"instanceId"`
	RouterID         string    `json:"routerId"`
	PreviousState    string    `json:"previousState"`
	CurrentState     string    `json:"currentState"`
	ConsecutiveFails int       `json:"consecutiveFails"`
	LatencyMs        int64     `json:"latencyMs"`
	LastHealthyAt    time.Time `json:"lastHealthyAt"`
}

func (e *FeatureHealthChangedEvent) Payload() ([]byte, error) { return json.Marshal(e) }

func NewFeatureHealthChangedEvent(
	featureID, instanceID, routerID, previousState, currentState string,
	consecutiveFails int, latencyMs int64, lastHealthyAt time.Time,
) *FeatureHealthChangedEvent {

	return &FeatureHealthChangedEvent{
		BaseEvent:        NewBaseEvent(EventTypeHealthChanged, PriorityNormal, "health-checker"),
		FeatureID:        featureID,
		InstanceID:       instanceID,
		RouterID:         routerID,
		PreviousState:    previousState,
		CurrentState:     currentState,
		ConsecutiveFails: consecutiveFails,
		LatencyMs:        latencyMs,
		LastHealthyAt:    lastHealthyAt,
	}
}

// =============================================================================
// Interface Events
// =============================================================================

// InterfaceStatusChangedEvent is emitted when an interface's operational status changes.
type InterfaceStatusChangedEvent struct {
	BaseEvent
	RouterID       string `json:"routerId"`
	InterfaceID    string `json:"interfaceId"`
	InterfaceName  string `json:"interfaceName"`
	Status         string `json:"status"`
	PreviousStatus string `json:"previousStatus"`
}

func (e *InterfaceStatusChangedEvent) Payload() ([]byte, error) { return json.Marshal(e) }

func NewInterfaceStatusChangedEvent(routerID, interfaceID, interfaceName, status, previousStatus, source string) *InterfaceStatusChangedEvent {
	return &InterfaceStatusChangedEvent{
		BaseEvent:      NewBaseEvent(EventTypeInterfaceStatusChanged, PriorityNormal, source),
		RouterID:       routerID,
		InterfaceID:    interfaceID,
		InterfaceName:  interfaceName,
		Status:         status,
		PreviousStatus: previousStatus,
	}
}

// InterfaceTrafficUpdateEvent is emitted periodically with interface traffic statistics.
type InterfaceTrafficUpdateEvent struct {
	BaseEvent
	RouterID      string `json:"routerId"`
	InterfaceID   string `json:"interfaceId"`
	InterfaceName string `json:"interfaceName"`
	TxRate        uint64 `json:"txRate"`
	RxRate        uint64 `json:"rxRate"`
	TxTotal       uint64 `json:"txTotal"`
	RxTotal       uint64 `json:"rxTotal"`
}

func (e *InterfaceTrafficUpdateEvent) Payload() ([]byte, error) { return json.Marshal(e) }

func NewInterfaceTrafficUpdateEvent(routerID, interfaceID, interfaceName string, txRate, rxRate, txTotal, rxTotal uint64, source string) *InterfaceTrafficUpdateEvent {
	return &InterfaceTrafficUpdateEvent{
		BaseEvent:     NewBaseEvent(EventTypeInterfaceTrafficUpdate, PriorityBackground, source),
		RouterID:      routerID,
		InterfaceID:   interfaceID,
		InterfaceName: interfaceName,
		TxRate:        txRate,
		RxRate:        rxRate,
		TxTotal:       txTotal,
		RxTotal:       rxTotal,
	}
}

// =============================================================================
// Telemetry Events
// =============================================================================

// MetricUpdatedEvent is emitted when metrics are collected.
type MetricUpdatedEvent struct {
	BaseEvent
	RouterID   string            `json:"routerId"`
	MetricType string            `json:"metricType"`
	Values     map[string]string `json:"values"`
}

func (e *MetricUpdatedEvent) Payload() ([]byte, error) { return json.Marshal(e) }

func NewMetricUpdatedEvent(routerID, metricType string, values map[string]string, source string) *MetricUpdatedEvent {
	return &MetricUpdatedEvent{
		BaseEvent:  NewBaseEvent(EventTypeMetricUpdated, PriorityBackground, source),
		RouterID:   routerID,
		MetricType: metricType,
		Values:     values,
	}
}

// LogAppendedEvent is emitted when a log entry is added.
type LogAppendedEvent struct {
	BaseEvent
	RouterID string `json:"routerId"`
	Level    string `json:"level"`
	Message  string `json:"message"`
	Topic    string `json:"topic,omitempty"`
}

func (e *LogAppendedEvent) Payload() ([]byte, error) { return json.Marshal(e) }

func NewLogAppendedEvent(routerID, level, message, topic, source string) *LogAppendedEvent {
	return &LogAppendedEvent{
		BaseEvent: NewBaseEvent(EventTypeLogAppended, PriorityBackground, source),
		RouterID:  routerID,
		Level:     level,
		Message:   message,
		Topic:     topic,
	}
}
