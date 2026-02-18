// Package isolation defines Kill Switch specific event types.
package isolation

import (
	"encoding/json"
	"time"

	"backend/internal/events"
)

// KillSwitchActivatedEvent is emitted when a kill switch is activated due to service failure.
type KillSwitchActivatedEvent struct {
	events.BaseEvent
	RoutingID    string    `json:"routingId"`
	DeviceID     string    `json:"deviceId"`
	MacAddress   string    `json:"macAddress"`
	InstanceID   string    `json:"instanceId"`
	Mode         string    `json:"mode"`
	ActivatedAt  time.Time `json:"activatedAt"`
	Reason       string    `json:"reason"`       // e.g., "service_unhealthy"
	HealthStatus string    `json:"healthStatus"` // Current health state of service
}

// Payload returns the JSON-serialized event payload.
func (e *KillSwitchActivatedEvent) Payload() ([]byte, error) {
	return json.Marshal(e)
}

// NewKillSwitchActivatedEvent creates a new kill switch activated event.
func NewKillSwitchActivatedEvent(
	routingID, deviceID, macAddress, instanceID, mode, reason, healthStatus string,
	activatedAt time.Time,
) *KillSwitchActivatedEvent {

	return &KillSwitchActivatedEvent{
		BaseEvent:    events.NewBaseEvent(events.EventTypeServiceKillSwitch, events.PriorityImmediate, "kill-switch-listener"),
		RoutingID:    routingID,
		DeviceID:     deviceID,
		MacAddress:   macAddress,
		InstanceID:   instanceID,
		Mode:         mode,
		ActivatedAt:  activatedAt,
		Reason:       reason,
		HealthStatus: healthStatus,
	}
}

// KillSwitchDeactivatedEvent is emitted when a kill switch is deactivated due to service recovery.
type KillSwitchDeactivatedEvent struct {
	events.BaseEvent
	RoutingID     string    `json:"routingId"`
	DeviceID      string    `json:"deviceId"`
	MacAddress    string    `json:"macAddress"`
	InstanceID    string    `json:"instanceId"`
	Mode          string    `json:"mode"`
	DeactivatedAt time.Time `json:"deactivatedAt"`
	ActiveFor     string    `json:"activeFor"` // Duration kill switch was active
	Reason        string    `json:"reason"`    // e.g., "service_recovered"
}

// Payload returns the JSON-serialized event payload.
func (e *KillSwitchDeactivatedEvent) Payload() ([]byte, error) {
	return json.Marshal(e)
}

// NewKillSwitchDeactivatedEvent creates a new kill switch deactivated event.
func NewKillSwitchDeactivatedEvent(
	routingID, deviceID, macAddress, instanceID, mode, activeFor, reason string,
	deactivatedAt time.Time,
) *KillSwitchDeactivatedEvent {

	return &KillSwitchDeactivatedEvent{
		BaseEvent:     events.NewBaseEvent("killswitch.deactivated", events.PriorityNormal, "kill-switch-listener"),
		RoutingID:     routingID,
		DeviceID:      deviceID,
		MacAddress:    macAddress,
		InstanceID:    instanceID,
		Mode:          mode,
		DeactivatedAt: deactivatedAt,
		ActiveFor:     activeFor,
		Reason:        reason,
	}
}
