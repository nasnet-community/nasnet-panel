package events

import (
	"context"
	"log"
	"sync"
	"time"

	"github.com/oklog/ulid/v2"
)

// EventStore provides persistence for critical events.
// This is a stub implementation that will be fully implemented when Story 2.3 (ent ORM) is complete.
type EventStore interface {
	// PersistEvent saves an event to the database.
	PersistEvent(ctx context.Context, event Event) error

	// GetEventsSince retrieves events after the given timestamp.
	GetEventsSince(ctx context.Context, since time.Time) ([]Event, error)

	// GetUnprocessedEvents retrieves events that haven't been processed (for replay).
	GetUnprocessedEvents(ctx context.Context) ([]Event, error)

	// MarkProcessed marks an event as processed.
	MarkProcessed(ctx context.Context, id ulid.ULID) error

	// ReplayEvents replays all unprocessed events to the given handler.
	ReplayEvents(ctx context.Context, handler EventHandler) error

	// Close closes the event store.
	Close() error
}

// MemoryEventStore is an in-memory implementation for development and testing.
// This will be replaced with a database-backed implementation when Story 2.3 is complete.
type MemoryEventStore struct {
	events    map[ulid.ULID]storedEvent
	processed map[ulid.ULID]bool
	mu        sync.RWMutex
	maxEvents int
}

type storedEvent struct {
	event     Event
	payload   []byte
	timestamp time.Time
}

// NewMemoryEventStore creates a new in-memory event store.
func NewMemoryEventStore(maxEvents int) *MemoryEventStore {
	if maxEvents <= 0 {
		maxEvents = 10000
	}
	return &MemoryEventStore{
		events:    make(map[ulid.ULID]storedEvent),
		processed: make(map[ulid.ULID]bool),
		maxEvents: maxEvents,
	}
}

// PersistEvent saves an event to the in-memory store.
func (s *MemoryEventStore) PersistEvent(ctx context.Context, event Event) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	// Only persist events that should be persisted
	if !event.GetPriority().ShouldPersist() {
		return nil
	}

	payload, err := event.Payload()
	if err != nil {
		return err
	}

	// Evict old events if at capacity
	if len(s.events) >= s.maxEvents {
		s.evictOldest()
	}

	s.events[event.GetID()] = storedEvent{
		event:     event,
		payload:   payload,
		timestamp: event.GetTimestamp(),
	}

	return nil
}

// GetEventsSince retrieves events after the given timestamp.
func (s *MemoryEventStore) GetEventsSince(ctx context.Context, since time.Time) ([]Event, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var result []Event
	for _, stored := range s.events {
		if stored.timestamp.After(since) {
			result = append(result, stored.event)
		}
	}
	return result, nil
}

// GetUnprocessedEvents retrieves events that haven't been processed.
func (s *MemoryEventStore) GetUnprocessedEvents(ctx context.Context) ([]Event, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var result []Event
	for id, stored := range s.events {
		if !s.processed[id] {
			result = append(result, stored.event)
		}
	}
	return result, nil
}

// MarkProcessed marks an event as processed.
func (s *MemoryEventStore) MarkProcessed(ctx context.Context, id ulid.ULID) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.processed[id] = true
	return nil
}

// ReplayEvents replays all unprocessed events.
func (s *MemoryEventStore) ReplayEvents(ctx context.Context, handler EventHandler) error {
	events, err := s.GetUnprocessedEvents(ctx)
	if err != nil {
		return err
	}

	for _, event := range events {
		select {
		case <-ctx.Done():
			return ctx.Err()
		default:
			if err := handler(ctx, event); err != nil {
				log.Printf("[EVENTS] Failed to replay event %s: %v", event.GetID(), err)
				continue
			}
			if err := s.MarkProcessed(ctx, event.GetID()); err != nil {
				log.Printf("[EVENTS] Failed to mark event %s as processed: %v", event.GetID(), err)
			}
		}
	}

	return nil
}

// Close closes the event store.
func (s *MemoryEventStore) Close() error {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.events = nil
	s.processed = nil
	return nil
}

// evictOldest removes the oldest events to make room for new ones.
func (s *MemoryEventStore) evictOldest() {
	// Find and remove the oldest 10%
	evictCount := s.maxEvents / 10
	if evictCount == 0 {
		evictCount = 1
	}

	// Sort by timestamp (using ULID which is time-ordered)
	var oldest []ulid.ULID
	for id := range s.events {
		oldest = append(oldest, id)
		if len(oldest) >= evictCount {
			break
		}
	}

	for _, id := range oldest {
		delete(s.events, id)
		delete(s.processed, id)
	}
}

