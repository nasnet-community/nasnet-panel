package events

import (
	"context"
	"time"

	"github.com/oklog/ulid/v2"
)

// Publisher provides convenient methods for publishing typed events.
type Publisher struct {
	bus    EventBus
	source string
}

// NewPublisher creates a new Publisher with the given source identifier.
func NewPublisher(bus EventBus, source string) *Publisher {
	return &Publisher{bus: bus, source: source}
}

// Publish is a generic method to publish any Event.
func (p *Publisher) Publish(ctx context.Context, event Event) error {
	return p.bus.Publish(ctx, event)
}

// PublishRouterStatusChanged publishes a router status change event.
func (p *Publisher) PublishRouterStatusChanged(ctx context.Context, routerID string, status, previousStatus RouterStatus) error {
	return p.bus.Publish(ctx, NewRouterStatusChangedEvent(routerID, status, previousStatus, p.source))
}

// PublishRouterStatusChangedWithError publishes a router status change event with error details.
func (p *Publisher) PublishRouterStatusChangedWithError(ctx context.Context, routerID string, status, previousStatus RouterStatus, protocol, errorMessage string) error {
	event := NewRouterStatusChangedEvent(routerID, status, previousStatus, p.source)
	event.Protocol = protocol
	event.ErrorMessage = errorMessage
	return p.bus.Publish(ctx, event)
}

// PublishResourceCreated publishes a resource creation event.
func (p *Publisher) PublishResourceCreated(ctx context.Context, resourceUUID ulid.ULID, resourceType, routerID string, version int) error {
	return p.bus.Publish(ctx, NewResourceUpdatedEvent(resourceUUID, resourceType, routerID, version, ChangeTypeCreate, p.source))
}

// PublishResourceUpdated publishes a resource update event.
func (p *Publisher) PublishResourceUpdated(ctx context.Context, resourceUUID ulid.ULID, resourceType, routerID string, version int, changedFields []string) error {
	event := NewResourceUpdatedEvent(resourceUUID, resourceType, routerID, version, ChangeTypeUpdate, p.source)
	event.ChangedFields = changedFields
	return p.bus.Publish(ctx, event)
}

// PublishResourceDeleted publishes a resource deletion event.
func (p *Publisher) PublishResourceDeleted(ctx context.Context, resourceUUID ulid.ULID, resourceType, routerID string) error {
	return p.bus.Publish(ctx, NewResourceUpdatedEvent(resourceUUID, resourceType, routerID, 0, ChangeTypeDelete, p.source))
}

// PublishFeatureCrashed publishes a feature crash event.
func (p *Publisher) PublishFeatureCrashed(ctx context.Context, featureID, instanceID, routerID string, exitCode, crashCount int, lastError string, willRestart bool) error {
	return p.bus.Publish(ctx, NewFeatureCrashedEvent(featureID, instanceID, routerID, exitCode, crashCount, lastError, willRestart, p.source))
}

// PublishFeatureHealthChanged publishes a service instance health state change event.
func (p *Publisher) PublishFeatureHealthChanged(ctx context.Context, event *FeatureHealthChangedEvent) error {
	return p.bus.Publish(ctx, event)
}

// PublishConfigApplyProgress publishes configuration apply progress.
func (p *Publisher) PublishConfigApplyProgress(ctx context.Context, operationID, routerID, stage string, progress, applied, total int, message string) error {
	return p.bus.Publish(ctx, NewConfigApplyProgressEvent(operationID, routerID, stage, progress, applied, total, message, p.source))
}

// PublishAuthLogin publishes a login event.
func (p *Publisher) PublishAuthLogin(ctx context.Context, userID, ipAddress, userAgent string, success bool, failReason string) error {
	return p.bus.Publish(ctx, NewAuthEvent(userID, "login", ipAddress, userAgent, success, failReason, p.source))
}

// PublishAuthLogout publishes a logout event.
func (p *Publisher) PublishAuthLogout(ctx context.Context, userID, ipAddress, userAgent string) error {
	return p.bus.Publish(ctx, NewAuthEvent(userID, "logout", ipAddress, userAgent, true, "", p.source))
}

