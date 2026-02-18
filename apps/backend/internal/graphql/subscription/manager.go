// Package subscription provides a subscription manager for GraphQL real-time updates.
// It integrates with the Watermill event bus and implements priority-based delivery
// as specified in NAS-2.6.
package subscription

import (
	"context"
	"log"
	"sync"
	"time"

	"backend/internal/events"

	"github.com/oklog/ulid/v2"
)

// ID uniquely identifies a subscription.
type ID = ulid.ULID

// Subscription represents an active GraphQL subscription
type Subscription struct {
	ID         ID
	UserID     string                  // Optional: for user-specific filtering
	EventTypes []string                // Event types this subscription listens to
	Filter     func(events.Event) bool // Optional: filter function for events
	Priority   events.Priority         // Minimum priority level to receive
	Channel    chan<- events.Event     // Channel to deliver events
	CreatedAt  time.Time
	LastEvent  time.Time
	Metadata   map[string]string // Additional metadata (routerId, etc.)
}

// Manager handles GraphQL subscription lifecycle and event delivery
type Manager struct {
	eventBus      events.EventBus
	subscriptions map[ID]*Subscription
	mu            sync.RWMutex
	closed        bool

	// Statistics
	totalDelivered    uint64
	totalDropped      uint64
	activeConnections int
}

// NewManager creates a new subscription manager
func NewManager(eventBus events.EventBus) *Manager {
	m := &Manager{
		eventBus:      eventBus,
		subscriptions: make(map[ID]*Subscription),
	}

	// Subscribe to all events for distribution
	if eventBus != nil {
		if err := eventBus.SubscribeAll(m.handleEvent); err != nil {
			log.Printf("[SUBSCRIPTION_MANAGER] Failed to subscribe to events: %v", err)
		}
	}

	return m
}

// Subscribe creates a new subscription and returns its ID
func (m *Manager) Subscribe(opts Options) (ID, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	if m.closed {
		return ulid.ULID{}, ErrManagerClosed
	}

	id := ulid.Make()

	sub := &Subscription{
		ID:         id,
		UserID:     opts.UserID,
		EventTypes: opts.EventTypes,
		Filter:     opts.Filter,
		Priority:   opts.Priority,
		Channel:    opts.Channel,
		CreatedAt:  time.Now(),
		LastEvent:  time.Now(),
		Metadata:   opts.Metadata,
	}

	m.subscriptions[id] = sub
	m.activeConnections++

	log.Printf("[SUBSCRIPTION_MANAGER] New subscription %s for event types: %v", id, opts.EventTypes)

	return id, nil
}

// Unsubscribe removes a subscription
func (m *Manager) Unsubscribe(id ID) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if _, exists := m.subscriptions[id]; !exists {
		return ErrSubscriptionNotFound
	}

	delete(m.subscriptions, id)
	m.activeConnections--

	log.Printf("[SUBSCRIPTION_MANAGER] Subscription %s removed", id)

	return nil
}

// handleEvent processes an event from the event bus and delivers to matching subscriptions
func (m *Manager) handleEvent(ctx context.Context, event events.Event) error {
	m.mu.RLock()
	defer m.mu.RUnlock()

	if m.closed {
		return nil
	}

	eventType := event.GetType()
	eventPriority := event.GetPriority()

	for _, sub := range m.subscriptions {
		// Check event type match
		if !m.matchesEventTypes(eventType, sub.EventTypes) {
			continue
		}

		// Check priority threshold
		if eventPriority > sub.Priority {
			continue
		}

		// Apply custom filter if provided
		if sub.Filter != nil && !sub.Filter(event) {
			continue
		}

		// Deliver event (non-blocking)
		select {
		case sub.Channel <- event:
			sub.LastEvent = time.Now()
			m.totalDelivered++
		default:
			// Channel full, event dropped
			m.totalDropped++
			log.Printf("[SUBSCRIPTION_MANAGER] Dropped %s event for subscription %s (channel full)",
				eventType, sub.ID)
		}
	}

	return nil
}

// matchesEventTypes checks if eventType matches any of the subscribed types
func (m *Manager) matchesEventTypes(eventType string, subscribed []string) bool {
	if len(subscribed) == 0 {
		return true // Empty list means all events
	}
	for _, t := range subscribed {
		if t == eventType || t == "*" {
			return true
		}
	}
	return false
}

// GetStats returns subscription manager statistics
func (m *Manager) GetStats() ManagerStats {
	m.mu.RLock()
	defer m.mu.RUnlock()

	return ManagerStats{
		ActiveSubscriptions: len(m.subscriptions),
		TotalDelivered:      m.totalDelivered,
		TotalDropped:        m.totalDropped,
	}
}

// Close shuts down the subscription manager
func (m *Manager) Close() error {
	m.mu.Lock()
	defer m.mu.Unlock()

	m.closed = true

	// Clear all subscriptions
	for id := range m.subscriptions {
		delete(m.subscriptions, id)
	}

	log.Printf("[SUBSCRIPTION_MANAGER] Closed with %d delivered, %d dropped events",
		m.totalDelivered, m.totalDropped)

	return nil
}

// Options configures a new subscription.
type Options struct {
	UserID     string
	EventTypes []string
	Filter     func(events.Event) bool
	Priority   events.Priority
	Channel    chan<- events.Event
	Metadata   map[string]string
}

// ManagerStats contains subscription manager statistics
type ManagerStats struct {
	ActiveSubscriptions int
	TotalDelivered      uint64
	TotalDropped        uint64
}

// Errors
var (
	ErrManagerClosed        = &subscriptionError{message: "subscription manager is closed"}
	ErrSubscriptionNotFound = &subscriptionError{message: "subscription not found"}
)

type subscriptionError struct {
	message string
}

func (e *subscriptionError) Error() string {
	return e.message
}
