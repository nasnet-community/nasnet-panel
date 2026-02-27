package events

import (
	"context"
	"fmt"
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
	if bus == nil {
		panic("bus must not be nil")
	}
	return &Publisher{bus: bus, source: source}
}

// Publish is a generic method to publish any Event.
func (p *Publisher) Publish(ctx context.Context, event Event) error {
	if event == nil {
		return fmt.Errorf("event cannot be nil")
	}
	if err := p.bus.Publish(ctx, event); err != nil {
		return fmt.Errorf("publish event: %w", err)
	}
	return nil
}

// PublishRouterStatusChanged publishes a router status change event.
func (p *Publisher) PublishRouterStatusChanged(ctx context.Context, routerID string, status, previousStatus RouterStatus) error {
	if err := p.bus.Publish(ctx, NewRouterStatusChangedEvent(routerID, status, previousStatus, p.source)); err != nil {
		return fmt.Errorf("publish router status changed: %w", err)
	}
	return nil
}

// PublishRouterStatusChangedWithError publishes a router status change event with error details.
func (p *Publisher) PublishRouterStatusChangedWithError(ctx context.Context, routerID string, status, previousStatus RouterStatus, protocol, errorMessage string) error {
	event := NewRouterStatusChangedEvent(routerID, status, previousStatus, p.source)
	event.Protocol = protocol
	event.ErrorMessage = errorMessage
	if err := p.bus.Publish(ctx, event); err != nil {
		return fmt.Errorf("publish router status changed with error: %w", err)
	}
	return nil
}

// PublishResourceCreated publishes a resource creation event.
func (p *Publisher) PublishResourceCreated(ctx context.Context, resourceUUID ulid.ULID, resourceType, routerID string, version int) error {
	if err := p.bus.Publish(ctx, NewResourceUpdatedEvent(resourceUUID, resourceType, routerID, version, ChangeTypeCreate, p.source)); err != nil {
		return fmt.Errorf("publish resource created: %w", err)
	}
	return nil
}

// PublishResourceUpdated publishes a resource update event.
func (p *Publisher) PublishResourceUpdated(ctx context.Context, resourceUUID ulid.ULID, resourceType, routerID string, version int, changedFields []string) error {
	event := NewResourceUpdatedEvent(resourceUUID, resourceType, routerID, version, ChangeTypeUpdate, p.source)
	event.ChangedFields = changedFields
	if err := p.bus.Publish(ctx, event); err != nil {
		return fmt.Errorf("publish resource updated: %w", err)
	}
	return nil
}

// PublishResourceDeleted publishes a resource deletion event.
func (p *Publisher) PublishResourceDeleted(ctx context.Context, resourceUUID ulid.ULID, resourceType, routerID string) error {
	if err := p.bus.Publish(ctx, NewResourceUpdatedEvent(resourceUUID, resourceType, routerID, 0, ChangeTypeDelete, p.source)); err != nil {
		return fmt.Errorf("publish resource deleted: %w", err)
	}
	return nil
}

// PublishFeatureCrashed publishes a feature crash event.
func (p *Publisher) PublishFeatureCrashed(ctx context.Context, featureID, instanceID, routerID string, exitCode, crashCount int, lastError string, willRestart bool) error {
	if err := p.bus.Publish(ctx, NewFeatureCrashedEvent(featureID, instanceID, routerID, exitCode, crashCount, lastError, willRestart, p.source)); err != nil {
		return fmt.Errorf("publish feature crashed: %w", err)
	}
	return nil
}

// PublishFeatureHealthChanged publishes a service instance health state change event.
func (p *Publisher) PublishFeatureHealthChanged(ctx context.Context, event *FeatureHealthChangedEvent) error {
	if err := p.bus.Publish(ctx, event); err != nil {
		return fmt.Errorf("publish feature health changed: %w", err)
	}
	return nil
}

// PublishConfigApplyProgress publishes configuration apply progress.
func (p *Publisher) PublishConfigApplyProgress(ctx context.Context, operationID, routerID, stage string, progress, applied, total int, message string) error {
	if err := p.bus.Publish(ctx, NewConfigApplyProgressEvent(operationID, routerID, stage, progress, applied, total, message, p.source)); err != nil {
		return fmt.Errorf("publish config apply progress: %w", err)
	}
	return nil
}

