package events

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/ThreeDotsLabs/watermill"
	"github.com/ThreeDotsLabs/watermill/message"
	"github.com/ThreeDotsLabs/watermill/pubsub/gochannel"
)

// EventHandler processes events.
type EventHandler func(ctx context.Context, event Event) error

// EventBus defines the interface for publishing and subscribing to events.
type EventBus interface {
	// Publish sends an event to all subscribers.
	Publish(ctx context.Context, event Event) error

	// Subscribe registers a handler for a specific event type.
	Subscribe(eventType string, handler EventHandler) error

	// SubscribeAll registers a handler for all events.
	SubscribeAll(handler EventHandler) error

	// Close gracefully shuts down the event bus.
	Close() error
}

// EventBusOptions configures the event bus.
type EventBusOptions struct {
	// BufferSize is the size of the internal message buffer.
	BufferSize int

	// Logger is the Watermill logger adapter.
	Logger watermill.LoggerAdapter

	// EnableReplay enables event replay on startup (requires persistence).
	EnableReplay bool

	// PersistenceEnabled enables event persistence to database.
	PersistenceEnabled bool
}

// DefaultEventBusOptions returns sensible defaults for event bus configuration.
func DefaultEventBusOptions() EventBusOptions {
	return EventBusOptions{
		BufferSize:         1000,
		Logger:             watermill.NewStdLogger(false, false),
		EnableReplay:       false,
		PersistenceEnabled: false,
	}
}

// eventBus is the Watermill-based implementation of EventBus.
type eventBus struct {
	pubsub     *gochannel.GoChannel
	router     *message.Router
	handlers   map[string][]EventHandler
	allHandler []EventHandler
	mu         sync.RWMutex
	logger     watermill.LoggerAdapter
	closed     bool
	closeMu    sync.RWMutex

	// Priority queues for batching
	priorityQueues *priorityQueueManager
}

// NewEventBus creates a new EventBus with the given options.
func NewEventBus(opts EventBusOptions) (EventBus, error) {
	if opts.BufferSize == 0 {
		opts.BufferSize = 1000
	}
	if opts.Logger == nil {
		opts.Logger = watermill.NewStdLogger(false, false)
	}

	pubsub := gochannel.NewGoChannel(gochannel.Config{
		OutputChannelBuffer:            int64(opts.BufferSize),
		Persistent:                     false,
		BlockPublishUntilSubscriberAck: false,
	}, opts.Logger)

	bus := &eventBus{
		pubsub:         pubsub,
		handlers:       make(map[string][]EventHandler),
		logger:         opts.Logger,
		priorityQueues: newPriorityQueueManager(),
	}

	// Start the priority queue processor
	go bus.processPriorityQueues()

	return bus, nil
}

// Publish sends an event to all subscribers.
func (eb *eventBus) Publish(ctx context.Context, event Event) error {
	eb.closeMu.RLock()
	if eb.closed {
		eb.closeMu.RUnlock()
		return fmt.Errorf("event bus is closed")
	}
	eb.closeMu.RUnlock()

	if event == nil {
		return fmt.Errorf("event cannot be nil")
	}

	priority := event.GetPriority()

	// Immediate priority events are published directly
	if priority == PriorityImmediate {
		return eb.publishDirect(ctx, event)
	}

	// Other priorities go through batching
	eb.priorityQueues.enqueue(event)
	return nil
}

// publishDirect publishes an event directly to subscribers without batching.
func (eb *eventBus) publishDirect(ctx context.Context, event Event) error {
	payload, err := event.Payload()
	if err != nil {
		return fmt.Errorf("failed to serialize event payload: %w", err)
	}

	msg := message.NewMessage(event.GetID().String(), payload)
	msg.Metadata.Set("type", event.GetType())
	msg.Metadata.Set("priority", event.GetPriority().String())
	msg.Metadata.Set("timestamp", event.GetTimestamp().Format(time.RFC3339Nano))
	msg.Metadata.Set("source", event.GetSource())

	eventType := event.GetType()

	// Publish to the specific event type topic
	if err := eb.pubsub.Publish(eventType, msg); err != nil {
		return fmt.Errorf("failed to publish to topic %s: %w", eventType, err)
	}

	// Also publish to the "all" topic for subscribers that want all events
	if err := eb.pubsub.Publish("all", msg); err != nil {
		// Log but don't fail - specific topic already got the message
		eb.logger.Error("failed to publish to 'all' topic", err, nil)
	}

	// Notify local handlers directly (for faster delivery)
	eb.notifyLocalHandlers(ctx, event)

	return nil
}

