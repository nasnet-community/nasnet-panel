// Package vif implements event handlers for device routing cleanup.
// Handles cascade deletion when virtual interfaces are removed.
package vif

import (
	"context"
	"fmt"

	"go.uber.org/zap"

	"backend/generated/ent"
	"backend/generated/ent/devicerouting"
	"backend/internal/events"
	"backend/internal/vif/routing"
)

// EventHandler handles device routing events and cascade cleanup.
type EventHandler struct {
	pbrEngine *routing.PBREngine
	client    *ent.Client
	publisher *events.Publisher
	logger    *zap.Logger
}

// NewEventHandler creates a new event handler for device routing.
func NewEventHandler(pbrEngine *routing.PBREngine, client *ent.Client, publisher *events.Publisher, logger *zap.Logger) *EventHandler {
	if logger == nil {
		logger = zap.NewNop()
	}
	return &EventHandler{
		pbrEngine: pbrEngine,
		client:    client,
		publisher: publisher,
		logger:    logger.Named("vif-event-handler"),
	}
}

// HandleVirtualInterfaceDeleted handles the virtual interface deletion event.
// Performs cascade cleanup of all device routing assignments for the deleted interface.
//
// This ensures that when a service instance is deleted (which deletes its VirtualInterface),
// all device routing assignments are automatically cleaned up without leaving orphaned
// mangle rules on the router.
//
// Flow:
// 1. Extract interface_id from event
// 2. Query all DeviceRouting records for this interface
// 3. For each routing: remove mangle rule from router + delete DB record
// 4. Log cleanup count and emit cleanup event
func (h *EventHandler) HandleVirtualInterfaceDeleted(ctx context.Context, event events.Event) error {
	// Type assertion to get the specific event type
	// Note: The actual event type would depend on how VIF deletion events are structured
	// For now, we'll work with a generic event interface

	// Extract interface ID from event metadata
	// This assumes the event has metadata with interface_id
	interfaceID := h.extractInterfaceID(event)
	if interfaceID == "" {
		return fmt.Errorf("interface ID not found in event")
	}

	// Query all device routings for this interface
	routings, err := h.client.DeviceRouting.
		Query().
		Where(devicerouting.InterfaceIDEQ(interfaceID)).
		All(ctx)
	if err != nil {
		return fmt.Errorf("failed to query device routings for interface %s: %w", interfaceID, err)
	}

	if len(routings) == 0 {
		// No routings to clean up
		return nil
	}

	// Remove each routing (mangle rule + DB record)
	successCount := 0
	failureCount := 0
	for _, r := range routings {
		err := h.pbrEngine.RemoveDeviceRouting(ctx, r.DeviceID)
		if err != nil {
			// Log error but continue with other routings
			failureCount++
			h.logger.Error("failed to remove device routing", zap.Error(err), zap.String("device_id", r.DeviceID))
		} else {
			successCount++
		}
	}

	// Log cleanup summary
	h.logger.Info("virtual interface deleted: cascade cleanup complete",
		zap.String("interface_id", interfaceID),
		zap.Int("total_routings", len(routings)),
		zap.Int("succeeded", successCount),
		zap.Int("failed", failureCount))

	// Emit cleanup completion event
	if h.publisher != nil {
		cleanupEvent := events.NewBaseEvent(
			"device.routing.cascade.cleanup",
			events.PriorityNormal,
			"vif-event-handler",
		)
		if err := h.publisher.Publish(ctx, &cleanupEvent); err != nil { //nolint:revive,staticcheck // intentional no-op
		}
	}

	return nil
}

// HandleServiceInstanceDeleted handles service instance deletion events.
// This is an alternative handler if events are published at the service instance level
// rather than the VirtualInterface level.
func (h *EventHandler) HandleServiceInstanceDeleted(ctx context.Context, event events.Event) error {
	// Extract instance ID from event
	instanceID := h.extractInstanceID(event)
	if instanceID == "" {
		return fmt.Errorf("instance ID not found in event")
	}

	// Query all device routings for this instance
	routings, err := h.client.DeviceRouting.
		Query().
		Where(devicerouting.InstanceIDEQ(instanceID)).
		All(ctx)
	if err != nil {
		return fmt.Errorf("failed to query device routings for instance %s: %w", instanceID, err)
	}

	if len(routings) == 0 {
		// No routings to clean up
		return nil
	}

	// Remove each routing
	successCount := 0
	failureCount := 0
	for _, r := range routings {
		err := h.pbrEngine.RemoveDeviceRouting(ctx, r.DeviceID)
		if err != nil {
			failureCount++
			h.logger.Error("failed to remove device routing", zap.Error(err), zap.String("device_id", r.DeviceID))
		} else {
			successCount++
		}
	}

	// Log cleanup summary
	h.logger.Info("service instance deleted: cascade cleanup complete",
		zap.String("instance_id", instanceID),
		zap.Int("total_routings", len(routings)),
		zap.Int("succeeded", successCount),
		zap.Int("failed", failureCount))

	return nil
}

// extractInterfaceID extracts the interface ID from an event by type-switching
// on concrete event types that carry an InterfaceID field.
func (h *EventHandler) extractInterfaceID(event events.Event) string {
	switch e := event.(type) {
	case *events.InterfaceStatusChangedEvent:
		return e.InterfaceID
	case *events.InterfaceTrafficUpdateEvent:
		return e.InterfaceID
	case *events.GenericEvent:
		if id, ok := e.Data["interfaceId"].(string); ok {
			return id
		}
		if id, ok := e.Data["interface_id"].(string); ok {
			return id
		}
	}
	return ""
}

// extractInstanceID extracts the instance ID from an event by type-switching
// on concrete event types that carry an InstanceID field.
func (h *EventHandler) extractInstanceID(event events.Event) string {
	switch e := event.(type) {
	case *events.ServiceRemovedEvent:
		return e.InstanceID
	case *events.ServiceStateChangedEvent:
		return e.InstanceID
	case *events.ServiceCrashedEvent:
		return e.InstanceID
	case *events.ServiceRestartedEvent:
		return e.InstanceID
	case *events.ServiceKillSwitchEvent:
		return e.InstanceID
	case *events.GenericEvent:
		if id, ok := e.Data["instanceId"].(string); ok {
			return id
		}
		if id, ok := e.Data["instance_id"].(string); ok {
			return id
		}
	}
	return ""
}

// RegisterHandlers registers all device routing event handlers with the event bus.
// This should be called during application initialization.
func RegisterHandlers(_ context.Context, eventBus events.EventBus, handler *EventHandler) error {
	// Register handler for VirtualInterface status changes (e.g. interface goes down/deleted).
	// InterfaceStatusChangedEvent carries an InterfaceID which maps to DeviceRouting.InterfaceID.
	err := eventBus.Subscribe(events.EventTypeInterfaceStatusChanged, handler.HandleVirtualInterfaceDeleted)
	if err != nil {
		return fmt.Errorf("failed to subscribe to %s: %w", events.EventTypeInterfaceStatusChanged, err)
	}

	// Register handler for ServiceInstance removal events.
	// ServiceRemovedEvent carries an InstanceID which maps to DeviceRouting.InstanceID.
	err = eventBus.Subscribe(events.EventTypeServiceRemoved, handler.HandleServiceInstanceDeleted)
	if err != nil {
		return fmt.Errorf("failed to subscribe to %s: %w", events.EventTypeServiceRemoved, err)
	}

	return nil
}