// PublishAuthLogin publishes a login event.
func (p *Publisher) PublishAuthLogin(ctx context.Context, userID, ipAddress, userAgent string, success bool, failReason string) error {
	if err := p.bus.Publish(ctx, NewAuthEvent(userID, "login", ipAddress, userAgent, success, failReason, p.source)); err != nil {
		return fmt.Errorf("publish auth login: %w", err)
	}
	return nil
}

// PublishAuthLogout publishes a logout event.
func (p *Publisher) PublishAuthLogout(ctx context.Context, userID, ipAddress, userAgent string) error {
	if err := p.bus.Publish(ctx, NewAuthEvent(userID, "logout", ipAddress, userAgent, true, "", p.source)); err != nil {
		return fmt.Errorf("publish auth logout: %w", err)
	}
	return nil
}

// PublishAuthSessionRevoked publishes a session revocation event.
func (p *Publisher) PublishAuthSessionRevoked(ctx context.Context, userID, ipAddress, userAgent string) error {
	event := NewAuthEvent(userID, "session_revoked", ipAddress, userAgent, true, "", p.source)
	event.Type = EventTypeAuthSessionRevoked
	if err := p.bus.Publish(ctx, event); err != nil {
		return fmt.Errorf("publish auth session revoked: %w", err)
	}
	return nil
}

// PublishAuthPasswordChanged publishes a password change event.
func (p *Publisher) PublishAuthPasswordChanged(ctx context.Context, userID, ipAddress, userAgent string) error {
	event := NewAuthEvent(userID, "password_changed", ipAddress, userAgent, true, "", p.source)
	event.Type = EventTypeAuthPasswordChanged
	if err := p.bus.Publish(ctx, event); err != nil {
		return fmt.Errorf("publish auth password changed: %w", err)
	}
	return nil
}

// PublishFeatureInstalled publishes a feature installation event.
func (p *Publisher) PublishFeatureInstalled(ctx context.Context, featureID, featureName, version, routerID string) error {
	if err := p.bus.Publish(ctx, NewFeatureInstalledEvent(featureID, featureName, version, routerID, p.source)); err != nil {
		return fmt.Errorf("publish feature installed: %w", err)
	}
	return nil
}

// PublishRouterConnected publishes a router connection event.
func (p *Publisher) PublishRouterConnected(ctx context.Context, routerID, protocol, version string) error {
	if err := p.bus.Publish(ctx, NewRouterConnectedEvent(routerID, protocol, version, p.source)); err != nil {
		return fmt.Errorf("publish router connected: %w", err)
	}
	return nil
}

// PublishRouterDisconnected publishes a router disconnection event.
func (p *Publisher) PublishRouterDisconnected(ctx context.Context, routerID, reason string) error {
	if err := p.bus.Publish(ctx, NewRouterDisconnectedEvent(routerID, reason, p.source)); err != nil {
		return fmt.Errorf("publish router disconnected: %w", err)
	}
	return nil
}

// PublishMetricUpdated publishes a metric update event.
func (p *Publisher) PublishMetricUpdated(ctx context.Context, routerID, metricType string, values map[string]string) error {
	if err := p.bus.Publish(ctx, NewMetricUpdatedEvent(routerID, metricType, values, p.source)); err != nil {
		return fmt.Errorf("publish metric updated: %w", err)
	}
	return nil
}

// PublishLogAppended publishes a log append event.
func (p *Publisher) PublishLogAppended(ctx context.Context, routerID, level, message, topic string) error {
	if err := p.bus.Publish(ctx, NewLogAppendedEvent(routerID, level, message, topic, p.source)); err != nil {
		return fmt.Errorf("publish log appended: %w", err)
	}
	return nil
}

