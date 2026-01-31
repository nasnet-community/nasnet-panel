package events

import (
	"context"
)

// TypedEventHandler is a handler for a specific event type.
type TypedEventHandler[T Event] func(ctx context.Context, event T) error

// SubscribableEventBus extends EventBus with typed subscription helpers.
type SubscribableEventBus interface {
	EventBus

	// Typed subscription helpers
	OnRouterStatusChanged(handler func(ctx context.Context, event *RouterStatusChangedEvent) error) error
	OnResourceUpdated(handler func(ctx context.Context, event *ResourceUpdatedEvent) error) error
	OnFeatureCrashed(handler func(ctx context.Context, event *FeatureCrashedEvent) error) error
	OnConfigApplyProgress(handler func(ctx context.Context, event *ConfigApplyProgressEvent) error) error
	OnAuth(handler func(ctx context.Context, event *AuthEvent) error) error
	OnFeatureInstalled(handler func(ctx context.Context, event *FeatureInstalledEvent) error) error
	OnRouterConnected(handler func(ctx context.Context, event *RouterConnectedEvent) error) error
	OnRouterDisconnected(handler func(ctx context.Context, event *RouterDisconnectedEvent) error) error
	OnConfigApplied(handler func(ctx context.Context, event *ConfigAppliedEvent) error) error

	// Filtered subscriptions
	OnRouterStatusChangedFor(routerID string, handler func(ctx context.Context, event *RouterStatusChangedEvent) error) error
	OnResourceUpdatedFor(routerID string, handler func(ctx context.Context, event *ResourceUpdatedEvent) error) error
}

// subscribableEventBus wraps eventBus with typed subscription helpers.
type subscribableEventBus struct {
	*eventBus
}

// NewSubscribableEventBus creates an EventBus with typed subscription helpers.
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

// OnRouterStatusChanged subscribes to router status change events.
func (eb *subscribableEventBus) OnRouterStatusChanged(handler func(ctx context.Context, event *RouterStatusChangedEvent) error) error {
	return eb.Subscribe(EventTypeRouterStatusChanged, func(ctx context.Context, event Event) error {
		if typed, ok := event.(*RouterStatusChangedEvent); ok {
			return handler(ctx, typed)
		}
		return nil
	})
}

// OnResourceUpdated subscribes to resource update events.
func (eb *subscribableEventBus) OnResourceUpdated(handler func(ctx context.Context, event *ResourceUpdatedEvent) error) error {
	wrapper := func(ctx context.Context, event Event) error {
		if typed, ok := event.(*ResourceUpdatedEvent); ok {
			return handler(ctx, typed)
		}
		return nil
	}

	// Subscribe to all resource event types
	if err := eb.Subscribe(EventTypeResourceCreated, wrapper); err != nil {
		return err
	}
	if err := eb.Subscribe(EventTypeResourceUpdated, wrapper); err != nil {
		return err
	}
	return eb.Subscribe(EventTypeResourceDeleted, wrapper)
}

// OnFeatureCrashed subscribes to feature crash events.
func (eb *subscribableEventBus) OnFeatureCrashed(handler func(ctx context.Context, event *FeatureCrashedEvent) error) error {
	return eb.Subscribe(EventTypeFeatureCrashed, func(ctx context.Context, event Event) error {
		if typed, ok := event.(*FeatureCrashedEvent); ok {
			return handler(ctx, typed)
		}
		return nil
	})
}

// OnConfigApplyProgress subscribes to configuration apply progress events.
func (eb *subscribableEventBus) OnConfigApplyProgress(handler func(ctx context.Context, event *ConfigApplyProgressEvent) error) error {
	return eb.Subscribe(EventTypeConfigApplyProgress, func(ctx context.Context, event Event) error {
		if typed, ok := event.(*ConfigApplyProgressEvent); ok {
			return handler(ctx, typed)
		}
		return nil
	})
}

// OnAuth subscribes to authentication events.
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

// OnFeatureInstalled subscribes to feature installation events.
func (eb *subscribableEventBus) OnFeatureInstalled(handler func(ctx context.Context, event *FeatureInstalledEvent) error) error {
	return eb.Subscribe(EventTypeFeatureInstalled, func(ctx context.Context, event Event) error {
		if typed, ok := event.(*FeatureInstalledEvent); ok {
			return handler(ctx, typed)
		}
		return nil
	})
}

// OnRouterConnected subscribes to router connection events.
func (eb *subscribableEventBus) OnRouterConnected(handler func(ctx context.Context, event *RouterConnectedEvent) error) error {
	return eb.Subscribe(EventTypeRouterConnected, func(ctx context.Context, event Event) error {
		if typed, ok := event.(*RouterConnectedEvent); ok {
			return handler(ctx, typed)
		}
		return nil
	})
}

// OnRouterDisconnected subscribes to router disconnection events.
func (eb *subscribableEventBus) OnRouterDisconnected(handler func(ctx context.Context, event *RouterDisconnectedEvent) error) error {
	return eb.Subscribe(EventTypeRouterDisconnected, func(ctx context.Context, event Event) error {
		if typed, ok := event.(*RouterDisconnectedEvent); ok {
			return handler(ctx, typed)
		}
		return nil
	})
}

// OnConfigApplied subscribes to configuration applied events.
func (eb *subscribableEventBus) OnConfigApplied(handler func(ctx context.Context, event *ConfigAppliedEvent) error) error {
	return eb.Subscribe(EventTypeConfigApplied, func(ctx context.Context, event Event) error {
		if typed, ok := event.(*ConfigAppliedEvent); ok {
			return handler(ctx, typed)
		}
		return nil
	})
}

// OnRouterStatusChangedFor subscribes to router status changes for a specific router.
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

// OnResourceUpdatedFor subscribes to resource updates for a specific router.
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