// PublishAuthSessionRevoked publishes a session revocation event.
func (p *Publisher) PublishAuthSessionRevoked(ctx context.Context, userID, ipAddress, userAgent string) error {
	event := NewAuthEvent(userID, "session_revoked", ipAddress, userAgent, true, "", p.source)
	event.Type = EventTypeAuthSessionRevoked
	return p.bus.Publish(ctx, event)
}

// PublishAuthPasswordChanged publishes a password change event.
func (p *Publisher) PublishAuthPasswordChanged(ctx context.Context, userID, ipAddress, userAgent string) error {
	event := NewAuthEvent(userID, "password_changed", ipAddress, userAgent, true, "", p.source)
	event.Type = EventTypeAuthPasswordChanged
	return p.bus.Publish(ctx, event)
}

// PublishFeatureInstalled publishes a feature installation event.
func (p *Publisher) PublishFeatureInstalled(ctx context.Context, featureID, featureName, version, routerID string) error {
	return p.bus.Publish(ctx, NewFeatureInstalledEvent(featureID, featureName, version, routerID, p.source))
}

// PublishRouterConnected publishes a router connection event.
func (p *Publisher) PublishRouterConnected(ctx context.Context, routerID, protocol, version string) error {
	return p.bus.Publish(ctx, NewRouterConnectedEvent(routerID, protocol, version, p.source))
}

// PublishRouterDisconnected publishes a router disconnection event.
func (p *Publisher) PublishRouterDisconnected(ctx context.Context, routerID, reason string) error {
	return p.bus.Publish(ctx, NewRouterDisconnectedEvent(routerID, reason, p.source))
}

// PublishMetricUpdated publishes a metric update event.
func (p *Publisher) PublishMetricUpdated(ctx context.Context, routerID, metricType string, values map[string]string) error {
	return p.bus.Publish(ctx, NewMetricUpdatedEvent(routerID, metricType, values, p.source))
}

// PublishLogAppended publishes a log append event.
func (p *Publisher) PublishLogAppended(ctx context.Context, routerID, level, message, topic string) error {
	return p.bus.Publish(ctx, NewLogAppendedEvent(routerID, level, message, topic, p.source))
}

// PublishConfigApplied publishes a configuration applied event.
func (p *Publisher) PublishConfigApplied(ctx context.Context, operationID, routerID string, resourcesCount int, resources []string) error {
	return p.bus.Publish(ctx, NewConfigAppliedEvent(operationID, routerID, resourcesCount, resources, p.source))
}

// PublishCredentialChanged publishes a credential change event (NEVER includes credential values).
func (p *Publisher) PublishCredentialChanged(ctx context.Context, routerID, userID, ipAddress string) error {
	return p.bus.Publish(ctx, NewCredentialChangedEvent(routerID, userID, ipAddress, p.source))
}

// PublishInterfaceStatusChanged publishes an interface status change event.
func (p *Publisher) PublishInterfaceStatusChanged(ctx context.Context, routerID, interfaceID, interfaceName, status, previousStatus string) error {
	return p.bus.Publish(ctx, NewInterfaceStatusChangedEvent(routerID, interfaceID, interfaceName, status, previousStatus, p.source))
}

// PublishInterfaceTrafficUpdate publishes an interface traffic update event.
func (p *Publisher) PublishInterfaceTrafficUpdate(ctx context.Context, routerID, interfaceID, interfaceName string, txRate, rxRate, txTotal, rxTotal uint64) error {
	return p.bus.Publish(ctx, NewInterfaceTrafficUpdateEvent(routerID, interfaceID, interfaceName, txRate, rxRate, txTotal, rxTotal, p.source))
}

// PublishStorageMounted publishes a storage mounted event.
func (p *Publisher) PublishStorageMounted(ctx context.Context, path string, totalMB, freeMB, usedMB uint64, usedPct float64, fsType string) error {
	return p.bus.Publish(ctx, NewStorageMountedEvent(path, totalMB, freeMB, usedMB, usedPct, fsType, p.source))
}

