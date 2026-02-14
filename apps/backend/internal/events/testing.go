package events

import (
	"context"
	"strings"
	"sync"
)

// NewInMemoryEventBus creates an in-memory event bus for testing.
// This is a convenience wrapper that provides a simple event bus implementation
// for unit tests without the complexity of Watermill.
func NewInMemoryEventBus() *InMemoryEventBus {
	return &InMemoryEventBus{
		handlers:   make(map[string][]EventHandler),
		allEvents:  make([]Event, 0),
		channels:   make(map[string][]chan interface{}),
		allHandler: make([]EventHandler, 0),
	}
}

// InMemoryEventBus is a simple in-memory event bus for testing.
// It stores all published events and allows synchronous subscription.
// Implements the EventBus interface.
type InMemoryEventBus struct {
	mu         sync.RWMutex
	handlers   map[string][]EventHandler
	allHandler []EventHandler
	allEvents  []Event
	channels   map[string][]chan interface{}
}

// Publish publishes an event to all subscribers.
// Implements EventBus.Publish.
func (b *InMemoryEventBus) Publish(ctx context.Context, event Event) error {
	b.mu.Lock()
	defer b.mu.Unlock()

	b.allEvents = append(b.allEvents, event)

	// Call all-events handlers
	for _, handler := range b.allHandler {
		_ = handler(ctx, event)
	}

	// Call type-specific handlers
	if handlers, ok := b.handlers[event.GetType()]; ok {
		for _, handler := range handlers {
			_ = handler(ctx, event)
		}
	}

	// Send to wildcard pattern channels (for legacy tests using Subscribe())
	for pattern, channels := range b.channels {
		if matchesPattern(event.GetType(), pattern) {
			for _, ch := range channels {
				select {
				case ch <- event:
				case <-ctx.Done():
					return ctx.Err()
				default:
					// Drop event if channel is full (prevent blocking)
				}
			}
		}
	}

	return nil
}

// Subscribe subscribes to events of a specific type.
// Implements EventBus.Subscribe.
func (b *InMemoryEventBus) Subscribe(eventType string, handler EventHandler) error {
	b.mu.Lock()
	defer b.mu.Unlock()

	if b.handlers[eventType] == nil {
		b.handlers[eventType] = make([]EventHandler, 0)
	}
	b.handlers[eventType] = append(b.handlers[eventType], handler)

	return nil
}

// SubscribeAll subscribes to all events.
// Implements EventBus.SubscribeAll.
func (b *InMemoryEventBus) SubscribeAll(handler EventHandler) error {
	b.mu.Lock()
	defer b.mu.Unlock()

	b.allHandler = append(b.allHandler, handler)

	return nil
}

// Close closes the event bus.
// Implements EventBus.Close.
func (b *InMemoryEventBus) Close() error {
	b.mu.Lock()
	defer b.mu.Unlock()

	// Close all channels
	for _, channels := range b.channels {
		for _, ch := range channels {
			close(ch)
		}
	}
	b.channels = make(map[string][]chan interface{})

	return nil
}

// SubscribeChannel subscribes to events matching the given pattern via a channel.
// This is a legacy method for tests that use channel-based subscription.
// Pattern can be an exact type or a wildcard pattern like "wan.*".
func (b *InMemoryEventBus) SubscribeChannel(ctx context.Context, pattern string) <-chan interface{} {
	b.mu.Lock()
	defer b.mu.Unlock()

	ch := make(chan interface{}, 100)

	if b.channels[pattern] == nil {
		b.channels[pattern] = make([]chan interface{}, 0)
	}
	b.channels[pattern] = append(b.channels[pattern], ch)

	// Send any existing events that match (in a goroutine to avoid blocking)
	go func() {
		b.mu.RLock()
		events := make([]Event, len(b.allEvents))
		copy(events, b.allEvents)
		b.mu.RUnlock()

		for _, event := range events {
			if matchesPattern(event.GetType(), pattern) {
				select {
				case ch <- event:
				case <-ctx.Done():
					return
				}
			}
		}
	}()

	return ch
}

// matchesPattern checks if an event type matches a subscription pattern.
// Supports exact match and wildcard patterns like "wan.*".
func matchesPattern(eventType, pattern string) bool {
	if pattern == eventType {
		return true
	}

	// Handle wildcard patterns like "wan.*"
	if strings.HasSuffix(pattern, ".*") {
		prefix := pattern[:len(pattern)-2]
		if strings.HasPrefix(eventType, prefix) {
			return true
		}
	}

	return false
}

// GetAllEvents returns all published events (for testing).
func (b *InMemoryEventBus) GetAllEvents() []Event {
	b.mu.RLock()
	defer b.mu.RUnlock()

	events := make([]Event, len(b.allEvents))
	copy(events, b.allEvents)
	return events
}

// Clear clears all stored events and handlers (for testing).
func (b *InMemoryEventBus) Clear() {
	b.mu.Lock()
	defer b.mu.Unlock()

	b.allEvents = make([]Event, 0)
	b.handlers = make(map[string][]EventHandler)
	b.allHandler = make([]EventHandler, 0)

	// Close and clear all channels
	for _, channels := range b.channels {
		for _, ch := range channels {
			close(ch)
		}
	}
	b.channels = make(map[string][]chan interface{})
}
