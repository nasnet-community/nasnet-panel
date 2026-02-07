package events

import (
	"encoding/json"
	"time"

	"github.com/oklog/ulid/v2"
)

// Event is the interface that all typed events must implement.
// It provides common methods for event identification, typing, and serialization.
type Event interface {
	// GetID returns the unique identifier for this event.
	GetID() ulid.ULID

	// GetType returns the event type string (e.g., "router.status.changed").
	GetType() string

	// GetPriority returns the priority level for delivery.
	GetPriority() Priority

	// GetTimestamp returns when the event was created.
	GetTimestamp() time.Time

	// GetSource returns the component that generated this event.
	GetSource() string

	// Payload returns the JSON-serialized event payload.
	Payload() ([]byte, error)
}

// EventMetadata contains optional metadata for events.
type EventMetadata struct {
	// CorrelationID links related events together.
	CorrelationID string `json:"correlationId,omitempty"`

	// CausationID is the ID of the event that caused this event.
	CausationID string `json:"causationId,omitempty"`

	// UserID is the user who triggered this event (if applicable).
	UserID string `json:"userId,omitempty"`

	// RequestID is the HTTP request ID that triggered this event.
	RequestID string `json:"requestId,omitempty"`

	// RouterID is the router context for this event (if applicable).
	RouterID string `json:"routerId,omitempty"`

	// Extra contains additional key-value metadata.
	Extra map[string]string `json:"extra,omitempty"`
}

// BaseEvent is the base struct for all typed events.
// Embed this in concrete event types to satisfy the Event interface.
type BaseEvent struct {
	ID        ulid.ULID     `json:"id"`
	Type      string        `json:"type"`
	Priority  Priority      `json:"priority"`
	Timestamp time.Time     `json:"timestamp"`
	Source    string        `json:"source"`
	Metadata  EventMetadata `json:"metadata,omitempty"`
}

// GetID returns the unique identifier for this event.
func (e *BaseEvent) GetID() ulid.ULID {
	return e.ID
}

// GetType returns the event type string.
func (e *BaseEvent) GetType() string {
	return e.Type
}

// GetPriority returns the priority level for delivery.
func (e *BaseEvent) GetPriority() Priority {
	return e.Priority
}

// GetTimestamp returns when the event was created.
func (e *BaseEvent) GetTimestamp() time.Time {
	return e.Timestamp
}

// GetSource returns the component that generated this event.
func (e *BaseEvent) GetSource() string {
	return e.Source
}

// Payload returns the JSON-serialized event payload.
// This base implementation serializes the BaseEvent fields only.
// Concrete event types should override this to include their specific fields.
func (e *BaseEvent) Payload() ([]byte, error) {
	return json.Marshal(e)
}

// NewBaseEvent creates a new BaseEvent with generated ID and current timestamp.
func NewBaseEvent(eventType string, priority Priority, source string) BaseEvent {
	return BaseEvent{
		ID:        ulid.Make(),
		Type:      eventType,
		Priority:  priority,
		Timestamp: time.Now(),
		Source:    source,
		Metadata:  EventMetadata{},
	}
}

// NewBaseEventWithMetadata creates a new BaseEvent with metadata.
func NewBaseEventWithMetadata(eventType string, priority Priority, source string, metadata EventMetadata) BaseEvent {
	return BaseEvent{
		ID:        ulid.Make(),
		Type:      eventType,
		Priority:  priority,
		Timestamp: time.Now(),
		Source:    source,
		Metadata:  metadata,
	}
}

// RouterStatus represents the connection status of a router.
type RouterStatus string

const (
	RouterStatusConnected    RouterStatus = "connected"
	RouterStatusDisconnected RouterStatus = "disconnected"
	RouterStatusReconnecting RouterStatus = "reconnecting"
	RouterStatusError        RouterStatus = "error"
	RouterStatusUnknown      RouterStatus = "unknown"
)

// ChangeType represents the type of change made to a resource.
type ChangeType string

const (
	ChangeTypeCreate ChangeType = "create"
	ChangeTypeUpdate ChangeType = "update"
	ChangeTypeDelete ChangeType = "delete"
)

// RouterStatusChangedEvent is emitted when a router's connection status changes.
type RouterStatusChangedEvent struct {
	BaseEvent
	RouterID       string       `json:"routerId"`
	Status         RouterStatus `json:"status"`
	PreviousStatus RouterStatus `json:"previousStatus"`
	Protocol       string       `json:"protocol,omitempty"`
	ErrorMessage   string       `json:"errorMessage,omitempty"`
}

// Payload returns the JSON-serialized event payload.
func (e *RouterStatusChangedEvent) Payload() ([]byte, error) {
	return json.Marshal(e)
}