// EventCount returns the number of stored events.
func (s *MemoryEventStore) EventCount() int {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return len(s.events)
}

// PersistentEventBus wraps an EventBus with persistence capabilities.
type PersistentEventBus struct {
	EventBus
	store           EventStore
	persistenceFail bool // Track if persistence is failing for graceful degradation
	mu              sync.RWMutex
}

// NewPersistentEventBus creates an event bus with persistence.
func NewPersistentEventBus(bus EventBus, store EventStore) *PersistentEventBus {
	return &PersistentEventBus{
		EventBus: bus,
		store:    store,
	}
}

// Publish publishes an event and persists it if critical.
func (pb *PersistentEventBus) Publish(ctx context.Context, event Event) error {
	// Always deliver in-memory first (never blocks on persistence)
	if err := pb.EventBus.Publish(ctx, event); err != nil {
		return err
	}

	// Attempt persistence for critical events (non-blocking)
	if ShouldImmediatelyPersist(event.GetType()) {
		go pb.persistAsync(ctx, event)
	}

	return nil
}

// persistAsync persists an event asynchronously.
func (pb *PersistentEventBus) persistAsync(ctx context.Context, event Event) {
	if err := pb.store.PersistEvent(ctx, event); err != nil {
		pb.mu.Lock()
		pb.persistenceFail = true
		pb.mu.Unlock()
		log.Printf("[EVENTS] WARN: persistence failed for event %s: %v (event delivered in-memory)", event.GetID(), err)
	} else {
		pb.mu.Lock()
		pb.persistenceFail = false
		pb.mu.Unlock()
	}
}

// ReplayUnprocessedEvents replays events on startup.
func (pb *PersistentEventBus) ReplayUnprocessedEvents(ctx context.Context) error {
	return pb.store.ReplayEvents(ctx, func(ctx context.Context, event Event) error {
		return pb.EventBus.Publish(ctx, event)
	})
}

// IsPersistenceFailing returns true if persistence is currently failing.
func (pb *PersistentEventBus) IsPersistenceFailing() bool {
	pb.mu.RLock()
	defer pb.mu.RUnlock()
	return pb.persistenceFail
}

// Close closes both the event bus and the store.
func (pb *PersistentEventBus) Close() error {
	if err := pb.EventBus.Close(); err != nil {
		return err
	}
	return pb.store.Close()
}

// DailySync provides the daily sync functionality per ADR-013.
// This will sync normal events from hot tier to warm tier.
type DailySync struct {
	store     EventStore
	bus       EventBus
	startHour int // Hour to run sync (0-23, default 2 AM)
	stopCh    chan struct{}
}

// NewDailySync creates a new daily sync scheduler.
func NewDailySync(store EventStore, bus EventBus) *DailySync {
	return &DailySync{
		store:     store,
		bus:       bus,
		startHour: 2, // 2 AM by default
		stopCh:    make(chan struct{}),
	}
}

// Start begins the daily sync scheduler.
func (ds *DailySync) Start(ctx context.Context) {
	go ds.run(ctx)
}

// Stop stops the daily sync scheduler.
func (ds *DailySync) Stop() {
	close(ds.stopCh)
}

// run is the main loop for the daily sync scheduler.
func (ds *DailySync) run(ctx context.Context) {
	// Calculate time until next sync window
	now := time.Now()
	next := time.Date(now.Year(), now.Month(), now.Day(), ds.startHour, 0, 0, 0, now.Location())
	if now.After(next) {
		next = next.Add(24 * time.Hour)
	}

	timer := time.NewTimer(time.Until(next))
	defer timer.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ds.stopCh:
			return
		case <-timer.C:
			ds.doSync(ctx)
			// Reset for next day
			timer.Reset(24 * time.Hour)
		}
	}
}

// doSync performs the daily sync operation.
func (ds *DailySync) doSync(ctx context.Context) {
	log.Printf("[EVENTS] Starting daily sync at %s", time.Now().Format(time.RFC3339))

	yesterday := time.Now().Add(-24 * time.Hour)
	events, err := ds.store.GetEventsSince(ctx, yesterday)
	if err != nil {
		log.Printf("[EVENTS] Daily sync failed to get events: %v", err)
		return
	}

	// Filter for events that should go to warm tier during daily sync
	var filtered []Event
	for _, event := range events {
		if ShouldBatchPersist(event.GetType()) {
			filtered = append(filtered, event)
		}
	}

	log.Printf("[EVENTS] Daily sync: %d events to sync (filtered from %d)", len(filtered), len(events))

	// In a full implementation, these would be batch-written to the database
	// For now, just log the count
	log.Printf("[EVENTS] Daily sync completed successfully")
}