// notifyLocalHandlers directly calls registered handlers.
func (eb *eventBus) notifyLocalHandlers(ctx context.Context, event Event) {
	eb.mu.RLock()
	handlers := eb.handlers[event.GetType()]
	allHandlers := eb.allHandler
	eb.mu.RUnlock()

	// Call type-specific handlers
	for _, handler := range handlers {
		go func(h EventHandler) {
			if err := h(ctx, event); err != nil {
				eb.logger.Error("handler error", err, watermill.LogFields{
					"event_type": event.GetType(),
					"event_id":   event.GetID().String(),
				})
			}
		}(handler)
	}

	// Call all-event handlers
	for _, handler := range allHandlers {
		go func(h EventHandler) {
			if err := h(ctx, event); err != nil {
				eb.logger.Error("all-handler error", err, watermill.LogFields{
					"event_type": event.GetType(),
					"event_id":   event.GetID().String(),
				})
			}
		}(handler)
	}
}

// Subscribe registers a handler for a specific event type.
func (eb *eventBus) Subscribe(eventType string, handler EventHandler) error {
	if eventType == "" {
		return fmt.Errorf("event type cannot be empty")
	}
	if handler == nil {
		return fmt.Errorf("handler cannot be nil")
	}

	eb.mu.Lock()
	defer eb.mu.Unlock()

	eb.handlers[eventType] = append(eb.handlers[eventType], handler)
	return nil
}

// SubscribeAll registers a handler for all events.
func (eb *eventBus) SubscribeAll(handler EventHandler) error {
	if handler == nil {
		return fmt.Errorf("handler cannot be nil")
	}

	eb.mu.Lock()
	defer eb.mu.Unlock()

	eb.allHandler = append(eb.allHandler, handler)
	return nil
}

// Close gracefully shuts down the event bus.
func (eb *eventBus) Close() error {
	eb.closeMu.Lock()
	if eb.closed {
		eb.closeMu.Unlock()
		return nil
	}
	eb.closed = true
	eb.closeMu.Unlock()

	// Stop priority queue processing
	eb.priorityQueues.stop()

	// Flush any remaining events
	eb.flushPendingEvents()

	// Close the pubsub
	if err := eb.pubsub.Close(); err != nil {
		return fmt.Errorf("failed to close pubsub: %w", err)
	}

	return nil
}

// flushPendingEvents publishes any remaining events in the priority queues.
func (eb *eventBus) flushPendingEvents() {
	ctx := context.Background()
	for _, event := range eb.priorityQueues.drainAll() {
		if err := eb.publishDirect(ctx, event); err != nil {
			eb.logger.Error("failed to flush pending event", err, watermill.LogFields{
				"event_id":   event.GetID().String(),
				"event_type": event.GetType(),
			})
		}
	}
}

// processPriorityQueues processes batched events based on priority.
func (eb *eventBus) processPriorityQueues() {
	// Ticker for each priority level
	criticalTicker := time.NewTicker(100 * time.Millisecond)
	normalTicker := time.NewTicker(1 * time.Second)
	lowTicker := time.NewTicker(5 * time.Second)
	backgroundTicker := time.NewTicker(30 * time.Second)

	defer criticalTicker.Stop()
	defer normalTicker.Stop()
	defer lowTicker.Stop()
	defer backgroundTicker.Stop()

	for {
		select {
		case <-criticalTicker.C:
			eb.flushPriorityQueue(PriorityCritical)
		case <-normalTicker.C:
			eb.flushPriorityQueue(PriorityNormal)
		case <-lowTicker.C:
			eb.flushPriorityQueue(PriorityLow)
		case <-backgroundTicker.C:
			eb.flushPriorityQueue(PriorityBackground)
		case <-eb.priorityQueues.stopCh:
			return
		}
	}
}

// flushPriorityQueue publishes all events in a priority queue.
func (eb *eventBus) flushPriorityQueue(priority Priority) {
	eb.closeMu.RLock()
	if eb.closed {
		eb.closeMu.RUnlock()
		return
	}
	eb.closeMu.RUnlock()

	events := eb.priorityQueues.drain(priority)
	ctx := context.Background()

	for _, event := range events {
		if err := eb.publishDirect(ctx, event); err != nil {
			eb.logger.Error("failed to publish batched event", err, watermill.LogFields{
				"event_id":   event.GetID().String(),
				"event_type": event.GetType(),
				"priority":   priority.String(),
			})
		}
	}
}

// priorityQueueManager manages priority-based event queues.
type priorityQueueManager struct {
	queues map[Priority][]Event
	mu     sync.Mutex
	stopCh chan struct{}
}

func newPriorityQueueManager() *priorityQueueManager {
	return &priorityQueueManager{
		queues: map[Priority][]Event{
			PriorityCritical:   make([]Event, 0),
			PriorityNormal:     make([]Event, 0),
			PriorityLow:        make([]Event, 0),
			PriorityBackground: make([]Event, 0),
		},
		stopCh: make(chan struct{}),
	}
}