// PublishConfigApplied publishes a configuration applied event.
func (p *Publisher) PublishConfigApplied(ctx context.Context, operationID, routerID string, resourcesCount int, resources []string) error {
	if err := p.bus.Publish(ctx, NewConfigAppliedEvent(operationID, routerID, resourcesCount, resources, p.source)); err != nil {
		return fmt.Errorf("publish config applied: %w", err)
	}
	return nil
}

// PublishCredentialChanged publishes a credential change event (NEVER includes credential values).
func (p *Publisher) PublishCredentialChanged(ctx context.Context, routerID, userID, ipAddress string) error {
	if err := p.bus.Publish(ctx, NewCredentialChangedEvent(routerID, userID, ipAddress, p.source)); err != nil {
		return fmt.Errorf("publish credential changed: %w", err)
	}
	return nil
}

// PublishInterfaceStatusChanged publishes an interface status change event.
func (p *Publisher) PublishInterfaceStatusChanged(ctx context.Context, routerID, interfaceID, interfaceName, status, previousStatus string) error {
	if err := p.bus.Publish(ctx, NewInterfaceStatusChangedEvent(routerID, interfaceID, interfaceName, status, previousStatus, p.source)); err != nil {
		return fmt.Errorf("publish interface status changed: %w", err)
	}
	return nil
}

// PublishInterfaceTrafficUpdate publishes an interface traffic update event.
func (p *Publisher) PublishInterfaceTrafficUpdate(ctx context.Context, routerID, interfaceID, interfaceName string, txRate, rxRate, txTotal, rxTotal uint64) error {
	if err := p.bus.Publish(ctx, NewInterfaceTrafficUpdateEvent(routerID, interfaceID, interfaceName, txRate, rxRate, txTotal, rxTotal, p.source)); err != nil {
		return fmt.Errorf("publish interface traffic update: %w", err)
	}
	return nil
}

// PublishStorageMounted publishes a storage mounted event.
func (p *Publisher) PublishStorageMounted(ctx context.Context, path string, totalMB, freeMB, usedMB uint64, usedPct float64, fsType string) error {
	if err := p.bus.Publish(ctx, NewStorageMountedEvent(path, totalMB, freeMB, usedMB, usedPct, fsType, p.source)); err != nil {
		return fmt.Errorf("publish storage mounted: %w", err)
	}
	return nil
}

// PublishStorageUnmounted publishes a storage unmounted event.
func (p *Publisher) PublishStorageUnmounted(ctx context.Context, path string) error {
	if err := p.bus.Publish(ctx, NewStorageUnmountedEvent(path, p.source)); err != nil {
		return fmt.Errorf("publish storage unmounted: %w", err)
	}
	return nil
}

// PublishStorageSpaceThreshold publishes a storage space threshold event.
func (p *Publisher) PublishStorageSpaceThreshold(ctx context.Context, path string, totalMB, freeMB, usedMB uint64, usedPct float64, level string) error {
	if err := p.bus.Publish(ctx, NewStorageSpaceThresholdEvent(path, totalMB, freeMB, usedMB, usedPct, level, p.source)); err != nil {
		return fmt.Errorf("publish storage space threshold: %w", err)
	}
	return nil
}

// PublishStorageConfigChanged publishes a storage configuration changed event.
func (p *Publisher) PublishStorageConfigChanged(ctx context.Context, featureID, instanceID, previousPath, newPath string, configVersion int) error {
	if err := p.bus.Publish(ctx, NewStorageConfigChangedEvent(featureID, instanceID, previousPath, newPath, configVersion, p.source)); err != nil {
		return fmt.Errorf("publish storage config changed: %w", err)
	}
	return nil
}

// PublishStorageUnavailable publishes a storage unavailable event.
func (p *Publisher) PublishStorageUnavailable(ctx context.Context, featureID, instanceID, path, reason string) error {
	if err := p.bus.Publish(ctx, NewStorageUnavailableEvent(featureID, instanceID, path, reason, p.source)); err != nil {
		return fmt.Errorf("publish storage unavailable: %w", err)
	}
	return nil
}

