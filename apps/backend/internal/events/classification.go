package events

import "time"

// =============================================================================
// Event Type Constants
// =============================================================================

// Event type constants following the pattern: domain.entity.action
const (
	// Router events
	EventTypeRouterStatusChanged = "router.status.changed"
	EventTypeRouterConnected     = "router.connected"
	EventTypeRouterDisconnected  = "router.disconnected"
	EventTypeRouterDeleted       = "router.deleted"
	EventTypeCapabilitiesUpdated = "router.capabilities.updated"

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
	EventTypeAuth                = "auth.action"
	EventTypeAuthSessionRevoked  = "auth.session.revoked"
	EventTypeAuthPasswordChanged = "auth.password.changed"
	EventTypeCredentialChanged   = "credential.changed"

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
	EventTypeHealthChanged = "health.changed"

	// Alert events
	EventTypeAlertCreated = "alert.created"

	// Storage events
	EventTypeStorageMounted        = "storage.mounted"
	EventTypeStorageUnmounted      = "storage.unmounted"
	EventTypeStorageSpaceThreshold = "storage.space.threshold"
	EventTypeStorageConfigChanged  = "storage.config.changed"
	EventTypeStorageUnavailable    = "storage.unavailable"

	// Verification events
	EventTypeBinaryVerified              = "binary.verified"
	EventTypeBinaryVerificationFailed    = "binary.verification.failed"
	EventTypeBinaryIntegrityFailed       = "binary.integrity.failed"
	EventTypeBinaryIntegrityCheckStarted = "binary.integrity.check.started"

	// Dependency events (NAS-8.19)
	EventTypeDependencyAdded   = "dependency.added"
	EventTypeDependencyRemoved = "dependency.removed"

	// Boot sequence events (NAS-8.19)
	EventTypeBootSequenceStarted       = "boot.sequence.started"
	EventTypeBootSequenceLayerComplete = "boot.sequence.layer.complete"
	EventTypeBootSequenceComplete      = "boot.sequence.complete"
	EventTypeBootSequenceFailed        = "boot.sequence.failed"

	// Network events (NAS-8.14)
	EventTypeVLANPoolWarning = "vlan.pool.warning"

	// Isolation events (NAS-8.4)
	EventTypeIsolationViolation = "isolation.violation"
	EventTypeResourceWarning    = "resource.warning"

	// Resource monitoring events (NAS-8.4)
	EventTypeResourceOOM           = "resource.oom"
	EventTypeResourceLimitsChanged = "resource.limits.changed"

	// Routing chain events (NAS-8.10)
	EventTypeRoutingChainCreated = "routing.chain.created"
	EventTypeRoutingChainUpdated = "routing.chain.updated"
	EventTypeRoutingChainRemoved = "routing.chain.removed"
	EventTypeChainHopFailed      = "chain.hop.failed"
	EventTypeChainLatencyUpdated = "chain.latency.updated"

	// Traffic quota events (NAS-8.8)
	EventTypeQuotaWarning80 = "quota.warning.80"
	EventTypeQuotaWarning90 = "quota.warning.90"
	EventTypeQuotaExceeded  = "quota.exceeded"
	EventTypeQuotaReset     = "quota.reset"

	// Schedule events (NAS-8.11)
	EventTypeScheduleCreated     = "schedule.created"
	EventTypeScheduleUpdated     = "schedule.updated"
	EventTypeScheduleDeleted     = "schedule.deleted"
	EventTypeScheduleActivated   = "schedule.activated"
	EventTypeScheduleDeactivated = "schedule.deactivated"

	// Service events (NAS-8.17)
	EventTypeServiceStateChanged    = "service.state.changed"
	EventTypeServiceRestarted       = "service.restarted"
	EventTypeServiceHealth          = "service.health"
	EventTypeServiceUpdateAvailable = "service.update.available"
	EventTypeServiceKillSwitch      = "service.killswitch"
	EventTypeServiceCrashed         = "service.crashed"
	EventTypeServiceInstalled       = "service.installed"
	EventTypeServiceRemoved         = "service.removed"
	EventTypeServiceResourceWarning = "service.resource.warning"
	EventTypeServiceHealthFailing   = "service.health.failing"

	// Update events (NAS-8.7)
	EventTypeServiceUpdateStarted     = "service.update.started"
	EventTypeServiceUpdateDownloading = "service.update.downloading"
	EventTypeServiceUpdateVerifying   = "service.update.verifying"
	EventTypeServiceUpdateSwapping    = "service.update.swapping"
	EventTypeServiceUpdateMigrating   = "service.update.migrating"
	EventTypeServiceUpdateValidating  = "service.update.validating"
	EventTypeServiceUpdateCompleted   = "service.update.completed"
	EventTypeServiceUpdateFailed      = "service.update.failed"
	EventTypeServiceUpdateRolledBack  = "service.update.rolled_back"
	EventTypeServiceCrashIsolated     = "service.crash.isolated"

	// Template events (NAS-8.9)
	EventTypeTemplateInstallStarted   = "template.install.started"
	EventTypeTemplateInstallProgress  = "template.install.progress"
	EventTypeTemplateInstallCompleted = "template.install.completed"
	EventTypeTemplateInstallFailed    = "template.install.failed"
)