func (pq *priorityQueueManager) enqueue(event Event) {
	pq.mu.Lock()
	defer pq.mu.Unlock()

	priority := event.GetPriority()
	pq.queues[priority] = append(pq.queues[priority], event)
}

func (pq *priorityQueueManager) drain(priority Priority) []Event {
	pq.mu.Lock()
	defer pq.mu.Unlock()

	events := pq.queues[priority]
	pq.queues[priority] = make([]Event, 0)
	return events
}

func (pq *priorityQueueManager) drainAll() []Event {
	pq.mu.Lock()
	defer pq.mu.Unlock()

	var all []Event
	for priority := range pq.queues {
		all = append(all, pq.queues[priority]...)
		pq.queues[priority] = make([]Event, 0)
	}
	return all
}

func (pq *priorityQueueManager) stop() {
	close(pq.stopCh)
}

// ParseEvent parses a message back into a typed event.
func ParseEvent(msg *message.Message) (Event, error) {
	eventType := msg.Metadata.Get("type")
	if eventType == "" {
		return nil, fmt.Errorf("message has no event type in metadata")
	}

	var event Event
	switch eventType {
	case EventTypeRouterStatusChanged:
		var e RouterStatusChangedEvent
		if err := json.Unmarshal(msg.Payload, &e); err != nil {
			return nil, fmt.Errorf("failed to unmarshal RouterStatusChangedEvent: %w", err)
		}
		event = &e

	case EventTypeResourceUpdated, EventTypeResourceCreated, EventTypeResourceDeleted:
		var e ResourceUpdatedEvent
		if err := json.Unmarshal(msg.Payload, &e); err != nil {
			return nil, fmt.Errorf("failed to unmarshal ResourceUpdatedEvent: %w", err)
		}
		event = &e

	case EventTypeFeatureCrashed:
		var e FeatureCrashedEvent
		if err := json.Unmarshal(msg.Payload, &e); err != nil {
			return nil, fmt.Errorf("failed to unmarshal FeatureCrashedEvent: %w", err)
		}
		event = &e

	case EventTypeConfigApplyProgress:
		var e ConfigApplyProgressEvent
		if err := json.Unmarshal(msg.Payload, &e); err != nil {
			return nil, fmt.Errorf("failed to unmarshal ConfigApplyProgressEvent: %w", err)
		}
		event = &e

	case EventTypeAuth, EventTypeAuthSessionRevoked, EventTypeAuthPasswordChanged:
		var e AuthEvent
		if err := json.Unmarshal(msg.Payload, &e); err != nil {
			return nil, fmt.Errorf("failed to unmarshal AuthEvent: %w", err)
		}
		event = &e

	case EventTypeFeatureInstalled:
		var e FeatureInstalledEvent
		if err := json.Unmarshal(msg.Payload, &e); err != nil {
			return nil, fmt.Errorf("failed to unmarshal FeatureInstalledEvent: %w", err)
		}
		event = &e

	case EventTypeRouterConnected:
		var e RouterConnectedEvent
		if err := json.Unmarshal(msg.Payload, &e); err != nil {
			return nil, fmt.Errorf("failed to unmarshal RouterConnectedEvent: %w", err)
		}
		event = &e

	case EventTypeRouterDisconnected:
		var e RouterDisconnectedEvent
		if err := json.Unmarshal(msg.Payload, &e); err != nil {
			return nil, fmt.Errorf("failed to unmarshal RouterDisconnectedEvent: %w", err)
		}
		event = &e

	case EventTypeMetricUpdated:
		var e MetricUpdatedEvent
		if err := json.Unmarshal(msg.Payload, &e); err != nil {
			return nil, fmt.Errorf("failed to unmarshal MetricUpdatedEvent: %w", err)
		}
		event = &e

	case EventTypeLogAppended:
		var e LogAppendedEvent
		if err := json.Unmarshal(msg.Payload, &e); err != nil {
			return nil, fmt.Errorf("failed to unmarshal LogAppendedEvent: %w", err)
		}
		event = &e

	case EventTypeConfigApplied:
		var e ConfigAppliedEvent
		if err := json.Unmarshal(msg.Payload, &e); err != nil {
			return nil, fmt.Errorf("failed to unmarshal ConfigAppliedEvent: %w", err)
		}
		event = &e

	default:
		// For unknown types, return a generic event
		log.Printf("[EVENTS] Unknown event type: %s", eventType)
		var e BaseEvent
		if err := json.Unmarshal(msg.Payload, &e); err != nil {
			return nil, fmt.Errorf("failed to unmarshal BaseEvent: %w", err)
		}
		return &e, nil
	}

	return event, nil
}
