package events

import "time"

// Event type constants following the pattern: domain.entity.action
const (
	// Router events
	EventTypeRouterStatusChanged   = "router.status.changed"
	EventTypeRouterConnected       = "router.connected"
	EventTypeRouterDisconnected    = "router.disconnected"
	EventTypeRouterDeleted         = "router.deleted"
	EventTypeCapabilitiesUpdated   = "router.capabilities.updated"

	// Resource events
	EventTypeResourceCreated = "resource.created"
	EventTypeResourceUpdated = "resource.updated"
	EventTypeResourceDeleted = "resource.deleted"
	EventTypeResourceWAN     = "resource.wan.modified"
	EventTypeResourceVPN     = "resource.vpn.modified"
	EventTypeResourceFW      = "resource.firewall.modified"

	// Feature events
	EventTypeFeatureInstalled = "feature.installed"
	EventTypeFeatureStarted   = "feature.started"
	EventTypeFeatureStopped   = "feature.stopped"
	EventTypeFeatureCrashed   = "feature.crashed"

	// Config events
	EventTypeConfigApplied       = "config.applied"
	EventTypeConfigApplyProgress = "config.apply.progress"

	// Auth events (security audit)
	EventTypeAuth                  = "auth.action"
	EventTypeAuthSessionRevoked    = "auth.session.revoked"
	EventTypeAuthPasswordChanged   = "auth.password.changed"
	EventTypeCredentialChanged     = "credential.changed"

	// Device scan events
	EventTypeDeviceScanStarted   = "device.scan.started"
	EventTypeDeviceScanProgress  = "device.scan.progress"
	EventTypeDeviceScanCompleted = "device.scan.completed"
	EventTypeDeviceScanFailed    = "device.scan.failed"
	EventTypeDeviceScanCancelled = "device.scan.cancelled"

	// Interface events
	EventTypeInterfaceStatusChanged = "interface.status.changed"
	EventTypeInterfaceTrafficUpdate = "interface.traffic.update"
	EventTypeInterfaceStatsUpdated  = "interface.stats.updated"

	// Telemetry events
	EventTypeMetricUpdated = "metric.updated"
	EventTypeLogAppended   = "log.appended"
	EventTypeRuntimePolled = "runtime.polled"
	EventTypeHealthChecked = "health.checked"
)

// CriticalEventTypes are events that must be persisted immediately to the warm tier.
// These events are essential for system state recovery and security audit.
var CriticalEventTypes = []string{
	EventTypeRouterStatusChanged,
	EventTypeResourceWAN,
	EventTypeResourceVPN,
	EventTypeResourceFW,
	EventTypeRouterDeleted,
	EventTypeConfigApplied,
	EventTypeFeatureInstalled,
	EventTypeFeatureCrashed,
	EventTypeAuthSessionRevoked,
	EventTypeAuthPasswordChanged,
}

// NormalEventTypes are events that go to warm tier during daily sync.
// These are important for audit and debugging but not critical for immediate recovery.
var NormalEventTypes = []string{
	EventTypeResourceCreated,
	EventTypeResourceUpdated,
	EventTypeResourceDeleted,
	EventTypeFeatureStarted,
	EventTypeFeatureStopped,
	EventTypeRouterConnected,
	EventTypeRouterDisconnected,
	EventTypeConfigApplyProgress,
	EventTypeAuth,
	EventTypeCapabilitiesUpdated,
	EventTypeDeviceScanStarted,
	EventTypeDeviceScanCompleted,
	EventTypeDeviceScanFailed,
	EventTypeDeviceScanCancelled,
	EventTypeInterfaceStatusChanged, // Interface status changes are auditable
}

// LowValueEventTypes are events that stay in hot tier only (memory/tmpfs).
// These are high-volume, low-value events that don't need persistence.
var LowValueEventTypes = []string{
	EventTypeMetricUpdated,
	EventTypeLogAppended,
	EventTypeRuntimePolled,
	EventTypeHealthChecked,
	EventTypeDeviceScanProgress,     // High-volume progress updates
	EventTypeInterfaceTrafficUpdate, // High-volume traffic metrics
	EventTypeInterfaceStatsUpdated,  // High-volume stats updates (NAS-6.9)
}

// IsCriticalEvent returns true if the event type requires immediate persistence.
func IsCriticalEvent(eventType string) bool {
	for _, t := range CriticalEventTypes {
		if t == eventType {
			return true
		}
	}
	return false
}

// IsNormalEvent returns true if the event type should be persisted during daily sync.
func IsNormalEvent(eventType string) bool {
	for _, t := range NormalEventTypes {
		if t == eventType {
			return true
		}
	}
	return false
}

// IsLowValueEvent returns true if the event type is high-volume/low-value.
func IsLowValueEvent(eventType string) bool {
	for _, t := range LowValueEventTypes {
		if t == eventType {
			return true
		}
	}
	return false
}

// EventTier represents the storage tier for an event per ADR-013.
type EventTier int

const (
	// TierHot is for all events - stored in memory/tmpfs for 24 hours
	TierHot EventTier = 0

	// TierWarm is for critical and normal events - stored in flash DB for 7-30 days
	TierWarm EventTier = 1

	// TierCold is for archived events - stored on external storage indefinitely
	TierCold EventTier = 2
)

// GetEventTier returns the appropriate storage tier for an event type.
func GetEventTier(eventType string) EventTier {
	if IsCriticalEvent(eventType) || IsNormalEvent(eventType) {
		return TierWarm
	}
	return TierHot
}

// GetEventRetention returns the retention duration for an event type.
func GetEventRetention(eventType string) time.Duration {
	if IsCriticalEvent(eventType) {
		return 30 * 24 * time.Hour // 30 days
	}
	if IsNormalEvent(eventType) {
		return 7 * 24 * time.Hour // 7 days
	}
	// Low value events: 24 hours in hot tier
	return 24 * time.Hour
}

// GetDefaultPriority returns the default priority for an event type.
func GetDefaultPriority(eventType string) Priority {
	if IsCriticalEvent(eventType) {
		// Most critical events need immediate delivery
		switch eventType {
		case EventTypeRouterStatusChanged, EventTypeFeatureCrashed:
			return PriorityImmediate
		default:
			return PriorityCritical
		}
	}
	if IsNormalEvent(eventType) {
		return PriorityNormal
	}
	return PriorityBackground
}

// ShouldImmediatelyPersist returns true if the event should be persisted immediately
// rather than waiting for the daily sync.
func ShouldImmediatelyPersist(eventType string) bool {
	// Only critical events sync immediately
	return IsCriticalEvent(eventType)
}

// ShouldBatchPersist returns true if the event should be batched for daily sync.
func ShouldBatchPersist(eventType string) bool {
	return IsNormalEvent(eventType) && !IsCriticalEvent(eventType)
}
