package events

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/ThreeDotsLabs/watermill"
	"github.com/ThreeDotsLabs/watermill/message"
	"github.com/ThreeDotsLabs/watermill/pubsub/gochannel"
	"go.uber.org/zap"
)

// EventHandler processes events.
type EventHandler func(ctx context.Context, event Event) error

// EventBus defines the interface for publishing and subscribing to events.
type EventBus interface {
	Publish(ctx context.Context, event Event) error
	Subscribe(eventType string, handler EventHandler) error
	SubscribeAll(handler EventHandler) error
	Close() error
}

// EventBusOptions configures the event bus.
type EventBusOptions struct {
	BufferSize         int
	Logger             watermill.LoggerAdapter
	ZapLogger          *zap.Logger
	EnableReplay       bool
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
	pubsub         *gochannel.GoChannel
	handlers       map[string][]EventHandler
	allHandler     []EventHandler
	mu             sync.RWMutex
	logger         watermill.LoggerAdapter
	zapLogger      *zap.Logger
	closed         bool
	closeMu        sync.RWMutex
	priorityQueues *priorityQueueManager
	queueProcessed sync.WaitGroup // Track priority queue processor goroutine
}

// NewEventBus creates a new EventBus with the given options.
func NewEventBus(opts EventBusOptions) (EventBus, error) {
	if opts.BufferSize == 0 {
		opts.BufferSize = 1000
	}
	if opts.Logger == nil {
		opts.Logger = watermill.NewStdLogger(false, false)
	}
	if opts.ZapLogger == nil {
		opts.ZapLogger = zap.NewNop()
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
		zapLogger:      opts.ZapLogger,
		priorityQueues: newPriorityQueueManager(),
	}

	bus.queueProcessed.Add(1)
	go func() {
		defer bus.queueProcessed.Done()
		bus.processPriorityQueues()
	}()
	return bus, nil
}

// Publish sends an event to all subscribers.
// Blocks if the bus is closed to prevent race conditions.
func (eb *eventBus) Publish(ctx context.Context, event Event) error {
	eb.closeMu.RLock()
	defer eb.closeMu.RUnlock()

	if eb.closed {
		return fmt.Errorf("event bus is closed")
	}

	if event == nil {
		return fmt.Errorf("event cannot be nil")
	}

	if event.GetPriority() == PriorityImmediate {
		return eb.publishDirect(ctx, event)
	}
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
	if err := eb.pubsub.Publish(eventType, msg); err != nil {
		return fmt.Errorf("failed to publish to topic %s: %w", eventType, err)
	}
	if err := eb.pubsub.Publish("all", msg); err != nil {
		eb.zapLogger.Error("failed to publish to 'all' topic", zap.String("eventType", eventType), zap.Error(err))
	}

	eb.notifyLocalHandlers(ctx, event)
	return nil
}