// PublishBinaryVerified publishes a binary verification success event.
func (p *Publisher) PublishBinaryVerified(ctx context.Context, featureID, instanceID, routerID, version, archiveHash, binaryHash, gpgKeyID, checksumsURL, verifiedAt string, gpgVerified bool) error {
	if err := p.bus.Publish(ctx, NewBinaryVerifiedEvent(featureID, instanceID, routerID, version, archiveHash, binaryHash, gpgKeyID, checksumsURL, verifiedAt, p.source, gpgVerified)); err != nil {
		return fmt.Errorf("publish binary verified: %w", err)
	}
	return nil
}

// PublishBinaryVerificationFailed publishes a binary verification failure event.
func (p *Publisher) PublishBinaryVerificationFailed(ctx context.Context, featureID, instanceID, routerID, version, expectedHash, actualHash, checksumsURL, failureReason, suggestedAction, verifiedAt string) error {
	if err := p.bus.Publish(ctx, NewBinaryVerificationFailedEvent(featureID, instanceID, routerID, version, expectedHash, actualHash, checksumsURL, failureReason, suggestedAction, verifiedAt, p.source)); err != nil {
		return fmt.Errorf("publish binary verification failed: %w", err)
	}
	return nil
}

// PublishBinaryIntegrityFailed publishes a runtime integrity check failure event.
func (p *Publisher) PublishBinaryIntegrityFailed(ctx context.Context, featureID, instanceID, routerID, version, expectedHash, actualHash, installHash, checksumsURL, detectedAt string, willTerminate, securityIncident bool) error {
	if err := p.bus.Publish(ctx, NewBinaryIntegrityFailedEvent(featureID, instanceID, routerID, version, expectedHash, actualHash, installHash, checksumsURL, detectedAt, p.source, willTerminate, securityIncident)); err != nil {
		return fmt.Errorf("publish binary integrity failed: %w", err)
	}
	return nil
}

// PublishBinaryIntegrityCheckStarted publishes a batch integrity check started event.
func (p *Publisher) PublishBinaryIntegrityCheckStarted(ctx context.Context, routerID string, instanceCount int, featureIDs []string, startedAt, reason string) error {
	if err := p.bus.Publish(ctx, NewBinaryIntegrityCheckStartedEvent(routerID, instanceCount, featureIDs, startedAt, reason, p.source)); err != nil {
		return fmt.Errorf("publish binary integrity check started: %w", err)
	}
	return nil
}

// PublishDependencyAdded publishes a dependency added event.
func (p *Publisher) PublishDependencyAdded(ctx context.Context, fromInstanceID, toInstanceID, dependencyType string) error {
	if err := p.bus.Publish(ctx, NewDependencyAddedEvent(p.source, fromInstanceID, toInstanceID, dependencyType)); err != nil {
		return fmt.Errorf("publish dependency added: %w", err)
	}
	return nil
}

// PublishDependencyRemoved publishes a dependency removed event.
func (p *Publisher) PublishDependencyRemoved(ctx context.Context, fromInstanceID, toInstanceID string) error {
	if err := p.bus.Publish(ctx, NewDependencyRemovedEvent(p.source, fromInstanceID, toInstanceID)); err != nil {
		return fmt.Errorf("publish dependency removed: %w", err)
	}
	return nil
}

// PublishBootSequenceStarted publishes a boot sequence started event.
func (p *Publisher) PublishBootSequenceStarted(ctx context.Context, instanceCount int, instanceIDs []string) error {
	if err := p.bus.Publish(ctx, NewBootSequenceStartedEvent(p.source, instanceCount, instanceIDs)); err != nil {
		return fmt.Errorf("publish boot sequence started: %w", err)
	}
	return nil
}

// PublishBootSequenceLayerComplete publishes a boot sequence layer complete event.
func (p *Publisher) PublishBootSequenceLayerComplete(ctx context.Context, layer int, instanceIDs []string, successCount, failureCount int) error {
	if err := p.bus.Publish(ctx, NewBootSequenceLayerCompleteEvent(p.source, layer, instanceIDs, successCount, failureCount)); err != nil {
		return fmt.Errorf("publish boot sequence layer complete: %w", err)
	}
	return nil
}