// PublishStorageUnmounted publishes a storage unmounted event.
func (p *Publisher) PublishStorageUnmounted(ctx context.Context, path string) error {
	return p.bus.Publish(ctx, NewStorageUnmountedEvent(path, p.source))
}

// PublishStorageSpaceThreshold publishes a storage space threshold event.
func (p *Publisher) PublishStorageSpaceThreshold(ctx context.Context, path string, totalMB, freeMB, usedMB uint64, usedPct float64, level string) error {
	return p.bus.Publish(ctx, NewStorageSpaceThresholdEvent(path, totalMB, freeMB, usedMB, usedPct, level, p.source))
}

// PublishStorageConfigChanged publishes a storage configuration changed event.
func (p *Publisher) PublishStorageConfigChanged(ctx context.Context, featureID, instanceID, previousPath, newPath string, configVersion int) error {
	return p.bus.Publish(ctx, NewStorageConfigChangedEvent(featureID, instanceID, previousPath, newPath, configVersion, p.source))
}

// PublishStorageUnavailable publishes a storage unavailable event.
func (p *Publisher) PublishStorageUnavailable(ctx context.Context, featureID, instanceID, path, reason string) error {
	return p.bus.Publish(ctx, NewStorageUnavailableEvent(featureID, instanceID, path, reason, p.source))
}

// PublishBinaryVerified publishes a binary verification success event.
func (p *Publisher) PublishBinaryVerified(ctx context.Context, featureID, instanceID, routerID, version, archiveHash, binaryHash, gpgKeyID, checksumsURL, verifiedAt string, gpgVerified bool) error {
	return p.bus.Publish(ctx, NewBinaryVerifiedEvent(featureID, instanceID, routerID, version, archiveHash, binaryHash, gpgKeyID, checksumsURL, verifiedAt, p.source, gpgVerified))
}

// PublishBinaryVerificationFailed publishes a binary verification failure event.
func (p *Publisher) PublishBinaryVerificationFailed(ctx context.Context, featureID, instanceID, routerID, version, expectedHash, actualHash, checksumsURL, failureReason, suggestedAction, verifiedAt string) error {
	return p.bus.Publish(ctx, NewBinaryVerificationFailedEvent(featureID, instanceID, routerID, version, expectedHash, actualHash, checksumsURL, failureReason, suggestedAction, verifiedAt, p.source))
}

// PublishBinaryIntegrityFailed publishes a runtime integrity check failure event.
func (p *Publisher) PublishBinaryIntegrityFailed(ctx context.Context, featureID, instanceID, routerID, version, expectedHash, actualHash, installHash, checksumsURL, detectedAt string, willTerminate, securityIncident bool) error {
	return p.bus.Publish(ctx, NewBinaryIntegrityFailedEvent(featureID, instanceID, routerID, version, expectedHash, actualHash, installHash, checksumsURL, detectedAt, p.source, willTerminate, securityIncident))
}

// PublishBinaryIntegrityCheckStarted publishes a batch integrity check started event.
func (p *Publisher) PublishBinaryIntegrityCheckStarted(ctx context.Context, routerID string, instanceCount int, featureIDs []string, startedAt, reason string) error {
	return p.bus.Publish(ctx, NewBinaryIntegrityCheckStartedEvent(routerID, instanceCount, featureIDs, startedAt, reason, p.source))
}

// PublishDependencyAdded publishes a dependency added event.
func (p *Publisher) PublishDependencyAdded(ctx context.Context, fromInstanceID, toInstanceID, dependencyType string) error {
	return p.bus.Publish(ctx, NewDependencyAddedEvent(p.source, fromInstanceID, toInstanceID, dependencyType))
}

// PublishDependencyRemoved publishes a dependency removed event.
func (p *Publisher) PublishDependencyRemoved(ctx context.Context, fromInstanceID, toInstanceID string) error {
	return p.bus.Publish(ctx, NewDependencyRemovedEvent(p.source, fromInstanceID, toInstanceID))
}

