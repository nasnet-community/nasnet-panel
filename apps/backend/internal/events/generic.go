package events

import (
	"encoding/json"
)

// GenericEvent is a simple event for cases where a specific event type doesn't exist yet.
// It embeds BaseEvent and holds arbitrary key-value data.
type GenericEvent struct {
	BaseEvent
	Data map[string]interface{} `json:"data"`
}

// Payload returns the JSON-serialized event payload.
func (e *GenericEvent) Payload() ([]byte, error) {
	return json.Marshal(e)
}

// NewGenericEvent creates a new GenericEvent with the given type, priority, source, and data.
func NewGenericEvent(eventType string, priority Priority, source string, data map[string]interface{}) *GenericEvent {
	return &GenericEvent{
		BaseEvent: NewBaseEvent(eventType, priority, source),
		Data:      data,
	}
}