// NewRouterStatusChangedEvent creates a new RouterStatusChangedEvent.
func NewRouterStatusChangedEvent(routerID string, status, previousStatus RouterStatus, source string) *RouterStatusChangedEvent {
	return &RouterStatusChangedEvent{
		BaseEvent:      NewBaseEvent(EventTypeRouterStatusChanged, PriorityImmediate, source),
		RouterID:       routerID,
		Status:         status,
		PreviousStatus: previousStatus,
	}
}

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

// Payload returns the JSON-serialized event payload.
func (e *ResourceUpdatedEvent) Payload() ([]byte, error) {
	return json.Marshal(e)
}

// NewResourceUpdatedEvent creates a new ResourceUpdatedEvent.
func NewResourceUpdatedEvent(resourceUUID ulid.ULID, resourceType, routerID string, version int, changeType ChangeType, source string) *ResourceUpdatedEvent {
	priority := PriorityNormal
	// Resource creation/deletion are higher priority
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

// Payload returns the JSON-serialized event payload.
func (e *FeatureCrashedEvent) Payload() ([]byte, error) {
	return json.Marshal(e)
}

// NewFeatureCrashedEvent creates a new FeatureCrashedEvent.
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

// ConfigApplyProgressEvent is emitted during configuration apply operations.
type ConfigApplyProgressEvent struct {
	BaseEvent
	OperationID      string `json:"operationId"`
	RouterID         string `json:"routerId"`
	Stage            string `json:"stage"`
	Progress         int    `json:"progress"` // 0-100
	Message          string `json:"message"`
	ResourcesApplied int    `json:"resourcesApplied"`
	ResourcesTotal   int    `json:"resourcesTotal"`
}

// Payload returns the JSON-serialized event payload.
func (e *ConfigApplyProgressEvent) Payload() ([]byte, error) {
	return json.Marshal(e)
}

// NewConfigApplyProgressEvent creates a new ConfigApplyProgressEvent.
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

// AuthEvent is emitted for authentication-related actions (for security audit).
type AuthEvent struct {
	BaseEvent
	UserID     string `json:"userId,omitempty"`
	Action     string `json:"action"` // login, logout, password_changed, session_revoked
	IPAddress  string `json:"ipAddress"`
	UserAgent  string `json:"userAgent"`
	Success    bool   `json:"success"`
	FailReason string `json:"failReason,omitempty"`
}

// Payload returns the JSON-serialized event payload.
func (e *AuthEvent) Payload() ([]byte, error) {
	return json.Marshal(e)
}

// NewAuthEvent creates a new AuthEvent.
func NewAuthEvent(userID, action, ipAddress, userAgent string, success bool, failReason, source string) *AuthEvent {
	priority := PriorityCritical
	// Failed auth attempts and security-related actions get immediate priority
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

// FeatureInstalledEvent is emitted when a feature is installed.
type FeatureInstalledEvent struct {
	BaseEvent
	FeatureID   string `json:"featureId"`
	FeatureName string `json:"featureName"`
	Version     string `json:"version"`
	RouterID    string `json:"routerId"`
}

// Payload returns the JSON-serialized event payload.
func (e *FeatureInstalledEvent) Payload() ([]byte, error) {
	return json.Marshal(e)
}

// NewFeatureInstalledEvent creates a new FeatureInstalledEvent.
func NewFeatureInstalledEvent(featureID, featureName, version, routerID, source string) *FeatureInstalledEvent {
	return &FeatureInstalledEvent{
		BaseEvent:   NewBaseEvent(EventTypeFeatureInstalled, PriorityCritical, source),
		FeatureID:   featureID,
		FeatureName: featureName,
		Version:     version,
		RouterID:    routerID,
	}
}

// RouterConnectedEvent is emitted when a router connection is established.
type RouterConnectedEvent struct {
	BaseEvent
	RouterID string `json:"routerId"`
	Protocol string `json:"protocol"`
	Version  string `json:"version,omitempty"`
}

// Payload returns the JSON-serialized event payload.
func (e *RouterConnectedEvent) Payload() ([]byte, error) {
	return json.Marshal(e)
}

// NewRouterConnectedEvent creates a new RouterConnectedEvent.
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

// Payload returns the JSON-serialized event payload.
func (e *RouterDisconnectedEvent) Payload() ([]byte, error) {
	return json.Marshal(e)
}

// NewRouterDisconnectedEvent creates a new RouterDisconnectedEvent.
func NewRouterDisconnectedEvent(routerID, reason, source string) *RouterDisconnectedEvent {
	return &RouterDisconnectedEvent{
		BaseEvent: NewBaseEvent(EventTypeRouterDisconnected, PriorityNormal, source),
		RouterID:  routerID,
		Reason:    reason,
	}
}

// MetricUpdatedEvent is emitted when metrics are collected.
type MetricUpdatedEvent struct {
	BaseEvent
	RouterID   string            `json:"routerId"`
	MetricType string            `json:"metricType"`
	Values     map[string]string `json:"values"`
}

// Payload returns the JSON-serialized event payload.
func (e *MetricUpdatedEvent) Payload() ([]byte, error) {
	return json.Marshal(e)
}

// NewMetricUpdatedEvent creates a new MetricUpdatedEvent.
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

// Payload returns the JSON-serialized event payload.
func (e *LogAppendedEvent) Payload() ([]byte, error) {
	return json.Marshal(e)
}

// NewLogAppendedEvent creates a new LogAppendedEvent.
func NewLogAppendedEvent(routerID, level, message, topic, source string) *LogAppendedEvent {
	return &LogAppendedEvent{
		BaseEvent: NewBaseEvent(EventTypeLogAppended, PriorityBackground, source),
		RouterID:  routerID,
		Level:     level,
		Message:   message,
		Topic:     topic,
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

// Payload returns the JSON-serialized event payload.
func (e *ConfigAppliedEvent) Payload() ([]byte, error) {
	return json.Marshal(e)
}

// NewConfigAppliedEvent creates a new ConfigAppliedEvent.
func NewConfigAppliedEvent(operationID, routerID string, resourcesCount int, resources []string, source string) *ConfigAppliedEvent {
	return &ConfigAppliedEvent{
		BaseEvent:      NewBaseEvent(EventTypeConfigApplied, PriorityCritical, source),
		OperationID:    operationID,
		RouterID:       routerID,
		ResourcesCount: resourcesCount,
		Resources:      resources,
	}
}

// CredentialChangedEvent is emitted when router credentials are updated.
// IMPORTANT: This event NEVER includes credential values (username/password).
// Only metadata about the change is included for audit purposes.
type CredentialChangedEvent struct {
	BaseEvent
	RouterID  string `json:"routerId"`
	UserID    string `json:"userId,omitempty"` // User who made the change
	IPAddress string `json:"ipAddress"`
}

// Payload returns the JSON-serialized event payload.
func (e *CredentialChangedEvent) Payload() ([]byte, error) {
	return json.Marshal(e)
}

// NewCredentialChangedEvent creates a new CredentialChangedEvent.
// Note: Credential values are never included in this event.
func NewCredentialChangedEvent(routerID, userID, ipAddress, source string) *CredentialChangedEvent {
	return &CredentialChangedEvent{
		BaseEvent: NewBaseEvent(EventTypeCredentialChanged, PriorityImmediate, source),
		RouterID:  routerID,
		UserID:    userID,
		IPAddress: ipAddress,
	}
}

// CapabilitiesUpdatedEvent is emitted when router capabilities are detected or updated.
// This includes version detection, package changes, or hardware capability updates.
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

// Payload returns the JSON-serialized event payload.
func (e *CapabilitiesUpdatedEvent) Payload() ([]byte, error) {
	return json.Marshal(e)
}

// NewCapabilitiesUpdatedEvent creates a new CapabilitiesUpdatedEvent.
func NewCapabilitiesUpdatedEvent(
	routerID string,
	version string,
	majorVersion, minorVersion int,
	isCHR bool,
	supportedFeatures, installedPackages []string,
	architecture string,
	source string,
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

// -----------------------------------------------------------------------------
// Interface Events
// -----------------------------------------------------------------------------

// InterfaceStatusChangedEvent is emitted when an interface's operational status changes.
type InterfaceStatusChangedEvent struct {
	BaseEvent
	RouterID       string `json:"routerId"`
	InterfaceID    string `json:"interfaceId"`
	InterfaceName  string `json:"interfaceName"`
	Status         string `json:"status"`
	PreviousStatus string `json:"previousStatus"`
}

// Payload returns the JSON-serialized event payload.
func (e *InterfaceStatusChangedEvent) Payload() ([]byte, error) {
	return json.Marshal(e)
}

// NewInterfaceStatusChangedEvent creates a new InterfaceStatusChangedEvent.
func NewInterfaceStatusChangedEvent(
	routerID, interfaceID, interfaceName, status, previousStatus, source string,
) *InterfaceStatusChangedEvent {
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

// Payload returns the JSON-serialized event payload.
func (e *InterfaceTrafficUpdateEvent) Payload() ([]byte, error) {
	return json.Marshal(e)
}

// NewInterfaceTrafficUpdateEvent creates a new InterfaceTrafficUpdateEvent.
func NewInterfaceTrafficUpdateEvent(
	routerID, interfaceID, interfaceName string,
	txRate, rxRate, txTotal, rxTotal uint64,
	source string,
) *InterfaceTrafficUpdateEvent {
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