// PublishBootSequenceStarted publishes a boot sequence started event.
func (p *Publisher) PublishBootSequenceStarted(ctx context.Context, instanceCount int, instanceIDs []string) error {
	return p.bus.Publish(ctx, NewBootSequenceStartedEvent(p.source, instanceCount, instanceIDs))
}

// PublishBootSequenceLayerComplete publishes a boot sequence layer complete event.
func (p *Publisher) PublishBootSequenceLayerComplete(ctx context.Context, layer int, instanceIDs []string, successCount, failureCount int) error {
	return p.bus.Publish(ctx, NewBootSequenceLayerCompleteEvent(p.source, layer, instanceIDs, successCount, failureCount))
}

// PublishBootSequenceComplete publishes a boot sequence complete event.
func (p *Publisher) PublishBootSequenceComplete(ctx context.Context, totalInstances, startedInstances, failedInstances int, durationMs int64, failedIDs []string) error {
	return p.bus.Publish(ctx, NewBootSequenceCompleteEvent(p.source, totalInstances, startedInstances, failedInstances, durationMs, failedIDs))
}

// PublishBootSequenceFailed publishes a boot sequence failed event.
func (p *Publisher) PublishBootSequenceFailed(ctx context.Context, layer int, failedInstanceID, errorMessage string, startedIDs []string) error {
	return p.bus.Publish(ctx, NewBootSequenceFailedEvent(p.source, layer, failedInstanceID, errorMessage, startedIDs))
}

// PublishIsolationViolation publishes an isolation violation event.
func (p *Publisher) PublishIsolationViolation(ctx context.Context, instanceID, featureID, routerID, violationType, currentValue, limitValue, severity, detectedAt, actionTaken, cgroupPath, errorMessage string, willTerminate bool, affectedPorts, affectedVLANs []string) error {
	return p.bus.Publish(ctx, NewIsolationViolationEvent(instanceID, featureID, routerID, violationType, currentValue, limitValue, severity, detectedAt, actionTaken, cgroupPath, errorMessage, p.source, willTerminate, affectedPorts, affectedVLANs))
}

// PublishTemplateInstallStarted publishes a template installation started event.
func (p *Publisher) PublishTemplateInstallStarted(ctx context.Context, templateID, templateName, routerID string, totalServices int, variables map[string]interface{}, requestedByUID string) error {
	return p.bus.Publish(ctx, NewTemplateInstallStartedEvent(templateID, templateName, routerID, totalServices, variables, requestedByUID, p.source))
}

// PublishTemplateInstallProgress publishes a template installation progress event.
func (p *Publisher) PublishTemplateInstallProgress(ctx context.Context, templateID, templateName, routerID string, totalServices, installedCount int, currentService, currentServiceID, phase, message string, startedAt time.Time) error {
	return p.bus.Publish(ctx, NewTemplateInstallProgressEvent(templateID, templateName, routerID, totalServices, installedCount, currentService, currentServiceID, phase, message, p.source, startedAt))
}

// PublishTemplateInstallCompleted publishes a template installation completed event.
func (p *Publisher) PublishTemplateInstallCompleted(ctx context.Context, templateID, templateName, routerID string, totalServices, installedCount int, instanceIDs []string, serviceMapping map[string]string, startedAt, completedAt time.Time) error {
	return p.bus.Publish(ctx, NewTemplateInstallCompletedEvent(templateID, templateName, routerID, totalServices, installedCount, instanceIDs, serviceMapping, startedAt, completedAt, p.source))
}

// PublishTemplateInstallFailed publishes a template installation failed event.
func (p *Publisher) PublishTemplateInstallFailed(ctx context.Context, templateID, templateName, routerID string, totalServices, installedCount int, failedService, errorMessage, errorPhase string, instanceIDs []string, serviceMapping map[string]string, startedAt, failedAt time.Time, rollbackNeeded bool) error {
	return p.bus.Publish(ctx, NewTemplateInstallFailedEvent(templateID, templateName, routerID, totalServices, installedCount, failedService, errorMessage, errorPhase, instanceIDs, serviceMapping, startedAt, failedAt, rollbackNeeded, p.source))
}
