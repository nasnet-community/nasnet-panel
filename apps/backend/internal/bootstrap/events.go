package bootstrap

import (
	"backend/internal/events"
)

// InitializeEventBus creates and configures the event bus with the given buffer size.
func InitializeEventBus(bufferSize int) (events.EventBus, error) {
	opts := events.DefaultEventBusOptions()
	opts.BufferSize = bufferSize
	return events.NewEventBus(opts)
}

// CreatePublisher creates a new event publisher for the given component.
func CreatePublisher(bus events.EventBus, component string) *events.Publisher {
	return events.NewPublisher(bus, component)
}