func (eb *eventBus) notifyLocalHandlers(ctx context.Context, event Event) {
	eb.mu.RLock()
	handlers := eb.handlers[event.GetType()]
	allHandlers := eb.allHandler
	eb.mu.RUnlock()

	for _, handler := range handlers {
		go func(h EventHandler) {
			defer func() {
				if r := recover(); r != nil {
					eb.zapLogger.Error("handler panic",
						zap.String("eventType", event.GetType()),
						zap.String("eventID", event.GetID().String()),
						zap.Any("panic", r))
				}
			}()
			if err := h(ctx, event); err != nil {
				eb.zapLogger.Error("handler error",
					zap.String("eventType", event.GetType()),
					zap.String("eventID", event.GetID().String()),
					zap.Error(err))
			}
		}(handler)
	}
	for _, handler := range allHandlers {
		go func(h EventHandler) {
			defer func() {
				if r := recover(); r != nil {
					eb.zapLogger.Error("all-handler panic",
						zap.String("eventType", event.GetType()),
						zap.String("eventID", event.GetID().String()),
						zap.Any("panic", r))
				}
			}()
			if err := h(ctx, event); err != nil {
				eb.zapLogger.Error("all-handler error",
					zap.String("eventType", event.GetType()),
					zap.String("eventID", event.GetID().String()),
					zap.Error(err))
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

	// Stop the priority queue processor and wait for it to complete
	eb.priorityQueues.stop()
	eb.queueProcessed.Wait()

	// Flush any remaining events
	eb.flushPendingEvents()

	if err := eb.pubsub.Close(); err != nil {
		return fmt.Errorf("failed to close pubsub: %w", err)
	}
	return nil
}

func (eb *eventBus) flushPendingEvents() {
	ctx := context.Background()
	for _, event := range eb.priorityQueues.drainAll() {
		if err := eb.publishDirect(ctx, event); err != nil {
			eb.zapLogger.Error("failed to flush pending event",
				zap.String("eventID", event.GetID().String()),
				zap.String("eventType", event.GetType()),
				zap.Error(err))
		}
	}
}

// =============================================================================
// Subscribable Event Bus (Typed Subscription Helpers)
// =============================================================================

// TypedEventHandler is a handler for a specific event type.
type TypedEventHandler[T Event] func(ctx context.Context, event T) error

// SubscribableEventBus extends EventBus with typed subscription helpers.
// Each method provides type-safe subscription for a specific domain event.
type SubscribableEventBus interface { //nolint:interfacebloat // typed subscription helpers for each domain event
	EventBus
	OnRouterStatusChanged(handler func(ctx context.Context, event *RouterStatusChangedEvent) error) error
	OnResourceUpdated(handler func(ctx context.Context, event *ResourceUpdatedEvent) error) error
	OnFeatureCrashed(handler func(ctx context.Context, event *FeatureCrashedEvent) error) error
	OnConfigApplyProgress(handler func(ctx context.Context, event *ConfigApplyProgressEvent) error) error
	OnAuth(handler func(ctx context.Context, event *AuthEvent) error) error
	OnFeatureInstalled(handler func(ctx context.Context, event *FeatureInstalledEvent) error) error
	OnRouterConnected(handler func(ctx context.Context, event *RouterConnectedEvent) error) error
	OnRouterDisconnected(handler func(ctx context.Context, event *RouterDisconnectedEvent) error) error
	OnConfigApplied(handler func(ctx context.Context, event *ConfigAppliedEvent) error) error
	OnRouterStatusChangedFor(routerID string, handler func(ctx context.Context, event *RouterStatusChangedEvent) error) error
	OnResourceUpdatedFor(routerID string, handler func(ctx context.Context, event *ResourceUpdatedEvent) error) error
}

type subscribableEventBus struct {
	*eventBus
}

func NewSubscribableEventBus(opts EventBusOptions) (SubscribableEventBus, error) {
	bus, err := NewEventBus(opts)
	if err != nil {
		return nil, err
	}
	eb, ok := bus.(*eventBus)
	if !ok {
		return nil, err
	}
	return &subscribableEventBus{eventBus: eb}, nil
}

func (eb *subscribableEventBus) OnRouterStatusChanged(handler func(ctx context.Context, event *RouterStatusChangedEvent) error) error {
	return eb.Subscribe(EventTypeRouterStatusChanged, func(ctx context.Context, event Event) error {
		if typed, ok := event.(*RouterStatusChangedEvent); ok {
			return handler(ctx, typed)
		}
		return nil
	})
}

func (eb *subscribableEventBus) OnResourceUpdated(handler func(ctx context.Context, event *ResourceUpdatedEvent) error) error {
	wrapper := func(ctx context.Context, event Event) error {
		if typed, ok := event.(*ResourceUpdatedEvent); ok {
			return handler(ctx, typed)
		}
		return nil
	}
	if err := eb.Subscribe(EventTypeResourceCreated, wrapper); err != nil {
		return err
	}
	if err := eb.Subscribe(EventTypeResourceUpdated, wrapper); err != nil {
		return err
	}
	return eb.Subscribe(EventTypeResourceDeleted, wrapper)
}

func (eb *subscribableEventBus) OnFeatureCrashed(handler func(ctx context.Context, event *FeatureCrashedEvent) error) error {
	return eb.Subscribe(EventTypeFeatureCrashed, func(ctx context.Context, event Event) error {
		if typed, ok := event.(*FeatureCrashedEvent); ok {
			return handler(ctx, typed)
		}
		return nil
	})
}

func (eb *subscribableEventBus) OnConfigApplyProgress(handler func(ctx context.Context, event *ConfigApplyProgressEvent) error) error {
	return eb.Subscribe(EventTypeConfigApplyProgress, func(ctx context.Context, event Event) error {
		if typed, ok := event.(*ConfigApplyProgressEvent); ok {
			return handler(ctx, typed)
		}
		return nil
	})
}

func (eb *subscribableEventBus) OnAuth(handler func(ctx context.Context, event *AuthEvent) error) error {
	wrapper := func(ctx context.Context, event Event) error {
		if typed, ok := event.(*AuthEvent); ok {
			return handler(ctx, typed)
		}
		return nil
	}
	if err := eb.Subscribe(EventTypeAuth, wrapper); err != nil {
		return err
	}
	if err := eb.Subscribe(EventTypeAuthSessionRevoked, wrapper); err != nil {
		return err
	}
	return eb.Subscribe(EventTypeAuthPasswordChanged, wrapper)
}

func (eb *subscribableEventBus) OnFeatureInstalled(handler func(ctx context.Context, event *FeatureInstalledEvent) error) error {
	return eb.Subscribe(EventTypeFeatureInstalled, func(ctx context.Context, event Event) error {
		if typed, ok := event.(*FeatureInstalledEvent); ok {
			return handler(ctx, typed)
		}
		return nil
	})
}

func (eb *subscribableEventBus) OnRouterConnected(handler func(ctx context.Context, event *RouterConnectedEvent) error) error {
	return eb.Subscribe(EventTypeRouterConnected, func(ctx context.Context, event Event) error {
		if typed, ok := event.(*RouterConnectedEvent); ok {
			return handler(ctx, typed)
		}
		return nil
	})
}

func (eb *subscribableEventBus) OnRouterDisconnected(handler func(ctx context.Context, event *RouterDisconnectedEvent) error) error {
	return eb.Subscribe(EventTypeRouterDisconnected, func(ctx context.Context, event Event) error {
		if typed, ok := event.(*RouterDisconnectedEvent); ok {
			return handler(ctx, typed)
		}
		return nil
	})
}

func (eb *subscribableEventBus) OnConfigApplied(handler func(ctx context.Context, event *ConfigAppliedEvent) error) error {
	return eb.Subscribe(EventTypeConfigApplied, func(ctx context.Context, event Event) error {
		if typed, ok := event.(*ConfigAppliedEvent); ok {
			return handler(ctx, typed)
		}
		return nil
	})
}

func (eb *subscribableEventBus) OnRouterStatusChangedFor(routerID string, handler func(ctx context.Context, event *RouterStatusChangedEvent) error) error {
	return eb.Subscribe(EventTypeRouterStatusChanged, func(ctx context.Context, event Event) error {
		if typed, ok := event.(*RouterStatusChangedEvent); ok {
			if typed.RouterID == routerID {
				return handler(ctx, typed)
			}
		}
		return nil
	})
}

func (eb *subscribableEventBus) OnResourceUpdatedFor(routerID string, handler func(ctx context.Context, event *ResourceUpdatedEvent) error) error {
	wrapper := func(ctx context.Context, event Event) error {
		if typed, ok := event.(*ResourceUpdatedEvent); ok {
			if typed.RouterID == routerID {
				return handler(ctx, typed)
			}
		}
		return nil
	}
	if err := eb.Subscribe(EventTypeResourceCreated, wrapper); err != nil {
		return err
	}
	if err := eb.Subscribe(EventTypeResourceUpdated, wrapper); err != nil {
		return err
	}
	return eb.Subscribe(EventTypeResourceDeleted, wrapper)
}

// ResourceFilter defines criteria for filtering resource events.
type ResourceFilter struct {
	RouterID     string
	ResourceType string
	ChangeType   ChangeType
}

// MatchesFilter checks if an event matches the filter criteria.
func (e *ResourceUpdatedEvent) MatchesFilter(filter ResourceFilter) bool {
	if filter.RouterID != "" && e.RouterID != filter.RouterID {
		return false
	}
	if filter.ResourceType != "" && e.ResourceType != filter.ResourceType {
		return false
	}
	if filter.ChangeType != "" && e.ChangeType != filter.ChangeType {
		return false
	}
	return true
}

// OnResourceUpdatedFiltered subscribes to resource updates matching a filter.
func (eb *subscribableEventBus) OnResourceUpdatedFiltered(filter ResourceFilter, handler func(ctx context.Context, event *ResourceUpdatedEvent) error) error {
	wrapper := func(ctx context.Context, event Event) error {
		if typed, ok := event.(*ResourceUpdatedEvent); ok {
			if typed.MatchesFilter(filter) {
				return handler(ctx, typed)
			}
		}
		return nil
	}
	if err := eb.Subscribe(EventTypeResourceCreated, wrapper); err != nil {
		return err
	}
	if err := eb.Subscribe(EventTypeResourceUpdated, wrapper); err != nil {
		return err
	}
	return eb.Subscribe(EventTypeResourceDeleted, wrapper)
}
