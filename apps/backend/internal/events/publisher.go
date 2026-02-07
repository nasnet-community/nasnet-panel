package events

import (
	"context"

	"github.com/oklog/ulid/v2"
)

// Publisher provides convenient methods for publishing typed events.
type Publisher struct {
	bus    EventBus
	source string
}

// NewPublisher creates a new Publisher with the given source identifier.
func NewPublisher(bus EventBus, source string) *Publisher {
	return &Publisher{
		bus:    bus,
		source: source,
	}
}

// PublishRouterStatusChanged publishes a router status change event.
func (p *Publisher) PublishRouterStatusChanged(ctx context.Context, routerID string, status, previousStatus RouterStatus) error {
	event := NewRouterStatusChangedEvent(routerID, status, previousStatus, p.source)
	return p.bus.Publish(ctx, event)
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
	event := NewResourceUpdatedEvent(resourceUUID, resourceType, routerID, version, ChangeTypeCreate, p.source)
	return p.bus.Publish(ctx, event)
}

// PublishResourceUpdated publishes a resource update event.
func (p *Publisher) PublishResourceUpdated(ctx context.Context, resourceUUID ulid.ULID, resourceType, routerID string, version int, changedFields []string) error {
	event := NewResourceUpdatedEvent(resourceUUID, resourceType, routerID, version, ChangeTypeUpdate, p.source)
	event.ChangedFields = changedFields
	return p.bus.Publish(ctx, event)
}

// PublishResourceDeleted publishes a resource deletion event.
func (p *Publisher) PublishResourceDeleted(ctx context.Context, resourceUUID ulid.ULID, resourceType, routerID string) error {
	event := NewResourceUpdatedEvent(resourceUUID, resourceType, routerID, 0, ChangeTypeDelete, p.source)
	return p.bus.Publish(ctx, event)
}

// PublishFeatureCrashed publishes a feature crash event.
func (p *Publisher) PublishFeatureCrashed(ctx context.Context, featureID, instanceID, routerID string, exitCode, crashCount int, lastError string, willRestart bool) error {
	event := NewFeatureCrashedEvent(featureID, instanceID, routerID, exitCode, crashCount, lastError, willRestart, p.source)
	return p.bus.Publish(ctx, event)
}

// PublishConfigApplyProgress publishes configuration apply progress.
func (p *Publisher) PublishConfigApplyProgress(ctx context.Context, operationID, routerID, stage string, progress, applied, total int, message string) error {
	event := NewConfigApplyProgressEvent(operationID, routerID, stage, progress, applied, total, message, p.source)
	return p.bus.Publish(ctx, event)
}

// PublishAuthLogin publishes a login event.
func (p *Publisher) PublishAuthLogin(ctx context.Context, userID, ipAddress, userAgent string, success bool, failReason string) error {
	event := NewAuthEvent(userID, "login", ipAddress, userAgent, success, failReason, p.source)
	return p.bus.Publish(ctx, event)
}

// PublishAuthLogout publishes a logout event.
func (p *Publisher) PublishAuthLogout(ctx context.Context, userID, ipAddress, userAgent string) error {
	event := NewAuthEvent(userID, "logout", ipAddress, userAgent, true, "", p.source)
	return p.bus.Publish(ctx, event)
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
	event := NewFeatureInstalledEvent(featureID, featureName, version, routerID, p.source)
	return p.bus.Publish(ctx, event)
}

// PublishRouterConnected publishes a router connection event.
func (p *Publisher) PublishRouterConnected(ctx context.Context, routerID, protocol, version string) error {
	event := NewRouterConnectedEvent(routerID, protocol, version, p.source)
	return p.bus.Publish(ctx, event)
}

// PublishRouterDisconnected publishes a router disconnection event.
func (p *Publisher) PublishRouterDisconnected(ctx context.Context, routerID, reason string) error {
	event := NewRouterDisconnectedEvent(routerID, reason, p.source)
	return p.bus.Publish(ctx, event)
}

// PublishMetricUpdated publishes a metric update event.
func (p *Publisher) PublishMetricUpdated(ctx context.Context, routerID, metricType string, values map[string]string) error {
	event := NewMetricUpdatedEvent(routerID, metricType, values, p.source)
	return p.bus.Publish(ctx, event)
}

// PublishLogAppended publishes a log append event.
func (p *Publisher) PublishLogAppended(ctx context.Context, routerID, level, message, topic string) error {
	event := NewLogAppendedEvent(routerID, level, message, topic, p.source)
	return p.bus.Publish(ctx, event)
}

// PublishConfigApplied publishes a configuration applied event.
func (p *Publisher) PublishConfigApplied(ctx context.Context, operationID, routerID string, resourcesCount int, resources []string) error {
	event := NewConfigAppliedEvent(operationID, routerID, resourcesCount, resources, p.source)
	return p.bus.Publish(ctx, event)
}

// PublishCredentialChanged publishes a credential change event.
// This event is used for audit logging and NEVER includes credential values.
func (p *Publisher) PublishCredentialChanged(ctx context.Context, routerID, userID, ipAddress string) error {
	event := NewCredentialChangedEvent(routerID, userID, ipAddress, p.source)
	return p.bus.Publish(ctx, event)
}

// PublishInterfaceStatusChanged publishes an interface status change event.
func (p *Publisher) PublishInterfaceStatusChanged(ctx context.Context, routerID, interfaceID, interfaceName, status, previousStatus string) error {
	event := NewInterfaceStatusChangedEvent(routerID, interfaceID, interfaceName, status, previousStatus, p.source)
	return p.bus.Publish(ctx, event)
}

// PublishInterfaceTrafficUpdate publishes an interface traffic update event.
func (p *Publisher) PublishInterfaceTrafficUpdate(ctx context.Context, routerID, interfaceID, interfaceName string, txRate, rxRate, txTotal, rxTotal uint64) error {
	event := NewInterfaceTrafficUpdateEvent(routerID, interfaceID, interfaceName, txRate, rxRate, txTotal, rxTotal, p.source)
	return p.bus.Publish(ctx, event)
}
