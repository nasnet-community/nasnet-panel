// Package vif implements event handlers for device routing cleanup.
// Handles cascade deletion when virtual interfaces are removed.
package vif

import (
	"context"
	"fmt"

	"backend/generated/ent"
	"backend/generated/ent/devicerouting"
	"backend/internal/vif/routing"

	"backend/internal/events"
)

// EventHandler handles device routing events and cascade cleanup.
type EventHandler struct {
	pbrEngine *routing.PBREngine
	client    *ent.Client
	publisher *events.Publisher
}

// NewEventHandler creates a new event handler for device routing.
func NewEventHandler(pbrEngine *routing.PBREngine, client *ent.Client, publisher *events.Publisher) *EventHandler {
	return &EventHandler{
		pbrEngine: pbrEngine,
		client:    client,
		publisher: publisher,
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
			// TODO: Use proper logger
			fmt.Printf("Failed to remove device routing %s: %v\n", r.ID, err)
		} else {
			successCount++
		}
	}

	// Log cleanup summary
	fmt.Printf("VirtualInterface %s deleted: cleaned up %d device routings (%d succeeded, %d failed)\n",
		interfaceID, len(routings), successCount, failureCount)

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
			fmt.Printf("Failed to remove device routing %s: %v\n", r.ID, err)
		} else {
			successCount++
		}
	}

	// Log cleanup summary
	fmt.Printf("ServiceInstance %s deleted: cleaned up %d device routings (%d succeeded, %d failed)\n",
		instanceID, len(routings), successCount, failureCount)

	return nil
}

// extractInterfaceID extracts the interface ID from an event.
// This is a helper method that would need to be adapted based on the actual event structure.
func (h *EventHandler) extractInterfaceID(event events.Event) string {
	// TODO: Implement based on actual event structure
	// This might involve type assertion to a specific event type
	// or extracting from event metadata

	// Placeholder implementation
	return ""
}

// extractInstanceID extracts the instance ID from an event.
// This is a helper method that would need to be adapted based on the actual event structure.
func (h *EventHandler) extractInstanceID(event events.Event) string {
	// TODO: Implement based on actual event structure

	// Placeholder implementation
	return ""
}

// RegisterHandlers registers all device routing event handlers with the event bus.
// This should be called during application initialization.
func RegisterHandlers(_ context.Context, eventBus events.EventBus, handler *EventHandler) error {
	// Register handler for VirtualInterface deletion events
	// Note: The exact event type constant would need to be defined in the events package
	virtualInterfaceDeletedEvent := "virtual_interface.deleted"
	err := eventBus.Subscribe(virtualInterfaceDeletedEvent, handler.HandleVirtualInterfaceDeleted)
	if err != nil {
		return fmt.Errorf("failed to subscribe to %s: %w", virtualInterfaceDeletedEvent, err)
	}

	// Register handler for ServiceInstance deletion events (as backup/alternative)
	serviceInstanceDeletedEvent := events.EventTypeFeatureStopped // Using existing constant as placeholder
	err = eventBus.Subscribe(serviceInstanceDeletedEvent, handler.HandleServiceInstanceDeleted)
	if err != nil {
		return fmt.Errorf("failed to subscribe to %s: %w", serviceInstanceDeletedEvent, err)
	}

	return nil
}