// =============================================================================
// Classification Tiers (ADR-013)
// =============================================================================

// CriticalEventTypes are events that must be persisted immediately to the warm tier.
var CriticalEventTypes = []string{
	EventTypeRouterStatusChanged, EventTypeResourceWAN, EventTypeResourceVPN, EventTypeResourceFW,
	EventTypeRouterDeleted, EventTypeConfigApplied, EventTypeFeatureInstalled, EventTypeFeatureCrashed,
	EventTypeAuthSessionRevoked, EventTypeAuthPasswordChanged, EventTypeAlertCreated,
	EventTypeStorageUnmounted, EventTypeStorageUnavailable, EventTypeBinaryVerificationFailed,
	EventTypeBinaryIntegrityFailed, EventTypeBootSequenceFailed, EventTypeIsolationViolation,
	EventTypeResourceOOM, EventTypeChainHopFailed, EventTypeServiceCrashed, EventTypeServiceKillSwitch,
	EventTypeServiceInstalled, EventTypeServiceRemoved, EventTypeServiceUpdateStarted,
	EventTypeServiceUpdateSwapping, EventTypeServiceUpdateCompleted, EventTypeServiceUpdateFailed,
	EventTypeServiceUpdateRolledBack, EventTypeServiceCrashIsolated, EventTypeTemplateInstallStarted,
	EventTypeTemplateInstallCompleted, EventTypeTemplateInstallFailed,
}

// NormalEventTypes are events that go to warm tier during daily sync.
var NormalEventTypes = []string{
	EventTypeResourceCreated, EventTypeResourceUpdated, EventTypeResourceDeleted,
	EventTypeFeatureStarted, EventTypeFeatureStopped, EventTypeRouterConnected,
	EventTypeRouterDisconnected, EventTypeConfigApplyProgress, EventTypeAuth,
	EventTypeCapabilitiesUpdated, EventTypeDeviceScanStarted, EventTypeDeviceScanCompleted,
	EventTypeDeviceScanFailed, EventTypeDeviceScanCancelled, EventTypeInterfaceStatusChanged,
	EventTypeStorageMounted, EventTypeStorageSpaceThreshold, EventTypeStorageConfigChanged,
	EventTypeBinaryVerified, EventTypeVLANPoolWarning, EventTypeResourceWarning,
	EventTypeResourceLimitsChanged, EventTypeRoutingChainCreated, EventTypeRoutingChainUpdated,
	EventTypeRoutingChainRemoved, EventTypeScheduleCreated, EventTypeScheduleUpdated,
	EventTypeScheduleDeleted, EventTypeScheduleActivated, EventTypeScheduleDeactivated,
	EventTypeHealthChanged, EventTypeServiceStateChanged, EventTypeServiceRestarted,
	EventTypeServiceHealthFailing, EventTypeServiceResourceWarning,
}

// LowValueEventTypes are events that stay in hot tier only (memory/tmpfs).
var LowValueEventTypes = []string{
	EventTypeMetricUpdated, EventTypeLogAppended, EventTypeRuntimePolled, EventTypeHealthChecked,
	EventTypeDeviceScanProgress, EventTypeInterfaceTrafficUpdate, EventTypeInterfaceStatsUpdated,
	EventTypeBinaryIntegrityCheckStarted, EventTypeChainLatencyUpdated, EventTypeServiceHealth,
	EventTypeServiceUpdateAvailable, EventTypeServiceUpdateDownloading, EventTypeServiceUpdateVerifying,
	EventTypeServiceUpdateMigrating, EventTypeServiceUpdateValidating, EventTypeTemplateInstallProgress,
}

func IsCriticalEvent(eventType string) bool {
	for _, t := range CriticalEventTypes {
		if t == eventType {
			return true
		}
	}
	return false
}

func IsNormalEvent(eventType string) bool {
	for _, t := range NormalEventTypes {
		if t == eventType {
			return true
		}
	}
	return false
}

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
	TierHot  EventTier = 0
	TierWarm EventTier = 1
	TierCold EventTier = 2
)

func GetEventTier(eventType string) EventTier {
	if IsCriticalEvent(eventType) || IsNormalEvent(eventType) {
		return TierWarm
	}
	return TierHot
}

func GetEventRetention(eventType string) time.Duration {
	if IsCriticalEvent(eventType) {
		return 30 * 24 * time.Hour
	}
	if IsNormalEvent(eventType) {
		return 7 * 24 * time.Hour
	}
	return 24 * time.Hour
}

func GetDefaultPriority(eventType string) Priority {
	if IsCriticalEvent(eventType) {
		switch eventType {
		case EventTypeRouterStatusChanged, EventTypeFeatureCrashed, EventTypeIsolationViolation, EventTypeResourceOOM,
			EventTypeServiceCrashed, EventTypeServiceKillSwitch:
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

func ShouldImmediatelyPersist(eventType string) bool {
	return IsCriticalEvent(eventType)
}

func ShouldBatchPersist(eventType string) bool {
	return IsNormalEvent(eventType) && !IsCriticalEvent(eventType)
}