// PublishBootSequenceComplete publishes a boot sequence complete event.
func (p *Publisher) PublishBootSequenceComplete(ctx context.Context, totalInstances, startedInstances, failedInstances int, durationMs int64, failedIDs []string) error {
	if err := p.bus.Publish(ctx, NewBootSequenceCompleteEvent(p.source, totalInstances, startedInstances, failedInstances, durationMs, failedIDs)); err != nil {
		return fmt.Errorf("publish boot sequence complete: %w", err)
	}
	return nil
}

// PublishBootSequenceFailed publishes a boot sequence failed event.
func (p *Publisher) PublishBootSequenceFailed(ctx context.Context, layer int, failedInstanceID, errorMessage string, startedIDs []string) error {
	if err := p.bus.Publish(ctx, NewBootSequenceFailedEvent(p.source, layer, failedInstanceID, errorMessage, startedIDs)); err != nil {
		return fmt.Errorf("publish boot sequence failed: %w", err)
	}
	return nil
}

// PublishIsolationViolation publishes an isolation violation event.
func (p *Publisher) PublishIsolationViolation(ctx context.Context, instanceID, featureID, routerID, violationType, currentValue, limitValue, severity, detectedAt, actionTaken, cgroupPath, errorMessage string, willTerminate bool, affectedPorts, affectedVLANs []string) error {
	if err := p.bus.Publish(ctx, NewIsolationViolationEvent(instanceID, featureID, routerID, violationType, currentValue, limitValue, severity, detectedAt, actionTaken, cgroupPath, errorMessage, p.source, willTerminate, affectedPorts, affectedVLANs)); err != nil {
		return fmt.Errorf("publish isolation violation: %w", err)
	}
	return nil
}

// PublishTemplateInstallStarted publishes a template installation started event.
func (p *Publisher) PublishTemplateInstallStarted(ctx context.Context, templateID, templateName, routerID string, totalServices int, variables map[string]interface{}, requestedByUID string) error {
	if err := p.bus.Publish(ctx, NewTemplateInstallStartedEvent(templateID, templateName, routerID, totalServices, variables, requestedByUID, p.source)); err != nil {
		return fmt.Errorf("publish template install started: %w", err)
	}
	return nil
}

// PublishTemplateInstallProgress publishes a template installation progress event.
func (p *Publisher) PublishTemplateInstallProgress(ctx context.Context, templateID, templateName, routerID string, totalServices, installedCount int, currentService, currentServiceID, phase, message string, startedAt time.Time) error {
	if err := p.bus.Publish(ctx, NewTemplateInstallProgressEvent(templateID, templateName, routerID, totalServices, installedCount, currentService, currentServiceID, phase, message, p.source, startedAt)); err != nil {
		return fmt.Errorf("publish template install progress: %w", err)
	}
	return nil
}

// PublishTemplateInstallCompleted publishes a template installation completed event.
func (p *Publisher) PublishTemplateInstallCompleted(ctx context.Context, templateID, templateName, routerID string, totalServices, installedCount int, instanceIDs []string, serviceMapping map[string]string, startedAt, completedAt time.Time) error {
	if err := p.bus.Publish(ctx, NewTemplateInstallCompletedEvent(templateID, templateName, routerID, totalServices, installedCount, instanceIDs, serviceMapping, startedAt, completedAt, p.source)); err != nil {
		return fmt.Errorf("publish template install completed: %w", err)
	}
	return nil
}

// PublishTemplateInstallFailed publishes a template installation failed event.
func (p *Publisher) PublishTemplateInstallFailed(ctx context.Context, templateID, templateName, routerID string, totalServices, installedCount int, failedService, errorMessage, errorPhase string, instanceIDs []string, serviceMapping map[string]string, startedAt, failedAt time.Time, rollbackNeeded bool) error {
	if err := p.bus.Publish(ctx, NewTemplateInstallFailedEvent(templateID, templateName, routerID, totalServices, installedCount, failedService, errorMessage, errorPhase, instanceIDs, serviceMapping, startedAt, failedAt, rollbackNeeded, p.source)); err != nil {
		return fmt.Errorf("publish template install failed: %w", err)
	}
	return nil
}
