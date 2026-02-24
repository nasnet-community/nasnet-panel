package bootstrap

import (
	"errors"

	"backend/internal/events"
)

// InitializeEventBus creates and configures the event bus with the given buffer size.
// bufferSize must be positive. Recommended values: 256 for production, 1024 for development.
// Returns an error if the EventBus creation fails or if bufferSize is invalid.
func InitializeEventBus(bufferSize int) (events.EventBus, error) {
	if bufferSize <= 0 {
		return nil, errors.New("bufferSize must be positive")
	}

	opts := events.DefaultEventBusOptions()
	opts.BufferSize = bufferSize
	return events.NewEventBus(opts)
}

// CreatePublisher creates a new event publisher for the given component.
// component must not be empty. Returns nil if bus is nil.
func CreatePublisher(bus events.EventBus, component string) *events.Publisher {
	if bus == nil || component == "" {
		return nil
	}
	return events.NewPublisher(bus, component)
}
